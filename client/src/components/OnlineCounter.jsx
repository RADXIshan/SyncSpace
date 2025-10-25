import { useSocket } from '../context/SocketContext';

const OnlineCounter = ({ members = [], className = '' }) => {
  const { isUserOnline } = useSocket();
  
  const onlineCount = members.filter(member => isUserOnline(member.id)).length;
  const totalCount = members.length;
  
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div className="flex items-center gap-1.5">
        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
        <span className="text-sm font-medium text-green-600">
          {onlineCount} online
        </span>
      </div>
      <div className="text-gray-400 text-sm">•</div>
      <div className="text-sm text-gray-600">
        {totalCount} total
      </div>
    </div>
  );
};

export default OnlineCounter;