import { Router } from "express";
import sql from "../database/db.js";
import { authenticateToken } from "../middleware/auth.js";
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
router.get("/user/organizations", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    
    const orgs = await sql`
      SELECT 
        o.org_id,
        o.org_name,
        o.created_by,
        om.role,
        om.joined_at,
        (SELECT COUNT(*) FROM org_members WHERE org_id = o.org_id) as member_count,
        (SELECT COUNT(*) FROM org_channels WHERE org_id = o.org_id) as channel_count
      FROM organisations o
      JOIN org_members om ON o.org_id = om.org_id
      WHERE om.user_id = ${userId}
      ORDER BY om.joined_at DESC
    `;
    
    res.json({ organizations: orgs });
  } catch (error) {
    console.error('Error fetching user organizations:', error);
    res.status(500).json({ message: 'Failed to fetch organizations' });
  }
});
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
