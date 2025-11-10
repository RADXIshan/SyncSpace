import {
  generateAIResponse,
  generateMeetingSummary,
} from "../utils/geminiService.js";
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

// Chat with AI assistant
export const chatWithAI = async (req, res) => {
  try {
    const userId = verifyToken(req);
    const { message, conversationHistory, realtimeContext } = req.body;

    if (
      !message ||
      typeof message !== "string" ||
      message.trim().length === 0
    ) {
      return res.status(400).json({ message: "Message is required" });
    }

    console.log(`\n🤖 AI chat request from user ${userId}`);
    console.log("📨 Message:", message);
    console.log("📊 Real-time context received:");
    console.log(
      "  - User Orgs:",
      realtimeContext?.userOrganizations?.length || 0
    );
    console.log(
      "  - Current Org:",
      realtimeContext?.currentOrganization?.name || "none"
    );
    console.log("  - Channels:", realtimeContext?.userChannels?.length || 0);
    console.log(
      "  - Members:",
      realtimeContext?.organizationMembers?.length || 0
    );
    console.log("  - Roles:", realtimeContext?.organizationRoles?.length || 0);
    console.log(
      "  - Scheduled Meetings:",
      realtimeContext?.scheduledMeetings?.length || 0
    );
    console.log(
      "  - Meeting Reports:",
      realtimeContext?.meetingReports?.length || 0
    );
    console.log("  - Notes:", realtimeContext?.notes?.length || 0);
    console.log("  - Notices:", realtimeContext?.notices?.length || 0);
    console.log("  - Events:", realtimeContext?.events?.length || 0);
    console.log("  - Online Users:", realtimeContext?.onlineUsers?.length || 0);

    // Build comprehensive context string with proper schema alignment
    let contextString = "";
    if (realtimeContext) {
      const ctx = [];

      ctx.push("=== USER REAL-TIME CONTEXT ===");

      // User info
      if (realtimeContext.user) {
        ctx.push(`\nCURRENT USER:`);
        ctx.push(`- Name: ${realtimeContext.user.name}`);
        ctx.push(`- Email: ${realtimeContext.user.email}`);
        ctx.push(`- User ID: ${realtimeContext.user.id}`);
      }

      // Current location
      if (realtimeContext.currentPage) {
        const page =
          realtimeContext.currentPage.split("/").filter(Boolean).pop() ||
          "dashboard";
        ctx.push(`\nCURRENT LOCATION: ${page}`);
      }

      // Current organization context (detailed)
      if (realtimeContext.currentOrganization) {
        ctx.push(`\nCURRENT ORGANIZATION:`);
        ctx.push(`- Name: ${realtimeContext.currentOrganization.name}`);
        ctx.push(
          `- Organization ID: ${realtimeContext.currentOrganization.id}`
        );
        ctx.push(`- User's Role: ${realtimeContext.currentOrganization.role}`);
        ctx.push(
          `- Is Owner: ${
            realtimeContext.currentOrganization.isOwner ? "Yes" : "No"
          }`
        );
        ctx.push(
          `- Total Members: ${realtimeContext.currentOrganization.memberCount}`
        );
        ctx.push(
          `- Total Channels: ${realtimeContext.currentOrganization.channelCount}`
        );
      }

      // All user organizations
      if (
        realtimeContext.userOrganizations &&
        realtimeContext.userOrganizations.length > 0
      ) {
        ctx.push(
          `\nALL USER ORGANIZATIONS (${realtimeContext.userOrganizations.length} total):`
        );
        realtimeContext.userOrganizations.forEach((org, i) => {
          ctx.push(`${i + 1}. "${org.name}" (ID: ${org.id})`);
          ctx.push(`   - Role: ${org.role}${org.isOwner ? " (Owner)" : ""}`);
          ctx.push(
            `   - Members: ${org.memberCount}, Channels: ${org.channelCount}`
          );
          ctx.push(
            `   - Joined: ${new Date(org.joinedAt).toLocaleDateString()}`
          );
        });
      }

      // Available channels in current organization
      if (
        realtimeContext.userChannels &&
        realtimeContext.userChannels.length > 0
      ) {
        ctx.push(
          `\nAVAILABLE CHANNELS IN CURRENT ORG (${realtimeContext.userChannels.length} total):`
        );
        realtimeContext.userChannels.forEach((ch, i) => {
          ctx.push(`${i + 1}. #${ch.name} (ID: ${ch.id})`);
          if (ch.description) {
            ctx.push(`   - Description: ${ch.description}`);
          }
        });
      }

      // Organization members
      if (
        realtimeContext.organizationMembers &&
        realtimeContext.organizationMembers.length > 0
      ) {
        ctx.push(
          `\nORGANIZATION MEMBERS (${realtimeContext.organizationMembers.length} total):`
        );
        realtimeContext.organizationMembers.slice(0, 15).forEach((m, i) => {
          ctx.push(`${i + 1}. ${m.name} (${m.email})`);
          ctx.push(`   - Role: ${m.role}`);
          ctx.push(`   - Joined: ${new Date(m.joinedAt).toLocaleDateString()}`);
        });
        if (realtimeContext.organizationMembers.length > 15) {
          ctx.push(
            `... and ${
              realtimeContext.organizationMembers.length - 15
            } more members`
          );
        }
      }

      // Organization roles
      if (
        realtimeContext.organizationRoles &&
        realtimeContext.organizationRoles.length > 0
      ) {
        ctx.push(
          `\nORGANIZATION ROLES (${realtimeContext.organizationRoles.length} total):`
        );
        realtimeContext.organizationRoles.forEach((r, i) => {
          ctx.push(`${i + 1}. ${r.name} (ID: ${r.id})`);
          const perms = [];
          if (r.permissions.manageChannels) perms.push("Manage Channels");
          if (r.permissions.manageUsers) perms.push("Manage Users");
          if (r.permissions.settingsAccess) perms.push("Settings Access");
          if (r.permissions.meetingAccess) perms.push("Meeting Access");
          if (r.permissions.notesAccess) perms.push("Notes Access");
          if (r.permissions.noticeboardAccess) perms.push("Noticeboard Access");
          if (r.permissions.rolesAccess) perms.push("Roles Access");
          if (r.permissions.inviteAccess) perms.push("Invite Access");
          if (perms.length > 0) {
            ctx.push(`   - Permissions: ${perms.join(", ")}`);
          }
          if (r.accessibleTeams && r.accessibleTeams.length > 0) {
            ctx.push(
              `   - Accessible Channels: ${r.accessibleTeams.join(", ")}`
            );
          }
        });
      }

      // Scheduled meetings
      if (
        realtimeContext.scheduledMeetings &&
        realtimeContext.scheduledMeetings.length > 0
      ) {
        ctx.push(
          `\nSCHEDULED MEETINGS (${realtimeContext.scheduledMeetings.length} total):`
        );
        realtimeContext.scheduledMeetings.forEach((m, i) => {
          const startTime = new Date(m.startTime);
          const isUpcoming = startTime > new Date();
          const timeStr = startTime.toLocaleString("en-US", {
            month: "short",
            day: "numeric",
            hour: "numeric",
            minute: "2-digit",
            hour12: true,
          });
          ctx.push(
            `${i + 1}. "${m.title}" ${isUpcoming ? "(Upcoming)" : "(Past)"}`
          );
          ctx.push(`   - Channel: #${m.channelName || "Unknown"}`);
          ctx.push(`   - Scheduled: ${timeStr}`);
          ctx.push(`   - Created by: ${m.createdByName || "Unknown"}`);
          if (m.description) {
            ctx.push(`   - Description: ${m.description}`);
          }
          ctx.push(`   - Status: ${m.started ? "Started" : "Not started yet"}`);
        });
      } else {
        ctx.push(`\nSCHEDULED MEETINGS: No meetings scheduled`);
      }

      // Online users (real-time via socket)
      if (
        realtimeContext.onlineUsers &&
        realtimeContext.onlineUsers.length > 0
      ) {
        ctx.push(
          `\nONLINE USERS RIGHT NOW (${realtimeContext.onlineUsers.length} online):`
        );
        realtimeContext.onlineUsers.slice(0, 15).forEach((u, i) => {
          const statusEmoji =
            u.status === "online"
              ? "🟢"
              : u.status === "away"
              ? "🟡"
              : u.status === "busy"
              ? "🔴"
              : "⚪";
          ctx.push(`${i + 1}. ${statusEmoji} ${u.name} (${u.email})`);
          ctx.push(`   - Status: ${u.status || "online"}`);
          if (u.customStatus) {
            ctx.push(`   - Custom Status: ${u.customStatus}`);
          }
        });
        if (realtimeContext.onlineUsers.length > 15) {
          ctx.push(
            `... and ${realtimeContext.onlineUsers.length - 15} more online`
          );
        }
      } else {
        ctx.push(
          `\nONLINE USERS: No users currently online in this organization`
        );
      }

      // Meeting Reports
      if (
        realtimeContext.meetingReports &&
        realtimeContext.meetingReports.length > 0
      ) {
        ctx.push(
          `\nMEETING REPORTS (${realtimeContext.meetingReports.length} total):`
        );
        realtimeContext.meetingReports.slice(0, 10).forEach((r, i) => {
          ctx.push(`${i + 1}. "${r.title}"`);
          ctx.push(`   - Channel: #${r.channelName || "Unknown"}`);
          ctx.push(`   - Date: ${new Date(r.startedAt).toLocaleDateString()}`);
          ctx.push(`   - Duration: ${r.durationMinutes} minutes`);
          ctx.push(`   - Participants: ${r.participantCount}`);
          ctx.push(`   - Messages: ${r.messageCount}`);
          ctx.push(`   - Created by: ${r.createdBy}`);
          if (r.summary) {
            // Include more of the summary (up to 500 chars) for better context
            const summaryPreview =
              r.summary.length > 500
                ? r.summary.substring(0, 500) + "..."
                : r.summary;
            ctx.push(`   - Summary: ${summaryPreview}`);
          }
        });
        if (realtimeContext.meetingReports.length > 10) {
          ctx.push(
            `... and ${realtimeContext.meetingReports.length - 10} more reports`
          );
        }
        ctx.push(
          `\nNOTE: When user asks for full meeting report details, provide the complete summary without truncation.`
        );
      } else {
        ctx.push(`\nMEETING REPORTS: No meeting reports yet`);
      }

      // Current Meeting Context (if in a meeting)
      if (
        realtimeContext.meetingContext &&
        realtimeContext.meetingContext.page === "meeting"
      ) {
        const mc = realtimeContext.meetingContext;
        console.log("📹 Processing meeting context:", {
          meetingId: mc.meetingId,
          participants: mc.totalParticipants,
          chatMessages: mc.chatMessages?.length || 0,
        });
        ctx.push(`\n=== CURRENT MEETING (LIVE) ===`);
        ctx.push(`Meeting ID: ${mc.meetingId}`);
        ctx.push(`Total Participants: ${mc.totalParticipants}`);

        // Current user in meeting
        if (mc.currentUser) {
          ctx.push(`\nYou (${mc.currentUser.name || mc.currentUser.email}):`);
          ctx.push(
            `  - Video: ${mc.localSettings?.videoEnabled ? "On" : "Off"}`
          );
          ctx.push(
            `  - Audio: ${mc.localSettings?.audioEnabled ? "On" : "Muted"}`
          );
        }

        // Other participants
        if (mc.peers && mc.peers.length > 0) {
          ctx.push(`\nOther Participants:`);
          mc.peers.forEach((peer, i) => {
            ctx.push(`${i + 1}. ${peer.name || peer.email}`);
            ctx.push(`   - Video: ${peer.videoEnabled ? "On" : "Off"}`);
            ctx.push(`   - Audio: ${peer.audioEnabled ? "On" : "Muted"}`);
          });
        }

        // Screen sharing
        if (mc.localSettings?.isScreenSharing) {
          ctx.push(
            `\nScreen Sharing: Active (${mc.localSettings.screenSharingUser})`
          );
        }

        // Meeting chat messages
        if (mc.chatMessages && mc.chatMessages.length > 0) {
          console.log(
            "💬 Chat messages received:",
            JSON.stringify(mc.chatMessages, null, 2)
          );
          ctx.push(`\nMEETING CHAT (${mc.chatMessages.length} messages):`);
          mc.chatMessages.slice(-20).forEach((msg, i) => {
            const time = msg.timestamp
              ? new Date(msg.timestamp).toLocaleTimeString()
              : "Unknown time";
            const user = msg.user || "Unknown user";
            const message = msg.message || "[No content]";
            console.log(
              `Processing message ${i}: user="${user}", message="${message}"`
            );
            ctx.push(`[${time}] ${user}: ${message}`);
          });
          if (mc.chatMessages.length > 20) {
            ctx.push(
              `... (showing last 20 of ${mc.chatMessages.length} messages)`
            );
          }
        } else {
          console.log("💬 No chat messages or empty array:", mc.chatMessages);
          ctx.push(`\nMEETING CHAT: No messages yet`);
        }
      }

      // Notes
      if (realtimeContext.notes && realtimeContext.notes.length > 0) {
        ctx.push(`\nNOTES (${realtimeContext.notes.length} total):`);
        realtimeContext.notes.slice(0, 10).forEach((n, i) => {
          ctx.push(`${i + 1}. "${n.title}"${n.pinned ? " 📌 (Pinned)" : ""}`);
          if (n.channelName) {
            ctx.push(`   - Channel: #${n.channelName}`);
          }
          ctx.push(`   - Created by: ${n.createdBy || "Unknown"}`);
          ctx.push(
            `   - Last updated: ${new Date(n.updatedAt).toLocaleDateString()}`
          );
          if (n.body) {
            // Include full note body (already limited to 200 chars in frontend)
            ctx.push(`   - Content: ${n.body}`);
          }
        });
        if (realtimeContext.notes.length > 10) {
          ctx.push(`... and ${realtimeContext.notes.length - 10} more notes`);
        }
      } else {
        ctx.push(`\nNOTES: No notes created yet`);
      }

      // Notices
      if (realtimeContext.notices && realtimeContext.notices.length > 0) {
        ctx.push(`\nNOTICES (${realtimeContext.notices.length} total):`);
        realtimeContext.notices.slice(0, 10).forEach((n, i) => {
          ctx.push(`${i + 1}. "${n.title}"`);
          ctx.push(`   - Posted by: ${n.createdBy || "Unknown"}`);
          ctx.push(`   - Date: ${new Date(n.createdAt).toLocaleDateString()}`);
          if (n.body) {
            // Include full notice body (already limited to 200 chars in frontend)
            ctx.push(`   - Content: ${n.body}`);
          }
        });
        if (realtimeContext.notices.length > 10) {
          ctx.push(
            `... and ${realtimeContext.notices.length - 10} more notices`
          );
        }
      } else {
        ctx.push(`\nNOTICES: No notices posted yet`);
      }

      // Calendar Events
      if (realtimeContext.events && realtimeContext.events.length > 0) {
        ctx.push(`\nCALENDAR EVENTS (${realtimeContext.events.length} total):`);
        const upcomingEvents = realtimeContext.events.filter(
          (e) => new Date(e.time) > new Date()
        );
        const pastEvents = realtimeContext.events.filter(
          (e) => new Date(e.time) <= new Date()
        );

        if (upcomingEvents.length > 0) {
          ctx.push(`\nUpcoming Events (${upcomingEvents.length}):`);
          upcomingEvents.slice(0, 5).forEach((e, i) => {
            const eventTime = new Date(e.time);
            ctx.push(`${i + 1}. "${e.title}"`);
            ctx.push(`   - Date: ${eventTime.toLocaleString()}`);
            if (e.description) {
              ctx.push(`   - Description: ${e.description}`);
            }
            if (e.isMeetingEvent) {
              ctx.push(`   - Type: Meeting Event`);
            }
          });
        }

        if (pastEvents.length > 0) {
          ctx.push(`\nPast Events: ${pastEvents.length} events`);
        }
      } else {
        ctx.push(`\nCALENDAR EVENTS: No events scheduled`);
      }

      // Active meetings
      if (
        realtimeContext.activeMeetings &&
        realtimeContext.activeMeetings.length > 0
      ) {
        ctx.push(
          `\nACTIVE MEETINGS: ${realtimeContext.activeMeetings.length} meeting(s) in progress`
        );
        realtimeContext.activeMeetings.forEach((m, i) => {
          ctx.push(
            `${i + 1}. Meeting in channel ${m.channelId} (Room: ${m.roomId})`
          );
          ctx.push(
            `   - Started: ${new Date(m.startedAt).toLocaleTimeString()}`
          );
        });
      }

      // Recent activity
      if (
        realtimeContext.recentMessages &&
        realtimeContext.recentMessages.length > 0
      ) {
        ctx.push(
          `\nRECENT ACTIVITY: ${realtimeContext.recentMessages.length} messages in last few minutes`
        );
      }

      if (realtimeContext.lastActivity) {
        ctx.push(
          `\nLAST USER ACTIVITY: ${realtimeContext.lastActivity.replace(
            /_/g,
            " "
          )}`
        );
      }

      ctx.push("\n=== END CONTEXT ===\n");

      contextString = ctx.join("\n");

      // Log a portion of the context to verify meeting chat is included
      if (realtimeContext.meetingContext) {
        const meetingChatSection = contextString.match(
          /=== CURRENT MEETING[\s\S]*?(?=\n===|$)/
        );
        if (meetingChatSection) {
          console.log(
            "📋 Meeting section in context:",
            meetingChatSection[0].substring(0, 500)
          );
        } else {
          console.log("⚠️ Meeting section NOT found in context string!");
        }
      }
    }

    const response = await generateAIResponse(
      message,
      conversationHistory || [],
      contextString
    );

    res.json({
      message: "AI response generated successfully",
      response,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error in AI chat:", error);

    if (["No token provided", "Invalid token"].includes(error.message)) {
      return res.status(401).json({ message: error.message });
    }

    res.status(500).json({
      message: "Failed to generate AI response",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

// Generate meeting summary
export const generateMeetingSummaryController = async (req, res) => {
  try {
    const userId = verifyToken(req);
    const { meetingData, options } = req.body;

    if (!meetingData) {
      return res.status(400).json({ message: "Meeting data is required" });
    }

    console.log(`Generating meeting summary for user ${userId}`);
    console.log("AI summary options:", options || {});

    // Pass options through to the generator so the backend can produce
    // either a concise summary (default) or a more detailed overview
    // when requested by the client.
    const summary = await generateMeetingSummary(meetingData, options || {});

    res.json({
      message: "Meeting summary generated successfully",
      summary,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error generating meeting summary:", error);

    if (["No token provided", "Invalid token"].includes(error.message)) {
      return res.status(401).json({ message: error.message });
    }

    res.status(500).json({
      message: "Failed to generate meeting summary",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};
