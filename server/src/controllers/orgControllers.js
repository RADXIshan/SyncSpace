import sql from "../database/db.js";
import jwt from "jsonwebtoken";
import nodemailer from "nodemailer";
import { generateInviteEmail } from "../templates/inviteTemplate.js";

// Helper function to verify JWT token
const verifyToken = (req) => {
  const authToken =
    req.cookies.jwt || req.body.token || req.headers.authorization?.split(" ")[1];
  if (!authToken) throw new Error("No token provided");

  try {
    const decoded = jwt.verify(authToken, process.env.JWT_SECRET_KEY);
    return decoded.userId;
  } catch {
    throw new Error("Invalid token");
  }
};

// Create Organization
export const createOrganization = async (req, res) => {
  try {
    const userId = verifyToken(req);

    const { name, accessLevel, channels, org_code, roles } = req.body;

    // --- Validation ---
    if (!name?.trim()) return res.status(400).json({ message: "Organization name is required" });
    if (!accessLevel?.trim()) return res.status(400).json({ message: "Access level is required" });
    if (!channels?.length) return res.status(400).json({ message: "At least one channel is required" });
    if (!org_code?.trim()) return res.status(400).json({ message: "Organization code is required" });

    // --- Create organization ---
    const [newOrg] = await sql`
      INSERT INTO organisations (org_name, channels, access_level, org_code, created_by)
      VALUES (${name.trim()}, ${channels}, ${accessLevel || "invite-only"}, ${org_code.trim()}, ${userId})
      RETURNING org_id, org_name, access_level, org_code, created_by
    `;

    // --- Add creator with special Creator role ---
    await sql`
      INSERT INTO org_members (org_id, user_id, role, joined_at)
      VALUES (${newOrg.org_id}, ${userId}, 'Creator', NOW())
    `;

    // --- Create channels ---
    if (channels && channels.length > 0) {
      const channelNames = new Set();
      for (const channel of channels) {
        if (channel.name?.trim()) {
          const channelName = channel.name.trim().toLowerCase();
          if (channelNames.has(channelName)) {
            return res.status(400).json({
              message: `Duplicate channel name: ${channel.name.trim()}`,
            });
          }
          channelNames.add(channelName);

          await sql`
            INSERT INTO org_channels (org_id, channel_name, channel_description)
            VALUES (${newOrg.org_id}, ${channel.name.trim()}, ${channel.description || ""})
          `;
        }
      }
    }

    // --- Create roles ---
    if (roles && roles.length > 0) {
      const roleNames = new Set();
      for (const role of roles) {
        if (role.name?.trim()) {
          const roleName = role.name.trim().toLowerCase();
          if (roleNames.has(roleName)) {
            return res.status(400).json({
              message: `Duplicate role name: ${role.name.trim()}`,
            });
          }
          roleNames.add(roleName);

          await sql`
            INSERT INTO org_roles (
              org_id, role_name,
              manage_channels, manage_users,
              settings_access, notes_access, meeting_access, noticeboard_access, roles_access, invite_access,
              accessible_teams,
              created_by
            )
            VALUES (
              ${newOrg.org_id},
              ${role.name.trim()},
              ${role.permissions?.manage_channels || false},
              ${role.permissions?.manage_users || false},
              ${role.permissions?.settings_access || false},
              ${role.permissions?.notes_access || false},
              ${role.permissions?.meeting_access || false},
              ${role.permissions?.noticeboard_access || false},
              ${role.permissions?.roles_access || false},
              ${role.permissions?.invite_access || false},
              ${Array.isArray(role.accessible_teams) ? role.accessible_teams : (Array.isArray(role.accessibleChannels) ? role.accessibleChannels : [])},
              ${userId}
            )
          `;
        }
      }
    }

    // --- Update user org_id ---
    await sql`
      UPDATE users
      SET org_id = ${newOrg.org_id}
      WHERE user_id = ${userId}
    `;

    res.status(201).json({
      message: "Organization created successfully",
      organization: {
        id: newOrg.org_id,
        name: newOrg.org_name,
        accessLevel: newOrg.access_level,
        code: newOrg.org_code,
        createdAt: newOrg.created_at,
      },
    });
  } catch (error) {
    console.error("Error creating organization:", error);
    if (error.message === "No token provided" || error.message === "Invalid token") {
      return res.status(401).json({ message: error.message });
    }
    if (error.code === "23505") {
      return res.status(400).json({ message: "Organization with this name already exists" });
    }
    res.status(500).json({ message: "Internal server error" });
  }
};

