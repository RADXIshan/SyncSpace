import sql from "../database/db.js";
import { createNotification } from "./notificationControllers.js";

// Get all direct message conversations for a user
export const getDirectMessageConversations = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { limit = 50, offset = 0 } = req.query;

    // Get conversations with the latest message and unread count
    const conversations = await sql`
      WITH latest_messages AS (
        SELECT 
          CASE 
            WHEN sender_id = ${userId} THEN receiver_id 
            ELSE sender_id 
          END as other_user_id,
          MAX(created_at) as last_message_time,
          COUNT(*) FILTER (WHERE receiver_id = ${userId} AND is_read = false) as unread_count
        FROM direct_messages 
        WHERE sender_id = ${userId} OR receiver_id = ${userId}
        GROUP BY other_user_id
      ),
      conversation_details AS (
        SELECT 
          lm.other_user_id,
          lm.last_message_time,
          lm.unread_count,
          dm.content as last_message_content,
          dm.file_url as last_message_file_url,
          dm.file_name as last_message_file_name,
          dm.sender_id as last_message_sender_id,
          u.name as other_user_name,
          u.user_photo as other_user_photo,
          u.email as other_user_email
        FROM latest_messages lm
        JOIN direct_messages dm ON (
          (dm.sender_id = ${userId} AND dm.receiver_id = lm.other_user_id) OR
          (dm.sender_id = lm.other_user_id AND dm.receiver_id = ${userId})
        ) AND dm.created_at = lm.last_message_time
        JOIN users u ON u.user_id = lm.other_user_id
      )
      SELECT * FROM conversation_details
      ORDER BY last_message_time DESC
      LIMIT ${limit} OFFSET ${offset}
    `;

    res.json({ conversations });
  } catch (error) {
    console.error("Error fetching conversations:", error);
    res.status(500).json({ message: "Failed to fetch conversations" });
  }
};

// Get direct messages between two users
export const getDirectMessages = async (req, res) => {
  try {
    const { otherUserId } = req.params;
    const userId = req.user.userId;
    const { limit = 50, offset = 0 } = req.query;

    // Verify both users are in the same organization
    const hasAccess = await checkDirectMessageAccess(userId, otherUserId);
    if (!hasAccess) {
      return res.status(403).json({ message: "Access denied to this conversation" });
    }

    // Get messages between the two users
    const messages = await sql`
      SELECT 
        dm.*,
        su.name as sender_name,
        su.user_photo as sender_photo,
        ru.name as receiver_name,
        ru.user_photo as receiver_photo,
        rm.content as reply_to_content,
        rsu.name as reply_to_sender_name,
        COALESCE(
          json_agg(
            json_build_object(
              'emoji', dmr.emoji,
              'user_id', dmr.user_id,
              'user_name', dmru.name,
              'created_at', dmr.created_at
            )
          ) FILTER (WHERE dmr.reaction_id IS NOT NULL),
          '[]'::json
        ) as reactions
      FROM direct_messages dm
      JOIN users su ON dm.sender_id = su.user_id
      JOIN users ru ON dm.receiver_id = ru.user_id
      LEFT JOIN direct_messages rm ON dm.reply_to = rm.message_id
      LEFT JOIN users rsu ON rm.sender_id = rsu.user_id
      LEFT JOIN direct_message_reactions dmr ON dm.message_id = dmr.message_id
      LEFT JOIN users dmru ON dmr.user_id = dmru.user_id
      WHERE (
        (dm.sender_id = ${userId} AND dm.receiver_id = ${otherUserId}) OR
        (dm.sender_id = ${otherUserId} AND dm.receiver_id = ${userId})
      )
      GROUP BY dm.message_id, su.name, su.user_photo, ru.name, ru.user_photo, rm.content, rsu.name
      ORDER BY dm.created_at ASC
      LIMIT ${limit} OFFSET ${offset}
    `;

    res.json({ messages });
  } catch (error) {
    console.error("Error fetching direct messages:", error);
    res.status(500).json({ message: "Failed to fetch messages" });
  }
};

