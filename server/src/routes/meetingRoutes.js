import { Router } from "express";
import { createMeeting, getMeetings, getMeeting, updateMeeting, deleteMeeting } from "../controllers/meetingControllers.js";


const router = Router();

export default router;