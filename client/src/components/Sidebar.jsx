import { Link, useLocation } from 'react-router';
import { Home, Calendar, Users, Settings, LogOut } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router';
import { toast } from 'react-hot-toast';
import axios from 'axios';

const Sidebar = () => {
  const location = useLocation();
  const path = location.pathname;
  const { user, checkAuth, logout } = useAuth();
  const navigate = useNavigate();

  const navItems = [
    { name: 'Dashboard', icon: <Home size={20} />, path: '/home/dashboard' },
    { name: 'Calendar', icon: <Calendar size={20} />, path: '/home/calendar' },
  ];

  const isActive = (itemPath) => {
    return path === itemPath || path.startsWith(itemPath + '/');
  };


 const handleLogout = async () => {
    try {
      await axios.post(`${import.meta.env.VITE_BASE_URL}/api/auth/logout`);
      await logout();
      await checkAuth();
      navigate("/login", { state: { message: "Logged out successfully" } });
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to log out");
    }
  };

  return (
    <div className="h-screen w-64 bg-[var(--color-accent)] text-[var(--color-primary)] flex flex-col">
      <div className="p-4 border-b border-gray-700">
        <h1 className="text-xl font-bold">SyncSpace</h1>
      </div>
      
      <div className="flex-1 overflow-y-auto py-4">
        <nav className="px-2 space-y-1">
          {navItems.map((item) => (
            <Link
              key={item.name}
              to={item.path}
              className={`flex items-center px-4 py-3 rounded-md transition-colors ${
                isActive(item.path)
                  ? 'bg-[var(--color-secondary)] text-white'
                  : 'hover:bg-gray-800'
              }`}
            >
              <span className="mr-3">{item.icon}</span>
              <span>{item.name}</span>
            </Link>
          ))}
        </nav>
        
        <div className="px-2 mt-6 space-y-1">
          <button className="w-full flex items-center px-4 py-3 text-left rounded-md hover:bg-gray-800 transition-colors">
            <span className="mr-3"><Users size={20} /></span>
            <span>Join Organization</span>
          </button>
          
          <button className="w-full flex items-center px-4 py-3 text-left rounded-md hover:bg-gray-800 transition-colors">
            <span className="mr-3"><Users size={20} /></span>
            <span>Create Organization</span>
          </button>
        </div>
      </div>
      
      <div className="p-4 border-t border-gray-700">
        <div className="flex items-center mb-4">
          <div className="h-10 w-10 rounded-full bg-gray-600 flex items-center justify-center">
            <span className="text-lg font-medium">U</span>
          </div>
          <div className="ml-3">
            <p className="font-medium">{user?.name || 'User Name'}</p>
            <p className="text-sm text-gray-400">{user?.email || 'user@example.com'}</p>
          </div>
        </div>
        
        <div className="space-y-1">
          <Link
            to="/home/settings"
            className={`flex items-center px-4 py-2 rounded-md transition-colors ${
              isActive('/home/settings')
                ? 'bg-[var(--color-secondary)] text-white'
                : 'hover:bg-gray-800'
            }`}
          >
            <span className="mr-3 cursor-pointer"><Settings size={18} /></span>
            <span>Settings</span>
          </Link>
          
          <button onClick={handleLogout} className="w-full flex items-center px-4 py-2 text-left rounded-md hover:bg-gray-800 transition-colors cursor-pointer">
            <span className="mr-3"><LogOut size={18} /></span>
            <span>Logout</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;