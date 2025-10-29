import express from "express";
import multer from "multer";
import { authenticateToken } from "../middleware/auth.js";
import {
  getMeetingMessages,
  sendMeetingMessage,
  updateMeetingMessage,
  deleteMeetingMessage,
  uploadMeetingFile,
  addMeetingReaction,
} from "../controllers/meetingChatControllers.js";

const router = express.Router();

// Configure multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    // Allow most file types except dangerous executables
    const dangerousExtensions = [
      'exe', 'bat', 'cmd', 'scr', 'pif', 'com', 'vbs', 'jar', 'app', 'deb', 'pkg', 'dmg',
      'msi', 'run', 'bin', 'sh', 'ps1', 'psm1', 'psd1', 'ps1xml', 'psc1', 'psc2',
      'msh', 'msh1', 'msh2', 'mshxml', 'msh1xml', 'msh2xml'
    ];
    
    const extension = file.originalname.split('.').pop()?.toLowerCase();
    if (dangerousExtensions.includes(extension)) {
      return cb(new Error('File type not allowed for security reasons'), false);
    }
    
    cb(null, true);
  },
});

// Meeting chat message routes
router.get("/:roomId/messages", authenticateToken, getMeetingMessages);
router.post("/messages", authenticateToken, sendMeetingMessage);
router.put("/messages/:messageId", authenticateToken, updateMeetingMessage);
router.delete("/messages/:messageId", authenticateToken, deleteMeetingMessage);

// File upload route
router.post("/messages/file", authenticateToken, upload.single("file"), uploadMeetingFile);

// Reaction routes
router.post("/messages/:messageId/reactions", authenticateToken, addMeetingReaction);

// Serve local meeting files
router.get("/files/meeting/:filename", async (req, res) => {
  try {
    let { filename } = req.params;
    
    // Security: Prevent directory traversal
    filename = filename.replace(/\.\./g, '').replace(/\//g, '');
    
    const path = await import("path");
    const fs = await import("fs");
    
    const filePath = path.join(process.cwd(), "uploads", "meeting-files", filename);
    
    // Check if file exists
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ message: "File not found" });
    }
    
    // Get file stats for proper headers
    const stats = fs.statSync(filePath);
    
    // Set appropriate headers
    res.setHeader('Content-Length', stats.size);
    res.setHeader('Cache-Control', 'public, max-age=31536000'); // Cache for 1 year
    
    // Try to determine content type from file extension
    const ext = path.extname(filename).toLowerCase();
    const mimeTypes = {
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.gif': 'image/gif',
      '.pdf': 'application/pdf',
      '.txt': 'text/plain',
      '.mp4': 'video/mp4',
      '.mp3': 'audio/mpeg',
      '.zip': 'application/zip',
      '.doc': 'application/msword',
      '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    };
    
    const contentType = mimeTypes[ext] || 'application/octet-stream';
    res.setHeader('Content-Type', contentType);
    
    // For downloads, set Content-Disposition header
    if (!contentType.startsWith('image/') && !contentType.startsWith('video/') && !contentType.startsWith('audio/')) {
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    }
    
    // Stream the file
    const fileStream = fs.createReadStream(filePath);
    fileStream.pipe(res);
    
    fileStream.on('error', (error) => {
      console.error('Error streaming meeting file:', error);
      if (!res.headersSent) {
        res.status(500).json({ message: "Error serving file" });
      }
    });
    
  } catch (error) {
    console.error("Error serving meeting file:", error);
    res.status(500).json({ message: "Error serving file" });
  }
});

export default router;