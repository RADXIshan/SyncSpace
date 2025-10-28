import sql from "../database/db.js";
import jwt from "jsonwebtoken";
import nodemailer from "nodemailer";
import dotenv from "dotenv";
import { createNotificationForOrg } from "./notificationControllers.js";
import {
  syncMeetingEventsForUser,
  syncMeetingEventsForOrg,
  createMeetingEventsForNewUser,
} from "./eventControllers.js";

dotenv.config();

// Helper function to verify JWT token
const verifyToken = (req) => {
  const authToken =
    req.cookies.jwt ||
    req.body.token ||
    req.headers.authorization?.split(" ")[1];
  if (!authToken) throw new Error("No token provided");

  try {
    const decoded = jwt.verify(authToken, process.env.JWT_SECRET_KEY);

    // Log token structure for debugging
    if (!decoded.userId) {
      console.error("Token missing userId:", decoded);
      throw new Error("Invalid token structure - missing userId");
    }

    // Check for missing fields and suggest token refresh
    if (!decoded.email || !decoded.name) {
      console.warn(
        `Token for user ${decoded.userId} missing optional fields:`,
        {
          hasEmail: !!decoded.email,
          hasName: !!decoded.name,
        }
      );

      // For now, just warn but don't fail - the client should handle token refresh
      // In the future, we could force a token refresh here
    }

    return decoded.userId;
  } catch (error) {
    console.error("Token verification failed:", error.message);
    throw new Error("Invalid token");
  }
};

