import sql from "../database/db.js";
import jwt from "jsonwebtoken";
import { createNotificationForOrg } from "./notificationControllers.js";

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

// Helper: Check meeting access
const checkMeetingAccess = async (userId, orgId) => {
  const [org] = await sql`
    SELECT created_by
    FROM organisations
    WHERE org_id = ${orgId}
    LIMIT 1
  `;

  if (!org) return false;

  // Owner has full access
  if (org.created_by === userId) return true;

  const [member] = await sql`
    SELECT r.meeting_access
    FROM org_members om
    LEFT JOIN org_roles r ON r.org_id = om.org_id AND r.role_name = om.role
    WHERE om.org_id = ${orgId} AND om.user_id = ${userId}
    LIMIT 1
  `;

  return Boolean(member?.meeting_access);
};

// Create Meeting
export const createMeeting = async (req, res) => {
  try {
    const userId = verifyToken(req);
    const { org_id, channel_id, title, description, start_time, meeting_link } = req.body;

    // Validation
    if (!org_id || !title?.trim() || !start_time || !meeting_link?.trim()) {
      return res.status(400).json({
        message: "Organization ID, title, start time, and meeting link are required",
      });
    }

    const hasAccess = await checkMeetingAccess(userId, org_id);
    if (!hasAccess) {
      return res.status(403).json({
        message: "You don't have permission to create meetings",
      });
    }

    // Validate start_time is in the future
    const startTime = new Date(start_time);
    if (startTime <= new Date()) {
      return res.status(400).json({
        message: "Meeting start time must be in the future",
      });
    }

    const [newMeeting] = await sql`
      INSERT INTO org_meetings (org_id, channel_id, created_by, title, description, start_time, meeting_link)
      VALUES (${org_id}, ${channel_id || null}, ${userId}, ${title.trim()}, ${description?.trim() || null}, ${start_time}, ${meeting_link.trim()})
      RETURNING meeting_id, title, description, start_time, meeting_link, started, created_at
    `;

    // Create notifications for all org members
    try {
      await createNotificationForOrg(
        org_id,
        'meeting',
        'New Meeting Scheduled',
        `${title.trim()} - ${new Date(start_time).toLocaleString()}`,
        {
          relatedId: newMeeting.meeting_id,
          relatedType: 'meeting',
          link: `/meeting-prep/${newMeeting.meeting_id}`
        }
      );

      // Emit socket event for real-time notification
      const io = req.app.get('io');
      if (io) {
        io.to(`org_${org_id}`).emit('new_meeting', {
          id: newMeeting.meeting_id,
          title: newMeeting.title,
          start_time: newMeeting.start_time,
        });
      }
    } catch (notificationError) {
      console.error('Failed to create meeting notifications:', notificationError);
      // Don't fail the meeting creation if notifications fail
    }

    res.status(201).json({
      message: "Meeting created successfully",
      meeting: newMeeting,
    });
  } catch (error) {
    console.error("Error creating meeting:", error);
    if (["No token provided", "Invalid token", "Token expired"].includes(error.message)) {
      return res.status(401).json({ message: error.message });
    }
    res.status(500).json({ message: "Internal server error" });
  }
};

