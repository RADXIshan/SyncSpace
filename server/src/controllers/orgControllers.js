import sql from "../database/db.js";
import jwt from "jsonwebtoken";

// Helper function to verify JWT token
const verifyToken = (req) => {
  const authToken = req.cookies.jwt || req.body.token || req.headers.authorization?.split(" ")[1];
  if (!authToken) {
    throw new Error("No token provided");
  }
  
  try {
    const decoded = jwt.verify(authToken, process.env.JWT_SECRET_KEY);
    return decoded.userId;
  } catch (error) {
    throw new Error("Invalid token");
  }
};

// Generate unique organization code
const generateOrgCode = () => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

// Create Organization
export const createOrganization = async (req, res) => {
  try {
    const userId = verifyToken(req);
    
    const {
      name,
      description,
      type,
      accessLevel,
      channels,
      roles
    } = req.body;

    // Validation
    if (!name?.trim()) {
      return res.status(400).json({ message: "Organization name is required" });
    }
    if (!description?.trim()) {
      return res.status(400).json({ message: "Organization description is required" });
    }

    // Generate unique organization code
    let orgCode;
    let isUnique = false;
    while (!isUnique) {
      orgCode = generateOrgCode();
      const existing = await sql`SELECT org_id FROM organizations WHERE org_code = ${orgCode}`;
      isUnique = existing.length === 0;
    }

    // Create organization
    const [newOrg] = await sql`
      INSERT INTO organizations (
        org_name, 
        org_description, 
        org_type, 
        access_level, 
        org_code, 
        created_by
      )
      VALUES (
        ${name.trim()}, 
        ${description.trim()}, 
        ${type || 'business'}, 
        ${accessLevel || 'invite-only'}, 
        ${orgCode}, 
        ${userId}
      )
      RETURNING org_id, org_name, org_description, org_type, access_level, org_code, created_at
    `;

    // Add creator as admin member
    await sql`
      INSERT INTO organization_members (org_id, user_id, role, joined_at)
      VALUES (${newOrg.org_id}, ${userId}, 'admin', NOW())
    `;

    // Create channels
    if (channels && channels.length > 0) {
      const channelNames = new Set();
      for (const channel of channels) {
        if (channel.name?.trim()) {
          const channelName = channel.name.trim().toLowerCase();
          if (channelNames.has(channelName)) {
            return res.status(400).json({ 
              message: `Duplicate channel name: ${channel.name.trim()}` 
            });
          }
          channelNames.add(channelName);
          
          await sql`
            INSERT INTO organization_channels (org_id, channel_name, channel_description, created_by)
            VALUES (${newOrg.org_id}, ${channel.name.trim()}, ${channel.description || ''}, ${userId})
          `;
        }
      }
    }

    // Create roles
    if (roles && roles.length > 0) {
      const roleNames = new Set();
      for (const role of roles) {
        if (role.name?.trim()) {
          const roleName = role.name.trim().toLowerCase();
          if (roleNames.has(roleName)) {
            return res.status(400).json({ 
              message: `Duplicate role name: ${role.name.trim()}` 
            });
          }
          roleNames.add(roleName);
          
          await sql`
            INSERT INTO organization_roles (org_id, role_name, permissions, created_by)
            VALUES (${newOrg.org_id}, ${role.name.trim()}, ${JSON.stringify(role.permissions || [])}, ${userId})
          `;
        }
      }
    }

    res.status(201).json({
      message: "Organization created successfully",
      organization: {
        id: newOrg.org_id,
        name: newOrg.org_name,
        description: newOrg.org_description,
        type: newOrg.org_type,
        accessLevel: newOrg.access_level,
        code: newOrg.org_code,
        createdAt: newOrg.created_at
      }
    });
  } catch (error) {
    console.error("Error creating organization:", error);
    if (error.message === "No token provided" || error.message === "Invalid token") {
      return res.status(401).json({ message: error.message });
    }
    if (error.code === '23505') { // Unique constraint violation
      return res.status(400).json({ message: "Organization with this name already exists" });
    }
    res.status(500).json({ message: "Internal server error" });
  }
};