// Send a direct message
export const sendDirectMessage = async (req, res) => {
  try {
    const { content, receiver_id, reply_to } = req.body;
    const senderId = req.user.userId;

    // Verify users can message each other
    const hasAccess = await checkDirectMessageAccess(senderId, receiver_id);
    if (!hasAccess) {
      return res.status(403).json({ message: "Access denied to message this user" });
    }

    // Insert message
    const [message] = await sql`
      INSERT INTO direct_messages (sender_id, receiver_id, content, reply_to)
      VALUES (${senderId}, ${receiver_id}, ${content}, ${reply_to})
      RETURNING *
    `;

    // Get user info for the message
    const [senderInfo] = await sql`
      SELECT name, user_photo FROM users WHERE user_id = ${senderId}
    `;

    const [receiverInfo] = await sql`
      SELECT name, user_photo FROM users WHERE user_id = ${receiver_id}
    `;

    // Ensure user data exists with fallbacks
    const safeSender = {
      name: senderInfo?.name || 'Unknown User',
      user_photo: senderInfo?.user_photo || null
    };

    const safeReceiver = {
      name: receiverInfo?.name || 'Unknown User',
      user_photo: receiverInfo?.user_photo || null
    };

    // Get reply info if this is a reply
    let replyInfo = null;
    if (reply_to) {
      const [replyMessage] = await sql`
        SELECT dm.content as reply_to_content, u.name as reply_to_sender_name
        FROM direct_messages dm
        JOIN users u ON dm.sender_id = u.user_id
        WHERE dm.message_id = ${reply_to}
      `;
      replyInfo = replyMessage;
    }

    const messageWithUsers = {
      ...message,
      sender_name: safeSender.name,
      sender_photo: safeSender.user_photo,
      receiver_name: safeReceiver.name,
      receiver_photo: safeReceiver.user_photo,
      ...replyInfo,
      reactions: []
    };

    // Emit to both users via socket
    const io = req.app.get("io");
    if (io) {
      const { getUserSocketId } = await import('../configs/socket.js');
      
      // Send to receiver
      const receiverSocketId = getUserSocketId(receiver_id);
      if (receiverSocketId) {
        io.to(receiverSocketId).emit("new_direct_message", messageWithUsers);
      }

      // Don't send back to sender to avoid duplicates with optimistic updates
      // The sender already has the optimistic message and will get the real response via HTTP
    }

    // Create notification for receiver
    try {
      // Get sender's organization for notification context
      const [senderOrg] = await sql`
        SELECT org_id FROM org_members WHERE user_id = ${senderId} LIMIT 1
      `;

      if (senderOrg) {
        await createNotification(
          receiver_id,
          senderOrg.org_id,
          "direct_message",
          "New Message",
          `${safeSender.name} sent you a message`,
          {
            relatedId: message.message_id,
            relatedType: "direct_message",
            link: `/home/messages?user=${senderId}`
          }
        );
      }
    } catch (error) {
      console.error("Error creating notification:", error);
    }

    res.status(201).json({ message: messageWithUsers });
  } catch (error) {
    console.error("Error sending direct message:", error);
    res.status(500).json({ message: "Failed to send message" });
  }
};

// Update a direct message
export const updateDirectMessage = async (req, res) => {
  try {
    const { messageId } = req.params;
    const { content } = req.body;
    const userId = req.user.userId;

    // Verify user owns the message
    const [existingMessage] = await sql`
      SELECT * FROM direct_messages 
      WHERE message_id = ${messageId} AND sender_id = ${userId}
    `;

    if (!existingMessage) {
      return res.status(404).json({ message: "Message not found or access denied" });
    }

    // Update message
    const [updatedMessage] = await sql`
      UPDATE direct_messages 
      SET content = ${content}, updated_at = NOW()
      WHERE message_id = ${messageId}
      RETURNING *
    `;

    // Get user info
    const [senderInfo] = await sql`
      SELECT name, user_photo FROM users WHERE user_id = ${userId}
    `;

    const [receiverInfo] = await sql`
      SELECT name, user_photo FROM users WHERE user_id = ${existingMessage.receiver_id}
    `;

    const messageWithUsers = {
      ...updatedMessage,
      sender_name: senderInfo?.name || 'Unknown User',
      sender_photo: senderInfo?.user_photo || null,
      receiver_name: receiverInfo?.name || 'Unknown User',
      receiver_photo: receiverInfo?.user_photo || null,
      reactions: []
    };

    // Emit update to both users
    const io = req.app.get("io");
    if (io) {
      const { getUserSocketId } = await import('../configs/socket.js');
      
      const receiverSocketId = getUserSocketId(existingMessage.receiver_id);
      if (receiverSocketId) {
        io.to(receiverSocketId).emit("direct_message_updated", messageWithUsers);
      }

      const senderSocketId = getUserSocketId(userId);
      if (senderSocketId) {
        io.to(senderSocketId).emit("direct_message_updated", messageWithUsers);
      }
    }

    res.json({ message: messageWithUsers });
  } catch (error) {
    console.error("Error updating direct message:", error);
    res.status(500).json({ message: "Failed to update message" });
  }
};

