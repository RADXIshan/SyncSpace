import { Router } from "express";
import {
  createOrganization,
  getOrganization,
  joinOrganization,
  leaveOrganization,
  getUserRole,
  updateOrganization,
  sendInvitations,
} from "../controllers/orgControllers.js";

const router = Router();

router.post("/create", createOrganization);
router.post("/join", joinOrganization);
router.post("/leave", leaveOrganization);
router.post("/:org_id/invite", sendInvitations);
router.get("/:org_id", getOrganization);
router.get("/:org_id/role", getUserRole);
router.put("/:org_id", updateOrganization);

export default router;
