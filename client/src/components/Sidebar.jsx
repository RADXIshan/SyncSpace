import { Link, useLocation } from 'react-router';
import { Home, Calendar, Users, Settings, LogOut , Plus} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router';
import { toast } from 'react-hot-toast';
import axios from 'axios';

const Sidebar = ({ onSettingsClick, onJoinOrgClick, onCreateOrgClick }) => {
  const location = useLocation();
  const path = location.pathname;
  const { user, checkAuth, logout } = useAuth();
  const navigate = useNavigate();

  const navItems = [
    { name: 'Dashboard', icon: <Home size={23} />, path: '/home/dashboard' },
    { name: 'Calendar', icon: <Calendar size={23} />, path: '/home/calendar' },
  ];

  const isActive = (itemPath) => {
    return path === itemPath || path.startsWith(itemPath + '/');
  };


 const handleLogout = async () => {
    let toastId;
    try {
      toastId = toast.loading("Logging out...");
      await axios.post(`${import.meta.env.VITE_BASE_URL}/api/auth/logout`);
      await logout();
      await checkAuth();
      toast.success("Logged out successfully", { id: toastId });
      navigate("/login", { state: { message: "Logged out successfully" } });
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to log out", { id: toastId });
    }
  };

  return (
    <div className="h-screen w-72 bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 text-white flex flex-col shadow-2xl border-r border-slate-700/50">
      <div className="p-6 border-b border-slate-700/50">
        <h1 className="text-3xl font-bold gradient-text">SyncSpace</h1>
      </div>
      
      <div className="flex-1 overflow-y-auto py-6">
        <nav className="px-3 space-y-2">
          {navItems.map((item) => (
            <Link
              key={item.name}
              to={item.path}
              className={`flex items-center px-4 py-3 rounded-xl transition-all duration-200 font-semibold group hover:bg-violet-600/20 hover:border-violet-500/30 border border-transparent ${
                isActive(item.path)
                  ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg'
                  : 'hover:bg-slate-700/50 text-slate-300 hover:text-violet-400'
              }`}
            >
              <span className={`mr-3 transition-colors duration-200 ${
                isActive(item.path) ? 'text-white' : 'text-slate-400 group-hover:text-violet-400'
              }`}>{item.icon}</span>
              <span>{item.name}</span>
            </Link>
          ))}
        </nav>
        
        <div className="px-3 mt-8 space-y-2">
          <button 
            onClick={onJoinOrgClick} 
            className="w-full flex items-center px-4 py-3 text-left rounded-xl hover:bg-violet-600/20 hover:border-violet-500/30 border border-transparent hover:text-violet-400 transition-all duration-200 cursor-pointer group text-slate-300 "
          >
            <span className="mr-3 text-slate-400 group-hover:text-violet-400 transition-colors duration-200">
              <Users size={20} />
            </span>
            <span className='font-semibold'>Join Organization</span>
          </button>
          
          <button 
            onClick={onCreateOrgClick} 
            className="w-full flex items-center px-4 py-3 text-left rounded-xl hover:bg-violet-600/20 hover:border-violet-500/30 border border-transparent transition-all duration-200 cursor-pointer group text-slate-300 hover:text-violet-400"
          >
            <span className="mr-3 text-slate-400 group-hover:text-violet-400 transition-colors duration-200">
              <Plus size={20} />
            </span>
            <span className='font-semibold'>Create Organization</span>
          </button>
        </div>
      </div>
      
      <div className="p-4 border-t border-slate-700/50">
        <div className="flex items-center mb-6">
          {user?.photo ? (
            <img
              src={user.photo}
              alt="Profile"
              className="h-12 w-12 rounded-full object-cover border-2 border-slate-600 shadow-lg"
            />
          ) : (
            <div className="h-12 w-12 rounded-full gradient-bg flex items-center justify-center shadow-lg">
              <span className="text-lg font-bold text-white">{user?.name?.charAt(0) || 'U'}</span>
            </div>
          )}
          <div className="ml-3 flex-1">
            <p className="font-semibold text-white text-lg">{user?.name || 'User Name'}</p>
            <p className="text-sm text-slate-400">Online</p>
          </div>
        </div>
        
        <div className="space-y-2">
          <button
            onClick={onSettingsClick}
            className="w-full flex items-center px-4 py-3 text-left rounded-xl transition-all duration-200 hover:bg-violet-600/20 hover:border-violet-500/30 border border-transparent cursor-pointer group text-slate-300 hover:text-violet-400"
          >
            <span className="mr-3 text-slate-400 group-hover:text-violet-400 transition-colors duration-200">
              <Settings size={18} />
            </span>
            <span className='font-semibold'>Settings</span>
          </button>
          
          <button 
            onClick={handleLogout} 
            className="w-full flex items-center px-4 py-3 text-left rounded-xl hover:bg-red-600/20 hover:border-red-500/30 border border-transparent transition-all duration-200 cursor-pointer group text-slate-300 hover:text-red-400"
          >
            <span className="mr-3 text-slate-400 group-hover:text-red-400 transition-colors duration-200">
              <LogOut size={18} />
            </span>
            <span className='font-semibold'>Logout</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;