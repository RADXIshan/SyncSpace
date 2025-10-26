import { Router } from "express";
import multer from "multer";
import {
  getChannelMessages,
  sendMessage,
  updateMessage,
  deleteMessage,
  uploadFile,
  addReaction,
  getChannelMembers
} from "../controllers/messageControllers.js";
import { authenticateToken } from "../middleware/auth.js";

const router = Router();

// Configure multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    // Allow all file types for now
    cb(null, true);
  },
});

// Apply authentication middleware to all routes
router.use(authenticateToken);

// Message routes
router.get("/channels/:channelId/messages", getChannelMessages);
router.post("/messages", sendMessage);
router.put("/messages/:messageId", updateMessage);
router.delete("/messages/:messageId", deleteMessage);

// File upload
router.post("/messages/file", upload.single("file"), uploadFile);

// Reactions
router.post("/messages/:messageId/reactions", addReaction);

// Channel members (for mentions)
router.get("/channels/:channelId/members", getChannelMembers);

export default router;