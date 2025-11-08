import express from "express";
import { authenticateToken } from "../middleware/auth.js";
import { chatWithAI, generateMeetingSummaryController } from "../controllers/aiControllers.js";

const router = express.Router();

// Apply authentication middleware to all routes
router.use(authenticateToken);

// AI assistant routes
router.post("/chat", chatWithAI);
router.post("/generate-summary", generateMeetingSummaryController);

export default router;
