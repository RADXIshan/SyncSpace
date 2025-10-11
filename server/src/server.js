import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import authRoutes from "./routes/authRoutes.js";
import connectCloudinary from "./configs/cloudinary.js";
import eventRoutes from "./routes/eventRoutes.js";
import orgRoutes from "./routes/orgRoutes.js";

dotenv.config();

const app = express();

const PORT = process.env.PORT || 3000;

app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());
app.use("/api/auth", authRoutes);
app.use("/api/events", eventRoutes);
app.use("/api/orgs", orgRoutes);

connectCloudinary();

app.get("/", (_, res) => {
    res.json({ message: "Server is live!" });
})

app.listen(PORT, () => {
    console.log(`Server started on http://localhost:${PORT}`);
})
