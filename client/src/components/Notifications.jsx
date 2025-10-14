import { useState, useEffect } from 'react';
import { Search, Bell, Users, Calendar, Settings, AlertTriangle, CheckCircle, Info, X, MoreVertical } from 'lucide-react';

const Notifications = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState('all'); // all, unread, mentions, system
  const [loading, setLoading] = useState(true); // Add loading state

  useEffect(() => {
    // Simulate data loading
    setTimeout(() => {
      setLoading(false);
    }, 1000); // Adjust time as needed
  }, []);

  // Dummy notifications data
  const notifications = [
    {
      id: 1,
      type: 'mention',
      icon: Users,
      title: 'Sarah Johnson mentioned you',
      message: 'Sarah mentioned you in #general: "Can you review the latest design mockups?"',
      timestamp: '2 min ago',
      isRead: false,
      priority: 'high',
      avatar: null,
      actionUrl: '/channels/general'
    },
    {
      id: 2,
      type: 'meeting',
      icon: Calendar,
      title: 'Meeting starting soon',
      message: 'Weekly team sync starts in 15 minutes',
      timestamp: '13 min ago',
      isRead: false,
      priority: 'medium',
      avatar: null,
      actionUrl: '/calendar'
    },
    {
      id: 3,
      type: 'system',
      icon: Settings,
      title: 'Organization settings updated',
      message: 'Admin has updated the organization access level to "Invite Only"',
      timestamp: '1 hour ago',
      isRead: true,
      priority: 'low',
      avatar: null,
      actionUrl: '/settings'
    },
    {
      id: 4,
      type: 'alert',
      icon: AlertTriangle,
      title: 'Failed login attempt',
      message: 'Someone tried to access your account from an unrecognized device',
      timestamp: '2 hours ago',
      isRead: false,
      priority: 'high',
      avatar: null,
      actionUrl: '/security'
    },
    {
      id: 5,
      type: 'success',
      icon: CheckCircle,
      title: 'Project milestone completed',
      message: 'The "User Authentication" milestone has been marked as complete',
      timestamp: '3 hours ago',
      isRead: true,
      priority: 'medium',
      avatar: null,
      actionUrl: '/projects'
    },
    {
      id: 6,
      type: 'member',
      icon: Users,
      title: 'New member joined',
      message: 'Alex Thompson has joined your organization',
      timestamp: '5 hours ago',
      isRead: true,
      priority: 'low',
      avatar: null,
      actionUrl: '/members'
    },
    {
      id: 7,
      type: 'info',
      icon: Info,
      title: 'Maintenance scheduled',
      message: 'System maintenance scheduled for tomorrow at 2 AM EST',
      timestamp: '1 day ago',
      isRead: false,
      priority: 'medium',
      avatar: null,
      actionUrl: '/status'
    },
    {
      id: 8,
      type: 'mention',
      icon: Users,
      title: 'Mike Chen mentioned you',
      message: 'Mike mentioned you in #development: "Great work on the API integration!"',
      timestamp: '1 day ago',
      isRead: true,
      priority: 'low',
      avatar: null,
      actionUrl: '/channels/development'
    }
  ];

  // Filter notifications based on search and filter
  const filteredNotifications = notifications.filter(notification => {
    const matchesSearch = notification.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         notification.message.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesFilter = filter === 'all' || 
                         (filter === 'unread' && !notification.isRead) ||
                         (filter === 'mentions' && notification.type === 'mention') ||
                         (filter === 'system' && notification.type === 'system');
    
    return matchesSearch && matchesFilter;
  });

  const getNotificationColor = (type, priority) => {
    if (priority === 'high') return 'border-red-400/40 bg-red-50/80';
    if (type === 'mention') return 'border-violet-400/40 bg-violet-50/80';
    if (type === 'success') return 'border-green-400/40 bg-green-50/80';
    if (type === 'alert') return 'border-red-400/40 bg-red-50/80';
    if (type === 'meeting') return 'border-blue-400/40 bg-blue-50/80';
    if (type === 'system') return 'border-gray-400/40 bg-gray-50/80';
    return 'border-gray-300/30 bg-gray-50/50';
  };

  const getIconColor = (type, priority) => {
    if (priority === 'high') return 'text-red-500';
    if (type === 'mention') return 'text-violet-500';
    if (type === 'success') return 'text-green-500';
    if (type === 'alert') return 'text-red-500';
    if (type === 'meeting') return 'text-blue-500';
    if (type === 'system') return 'text-gray-500';
    return 'text-gray-500';
  };

  const markAsRead = (id) => {
    // In a real app, this would make an API call
    console.log(`Marking notification ${id} as read`);
  };

  const deleteNotification = (id) => {
    // In a real app, this would make an API call
    console.log(`Deleting notification ${id}`);
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;

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
            <p className="text-gray-600 mt-2">Stay updated with your team activities</p>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="relative">
              <Search size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
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
              onClick={() => setFilter('all')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filter === 'all' 
                  ? 'bg-violet-100/80 text-violet-700 border border-violet-300/50' 
                  : 'bg-white/60 text-gray-600 border border-gray-300/50 hover:bg-gray-50/80'
              }`}
            >
              All ({notifications.length})
            </button>
            <button
              onClick={() => setFilter('unread')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filter === 'unread' 
                  ? 'bg-violet-100/80 text-violet-700 border border-violet-300/50' 
                  : 'bg-white/60 text-gray-600 border border-gray-300/50 hover:bg-gray-50/80'
              }`}
            >
              Unread ({unreadCount})
            </button>
            <button
              onClick={() => setFilter('mentions')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filter === 'mentions' 
                  ? 'bg-violet-100/80 text-violet-700 border border-violet-300/50' 
                  : 'bg-white/60 text-gray-600 border border-gray-300/50 hover:bg-gray-50/80'
              }`}
            >
              Mentions ({notifications.filter(n => n.type === 'mention').length})
            </button>
            <button
              onClick={() => setFilter('system')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filter === 'system' 
                  ? 'bg-violet-100/80 text-violet-700 border border-violet-300/50' 
                  : 'bg-white/60 text-gray-600 border border-gray-300/50 hover:bg-gray-50/80'
              }`}
            >
              System ({notifications.filter(n => n.type === 'system').length})
            </button>
          </div>
          
          {unreadCount > 0 && (
            <button
              onClick={() => console.log('Mark all as read')}
              className="px-4 py-2 bg-blue-100/80 text-blue-700 border border-blue-300/50 rounded-lg text-sm font-medium hover:bg-blue-200/60 transition-colors"
            >
              Mark All Read
            </button>
          )}
        </div>

        {/* Notifications Container */}
        <div className="bg-white/80 backdrop-blur-xl rounded-2xl border border-gray-200/50 overflow-hidden shadow-xl">
          <div className="divide-y divide-gray-200/50">
            {filteredNotifications.length === 0 ? (
              <div className="text-center py-12">
                <Bell size={48} className="mx-auto mb-4 text-gray-400 opacity-50" />
                <p className="text-gray-600">
                  {searchQuery ? 'No notifications found matching your search.' : 'No notifications yet.'}
                </p>
              </div>
            ) : (
              filteredNotifications.map((notification) => {
                const IconComponent = notification.icon;
                return (
                  <div
                    key={notification.id}
                    className={`p-4 transition-all duration-200 cursor-pointer hover:bg-gray-50/60 border-l-4 ${getNotificationColor(notification.type, notification.priority)} ${
                      !notification.isRead ? 'bg-violet-50/60' : ''
                    }`}
                  >
                    <div className="flex items-start gap-4">
                      {/* Icon */}
                      <div className={`flex-shrink-0 w-10 h-10 rounded-lg bg-gray-100/80 flex items-center justify-center`}>
                        <IconComponent size={20} className={getIconColor(notification.type, notification.priority)} />
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h3 className={`font-semibold mb-1 ${!notification.isRead ? 'text-gray-800' : 'text-gray-600'}`}>
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
                                  markAsRead(notification.id);
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
                                deleteNotification(notification.id);
                              }}
                              className="text-gray-500 hover:text-red-500 transition-colors p-1"
                              title="Delete notification"
                            >
                              <X size={16} />
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
        <div className="mt-6 grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white/60 backdrop-blur-xl rounded-xl border border-gray-200/40 p-4 shadow-lg">
            <h3 className="font-semibold text-gray-800 mb-2">Total</h3>
            <p className="text-2xl font-bold text-violet-600">{notifications.length}</p>
          </div>
          
          <div className="bg-white/60 backdrop-blur-xl rounded-xl border border-gray-200/40 p-4 shadow-lg">
            <h3 className="font-semibold text-gray-800 mb-2">Unread</h3>
            <p className="text-2xl font-bold text-red-600">{unreadCount}</p>
          </div>
          
          <div className="bg-white/60 backdrop-blur-xl rounded-xl border border-gray-200/40 p-4 shadow-lg">
            <h3 className="font-semibold text-gray-800 mb-2">Mentions</h3>
            <p className="text-2xl font-bold text-blue-600">
              {notifications.filter(n => n.type === 'mention').length}
            </p>
          </div>
          
          <div className="bg-white/60 backdrop-blur-xl rounded-xl border border-gray-200/40 p-4 shadow-lg">
            <h3 className="font-semibold text-gray-800 mb-2">High Priority</h3>
            <p className="text-2xl font-bold text-orange-600">
              {notifications.filter(n => n.priority === 'high').length}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Notifications;