import sql from "../database/db.js";
import jwt from "jsonwebtoken";

// Helper function to verify JWT token
const verifyToken = (req) => {
  const authToken =
    req.cookies.jwt || req.body.token || req.headers.authorization?.split(" ")[1];
  if (!authToken) throw new Error("No token provided");

  try {
    const decoded = jwt.verify(authToken, process.env.JWT_SECRET_KEY);
    return decoded.userId;
  } catch {
    throw new Error("Invalid token");
  }
};

// Helper function to check if user has access to meeting
const checkMeetingAccess = async (userId, roomId) => {
  try {
    // For now, we'll allow access to any meeting room
    // In a production environment, you might want to check if the user
    // is part of the organization that created the meeting
    return true;
  } catch (error) {
    return false;
  }
};

// Get messages for a meeting room
export const getMeetingMessages = async (req, res) => {
  try {
    const userId = verifyToken(req);
    const { roomId } = req.params;
    const { limit = 50, offset = 0 } = req.query;

    if (!roomId) {
      return res.status(400).json({ message: "Room ID is required" });
    }

    // Check if user has access to this meeting
    const hasAccess = await checkMeetingAccess(userId, roomId);
    if (!hasAccess) {
      return res.status(403).json({ message: "Access denied to this meeting" });
    }

    // Get messages with user info and reply data
    const messages = await sql`
      SELECT 
        m.*,
        u.name as user_name,
        u.user_photo,
        rm.content as reply_to_content,
        ru.name as reply_to_user_name,
        COALESCE(
          json_agg(
            json_build_object(
              'emoji', mr.emoji,
              'user_id', mr.user_id,
              'user_name', mru.name,
              'created_at', mr.created_at
            )
          ) FILTER (WHERE mr.reaction_id IS NOT NULL),
          '[]'::json
        ) as reactions
      FROM meeting_messages m
      JOIN users u ON m.user_id = u.user_id
      LEFT JOIN meeting_messages rm ON m.reply_to = rm.message_id
      LEFT JOIN users ru ON rm.user_id = ru.user_id
      LEFT JOIN meeting_message_reactions mr ON m.message_id = mr.message_id
      LEFT JOIN users mru ON mr.user_id = mru.user_id
      WHERE m.room_id = ${roomId}
      GROUP BY m.message_id, u.name, u.user_photo, rm.content, ru.name
      ORDER BY m.created_at ASC
      LIMIT ${limit} OFFSET ${offset}
    `;

    res.json({ messages });
  } catch (error) {
    if (["No token provided", "Invalid token", "Token expired"].includes(error.message)) {
      return res.status(401).json({ message: error.message });
    }
    res.status(500).json({ message: "Failed to fetch meeting messages" });
  }
};

// Send a new message to meeting
export const sendMeetingMessage = async (req, res) => {
  try {
    const userId = verifyToken(req);
    const { content, room_id, reply_to } = req.body;

    if (!room_id) {
      return res.status(400).json({ message: "Room ID is required" });
    }

    if (!content?.trim()) {
      return res.status(400).json({ message: "Message content is required" });
    }

    // Check if user has access to this meeting
    const hasAccess = await checkMeetingAccess(userId, room_id);
    if (!hasAccess) {
      return res.status(403).json({ message: "Access denied to this meeting" });
    }

    // Insert message
    const [message] = await sql`
      INSERT INTO meeting_messages (room_id, user_id, content, reply_to)
      VALUES (${room_id}, ${userId}, ${content.trim()}, ${reply_to})
      RETURNING *
    `;

    // Get user info for the message
    const [user] = await sql`
      SELECT name, user_photo FROM users WHERE user_id = ${userId}
    `;

    // Ensure user data exists with fallbacks
    const safeUser = {
      name: user?.name || 'Unknown User',
      user_photo: user?.user_photo || null
    };

    // Get reply info if this is a reply
    let replyInfo = null;
    if (reply_to) {
      const [replyMessage] = await sql`
        SELECT m.content as reply_to_content, u.name as reply_to_user_name
        FROM meeting_messages m
        JOIN users u ON m.user_id = u.user_id
        WHERE m.message_id = ${reply_to}
      `;
      replyInfo = replyMessage;
    }

    const messageWithUser = {
      ...message,
      user_name: safeUser.name,
      user_photo: safeUser.user_photo,
      ...replyInfo,
      reactions: []
    };

    // Emit to meeting room
    const io = req.app.get("io");
    if (io) {
      io.to(`meeting_${room_id}`).emit("new_meeting_message", messageWithUser);
    }

    res.status(201).json({ message: messageWithUser });
  } catch (error) {
    if (["No token provided", "Invalid token", "Token expired"].includes(error.message)) {
      return res.status(401).json({ message: error.message });
    }
    res.status(500).json({ message: "Failed to send meeting message" });
  }
};

