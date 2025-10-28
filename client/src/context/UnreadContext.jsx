import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { useSocket } from './SocketContext';
import axios from 'axios';

const UnreadContext = createContext();

export const useUnread = () => {
  const context = useContext(UnreadContext);
  if (!context) {
    throw new Error('useUnread must be used within an UnreadProvider');
  }
  return context;
};

export const UnreadProvider = ({ children }) => {
  const { user } = useAuth();
  const { socket, isConnected } = useSocket();
  
  const [unreadCounts, setUnreadCounts] = useState({
    direct_messages: 0,
    channels: [],
    total_channel_unread: 0,
    total_unread: 0
  });
  
  const [loading, setLoading] = useState(true);

  // Fetch unread counts from server
  const fetchUnreadCounts = useCallback(async () => {
    if (!user?.user_id) {
      setUnreadCounts({
        direct_messages: 0,
        channels: [],
        total_channel_unread: 0,
        total_unread: 0
      });
      setLoading(false);
      return;
    }

    try {
      const response = await axios.get(
        `${import.meta.env.VITE_BASE_URL}/api/direct-messages/unread-counts`,
        { withCredentials: true }
      );
      setUnreadCounts(response.data);
    } catch (error) {
      console.error('Error fetching unread counts:', error);
      
      // If it's a 500 error, the tables might not exist yet
      if (error.response?.status === 500) {
        console.log('Server error - tables might not exist yet. Using default values.');
      }
      
      // Set default values on error
      setUnreadCounts({
        direct_messages: 0,
        channels: [],
        total_channel_unread: 0,
        total_unread: 0
      });
    } finally {
      setLoading(false);
    }
  }, [user?.user_id]);

  // Update counts locally without server fetch
  const updateDirectMessageCount = useCallback((increment = true) => {
    setUnreadCounts(prev => ({
      ...prev,
      direct_messages: Math.max(0, prev.direct_messages + (increment ? 1 : -1)),
      total_unread: Math.max(0, prev.total_unread + (increment ? 1 : -1))
    }));
  }, []);

  const updateChannelCount = useCallback((channelId, increment = true) => {
    setUnreadCounts(prev => {
      const channels = [...prev.channels];
      const channelIndex = channels.findIndex(c => c.channel_id === parseInt(channelId));
      
      if (increment) {
        if (channelIndex >= 0) {
          channels[channelIndex].unread_count += 1;
        } else {
          // We don't have channel info, so fetch counts
          fetchUnreadCounts();
          return prev;
        }
      } else {
        if (channelIndex >= 0) {
          channels[channelIndex].unread_count = 0;
        }
      }
      
      const total_channel_unread = channels.reduce((sum, c) => sum + c.unread_count, 0);
      
      return {
        ...prev,
        channels,
        total_channel_unread,
        total_unread: prev.direct_messages + total_channel_unread
      };
    });
  }, [fetchUnreadCounts]);

  // Mark direct messages as read
  const markDirectMessagesAsRead = useCallback(async (otherUserId) => {
    try {
      // Optimistically update counts
      setUnreadCounts(prev => ({
        ...prev,
        direct_messages: 0, // Reset DM count since we're reading all messages from this user
        total_unread: prev.total_channel_unread // Only channel unread remain
      }));

      await axios.post(
        `${import.meta.env.VITE_BASE_URL}/api/direct-messages/messages/${otherUserId}/read`,
        {},
        { withCredentials: true }
      );
      
      // Emit socket event to update other clients
      if (socket && isConnected) {
        socket.emit('direct_messages_marked_read', {
          userId: user.user_id,
          otherUserId: otherUserId
        });
      }
    } catch (error) {
      console.error('Error marking direct messages as read:', error);
      // Revert optimistic update on error
      fetchUnreadCounts();
    }
  }, [socket, isConnected, user?.user_id, fetchUnreadCounts]);

  // Mark channel messages as read
  const markChannelAsRead = useCallback(async (channelId) => {
    try {
      // Optimistically update counts
      updateChannelCount(channelId, false);

      await axios.post(
        `${import.meta.env.VITE_BASE_URL}/api/channels/${channelId}/read`,
        {},
        { withCredentials: true }
      );
      
      // Emit socket event to update other clients
      if (socket && isConnected) {
        socket.emit('channel_marked_read', {
          userId: user.user_id,
          channelId: channelId
        });
      }
    } catch (error) {
      console.error('Error marking channel as read:', error);
      // Revert optimistic update on error
      fetchUnreadCounts();
    }
  }, [socket, isConnected, user?.user_id, updateChannelCount, fetchUnreadCounts]);

  // Get unread count for specific channel
  const getChannelUnreadCount = useCallback((channelId) => {
    const channel = unreadCounts.channels.find(c => c.channel_id === parseInt(channelId));
    return channel ? channel.unread_count : 0;
  }, [unreadCounts.channels]);

  // Socket event handlers for real-time updates
  useEffect(() => {
    if (!socket || !isConnected || !user?.user_id) return;

    const handleNewDirectMessage = (message) => {
      // Only increment if the message is for this user (not sent by this user)
      if (message.receiver_id === user.user_id && message.sender_id !== user.user_id) {
        updateDirectMessageCount(true);
      }
    };

    const handleNewChannelMessage = (message) => {
      // Only increment if the message is not sent by this user
      if (message.user_id !== user.user_id) {
        updateChannelCount(message.channel_id, true);
      }
    };

    const handleDirectMessageRead = (data) => {
      // Decrease direct message count when messages are read
      if (data.userId === user.user_id) {
        setUnreadCounts(prev => ({
          ...prev,
          direct_messages: Math.max(0, prev.direct_messages - (data.count || 1)),
          total_unread: Math.max(0, prev.total_unread - (data.count || 1))
        }));
      }
    };

    const handleChannelRead = (data) => {
      // Reset channel count when channel is read
      if (data.userId === user.user_id) {
        updateChannelCount(data.channelId, false);
      }
    };

    // Listen for message events
    socket.on('new_direct_message', handleNewDirectMessage);
    socket.on('new_message', handleNewChannelMessage);
    socket.on('direct_messages_read', handleDirectMessageRead);
    socket.on('channel_read', handleChannelRead);

    return () => {
      socket.off('new_direct_message', handleNewDirectMessage);
      socket.off('new_message', handleNewChannelMessage);
      socket.off('direct_messages_read', handleDirectMessageRead);
      socket.off('channel_read', handleChannelRead);
    };
  }, [socket, isConnected, user?.user_id, updateDirectMessageCount, updateChannelCount]);

  // Fetch counts on mount and when user changes
  useEffect(() => {
    fetchUnreadCounts();
  }, [fetchUnreadCounts]);

  // Refresh counts periodically (every 5 minutes for sync)
  useEffect(() => {
    if (!user?.user_id) return;

    const interval = setInterval(() => {
      fetchUnreadCounts();
    }, 300000); // 5 minutes - less frequent since we have real-time updates

    return () => clearInterval(interval);
  }, [user?.user_id, fetchUnreadCounts]);

  const value = {
    unreadCounts,
    loading,
    fetchUnreadCounts,
    markDirectMessagesAsRead,
    markChannelAsRead,
    getChannelUnreadCount,
    // Convenience getters
    directMessagesCount: unreadCounts.direct_messages,
    totalChannelUnread: unreadCounts.total_channel_unread,
    totalUnread: unreadCounts.total_unread,
  };

  return (
    <UnreadContext.Provider value={value}>
      {children}
    </UnreadContext.Provider>
  );
};