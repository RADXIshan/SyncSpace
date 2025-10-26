import sql from "../database/db.js";
import jwt from "jsonwebtoken";

// Helper function to verify JWT token
const verifyToken = (req) => {
  const authToken =
    req.cookies.jwt ||
    req.body.token ||
    req.headers.authorization?.split(" ")[1];
  if (!authToken) throw new Error("No token provided");

  try {
    const decoded = jwt.verify(authToken, process.env.JWT_SECRET_KEY);
    return decoded.userId;
  } catch {
    throw new Error("Invalid token");
  }
};

export const createEvent = async (req, res) => {
  try {
    const {
      title,
      time,
      description,
      user_id,
      org_id,
      channel_id,
      meeting_id,
      is_meeting_event,
    } = req.body;

    if (!title || !time || !user_id) {
      return res
        .status(400)
        .json({ message: "Title, time, and user_id are required" });
    }

    const [newEvent] = await sql`
      INSERT INTO events (user_id, event_title, event_time, event_description, org_id, channel_id, meeting_id, is_meeting_event)
      VALUES (${user_id}, ${title}, ${time}, ${description}, ${
      org_id || null
    }, ${channel_id || null}, ${meeting_id || null}, ${
      is_meeting_event || false
    })
      RETURNING event_id, user_id, event_title AS title, event_time AS start, event_description AS description, org_id, channel_id, meeting_id, is_meeting_event
    `;

    res.status(201).json(newEvent);
  } catch (error) {
    console.error("Error creating event:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const getEvents = async (req, res) => {
  try {
    const { user_id, org_id } = req.query;

    if (!user_id) {
      return res.status(400).json({ message: "User ID is required" });
    }

    console.log(`Fetching events for user ${user_id} in org ${org_id || 'none'}`);

    let events;

    if (org_id) {
      // Get events for the specific user in organization context
      // This includes personal events and meeting events created for this user
      events = await sql`
        SELECT DISTINCT e.event_id, e.user_id, e.event_title AS title, e.event_time AS start, 
               e.event_description AS description, e.org_id, e.channel_id, e.meeting_id, e.is_meeting_event
        FROM events e
        LEFT JOIN org_members om ON om.org_id = e.org_id AND om.user_id = ${user_id}
        LEFT JOIN organisations o ON o.org_id = e.org_id
        WHERE e.user_id = ${user_id} AND (
          -- Personal events (no org_id)
          e.org_id IS NULL
          OR
          -- Organization/meeting events for this user where user has access to the org
          (e.org_id = ${org_id} AND (
            -- User is org owner
            o.created_by = ${user_id}
            OR
            -- User is org member
            om.user_id IS NOT NULL
          ))
        )
        ORDER BY e.event_time ASC
      `;
    } else {
      // Get only personal events (no org context)
      events = await sql`
        SELECT event_id, user_id, event_title AS title, event_time AS start, 
               event_description AS description, org_id, channel_id, meeting_id, is_meeting_event
        FROM events 
        WHERE user_id = ${user_id} AND org_id IS NULL 
        ORDER BY event_time ASC
      `;
    }

    console.log(`Found ${events.length} events for user ${user_id}`);
    res.status(200).json(events);
  } catch (error) {
    console.error("Error fetching events:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const updateEvent = async (req, res) => {
  try {
    const userId = verifyToken(req);
    const { id } = req.params;
    const { title, time, description } = req.body;

    // Check if event exists and get its details
    const [event] = await sql`
      SELECT event_id, user_id, is_meeting_event, meeting_id
      FROM events
      WHERE event_id = ${id}
      LIMIT 1
    `;

    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }

    // Prevent editing meeting-generated events
    if (event.is_meeting_event) {
      return res.status(403).json({
        message:
          "Meeting-generated events cannot be edited directly. Please edit the meeting instead.",
      });
    }

    // Check if user owns the event
    if (event.user_id !== userId) {
      return res
        .status(403)
        .json({ message: "You can only edit your own events" });
    }

    const [updatedEvent] = await sql`
      UPDATE events
      SET event_title = ${title}, event_time = ${time}, event_description = ${description}, updated_at = NOW()
      WHERE event_id = ${id}
      RETURNING event_id, user_id, event_title AS title, event_time AS start, event_description AS description, org_id, channel_id, meeting_id, is_meeting_event
    `;

    res.status(200).json(updatedEvent);
  } catch (error) {
    console.error("Error updating event:", error);
    if (
      ["No token provided", "Invalid token", "Token expired"].includes(
        error.message
      )
    ) {
      return res.status(401).json({ message: error.message });
    }
    res.status(500).json({ message: "Internal server error" });
  }
};

export const deleteEvent = async (req, res) => {
  try {
    const userId = verifyToken(req);
    const { id } = req.params;

    // Check if event exists and get its details
    const [event] = await sql`
      SELECT event_id, user_id, is_meeting_event, meeting_id
      FROM events
      WHERE event_id = ${id}
      LIMIT 1
    `;

    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }

    // Prevent deleting meeting-generated events
    if (event.is_meeting_event) {
      return res.status(403).json({
        message:
          "Meeting-generated events cannot be deleted directly. Please delete the meeting instead.",
      });
    }

    // Check if user owns the event
    if (event.user_id !== userId) {
      return res
        .status(403)
        .json({ message: "You can only delete your own events" });
    }

    const [deletedEvent] = await sql`
      DELETE FROM events WHERE event_id = ${id} RETURNING event_id
    `;

    res.status(200).json({ message: "Event deleted successfully" });
  } catch (error) {
    console.error("Error deleting event:", error);
    if (
      ["No token provided", "Invalid token", "Token expired"].includes(
        error.message
      )
    ) {
      return res.status(401).json({ message: error.message });
    }
    res.status(500).json({ message: "Internal server error" });
  }
};

// Helper function to check if a user has access to a specific channel
// Using the same logic as notifications controller
const checkChannelAccess = async (userId, channelId, orgId) => {
  try {
    // Get channel details
    const [channel] = await sql`
      SELECT channel_name FROM org_channels 
      WHERE channel_id = ${channelId} AND org_id = ${orgId}
    `;

    if (!channel) {
      return false; // Channel doesn't exist
    }

    // Check if user is organization owner (has access to all channels)
    const [org] = await sql`
      SELECT created_by FROM organisations WHERE org_id = ${orgId}
    `;

    if (org?.created_by === userId) {
      return true; // Organization owner has access to all channels
    }

    // Get user's role, accessible teams, and permissions
    const [memberWithRole] = await sql`
      SELECT om.role, r.accessible_teams, r.manage_channels, r.settings_access
      FROM org_members om
      LEFT JOIN org_roles r ON r.org_id = om.org_id AND r.role_name = om.role
      WHERE om.org_id = ${orgId} AND om.user_id = ${userId}
    `;

    if (!memberWithRole) {
      return false; // User is not a member of the organization
    }

    const accessibleTeams = memberWithRole.accessible_teams;
    const hasManageChannels = memberWithRole.manage_channels || false;
    const hasSettingsAccess = memberWithRole.settings_access || false;

    // Users with manage_channels or settings_access permissions have access to all channels
    if (hasManageChannels || hasSettingsAccess) {
      return true;
    }

    // If accessible_teams is null or empty, user has access to all channels
    if (!Array.isArray(accessibleTeams) || accessibleTeams.length === 0) {
      return true;
    }

    // Check if user has access to this specific channel
    return accessibleTeams.includes(channel.channel_name);
  } catch (error) {
    console.error("Error checking channel access:", error);
    return false;
  }
};

// Helper function to create events for meeting participants
export const createMeetingEvents = async (
  meetingId,
  orgId,
  channelId,
  title,
  description,
  startTime
) => {
  try {
    // First check if events already exist for this meeting to prevent duplicates
    const existingEvents = await sql`
      SELECT event_id FROM events 
      WHERE meeting_id = ${meetingId} AND is_meeting_event = true
      LIMIT 1
    `;

    if (existingEvents.length > 0) {
      console.log(`Events already exist for meeting ${meetingId}, skipping creation`);
      return { success: true, eventCount: 0, message: 'Events already exist' };
    }

    // Get all organization members
    const userIds = await sql`
      SELECT DISTINCT u.user_id
      FROM users u
      LEFT JOIN org_members om ON om.user_id = u.user_id AND om.org_id = ${orgId}
      LEFT JOIN organisations o ON o.org_id = ${orgId}
      WHERE (
        o.created_by = u.user_id OR om.user_id IS NOT NULL
      )
    `;

    console.log(`Checking access for ${userIds.length} users for meeting ${meetingId} in channel ${channelId || 'org-wide'}`);

    // Filter users based on channel access
    const eligibleUsers = [];
    
    for (const user of userIds) {
      if (channelId) {
        // Channel-specific meeting - check channel access
        try {
          const hasAccess = await checkChannelAccess(user.user_id, channelId, orgId);
          if (hasAccess) {
            eligibleUsers.push(user);
          }
        } catch (error) {
          console.error(`Error checking access for user ${user.user_id}:`, error);
          // Don't grant access on error - this ensures security
        }
      } else {
        // Organization-wide meeting - all org members have access
        eligibleUsers.push(user);
      }
    }

    console.log(`Creating events for ${eligibleUsers.length} eligible users for meeting ${meetingId}`);

    // Create events for eligible users
    let successCount = 0;
    
    for (const user of eligibleUsers) {
      try {
        await sql`
          INSERT INTO events (user_id, event_title, event_time, event_description, org_id, channel_id, meeting_id, is_meeting_event)
          VALUES (${user.user_id}, ${title}, ${startTime}, ${description}, ${orgId}, ${channelId}, ${meetingId}, true)
        `;
        successCount++;
      } catch (error) {
        // If it's a unique constraint violation, skip this user (event already exists)
        if (error.code === '23505') {
          console.log(`Event already exists for user ${user.user_id} and meeting ${meetingId}`);
        } else {
          console.error(`Error creating event for user ${user.user_id}:`, error);
          throw error;
        }
      }
    }

    console.log(`Successfully created ${successCount} events for meeting ${meetingId}`);
    
    return { success: true, eventCount: successCount };
  } catch (error) {
    console.error("Error creating meeting events:", error);
    throw error;
  }
};

// Helper function to update meeting events
export const updateMeetingEvents = async (
  meetingId,
  title,
  description,
  startTime
) => {
  try {
    await sql`
      UPDATE events
      SET event_title = ${title}, 
          event_time = ${startTime}, 
          event_description = ${description},
          updated_at = NOW()
      WHERE meeting_id = ${meetingId} AND is_meeting_event = true
    `;
    return { success: true };
  } catch (error) {
    console.error("Error updating meeting events:", error);
    throw error;
  }
};

// Helper function to delete meeting events
export const deleteMeetingEvents = async (meetingId) => {
  try {
    await sql`
      DELETE FROM events
      WHERE meeting_id = ${meetingId} AND is_meeting_event = true
    `;
    return { success: true };
  } catch (error) {
    console.error("Error deleting meeting events:", error);
    throw error;
  }
};

// Helper function to sync meeting events when user permissions change
export const syncMeetingEventsForUser = async (userId, orgId) => {
  try {
    console.log(`Syncing meeting events for user ${userId} in org ${orgId}`);

    // Get all future meetings in this organization
    const meetings = await sql`
      SELECT meeting_id, title, description, start_time, channel_id, org_id
      FROM org_meetings
      WHERE org_id = ${orgId} AND start_time > NOW()
    `;

    let addedCount = 0;
    let removedCount = 0;

    for (const meeting of meetings) {
      // Check if user should have access to this meeting
      let shouldHaveAccess = true;
      
      if (meeting.channel_id) {
        // Channel-specific meeting - check channel access
        shouldHaveAccess = await checkChannelAccess(userId, meeting.channel_id, orgId);
      }
      // For org-wide meetings (channel_id is null), all org members should have access

      // Check if user currently has an event for this meeting
      const [existingEvent] = await sql`
        SELECT event_id FROM events
        WHERE user_id = ${userId} AND meeting_id = ${meeting.meeting_id} AND is_meeting_event = true
        LIMIT 1
      `;

      if (shouldHaveAccess && !existingEvent) {
        // User should have access but doesn't have event - create it
        try {
          await sql`
            INSERT INTO events (user_id, event_title, event_time, event_description, org_id, channel_id, meeting_id, is_meeting_event)
            VALUES (${userId}, ${meeting.title}, ${meeting.start_time}, ${meeting.description}, ${meeting.org_id}, ${meeting.channel_id}, ${meeting.meeting_id}, true)
          `;
          addedCount++;
        } catch (error) {
          if (error.code !== '23505') { // Ignore unique constraint violations
            console.error(`Error creating event for user ${userId}, meeting ${meeting.meeting_id}:`, error);
          }
        }
      } else if (!shouldHaveAccess && existingEvent) {
        // User shouldn't have access but has event - remove it
        await sql`
          DELETE FROM events
          WHERE user_id = ${userId} AND meeting_id = ${meeting.meeting_id} AND is_meeting_event = true
        `;
        removedCount++;
      }
    }

    console.log(`Sync complete for user ${userId}: added ${addedCount}, removed ${removedCount} events`);
    return { success: true, addedCount, removedCount };
  } catch (error) {
    console.error("Error syncing meeting events for user:", error);
    throw error;
  }
};

// Helper function to sync meeting events for all users in an organization
export const syncMeetingEventsForOrg = async (orgId) => {
  try {
    console.log(`Syncing meeting events for all users in org ${orgId}`);

    // Get all organization members
    const members = await sql`
      SELECT user_id FROM org_members WHERE org_id = ${orgId}
    `;

    let totalAdded = 0;
    let totalRemoved = 0;

    for (const member of members) {
      const result = await syncMeetingEventsForUser(member.user_id, orgId);
      totalAdded += result.addedCount;
      totalRemoved += result.removedCount;
    }

    console.log(`Org sync complete: added ${totalAdded}, removed ${totalRemoved} events total`);
    return { success: true, totalAdded, totalRemoved };
  } catch (error) {
    console.error("Error syncing meeting events for organization:", error);
    throw error;
  }
};

// Helper function to handle new user joining organization
export const createMeetingEventsForNewUser = async (userId, orgId) => {
  try {
    console.log(`Creating meeting events for new user ${userId} in org ${orgId}`);

    // Get all future meetings in this organization
    const meetings = await sql`
      SELECT meeting_id, title, description, start_time, channel_id, org_id
      FROM org_meetings
      WHERE org_id = ${orgId} AND start_time > NOW()
    `;

    let createdCount = 0;

    for (const meeting of meetings) {
      // Check if user should have access to this meeting
      let shouldHaveAccess = true;
      
      if (meeting.channel_id) {
        // Channel-specific meeting - check channel access
        shouldHaveAccess = await checkChannelAccess(userId, meeting.channel_id, orgId);
      }

      if (shouldHaveAccess) {
        try {
          await sql`
            INSERT INTO events (user_id, event_title, event_time, event_description, org_id, channel_id, meeting_id, is_meeting_event)
            VALUES (${userId}, ${meeting.title}, ${meeting.start_time}, ${meeting.description}, ${meeting.org_id}, ${meeting.channel_id}, ${meeting.meeting_id}, true)
          `;
          createdCount++;
        } catch (error) {
          if (error.code !== '23505') { // Ignore unique constraint violations
            console.error(`Error creating event for new user ${userId}, meeting ${meeting.meeting_id}:`, error);
          }
        }
      }
    }

    console.log(`Created ${createdCount} meeting events for new user ${userId}`);
    return { success: true, createdCount };
  } catch (error) {
    console.error("Error creating meeting events for new user:", error);
    throw error;
  }
};