// Update a meeting message
export const updateMeetingMessage = async (req, res) => {
  try {
    const userId = verifyToken(req);
    const { messageId } = req.params;
    const { content } = req.body;

    if (!content?.trim()) {
      return res.status(400).json({ message: "Message content is required" });
    }

    // Verify user owns the message
    const [existingMessage] = await sql`
      SELECT * FROM meeting_messages 
      WHERE message_id = ${messageId} AND user_id = ${userId}
    `;

    if (!existingMessage) {
      return res.status(404).json({ message: "Message not found or access denied" });
    }

    // Update message
    const [updatedMessage] = await sql`
      UPDATE meeting_messages 
      SET content = ${content.trim()}, updated_at = NOW()
      WHERE message_id = ${messageId}
      RETURNING *
    `;

    // Get user info
    const [user] = await sql`
      SELECT name, user_photo FROM users WHERE user_id = ${userId}
    `;

    // Ensure user data exists with fallbacks
    const safeUser = {
      name: user?.name || 'Unknown User',
      user_photo: user?.user_photo || null
    };

    const messageWithUser = {
      ...updatedMessage,
      user_name: safeUser.name,
      user_photo: safeUser.user_photo,
      reactions: []
    };

    // Emit update to meeting room
    const io = req.app.get("io");
    if (io) {
      io.to(`meeting_${existingMessage.room_id}`).emit("meeting_message_updated", messageWithUser);
    }

    res.json({ message: messageWithUser });
  } catch (error) {
    if (["No token provided", "Invalid token", "Token expired"].includes(error.message)) {
      return res.status(401).json({ message: error.message });
    }
    res.status(500).json({ message: "Failed to update meeting message" });
  }
};

// Delete a meeting message
export const deleteMeetingMessage = async (req, res) => {
  try {
    const userId = verifyToken(req);
    const { messageId } = req.params;

    // Verify user owns the message
    const [existingMessage] = await sql`
      SELECT * FROM meeting_messages 
      WHERE message_id = ${messageId} AND user_id = ${userId}
    `;

    if (!existingMessage) {
      return res.status(404).json({ message: "Message not found or access denied" });
    }

    // Delete message reactions first
    await sql`DELETE FROM meeting_message_reactions WHERE message_id = ${messageId}`;

    // Delete message
    await sql`DELETE FROM meeting_messages WHERE message_id = ${messageId}`;

    // Emit deletion to meeting room
    const io = req.app.get("io");
    if (io) {
      io.to(`meeting_${existingMessage.room_id}`).emit("meeting_message_deleted", parseInt(messageId));
    }

    res.json({ message: "Meeting message deleted successfully" });
  } catch (error) {
    if (["No token provided", "Invalid token", "Token expired"].includes(error.message)) {
      return res.status(401).json({ message: error.message });
    }
    res.status(500).json({ message: "Failed to delete meeting message" });
  }
};

