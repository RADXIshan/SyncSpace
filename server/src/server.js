import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
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
import { setupSocketHandlers } from "./configs/socket.js";
import sql from "./database/db.js";

dotenv.config();

const app = express();
const server = createServer(app);

const PORT = process.env.PORT || 3000;

// Configure CORS for both Express and Socket.IO
const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:3000",
  "https://syncspace-client.vercel.app",
  process.env.CLIENT_URL
].filter(Boolean); // Remove any undefined values

const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      console.log("CORS blocked origin:", origin);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
  exposedHeaders: ["Set-Cookie"],
};

app.use(cors(corsOptions));

// Handle preflight requests
app.options('*', cors(corsOptions));

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
app.use("/api/users", userRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api", messageRoutes);

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

// Migration endpoint
app.post("/debug/migrate", async (req, res) => {
  try {
    console.log('Running chat tables migration...');
    
    // Read migration file
    const fs = await import('fs');
    const path = await import('path');
    const { fileURLToPath } = await import('url');
    
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);
    
    const migrationPath = path.join(__dirname, 'database', 'create_chat_tables.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    
    // Split by semicolon and execute each statement
    const statements = migrationSQL
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0);
    
    for (const statement of statements) {
      await sql.unsafe(statement);
      console.log('✓ Executed statement');
    }
    
    console.log('✅ Migration completed successfully!');
    res.json({ message: 'Migration completed successfully!' });
  } catch (error) {
    console.error('❌ Migration failed:', error);
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
