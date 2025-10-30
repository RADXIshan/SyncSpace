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

// Helper function to check if user has meeting access
const checkMeetingAccess = async (userId, orgId) => {
  try {
    // Check if user is organization owner
    const [org] = await sql`
      SELECT created_by FROM organisations WHERE org_id = ${orgId}
    `;
    
    if (org?.created_by === userId) {
      return true;
    }

    // Check user's role permissions
    const [member] = await sql`
      SELECT om.role, r.meeting_access
      FROM org_members om
      LEFT JOIN org_roles r ON r.org_id = om.org_id AND r.role_name = om.role
      WHERE om.org_id = ${orgId} AND om.user_id = ${userId}
      LIMIT 1
    `;

    return member?.meeting_access || false;
  } catch (error) {
    console.error("Error checking meeting access:", error);
    return false;
  }
};

// Create meeting report when meeting ends
export const createMeetingReport = async (req, res) => {
  try {
    const userId = verifyToken(req);
    const { 
      room_id, 
      meeting_title, 
      channel_id, 
      org_id, 
      started_at, 
      ended_at, 
      participants, 
      duration_minutes,
      summary 
    } = req.body;

    // Validate required fields
    if (!room_id || !meeting_title || !channel_id || !org_id || !started_at || !ended_at) {
      return res.status(400).json({ 
        message: "Missing required fields: room_id, meeting_title, channel_id, org_id, started_at, ended_at" 
      });
    }

    // Check if user has meeting access
    const hasAccess = await checkMeetingAccess(userId, org_id);
    if (!hasAccess) {
      return res.status(403).json({ message: "Access denied - meeting_access permission required" });
    }

    // Check if report already exists for this room
    const [existingReport] = await sql`
      SELECT report_id FROM meeting_reports WHERE room_id = ${room_id}
    `;

    if (existingReport) {
      return res.status(400).json({ message: "Meeting report already exists for this room" });
    }

    // Get meeting messages for the report
    const messages = await sql`
      SELECT 
        m.*,
        u.name as user_name,
        u.user_photo
      FROM meeting_messages m
      JOIN users u ON m.user_id = u.user_id
      WHERE m.room_id = ${room_id}
      ORDER BY m.created_at ASC
    `;

    // Create the meeting report
    const [report] = await sql`
      INSERT INTO meeting_reports (
        room_id, meeting_title, channel_id, org_id, created_by,
        started_at, ended_at, participants, duration_minutes,
        message_count, summary, messages_data
      )
      VALUES (
        ${room_id}, ${meeting_title}, ${channel_id}, ${org_id}, ${userId},
        ${started_at}, ${ended_at}, ${JSON.stringify(participants || [])}, ${duration_minutes || 0},
        ${messages.length}, ${summary || ''}, ${JSON.stringify(messages)}
      )
      RETURNING *
    `;

    res.status(201).json({
      message: "Meeting report created successfully",
      report: {
        id: report.report_id,
        roomId: report.room_id,
        title: report.meeting_title,
        channelId: report.channel_id,
        orgId: report.org_id,
        createdBy: report.created_by,
        startedAt: report.started_at,
        endedAt: report.ended_at,
        participants: report.participants,
        durationMinutes: report.duration_minutes,
        messageCount: report.message_count,
        summary: report.summary,
        createdAt: report.created_at
      }
    });
  } catch (error) {
    console.error("Error creating meeting report:", error);
    if (["No token provided", "Invalid token"].includes(error.message)) {
      return res.status(401).json({ message: error.message });
    }
    res.status(500).json({ message: "Failed to create meeting report" });
  }
};

