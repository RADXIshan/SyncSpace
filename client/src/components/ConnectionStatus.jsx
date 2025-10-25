import { useSocket } from '../context/SocketContext';
import { Wifi, WifiOff } from 'lucide-react';

const ConnectionStatus = ({ className = '' }) => {
  const { isConnected } = useSocket();
  
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {isConnected ? (
        <>
          <Wifi size={16} className="text-green-400" />
          <span className="text-xs text-green-400 font-medium">Connected</span>
        </>
      ) : (
        <>
          <WifiOff size={16} className="text-red-400" />
          <span className="text-xs text-red-400 font-medium">Disconnected</span>
        </>
      )}
    </div>
  );
};

export default ConnectionStatus;