import express from "express";
import {
  getNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification,
  deleteAllNotifications,
} from "../controllers/notificationControllers.js";

const router = express.Router();

// Get notifications
router.get("/", getNotifications);

// Mark notification as read
router.patch("/:notificationId/read", markNotificationAsRead);

// Mark all notifications as read
router.patch("/read-all", markAllNotificationsAsRead);

// Delete notification
router.delete("/:notificationId", deleteNotification);

// Delete all notifications
router.delete("/", deleteAllNotifications);

export default router;