// Get Organization
export const getOrganization = async (req, res) => {
  try {
    const userId = verifyToken(req);
    const org_id = req.params.org_id;

    // Get organization details
    const org = await sql`
      SELECT org_id, org_name, access_level, org_code, created_by
      FROM organisations
      WHERE org_id = ${org_id}
      LIMIT 1
    `;

    if (org.length === 0) {
      return res.status(404).json({ message: "Organization not found" });
    }

    const organization = org[0];

    // Get organization channels (initially fetch all)
    let channels = await sql`
      SELECT channel_id, channel_name, channel_description
      FROM org_channels
      WHERE org_id = ${org_id}
      ORDER BY channel_id ASC
    `;

    // Determine user's accessible teams for channel filtering
    const [memberWithRole] = await sql`
      SELECT om.role, r.accessible_teams
      FROM org_members om
      LEFT JOIN org_roles r ON r.org_id = om.org_id AND r.role_name = om.role
      WHERE om.org_id = ${org_id} AND om.user_id = ${userId}
      LIMIT 1
    `;

    const isCreator = organization.created_by === userId;
    const accessibleTeams = memberWithRole?.accessible_teams || null;

    if (!isCreator && Array.isArray(accessibleTeams) && accessibleTeams.length > 0) {
      channels = channels.filter(ch => accessibleTeams.includes(ch.channel_name));
    }

    // Get organization roles
    const roles = await sql`
      SELECT role_id, role_name, manage_channels, manage_users,
             settings_access, notes_access, meeting_access, noticeboard_access, roles_access, invite_access,
             accessible_teams
      FROM org_roles
      WHERE org_id = ${org_id}
      ORDER BY role_id ASC
    `;

    res.status(200).json({
      message: "Organization retrieved successfully",
      organization: {
        id: organization.org_id,
        name: organization.org_name,
        accessLevel: organization.access_level,
        code: organization.org_code,
        createdBy: organization.created_by,
        createdAt: organization.created_at,
        channels: channels.map(ch => ({
          id: ch.channel_id,
          name: ch.channel_name,
          description: ch.channel_description,
        })),
        roles: roles.map(role => ({
          id: role.role_id,
          name: role.role_name,
          permissions: {
            manage_channels: role.manage_channels,
            manage_users: role.manage_users,
            settings_access: role.settings_access,
            notes_access: role.notes_access,
            meeting_access: role.meeting_access,
            noticeboard_access: role.noticeboard_access,
            roles_access: role.roles_access,
            invite_access: role.invite_access,
          },
          accessible_teams: Array.isArray(role.accessible_teams) ? role.accessible_teams : [],
        })),
      },
    });
  } catch (error) {
    console.error("Error retrieving organization:", error);
    if (error.message === "No token provided" || error.message === "Invalid token") {
      return res.status(401).json({ message: error.message });
    }
    res.status(500).json({ message: "Internal server error" });
  }
};

