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

    // --- Add creator as admin ---
    await sql`
      INSERT INTO org_members (org_id, user_id, role, joined_at)
      VALUES (${newOrg.org_id}, ${userId}, 'admin', NOW())
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
              settings_access, notes_access, meeting_access, noticeboard_access,
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

    // Get organization channels
    const channels = await sql`
      SELECT channel_id, channel_name, channel_description
      FROM org_channels
      WHERE org_id = ${org_id}
      ORDER BY channel_name
    `;

    // Get organization roles
    const roles = await sql`
      SELECT role_id, role_name, manage_channels, manage_users,
             settings_access, notes_access, meeting_access, noticeboard_access
      FROM org_roles
      WHERE org_id = ${org_id}
      ORDER BY role_name
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
          },
        })),
      },
    });
  } catch (error) {
    console.error("Error retrieving organization:", error);
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
      SELECT org_member_id
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

    // Add user to organization members
    await sql`
      INSERT INTO org_members (org_id, user_id, role, joined_at)
      VALUES (${organization.org_id}, ${userId}, 'member', NOW())
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

    // Get user's role in the organization
    const [member] = await sql`
      SELECT role
      FROM org_members
      WHERE org_id = ${org_id} AND user_id = ${userId}
      LIMIT 1
    `;

    if (!member) {
      return res.status(404).json({ message: "User is not a member of this organization" });
    }

    res.status(200).json({
      message: "User role retrieved successfully",
      role: member.role,
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

    // Validate input
    if (!name?.trim()) {
      return res.status(400).json({ message: "Organization name is required" });
    }

    if (!accessLevel?.trim()) {
      return res.status(400).json({ message: "Access level is required" });
    }

    // Check if user has permission to update organization
    const [member] = await sql`
      SELECT role
      FROM org_members
      WHERE org_id = ${org_id} AND user_id = ${userId}
      LIMIT 1
    `;

    const [org] = await sql`
      SELECT created_by
      FROM organisations
      WHERE org_id = ${org_id}
      LIMIT 1
    `;

    if (!member || (member.role !== 'admin' && org?.created_by !== userId)) {
      return res.status(403).json({ message: "You don't have permission to update organization settings" });
    }

    // Update organization basic info
    const [updatedOrg] = await sql`
      UPDATE organisations
      SET org_name = ${name.trim()}, access_level = ${accessLevel.trim()}
      WHERE org_id = ${org_id}
      RETURNING org_id, org_name, access_level, org_code
    `;

    // Update channels if provided
    if (channels && Array.isArray(channels)) {
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

    // Update roles if provided
    if (roles && Array.isArray(roles)) {
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
              settings_access, notes_access, meeting_access, noticeboard_access,
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
      SELECT role
      FROM org_members
      WHERE org_id = ${org_id} AND user_id = ${userId}
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

    // Check access level permissions
    if (org?.access_level === 'admin-only' && member.role !== 'admin' && org?.created_by !== userId) {
      return res.status(403).json({ message: "Only admins can send invitations in this organization" });
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
        subject: `SyncSpace Invitation to join ${organizationName}`,
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
