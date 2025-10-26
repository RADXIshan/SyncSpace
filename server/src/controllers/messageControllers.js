import sql from "../database/db.js";
import { v2 as cloudinary } from "cloudinary";
import { createNotification } from "./notificationControllers.js";

// Get messages for a channel
export const getChannelMessages = async (req, res) => {
  try {
    const { channelId } = req.params;
    const userId = req.user.userId;
    const { limit = 50, offset = 0 } = req.query;

    // Verify user has access to the channel
    const hasAccess = await checkChannelAccess(userId, channelId);
    if (!hasAccess) {
      return res.status(403).json({ message: "Access denied to this channel" });
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
      FROM channel_messages m
      JOIN users u ON m.user_id = u.user_id
      LEFT JOIN channel_messages rm ON m.reply_to = rm.message_id
      LEFT JOIN users ru ON rm.user_id = ru.user_id
      LEFT JOIN message_reactions mr ON m.message_id = mr.message_id
      LEFT JOIN users mru ON mr.user_id = mru.user_id
      WHERE m.channel_id = ${channelId}
      GROUP BY m.message_id, u.name, u.user_photo, rm.content, ru.name
      ORDER BY m.created_at ASC
      LIMIT ${limit} OFFSET ${offset}
    `;

    res.json({ messages });
  } catch (error) {
    console.error("Error fetching messages:", error);
    res.status(500).json({ message: "Failed to fetch messages" });
  }
};

// Send a new message
export const sendMessage = async (req, res) => {
  try {
    const { content, channel_id, reply_to, mentions = [] } = req.body;
    const userId = req.user.userId;

    // Verify user has access to the channel
    const hasAccess = await checkChannelAccess(userId, channel_id);
    if (!hasAccess) {
      return res.status(403).json({ message: "Access denied to this channel" });
    }

    // Insert message
    const [message] = await sql`
      INSERT INTO channel_messages (channel_id, user_id, content, reply_to)
      VALUES (${channel_id}, ${userId}, ${content}, ${reply_to})
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
        FROM channel_messages m
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

    // Emit to channel room
    const io = req.app.get("io");
    if (io) {
      io.to(`channel_${channel_id}`).emit("new_message", messageWithUser);
    }

    // Send notifications for mentions
    if (mentions.length > 0) {
      // Get channel info for notifications
      const [channelInfo] = await sql`
        SELECT org_id, channel_name FROM org_channels WHERE channel_id = ${channel_id}
      `;
      
      for (const mentionedUserId of mentions) {
        if (mentionedUserId !== userId) {
          try {
            // Create database notification
            await createNotification(
              mentionedUserId,
              channelInfo.org_id,
              "mention",
              "You were mentioned",
              `${safeUser.name} mentioned you in #${channelInfo.channel_name}`,
              {
                relatedId: message.message_id,
                relatedType: "message",
                link: `/channels/${channel_id}`
              }
            );

            // Send real-time notification via socket to specific user
            if (io) {
              // Get the mentioned user's socket ID and send notification only to them
              const { getUserSocketId } = await import('../configs/socket.js');
              const mentionedUserSocketId = getUserSocketId(mentionedUserId);
              
              if (mentionedUserSocketId) {
                const mentionData = {
                  mentionedUserId,
                  mentionedBy: safeUser.name,
                  channelName: channelInfo.channel_name || 'Unknown Channel',
                  messageId: message.message_id,
                  channelId: channel_id,
                  content: content || '',
                  userName: safeUser.name // Add this for consistency with NotificationContext
                };
                
                console.log(`Sending mention notification to user ${mentionedUserId}:`, mentionData);
                io.to(mentionedUserSocketId).emit("user_mentioned", mentionData);
              } else {
                console.log(`No socket found for mentioned user ${mentionedUserId}`);
              }
            }
          } catch (error) {
            console.error(`Error sending mention notification to user ${mentionedUserId}:`, error);
          }
        }
      }
    }

    res.status(201).json({ message: messageWithUser });
  } catch (error) {
    console.error("Error sending message:", error);
    res.status(500).json({ message: "Failed to send message" });
  }
};

// Update a message
export const updateMessage = async (req, res) => {
  try {
    const { messageId } = req.params;
    const { content } = req.body;
    const userId = req.user.userId;

    // Verify user owns the message
    const [existingMessage] = await sql`
      SELECT * FROM channel_messages 
      WHERE message_id = ${messageId} AND user_id = ${userId}
    `;

    if (!existingMessage) {
      return res.status(404).json({ message: "Message not found or access denied" });
    }

    // Update message
    const [updatedMessage] = await sql`
      UPDATE channel_messages 
      SET content = ${content}, updated_at = NOW()
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

    // Emit update to channel room
    const io = req.app.get("io");
    if (io) {
      io.to(`channel_${existingMessage.channel_id}`).emit("message_updated", messageWithUser);
    }

    res.json({ message: messageWithUser });
  } catch (error) {
    console.error("Error updating message:", error);
    res.status(500).json({ message: "Failed to update message" });
  }
};

// Delete a message
export const deleteMessage = async (req, res) => {
  try {
    const { messageId } = req.params;
    const userId = req.user.userId;

    // Verify user owns the message
    const [existingMessage] = await sql`
      SELECT * FROM channel_messages 
      WHERE message_id = ${messageId} AND user_id = ${userId}
    `;

    if (!existingMessage) {
      return res.status(404).json({ message: "Message not found or access denied" });
    }

    // Delete message reactions first
    await sql`DELETE FROM message_reactions WHERE message_id = ${messageId}`;

    // Delete message
    await sql`DELETE FROM channel_messages WHERE message_id = ${messageId}`;

    // Emit deletion to channel room
    const io = req.app.get("io");
    if (io) {
      io.to(`channel_${existingMessage.channel_id}`).emit("message_deleted", parseInt(messageId));
    }

    res.json({ message: "Message deleted successfully" });
  } catch (error) {
    console.error("Error deleting message:", error);
    res.status(500).json({ message: "Failed to delete message" });
  }
};

// Upload file
export const uploadFile = async (req, res) => {
  try {
    const { channel_id } = req.body;
    const userId = req.user.userId;
    const file = req.file;

    if (!file) {
      return res.status(400).json({ message: "No file provided" });
    }

    if (!channel_id) {
      return res.status(400).json({ message: "Channel ID is required" });
    }

    // Verify user has access to the channel
    const hasAccess = await checkChannelAccess(userId, channel_id);
    if (!hasAccess) {
      return res.status(403).json({ message: "Access denied to this channel" });
    }

    // Validate file type and size
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      return res.status(400).json({ 
        message: `File too large. Maximum size is ${maxSize / 1024 / 1024}MB` 
      });
    }

    // Check for dangerous file types
    const dangerousExtensions = ['exe', 'bat', 'cmd', 'scr', 'pif', 'com', 'vbs', 'js'];
    const extension = file.originalname.split('.').pop()?.toLowerCase();
    if (dangerousExtensions.includes(extension)) {
      return res.status(400).json({ 
        message: "File type not allowed for security reasons" 
      });
    }

    // Determine resource type for Cloudinary
    let resourceType = "auto";
    if (file.mimetype.startsWith('video/')) {
      resourceType = "video";
    } else if (file.mimetype.startsWith('image/')) {
      resourceType = "image";
    } else if (file.mimetype.startsWith('audio/')) {
      resourceType = "video"; // Cloudinary uses 'video' for audio files
    } else {
      resourceType = "raw"; // For documents, PDFs, etc.
    }

    // Upload to Cloudinary with appropriate settings
    const uploadResult = await new Promise((resolve, reject) => {
      const uploadOptions = {
        resource_type: resourceType,
        folder: "chat-files",
        public_id: `${Date.now()}-${file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_')}`,
        use_filename: true,
        unique_filename: true,
        access_mode: "public",
        type: "upload"
      };

      // Add format preservation for certain file types
      if (resourceType === "raw") {
        uploadOptions.format = extension;
      }

      const uploadStream = cloudinary.uploader.upload_stream(
        uploadOptions,
        (error, result) => {
          if (error) {
            console.error("Cloudinary upload error:", error);
            reject(new Error(`Upload failed: ${error.message}`));
          } else {
            resolve(result);
          }
        }
      );
      uploadStream.end(file.buffer);
    });

    // Ensure all file properties are defined
    const safeFileName = file.originalname || 'Unknown file';
    const safeFileType = file.mimetype || 'application/octet-stream';
    const safeFileSize = file.size || 0;

    // Insert message with file info
    const [message] = await sql`
      INSERT INTO channel_messages (
        channel_id, user_id, content, file_url, file_name, file_type, file_size
      )
      VALUES (
        ${channel_id}, ${userId}, ${safeFileName}, 
        ${uploadResult.secure_url}, ${safeFileName}, 
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

    // Emit to channel room
    const io = req.app.get("io");
    if (io) {
      io.to(`channel_${channel_id}`).emit("new_message", messageWithUser);
    }

    res.status(201).json({ message: messageWithUser });
  } catch (error) {
    console.error("Error uploading file:", error);
    
    // Provide more specific error messages
    let errorMessage = "Failed to upload file";
    if (error.message.includes("Upload failed")) {
      errorMessage = error.message;
    } else if (error.message.includes("File too large")) {
      errorMessage = "File size exceeds the maximum limit";
    } else if (error.message.includes("Invalid file type")) {
      errorMessage = "File type is not supported";
    }
    
    res.status(500).json({ message: errorMessage });
  }
};

// Add reaction to message
export const addReaction = async (req, res) => {
  try {
    const { messageId } = req.params;
    const { emoji } = req.body;
    const userId = req.user.userId;

    // Check if message exists and get channel_id
    const [message] = await sql`
      SELECT channel_id FROM channel_messages WHERE message_id = ${messageId}
    `;

    if (!message) {
      return res.status(404).json({ message: "Message not found" });
    }

    // Verify user has access to the channel
    const hasAccess = await checkChannelAccess(userId, message.channel_id);
    if (!hasAccess) {
      return res.status(403).json({ message: "Access denied to this channel" });
    }

    // Check if user already reacted with this emoji
    const [existingReaction] = await sql`
      SELECT * FROM message_reactions 
      WHERE message_id = ${messageId} AND user_id = ${userId} AND emoji = ${emoji}
    `;

    if (existingReaction) {
      // Remove existing reaction
      await sql`
        DELETE FROM message_reactions 
        WHERE message_id = ${messageId} AND user_id = ${userId} AND emoji = ${emoji}
      `;
    } else {
      // Add new reaction
      await sql`
        INSERT INTO message_reactions (message_id, user_id, emoji)
        VALUES (${messageId}, ${userId}, ${emoji})
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
      FROM message_reactions mr
      JOIN users u ON mr.user_id = u.user_id
      WHERE mr.message_id = ${messageId}
      ORDER BY mr.created_at ASC
    `;

    // Emit reaction update to channel room
    const io = req.app.get("io");
    if (io) {
      io.to(`channel_${message.channel_id}`).emit("reaction_updated", {
        messageId: parseInt(messageId),
        reactions: reactions || []
      });
    }

    res.json({ reactions: reactions || [] });
  } catch (error) {
    console.error("Error adding reaction:", error);
    res.status(500).json({ message: "Failed to add reaction" });
  }
};



// Get channel members for mentions
export const getChannelMembers = async (req, res) => {
  try {
    const { channelId } = req.params;
    const userId = req.user.userId;

    // Verify user has access to the channel
    const hasAccess = await checkChannelAccess(userId, channelId);
    if (!hasAccess) {
      return res.status(403).json({ message: "Access denied to this channel" });
    }

    // Get channel info
    const [channel] = await sql`
      SELECT org_id, channel_name FROM org_channels WHERE channel_id = ${channelId}
    `;

    if (!channel) {
      return res.status(404).json({ message: "Channel not found" });
    }

    // Get all organization members
    const allMembers = await sql`
      SELECT DISTINCT u.user_id, u.name, u.user_photo, om.role
      FROM users u
      JOIN org_members om ON u.user_id = om.user_id
      WHERE om.org_id = ${channel.org_id}
      ORDER BY u.name
    `;

    // Filter members who have access to this channel
    const members = [];
    for (const member of allMembers) {
      const hasAccess = await checkChannelAccess(member.user_id, channelId);
      if (hasAccess) {
        members.push(member);
      }
    }

    res.json({ members });
  } catch (error) {
    console.error("Error fetching channel members:", error);
    res.status(500).json({ message: "Failed to fetch channel members" });
  }
};

// Helper function to check channel access
const checkChannelAccess = async (userId, channelId) => {
  try {
    // Get channel and organization info
    const [channel] = await sql`
      SELECT org_id, channel_name FROM org_channels WHERE channel_id = ${channelId}
    `;

    if (!channel) return false;

    // Check if user is organization owner
    const [org] = await sql`
      SELECT created_by FROM organisations WHERE org_id = ${channel.org_id}
    `;

    if (org?.created_by === userId) return true;

    // Get user's role and permissions
    const [memberWithRole] = await sql`
      SELECT om.role, r.accessible_teams, r.manage_channels, r.settings_access
      FROM org_members om
      LEFT JOIN org_roles r ON r.org_id = om.org_id AND r.role_name = om.role
      WHERE om.org_id = ${channel.org_id} AND om.user_id = ${userId}
    `;

    if (!memberWithRole) return false;

    const { accessible_teams, manage_channels, settings_access } = memberWithRole;

    // Users with manage_channels or settings_access have access to all channels
    if (manage_channels || settings_access) return true;

    // If accessible_teams is null or empty, user has access to all channels
    if (!accessible_teams || accessible_teams === null) return true;
    
    // Handle JSONB array - parse if it's a string, use directly if it's already an array
    let teamsArray;
    try {
      teamsArray = typeof accessible_teams === 'string' 
        ? JSON.parse(accessible_teams) 
        : accessible_teams;
    } catch (e) {
      // If parsing fails, assume no access
      return false;
    }
    
    if (!Array.isArray(teamsArray) || teamsArray.length === 0) return true;

    // Check if user has access to this specific channel
    return teamsArray.includes(channel.channel_name);
  } catch (error) {
    console.error("Error checking channel access:", error);
    return false;
  }
};

// Helper function to get channel name
const getChannelName = async (channelId) => {
  try {
    const [channel] = await sql`
      SELECT channel_name FROM org_channels WHERE channel_id = ${channelId}
    `;
    return channel?.channel_name || "Unknown Channel";
  } catch (error) {
    return "Unknown Channel";
  }
};