// Join Organization
export const joinOrganization = async (req, res) => {
  try {
    const userId = verifyToken(req);
    const { code } = req.body;

    // Validation
    if (!code?.trim()) {
      return res.status(400).json({ message: "Organization code is required" });
    }

    // Find organization by code
    const org = await sql`
      SELECT org_id, org_name, access_level, org_code, created_by
      FROM organisations
      WHERE org_code = ${code.trim().toUpperCase()}
      LIMIT 1
    `;

    if (org.length === 0) {
      return res.status(404).json({ message: "Invalid organization code" });
    }

    const organization = org[0];

    // Check if user is already a member
    const existingMember = await sql`
      SELECT user_id
      FROM org_members
      WHERE org_id = ${organization.org_id} AND user_id = ${userId}
      LIMIT 1
    `;

    if (existingMember.length > 0) {
      return res.status(400).json({ message: "You are already a member of this organization" });
    }

    // Check if user is already in another organization
    const [currentUser] = await sql`
      SELECT org_id
      FROM users
      WHERE user_id = ${userId}
      LIMIT 1
    `;

    if (currentUser?.org_id) {
      return res.status(400).json({ message: "You are already a member of another organization. Please leave your current organization first." });
    }

    // Anyone with the correct organization code can join
    // Access level restrictions only apply to invitation-based joining, not direct code joining

    // Get the role with the least permissions for new members
    const defaultRoles = await sql`
      SELECT role_name, 
             (CASE WHEN manage_channels THEN 1 ELSE 0 END +
              CASE WHEN manage_users THEN 1 ELSE 0 END +
              CASE WHEN settings_access THEN 1 ELSE 0 END +
              CASE WHEN notes_access THEN 1 ELSE 0 END +
              CASE WHEN meeting_access THEN 1 ELSE 0 END +
              CASE WHEN noticeboard_access THEN 1 ELSE 0 END +
              CASE WHEN roles_access THEN 1 ELSE 0 END +
              CASE WHEN invite_access THEN 1 ELSE 0 END) as permission_count
      FROM org_roles
      WHERE org_id = ${organization.org_id}
      ORDER BY permission_count ASC, role_id ASC
      LIMIT 1
    `;

    const defaultRole = defaultRoles[0];

    if (!defaultRole) {
      return res.status(500).json({ message: "No roles found in organization. Please contact the administrator." });
    }

    // Add user to organization members
    await sql`
      INSERT INTO org_members (org_id, user_id, role, joined_at)
      VALUES (${organization.org_id}, ${userId}, ${defaultRole.role_name}, NOW())
    `;

    // Update user's org_id
    await sql`
      UPDATE users
      SET org_id = ${organization.org_id}
      WHERE user_id = ${userId}
    `;

    res.status(200).json({
      message: "Successfully joined organization",
      organization: {
        id: organization.org_id,
        name: organization.org_name,
        accessLevel: organization.access_level,
        code: organization.org_code,
      },
    });
  } catch (error) {
    console.error("Error joining organization:", error);
    if (error.message === "No token provided" || error.message === "Invalid token") {
      return res.status(401).json({ message: error.message });
    }
    res.status(500).json({ message: "Internal server error" });
  }
};

// Leave Organization
export const leaveOrganization = async (req, res) => {
  try {
    const userId = verifyToken(req);

    // Get user's current organization
    const [currentUser] = await sql`
      SELECT org_id
      FROM users
      WHERE user_id = ${userId}
      LIMIT 1
    `;

    if (!currentUser?.org_id) {
      return res.status(400).json({ message: "You are not a member of any organization" });
    }

    // Check if user is the creator/admin of the organization
    const [org] = await sql`
      SELECT created_by
      FROM organisations
      WHERE org_id = ${currentUser.org_id}
      LIMIT 1
    `;

    if (org?.created_by === userId) {
      return res.status(400).json({ message: "Organization creator cannot leave. Please transfer ownership or delete the organization." });
    }

    // Remove user from org_members
    await sql`
      DELETE FROM org_members
      WHERE org_id = ${currentUser.org_id} AND user_id = ${userId}
    `;

    // Update user's org_id to NULL
    await sql`
      UPDATE users
      SET org_id = NULL
      WHERE user_id = ${userId}
    `;

    res.status(200).json({
      message: "Successfully left organization",
    });
  } catch (error) {
    console.error("Error leaving organization:", error);
    if (error.message === "No token provided" || error.message === "Invalid token") {
      return res.status(401).json({ message: error.message });
    }
    res.status(500).json({ message: "Internal server error" });
  }
};

