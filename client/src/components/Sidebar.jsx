import React, { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router";
import {
  Calendar,
  Settings,
  Hash,
  Users,
  UserPlus,
  Home,
  LogOut,
  Crown,
  MessageCircle,
  Bell,
  Menu,
  X,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useSocket } from "../context/SocketContext";
import { useNotifications } from "../context/NotificationContext";
import { useToast } from "../context/ToastContext";
import axios from "axios";
import ConfirmationModal from "./ConfirmationModal";
import { getRoleStyle, initializeRoleColors } from "../utils/roleColors";

const Sidebar = ({
  onSettingsClick,
  onOrgSettingsClick,
  onInviteClick,
  isMobileOpen,
  onMobileToggle,
}) => {
  const location = useLocation();
  const path = location.pathname;
  const { user, checkAuth, logout } = useAuth();
  const { isConnected } = useSocket();
  const { unreadCount } = useNotifications();
  const { showError, showSuccess } = useToast();
  const navigate = useNavigate();
  const [organization, setOrganization] = useState(null);
  const [loadingOrg, setLoadingOrg] = useState(false);
  const [userRole, setUserRole] = useState(null);
  const [userPermissions, setUserPermissions] = useState(null);
  const [showLeaveOrgConfirm, setShowLeaveOrgConfirm] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  const navItems = [
    { name: "Dashboard", icon: <Home size={23} />, path: "/home/dashboard" },
    { name: "Calendar", icon: <Calendar size={23} />, path: "/home/calendar" },
    {
      name: "Messages",
      icon: <MessageCircle size={23} />,
      path: "/home/messages",
    },
    {
      name: "Notifications",
      icon: <Bell size={23} />,
      path: "/home/notifications",
      badge: unreadCount > 0 ? unreadCount : null,
    },
  ];

  const isActive = (itemPath) => {
    return path === itemPath || path.startsWith(itemPath + "/");
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
        axios.get(`${import.meta.env.VITE_BASE_URL}/api/orgs/${user.org_id}`, {
          withCredentials: true,
        }),
        axios.get(
          `${import.meta.env.VITE_BASE_URL}/api/orgs/${user.org_id}/role`,
          { withCredentials: true }
        ),
      ]);

      setOrganization(orgRes.data.organization);
      setUserRole(roleRes.data.role);
      setUserPermissions(roleRes.data.permissions);

      // Initialize role colors with organization roles
      if (orgRes.data.organization?.roles) {
        const roleNames = orgRes.data.organization.roles.map(
          (role) => role.name
        );
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
    const toastId = showSuccess("Leaving organization...");
    try {
      await axios.post(
        `${import.meta.env.VITE_BASE_URL}/api/orgs/leave`,
        {},
        { withCredentials: true }
      );

      showSuccess("Left organization successfully", { id: toastId });
      setOrganization(null);
      setShowLeaveOrgConfirm(false);
      await checkAuth(); // Refresh user data
      navigate("/home/dashboard");
    } catch (err) {
      console.error("Error leaving organization:", err);
      showError(
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
      showError("You don't have permission to send invitations");
      return;
    }
    if (onInviteClick) {
      onInviteClick(organization);
    }
  };

  // Check if user can invite others
  const canInvite = () => {
    if (!userPermissions || !organization) return false;
    const isOwner = userPermissions.isOwner || false;
    const hasInviteAccess = userPermissions.invite_access === true; // Handle null/undefined values

    // Check based on organization access level
    if (organization.accessLevel === "public") {
      // Public: Anyone can join directly, but members need invite_access to send invitations
      return isOwner || userRole === "admin" || hasInviteAccess;
    } else if (organization.accessLevel === "invite-only") {
      // Invite-only: Only permitted members can invite
      return isOwner || userRole === "admin" || hasInviteAccess;
    } else if (organization.accessLevel === "admin-only") {
      // Admin-only: Only owner or admins can invite
      return isOwner || userRole === "admin";
    }

    return false;
  };

  // Handle organization settings
  const handleOrgSettings = () => {
    if (!canManageOrg()) {
      showError("You don't have permission to manage organization settings");
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
    return (
      userPermissions.settings_access ||
      userPermissions.manage_channels ||
      userPermissions.roles_access
    );
  };

  const handleLogout = () => {
    setShowLogoutConfirm(true);
  };

  const confirmLogout = async () => {
    setActionLoading(true);
    const toastId = showSuccess("Logging out...");
    try {
      await axios.post(
        `${import.meta.env.VITE_BASE_URL}/api/auth/logout`,
        {},
        {
          withCredentials: true,
          headers: {
            "Cache-Control": "no-cache",
            Pragma: "no-cache",
          },
        }
      );
      await logout();
      localStorage.removeItem("token");
      showSuccess("Logged out successfully", { id: toastId });
      setShowLogoutConfirm(false);
      // Force redirect to login page with cache busting
      window.location.href = "/login?t=" + new Date().getTime();
    } catch (err) {
      showError(err?.response?.data?.message || "Failed to log out", {
        id: toastId,
      });
      // Even if server request fails, clear local state and redirect
      localStorage.removeItem("token");
      window.location.href = "/login";
    } finally {
      setActionLoading(false);
    }
  };

  // Check if screen is mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

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
    window.addEventListener("organizationUpdated", handleOrgUpdate);
    return () =>
      window.removeEventListener("organizationUpdated", handleOrgUpdate);
  }, []);

  // Close mobile sidebar when route changes
  useEffect(() => {
    if (isMobile && isMobileOpen && onMobileToggle) {
      onMobileToggle();
    }
  }, [path]);

  return (
    <>
      {/* Mobile Overlay */}
      {isMobile && isMobileOpen && (
        <div
          className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40 md:hidden mobile-sidebar-overlay"
          onClick={onMobileToggle}
        />
      )}

      {/* Mobile Hamburger Button */}
      {isMobile && (
        <button
          onClick={onMobileToggle}
          className={`fixed top-4 z-50 p-3 glass-button rounded-xl text-white hover:text-purple-300 transition-all duration-300 shadow-lg hover:shadow-xl group ${
            isMobileOpen ? "left-68" : "left-4"
          }`}
        >
          {isMobileOpen ? (
            <X
              size={20}
              className="group-hover:rotate-90 transition-transform duration-300"
            />
          ) : (
            <Menu
              size={20}
              className="group-hover:scale-110 transition-transform duration-300"
            />
          )}
        </button>
      )}

      {/* Sidebar */}
      <div
        className={`
        h-screen cosmic-bg relative overflow-hidden text-white flex flex-col
        ${
          isMobile
            ? `fixed top-0 left-0 bottom-0 z-40 w-64 mobile-sidebar transition-transform duration-300 ${
                isMobileOpen ? "translate-x-0" : "-translate-x-full"
              }`
            : "w-64"
        }
      `}
      >
        {/* Background Elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-1/4 left-1/4 w-32 h-32 bg-purple-500/5 rounded-full blur-2xl"></div>
          <div className="absolute bottom-1/4 right-1/4 w-24 h-24 bg-blue-500/5 rounded-full blur-2xl"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-40 h-40 bg-gradient-to-r from-purple-500/3 to-blue-500/3 rounded-full blur-2xl"></div>
        </div>

        {/* Header */}
        <div className="relative z-10 glass-dark border-b border-white/10 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl flex items-center justify-center">
              <img
                src="/icon.png"
                alt="SyncSpace Logo"
                className="w-10 h-10 rounded-2xl"
              />
            </div>
            <h1 className="text-xl font-bold tracking-tight gradient-text-purple">
              SyncSpace
            </h1>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto relative z-10 p-2">
          <nav className="">
            {navItems.map((item) => (
              <Link
                key={item.name}
                to={item.path}
                className={`flex rounded-lg items-center border-1 border-transparent px-4 py-3 transition-all duration-300 font-medium group ${
                  isActive(item.path)
                    ? "glass-button-enhanced text-purple-400 shadow-lg"
                    : "text-white/70 hover:text-white hover:bg-white/5"
                }`}
              >
                <span
                  className={`mr-3 transition-all duration-300 group-hover:scale-110 ${
                    isActive(item.path)
                      ? "text-purple-400"
                      : "text-white/70"
                  }`}
                >
                  {React.cloneElement(item.icon, { size: 20 })}
                </span>
                <span className="text-sm font-medium flex-1">{item.name}</span>
                {item.badge && (
                  <span className="ml-2 px-2 py-1 text-xs font-bold text-white bg-gradient-to-br from-red-600 to-pink-600 rounded-full h-5 w-5 flex items-center shadow-red-600 justify-center shadow-[0_0_10px_0]">
                    {item.badge > 99 ? "99+" : item.badge}
                  </span>
                )}
              </Link>
            ))}
          </nav>

          {/* Organization Section */}
          {organization && (
            <div className="mt-2 mb-4 glass rounded-xl">
              <div className="rounded-2xl overflow-hidden">
                {/* Organization Header */}
                <div className="border-b border-white/10 p-2">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center space-x-3 flex-1 min-w-0">
                      <div className="w-10 h-10 glass-button rounded-lg flex items-center justify-center shadow-lg flex-shrink-0">
                        <Users size={18} className="text-purple-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-white text-sm leading-tight truncate">
                          {organization.name}
                        </h3>
                        <p className="text-xs text-white/60 font-medium mt-1">
                          Organization
                        </p>
                      </div>
                    </div>
                    {canManageOrg() && (
                      <button
                        onClick={handleOrgSettings}
                        className="flex-shrink-0 p-2 glass hover:glass-button rounded-lg transition-all duration-300 text-white/70 hover:text-blue-400 cursor-pointer group"
                        title="Organization settings"
                      >
                        <Settings
                          size={16}
                          className="group-hover:rotate-90 group-hover:scale-120 transition-transform duration-300"
                        />
                      </button>
                    )}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="p-2">
                  <div className="grid grid-cols-2 gap-2">
                    {canInvite() && (
                      <button
                        onClick={handleInvite}
                        className="glass-button flex items-center justify-center px-3 py-2.5 rounded-lg transition-all duration-300 text-white/80 hover:text-white text-xs font-medium cursor-pointer group"
                        title="Invite users to organization"
                      >
                        <UserPlus
                          size={14}
                          className="mr-1.5 group-hover:scale-110 transition-transform duration-300"
                        />
                        Invite
                      </button>
                    )}
                    <button
                      onClick={handleLeaveOrg}
                      className={`${
                        !canInvite() ? "col-span-2" : ""
                      } glass-button flex items-center justify-center px-3 py-2.5 rounded-lg transition-all duration-300 text-red-400 hover:text-red-300 text-xs font-medium cursor-pointer group hover:border-red-500/30`}
                      title="Leave organization"
                    >
                      <LogOut
                        size={14}
                        className="mr-1.5 rotate-180 group-hover:scale-110 transition-transform duration-300"
                      />
                      Leave
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Channels Section */}
          {organization?.channels && organization.channels.length > 0 && (
            <div className="mx-1 mb-4">
              <div className="mb-3">
                <h3 className="text-xs font-bold text-white/60 uppercase tracking-wider flex items-center">
                  <Hash size={14} className="mr-1.5" />
                  Channels
                </h3>
              </div>
              <div className="space-y-1">
                {organization.channels.map((channel) => (
                  <Link
                    key={channel.id}
                    to={`/home/channels/${channel.id}`}
                    className={`flex items-center px-4 py-2.5 rounded-xl transition-all duration-300 font-medium group ${
                      isActive(`/home/channels/${channel.id}`)
                        ? "glass-button-enhanced text-white shadow-lg"
                        : "text-white/70 hover:text-white hover:bg-white/5"
                    }`}
                    title={channel.description || channel.name}
                  >
                    <span
                      className={`mr-3 transition-colors duration-200 ${
                        isActive(`/home/channels/${channel.id}`)
                          ? "text-white"
                          : "text-white/60 group-hover:text-purple-400"
                      }`}
                    >
                      <Hash
                        size={14}
                        className="group-hover:scale-110 duration-300"
                      />
                    </span>
                    <span className="text-sm font-medium truncate">
                      {channel.name}
                    </span>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* User Profile Section */}
        <div className="relative z-10 glass-dark border-t border-white/10 p-2">
          <div className="flex items-center justify-between mb-4 p-2 pb-0">
            {user?.photo ? (
              <img
                src={user.photo}
                alt="Profile"
                className="h-12 w-12 rounded-full object-cover shadow-lg border-2 border-purple-500/50"
              />
            ) : (
              <div className="h-12 w-12 rounded-2xl glass-button flex items-center justify-center shadow-lg border-2 border-purple-500/50">
                <span className="text-sm font-bold text-white">
                  {user?.name?.charAt(0) || "U"}
                </span>
              </div>
            )}
            <div className="ml-3 flex-1 min-w-0">
              <p className="font-semibold text-white text-sm leading-tight truncate">
                {user?.name || "User Name"}
              </p>
              <div className="flex items-center mt-1 gap-2">
                <div className="flex items-center">
                  <div
                    className={`h-2 w-2 rounded-full ${
                      isConnected ? "bg-green-400" : "bg-gray-400"
                    }`}
                  ></div>
                  <p
                    className={`text-xs ml-1.5 font-medium ${
                      isConnected ? "text-green-400" : "text-gray-400"
                    }`}
                  >
                    {isConnected ? "Online" : "Offline"}
                  </p>
                </div>
                {organization && userRole && (
                  <div
                    className={`px-2 py-0.5 ${
                      getRoleStyle(userRole).background
                    } border ${
                      getRoleStyle(userRole).border
                    } rounded flex items-center gap-1 flex-shrink-0`}
                  >
                    {userPermissions?.isOwner && (
                      <Crown
                        size={9}
                        className={`${
                          getRoleStyle(userRole).text
                        } flex-shrink-0`}
                      />
                    )}
                    <span
                      className={`text-xs font-medium ${
                        getRoleStyle(userRole).text
                      } capitalize`}
                    >
                      {userRole}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={onSettingsClick}
              className="flex-1 glass-button flex items-center justify-center px-3 py-2.5 rounded-lg transition-all duration-300 cursor-pointer group text-white/80 hover:text-white"
            >
              <span className="mr-2 group-hover:text-purple-400 transition-all duration-300">
                <Settings
                  size={16}
                  className="group-hover:rotate-180 group-hover:scale-110 transition-transform duration-300"
                />
              </span>
              <span className="font-medium text-sm">Settings</span>
            </button>

            <button
              onClick={handleLogout}
              className="flex-1 glass-button flex items-center justify-center px-3 py-2.5 rounded-lg transition-all duration-300 cursor-pointer group text-white/80 hover:text-red-300 hover:border-red-500/30"
            >
              <span className="mr-2 group-hover:text-red-400 transition-all duration-300">
                <LogOut
                  size={16}
                  className="rotate-180 group-hover:scale-110 transition-transform duration-300"
                />
              </span>
              <span className="font-medium text-sm">Logout</span>
            </button>
          </div>
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
        type="danger"
        loading={actionLoading}
      />
    </>
  );
};

export default Sidebar;
