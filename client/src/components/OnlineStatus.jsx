import { useSocket } from '../context/SocketContext';

const OnlineStatus = ({ userId, showText = false, size = 'sm' }) => {
  const { isUserOnline, getUserStatus } = useSocket();
  
  const isOnline = isUserOnline(userId);
  const status = getUserStatus(userId);
  
  const sizeClasses = {
    xs: 'w-2 h-2',
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
    lg: 'w-5 h-5'
  };
  
  const getStatusColor = () => {
    if (!isOnline) return 'bg-gray-500';
    
    switch (status) {
      case 'online':
        return 'bg-green-500';
      case 'away':
        return 'bg-yellow-500';
      case 'busy':
        return 'bg-red-500';
      case 'invisible':
        return 'bg-gray-500';
      default:
        return 'bg-green-500';
    }
  };
  
  const getStatusText = () => {
    if (!isOnline) return 'Offline';
    
    switch (status) {
      case 'online':
        return 'Online';
      case 'away':
        return 'Away';
      case 'busy':
        return 'Busy';
      case 'invisible':
        return 'Offline';
      default:
        return 'Online';
    }
  };
  
  return (
    <div className="flex items-center gap-1.5">
      <div className={`${sizeClasses[size]} ${getStatusColor()} rounded-full border-2 border-white shadow-sm`} />
      {showText && (
        <span className="text-xs text-slate-400 font-medium">
          {getStatusText()}
        </span>
      )}
    </div>
  );
};

export default OnlineStatus;