// Delete a direct message
export const deleteDirectMessage = async (req, res) => {
  try {
    const { messageId } = req.params;
    const userId = req.user.userId;

    // Verify user owns the message
    const [existingMessage] = await sql`
      SELECT * FROM direct_messages 
      WHERE message_id = ${messageId} AND sender_id = ${userId}
    `;

    if (!existingMessage) {
      return res.status(404).json({ message: "Message not found or access denied" });
    }

    // Delete message reactions first
    await sql`DELETE FROM direct_message_reactions WHERE message_id = ${messageId}`;

    // Delete message
    await sql`DELETE FROM direct_messages WHERE message_id = ${messageId}`;

    // Emit deletion to both users
    const io = req.app.get("io");
    if (io) {
      const { getUserSocketId } = await import('../configs/socket.js');
      
      const receiverSocketId = getUserSocketId(existingMessage.receiver_id);
      if (receiverSocketId) {
        io.to(receiverSocketId).emit("direct_message_deleted", parseInt(messageId));
      }

      const senderSocketId = getUserSocketId(userId);
      if (senderSocketId) {
        io.to(senderSocketId).emit("direct_message_deleted", parseInt(messageId));
      }
    }

    res.json({ message: "Message deleted successfully" });
  } catch (error) {
    console.error("Error deleting direct message:", error);
    res.status(500).json({ message: "Failed to delete message" });
  }
};

// Upload file for direct message
export const uploadDirectMessageFile = async (req, res) => {
  try {
    const { receiver_id } = req.body;
    const senderId = req.user.userId;
    const file = req.file;

    if (!file) {
      return res.status(400).json({ message: "No file provided" });
    }

    if (!receiver_id) {
      return res.status(400).json({ message: "Receiver ID is required" });
    }

    // Verify users can message each other
    const hasAccess = await checkDirectMessageAccess(senderId, receiver_id);
    if (!hasAccess) {
      return res.status(403).json({ message: "Access denied to message this user" });
    }

    // Validate file type and size (same as channel messages)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      return res.status(400).json({ 
        message: `File too large. Maximum size is ${maxSize / 1024 / 1024}MB` 
      });
    }

    // Use local storage for file upload
    let fileUrl;
    try {
      const fs = await import('fs');
      const path = await import('path');
      
      const uploadsDir = path.join(process.cwd(), 'uploads', 'direct-messages');
      
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
      fileUrl = `${serverBaseUrl}/api/direct-messages/files/local/${uniqueFileName}`;
      
    } catch (localError) {
      throw new Error("File upload failed: " + localError.message);
    }

    // Insert message with file info
    const [message] = await sql`
      INSERT INTO direct_messages (
        sender_id, receiver_id, content, file_url, file_name, file_type, file_size
      )
      VALUES (
        ${senderId}, ${receiver_id}, ${file.originalname || 'File'}, 
        ${fileUrl}, ${file.originalname || 'Unknown file'}, 
        ${file.mimetype || 'application/octet-stream'}, ${file.size || 0}
      )
      RETURNING *
    `;

    // Get user info
    const [senderInfo] = await sql`
      SELECT name, user_photo FROM users WHERE user_id = ${senderId}
    `;

    const [receiverInfo] = await sql`
      SELECT name, user_photo FROM users WHERE user_id = ${receiver_id}
    `;

    const messageWithUsers = {
      ...message,
      sender_name: senderInfo?.name || 'Unknown User',
      sender_photo: senderInfo?.user_photo || null,
      receiver_name: receiverInfo?.name || 'Unknown User',
      receiver_photo: receiverInfo?.user_photo || null,
      reactions: []
    };

    // Emit to both users
    const io = req.app.get("io");
    if (io) {
      const { getUserSocketId } = await import('../configs/socket.js');
      
      const receiverSocketId = getUserSocketId(receiver_id);
      if (receiverSocketId) {
        io.to(receiverSocketId).emit("new_direct_message", messageWithUsers);
      }

      // Don't send back to sender to avoid duplicates with optimistic updates
      // The sender already has the optimistic message and will get the real response via HTTP
    }

    res.status(201).json({ message: messageWithUsers });
  } catch (error) {
    console.error("Error uploading file:", error);
    res.status(500).json({ message: "Failed to upload file" });
  }
};