// Create Organization
export const createOrganization = async (req, res) => {
  try {
    const userId = verifyToken(req);

    const { name, accessLevel, channels, org_code, roles } = req.body;

    // --- Validation ---
    if (!name?.trim())
      return res.status(400).json({ message: "Organization name is required" });
    if (!accessLevel?.trim())
      return res.status(400).json({ message: "Access level is required" });
    if (!channels?.length)
      return res
        .status(400)
        .json({ message: "At least one channel is required" });
    if (!org_code?.trim())
      return res.status(400).json({ message: "Organization code is required" });

    // --- Create organization ---
    const [newOrg] = await sql`
      INSERT INTO organisations (org_name, channels, access_level, org_code, created_by)
      VALUES (${name.trim()}, ${channels}, ${
      accessLevel || "invite-only"
    }, ${org_code.trim()}, ${userId})
      RETURNING org_id, org_name, access_level, org_code, created_by
    `;

    // --- Add owner with special Owner role ---
    await sql`
      INSERT INTO org_members (org_id, user_id, role, joined_at)
      VALUES (${newOrg.org_id}, ${userId}, 'Owner', NOW())
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
            VALUES (${newOrg.org_id}, ${channel.name.trim()}, ${
            channel.description || ""
          })
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

          // Prevent creating Owner role
          if (roleName === "owner") {
            return res.status(400).json({
              message:
                "The 'Owner' role is reserved and cannot be created manually. It is automatically assigned to the organization owner.",
            });
          }

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
              ${
                Array.isArray(role.accessible_teams)
                  ? role.accessible_teams
                  : Array.isArray(role.accessibleChannels)
                  ? role.accessibleChannels
                  : []
              },
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
    if (
      error.message === "No token provided" ||
      error.message === "Invalid token"
    ) {
      return res.status(401).json({ message: error.message });
    }
    if (error.code === "23505") {
      return res
        .status(400)
        .json({ message: "Organization with this name already exists" });
    }
    res.status(500).json({ message: "Internal server error" });
  }
};

// Get Organization
export const getOrganization = async (req, res) => {
  try {
    const userId = verifyToken(req);
    const org_id = req.params.org_id;

    // Validate org_id parameter
    if (!org_id || isNaN(org_id)) {
      console.error(`[getOrganization] Invalid org_id: ${org_id}`);
      return res.status(400).json({ message: "Invalid organization ID" });
    }

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

    // Determine user's accessible teams and permissions for channel filtering
    const [memberWithRole] = await sql`
      SELECT om.role, r.accessible_teams, r.manage_channels, r.settings_access
      FROM org_members om
      LEFT JOIN org_roles r ON r.org_id = om.org_id AND r.role_name = om.role
      WHERE om.org_id = ${org_id} AND om.user_id = ${userId}
      LIMIT 1
    `;

    const isOwner = organization.created_by === userId;
    const accessibleTeams = memberWithRole?.accessible_teams || null;
    const hasManageChannels = memberWithRole?.manage_channels || false;
    const hasSettingsAccess = memberWithRole?.settings_access || false;

    // Users with manage_channels or settings_access permissions should see all channels
    // Only filter channels if user is not owner and doesn't have manage_channels or settings_access permissions
    if (
      !isOwner &&
      !hasManageChannels &&
      !hasSettingsAccess &&
      Array.isArray(accessibleTeams) &&
      accessibleTeams.length > 0
    ) {
      channels = channels.filter((ch) =>
        accessibleTeams.includes(ch.channel_name)
      );
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
        channels: channels.map((ch) => ({
          id: ch.channel_id,
          name: ch.channel_name,
          description: ch.channel_description,
        })),
        roles: roles.map((role) => ({
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
          accessible_teams: Array.isArray(role.accessible_teams)
            ? role.accessible_teams
            : [],
        })),
      },
    });
  } catch (error) {
    console.error("[getOrganization] Error retrieving organization:", error);
    console.error("[getOrganization] Error stack:", error.stack);
    if (
      error.message === "No token provided" ||
      error.message === "Invalid token"
    ) {
      return res.status(401).json({ message: error.message });
    }
    res.status(500).json({
      message: "Internal server error",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
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
      return res
        .status(400)
        .json({ message: "You are already a member of this organization" });
    }

    // Check if user is already in another organization
    const [currentUser] = await sql`
      SELECT org_id
      FROM users
      WHERE user_id = ${userId}
      LIMIT 1
    `;

    if (currentUser?.org_id) {
      return res
        .status(400)
        .json({
          message:
            "You are already a member of another organization. Please leave your current organization first.",
        });
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
      return res
        .status(500)
        .json({
          message:
            "No roles found in organization. Please contact the administrator.",
        });
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

    // Get user details for notification
    const [newMember] = await sql`
      SELECT name, email, user_photo
      FROM users
      WHERE user_id = ${userId}
    `;

    // Create notifications for existing org members about new member (exclude the new member)
    try {
      await createNotificationForOrg(
        organization.org_id,
        "member_joined",
        "New Member Joined",
        `${newMember.name} has joined your organization`,
        {
          excludeUserId: userId,
          relatedId: userId,
          relatedType: "user",
          link: "/members",
        }
      );

      // Emit socket event for real-time notification (exclude the new member)
      const io = req.app.get("io");
      if (io) {
        const orgRoom = io.sockets.adapter.rooms.get(
          `org_${organization.org_id}`
        );
        if (orgRoom) {
          orgRoom.forEach((socketId) => {
            const socket = io.sockets.sockets.get(socketId);
            if (socket && socket.userId !== userId) {
              socket.emit("member_joined", {
                userId: userId,
                userName: newMember.name,
                userEmail: newMember.email,
                userPhoto: newMember.user_photo,
              });
            }
          });
        }
      }
    } catch (notificationError) {
      console.error(
        "Failed to create member joined notifications:",
        notificationError
      );
      // Don't fail the join if notifications fail
    }

    // Create meeting events for the new member
    try {
      await createMeetingEventsForNewUser(userId, organization.org_id);
      console.log(
        `Created meeting events for new member ${userId} in org ${organization.org_id}`
      );
    } catch (eventError) {
      console.error(
        "Failed to create meeting events for new member:",
        eventError
      );
      // Don't fail the join if event creation fails
    }

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
    if (
      error.message === "No token provided" ||
      error.message === "Invalid token"
    ) {
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
      return res
        .status(400)
        .json({ message: "You are not a member of any organization" });
    }

    // Check if user is the owner/admin of the organization
    const [org] = await sql`
      SELECT created_by
      FROM organisations
      WHERE org_id = ${currentUser.org_id}
      LIMIT 1
    `;

    if (org?.created_by === userId) {
      return res
        .status(400)
        .json({
          message:
            "Organization owner cannot leave. Please transfer ownership or delete the organization.",
        });
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
    if (
      error.message === "No token provided" ||
      error.message === "Invalid token"
    ) {
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

    // Validate org_id parameter
    if (!org_id || isNaN(org_id)) {
      console.error(`[getUserRole] Invalid org_id: ${org_id}`);
      return res.status(400).json({ message: "Invalid organization ID" });
    }

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
      return res
        .status(404)
        .json({ message: "User is not a member of this organization" });
    }

    // Check if user is organization owner (has full access)
    const [org] = await sql`
      SELECT created_by
      FROM organisations
      WHERE org_id = ${org_id}
      LIMIT 1
    `;

    const isOwner = org?.created_by === userId;

    res.status(200).json({
      message: "User role retrieved successfully",
      role: member.role,
      permissions: {
        settings_access: isOwner || member.settings_access || false,
        manage_channels: isOwner || member.manage_channels || false,
        manage_users: isOwner || member.manage_users || false,
        notes_access: isOwner || member.notes_access || false,
        meeting_access: isOwner || member.meeting_access || false,
        noticeboard_access: isOwner || member.noticeboard_access || false,
        roles_access: isOwner || member.roles_access || false,
        invite_access: isOwner || member.invite_access || false,
        isOwner: isOwner, // Include isOwner in permissions object
      },
      isOwner,
    });
  } catch (error) {
    console.error("[getUserRole] Error retrieving user role:", error);
    console.error("[getUserRole] Error stack:", error.stack);
    if (
      error.message === "No token provided" ||
      error.message === "Invalid token"
    ) {
      return res.status(401).json({ message: error.message });
    }
    res.status(500).json({
      message: "Internal server error",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
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
      return res
        .status(403)
        .json({ message: "You are not a member of this organization" });
    }

    const isOwner = org?.created_by === userId;
    const hasSettingsAccess = isOwner || member.settings_access;
    const hasChannelAccess = isOwner || member.manage_channels;
    const hasRolesAccess = isOwner || member.roles_access;

    // Determine what user is trying to update
    const updatingBasicSettings = name || accessLevel;
    const updatingRoles = roles && roles.length > 0;
    const updatingChannels = channels && channels.length > 0;

    // Permission checks
    if (updatingBasicSettings && !hasSettingsAccess) {
      return res.status(403).json({
        message:
          "You need 'Settings Access' permission to update organization settings",
      });
    }

    if (updatingRoles && !hasSettingsAccess && !hasRolesAccess) {
      return res.status(403).json({
        message:
          "You need 'Settings Access' or 'Roles Access' permission to update roles",
      });
    }

    if (updatingChannels && !hasChannelAccess && !hasSettingsAccess) {
      return res.status(403).json({
        message:
          "You need 'Manage Channels' or 'Settings Access' permission to update channels",
      });
    }

    // Validate input only for fields being updated
    if (updatingBasicSettings) {
      if (name && !name.trim()) {
        return res
          .status(400)
          .json({ message: "Organization name is required" });
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
      // Get existing channels
      const existingChannels = await sql`
        SELECT channel_id, channel_name, channel_description
        FROM org_channels
        WHERE org_id = ${org_id}
      `;

      // Validate for duplicate channel names in the new list
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
        }
      }

      // Create maps for easier lookup
      const existingChannelMap = new Map();
      existingChannels.forEach((ch) => {
        existingChannelMap.set(ch.channel_name.toLowerCase(), ch);
      });

      const newChannelMap = new Map();
      channels.forEach((ch) => {
        if (ch.name?.trim()) {
          newChannelMap.set(ch.name.trim().toLowerCase(), ch);
        }
      });

      // Update existing channels or insert new ones
      for (const channel of channels) {
        if (channel.name?.trim()) {
          const channelName = channel.name.trim();
          const channelNameLower = channelName.toLowerCase();
          const existingChannel = existingChannelMap.get(channelNameLower);

          if (existingChannel) {
            // Update existing channel if description changed
            if (
              existingChannel.channel_description !==
              (channel.description || "")
            ) {
              await sql`
                UPDATE org_channels
                SET channel_description = ${channel.description || ""}
                WHERE channel_id = ${existingChannel.channel_id}
              `;
            }
          } else {
            // Insert new channel
            await sql`
              INSERT INTO org_channels (org_id, channel_name, channel_description)
              VALUES (${org_id}, ${channelName}, ${channel.description || ""})
            `;
          }
        }
      }

      // Delete channels that are no longer in the new list
      for (const existingChannel of existingChannels) {
        const existingNameLower = existingChannel.channel_name.toLowerCase();
        if (!newChannelMap.has(existingNameLower)) {
          // Delete the channel (this will handle related data through cascade or manual cleanup)
          await sql`
            DELETE FROM org_channels
            WHERE channel_id = ${existingChannel.channel_id}
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

          // Prevent creating Owner role
          if (roleName === "owner") {
            return res.status(400).json({
              message:
                "The 'Owner' role is reserved and cannot be created manually. It is automatically assigned to the organization owner.",
            });
          }

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
              ${
                Array.isArray(role.accessible_teams)
                  ? role.accessible_teams
                  : Array.isArray(role.accessibleChannels)
                  ? role.accessibleChannels
                  : []
              },
              ${userId}
            )
          `;
        }
      }

      // Sync meeting events for all users after role permissions change
      try {
        await syncMeetingEventsForOrg(org_id);
        console.log(
          `Synced meeting events for org ${org_id} after role permissions update`
        );
      } catch (eventError) {
        console.error(
          "Failed to sync meeting events after role update:",
          eventError
        );
        // Don't fail the role update if event sync fails
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
    if (
      error.message === "No token provided" ||
      error.message === "Invalid token"
    ) {
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
      return res
        .status(403)
        .json({ message: "You are not a member of this organization" });
    }

    const isOwner = org?.created_by === userId;

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
      members: members.map((memberItem) => ({
        id: memberItem.user_id, // Use user_id as the member identifier
        userId: memberItem.user_id,
        name: memberItem.name,
        email: memberItem.email,
        userPhoto: memberItem.user_photo,
        role: memberItem.role,
        joinedAt: memberItem.joined_at,
        accessible_teams: Array.isArray(memberItem.accessible_teams)
          ? memberItem.accessible_teams
          : [],
        isOwner: memberItem.user_id === org?.created_by,
      })),
      canManage: isOwner || member.manage_users,
    });
  } catch (error) {
    console.error("Error retrieving organization members:", error);
    if (
      error.message === "No token provided" ||
      error.message === "Invalid token"
    ) {
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
      return res
        .status(403)
        .json({ message: "You are not a member of this organization" });
    }

    const isOwner = org?.created_by === userId;
    const canManageUsers = isOwner || currentMember.manage_users;

    if (!canManageUsers) {
      return res
        .status(403)
        .json({ message: "You don't have permission to manage users" });
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

    // Prevent changing owner's role
    if (targetMember.user_id === org?.created_by) {
      return res
        .status(400)
        .json({ message: "Cannot change the role of organization owner" });
    }

    // Prevent assigning the Owner role to anyone
    if (role.trim() === "Owner") {
      return res
        .status(400)
        .json({
          message:
            "The Owner role cannot be assigned. It is reserved for the organization owner.",
        });
    }

    // Check if the role exists in the organization
    const [roleExists] = await sql`
      SELECT role_id
      FROM org_roles
      WHERE org_id = ${org_id} AND role_name = ${role.trim()}
      LIMIT 1
    `;

    if (!roleExists) {
      return res
        .status(400)
        .json({
          message: "Invalid role. Role does not exist in this organization",
        });
    }

    // Update member role
    await sql`
      UPDATE org_members
      SET role = ${role.trim()}
      WHERE user_id = ${member_id} AND org_id = ${org_id}
    `;

    // Sync meeting events for the user whose role was changed
    try {
      await syncMeetingEventsForUser(member_id, org_id);
      console.log(
        `Synced meeting events for user ${member_id} after role change to ${role.trim()}`
      );
    } catch (eventError) {
      console.error(
        "Failed to sync meeting events after role change:",
        eventError
      );
      // Don't fail the role update if event sync fails
    }

    res.status(200).json({
      message: "Member role updated successfully",
    });
  } catch (error) {
    console.error("Error updating member role:", error);
    if (
      error.message === "No token provided" ||
      error.message === "Invalid token"
    ) {
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
      return res
        .status(403)
        .json({ message: "You are not a member of this organization" });
    }

    const isOwner = org?.created_by === userId;
    const canManageUsers = isOwner || currentMember.manage_users;

    if (!canManageUsers) {
      return res
        .status(403)
        .json({ message: "You don't have permission to manage users" });
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

    // Prevent removing organization owner
    if (targetMember.user_id === org?.created_by) {
      return res
        .status(400)
        .json({ message: "Cannot remove organization owner" });
    }

    // Clean up meeting events before removing member
    try {
      await sql`
        DELETE FROM events 
        WHERE user_id = ${member_id} AND org_id = ${org_id} AND is_meeting_event = true
      `;
      console.log(
        `Cleaned up meeting events for user ${member_id} leaving org ${org_id}`
      );
    } catch (eventError) {
      console.error("Failed to clean up meeting events:", eventError);
      // Continue with member removal even if cleanup fails
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
      message: "Member removed successfully",
    });
  } catch (error) {
    console.error("Error removing member:", error);
    if (
      error.message === "No token provided" ||
      error.message === "Invalid token"
    ) {
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

    // Get organization details and verify owner
    const [org] = await sql`
      SELECT created_by, org_name
      FROM organisations
      WHERE org_id = ${org_id}
      LIMIT 1
    `;

    if (!org) {
      return res.status(404).json({ message: "Organization not found" });
    }

    // Only organization owner can delete the organization
    if (org.created_by !== userId) {
      return res
        .status(403)
        .json({
          message: "Only the organization owner can delete the organization",
        });
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
      message: `Organization "${org.org_name}" has been successfully deleted`,
    });
  } catch (error) {
    console.error("Error deleting organization:", error);
    if (
      error.message === "No token provided" ||
      error.message === "Invalid token"
    ) {
      return res.status(401).json({ message: error.message });
    }
    res.status(500).json({ message: "Internal server error" });
  }
};

// Send Email Invitations
export const sendInvitations = async (req, res) => {
  try {
    console.log("sendInvitations called with org_id:", req.params.org_id);
    console.log("Request body:", req.body);

    const userId = verifyToken(req);
    console.log("User ID from token:", userId);

    const org_id = req.params.org_id;
    const { emails, message, organizationName, inviteCode } = req.body;

    // Validate org_id parameter
    if (!org_id || isNaN(org_id)) {
      console.error(`Invalid org_id: ${org_id}`);
      return res.status(400).json({ message: "Invalid organization ID" });
    }

    // Validate input
    if (!emails || !Array.isArray(emails) || emails.length === 0) {
      return res
        .status(400)
        .json({ message: "At least one email address is required" });
    }

    if (!message?.trim()) {
      return res.status(400).json({ message: "Message is required" });
    }

    // Check if user has permission to send invites
    console.log(
      "Checking user permissions for org_id:",
      org_id,
      "user_id:",
      userId
    );
    const [member] = await sql`
      SELECT om.role, r.invite_access
      FROM org_members om
      LEFT JOIN org_roles r ON r.org_id = om.org_id AND r.role_name = om.role
      WHERE om.org_id = ${org_id} AND om.user_id = ${userId}
      LIMIT 1
    `;
    console.log("Member found:", member);

    const [org] = await sql`
      SELECT created_by, access_level, org_name
      FROM organisations
      WHERE org_id = ${org_id}
      LIMIT 1
    `;
    console.log("Organization found:", org);

    if (!member) {
      return res
        .status(403)
        .json({ message: "You are not a member of this organization" });
    }

    const isOwner = org?.created_by === userId;

    // Check access level permissions based on organization settings
    const hasInviteAccess = member.invite_access === true; // Handle null/undefined values

    if (org?.access_level === "public") {
      // Public: Anyone can join directly using the code, no invitation needed
      // But members can still send invitations if they have invite_access
      if (!isOwner && member.role !== "admin" && !hasInviteAccess) {
        return res.status(403).json({
          message:
            "You don't have permission to send invitations. Please ask an admin or get 'Invite Access' permission.",
        });
      }
    } else if (org?.access_level === "invite-only") {
      // Invite-only: Only permitted members can invite
      if (!isOwner && member.role !== "admin" && !hasInviteAccess) {
        return res.status(403).json({
          message:
            "You don't have permission to send invitations. Please ask an admin or get 'Invite Access' permission.",
        });
      }
    } else if (org?.access_level === "admin-only") {
      // Admin-only: Only owner or admins can invite
      if (!isOwner && member.role !== "admin") {
        return res.status(403).json({
          message:
            "Only the organization owner or admins can send invitations in this organization.",
        });
      }
    }

    // Validate email formats
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    for (const email of emails) {
      if (!emailRegex.test(email.trim())) {
        return res
          .status(400)
          .json({ message: `Invalid email format: ${email}` });
      }
    }

    // Get inviter information
    const [inviter] = await sql`
      SELECT name, email
      FROM users
      WHERE user_id = ${userId}
      LIMIT 1
    `;

    if (!inviter) {
      return res.status(404).json({ message: "Inviter not found" });
    }

    // Validate environment variables
    if (!process.env.EMAIL || !process.env.APP_PASSWORD) {
      console.error("Missing email configuration:", {
        hasEmail: !!process.env.EMAIL,
        hasAppPassword: !!process.env.APP_PASSWORD,
      });
      return res.status(500).json({
        message: "Email service not configured properly",
      });
    }

    // Import the email template
    const { default: generateOrganizationInviteEmail } = await import("../templates/organizationInviteEmail.js");

    const transporter = nodemailer.createTransport({
      service: "gmail",
      host: "smtp.gmail.com",
      port: 587,
      secure: false,
      auth: {
        user: process.env.EMAIL,
        pass: process.env.APP_PASSWORD,
      },
      connectionTimeout: 10000, // 10 seconds
      greetingTimeout: 5000,    // 5 seconds
      socketTimeout: 10000,     // 10 seconds
    });

    // Verify transporter configuration with timeout
    try {
      await Promise.race([
        transporter.verify(),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Email verification timeout')), 10000)
        )
      ]);
      console.log("Email transporter verified successfully");
    } catch (verifyError) {
      console.error("Email transporter verification failed:", verifyError);
      return res.status(500).json({
        message: "Email service configuration error",
      });
    }

    // Create invite link (assuming you have a frontend route for joining)
    const inviteLink = `${process.env.CLIENT_URL || 'http://localhost:5173'}/join-org?code=${inviteCode}`;

    // Get organization member count for team size
    const memberCount = await sql`
      SELECT COUNT(*) as count
      FROM org_members
      WHERE org_id = ${org_id}
    `;

    const mailOptions = {
      from: {
        name: "SyncSpace",
        address: process.env.EMAIL,
      },
      to: emails,
      subject: `Invitation to Join Organization: ${organizationName || org.org_name} on SyncSpace`,
      html: generateOrganizationInviteEmail({
        inviteeName: "Team Member", // Generic since we're sending to multiple emails
        inviterName: inviter.name,
        orgName: organizationName || org.org_name,
        role: "Member", // Default role for new members
        teamSize: memberCount[0]?.count || 1,
        industry: "Technology", // Default industry
        inviterRole: member.role,
        inviterEmail: inviter.email,
        inviteLink: inviteLink
      }),
    };

    try {
      console.log("Sending email to:", emails);
      const result = await Promise.race([
        transporter.sendMail(mailOptions),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Email sending timeout')), 25000)
        )
      ]);
      console.log("Email sent successfully:", result.messageId);
      res
        .status(200)
        .json({ success: true, message: "Invitations sent successfully" });
    } catch (emailError) {
      console.error("Failed to send email:", emailError);
      res.status(500).json({
        message: "Failed to send invitations",
        error:
          process.env.NODE_ENV === "development"
            ? emailError.message
            : undefined,
      });
    }
  } catch (error) {
    console.error("Error sending invitations:", error);
    console.error("Error stack:", error.stack);
    if (
      error.message === "No token provided" ||
      error.message === "Invalid token"
    ) {
      return res.status(401).json({ message: error.message });
    }
    res.status(500).json({
      message: "Failed to send invitations",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
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
      return res
        .status(403)
        .json({ message: "You are not a member of this organization" });
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

    // Enforce channel access based on role's accessible_teams unless user is owner
    const [orgForOwner] = await sql`
      SELECT created_by
      FROM organisations
      WHERE org_id = ${org_id}
      LIMIT 1
    `;

    const isOwner = orgForOwner?.created_by === userId;

    if (!isOwner) {
      const [memberWithRole] = await sql`
        SELECT r.accessible_teams, r.manage_channels, r.settings_access
        FROM org_members om
        LEFT JOIN org_roles r ON r.org_id = om.org_id AND r.role_name = om.role
        WHERE om.org_id = ${org_id} AND om.user_id = ${userId}
        LIMIT 1
      `;

      const accessibleTeams = memberWithRole?.accessible_teams || null;
      const hasManageChannels = memberWithRole?.manage_channels || false;
      const hasSettingsAccess = memberWithRole?.settings_access || false;

      // Users with manage_channels or settings_access permissions can access all channels
      if (
        !hasManageChannels &&
        !hasSettingsAccess &&
        Array.isArray(accessibleTeams) &&
        accessibleTeams.length > 0
      ) {
        const canAccess = accessibleTeams.includes(channel.channel_name);
        if (!canAccess) {
          return res
            .status(403)
            .json({ message: "You don't have access to this channel" });
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
    if (
      error.message === "No token provided" ||
      error.message === "Invalid token"
    ) {
      return res.status(401).json({ message: error.message });
    }
    res.status(500).json({ message: "Internal server error" });
  }
};

// Transfer Organization Ownership
export const transferOwnership = async (req, res) => {
  try {
    const userId = verifyToken(req);
    const { org_id } = req.params;
    const { new_owner_id } = req.body;

    if (!new_owner_id) {
      return res.status(400).json({ message: "New owner ID is required" });
    }

    // Check if current user is the organization owner
    const [organization] = await sql`
      SELECT created_by, org_name
      FROM organisations
      WHERE org_id = ${org_id}
      LIMIT 1
    `;

    if (!organization) {
      return res.status(404).json({ message: "Organization not found" });
    }

    if (organization.created_by !== userId) {
      return res
        .status(403)
        .json({
          message: "Only the organization owner can transfer ownership",
        });
    }

    // Check if new owner is a member of the organization
    const [newOwner] = await sql`
      SELECT om.user_id, u.name, u.email
      FROM org_members om
      JOIN users u ON u.user_id = om.user_id
      WHERE om.org_id = ${org_id} AND om.user_id = ${new_owner_id}
      LIMIT 1
    `;

    if (!newOwner) {
      return res
        .status(400)
        .json({ message: "New owner must be a member of the organization" });
    }

    // Update organization owner
    await sql`
      UPDATE organisations
      SET created_by = ${new_owner_id}
      WHERE org_id = ${org_id}
    `;

    // Update the new owner's role to 'Owner' if they don't already have it
    await sql`
      UPDATE org_members
      SET role = 'Owner'
      WHERE org_id = ${org_id} AND user_id = ${new_owner_id}
    `;

    // Update the old owner's role to a default role (first available role that's not Owner)
    const [defaultRole] = await sql`
      SELECT role_name
      FROM org_roles
      WHERE org_id = ${org_id} AND LOWER(role_name) != 'owner'
      ORDER BY role_name
      LIMIT 1
    `;

    if (defaultRole) {
      await sql`
        UPDATE org_members
        SET role = ${defaultRole.role_name}
        WHERE org_id = ${org_id} AND user_id = ${userId}
      `;
    }

    res.status(200).json({
      message: "Ownership transferred successfully",
      new_owner: {
        id: newOwner.user_id,
        name: newOwner.name,
        email: newOwner.email,
      },
    });
  } catch (error) {
    console.error("Error transferring ownership:", error);
    if (
      error.message === "No token provided" ||
      error.message === "Invalid token"
    ) {
      return res.status(401).json({ message: error.message });
    }
    res.status(500).json({ message: "Internal server error" });
  }
};

// Update Channel
export const updateChannel = async (req, res) => {
  try {
    const userId = verifyToken(req);
    const { org_id, channel_id } = req.params;
    const { name, description } = req.body;

    if (!name?.trim()) {
      return res.status(400).json({ message: "Channel name is required" });
    }

    // Check if user has permission to manage channels
    const [org] = await sql`
      SELECT created_by
      FROM organisations
      WHERE org_id = ${org_id}
      LIMIT 1
    `;

    if (!org) {
      return res.status(404).json({ message: "Organization not found" });
    }

    const isOwner = org.created_by === userId;

    if (!isOwner) {
      const [member] = await sql`
        SELECT r.manage_channels, r.settings_access
        FROM org_members om
        LEFT JOIN org_roles r ON r.org_id = om.org_id AND r.role_name = om.role
        WHERE om.org_id = ${org_id} AND om.user_id = ${userId}
        LIMIT 1
      `;

      if (!member || (!member.manage_channels && !member.settings_access)) {
        return res
          .status(403)
          .json({ message: "You don't have permission to update channels" });
      }
    }

    // Check if channel exists
    const [existingChannel] = await sql`
      SELECT channel_id, channel_name
      FROM org_channels
      WHERE channel_id = ${channel_id} AND org_id = ${org_id}
      LIMIT 1
    `;

    if (!existingChannel) {
      return res.status(404).json({ message: "Channel not found" });
    }

    // Check if new name conflicts with existing channels (excluding current channel)
    const [conflictingChannel] = await sql`
      SELECT channel_id
      FROM org_channels
      WHERE org_id = ${org_id} AND LOWER(channel_name) = LOWER(${name.trim()}) AND channel_id != ${channel_id}
      LIMIT 1
    `;

    if (conflictingChannel) {
      return res
        .status(400)
        .json({ message: "A channel with this name already exists" });
    }

    // Update the channel
    const [updatedChannel] = await sql`
      UPDATE org_channels
      SET channel_name = ${name.trim()}, channel_description = ${
      description?.trim() || null
    }
      WHERE channel_id = ${channel_id} AND org_id = ${org_id}
      RETURNING channel_id, channel_name, channel_description
    `;

    // Sync meeting events in case channel name changed (affects accessible_teams matching)
    try {
      await syncMeetingEventsForOrg(org_id);
      console.log(
        `Synced meeting events for org ${org_id} after channel update`
      );
    } catch (eventError) {
      console.error(
        "Failed to sync meeting events after channel update:",
        eventError
      );
      // Don't fail the channel update if event sync fails
    }

    res.status(200).json({
      message: "Channel updated successfully",
      channel: {
        id: updatedChannel.channel_id,
        name: updatedChannel.channel_name,
        description: updatedChannel.channel_description,
      },
    });
  } catch (error) {
    console.error("Error updating channel:", error);
    if (
      error.message === "No token provided" ||
      error.message === "Invalid token"
    ) {
      return res.status(401).json({ message: error.message });
    }
    res.status(500).json({ message: "Internal server error" });
  }
};

// Delete Channel
export const deleteChannel = async (req, res) => {
  try {
    const userId = verifyToken(req);
    const { org_id, channel_id } = req.params;

    // Check if user has permission to manage channels
    const [org] = await sql`
      SELECT created_by
      FROM organisations
      WHERE org_id = ${org_id}
      LIMIT 1
    `;

    if (!org) {
      return res.status(404).json({ message: "Organization not found" });
    }

    const isOwner = org.created_by === userId;

    if (!isOwner) {
      const [member] = await sql`
        SELECT r.manage_channels, r.settings_access
        FROM org_members om
        LEFT JOIN org_roles r ON r.org_id = om.org_id AND r.role_name = om.role
        WHERE om.org_id = ${org_id} AND om.user_id = ${userId}
        LIMIT 1
      `;

      if (!member || (!member.manage_channels && !member.settings_access)) {
        return res
          .status(403)
          .json({ message: "You don't have permission to delete channels" });
      }
    }

    // Check if channel exists
    const [existingChannel] = await sql`
      SELECT channel_id, channel_name
      FROM org_channels
      WHERE channel_id = ${channel_id} AND org_id = ${org_id}
      LIMIT 1
    `;

    if (!existingChannel) {
      return res.status(404).json({ message: "Channel not found" });
    }

    // Delete the channel (this will cascade delete related data like notes)
    await sql`
      DELETE FROM org_channels
      WHERE channel_id = ${channel_id} AND org_id = ${org_id}
    `;

    res.status(200).json({
      message: "Channel deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting channel:", error);
    if (
      error.message === "No token provided" ||
      error.message === "Invalid token"
    ) {
      return res.status(401).json({ message: error.message });
    }
    res.status(500).json({ message: "Internal server error" });
  }
};
