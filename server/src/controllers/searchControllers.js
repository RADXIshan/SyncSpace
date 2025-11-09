import sql from '../database/db.js';

// Fetch all items for a specific category
export const getCategoryData = async (req, res) => {
  try {
    const { category } = req.params;
    const userId = req.user.userId;
    const limit = 50; // Limit results for performance

    let items = [];

    switch (category) {
      case 'messages':
        items = await sql`
          SELECT m.*, c.channel_name, u.name as user_name
          FROM channel_messages m
          JOIN org_channels c ON m.channel_id = c.channel_id
          JOIN users u ON m.user_id = u.user_id
          JOIN org_members om ON om.org_id = c.org_id AND om.user_id = ${userId}
          ORDER BY m.created_at DESC
          LIMIT ${limit}
        `;
        break;

      case 'directMessages':
        items = await sql`
          SELECT dm.*, 
            sender.name as sender_name, 
            receiver.name as receiver_name,
            CASE 
              WHEN dm.sender_id = ${userId} THEN receiver.name
              ELSE sender.name
            END as other_user_name,
            CASE 
              WHEN dm.sender_id = ${userId} THEN dm.receiver_id
              ELSE dm.sender_id
            END as other_user_id
          FROM direct_messages dm
          JOIN users sender ON dm.sender_id = sender.user_id
          JOIN users receiver ON dm.receiver_id = receiver.user_id
          WHERE (dm.sender_id = ${userId} OR dm.receiver_id = ${userId})
          ORDER BY dm.created_at DESC
          LIMIT ${limit}
        `;
        break;

      case 'files':
        items = await sql`
          SELECT m.*, c.channel_name, u.name as user_name
          FROM channel_messages m
          JOIN org_channels c ON m.channel_id = c.channel_id
          JOIN users u ON m.user_id = u.user_id
          JOIN org_members om ON om.org_id = c.org_id AND om.user_id = ${userId}
          WHERE m.file_url IS NOT NULL
          ORDER BY m.created_at DESC
          LIMIT ${limit}
        `;
        break;

      case 'meetings':
        items = await sql`
          SELECT m.*, c.channel_name
          FROM org_meetings m
          LEFT JOIN org_channels c ON m.channel_id = c.channel_id
          JOIN org_members om ON om.org_id = m.org_id AND om.user_id = ${userId}
          ORDER BY m.start_time DESC
          LIMIT ${limit}
        `;
        break;

      case 'meetingReports':
        items = await sql`
          SELECT mr.*, c.channel_name, u.name as created_by_name
          FROM meeting_reports mr
          LEFT JOIN org_channels c ON mr.channel_id = c.channel_id
          LEFT JOIN users u ON mr.created_by = u.user_id
          JOIN org_members om ON om.org_id = mr.org_id AND om.user_id = ${userId}
          ORDER BY mr.created_at DESC
          LIMIT ${limit}
        `;
        break;

      case 'notes':
        items = await sql`
          SELECT n.note_id, n.title, n.body, n.pinned, n.created_at, n.updated_at,
            u.name as created_by_name, c.channel_name
          FROM org_notes n
          LEFT JOIN users u ON n.created_by = u.user_id
          LEFT JOIN org_channels c ON n.channel_id = c.channel_id
          JOIN org_members om ON om.org_id = n.org_id AND om.user_id = ${userId}
          ORDER BY n.pinned DESC, n.updated_at DESC
          LIMIT ${limit}
        `;
        break;

      case 'channels':
        items = await sql`
          SELECT c.channel_id, c.channel_name, c.channel_description
          FROM org_channels c
          JOIN org_members om ON om.org_id = c.org_id AND om.user_id = ${userId}
          ORDER BY c.channel_name ASC
          LIMIT ${limit}
        `;
        break;

      case 'notices':
        items = await sql`
          SELECT n.notice_id, n.title, n.body, n.created_at, u.name as created_by_name
          FROM org_notices n
          LEFT JOIN users u ON n.created_by = u.user_id
          JOIN org_members om ON om.org_id = n.org_id AND om.user_id = ${userId}
          ORDER BY n.created_at DESC
          LIMIT ${limit}
        `;
        break;

      case 'events':
        items = await sql`
          SELECT e.event_id, e.event_title, e.event_description, e.event_time, e.meeting_id
          FROM events e
          JOIN org_members om ON om.org_id = e.org_id AND om.user_id = ${userId}
          ORDER BY e.event_time DESC
          LIMIT ${limit}
        `;
        break;

      case 'users':
        items = await sql`
          SELECT DISTINCT u.user_id, u.name, u.email, u.user_photo
          FROM users u
          JOIN org_members om1 ON om1.user_id = u.user_id
          JOIN org_members om2 ON om2.org_id = om1.org_id AND om2.user_id = ${userId}
          WHERE u.user_id != ${userId}
          ORDER BY u.name ASC
          LIMIT ${limit}
        `;
        break;

      default:
        return res.status(400).json({ message: 'Invalid category' });
    }

    console.log(`Category ${category} fetched: ${items.length} items`);
    res.json({ items });
  } catch (error) {
    console.error('Category fetch error:', error);
    res.status(500).json({ message: 'Failed to fetch category data' });
  }
};

