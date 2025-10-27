import { Router } from "express";
import multer from "multer";
import {
  getChannelMessages,
  sendMessage,
  updateMessage,
  deleteMessage,
  uploadFile,
  addReaction,
  getChannelMembers,
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

// Message routes
router.get("/channels/:channelId/messages", getChannelMessages);
router.post("/messages", sendMessage);
router.put("/messages/:messageId", updateMessage);
router.delete("/messages/:messageId", deleteMessage);

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
  uploadFile
);

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

    // Check if it's a local file URL
    if (url.includes("/api/files/local/")) {
      const localFilename = url.split("/api/files/local/")[1];
      const path = await import("path");
      const fs = await import("fs");

      // Security check
      if (
        localFilename.includes("..") ||
        localFilename.includes("/") ||
        localFilename.includes("\\")
      ) {
        return res.status(400).json({ message: "Invalid filename" });
      }

      const filePath = path.join(
        process.cwd(),
        "uploads",
        "chat-files",
        localFilename
      );

      if (!fs.existsSync(filePath)) {
        return res.status(404).json({ message: "File not found" });
      }

      const stats = fs.statSync(filePath);
      const fileExtension = path.extname(localFilename).toLowerCase();

      let contentType = "application/octet-stream";
      const mimeTypes = {
        ".pdf": "application/pdf",
        ".jpg": "image/jpeg",
        ".jpeg": "image/jpeg",
        ".png": "image/png",
        ".gif": "image/gif",
        ".txt": "text/plain",
      };

      if (mimeTypes[fileExtension]) {
        contentType = mimeTypes[fileExtension];
      }

      res.setHeader("Content-Type", contentType);
      res.setHeader(
        "Content-Disposition",
        `inline; filename="${filename || localFilename}"`
      );
      res.setHeader("Content-Length", stats.size);
      res.setHeader("Access-Control-Allow-Origin", "*");

      const fileStream = fs.createReadStream(filePath);
      fileStream.pipe(res);
      return;
    }

    // Try multiple approaches for Cloudinary URLs
    const urlsToTry = [url]; // Start with original URL

    // If it's a Cloudinary URL, add variations
    if (url.includes("cloudinary.com")) {
      // Try with fl_inline flag for viewing
      const urlParts = url.split("/upload/");
      if (urlParts.length === 2) {
        const cleanUrl = url.replace(/\/fl_[^/]+/g, "");
        urlsToTry.push(
          `${urlParts[0]}/upload/fl_inline/${urlParts[1].replace(
            /^fl_[^/]+\//,
            ""
          )}`
        );
        urlsToTry.push(cleanUrl); // Clean URL without flags
      }
    }

    let lastError = null;

    // Try each URL variation
    for (const fetchUrl of urlsToTry) {
      try {
        const response = await fetch(fetchUrl, {
          method: "GET",
          headers: {
            "User-Agent": "SyncSpace-FileProxy/1.0",
            Accept: "*/*",
            Referer: process.env.FRONTEND_URL || "http://localhost:5173",
          },
        });

        if (response.ok) {
          const contentType =
            response.headers.get("content-type") || "application/octet-stream";
          const contentLength = response.headers.get("content-length");

          // Set headers for inline viewing
          res.setHeader("Content-Type", contentType);
          res.setHeader(
            "Content-Disposition",
            `inline; filename="${filename || "file"}"`
          );
          res.setHeader("Access-Control-Allow-Origin", "*");
          res.setHeader(
            "Access-Control-Allow-Headers",
            "Content-Type, Content-Disposition"
          );
          res.setHeader("Access-Control-Expose-Headers", "Content-Disposition");

          if (contentLength) {
            res.setHeader("Content-Length", contentLength);
          }

          const buffer = await response.arrayBuffer();
          res.send(Buffer.from(buffer));
          return; // Success, exit the function
        } else {
          lastError = new Error(
            `HTTP ${response.status}: ${response.statusText}`
          );
        }
      } catch (error) {
        lastError = error;
      }
    }

    // If we get here, all URLs failed
    return res.status(500).json({
      message: `Failed to view file: ${lastError?.message || "Unknown error"}`,
    });
  } catch (error) {
    res.status(500).json({ message: `Failed to view file: ${error.message}` });
  }
});

