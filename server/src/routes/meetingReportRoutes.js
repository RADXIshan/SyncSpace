import express from "express";
import { authenticateToken } from "../middleware/auth.js";
import sql from "../database/db.js";
import {
  createMeetingReport,
  getChannelMeetingReports,
  getOrgMeetingReports,
  getMeetingReport,
  updateMeetingReport,
  deleteMeetingReport,
} from "../controllers/meetingReportControllers.js";

const router = express.Router();

// Apply authentication middleware to all routes
router.use(authenticateToken);

// Meeting report routes
router.post("/", createMeetingReport);
router.get("/channel/:channelId", getChannelMeetingReports);
router.get("/organization/:orgId", getOrgMeetingReports);
router.get("/:reportId", getMeetingReport);
router.put("/:reportId", updateMeetingReport);
router.delete("/:reportId", deleteMeetingReport);

export default router;