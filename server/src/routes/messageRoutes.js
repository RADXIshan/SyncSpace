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

    console.log(`View request for: ${url}, filename: ${filename}`);

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
        console.log(`Trying to fetch for view from: ${fetchUrl}`);

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

          console.log(
            `File fetched successfully for viewing from ${fetchUrl}. Content-Type: ${contentType}, Content-Length: ${contentLength}`
          );

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
          console.log(
            `Failed to fetch for view from ${fetchUrl}: ${response.status} ${response.statusText}`
          );
        }
      } catch (error) {
        lastError = error;
        console.log(`Error fetching for view from ${fetchUrl}:`, error.message);
      }
    }

    // If we get here, all URLs failed
    console.error("All view attempts failed. Last error:", lastError);
    return res.status(500).json({
      message: `Failed to view file: ${lastError?.message || "Unknown error"}`,
    });
  } catch (error) {
    console.error("View proxy error:", error);
    res.status(500).json({ message: `Failed to view file: ${error.message}` });
  }
});

// Serve local files
router.get("/files/local/:filename", async (req, res) => {
  try {
    const { filename } = req.params;
    const path = await import("path");
    const fs = await import("fs");

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
      "chat-files",
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
      ".pdf": "application/pdf",
      ".jpg": "image/jpeg",
      ".jpeg": "image/jpeg",
      ".png": "image/png",
      ".gif": "image/gif",
      ".txt": "text/plain",
      ".doc": "application/msword",
      ".docx":
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      ".xls": "application/vnd.ms-excel",
      ".xlsx":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
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
    console.error("Local file serving error:", error);
    res.status(500).json({ message: "Failed to serve file" });
  }
});

// Test endpoint to check if file URLs are accessible
router.get("/files/test", async (req, res) => {
  try {
    const { url } = req.query;

    if (!url) {
      return res.status(400).json({ message: "File URL is required" });
    }

    console.log(`Testing file access for: ${url}`);

    // Check if it's a local file
    if (url.includes("/api/files/local/")) {
      const localFilename = url.split("/api/files/local/")[1];
      const path = await import("path");
      const fs = await import("fs");

      const filePath = path.join(
        process.cwd(),
        "uploads",
        "chat-files",
        localFilename
      );
      const exists = fs.existsSync(filePath);

      if (exists) {
        const stats = fs.statSync(filePath);
        res.json({
          url,
          accessible: true,
          type: "local",
          size: stats.size,
          modified: stats.mtime,
        });
      } else {
        res.json({
          url,
          accessible: false,
          type: "local",
          error: "File not found on disk",
        });
      }
      return;
    }

    // For external URLs, try to fetch
    const response = await fetch(url, {
      method: "HEAD",
      headers: {
        "User-Agent": "SyncSpace-FileProxy/1.0",
      },
    });

    res.json({
      url,
      accessible: response.ok,
      type: "external",
      status: response.status,
      statusText: response.statusText,
      contentType: response.headers.get("content-type"),
      contentLength: response.headers.get("content-length"),
    });
  } catch (error) {
    console.error("File test error:", error);
    res.json({
      url: req.query.url,
      accessible: false,
      error: error.message,
    });
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
        console.log(`Trying to fetch from: ${fetchUrl}`);

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

          console.log(
            `File fetched successfully from ${fetchUrl}. Content-Type: ${contentType}, Content-Length: ${contentLength}`
          );

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
          console.log(
            `Failed to fetch from ${fetchUrl}: ${response.status} ${response.statusText}`
          );
        }
      } catch (error) {
        lastError = error;
        console.log(`Error fetching from ${fetchUrl}:`, error.message);
      }
    }

    // If we get here, all URLs failed
    console.error("All download attempts failed. Last error:", lastError);
    return res.status(500).json({
      message: `Failed to download file: ${
        lastError?.message || "Unknown error"
      }`,
    });
  } catch (error) {
    console.error("Download proxy error:", error);
    res
      .status(500)
      .json({ message: `Failed to download file: ${error.message}` });
  }
});

export default router;