// Add reaction to direct message
export const addDirectMessageReaction = async (req, res) => {
  try {
    const { messageId } = req.params;
    const { emoji } = req.body;
    const userId = req.user.userId;

    // Check if message exists and get sender/receiver info
    const [message] = await sql`
      SELECT sender_id, receiver_id FROM direct_messages WHERE message_id = ${messageId}
    `;

    if (!message) {
      return res.status(404).json({ message: "Message not found" });
    }

    // Verify user is part of this conversation
    if (message.sender_id !== userId && message.receiver_id !== userId) {
      return res.status(403).json({ message: "Access denied to this message" });
    }

    // Check if user already reacted with this emoji
    const [existingReaction] = await sql`
      SELECT * FROM direct_message_reactions 
      WHERE message_id = ${messageId} AND user_id = ${userId} AND emoji = ${emoji}
    `;

    if (existingReaction) {
      // Remove existing reaction
      await sql`
        DELETE FROM direct_message_reactions 
        WHERE message_id = ${messageId} AND user_id = ${userId} AND emoji = ${emoji}
      `;
    } else {
      // Add new reaction
      await sql`
        INSERT INTO direct_message_reactions (message_id, user_id, emoji)
        VALUES (${messageId}, ${userId}, ${emoji})
      `;
    }

    // Get updated reactions for this message
    const reactions = await sql`
      SELECT 
        dmr.reaction_id,
        dmr.message_id,
        dmr.user_id,
        dmr.emoji,
        dmr.created_at,
        u.name as user_name
      FROM direct_message_reactions dmr
      JOIN users u ON dmr.user_id = u.user_id
      WHERE dmr.message_id = ${messageId}
      ORDER BY dmr.created_at ASC
    `;

    // Emit reaction update to both users
    const io = req.app.get("io");
    if (io) {
      const { getUserSocketId } = await import('../configs/socket.js');
      
      const receiverSocketId = getUserSocketId(message.receiver_id);
      if (receiverSocketId) {
        io.to(receiverSocketId).emit("direct_message_reaction_updated", {
          messageId: parseInt(messageId),
          reactions: reactions || []
        });
      }

      const senderSocketId = getUserSocketId(message.sender_id);
      if (senderSocketId) {
        io.to(senderSocketId).emit("direct_message_reaction_updated", {
          messageId: parseInt(messageId),
          reactions: reactions || []
        });
      }
    }

    res.json({ reactions: reactions || [] });
  } catch (error) {
    console.error("Error adding reaction:", error);
    res.status(500).json({ message: "Failed to add reaction" });
  }
};

// Get organization members for messaging
export const getOrganizationMembers = async (req, res) => {
  try {
    const userId = req.user.userId;

    // Get user's organizations
    const userOrgs = await sql`
      SELECT org_id FROM org_members WHERE user_id = ${userId}
    `;

    if (userOrgs.length === 0) {
      return res.json({ members: [] });
    }

    const orgIds = userOrgs.map(org => org.org_id);

    // Get all members from user's organizations (excluding the user themselves)
    const members = await sql`
      SELECT DISTINCT u.user_id, u.name, u.user_photo, u.email, om.role, o.org_name
      FROM users u
      JOIN org_members om ON u.user_id = om.user_id
      JOIN organisations o ON om.org_id = o.org_id
      WHERE om.org_id = ANY(${orgIds}) AND u.user_id != ${userId}
      ORDER BY u.name
    `;

    res.json({ members });
  } catch (error) {
    console.error("Error fetching organization members:", error);
    res.status(500).json({ message: "Failed to fetch members" });
  }
};

