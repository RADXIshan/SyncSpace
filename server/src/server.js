import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import { createServer } from "http";
import { Server } from "socket.io";
import authRoutes from "./routes/authRoutes.js";
import connectCloudinary from "./configs/cloudinary.js";
import eventRoutes from "./routes/eventRoutes.js";
import orgRoutes from "./routes/orgRoutes.js";
import noteRoutes from "./routes/noteRoutes.js";
import noticeRoutes from "./routes/noticeRoutes.js";
import meetingRoutes from "./routes/meetingRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import notificationRoutes from "./routes/notificationRoutes.js";
import messageRoutes from "./routes/messageRoutes.js";
import directMessageRoutes from "./routes/directMessageRoutes.js";
import meetingChatRoutes from "./routes/meetingChatRoutes.js";
import { setupSocketHandlers } from "./configs/socket.js";
import sql from "./database/db.js";
import fs from "fs";
import path from "path";

// Load environment variables with explicit path
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load .env from the server root directory
dotenv.config({ path: join(__dirname, "../.env") });

// Create uploads directories if they don't exist
const uploadsDir = path.join(process.cwd(), "uploads", "chat-files");
const dmUploadsDir = path.join(process.cwd(), "uploads", "direct-messages");
const meetingUploadsDir = path.join(process.cwd(), "uploads", "meeting-files");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}
if (!fs.existsSync(dmUploadsDir)) {
  fs.mkdirSync(dmUploadsDir, { recursive: true });
}
if (!fs.existsSync(meetingUploadsDir)) {
  fs.mkdirSync(meetingUploadsDir, { recursive: true });
}

const app = express();
const server = createServer(app);

const PORT = process.env.PORT || 3000;

// Configure CORS for both Express and Socket.IO
const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:3000",
  "https://syncspace-client.vercel.app",
  process.env.CLIENT_URL,
].filter(Boolean); // Remove any undefined values

const corsOptions = {
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);

    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      console.log("CORS blocked origin:", origin);
      console.log("Allowed origins:", allowedOrigins);
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: [
    "Content-Type",
    "Authorization",
    "X-Requested-With",
    "Accept",
  ],
  exposedHeaders: ["Set-Cookie"],
  preflightContinue: false,
  optionsSuccessStatus: 200,
};

app.use(cors(corsOptions));

// Handle preflight requests
app.options("*", cors(corsOptions));

// Initialize Socket.IO with production-ready configuration
const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  },
  transports: ["websocket", "polling"],
  allowEIO3: true,
  pingTimeout: 60000,
  pingInterval: 25000,
});

// Add request timeout middleware for production reliability
app.use((req, res, next) => {
  req.setTimeout(30000, () => {
    if (!res.headersSent) {
      res.status(408).json({ message: "Request timeout" });
    }
  });

  res.setTimeout(30000, () => {
    if (!res.headersSent) {
      res.status(408).json({ message: "Response timeout" });
    }
  });

  next();
});

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
app.use(cookieParser());

// Make io available to routes
app.set("io", io);

