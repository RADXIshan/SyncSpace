import { generateAIResponse, generateMeetingSummary } from "../utils/geminiService.js";
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

// Chat with AI assistant
export const chatWithAI = async (req, res) => {
  try {
    const userId = verifyToken(req);
    const { message, conversationHistory, realtimeContext } = req.body;

    if (!message || typeof message !== "string" || message.trim().length === 0) {
      return res.status(400).json({ message: "Message is required" });
    }

    console.log(`\n🤖 AI chat request from user ${userId}`);
    console.log('📨 Message:', message);
    console.log('📊 Real-time context received:');
    console.log('  - User Orgs:', realtimeContext?.userOrganizations?.length || 0);
    console.log('  - Current Org:', realtimeContext?.currentOrganization?.name || 'none');
    console.log('  - Channels:', realtimeContext?.userChannels?.length || 0);
    console.log('  - Members:', realtimeContext?.organizationMembers?.length || 0);
    console.log('  - Roles:', realtimeContext?.organizationRoles?.length || 0);
    console.log('  - Scheduled Meetings:', realtimeContext?.scheduledMeetings?.length || 0);
    console.log('  - Online Users:', realtimeContext?.onlineUsers?.length || 0);
    
    // Build comprehensive context string with proper schema alignment
    let contextString = '';
    if (realtimeContext) {
      const ctx = [];
      
      ctx.push('=== USER REAL-TIME CONTEXT ===');
      
      // User info
      if (realtimeContext.user) {
        ctx.push(`\nCURRENT USER:`);
        ctx.push(`- Name: ${realtimeContext.user.name}`);
        ctx.push(`- Email: ${realtimeContext.user.email}`);
        ctx.push(`- User ID: ${realtimeContext.user.id}`);
      }
      
      // Current location
      if (realtimeContext.currentPage) {
        const page = realtimeContext.currentPage.split('/').filter(Boolean).pop() || 'dashboard';
        ctx.push(`\nCURRENT LOCATION: ${page}`);
      }
      
      // Current organization context (detailed)
      if (realtimeContext.currentOrganization) {
        ctx.push(`\nCURRENT ORGANIZATION:`);
        ctx.push(`- Name: ${realtimeContext.currentOrganization.name}`);
        ctx.push(`- Organization ID: ${realtimeContext.currentOrganization.id}`);
        ctx.push(`- User's Role: ${realtimeContext.currentOrganization.role}`);
        ctx.push(`- Is Owner: ${realtimeContext.currentOrganization.isOwner ? 'Yes' : 'No'}`);
        ctx.push(`- Total Members: ${realtimeContext.currentOrganization.memberCount}`);
        ctx.push(`- Total Channels: ${realtimeContext.currentOrganization.channelCount}`);
      }
      
      // All user organizations
      if (realtimeContext.userOrganizations && realtimeContext.userOrganizations.length > 0) {
        ctx.push(`\nALL USER ORGANIZATIONS (${realtimeContext.userOrganizations.length} total):`);
        realtimeContext.userOrganizations.forEach((org, i) => {
          ctx.push(`${i + 1}. "${org.name}" (ID: ${org.id})`);
          ctx.push(`   - Role: ${org.role}${org.isOwner ? ' (Owner)' : ''}`);
          ctx.push(`   - Members: ${org.memberCount}, Channels: ${org.channelCount}`);
          ctx.push(`   - Joined: ${new Date(org.joinedAt).toLocaleDateString()}`);
        });
      }
      
      // Available channels in current organization
      if (realtimeContext.userChannels && realtimeContext.userChannels.length > 0) {
        ctx.push(`\nAVAILABLE CHANNELS IN CURRENT ORG (${realtimeContext.userChannels.length} total):`);
        realtimeContext.userChannels.forEach((ch, i) => {
          ctx.push(`${i + 1}. #${ch.name} (ID: ${ch.id})`);
          if (ch.description) {
            ctx.push(`   - Description: ${ch.description}`);
          }
        });
      }
      
      // Organization members
      if (realtimeContext.organizationMembers && realtimeContext.organizationMembers.length > 0) {
        ctx.push(`\nORGANIZATION MEMBERS (${realtimeContext.organizationMembers.length} total):`);
        realtimeContext.organizationMembers.slice(0, 15).forEach((m, i) => {
          ctx.push(`${i + 1}. ${m.name} (${m.email})`);
          ctx.push(`   - Role: ${m.role}`);
          ctx.push(`   - Joined: ${new Date(m.joinedAt).toLocaleDateString()}`);
        });
        if (realtimeContext.organizationMembers.length > 15) {
          ctx.push(`... and ${realtimeContext.organizationMembers.length - 15} more members`);
        }
      }
      
      // Organization roles
      if (realtimeContext.organizationRoles && realtimeContext.organizationRoles.length > 0) {
        ctx.push(`\nORGANIZATION ROLES (${realtimeContext.organizationRoles.length} total):`);
        realtimeContext.organizationRoles.forEach((r, i) => {
          ctx.push(`${i + 1}. ${r.name} (ID: ${r.id})`);
          const perms = [];
          if (r.permissions.manageChannels) perms.push('Manage Channels');
          if (r.permissions.manageUsers) perms.push('Manage Users');
          if (r.permissions.settingsAccess) perms.push('Settings Access');
          if (r.permissions.meetingAccess) perms.push('Meeting Access');
          if (r.permissions.notesAccess) perms.push('Notes Access');
          if (r.permissions.noticeboardAccess) perms.push('Noticeboard Access');
          if (r.permissions.rolesAccess) perms.push('Roles Access');
          if (r.permissions.inviteAccess) perms.push('Invite Access');
          if (perms.length > 0) {
            ctx.push(`   - Permissions: ${perms.join(', ')}`);
          }
          if (r.accessibleTeams && r.accessibleTeams.length > 0) {
            ctx.push(`   - Accessible Channels: ${r.accessibleTeams.join(', ')}`);
          }
        });
      }
      
      // Scheduled meetings
      if (realtimeContext.scheduledMeetings && realtimeContext.scheduledMeetings.length > 0) {
        ctx.push(`\nSCHEDULED MEETINGS (${realtimeContext.scheduledMeetings.length} total):`);
        realtimeContext.scheduledMeetings.forEach((m, i) => {
          const startTime = new Date(m.startTime);
          const isUpcoming = startTime > new Date();
          const timeStr = startTime.toLocaleString('en-US', { 
            month: 'short', 
            day: 'numeric', 
            hour: 'numeric', 
            minute: '2-digit',
            hour12: true 
          });
          ctx.push(`${i + 1}. "${m.title}" ${isUpcoming ? '(Upcoming)' : '(Past)'}`);
          ctx.push(`   - Channel: #${m.channelName || 'Unknown'}`);
          ctx.push(`   - Scheduled: ${timeStr}`);
          ctx.push(`   - Created by: ${m.createdByName || 'Unknown'}`);
          if (m.description) {
            ctx.push(`   - Description: ${m.description}`);
          }
          ctx.push(`   - Status: ${m.started ? 'Started' : 'Not started yet'}`);
        });
      } else {
        ctx.push(`\nSCHEDULED MEETINGS: No meetings scheduled`);
      }
      
      // Online users (real-time via socket)
      if (realtimeContext.onlineUsers && realtimeContext.onlineUsers.length > 0) {
        ctx.push(`\nONLINE USERS RIGHT NOW (${realtimeContext.onlineUsers.length} online):`);
        realtimeContext.onlineUsers.slice(0, 15).forEach((u, i) => {
          const statusEmoji = u.status === 'online' ? '🟢' : u.status === 'away' ? '🟡' : u.status === 'busy' ? '🔴' : '⚪';
          ctx.push(`${i + 1}. ${statusEmoji} ${u.name} (${u.email})`);
          ctx.push(`   - Status: ${u.status || 'online'}`);
          if (u.customStatus) {
            ctx.push(`   - Custom Status: ${u.customStatus}`);
          }
        });
        if (realtimeContext.onlineUsers.length > 15) {
          ctx.push(`... and ${realtimeContext.onlineUsers.length - 15} more online`);
        }
      } else {
        ctx.push(`\nONLINE USERS: No users currently online in this organization`);
      }
      
      // Active meetings
      if (realtimeContext.activeMeetings && realtimeContext.activeMeetings.length > 0) {
        ctx.push(`\nACTIVE MEETINGS: ${realtimeContext.activeMeetings.length} meeting(s) in progress`);
        realtimeContext.activeMeetings.forEach((m, i) => {
          ctx.push(`${i + 1}. Meeting in channel ${m.channelId} (Room: ${m.roomId})`);
          ctx.push(`   - Started: ${new Date(m.startedAt).toLocaleTimeString()}`);
        });
      }
      
      // Recent activity
      if (realtimeContext.recentMessages && realtimeContext.recentMessages.length > 0) {
        ctx.push(`\nRECENT ACTIVITY: ${realtimeContext.recentMessages.length} messages in last few minutes`);
      }
      
      if (realtimeContext.lastActivity) {
        ctx.push(`\nLAST USER ACTIVITY: ${realtimeContext.lastActivity.replace(/_/g, ' ')}`);
      }
      
      ctx.push('\n=== END CONTEXT ===\n');
      
      contextString = ctx.join('\n');
    }

    const response = await generateAIResponse(message, conversationHistory || [], contextString);

    res.json({
      message: "AI response generated successfully",
      response,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error("Error in AI chat:", error);
    
    if (["No token provided", "Invalid token"].includes(error.message)) {
      return res.status(401).json({ message: error.message });
    }
    
    res.status(500).json({ 
      message: "Failed to generate AI response",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Generate meeting summary
export const generateMeetingSummaryController = async (req, res) => {
  try {
    const userId = verifyToken(req);
    const { meetingData } = req.body;

    if (!meetingData) {
      return res.status(400).json({ message: "Meeting data is required" });
    }

    console.log(`Generating meeting summary for user ${userId}`);

    const summary = await generateMeetingSummary(meetingData);

    res.json({
      message: "Meeting summary generated successfully",
      summary,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error("Error generating meeting summary:", error);
    
    if (["No token provided", "Invalid token"].includes(error.message)) {
      return res.status(401).json({ message: error.message });
    }
    
    res.status(500).json({ 
      message: "Failed to generate meeting summary",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};