// Mark messages as read
export const markMessagesAsRead = async (req, res) => {
  try {
    const { conversationId } = req.params; // This is the other user's ID
    const userId = req.user.userId;

    // Get count of messages being marked as read
    const [countResult] = await sql`
      SELECT COUNT(*) as count
      FROM direct_messages 
      WHERE sender_id = ${conversationId} 
        AND receiver_id = ${userId} 
        AND is_read = false
    `;

    // Mark all unread messages from the other user as read
    await sql`
      UPDATE direct_messages 
      SET is_read = true 
      WHERE sender_id = ${conversationId} 
        AND receiver_id = ${userId} 
        AND is_read = false
    `;

    // Emit socket event to update unread counts
    const io = req.app.get("io");
    if (io) {
      const { getUserSocketId } = await import('../configs/socket.js');
      
      const userSocketId = getUserSocketId(userId);
      if (userSocketId) {
        io.to(userSocketId).emit("direct_messages_read", {
          userId: userId,
          otherUserId: conversationId,
          count: parseInt(countResult.count)
        });
      }
    }

    res.json({ message: "Messages marked as read" });
  } catch (error) {
    console.error("Error marking messages as read:", error);
    res.status(500).json({ message: "Failed to mark messages as read" });
  }
};

// Get unread counts for direct messages and channels
export const getUnreadCounts = async (req, res) => {
  try {
    const userId = req.user.userId;

    // Get unread direct messages count
    let dmCount;
    try {
      [dmCount] = await sql`
        SELECT COUNT(*) as count
        FROM direct_messages 
        WHERE receiver_id = ${userId} AND is_read = false
      `;
    } catch (tableError) {
      // If direct_messages table doesn't exist, return 0
      console.log('direct_messages table not found, returning 0');
      dmCount = { count: 0 };
    }

    // Get user's organizations and accessible channels
    const userOrgs = await sql`
      SELECT org_id FROM org_members WHERE user_id = ${userId}
    `;

    let channelUnreadCounts = [];
    
    if (userOrgs.length > 0) {
      const orgIds = userOrgs.map(org => org.org_id);
      
      // Get all channels in user's organizations
      const channels = await sql`
        SELECT channel_id, channel_name, org_id 
        FROM org_channels 
        WHERE org_id = ANY(${orgIds})
      `;

      // Check access and get unread counts for each channel
      for (const channel of channels) {
        const hasAccess = await checkChannelAccess(userId, channel.channel_id);
        if (hasAccess) {
          let unreadCount;
          try {
            // Get the last read status for this user and channel
            const [readStatus] = await sql`
              SELECT last_read_at, last_message_id 
              FROM channel_read_status 
              WHERE user_id = ${userId} AND channel_id = ${channel.channel_id}
            `;

            if (readStatus && readStatus.last_read_at) {
              // Count messages after the last read time
              [unreadCount] = await sql`
                SELECT COUNT(*) as count
                FROM channel_messages 
                WHERE channel_id = ${channel.channel_id} 
                  AND user_id != ${userId}
                  AND created_at > ${readStatus.last_read_at}
              `;
            } else {
              // User has never read this channel, count all messages from other users
              [unreadCount] = await sql`
                SELECT COUNT(*) as count
                FROM channel_messages 
                WHERE channel_id = ${channel.channel_id} 
                  AND user_id != ${userId}
              `;
            }
          } catch (tableError) {
            // If channel_read_status table doesn't exist, count recent messages
            console.log('channel_read_status table not found, using fallback method');
            [unreadCount] = await sql`
              SELECT COUNT(*) as count
              FROM channel_messages 
              WHERE channel_id = ${channel.channel_id} 
                AND user_id != ${userId}
                AND created_at > NOW() - INTERVAL '24 hours'
            `;
          }
          
          if (unreadCount.count > 0) {
            channelUnreadCounts.push({
              channel_id: channel.channel_id,
              channel_name: channel.channel_name,
              unread_count: parseInt(unreadCount.count)
            });
          }
        }
      }
    }

    const totalChannelUnread = channelUnreadCounts.reduce((sum, channel) => sum + channel.unread_count, 0);

    res.json({
      direct_messages: parseInt(dmCount.count),
      channels: channelUnreadCounts,
      total_channel_unread: totalChannelUnread,
      total_unread: parseInt(dmCount.count) + totalChannelUnread
    });
  } catch (error) {
    console.error("Error fetching unread counts:", error);
    res.status(500).json({ message: "Failed to fetch unread counts" });
  }
};

