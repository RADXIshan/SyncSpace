import { Router } from "express";
import {
  createEvent,
  getEvents,
  updateEvent,
  deleteEvent,
  syncMeetingEventsForUser,
  syncMeetingEventsForOrg,
  createMeetingEventsForNewUser,
} from "../controllers/eventControllers.js";

const router = Router();

router.post("/", createEvent);
router.get("/", getEvents);
router.put("/:id", updateEvent);
router.delete("/:id", deleteEvent);

// Sync endpoints for handling permission changes
router.post("/sync-user", async (req, res) => {
  try {
    const { user_id, org_id } = req.body;
    if (!user_id || !org_id) {
      return res
        .status(400)
        .json({ message: "user_id and org_id are required" });
    }

    const result = await syncMeetingEventsForUser(user_id, org_id);
    res
      .status(200)
      .json({ message: "User meeting events synced successfully", ...result });
  } catch (error) {
    console.error("Error syncing user meeting events:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

router.post("/sync-org", async (req, res) => {
  try {
    const { org_id } = req.body;
    if (!org_id) {
      return res.status(400).json({ message: "org_id is required" });
    }

    const result = await syncMeetingEventsForOrg(org_id);
    res.status(200).json({
      message: "Organization meeting events synced successfully",
      ...result,
    });
  } catch (error) {
    console.error("Error syncing organization meeting events:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

router.post("/new-user", async (req, res) => {
  try {
    const { user_id, org_id } = req.body;
    if (!user_id || !org_id) {
      return res
        .status(400)
        .json({ message: "user_id and org_id are required" });
    }

    const result = await createMeetingEventsForNewUser(user_id, org_id);
    res
      .status(200)
      .json({ message: "Meeting events created for new user", ...result });
  } catch (error) {
    console.error("Error creating meeting events for new user:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

export default router;
