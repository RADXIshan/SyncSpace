import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router';
import { Calendar, Settings, Hash, Users, Cog, UserPlus, LogIn, Home, LogOut } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-hot-toast';
import axios from 'axios';
import ConfirmationModal from './ConfirmationModal';

const Sidebar = ({ onSettingsClick, onOrgSettingsClick, onInviteClick }) => {
  const location = useLocation();
  const path = location.pathname;
  const { user, checkAuth, logout } = useAuth();
  const navigate = useNavigate();
  const [organization, setOrganization] = useState(null);
  const [loadingOrg, setLoadingOrg] = useState(false);
  const [userRole, setUserRole] = useState(null);
  const [userPermissions, setUserPermissions] = useState(null);
  const [showLeaveOrgConfirm, setShowLeaveOrgConfirm] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  const navItems = [
    { name: 'Dashboard', icon: <Home size={23} />, path: '/home/dashboard' },
    { name: 'Calendar', icon: <Calendar size={23} />, path: '/home/calendar' },
  ];

  const isActive = (itemPath) => {
    return path === itemPath || path.startsWith(itemPath + '/');
  };


  // Fetch organization data
  const fetchOrganization = async () => {
    if (!user?.org_id) {
      setOrganization(null);
      setUserRole(null);
      setUserPermissions(null);
      return;
    }

    try {
      setLoadingOrg(true);
      const [orgRes, roleRes] = await Promise.all([
        axios.get(
          `${import.meta.env.VITE_BASE_URL}/api/orgs/${user.org_id}`,
          { withCredentials: true }
        ),
        axios.get(
          `${import.meta.env.VITE_BASE_URL}/api/orgs/${user.org_id}/role`,
          { withCredentials: true }
        )
      ]);
      
      setOrganization(orgRes.data.organization);
      setUserRole(roleRes.data.role);
      setUserPermissions(roleRes.data.permissions);
    } catch (err) {
      console.error("Error fetching organization:", err);
      setOrganization(null);
      setUserRole(null);
      setUserPermissions(null);
    } finally {
      setLoadingOrg(false);
    }
  };

  // Leave organization
  const handleLeaveOrg = () => {
    if (!organization) return;
    setShowLeaveOrgConfirm(true);
  };

  const confirmLeaveOrg = async () => {
    if (!organization) return;

    setActionLoading(true);
    let toastId;
    try {
      toastId = toast.loading("Leaving organization...");
      await axios.post(
        `${import.meta.env.VITE_BASE_URL}/api/orgs/leave`,
        {},
        { withCredentials: true }
      );
      
      toast.success("Left organization successfully", { id: toastId });
      setOrganization(null);
      setShowLeaveOrgConfirm(false);
      await checkAuth(); // Refresh user data
    } catch (err) {
      console.error("Error leaving organization:", err);
      toast.error(
        err?.response?.data?.message || "Failed to leave organization",
        { id: toastId }
      );
    } finally {
      setActionLoading(false);
    }
  };

  // Handle invite modal
  const handleInvite = () => {
    if (!organization) return;
    if (onInviteClick) {
      onInviteClick(organization);
    }
  };

  // Handle organization settings
  const handleOrgSettings = () => {
    if (!canManageOrg()) {
      toast.error("You don't have permission to manage organization settings");
      return;
    }
    
    if (onOrgSettingsClick) {
      onOrgSettingsClick(organization, userRole, userPermissions);
    }
  };

  // Check if user can manage organization settings
  const canManageOrg = () => {
    if (!userPermissions) return false;
    // Users with settings_access, manage_channels, or roles_access can manage org settings
    return userPermissions.settings_access || userPermissions.manage_channels || userPermissions.roles_access;
  };

  const handleLogout = () => {
    setShowLogoutConfirm(true);
  };

  const confirmLogout = async () => {
    setActionLoading(true);
    let toastId;
    try {
      toastId = toast.loading("Logging out...");
      await axios.post(`${import.meta.env.VITE_BASE_URL}/api/auth/logout`);
      await logout();
      await checkAuth();
      toast.success("Logged out successfully", { id: toastId });
      setShowLogoutConfirm(false);
      navigate("/login", { state: { message: "Logged out successfully" } });
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to log out", { id: toastId });
    } finally {
      setActionLoading(false);
    }
  };

  // Fetch organization when user or org_id changes
  useEffect(() => {
    fetchOrganization();
  }, [user?.org_id]);

  return (
    <div className="h-screen w-72 bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 text-white flex flex-col shadow-2xl border-r border-slate-700/50">
      <div className="p-6 border-b border-slate-700/50">
        <h1 className="text-3xl font-bold gradient-text">SyncSpace</h1>
      </div>
      
      <div className="flex-1 overflow-y-auto py-4">
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

        {/* Organization Section */}
        {organization && (
          <div className="px-3 mt-3">
            <div className="bg-gradient-to-r from-violet-600/20 to-indigo-600/20 border border-violet-500/30 rounded-xl p-4 backdrop-blur-sm">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-gradient-to-r from-violet-500 to-indigo-500 rounded-lg flex items-center justify-center mr-3">
                    <Users size={20} className="text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-white text-sm truncate max-w-[120px]">
                      {organization.name}
                    </h3>
                    <p className="text-xs text-slate-400">Organization</p>
                  </div>
                </div>
                {canManageOrg() && (
                  <button
                    onClick={handleOrgSettings}
                    className="p-1.5 bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/30 rounded-lg transition-all duration-200 text-blue-300 hover:text-blue-200 cursor-pointer"
                    title="Organization settings"
                  >
                    <Cog size={20} />
                  </button>
                )}
              </div>
              
              <div className="flex gap-2 mt-3">
                <button
                  onClick={handleInvite}
                  className="flex-1 flex items-center justify-center px-3 py-2 bg-violet-600/30 hover:bg-violet-600/40 border border-violet-500/30 rounded-lg transition-all duration-200 text-violet-300 hover:text-violet-200 text-xs font-medium cursor-pointer"
                  title="Invite users"
                >
                  <UserPlus size={14} className="mr-1" />
                  Invite
                </button>
                <button
                  onClick={handleLeaveOrg}
                  className="flex-1 flex items-center justify-center px-3 py-2 bg-red-600/30 hover:bg-red-600/40 border border-red-500/30 rounded-lg transition-all duration-200 text-red-300 hover:text-red-200 text-xs font-medium cursor-pointer"
                  title="Leave organization"
                >
                  <LogIn size={14} className="mr-1 rotate-180" />
                  Leave
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Channels Section */}
        {organization?.channels && organization.channels.length > 0 && (
          <div className="px-3 mt-4">
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider ml-2 mb-3">
              Channels
            </h3>
            <div className="space-y-1">
              {organization.channels.map((channel) => (
                <div
                  key={channel.id}
                  className="flex items-center px-3 py-2 rounded-lg transition-all duration-200 hover:bg-slate-700/30 text-slate-300 hover:text-violet-400 cursor-pointer group"
                  title={channel.description || channel.name}
                >
                  <Hash size={16} className="mr-2 text-slate-400 group-hover:text-violet-400 transition-colors" />
                  <span className="text-sm font-medium truncate">{channel.name}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
      
      <div className="p-4 border-t border-slate-700/50">
        <div className="flex items-center mb-4">
          {user?.photo ? (
            <img
              src={user.photo}
              alt="Profile"
              className="h-12 w-12 rounded-full object-cover shadow-lg border-2 border-violet-600"
            />
          ) : (
            <div className="h-12 w-12 rounded-full gradient-bg flex items-center justify-center shadow-lg border-2 border-violet-600">
              <span className="text-lg font-bold text-white">{user?.name?.charAt(0) || 'U'}</span>
            </div>
          )}
          <div className="ml-3 flex-1">
            <p className="font-semibold text-white text-lg">{user?.name || 'User Name'}</p>
            <div className='flex items-center'>
              <div className='status-online h-2 w-2 rounded-full'></div>
              <p className="text-sm text-slate-400 ml-1">Online</p>
            </div>
          </div>
        </div>
        
        <div className="space-y-1">
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
              <LogOut size={18} className="rotate-180" />
            </span>
            <span className='font-semibold'>Logout</span>
          </button>
        </div>
      </div>
      
      {/* Confirmation Modals */}
      <ConfirmationModal
        isOpen={showLeaveOrgConfirm}
        onClose={() => setShowLeaveOrgConfirm(false)}
        onConfirm={confirmLeaveOrg}
        title="Leave Organization"
        message={`Are you sure you want to leave "${organization?.name}"? You will lose access to all channels, files, and conversations. This action cannot be undone.`}
        confirmText="Leave Organization"
        cancelText="Cancel"
        type="danger"
        loading={actionLoading}
      />
      
      <ConfirmationModal
        isOpen={showLogoutConfirm}
        onClose={() => setShowLogoutConfirm(false)}
        onConfirm={confirmLogout}
        title="Logout"
        message="Are you sure you want to logout? You will need to sign in again to access your account."
        confirmText="Logout"
        cancelText="Cancel"
        type="warning"
        loading={actionLoading}
      />
    </div>
  );
};

export default Sidebar;
