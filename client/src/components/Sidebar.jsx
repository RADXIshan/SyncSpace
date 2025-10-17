import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router';
import { Calendar, Settings, Hash, Users, UserPlus, Home, LogOut, Crown, MessageCircle, Bell } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-hot-toast';
import axios from 'axios';
import ConfirmationModal from './ConfirmationModal';
import { getRoleStyle, initializeRoleColors } from '../utils/roleColors';

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
    { name: 'Messages', icon: <MessageCircle size={23} />, path: '/home/messages' },
    { name: 'Notifications', icon: <Bell size={23} />, path: '/home/notifications' },
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
      
      // Initialize role colors with organization roles
      if (orgRes.data.organization?.roles) {
        const roleNames = orgRes.data.organization.roles.map(role => role.name);
        initializeRoleColors(roleNames);
      }
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
      navigate('/home/dashboard');
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
    if (!canInvite()) {
      toast.error("You don't have permission to send invitations");
      return;
    }
    if (onInviteClick) {
      onInviteClick(organization);
    }
  };


  // Check if user can invite others
  const canInvite = () => {
    if (!userPermissions || !organization) return false;
    const isCreator = userPermissions.isCreator || false;
    const hasInviteAccess = userPermissions.invite_access === true; // Handle null/undefined values
    
    // Check based on organization access level
    if (organization.accessLevel === 'public') {
      // Public: Anyone can join directly, but members need invite_access to send invitations
      return isCreator || userRole === 'admin' || hasInviteAccess;
    } else if (organization.accessLevel === 'invite-only') {
      // Invite-only: Only permitted members can invite
      return isCreator || userRole === 'admin' || hasInviteAccess;
    } else if (organization.accessLevel === 'admin-only') {
      // Admin-only: Only creator or admins can invite
      return isCreator || userRole === 'admin';
    }
    
    return false;
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
      await axios.post(`${import.meta.env.VITE_BASE_URL}/api/auth/logout`, {}, { 
        withCredentials: true,
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      });
      await logout();
      localStorage.removeItem("token");
      toast.success("Logged out successfully", { id: toastId });
      setShowLogoutConfirm(false);
      // Force redirect to login page with cache busting
      window.location.href = "/login?t=" + new Date().getTime();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to log out", { id: toastId });
      // Even if server request fails, clear local state and redirect
      localStorage.removeItem("token");
      window.location.href = "/login";
    } finally {
      setActionLoading(false);
    }
  };

  // Fetch organization when user or org_id changes
  useEffect(() => {
    fetchOrganization();
  }, [user?.org_id]);

  // Listen for global organization updates to refresh sidebar data
  useEffect(() => {
    const handleOrgUpdate = (e) => {
      // we could optimistically update but simplest is refetch
      fetchOrganization();
    };
    window.addEventListener('organizationUpdated', handleOrgUpdate);
    return () => window.removeEventListener('organizationUpdated', handleOrgUpdate);
  }, []);

  return (
    <div className="h-screen w-64 bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 text-white flex flex-col shadow-2xl border-r border-slate-700/50">
      <div className="p-4 border-b border-slate-700/50">
        <h1 className="text-2xl font-bold gradient-text">SyncSpace</h1>
      </div>
      
      <div className="flex-1 overflow-y-auto py-3">
        <nav className="px-3 space-y-2">
          {navItems.map((item) => (
            <Link
              key={item.name}
              to={item.path}
              className={`flex items-center px-3 py-3 rounded-lg transition-all duration-300 font-medium group border shadow-sm hover:shadow-lg ${
                isActive(item.path)
                  ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white border-purple-500/30 shadow-purple-500/20'
                  : 'hover:bg-slate-700/60 text-slate-300 hover:text-violet-300 border-transparent hover:border-violet-500/30'
              }`}
            >
              <span className={`mr-3 transition-colors duration-200 ${
                isActive(item.path) ? 'text-white' : 'text-slate-400 group-hover:text-violet-400 group-hover:scale-110 transition-transform duration-200'
              }`}>{React.cloneElement(item.icon, { size: 20 })}</span>
              <span className="text-sm font-medium">{item.name}</span>
            </Link>
          ))}
        </nav>

        {/* Organization Section */}
        {organization && (
          <div className="px-3 mt-2">
            <div className="bg-gradient-to-br from-slate-800/80 via-slate-700/60 to-slate-800/80 border border-slate-600/40 rounded-xl backdrop-blur-sm shadow-xl overflow-hidden">
              {/* Organization Header */}
              <div className="bg-gradient-to-r from-violet-600/20 to-indigo-600/20 border-b border-violet-500/20 p-2.5">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center space-x-2 flex-1 min-w-0">
                    <div className="w-8 h-8 bg-gradient-to-br from-violet-500 to-indigo-500 rounded-lg flex items-center justify-center shadow-lg flex-shrink-0">
                      <Users size={16} className="text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-white text-sm leading-tight truncate">
                        {organization.name}
                      </h3>
                      <p className="text-xs text-slate-400 font-medium mt-1">Organization</p>
                    </div>
                  </div>
                  {canManageOrg() && (
                    <button
                      onClick={handleOrgSettings}
                      className="flex-shrink-0 p-1.5 bg-blue-600/30 hover:bg-blue-600/20 border border-blue-500/20 hover:border-blue-400/30 rounded-md transition-all duration-200 text-blue-300 hover:text-blue-200 cursor-pointer group shadow-md backdrop-blur-sm"
                      title="Organization settings"
                    >
                      <Settings size={17} className="group-hover:rotate-180 group-hover:scale-110 transition-transform duration-300" />
                    </button>
                  )}
                </div>
              </div>
              
              {/* Action Buttons */}
              <div className="p-2">
                <div className="grid grid-cols-2 gap-3">
                  {canInvite() && (
                    <button
                      onClick={handleInvite}
                      className="flex items-center justify-center px-3 py-2 bg-gradient-to-r from-violet-600/30 to-violet-500/30 hover:from-violet-600/40 hover:to-violet-500/40 border border-violet-500/30 hover:border-violet-400/50 rounded-md transition-all duration-200 text-violet-300 hover:text-violet-200 text-xs font-medium cursor-pointer shadow-lg group"
                      title="Invite users to organization"
                    >
                      <UserPlus size={14} className="mr-1.5 group-hover:rotate-360 group-hover:scale-110 transition-transform duration-400" />
                      Invite
                    </button>
                  )}
                  <button
                    onClick={handleLeaveOrg}
                    className={`${!canInvite() ? 'col-span-2' : ''} flex items-center justify-center px-3 py-2 bg-gradient-to-r from-red-600/30 to-red-500/30 hover:from-red-600/40 hover:to-red-500/40 border border-red-500/30 hover:border-red-400/50 rounded-md transition-all duration-200 text-red-300 hover:text-red-200 text-xs font-medium cursor-pointer shadow-lg group`}
                    title="Leave organization"
                  >
                    <LogOut size={14} className="mr-1.5 rotate-180 group-hover:scale-110 group-hover:rotate-540 transition-transform duration-400" />
                    Leave
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Channels Section */}
        {organization?.channels && organization.channels.length > 0 && (
          <div className="px-3 mt-4.5">
            <div className="mb-2">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1 mb-1 flex items-center">
                <Hash size={12} className="mr-1.5" />
                Channels
              </h3>
            </div>
            <div className="space-y-1">
              {organization.channels.map((channel) => (
                <Link
                  key={channel.id}
                  to={`/home/channels/${channel.id}`}
                  className={`flex items-center px-3 py-2 rounded-lg transition-all duration-300 font-medium group border shadow-sm hover:shadow-lg ${
                    isActive(`/home/channels/${channel.id}`)
                      ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white border-purple-500/30 shadow-purple-500/20'
                      : 'hover:bg-slate-700/60 text-slate-300 hover:text-violet-300 border-transparent hover:border-violet-500/30'
                  }`}
                  title={channel.description || channel.name}
                >
                  <span className={`mr-2.5 transition-colors duration-200 ${
                    isActive(`/home/channels/${channel.id}`) ? 'text-white' : 'text-slate-500 group-hover:text-violet-400 group-hover:scale-110 transition-transform duration-200'
                  }`}>
                    <Hash size={14} />
                  </span>
                  <span className="text-sm font-medium truncate">{channel.name}</span>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
      
      <div className="p-4 border-t border-slate-600/50 bg-slate-900/50">
        <div className="flex items-center mb-4">
          {user?.photo ? (
            <img
              src={user.photo}
              alt="Profile"
              className="h-11 w-11 rounded-full object-cover shadow-lg border-2 border-violet-600"
            />
          ) : (
            <div className="h-11 w-11 rounded-full gradient-bg flex items-center justify-center shadow-lg border-2 border-violet-600">
              <span className="text-sm font-bold text-white">{user?.name?.charAt(0) || 'U'}</span>
            </div>
          )}
          <div className="ml-3 flex-1 min-w-0">
            <p className="font-medium text-white text-sm leading-tight truncate">{user?.name || 'User Name'}</p>
            <div className='flex items-center mt-1 gap-2'>
              <div className='flex items-center'>
                <div className='bg-green-500 h-2 w-2 rounded-full'></div>
                <p className="text-xs text-slate-400 ml-1.5 font-medium">Online</p>
              </div>
              {organization && userRole && (
                <div className={`px-2 py-0.5 ${getRoleStyle(userRole).background} border ${getRoleStyle(userRole).border} rounded flex items-center gap-1 flex-shrink-0`}>
                  {userPermissions?.isCreator && (
                    <Crown size={9} className={`${getRoleStyle(userRole).text} flex-shrink-0`} />
                  )}
                  <span className={`text-xs font-medium ${getRoleStyle(userRole).text} capitalize`}>
                    {userRole}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
        
        <div className="space-y-3">
          <button
            onClick={onSettingsClick}
            className="w-full flex items-center px-3 py-3 text-left rounded-lg transition-all duration-300 hover:bg-slate-700/60 hover:border-violet-500/40 border border-slate-600/30 cursor-pointer group text-slate-300 hover:text-violet-300 shadow-sm hover:shadow-lg"
          >
            <span className="mr-3 text-slate-400 group-hover:text-violet-400 transition-colors duration-300">
              <Settings size={16} className="group-hover:rotate-180 group-hover:scale-120 transition-transform duration-300" />
            </span>
            <span className='font-medium text-sm'>Settings</span>
          </button>
          
          <button 
            onClick={handleLogout} 
            className="w-full flex items-center px-3 py-3 text-left rounded-lg hover:bg-red-600/20 hover:border-red-500/40 border border-slate-600/30 transition-all duration-300 cursor-pointer group text-slate-300 hover:text-red-300 shadow-sm hover:shadow-lg"
          >
            <span className="mr-3 text-slate-400 group-hover:text-red-400 transition-colors duration-300">
              <LogOut size={16} className="rotate-180 group-hover:rotate-540 group-hover:scale-120 transition-transform duration-300" />
            </span>
            <span className='font-medium text-sm'>Logout</span>
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