// Serve local files
router.get("/files/local/:filename", async (req, res) => {
  try {
    let { filename } = req.params;
    const path = await import("path");
    const fs = await import("fs");

    console.log(`[FILE SERVE] Requested filename: ${filename}`);

    // Decode the filename in case it's URL encoded
    filename = decodeURIComponent(filename);
    console.log(`[FILE SERVE] Decoded filename: ${filename}`);

    // Security check - prevent directory traversal
    if (
      filename.includes("..") ||
      filename.includes("/") ||
      filename.includes("\\")
    ) {
      console.log(`[FILE SERVE] Invalid filename rejected: ${filename}`);
      return res.status(400).json({ message: "Invalid filename" });
    }

    const filePath = path.join(
      process.cwd(),
      "uploads",
      "chat-files",
      filename
    );

    console.log(`[FILE SERVE] Looking for file at: ${filePath}`);

    // Check if file exists
    if (!fs.existsSync(filePath)) {
      console.log(`[FILE SERVE] File not found: ${filePath}`);
      
      // List files in directory for debugging
      const uploadsDir = path.join(process.cwd(), "uploads", "chat-files");
      if (fs.existsSync(uploadsDir)) {
        const files = fs.readdirSync(uploadsDir);
        console.log(`[FILE SERVE] Available files in directory:`, files);
        
        // Try to find a file that matches the pattern (in case of encoding issues)
        const matchingFile = files.find(f => 
          f.includes(filename) || 
          filename.includes(f) ||
          decodeURIComponent(f) === filename ||
          f === decodeURIComponent(filename)
        );
        
        if (matchingFile) {
          console.log(`[FILE SERVE] Found matching file: ${matchingFile}`);
          const matchingFilePath = path.join(uploadsDir, matchingFile);
          if (fs.existsSync(matchingFilePath)) {
            filename = matchingFile;
            // Update filePath to use the matching file
            const correctedFilePath = path.join(uploadsDir, filename);
            console.log(`[FILE SERVE] Using corrected path: ${correctedFilePath}`);
          }
        }
      } else {
        console.log(`[FILE SERVE] Uploads directory does not exist: ${uploadsDir}`);
      }
      
      // Final check with corrected filename
      const finalFilePath = path.join(process.cwd(), "uploads", "chat-files", filename);
      if (!fs.existsSync(finalFilePath)) {
        return res.status(404).json({ message: "File not found" });
      }
    }

    // Use the final corrected file path
    const correctedFilePath = path.join(process.cwd(), "uploads", "chat-files", filename);
    
    // Get file stats
    const stats = fs.statSync(correctedFilePath);
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
      ".ico": "image/x-icon",
      ".tiff": "image/tiff",
      ".tif": "image/tiff",
      
      // Videos
      ".mp4": "video/mp4",
      ".avi": "video/x-msvideo",
      ".mov": "video/quicktime",
      ".wmv": "video/x-ms-wmv",
      ".flv": "video/x-flv",
      ".webm": "video/webm",
      ".mkv": "video/x-matroska",
      ".m4v": "video/x-m4v",
      
      // Audio
      ".mp3": "audio/mpeg",
      ".wav": "audio/wav",
      ".ogg": "audio/ogg",
      ".m4a": "audio/mp4",
      ".aac": "audio/aac",
      ".flac": "audio/flac",
      ".wma": "audio/x-ms-wma",
      
      // Documents
      ".pdf": "application/pdf",
      ".doc": "application/msword",
      ".docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      ".xls": "application/vnd.ms-excel",
      ".xlsx": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      ".ppt": "application/vnd.ms-powerpoint",
      ".pptx": "application/vnd.openxmlformats-officedocument.presentationml.presentation",
      ".odt": "application/vnd.oasis.opendocument.text",
      ".ods": "application/vnd.oasis.opendocument.spreadsheet",
      ".odp": "application/vnd.oasis.opendocument.presentation",
      
      // Text files
      ".txt": "text/plain",
      ".rtf": "application/rtf",
      ".csv": "text/csv",
      ".json": "application/json",
      ".xml": "application/xml",
      ".html": "text/html",
      ".htm": "text/html",
      ".css": "text/css",
      ".js": "application/javascript",
      ".md": "text/markdown",
      
      // Archives
      ".zip": "application/zip",
      ".rar": "application/vnd.rar",
      ".7z": "application/x-7z-compressed",
      ".tar": "application/x-tar",
      ".gz": "application/gzip",
      ".bz2": "application/x-bzip2",
      
      // Other common formats
      ".eps": "application/postscript",
      ".ai": "application/postscript",
      ".psd": "image/vnd.adobe.photoshop",
      ".sketch": "application/x-sketch",
      ".fig": "application/x-figma",
    };

    if (mimeTypes[fileExtension]) {
      contentType = mimeTypes[fileExtension];
    }

    // Set headers
    res.setHeader("Content-Type", contentType);
    res.setHeader("Content-Length", stats.size);
    res.setHeader("Access-Control-Allow-Origin", "*");

    // Stream the file
    const fileStream = fs.createReadStream(correctedFilePath);
    fileStream.pipe(res);
  } catch (error) {
    res.status(500).json({ message: "Failed to serve file" });
  }
});


