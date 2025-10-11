import { Router } from "express";
import {
  createOrganization,
  getUserOrganizations,
  getOrganizationDetails,
  joinOrganizationByCode,
  updateOrganization,
  deleteOrganization,
  addChannel,
  removeChannel,
  addRole,
  updateRole,
  removeRole
} from "../controllers/orgControllers.js";

const router = Router();

// Create a new organization
router.post("/create", createOrganization);

// Get user's organizations
router.get("/my-organizations", getUserOrganizations);

// Get organization details by ID
router.get("/:orgId", getOrganizationDetails);

// Join organization by code
router.post("/join", joinOrganizationByCode);

// Update organization (admin only)
router.put("/:orgId", updateOrganization);

// Delete organization (admin only)
router.delete("/:orgId", deleteOrganization);

// Channel management routes
router.post("/:orgId/channels", addChannel);
router.delete("/:orgId/channels/:channelId", removeChannel);

// Role management routes
router.post("/:orgId/roles", addRole);
router.put("/:orgId/roles/:roleId", updateRole);
router.delete("/:orgId/roles/:roleId", removeRole);

export default router;