// Get User Role in Organization
export const getUserRole = async (req, res) => {
  try {
    const userId = verifyToken(req);
    const org_id = req.params.org_id;

    // Get user's role and permissions in the organization
    const [member] = await sql`
      SELECT om.role, r.settings_access, r.manage_channels, r.manage_users,
             r.notes_access, r.meeting_access, r.noticeboard_access, r.roles_access, r.invite_access
      FROM org_members om
      LEFT JOIN org_roles r ON r.org_id = om.org_id AND r.role_name = om.role
      WHERE om.org_id = ${org_id} AND om.user_id = ${userId}
      LIMIT 1
    `;

    if (!member) {
      return res.status(404).json({ message: "User is not a member of this organization" });
    }

    // Check if user is organization creator (has full access)
    const [org] = await sql`
      SELECT created_by
      FROM organisations
      WHERE org_id = ${org_id}
      LIMIT 1
    `;

    const isCreator = org?.created_by === userId;

    res.status(200).json({
      message: "User role retrieved successfully",
      role: member.role,
      permissions: {
        settings_access: isCreator || member.settings_access || false,
        manage_channels: isCreator || member.manage_channels || false,
        manage_users: isCreator || member.manage_users || false,
        notes_access: isCreator || member.notes_access || false,
        meeting_access: isCreator || member.meeting_access || false,
        noticeboard_access: isCreator || member.noticeboard_access || false,
        roles_access: isCreator || member.roles_access || false,
        invite_access: isCreator || member.invite_access || false,
        isCreator: isCreator, // Include isCreator in permissions object
      },
      isCreator,
    });
  } catch (error) {
    console.error("Error retrieving user role:", error);
    if (error.message === "No token provided" || error.message === "Invalid token") {
      return res.status(401).json({ message: error.message });
    }
    res.status(500).json({ message: "Internal server error" });
  }
};