// Get Single Meeting
export const getMeeting = async (req, res) => {
  try {
    const userId = verifyToken(req);
    const { meeting_id } = req.params;

    if (!meeting_id) {
      return res.status(400).json({ message: "Meeting ID is required" });
    }

    const [meeting] = await sql`
      SELECT m.meeting_id, m.org_id, m.channel_id, m.title, m.description, 
             m.start_time, m.meeting_link, m.started, m.created_at,
             u.name AS created_by_name, u.user_photo AS created_by_photo,
             om.role AS created_by_role,
             c.channel_name
      FROM org_meetings m
      LEFT JOIN users u ON m.created_by = u.user_id
      LEFT JOIN org_members om ON om.user_id = m.created_by AND om.org_id = m.org_id
      LEFT JOIN org_channels c ON c.channel_id = m.channel_id
      WHERE m.meeting_id = ${meeting_id}
      LIMIT 1
    `;

    if (!meeting) {
      return res.status(404).json({ message: "Meeting not found" });
    }

    // Check if user has access to this meeting's organization
    const [userMember] = await sql`
      SELECT om.user_id
      FROM org_members om
      WHERE om.org_id = ${meeting.org_id} AND om.user_id = ${userId}
      LIMIT 1
    `;

    // Check if user is org owner
    const [org] = await sql`
      SELECT created_by
      FROM organisations
      WHERE org_id = ${meeting.org_id}
      LIMIT 1
    `;

    const isOwner = org?.created_by === userId;
    const isMember = Boolean(userMember);

    if (!isOwner && !isMember) {
      return res.status(403).json({ 
        message: "You don't have access to this meeting" 
      });
    }

    res.status(200).json({
      message: "Meeting retrieved successfully",
      meeting,
    });
  } catch (error) {
    console.error("Error retrieving meeting:", error);
    if (["No token provided", "Invalid token", "Token expired"].includes(error.message)) {
      return res.status(401).json({ message: error.message });
    }
    res.status(500).json({ message: "Internal server error" });
  }
};

// Get Meetings
export const getMeetings = async (req, res) => {
  try {
    verifyToken(req); // Just verify token, don't need userId for this endpoint
    const { org_id, channel_id } = req.query;

    if (!org_id) {
      return res.status(400).json({ message: "Organization ID is required" });
    }

    let meetings;
    if (channel_id) {
      // Get meetings for specific channel
      meetings = await sql`
        SELECT m.meeting_id, m.title, m.description, m.start_time, m.meeting_link, m.started, m.created_at,
               u.name AS created_by_name, u.user_photo AS created_by_photo,
               om.role AS created_by_role,
               c.channel_name
        FROM org_meetings m
        LEFT JOIN users u ON m.created_by = u.user_id
        LEFT JOIN org_members om ON om.user_id = m.created_by AND om.org_id = m.org_id
        LEFT JOIN org_channels c ON c.channel_id = m.channel_id
        WHERE m.org_id = ${org_id} AND m.channel_id = ${channel_id}
        ORDER BY m.start_time ASC
      `;
    } else {
      // Get all meetings for organization
      meetings = await sql`
        SELECT m.meeting_id, m.title, m.description, m.start_time, m.meeting_link, m.started, m.created_at,
               u.name AS created_by_name, u.user_photo AS created_by_photo,
               om.role AS created_by_role,
               c.channel_name
        FROM org_meetings m
        LEFT JOIN users u ON m.created_by = u.user_id
        LEFT JOIN org_members om ON om.user_id = m.created_by AND om.org_id = m.org_id
        LEFT JOIN org_channels c ON c.channel_id = m.channel_id
        WHERE m.org_id = ${org_id}
        ORDER BY m.start_time ASC
      `;
    }

    res.status(200).json({
      message: "Meetings retrieved successfully",
      meetings: meetings || [],
    });
  } catch (error) {
    console.error("Error retrieving meetings:", error);
    if (["No token provided", "Invalid token", "Token expired"].includes(error.message)) {
      return res.status(401).json({ message: error.message });
    }
    res.status(500).json({ message: "Internal server error" });
  }
};

