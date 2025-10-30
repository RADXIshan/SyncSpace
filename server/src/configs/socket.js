import jwt from 'jsonwebtoken';
import { createNotification, createNotificationForOrg } from '../controllers/notificationControllers.js';

// Store online users with their socket IDs and user info
const onlineUsers = new Map();

// Store user to socket mapping for easy lookup
const userSockets = new Map();

// Store active meetings with participant tracking
const activeMeetings = new Map();

// Store meeting deletion timers
const meetingDeletionTimers = new Map();

// Helper function to get user identifier for logging
const getUserIdentifier = (socket) => {
  if (socket.userEmail && socket.userEmail !== 'Unknown') {
    return socket.userEmail;
  }
  if (socket.userName && socket.userName !== 'Unknown User') {
    return socket.userName;
  }
  return `User-${socket.userId}`;
};

export const setupSocketHandlers = (io) => {
  // Middleware to authenticate socket connections
  io.use((socket, next) => {
    try {
      const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.replace('Bearer ', '');
      
      if (!token) {
        return next(new Error('Authentication error: No token provided'));
      }

      if (!process.env.JWT_SECRET_KEY) {
        console.error('JWT_SECRET_KEY is not defined in environment variables');
        return next(new Error('Server configuration error'));
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);
      
      // Validate required fields
      if (!decoded.userId) {
        console.error('Invalid token: missing userId', decoded);
        return next(new Error('Authentication error: Invalid token structure - missing userId'));
      }
      
      socket.userId = decoded.userId;
      socket.userEmail = decoded.email || 'Unknown';
      socket.userName = decoded.name || 'Unknown User';
      

      next();
    } catch (err) {
      // Provide more specific error messages
      if (err.name === 'TokenExpiredError') {
        return next(new Error('Authentication error: Token expired'));
      } else if (err.name === 'JsonWebTokenError') {
        return next(new Error('Authentication error: Invalid token format'));
      }
      
      next(new Error('Authentication error: Invalid token'));
    }
  });

  io.on('connection', (socket) => {

    // Handle user going online
    socket.on('user_online', (userData) => {
      try {
        const userId = socket.userId;
        
        // Store user info
        onlineUsers.set(userId, {
          id: userId,
          email: socket.userEmail,
          name: userData.name,
          photo: userData.photo,
          org_id: userData.org_id,
          socketId: socket.id,
          lastSeen: new Date()
        });

        // Store socket mapping
        userSockets.set(userId, socket.id);

        // Join organization room if user has one
        if (userData.org_id) {
          socket.join(`org_${userData.org_id}`);
          
          // Broadcast to organization members that user is online
          socket.to(`org_${userData.org_id}`).emit('user_status_changed', {
            userId: userId,
            status: 'online',
            user: {
              id: userId,
              email: socket.userEmail,
              name: userData.name,
              photo: userData.photo
            }
          });
        }

        // Send current online users to the newly connected user
        const orgOnlineUsers = getOnlineUsersByOrg(userData.org_id);
        socket.emit('online_users_list', orgOnlineUsers);
      } catch (error) {
        console.error('Error handling user_online event:', error);
      }
    });

    // Handle user status updates (away, busy, etc.)
    socket.on('update_status', (statusData) => {
      const userId = socket.userId;
      const user = onlineUsers.get(userId);
      
      if (user) {
        user.status = statusData.status;
        user.customStatus = statusData.customStatus;
        onlineUsers.set(userId, user);

        // Broadcast status change to organization members
        if (user.org_id) {
          socket.to(`org_${user.org_id}`).emit('user_status_changed', {
            userId: userId,
            status: statusData.status,
            customStatus: statusData.customStatus,
            user: {
              id: userId,
              email: user.email,
              name: user.name,
              photo: user.photo
            }
          });
        }
      }
    });

    // Handle joining/leaving organization rooms
    socket.on('join_organization', (orgId) => {
      socket.join(`org_${orgId}`);
      
      // Update user's org_id
      const userId = socket.userId;
      const user = onlineUsers.get(userId);
      if (user) {
        user.org_id = orgId;
        onlineUsers.set(userId, user);
      }
    });

    socket.on('leave_organization', (orgId) => {
      socket.leave(`org_${orgId}`);
      
      // Update user's org_id
      const userId = socket.userId;
      const user = onlineUsers.get(userId);
      if (user) {
        user.org_id = null;
        onlineUsers.set(userId, user);
      }
    });

    // Handle disconnection
    socket.on('disconnect', async () => {
      const userId = socket.userId;
      const user = onlineUsers.get(userId);
      
      if (user) {
        // Broadcast to organization members that user is offline
        if (user.org_id) {
          socket.to(`org_${user.org_id}`).emit('user_status_changed', {
            userId: userId,
            status: 'offline',
            lastSeen: new Date(),
            user: {
              id: userId,
              email: user.email,
              name: user.name,
              photo: user.photo
            }
          });
        }

        // Remove user from online users
        onlineUsers.delete(userId);
        userSockets.delete(userId);
      }

      // WebRTC cleanup - notify all rooms that this user left
      console.log(`User ${socket.id} disconnected`);
      if (socket.currentRoom) {
        socket.to(socket.currentRoom).emit('user-left', socket.id);
        
        // Update meeting participants on disconnect
        if (activeMeetings.has(socket.currentRoom)) {
          const meeting = activeMeetings.get(socket.currentRoom);
          
          console.log(`👋 User ${socket.userName} (${socket.userId}) disconnecting from meeting ${socket.currentRoom}`);
          console.log(`📊 Before disconnect - Participants: ${meeting.participants.size}, Details: ${meeting.participantDetails ? meeting.participantDetails.size : 0}`);
          
          // Update participant left time in history
          if (meeting.allParticipants && meeting.allParticipants.has(socket.userId)) {
            const participant = meeting.allParticipants.get(socket.userId);
            participant.leftAt = new Date();
            meeting.allParticipants.set(socket.userId, participant);
          }
          
          // Check if this will be the last participant BEFORE removing them
          const willBeEmpty = meeting.participants.size === 1 && meeting.participants.has(socket.userId);
          
          if (willBeEmpty && !meeting.isEnding) {
            console.log(`Meeting ${socket.currentRoom} will be empty after disconnect - last participant leaving`);
            console.log(`👥 All participants who were in meeting:`, Array.from(meeting.allParticipants.values()).map(p => `${p.name} (${p.id})`));
            meeting.isEnding = true; // Prevent duplicate calls
            // Handle meeting end BEFORE removing the participant so we have the data
            await handleMeetingEnd(socket.currentRoom, io);
          }
          
          // Now remove the participant from active lists
          meeting.participants.delete(socket.userId);
          
          // Remove from participant details
          if (meeting.participantDetails) {
            meeting.participantDetails.delete(socket.userId);
          }
          
          console.log(`📊 After disconnect - Participants: ${meeting.participants.size}, Details: ${meeting.participantDetails ? meeting.participantDetails.size : 0}`);
        }
      }
    });

    // Handle typing indicators for channels
    socket.on('typing_start', (data) => {
      socket.to(`channel_${data.channelId}`).emit('user_typing', {
        userId: socket.userId,
        channelId: data.channelId,
        userName: data.userName || socket.userName
      });
    });

    socket.on('typing_stop', (data) => {
      socket.to(`channel_${data.channelId}`).emit('user_stopped_typing', {
        userId: socket.userId,
        channelId: data.channelId
      });
    });

    // Handle typing indicators for direct messages
    socket.on('dm_typing_start', (data) => {
      const targetSocketId = getUserSocketId(data.targetUserId);
      if (targetSocketId) {
        io.to(targetSocketId).emit('dm_user_typing', {
          userId: socket.userId,
          userName: data.userName || socket.userName,
          targetUserId: data.targetUserId
        });
      }
    });

    socket.on('dm_typing_stop', (data) => {
      const targetSocketId = getUserSocketId(data.targetUserId);
      if (targetSocketId) {
        io.to(targetSocketId).emit('dm_user_stopped_typing', {
          userId: socket.userId,
          targetUserId: data.targetUserId
        });
      }
    });

    // Handle mark as read events
    socket.on('direct_messages_marked_read', (data) => {
      // Emit to the user who marked messages as read (for multi-device sync)
      socket.emit('direct_messages_read', data);
    });

    socket.on('channel_marked_read', (data) => {
      // Emit to the user who marked channel as read (for multi-device sync)
      socket.emit('channel_read', data);
    });

    // Handle message events
    socket.on('send_message', async (data) => {
      try {
        // Verify user has access to the channel
        const hasAccess = await checkChannelAccess(socket.userId, data.channelId);
        if (!hasAccess) {
          socket.emit('error', { message: 'Access denied to this channel' });
          return;
        }

        // Broadcast message to channel room
        socket.to(`channel_${data.channelId}`).emit('new_message', {
          ...data,
          userId: socket.userId,
          userName: socket.userName,
          timestamp: new Date().toISOString()
        });
      } catch (error) {
        console.error('Error handling send_message:', error);
        socket.emit('error', { message: 'Failed to send message' });
      }
    });

    // Handle message reactions
    socket.on('add_reaction', (data) => {
      socket.to(`channel_${data.channelId}`).emit('reaction_added', {
        messageId: data.messageId,
        emoji: data.emoji,
        userId: socket.userId,
        userName: socket.userName
      });
    });

    socket.on('remove_reaction', (data) => {
      socket.to(`channel_${data.channelId}`).emit('reaction_removed', {
        messageId: data.messageId,
        emoji: data.emoji,
        userId: socket.userId
      });
    });

    // Handle joining/leaving channel rooms
    socket.on('join_channel', (channelId) => {
      socket.join(`channel_${channelId}`);
    });

    socket.on('leave_channel', (channelId) => {
      socket.leave(`channel_${channelId}`);
    });

    // Handle joining/leaving meeting chat rooms
    socket.on('join_meeting_chat', (roomId) => {
      socket.join(`meeting_${roomId}`);
    });

    socket.on('leave_meeting_chat', (roomId) => {
      socket.leave(`meeting_${roomId}`);
    });

    // Handle typing indicators for meeting chat
    socket.on('meeting_typing_start', (data) => {
      socket.to(`meeting_${data.roomId}`).emit('meeting_user_typing', {
        userId: socket.userId,
        roomId: data.roomId,
        userName: data.userName || socket.userName
      });
    });

    socket.on('meeting_typing_stop', (data) => {
      socket.to(`meeting_${data.roomId}`).emit('meeting_user_stopped_typing', {
        userId: socket.userId,
        roomId: data.roomId
      });
    });

    // WebRTC Video Call Handlers - Clean and Simple
    socket.on('join-room', async (roomID) => {
      console.log(`🚪 User ${socket.id} (${socket.userName}) joining room ${roomID}`);
      
      // Get users already in the room
      const usersInThisRoom = [];
      const room = io.sockets.adapter.rooms.get(roomID);
      
      if (room) {
        room.forEach(socketId => {
          if (socketId !== socket.id) {
            const participantSocket = io.sockets.sockets.get(socketId);
            if (participantSocket) {
              usersInThisRoom.push({
                socketId: socketId,
                userName: participantSocket.userName || 'Unknown User',
                userEmail: participantSocket.userEmail || 'unknown@email.com',
                userId: participantSocket.userId || socketId
              });
            }
          }
        });
      }
      
      // Track meeting participants
      if (!activeMeetings.has(roomID)) {
        console.log(`🎬 First user joining room ${roomID} - starting meeting notifications`);
        // First user joining - this is the meeting starter
        activeMeetings.set(roomID, {
          startedBy: socket.userId,
          startedByName: socket.userName,
          startedAt: new Date(),
          participants: new Set([socket.userId]),
          participantDetails: new Map([[socket.userId, {
            id: socket.userId,
            name: socket.userName,
            email: socket.userEmail,
            joinedAt: new Date()
          }]]),
          allParticipants: new Map([[socket.userId, {
            id: socket.userId,
            name: socket.userName,
            email: socket.userEmail,
            joinedAt: new Date(),
            leftAt: null
          }]]),
          roomId: roomID,
          isEnding: false
        });
        
        // Send meeting start notifications to channel members
        try {
          await sendMeetingStartNotifications(roomID, socket.userId, socket.userName, io);
        } catch (error) {
          console.error(`💥 Error sending meeting start notifications for room ${roomID}:`, error);
        }
      } else {
        console.log(`👥 User ${socket.userName} (${socket.userId}) joining existing meeting ${roomID}`);
        // Add participant to existing meeting
        const meeting = activeMeetings.get(roomID);
        
        // Log before adding
        console.log(`📊 Before adding - Participants: ${meeting.participants.size}, Details: ${meeting.participantDetails ? meeting.participantDetails.size : 0}`);
        
        meeting.participants.add(socket.userId);
        
        // Store participant details
        if (!meeting.participantDetails) {
          meeting.participantDetails = new Map();
        }
        meeting.participantDetails.set(socket.userId, {
          id: socket.userId,
          name: socket.userName,
          email: socket.userEmail,
          joinedAt: new Date()
        });
        
        // Store in all participants history (never removed)
        if (!meeting.allParticipants) {
          meeting.allParticipants = new Map();
        }
        meeting.allParticipants.set(socket.userId, {
          id: socket.userId,
          name: socket.userName,
          email: socket.userEmail,
          joinedAt: new Date(),
          leftAt: null
        });
        
        // Log after adding
        console.log(`📊 After adding - Participants: ${meeting.participants.size}, Details: ${meeting.participantDetails.size}`);
        console.log(`👥 All participants now:`, Array.from(meeting.participantDetails.values()).map(p => `${p.name} (${p.id})`));
        
        // Clear deletion timer if it exists
        if (meetingDeletionTimers.has(roomID)) {
          clearTimeout(meetingDeletionTimers.get(roomID));
          meetingDeletionTimers.delete(roomID);
          console.log(`⏰ Cleared deletion timer for meeting ${roomID} - user rejoined`);
        }
      }
      
      console.log(`📤 Sending ${usersInThisRoom.length} existing users to new user`);
      // Send existing users to the new user
      socket.emit('existing-users', usersInThisRoom);
      
      // Join the room
      socket.join(roomID);
      
      // Notify existing users about the new user (without signal - just notification)
      socket.to(roomID).emit('user-joined', {
        callerID: socket.id,
        userName: socket.userName || 'Unknown User',
        userEmail: socket.userEmail || 'unknown@email.com',
        userId: socket.userId || socket.id
      });

      // Store room association for this socket
      socket.currentRoom = roomID;
    });

    socket.on('sending-signal', (payload) => {
      console.log(`Sending signal from ${socket.id} to ${payload.userToSignal}`);
      io.to(payload.userToSignal).emit('user-joined', {
        signal: payload.signal,
        callerID: payload.callerID,
        userName: socket.userName || 'Unknown User',
        userEmail: socket.userEmail || 'unknown@email.com',
        userId: socket.userId || socket.id
      });
    });

    socket.on('returning-signal', (payload) => {
      console.log(`Returning signal from ${socket.id} to ${payload.callerID}`);
      io.to(payload.callerID).emit('receiving-answer', {
        signal: payload.signal,
        id: socket.id
      });
    });

    socket.on('leave-room', async (roomID) => {
      console.log(`User ${socket.id} leaving room ${roomID}`);
      socket.leave(roomID);
      socket.to(roomID).emit('user-left', socket.id);
      
      // Update meeting participants
      if (activeMeetings.has(roomID)) {
        const meeting = activeMeetings.get(roomID);
        
        console.log(`👋 User ${socket.userName} (${socket.userId}) leaving meeting ${roomID}`);
        console.log(`📊 Before leave - Participants: ${meeting.participants.size}, Details: ${meeting.participantDetails ? meeting.participantDetails.size : 0}`);
        
        // Update participant left time in history
        if (meeting.allParticipants && meeting.allParticipants.has(socket.userId)) {
          const participant = meeting.allParticipants.get(socket.userId);
          participant.leftAt = new Date();
          meeting.allParticipants.set(socket.userId, participant);
        }
        
        // Check if this will be the last participant BEFORE removing them
        const willBeEmpty = meeting.participants.size === 1 && meeting.participants.has(socket.userId);
        
        if (willBeEmpty && !meeting.isEnding) {
          console.log(`Meeting ${roomID} will be empty after leave - last participant leaving`);
          console.log(`👥 All participants who were in meeting:`, Array.from(meeting.allParticipants.values()).map(p => `${p.name} (${p.id})`));
          meeting.isEnding = true; // Prevent duplicate calls
          // Handle meeting end BEFORE removing the participant so we have the data
          await handleMeetingEnd(roomID, io);
        }
        
        // Now remove the participant from active lists
        meeting.participants.delete(socket.userId);
        
        // Remove from participant details
        if (meeting.participantDetails) {
          meeting.participantDetails.delete(socket.userId);
        }
        
        console.log(`📊 After leave - Participants: ${meeting.participants.size}, Details: ${meeting.participantDetails ? meeting.participantDetails.size : 0}`);
      }
    });

    // Media control events for meetings
    socket.on('toggle-video', (data) => {
      console.log(`User ${socket.id} toggled video:`, data.videoEnabled);
      socket.to(data.roomId).emit('user-video-toggle', {
        socketId: socket.id,
        videoEnabled: data.videoEnabled
      });
    });

    socket.on('toggle-audio', (data) => {
      console.log(`User ${socket.id} toggled audio:`, data.audioEnabled);
      socket.to(data.roomId).emit('user-audio-toggle', {
        socketId: socket.id,
        audioEnabled: data.audioEnabled
      });
    });

    // Screen sharing events
    socket.on('start-screen-share', (data) => {
      console.log(`User ${socket.id} started screen sharing in room ${data.roomId}`);
      socket.to(data.roomId).emit('user-started-screen-share', {
        socketId: socket.id,
        userName: socket.userName || 'Unknown User'
      });
    });

    socket.on('stop-screen-share', (data) => {
      console.log(`User ${socket.id} stopped screen sharing in room ${data.roomId}`);
      socket.to(data.roomId).emit('user-stopped-screen-share', {
        socketId: socket.id,
        userName: socket.userName || 'Unknown User'
      });
    });






  });
};