// Update Organization Settings
export const updateOrganization = async (req, res) => {
  try {
    const userId = verifyToken(req);
    const org_id = req.params.org_id;
    const { name, accessLevel, channels, roles } = req.body;

    // Get user's permissions
    const [member] = await sql`
      SELECT om.role, r.settings_access, r.manage_channels, r.manage_users, r.roles_access
      FROM org_members om
      LEFT JOIN org_roles r ON r.org_id = om.org_id AND r.role_name = om.role
      WHERE om.org_id = ${org_id} AND om.user_id = ${userId}
      LIMIT 1
    `;

    const [org] = await sql`
      SELECT created_by
      FROM organisations
      WHERE org_id = ${org_id}
      LIMIT 1
    `;

    if (!member) {
      return res.status(403).json({ message: "You are not a member of this organization" });
    }

    const isCreator = org?.created_by === userId;
    const hasSettingsAccess = isCreator || member.settings_access;
    const hasChannelAccess = isCreator || member.manage_channels;
    const hasRolesAccess = isCreator || member.roles_access;

    // Determine what user is trying to update
    const updatingBasicSettings = name || accessLevel;
    const updatingRoles = roles && roles.length > 0;
    const updatingChannels = channels && channels.length > 0;

    // Permission checks
    if (updatingBasicSettings && !hasSettingsAccess) {
      return res.status(403).json({ 
        message: "You need 'Settings Access' permission to update organization settings" 
      });
    }

    if (updatingRoles && !hasSettingsAccess && !hasRolesAccess) {
      return res.status(403).json({ 
        message: "You need 'Settings Access' or 'Roles Access' permission to update roles" 
      });
    }

    if (updatingChannels && !hasChannelAccess && !hasSettingsAccess) {
      return res.status(403).json({ 
        message: "You need 'Manage Channels' or 'Settings Access' permission to update channels" 
      });
    }

    // Validate input only for fields being updated
    if (updatingBasicSettings) {
      if (name && !name.trim()) {
        return res.status(400).json({ message: "Organization name is required" });
      }
      if (accessLevel && !accessLevel.trim()) {
        return res.status(400).json({ message: "Access level is required" });
      }
    }

    // Update organization basic info (only if user has settings access)
    let updatedOrg;
    if (hasSettingsAccess && updatingBasicSettings) {
      [updatedOrg] = await sql`
        UPDATE organisations
        SET org_name = ${name?.trim() || sql`org_name`}, 
            access_level = ${accessLevel?.trim() || sql`access_level`}
        WHERE org_id = ${org_id}
        RETURNING org_id, org_name, access_level, org_code
      `;
    } else {
      // Just get current organization data if not updating basic settings
      [updatedOrg] = await sql`
        SELECT org_id, org_name, access_level, org_code
        FROM organisations
        WHERE org_id = ${org_id}
        LIMIT 1
      `;
    }

    // Update channels if provided and user has permission
    if (updatingChannels && (hasChannelAccess || hasSettingsAccess)) {
      // Delete existing channels
      await sql`DELETE FROM org_channels WHERE org_id = ${org_id}`;
      
      // Add new channels
      const channelNames = new Set();
      for (const channel of channels) {
        if (channel.name?.trim()) {
          const channelName = channel.name.trim().toLowerCase();
          if (channelNames.has(channelName)) {
            return res.status(400).json({
              message: `Duplicate channel name: ${channel.name.trim()}`,
            });
          }
          channelNames.add(channelName);

          await sql`
            INSERT INTO org_channels (org_id, channel_name, channel_description)
            VALUES (${org_id}, ${channel.name.trim()}, ${channel.description || ""})
          `;
        }
      }
    }

    // Update roles if provided and user has settings or roles access
    if (updatingRoles && (hasSettingsAccess || hasRolesAccess)) {
      // Delete existing roles
      await sql`DELETE FROM org_roles WHERE org_id = ${org_id}`;
      
      // Add updated roles
      const roleNames = new Set();
      for (const role of roles) {
        if (role.name?.trim()) {
          const roleName = role.name.trim().toLowerCase();
          if (roleNames.has(roleName)) {
            return res.status(400).json({
              message: `Duplicate role name: ${role.name.trim()}`,
            });
          }
          roleNames.add(roleName);

          await sql`
            INSERT INTO org_roles (
              org_id, role_name,
              manage_channels, manage_users,
              settings_access, notes_access, meeting_access, noticeboard_access, roles_access, invite_access,
              accessible_teams,
              created_by
            )
            VALUES (
              ${org_id},
              ${role.name.trim()},
              ${role.permissions?.manage_channels || false},
              ${role.permissions?.manage_users || false},
              ${role.permissions?.settings_access || false},
              ${role.permissions?.notes_access || false},
              ${role.permissions?.meeting_access || false},
              ${role.permissions?.noticeboard_access || false},
              ${role.permissions?.roles_access || false},
              ${role.permissions?.invite_access || false},
              ${Array.isArray(role.accessible_teams) ? role.accessible_teams : (Array.isArray(role.accessibleChannels) ? role.accessibleChannels : [])},
              ${userId}
            )
          `;
        }
      }
    }

    res.status(200).json({
      message: "Organization updated successfully",
      organization: {
        id: updatedOrg.org_id,
        name: updatedOrg.org_name,
        accessLevel: updatedOrg.access_level,
        code: updatedOrg.org_code,
      },
    });
  } catch (error) {
    console.error("Error updating organization:", error);
    if (error.message === "No token provided" || error.message === "Invalid token") {
      return res.status(401).json({ message: error.message });
    }
    res.status(500).json({ message: "Internal server error" });
  }
};

// Get Organization Members
export const getOrganizationMembers = async (req, res) => {
  try {
    const userId = verifyToken(req);
    const org_id = req.params.org_id;

    // Check if user is a member of the organization
    const [member] = await sql`
      SELECT om.role, r.manage_users
      FROM org_members om
      LEFT JOIN org_roles r ON r.org_id = om.org_id AND r.role_name = om.role
      WHERE om.org_id = ${org_id} AND om.user_id = ${userId}
      LIMIT 1
    `;

    const [org] = await sql`
      SELECT created_by
      FROM organisations
      WHERE org_id = ${org_id}
      LIMIT 1
    `;

    if (!member) {
      return res.status(403).json({ message: "You are not a member of this organization" });
    }

    const isCreator = org?.created_by === userId;

    // Get all members of the organization with user details and their role's accessible teams
    const members = await sql`
      SELECT 
        om.user_id,
        om.role,
        om.joined_at,
        u.name,
        u.email,
        u.user_photo,
        r.accessible_teams
      FROM org_members om
      JOIN users u ON u.user_id = om.user_id
      LEFT JOIN org_roles r ON r.org_id = om.org_id AND r.role_name = om.role
      WHERE om.org_id = ${org_id}
      ORDER BY om.joined_at ASC
    `;

    res.status(200).json({
      message: "Organization members retrieved successfully",
      members: members.map(memberItem => ({
        id: memberItem.user_id, // Use user_id as the member identifier
        userId: memberItem.user_id,
        name: memberItem.name,
        email: memberItem.email,
        userPhoto: memberItem.user_photo,
        role: memberItem.role,
        joinedAt: memberItem.joined_at,
        accessible_teams: Array.isArray(memberItem.accessible_teams) ? memberItem.accessible_teams : [],
        isCreator: memberItem.user_id === org?.created_by
      })),
      canManage: isCreator || member.manage_users
    });
  } catch (error) {
    console.error("Error retrieving organization members:", error);
    if (error.message === "No token provided" || error.message === "Invalid token") {
      return res.status(401).json({ message: error.message });
    }
    res.status(500).json({ message: "Internal server error" });
  }
};

