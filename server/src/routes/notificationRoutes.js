import express from "express";
import {
  getNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification,
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

export default router;