// File download proxy
router.get("/files/download", async (req, res) => {
  try {
    const { url, filename } = req.query;

    if (!url) {
      return res.status(400).json({ message: "File URL is required" });
    }

    // Check if it's a local file URL
    if (url.includes("/api/files/local/")) {
      const localFilename = url.split("/api/files/local/")[1];
      const path = await import("path");
      const fs = await import("fs");

      // Security check
      if (
        localFilename.includes("..") ||
        localFilename.includes("/") ||
        localFilename.includes("\\")
      ) {
        return res.status(400).json({ message: "Invalid filename" });
      }

      const filePath = path.join(
        process.cwd(),
        "uploads",
        "chat-files",
        localFilename
      );

      if (!fs.existsSync(filePath)) {
        return res.status(404).json({ message: "File not found" });
      }

      const stats = fs.statSync(filePath);
      const fileExtension = path.extname(localFilename).toLowerCase();

      let contentType = "application/octet-stream";
      const mimeTypes = {
        ".pdf": "application/pdf",
        ".jpg": "image/jpeg",
        ".jpeg": "image/jpeg",
        ".png": "image/png",
        ".gif": "image/gif",
        ".txt": "text/plain",
      };

      if (mimeTypes[fileExtension]) {
        contentType = mimeTypes[fileExtension];
      }

      res.setHeader("Content-Type", contentType);
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="${filename || localFilename}"`
      );
      res.setHeader("Content-Length", stats.size);
      res.setHeader("Access-Control-Allow-Origin", "*");

      const fileStream = fs.createReadStream(filePath);
      fileStream.pipe(res);
      return;
    }

    // Try multiple approaches for Cloudinary URLs
    const urlsToTry = [url]; // Start with original URL

    // If it's a Cloudinary URL, add variations
    if (url.includes("cloudinary.com")) {
      // Try with fl_attachment flag
      if (!url.includes("fl_attachment")) {
        const urlParts = url.split("/upload/");
        if (urlParts.length === 2) {
          urlsToTry.push(`${urlParts[0]}/upload/fl_attachment/${urlParts[1]}`);
        }
      }

      // Try without any flags (clean URL)
      const cleanUrl = url.replace(/\/fl_[^/]+/g, "");
      if (cleanUrl !== url) {
        urlsToTry.push(cleanUrl);
      }
    }

    let lastError = null;

    // Try each URL variation
    for (const fetchUrl of urlsToTry) {
      try {
        const response = await fetch(fetchUrl, {
          method: "GET",
          headers: {
            "User-Agent": "SyncSpace-FileProxy/1.0",
            Accept: "*/*",
            Referer: process.env.FRONTEND_URL || "http://localhost:5173",
          },
        });

        if (response.ok) {
          // Success! Process the response
          const contentType =
            response.headers.get("content-type") || "application/octet-stream";
          const contentLength = response.headers.get("content-length");

          // Set appropriate headers for download
          res.setHeader("Content-Type", contentType);
          res.setHeader(
            "Content-Disposition",
            `attachment; filename="${filename || "download"}"`
          );
          res.setHeader("Access-Control-Allow-Origin", "*");
          res.setHeader(
            "Access-Control-Allow-Headers",
            "Content-Type, Content-Disposition"
          );
          res.setHeader("Access-Control-Expose-Headers", "Content-Disposition");

          if (contentLength) {
            res.setHeader("Content-Length", contentLength);
          }

          // Stream the file to the client
          const buffer = await response.arrayBuffer();
          res.send(Buffer.from(buffer));
          return; // Success, exit the function
        } else {
          lastError = new Error(
            `HTTP ${response.status}: ${response.statusText}`
          );
        }
      } catch (error) {
        lastError = error;
      }
    }

    // If we get here, all URLs failed
    return res.status(500).json({
      message: `Failed to download file: ${
        lastError?.message || "Unknown error"
      }`,
    });
  } catch (error) {
    res
      .status(500)
      .json({ message: `Failed to download file: ${error.message}` });
  }
});

// Test endpoint to check file access
router.get("/test/file/:filename", async (req, res) => {
  try {
    const { filename } = req.params;
    const path = await import("path");
    const fs = await import("fs");
    
    const filePath = path.join(process.cwd(), "uploads", "chat-files", filename);
    
    res.json({
      filename,
      filePath,
      exists: fs.existsSync(filePath),
      decodedFilename: decodeURIComponent(filename),
      cwd: process.cwd()
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Debug endpoint to list uploaded files
router.get("/debug/files", async (req, res) => {
  try {
    const path = await import("path");
    const fs = await import("fs");
    
    const uploadsDir = path.join(process.cwd(), "uploads", "chat-files");
    
    if (!fs.existsSync(uploadsDir)) {
      return res.json({ 
        message: "Uploads directory does not exist",
        path: uploadsDir,
        files: []
      });
    }
    
    const files = fs.readdirSync(uploadsDir);
    const fileDetails = files.map(file => {
      const filePath = path.join(uploadsDir, file);
      const stats = fs.statSync(filePath);
      return {
        name: file,
        size: stats.size,
        created: stats.birthtime,
        modified: stats.mtime
      };
    });
    
    res.json({
      uploadsDir,
      totalFiles: files.length,
      files: fileDetails
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