// Get meeting reports for a channel
export const getChannelMeetingReports = async (req, res) => {
  try {
    const userId = verifyToken(req);
    const { channelId } = req.params;
    const { limit = 20, offset = 0 } = req.query;

    // Get channel and organization info
    const [channel] = await sql`
      SELECT c.*, o.org_id 
      FROM org_channels c
      JOIN organisations o ON o.org_id = c.org_id
      WHERE c.channel_id = ${channelId}
    `;

    if (!channel) {
      return res.status(404).json({ message: "Channel not found" });
    }

    // Check if user has meeting access
    const hasAccess = await checkMeetingAccess(userId, channel.org_id);
    if (!hasAccess) {
      return res.status(403).json({ message: "Access denied - meeting_access permission required" });
    }

    // Check if user has access to this specific channel
    const [org] = await sql`
      SELECT created_by FROM organisations WHERE org_id = ${channel.org_id}
    `;
    
    const isOwner = org?.created_by === userId;

    if (!isOwner) {
      const [memberWithRole] = await sql`
        SELECT r.accessible_teams, r.manage_channels, r.settings_access
        FROM org_members om
        LEFT JOIN org_roles r ON r.org_id = om.org_id AND r.role_name = om.role
        WHERE om.org_id = ${channel.org_id} AND om.user_id = ${userId}
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
          return res.status(403).json({ message: "You don't have access to this channel" });
        }
      }
    }

    // Get meeting reports for this channel
    const reports = await sql`
      SELECT 
        mr.*,
        u.name as created_by_name,
        u.user_photo as created_by_photo
      FROM meeting_reports mr
      JOIN users u ON u.user_id = mr.created_by
      WHERE mr.channel_id = ${channelId}
      ORDER BY mr.created_at DESC
      LIMIT ${limit} OFFSET ${offset}
    `;

    // Get total count for pagination
    const [{ count: totalCount }] = await sql`
      SELECT COUNT(*) as count
      FROM meeting_reports
      WHERE channel_id = ${channelId}
    `;

    res.json({
      reports: reports.map(report => ({
        id: report.report_id,
        roomId: report.room_id,
        title: report.meeting_title,
        channelId: report.channel_id,
        orgId: report.org_id,
        createdBy: {
          id: report.created_by,
          name: report.created_by_name,
          photo: report.created_by_photo
        },
        startedAt: report.started_at,
        endedAt: report.ended_at,
        participants: Array.isArray(report.participants) ? report.participants : (typeof report.participants === 'string' ? JSON.parse(report.participants) : []),
        durationMinutes: report.duration_minutes,
        messageCount: report.message_count,
        summary: report.summary,
        createdAt: report.created_at
      })),
      pagination: {
        total: parseInt(totalCount),
        limit: parseInt(limit),
        offset: parseInt(offset),
        hasMore: parseInt(offset) + parseInt(limit) < parseInt(totalCount)
      }
    });
  } catch (error) {
    console.error("Error fetching channel meeting reports:", error);
    if (["No token provided", "Invalid token"].includes(error.message)) {
      return res.status(401).json({ message: error.message });
    }
    res.status(500).json({ message: "Failed to fetch meeting reports" });
  }
};

// Get meeting reports for an organization
export const getOrgMeetingReports = async (req, res) => {
  try {
    const userId = verifyToken(req);
    const { orgId } = req.params;
    const { limit = 20, offset = 0 } = req.query;

    // Check if user has meeting access
    const hasAccess = await checkMeetingAccess(userId, orgId);
    if (!hasAccess) {
      return res.status(403).json({ message: "Access denied - meeting_access permission required" });
    }

    // Get meeting reports for this organization
    const reports = await sql`
      SELECT 
        mr.*,
        u.name as created_by_name,
        u.user_photo as created_by_photo,
        c.channel_name
      FROM meeting_reports mr
      JOIN users u ON u.user_id = mr.created_by
      JOIN org_channels c ON c.channel_id = mr.channel_id
      WHERE mr.org_id = ${orgId}
      ORDER BY mr.created_at DESC
      LIMIT ${limit} OFFSET ${offset}
    `;

    // Get total count for pagination
    const [{ count: totalCount }] = await sql`
      SELECT COUNT(*) as count
      FROM meeting_reports
      WHERE org_id = ${orgId}
    `;

    res.json({
      reports: reports.map(report => ({
        id: report.report_id,
        roomId: report.room_id,
        title: report.meeting_title,
        channelId: report.channel_id,
        channelName: report.channel_name,
        orgId: report.org_id,
        createdBy: {
          id: report.created_by,
          name: report.created_by_name,
          photo: report.created_by_photo
        },
        startedAt: report.started_at,
        endedAt: report.ended_at,
        participants: Array.isArray(report.participants) ? report.participants : (typeof report.participants === 'string' ? JSON.parse(report.participants) : []),
        durationMinutes: report.duration_minutes,
        messageCount: report.message_count,
        summary: report.summary,
        createdAt: report.created_at
      })),
      pagination: {
        total: parseInt(totalCount),
        limit: parseInt(limit),
        offset: parseInt(offset),
        hasMore: parseInt(offset) + parseInt(limit) < parseInt(totalCount)
      }
    });
  } catch (error) {
    console.error("Error fetching org meeting reports:", error);
    if (["No token provided", "Invalid token"].includes(error.message)) {
      return res.status(401).json({ message: error.message });
    }
    res.status(500).json({ message: "Failed to fetch meeting reports" });
  }
};

// Get single meeting report with full details
export const getMeetingReport = async (req, res) => {
  try {
    const userId = verifyToken(req);
    const { reportId } = req.params;

    // Get meeting report with full details
    const [report] = await sql`
      SELECT 
        mr.*,
        u.name as created_by_name,
        u.user_photo as created_by_photo,
        c.channel_name
      FROM meeting_reports mr
      JOIN users u ON u.user_id = mr.created_by
      JOIN org_channels c ON c.channel_id = mr.channel_id
      WHERE mr.report_id = ${reportId}
    `;

    if (!report) {
      return res.status(404).json({ message: "Meeting report not found" });
    }

    // Check if user has meeting access
    const hasAccess = await checkMeetingAccess(userId, report.org_id);
    if (!hasAccess) {
      return res.status(403).json({ message: "Access denied - meeting_access permission required" });
    }

    // Check if user has access to this specific channel
    const [org] = await sql`
      SELECT created_by FROM organisations WHERE org_id = ${report.org_id}
    `;
    
    const isOwner = org?.created_by === userId;

    if (!isOwner) {
      const [memberWithRole] = await sql`
        SELECT r.accessible_teams, r.manage_channels, r.settings_access
        FROM org_members om
        LEFT JOIN org_roles r ON r.org_id = om.org_id AND r.role_name = om.role
        WHERE om.org_id = ${report.org_id} AND om.user_id = ${userId}
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
        const canAccess = accessibleTeams.includes(report.channel_name);
        if (!canAccess) {
          return res.status(403).json({ message: "You don't have access to this channel" });
        }
      }
    }

    res.json({
      report: {
        id: report.report_id,
        roomId: report.room_id,
        title: report.meeting_title,
        channelId: report.channel_id,
        channelName: report.channel_name,
        orgId: report.org_id,
        createdBy: {
          id: report.created_by,
          name: report.created_by_name,
          photo: report.created_by_photo
        },
        startedAt: report.started_at,
        endedAt: report.ended_at,
        participants: Array.isArray(report.participants) ? report.participants : (typeof report.participants === 'string' ? JSON.parse(report.participants) : []),
        durationMinutes: report.duration_minutes,
        messageCount: report.message_count,
        summary: report.summary,
        messagesData: Array.isArray(report.messages_data) ? report.messages_data : (typeof report.messages_data === 'string' ? JSON.parse(report.messages_data) : []),
        createdAt: report.created_at
      }
    });
  } catch (error) {
    console.error("Error fetching meeting report:", error);
    if (["No token provided", "Invalid token"].includes(error.message)) {
      return res.status(401).json({ message: error.message });
    }
    res.status(500).json({ message: "Failed to fetch meeting report" });
  }
};

