import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router';
import { Calendar, Settings, Hash, Users, Cog, UserPlus, LogIn, Home, LogOut, Crown } from 'lucide-react';
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
    if (!canInvite()) {
      toast.error("You don't have permission to send invitations");
      return;
    }
    if (onInviteClick) {
      onInviteClick(organization);
    }
  };

  // Get role-specific styling
  const getRoleStyle = (role) => {
    if (!role) return { bg: 'bg-gray-600/30', border: 'border-gray-500/30', text: 'text-gray-300' };
    
    switch (role.toLowerCase()) {
      case 'admin':
        return { bg: 'bg-red-600/30', border: 'border-red-500/30', text: 'text-red-300' };
      case 'moderator':
        return { bg: 'bg-orange-600/30', border: 'border-orange-500/30', text: 'text-orange-300' };
      case 'member':
        return { bg: 'bg-blue-600/30', border: 'border-blue-500/30', text: 'text-blue-300' };
      default:
        return { bg: 'bg-violet-600/30', border: 'border-violet-500/30', text: 'text-violet-300' };
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
      
      <div className="flex-1 overflow-y-auto py-3">
        <nav className="px-3 space-y-2.5">
          {navItems.map((item) => (
            <Link
              key={item.name}
              to={item.path}
              className={`flex items-center px-4 py-3.5 rounded-xl transition-all duration-300 font-semibold group border shadow-sm hover:shadow-lg ${
                isActive(item.path)
                  ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white border-purple-500/30 shadow-purple-500/20'
                  : 'hover:bg-slate-700/60 text-slate-300 hover:text-violet-300 border-transparent hover:border-violet-500/30'
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
            <div className="bg-gradient-to-br from-slate-800/80 via-slate-700/60 to-slate-800/80 border border-slate-600/40 rounded-2xl backdrop-blur-sm shadow-xl overflow-hidden">
              {/* Organization Header */}
              <div className="bg-gradient-to-r from-violet-600/20 to-indigo-600/20 border-b border-violet-500/20 p-4">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center space-x-3 flex-1 min-w-0">
                    <div className="w-10 h-10 bg-gradient-to-br from-violet-500 to-indigo-500 rounded-lg flex items-center justify-center shadow-lg flex-shrink-0">
                      <Users size={18} className="text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-white text-sm leading-tight truncate max-w-[140px]">
                        {organization.name}
                      </h3>
                      <div className="flex items-center gap-1.5 mt-1">
                        <span className="text-xs text-slate-400 font-medium">Org</span>
                        {userRole && (
                          <>
                            <div className="w-1 h-1 bg-slate-400 rounded-full flex-shrink-0"></div>
                            <div className={`px-1.5 py-0.5 ${getRoleStyle(userRole).bg} border ${getRoleStyle(userRole).border} rounded-full flex items-center gap-1 flex-shrink-0`}>
                              {userPermissions?.isCreator && (
                                <Crown size={8} className={`${getRoleStyle(userRole).text} flex-shrink-0`} />
                              )}
                              <span className={`text-xs font-semibold ${getRoleStyle(userRole).text} capitalize`}>
                                {userRole}
                              </span>
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  {canManageOrg() && (
                    <button
                      onClick={handleOrgSettings}
                      className="flex-shrink-0 p-2 bg-blue-600/30 hover:bg-blue-600/20 border border-blue-500/20 hover:border-blue-400/30 rounded-lg transition-all duration-200 text-blue-300 hover:text-blue-200 cursor-pointer group shadow-md backdrop-blur-sm"
                      title="Organization settings"
                    >
                      <Cog size={18} className="group-hover:rotate-90 transition-transform duration-300" />
                    </button>
                  )}
                </div>
              </div>
              
              {/* Action Buttons */}
              <div className="p-4">
                <div className="grid grid-cols-2 gap-3">
                  {canInvite() && (
                    <button
                      onClick={handleInvite}
                      className="flex items-center justify-center px-4 py-3 bg-gradient-to-r from-violet-600/30 to-violet-500/30 hover:from-violet-600/40 hover:to-violet-500/40 border border-violet-500/30 hover:border-violet-400/50 rounded-xl transition-all duration-200 text-violet-300 hover:text-violet-200 text-sm font-semibold cursor-pointer shadow-lg group"
                      title="Invite users to organization"
                    >
                      <UserPlus size={16} className="mr-2 group-hover:scale-110 transition-transform duration-200" />
                      Invite
                    </button>
                  )}
                  <button
                    onClick={handleLeaveOrg}
                    className={`${!canInvite() ? 'col-span-2' : ''} flex items-center justify-center px-4 py-3 bg-gradient-to-r from-red-600/30 to-red-500/30 hover:from-red-600/40 hover:to-red-500/40 border border-red-500/30 hover:border-red-400/50 rounded-xl transition-all duration-200 text-red-300 hover:text-red-200 text-sm font-semibold cursor-pointer shadow-lg group`}
                    title="Leave organization"
                  >
                    <LogIn size={16} className="mr-2 rotate-180 group-hover:scale-110 transition-transform duration-200" />
                    Leave
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Channels Section */}
        {organization?.channels && organization.channels.length > 0 && (
          <div className="px-3 mt-6">
            <div className="mb-4">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-2 mb-4 flex items-center">
                <Hash size={12} className="mr-2" />
                Channels
              </h3>
            </div>
            <div className="space-y-2">
              {organization.channels.map((channel) => (
                <div
                  key={channel.id}
                  className="flex items-center px-4 py-3 mx-1 rounded-xl transition-all duration-200 hover:bg-slate-700/40 hover:border-violet-500/30 border border-transparent text-slate-300 hover:text-violet-300 cursor-pointer group shadow-sm hover:shadow-lg"
                  title={channel.description || channel.name}
                >
                  <Hash size={16} className="mr-3 text-slate-500 group-hover:text-violet-400 transition-colors duration-200" />
                  <span className="text-sm font-semibold truncate group-hover:font-bold transition-all duration-200">{channel.name}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
      
      <div className="p-5 border-t border-slate-600/50 bg-slate-900/50">
        <div className="flex items-center mb-5">
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
            <p className="font-semibold text-white text-lg leading-tight">{user?.name || 'User Name'}</p>
            <div className='flex items-center mt-1'>
              <div className='status-online h-2 w-2 rounded-full'></div>
              <p className="text-sm text-slate-400 ml-1 font-medium">Online</p>
            </div>
          </div>
        </div>
        
        <div className="space-y-3">
          <button
            onClick={onSettingsClick}
            className="w-full flex items-center px-4 py-3.5 text-left rounded-xl transition-all duration-300 hover:bg-slate-700/60 hover:border-violet-500/40 border border-slate-600/30 cursor-pointer group text-slate-300 hover:text-violet-300 shadow-sm hover:shadow-lg"
          >
            <span className="mr-3 text-slate-400 group-hover:text-violet-400 transition-colors duration-300">
              <Settings size={18} className="group-hover:rotate-45 transition-transform duration-300" />
            </span>
            <span className='font-semibold'>Settings</span>
          </button>
          
          <button 
            onClick={handleLogout} 
            className="w-full flex items-center px-4 py-3.5 text-left rounded-xl hover:bg-red-600/20 hover:border-red-500/40 border border-slate-600/30 transition-all duration-300 cursor-pointer group text-slate-300 hover:text-red-300 shadow-sm hover:shadow-lg"
          >
            <span className="mr-3 text-slate-400 group-hover:text-red-400 transition-colors duration-300">
              <LogOut size={18} className="rotate-180 group-hover:scale-110 transition-transform duration-300" />
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
