import { useSocket } from "../context/SocketContext";
import { useAuth } from "../context/AuthContext";

const SocketDebug = () => {
  const { socket, isConnected, onlineUsers, useHttpFallback } = useSocket();
  const { user } = useAuth();

  if (!user) return null;

  const getConnectionInfo = () => {
    if (useHttpFallback) return "HTTP Fallback";
    if (!socket) return "No socket";
    if (!isConnected) return "Disconnected";

    try {
      return `${socket.io.engine.transport.name} (${socket.id?.substring(
        0,
        8
      )}...)`;
    } catch {
      return "Connected";
    }
  };

  return (
    <div className="fixed bottom-4 right-4 bg-slate-800 text-white p-4 rounded-lg shadow-lg max-w-sm z-50">
      <h3 className="font-bold mb-2">Socket Debug</h3>
      <div className="text-xs space-y-1">
        <div>
          Status:{" "}
          <span className={isConnected ? "text-green-400" : "text-red-400"}>
            {getConnectionInfo()}
          </span>
        </div>
        <div>Server: {import.meta.env.VITE_BASE_URL || "localhost:3000"}</div>
        <div>User ID: {user?.user_id}</div>
        <div>Org ID: {user?.org_id || "None"}</div>
        <div>Online Users: {onlineUsers.length}</div>
        <div>Token: {localStorage.getItem("token") ? "✓" : "✗"}</div>
        <div>Environment: {import.meta.env.MODE}</div>
        {socket && (
          <div>
            Transport:{" "}
            {socket.connected ? socket.io.engine.transport.name : "None"}
          </div>
        )}
      </div>
    </div>
  );
};

export default SocketDebug;
