import { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';
import { getTokenInfo, shouldRefreshToken } from '../utils/tokenUtils';

const SocketContext = createContext();

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [isConnected, setIsConnected] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      // Get token from localStorage
      const token = localStorage.getItem('token');
      
      if (token) {
        // Check token validity
        const tokenInfo = getTokenInfo(token);
        console.log('Token info:', tokenInfo);
        
        if (shouldRefreshToken(token)) {
          console.warn('⚠️ Token is expired or incomplete. Please log out and log back in.');
        }
        
        // Determine server URL with production fallback
        let serverUrl = import.meta.env.VITE_BASE_URL;
        
        if (!serverUrl) {
          // Fallback logic for production
          if (import.meta.env.PROD) {
            // In production, try to use the same domain as the frontend
            serverUrl = window.location.origin.replace(/:\d+$/, '') + ':3000';
          } else {
            serverUrl = 'http://localhost:3000';
          }
        }
        console.log('Initializing socket connection to:', serverUrl);
        console.log('Token:', token.substring(0, 20) + '...');
        console.log('Environment:', import.meta.env.MODE);
        
        // Initialize socket connection with production-ready configuration
        const newSocket = io(serverUrl, {
          auth: {
            token: token
          },
          autoConnect: true,
          transports: ['websocket', 'polling'],
          upgrade: true,
          rememberUpgrade: true,
          timeout: 20000,
          forceNew: false,
          reconnection: true,
          reconnectionDelay: 1000,
          reconnectionAttempts: 5,
          maxReconnectionAttempts: 5
        });

        // Connection event handlers
        newSocket.on('connect', () => {
          console.log('✅ Connected to server via', newSocket.io.engine.transport.name);
          console.log('Socket ID:', newSocket.id);
          setIsConnected(true);
          
          // Send user online status
          newSocket.emit('user_online', {
            name: user.name,
            email: user.email,
            photo: user.photo || user.user_photo,
            org_id: user.org_id
          });

          // Join organization room if user has one
          if (user.org_id) {
            newSocket.emit('join_organization', user.org_id);
          }
        });

        newSocket.on('disconnect', (reason) => {
          console.log('❌ Disconnected from server. Reason:', reason);
          setIsConnected(false);
        });

        newSocket.on('reconnect', (attemptNumber) => {
          console.log('🔄 Reconnected to server after', attemptNumber, 'attempts');
        });

        newSocket.on('reconnect_attempt', (attemptNumber) => {
          console.log('🔄 Attempting to reconnect... Attempt:', attemptNumber);
        });

        newSocket.on('reconnect_error', (error) => {
          console.error('❌ Reconnection failed:', error);
        });

        newSocket.on('reconnect_failed', () => {
          console.error('❌ Failed to reconnect after maximum attempts');
        });

        // Transport upgrade events for debugging
        newSocket.io.on('upgrade', () => {
          console.log('🚀 Upgraded to', newSocket.io.engine.transport.name);
        });

        newSocket.io.on('upgradeError', (error) => {
          console.error('❌ Upgrade error:', error);
        });

        newSocket.on('connect_error', (error) => {
          console.error('Socket connection error:', error.message);
          console.error('Error details:', error);
          
          // If it's an authentication error, suggest re-login
          if (error.message.includes('Authentication error')) {
            console.warn('💡 Tip: If you see authentication errors, try logging out and logging back in to refresh your session.');
          }
          
          setIsConnected(false);
        });

        // Listen for online users list
        newSocket.on('online_users_list', (users) => {
          setOnlineUsers(users);
        });

        // Listen for user status changes
        newSocket.on('user_status_changed', (data) => {
          setOnlineUsers(prevUsers => {
            if (data.status === 'offline') {
              // Remove user from online list
              return prevUsers.filter(u => u.id !== data.userId);
            } else {
              // Update or add user
              const existingUserIndex = prevUsers.findIndex(u => u.id === data.userId);
              if (existingUserIndex >= 0) {
                // Update existing user
                const updatedUsers = [...prevUsers];
                updatedUsers[existingUserIndex] = {
                  ...updatedUsers[existingUserIndex],
                  status: data.status,
                  customStatus: data.customStatus,
                  lastSeen: data.lastSeen
                };
                return updatedUsers;
              } else {
                // Add new user
                return [...prevUsers, {
                  id: data.userId,
                  email: data.user.email,
                  name: data.user.name,
                  photo: data.user.photo,
                  status: data.status,
                  customStatus: data.customStatus,
                  lastSeen: data.lastSeen
                }];
              }
            }
          });
        });

        setSocket(newSocket);

        // Cleanup on unmount
        return () => {
          newSocket.close();
        };
      }
    } else {
      // User logged out, disconnect socket
      if (socket) {
        socket.close();
        setSocket(null);
        setOnlineUsers([]);
        setIsConnected(false);
      }
    }
  }, [user]);

  // Update organization when user's org_id changes
  useEffect(() => {
    if (socket && user?.org_id) {
      socket.emit('join_organization', user.org_id);
    }
  }, [socket, user?.org_id]);

  const updateUserStatus = (status, customStatus = null) => {
    if (socket) {
      socket.emit('update_status', { status, customStatus });
    }
  };

  const joinChannel = (channelId) => {
    if (socket) {
      socket.emit('join_channel', channelId);
    }
  };

  const leaveChannel = (channelId) => {
    if (socket) {
      socket.emit('leave_channel', channelId);
    }
  };

  const startTyping = (channelId, userName) => {
    if (socket) {
      socket.emit('typing_start', { channelId, userName });
    }
  };

  const stopTyping = (channelId) => {
    if (socket) {
      socket.emit('typing_stop', { channelId });
    }
  };

  const isUserOnline = (userId) => {
    return onlineUsers.some(user => user.id === userId);
  };

  const getUserStatus = (userId) => {
    const user = onlineUsers.find(u => u.id === userId);
    return user ? user.status || 'online' : 'offline';
  };

  const value = {
    socket,
    onlineUsers,
    isConnected,
    updateUserStatus,
    joinChannel,
    leaveChannel,
    startTyping,
    stopTyping,
    isUserOnline,
    getUserStatus
  };

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
};

export default SocketContext;