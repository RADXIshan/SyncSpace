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
import MeetingModal from "./MeetingModal";

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
  const [meetings, setMeetings] = useState([]);
  const [showMeetingModal, setShowMeetingModal] = useState(false);
  const [showEditMeetingModal, setShowEditMeetingModal] = useState(false);
  const [selectedMeeting, setSelectedMeeting] = useState(null);
  const [showDeleteMeetingModal, setShowDeleteMeetingModal] = useState(false);
  const [meetingToDelete, setMeetingToDelete] = useState(null);
  const [meetingDeleteLoading, setMeetingDeleteLoading] = useState(false);
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

  // Fetch meetings for the channel
  const fetchMeetings = useCallback(async () => {
    if (!user?.org_id || !channelId) return;
    try {
      setMeetingsLoading(true);

      const res = await axios.get(
        `${import.meta.env.VITE_BASE_URL}/api/meetings?org_id=${
          user.org_id
        }&channel_id=${channelId}`,
        { withCredentials: true }
      );

      setMeetings(res.data.meetings || []);
    } catch (err) {
      console.error("Error fetching meetings:", err);
      setMeetings([]);
    } finally {
      setMeetingsLoading(false);
    }
  }, [user?.org_id, channelId]);

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

  // Meeting management functions
  const refreshMeetings = useCallback(() => {
    fetchMeetings();
  }, [fetchMeetings]);

  const handleEditMeeting = (meeting) => {
    setSelectedMeeting(meeting);
    setShowEditMeetingModal(true);
  };

  const handleDeleteMeetingClick = (meeting) => {
    setMeetingToDelete(meeting);
    setShowDeleteMeetingModal(true);
  };

  const handleDeleteMeetingConfirm = async () => {
    if (!meetingToDelete) return;

    setMeetingDeleteLoading(true);
    try {
      await axios.delete(
        `${import.meta.env.VITE_BASE_URL}/api/meetings/${
          meetingToDelete.meeting_id
        }`,
        { withCredentials: true }
      );
      toast.success("Meeting deleted successfully");
      refreshMeetings();
      setShowDeleteMeetingModal(false);
      setMeetingToDelete(null);
    } catch (error) {
      console.error("Error deleting meeting:", error);
      const errorMessage =
        error.response?.data?.message || "Failed to delete meeting";
      toast.error(errorMessage);
    } finally {
      setMeetingDeleteLoading(false);
    }
  };

  const handleStartMeeting = (meetingId) => {
    // Navigate to meeting preparation page instead of starting immediately
    navigate(`/meeting-prep/${meetingId}`);
  };

  const handleJoinMeeting = (meetingId) => {
    // Navigate to meeting preparation page for joining
    navigate(`/meeting-prep/${meetingId}`);
  };

  const formatMeetingTime = (startTime) => {
    const date = new Date(startTime);
    const now = new Date();
    const diffTime = date.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Tomorrow";
    if (diffDays === -1) return "Yesterday";
    if (diffDays > 1 && diffDays <= 7) return `In ${diffDays} days`;
    if (diffDays < -1 && diffDays >= -7)
      return `${Math.abs(diffDays)} days ago`;

    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: date.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
    });
  };

  const getMeetingStatus = (startTime, started) => {
    if (started) return "ongoing";

    const now = new Date();
    const meetingTime = new Date(startTime);
    const diffMinutes = (meetingTime.getTime() - now.getTime()) / (1000 * 60);

    if (diffMinutes < -30) return "ended"; // Meeting ended more than 30 minutes ago
    if (diffMinutes < 0) return "ongoing"; // Meeting should be ongoing
    if (diffMinutes < 15) return "starting-soon"; // Meeting starts in less than 15 minutes
    return "upcoming";
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
      <div className="bg-gradient-to-br pt-15 sm:pt-0 from-violet-50 via-indigo-50 to-purple-100">
        <div className="flex items-center justify-between p-2 sm:p-4">
          {/* Left Section */}
          <div className="flex items-center px-2 sm:px-6">
            <div className="bg-gradient-to-br from-purple-100 to-indigo-100 p-1.5 sm:p-2.5 rounded-lg mr-2 sm:mr-3">
              <Hash size={16} className="text-purple-600 sm:w-5 sm:h-5" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900 truncate">
                {channel.name}
              </h1>
              {channel.description && (
                <p className="text-gray-600 text-xs mt-0.5 hidden sm:block">
                  {channel.description}
                </p>
              )}
            </div>
          </div>

          {/* Right Section - 3 Dots */}
          {/* Only show menu button if user has permissions for any menu items */}
          {(userPermissions?.manage_channels ||
            userPermissions?.settings_access) && (
            <div className="pr-2 sm:pr-6 cursor-pointer">
              <button
                onClick={() => setShowChannelMenu(true)}
                className="p-1.5 sm:p-2.5 rounded-full hover:bg-violet-200 transition-colors cursor-pointer"
              >
                <MoreVertical
                  size={18}
                  className="text-gray-700 group-hover:text-violet-700 transition-all duration-300 sm:w-5 sm:h-5"
                />
              </button>
            </div>
          )}
        </div>

        {/* Tabs */}
        <div className="flex pt-3 sm:pt-0 items-center w-full border-0 overflow-x-auto">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex flex-1 items-center justify-center gap-1 sm:gap-2 py-2 sm:py-3 font-semibold text-sm sm:text-lg transition-all duration-200 rounded-t-lg cursor-pointer whitespace-nowrap min-w-0 ${
                  activeTab === tab.id
                    ? "text-purple-600 bg-slate-50"
                    : "text-purple-400 hover:text-purple-600 hover:bg-slate-200"
                }`}
              >
                <Icon size={16} className="sm:w-[18px] sm:h-[18px]" />
                <span className="hidden sm:inline">{tab.label}</span>
                <span className="sm:hidden text-xs">
                  {tab.label.split(" ")[0]}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-hidden">
        {/* HOME TAB */}
        {activeTab === "home" && (
          <div className="h-full overflow-y-auto p-3 sm:p-6 bg-slate-50">
            <div className="max-w-7xl mx-auto">
              {/* Two Column Layout */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-6">
                {/* Left Side - Meetings */}
                <div className="relative bg-gray-900/95 backdrop-blur-xl border border-gray-700/50 rounded-2xl sm:rounded-3xl shadow-2xl overflow-hidden group/meetings flex flex-col transition-all duration-500 hover:scale-[1.02]">
                  {/* Background gradient overlay */}
                  <div className="absolute inset-0 bg-gradient-to-br from-purple-900/20 via-gray-900/50 to-indigo-900/20"></div>

                  <div className="relative z-10 p-4 sm:p-6 lg:p-8 flex flex-col h-full">
                    {/* Header */}
                    <div className="flex items-center justify-between mb-4 sm:mb-6 lg:mb-8">
                      <div className="flex items-center gap-2 sm:gap-3 lg:gap-4 flex-1 min-w-0">
                        <div className="p-2 sm:p-3 lg:p-4 rounded-full bg-purple-500/20 border border-purple-500/30 group-hover/meetings:bg-purple-500/30 transition-all duration-300 flex-shrink-0">
                          <Video
                            size={18}
                            className="text-purple-400 group-hover/meetings:scale-110 transition-all duration-300 sm:w-6 sm:h-6"
                          />
                        </div>
                        <div className="min-w-0 flex-1">
                          <h3 className="text-lg sm:text-xl lg:text-2xl font-bold text-white group-hover/meetings:text-purple-100 transition-colors duration-300 truncate">
                            Meetings
                          </h3>
                          <p className="text-gray-400 text-xs sm:text-sm mt-1 hidden sm:block">
                            Scheduled meetings
                          </p>
                        </div>
                      </div>

                      {/* Action button */}
                      {userPermissions?.meeting_access && (
                        <button
                          onClick={() => setShowMeetingModal(true)}
                          title="Schedule New Meeting"
                          className="p-2 sm:p-3 rounded-full bg-purple-600/20 hover:bg-purple-600/30 border border-purple-500/30 text-purple-400 hover:text-purple-300 transition-all duration-300 transform hover:scale-110 active:scale-95 shadow-lg group/plus cursor-pointer flex-shrink-0"
                        >
                          <Plus
                            size={16}
                            className="group-hover/plus:rotate-90 transition-transform duration-300 sm:w-5 sm:h-5"
                          />
                        </button>
                      )}
                    </div>
                    {/* Content Area */}
                    <div className="flex-1 overflow-hidden">
                      {meetingsLoading ? (
                        <div className="flex flex-col items-center justify-center py-8 sm:py-12 lg:py-16">
                          <div className="relative">
                            <div className="animate-spin rounded-full h-8 w-8 sm:h-12 sm:w-12 border-2 border-purple-500/30"></div>
                            <div className="animate-spin rounded-full h-8 w-8 sm:h-12 sm:w-12 border-t-2 border-purple-500 absolute top-0 left-0"></div>
                          </div>
                          <p className="text-gray-400 mt-4 text-xs sm:text-sm">
                            Loading meetings...
                          </p>
                        </div>
                      ) : meetings.length > 0 ? (
                        <div className="space-y-2 sm:space-y-3 max-h-full overflow-y-auto pr-1 sm:pr-2 scrollbar-thin scrollbar-thumb-purple-500/30 scrollbar-track-transparent">
                          {meetings.map((meeting) => {
                            const status = getMeetingStatus(
                              meeting.start_time,
                              meeting.started
                            );
                            const meetingDate = new Date(meeting.start_time);

                            return (
                              <div
                                key={meeting.meeting_id}
                                className="group/card relative bg-gray-800/50 hover:bg-gray-700/50 border border-gray-600/50 hover:border-purple-500/50 rounded-lg sm:rounded-xl lg:rounded-2xl p-3 sm:p-4 lg:p-6 cursor-pointer transition-all duration-300 transform hover:shadow-lg hover:shadow-purple-500/10"
                              >
                                {/* Hover gradient overlay */}
                                <div className="absolute inset-0 bg-gradient-to-r from-purple-500/5 to-indigo-500/5 rounded-lg sm:rounded-xl lg:rounded-2xl opacity-0 group-hover/card:opacity-100 transition-opacity duration-300"></div>

                                <div className="relative z-10">
                                  <div className="flex items-start w-full justify-between">
                                    <div className="flex-1 min-w-0">
                                      <div className="flex items-center gap-2 mb-1">
                                        <h4 className="font-medium text-sm sm:text-base lg:text-lg text-white group-hover/card:text-purple-100 transition-colors duration-300 truncate">
                                          {meeting.title}
                                        </h4>
                                        <span
                                          className={`px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full text-xs font-medium border flex-shrink-0 ${
                                            status === "upcoming"
                                              ? "bg-purple-500/20 text-purple-300 border-purple-500/30"
                                              : status === "ongoing" ||
                                                status === "starting-soon"
                                              ? "bg-green-500/20 text-green-300 border-green-500/30"
                                              : "bg-gray-500/20 text-gray-300 border-gray-500/30"
                                          }`}
                                        >
                                          {status === "starting-soon"
                                            ? "Starting Soon"
                                            : status}
                                        </span>
                                      </div>
                                      {meeting.description && (
                                        <p className="text-xs sm:text-sm lg:text-base text-gray-300 group-hover/card:text-gray-200 mt-1 line-clamp-2 sm:line-clamp-3 transition-colors duration-300">
                                          {meeting.description}
                                        </p>
                                      )}
                                      <div className="flex flex-wrap items-center gap-1 sm:gap-2 mt-2">
                                        <span className="text-xs text-gray-400 group-hover/card:text-gray-300 transition-colors duration-300">
                                          {formatMeetingTime(
                                            meeting.start_time
                                          )}
                                        </span>
                                        <span className="text-xs text-gray-400 group-hover/card:text-gray-300 transition-colors duration-300">
                                          {meetingDate.toLocaleTimeString(
                                            "en-US",
                                            {
                                              hour: "2-digit",
                                              minute: "2-digit",
                                            }
                                          )}
                                        </span>
                                        {meeting.created_by_name && (
                                          <span className="text-xs text-gray-400 group-hover/card:text-gray-300 transition-colors duration-300">
                                            by {meeting.created_by_name}
                                          </span>
                                        )}
                                      </div>

                                      {/* Action buttons for joining/starting */}
                                      {(status === "ongoing" ||
                                        status === "starting-soon" ||
                                        (status === "upcoming" &&
                                          !meeting.started &&
                                          userPermissions?.meeting_access)) && (
                                        <div className="flex items-center gap-2 mt-3">
                                          {(status === "ongoing" ||
                                            status === "starting-soon") && (
                                            <button
                                              onClick={() =>
                                                handleJoinMeeting(
                                                  meeting.meeting_id
                                                )
                                              }
                                              className="px-3 py-1.5 bg-green-600/80 hover:bg-green-600 text-white text-xs rounded-lg transition-all flex items-center gap-1 border border-green-500/30 cursor-pointer"
                                            >
                                              <Video size={12} />
                                              Join Meeting
                                            </button>
                                          )}
                                          {status === "upcoming" &&
                                            !meeting.started &&
                                            userPermissions?.meeting_access && (
                                              <button
                                                onClick={() =>
                                                  handleStartMeeting(
                                                    meeting.meeting_id
                                                  )
                                                }
                                                className="px-3 py-1.5 bg-purple-600/80 hover:bg-purple-600 text-white text-xs rounded-lg transition-all flex items-center gap-1 border border-purple-500/30 cursor-pointer"
                                              >
                                                <Video size={12} />
                                                Start Meeting
                                              </button>
                                            )}
                                        </div>
                                      )}
                                    </div>
                                    {userPermissions?.meeting_access && (
                                      <div className="absolute right-0 top-0 flex items-center gap-1 ml-2 flex-shrink-0">
                                        <button
                                          onClick={(e) => {
                                            e.preventDefault();
                                            e.stopPropagation();
                                            handleEditMeeting(meeting);
                                          }}
                                          className="p-2 hover:bg-blue-500/20 rounded-md text-gray-400 hover:text-blue-300 transition-colors duration-300 cursor-pointer group"
                                          title="Edit meeting"
                                        >
                                          <Edit2
                                            size={12}
                                            className="sm:w-[14px] sm:h-[14px] group-hover:translate-x-0.5 group-hover:-translate-y-0.5 duration-300"
                                          />
                                        </button>
                                        <button
                                          onClick={(e) => {
                                            e.preventDefault();
                                            e.stopPropagation();
                                            handleDeleteMeetingClick(meeting);
                                          }}
                                          className="p-2 hover:bg-red-500/20 rounded-md text-gray-400 hover:text-red-300 transition-colors duration-300 cursor-pointer group"
                                          title="Delete meeting"
                                        >
                                          <Trash2
                                            size={12}
                                            className="sm:w-[14px] sm:h-[14px] group-hover:scale-120 duration-300 group-hover:rotate-10"
                                          />
                                        </button>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="flex flex-col items-center justify-center py-8 sm:py-12 lg:py-16 text-center px-4">
                          <div className="relative mb-4 sm:mb-6">
                            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-gradient-to-br from-purple-500/20 to-indigo-500/20 flex items-center justify-center border border-purple-500/30">
                              <Video
                                size={24}
                                className="text-purple-400 opacity-60 sm:w-8 sm:h-8"
                              />
                            </div>
                            <div className="absolute -top-1 -right-1 w-4 h-4 sm:w-6 sm:h-6 rounded-full bg-gradient-to-br from-purple-500/30 to-indigo-500/30 animate-pulse"></div>
                          </div>
                          <h3 className="text-lg sm:text-xl font-semibold text-gray-300 mb-2">
                            No meetings scheduled
                          </h3>
                          {userPermissions?.meeting_access ? (
                            <p className="text-gray-400 text-xs sm:text-sm max-w-xs">
                              Click the + button above to schedule your first
                              meeting
                            </p>
                          ) : (
                            <p className="text-gray-400 text-xs sm:text-sm max-w-xs">
                              Only users with meeting access can schedule
                              meetings
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right Side - Notes/Tasks */}
                <div className="relative bg-gray-900/95 backdrop-blur-xl border border-gray-700/50 rounded-2xl sm:rounded-3xl shadow-2xl overflow-hidden group/notes flex flex-col transition-all duration-500 hover:scale-[1.02]">
                  {/* Background gradient overlay */}
                  <div className="absolute inset-0 bg-gradient-to-br from-purple-900/20 via-gray-900/50 to-indigo-900/20"></div>

                  <div className="relative z-10 p-4 sm:p-6 lg:p-8 flex flex-col h-full">
                    {/* Header */}
                    <div className="flex items-center justify-between mb-4 sm:mb-6 lg:mb-8">
                      <div className="flex items-center gap-2 sm:gap-3 lg:gap-4 flex-1 min-w-0">
                        <div className="p-2 sm:p-3 lg:p-4 rounded-full bg-purple-500/20 border border-purple-500/30 group-hover/notes:bg-purple-500/30 transition-all duration-300 flex-shrink-0">
                          <NotebookPen
                            size={18}
                            className="text-purple-400 group-hover/notes:scale-110 transition-all duration-300 sm:w-6 sm:h-6"
                          />
                        </div>
                        <div className="min-w-0 flex-1">
                          <h3 className="text-lg sm:text-xl lg:text-2xl font-bold text-white group-hover/notes:text-purple-100 transition-colors duration-300 truncate">
                            Notes & Tasks
                          </h3>
                          <p className="text-gray-400 text-xs sm:text-sm mt-1 hidden sm:block">
                            Channel notes and tasks
                          </p>
                        </div>
                      </div>

                      {/* Action button */}
                      {userPermissions?.notes_access && (
                        <button
                          onClick={() => setShowNoteModal(true)}
                          title="Create New Note"
                          className="p-2 sm:p-3 rounded-full bg-purple-600/20 hover:bg-purple-600/30 border border-purple-500/30 text-purple-400 hover:text-purple-300 transition-all duration-300 transform hover:scale-110 active:scale-95 shadow-lg group/plus cursor-pointer flex-shrink-0"
                        >
                          <Plus
                            size={16}
                            className="group-hover/plus:rotate-90 transition-transform duration-300 sm:w-5 sm:h-5"
                          />
                        </button>
                      )}
                    </div>
                    {/* Content Area */}
                    <div className="flex-1 overflow-hidden">
                      {notesLoading ? (
                        <div className="flex flex-col items-center justify-center py-8 sm:py-12 lg:py-16">
                          <div className="relative">
                            <div className="animate-spin rounded-full h-8 w-8 sm:h-12 sm:w-12 border-2 border-purple-500/30"></div>
                            <div className="animate-spin rounded-full h-8 w-8 sm:h-12 sm:w-12 border-t-2 border-purple-500 absolute top-0 left-0"></div>
                          </div>
                          <p className="text-gray-400 mt-4 text-xs sm:text-sm">
                            Loading notes...
                          </p>
                        </div>
                      ) : notes.length > 0 ? (
                        <div className="space-y-2 sm:space-y-3 max-h-full overflow-y-auto pr-1 sm:pr-2 scrollbar-thin scrollbar-thumb-purple-500/30 pb-2 scrollbar-track-transparent">
                          {notes.map((note) => (
                            <div
                              key={note.note_id}
                              className={`group/card relative border rounded-lg sm:rounded-xl lg:rounded-2xl p-3 sm:p-4 lg:p-5 cursor-pointer transition-all duration-300 transform hover:shadow-md ${
                                note.pinned
                                  ? `border-purple-500 bg-purple-900/10 hover:bg-purple-700/5 hover:shadow-purple-600`
                                  : `border-gray-600/50 hover:border-purple-500/50 bg-gray-800/50 hover:bg-gray-700/50`
                              }`}
                            >
                              {/* Hover gradient overlay */}
                              <div className="absolute inset-0 bg-gradient-to-r from-purple-500/5 to-indigo-500/5 rounded-lg sm:rounded-xl lg:rounded-2xl opacity-0 group-hover/card:opacity-100 transition-opacity duration-300"></div>

                              <div className="relative z-10">
                                <div className="flex items-start w-full justify-between">
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1">
                                      <h4 className="font-medium text-sm sm:text-base lg:text-lg text-white group-hover/card:text-purple-100 transition-colors duration-300 truncate">
                                        {note.title}
                                      </h4>
                                      {note.pinned && (
                                        <span className="px-1.5 sm:px-2 py-0.5 sm:py-1 bg-purple-500/20 border border-purple-500/30 text-purple-300 text-xs font-medium rounded-full flex-shrink-0">
                                          Pinned
                                        </span>
                                      )}
                                    </div>
                                    <p className="text-xs sm:text-sm lg:text-base text-gray-300 group-hover/card:text-gray-200 mt-1 line-clamp-2 sm:line-clamp-3 transition-colors duration-300">
                                      {note.body}
                                    </p>
                                    <div className="flex flex-wrap items-center gap-1 sm:gap-2 mt-2">
                                      <span className="text-xs text-gray-400 group-hover/card:text-gray-300 transition-colors duration-300">
                                        {new Date(
                                          note.created_at
                                        ).toLocaleDateString()}
                                      </span>
                                      {note.created_by_name && (
                                        <span className="text-xs text-gray-400 group-hover/card:text-gray-300 transition-colors duration-300">
                                          by {note.created_by_name}
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                  {userPermissions?.notes_access && (
                                    <div className="absolute right-0 top-0 flex items-center gap-1 ml-2 flex-shrink-0">
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
                                        className={`p-2 hover:bg-purple-500/20 rounded-md transition-colors duration-300 cursor-pointer group ${
                                          note.pinned
                                            ? "text-purple-300"
                                            : "text-gray-400 hover:text-purple-300"
                                        }`}
                                        title={note.pinned ? "Unpin" : "Pin"}
                                      >
                                        <Pin
                                          size={12}
                                          className="sm:w-[14px] sm:h-[14px] duration-300 group-hover:rotate-45"
                                        />
                                      </button>
                                      <button
                                        type="button"
                                        onClick={(e) => {
                                          e.preventDefault();
                                          e.stopPropagation();
                                          handleEditNote(note);
                                        }}
                                        className="p-2 hover:bg-blue-500/20 rounded-md text-gray-400 hover:text-blue-300 transition-colors duration-300 cursor-pointer group"
                                        title="Edit note"
                                      >
                                        <Edit2
                                          size={12}
                                          className="sm:w-[14px] sm:h-[14px] group-hover:translate-x-0.5 group-hover:-translate-y-0.5 duration-300"
                                        />
                                      </button>
                                      <button
                                        onClick={() =>
                                          handleDeleteNoteClick(note)
                                        }
                                        className="p-2 hover:bg-red-500/20 rounded-md text-gray-400 hover:text-red-300 transition-colors duration-300 cursor-pointer group"
                                      >
                                        <Trash2
                                          size={12}
                                          className="sm:w-[14px] sm:h-[14px] group-hover:scale-120 duration-300 group-hover:rotate-10"
                                        />
                                      </button>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="flex flex-col items-center justify-center py-8 sm:py-12 lg:py-16 text-center px-4">
                          <div className="relative mb-4 sm:mb-6">
                            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-gradient-to-br from-purple-500/20 to-indigo-500/20 flex items-center justify-center border border-purple-500/30">
                              <NotebookPen
                                size={24}
                                className="text-purple-400 opacity-60 sm:w-8 sm:h-8"
                              />
                            </div>
                            <div className="absolute -top-1 -right-1 w-4 h-4 sm:w-6 sm:h-6 rounded-full bg-gradient-to-br from-purple-500/30 to-indigo-500/30 animate-pulse"></div>
                          </div>
                          <h3 className="text-lg sm:text-xl font-semibold text-gray-300 mb-2">
                            No notes or tasks yet
                          </h3>
                          {userPermissions?.notes_access ? (
                            <p className="text-gray-400 text-xs sm:text-sm max-w-xs">
                              Click the + button above to add your first note
                            </p>
                          ) : (
                            <p className="text-gray-400 text-xs sm:text-sm max-w-xs">
                              Only users with notes access can create notes
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* CHATS TAB */}
        {activeTab === "chats" && (
          <div className="h-full flex flex-col">
            <div className="flex-1 overflow-y-auto p-2 sm:p-4 space-y-3 sm:space-y-4 bg-slate-50">
              <div className="bg-gradient-to-br from-purple-50 to-indigo-50 border border-purple-200 rounded-xl p-4 sm:p-6 text-center">
                <div className="bg-white w-12 h-12 sm:w-16 sm:h-16 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4 border-2 border-purple-300">
                  <Hash size={24} className="text-purple-600 sm:w-8 sm:h-8" />
                </div>
                <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-2">
                  Welcome to #{channel.name}
                </h2>
                <p className="text-sm sm:text-base text-gray-700">
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
                    className={`flex gap-2 sm:gap-3 group ${
                      showAvatar ? "mt-3 sm:mt-4" : "mt-1"
                    }`}
                  >
                    {showAvatar ? (
                      message.userPhoto ? (
                        <img
                          src={message.userPhoto}
                          alt={message.userName}
                          className="w-8 h-8 sm:w-10 sm:h-10 rounded-full object-cover border-2 border-gray-200 flex-shrink-0"
                        />
                      ) : (
                        <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-gradient-to-br from-purple-600 to-indigo-600 flex items-center justify-center text-white font-bold text-xs sm:text-sm border-2 border-gray-200 flex-shrink-0">
                          {message.userName?.charAt(0) || "U"}
                        </div>
                      )
                    ) : (
                      <div className="w-8 sm:w-10 flex-shrink-0"></div>
                    )}

                    <div className="flex-1 min-w-0">
                      {showAvatar && (
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-semibold text-gray-900 text-sm truncate">
                            {message.userName}
                          </span>
                          <span className="text-xs text-gray-500 flex-shrink-0">
                            {formatTime(message.timestamp)}
                          </span>
                        </div>
                      )}

                      <div className="flex items-start gap-2">
                        <p className="text-gray-800 text-sm leading-relaxed break-words flex-1">
                          {message.content}
                        </p>
                        {isOwnMessage && (
                          <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-1 flex-shrink-0">
                            <button className="p-1 hover:bg-gray-100 rounded text-gray-500 hover:text-blue-600">
                              <Edit2
                                size={12}
                                className="sm:w-[14px] sm:h-[14px]"
                              />
                            </button>
                            <button className="p-1 hover:bg-gray-100 rounded text-gray-500 hover:text-red-600">
                              <Trash2
                                size={12}
                                className="sm:w-[14px] sm:h-[14px]"
                              />
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
            <div className="border-t border-gray-200 bg-white p-2 sm:p-4">
              <form onSubmit={handleSendMessage} className="relative">
                <div className="bg-gray-50 border border-gray-300 rounded-xl focus-within:border-purple-500 focus-within:ring-2 focus-within:ring-purple-200 transition-all duration-200">
                  <textarea
                    ref={textareaRef}
                    value={newMessage}
                    onChange={handleTextareaChange}
                    onKeyDown={handleKeyDown}
                    placeholder={`Message #${channel.name}`}
                    className="w-full bg-transparent text-gray-900 placeholder-gray-500 px-3 sm:px-4 py-2 sm:py-3 pr-16 sm:pr-24 resize-none outline-none text-sm max-h-[120px] sm:max-h-[150px]"
                    rows="1"
                    disabled={sending}
                  />

                  <div className="flex items-center justify-between px-2 sm:px-3 pb-2 sm:pb-3">
                    <div className="flex items-center gap-1 sm:gap-2">
                      <button
                        type="button"
                        className="p-1.5 sm:p-2 hover:bg-gray-200 rounded-lg text-gray-600 hover:text-gray-900"
                        title="Add emoji"
                      >
                        <Smile size={16} className="sm:w-[18px] sm:h-[18px]" />
                      </button>
                      <button
                        type="button"
                        className="p-1.5 sm:p-2 hover:bg-gray-200 rounded-lg text-gray-600 hover:text-gray-900"
                        title="Attach file"
                      >
                        <Paperclip
                          size={16}
                          className="sm:w-[18px] sm:h-[18px]"
                        />
                      </button>
                    </div>

                    <button
                      type="submit"
                      disabled={!newMessage.trim() || sending}
                      className={`flex items-center gap-1 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg font-medium text-xs sm:text-sm transition-all ${
                        newMessage.trim() && !sending
                          ? "bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white shadow-md"
                          : "bg-gray-300 text-gray-500 cursor-not-allowed"
                      }`}
                    >
                      <Send size={14} className="sm:w-4 sm:h-4" />
                      <span className="hidden sm:inline">
                        {sending ? "Sending..." : "Send"}
                      </span>
                    </button>
                  </div>
                </div>
              </form>

              <p className="text-xs text-gray-500 mt-2 text-center hidden sm:block">
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
          <div className="h-full overflow-y-auto p-3 sm:p-6 bg-slate-50">
            <div className="max-w-4xl mx-auto">
              <div className="mb-4 sm:mb-6">
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">
                  Channel Members
                </h2>
                <p className="text-sm sm:text-base text-gray-600">
                  {members.length} members in this channel
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                {members.map((member) => (
                  <div
                    key={member.id}
                    className="bg-white border border-gray-200 rounded-xl p-3 sm:p-4 hover:shadow-md transition-shadow duration-200"
                  >
                    <div className="flex items-start gap-2 sm:gap-3">
                      {member.userPhoto ? (
                        <img
                          src={member.userPhoto}
                          alt={member.name}
                          className="w-10 h-10 sm:w-12 sm:h-12 rounded-full object-cover border-2 border-gray-200 flex-shrink-0"
                        />
                      ) : (
                        <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-gradient-to-br from-purple-600 to-indigo-600 flex items-center justify-center text-white font-bold text-sm border-2 border-gray-200 flex-shrink-0">
                          {member.name?.charAt(0) || "U"}
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-gray-900 text-sm sm:text-base truncate">
                          {member.name}
                        </h3>
                        <p className="text-xs sm:text-sm text-gray-600 truncate">
                          {member.email}
                        </p>
                        <div className="mt-2 flex items-center gap-2">
                          <div
                            className={`px-1.5 sm:px-2 py-0.5 sm:py-1 ${
                              getRoleStyle(member.role).background
                            } border ${
                              getRoleStyle(member.role).border
                            } rounded flex items-center gap-1`}
                          >
                            {member.isOwner && (
                              <Crown
                                size={10}
                                className={`${
                                  getMessagesRoleStyle(member.role).text
                                } sm:w-3 sm:h-3`}
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
                <div className="text-center py-8 sm:py-12">
                  <Users
                    size={36}
                    className="mx-auto text-gray-400 mb-4 sm:w-12 sm:h-12"
                  />
                  <p className="text-sm sm:text-base text-gray-600">
                    No members found
                  </p>
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
          <div className="absolute top-1 right-2 sm:right-6 w-72 sm:w-80 bg-gray-900/95 backdrop-blur-xl border border-gray-700/50 rounded-2xl sm:rounded-3xl shadow-2xl z-50 animate-fadeIn overflow-hidden max-h-[70vh] transition-all duration-300">
            {/* Background gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-br from-purple-900/20 via-gray-900/50 to-indigo-900/20"></div>

            {/* Header */}
            <div className="relative z-10 flex items-center justify-between px-4 py-4 sm:py-5 border-b border-gray-700/50">
              <div className="flex items-center gap-3">
                <div className="p-2 sm:p-3 rounded-full bg-purple-500/20 border border-purple-500/30 group-hover:bg-purple-500/30 transition-all duration-300">
                  <Hash size={18} className="text-purple-400 sm:w-5 sm:h-5" />
                </div>
                <div>
                  <h3 className="text-lg sm:text-xl font-bold text-white">
                    Channel Settings
                  </h3>
                  <p className="text-gray-400 text-xs sm:text-sm mt-0.5">
                    Manage channel options
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowChannelMenu(false)}
                className="p-2 rounded-full hover:bg-gray-800/80 text-gray-400 hover:text-white transition-all duration-300 transform hover:scale-110 active:scale-95 hover:rotate-90 cursor-pointer"
              >
                <X size={18} className="sm:w-5 sm:h-5" />
              </button>
            </div>

            {/* Menu items */}
            <div className="relative z-10 p-4 sm:p-6 space-y-3">
              {/* Show message if no permissions */}
              {!(
                userPermissions?.manage_channels ||
                userPermissions?.settings_access
              ) && (
                <div className="text-center py-6 sm:py-8">
                  <div className="relative mb-4">
                    <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-gradient-to-br from-gray-500/20 to-gray-600/20 flex items-center justify-center border border-gray-500/30 mx-auto">
                      <Hash
                        size={24}
                        className="text-gray-400 opacity-60 sm:w-8 sm:h-8"
                      />
                    </div>
                    <div className="absolute -top-1 -right-1 w-4 h-4 sm:w-6 sm:h-6 rounded-full bg-gradient-to-br from-gray-500/30 to-gray-600/30 animate-pulse"></div>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-300 mb-2">
                    No actions available
                  </h3>
                  <p className="text-gray-400 text-sm max-w-xs mx-auto">
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
                  className="group/card relative bg-gray-800/50 hover:bg-gray-700/50 border border-gray-600/50 hover:border-purple-500/50 rounded-xl lg:rounded-2xl p-4 sm:p-5 cursor-pointer transition-all duration-300 transform hover:shadow-lg hover:shadow-purple-500/10"
                >
                  {/* Hover gradient overlay */}
                  <div className="absolute inset-0 bg-gradient-to-r from-purple-500/5 to-indigo-500/5 rounded-xl lg:rounded-2xl opacity-0 group-hover/card:opacity-100 transition-opacity duration-300"></div>

                  <div className="relative z-10 flex items-center gap-4">
                    <div className="p-3 rounded-xl bg-purple-500/20 border border-purple-500/30 group-hover/card:bg-purple-500/30 transition-all duration-300 flex-shrink-0">
                      <Edit2
                        size={20}
                        className="text-purple-400 group-hover/card:text-purple-300 transition-all duration-300 group-hover/card:rotate-12"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-white font-semibold group-hover/card:text-purple-100 transition-colors duration-300 text-base sm:text-lg">
                        Edit Channel
                      </h4>
                      <p className="text-gray-400 group-hover/card:text-gray-300 text-sm mt-1 transition-colors duration-300">
                        Modify channel name and description
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Delete Channel - Only show if user has permission */}
              {(userPermissions?.manage_channels ||
                userPermissions?.settings_access) && (
                <div
                  onClick={handleDeleteChannelClick}
                  className="group/card relative bg-gray-800/50 hover:bg-gray-700/50 border border-gray-600/50 hover:border-red-500/50 rounded-xl lg:rounded-2xl p-4 sm:p-5 cursor-pointer transition-all duration-300 transform hover:shadow-lg hover:shadow-red-500/10"
                >
                  {/* Hover gradient overlay */}
                  <div className="absolute inset-0 bg-gradient-to-r from-red-500/5 to-red-600/5 rounded-xl lg:rounded-2xl opacity-0 group-hover/card:opacity-100 transition-opacity duration-300"></div>

                  <div className="relative z-10 flex items-center gap-4">
                    <div className="p-3 rounded-xl bg-red-500/20 border border-red-500/30 group-hover/card:bg-red-500/30 transition-all duration-300 flex-shrink-0">
                      <Trash2
                        size={20}
                        className="text-red-400 group-hover/card:text-red-300 transition-all duration-300 group-hover/card:rotate-12"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-white font-semibold group-hover/card:text-red-100 transition-colors duration-300 text-base sm:text-lg">
                        Delete Channel
                      </h4>
                      <p className="text-gray-400 group-hover/card:text-gray-300 text-sm mt-1 transition-colors duration-300">
                        Permanently remove this channel
                      </p>
                    </div>
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

      {/* Meeting Modals */}
      <MeetingModal
        isOpen={showMeetingModal}
        onClose={() => setShowMeetingModal(false)}
        orgId={user?.org_id}
        channelId={channelId}
        onMeetingChange={refreshMeetings}
        canEdit={userPermissions?.meeting_access}
      />

      <MeetingModal
        isOpen={showEditMeetingModal}
        onClose={() => {
          setShowEditMeetingModal(false);
          setSelectedMeeting(null);
        }}
        orgId={user?.org_id}
        channelId={channelId}
        meeting={selectedMeeting}
        onMeetingChange={refreshMeetings}
        canEdit={userPermissions?.meeting_access}
      />

      {/* Delete Meeting Confirmation Modal */}
      <ConfirmationModal
        isOpen={showDeleteMeetingModal}
        onClose={() => {
          setShowDeleteMeetingModal(false);
          setMeetingToDelete(null);
        }}
        onConfirm={handleDeleteMeetingConfirm}
        title="Delete Meeting"
        message={`Are you sure you want to delete the meeting "${meetingToDelete?.title}"? This action cannot be undone.`}
        confirmText="Delete Meeting"
        cancelText="Cancel"
        type="danger"
        loading={meetingDeleteLoading}
      />
    </div>
  );
};

export default ChannelPage;
