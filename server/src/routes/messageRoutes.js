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

// File viewer proxy (for viewing files like PDFs in browser)
router.get("/files/view", async (req, res) => {
  try {
    const { url, filename } = req.query;
    
    if (!url) {
      return res.status(400).json({ message: "File URL is required" });
    }

    console.log(`View request for: ${url}, filename: ${filename}`);

    // For Cloudinary URLs, modify for inline viewing
    let fetchUrl = url;
    
    if (url.includes('cloudinary.com') && url.includes('/raw/')) {
      // Remove fl_attachment flag and add fl_inline for viewing
      fetchUrl = url.replace(/fl_attachment[,/]?/g, '');
      const urlParts = fetchUrl.split('/upload/');
      if (urlParts.length === 2) {
        fetchUrl = `${urlParts[0]}/upload/fl_inline/${urlParts[1]}`;
      }
    }

    console.log(`Fetching for view from: ${fetchUrl}`);

    const response = await fetch(fetchUrl, {
      method: 'GET',
      headers: {
        'User-Agent': 'SyncSpace-FileProxy/1.0',
        'Accept': '*/*',
      },
    });
    
    if (!response.ok) {
      console.error(`Fetch failed with status: ${response.status} ${response.statusText}`);
      return res.status(response.status).json({ 
        message: `Failed to fetch file: ${response.status} ${response.statusText}` 
      });
    }

    const contentType = response.headers.get('content-type') || 'application/octet-stream';
    const contentLength = response.headers.get('content-length');
    
    console.log(`File fetched for viewing. Content-Type: ${contentType}, Content-Length: ${contentLength}`);
    
    // Set headers for inline viewing
    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', `inline; filename="${filename || 'file'}"`);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Content-Disposition');
    res.setHeader('Access-Control-Expose-Headers', 'Content-Disposition');
    
    if (contentLength) {
      res.setHeader('Content-Length', contentLength);
    }
    
    const buffer = await response.arrayBuffer();
    res.send(Buffer.from(buffer));
    
  } catch (error) {
    console.error('View proxy error:', error);
    res.status(500).json({ message: `Failed to view file: ${error.message}` });
  }
});

// File download proxy
router.get("/files/download", async (req, res) => {
  try {
    const { url, filename } = req.query;
    
    if (!url) {
      return res.status(400).json({ message: "File URL is required" });
    }

    console.log(`Download request for: ${url}, filename: ${filename}`);

    // For Cloudinary URLs, we might need to modify them for better access
    let fetchUrl = url;
    
    // If it's a Cloudinary raw file, ensure it has the right flags for download
    if (url.includes('cloudinary.com') && url.includes('/raw/')) {
      // Add fl_attachment flag if not present to force download behavior
      if (!url.includes('fl_attachment')) {
        const urlParts = url.split('/upload/');
        if (urlParts.length === 2) {
          fetchUrl = `${urlParts[0]}/upload/fl_attachment/${urlParts[1]}`;
        }
      }
    }

    console.log(`Fetching from: ${fetchUrl}`);

    // Fetch the file from Cloudinary with proper headers
    const response = await fetch(fetchUrl, {
      method: 'GET',
      headers: {
        'User-Agent': 'SyncSpace-FileProxy/1.0',
        'Accept': '*/*',
      },
    });
    
    if (!response.ok) {
      console.error(`Fetch failed with status: ${response.status} ${response.statusText}`);
      return res.status(response.status).json({ 
        message: `Failed to fetch file: ${response.status} ${response.statusText}` 
      });
    }

    // Get the content type from the original response
    const contentType = response.headers.get('content-type') || 'application/octet-stream';
    const contentLength = response.headers.get('content-length');
    
    console.log(`File fetched successfully. Content-Type: ${contentType}, Content-Length: ${contentLength}`);
    
    // Set appropriate headers for download
    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', `attachment; filename="${filename || 'download'}"`);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Content-Disposition');
    res.setHeader('Access-Control-Expose-Headers', 'Content-Disposition');
    
    if (contentLength) {
      res.setHeader('Content-Length', contentLength);
    }
    
    // Stream the file to the client
    const buffer = await response.arrayBuffer();
    res.send(Buffer.from(buffer));
    
  } catch (error) {
    console.error('Download proxy error:', error);
    res.status(500).json({ message: `Failed to download file: ${error.message}` });
  }
});

export default router;