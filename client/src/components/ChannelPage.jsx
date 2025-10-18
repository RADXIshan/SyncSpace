import { useState, useEffect, useRef } from "react";
import { useParams } from "react-router";
import { useAuth } from "../context/AuthContext";
import axios from "axios";
import {
  Hash,
  Send,
  Smile,
  Paperclip,
  Trash2,
  Edit2,
  Home,
  MessageSquare,
  Users,
  Crown,
  MoreVertical,
} from "lucide-react";
import { toast } from "react-hot-toast";
import { getRoleStyle, initializeRoleColors } from "../utils/roleColors";

const ChannelPage = () => {
  const { channelId } = useParams();
  const { user } = useAuth();
  const [channel, setChannel] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [activeTab, setActiveTab] = useState("home");
  const [members, setMembers] = useState([]);
  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);

  const getMessagesRoleStyle = (role) => {
    const baseStyle = getRoleStyle(role);
    const darkTextMap = {
      "text-blue-200": "text-blue-700",
      "text-green-200": "text-green-700",
      "text-purple-200": "text-purple-700",
      "text-pink-200": "text-pink-700",
      "text-indigo-200": "text-indigo-700",
      "text-teal-200": "text-teal-700",
      "text-cyan-200": "text-cyan-700",
      "text-emerald-200": "text-emerald-700",
      "text-lime-200": "text-lime-700",
      "text-amber-200": "text-amber-700",
      "text-orange-200": "text-orange-700",
      "text-red-200": "text-red-700",
      "text-rose-200": "text-rose-700",
      "text-fuchsia-200": "text-fuchsia-700",
      "text-violet-200": "text-violet-700",
      "text-sky-200": "text-sky-700",
      "text-slate-200": "text-slate-700",
      "text-zinc-200": "text-zinc-700",
      "text-stone-200": "text-stone-700",
      "text-neutral-200": "text-neutral-700",
      "text-yellow-200": "text-yellow-800",
      "text-gray-300": "text-gray-700",
    };

    return {
      ...baseStyle,
      text: darkTextMap[baseStyle.text] || "text-gray-700",
    };
  };

  // Initialize role colors on component mount
  useEffect(() => {
    const roleNames = [...new Set(messages.map((msg) => msg.role))].filter(Boolean);
    if (roleNames.length > 0) {
      initializeRoleColors(roleNames);
    }
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    const fetchChannel = async () => {
      if (!channelId || !user?.org_id) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const response = await axios.get(
          `${import.meta.env.VITE_BASE_URL}/api/orgs/${user.org_id}/channels/${channelId}`,
          { withCredentials: true }
        );
        setChannel(response.data.channel);
        setError(null);

        // Mock messages
        setMessages([
          {
            id: 1,
            userId: user.user_id,
            userName: user.name,
            userPhoto: user.photo,
            content: "Welcome to the channel!",
            timestamp: new Date().toISOString(),
          },
        ]);

        // Fetch members
        const membersRes = await axios.get(
          `${import.meta.env.VITE_BASE_URL}/api/orgs/${user.org_id}/members`,
          { withCredentials: true }
        );
        const allMembers = membersRes.data.members || [];
        const filtered = allMembers.filter((member) => {
          if (member.isCreator) return true;
          if (!Array.isArray(member.accessible_teams) || member.accessible_teams.length === 0)
            return true;
          return member.accessible_teams.includes(response.data.channel.name);
        });
        setMembers(filtered);
      } catch (err) {
        console.error("Error fetching channel:", err);
        setError(err?.response?.data?.message || "Failed to load channel");
      } finally {
        setLoading(false);
      }
    };

    fetchChannel();
  }, [channelId, user?.org_id]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    setSending(true);
    try {
      const tempMessage = {
        id: Date.now(),
        userId: user.user_id,
        userName: user.name,
        userPhoto: user.photo,
        content: newMessage,
        timestamp: new Date().toISOString(),
      };

      setMessages((prev) => [...prev, tempMessage]);
      setNewMessage("");
      if (textareaRef.current) textareaRef.current.style.height = "auto";
    } catch (err) {
      console.error("Error sending message:", err);
      toast.error("Failed to send message");
    } finally {
      setSending(false);
    }
  };

  const handleTextareaChange = (e) => {
    setNewMessage(e.target.value);
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height =
        Math.min(textareaRef.current.scrollHeight, 150) + "px";
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage(e);
    }
  };

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now - date;

    if (diff < 60000) return "Just now";
    if (diff < 3600000) return `${Math.floor(diff / 60000)} minutes ago`;
    if (date.toDateString() === now.toDateString())
      return date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
    if (diff < 604800000)
      return date.toLocaleDateString("en-US", {
        weekday: "short",
        hour: "numeric",
        minute: "2-digit",
      });
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  };

  if (loading)
    return (
      <div className="flex items-center justify-center h-full bg-white">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading channel...</p>
        </div>
      </div>
    );

  if (error)
    return (
      <div className="flex flex-col items-center justify-center h-full text-center p-6 bg-white">
        <div className="bg-red-50 p-6 rounded-xl border border-red-200 mb-4 max-w-md">
          <p className="text-red-700 font-medium text-lg mb-2">Error Loading Channel</p>
          <p className="text-red-600 font-medium">{error}</p>
        </div>
        <p className="text-gray-600">Unable to load channel information</p>
      </div>
    );

  if (!channel)
    return (
      <div className="flex flex-col items-center justify-center h-full text-center p-6 bg-white">
        <div className="bg-yellow-50 p-6 rounded-xl border border-yellow-200 mb-4 max-w-md">
          <p className="text-yellow-700 font-medium text-lg mb-2">Channel Not Found</p>
          <p className="text-yellow-600 font-medium">
            This channel doesn't exist or you don't have access
          </p>
        </div>
        <p className="text-gray-600">Try selecting a different channel</p>
      </div>
    );

  const tabs = [
    { id: "home", label: "Home", icon: Home },
    { id: "chats", label: "Team Chats", icon: MessageSquare },
    { id: "members", label: "Members", icon: Users },
  ];

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="bg-gradient-to-br from-violet-50 via-indigo-50 to-purple-100">
        <div className="flex items-center justify-between p-4">
          {/* Left Section */}
          <div className="flex items-center px-6">
            <div className="bg-gradient-to-br from-purple-100 to-indigo-100 p-2.5 rounded-lg mr-3">
              <Hash size={20} className="text-purple-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{channel.name}</h1>
              {channel.description && (
                <p className="text-gray-600 text-xs mt-0.5">{channel.description}</p>
              )}
            </div>
          </div>

          {/* Right Section - 3 Dots */}
          <div className="pr-6 cursor-pointer">
            <button className="p-2 rounded-full hover:bg-indigo-100 transition-colors cursor-pointer">
              <MoreVertical size={20} className="text-gray-700" />
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex items-center w-full border-0">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex flex-1 items-center justify-center gap-2 py-3 font-semibold text-lg transition-all duration-200 rounded-t-lg cursor-pointer ${
                  activeTab === tab.id
                    ? "text-purple-600 bg-slate-50"
                    : "text-purple-400 hover:text-purple-600 hover:bg-slate-200"
                }`}
              >
                <Icon size={18} />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-hidden">
        {/* HOME TAB */}
        {activeTab === "home" && (
          <div className="h-full overflow-y-auto p-6">
            <div className="max-w-4xl mx-auto space-y-6 bg-slate-50">
              <div className="bg-gradient-to-br from-purple-50 to-indigo-50 border border-purple-200 rounded-xl p-8 text-center">
                <div className="bg-white w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 border-2 border-purple-300 shadow-sm">
                  <Hash size={32} className="text-purple-600" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  #{channel.name}
                </h2>
                <p className="text-gray-700">Welcome to the channel!</p>
                {channel.description && (
                  <p className="text-gray-600 text-sm mt-2">{channel.description}</p>
                )}
              </div>

              <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Channel Information</h3>
                <div className="space-y-3">
                  <div className="flex items-start">
                    <span className="text-gray-600 font-medium w-32">Channel Name:</span>
                    <span className="text-gray-900">#{channel.name}</span>
                  </div>
                  {channel.description && (
                    <div className="flex items-start">
                      <span className="text-gray-600 font-medium w-32">Description:</span>
                      <span className="text-gray-900">{channel.description}</span>
                    </div>
                  )}
                  <div className="flex items-start">
                    <span className="text-gray-600 font-medium w-32">Members:</span>
                    <span className="text-gray-900">{members.length} members</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* CHATS TAB */}
        {activeTab === "chats" && (
          <div className="h-full flex flex-col">
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50">
              <div className="bg-gradient-to-br from-purple-50 to-indigo-50 border border-purple-200 rounded-xl p-6 text-center">
                <div className="bg-white w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 border-2 border-purple-300">
                  <Hash size={32} className="text-purple-600" />
                </div>
                <h2 className="text-xl font-bold text-gray-900 mb-2">
                  Welcome to #{channel.name}
                </h2>
                <p className="text-gray-700">
                  This is the beginning of the{" "}
                  <span className="text-purple-600 font-medium">#{channel.name}</span> channel.
                </p>
              </div>

              {messages.map((message, index) => {
                const showAvatar =
                  index === 0 || messages[index - 1].userId !== message.userId;
                const isOwnMessage = message.userId === user.user_id;

                return (
                  <div
                    key={message.id}
                    className={`flex gap-3 group ${showAvatar ? "mt-4" : "mt-1"}`}
                  >
                    {showAvatar ? (
                      message.userPhoto ? (
                        <img
                          src={message.userPhoto}
                          alt={message.userName}
                          className="w-10 h-10 rounded-full object-cover border-2 border-gray-200"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-600 to-indigo-600 flex items-center justify-center text-white font-bold text-sm border-2 border-gray-200">
                          {message.userName?.charAt(0) || "U"}
                        </div>
                      )
                    ) : (
                      <div className="w-10"></div>
                    )}

                    <div className="flex-1 min-w-0">
                      {showAvatar && (
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-semibold text-gray-900 text-sm">
                            {message.userName}
                          </span>
                          <span className="text-xs text-gray-500">
                            {formatTime(message.timestamp)}
                          </span>
                        </div>
                      )}

                      <div className="flex items-start gap-2">
                        <p className="text-gray-800 text-sm leading-relaxed break-words">
                          {message.content}
                        </p>
                        {isOwnMessage && (
                          <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                            <button className="p-1 hover:bg-gray-100 rounded text-gray-500 hover:text-blue-600">
                              <Edit2 size={14} />
                            </button>
                            <button className="p-1 hover:bg-gray-100 rounded text-gray-500 hover:text-red-600">
                              <Trash2 size={14} />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}

              <div ref={messagesEndRef} />
            </div>

            {/* Message Input */}
            <div className="border-t border-gray-200 bg-white p-4">
              <form onSubmit={handleSendMessage} className="relative">
                <div className="bg-gray-50 border border-gray-300 rounded-xl focus-within:border-purple-500 focus-within:ring-2 focus-within:ring-purple-200 transition-all duration-200">
                  <textarea
                    ref={textareaRef}
                    value={newMessage}
                    onChange={handleTextareaChange}
                    onKeyDown={handleKeyDown}
                    placeholder={`Message #${channel.name}`}
                    className="w-full bg-transparent text-gray-900 placeholder-gray-500 px-4 py-3 pr-24 resize-none outline-none text-sm max-h-[150px]"
                    rows="1"
                    disabled={sending}
                  />

                  <div className="flex items-center justify-between px-3 pb-3">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        className="p-2 hover:bg-gray-200 rounded-lg text-gray-600 hover:text-gray-900"
                        title="Add emoji"
                      >
                        <Smile size={18} />
                      </button>
                      <button
                        type="button"
                        className="p-2 hover:bg-gray-200 rounded-lg text-gray-600 hover:text-gray-900"
                        title="Attach file"
                      >
                        <Paperclip size={18} />
                      </button>
                    </div>

                    <button
                      type="submit"
                      disabled={!newMessage.trim() || sending}
                      className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-all ${

                        newMessage.trim() && !sending
                          ? 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white shadow-md'
                          : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      }`}
                    >
                      <Send size={16} />
                      <span>{sending ? 'Sending...' : 'Send'}</span>
                    </button>
                  </div>
                </div>
              </form>
              
              <p className="text-xs text-gray-500 mt-2 text-center">
                Press <kbd className="px-1.5 py-0.5 bg-gray-200 rounded text-xs border border-gray-300">Enter</kbd> to send, <kbd className="px-1.5 py-0.5 bg-gray-200 rounded text-xs border border-gray-300">Shift + Enter</kbd> for new line
              </p>
            </div>
          </div>
        )}

        {activeTab === 'members' && (
          <div className="h-full overflow-y-auto p-6 bg-slate-50">
            <div className="max-w-4xl mx-auto">
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Channel Members</h2>
                <p className="text-gray-600">{members.length} members in this channel</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {members.map((member) => (
                  <div key={member.id} className="bg-white border border-gray-200 rounded-xl p-4 hover:shadow-md transition-shadow duration-200">
                    <div className="flex items-start gap-3">
                      {member.userPhoto ? (
                        <img
                          src={member.userPhoto}
                          alt={member.name}
                          className="w-12 h-12 rounded-full object-cover border-2 border-gray-200"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-600 to-indigo-600 flex items-center justify-center text-white font-bold border-2 border-gray-200">
                          {member.name?.charAt(0) || 'U'}
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-gray-900 truncate">{member.name}</h3>
                        <p className="text-sm text-gray-600 truncate">{member.email}</p>
                        <div className="mt-2 flex items-center gap-2">
                          <div className={`px-2 py-1 ${getRoleStyle(member.role).background} border ${getRoleStyle(member.role).border} rounded flex items-center gap-1`}>
                            {member.isCreator && (
                              <Crown size={12} className={`${getMessagesRoleStyle(member.role).text}`} />
                            )}
                            <span className={`text-xs font-medium ${getMessagesRoleStyle(member.role).text} capitalize`}>
                              {member.role}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {members.length === 0 && (
                <div className="text-center py-12">
                  <Users size={48} className="mx-auto text-gray-400 mb-4" />
                  <p className="text-gray-600">No members found</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChannelPage;
