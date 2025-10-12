import sql from "../database/db.js";
import jwt from "jsonwebtoken";

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

    res.status(200).json({
      message: "Organization retrieved successfully",
      organization: {
        id: organization.org_id,
        name: organization.org_name,
        accessLevel: organization.access_level,
        code: organization.org_code,
        createdAt: organization.created_at,
      },
    });
  } catch (error) {
    console.error("Error retrieving organization:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};
