import sql from "../database/db.js";
import jwt from "jsonwebtoken";

// Helper function to check if a user has access to a specific channel
const checkChannelAccess = async (userId, channelId, orgId) => {
  try {
    // Get channel details
    const [channel] = await sql`
      SELECT channel_name FROM org_channels 
      WHERE channel_id = ${channelId} AND org_id = ${orgId}
    `;

    if (!channel) {
      return false; // Channel doesn't exist
    }

    // Check if user is organization owner (has access to all channels)
    const [org] = await sql`
      SELECT created_by FROM organisations WHERE org_id = ${orgId}
    `;

    if (org?.created_by === userId) {
      return true; // Organization owner has access to all channels
    }

    // Get user's role and accessible teams
    const [memberWithRole] = await sql`
      SELECT om.role, r.accessible_teams
      FROM org_members om
      LEFT JOIN org_roles r ON r.org_id = om.org_id AND r.role_name = om.role
      WHERE om.org_id = ${orgId} AND om.user_id = ${userId}
    `;

    if (!memberWithRole) {
      return false; // User is not a member of the organization
    }

    const accessibleTeams = memberWithRole.accessible_teams;

    // If accessible_teams is null or empty, user has access to all channels
    if (!Array.isArray(accessibleTeams) || accessibleTeams.length === 0) {
      return true;
    }

    // Check if user has access to this specific channel
    return accessibleTeams.includes(channel.channel_name);
  } catch (error) {
    console.error("Error checking channel access:", error);
    return false;
  }
};

