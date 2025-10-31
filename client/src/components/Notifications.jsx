import { useState } from "react";
import {
  Search,
  Bell,
  Users,
  Calendar,
  Settings,
  AlertTriangle,
  CheckCircle,
  Info,
  X,
  Trash2,
  Loader2,
} from "lucide-react";
import { useNotifications } from "../context/NotificationContext";

const Notifications = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [filter, setFilter] = useState("all"); // all, unread, mentions, system

  const {
    notifications,
    unreadCount,
    loading,
    deletingAll,
    deletingIds,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    deleteAllNotifications,
  } = useNotifications();

  // Filter notifications based on search and filter
  const filteredNotifications = notifications.filter((notification) => {
    const matchesSearch =
      notification.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      notification.message.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesFilter =
      filter === "all" ||
      (filter === "unread" && !notification.isRead) ||
      (filter === "mentions" && notification.type === "mention") ||
      (filter === "meetings" && notification.type === "meeting") ||
      (filter === "members" && notification.type === "member_joined") ||
      (filter === "system" && notification.type === "system");

    return matchesSearch && matchesFilter;
  });

  const getNotificationColor = (type, priority) => {
    if (priority === "high") return "border-red-400/40 bg-red-50/80";
    if (type === "mention") return "border-violet-400/40 bg-violet-50/80";
    if (type === "meeting") return "border-blue-400/40 bg-blue-50/80";
    if (type === "member_joined") return "border-green-400/40 bg-green-50/80";
    if (type === "notice") return "border-orange-400/40 bg-orange-50/80";
    if (type === "task") return "border-emerald-400/40 bg-emerald-50/80";
    if (type === "channel_update")
      return "border-indigo-400/40 bg-indigo-50/80";
    if (type === "system") return "border-gray-400/40 bg-gray-50/80";
    if (type === "success") return "border-green-400/40 bg-green-50/80";
    if (type === "alert") return "border-red-400/40 bg-red-50/80";
    if (type === "info") return "border-blue-400/40 bg-blue-50/80";
    return "border-gray-300/30 bg-gray-50/50";
  };

  const getIconColor = (type, priority) => {
    if (priority === "high") return "text-red-500";
    if (type === "mention") return "text-violet-500";
    if (type === "meeting") return "text-blue-500";
    if (type === "member_joined") return "text-green-500";
    if (type === "notice") return "text-orange-500";
    if (type === "task") return "text-emerald-500";
    if (type === "channel_update") return "text-indigo-500";
    if (type === "system") return "text-gray-500";
    if (type === "success") return "text-green-500";
    if (type === "alert") return "text-red-500";
    if (type === "info") return "text-blue-500";
    return "text-gray-500";
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case "mention":
        return Users;
      case "meeting":
        return Calendar;
      case "member_joined":
        return Users;
      case "notice":
        return AlertTriangle;
      case "task":
        return CheckCircle;
      case "channel_update":
        return Settings;
      case "system":
        return Settings;
      case "success":
        return CheckCircle;
      case "alert":
        return AlertTriangle;
      case "info":
        return Info;
      default:
        return Bell;
    }
  };

  const handleMarkAsRead = (id) => {
    markAsRead(id);
  };

  const handleDeleteNotification = async (id) => {
    try {
      await deleteNotification(id);
    } catch {
      // Error is already logged in the context
      // You could show a toast notification here if needed
    }
  };

  const handleMarkAllAsRead = () => {
    markAllAsRead();
  };

  const handleDeleteAllNotifications = async () => {
    try {
      await deleteAllNotifications();
    } catch {
      // Error is already logged in the context
      // You could show a toast notification here if needed
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full bg-white">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading notifications...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-gradient-to-b from-gray-50 via-white to-gray-100 text-gray-800 min-h-screen">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6">
          <div>
            <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-violet-600 to-indigo-600">
              Notifications
            </h1>
            <p className="text-gray-600 mt-2">
              Stay updated with your team activities
            </p>
          </div>

          <div className="flex items-center gap-4">
            <div className="relative">
              <Search
                size={20}
                className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
              />
              <input
                type="text"
                placeholder="Search notifications..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-4 py-2 w-80 bg-white/70 border border-gray-300/50 rounded-xl text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-violet-500/50 shadow-sm"
              />
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-4 mb-4">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setFilter("all")}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all cursor-pointer ${
                filter === "all"
                  ? "bg-violet-100/80 text-violet-700 border border-violet-300/50"
                  : "bg-white/60 text-gray-600 border border-gray-300/50 hover:bg-gray-50/80"
              }`}
            >
              All ({notifications.length})
            </button>
            <button
              onClick={() => setFilter("unread")}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all cursor-pointer ${
                filter === "unread"
                  ? "bg-violet-100/80 text-violet-700 border border-violet-300/50"
                  : "bg-white/60 text-gray-600 border border-gray-300/50 hover:bg-gray-50/80"
              }`}
            >
              Unread ({unreadCount})
            </button>
            <button
              onClick={() => setFilter("mentions")}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all cursor-pointer ${
                filter === "mentions"
                  ? "bg-violet-100/80 text-violet-700 border border-violet-300/50"
                  : "bg-white/60 text-gray-600 border border-gray-300/50 hover:bg-gray-50/80"
              }`}
            >
              Mentions (
              {notifications.filter((n) => n.type === "mention").length})
            </button>
            <button
              onClick={() => setFilter("meetings")}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all cursor-pointer ${
                filter === "meetings"
                  ? "bg-violet-100/80 text-violet-700 border border-violet-300/50"
                  : "bg-white/60 text-gray-600 border border-gray-300/50 hover:bg-gray-50/80"
              }`}
            >
              Meetings (
              {notifications.filter((n) => n.type === "meeting").length})
            </button>
            <button
              onClick={() => setFilter("members")}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all cursor-pointer ${
                filter === "members"
                  ? "bg-violet-100/80 text-violet-700 border border-violet-300/50"
                  : "bg-white/60 text-gray-600 border border-gray-300/50 hover:bg-gray-50/80"
              }`}
            >
              Members (
              {notifications.filter((n) => n.type === "member_joined").length})
            </button>
            <button
              onClick={() => setFilter("system")}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all cursor-pointer ${
                filter === "system"
                  ? "bg-violet-100/80 text-violet-700 border border-violet-300/50"
                  : "bg-white/60 text-gray-600 border border-gray-300/50 hover:bg-gray-50/80"
              }`}
            >
              System ({notifications.filter((n) => n.type === "system").length})
            </button>
          </div>

          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllAsRead}
                className="px-4 py-2 bg-blue-100/80 text-blue-700 border border-blue-300/50 rounded-lg text-sm font-medium hover:bg-blue-200/60 transition-colors"
              >
                Mark All Read
              </button>
            )}

            {notifications.length > 0 && (
              <button
                onClick={handleDeleteAllNotifications}
                disabled={deletingAll}
                className="px-4 py-2 bg-red-100/80 text-red-700 border border-red-300/50 rounded-lg text-sm font-medium hover:bg-red-200/60 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 cursor-pointer"
              >
                {deletingAll ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 size={16} />
                    Delete All
                  </>
                )}
              </button>
            )}
          </div>
        </div>

        {/* Notifications Container */}
        <div className="bg-white/80 backdrop-blur-xl rounded-2xl border border-gray-200/50 overflow-hidden shadow-xl relative">
          {deletingAll && (
            <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center z-10">
              <div className="text-center">
                <Loader2
                  size={32}
                  className="animate-spin text-red-600 mx-auto mb-2"
                />
                <p className="text-gray-600 font-medium">
                  Deleting all notifications...
                </p>
              </div>
            </div>
          )}
          <div className="divide-y divide-gray-200/50">
            {filteredNotifications.length === 0 ? (
              <div className="text-center py-12">
                <Bell
                  size={48}
                  className="mx-auto mb-4 text-gray-400 opacity-50"
                />
                <p className="text-gray-600">
                  {searchQuery
                    ? "No notifications found matching your search."
                    : "No notifications yet."}
                </p>
              </div>
            ) : (
              filteredNotifications.map((notification) => {
                const IconComponent =
                  notification.icon || getNotificationIcon(notification.type);
                return (
                  <div
                    key={notification.id}
                    className={`p-4 transition-all duration-200 cursor-pointer hover:bg-gray-50/60 border-l-4 ${getNotificationColor(
                      notification.type,
                      notification.priority
                    )} ${!notification.isRead ? "bg-violet-50/60" : ""}`}
                  >
                    <div className="flex items-start gap-4">
                      {/* Icon */}
                      <div
                        className={`flex-shrink-0 w-12 h-12 rounded-xl bg-gradient-to-br from-white to-gray-50 border border-gray-200/50 flex items-center justify-center shadow-sm`}
                      >
                        <IconComponent
                          size={22}
                          className={getIconColor(
                            notification.type,
                            notification.priority
                          )}
                        />
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h3
                              className={`font-semibold mb-1 ${
                                !notification.isRead
                                  ? "text-gray-800"
                                  : "text-gray-600"
                              }`}
                            >
                              {notification.title}
                              {!notification.isRead && (
                                <span className="ml-2 w-2 h-2 bg-violet-500 rounded-full inline-block"></span>
                              )}
                            </h3>
                            <p className="text-gray-600 text-sm mb-2">
                              {notification.message}
                            </p>
                            <p className="text-xs text-gray-500">
                              {notification.timestamp}
                            </p>
                          </div>

                          {/* Actions */}
                          <div className="flex items-center gap-2 ml-4">
                            {!notification.isRead && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleMarkAsRead(notification.id);
                                }}
                                className="text-blue-600 hover:text-blue-700 text-xs px-2 py-1 rounded transition-colors"
                                title="Mark as read"
                              >
                                Mark Read
                              </button>
                            )}
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteNotification(notification.id);
                              }}
                              disabled={deletingIds.has(notification.id)}
                              className="text-gray-500 hover:text-red-500 transition-colors p-1 disabled:opacity-50 disabled:cursor-not-allowed"
                              title="Delete notification"
                            >
                              {deletingIds.has(notification.id) ? (
                                <Loader2 size={16} className="animate-spin" />
                              ) : (
                                <X size={16} />
                              )}
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Stats */}
        <div className="mt-6 grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          <div className="bg-white/60 backdrop-blur-xl rounded-xl border border-gray-200/40 p-4 shadow-lg">
            <h3 className="font-semibold text-gray-800 mb-2 text-sm">Total</h3>
            <p className="text-2xl font-bold text-violet-600">
              {notifications.length}
            </p>
          </div>

          <div className="bg-white/60 backdrop-blur-xl rounded-xl border border-gray-200/40 p-4 shadow-lg">
            <h3 className="font-semibold text-gray-800 mb-2 text-sm">Unread</h3>
            <p className="text-2xl font-bold text-red-600">{unreadCount}</p>
          </div>

          <div className="bg-white/60 backdrop-blur-xl rounded-xl border border-gray-200/40 p-4 shadow-lg">
            <h3 className="font-semibold text-gray-800 mb-2 text-sm">
              Meetings
            </h3>
            <p className="text-2xl font-bold text-blue-600">
              {notifications.filter((n) => n.type === "meeting").length}
            </p>
          </div>

          <div className="bg-white/60 backdrop-blur-xl rounded-xl border border-gray-200/40 p-4 shadow-lg">
            <h3 className="font-semibold text-gray-800 mb-2 text-sm">
              Members
            </h3>
            <p className="text-2xl font-bold text-green-600">
              {notifications.filter((n) => n.type === "member_joined").length}
            </p>
          </div>

          <div className="bg-white/60 backdrop-blur-xl rounded-xl border border-gray-200/40 p-4 shadow-lg">
            <h3 className="font-semibold text-gray-800 mb-2 text-sm">
              Mentions
            </h3>
            <p className="text-2xl font-bold text-purple-600">
              {notifications.filter((n) => n.type === "mention").length}
            </p>
          </div>

          <div className="bg-white/60 backdrop-blur-xl rounded-xl border border-gray-200/40 p-4 shadow-lg">
            <h3 className="font-semibold text-gray-800 mb-2 text-sm">
              High Priority
            </h3>
            <p className="text-2xl font-bold text-orange-600">
              {notifications.filter((n) => n.priority === "high").length}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Notifications;