// Update Organization Member Role
export const updateMemberRole = async (req, res) => {
  try {
    const userId = verifyToken(req);
    const org_id = req.params.org_id;
    const member_id = req.params.member_id;
    const { role } = req.body;

    // Validate input
    if (!role?.trim()) {
      return res.status(400).json({ message: "Role is required" });
    }

    // Check if user has permission to manage users
    const [currentMember] = await sql`
      SELECT om.role, r.manage_users
      FROM org_members om
      LEFT JOIN org_roles r ON r.org_id = om.org_id AND r.role_name = om.role
      WHERE om.org_id = ${org_id} AND om.user_id = ${userId}
      LIMIT 1
    `;

    const [org] = await sql`
      SELECT created_by
      FROM organisations
      WHERE org_id = ${org_id}
      LIMIT 1
    `;

    if (!currentMember) {
      return res.status(403).json({ message: "You are not a member of this organization" });
    }

    const isCreator = org?.created_by === userId;
    const canManageUsers = isCreator || currentMember.manage_users;

    if (!canManageUsers) {
      return res.status(403).json({ message: "You don't have permission to manage users" });
    }

    // Get target member details
    const [targetMember] = await sql`
      SELECT user_id, role
      FROM org_members
      WHERE user_id = ${member_id} AND org_id = ${org_id}
      LIMIT 1
    `;

    if (!targetMember) {
      return res.status(404).json({ message: "Member not found" });
    }

    // Prevent changing creator's role
    if (targetMember.user_id === org?.created_by) {
      return res.status(400).json({ message: "Cannot change the role of organization creator" });
    }

    // Prevent assigning the Creator role to anyone
    if (role.trim() === 'Creator') {
      return res.status(400).json({ message: "The Creator role cannot be assigned. It is reserved for the organization creator." });
    }

    // Check if the role exists in the organization
    const [roleExists] = await sql`
      SELECT role_id
      FROM org_roles
      WHERE org_id = ${org_id} AND role_name = ${role.trim()}
      LIMIT 1
    `;

    if (!roleExists) {
      return res.status(400).json({ message: "Invalid role. Role does not exist in this organization" });
    }

    // Update member role
    await sql`
      UPDATE org_members
      SET role = ${role.trim()}
      WHERE user_id = ${member_id} AND org_id = ${org_id}
    `;

    res.status(200).json({
      message: "Member role updated successfully"
    });
  } catch (error) {
    console.error("Error updating member role:", error);
    if (error.message === "No token provided" || error.message === "Invalid token") {
      return res.status(401).json({ message: error.message });
    }
    res.status(500).json({ message: "Internal server error" });
  }
};

