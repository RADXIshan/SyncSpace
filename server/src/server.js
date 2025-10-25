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
import { setupSocketHandlers } from "./configs/socket.js";

dotenv.config();

const app = express();
const server = createServer(app);

const PORT = process.env.PORT || 3000;

// Configure CORS for both Express and Socket.IO
const corsOptions = {
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true
};

app.use(cors(corsOptions));

// Initialize Socket.IO with CORS
const io = new Server(server, {
  cors: corsOptions
});

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// Make io available to routes
app.set('io', io);

app.use("/api/auth", authRoutes);
app.use("/api/events", eventRoutes);
app.use("/api/orgs", orgRoutes);
app.use("/api/notes", noteRoutes);
app.use("/api/notices", noticeRoutes);
app.use("/api/meetings", meetingRoutes);
app.use("/api/users", userRoutes);

connectCloudinary();

// Setup Socket.IO handlers
setupSocketHandlers(io);

app.get("/", (_, res) => {
    res.json({ message: "Server is live!" });
})

server.listen(PORT, () => {
    console.log(`Server started on http://localhost:${PORT}`);
})

export default app;