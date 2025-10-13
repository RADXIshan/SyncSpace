import { useState } from 'react';
import { Search, Bell, Users, Calendar, Settings, AlertTriangle, CheckCircle, Info, X, MoreVertical } from 'lucide-react';

const Notifications = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState('all'); // all, unread, mentions, system

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
    if (priority === 'high') return 'border-red-500/30 bg-red-500/10';
    if (type === 'mention') return 'border-violet-500/30 bg-violet-500/10';
    if (type === 'success') return 'border-green-500/30 bg-green-500/10';
    if (type === 'alert') return 'border-red-500/30 bg-red-500/10';
    if (type === 'meeting') return 'border-blue-500/30 bg-blue-500/10';
    if (type === 'system') return 'border-gray-500/30 bg-gray-500/10';
    return 'border-white/10 bg-white/5';
  };

  const getIconColor = (type, priority) => {
    if (priority === 'high') return 'text-red-400';
    if (type === 'mention') return 'text-violet-400';
    if (type === 'success') return 'text-green-400';
    if (type === 'alert') return 'text-red-400';
    if (type === 'meeting') return 'text-blue-400';
    if (type === 'system') return 'text-gray-400';
    return 'text-gray-400';
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

  return (
    <div className="p-6 bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 text-white min-h-screen">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-violet-500 to-indigo-400">
              Notifications
            </h1>
            <p className="text-slate-400 mt-2">Stay updated with your team activities</p>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="relative">
              <Search size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search notifications..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-4 py-2 w-80 bg-slate-800/50 border border-slate-600/50 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-violet-500/50"
              />
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-4 mb-6">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filter === 'all' 
                  ? 'bg-violet-600/20 text-violet-300 border border-violet-500/30' 
                  : 'bg-slate-800/40 text-slate-400 border border-slate-600/30 hover:bg-slate-700/40'
              }`}
            >
              All ({notifications.length})
            </button>
            <button
              onClick={() => setFilter('unread')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filter === 'unread' 
                  ? 'bg-violet-600/20 text-violet-300 border border-violet-500/30' 
                  : 'bg-slate-800/40 text-slate-400 border border-slate-600/30 hover:bg-slate-700/40'
              }`}
            >
              Unread ({unreadCount})
            </button>
            <button
              onClick={() => setFilter('mentions')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filter === 'mentions' 
                  ? 'bg-violet-600/20 text-violet-300 border border-violet-500/30' 
                  : 'bg-slate-800/40 text-slate-400 border border-slate-600/30 hover:bg-slate-700/40'
              }`}
            >
              Mentions ({notifications.filter(n => n.type === 'mention').length})
            </button>
            <button
              onClick={() => setFilter('system')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filter === 'system' 
                  ? 'bg-violet-600/20 text-violet-300 border border-violet-500/30' 
                  : 'bg-slate-800/40 text-slate-400 border border-slate-600/30 hover:bg-slate-700/40'
              }`}
            >
              System ({notifications.filter(n => n.type === 'system').length})
            </button>
          </div>
          
          {unreadCount > 0 && (
            <button
              onClick={() => console.log('Mark all as read')}
              className="px-4 py-2 bg-blue-600/20 text-blue-300 border border-blue-500/30 rounded-lg text-sm font-medium hover:bg-blue-600/30 transition-colors"
            >
              Mark All Read
            </button>
          )}
        </div>

        {/* Notifications Container */}
        <div className="bg-slate-800/30 backdrop-blur-xl rounded-2xl border border-slate-600/30 overflow-hidden shadow-xl">
          <div className="divide-y divide-slate-600/30">
            {filteredNotifications.length === 0 ? (
              <div className="text-center py-12">
                <Bell size={48} className="mx-auto mb-4 text-slate-400 opacity-50" />
                <p className="text-slate-400">
                  {searchQuery ? 'No notifications found matching your search.' : 'No notifications yet.'}
                </p>
              </div>
            ) : (
              filteredNotifications.map((notification) => {
                const IconComponent = notification.icon;
                return (
                  <div
                    key={notification.id}
                    className={`p-4 transition-all duration-200 cursor-pointer hover:bg-slate-700/30 border-l-4 ${getNotificationColor(notification.type, notification.priority)} ${
                      !notification.isRead ? 'bg-violet-500/10' : ''
                    }`}
                  >
                    <div className="flex items-start gap-4">
                      {/* Icon */}
                      <div className={`flex-shrink-0 w-10 h-10 rounded-lg bg-slate-800/60 flex items-center justify-center`}>
                        <IconComponent size={20} className={getIconColor(notification.type, notification.priority)} />
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h3 className={`font-semibold mb-1 ${!notification.isRead ? 'text-white' : 'text-slate-300'}`}>
                              {notification.title}
                              {!notification.isRead && (
                                <span className="ml-2 w-2 h-2 bg-violet-500 rounded-full inline-block"></span>
                              )}
                            </h3>
                            <p className="text-slate-400 text-sm mb-2">
                              {notification.message}
                            </p>
                            <p className="text-xs text-slate-500">
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
                                className="text-blue-400 hover:text-blue-300 text-xs px-2 py-1 rounded transition-colors"
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
                              className="text-slate-400 hover:text-red-400 transition-colors p-1"
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
          <div className="bg-slate-800/40 backdrop-blur-xl rounded-xl border border-slate-600/30 p-4 shadow-lg">
            <h3 className="font-semibold text-white mb-2">Total</h3>
            <p className="text-2xl font-bold text-violet-400">{notifications.length}</p>
          </div>
          
          <div className="bg-slate-800/40 backdrop-blur-xl rounded-xl border border-slate-600/30 p-4 shadow-lg">
            <h3 className="font-semibold text-white mb-2">Unread</h3>
            <p className="text-2xl font-bold text-red-400">{unreadCount}</p>
          </div>
          
          <div className="bg-slate-800/40 backdrop-blur-xl rounded-xl border border-slate-600/30 p-4 shadow-lg">
            <h3 className="font-semibold text-white mb-2">Mentions</h3>
            <p className="text-2xl font-bold text-blue-400">
              {notifications.filter(n => n.type === 'mention').length}
            </p>
          </div>
          
          <div className="bg-slate-800/40 backdrop-blur-xl rounded-xl border border-slate-600/30 p-4 shadow-lg">
            <h3 className="font-semibold text-white mb-2">High Priority</h3>
            <p className="text-2xl font-bold text-orange-400">
              {notifications.filter(n => n.priority === 'high').length}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Notifications;