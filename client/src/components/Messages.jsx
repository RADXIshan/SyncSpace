import { useState, useEffect } from 'react';
import { Search, MessageCircle, MoreVertical, Clock, Check, CheckCheck } from 'lucide-react';
import { getRoleStyle, initializeRoleColors } from '../utils/roleColors';

const Messages = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [loading, setLoading] = useState(true);

  // Messages-specific role styling with darker text for light theme
  const getMessagesRoleStyle = (role) => {
    const baseStyle = getRoleStyle(role);
    // Convert light text colors to darker versions for better readability on light background
    const darkTextMap = {
      'text-blue-200': 'text-blue-700',
      'text-green-200': 'text-green-700',
      'text-purple-200': 'text-purple-700',
      'text-pink-200': 'text-pink-700',
      'text-indigo-200': 'text-indigo-700',
      'text-teal-200': 'text-teal-700',
      'text-cyan-200': 'text-cyan-700',
      'text-emerald-200': 'text-emerald-700',
      'text-lime-200': 'text-lime-700',
      'text-amber-200': 'text-amber-700',
      'text-orange-200': 'text-orange-700',
      'text-red-200': 'text-red-700',
      'text-rose-200': 'text-rose-700',
      'text-fuchsia-200': 'text-fuchsia-700',
      'text-violet-200': 'text-violet-700',
      'text-sky-200': 'text-sky-700',
      'text-slate-200': 'text-slate-700',
      'text-zinc-200': 'text-zinc-700',
      'text-stone-200': 'text-stone-700',
      'text-neutral-200': 'text-neutral-700',
      'text-yellow-200': 'text-yellow-800', // Special case for Owner role
      'text-gray-300': 'text-gray-700'
    };
    
    return {
      ...baseStyle,
      text: darkTextMap[baseStyle.text] || 'text-gray-700'
    };
  };

  // Dummy messages data
  const messages = [
    {
      id: 1,
      name: 'Sarah Johnson',
      role: 'Admin',
      avatar: null,
      lastMessage: 'Hey, can we discuss the new project timeline?',
      timestamp: '2 min ago',
      unreadCount: 2,
      isOnline: true,
      status: 'delivered' // sent, delivered, read
    },
    {
      id: 2,
      name: 'Mike Chen',
      role: 'Developer',
      avatar: null,
      lastMessage: 'The API integration is complete. Ready for testing!',
      timestamp: '15 min ago',
      unreadCount: 0,
      isOnline: true,
      status: 'read'
    },
    {
      id: 3,
      name: 'Emily Rodriguez',
      role: 'Designer',
      avatar: null,
      lastMessage: 'I\'ve updated the mockups based on your feedback',
      timestamp: '1 hour ago',
      unreadCount: 1,
      isOnline: false,
      status: 'delivered'
    },
    {
      id: 4,
      name: 'David Kim',
      role: 'Owner',
      avatar: null,
      lastMessage: 'Meeting rescheduled to 3 PM tomorrow',
      timestamp: '2 hours ago',
      unreadCount: 0,
      isOnline: false,
      status: 'read'
    },
    {
      id: 5,
      name: 'Lisa Wang',
      role: 'Manager',
      avatar: null,
      lastMessage: 'Thanks for the quick turnaround on this!',
      timestamp: '1 day ago',
      unreadCount: 0,
      isOnline: true,
      status: 'read'
    },
    {
      id: 6,
      name: 'Alex Thompson',
      role: 'QA Tester',
      avatar: null,
      lastMessage: 'Found a bug in the login flow, can you check it?',
      timestamp: '2 days ago',
      unreadCount: 3,
      isOnline: false,
      status: 'delivered'
    }
  ];

  useEffect(() => {
    const roleNames = [...new Set(messages.map(msg => msg.role))].filter(Boolean);
    if (roleNames.length > 0) {
      initializeRoleColors(roleNames);
    }
    // Simulate data loading
    setTimeout(() => {
      setLoading(false);
    }, 1000);
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full bg-white">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading messages...</p>
        </div>
      </div>
    );
  }

  // Filter messages based on search query
  const filteredMessages = messages.filter(message =>
    message.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    message.lastMessage.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getStatusIcon = (status) => {
    switch (status) {
      case 'sent':
        return <Check size={14} className="text-gray-400" />;
      case 'delivered':
        return <CheckCheck size={14} className="text-gray-400" />;
      case 'read':
        return <CheckCheck size={14} className="text-blue-500" />;
      default:
        return <Clock size={14} className="text-gray-400" />;
    }
  };

  return (
    <div className="p-3 sm:p-6 bg-gradient-to-b from-gray-50 via-white to-gray-100 text-gray-800 min-h-screen pt-16 sm:pt-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between py-4 sm:py-6 px-3 sm:px-7 gap-3 sm:gap-4">
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-violet-600 to-indigo-600">
              Messages
            </h1>
            <p className="text-gray-600 mt-1 sm:mt-2 text-sm sm:text-base">Stay connected with your team</p>
          </div>
          
          <div className="flex items-center gap-2 sm:gap-4">
            <div className="relative flex-1 sm:flex-initial">
              <Search size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 sm:w-5 sm:h-5" />
              <input
                type="text"
                placeholder="Search conversations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 sm:pl-10 pr-3 sm:pr-4 py-2 w-full sm:w-64 lg:w-80 bg-white/70 border border-gray-300/50 rounded-lg sm:rounded-xl text-sm sm:text-base text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-violet-500/50 shadow-sm"
              />
            </div>
          </div>
        </div>

        {/* Messages Container */}
        <div className="bg-white/80 backdrop-blur-xl rounded-xl sm:rounded-2xl border border-gray-200/50 overflow-hidden shadow-xl">
          <div className="p-3 sm:p-6">
            {/* Messages List */}
            <div className="space-y-2 sm:space-y-3">
              {filteredMessages.length === 0 ? (
                <div className="text-center py-8 sm:py-12">
                  <MessageCircle size={40} className="mx-auto mb-3 sm:mb-4 text-gray-400 opacity-50 sm:w-12 sm:h-12" />
                  <p className="text-gray-600 text-sm sm:text-base">
                    {searchQuery ? 'No messages found matching your search.' : 'No messages yet.'}
                  </p>
                </div>
              ) : (
              filteredMessages.map((message) => {
                  const roleStyle = getMessagesRoleStyle(message.role);
                  return (
                    <div
                      key={message.id}
                      className={`flex items-center p-3 sm:p-4 rounded-lg sm:rounded-xl transition-all duration-200 cursor-pointer hover:bg-gray-100/60 border border-transparent hover:border-violet-500/30 ${
                        message.unreadCount > 0 ? 'bg-violet-100/80 border-violet-300/30' : ''
                      }`}
                      onClick={() => setSelectedMessage(message)}
                    >
                      {/* Avatar */}
                      <div className="relative flex-shrink-0">
                        <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-violet-500 to-indigo-600 rounded-full flex items-center justify-center text-white font-semibold overflow-hidden text-sm sm:text-base">
                          {message.avatar ? (
                            <img
                              src={message.avatar}
                              alt={message.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            message.name.charAt(0).toUpperCase()
                          )}
                        </div>
                        {/* Online status */}
                        {message.isOnline && (
                          <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 sm:w-4 sm:h-4 bg-green-500 border-2 border-white rounded-full"></div>
                        )}
                      </div>

                      {/* Message Content */}
                      <div className="flex-1 ml-3 sm:ml-4 min-w-0">
                        <div className="flex items-start sm:items-center justify-between mb-1 gap-2">
                          <div className="flex items-center gap-1.5 sm:gap-2 flex-1 min-w-0">
                            <h3 className="font-semibold text-gray-800 truncate text-sm sm:text-base">
                              {message.name}
                            </h3>
                            <span className={`px-1.5 sm:px-2 py-0.5 rounded-md text-[10px] sm:text-xs font-medium border ${roleStyle.background} ${roleStyle.border} ${roleStyle.text} whitespace-nowrap`}>
                              {message.role}
                            </span>
                          </div>
                          <div className="flex items-center gap-1 sm:gap-2 text-gray-500 text-xs sm:text-sm flex-shrink-0">
                            {getStatusIcon(message.status)}
                            <span className="hidden sm:inline">{message.timestamp}</span>
                          </div>
                        </div>
                        
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-gray-600 text-xs sm:text-sm truncate flex-1">
                            {message.lastMessage}
                          </p>
                          
                          <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
                            {message.unreadCount > 0 && (
                              <div className="flex items-center justify-center w-5 h-5 sm:w-6 sm:h-6 bg-violet-600 text-white text-[10px] sm:text-xs font-bold rounded-full">
                                {message.unreadCount}
                              </div>
                            )}
                            <button className="text-gray-500 hover:text-gray-700 transition-colors p-1">
                              <MoreVertical size={14} className="sm:w-4 sm:h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="mt-4 sm:mt-6 grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-6">
          <div className="bg-white/60 backdrop-blur-xl rounded-lg sm:rounded-xl border border-gray-200/40 p-3 sm:p-4 shadow-lg">
            <h3 className="font-semibold text-gray-800 mb-1 sm:mb-2 text-sm sm:text-base">Total Conversations</h3>
            <p className="text-xl sm:text-2xl font-bold text-violet-600">{messages.length}</p>
          </div>
          
          <div className="bg-white/60 backdrop-blur-xl rounded-lg sm:rounded-xl border border-gray-200/40 p-3 sm:p-4 shadow-lg">
            <h3 className="font-semibold text-gray-800 mb-1 sm:mb-2 text-sm sm:text-base">Unread Messages</h3>
            <p className="text-xl sm:text-2xl font-bold text-blue-600">
              {messages.reduce((total, msg) => total + msg.unreadCount, 0)}
            </p>
          </div>
          
          <div className="bg-white/60 backdrop-blur-xl rounded-lg sm:rounded-xl border border-gray-200/40 p-3 sm:p-4 shadow-lg">
            <h3 className="font-semibold text-gray-800 mb-1 sm:mb-2 text-sm sm:text-base">Online Members</h3>
            <p className="text-xl sm:text-2xl font-bold text-green-600">
              {messages.filter(msg => msg.isOnline).length}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Messages;