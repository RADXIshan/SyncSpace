import { Router } from "express";
import {
  createOrganization,
  getOrganization,
  joinOrganization,
  leaveOrganization,
  getUserRole,
  updateOrganization,
  sendInvitations,
  getOrganizationMembers,
  updateMemberRole,
  removeMember,
  deleteOrganization,
  transferOwnership,
  getChannel,
  updateChannel,
  deleteChannel,
} from "../controllers/orgControllers.js";

const router = Router();

router.post("/create", createOrganization);
router.post("/join", joinOrganization);
router.post("/leave", leaveOrganization);
router.post("/:org_id/invite", sendInvitations);
router.get("/:org_id", getOrganization);
router.get("/:org_id/role", getUserRole);
router.get("/:org_id/members", getOrganizationMembers);
router.put("/:org_id", updateOrganization);
router.put("/:org_id/members/:member_id/role", updateMemberRole);
router.delete("/:org_id/members/:member_id", removeMember);
router.delete("/:org_id", deleteOrganization);
router.post("/:org_id/transfer-ownership", transferOwnership);

router.get("/:org_id/channels/:channel_id", getChannel);
router.put("/:org_id/channels/:channel_id", updateChannel);
router.delete("/:org_id/channels/:channel_id", deleteChannel);

export default router;
