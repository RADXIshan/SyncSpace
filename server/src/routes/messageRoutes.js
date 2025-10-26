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
    files: 1, // Only allow 1 file per request
  },
  fileFilter: (req, file, cb) => {
    // Check for dangerous file types
    const dangerousExtensions = ['exe', 'bat', 'cmd', 'scr', 'pif', 'com', 'vbs', 'js'];
    const extension = file.originalname.split('.').pop()?.toLowerCase();
    
    if (dangerousExtensions.includes(extension)) {
      return cb(new Error('File type not allowed for security reasons'), false);
    }

    // Check file size
    if (file.size > 10 * 1024 * 1024) {
      return cb(new Error('File too large'), false);
    }

    // Allow all other file types
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

// File upload with error handling
router.post("/messages/file", (req, res, next) => {
  upload.single("file")(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ message: 'File too large. Maximum size is 10MB.' });
      }
      if (err.code === 'LIMIT_FILE_COUNT') {
        return res.status(400).json({ message: 'Too many files. Only 1 file allowed per upload.' });
      }
      return res.status(400).json({ message: `Upload error: ${err.message}` });
    } else if (err) {
      return res.status(400).json({ message: err.message });
    }
    next();
  });
}, uploadFile);

// Reactions
router.post("/messages/:messageId/reactions", addReaction);

// Channel members (for mentions)
router.get("/channels/:channelId/members", getChannelMembers);

// File download proxy
router.get("/files/download", async (req, res) => {
  try {
    const { url, filename } = req.query;
    
    if (!url) {
      return res.status(400).json({ message: "File URL is required" });
    }

    // Fetch the file from Cloudinary
    const response = await fetch(url);
    
    if (!response.ok) {
      return res.status(response.status).json({ message: "Failed to fetch file" });
    }

    // Get the content type from the original response
    const contentType = response.headers.get('content-type') || 'application/octet-stream';
    
    // Set appropriate headers for download
    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', `attachment; filename="${filename || 'download'}"`);
    res.setHeader('Access-Control-Allow-Origin', '*');
    
    // Stream the file to the client
    const buffer = await response.arrayBuffer();
    res.send(Buffer.from(buffer));
    
  } catch (error) {
    console.error('Download proxy error:', error);
    res.status(500).json({ message: "Failed to download file" });
  }
});

export default router;