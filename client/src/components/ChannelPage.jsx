import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useNavigate } from "react-router";
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
  Plus,
  Pin,
  X,
  NotebookPen,
  Video,
} from "lucide-react";
import { toast } from "react-hot-toast";
import { getRoleStyle, initializeRoleColors } from "../utils/roleColors";
import NoteInputModal from "./NoteInputModal";
import NoteEditModal from "./NoteEditModal";
import ConfirmationModal from "./ConfirmationModal";
import EditChannel from "./EditChannel";

const ChannelPage = () => {
  const { channelId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [channel, setChannel] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [activeTab, setActiveTab] = useState("home");
  const [members, setMembers] = useState([]);
  const [userPermissions, setUserPermissions] = useState(null);
  const [notes, setNotes] = useState([]);
  const [showNoteModal, setShowNoteModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedNote, setSelectedNote] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [notesLoading, setNotesLoading] = useState(false);
  const [meetingsLoading, setMeetingsLoading] = useState(false);
  const [showChannelMenu, setShowChannelMenu] = useState(false);
  const [showEditChannelModal, setShowEditChannelModal] = useState(false);
  const [showDeleteChannelModal, setShowDeleteChannelModal] = useState(false);
  const [channelDeleteLoading, setChannelDeleteLoading] = useState(false);
  const [meetings, setMeetings] = useState([
    {
      id: 1,
      title: "Weekly Team Sync",
      description: "Weekly synchronization meeting with all team members",
      date: "Dec 15, 2024",
      time: "10:00 AM",
      status: "ongoing",
    },
    {
      id: 2,
      title: "Project Review",
      description: "Review project progress and discuss next steps",
      date: "Dec 16, 2024",
      time: "2:00 PM",
      status: "upcoming",
    },
    {
      id: 3,
      title: "Client Presentation",
      description: "Present project updates to the client",
      date: "Dec 18, 2024",
      time: "11:00 AM",
      status: "upcoming",
    },
  ]); // Mock meetings data
  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);

  // Helper to sort notes (pinned notes first, then by newest)
  const sortNotes = (notesArray) => {
    return [...notesArray].sort((a, b) => {
      if (a.pinned === b.pinned) {
        return new Date(b.created_at) - new Date(a.created_at);
      }
      return a.pinned ? -1 : 1;
    });
  };

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
    const roleNames = [...new Set(messages.map((msg) => msg.role))].filter(
      Boolean
    );
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
          `${import.meta.env.VITE_BASE_URL}/api/orgs/${
            user.org_id
          }/channels/${channelId}`,
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
          if (member.isOwner) return true;
          if (
            !Array.isArray(member.accessible_teams) ||
            member.accessible_teams.length === 0
          )
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

  // Fetch user permissions
  useEffect(() => {
    const fetchPermissions = async () => {
      if (!user?.org_id) return;
      try {
        const res = await axios.get(
          `${import.meta.env.VITE_BASE_URL}/api/orgs/${user.org_id}/role`,
          { withCredentials: true }
        );
        setUserPermissions(res.data.permissions || null);
      } catch (err) {
        console.error("Error fetching permissions", err);
        setUserPermissions(null);
      }
    };

    fetchPermissions();
  }, [user?.org_id]);

  // Fetch notes for the channel
  const fetchNotes = useCallback(async () => {
    if (!user?.org_id || !channelId) return;
    try {
      setNotesLoading(true);
      const res = await axios.get(
        `${import.meta.env.VITE_BASE_URL}/api/notes?org_id=${
          user.org_id
        }&channel_id=${channelId}`,
        { withCredentials: true }
      );
      setNotes(sortNotes(res.data.notes || []));
    } catch (err) {
      console.error("Error fetching notes", err);
      toast.error(err?.response?.data?.message || "Failed to load notes");
      setNotes([]);
    } finally {
      setNotesLoading(false);
    }
  }, [user?.org_id, channelId]);

  const refreshNotes = useCallback(() => {
    fetchNotes();
  }, [fetchNotes]);

  // Simulate meetings loading (since using mock data)
  const fetchMeetings = useCallback(async () => {
    setMeetingsLoading(true);
    // Simulate API call delay
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setMeetingsLoading(false);
  }, []);

  useEffect(() => {
    fetchNotes();
    fetchMeetings();
  }, [fetchNotes, fetchMeetings]);

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

  // Note management functions
  const handleCreateNote = async (noteData) => {
    try {
      await axios.post(
        `${import.meta.env.VITE_BASE_URL}/api/notes`,
        {
          org_id: user.org_id,
          channel_id: channelId,
          ...noteData,
        },
        { withCredentials: true }
      );
      refreshNotes(); // Refresh notes after creation
      toast.success("Note created successfully");
    } catch (err) {
      console.error("Error creating note:", err);
      toast.error(err?.response?.data?.message || "Failed to create note");
      throw err; // Re-throw to handle in modal
    }
  };

  const handleUpdateNote = async (noteId, noteData) => {
    const toastId = toast.loading("Updating note...");

    try {
      await axios.put(
        `${import.meta.env.VITE_BASE_URL}/api/notes/${noteId}`,
        noteData,
        { withCredentials: true }
      );
      refreshNotes(); // Refresh notes after update
      toast.success("Note updated successfully", { id: toastId });
    } catch (err) {
      console.error("Error updating note:", err);
      toast.error(err?.response?.data?.message || "Failed to update note", {
        id: toastId,
      });
      throw err;
    }
  };

  const handleDeleteNote = async (noteId) => {
    try {
      await axios.delete(
        `${import.meta.env.VITE_BASE_URL}/api/notes/${noteId}`,
        { withCredentials: true }
      );
      refreshNotes(); // Refresh notes after deletion
      toast.success("Note deleted successfully");
    } catch (err) {
      console.error("Error deleting note:", err);
      toast.error(err?.response?.data?.message || "Failed to delete note");
    }
  };

  const handleEditNote = (note) => {
    setSelectedNote(note);
    setShowEditModal(true);
  };

  const handleEditSubmit = async (noteData) => {
    try {
      await handleUpdateNote(selectedNote.note_id, noteData);
      setShowEditModal(false);
      setSelectedNote(null);
    } catch (error) {
      // Error is already handled in handleUpdateNote
    }
  };

  const handleDeleteConfirm = async () => {
    if (!selectedNote) return;

    setDeleteLoading(true);
    try {
      await handleDeleteNote(selectedNote.note_id);
      setShowDeleteModal(false);
      setSelectedNote(null);
    } catch (error) {
      // Error is already handled in handleDeleteNote
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleDeleteNoteClick = (note) => {
    setSelectedNote(note);
    setShowDeleteModal(true);
  };

  // Channel management functions
  const handleEditChannelSubmit = async (channelData) => {
    try {
      const response = await axios.put(
        `${import.meta.env.VITE_BASE_URL}/api/orgs/${
          user.org_id
        }/channels/${channelId}`,
        channelData,
        { withCredentials: true }
      );

      // Update the local channel state
      setChannel(response.data.channel);
      toast.success("Channel updated successfully");
      setShowEditChannelModal(false);

      // Trigger sidebar refresh
      window.dispatchEvent(new Event("organizationUpdated"));
    } catch (error) {
      console.error("Error updating channel:", error);
      toast.error(error.response?.data?.message || "Failed to update channel");
    }
  };

  const handleDeleteChannelClick = () => {
    setShowChannelMenu(false);
    setShowDeleteChannelModal(true);
  };

  const handleDeleteChannelConfirm = async () => {
    setChannelDeleteLoading(true);

    try {
      await axios.delete(
        `${import.meta.env.VITE_BASE_URL}/api/orgs/${
          user.org_id
        }/channels/${channelId}`,
        { withCredentials: true }
      );

      toast.success("Channel deleted successfully");

      // Trigger sidebar refresh
      window.dispatchEvent(new Event("organizationUpdated"));

      // Close modal and navigate back to dashboard
      setShowDeleteChannelModal(false);
      navigate("/home/dashboard");
    } catch (error) {
      console.error("Error deleting channel:", error);
      toast.error(error.response?.data?.message || "Failed to delete channel");
    } finally {
      setChannelDeleteLoading(false);
    }
  };

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now - date;

    if (diff < 60000) return "Just now";
    if (diff < 3600000) return `${Math.floor(diff / 60000)} minutes ago`;
    if (date.toDateString() === now.toDateString())
      return date.toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
      });
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
          <p className="text-red-700 font-medium text-lg mb-2">
            Error Loading Channel
          </p>
          <p className="text-red-600 font-medium">{error}</p>
        </div>
        <p className="text-gray-600">Unable to load channel information</p>
      </div>
    );

  if (!channel)
    return (
      <div className="flex flex-col items-center justify-center h-full text-center p-6 bg-white">
        <div className="bg-yellow-50 p-6 rounded-xl border border-yellow-200 mb-4 max-w-md">
          <p className="text-yellow-700 font-medium text-lg mb-2">
            Channel Not Found
          </p>
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
              <h1 className="text-2xl font-bold text-gray-900">
                {channel.name}
              </h1>
              {channel.description && (
                <p className="text-gray-600 text-xs mt-0.5">
                  {channel.description}
                </p>
              )}
            </div>
          </div>

          {/* Right Section - 3 Dots */}
          {/* Only show menu button if user has permissions for any menu items */}
          {(userPermissions?.manage_channels ||
            userPermissions?.settings_access) && (
            <div className="pr-6 cursor-pointer">
              <button
                onClick={() => setShowChannelMenu(true)}
                className="p-2.5 rounded-full hover:bg-violet-200 transition-colors cursor-pointer"
              >
                <MoreVertical
                  size={20}
                  className="text-gray-700 group-hover:text-violet-700 transition-all duration-300"
                />
              </button>
            </div>
          )}
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
          <div className="h-full overflow-y-auto p-6 bg-slate-50">
            <div className="max-w-7xl mx-auto">
              {/* Two Column Layout */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Left Side - Meetings */}
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
                  <div className="px-6 py-5 border-b border-gray-200">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="p-3 rounded-full bg-blue-500/20">
                          <Video size={22} className="text-blue-500" />
                        </div>
                        <h3 className="text-xl font-bold text-gray-900">
                          Meetings
                        </h3>
                      </div>
                      {userPermissions?.meeting_access && (
                        <button className="text-blue-600 hover:text-blue-700 p-1.5 rounded-full hover:bg-blue-50 transition-colors cursor-pointer duration-300 group">
                          <Plus
                            size={20}
                            className="group-hover:scale-120 group-hover:rotate-90 duration-300"
                          />
                        </button>
                      )}
                    </div>
                  </div>
                  <div className="p-6">
                    {meetingsLoading ? (
                      <div className="flex flex-col items-center justify-center py-12 sm:py-16">
                        <div className="relative">
                          <div className="animate-spin rounded-full h-12 w-12 border-2 border-blue-500/30"></div>
                          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-blue-500 absolute top-0 left-0"></div>
                        </div>
                        <p className="text-gray-400 mt-4 text-sm">
                          Loading meetings...
                        </p>
                      </div>
                    ) : meetings.length > 0 ? (
                      <div className="space-y-3">
                        {meetings.map((meeting, index) => (
                          <div
                            key={index}
                            className={`p-4 rounded-lg border shadow-sm transition-all pl-4 group ${
                              userPermissions?.meeting_access
                                ? "hover:shadow-lg hover:-translate-y-1 hover:ring-2 hover:ring-purple-100 cursor-pointer"
                                : ""
                            } ${
                              meeting.status === "upcoming"
                                ? "border-l-4 border-blue-500 bg-gradient-to-r from-white via-white to-blue-50"
                                : meeting.status === "ongoing"
                                ? "border-l-4 border-green-500 bg-gradient-to-r from-white via-white to-green-50"
                                : "border-l-4 border-gray-400 bg-gradient-to-r from-white via-white to-gray-50"
                            }`}
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <h4 className="font-medium text-gray-900">
                                  {meeting.title}
                                </h4>
                                <p className="text-sm text-gray-600 mt-1">
                                  {meeting.description}
                                </p>
                                <div className="flex items-center gap-2 mt-2">
                                  <span className="text-xs text-gray-500">
                                    {meeting.date}
                                  </span>
                                  <span className="text-xs text-gray-500">
                                    {meeting.time}
                                  </span>
                                  <span
                                    className={`px-2 py-1 rounded-full text-xs font-medium ${
                                      meeting.status === "upcoming"
                                        ? "bg-blue-100 text-blue-700"
                                        : meeting.status === "ongoing"
                                        ? "bg-green-100 text-green-700"
                                        : "bg-gray-100 text-gray-700"
                                    }`}
                                  >
                                    {meeting.status}
                                  </span>
                                </div>
                              </div>
                              {userPermissions?.meeting_access && (
                                <div className="flex items-center gap-1 ml-2">
                                  <button className="p-1 hover:bg-gray-100 rounded text-gray-400 hover:text-blue-600">
                                    <Edit2 size={14} />
                                  </button>
                                  <button className="p-1 hover:bg-gray-100 rounded text-gray-400 hover:text-red-600">
                                    <Trash2 size={14} />
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                          <Hash size={24} className="text-gray-400" />
                        </div>
                        <p className="text-gray-500 mb-2">
                          No meetings scheduled
                        </p>
                        {userPermissions?.meeting_access && (
                          <p className="text-sm text-gray-400">
                            Click the + button to schedule a meeting
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Right Side - Notes/Tasks */}
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
                  <div className="px-6 py-5 border-b border-gray-200">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="p-3 rounded-full bg-purple-500/20">
                          <NotebookPen size={22} className="text-purple-500" />
                        </div>
                        <h3 className="text-xl font-bold text-gray-900">
                          Notes & Tasks
                        </h3>
                      </div>
                      {userPermissions?.notes_access && (
                        <button
                          onClick={() => setShowNoteModal(true)}
                          className="text-purple-600 hover:text-purple-700 p-1.5 rounded-full hover:bg-purple-50 transition-colors cursor-pointer duration-300 group"
                        >
                          <Plus
                            size={20}
                            className="group-hover:scale-120 group-hover:rotate-90 duration-300"
                          />
                        </button>
                      )}
                    </div>
                  </div>
                  <div className="p-6">
                    {notesLoading ? (
                      <div className="flex flex-col items-center justify-center py-12 sm:py-16">
                        <div className="relative">
                          <div className="animate-spin rounded-full h-12 w-12 border-2 border-purple-500/30"></div>
                          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-purple-500 absolute top-0 left-0"></div>
                        </div>
                        <p className="text-gray-400 mt-4 text-sm">
                          Loading notes...
                        </p>
                      </div>
                    ) : notes.length > 0 ? (
                      <div className="space-y-3">
                        {notes.map((note) => (
                          <div
                            key={note.note_id}
                            className={`rounded-2xl transition-all flex ${
                              userPermissions?.notes_access
                                ? "hover:shadow-lg hover:-translate-y-1"
                                : ""
                            } ${
                              note.pinned
                                ? "bg-gradient-to-r from-purple-500 via-purple-400 to-purple-100 shadow-purple-300 shadow-md"
                                : "border border-gray-300 bg-gradient-to-r from-white via-white to-gray-50"
                            }`}
                          >
                            <div className="flex items-start w-full justify-between">
                              <div className="flex-1 p-4">
                                <div className="flex items-center gap-2 mb-1">
                                  <h4
                                    className={`font-medium ${
                                      note.pinned
                                        ? `text-white `
                                        : `text-gray-900`
                                    }`}
                                  >
                                    {note.title}
                                  </h4>
                                  {note.pinned && (
                                    <span className="px-2 py-1 bg-white/40 border border-purple-700 text-purple-700 text-xs font-medium rounded-full">
                                      Pinned
                                    </span>
                                  )}
                                </div>
                                <p
                                  className={`text-sm mt-1 line-clamp-3 ${
                                    note.pinned
                                      ? `text-slate-200`
                                      : `text-gray-600`
                                  }`}
                                >
                                  {note.body}
                                </p>
                                <div className="flex items-center gap-2 mt-2">
                                  <span
                                    className={`text-xs ${
                                      note.pinned
                                        ? `text-slate-300`
                                        : `text-gray-500`
                                    }`}
                                  >
                                    {new Date(
                                      note.created_at
                                    ).toLocaleDateString()}
                                  </span>
                                  {note.created_by_name && (
                                    <span
                                      className={`text-xs ${
                                        note.pinned
                                          ? `text-slate-300`
                                          : `text-gray-500`
                                      }`}
                                    >
                                      by {note.created_by_name}
                                    </span>
                                  )}
                                </div>
                              </div>
                              {userPermissions?.notes_access && (
                                <div className="flex items-center rounded-r-2xl overflow-hidden flex-col h-full">
                                  <button
                                    onClick={(e) => {
                                      e.preventDefault();
                                      e.stopPropagation();
                                      handleUpdateNote(note.note_id, {
                                        title: note.title,
                                        body: note.body,
                                        pinned: !note.pinned,
                                      });
                                    }}
                                    className={`pl-2 pb-2 pt-3 pr-3 flex-1 duration-300 cursor-pointer group hover:text-white hover:bg-purple-600 ${
                                      note.pinned
                                        ? "text-purple-500"
                                        : "text-gray-400"
                                    }`}
                                    title={note.pinned ? "Unpin" : "Pin"}
                                  >
                                    <Pin
                                      size={14}
                                      className="group-hover:scale-120 duration-300"
                                    />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.preventDefault();
                                      e.stopPropagation();
                                      handleEditNote(note);
                                    }}
                                    className="pt-2 pl-2 pb-2 pr-3 flex-1 hover:bg-blue-500 group text-gray-400 hover:text-white cursor-pointer duration-300"
                                    title="Edit note"
                                  >
                                    <Edit2
                                      size={14}
                                      className="group-hover:scale-120 duration-300"
                                    />
                                  </button>
                                  <button
                                    onClick={() => handleDeleteNoteClick(note)}
                                    className="pt-2 pl-2 pr-3 pb-3 flex-1 hover:bg-red-500 rounded-br-2xl text-gray-400 hover:text-white cursor-pointer duration-300 group"
                                  >
                                    <Trash2
                                      size={14}
                                      className="group-hover:scale-120 duration-300"
                                    />
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                          <Hash size={24} className="text-gray-400" />
                        </div>
                        <p className="text-gray-500 mb-2">
                          No notes or tasks yet
                        </p>
                        {userPermissions?.notes_access && (
                          <p className="text-sm text-gray-400">
                            Click the + button to add your first note
                          </p>
                        )}
                      </div>
                    )}
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
                  <span className="text-purple-600 font-medium">
                    #{channel.name}
                  </span>{" "}
                  channel.
                </p>
              </div>

              {messages.map((message, index) => {
                const showAvatar =
                  index === 0 || messages[index - 1].userId !== message.userId;
                const isOwnMessage = message.userId === user.user_id;

                return (
                  <div
                    key={message.id}
                    className={`flex gap-3 group ${
                      showAvatar ? "mt-4" : "mt-1"
                    }`}
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
                          ? "bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white shadow-md"
                          : "bg-gray-300 text-gray-500 cursor-not-allowed"
                      }`}
                    >
                      <Send size={16} />
                      <span>{sending ? "Sending..." : "Send"}</span>
                    </button>
                  </div>
                </div>
              </form>

              <p className="text-xs text-gray-500 mt-2 text-center">
                Press{" "}
                <kbd className="px-1.5 py-0.5 bg-gray-200 rounded text-xs border border-gray-300">
                  Enter
                </kbd>{" "}
                to send,{" "}
                <kbd className="px-1.5 py-0.5 bg-gray-200 rounded text-xs border border-gray-300">
                  Shift + Enter
                </kbd>{" "}
                for new line
              </p>
            </div>
          </div>
        )}

        {activeTab === "members" && (
          <div className="h-full overflow-y-auto p-6 bg-slate-50">
            <div className="max-w-4xl mx-auto">
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  Channel Members
                </h2>
                <p className="text-gray-600">
                  {members.length} members in this channel
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {members.map((member) => (
                  <div
                    key={member.id}
                    className="bg-white border border-gray-200 rounded-xl p-4 hover:shadow-md transition-shadow duration-200"
                  >
                    <div className="flex items-start gap-3">
                      {member.userPhoto ? (
                        <img
                          src={member.userPhoto}
                          alt={member.name}
                          className="w-12 h-12 rounded-full object-cover border-2 border-gray-200"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-600 to-indigo-600 flex items-center justify-center text-white font-bold border-2 border-gray-200">
                          {member.name?.charAt(0) || "U"}
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-gray-900 truncate">
                          {member.name}
                        </h3>
                        <p className="text-sm text-gray-600 truncate">
                          {member.email}
                        </p>
                        <div className="mt-2 flex items-center gap-2">
                          <div
                            className={`px-2 py-1 ${
                              getRoleStyle(member.role).background
                            } border ${
                              getRoleStyle(member.role).border
                            } rounded flex items-center gap-1`}
                          >
                            {member.isOwner && (
                              <Crown
                                size={12}
                                className={`${
                                  getMessagesRoleStyle(member.role).text
                                }`}
                              />
                            )}
                            <span
                              className={`text-xs font-medium ${
                                getMessagesRoleStyle(member.role).text
                              } capitalize`}
                            >
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

      {showChannelMenu && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setShowChannelMenu(false)}
          />

          {/* Menu */}
          <div className="absolute top-1 right-6 w-72 bg-gradient-to-b from-slate-900/95 via-slate-800/95 to-slate-900/95 backdrop-blur-xl border border-white/20 rounded-2xl shadow-2xl z-50 animate-fadeIn overflow-hidden h-[calc(50vh-110px)]">
            {/* Header */}
            <div className="flex items-center justify-between px-2 py-4 border-b border-white/10">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-full bg-violet-500/20">
                  <Hash size={18} className="text-violet-400" />
                </div>
                <h3 className="text-lg font-semibold text-white">
                  Channel Settings
                </h3>
              </div>
              <button
                onClick={() => setShowChannelMenu(false)}
                className="absolute top-4 right-3 p-2 rounded-full hover:bg-white/20 text-white transition-all duration-300 transform hover:scale-110 active:scale-95 hover:rotate-90 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Menu items */}
            <div className="p-4 space-y-2">
              {/* Show message if no permissions */}
              {!(
                userPermissions?.manage_channels ||
                userPermissions?.settings_access
              ) && (
                <div className="text-center py-6">
                  <div className="p-3 rounded-full bg-gray-500/20 w-fit mx-auto mb-3">
                    <Hash size={24} className="text-gray-400" />
                  </div>
                  <p className="text-gray-300 text-sm font-medium">
                    No actions available
                  </p>
                  <p className="text-gray-400 text-xs mt-1">
                    You don't have permission to manage this channel
                  </p>
                </div>
              )}

              {/* Edit Channel - Only show if user has permission */}
              {(userPermissions?.manage_channels ||
                userPermissions?.settings_access) && (
                <div
                  onClick={() => {
                    setShowEditChannelModal(true);
                    setShowChannelMenu(false);
                  }}
                  className="flex items-center gap-4 p-4 rounded-xl border border-white/10 bg-white/5 hover:bg-violet-500/10 hover:border-violet-500/30 transition-all duration-300 cursor-pointer group transform hover:scale-[1.02] hover:shadow-lg hover:shadow-violet-500/10"
                >
                  <div className="p-2 rounded-lg bg-violet-500/20 group-hover:bg-violet-500/30 transition-all duration-300">
                    <Edit2
                      size={18}
                      className="text-violet-400 group-hover:text-violet-300 transition-all duration-300 group-hover:rotate-12"
                    />
                  </div>
                  <div className="flex-1">
                    <span className="text-white font-medium group-hover:text-violet-200 transition-colors duration-300">
                      Edit Channel
                    </span>
                    <p className="text-gray-400 text-xs mt-0.5 group-hover:text-violet-300/70">
                      Modify channel name and description
                    </p>
                  </div>
                </div>
              )}

              {/* Delete Channel - Only show if user has permission */}
              {(userPermissions?.manage_channels ||
                userPermissions?.settings_access) && (
                <div
                  onClick={handleDeleteChannelClick}
                  className="flex items-center gap-4 p-4 rounded-xl border border-white/10 bg-white/5 hover:bg-red-500/10 hover:border-red-500/30 transition-all duration-300 cursor-pointer group transform hover:scale-[1.02] hover:shadow-lg hover:shadow-red-500/10"
                >
                  <div className="p-2 rounded-lg bg-red-500/20 group-hover:bg-red-500/30 transition-all duration-300">
                    <Trash2
                      size={18}
                      className="text-red-400 group-hover:text-red-300 transition-all duration-300 group-hover:rotate-12"
                    />
                  </div>
                  <div className="flex-1">
                    <span className="text-white font-medium group-hover:text-red-200 transition-colors duration-300">
                      Delete Channel
                    </span>
                    <p className="text-gray-400 text-xs mt-0.5 group-hover:text-red-300/70">
                      Permanently remove this channel
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {showEditChannelModal && (
        <EditChannel
          isOpen={showEditChannelModal}
          onClose={() => setShowEditChannelModal(false)}
          onSubmit={handleEditChannelSubmit}
          channel={channel}
        />
      )}

      {/* Note Modals */}
      <NoteInputModal
        isOpen={showNoteModal}
        onClose={() => setShowNoteModal(false)}
        onSubmit={handleCreateNote}
      />

      <NoteEditModal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setSelectedNote(null);
        }}
        onSubmit={handleEditSubmit}
        note={selectedNote}
      />

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setSelectedNote(null);
        }}
        onConfirm={handleDeleteConfirm}
        title="Delete Note"
        message="Are you sure you want to delete this note? This action cannot be undone."
        confirmText="Delete Note"
        cancelText="Cancel"
        type="danger"
        loading={deleteLoading}
      />

      {/* Delete Channel Confirmation Modal */}
      <ConfirmationModal
        isOpen={showDeleteChannelModal}
        onClose={() => setShowDeleteChannelModal(false)}
        onConfirm={handleDeleteChannelConfirm}
        title="Delete Channel"
        message={`Are you sure you want to delete the channel "${channel?.name}"? This will permanently remove all notes, messages, and content in this channel. This action cannot be undone.`}
        confirmText="Delete Channel"
        cancelText="Cancel"
        type="danger"
        loading={channelDeleteLoading}
      />
    </div>
  );
};

export default ChannelPage;