// Helper function to get online users by organization
export const getOnlineUsersByOrg = (orgId) => {
  if (!orgId) return [];
  
  const orgUsers = [];
  for (const [userId, user] of onlineUsers) {
    if (user.org_id === orgId) {
      orgUsers.push({
        id: userId,
        email: user.email,
        name: user.name,
        photo: user.photo,
        status: user.status || 'online',
        customStatus: user.customStatus,
        lastSeen: user.lastSeen
      });
    }
  }
  return orgUsers;
};

// Helper function to get all online users
export const getAllOnlineUsers = () => {
  const users = [];
  for (const [userId, user] of onlineUsers) {
    users.push({
      id: userId,
      email: user.email,
      name: user.name,
      photo: user.photo,
      org_id: user.org_id,
      status: user.status || 'online',
      customStatus: user.customStatus,
      lastSeen: user.lastSeen
    });
  }
  return users;
};

// Helper function to check if user is online
export const isUserOnline = (userId) => {
  return onlineUsers.has(userId);
};

// Helper function to get user's socket ID
export const getUserSocketId = (userId) => {
  return userSockets.get(userId);
};

// Helper function to check if a user has access to a specific channel
const checkChannelAccess = async (userId, channelId) => {
  try {
    const sql = (await import('../database/db.js')).default;
    
    // Get channel details
    const [channel] = await sql`
      SELECT channel_name, org_id FROM org_channels 
      WHERE channel_id = ${channelId}
    `;
    
    if (!channel) {
      return false; // Channel doesn't exist
    }

    // Check if user is organization owner (has access to all channels)
    const [org] = await sql`
      SELECT created_by FROM organisations WHERE org_id = ${channel.org_id}
    `;
    
    if (org?.created_by === userId) {
      return true; // Organization owner has access to all channels
    }

    // Get user's role, accessible teams, and permissions
    const [memberWithRole] = await sql`
      SELECT om.role, r.accessible_teams, r.manage_channels, r.settings_access
      FROM org_members om
      LEFT JOIN org_roles r ON r.org_id = om.org_id AND r.role_name = om.role
      WHERE om.org_id = ${channel.org_id} AND om.user_id = ${userId}
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
    if (!accessibleTeams || accessibleTeams === null) return true;
    
    // Handle JSONB array - parse if it's a string, use directly if it's already an array
    let teamsArray;
    try {
      teamsArray = typeof accessibleTeams === 'string' 
        ? JSON.parse(accessibleTeams) 
        : accessibleTeams;
    } catch (e) {
      // If parsing fails, assume no access
      return false;
    }
    
    if (!Array.isArray(teamsArray) || teamsArray.length === 0) return true;

    // Check if user has access to this specific channel
    return teamsArray.includes(channel.channel_name);
  } catch (error) {
    console.error('Error checking channel access:', error);
    return false;
  }
};

// Helper function to get online users with access to a specific channel
export const getOnlineUsersWithChannelAccess = async (orgId, channelId) => {
  if (!orgId || !channelId) {
    console.log(`getOnlineUsersWithChannelAccess: Missing orgId (${orgId}) or channelId (${channelId})`);
    return [];
  }
  
  console.log(`getOnlineUsersWithChannelAccess: Looking for users in org ${orgId} with access to channel ${channelId}`);
  console.log(`Total online users: ${onlineUsers.size}`);
  
  const orgUsers = [];
  for (const [userId, user] of onlineUsers) {
    console.log(`Checking user ${userId} (${user.name || user.email}): org_id=${user.org_id}, target_org=${orgId}`);
    if (user.org_id === orgId) {
      const hasAccess = await checkChannelAccess(userId, channelId);
      console.log(`User ${userId} has channel access: ${hasAccess}`);
      if (hasAccess) {
        orgUsers.push({
          id: userId,
          email: user.email,
          name: user.name,
          photo: user.photo,
          status: user.status || 'online',
          customStatus: user.customStatus,
          lastSeen: user.lastSeen,
          socketId: user.socketId
        });
      }
    }
  }
  console.log(`Found ${orgUsers.length} users with channel access`);
  return orgUsers;
};

// Meeting management helper functions
const startMeetingDeletionTimer = (roomID) => {
  // Set 10-minute timer to delete empty meeting
  const timer = setTimeout(async () => {
    try {
      console.log(`Deleting empty meeting ${roomID} after 10 minutes`);
      
      // Remove from active meetings
      activeMeetings.delete(roomID);
      meetingDeletionTimers.delete(roomID);
      
      // Delete meeting from database
      await deleteMeetingFromDatabase(roomID);
      
    } catch (error) {
      console.error(`Error deleting meeting ${roomID}:`, error);
    }
  }, 10 * 60 * 1000); // 10 minutes
  
  meetingDeletionTimers.set(roomID, timer);
};

const handleMeetingEnd = async (roomID, io) => {
  try {
    console.log(`🏁 Meeting ${roomID} ended - last participant left`);
    
    const sql = (await import('../database/db.js')).default;
    
    // Get meeting details from database
    const [meeting] = await sql`
      SELECT m.*, c.channel_name, c.org_id 
      FROM org_meetings m
      JOIN org_channels c ON m.channel_id = c.channel_id
      WHERE m.meeting_link LIKE ${`%/meeting/${roomID}`}
    `;
    
    console.log(`🔍 Database query result for meeting ${roomID}:`, meeting ? 'Found' : 'Not found');
    if (meeting) {
      console.log(`📋 Meeting details: ${meeting.meeting_title} in #${meeting.channel_name} (org: ${meeting.org_id})`);
    }
    
    if (!meeting) {
      console.log(`❌ Meeting ${roomID} not found in database - cannot create report`);
      console.log(`🔍 This might be a custom room or the meeting was already deleted`);
      return;
    }
    
    // Check if meeting lasted at least 30 seconds
    const meetingData = activeMeetings.get(roomID);
    console.log(`📊 Meeting data from activeMeetings:`, meetingData ? 'Found' : 'Not found');
    
    if (meetingData) {
      const startTime = meetingData.startedAt;
      const endTime = new Date();
      const durationSeconds = Math.round((endTime - startTime) / 1000);
      
      console.log(`📊 Meeting duration: ${durationSeconds} seconds (started: ${startTime.toISOString()}, ended: ${endTime.toISOString()})`);
      console.log(`👥 Participants in meeting: ${meetingData.participants.size}`);
      console.log(`👥 Participant details: ${meetingData.participantDetails ? meetingData.participantDetails.size : 0}`);
      
      // Log all participant details for debugging
      if (meetingData.participantDetails) {
        console.log(`👥 Participant details:`, Array.from(meetingData.participantDetails.entries()).map(([id, details]) => 
          `${details.name || details.email} (${id})`));
      }
      
      if (durationSeconds >= 30) {
        console.log(`✅ Meeting duration sufficient (≥30s), creating report...`);
        
        // Check if report already exists
        const sql = (await import('../database/db.js')).default;
        const [existingReport] = await sql`
          SELECT report_id FROM meeting_reports WHERE room_id = ${roomID}
        `;
        
        if (existingReport) {
          console.log(`📋 Meeting report already exists for room ${roomID} (ID: ${existingReport.report_id}), skipping creation`);
          return;
        }
        
        // Create a deep copy of meeting data to preserve it
        const meetingDataCopy = {
          ...meetingData,
          participants: new Set(meetingData.participants),
          participantDetails: meetingData.participantDetails ? 
            new Map(meetingData.participantDetails) : new Map(),
          allParticipants: meetingData.allParticipants ?
            new Map(meetingData.allParticipants) : new Map()
        };
        
        // Create meeting report
        try {
          const report = await createMeetingReportFromServer(roomID, meeting, meetingDataCopy, startTime, endTime);
          if (report) {
            console.log(`✅ Meeting report created successfully for ${roomID} (ID: ${report.report_id})`);
            
            // Send meeting ended notifications to channel members
            console.log(`📢 Sending notifications for meeting end...`);
            await sendMeetingEndNotifications(roomID, meeting, io);
          } else {
            console.log(`⚠️ Meeting report creation returned null (might already exist)`);
          }
          
        } catch (error) {
          console.error(`❌ Error creating meeting report for ${roomID}:`, error);
          console.error(`❌ Error stack:`, error.stack);
        }
      } else {
        console.log(`⏱️ Meeting too short (${durationSeconds}s < 30s), skipping report creation`);
      }
    } else {
      console.log(`❌ No meeting data found in activeMeetings for ${roomID}`);
    }
    
    // Start deletion timer
    console.log(`⏰ Starting deletion timer for meeting ${roomID}`);
    startMeetingDeletionTimer(roomID);
    
  } catch (error) {
    console.error(`💥 Error handling meeting end for ${roomID}:`, error);
    console.error(`💥 Error stack:`, error.stack);
  }
};

