import { Router } from "express";
import { 
  createMeeting, 
  getMeetings, 
  updateMeeting, 
  deleteMeeting, 
  startMeeting 
} from "../controllers/meetingControllers.js";

const router = Router();

router.post("/", createMeeting);                    
router.get("/", getMeetings);                     
router.put("/:meeting_id", updateMeeting);          
router.delete("/:meeting_id", deleteMeeting);       
router.patch("/:meeting_id/start", startMeeting);  

export default router;