// Get User's Organizations
export const getUserOrganizations = async (req, res) => {
  try {
    const userId = verifyToken(req);

    const organizations = await sql`
      SELECT 
        o.org_id,
        o.org_name,
        o.org_description,
        o.org_type,
        o.access_level,
        o.org_code,
        o.created_at,
        om.role as user_role,
        om.joined_at
      FROM organizations o
      JOIN organization_members om ON o.org_id = om.org_id
      WHERE om.user_id = ${userId}
      ORDER BY om.joined_at DESC
    `;

    const formattedOrgs = organizations.map(org => ({
      id: org.org_id,
      name: org.org_name,
      description: org.org_description,
      type: org.org_type,
      accessLevel: org.access_level,
      code: org.org_code,
      userRole: org.user_role,
      createdAt: org.created_at,
      joinedAt: org.joined_at
    }));

    res.status(200).json({ organizations: formattedOrgs });
  } catch (error) {
    console.error("Error fetching user organizations:", error);
    if (error.message === "No token provided" || error.message === "Invalid token") {
      return res.status(401).json({ message: error.message });
    }
    res.status(500).json({ message: "Internal server error" });
  }
};

// Get Organization Details
export const getOrganizationDetails = async (req, res) => {
  try {
    const userId = verifyToken(req);
    const { orgId } = req.params;

    // Check if user is member of organization
    const [membership] = await sql`
      SELECT role FROM organization_members 
      WHERE org_id = ${orgId} AND user_id = ${userId}
    `;

    if (!membership) {
      return res.status(403).json({ message: "You are not a member of this organization" });
    }

    // Get organization details
    const [org] = await sql`
      SELECT 
        org_id,
        org_name,
        org_description,
        org_type,
        access_level,
        org_code,
        created_at,
        created_by
      FROM organizations 
      WHERE org_id = ${orgId}
    `;

    if (!org) {
      return res.status(404).json({ message: "Organization not found" });
    }

    // Get channels
    const channels = await sql`
      SELECT channel_id, channel_name, channel_description, created_at
      FROM organization_channels 
      WHERE org_id = ${orgId}
      ORDER BY created_at ASC
    `;

    // Get roles
    const roles = await sql`
      SELECT role_id, role_name, permissions, created_at
      FROM organization_roles 
      WHERE org_id = ${orgId}
      ORDER BY created_at ASC
    `;

    // Get members
    const members = await sql`
      SELECT 
        om.user_id,
        u.name,
        u.email,
        u.user_photo,
        om.role,
        om.joined_at
      FROM organization_members om
      JOIN users u ON om.user_id = u.user_id
      WHERE om.org_id = ${orgId}
      ORDER BY om.joined_at ASC
    `;

    res.status(200).json({
      organization: {
        id: org.org_id,
        name: org.org_name,
        description: org.org_description,
        type: org.org_type,
        accessLevel: org.access_level,
        code: org.org_code,
        createdAt: org.created_at,
        createdBy: org.created_by,
        userRole: membership.role
      },
      channels: channels.map(ch => ({
        id: ch.channel_id,
        name: ch.channel_name,
        description: ch.channel_description,
        createdAt: ch.created_at
      })),
      roles: roles.map(r => ({
        id: r.role_id,
        name: r.role_name,
        permissions: r.permissions,
        createdAt: r.created_at
      })),
      members: members.map(m => ({
        userId: m.user_id,
        name: m.name,
        email: m.email,
        photo: m.user_photo,
        role: m.role,
        joinedAt: m.joined_at
      }))
    });
  } catch (error) {
    console.error("Error fetching organization details:", error);
    if (error.message === "No token provided" || error.message === "Invalid token") {
      return res.status(401).json({ message: error.message });
    }
    res.status(500).json({ message: "Internal server error" });
  }
};

// Join Organization by Code
export const joinOrganizationByCode = async (req, res) => {
  try {
    const userId = verifyToken(req);
    const { code } = req.body;

    if (!code?.trim()) {
      return res.status(400).json({ message: "Organization code is required" });
    }

    // Find organization by code
    const org = await sql`
      SELECT org_id, org_name, access_level FROM organizations 
      WHERE org_code = ${code.trim().toUpperCase()}
    `;

    if (!org) {
      return res.status(404).json({ message: "Organization not found" });
    }

    // Check if user is already a member
    const existingMember = await sql`
      SELECT user_id FROM organization_members 
      WHERE org_id = ${org.org_id} AND user_id = ${userId}
    `;

    if (existingMember) {
      return res.status(400).json({ message: "You are already a member of this organization" });
    }

    // Check access level
    if (org.access_level === 'admin-only') {
      return res.status(403).json({ message: "This organization requires admin approval to join" });
    }

    // Add user as member
    await sql`
      INSERT INTO organization_members (org_id, user_id, role, joined_at)
      VALUES (${org.org_id}, ${userId}, 'member', NOW())
    `;

    res.status(200).json({
      message: "Successfully joined organization",
      organization: {
        id: org.org_id,
        name: org.org_name,
        accessLevel: org.access_level
      }
    });
  } catch (error) {
    console.error("Error joining organization:", error);
    if (error.message === "No token provided" || error.message === "Invalid token") {
      return res.status(401).json({ message: error.message });
    }
    res.status(500).json({ message: "Internal server error" });
  }
};