// Update Meeting
export const updateMeeting = async (req, res) => {
  try {
    const userId = verifyToken(req);
    const { meeting_id } = req.params;
    const { title, description, start_time, meeting_link, started } = req.body;

    // Get meeting details
    const [meeting] = await sql`
      SELECT org_id, created_by, start_time, started
      FROM org_meetings
      WHERE meeting_id = ${meeting_id}
      LIMIT 1
    `;

    if (!meeting) {
      return res.status(404).json({ message: "Meeting not found" });
    }

    const hasAccess = await checkMeetingAccess(userId, meeting.org_id);
    const isCreator = meeting.created_by === userId;

    if (!hasAccess && !isCreator) {
      return res.status(403).json({
        message: "You don't have permission to update this meeting",
      });
    }

    // Check if meeting has started
    const isMeetingStarted = meeting.started || new Date(meeting.start_time) <= new Date();

    // Validate start_time if provided and meeting hasn't started
    if (start_time && !isMeetingStarted) {
      const startTime = new Date(start_time);
      if (startTime <= new Date()) {
        return res.status(400).json({
          message: "Meeting start time must be in the future",
        });
      }
    }

    // Prevent changing start time if meeting has started
    if (start_time && isMeetingStarted && start_time !== meeting.start_time) {
      return res.status(400).json({
        message: "Cannot change meeting start time - meeting has already started",
      });
    }

    const [updatedMeeting] = await sql`
      UPDATE org_meetings
      SET 
        title = ${title?.trim() || sql`title`},
        description = ${description?.trim() || sql`description`},
        start_time = ${(start_time && !isMeetingStarted) ? start_time : sql`start_time`},
        meeting_link = ${meeting_link?.trim() || sql`meeting_link`},
        started = ${started !== undefined ? started : sql`started`},
        updated_at = NOW()
      WHERE meeting_id = ${meeting_id}
      RETURNING meeting_id, title, description, start_time, meeting_link, started, updated_at
    `;

    res.status(200).json({
      message: "Meeting updated successfully",
      meeting: updatedMeeting,
    });
  } catch (error) {
    console.error("Error updating meeting:", error);
    if (["No token provided", "Invalid token", "Token expired"].includes(error.message)) {
      return res.status(401).json({ message: error.message });
    }
    res.status(500).json({ message: "Internal server error" });
  }
};

// Delete Meeting
export const deleteMeeting = async (req, res) => {
  try {
    const userId = verifyToken(req);
    const { meeting_id } = req.params;

    // Get meeting details
    const [meeting] = await sql`
      SELECT org_id, created_by
      FROM org_meetings
      WHERE meeting_id = ${meeting_id}
      LIMIT 1
    `;

    if (!meeting) {
      return res.status(404).json({ message: "Meeting not found" });
    }

    const hasAccess = await checkMeetingAccess(userId, meeting.org_id);
    const isCreator = meeting.created_by === userId;

    if (!hasAccess && !isCreator) {
      return res.status(403).json({
        message: "You don't have permission to delete this meeting",
      });
    }

    await sql`
      DELETE FROM org_meetings
      WHERE meeting_id = ${meeting_id}
    `;

    res.status(200).json({
      message: "Meeting deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting meeting:", error);
    if (["No token provided", "Invalid token", "Token expired"].includes(error.message)) {
      return res.status(401).json({ message: error.message });
    }
    res.status(500).json({ message: "Internal server error" });
  }
};

// Start Meeting
export const startMeeting = async (req, res) => {
  try {
    const userId = verifyToken(req);
    const { meeting_id } = req.params;

    // Get meeting details
    const [meeting] = await sql`
      SELECT org_id, created_by, started
      FROM org_meetings
      WHERE meeting_id = ${meeting_id}
      LIMIT 1
    `;

    if (!meeting) {
      return res.status(404).json({ message: "Meeting not found" });
    }

    const hasAccess = await checkMeetingAccess(userId, meeting.org_id);
    const isCreator = meeting.created_by === userId;

    if (!hasAccess && !isCreator) {
      return res.status(403).json({
        message: "You don't have permission to start this meeting",
      });
    }

    if (meeting.started) {
      return res.status(400).json({ message: "Meeting has already been started" });
    }

    const [updatedMeeting] = await sql`
      UPDATE org_meetings
      SET started = true, updated_at = NOW()
      WHERE meeting_id = ${meeting_id}
      RETURNING meeting_id, title, started, updated_at
    `;

    res.status(200).json({
      message: "Meeting started successfully",
      meeting: updatedMeeting,
    });
  } catch (error) {
    console.error("Error starting meeting:", error);
    if (["No token provided", "Invalid token", "Token expired"].includes(error.message)) {
      return res.status(401).json({ message: error.message });
    }
    res.status(500).json({ message: "Internal server error" });
  }
};