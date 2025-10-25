import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useSocket } from './SocketContext';
import { useAuth } from './AuthContext';
import { useToast } from './ToastContext';
import axios from 'axios';

const NotificationContext = createContext();

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const { socket } = useSocket();
  const { user } = useAuth();
  const { showNotification } = useToast();

  // Fetch notifications from server
  const fetchNotifications = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }
    
    try {
      const response = await axios.get(
        `${import.meta.env.VITE_BASE_URL}/api/notifications`,
        { withCredentials: true }
      );
      
      setNotifications(response.data.notifications || []);
      setUnreadCount(response.data.unreadCount || 0);
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Add new notification
  const addNotification = useCallback((notification) => {
    const newNotification = {
      id: Date.now() + Math.random(),
      timestamp: new Date().toISOString(),
      isRead: false,
      ...notification,
    };

    setNotifications(prev => [newNotification, ...prev]);
    setUnreadCount(prev => prev + 1);
    
    // Show toast notification
    showNotification(newNotification);
  }, [showNotification]);

  // Mark notification as read
  const markAsRead = useCallback(async (notificationId) => {
    try {
      await axios.patch(
        `${import.meta.env.VITE_BASE_URL}/api/notifications/${notificationId}/read`,
        {},
        { withCredentials: true }
      );

      setNotifications(prev =>
        prev.map(n =>
          n.id === notificationId ? { ...n, isRead: true } : n
        )
      );
      
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  }, []);

  // Mark all notifications as read
  const markAllAsRead = useCallback(async () => {
    try {
      await axios.patch(
        `${import.meta.env.VITE_BASE_URL}/api/notifications/read-all`,
        {},
        { withCredentials: true }
      );

      setNotifications(prev =>
        prev.map(n => ({ ...n, isRead: true }))
      );
      
      setUnreadCount(0);
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error);
    }
  }, []);

  // Delete notification
  const deleteNotification = useCallback(async (notificationId) => {
    try {
      await axios.delete(
        `${import.meta.env.VITE_BASE_URL}/api/notifications/${notificationId}`,
        { withCredentials: true }
      );

      const notification = notifications.find(n => n.id === notificationId);
      
      setNotifications(prev => prev.filter(n => n.id !== notificationId));
      
      if (notification && !notification.isRead) {
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.error('Failed to delete notification:', error);
    }
  }, [notifications]);



  // Socket event handlers
  useEffect(() => {
    if (!socket || !user) return;

    // Listen for new notifications
    const handleNewNotification = (data) => {
      addNotification(data);
    };

    // Listen for member joining
    const handleMemberJoined = (data) => {
      if (data.userId !== user.user_id) { // Don't notify about yourself
        addNotification({
          type: 'member_joined',
          title: 'New Member Joined',
          message: `${data.userName} has joined your organization`,
          priority: 'low',
          actionUrl: '/members',
        });
      }
    };

    // Listen for new notices
    const handleNewNotice = (data) => {
      addNotification({
        type: 'notice',
        title: 'New Notice Posted',
        message: `${data.title}`,
        priority: 'medium',
        actionUrl: '/notices',
      });
    };

    // Listen for new meetings
    const handleNewMeeting = (data) => {
      addNotification({
        type: 'meeting',
        title: 'New Meeting Scheduled',
        message: `${data.title} - ${new Date(data.start_time).toLocaleString()}`,
        priority: 'high',
        actionUrl: `/meetings/${data.id}`,
      });
    };

    // Listen for meeting reminders
    const handleMeetingReminder = (data) => {
      addNotification({
        type: 'meeting',
        title: 'Meeting Starting Soon',
        message: `${data.title} starts in ${data.minutesUntil} minutes`,
        priority: 'high',
        actionUrl: `/meeting-prep/${data.id}`,
      });
    };

    // Listen for channel updates
    const handleChannelUpdate = (data) => {
      addNotification({
        type: 'channel_update',
        title: 'Channel Updated',
        message: `${data.channelName} has been updated`,
        priority: 'low',
        actionUrl: `/channels/${data.channelId}`,
      });
    };

    // Listen for new tasks/notes in channels
    const handleNewTask = (data) => {
      addNotification({
        type: 'task',
        title: 'New Task Added',
        message: `New task in ${data.channelName}: ${data.title}`,
        priority: 'medium',
        actionUrl: `/channels/${data.channelId}`,
      });
    };

    const handleNewNote = (data) => {
      addNotification({
        type: 'task',
        title: 'New Note Added',
        message: `New note in ${data.channelName}: ${data.title}`,
        priority: 'medium',
        actionUrl: `/channels/${data.channelId}`,
      });
    };

    // Listen for message notifications (when mentioned or in important channels)
    const handleNewMessage = (data) => {
      if (data.mentioned || data.important) {
        addNotification({
          type: data.mentioned ? 'mention' : 'message',
          title: data.mentioned ? `${data.userName} mentioned you` : 'New Message',
          message: `In ${data.channelName}: "${data.message.substring(0, 50)}${data.message.length > 50 ? '...' : ''}"`,
          priority: data.mentioned ? 'high' : 'medium',
          actionUrl: `/channels/${data.channelId}`,
        });
      }
    };

    // Listen for meeting updates
    const handleMeetingUpdate = (data) => {
      addNotification({
        type: 'meeting',
        title: 'Meeting Updated',
        message: `${data.title} has been updated`,
        priority: 'medium',
        actionUrl: `/meetings/${data.id}`,
      });
    };

    // Listen for organization updates
    const handleOrgUpdate = (data) => {
      addNotification({
        type: 'system',
        title: 'Organization Updated',
        message: data.message || 'Your organization settings have been updated',
        priority: 'low',
        actionUrl: '/settings',
      });
    };

    // Listen for mentions
    const handleMention = (data) => {
      addNotification({
        type: 'mention',
        title: `${data.userName} mentioned you`,
        message: `In ${data.channelName}: "${data.message}"`,
        priority: 'high',
        actionUrl: `/channels/${data.channelId}`,
      });
    };

    // Register socket listeners
    socket.on('new_notification', handleNewNotification);
    socket.on('member_joined', handleMemberJoined);
    socket.on('new_notice', handleNewNotice);
    socket.on('new_meeting', handleNewMeeting);
    socket.on('meeting_reminder', handleMeetingReminder);
    socket.on('channel_updated', handleChannelUpdate);
    socket.on('new_task', handleNewTask);
    socket.on('new_note', handleNewNote);
    socket.on('user_mentioned', handleMention);
    socket.on('new_message', handleNewMessage);
    socket.on('meeting_updated', handleMeetingUpdate);
    socket.on('organization_updated', handleOrgUpdate);

    return () => {
      socket.off('new_notification', handleNewNotification);
      socket.off('member_joined', handleMemberJoined);
      socket.off('new_notice', handleNewNotice);
      socket.off('new_meeting', handleNewMeeting);
      socket.off('meeting_reminder', handleMeetingReminder);
      socket.off('channel_updated', handleChannelUpdate);
      socket.off('new_task', handleNewTask);
      socket.off('new_note', handleNewNote);
      socket.off('user_mentioned', handleMention);
      socket.off('new_message', handleNewMessage);
      socket.off('meeting_updated', handleMeetingUpdate);
      socket.off('organization_updated', handleOrgUpdate);
    };
  }, [socket, user, addNotification]);

  // Fetch notifications on mount
  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const value = {
    notifications,
    unreadCount,
    loading,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    fetchNotifications,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};

export default NotificationContext;