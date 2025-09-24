import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import authRoutes from "./routes/authRoutes.js";

dotenv.config();

const app = express();

const PORT = process.env.PORT || 3000;

app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173', // your frontend URL
  credentials: true
}));

// Increase payload size limit to handle base64 images (up to 10 MB)
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());
app.use("/api/auth", authRoutes);

app.get("/", (_, res) => {
    res.json({ message: "Server is live!" });
})

app.listen(PORT, () => {
    console.log(`Server started on http://localhost:${PORT}`);
})