// Upload file to meeting
export const uploadMeetingFile = async (req, res) => {
  try {
    const userId = verifyToken(req);
    const { room_id } = req.body;
    const file = req.file;

    if (!file) {
      return res.status(400).json({ message: "No file provided" });
    }

    if (!room_id) {
      return res.status(400).json({ message: "Room ID is required" });
    }

    // Check if user has access to this meeting
    const hasAccess = await checkMeetingAccess(userId, room_id);
    if (!hasAccess) {
      return res.status(403).json({ message: "Access denied to this meeting" });
    }

    // Validate file type and size
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      return res.status(400).json({ 
        message: `File too large. Maximum size is ${maxSize / 1024 / 1024}MB` 
      });
    }

    // Check for dangerous file types
    const dangerousExtensions = [
      'exe', 'bat', 'cmd', 'scr', 'pif', 'com', 'vbs', 'jar', 'app', 'deb', 'pkg', 'dmg',
      'msi', 'run', 'bin', 'sh', 'ps1', 'psm1', 'psd1', 'ps1xml', 'psc1', 'psc2',
      'msh', 'msh1', 'msh2', 'mshxml', 'msh1xml', 'msh2xml'
    ];
    const extension = file.originalname.split('.').pop()?.toLowerCase();
    if (dangerousExtensions.includes(extension)) {
      return res.status(400).json({ 
        message: "File type not allowed for security reasons" 
      });
    }

    let fileUrl;

    // Use local storage for file uploads
    try {
      const fs = await import('fs');
      const path = await import('path');
      
      const uploadsDir = path.join(process.cwd(), 'uploads', 'meeting-files');
      
      // Create uploads directory on-demand if it doesn't exist
      if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir, { recursive: true });
      }
      
      // Generate unique filename for storage
      const timestamp = Date.now();
      const sanitizedOriginalName = file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_');
      const uniqueFileName = `${timestamp}-${sanitizedOriginalName}`;
      const filePath = path.join(uploadsDir, uniqueFileName);
      
      // Write file to disk
      fs.writeFileSync(filePath, file.buffer);
      
      // Generate URL for local file
      const serverBaseUrl = `${req.protocol}://${req.get('host')}`;
      fileUrl = `${serverBaseUrl}/api/files/meeting/${uniqueFileName}`;
      
    } catch (localError) {
      throw new Error("File upload failed: " + localError.message);
    }

    // Ensure all file properties are defined
    const originalFileName = file.originalname || 'Unknown file';
    const safeFileType = file.mimetype || 'application/octet-stream';
    const safeFileSize = file.size || 0;

    // Insert message with file info
    const [message] = await sql`
      INSERT INTO meeting_messages (
        room_id, user_id, content, file_url, file_name, file_type, file_size
      )
      VALUES (
        ${room_id}, ${userId}, ${originalFileName}, 
        ${fileUrl}, ${originalFileName}, 
        ${safeFileType}, ${safeFileSize}
      )
      RETURNING *
    `;

    // Get user info
    const [user] = await sql`
      SELECT name, user_photo FROM users WHERE user_id = ${userId}
    `;

    // Ensure user data exists with fallbacks
    const safeUser = {
      name: user?.name || 'Unknown User',
      user_photo: user?.user_photo || null
    };

    const messageWithUser = {
      ...message,
      user_name: safeUser.name,
      user_photo: safeUser.user_photo,
      reactions: []
    };

    // Emit to meeting room
    const io = req.app.get("io");
    if (io) {
      io.to(`meeting_${room_id}`).emit("new_meeting_message", messageWithUser);
    }

    res.status(201).json({ 
      message: messageWithUser,
      uploadMethod: 'local'
    });
  } catch (error) {
    if (["No token provided", "Invalid token", "Token expired"].includes(error.message)) {
      return res.status(401).json({ message: error.message });
    }
    
    let errorMessage = "Failed to upload file";
    if (error.message.includes("File too large")) {
      errorMessage = "File size exceeds the maximum limit";
    } else if (error.message.includes("Invalid file type")) {
      errorMessage = "File type is not supported";
    }
    
    res.status(500).json({ message: errorMessage });
  }
};

// Add reaction to meeting message
export const addMeetingReaction = async (req, res) => {
  try {
    const userId = verifyToken(req);
    const { messageId } = req.params;
    const { emoji } = req.body;

    if (!emoji?.trim()) {
      return res.status(400).json({ message: "Emoji is required" });
    }

    // Check if message exists and get room_id
    const [message] = await sql`
      SELECT room_id FROM meeting_messages WHERE message_id = ${messageId}
    `;

    if (!message) {
      return res.status(404).json({ message: "Message not found" });
    }

    // Check if user has access to this meeting
    const hasAccess = await checkMeetingAccess(userId, message.room_id);
    if (!hasAccess) {
      return res.status(403).json({ message: "Access denied to this meeting" });
    }

    // Check if user already reacted with this emoji
    const [existingReaction] = await sql`
      SELECT * FROM meeting_message_reactions 
      WHERE message_id = ${messageId} AND user_id = ${userId} AND emoji = ${emoji.trim()}
    `;

    if (existingReaction) {
      // Remove existing reaction
      await sql`
        DELETE FROM meeting_message_reactions 
        WHERE message_id = ${messageId} AND user_id = ${userId} AND emoji = ${emoji.trim()}
      `;
    } else {
      // Add new reaction
      await sql`
        INSERT INTO meeting_message_reactions (message_id, user_id, emoji)
        VALUES (${messageId}, ${userId}, ${emoji.trim()})
      `;
    }

    // Get updated reactions for this message
    const reactions = await sql`
      SELECT 
        mr.reaction_id,
        mr.message_id,
        mr.user_id,
        mr.emoji,
        mr.created_at,
        u.name as user_name
      FROM meeting_message_reactions mr
      JOIN users u ON mr.user_id = u.user_id
      WHERE mr.message_id = ${messageId}
      ORDER BY mr.created_at ASC
    `;

    // Emit reaction update to meeting room
    const io = req.app.get("io");
    if (io) {
      io.to(`meeting_${message.room_id}`).emit("meeting_reaction_updated", {
        messageId: parseInt(messageId),
        reactions: reactions || []
      });
    }

    res.json({ reactions: reactions || [] });
  } catch (error) {
    if (["No token provided", "Invalid token", "Token expired"].includes(error.message)) {
      return res.status(401).json({ message: error.message });
    }
    res.status(500).json({ message: "Failed to add reaction" });
  }
};