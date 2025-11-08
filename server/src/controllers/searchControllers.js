import sql from '../database/db.js';

export const searchAll = async (req, res) => {
  try {
    const { q } = req.query;
    const userId = req.user.userId;

    if (!q || q.length < 2) {
      return res.json({ messages: [], files: [], meetings: [], users: [] });
    }

    const searchTerm = `%${q}%`;

    // Search messages
    const messages = await sql`
      SELECT m.*, c.channel_name, u.name as user_name
      FROM channel_messages m
      JOIN org_channels c ON m.channel_id = c.channel_id
      JOIN users u ON m.user_id = u.user_id
      JOIN org_members om ON om.org_id = c.org_id AND om.user_id = ${userId}
      WHERE m.content ILIKE ${searchTerm}
      ORDER BY m.created_at DESC
      LIMIT 20
    `;

    // Search files
    const files = await sql`
      SELECT m.*, c.channel_name, u.name as user_name
      FROM channel_messages m
      JOIN org_channels c ON m.channel_id = c.channel_id
      JOIN users u ON m.user_id = u.user_id
      JOIN org_members om ON om.org_id = c.org_id AND om.user_id = ${userId}
      WHERE m.file_url IS NOT NULL 
      AND (m.file_name ILIKE ${searchTerm} OR m.content ILIKE ${searchTerm})
      ORDER BY m.created_at DESC
      LIMIT 20
    `;

    // Search meetings
    const meetings = await sql`
      SELECT m.*, c.channel_name
      FROM org_meetings m
      LEFT JOIN org_channels c ON m.channel_id = c.channel_id
      JOIN org_members om ON om.org_id = m.org_id AND om.user_id = ${userId}
      WHERE m.title ILIKE ${searchTerm}
      ORDER BY m.start_time DESC
      LIMIT 20
    `;

    // Search users in same organization
    const users = await sql`
      SELECT DISTINCT u.user_id, u.name, u.email, u.user_photo
      FROM users u
      JOIN org_members om1 ON om1.user_id = u.user_id
      JOIN org_members om2 ON om2.org_id = om1.org_id AND om2.user_id = ${userId}
      WHERE (u.name ILIKE ${searchTerm} OR u.email ILIKE ${searchTerm})
      AND u.user_id != ${userId}
      LIMIT 10
    `;

    res.json({ messages, files, meetings, users });
  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({ message: 'Search failed' });
  }
};