// Helper function to check if two users can message each other
const checkDirectMessageAccess = async (userId1, userId2) => {
  try {
    // Check if both users are in the same organization
    const sharedOrgs = await sql`
      SELECT om1.org_id
      FROM org_members om1
      JOIN org_members om2 ON om1.org_id = om2.org_id
      WHERE om1.user_id = ${userId1} AND om2.user_id = ${userId2}
    `;

    return sharedOrgs.length > 0;
  } catch (error) {
    console.error("Error checking direct message access:", error);
    return false;
  }
};

// Delete entire conversation between two users
export const deleteConversation = async (req, res) => {
  try {
    const { otherUserId } = req.params;
    const userId = req.user.userId;

    console.log("Delete conversation request:", {
      otherUserId,
      userId,
      params: req.params,
      url: req.url
    });

    // Convert otherUserId to integer to ensure proper type matching
    const otherUserIdInt = parseInt(otherUserId);
    if (isNaN(otherUserIdInt)) {
      return res.status(400).json({ message: "Invalid user ID" });
    }

    // Verify users can message each other
    const hasAccess = await checkDirectMessageAccess(userId, otherUserIdInt);
    if (!hasAccess) {
      return res.status(403).json({ message: "Access denied to this conversation" });
    }

    // Get all messages in the conversation before deletion
    const messages = await sql`
      SELECT message_id FROM direct_messages 
      WHERE (sender_id = ${userId} AND receiver_id = ${otherUserIdInt}) 
         OR (sender_id = ${otherUserIdInt} AND receiver_id = ${userId})
    `;

    console.log("Found messages to delete:", messages.length);

    if (messages.length === 0) {
      return res.status(404).json({ message: "No conversation found" });
    }

    const messageIds = messages.map(msg => msg.message_id);

    // Delete all reactions for messages in this conversation
    await sql`
      DELETE FROM direct_message_reactions 
      WHERE message_id = ANY(${messageIds})
    `;

    // Delete all messages in the conversation
    await sql`
      DELETE FROM direct_messages 
      WHERE (sender_id = ${userId} AND receiver_id = ${otherUserIdInt}) 
         OR (sender_id = ${otherUserIdInt} AND receiver_id = ${userId})
    `;

    // Get the deleter's name and org_id for the notification
    const [deleterUser] = await sql`
      SELECT name, org_id FROM users WHERE user_id = ${userId}
    `;
    const deleterName = deleterUser?.name || "Someone";
    const orgId = deleterUser?.org_id;

    // Create notification for the other user
    if (orgId) {
      try {
        const { createNotification } = await import('./notificationControllers.js');
        await createNotification(
          otherUserIdInt,
          orgId,
          'conversation_deleted',
          'Conversation Deleted',
          `${deleterName} deleted your conversation`,
          {
            relatedId: userId,
            relatedType: 'direct_message',
            link: '/home/messages'
          }
        );
      } catch (notifError) {
        console.error("Error creating conversation deletion notification:", notifError);
        // Don't fail the deletion if notification fails
      }
    }

    // Emit conversation deletion to both users
    const io = req.app.get("io");
    if (io) {
      const { getUserSocketId } = await import('../configs/socket.js');
      
      const otherUserSocketId = getUserSocketId(otherUserIdInt);
      if (otherUserSocketId) {
        // Emit conversation deleted event
        io.to(otherUserSocketId).emit("conversation_deleted", {
          deletedBy: userId,
          deletedByName: deleterName,
          otherUserId: userId
        });
        
        // Emit notification event for the notification system
        io.to(otherUserSocketId).emit("new_notification", {
          type: "conversation_deleted",
          title: "Conversation Deleted",
          message: `${deleterName} deleted your conversation`,
          priority: "high",
          actionUrl: "/home/messages"
        });
      }

      const userSocketId = getUserSocketId(userId);
      if (userSocketId) {
        io.to(userSocketId).emit("conversation_deleted", {
          deletedBy: userId,
          deletedByName: deleterName,
          otherUserId: otherUserIdInt
        });
      }
    }

    res.json({ 
      message: "Conversation deleted successfully",
      deletedMessages: messages.length
    });
  } catch (error) {
    console.error("Error deleting conversation:", error);
    res.status(500).json({ message: "Failed to delete conversation" });
  }
};