// Get notifications for a user
export const getNotifications = async (req, res) => {
  try {
    const authToken =
      req.cookies.jwt || req.headers.authorization?.split(" ")[1];
    if (!authToken) {
      return res.status(401).json({ message: "No token provided" });
    }

    let userId;
    try {
      const decoded = jwt.verify(authToken, process.env.JWT_SECRET_KEY);
      userId = decoded.userId;
    } catch (error) {
      return res.status(401).json({ message: "Invalid token" });
    }

    // Get user's organization
    const [user] =
      await sql`SELECT org_id FROM users WHERE user_id = ${userId}`;
    if (!user || !user.org_id) {
      return res.json({ notifications: [], unreadCount: 0 });
    }

    // Get notifications for the user's organization
    const allNotifications = await sql`
      SELECT n.*, c.channel_name 
      FROM notifications n
      LEFT JOIN org_channels c ON n.related_id = c.channel_id AND n.related_type = 'channel'
      WHERE n.org_id = ${user.org_id} 
      AND n.user_id = ${userId}
      ORDER BY n.created_at DESC 
      LIMIT 100
    `;

    // Filter notifications based on channel access
    const notifications = [];
    for (const notification of allNotifications) {
      // If notification is not channel-specific, include it
      if (
        !notification.related_type ||
        notification.related_type !== "channel"
      ) {
        notifications.push(notification);
        continue;
      }

      // If notification is channel-specific, check access
      if (notification.related_id) {
        const hasAccess = await checkChannelAccess(
          userId,
          notification.related_id,
          user.org_id
        );
        if (hasAccess) {
          notifications.push(notification);
        }
      } else {
        // Include notifications without specific channel ID
        notifications.push(notification);
      }

      // Limit to 50 notifications after filtering
      if (notifications.length >= 50) {
        break;
      }
    }

    // Get unread count (need to filter by channel access)
    const allUnreadNotifications = await sql`
      SELECT n.*, c.channel_name 
      FROM notifications n
      LEFT JOIN org_channels c ON n.related_id = c.channel_id AND n.related_type = 'channel'
      WHERE n.org_id = ${user.org_id} 
      AND n.user_id = ${userId}
      AND n.read_at IS NULL
    `;

    // Filter unread notifications based on channel access
    let unreadCount = 0;
    for (const notification of allUnreadNotifications) {
      // If notification is not channel-specific, count it
      if (
        !notification.related_type ||
        notification.related_type !== "channel"
      ) {
        unreadCount++;
        continue;
      }

      // If notification is channel-specific, check access
      if (notification.related_id) {
        const hasAccess = await checkChannelAccess(
          userId,
          notification.related_id,
          user.org_id
        );
        if (hasAccess) {
          unreadCount++;
        }
      } else {
        // Count notifications without specific channel ID
        unreadCount++;
      }
    }

    res.json({
      notifications: notifications.map((n) => ({
        id: n.id,
        type: n.type,
        title: n.title,
        message: n.message,
        priority: "medium", // Default since your schema doesn't have priority
        isRead: n.read_at !== null,
        timestamp: n.created_at,
        actionUrl: n.link,
        relatedId: n.related_id,
        relatedType: n.related_type,
      })),
      unreadCount: unreadCount,
    });
  } catch (error) {
    console.error("Error fetching notifications:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Mark notification as read
export const markNotificationAsRead = async (req, res) => {
  try {
    const { notificationId } = req.params;
    const authToken =
      req.cookies.jwt || req.headers.authorization?.split(" ")[1];

    if (!authToken) {
      return res.status(401).json({ message: "No token provided" });
    }

    let userId;
    try {
      const decoded = jwt.verify(authToken, process.env.JWT_SECRET_KEY);
      userId = decoded.userId;
    } catch (error) {
      return res.status(401).json({ message: "Invalid token" });
    }

    // Update notification
    await sql`
      UPDATE notifications 
      SET read_at = CURRENT_TIMESTAMP 
      WHERE id = ${notificationId}
      AND user_id = ${userId}
    `;

    res.json({ message: "Notification marked as read" });
  } catch (error) {
    console.error("Error marking notification as read:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Mark all notifications as read
export const markAllNotificationsAsRead = async (req, res) => {
  try {
    const authToken =
      req.cookies.jwt || req.headers.authorization?.split(" ")[1];

    if (!authToken) {
      return res.status(401).json({ message: "No token provided" });
    }

    let userId;
    try {
      const decoded = jwt.verify(authToken, process.env.JWT_SECRET_KEY);
      userId = decoded.userId;
    } catch (error) {
      return res.status(401).json({ message: "Invalid token" });
    }

    // Get user's organization
    const [user] =
      await sql`SELECT org_id FROM users WHERE user_id = ${userId}`;
    if (!user || !user.org_id) {
      return res.json({ message: "No notifications to mark" });
    }

    // Get all unread notifications for filtering
    const allUnreadNotifications = await sql`
      SELECT n.id, n.related_id, n.related_type
      FROM notifications n
      WHERE n.org_id = ${user.org_id}
      AND n.user_id = ${userId}
      AND n.read_at IS NULL
    `;

    // Filter notifications based on channel access and collect IDs to update
    const notificationIdsToUpdate = [];
    for (const notification of allUnreadNotifications) {
      // If notification is not channel-specific, include it
      if (
        !notification.related_type ||
        notification.related_type !== "channel"
      ) {
        notificationIdsToUpdate.push(notification.id);
        continue;
      }

      // If notification is channel-specific, check access
      if (notification.related_id) {
        const hasAccess = await checkChannelAccess(
          userId,
          notification.related_id,
          user.org_id
        );
        if (hasAccess) {
          notificationIdsToUpdate.push(notification.id);
        }
      } else {
        // Include notifications without specific channel ID
        notificationIdsToUpdate.push(notification.id);
      }
    }

    // Update only the notifications the user has access to
    if (notificationIdsToUpdate.length > 0) {
      await sql`
        UPDATE notifications 
        SET read_at = CURRENT_TIMESTAMP 
        WHERE id = ANY(${notificationIdsToUpdate})
      `;
    }

    res.json({ message: "All notifications marked as read" });
  } catch (error) {
    console.error("Error marking all notifications as read:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Delete notification
export const deleteNotification = async (req, res) => {
  try {
    const { notificationId } = req.params;
    const authToken =
      req.cookies.jwt || req.headers.authorization?.split(" ")[1];

    if (!authToken) {
      return res.status(401).json({ message: "No token provided" });
    }

    let userId;
    try {
      const decoded = jwt.verify(authToken, process.env.JWT_SECRET_KEY);
      userId = decoded.userId;
    } catch (error) {
      return res.status(401).json({ message: "Invalid token" });
    }

    // Delete notification
    await sql`
      DELETE FROM notifications 
      WHERE id = ${notificationId}
      AND user_id = ${userId}
    `;

    res.json({ message: "Notification deleted" });
  } catch (error) {
    console.error("Error deleting notification:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Delete all notifications
export const deleteAllNotifications = async (req, res) => {
  const startTime = Date.now();

  try {
    const authToken =
      req.cookies.jwt || req.headers.authorization?.split(" ")[1];

    if (!authToken) {
      return res.status(401).json({ message: "No token provided" });
    }

    let userId;
    try {
      const decoded = jwt.verify(authToken, process.env.JWT_SECRET_KEY);
      userId = decoded.userId;
    } catch (error) {
      return res.status(401).json({ message: "Invalid token" });
    }

    // Get user's organization
    const [user] =
      await sql`SELECT org_id FROM users WHERE user_id = ${userId}`;
    if (!user || !user.org_id) {
      return res.json({ message: "No notifications to delete" });
    }

    // Get all notifications for filtering
    const allNotifications = await sql`
      SELECT n.id, n.related_id, n.related_type
      FROM notifications n
      WHERE n.org_id = ${user.org_id}
      AND n.user_id = ${userId}
    `;

    // Filter notifications based on channel access and collect IDs to delete
    const notificationIdsToDelete = [];
    for (const notification of allNotifications) {
      // If notification is not channel-specific, include it
      if (
        !notification.related_type ||
        notification.related_type !== "channel"
      ) {
        notificationIdsToDelete.push(notification.id);
        continue;
      }

      // If notification is channel-specific, check access
      if (notification.related_id) {
        const hasAccess = await checkChannelAccess(
          userId,
          notification.related_id,
          user.org_id
        );
        if (hasAccess) {
          notificationIdsToDelete.push(notification.id);
        }
      } else {
        // Include notifications without specific channel ID
        notificationIdsToDelete.push(notification.id);
      }
    }

    const notificationCount = notificationIdsToDelete.length;
    console.log(
      `Deleting ${notificationCount} notifications for user ${userId}`
    );

    // Delete only the notifications the user has access to
    let result = null;
    if (notificationIdsToDelete.length > 0) {
      result = await sql`
        DELETE FROM notifications 
        WHERE id = ANY(${notificationIdsToDelete})
      `;
    }

    const endTime = Date.now();
    const duration = endTime - startTime;

    console.log(
      `Successfully deleted ${notificationCount} notifications in ${duration}ms`
    );

    res.json({
      message: "All notifications deleted",
      deletedCount: notificationCount,
      duration: duration,
    });
  } catch (error) {
    const endTime = Date.now();
    const duration = endTime - startTime;
    console.error(
      `Error deleting all notifications after ${duration}ms:`,
      error
    );
    res.status(500).json({ message: "Internal server error" });
  }
};

// Create notification (internal function for other controllers to use)
export const createNotification = async (
  userId,
  orgId,
  type,
  title,
  message,
  options = {}
) => {
  try {
    const { relatedId = null, relatedType = null, link = null } = options;

    const [notification] = await sql`
      INSERT INTO notifications (
        user_id,
        org_id, 
        type, 
        title, 
        message, 
        related_id,
        related_type,
        link
      ) VALUES (
        ${userId},
        ${orgId}, 
        ${type}, 
        ${title}, 
        ${message}, 
        ${relatedId},
        ${relatedType},
        ${link}
      ) RETURNING *
    `;

    return notification;
  } catch (error) {
    console.error("Error creating notification:", error);
    throw error;
  }
};

// Create notification for all org members except the creator
export const createNotificationForOrg = async (
  orgId,
  type,
  title,
  message,
  options = {}
) => {
  try {
    const { excludeUserId, channelId } = options;

    // Get all users in the organization except the creator
    let orgMembers;
    if (excludeUserId) {
      orgMembers = await sql`
        SELECT user_id FROM org_members 
        WHERE org_id = ${orgId} AND user_id != ${excludeUserId}
      `;
    } else {
      orgMembers = await sql`
        SELECT user_id FROM org_members WHERE org_id = ${orgId}
      `;
    }

    const notifications = [];
    for (const member of orgMembers) {
      // If this is a channel-specific notification, check access
      if (channelId) {
        const hasAccess = await checkChannelAccess(
          member.user_id,
          channelId,
          orgId
        );
        if (!hasAccess) {
          continue; // Skip this user if they don't have access to the channel
        }
      }

      const notification = await createNotification(
        member.user_id,
        orgId,
        type,
        title,
        message,
        options
      );
      notifications.push(notification);
    }

    return notifications;
  } catch (error) {
    console.error("Error creating notifications for org:", error);
    throw error;
  }
};

// Create notification for channel members only
export const createNotificationForChannel = async (
  orgId,
  channelId,
  type,
  title,
  message,
  options = {}
) => {
  try {
    const { excludeUserId } = options;

    // Get all users in the organization except the creator
    let orgMembers;
    if (excludeUserId) {
      orgMembers = await sql`
        SELECT user_id FROM org_members 
        WHERE org_id = ${orgId} AND user_id != ${excludeUserId}
      `;
    } else {
      orgMembers = await sql`
        SELECT user_id FROM org_members WHERE org_id = ${orgId}
      `;
    }

    const notifications = [];
    for (const member of orgMembers) {
      // Check if user has access to this channel
      const hasAccess = await checkChannelAccess(
        member.user_id,
        channelId,
        orgId
      );
      if (!hasAccess) {
        continue; // Skip this user if they don't have access to the channel
      }

      const notification = await createNotification(
        member.user_id,
        orgId,
        type,
        title,
        message,
        {
          ...options,
          relatedId: channelId,
          relatedType: "channel",
        }
      );
      notifications.push(notification);
    }

    return notifications;
  } catch (error) {
    console.error("Error creating notifications for channel:", error);
    throw error;
  }
};
