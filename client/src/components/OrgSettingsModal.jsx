import { useState, useEffect, useRef } from "react";
import { X, Globe, Users, Lock, Save, Plus, Trash2, Hash, Shield, UserMinus, Crown, Edit3, AlertTriangle, Search, Filter, ChevronDown } from "lucide-react";
import { toast } from "react-hot-toast";
import axios from "axios";
import ConfirmationModal from "./ConfirmationModal";

const OrgSettingsModal = ({ organization, userRole, userPermissions, onClose, onSuccess }) => {
  // Check if current user is the organization creator
  const isCreator = userPermissions?.isCreator || false;
  const [orgName, setOrgName] = useState(organization?.name || "");
  const [accessLevel, setAccessLevel] = useState(organization?.accessLevel || "invite-only");
  const [channels, setChannels] = useState(() => {
    if (organization?.channels && organization.channels.length > 0) {
      return organization.channels;
    }
    return [{ name: "", description: "" }];
  });
  const [roles, setRoles] = useState(() => {
    if (organization?.roles && organization.roles.length > 0) {
      return organization.roles;
    }
    return [{
      name: "",
      permissions: {
        manage_channels: false,
        manage_users: false,
        settings_access: false,
        notes_access: false,
        meeting_access: false,
        noticeboard_access: false,
        roles_access: false,
      }
    }];
  });
  const [members, setMembers] = useState([]);
  const [membersLoading, setMembersLoading] = useState(false);
  const [editingMember, setEditingMember] = useState(null);
  const [tempRole, setTempRole] = useState("");
  const [loading, setLoading] = useState(false);
  const [memberActionLoading, setMemberActionLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("all");
  const [showFilters, setShowFilters] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState("");
  const [showRemoveMemberConfirm, setShowRemoveMemberConfirm] = useState(false);
  const [memberToRemove, setMemberToRemove] = useState(null);
  const [showRemoveChannelConfirm, setShowRemoveChannelConfirm] = useState(false);
  const [channelToRemove, setChannelToRemove] = useState(null);
  const [showRemoveRoleConfirm, setShowRemoveRoleConfirm] = useState(false);
  const [roleToRemove, setRoleToRemove] = useState(null);
  const [activeTab, setActiveTab] = useState("");
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [showUnsavedChangesModal, setShowUnsavedChangesModal] = useState(false);
  const [pendingAction, setPendingAction] = useState(null);

  // Refs for scrolling to new elements
  const channelRefs = useRef([]);
  const roleRefs = useRef([]);
  
  // Original values for change detection
  const originalValues = useRef({
    orgName: organization?.name || "",
    accessLevel: organization?.accessLevel || "invite-only",
    channels: organization?.channels || [],
    roles: organization?.roles || []
  });

  // Permission check functions
  const canEditBasicSettings = () => {
    return userPermissions?.settings_access || false;
  };

  const canEditChannels = () => {
    return userPermissions?.settings_access || userPermissions?.manage_channels || false;
  };

  const canEditRoles = () => {
    return userPermissions?.settings_access || userPermissions?.roles_access || false;
  };

  const canManageUsers = () => {
    return userPermissions?.manage_users || false;
  };

  // Check for unsaved changes
  const checkForUnsavedChanges = () => {
    const currentOrgName = orgName.trim();
    const currentAccessLevel = accessLevel;
    const currentChannels = channels.filter(ch => ch.name.trim());
    const currentRoles = roles.filter(role => role.name.trim());
    
    const originalOrgName = originalValues.current.orgName;
    const originalAccessLevel = originalValues.current.accessLevel;
    const originalChannels = originalValues.current.channels;
    const originalRoles = originalValues.current.roles;
    
    // Check basic settings
    if (currentOrgName !== originalOrgName || currentAccessLevel !== originalAccessLevel) {
      return true;
    }
    
    // Check channels
    if (currentChannels.length !== originalChannels.length) {
      return true;
    }
    for (let i = 0; i < currentChannels.length; i++) {
      const current = currentChannels[i];
      const original = originalChannels[i];
      if (!original || current.name !== original.name || current.description !== original.description) {
        return true;
      }
    }
    
    // Check roles
    if (currentRoles.length !== originalRoles.length) {
      return true;
    }
    for (let i = 0; i < currentRoles.length; i++) {
      const current = currentRoles[i];
      const original = originalRoles[i];
      if (!original || current.name !== original.name) {
        return true;
      }
      // Check permissions
      const currentPerms = current.permissions;
      const originalPerms = original.permissions;
      for (const perm in currentPerms) {
        if (currentPerms[perm] !== originalPerms[perm]) {
          return true;
        }
      }
    }
    
    return false;
  };

  // Fetch organization members
  const fetchMembers = async () => {
    if (!organization?.id) return;
    
    setMembersLoading(true);
    try {
      const response = await axios.get(
        `${import.meta.env.VITE_BASE_URL}/api/orgs/${organization.id}/members`,
        { withCredentials: true }
      );
      setMembers(response.data.members || []);
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Failed to load organization members"
      );
    } finally {
      setMembersLoading(false);
    }
  };

  // Start editing member role
  const startEditingMember = (member) => {
    setEditingMember(member.id);
    setTempRole(member.role);
  };

  // Cancel editing member role
  const cancelEditingMember = () => {
    setEditingMember(null);
    setTempRole("");
  };

  // Save member role
  const saveMemberRole = async (memberId) => {
    setMemberActionLoading(true);
    try {
      await axios.put(
        `${import.meta.env.VITE_BASE_URL}/api/orgs/${organization.id}/members/${memberId}/role`,
        { role: tempRole },
        { withCredentials: true }
      );
      toast.success("Member role updated successfully");
      fetchMembers(); // Refresh members list
      setEditingMember(null);
      setTempRole("");
      
      // Refresh page to ensure all changes are reflected
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Failed to update member role"
      );
    } finally {
      setMemberActionLoading(false);
    }
  };

  // Remove member from organization
  const handleRemoveMember = (member) => {
    setMemberToRemove(member);
    setShowRemoveMemberConfirm(true);
  };

  const confirmRemoveMember = async () => {
    if (!memberToRemove) {
      console.log('No member to remove');
      return;
    }

    console.log('Removing member:', memberToRemove);
    setMemberActionLoading(true);

    try {
      await axios.delete(
        `${import.meta.env.VITE_BASE_URL}/api/orgs/${organization.id}/members/${memberToRemove.id}`,
        { withCredentials: true }
      );
      toast.success("Member removed successfully");
      fetchMembers(); // Refresh members list
      setShowRemoveMemberConfirm(false);
      setMemberToRemove(null);
      
      // Refresh page to ensure all changes are reflected
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } catch (error) {
      console.error('Error removing member:', error);
      toast.error(
        error.response?.data?.message || "Failed to remove member"
      );
    } finally {
      setMemberActionLoading(false);
    }
  };

  // Delete organization function
  const handleDeleteOrganization = async () => {
    if (deleteConfirmation !== organization?.name) {
      toast.error("Organization name does not match");
      return;
    }

    setLoading(true);
    let toastId;

    try {
      toastId = toast.loading("Deleting organization...");

      await axios.delete(
        `${import.meta.env.VITE_BASE_URL}/api/orgs/${organization.id}`,
        { withCredentials: true }
      );

      toast.success("Organization deleted successfully", { id: toastId });
      
      // Close modal and trigger success callback
      onClose();
      if (onSuccess) {
        onSuccess({ deleted: true });
      }
      
      // Optionally redirect to dashboard or refresh page
      window.location.reload();
    } catch (err) {
      toast.error(
        err.response?.data?.message ||
          err.response?.data?.error ||
          err.message ||
          "Failed to delete organization",
        { id: toastId }
      );
    } finally {
      setLoading(false);
      setShowDeleteConfirm(false);
      setDeleteConfirmation("");
    }
  };

  // Filter and search members
  const getFilteredMembers = () => {
    if (!members || members.length === 0) return [];
    
    let filteredMembers = [...members];
    
    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filteredMembers = filteredMembers.filter(member => 
        member.name?.toLowerCase().includes(query) ||
        member.email?.toLowerCase().includes(query) ||
        member.role?.toLowerCase().includes(query)
      );
    }
    
    // Role filter
    if (roleFilter !== "all") {
      filteredMembers = filteredMembers.filter(member => 
        member.role?.toLowerCase() === roleFilter.toLowerCase()
      );
    }
    
    // Date filter
    if (dateFilter !== "all") {
      const now = new Date();
      filteredMembers = filteredMembers.filter(member => {
        const joinedDate = new Date(member.joinedAt);
        const daysDiff = Math.floor((now - joinedDate) / (1000 * 60 * 60 * 24));
        
        switch (dateFilter) {
          case "today":
            return daysDiff === 0;
          case "week":
            return daysDiff <= 7;
          case "month":
            return daysDiff <= 30;
          case "3months":
            return daysDiff <= 90;
          default:
            return true;
        }
      });
    }
    
    return filteredMembers;
  };

  // Get unique roles from members for filter options
  const getUniqueRoles = () => {
    if (!members || members.length === 0) return [];
    const roles = [...new Set(members.map(member => member.role).filter(Boolean))];
    return roles.sort();
  };

  // Update state when organization prop changes
  useEffect(() => {
    if (organization) {
      setOrgName(organization.name || "");
      setAccessLevel(organization.accessLevel || "invite-only");
      
      if (organization.channels && organization.channels.length > 0) {
        setChannels(organization.channels);
      } else {
        setChannels([{ name: "", description: "" }]);
      }
      
      if (organization.roles && organization.roles.length > 0) {
        setRoles(organization.roles);
      } else {
        setRoles([{
          name: "",
          permissions: {
            manage_channels: false,
            manage_users: false,
            settings_access: false,
            notes_access: false,
            meeting_access: false,
            noticeboard_access: false,
            roles_access: false,
          }
        }]);
      }
      
      // Update original values for comparison
      originalValues.current = {
        orgName: organization.name || "",
        accessLevel: organization.accessLevel || "invite-only",
        channels: organization.channels || [],
        roles: organization.roles || []
      };
    }
    
    // Fetch members when organization changes
    if (organization?.id && activeTab === "members") {
      fetchMembers();
    }
  }, [organization, activeTab]);
  
  // Track changes for unsaved changes detection
  useEffect(() => {
    const hasChanges = checkForUnsavedChanges();
    setHasUnsavedChanges(hasChanges);
  }, [orgName, accessLevel, channels, roles]);
  
  // Handle closing with unsaved changes
  const handleClose = () => {
    if (hasUnsavedChanges) {
      setPendingAction(() => onClose);
      setShowUnsavedChangesModal(true);
    } else {
      onClose();
    }
  };
  
  // Handle tab switching with unsaved changes
  const handleTabSwitch = (tabId) => {
    if (hasUnsavedChanges && activeTab !== tabId) {
      setPendingAction(() => () => setActiveTab(tabId));
      setShowUnsavedChangesModal(true);
    } else {
      setActiveTab(tabId);
    }
  };
  
  // Discard changes and proceed with pending action
  const discardChanges = () => {
    // Reset to original values
    setOrgName(originalValues.current.orgName);
    setAccessLevel(originalValues.current.accessLevel);
    setChannels(originalValues.current.channels.length > 0 ? originalValues.current.channels : [{ name: "", description: "" }]);
    setRoles(originalValues.current.roles.length > 0 ? originalValues.current.roles : [{
      name: "",
      permissions: {
        manage_channels: false,
        manage_users: false,
        settings_access: false,
        notes_access: false,
        meeting_access: false,
        noticeboard_access: false,
        roles_access: false,
      }
    }]);
    
    setShowUnsavedChangesModal(false);
    setHasUnsavedChanges(false);
    
    // Execute pending action
    if (pendingAction) {
      pendingAction();
      setPendingAction(null);
    }
  };
  
  // Cancel unsaved changes modal
  const cancelUnsavedChanges = () => {
    setShowUnsavedChangesModal(false);
    setPendingAction(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!orgName.trim()) {
      return toast.error("Please enter an organization name");
    }

    setLoading(true);
    let toastId;

    try {
      toastId = toast.loading("Updating organization settings...");

      const response = await axios.put(
        `${import.meta.env.VITE_BASE_URL}/api/orgs/${organization.id}`,
        {
          name: orgName.trim(),
          accessLevel,
          channels: channels.filter(ch => ch.name.trim()),
          roles: roles.filter(role => role.name.trim()),
        },
        { withCredentials: true }
      );

      toast.success("Organization settings updated successfully", { id: toastId });
      
      // Update original values to new saved values
      originalValues.current = {
        orgName: orgName.trim(),
        accessLevel,
        channels: channels.filter(ch => ch.name.trim()),
        roles: roles.filter(role => role.name.trim())
      };
      
      setHasUnsavedChanges(false);
      
      if (onSuccess) onSuccess(response.data.organization);
      onClose();
      
      // Refresh the page to reflect changes immediately
      setTimeout(() => {
        window.location.reload();
      }, 500); // Small delay to allow modal to close gracefully
    } catch (err) {
      toast.error(
        err.response?.data?.message ||
          err.response?.data?.error ||
          err.message ||
          "Something went wrong",
        { id: toastId }
      );
    } finally {
      setLoading(false);
    }
  };

  // Channel management functions
  const addChannel = () => {
    const newChannels = [...channels, { name: "", description: "" }];
    setChannels(newChannels);
    
    // Scroll to the new channel after a brief delay to ensure it's rendered
    setTimeout(() => {
      const newChannelIndex = newChannels.length - 1;
      if (channelRefs.current[newChannelIndex]) {
        channelRefs.current[newChannelIndex].scrollIntoView({
          behavior: 'smooth',
          block: 'center'
        });
      }
    }, 100);
  };

  const handleRemoveChannel = (index) => {
    if (channels.length > 1) {
      setChannelToRemove(index);
      setShowRemoveChannelConfirm(true);
    }
  };

  const confirmRemoveChannel = () => {
    if (channelToRemove !== null && channels.length > 1) {
      setChannels(channels.filter((_, i) => i !== channelToRemove));
      setShowRemoveChannelConfirm(false);
      setChannelToRemove(null);
      toast.success("Channel removed successfully");
    }
  };

  const updateChannel = (index, field, value) => {
    const updatedChannels = channels.map((channel, i) =>
      i === index ? { ...channel, [field]: value } : channel
    );
    setChannels(updatedChannels);
  };

  // Role management functions
  const addRole = () => {
    const newRoles = [...roles, {
      name: "",
      permissions: {
        manage_channels: false,
        manage_users: false,
        settings_access: false,
        notes_access: false,
        meeting_access: false,
        noticeboard_access: false,
        roles_access: false,
      }
    }];
    setRoles(newRoles);
    
    // Scroll to the new role after a brief delay to ensure it's rendered
    setTimeout(() => {
      const newRoleIndex = newRoles.length - 1;
      if (roleRefs.current[newRoleIndex]) {
        roleRefs.current[newRoleIndex].scrollIntoView({
          behavior: 'smooth',
          block: 'center'
        });
      }
    }, 100);
  };

  const handleRemoveRole = (index) => {
    if (roles.length > 1) {
      setRoleToRemove(index);
      setShowRemoveRoleConfirm(true);
    }
  };

  const confirmRemoveRole = () => {
    if (roleToRemove !== null && roles.length > 1) {
      setRoles(roles.filter((_, i) => i !== roleToRemove));
      setShowRemoveRoleConfirm(false);
      setRoleToRemove(null);
      toast.success("Role removed successfully");
    }
  };

  const updateRole = (index, field, value) => {
    const updatedRoles = roles.map((role, i) =>
      i === index ? { ...role, [field]: value } : role
    );
    setRoles(updatedRoles);
  };

  const togglePermission = (roleIndex, permission) => {
    const updated = [...roles];
    updated[roleIndex].permissions[permission] = !updated[roleIndex].permissions[permission];
    setRoles(updated);
  };

  const accessLevelOptions = [
    {
      value: "public",
      label: "Public",
      desc: "Anyone can join with the invite code",
      icon: Globe,
    },
    {
      value: "invite-only",
      label: "Invite Only",
      desc: "Members can invite others",
      icon: Users,
    },
    {
      value: "admin-only",
      label: "Admin Only",
      desc: "Only admins can invite new members",
      icon: Lock,
    },
  ];

  const availablePermissions = [
    { key: "manage_channels", label: "Manage Channels" },
    { key: "manage_users", label: "Manage Users" },
    { key: "settings_access", label: "Settings Access" },
    { key: "notes_access", label: "Notes Access" },
    { key: "meeting_access", label: "Meeting Access" },
    { key: "noticeboard_access", label: "Noticeboard Access" },
    { key: "roles_access", label: "Manage Roles" },
  ];

  // Determine available tabs based on permissions
  const getAvailableTabs = () => {
    const tabs = [];
    
    if (canEditBasicSettings()) {
      tabs.push({ id: "basic", label: "Basic Settings", icon: Lock });
    }
    
    if (canEditChannels()) {
      tabs.push({ id: "channels", label: "Channels", icon: Hash });
    }
    
    if (canEditRoles()) {
      tabs.push({ id: "roles", label: "Roles", icon: Shield });
    }
    
    // Members tab is always visible to organization members
    tabs.push({ id: "members", label: "Members", icon: Users });
    
    // Danger Zone tab - only visible to organization creators
    if (isCreator) {
      tabs.push({ id: "danger", label: "Delete Organization", icon: AlertTriangle });
    }
    
    return tabs;
  };

  const availableTabs = getAvailableTabs();

  // Set default active tab to first available tab
  useEffect(() => {
    if (availableTabs.length > 0 && !activeTab) {
      setActiveTab(availableTabs[0].id);
    }
  }, [availableTabs, activeTab]);

  return (
    <>
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-md p-4 transition-all duration-300">
      <div className="relative w-full max-w-4xl max-h-[90vh] bg-white/10 dark:bg-gray-900/80 backdrop-blur-xl border border-white/20 rounded-3xl shadow-2xl overflow-hidden animate-fadeIn hover:scale-[1.01] transition-transform">
        <div className="absolute inset-0 bg-gradient-to-br from-violet-500/10 via-transparent to-indigo-500/10"></div>
        <div className="relative overflow-y-auto max-h-[90vh] px-8 py-10">
          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Close Button */}
            <button
              type="button"
              onClick={handleClose}
              className="absolute top-5 right-5 text-gray-400 hover:text-white transition-colors text-xl cursor-pointer active:scale-95 z-10 p-2 rounded-full hover:bg-white/10"
            >
              <X size={22} />
            </button>

            {/* Header */}
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold mb-2 text-transparent bg-clip-text bg-gradient-to-r from-violet-500 to-indigo-400">
                Organization Settings
              </h2>
              <p className="text-gray-400 text-sm">
                Update your organization settings and preferences
              </p>
            </div>

            {/* Tabs */}
            {availableTabs.length > 1 && (
              <div className="flex space-x-2 mb-8">
                {availableTabs.map((tab) => {
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => handleTabSwitch(tab.id)}
                      className={`flex items-center px-4 py-2 rounded-lg font-medium text-sm transition-all ${
                        activeTab === tab.id
                          ? "bg-violet-600/30 text-violet-300 border border-violet-500/30"
                          : "bg-white/5 text-gray-400 hover:bg-white/10 hover:text-gray-300"
                      }`}
                    >
                      <Icon size={16} className="mr-2" />
                      {tab.label}
                    </button>
                  );
                })}
              </div>
            )}

            {/* Tab Content */}
            <div className="space-y-6">
              {availableTabs.length === 0 && (
                <div className="text-center py-12">
                  <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-6">
                    <h3 className="text-lg font-semibold text-red-300 mb-2">
                      Access Denied
                    </h3>
                    <p className="text-red-400 text-sm">
                      You don't have permission to manage organization settings.
                      Contact an administrator for access.
                    </p>
                    <p className="text-red-400/80 text-xs mt-2">
                      Your current role: <span className="capitalize font-medium">{userRole}</span>
                    </p>
                  </div>
                </div>
              )}

              {activeTab === "basic" && canEditBasicSettings() && (
                <div className="space-y-6">
                  {/* Organization Name */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Organization Name
                    </label>
                    <input
                      type="text"
                      value={orgName}
                      onChange={(e) => setOrgName(e.target.value)}
                      placeholder="Enter organization name"
                      className="w-full px-4 py-3 rounded-xl border border-white/10 bg-white/5 text-white focus:ring-2 focus:ring-violet-500 focus:outline-none"
                      required
                    />
                  </div>

                  {/* Access Level */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-3">
                      Access Level
                    </label>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {accessLevelOptions.map(({ value, label, desc, icon: Icon }) => (
                        <label key={value} className="relative cursor-pointer">
                          <input
                            type="radio"
                            name="accessLevel"
                            value={value}
                            checked={accessLevel === value}
                            onChange={(e) => setAccessLevel(e.target.value)}
                            className="sr-only"
                          />
                          <div
                            className={`p-4 rounded-xl border transition-all cursor-pointer ${
                              accessLevel === value
                                ? "border-violet-500 bg-violet-500/10 shadow-lg shadow-violet-500/20"
                                : "border-white/10 bg-white/5 hover:bg-white/10 hover:border-white/20"
                            }`}
                          >
                            <div className="flex items-center mb-2">
                              <Icon size={20} className={`mr-2 ${
                                accessLevel === value ? "text-violet-400" : "text-gray-400"
                              }`} />
                              <span className={`font-semibold ${
                                accessLevel === value ? "text-violet-300" : "text-gray-300"
                              }`}>
                                {label}
                              </span>
                            </div>
                            <p className="text-xs text-gray-400 leading-relaxed">
                              {desc}
                            </p>
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Current Organization Code */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Invite Code
                    </label>
                    <div className="px-4 py-3 rounded-xl border border-white/10 bg-white/5 text-gray-400">
                      <span className="font-mono text-lg tracking-widest">
                        {organization?.code || "N/A"}
                      </span>
                      <p className="text-xs text-gray-500 mt-1">
                        Share this code with others to invite them to your organization
                      </p>
                    </div>
                  </div>

                  {/* User Role Info */}
                  <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4">
                    <div className="flex items-center">
                      <div className="w-8 h-8 bg-blue-500/20 rounded-lg flex items-center justify-center mr-3">
                        <Users size={16} className="text-blue-400" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-blue-300">
                          Your Role: <span className="capitalize">{userRole}</span>
                        </p>
                        <p className="text-xs text-blue-400/80">
                          You have permission to manage organization settings
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === "channels" && canEditChannels() && (
                <div className="space-y-6">
                  <div className="flex justify-between items-center">
                    <h3 className="text-xl font-semibold text-white flex items-center gap-2">
                      <Hash size={20} />
                      Channels
                    </h3>
                    <button
                      type="button"
                      onClick={addChannel}
                      className="flex items-center px-3 py-2 bg-violet-600/20 hover:bg-violet-600/30 border border-violet-500/30 rounded-lg transition-all duration-200 text-violet-300 hover:text-violet-200 text-sm font-medium"
                    >
                      <Plus size={16} className="mr-1" />
                      Add Channel
                    </button>
                  </div>
                  
                  <div className="space-y-4">
                    {channels.map((channel, index) => (
                      <div 
                        key={channel.id || `channel-${index}`} 
                        ref={(el) => channelRefs.current[index] = el}
                        className="bg-white/5 border border-white/10 rounded-xl p-4"
                      >
                        <div className="flex justify-between items-start mb-3">
                          <h4 className="text-sm font-medium text-gray-300">
                            {channel.name || `Channel ${index + 1}`}
                          </h4>
                          {channels.length > 1 && (
                            <button
                              type="button"
                              onClick={() => handleRemoveChannel(index)}
                              className="text-red-400 hover:text-red-300 transition-colors"
                            >
                              <Trash2 size={16} />
                            </button>
                          )}
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-xs text-gray-400 mb-1">Channel Name</label>
                            <input
                              type="text"
                              value={channel.name}
                              onChange={(e) => updateChannel(index, "name", e.target.value)}
                              placeholder="e.g., general, development"
                              className="w-full px-3 py-2 rounded-lg border border-white/10 bg-white/5 text-white text-sm focus:ring-2 focus:ring-violet-500 focus:outline-none"
                            />
                          </div>
                          <div>
                            <label className="block text-xs text-gray-400 mb-1">Description</label>
                            <input
                              type="text"
                              value={channel.description}
                              onChange={(e) => updateChannel(index, "description", e.target.value)}
                              placeholder="Channel description"
                              className="w-full px-3 py-2 rounded-lg border border-white/10 bg-white/5 text-white text-sm focus:ring-2 focus:ring-violet-500 focus:outline-none"
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {activeTab === "roles" && canEditRoles() && (
                <div className="space-y-6">
                  <div className="flex justify-between items-center">
                    <h3 className="text-xl font-semibold text-white flex items-center gap-2">
                      <Shield size={20} />
                      Roles & Permissions
                    </h3>
                    <button
                      type="button"
                      onClick={addRole}
                      className="flex items-center px-3 py-2 bg-violet-600/20 hover:bg-violet-600/30 border border-violet-500/30 rounded-lg transition-all duration-200 text-violet-300 hover:text-violet-200 text-sm font-medium"
                    >
                      <Plus size={16} className="mr-1" />
                      Add Role
                    </button>
                  </div>
                  
                  <div className="space-y-4">
                    {roles.map((role, index) => (
                      <div 
                        key={role.id || `role-${index}`} 
                        ref={(el) => roleRefs.current[index] = el}
                        className="bg-white/5 border border-white/10 rounded-xl p-4"
                      >
                        <div className="flex justify-between items-start mb-3">
                          <h4 className="text-sm font-medium text-gray-300">
                            {role.name || `Role ${index + 1}`}
                          </h4>
                          {roles.length > 1 && (
                            <button
                              type="button"
                              onClick={() => handleRemoveRole(index)}
                              className="text-red-400 hover:text-red-300 transition-colors"
                            >
                              <Trash2 size={16} />
                            </button>
                          )}
                        </div>
                        <div className="space-y-4">
                          <div>
                            <label className="block text-xs text-gray-400 mb-1">Role Name</label>
                            <input
                              type="text"
                              value={role.name}
                              onChange={(e) => updateRole(index, "name", e.target.value)}
                              placeholder="e.g., moderator, developer"
                              className="w-full px-3 py-2 rounded-lg border border-white/10 bg-white/5 text-white text-sm focus:ring-2 focus:ring-violet-500 focus:outline-none"
                            />
                          </div>
                          <div>
                            <label className="block text-xs text-gray-400 mb-2">Permissions</label>
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                              {availablePermissions.map((permission) => (
                                <label key={permission.key} className="flex items-center space-x-2 cursor-pointer">
                                  <input
                                    type="checkbox"
                                    checked={role.permissions[permission.key]}
                                    onChange={() => togglePermission(index, permission.key)}
                                    className="w-4 h-4 text-violet-600 bg-white/10 border-white/20 rounded focus:ring-violet-500 focus:ring-2"
                                  />
                                  <span className="text-xs text-gray-300">{permission.label}</span>
                                </label>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {activeTab === "members" && (
                <div className="space-y-6">
                  <div className="flex justify-between items-center">
                    <h3 className="text-xl font-semibold text-white flex items-center gap-2">
                      <Users size={20} />
                      Organization Members
                    </h3>
                    <div className="text-sm text-gray-400">
                      {getFilteredMembers().length} of {members.length} member{members.length !== 1 ? 's' : ''}
                    </div>
                  </div>
                  
                  {/* Search and Filters */}
                  <div className="space-y-4">
                    {/* Search Bar and Filter Toggle - Side by Side */}
                    <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 items-stretch sm:items-center">
                      {/* Search Bar */}
                      <div className="relative flex-1">
                        <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                          <Search size={16} className="text-gray-400" />
                        </div>
                        <input
                          type="text"
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          placeholder="Search members by name, email, or role..."
                          className="w-full pl-10 pr-4 py-3 rounded-xl border border-white/10 bg-white/5 text-white placeholder-gray-400 focus:ring-2 focus:ring-violet-500 focus:outline-none focus:border-violet-500/50 transition-all"
                        />
                      </div>
                      
                      {/* Filter Toggle Button and Clear Filters */}
                      <div className="flex items-center gap-3 flex-shrink-0">
                        <button
                          type="button"
                          onClick={() => setShowFilters(!showFilters)}
                          className="flex items-center px-3 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl transition-all duration-200 text-gray-300 hover:text-white text-sm font-medium"
                        >
                          <Filter size={16} className="mr-2" />
                          Filters
                          <ChevronDown size={16} className={`ml-2 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
                        </button>
                        
                        {/* Clear Filters */}
                        {(searchQuery || roleFilter !== "all" || dateFilter !== "all") && (
                          <button
                            type="button"
                            onClick={() => {
                              setSearchQuery("");
                              setRoleFilter("all");
                              setDateFilter("all");
                            }}
                            className="text-xs text-violet-400 hover:text-violet-300 transition-colors whitespace-nowrap"
                          >
                            Clear all filters
                          </button>
                        )}
                      </div>
                    </div>
                    
                    {/* Filter Options */}
                    {showFilters && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-white/5 border border-white/10 rounded-xl">
                        {/* Role Filter */}
                        <div>
                          <label className="block text-xs text-gray-400 mb-2">Filter by Role</label>
                          <select
                            value={roleFilter}
                            onChange={(e) => setRoleFilter(e.target.value)}
                            className="w-full px-3 py-2 rounded-lg border border-white/10 bg-white/5 text-white text-sm focus:ring-2 focus:ring-violet-500 focus:outline-none"
                          >
                            <option value="all">All Roles</option>
                            {getUniqueRoles().map((role) => (
                              <option key={role} value={role}>
                                {role.charAt(0).toUpperCase() + role.slice(1)}
                              </option>
                            ))}
                          </select>
                        </div>
                        
                        {/* Date Filter */}
                        <div>
                          <label className="block text-xs text-gray-400 mb-2">Filter by Join Date</label>
                          <select
                            value={dateFilter}
                            onChange={(e) => setDateFilter(e.target.value)}
                            className="w-full px-3 py-2 rounded-lg border border-white/10 bg-white/5 text-white text-sm focus:ring-2 focus:ring-violet-500 focus:outline-none"
                          >
                            <option value="all">All Time</option>
                            <option value="today">Today</option>
                            <option value="week">Last Week</option>
                            <option value="month">Last Month</option>
                            <option value="3months">Last 3 Months</option>
                          </select>
                        </div>
                      </div>
                    )}
                  </div>
                  
                  {/* Active Filters Summary */}
                  {(searchQuery || roleFilter !== "all" || dateFilter !== "all") && (
                    <div className="flex flex-wrap items-center gap-2 p-3 bg-violet-500/10 border border-violet-500/20 rounded-lg">
                      <span className="text-xs text-violet-300 font-medium">Active filters:</span>
                      {searchQuery && (
                        <span className="inline-flex items-center px-2 py-1 bg-violet-600/20 border border-violet-500/30 rounded text-xs text-violet-200">
                          Search: "{searchQuery}"
                        </span>
                      )}
                      {roleFilter !== "all" && (
                        <span className="inline-flex items-center px-2 py-1 bg-blue-600/20 border border-blue-500/30 rounded text-xs text-blue-200">
                          Role: {roleFilter.charAt(0).toUpperCase() + roleFilter.slice(1)}
                        </span>
                      )}
                      {dateFilter !== "all" && (
                        <span className="inline-flex items-center px-2 py-1 bg-green-600/20 border border-green-500/30 rounded text-xs text-green-200">
                          Date: {dateFilter === "today" ? "Today" : dateFilter === "week" ? "Last Week" : dateFilter === "month" ? "Last Month" : "Last 3 Months"}
                        </span>
                      )}
                    </div>
                  )}
                  
                  {membersLoading ? (
                    <div className="flex justify-center py-8">
                      <div className="w-8 h-8 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {getFilteredMembers().length === 0 ? (
                        <div className="text-center py-8 text-gray-400">
                          <Users size={48} className="mx-auto mb-4 opacity-50" />
                          {members.length === 0 ? (
                            <p>No members found</p>
                          ) : (
                            <div>
                              <p>No members match your filters</p>
                              <p className="text-xs text-gray-500 mt-1">
                                Try adjusting your search or filter criteria
                              </p>
                            </div>
                          )}
                        </div>
                      ) : (
                        getFilteredMembers().map((member) => (
                          <div key={member.id} className="bg-white/5 border border-white/10 rounded-xl p-4">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-3">
                                <div className="w-12 h-12 bg-gradient-to-br from-violet-500 to-indigo-600 rounded-full flex items-center justify-center text-white font-medium overflow-hidden">
                                  {member.userPhoto ? (
                                    <img
                                      src={member.userPhoto}
                                      alt={member.name}
                                      className="w-full h-full object-cover rounded-full"
                                    />
                                  ) : (
                                    (member.name?.[0] || member.email[0]).toUpperCase()
                                  )}
                                </div>
                                <div>
                                  <div className="flex items-center space-x-2">
                                    <p className="text-sm font-medium text-white">
                                      {member.name}
                                    </p>
                                    {member.isCreator && (
                                      <Crown size={14} className="text-yellow-400" />
                                    )}
                                  </div>
                                  <p className="text-xs text-gray-400">{member.email}</p>
                                  <div className="flex items-center space-x-2 mt-1">
                                    <span className="text-xs px-2 py-1 bg-blue-500/20 border border-blue-500/30 rounded-md text-blue-300 capitalize">
                                      {member.role}
                                    </span>
                                    <span className="text-xs text-gray-500">
                                      Joined {new Date(member.joinedAt).toLocaleDateString()}
                                    </span>
                                  </div>
                                </div>
                              </div>
                              
                              {canManageUsers() && !member.isCreator && (
                                <div className="flex items-center space-x-2">
                                  {editingMember === member.id ? (
                                    <div className="flex items-center space-x-2">
                                      <select
                                        className="px-2 py-1 bg-white/10 border border-white/20 rounded text-white text-sm"
                                        value={tempRole}
                                        onChange={(e) => setTempRole(e.target.value)}
                                      >
                                        <option value="member">Member</option>
                                        <option value="admin">Admin</option>
                                        {roles.map((role) => (
                                          role.name && (
                                            <option key={role.id || role.name} value={role.name}>
                                              {role.name}
                                            </option>
                                          )
                                        ))}
                                      </select>
                                      <button
                                        type="button"
                                        onClick={(e) => {
                                          e.preventDefault();
                                          e.stopPropagation();
                                          saveMemberRole(member.id);
                                        }}
                                        className="text-green-400 hover:text-green-300 text-sm px-2 py-1 border border-green-500/30 bg-green-600/20 hover:bg-green-600/30 rounded font-medium cursor-pointer"
                                      >
                                        Save
                                      </button>
                                      <button
                                        type="button"
                                        onClick={(e) => {
                                          e.preventDefault();
                                          e.stopPropagation();
                                          cancelEditingMember();
                                        }}
                                        className="text-gray-400 hover:text-gray-300 text-sm px-2 py-1 border border-white/20 rounded cursor-pointer"
                                      >
                                        Cancel
                                      </button>
                                    </div>
                                  ) : (
                                    <>
                                      <button
                                        type="button"
                                        onClick={(e) => {
                                          e.preventDefault();
                                          e.stopPropagation();
                                          startEditingMember(member);
                                        }}
                                        className="text-blue-400 hover:text-blue-300 transition-colors p-1 cursor-pointer"
                                        title="Change role"
                                      >
                                        <Edit3 size={18} />
                                      </button>
                                      <button
                                        type="button"
                                        onClick={(e) => {
                                          e.preventDefault();
                                          e.stopPropagation();
                                          handleRemoveMember(member);
                                        }}
                                        className="text-red-400 hover:text-red-300 transition-colors p-1 cursor-pointer"
                                        title="Remove member"
                                      >
                                        <UserMinus size={18} />
                                      </button>
                                    </>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        ))
                      )}
                      
                      {!canManageUsers() && members.length > 0 && (
                        <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-4">
                          <div className="flex items-start">
                            <div className="w-6 h-6 bg-yellow-500/20 rounded-lg flex items-center justify-center mr-3 flex-shrink-0 mt-0.5">
                              <Lock size={12} className="text-yellow-400" />
                            </div>
                            <div>
                              <p className="text-sm font-medium text-yellow-300 mb-1">
                                Limited Access
                              </p>
                              <p className="text-xs text-yellow-400/80">
                                You can view organization members but cannot modify their roles or remove them. Contact an administrator with 'Manage Users' permission for member management.
                              </p>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {activeTab === "danger" && isCreator && (
                <div className="space-y-6">
                  <div className="flex justify-between items-center">
                    <h3 className="text-xl font-semibold text-red-400 flex items-center gap-2">
                      <AlertTriangle size={20} />
                      Danger Zone
                    </h3>
                  </div>
                  
                  <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-6 space-y-4">
                    <div className="flex items-start space-x-3">
                      <AlertTriangle size={20} className="text-red-400 mt-0.5 flex-shrink-0" />
                      <div className="flex-1">
                        <h4 className="text-lg font-semibold text-red-300 mb-2">
                          Delete Organization
                        </h4>
                        <p className="text-red-400/80 text-sm mb-4 leading-relaxed">
                          Permanently delete this organization and all of its data. This action cannot be undone.
                          All members will be removed, and all channels, roles, and settings will be lost forever.
                        </p>
                        
                        {!showDeleteConfirm ? (
                          <button
                            type="button"
                            onClick={() => setShowDeleteConfirm(true)}
                            className="flex items-center px-4 py-2 bg-red-600/20 hover:bg-red-600/30 border border-red-500/40 rounded-lg transition-all duration-200 text-red-300 hover:text-red-200 text-sm font-medium"
                          >
                            <Trash2 size={16} className="mr-2" />
                            Delete Organization
                          </button>
                        ) : (
                          <div className="space-y-4">
                            <div className="p-4 bg-red-600/10 border border-red-500/30 rounded-lg">
                              <p className="text-red-300 text-sm font-medium mb-3">
                                To confirm deletion, please type the organization name:
                              </p>
                              <p className="text-white font-mono text-sm mb-3 bg-black/20 px-3 py-2 rounded-lg border">
                                {organization?.name}
                              </p>
                              <input
                                type="text"
                                value={deleteConfirmation}
                                onChange={(e) => setDeleteConfirmation(e.target.value)}
                                placeholder="Type organization name here"
                                className="w-full px-3 py-2 rounded-lg border border-red-500/30 bg-red-500/5 text-white text-sm focus:ring-2 focus:ring-red-500 focus:outline-none"
                              />
                            </div>
                            
                            <div className="flex space-x-3">
                              <button
                                type="button"
                                onClick={() => {
                                  setShowDeleteConfirm(false);
                                  setDeleteConfirmation("");
                                }}
                                className="px-4 py-2 bg-gray-600/20 hover:bg-gray-600/30 border border-gray-500/30 rounded-lg text-gray-300 hover:text-gray-200 text-sm font-medium transition-all duration-200"
                              >
                                Cancel
                              </button>
                              <button
                                type="button"
                                onClick={handleDeleteOrganization}
                                disabled={deleteConfirmation !== organization?.name || loading}
                                className="flex items-center px-4 py-2 bg-red-600/30 hover:bg-red-600/40 border border-red-500/40 rounded-lg text-red-200 hover:text-red-100 text-sm font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                {loading ? (
                                  <>
                                    <div className="w-4 h-4 border-2 border-red-200/30 border-t-red-200 rounded-full animate-spin mr-2"></div>
                                    Deleting...
                                  </>
                                ) : (
                                  <>
                                    <Trash2 size={16} className="mr-2" />
                                    Delete Forever
                                  </>
                                )}
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-4">
                    <div className="flex items-start space-x-3">
                      <AlertTriangle size={16} className="text-yellow-400 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-yellow-300 text-sm font-medium mb-1">
                          Important Notes:
                        </p>
                        <ul className="text-yellow-400/80 text-xs space-y-1">
                          <li>• All organization data will be permanently deleted</li>
                          <li>• All members will be removed from the organization</li>
                          <li>• This action cannot be undone</li>
                          <li>• Consider transferring ownership instead if you want to leave</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end gap-3 pt-4">
              <button
                type="button"
                onClick={handleClose}
                disabled={loading}
                className="px-6 py-3 rounded-lg bg-gray-600/20 hover:bg-gray-600/30 border border-gray-500/30 text-gray-400 hover:text-gray-300 font-semibold transition-all duration-200 cursor-pointer active:scale-95 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading || !orgName.trim()}
                className={`px-6 py-3 rounded-lg font-semibold transition-all duration-200 cursor-pointer active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 ${
                  hasUnsavedChanges 
                    ? "bg-orange-600/20 hover:bg-orange-600/30 border border-orange-500/30 text-orange-400 hover:text-orange-300" 
                    : "bg-violet-600/20 hover:bg-violet-600/30 border border-violet-500/30 text-violet-400 hover:text-violet-300"
                }`}
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    Updating...
                  </>
                ) : (
                  <>
                    <Save size={16} />
                    {hasUnsavedChanges ? "Save Changes*" : "Save Changes"}
                    {hasUnsavedChanges && (
                      <span className="w-2 h-2 bg-orange-400 rounded-full animate-pulse" />
                    )}
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
    
    {/* Member Removal Confirmation Modal - Outside main container */}
    <ConfirmationModal
      isOpen={showRemoveMemberConfirm}
      onClose={() => {
        setShowRemoveMemberConfirm(false);
        setMemberToRemove(null);
      }}
      onConfirm={confirmRemoveMember}
      title="Remove Member"
      message={`Are you sure you want to remove "${memberToRemove?.name}" from the organization? They will lose access to all channels and content. This action cannot be undone.`}
      confirmText="Remove Member"
      cancelText="Cancel"
      type="danger"
      loading={memberActionLoading}
    />
    
    {/* Channel Removal Confirmation Modal */}
    <ConfirmationModal
      isOpen={showRemoveChannelConfirm}
      onClose={() => {
        setShowRemoveChannelConfirm(false);
        setChannelToRemove(null);
      }}
      onConfirm={confirmRemoveChannel}
      title="Remove Channel"
      message={`Are you sure you want to remove the channel "${channelToRemove !== null ? channels[channelToRemove]?.name || `Channel ${channelToRemove + 1}` : ''}"? This action cannot be undone.`}
      confirmText="Remove Channel"
      cancelText="Cancel"
      type="danger"
      loading={false}
    />
    
    {/* Role Removal Confirmation Modal */}
    <ConfirmationModal
      isOpen={showRemoveRoleConfirm}
      onClose={() => {
        setShowRemoveRoleConfirm(false);
        setRoleToRemove(null);
      }}
      onConfirm={confirmRemoveRole}
      title="Remove Role"
      message={`Are you sure you want to remove the role "${roleToRemove !== null ? roles[roleToRemove]?.name || `Role ${roleToRemove + 1}` : ''}"? This action cannot be undone.`}
      confirmText="Remove Role"
      cancelText="Cancel"
      type="danger"
      loading={false}
    />
    
    {/* Unsaved Changes Confirmation Modal */}
    <ConfirmationModal
      isOpen={showUnsavedChangesModal}
      onClose={cancelUnsavedChanges}
      onConfirm={discardChanges}
      title="Unsaved Changes"
      message="You have unsaved changes that will be lost if you continue. Are you sure you want to discard these changes?"
      confirmText="Discard Changes"
      cancelText="Keep Editing"
      type="warning"
      loading={false}
    />
    </>
  );
};

export default OrgSettingsModal;