// Update meeting report summary
export const updateMeetingReport = async (req, res) => {
  try {
    const userId = verifyToken(req);
    const { reportId } = req.params;
    const { summary } = req.body;

    // Get meeting report
    const [report] = await sql`
      SELECT * FROM meeting_reports WHERE report_id = ${reportId}
    `;

    if (!report) {
      return res.status(404).json({ message: "Meeting report not found" });
    }

    // Check if user has meeting access
    const hasAccess = await checkMeetingAccess(userId, report.org_id);
    if (!hasAccess) {
      return res.status(403).json({ message: "Access denied - meeting_access permission required" });
    }

    // Only the creator or organization owner can update the report
    const [org] = await sql`
      SELECT created_by FROM organisations WHERE org_id = ${report.org_id}
    `;
    
    const isOwner = org?.created_by === userId;
    const isCreator = report.created_by === userId;

    if (!isOwner && !isCreator) {
      return res.status(403).json({ message: "Only the meeting creator or organization owner can update the report" });
    }

    // Update the report
    const [updatedReport] = await sql`
      UPDATE meeting_reports
      SET summary = ${summary || ''}
      WHERE report_id = ${reportId}
      RETURNING *
    `;

    res.json({
      message: "Meeting report updated successfully",
      report: {
        id: updatedReport.report_id,
        summary: updatedReport.summary
      }
    });
  } catch (error) {
    console.error("Error updating meeting report:", error);
    if (["No token provided", "Invalid token"].includes(error.message)) {
      return res.status(401).json({ message: error.message });
    }
    res.status(500).json({ message: "Failed to update meeting report" });
  }
};

// Delete meeting report
export const deleteMeetingReport = async (req, res) => {
  try {
    const userId = verifyToken(req);
    const { reportId } = req.params;

    // Get meeting report
    const [report] = await sql`
      SELECT * FROM meeting_reports WHERE report_id = ${reportId}
    `;

    if (!report) {
      return res.status(404).json({ message: "Meeting report not found" });
    }

    // Check if user has meeting access
    const hasAccess = await checkMeetingAccess(userId, report.org_id);
    if (!hasAccess) {
      return res.status(403).json({ message: "Access denied - meeting_access permission required" });
    }

    // Only the creator or organization owner can delete the report
    const [org] = await sql`
      SELECT created_by FROM organisations WHERE org_id = ${report.org_id}
    `;
    
    const isOwner = org?.created_by === userId;
    const isCreator = report.created_by === userId;

    if (!isOwner && !isCreator) {
      return res.status(403).json({ message: "Only the meeting creator or organization owner can delete the report" });
    }

    // Delete the report
    await sql`
      DELETE FROM meeting_reports WHERE report_id = ${reportId}
    `;

    res.json({
      message: "Meeting report deleted successfully"
    });
  } catch (error) {
    console.error("Error deleting meeting report:", error);
    if (["No token provided", "Invalid token"].includes(error.message)) {
      return res.status(401).json({ message: error.message });
    }
    res.status(500).json({ message: "Failed to delete meeting report" });
  }
};