import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import authRoutes from "./routes/authRoutes.js";

dotenv.config();

const app = express();

const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use("/api/auth", authRoutes);

app.get("/", (_, res) => {
    res.json({ message: "Server is live!" });
})

app.listen(PORT, () => {
    console.log(`Server started on http://localhost:${PORT}`);
})