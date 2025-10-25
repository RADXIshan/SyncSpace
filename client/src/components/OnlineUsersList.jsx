import { useState } from 'react';
import { Users, ChevronDown, ChevronRight } from 'lucide-react';
import { useSocket } from '../context/SocketContext';
import OnlineStatus from './OnlineStatus';

const OnlineUsersList = ({ className = '' }) => {
  const { onlineUsers, isConnected } = useSocket();
  const [isExpanded, setIsExpanded] = useState(true);
  
  if (!isConnected) {
    return (
      <div className={`bg-slate-800/50 rounded-lg p-4 ${className}`}>
        <div className="flex items-center gap-2 text-slate-400">
          <Users size={16} />
          <span className="text-sm font-medium">Connecting...</span>
        </div>
      </div>
    );
  }
  
  return (
    <div className={`bg-slate-800/50 rounded-lg ${className}`}>
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between p-4 hover:bg-slate-700/50 transition-colors rounded-lg"
      >
        <div className="flex items-center gap-2">
          <Users size={16} className="text-green-400" />
          <span className="text-sm font-medium text-white">
            Online ({onlineUsers.length})
          </span>
        </div>
        {isExpanded ? (
          <ChevronDown size={16} className="text-slate-400" />
        ) : (
          <ChevronRight size={16} className="text-slate-400" />
        )}
      </button>
      
      {isExpanded && (
        <div className="px-4 pb-4">
          {onlineUsers.length === 0 ? (
            <p className="text-slate-400 text-sm text-center py-2">
              No one else is online
            </p>
          ) : (
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {onlineUsers.map((user) => (
                <div
                  key={user.id}
                  className="flex items-center gap-3 p-2 rounded-md hover:bg-slate-700/30 transition-colors"
                >
                  <div className="relative">
                    {user.photo ? (
                      <img
                        src={user.photo}
                        alt={user.name}
                        className="w-8 h-8 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-purple-600 flex items-center justify-center">
                        <span className="text-xs font-bold text-white">
                          {user.name?.charAt(0)?.toUpperCase() || 'U'}
                        </span>
                      </div>
                    )}
                    <div className="absolute -bottom-0.5 -right-0.5">
                      <OnlineStatus userId={user.id} size="xs" />
                    </div>
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white truncate">
                      {user.name || user.email}
                    </p>
                    {user.customStatus && (
                      <p className="text-xs text-slate-400 truncate">
                        {user.customStatus}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default OnlineUsersList;