/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';

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

  // Get server URL helper function
  const getServerUrl = () => {
    return import.meta.env.VITE_BASE_URL || 'http://localhost:3000';
  };



  useEffect(() => {
    // Cleanup existing socket first
    if (socket) {
      socket.disconnect();
      setSocket(null);
      setIsConnected(false);
    }

    if (user) {
      // Get token from localStorage
      const token = localStorage.getItem('token');
      
      if (token) {
        // Minimal token validation - just check if it exists
        if (!token) {
          console.warn('No authentication token found');
          return;
        }
        
        // Get server URL
        const serverUrl = getServerUrl();
        
        // Initialize socket connection
        const newSocket = io(serverUrl, {
          auth: {
            token: token
          },
          autoConnect: true,
          transports: ['websocket', 'polling'],
          timeout: 20000,
          reconnection: true,
          reconnectionDelay: 1000,
          reconnectionAttempts: 5
        });

        // Connection event handlers
        newSocket.on('connect', () => {
          setIsConnected(true);
          setSocket(newSocket);
          
          // Make socket available globally for debugging
          if (typeof window !== 'undefined') {
            window.socket = newSocket;
          }
          
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

        newSocket.on('disconnect', () => {
          setIsConnected(false);
        });

        // Only log critical errors
        newSocket.on('reconnect_failed', () => {
          console.error('Failed to reconnect to server');
        });

        newSocket.on('connect_error', (error) => {
          setIsConnected(false);
          console.error('🔌 Socket connection error:', error);
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

        // Listen for channel created events
        newSocket.on('channel_created', (data) => {
          // Dispatch custom event for components to handle
          window.dispatchEvent(new CustomEvent('channelCreated', { detail: data }));
        });

        // Listen for channel deleted events
        newSocket.on('channel_deleted', (data) => {
          // Dispatch custom event for components to handle
          window.dispatchEvent(new CustomEvent('channelDeleted', { detail: data }));
        });

        // Listen for role created events
        newSocket.on('role_created', (data) => {
          // Dispatch custom event for components to handle
          window.dispatchEvent(new CustomEvent('roleCreated', { detail: data }));
        });

        // Listen for role deleted events
        newSocket.on('role_deleted', (data) => {
          // Dispatch custom event for components to handle
          window.dispatchEvent(new CustomEvent('roleDeleted', { detail: data }));
        });

        // Listen for role updated events
        newSocket.on('role_updated', (data) => {
          // Dispatch custom event for components to handle
          window.dispatchEvent(new CustomEvent('roleUpdated', { detail: data }));
        });

        // Listen for member left events
        newSocket.on('member_left', (data) => {
          // Dispatch custom event for components to handle
          window.dispatchEvent(new CustomEvent('memberLeft', { detail: data }));
        });

        // Listen for member removed events
        newSocket.on('member_removed', (data) => {
          // Dispatch custom event for components to handle
          window.dispatchEvent(new CustomEvent('memberRemoved', { detail: data }));
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
  }, [user?.user_id, user?.org_id]); // Only reconnect when user ID or org changes

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
    if (!userId || !onlineUsers.length) return false;
    
    // Convert to string for comparison to handle type mismatches
    const userIdStr = String(userId);
    const isOnline = onlineUsers.some(user => 
      String(user.id) === userIdStr || 
      String(user.user_id) === userIdStr
    );
    
    return isOnline;
  };

  const getUserStatus = (userId) => {
    if (!userId || !onlineUsers.length) return 'offline';
    
    const userIdStr = String(userId);
    const user = onlineUsers.find(u => 
      String(u.id) === userIdStr || 
      String(u.user_id) === userIdStr
    );
    return user ? user.status || 'online' : 'offline';
  };

  const refreshOnlineUsers = () => {
    if (socket && user?.org_id) {
      socket.emit('get_online_users', user.org_id);
    }
  };

  // HTTP fallback for when socket is not available
  const useHttpFallback = !isConnected;

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
    getUserStatus,
    refreshOnlineUsers,
    useHttpFallback
  };

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
};

export default SocketContext;