// Remove Organization Member
export const removeMember = async (req, res) => {
  try {
    const userId = verifyToken(req);
    const org_id = req.params.org_id;
    const member_id = req.params.member_id;

    // Check if user has permission to manage users
    const [currentMember] = await sql`
      SELECT om.role, r.manage_users
      FROM org_members om
      LEFT JOIN org_roles r ON r.org_id = om.org_id AND r.role_name = om.role
      WHERE om.org_id = ${org_id} AND om.user_id = ${userId}
      LIMIT 1
    `;

    const [org] = await sql`
      SELECT created_by
      FROM organisations
      WHERE org_id = ${org_id}
      LIMIT 1
    `;

    if (!currentMember) {
      return res.status(403).json({ message: "You are not a member of this organization" });
    }

    const isCreator = org?.created_by === userId;
    const canManageUsers = isCreator || currentMember.manage_users;

    if (!canManageUsers) {
      return res.status(403).json({ message: "You don't have permission to manage users" });
    }

    // Get target member details
    const [targetMember] = await sql`
      SELECT user_id
      FROM org_members
      WHERE user_id = ${member_id} AND org_id = ${org_id}
      LIMIT 1
    `;

    if (!targetMember) {
      return res.status(404).json({ message: "Member not found" });
    }

    // Prevent removing organization creator
    if (targetMember.user_id === org?.created_by) {
      return res.status(400).json({ message: "Cannot remove organization creator" });
    }

    // Remove member from organization
    await sql`
      DELETE FROM org_members
      WHERE user_id = ${member_id} AND org_id = ${org_id}
    `;

    // Update user's org_id to NULL
    await sql`
      UPDATE users
      SET org_id = NULL
      WHERE user_id = ${targetMember.user_id}
    `;

    res.status(200).json({
      message: "Member removed successfully"
    });
  } catch (error) {
    console.error("Error removing member:", error);
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
    const org_id = req.params.org_id;

    // Get organization details and verify creator
    const [org] = await sql`
      SELECT created_by, org_name
      FROM organisations
      WHERE org_id = ${org_id}
      LIMIT 1
    `;

    if (!org) {
      return res.status(404).json({ message: "Organization not found" });
    }

    // Only organization creator can delete the organization
    if (org.created_by !== userId) {
      return res.status(403).json({ message: "Only the organization creator can delete the organization" });
    }

    // Delete all related data sequentially
    // Delete organization roles
    await sql`DELETE FROM org_roles WHERE org_id = ${org_id}`;
    
    // Delete organization channels
    await sql`DELETE FROM org_channels WHERE org_id = ${org_id}`;
    
    // Update all users' org_id to NULL
    await sql`UPDATE users SET org_id = NULL WHERE org_id = ${org_id}`;
    
    // Delete organization members
    await sql`DELETE FROM org_members WHERE org_id = ${org_id}`;
    
    // Finally, delete the organization itself
    await sql`DELETE FROM organisations WHERE org_id = ${org_id}`;

    res.status(200).json({
      message: `Organization "${org.org_name}" has been successfully deleted`
    });
  } catch (error) {
    console.error("Error deleting organization:", error);
    if (error.message === "No token provided" || error.message === "Invalid token") {
      return res.status(401).json({ message: error.message });
    }
    res.status(500).json({ message: "Internal server error" });
  }
};