const createMeetingReportFromServer = async (roomID, meeting, meetingData, startTime, endTime) => {
  try {
    const sql = (await import('../database/db.js')).default;
    
    console.log(`🔍 Creating report for room: "${roomID}"`);
    console.log(`📊 Meeting data participants:`, {
      participantsSet: Array.from(meetingData.participants),
      participantDetailsSize: meetingData.participantDetails ? meetingData.participantDetails.size : 0,
      participantDetailsKeys: meetingData.participantDetails ? Array.from(meetingData.participantDetails.keys()) : []
    });
    
    // Get meeting messages - try multiple room ID formats
    let messages = await sql`
      SELECT 
        m.*,
        u.name as user_name,
        u.user_photo
      FROM meeting_messages m
      JOIN users u ON m.user_id = u.user_id
      WHERE m.room_id = ${roomID}
      ORDER BY m.created_at ASC
    `;
    
    console.log(`💬 Found ${messages.length} messages for room_id: "${roomID}"`);
    
    // If no messages found, try alternative room ID formats
    if (messages.length === 0) {
      console.log(`🔍 No messages found for "${roomID}", trying alternative formats...`);
      
      // Try with meeting/ prefix
      const altRoomId1 = `meeting/${roomID}`;
      const messages1 = await sql`
        SELECT COUNT(*) as count FROM meeting_messages WHERE room_id = ${altRoomId1}
      `;
      console.log(`🔍 Messages with "meeting/${roomID}": ${messages1[0].count}`);
      
      // Try without any prefix if roomID has one
      if (roomID.includes('/')) {
        const altRoomId2 = roomID.split('/').pop();
        const messages2 = await sql`
          SELECT COUNT(*) as count FROM meeting_messages WHERE room_id = ${altRoomId2}
        `;
        console.log(`🔍 Messages with "${altRoomId2}": ${messages2[0].count}`);
      }
      
      // Get all room_ids to see what's actually in the database
      const allRoomIds = await sql`
        SELECT DISTINCT room_id FROM meeting_messages 
        ORDER BY created_at DESC 
        LIMIT 10
      `;
      console.log(`🔍 Recent room_ids in database:`, allRoomIds.map(r => r.room_id));
    }
    
    // Use complete participant history (allParticipants) which includes everyone who was ever in the meeting
    let participants = [];
    
    if (meetingData.allParticipants && meetingData.allParticipants.size > 0) {
      // Use complete participant history
      participants = Array.from(meetingData.allParticipants.values()).map(p => ({
        id: p.id,
        name: p.name || 'Unknown User',
        email: p.email || 'unknown@email.com',
        photo: null,
        joinedAt: p.joinedAt ? p.joinedAt.toISOString() : startTime.toISOString(),
        leftAt: p.leftAt ? p.leftAt.toISOString() : endTime.toISOString()
      }));
      console.log(`👥 Using complete participant history for ${participants.length} participants:`, 
        participants.map(p => `${p.name} (${p.id})`));
    } else if (meetingData.participantDetails && meetingData.participantDetails.size > 0) {
      // Fallback to current participant details
      participants = Array.from(meetingData.participantDetails.values()).map(p => ({
        id: p.id,
        name: p.name || 'Unknown User',
        email: p.email || 'unknown@email.com',
        photo: null,
        joinedAt: p.joinedAt ? p.joinedAt.toISOString() : startTime.toISOString()
      }));
      console.log(`👥 Using current participant details for ${participants.length} participants:`, 
        participants.map(p => `${p.name} (${p.id})`));
    } else {
      console.log(`⚠️ No participant data found, falling back to database lookup`);
      // Fallback to database lookup
      const participantIds = Array.from(meetingData.participants);
      console.log(`🔍 Participant IDs from Set:`, participantIds);
      
      if (participantIds.length > 0) {
        participants = await sql`
          SELECT user_id as id, name, email, user_photo as photo
          FROM users 
          WHERE user_id = ANY(${participantIds})
        `;
        
        participants = participants.map(p => ({
          ...p,
          joinedAt: startTime.toISOString()
        }));
        console.log(`👥 Fetched ${participants.length} participants from database:`, 
          participants.map(p => `${p.name} (${p.id})`));
      }
    }
    
    if (participants.length === 0) {
      console.log(`⚠️ No participants found! This shouldn't happen.`);
      console.log(`🔍 Meeting data debug:`, {
        startedBy: meetingData.startedBy,
        startedByName: meetingData.startedByName,
        participantsSetSize: meetingData.participants.size,
        participantDetailsSize: meetingData.participantDetails ? meetingData.participantDetails.size : 0,
        allParticipantsSize: meetingData.allParticipants ? meetingData.allParticipants.size : 0
      });
    }
    
    const durationMinutes = Math.round((endTime - startTime) / (1000 * 60));
    
    // Create the meeting report
    const [report] = await sql`
      INSERT INTO meeting_reports (
        room_id, meeting_title, channel_id, org_id, created_by,
        started_at, ended_at, participants, duration_minutes,
        message_count, summary, messages_data
      )
      VALUES (
        ${roomID}, ${meeting.meeting_title || `Meeting ${roomID}`}, ${meeting.channel_id}, ${meeting.org_id}, ${meetingData.startedBy},
        ${startTime.toISOString()}, ${endTime.toISOString()}, ${JSON.stringify(participants)}, ${Math.max(durationMinutes, 0)},
        ${messages.length}, '', ${JSON.stringify(messages)}
      )
      RETURNING *
    `;
    
    console.log(`📋 Created meeting report ${report.report_id} for room ${roomID}`);
    return report;
    
  } catch (error) {
    // Check if report already exists
    if (error.code === '23505') {
      console.log(`📋 Meeting report already exists for room ${roomID}`);
      return null;
    }
    throw error;
  }
};