export const searchAll = async (req, res) => {
  try {
    const { q } = req.query;
    const userId = req.user.userId;

    if (!q || q.length < 1) {
      return res.json({ messages: [], files: [], meetings: [], users: [], notes: [], channels: [], notices: [], events: [], directMessages: [], meetingReports: [] });
    }

    // Create simple LIKE pattern for basic matching - supports single character searches
    const searchTerm = `%${q}%`;

    // Prepare words and a prefix tsquery for partial matching (word:* & word2:*)
    const words = (q || '').trim().toLowerCase().split(/\s+/).map(w => w.replace(/[^a-z0-9]/g, '')).filter(Boolean);
    const tsQuery = words.length ? words.map(w => `${w}:*`).join(' & ') : null;
    // Build queries that try prefix full-text match first then fallback to LIKE to improve recall

    // Debug logging to help trace empty results
    console.log('searchAll called', { q, userId, searchTerm, tsQuery });

    // Search messages (full-text on content with word-by-word matching)
    const messages = await sql`
      SELECT m.*, c.channel_name, u.name as user_name
      FROM channel_messages m
      JOIN org_channels c ON m.channel_id = c.channel_id
      JOIN users u ON m.user_id = u.user_id
      JOIN org_members om ON om.org_id = c.org_id AND om.user_id = ${userId}
      WHERE (
        ${tsQuery ? sql`to_tsvector('english', coalesce(m.content, '')) @@ to_tsquery('english', ${tsQuery}) OR` : sql``}
        LOWER(m.content) LIKE LOWER(${searchTerm})
      )
      ORDER BY m.created_at DESC
      LIMIT 40
    `;

    // Search files (file name + message content + file type)
    const files = await sql`
      SELECT m.*, c.channel_name, u.name as user_name
      FROM channel_messages m
      JOIN org_channels c ON m.channel_id = c.channel_id
      JOIN users u ON m.user_id = u.user_id
      JOIN org_members om ON om.org_id = c.org_id AND om.user_id = ${userId}
      WHERE m.file_url IS NOT NULL
      AND (
        ${tsQuery ? sql`to_tsvector('english', coalesce(m.file_name, '') || ' ' || coalesce(m.content, '') || ' ' || coalesce(m.file_type, '')) @@ to_tsquery('english', ${tsQuery}) OR` : sql``}
        LOWER(m.file_name) LIKE LOWER(${searchTerm})
        OR LOWER(m.content) LIKE LOWER(${searchTerm})
        OR LOWER(m.file_type) LIKE LOWER(${searchTerm})
      )
      ORDER BY m.created_at DESC
      LIMIT 40
    `;

    // Search meetings (title + description)
    const meetings = await sql`
      SELECT m.*, c.channel_name
      FROM org_meetings m
      LEFT JOIN org_channels c ON m.channel_id = c.channel_id
      JOIN org_members om ON om.org_id = m.org_id AND om.user_id = ${userId}
      WHERE (
        ${tsQuery ? sql`to_tsvector('english', coalesce(m.title, '') || ' ' || coalesce(m.description, '')) @@ to_tsquery('english', ${tsQuery}) OR` : sql``}
        LOWER(m.title) LIKE LOWER(${searchTerm})
        OR LOWER(m.description) LIKE LOWER(${searchTerm})
      )
      ORDER BY m.start_time DESC
      LIMIT 40
    `;

    // Search meeting reports (title + summary)
    const meetingReports = await sql`
      SELECT mr.*, c.channel_name, u.name as created_by_name
      FROM meeting_reports mr
      LEFT JOIN org_channels c ON mr.channel_id = c.channel_id
      LEFT JOIN users u ON mr.created_by = u.user_id
      JOIN org_members om ON om.org_id = mr.org_id AND om.user_id = ${userId}
      WHERE (
        ${tsQuery ? sql`to_tsvector('english', coalesce(mr.meeting_title, '') || ' ' || coalesce(mr.summary, '')) @@ to_tsquery('english', ${tsQuery}) OR` : sql``}
        LOWER(mr.meeting_title) LIKE LOWER(${searchTerm})
        OR LOWER(mr.summary) LIKE LOWER(${searchTerm})
      )
      ORDER BY mr.created_at DESC
      LIMIT 40
    `;

    // Search notes (title + body)
    const notes = await sql`
      SELECT n.note_id, n.title, n.body, n.pinned, n.created_at, n.updated_at,
        u.name as created_by_name, c.channel_name
      FROM org_notes n
      LEFT JOIN users u ON n.created_by = u.user_id
      LEFT JOIN org_channels c ON n.channel_id = c.channel_id
      JOIN org_members om ON om.org_id = n.org_id AND om.user_id = ${userId}
      WHERE (
        ${tsQuery ? sql`to_tsvector('english', coalesce(n.title, '') || ' ' || coalesce(n.body, '')) @@ to_tsquery('english', ${tsQuery}) OR` : sql``}
        LOWER(n.title) LIKE LOWER(${searchTerm})
        OR LOWER(n.body) LIKE LOWER(${searchTerm})
      )
      ORDER BY n.pinned DESC, n.updated_at DESC
      LIMIT 40
    `;

    // Search channels (name only)
    const channels = await sql`
      SELECT c.channel_id, c.channel_name, c.channel_description
      FROM org_channels c
      JOIN org_members om ON om.org_id = c.org_id AND om.user_id = ${userId}
      WHERE (
        ${tsQuery ? sql`to_tsvector('english', coalesce(c.channel_name, '') || ' ' || coalesce(c.channel_description, '')) @@ to_tsquery('english', ${tsQuery}) OR` : sql``}
        LOWER(c.channel_name) LIKE LOWER(${searchTerm})
        OR LOWER(c.channel_description) LIKE LOWER(${searchTerm})
      )
      ORDER BY c.channel_name ASC
      LIMIT 20
    `;

    // Search notices (with org filtering)
    const notices = await sql`
      SELECT n.notice_id, n.title, n.body, n.created_at, u.name as created_by_name
      FROM org_notices n
      LEFT JOIN users u ON n.created_by = u.user_id
      JOIN org_members om ON om.org_id = n.org_id AND om.user_id = ${userId}
      WHERE (
        ${tsQuery ? sql`to_tsvector('english', coalesce(n.title, '') || ' ' || coalesce(n.body, '')) @@ to_tsquery('english', ${tsQuery}) OR` : sql``}
        LOWER(n.title) LIKE LOWER(${searchTerm})
        OR LOWER(n.body) LIKE LOWER(${searchTerm})
      )
      ORDER BY n.created_at DESC
      LIMIT 40
    `;

    // Search events (with org filtering)
    const events = await sql`
      SELECT e.event_id, e.event_title, e.event_description, e.event_time, e.meeting_id
      FROM events e
      JOIN org_members om ON om.org_id = e.org_id AND om.user_id = ${userId}
      WHERE (
        ${tsQuery ? sql`to_tsvector('english', coalesce(e.event_title, '') || ' ' || coalesce(e.event_description, '')) @@ to_tsquery('english', ${tsQuery}) OR` : sql``}
        LOWER(e.event_title) LIKE LOWER(${searchTerm})
        OR LOWER(e.event_description) LIKE LOWER(${searchTerm})
      )
      ORDER BY e.event_time DESC
      LIMIT 40
    `;

    // Search direct messages
    const directMessages = await sql`
      SELECT dm.*, 
        sender.name as sender_name, 
        receiver.name as receiver_name,
        CASE 
          WHEN dm.sender_id = ${userId} THEN receiver.name
          ELSE sender.name
        END as other_user_name,
        CASE 
          WHEN dm.sender_id = ${userId} THEN dm.receiver_id
          ELSE dm.sender_id
        END as other_user_id
      FROM direct_messages dm
      JOIN users sender ON dm.sender_id = sender.user_id
      JOIN users receiver ON dm.receiver_id = receiver.user_id
      WHERE (dm.sender_id = ${userId} OR dm.receiver_id = ${userId})
      AND (
        ${tsQuery ? sql`to_tsvector('english', coalesce(dm.content, '')) @@ to_tsquery('english', ${tsQuery}) OR` : sql``}
        LOWER(dm.content) LIKE LOWER(${searchTerm})
      )
      ORDER BY dm.created_at DESC
      LIMIT 40
    `;

    // Search users in same organization (name + email)
    const users = await sql`
      SELECT DISTINCT u.user_id, u.name, u.email, u.user_photo
      FROM users u
      JOIN org_members om1 ON om1.user_id = u.user_id
      JOIN org_members om2 ON om2.org_id = om1.org_id AND om2.user_id = ${userId}
      WHERE (
        LOWER(u.name) LIKE LOWER(${searchTerm})
        OR LOWER(u.email) LIKE LOWER(${searchTerm})
      )
      AND u.user_id != ${userId}
      ORDER BY u.name ASC
      LIMIT 20
    `;

    // Log result counts to help debugging why searches return empty
    console.log('search results counts', {
      messages: messages?.length || 0,
      files: files?.length || 0,
      meetings: meetings?.length || 0,
      meetingReports: meetingReports?.length || 0,
      notes: notes?.length || 0,
      channels: channels?.length || 0,
      users: users?.length || 0,
      notices: notices?.length || 0,
      events: events?.length || 0,
      directMessages: directMessages?.length || 0
    });

    res.json({ messages, files, meetings, meetingReports, notes, channels, users, notices, events, directMessages });
  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({ message: 'Search failed' });
  }
};
