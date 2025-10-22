import { useState, useRef, useEffect } from "react";
import { X, Plus, Trash2, Users, Settings, Globe, Lock } from "lucide-react";
import { toast } from "react-hot-toast";
import axios from "axios";
import { getRoleStyle, initializeRoleColors } from "../utils/roleColors";

const CreateOrgModal = ({ onClose, onSuccess }) => {
  const [orgName, setOrgName] = useState("");
  const [accessLevel, setAccessLevel] = useState("invite-only");
  const [channels, setChannels] = useState([
    { name: "general", description: "General discussion" },
  ]);

    const generateOrgCode = () => {
      const prefix = orgName.slice(0, 3).toUpperCase();
      const suffix = Math.floor(100 + Math.random() * 900); // ensures 3 digits (100–999)
      return prefix + suffix;
  };
  // Default roles with boolean permissions
  const [roles, setRoles] = useState([
    {
      name: "Admin",
      permissions: {
        manage_settings: true,
        manage_users: true,
        manage_channels: true,
        manage_meetings: true,
        manage_notes: true,
        manage_noticeboard: true,
        roles_access: true,
        invite_access: true,
      },
      accessibleChannels: [],
    },
    {
      name: "Member",
      permissions: {
        manage_settings: false,
        manage_users: false,
        manage_channels: false,
        manage_meetings: false,
        manage_notes: false,
        manage_noticeboard: false,
        roles_access: false,
        invite_access: false,
      },
      accessibleChannels: [],
    },
  ]);

  const [loading, setLoading] = useState(false);

  // Refs for scrolling to new elements
  const channelRefs = useRef([]);
  const roleRefs = useRef([]);

  // Initialize role colors whenever roles change
  useEffect(() => {
    const roleNames = roles.map(role => role.name.trim()).filter(name => name);
    if (roleNames.length > 0) {
      initializeRoleColors(roleNames);
    }
  }, [roles]);

  // --- Channel Management ---
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

  // --- Role Management ---
  const addRole = () => {
    const newRoles = [
      ...roles,
      {
        name: "",
        permissions: {
          manage_settings: false,
          manage_users: false,
          manage_channels: false,
          manage_meetings: false,
          manage_notes: false,
          manage_noticeboard: false,
          roles_access: false,
          invite_access: false,
        },
        accessibleChannels: [],
      },
    ];
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
    updated[roleIndex].permissions[permission] =
      !updated[roleIndex].permissions[permission];
    setRoles(updated);
  };

  const toggleChannelAccess = (roleIndex, channelName) => {
    const updated = [...roles];
    const role = updated[roleIndex];
    const hasAccess = role.accessibleChannels.includes(channelName);

    updated[roleIndex].accessibleChannels = hasAccess
      ? role.accessibleChannels.filter((c) => c !== channelName)
      : [...role.accessibleChannels, channelName];

    setRoles(updated);
  };

  const availablePermissions = [
    { key: "manage_settings", label: "Manage Settings" },
    { key: "manage_users", label: "Manage Users" },
    { key: "manage_channels", label: "Manage Channels" },
    { key: "manage_meetings", label: "Manage Meetings" },
    { key: "manage_notes", label: "Manage Notes" },
    { key: "manage_noticeboard", label: "Manage Noticeboard" },
    { key: "roles_access", label: "Manage Roles" },
    { key: "invite_access", label: "Send Invitations" },
  ];

  // --- Submit Handler ---
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!orgName.trim()) return toast.error("Please enter an organisation name");

    const invalidChannels = channels.some((ch) => !ch.name.trim());
    if (invalidChannels) return toast.error("All channels must have a name");

    const channelNames = channels.map((ch) => ch.name.trim().toLowerCase());
    if (new Set(channelNames).size !== channelNames.length)
      return toast.error("Channel names must be unique");

    const invalidRoles = roles.some((r) => !r.name.trim());
    if (invalidRoles) return toast.error("All roles must have a name");

    const roleNames = roles.map((r) => r.name.trim().toLowerCase());
    if (new Set(roleNames).size !== roleNames.length)
      return toast.error("Role names must be unique");

    setLoading(true);
    let toastId;

    try {
      toastId = toast.loading("Creating organisation...");

      const orgData = {
        name: orgName.trim(),
        accessLevel,
        channels: channels.map((ch) => ({
          name: ch.name.trim(),
          description: ch.description.trim(),
        })),
        org_code: generateOrgCode(),
        roles: roles.map((role) => ({
          name: role.name.trim(),
          permissions: {
            manage_channels: role.permissions.manage_channels,
            manage_users: role.permissions.manage_users,
            settings_access: role.permissions.manage_settings,
            notes_access: role.permissions.manage_notes,
            meeting_access: role.permissions.manage_meetings,
            noticeboard_access: role.permissions.manage_noticeboard,
            roles_access: role.permissions.roles_access,
            invite_access: role.permissions.invite_access,
          },
          accessible_teams: Array.isArray(role.accessibleChannels)
            ? role.accessibleChannels.map((c) => c?.trim()).filter(Boolean)
            : [],
        }))
      };

      const token = localStorage.getItem("token");
      const response = await axios.post(
        `${import.meta.env.VITE_BASE_URL}/api/orgs/create`,
        orgData,
        {
          withCredentials: true,
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        }
      );

      toast.success("Organisation created successfully", { id: toastId });
      if (onSuccess) onSuccess(response.data.organization);
      
      // Notify other components of new organization
      window.dispatchEvent(new CustomEvent('organizationUpdated', { detail: response.data.organization }));

      onClose();
      
      // Refresh the page to show the new organization
      setTimeout(() => {
        window.location.reload();
      }, 500); // Small delay to allow modal to close gracefully
    } catch (err) {
      console.error("Error creating organization:", err);
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-md p-4 transition-all duration-300">
      <div className="relative w-full max-w-4xl max-h-[90vh] bg-gray-900/80 backdrop-blur-xl border border-white/20 rounded-3xl shadow-2xl overflow-hidden animate-fadeIn hover:scale-[1.01] transition-transform">
        <div className="absolute inset-0 bg-gradient-to-br from-violet-500/10 via-transparent to-indigo-500/10"></div>
        <div className="relative overflow-y-auto max-h-[90vh] px-8 py-10">
          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Close Button */}
            <button
              type="button"
              onClick={onClose}
              className="absolute top-5 right-5 text-gray-400 hover:text-white transition-all transform text-xl cursor-pointer active:scale-95 z-10 p-2 rounded-full hover:bg-white/10 hover:rotate-90 duration-300"
            >
              <X size={22} />
            </button>

            {/* Header */}
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold mb-2 text-transparent bg-clip-text bg-gradient-to-r from-violet-500 to-indigo-400">
                Create Organisation
              </h2>
              <p className="text-gray-400 text-sm">
                Set up your organization with channels and roles
              </p>
            </div>

            {/* Basic Info */}
            <div className="space-y-6">
              <h3 className="text-xl font-semibold text-white flex items-center gap-2">
                <Settings size={20} />
                Basic Information
              </h3>
              <div className="w-full">
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Organisation Name
                </label>
                <input
                  type="text"
                  value={orgName}
                  onChange={(e) => setOrgName(e.target.value)}
                  placeholder="Enter organisation name"
                  className="w-full px-4 py-3 rounded-xl border border-white/10 bg-white/5 text-white focus:ring-2 focus:ring-violet-500 focus:outline-none"
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
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Access Level
                </label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {[
                    { value: "public", label: "Public", desc: "Anyone can send invites", icon: Globe },
                    { value: "invite-only", label: "Invite Only", desc: "Members can send invites", icon: Users },
                    { value: "admin-only", label: "Admin Only", desc: "Only admins send invites", icon: Lock },
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
                      <div
                        className={`p-4 rounded-xl border transition-all cursor-pointer ${
                          accessLevel === value
                            ? "border-violet-500 bg-violet-500/10 shadow-lg shadow-violet-500/20"
                            : "border-white/10 bg-white/5 hover:bg-white/10 hover:border-white/20"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <Icon
                            size={20}
                            className={
                              accessLevel === value
                                ? "text-violet-400"
                                : "text-gray-400"
                            }
                          />
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
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-violet-600/20 text-violet-400 hover:bg-violet-600/30 border border-violet-500/20 hover:border-violet-500/40"
                >
                  <Plus size={16} />
                  Add Channel
                </button>
              </div>

              <div className="space-y-4">
                {channels.map((channel, index) => (
                  <div
                    key={index}
                    ref={(el) => channelRefs.current[index] = el}
                    className="p-4 rounded-lg border border-white/10 bg-white/5"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm font-medium text-gray-300">
                        Channel {index + 1}
                      </span>
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
                        <label className="block text-sm font-medium text-gray-300 mb-1">
                          Channel Name
                        </label>
                        <input
                          type="text"
                          value={channel.name}
                          onChange={(e) =>
                            updateChannel(index, "name", e.target.value)
                          }
                          placeholder="e.g., general"
                          className="w-full px-3 py-2 rounded-xl border border-white/10 bg-white/5 text-white focus:ring-2 focus:ring-violet-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">
                          Description
                        </label>
                        <input
                          type="text"
                          value={channel.description}
                          onChange={(e) =>
                            updateChannel(index, "description", e.target.value)
                          }
                          placeholder="Channel purpose..."
                          className="w-full px-3 py-2 rounded-xl border border-white/10 bg-white/5 text-white focus:ring-2 focus:ring-violet-500"
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
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-violet-600/20 text-violet-400 hover:bg-violet-600/30 border border-violet-500/20 hover:border-violet-500/40"
                >
                  <Plus size={16} />
                  Add Role
                </button>
              </div>

              <div className="space-y-4">
                {roles.map((role, roleIndex) => (
                  <div
                    key={roleIndex}
                    ref={(el) => roleRefs.current[roleIndex] = el}
                    className="p-4 rounded-lg border border-white/10 bg-white/5"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3 flex-1">
                        <input
                          type="text"
                          value={role.name}
                          onChange={(e) =>
                            updateRole(roleIndex, "name", e.target.value)
                          }
                          placeholder="Role name"
                          className="px-3 py-2 rounded-xl border border-white/10 bg-white/5 text-white focus:ring-2 focus:ring-violet-500 flex-1"
                        />
                        {role.name.trim() && (
                          <span className={`px-3 py-1 rounded-lg text-xs font-medium border ${getRoleStyle(role.name).background} ${getRoleStyle(role.name).border} ${getRoleStyle(role.name).text}`}>
                            {role.name}
                          </span>
                        )}
                      </div>
                      {roles.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeRole(roleIndex)}
                          className="text-red-400 hover:text-red-300 transition-colors ml-3"
                        >
                          <Trash2 size={16} />
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      {availablePermissions.map((p) => (
                        <label
                          key={p.key}
                          className="flex items-center gap-2 cursor-pointer"
                        >
                          <input
                            type="checkbox"
                            checked={role.permissions[p.key]}
                            onChange={() =>
                              togglePermission(roleIndex, p.key)
                            }
                            className="rounded border-white/20 bg-white/5 text-violet-500 focus:ring-violet-500"
                          />
                          <span className="text-sm text-gray-300">{p.label}</span>
                        </label>
                      ))}
                    </div>

                    <div className="mt-4">
                      <h2 className="text-lg font-medium text-white">
                        Accessible Channels
                      </h2>
                      <div className="grid grid-cols-2 gap-2 mt-2">
                        {channels.map((ch, i) => (
                          <label
                            key={i}
                            className="flex items-center gap-2 cursor-pointer"
                          >
                            <input
                              type="checkbox"
                              checked={role.accessibleChannels.includes(
                                ch.name
                              )}
                              onChange={() =>
                                toggleChannelAccess(roleIndex, ch.name)
                              }
                              className="rounded border-white/20 bg-white/5 text-violet-500 focus:ring-violet-500"
                            />
                            <span className="text-sm text-gray-300">
                              {ch.name}
                            </span>
                          </label>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Submit Buttons */}
            <div className="flex justify-end gap-3 pt-6 border-t border-white/10">
              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                className="px-6 py-3 rounded-lg bg-gray-600/20 hover:bg-gray-600/30 border border-gray-500/30 text-gray-400 hover:text-gray-300 font-semibold transition-all duration-200 cursor-pointer active:scale-95 w-full sm:w-auto disabled:opacity-50 shadow-lg hover:shadow-xl"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-3 rounded-lg bg-violet-600/20 hover:bg-violet-600/30 border border-violet-500/30 text-violet-400 hover:text-violet-300 font-semibold transition-all duration-200 cursor-pointer active:scale-95 w-full sm:w-auto disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shadow-lg hover:shadow-xl"
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
