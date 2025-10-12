import { useState, useEffect } from "react";
import { X, Globe, Users, Lock, Save, Plus, Trash2, Hash, Shield } from "lucide-react";
import { toast } from "react-hot-toast";
import axios from "axios";

const OrgSettingsModal = ({ organization, userRole, userPermissions, onClose, onSuccess }) => {
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
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("");

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

  // Update state when organization prop changes
  useEffect(() => {
    if (organization) {
      console.log("Organization data in settings modal:", organization);
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
    }
  }, [organization]);

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
      if (onSuccess) onSuccess(response.data.organization);
      onClose();
    } catch (err) {
      console.error("Error updating organization:", err);
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
    setChannels([...channels, { name: "", description: "" }]);
  };

  const removeChannel = (index) => {
    if (channels.length > 1) {
      setChannels(channels.filter((_, i) => i !== index));
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
    setRoles([...roles, {
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
  };

  const removeRole = (index) => {
    if (roles.length > 1) {
      setRoles(roles.filter((_, i) => i !== index));
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-md p-4 transition-all duration-300">
      <div className="relative w-full max-w-4xl max-h-[90vh] bg-white/10 dark:bg-gray-900/80 backdrop-blur-xl border border-white/20 rounded-3xl shadow-2xl overflow-hidden animate-fadeIn hover:scale-[1.01] transition-transform">
        <div className="absolute inset-0 bg-gradient-to-br from-violet-500/10 via-transparent to-indigo-500/10"></div>
        <div className="relative overflow-y-auto max-h-[90vh] px-8 py-10">
          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Close Button */}
            <button
              type="button"
              onClick={onClose}
              className="absolute top-5 right-5 text-gray-400 hover:text-white transition-colors text-xl cursor-pointer active:scale-95 z-10"
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
              <div className="flex space-x-1 mb-8">
                {availableTabs.map((tab) => {
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setActiveTab(tab.id)}
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
                      <div key={channel.id || `channel-${index}`} className="bg-white/5 border border-white/10 rounded-xl p-4">
                        <div className="flex justify-between items-start mb-3">
                          <h4 className="text-sm font-medium text-gray-300">
                            {channel.name || `Channel ${index + 1}`}
                          </h4>
                          {channels.length > 1 && (
                            <button
                              type="button"
                              onClick={() => removeChannel(index)}
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
                      <div key={role.id || `role-${index}`} className="bg-white/5 border border-white/10 rounded-xl p-4">
                        <div className="flex justify-between items-start mb-3">
                          <h4 className="text-sm font-medium text-gray-300">
                            {role.name || `Role ${index + 1}`}
                          </h4>
                          {roles.length > 1 && (
                            <button
                              type="button"
                              onClick={() => removeRole(index)}
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
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end gap-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                className="px-6 py-3 rounded-lg bg-gray-600/20 hover:bg-gray-600/30 border border-gray-500/30 text-gray-400 hover:text-gray-300 font-semibold transition-all duration-200 cursor-pointer active:scale-95 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading || !orgName.trim()}
                className="px-6 py-3 rounded-lg bg-violet-600/20 hover:bg-violet-600/30 border border-violet-500/30 text-violet-400 hover:text-violet-300 font-semibold transition-all duration-200 cursor-pointer active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    Updating...
                  </>
                ) : (
                  <>
                    <Save size={16} />
                    Save Changes
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default OrgSettingsModal;