const sendMeetingEndNotifications = async (roomID, meeting, io) => {
  try {
    console.log(`🔔 Sending meeting ended notifications for room ${roomID}`);
    console.log(`📋 Meeting details:`, {
      channel_id: meeting.channel_id,
      channel_name: meeting.channel_name,
      org_id: meeting.org_id,
      meeting_title: meeting.meeting_title
    });
    
    // Get all users with access to this channel
    const channelUsers = await getOnlineUsersWithChannelAccess(meeting.org_id, meeting.channel_id);
    console.log(`👥 Found ${channelUsers.length} users with channel access:`, channelUsers.map(u => `${u.name || u.email} (${u.id}) - Socket: ${u.socketId || 'offline'}`));
    
    if (channelUsers.length === 0) {
      console.log(`⚠️ No users found with channel access for org ${meeting.org_id}, channel ${meeting.channel_id}`);
      return;
    }
    
    // Also broadcast to the organization room as a fallback
    const notificationData = {
      meetingId: roomID,
      channelName: meeting.channel_name,
      message: `Meeting in #${meeting.channel_name} has ended`,
      reportGenerated: true
    };
    
    console.log(`📢 Broadcasting to org room: org_${meeting.org_id}`);
    io.to(`org_${meeting.org_id}`).emit('meeting_ended_notification', notificationData);
    
    // Create notification for each user with meeting access
    for (const user of channelUsers) {
      try {
        console.log(`📝 Processing notification for user ${user.name || user.email} (${user.id})`);
        
        const { createNotification } = await import('../controllers/notificationControllers.js');
        
        const notificationResult = await createNotification(
          user.id,
          meeting.org_id,
          'meeting_ended',
          'Meeting Ended',
          `Meeting in #${meeting.channel_name} has ended and a report has been generated`,
          {
            relatedId: meeting.channel_id,
            relatedType: 'channel',
            link: `/home/meeting-reports`
          }
        );
        
        console.log(`✅ Database notification created for user ${user.id}:`, notificationResult ? 'Success' : 'Failed');
        
        // Send real-time notification if user is online (individual socket)
        if (user.socketId) {
          console.log(`🚀 Emitting meeting_ended_notification to individual socket ${user.socketId}:`, notificationData);
          io.to(user.socketId).emit('meeting_ended_notification', notificationData);
          console.log(`📡 Sent meeting ended notification to ${user.name || user.email} (${user.socketId})`);
        } else {
          console.log(`⚠️ User ${user.name || user.email} is offline (no socketId)`);
        }
      } catch (error) {
        console.error(`❌ Error sending notification to user ${user.id}:`, error);
        console.error(`❌ Error stack:`, error.stack);
      }
    }
    
    console.log(`🎉 Completed sending meeting ended notifications to ${channelUsers.length} users`);
    
  } catch (error) {
    console.error('💥 Error sending meeting ended notifications:', error);
    console.error('💥 Error stack:', error.stack);
  }
};

