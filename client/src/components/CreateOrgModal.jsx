import { useState } from "react";
import { X, Plus, Trash2, Users, Settings, Globe, Lock } from "lucide-react";
import { toast } from "react-hot-toast";
import axios from "axios";

// Modal for creating a new organisation
const CreateOrgModal = ({ onClose, onSuccess }) => {
  const [orgName, setOrgName] = useState("");
  const [orgDescription, setOrgDescription] = useState("");
  const [orgType, setOrgType] = useState("business");
  const [accessLevel, setAccessLevel] = useState("invite-only");
  const [channels, setChannels] = useState([{ name: "general", description: "General discussion" }]);
  const [roles, setRoles] = useState([
    { name: "Admin", permissions: ["manage_org", "manage_users", "manage_events", "manage_channels"] },
    { name: "Member", permissions: ["view_events", "create_events", "join_channels"] }
  ]);
  const [loading, setLoading] = useState(false);

  // Helper functions for channels
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

  // Helper functions for roles
  const addRole = () => {
    setRoles([...roles, { name: "", permissions: [] }]);
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
    const role = roles[roleIndex];
    const updatedPermissions = role.permissions.includes(permission)
      ? role.permissions.filter(p => p !== permission)
      : [...role.permissions, permission];
    updateRole(roleIndex, "permissions", updatedPermissions);
  };

  const availablePermissions = [
    { key: "manage_org", label: "Manage Organization" },
    { key: "manage_users", label: "Manage Users" },
    { key: "manage_events", label: "Manage Events" },
    { key: "manage_channels", label: "Manage Channels" },
    { key: "view_events", label: "View Events" },
    { key: "create_events", label: "Create Events" },
    { key: "join_channels", label: "Join Channels" },
    { key: "invite_members", label: "Invite Members" }
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validation
    if (!orgName.trim()) return toast.error("Please enter an organisation name");
    if (!orgDescription.trim()) return toast.error("Please enter an organisation description");
    
    // Validate channels
    const invalidChannels = channels.some(channel => !channel.name.trim());
    if (invalidChannels) return toast.error("All channels must have a name");
    
    // Check for duplicate channel names
    const channelNames = channels.map(ch => ch.name.trim().toLowerCase()).filter(name => name);
    const uniqueChannelNames = new Set(channelNames);
    if (channelNames.length !== uniqueChannelNames.size) {
      return toast.error("Channel names must be unique");
    }
    
    // Validate roles
    const invalidRoles = roles.some(role => !role.name.trim());
    if (invalidRoles) return toast.error("All roles must have a name");
    
    // Check for duplicate role names
    const roleNames = roles.map(r => r.name.trim().toLowerCase()).filter(name => name);
    const uniqueRoleNames = new Set(roleNames);
    if (roleNames.length !== uniqueRoleNames.size) {
      return toast.error("Role names must be unique");
    }
    
    setLoading(true);
    let toastId;
    try {
      toastId = toast.loading("Creating organisation...");
      
      // Prepare organization data
      const orgData = {
        name: orgName.trim(),
        description: orgDescription.trim(),
        type: orgType,
        accessLevel,
        channels: channels.filter(channel => channel.name.trim()),
        roles: roles.filter(role => role.name.trim())
      };
      
      // Call the real API
      const token = localStorage.getItem("token");
      const response = await axios.post(
        `${import.meta.env.VITE_BASE_URL}/api/orgs/create`, 
        orgData, 
        { 
          withCredentials: true,
          headers: token ? { Authorization: `Bearer ${token}` } : {}
        }
      );
      
      toast.success("Organisation created successfully", { id: toastId });
      if (onSuccess) onSuccess(response.data.organization);
      onClose();
    } catch (err) {
      console.error("Error creating organization:", err);
      toast.error(err.response?.data?.message || err.response?.data?.error || err.message || "Something went wrong", { id: toastId });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-md p-4 transition-all duration-300">
      <div className="relative w-full max-w-4xl max-h-[90vh] bg-white/10 dark:bg-gray-900/80 backdrop-blur-xl border border-white/20 rounded-3xl shadow-2xl overflow-hidden animate-fadeIn hover:scale-[1.01] transition-transform">
        <div className="absolute inset-0 bg-gradient-to-br from-violet-500/10 via-transparent to-indigo-500/10"></div>
        <div className="relative overflow-y-auto max-h-[90vh] px-8 py-10">
          <form onSubmit={handleSubmit} className="space-y-8">
            <button
              type="button"
              onClick={onClose}
              className="absolute top-5 right-5 text-gray-400 hover:text-white transition-colors text-xl cursor-pointer active:scale-95 z-10"
            >
              <X size={22} />
            </button>
            
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold mb-2 text-transparent bg-clip-text bg-gradient-to-r from-violet-500 to-indigo-400">
                Create Organisation
              </h2>
              <p className="text-gray-400 text-sm">Set up your organization with channels and roles</p>
            </div>

            {/* Basic Information */}
            <div className="space-y-6">
              <h3 className="text-xl font-semibold text-white flex items-center gap-2">
                <Settings size={20} />
                Basic Information
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Organisation Name *</label>
                  <input
                    type="text"
                    value={orgName}
                    onChange={(e) => setOrgName(e.target.value)}
                    placeholder="Enter organisation name"
                    className="w-full px-4 py-3 rounded-xl border border-white/10 bg-white/5 text-white focus:ring-2 focus:ring-violet-500 focus:outline-none focus:border-violet-500/50 transition-all"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Organisation Type</label>
                  <select
                    value={orgType}
                    onChange={(e) => setOrgType(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-white/10 bg-white/5 text-white focus:ring-2 focus:ring-violet-500 focus:outline-none focus:border-violet-500/50 transition-all"
                  >
                    <option value="business">Business</option>
                    <option value="nonprofit">Non-profit</option>
                    <option value="educational">Educational</option>
                    <option value="community">Community</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Description *</label>
                <textarea
                  value={orgDescription}
                  onChange={(e) => setOrgDescription(e.target.value)}
                  placeholder="Describe your organisation..."
                  rows={3}
                  className="w-full px-4 py-3 rounded-xl border border-white/10 bg-white/5 text-white focus:ring-2 focus:ring-violet-500 focus:outline-none focus:border-violet-500/50 resize-none transition-all"
                />
              </div>
            </div>

            {/* Access Control */}
            <div className="space-y-6">
              <h3 className="text-xl font-semibold text-white flex items-center gap-2">
                <Lock size={20} />
                Access Control
              </h3>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Access Level</label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {[
                    { value: "public", label: "Public", desc: "Anyone can join", icon: Globe },
                    { value: "invite-only", label: "Invite Only", desc: "Members invite others", icon: Users },
                    { value: "admin-only", label: "Admin Only", desc: "Only admins can invite", icon: Lock }
                  ].map(({ value, label, desc, icon: Icon }) => (
                    <label key={value} className="relative cursor-pointer">
                      <input
                        type="radio"
                        name="accessLevel"
                        value={value}
                        checked={accessLevel === value}
                        onChange={(e) => setAccessLevel(e.target.value)}
                        className="sr-only"
                      />
                      <div className={`p-4 rounded-xl border transition-all cursor-pointer ${
                        accessLevel === value 
                          ? 'border-violet-500 bg-violet-500/10 shadow-lg shadow-violet-500/20' 
                          : 'border-white/10 bg-white/5 hover:bg-white/10 hover:border-white/20'
                      }`}>
                        <div className="flex items-center gap-3">
                          <Icon size={20} className={accessLevel === value ? 'text-violet-400' : 'text-gray-400'} />
                          <div>
                            <div className="font-medium text-white">{label}</div>
                            <div className="text-sm text-gray-400">{desc}</div>
                          </div>
                        </div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            </div>


            {/* Channels */}
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-semibold text-white flex items-center gap-2">
                  <Users size={20} />
                  Channels
                </h3>
                <button
                  type="button"
                  onClick={addChannel}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-violet-600/20 text-violet-400 hover:bg-violet-600/30 transition-all border border-violet-500/20 hover:border-violet-500/40"
                >
                  <Plus size={16} />
                  Add Channel
                </button>
              </div>
              
              <div className="space-y-4">
                {channels.map((channel, index) => (
                  <div key={index} className="p-4 rounded-lg border border-white/10 bg-white/5">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm font-medium text-gray-300">Channel {index + 1}</span>
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
                        <label className="block text-sm font-medium text-gray-300 mb-1">Channel Name</label>
                        <input
                          type="text"
                          value={channel.name}
                          onChange={(e) => updateChannel(index, 'name', e.target.value)}
                          placeholder="e.g., general, announcements"
                          className="w-full px-3 py-2 rounded-xl border border-white/10 bg-white/5 text-white focus:ring-2 focus:ring-violet-500 focus:outline-none focus:border-violet-500/50 transition-all"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">Description</label>
                        <input
                          type="text"
                          value={channel.description}
                          onChange={(e) => updateChannel(index, 'description', e.target.value)}
                          placeholder="Channel purpose..."
                          className="w-full px-3 py-2 rounded-xl border border-white/10 bg-white/5 text-white focus:ring-2 focus:ring-violet-500 focus:outline-none focus:border-violet-500/50 transition-all"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Roles */}
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-semibold text-white flex items-center gap-2">
                  <Users size={20} />
                  Roles & Permissions
                </h3>
                <button
                  type="button"
                  onClick={addRole}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-violet-600/20 text-violet-400 hover:bg-violet-600/30 transition-all border border-violet-500/20 hover:border-violet-500/40"
                >
                  <Plus size={16} />
                  Add Role
                </button>
              </div>
              
              <div className="space-y-4">
                {roles.map((role, roleIndex) => (
                  <div key={roleIndex} className="p-4 rounded-lg border border-white/10 bg-white/5">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <input
                          type="text"
                          value={role.name}
                          onChange={(e) => updateRole(roleIndex, 'name', e.target.value)}
                          placeholder="Role name"
                          className="px-3 py-2 rounded-xl border border-white/10 bg-white/5 text-white focus:ring-2 focus:ring-violet-500 focus:outline-none focus:border-violet-500/50 font-medium transition-all"
                        />
                      </div>
                      {roles.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeRole(roleIndex)}
                          className="text-red-400 hover:text-red-300 transition-colors"
                        >
                          <Trash2 size={16} />
                        </button>
                      )}
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      {availablePermissions.map((permission) => (
                        <label key={permission.key} className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={role.permissions.includes(permission.key)}
                            onChange={() => togglePermission(roleIndex, permission.key)}
                            className="rounded border-white/20 bg-white/5 text-violet-500 focus:ring-violet-500"
                          />
                          <span className="text-sm text-gray-300">{permission.label}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Form Actions */}
            <div className="flex justify-end gap-3 pt-6 border-t border-white/10">
              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                className="px-6 py-3 rounded-xl bg-white/10 text-gray-300 hover:bg-white/20 font-medium transition-all cursor-pointer active:scale-95 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-3 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-semibold shadow-lg transition-all hover:opacity-90 cursor-pointer active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    Creating...
                  </>
                ) : (
                  "Create Organisation"
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CreateOrgModal;