// Update Organization
export const updateOrganization = async (req, res) => {
  try {
    const userId = verifyToken(req);
    const { orgId } = req.params;
    const updateData = req.body;

    // Check if user is admin of organization
    const [membership] = await sql`
      SELECT role FROM organization_members 
      WHERE org_id = ${orgId} AND user_id = ${userId}
    `;

    if (!membership || membership.role !== 'admin') {
      return res.status(403).json({ message: "Only admins can update organization settings" });
    }

    // Build update query dynamically
    const updates = {};
    if (updateData.name) updates.org_name = updateData.name.trim();
    if (updateData.description) updates.org_description = updateData.description.trim();
    if (updateData.type) updates.org_type = updateData.type;
    if (updateData.accessLevel) updates.access_level = updateData.accessLevel;

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ message: "No valid fields to update" });
    }

    // Update organization
    const [updatedOrg] = await sql`
      UPDATE organizations 
      SET ${sql(updates)}
      WHERE org_id = ${orgId}
      RETURNING org_id, org_name, org_description, org_type, access_level, org_code
    `;

    res.status(200).json({
      message: "Organization updated successfully",
      organization: {
        id: updatedOrg.org_id,
        name: updatedOrg.org_name,
        description: updatedOrg.org_description,
        type: updatedOrg.org_type,
        accessLevel: updatedOrg.access_level,
        code: updatedOrg.org_code
      }
    });
  } catch (error) {
    console.error("Error updating organization:", error);
    if (error.message === "No token provided" || error.message === "Invalid token") {
      return res.status(401).json({ message: error.message });
    }
    res.status(500).json({ message: "Internal server error" });
  }
};

// Delete Organization
export const deleteOrganization = async (req, res) => {
  try {
    const userId = verifyToken(req);
    const { orgId } = req.params;

    // Check if user is admin of organization
    const membership = await sql`
      SELECT role FROM organization_members 
      WHERE org_id = ${orgId} AND user_id = ${userId}
    `;

    if (!membership || membership.role !== 'admin') {
      return res.status(403).json({ message: "Only admins can delete organization" });
    }

    // Delete organization (cascade will handle related records)
    await sql`DELETE FROM organizations WHERE org_id = ${orgId}`;

    res.status(200).json({ message: "Organization deleted successfully" });
  } catch (error) {
    console.error("Error deleting organization:", error);
    if (error.message === "No token provided" || error.message === "Invalid token") {
      return res.status(401).json({ message: error.message });
    }
    res.status(500).json({ message: "Internal server error" });
  }
};

// Add Channel to Organization
export const addChannel = async (req, res) => {
  try {
    const userId = verifyToken(req);
    const { orgId } = req.params;
    const { name, description } = req.body;

    if (!name?.trim()) {
      return res.status(400).json({ message: "Channel name is required" });
    }

    // Check if user is admin of organization
    const [membership] = await sql`
      SELECT role FROM organization_members 
      WHERE org_id = ${orgId} AND user_id = ${userId}
    `;

    if (!membership || membership.role !== 'admin') {
      return res.status(403).json({ message: "Only admins can add channels" });
    }

    // Check if channel name already exists
    const existingChannel = await sql`
      SELECT channel_id FROM organization_channels 
      WHERE org_id = ${orgId} AND LOWER(channel_name) = LOWER(${name.trim()})
    `;

    if (existingChannel.length > 0) {
      return res.status(400).json({ message: "Channel name already exists" });
    }

    // Create channel
    const [newChannel] = await sql`
      INSERT INTO organization_channels (org_id, channel_name, channel_description, created_by)
      VALUES (${orgId}, ${name.trim()}, ${description || ''}, ${userId})
      RETURNING channel_id, channel_name, channel_description, created_at
    `;

    res.status(201).json({
      message: "Channel created successfully",
      channel: {
        id: newChannel.channel_id,
        name: newChannel.channel_name,
        description: newChannel.channel_description,
        createdAt: newChannel.created_at
      }
    });
  } catch (error) {
    console.error("Error adding channel:", error);
    if (error.message === "No token provided" || error.message === "Invalid token") {
      return res.status(401).json({ message: error.message });
    }
    res.status(500).json({ message: "Internal server error" });
  }
};

