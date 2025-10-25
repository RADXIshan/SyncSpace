import jwt from 'jsonwebtoken';

// Store online users with their socket IDs and user info
const onlineUsers = new Map();

// Store user to socket mapping for easy lookup
const userSockets = new Map();

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
        console.log('Socket connection rejected: No token provided');
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
      
      // Log token structure for debugging
      if (!decoded.email || !decoded.name) {
        console.warn(`⚠️  User ${decoded.userId} has incomplete token data:`, {
          hasEmail: !!decoded.email,
          hasName: !!decoded.name,
          userId: decoded.userId,
          tokenKeys: Object.keys(decoded)
        });
      }
      
      console.log(`Socket authentication successful for user: ${decoded.email || decoded.name || `User-${decoded.userId}`} (ID: ${decoded.userId})`);
      next();
    } catch (err) {
      console.error('Socket authentication error:', err.message);
      console.error('Socket authentication error details:', err);
      
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
    console.log(`✅ User ${getUserIdentifier(socket)} (ID: ${socket.userId}) connected with socket ID: ${socket.id}`);

    // Handle user going online
    socket.on('user_online', (userData) => {
      try {
        const userId = socket.userId;
        console.log(`📱 User ${getUserIdentifier(socket)} going online with data:`, userData);
        
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
          console.log(`👥 User ${getUserIdentifier(socket)} joined organization room: org_${userData.org_id}`);
          
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

        console.log(`✅ User ${getUserIdentifier(socket)} is now online. Total online users: ${onlineUsers.size}`);
      } catch (error) {
        console.error('❌ Error handling user_online event:', error);
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

      console.log(`User ${getUserIdentifier(socket)} joined organization ${orgId}`);
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

      console.log(`User ${getUserIdentifier(socket)} left organization ${orgId}`);
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

      console.log(`User ${getUserIdentifier(socket)} disconnected. Total online users: ${onlineUsers.size}`);
    });

    // Handle typing indicators for channels
    socket.on('typing_start', (data) => {
      socket.to(`channel_${data.channelId}`).emit('user_typing', {
        userId: socket.userId,
        channelId: data.channelId,
        userName: data.userName
      });
    });

    socket.on('typing_stop', (data) => {
      socket.to(`channel_${data.channelId}`).emit('user_stopped_typing', {
        userId: socket.userId,
        channelId: data.channelId
      });
    });

    // Handle joining/leaving channel rooms
    socket.on('join_channel', (channelId) => {
      socket.join(`channel_${channelId}`);
      console.log(`User ${getUserIdentifier(socket)} joined channel ${channelId}`);
    });

    socket.on('leave_channel', (channelId) => {
      socket.leave(`channel_${channelId}`);
      console.log(`User ${getUserIdentifier(socket)} left channel ${channelId}`);
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

// Export the maps for use in other modules
export { onlineUsers, userSockets };