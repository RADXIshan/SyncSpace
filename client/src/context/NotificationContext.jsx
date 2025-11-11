/* eslint-disable react-refresh/only-export-components */
import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";

import { useSocket } from "./SocketContext";
import { useAuth } from "./AuthContext";
import { useToast } from "./ToastContext";
import axios from "axios";

const NotificationContext = createContext();

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error(
      "useNotifications must be used within a NotificationProvider"
    );
  }
  return context;
};

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [deletingAll, setDeletingAll] = useState(false);
  const [deletingIds, setDeletingIds] = useState(new Set());
  const { socket } = useSocket();
  const { user } = useAuth();
  const { showNotification, showSuccess, showError } = useToast();

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
      console.error("Failed to fetch notifications:", error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Add new notification
  const addNotification = useCallback(
    (notification) => {
      console.log("🔔 Adding notification:", notification);
      const newNotification = {
        id: Date.now() + Math.random(),
        timestamp: new Date().toISOString(),
        isRead: false,
        ...notification,
      };

      setNotifications((prev) => [newNotification, ...prev]);
      setUnreadCount((prev) => prev + 1);

      // Show toast notification
      console.log("🍞 Showing toast notification:", newNotification);
      showNotification(newNotification);
    },
    [showNotification]
  );

  // Mark notification as read
  const markAsRead = useCallback(async (notificationId) => {
    try {
      await axios.patch(
        `${
          import.meta.env.VITE_BASE_URL
        }/api/notifications/${notificationId}/read`,
        {},
        { withCredentials: true }
      );

      setNotifications((prev) =>
        prev.map((n) => (n.id === notificationId ? { ...n, isRead: true } : n))
      );

      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (error) {
      console.error("Failed to mark notification as read:", error);
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

      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));

      setUnreadCount(0);
    } catch (error) {
      console.error("Failed to mark all notifications as read:", error);
    }
  }, []);

  // Delete notification
  const deleteNotification = useCallback(
    async (notificationId) => {
      setDeletingIds((prev) => new Set(prev).add(notificationId));
      try {
        await axios.delete(
          `${
            import.meta.env.VITE_BASE_URL
          }/api/notifications/${notificationId}`,
          { withCredentials: true }
        );

        const notification = notifications.find((n) => n.id === notificationId);

        setNotifications((prev) => prev.filter((n) => n.id !== notificationId));

        if (notification && !notification.isRead) {
          setUnreadCount((prev) => Math.max(0, prev - 1));
        }

        // Removed success toast for individual deletes to reduce noise
      } catch (error) {
        console.error("Failed to delete notification:", error);
        showError("Failed to delete notification");
        throw error;
      } finally {
        setDeletingIds((prev) => {
          const newSet = new Set(prev);
          newSet.delete(notificationId);
          return newSet;
        });
      }
    },
    [notifications, showSuccess, showError]
  );

  // Delete all notifications
  const deleteAllNotifications = useCallback(async () => {
    setDeletingAll(true);
    const startTime = Date.now();

    try {
      const response = await axios.delete(
        `${import.meta.env.VITE_BASE_URL}/api/notifications`,
        {
          withCredentials: true,
          timeout: 30000, // 30 second timeout
        }
      );

      const endTime = Date.now();
      const duration = endTime - startTime;

      setNotifications([]);
      setUnreadCount(0);

      const deletedCount = response.data.deletedCount || 0;
      showSuccess(
        `Successfully deleted ${deletedCount} notifications (${duration}ms)`
      );
    } catch (error) {
      const endTime = Date.now();
      const duration = endTime - startTime;

      console.error(
        `Failed to delete all notifications after ${duration}ms:`,
        error
      );

      if (error.code === "ECONNABORTED") {
        showError("Delete operation timed out. Please try again.");
      } else {
        showError("Failed to delete all notifications");
      }
      throw error;
    } finally {
      setDeletingAll(false);
    }
  }, [showSuccess, showError]);

  // Socket event handlers
  useEffect(() => {
    if (!socket || !user) return;

    // Listen for new notifications
    const handleNewNotification = (data) => {
      addNotification(data);
    };

    // Listen for member joining
    const handleMemberJoined = (data) => {
      if (data.userId !== user.user_id) {
        // Don't notify about yourself
        addNotification({
          type: "member_joined",
          title: "New Member Joined",
          message: `${data.userName} has joined your organization`,
          priority: "low",
          actionUrl: "/members",
        });
      }
    };

    // Listen for new notices
    const handleNewNotice = (data) => {
      addNotification({
        type: "notice",
        title: "New Notice Posted",
        message: `${data.title}`,
        priority: "medium",
        actionUrl: "/notices",
      });
    };

    // Listen for new meetings
    const handleNewMeeting = (data) => {
      addNotification({
        type: "meeting",
        title: "New Meeting Scheduled",
        message: `${data.title} - ${new Date(
          data.start_time
        ).toLocaleString()}`,
        priority: "high",
        actionUrl: `/meetings/${data.id}`,
      });
    };

    // Listen for meeting reminders
    const handleMeetingReminder = (data) => {
      addNotification({
        type: "meeting",
        title: "Meeting Starting Soon",
        message: `${data.title} starts in ${data.minutesUntil} minutes`,
        priority: "high",
        actionUrl: `/meeting-prep/${data.id}`,
      });
    };

    // Listen for channel updates
    const handleChannelUpdate = (data) => {
      addNotification({
        type: "channel_update",
        title: "Channel Updated",
        message: `${data.channelName} has been updated`,
        priority: "low",
        actionUrl: `/channels/${data.channelId}`,
      });
    };

    // Listen for new tasks/notes in channels
    const handleNewTask = (data) => {
      addNotification({
        type: "task",
        title: "New Task Added",
        message: `New task in ${data.channelName}: ${data.title}`,
        priority: "medium",
        actionUrl: `/channels/${data.channelId}`,
      });
    };

    const handleNewNote = (data) => {
      addNotification({
        type: "task",
        title: "New Note Added",
        message: `New note in ${data.channelName}: ${data.title}`,
        priority: "medium",
        actionUrl: `/channels/${data.channelId}`,
      });
    };

    // Listen for message notifications (when mentioned or in important channels)
    const handleNewMessage = (data) => {
      if (data.mentioned || data.important) {
        addNotification({
          type: data.mentioned ? "mention" : "message",
          title: data.mentioned
            ? `${data.userName} mentioned you`
            : "New Message",
          message: `In ${data.channelName}: "${data.message.substring(0, 50)}${
            data.message.length > 50 ? "..." : ""
          }"`,
          priority: data.mentioned ? "high" : "medium",
          actionUrl: `/channels/${data.channelId}`,
        });
      }
    };

    // Listen for meeting updates
    const handleMeetingUpdate = (data) => {
      addNotification({
        type: "meeting",
        title: "Meeting Updated",
        message: `${data.title} has been updated`,
        priority: "medium",
        actionUrl: `/meetings/${data.id}`,
      });
    };

    // Listen for meeting started notifications
    const handleMeetingStarted = (data) => {
      console.log("🔔 NotificationContext received meeting_started_notification:", data);
      addNotification({
        type: "meeting",
        title: "Meeting Started",
        message: data.message || `${data.startedBy} started a meeting in #${data.channelName}`,
        priority: "high",
        actionUrl: `/meeting/${data.meetingId}`,
      });
      console.log("✅ Meeting started notification added to context");
    };

    // Listen for meeting ended notifications
    const handleMeetingEnded = (data) => {
      console.log("🔔 NotificationContext received meeting_ended_notification:", data);
      addNotification({
        type: "meeting",
        title: "Meeting Ended",
        message: data.reportGenerated ? `${data.message} - Report generated` : data.message,
        priority: "medium",
        actionUrl: data.reportGenerated ? "/home/meeting-reports" : "/home/dashboard",
      });
      console.log("✅ Meeting ended notification added to context");
    };

    // Listen for organization updates
    const handleOrgUpdate = (data) => {
      addNotification({
        type: "system",
        title: "Organization Updated",
        message: data.message || "Your organization settings have been updated",
        priority: "low",
        actionUrl: "/settings",
      });
    };

    // Listen for channel created
    const handleChannelCreated = (data) => {
      console.log("🔔 NotificationContext received channel_created:", data);
      addNotification({
        type: "channel_update",
        title: "New Channel Created",
        message: `Channel #${data.channelName} has been created`,
        priority: "medium",
        actionUrl: `/home/channel/${data.channelId}`,
      });
    };

    // Listen for channel deleted
    const handleChannelDeleted = (data) => {
      console.log("🔔 NotificationContext received channel_deleted:", data);
      addNotification({
        type: "channel_update",
        title: "Channel Deleted",
        message: `Channel #${data.channelName} has been deleted`,
        priority: "medium",
        actionUrl: "/home/dashboard",
      });
    };

    // Listen for role created
    const handleRoleCreated = (data) => {
      console.log("🔔 NotificationContext received role_created:", data);
      addNotification({
        type: "system",
        title: "New Role Created",
        message: `Role "${data.roleName}" has been created`,
        priority: "medium",
        actionUrl: "/home/dashboard",
      });
    };

    // Listen for role deleted
    const handleRoleDeleted = (data) => {
      console.log("🔔 NotificationContext received role_deleted:", data);
      addNotification({
        type: "system",
        title: "Role Deleted",
        message: `Role "${data.roleName}" has been deleted`,
        priority: "medium",
        actionUrl: "/home/dashboard",
      });
    };

    // Listen for role updated
    const handleRoleUpdated = (data) => {
      console.log("🔔 NotificationContext received role_updated:", data);
      let message = `Role "${data.roleName}" has been updated`;
      
      if (data.permissionsChanged && data.teamsChanged) {
        message = `Role "${data.roleName}" permissions and channel access have been updated`;
      } else if (data.permissionsChanged) {
        message = `Role "${data.roleName}" permissions have been updated`;
      } else if (data.teamsChanged) {
        message = `Role "${data.roleName}" channel access has been updated`;
      }
      
      addNotification({
        type: "system",
        title: "Role Updated",
        message: message,
        priority: "medium",
        actionUrl: "/home/dashboard",
      });
    };

    // Listen for mentions
    const handleMention = (data) => {
      console.log("NotificationContext received user_mentioned:", data);
      const mentionedBy = data.userName || data.mentionedBy || "Someone";
      const channelName = data.channelName || "a channel";

      console.log(
        `Adding notification for mention from ${mentionedBy} in ${channelName}`
      );

      // Add notification to the list for the notifications page
      // This will automatically show a toast via addNotification -> showNotification
      addNotification({
        type: "mention",
        title: "You were mentioned",
        message: `${mentionedBy} mentioned you in #${channelName}`,
        priority: "high",
        actionUrl: `/channels/${data.channelId}`,
      });
    };

    // Register socket listeners
    socket.on("new_notification", handleNewNotification);
    socket.on("member_joined", handleMemberJoined);
    socket.on("new_notice", handleNewNotice);
    socket.on("new_meeting", handleNewMeeting);
    socket.on("meeting_reminder", handleMeetingReminder);
    socket.on("channel_updated", handleChannelUpdate);
    socket.on("new_task", handleNewTask);
    socket.on("new_note", handleNewNote);
    socket.on("user_mentioned", handleMention);
    socket.on("new_message", handleNewMessage);
    socket.on("meeting_updated", handleMeetingUpdate);
    socket.on("meeting_started_notification", handleMeetingStarted);
    socket.on("meeting_ended_notification", handleMeetingEnded);
    socket.on("organization_updated", handleOrgUpdate);
    socket.on("channel_created", handleChannelCreated);
    socket.on("channel_deleted", handleChannelDeleted);
    socket.on("role_created", handleRoleCreated);
    socket.on("role_deleted", handleRoleDeleted);
    socket.on("role_updated", handleRoleUpdated);

    return () => {
      socket.off("new_notification", handleNewNotification);
      socket.off("member_joined", handleMemberJoined);
      socket.off("new_notice", handleNewNotice);
      socket.off("new_meeting", handleNewMeeting);
      socket.off("meeting_reminder", handleMeetingReminder);
      socket.off("channel_updated", handleChannelUpdate);
      socket.off("new_task", handleNewTask);
      socket.off("new_note", handleNewNote);
      socket.off("user_mentioned", handleMention);
      socket.off("new_message", handleNewMessage);
      socket.off("meeting_updated", handleMeetingUpdate);
      socket.off("meeting_started_notification", handleMeetingStarted);
      socket.off("meeting_ended_notification", handleMeetingEnded);
      socket.off("organization_updated", handleOrgUpdate);
      socket.off("channel_created", handleChannelCreated);
      socket.off("channel_deleted", handleChannelDeleted);
      socket.off("role_created", handleRoleCreated);
      socket.off("role_deleted", handleRoleDeleted);
      socket.off("role_updated", handleRoleUpdated);
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
    deletingAll,
    deletingIds,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    deleteAllNotifications,
    fetchNotifications,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};

export default NotificationContext;