// Remove Channel from Organization
export const removeChannel = async (req, res) => {
  try {
    const userId = verifyToken(req);
    const { orgId, channelId } = req.params;

    // Check if user is admin of organization
    const [membership] = await sql`
      SELECT role FROM organization_members 
      WHERE org_id = ${orgId} AND user_id = ${userId}
    `;

    if (!membership || membership.role !== 'admin') {
      return res.status(403).json({ message: "Only admins can remove channels" });
    }

    // Delete channel
    await sql`DELETE FROM organization_channels WHERE channel_id = ${channelId} AND org_id = ${orgId}`;

    res.status(200).json({ message: "Channel removed successfully" });
  } catch (error) {
    console.error("Error removing channel:", error);
    if (error.message === "No token provided" || error.message === "Invalid token") {
      return res.status(401).json({ message: error.message });
    }
    res.status(500).json({ message: "Internal server error" });
  }
};

// Add Role to Organization
export const addRole = async (req, res) => {
  try {
    const userId = verifyToken(req);
    const { orgId } = req.params;
    const { name, permissions } = req.body;

    if (!name?.trim()) {
      return res.status(400).json({ message: "Role name is required" });
    }

    // Check if user is admin of organization
    const [membership] = await sql`
      SELECT role FROM organization_members 
      WHERE org_id = ${orgId} AND user_id = ${userId}
    `;

    if (!membership || membership.role !== 'admin') {
      return res.status(403).json({ message: "Only admins can add roles" });
    }

    // Check if role name already exists
    const existingRole = await sql`
      SELECT role_id FROM organization_roles 
      WHERE org_id = ${orgId} AND LOWER(role_name) = LOWER(${name.trim()})
    `;

    if (existingRole.length > 0) {
      return res.status(400).json({ message: "Role name already exists" });
    }

    // Create role
    const [newRole] = await sql`
      INSERT INTO organization_roles (org_id, role_name, permissions, created_by)
      VALUES (${orgId}, ${name.trim()}, ${JSON.stringify(permissions || [])}, ${userId})
      RETURNING role_id, role_name, permissions, created_at
    `;

    res.status(201).json({
      message: "Role created successfully",
      role: {
        id: newRole.role_id,
        name: newRole.role_name,
        permissions: newRole.permissions,
        createdAt: newRole.created_at
      }
    });
  } catch (error) {
    console.error("Error adding role:", error);
    if (error.message === "No token provided" || error.message === "Invalid token") {
      return res.status(401).json({ message: error.message });
    }
    res.status(500).json({ message: "Internal server error" });
  }
};

// Update Role in Organization
export const updateRole = async (req, res) => {
  try {
    const userId = verifyToken(req);
    const { orgId, roleId } = req.params;
    const { name, permissions } = req.body;

    // Check if user is admin of organization
    const [membership] = await sql`
      SELECT role FROM organization_members 
      WHERE org_id = ${orgId} AND user_id = ${userId}
    `;

    if (!membership || membership.role !== 'admin') {
      return res.status(403).json({ message: "Only admins can update roles" });
    }

    // Build update query
    const updates = {};
    if (name?.trim()) updates.role_name = name.trim();
    if (permissions) updates.permissions = JSON.stringify(permissions);

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ message: "No valid fields to update" });
    }

    // Update role
    const [updatedRole] = await sql`
      UPDATE organization_roles 
      SET ${sql(updates)}
      WHERE role_id = ${roleId} AND org_id = ${orgId}
      RETURNING role_id, role_name, permissions, created_at
    `;

    res.status(200).json({
      message: "Role updated successfully",
      role: {
        id: updatedRole.role_id,
        name: updatedRole.role_name,
        permissions: updatedRole.permissions,
        createdAt: updatedRole.created_at
      }
    });
  } catch (error) {
    console.error("Error updating role:", error);
    if (error.message === "No token provided" || error.message === "Invalid token") {
      return res.status(401).json({ message: error.message });
    }
    res.status(500).json({ message: "Internal server error" });
  }
};

// Remove Role from Organization
export const removeRole = async (req, res) => {
  try {
    const userId = verifyToken(req);
    const { orgId, roleId } = req.params;

    // Check if user is admin of organization
    const [membership] = await sql`
      SELECT role FROM organization_members 
      WHERE org_id = ${orgId} AND user_id = ${userId}
    `;

    if (!membership || membership.role !== 'admin') {
      return res.status(403).json({ message: "Only admins can remove roles" });
    }

    // Delete role
    await sql`DELETE FROM organization_roles WHERE role_id = ${roleId} AND org_id = ${orgId}`;

    res.status(200).json({ message: "Role removed successfully" });
  } catch (error) {
    console.error("Error removing role:", error);
    if (error.message === "No token provided" || error.message === "Invalid token") {
      return res.status(401).json({ message: error.message });
    }
    res.status(500).json({ message: "Internal server error" });
  }
};
