import { useSocket } from '../context/SocketContext';
import { useAuth } from '../context/AuthContext';

const SocketDebug = () => {
  const { socket, isConnected, onlineUsers } = useSocket();
  const { user } = useAuth();
  
  if (!user) return null;
  
  return (
    <div className="fixed bottom-4 right-4 bg-slate-800 text-white p-4 rounded-lg shadow-lg max-w-sm z-50">
      <h3 className="font-bold mb-2">Socket Debug</h3>
      <div className="text-xs space-y-1">
        <div>Status: <span className={isConnected ? 'text-green-400' : 'text-red-400'}>
          {isConnected ? 'Connected' : 'Disconnected'}
        </span></div>
        <div>Socket ID: {socket?.id || 'None'}</div>
        <div>User ID: {user?.user_id}</div>
        <div>Org ID: {user?.org_id || 'None'}</div>
        <div>Online Users: {onlineUsers.length}</div>
        <div>Token: {localStorage.getItem('token') ? 'Present' : 'Missing'}</div>
      </div>
    </div>
  );
};

export default SocketDebug;