// Send Email Invitations
export const sendInvitations = async (req, res) => {
  try {
    const userId = verifyToken(req);
    const org_id = req.params.org_id;
    const { emails, message, organizationName, inviteCode } = req.body;

    // Validate input
    if (!emails || !Array.isArray(emails) || emails.length === 0) {
      return res.status(400).json({ message: "At least one email address is required" });
    }

    if (!message?.trim()) {
      return res.status(400).json({ message: "Message is required" });
    }

    // Check if user has permission to send invites
    const [member] = await sql`
      SELECT om.role, r.invite_access
      FROM org_members om
      LEFT JOIN org_roles r ON r.org_id = om.org_id AND r.role_name = om.role
      WHERE om.org_id = ${org_id} AND om.user_id = ${userId}
      LIMIT 1
    `;

    const [org] = await sql`
      SELECT created_by, access_level
      FROM organisations
      WHERE org_id = ${org_id}
      LIMIT 1
    `;

    if (!member) {
      return res.status(403).json({ message: "You are not a member of this organization" });
    }

    const isCreator = org?.created_by === userId;
    
    // Check access level permissions based on organization settings
    const hasInviteAccess = member.invite_access === true; // Handle null/undefined values
    
    if (org?.access_level === 'public') {
      // Public: Anyone can join directly using the code, no invitation needed
      // But members can still send invitations if they have invite_access
      if (!isCreator && member.role !== 'admin' && !hasInviteAccess) {
        return res.status(403).json({ 
          message: "You don't have permission to send invitations. Please ask an admin or get 'Invite Access' permission." 
        });
      }
    } else if (org?.access_level === 'invite-only') {
      // Invite-only: Only permitted members can invite
      if (!isCreator && member.role !== 'admin' && !hasInviteAccess) {
        return res.status(403).json({ 
          message: "You don't have permission to send invitations. Please ask an admin or get 'Invite Access' permission." 
        });
      }
    } else if (org?.access_level === 'admin-only') {
      // Admin-only: Only creator or admins can invite
      if (!isCreator && member.role !== 'admin') {
        return res.status(403).json({ 
          message: "Only the organization creator or admins can send invitations in this organization." 
        });
      }
    }

    // Validate email formats
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    for (const email of emails) {
      if (!emailRegex.test(email.trim())) {
        return res.status(400).json({ message: `Invalid email format: ${email}` });
      }
    }

    const transporter = nodemailer.createTransport({
        service: 'gmail',
        host: "smtp.gmail.com",
        port: 587,
        secure: false,
        auth: {
            user: process.env.EMAIL,
            pass: process.env.APP_PASSWORD,
        },
    });

    const confirmationMail = {
        from: {
            name: "Ishan Roy",
            address: "trickster10ishan@gmail.com"
        },
        to: emails,
        subject: `Invitation Code to join ${organizationName}`,
        html: generateInviteEmail(organizationName, message, inviteCode),
    };    

    try {
        await transporter.sendMail(confirmationMail);
    } catch (error) {
        console.error("Error sending email:", error);
        return res.status(500).json({ message: "Internal server error" });
    }

    res.status(200).json({ "message": "Invitations sent successfully" });
  } catch (error) {
    console.error("Error sending invitations:", error);
    if (error.message === "No token provided" || error.message === "Invalid token") {
      return res.status(401).json({ message: error.message });
    }
    res.status(500).json({ message: "Failed to send invitations" });
  }
};

// Get Single Channel
export const getChannel = async (req, res) => {
  try {
    const userId = verifyToken(req);
    const org_id = req.params.org_id;
    const channel_id = req.params.channel_id;

    // Check if user is a member of the organization
    const [member] = await sql`
      SELECT user_id
      FROM org_members
      WHERE org_id = ${org_id} AND user_id = ${userId}
      LIMIT 1
    `;

    if (!member) {
      return res.status(403).json({ message: "You are not a member of this organization" });
    }

    // Get channel details
    const [channel] = await sql`
      SELECT channel_id, channel_name, channel_description
      FROM org_channels
      WHERE channel_id = ${channel_id} AND org_id = ${org_id}
      LIMIT 1
    `;

    if (!channel) {
      return res.status(404).json({ message: "Channel not found" });
    }

    // Enforce channel access based on role's accessible_teams unless user is creator
    const [orgForCreator] = await sql`
      SELECT created_by
      FROM organisations
      WHERE org_id = ${org_id}
      LIMIT 1
    `;

    const isCreator = orgForCreator?.created_by === userId;

    if (!isCreator) {
      const [memberWithRole] = await sql`
        SELECT r.accessible_teams
        FROM org_members om
        LEFT JOIN org_roles r ON r.org_id = om.org_id AND r.role_name = om.role
        WHERE om.org_id = ${org_id} AND om.user_id = ${userId}
        LIMIT 1
      `;

      const accessibleTeams = memberWithRole?.accessible_teams || null;
      if (Array.isArray(accessibleTeams) && accessibleTeams.length > 0) {
        const canAccess = accessibleTeams.includes(channel.channel_name);
        if (!canAccess) {
          return res.status(403).json({ message: "You don't have access to this channel" });
        }
      }
    }

    res.status(200).json({
      message: "Channel retrieved successfully",
      channel: {
        id: channel.channel_id,
        name: channel.channel_name,
        description: channel.channel_description,
        createdAt: channel.created_at,
      },
    });
  } catch (error) {
    console.error("Error retrieving channel:", error);
    if (error.message === "No token provided" || error.message === "Invalid token") {
      return res.status(401).json({ message: error.message });
    }
    res.status(500).json({ message: "Internal server error" });
  }
};