const sendMeetingStartNotifications = async (roomID, startedByUserId, startedByUserName, io) => {
  try {
    console.log(`🔔 Starting notification process for meeting ${roomID} started by ${startedByUserName}`);
    const sql = (await import('../database/db.js')).default;
    
    // Get meeting details from database
    // The roomID is actually the room identifier from the meeting link, not the meeting_id
    const [meeting] = await sql`
      SELECT m.*, c.channel_name, c.org_id 
      FROM org_meetings m
      JOIN org_channels c ON m.channel_id = c.channel_id
      WHERE m.meeting_link LIKE ${`%/meeting/${roomID}`}
    `;
    
    console.log(`📋 Meeting query result:`, meeting);
    
    if (!meeting) {
      console.log(`❌ Meeting ${roomID} not found in database - might be a custom room or external meeting`);
      // For custom rooms, we can't send notifications since we don't know the channel/org context
      return;
    }
    
    // Get all users with access to this channel (excluding the starter)
    const channelUsers = await getOnlineUsersWithChannelAccess(meeting.org_id, meeting.channel_id);
    console.log(`👥 Found ${channelUsers.length} users with channel access`);
    
    const usersToNotify = channelUsers.filter(user => user.id !== startedByUserId);
    console.log(`📢 Users to notify (excluding starter):`, usersToNotify.map(u => u.name || u.email));
    
    // Create notification for each user
    for (const user of usersToNotify) {
      try {
        console.log(`📝 Creating notification for user ${user.name || user.email} (${user.id})`);
        
        const notificationResult = await createNotification(
          user.id,
          meeting.org_id,
          'meeting_started',
          'Meeting Started',
          `${startedByUserName} started a meeting in #${meeting.channel_name}`,
          {
            relatedId: meeting.channel_id,
            relatedType: 'channel',
            link: `/meeting/${roomID}`
          }
        );
        
        console.log(`📝 Notification creation result:`, notificationResult);
        
        console.log(`✅ Database notification created for user ${user.id}`);
        
        // Send real-time notification if user is online
        if (user.socketId) {
          console.log(`🚀 Sending real-time notification to socket ${user.socketId}`);
          const notificationData = {
            meetingId: roomID,
            channelName: meeting.channel_name,
            startedBy: startedByUserName,
            message: `${startedByUserName} started a meeting in #${meeting.channel_name}`
          };
          
          io.to(user.socketId).emit('meeting_started_notification', notificationData);
          console.log(`📡 Emitted meeting_started_notification to ${user.socketId}:`, notificationData);
        } else {
          console.log(`⚠️ User ${user.name || user.email} is not online (no socketId)`);
        }
      } catch (error) {
        console.error(`❌ Error sending notification to user ${user.id}:`, error);
      }
    }
    
    console.log(`🎉 Sent meeting start notifications to ${usersToNotify.length} users`);
    
  } catch (error) {
    console.error('💥 Error sending meeting start notifications:', error);
  }
};

const deleteMeetingFromDatabase = async (roomID) => {
  try {
    const sql = (await import('../database/db.js')).default;
    
    // Delete meeting from database using meeting_link
    await sql`
      DELETE FROM org_meetings 
      WHERE meeting_link LIKE ${`%/meeting/${roomID}`}
    `;
    
    console.log(`Successfully deleted meeting ${roomID} from database`);
  } catch (error) {
    console.error(`Error deleting meeting ${roomID} from database:`, error);
  }
};

// Export the maps for use in other modules
export { onlineUsers, userSockets, activeMeetings };