// Helper function to check channel access (copied from messageControllers.js)
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


// Pin a direct message
export const pinDirectMessage = async (req, res) => {
  try {
    const { messageId } = req.params;
    const userId = req.user.userId;
    const { receiver_id } = req.body;

    // Verify the message exists and user is part of the conversation
    const [message] = await sql`
      SELECT * FROM direct_messages 
      WHERE message_id = ${messageId}
        AND (sender_id = ${userId} OR receiver_id = ${userId})
    `;

    if (!message) {
      return res.status(404).json({ message: "Message not found or access denied" });
    }

    // Update message to be pinned
    await sql`
      UPDATE direct_messages 
      SET is_pinned = true 
      WHERE message_id = ${messageId}
    `;

    // Add to pinned_direct_messages table
    await sql`
      INSERT INTO pinned_direct_messages (message_id, user_id, pinned_by)
      VALUES (${messageId}, ${userId}, ${userId})
      ON CONFLICT (message_id, user_id) DO NOTHING
    `;

    // Emit socket event to both users
    const io = req.app.get("io");
    if (io) {
      const { getUserSocketId } = await import('../configs/socket.js');
      
      const otherUserId = message.sender_id === userId ? message.receiver_id : message.sender_id;
      
      const userSocketId = getUserSocketId(userId);
      const otherUserSocketId = getUserSocketId(otherUserId);
      
      const pinEvent = {
        messageId: parseInt(messageId),
        isPinned: true,
        pinnedBy: userId
      };
      
      if (userSocketId) {
        io.to(userSocketId).emit("direct_message_pinned", pinEvent);
      }
      if (otherUserSocketId) {
        io.to(otherUserSocketId).emit("direct_message_pinned", pinEvent);
      }
    }

    res.json({ 
      message: "Message pinned successfully",
      is_pinned: true
    });
  } catch (error) {
    console.error("Error pinning message:", error);
    res.status(500).json({ message: "Failed to pin message" });
  }
};

// Unpin a direct message
export const unpinDirectMessage = async (req, res) => {
  try {
    const { messageId } = req.params;
    const userId = req.user.userId;

    // Verify the message exists and user is part of the conversation
    const [message] = await sql`
      SELECT * FROM direct_messages 
      WHERE message_id = ${messageId}
        AND (sender_id = ${userId} OR receiver_id = ${userId})
    `;

    if (!message) {
      return res.status(404).json({ message: "Message not found or access denied" });
    }

    // Update message to be unpinned
    await sql`
      UPDATE direct_messages 
      SET is_pinned = false 
      WHERE message_id = ${messageId}
    `;

    // Remove from pinned_direct_messages table
    await sql`
      DELETE FROM pinned_direct_messages 
      WHERE message_id = ${messageId} AND user_id = ${userId}
    `;

    // Emit socket event to both users
    const io = req.app.get("io");
    if (io) {
      const { getUserSocketId } = await import('../configs/socket.js');
      
      const otherUserId = message.sender_id === userId ? message.receiver_id : message.sender_id;
      
      const userSocketId = getUserSocketId(userId);
      const otherUserSocketId = getUserSocketId(otherUserId);
      
      const unpinEvent = {
        messageId: parseInt(messageId),
        isPinned: false,
        unpinnedBy: userId
      };
      
      if (userSocketId) {
        io.to(userSocketId).emit("direct_message_unpinned", unpinEvent);
      }
      if (otherUserSocketId) {
        io.to(otherUserSocketId).emit("direct_message_unpinned", unpinEvent);
      }
    }

    res.json({ 
      message: "Message unpinned successfully",
      is_pinned: false
    });
  } catch (error) {
    console.error("Error unpinning message:", error);
    res.status(500).json({ message: "Failed to unpin message" });
  }
};
