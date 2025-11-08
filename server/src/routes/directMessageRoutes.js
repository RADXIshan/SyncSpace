import { Router } from "express";
import multer from "multer";
import {
  getDirectMessages,
  sendDirectMessage,
  updateDirectMessage,
  deleteDirectMessage,
  uploadDirectMessageFile,
  addDirectMessageReaction,
  getDirectMessageConversations,
  getOrganizationMembers,
  markMessagesAsRead,
  getUnreadCounts,
  deleteConversation,
  pinDirectMessage,
  unpinDirectMessage,
} from "../controllers/directMessageControllers.js";
import { authenticateToken } from "../middleware/auth.js";

const router = Router();

// Configure multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
    files: 1, // Only allow 1 file per request
  },
  fileFilter: (req, file, cb) => {
    // Check for dangerous file types
    const dangerousExtensions = [
      "exe",
      "bat",
      "cmd",
      "scr",
      "pif",
      "com",
      "vbs",
      "js",
    ];
    const extension = file.originalname.split(".").pop()?.toLowerCase();

    if (dangerousExtensions.includes(extension)) {
      return cb(new Error("File type not allowed for security reasons"), false);
    }

    // Check file size
    if (file.size > 10 * 1024 * 1024) {
      return cb(new Error("File too large"), false);
    }

    // Allow all other file types
    cb(null, true);
  },
});

// Apply authentication middleware to all routes
router.use(authenticateToken);

// Direct message routes
router.get("/conversations", getDirectMessageConversations);
router.get("/conversations/:otherUserId", getDirectMessages);
router.post("/messages", sendDirectMessage);
router.put("/messages/:messageId", updateDirectMessage);
router.delete("/messages/:messageId", deleteDirectMessage);
router.post("/messages/:conversationId/read", markMessagesAsRead);
router.delete("/conversations/:otherUserId", deleteConversation);

// File upload with error handling
router.post(
  "/messages/file",
  (req, res, next) => {
    upload.single("file")(req, res, (err) => {
      if (err instanceof multer.MulterError) {
        if (err.code === "LIMIT_FILE_SIZE") {
          return res
            .status(400)
            .json({ message: "File too large. Maximum size is 10MB." });
        }
        if (err.code === "LIMIT_FILE_COUNT") {
          return res.status(400).json({
            message: "Too many files. Only 1 file allowed per upload.",
          });
        }
        return res
          .status(400)
          .json({ message: `Upload error: ${err.message}` });
      } else if (err) {
        return res.status(400).json({ message: err.message });
      }
      next();
    });
  },
  uploadDirectMessageFile
);

// Reactions
router.post("/messages/:messageId/reactions", addDirectMessageReaction);

// Pin/Unpin messages
router.post("/messages/:messageId/pin", pinDirectMessage);
router.delete("/messages/:messageId/pin", unpinDirectMessage);

// Organization members (for finding users to message)
router.get("/organization/members", getOrganizationMembers);

// Get unread counts
router.get("/unread-counts", getUnreadCounts);

// Serve local files for direct messages
router.get("/files/local/:filename", async (req, res) => {
  try {
    let { filename } = req.params;
    const path = await import("path");
    const fs = await import("fs");

    // Decode the filename in case it's URL encoded
    filename = decodeURIComponent(filename);

    // Security check - prevent directory traversal
    if (
      filename.includes("..") ||
      filename.includes("/") ||
      filename.includes("\\")
    ) {
      return res.status(400).json({ message: "Invalid filename" });
    }

    const filePath = path.join(
      process.cwd(),
      "uploads",
      "direct-messages",
      filename
    );

    // Check if file exists
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ message: "File not found" });
    }

    // Get file stats
    const stats = fs.statSync(filePath);
    const fileExtension = path.extname(filename).toLowerCase();

    // Set appropriate content type
    let contentType = "application/octet-stream";
    const mimeTypes = {
      // Images
      ".jpg": "image/jpeg",
      ".jpeg": "image/jpeg",
      ".png": "image/png",
      ".gif": "image/gif",
      ".bmp": "image/bmp",
      ".webp": "image/webp",
      ".svg": "image/svg+xml",
      
      // Videos
      ".mp4": "video/mp4",
      ".avi": "video/x-msvideo",
      ".mov": "video/quicktime",
      ".webm": "video/webm",
      
      // Audio
      ".mp3": "audio/mpeg",
      ".wav": "audio/wav",
      ".ogg": "audio/ogg",
      ".m4a": "audio/mp4",
      
      // Documents
      ".pdf": "application/pdf",
      ".doc": "application/msword",
      ".docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      ".txt": "text/plain",
      ".json": "application/json",
      ".xml": "application/xml",
      ".html": "text/html",
      ".css": "text/css",
    };

    if (mimeTypes[fileExtension]) {
      contentType = mimeTypes[fileExtension];
    }

    // Set headers
    res.setHeader("Content-Type", contentType);
    res.setHeader("Content-Length", stats.size);
    res.setHeader("Access-Control-Allow-Origin", "*");

    // Stream the file
    const fileStream = fs.createReadStream(filePath);
    fileStream.pipe(res);
  } catch (error) {
    res.status(500).json({ message: "Failed to serve file" });
  }
});

export default router;