app.use("/api/auth", authRoutes);
app.use("/api/events", eventRoutes);
app.use("/api/orgs", orgRoutes);
app.use("/api/notes", noteRoutes);
app.use("/api/notices", noticeRoutes);
app.use("/api/meetings", meetingRoutes);
app.use("/api/meeting-chat", meetingChatRoutes);
app.use("/api/users", userRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api", messageRoutes);
app.use("/api/direct-messages", directMessageRoutes);

// Debug endpoint for organization issues
app.get("/debug/org/:org_id", async (req, res) => {
  try {
    const { org_id } = req.params;

    // Check if organization exists
    const org = await sql`SELECT * FROM organisations WHERE org_id = ${org_id}`;

    // Check members
    const members =
      await sql`SELECT * FROM org_members WHERE org_id = ${org_id}`;

    // Check roles
    const roles = await sql`SELECT * FROM org_roles WHERE org_id = ${org_id}`;

    // Check channels
    const channels =
      await sql`SELECT * FROM org_channels WHERE org_id = ${org_id}`;

    res.json({
      org_id,
      organization: org[0] || null,
      members_count: members.length,
      roles_count: roles.length,
      channels_count: channels.length,
      members: members.map((m) => ({ user_id: m.user_id, role: m.role })),
      roles: roles.map((r) => ({ role_name: r.role_name })),
      channels: channels.map((c) => ({ channel_name: c.channel_name })),
    });
  } catch (error) {
    console.error("Debug endpoint error:", error);
    res.status(500).json({ error: error.message, stack: error.stack });
  }
});

// Test endpoint for PUT requests
app.put("/debug/test", (req, res) => {
  console.log("PUT request received:", {
    headers: req.headers,
    body: req.body,
    cookies: req.cookies,
  });

  res.json({
    message: "PUT request successful",
    receivedData: req.body,
    hasAuth: !!req.headers.authorization,
    hasCookie: !!req.cookies.jwt,
  });
});

// Meeting Chat Migration endpoint
app.post("/debug/migrate-meeting-chat", async (req, res) => {
  try {
    // Define migration SQL inline
    const migrationSQL = `
      -- Create meeting messages table
      CREATE TABLE IF NOT EXISTS meeting_messages (
          message_id SERIAL PRIMARY KEY,
          room_id VARCHAR(255) NOT NULL,
          user_id INTEGER NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
          content TEXT,
          file_url TEXT,
          file_name TEXT,
          file_type TEXT,
          file_size BIGINT,
          reply_to INTEGER REFERENCES meeting_messages(message_id) ON DELETE SET NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      -- Create meeting message reactions table
      CREATE TABLE IF NOT EXISTS meeting_message_reactions (
          reaction_id SERIAL PRIMARY KEY,
          message_id INTEGER NOT NULL REFERENCES meeting_messages(message_id) ON DELETE CASCADE,
          user_id INTEGER NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
          emoji VARCHAR(10) NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          UNIQUE(message_id, user_id, emoji)
      );

      -- Create indexes for better performance
      CREATE INDEX IF NOT EXISTS idx_meeting_messages_room_id ON meeting_messages(room_id);
      CREATE INDEX IF NOT EXISTS idx_meeting_messages_user_id ON meeting_messages(user_id);
      CREATE INDEX IF NOT EXISTS idx_meeting_messages_created_at ON meeting_messages(created_at);
      CREATE INDEX IF NOT EXISTS idx_meeting_message_reactions_message_id ON meeting_message_reactions(message_id);

      -- Create trigger function for updated_at
      CREATE OR REPLACE FUNCTION update_meeting_message_updated_at()
      RETURNS TRIGGER AS $
      BEGIN
          NEW.updated_at = CURRENT_TIMESTAMP;
          RETURN NEW;
      END;
      $ language 'plpgsql';

      -- Create trigger
      DROP TRIGGER IF EXISTS update_meeting_message_updated_at ON meeting_messages;
      CREATE TRIGGER update_meeting_message_updated_at
          BEFORE UPDATE ON meeting_messages
          FOR EACH ROW
          EXECUTE FUNCTION update_meeting_message_updated_at();
    `;

    // Split by semicolon and execute each statement
    const statements = migrationSQL
      .split(";")
      .map((stmt) => stmt.trim())
      .filter((stmt) => stmt.length > 0);

    for (const statement of statements) {
      if (statement.trim()) {
        await sql.unsafe(statement);
      }
    }

    res.json({ message: "Meeting chat migration completed successfully!" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

connectCloudinary();

// Setup Socket.IO handlers
setupSocketHandlers(io);

app.get("/", (_, res) => {
  res.json({ message: "Server is live!" });
});

// Health check endpoint
app.get("/health", async (_, res) => {
  try {
    // Test database connection
    const result = await sql`SELECT 1 as test`;
    res.json({
      status: "healthy",
      database: "connected",
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Health check failed:", error);
    res.status(500).json({
      status: "unhealthy",
      database: "disconnected",
      error: error.message,
      timestamp: new Date().toISOString(),
    });
  }
});

server.listen(PORT, () => {
  console.log(`Server started on http://localhost:${PORT}`);
});

export default app;
export { io };
