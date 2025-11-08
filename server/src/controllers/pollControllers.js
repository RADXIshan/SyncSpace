import sql from '../database/db.js';

export const createPoll = async (req, res) => {
  try {
    const { channel_id, question, options, allow_multiple, anonymous } = req.body;
    const userId = req.user.userId;

    if (!channel_id || !question || !options || options.length < 2) {
      return res.status(400).json({ message: 'Invalid poll data' });
    }

    if (options.length > 10) {
      return res.status(400).json({ message: 'Maximum 10 options allowed' });
    }

    // Verify user has access to the channel
    const [channelAccess] = await sql`
      SELECT c.channel_id 
      FROM org_channels c
      JOIN org_members om ON om.org_id = c.org_id
      WHERE c.channel_id = ${channel_id} AND om.user_id = ${userId}
    `;

    if (!channelAccess) {
      return res.status(403).json({ message: 'Access denied to this channel' });
    }

    const [poll] = await sql`
      INSERT INTO polls (channel_id, created_by, question, options, allow_multiple, anonymous)
      VALUES (${channel_id}, ${userId}, ${question}, ${JSON.stringify(options)}, ${allow_multiple || false}, ${anonymous || false})
      RETURNING *, 
        (SELECT name FROM users WHERE user_id = ${userId}) as creator_name
    `;

    // Emit socket event for real-time update
    const io = req.app.get('io');
    if (io) {
      io.to(`channel_${channel_id}`).emit('new_poll', {
        ...poll,
        votes: []
      });
    }

    res.status(201).json({ 
      poll: {
        ...poll,
        votes: []
      }
    });
  } catch (error) {
    console.error('Error creating poll:', error);
    res.status(500).json({ message: 'Failed to create poll' });
  }
};

export const votePoll = async (req, res) => {
  try {
    const { pollId } = req.params;
    const { selected_options } = req.body;
    const userId = req.user.userId;

    if (!selected_options || !Array.isArray(selected_options) || selected_options.length === 0) {
      return res.status(400).json({ message: 'Invalid vote data' });
    }

    // Get poll details
    const [poll] = await sql`
      SELECT * FROM polls WHERE poll_id = ${pollId}
    `;

    if (!poll) {
      return res.status(404).json({ message: 'Poll not found' });
    }

    if (poll.is_closed) {
      return res.status(400).json({ message: 'Poll is closed' });
    }

    // Check if user already voted
    const [existingVote] = await sql`
      SELECT * FROM poll_votes WHERE poll_id = ${pollId} AND user_id = ${userId}
    `;

    if (existingVote) {
      // Update existing vote
      await sql`
        UPDATE poll_votes 
        SET selected_options = ${JSON.stringify(selected_options)}
        WHERE poll_id = ${pollId} AND user_id = ${userId}
      `;
    } else {
      // Record new vote
      await sql`
        INSERT INTO poll_votes (poll_id, user_id, selected_options)
        VALUES (${pollId}, ${userId}, ${JSON.stringify(selected_options)})
      `;
    }

    // Get updated poll with votes
    const updatedPoll = await sql`
      SELECT p.*, 
        u.name as creator_name,
        COALESCE(
          json_agg(
            json_build_object(
              'user_id', pv.user_id, 
              'selected_options', pv.selected_options
            )
          ) FILTER (WHERE pv.vote_id IS NOT NULL),
          '[]'
        ) as votes
      FROM polls p
      LEFT JOIN users u ON p.created_by = u.user_id
      LEFT JOIN poll_votes pv ON p.poll_id = pv.poll_id
      WHERE p.poll_id = ${pollId}
      GROUP BY p.poll_id, u.name
    `;

    const pollData = updatedPoll[0];

    // Emit socket event
    const io = req.app.get('io');
    if (io) {
      io.to(`channel_${poll.channel_id}`).emit('poll_updated', pollData);
    }

    res.json({ poll: pollData });
  } catch (error) {
    console.error('Error voting on poll:', error);
    res.status(500).json({ message: 'Failed to vote' });
  }
};

export const getChannelPolls = async (req, res) => {
  try {
    const { channelId } = req.params;
    const userId = req.user.userId;

    // Verify user has access to the channel
    const [channelAccess] = await sql`
      SELECT c.channel_id 
      FROM org_channels c
      JOIN org_members om ON om.org_id = c.org_id
      WHERE c.channel_id = ${channelId} AND om.user_id = ${userId}
    `;

    if (!channelAccess) {
      return res.status(403).json({ message: 'Access denied to this channel' });
    }

    const polls = await sql`
      SELECT p.*, 
        u.name as creator_name,
        COALESCE(
          json_agg(
            json_build_object(
              'user_id', pv.user_id, 
              'selected_options', pv.selected_options
            )
          ) FILTER (WHERE pv.vote_id IS NOT NULL),
          '[]'
        ) as votes
      FROM polls p
      LEFT JOIN users u ON p.created_by = u.user_id
      LEFT JOIN poll_votes pv ON p.poll_id = pv.poll_id
      WHERE p.channel_id = ${channelId}
      GROUP BY p.poll_id, u.name
      ORDER BY p.created_at DESC
    `;

    res.json({ polls });
  } catch (error) {
    console.error('Error fetching polls:', error);
    res.status(500).json({ message: 'Failed to fetch polls' });
  }
};

export const deletePoll = async (req, res) => {
  try {
    const { pollId } = req.params;
    const userId = req.user.userId;

    const [poll] = await sql`SELECT * FROM polls WHERE poll_id = ${pollId}`;
    
    if (!poll) {
      return res.status(404).json({ message: 'Poll not found' });
    }

    // Check if user is the creator or has admin rights
    const [userRole] = await sql`
      SELECT om.role, o.created_by as org_owner
      FROM org_channels c
      JOIN org_members om ON om.org_id = c.org_id AND om.user_id = ${userId}
      JOIN organisations o ON o.org_id = c.org_id
      WHERE c.channel_id = ${poll.channel_id}
    `;

    const isCreator = poll.created_by === userId;
    const isOrgOwner = userRole && userRole.org_owner === userId;
    const isAdmin = userRole && (userRole.role === 'admin' || userRole.role === 'owner');

    if (!isCreator && !isOrgOwner && !isAdmin) {
      return res.status(403).json({ message: 'Not authorized to delete this poll' });
    }

    await sql`DELETE FROM polls WHERE poll_id = ${pollId}`;

    const io = req.app.get('io');
    if (io) {
      io.to(`channel_${poll.channel_id}`).emit('poll_deleted', { pollId });
    }

    res.json({ message: 'Poll deleted successfully' });
  } catch (error) {
    console.error('Error deleting poll:', error);
    res.status(500).json({ message: 'Failed to delete poll' });
  }
};
