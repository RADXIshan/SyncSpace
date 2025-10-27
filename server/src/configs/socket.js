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
    socket.on('disconnect', () => {
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
          meeting.participants.delete(socket.userId);
          
          // Check if meeting is now empty
          if (meeting.participants.size === 0) {
            console.log(`Meeting ${socket.currentRoom} is now empty after disconnect, starting deletion timer`);
            startMeetingDeletionTimer(socket.currentRoom);
          }
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

    // WebRTC Video Call Handlers - Clean and Simple
    socket.on('join-room', async (roomID) => {
      console.log(`User ${socket.id} (${socket.userName}) joining room ${roomID}`);
      
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
        // First user joining - this is the meeting starter
        activeMeetings.set(roomID, {
          startedBy: socket.userId,
          startedAt: new Date(),
          participants: new Set([socket.userId]),
          roomId: roomID
        });
        
        // Send meeting start notifications to channel members
        await sendMeetingStartNotifications(roomID, socket.userId, socket.userName, io);
      } else {
        // Add participant to existing meeting
        const meeting = activeMeetings.get(roomID);
        meeting.participants.add(socket.userId);
        
        // Clear deletion timer if it exists
        if (meetingDeletionTimers.has(roomID)) {
          clearTimeout(meetingDeletionTimers.get(roomID));
          meetingDeletionTimers.delete(roomID);
          console.log(`Cleared deletion timer for meeting ${roomID} - user rejoined`);
        }
      }
      
      console.log(`Sending ${usersInThisRoom.length} existing users to new user`);
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

    socket.on('leave-room', (roomID) => {
      console.log(`User ${socket.id} leaving room ${roomID}`);
      socket.leave(roomID);
      socket.to(roomID).emit('user-left', socket.id);
      
      // Update meeting participants
      if (activeMeetings.has(roomID)) {
        const meeting = activeMeetings.get(roomID);
        meeting.participants.delete(socket.userId);
        
        // Check if meeting is now empty
        if (meeting.participants.size === 0) {
          console.log(`Meeting ${roomID} is now empty, starting deletion timer`);
          startMeetingDeletionTimer(roomID);
        }
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

const sendMeetingStartNotifications = async (roomID, startedByUserId, startedByUserName, io) => {
  try {
    console.log(`Starting notification process for meeting ${roomID} started by ${startedByUserName}`);
    const sql = (await import('../database/db.js')).default;
    
    // Get meeting details from database
    const [meeting] = await sql`
      SELECT m.*, c.channel_name, c.org_id 
      FROM org_meetings m
      JOIN org_channels c ON m.channel_id = c.channel_id
      WHERE m.meeting_id = ${roomID}
    `;
    
    console.log(`Meeting query result:`, meeting);
    
    if (!meeting) {
      console.log(`Meeting ${roomID} not found in database`);
      return;
    }
    
    // Get all users with access to this channel (excluding the starter)
    const channelUsers = await getOnlineUsersWithChannelAccess(meeting.org_id, meeting.channel_id);
    console.log(`Found ${channelUsers.length} users with channel access`);
    
    const usersToNotify = channelUsers.filter(user => user.id !== startedByUserId);
    console.log(`Users to notify (excluding starter):`, usersToNotify.map(u => u.name || u.email));
    
    // Create notification for each user
    for (const user of usersToNotify) {
      try {
        console.log(`Creating notification for user ${user.name || user.email} (${user.id})`);
        
        await createNotification({
          user_id: user.id,
          type: 'meeting_started',
          title: 'Meeting Started',
          message: `${startedByUserName} started a meeting in #${meeting.channel_name}`,
          data: {
            meetingId: roomID,
            channelId: meeting.channel_id,
            channelName: meeting.channel_name,
            startedBy: startedByUserName,
            startedAt: new Date().toISOString()
          }
        });
        
        // Send real-time notification if user is online
        if (user.socketId) {
          console.log(`Sending real-time notification to socket ${user.socketId}`);
          io.to(user.socketId).emit('meeting_started_notification', {
            meetingId: roomID,
            channelName: meeting.channel_name,
            startedBy: startedByUserName,
            message: `${startedByUserName} started a meeting in #${meeting.channel_name}`
          });
        } else {
          console.log(`User ${user.name || user.email} is not online (no socketId)`);
        }
      } catch (error) {
        console.error(`Error sending notification to user ${user.id}:`, error);
      }
    }
    
    console.log(`Sent meeting start notifications to ${usersToNotify.length} users`);
    
  } catch (error) {
    console.error('Error sending meeting start notifications:', error);
  }
};

const deleteMeetingFromDatabase = async (roomID) => {
  try {
    const sql = (await import('../database/db.js')).default;
    
    // Delete meeting from database
    await sql`
      DELETE FROM org_meetings 
      WHERE meeting_id = ${roomID}
    `;
    
    console.log(`Successfully deleted meeting ${roomID} from database`);
  } catch (error) {
    console.error(`Error deleting meeting ${roomID} from database:`, error);
  }
};

// Export the maps for use in other modules
export { onlineUsers, userSockets, activeMeetings };