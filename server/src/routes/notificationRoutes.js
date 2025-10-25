import express from "express";
import {
  getNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification,
  createSampleNotifications,
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

// Create sample notifications (DEBUG ENDPOINT)
router.post("/sample", createSampleNotifications);

export default router;