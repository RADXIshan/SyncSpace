import sql from "../database/db.js";
import jwt from "jsonwebtoken";

// Get notifications for a user
export const getNotifications = async (req, res) => {
  try {
    const authToken = req.cookies.jwt || req.headers.authorization?.split(" ")[1];
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
    const [user] = await sql`SELECT org_id FROM users WHERE user_id = ${userId}`;
    if (!user || !user.org_id) {
      return res.json({ notifications: [], unreadCount: 0 });
    }

    // Get notifications for the user's organization
    const notifications = await sql`
      SELECT * FROM notifications 
      WHERE org_id = ${user.org_id} 
      AND user_id = ${userId}
      ORDER BY created_at DESC 
      LIMIT 50
    `;

    // Get unread count
    const [unreadResult] = await sql`
      SELECT COUNT(*) as count FROM notifications 
      WHERE org_id = ${user.org_id} 
      AND user_id = ${userId}
      AND read_at IS NULL
    `;

    res.json({
      notifications: notifications.map(n => ({
        id: n.id,
        type: n.type,
        title: n.title,
        message: n.message,
        priority: 'medium', // Default since your schema doesn't have priority
        isRead: n.read_at !== null,
        timestamp: n.created_at,
        actionUrl: n.link,
        relatedId: n.related_id,
        relatedType: n.related_type,
      })),
      unreadCount: parseInt(unreadResult.count)
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
    const authToken = req.cookies.jwt || req.headers.authorization?.split(" ")[1];
    
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
    const authToken = req.cookies.jwt || req.headers.authorization?.split(" ")[1];
    
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
    const [user] = await sql`SELECT org_id FROM users WHERE user_id = ${userId}`;
    if (!user || !user.org_id) {
      return res.json({ message: "No notifications to mark" });
    }

    // Update all notifications for the user's organization
    await sql`
      UPDATE notifications 
      SET read_at = CURRENT_TIMESTAMP 
      WHERE org_id = ${user.org_id}
      AND user_id = ${userId}
      AND read_at IS NULL
    `;

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
    const authToken = req.cookies.jwt || req.headers.authorization?.split(" ")[1];
    
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



// Create notification (internal function for other controllers to use)
export const createNotification = async (userId, orgId, type, title, message, options = {}) => {
  try {
    const {
      relatedId = null,
      relatedType = null,
      link = null,
    } = options;

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
export const createNotificationForOrg = async (orgId, type, title, message, options = {}) => {
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