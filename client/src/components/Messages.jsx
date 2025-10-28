import { useState, useEffect, useRef, useCallback } from "react";
import { useAuth } from "../context/AuthContext";
import { useSocket } from "../context/SocketContext";
import { useUnread } from "../context/UnreadContext";
import { useSearchParams } from "react-router";
import axios from "axios";
import {
  Search,
  MessageCircle,
  CheckCheck,
  Send,
  Smile,
  Paperclip,
  Reply,
  Edit2,
  Trash2,
  Download,
  File,
  X,
  Heart,
  ThumbsUp,
  ArrowLeft,
  Plus,
  PanelLeftClose,
  PanelLeftOpen,
} from "lucide-react";
import { toast } from "react-hot-toast";
import EmojiPicker from "./EmojiPicker";
import MessageReactions from "./MessageReactions";
import TypingIndicator from "./TypingIndicator";
import FileUpload from "./FileUpload";

const Messages = () => {
  const { user } = useAuth();
  const { socket, isConnected } = useSocket();
  const { markDirectMessagesAsRead } = useUnread();
  const [searchParams, setSearchParams] = useSearchParams();

  // State for conversations list
  const [conversations, setConversations] = useState([]);
  const [filteredConversations, setFilteredConversations] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);

  // State for selected conversation
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [messagesLoading, setMessagesLoading] = useState(false);

  // State for message input
  const [newMessage, setNewMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [replyingTo, setReplyingTo] = useState(null);
  const [editingMessage, setEditingMessage] = useState(null);
  const [typingUsers, setTypingUsers] = useState([]);
  const [showFileUpload, setShowFileUpload] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  // State for new conversation
  const [showNewConversation, setShowNewConversation] = useState(false);
  const [organizationMembers, setOrganizationMembers] = useState([]);
  const [memberSearchQuery, setMemberSearchQuery] = useState("");

  // State for sidebar visibility
  const [sidebarVisible, setSidebarVisible] = useState(true);
  const [isMobile, setIsMobile] = useState(false);

  // Refs
  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const fileInputRef = useRef(null);
  const emojiPickerRef = useRef(null);

  // Scroll to bottom
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  // Fetch conversations
  const fetchConversations = useCallback(
    async (silent = false) => {
      if (!user?.user_id) return;

      try {
        if (!silent) setLoading(true);
        const response = await axios.get(
          `${import.meta.env.VITE_BASE_URL}/api/direct-messages/conversations`,
          { withCredentials: true }
        );
        setConversations(response.data.conversations || []);
      } catch (error) {
        console.error("Error fetching conversations:", error);
        if (!silent) toast.error("Failed to load conversations");
      } finally {
        if (!silent) setLoading(false);
      }
    },
    [user?.user_id]
  );

  // Fetch messages for selected conversation
  const fetchMessages = useCallback(
    async (otherUserId) => {
      if (!user?.user_id || !otherUserId) return;

      try {
        setMessagesLoading(true);
        const response = await axios.get(
          `${
            import.meta.env.VITE_BASE_URL
          }/api/direct-messages/conversations/${otherUserId}`,
          { withCredentials: true }
        );
        setMessages(response.data.messages || []);

        // Mark messages as read using the unread context
        markDirectMessagesAsRead(otherUserId);

        // Scroll to bottom after messages load
        setTimeout(scrollToBottom, 100);
      } catch (error) {
        console.error("Error fetching messages:", error);
        toast.error("Failed to load messages");
      } finally {
        setMessagesLoading(false);
      }
    },
    [user?.user_id, markDirectMessagesAsRead, scrollToBottom]
  );

  // Fetch organization members for new conversations
  const fetchOrganizationMembers = useCallback(async () => {
    if (!user?.user_id) return;

    try {
      const response = await axios.get(
        `${
          import.meta.env.VITE_BASE_URL
        }/api/direct-messages/organization/members`,
        { withCredentials: true }
      );
      setOrganizationMembers(response.data.members || []);
    } catch (error) {
      console.error("Error fetching organization members:", error);
      toast.error("Failed to load organization members");
    }
  }, [user?.user_id]);

  // Socket event handlers
  useEffect(() => {
    if (!socket || !isConnected || !user?.user_id) {
      return;
    }

    // Listen for new direct messages
    const handleNewDirectMessage = (message) => {
      // Determine if this message is for the current conversation
      const isCurrentConversation =
        selectedConversation &&
        (message.sender_id === selectedConversation.other_user_id ||
          message.receiver_id === selectedConversation.other_user_id);

      // Update messages if this conversation is currently selected
      if (isCurrentConversation) {
        // Only add if not already in messages (avoid duplicates)
        setMessages((prev) => {
          const exists = prev.some(
            (msg) => msg.message_id === message.message_id
          );
          if (exists) {
            return prev;
          }

          const newMessages = [...prev, { ...message, isNew: true }];
          // Scroll to bottom after state update
          setTimeout(scrollToBottom, 50);
          return newMessages;
        });

        // Remove the isNew flag after animation
        setTimeout(() => {
          setMessages((prev) =>
            prev.map((msg) =>
              msg.message_id === message.message_id
                ? { ...msg, isNew: false }
                : msg
            )
          );
        }, 1000);
      }

      // Update conversations list locally
      setConversations((prev) => {
        const updated = [...prev];

        // Determine which user this conversation is with
        const otherUserId =
          message.sender_id === user.user_id
            ? message.receiver_id
            : message.sender_id;

        const convIndex = updated.findIndex(
          (conv) => conv.other_user_id === otherUserId
        );

        const messageContent =
          message.content ||
          (message.file_name ? `📎 ${message.file_name}` : "File");

        if (convIndex >= 0) {
          // Update existing conversation
          const existingConv = updated[convIndex];
          updated[convIndex] = {
            ...existingConv,
            last_message_content: messageContent,
            last_message_time: message.created_at,
            unread_count:
              message.receiver_id === user.user_id && !isCurrentConversation
                ? existingConv.unread_count + 1
                : existingConv.unread_count,
          };
          // Move to top
          const conversation = updated.splice(convIndex, 1)[0];
          updated.unshift(conversation);
        } else if (message.sender_id !== user.user_id) {
          // Add new conversation if message is from someone else
          const newConversation = {
            other_user_id: message.sender_id,
            other_user_name: message.sender_name,
            other_user_photo: message.sender_photo,
            other_user_email: "", // We don't have this from the message
            last_message_content: messageContent,
            last_message_time: message.created_at,
            unread_count: isCurrentConversation ? 0 : 1,
          };
          updated.unshift(newConversation);
        }

        return updated;
      });
    };

    // Listen for message updates
    const handleDirectMessageUpdate = (updatedMessage) => {
      setMessages((prev) =>
        prev.map((msg) =>
          msg.message_id === updatedMessage.message_id ? updatedMessage : msg
        )
      );
    };

    // Listen for message deletions
    const handleDirectMessageDelete = (messageId) => {
      setMessages((prev) =>
        prev.map((msg) =>
          msg.message_id === messageId
            ? {
                ...msg,
                isDeleted: true,
                originalContent: msg.originalContent || msg.content,
                content: "This message was deleted",
              }
            : msg
        )
      );
    };

    // Listen for typing indicators
    const handleUserTyping = (data) => {
      if (
        selectedConversation &&
        data.userId === selectedConversation.other_user_id
      ) {
        setTypingUsers((prev) => {
          const existing = prev.find((u) => u.userId === data.userId);
          if (!existing) {
            return [
              ...prev,
              {
                userId: data.userId,
                userName: data.userName,
                timestamp: Date.now(),
              },
            ];
          } else {
            return prev.map((u) =>
              u.userId === data.userId ? { ...u, timestamp: Date.now() } : u
            );
          }
        });
      }
    };

    const handleUserStoppedTyping = (data) => {
      setTypingUsers((prev) => prev.filter((u) => u.userId !== data.userId));
    };

    // Listen for reactions
    const handleReactionUpdate = (data) => {
      setMessages((prev) =>
        prev.map((msg) =>
          msg.message_id === data.messageId
            ? { ...msg, reactions: data.reactions || [] }
            : msg
        )
      );
    };

    socket.on("new_direct_message", handleNewDirectMessage);
    socket.on("direct_message_updated", handleDirectMessageUpdate);
    socket.on("direct_message_deleted", handleDirectMessageDelete);
    socket.on("dm_user_typing", handleUserTyping);
    socket.on("dm_user_stopped_typing", handleUserStoppedTyping);
    socket.on("direct_message_reaction_updated", handleReactionUpdate);

    return () => {
      socket.off("new_direct_message", handleNewDirectMessage);
      socket.off("direct_message_updated", handleDirectMessageUpdate);
      socket.off("direct_message_deleted", handleDirectMessageDelete);
      socket.off("dm_user_typing", handleUserTyping);
      socket.off("dm_user_stopped_typing", handleUserStoppedTyping);
      socket.off("direct_message_reaction_updated", handleReactionUpdate);
    };
  }, [
    socket,
    isConnected,
    user?.user_id,
    selectedConversation,
    scrollToBottom,
  ]);

  // Initialize data
  useEffect(() => {
    fetchConversations();
    fetchOrganizationMembers();
  }, [fetchConversations, fetchOrganizationMembers]);

  // Periodic refresh of conversations (every 30 seconds)
  useEffect(() => {
    if (!user?.user_id) return;

    const interval = setInterval(() => {
      fetchConversations(true); // Silent refresh
    }, 30000);

    return () => clearInterval(interval);
  }, [user?.user_id, fetchConversations]);

  // Handle URL parameters for direct user selection
  useEffect(() => {
    const userParam = searchParams.get("user");
    if (
      userParam &&
      (conversations.length > 0 || organizationMembers.length > 0)
    ) {
      const userId = parseInt(userParam);
      const conversation = conversations.find(
        (conv) => conv.other_user_id === userId
      );

      if (conversation) {
        handleSelectConversation(conversation);
      } else if (organizationMembers.length > 0) {
        // If conversation doesn't exist but we have a user param,
        // try to find the user in organization members and create a conversation
        const member = organizationMembers.find((m) => m.user_id === userId);
        if (member) {
          handleStartNewConversation(member);
        }
      }
    }
  }, [searchParams, conversations, organizationMembers]);

  // Filter conversations based on search query
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredConversations(conversations);
    } else {
      const filtered = conversations.filter(
        (conv) =>
          conv.other_user_name
            ?.toLowerCase()
            .includes(searchQuery.toLowerCase()) ||
          conv.last_message_content
            ?.toLowerCase()
            .includes(searchQuery.toLowerCase())
      );
      setFilteredConversations(filtered);
    }
  }, [conversations, searchQuery]);

  // Auto-scroll on new messages
  useEffect(() => {
    if (selectedConversation) {
      scrollToBottom();
    }
  }, [messages, selectedConversation, scrollToBottom]);

  // Cleanup typing timeout
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      if (socket && isConnected && selectedConversation) {
        socket.emit("dm_typing_stop", {
          targetUserId: selectedConversation.other_user_id,
        });
      }
    };
  }, [selectedConversation, socket, isConnected]);

  // Cleanup stale typing users
  useEffect(() => {
    const cleanupInterval = setInterval(() => {
      const now = Date.now();
      setTypingUsers((prev) =>
        prev.filter((user) => now - (user.timestamp || 0) < 5000)
      );
    }, 1000);

    return () => clearInterval(cleanupInterval);
  }, []);

  // Handle responsive behavior
  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      // On mobile, hide sidebar when conversation is selected
      if (mobile && selectedConversation) {
        setSidebarVisible(false);
      }
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, [selectedConversation]);

  // Keyboard shortcuts for sidebar toggle
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Ctrl/Cmd + B to toggle sidebar (desktop only)
      if ((e.ctrlKey || e.metaKey) && e.key === "b" && !isMobile) {
        e.preventDefault();
        setSidebarVisible((prev) => !prev);
      }
      // Escape to show sidebar if hidden
      if (e.key === "Escape" && !sidebarVisible && !isMobile) {
        setSidebarVisible(true);
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [sidebarVisible, isMobile]);

  // Update timestamps every 30 seconds for better accuracy
  useEffect(() => {
    const interval = setInterval(() => {
      // Force re-render to update timestamps
      setConversations((prev) => [...prev]);
      if (messages.length > 0) {
        setMessages((prev) => [...prev]);
      }
    }, 30000); // Update every 30 seconds

    return () => clearInterval(interval);
  }, [messages.length]);

  // Handle conversation selection
  const handleSelectConversation = (conversation) => {
    setSelectedConversation(conversation);
    setMessages([]);
    fetchMessages(conversation.other_user_id);

    // Update URL
    setSearchParams({ user: conversation.other_user_id.toString() });

    // On mobile, hide sidebar to show chat
    if (isMobile) {
      setSidebarVisible(false);
    }
  };

  // Handle starting new conversation
  const handleStartNewConversation = (member) => {
    const existingConversation = conversations.find(
      (conv) => conv.other_user_id === member.user_id
    );

    if (existingConversation) {
      handleSelectConversation(existingConversation);
    } else {
      // Create new conversation object
      const newConversation = {
        other_user_id: member.user_id,
        other_user_name: member.name,
        other_user_photo: member.user_photo,
        other_user_email: member.email,
        last_message_content: null,
        last_message_time: null,
        unread_count: 0,
      };

      // Add to conversations list immediately
      setConversations((prev) => [newConversation, ...prev]);

      // Select the conversation
      setSelectedConversation(newConversation);
      setMessages([]);

      // Update URL
      setSearchParams({ user: member.user_id.toString() });

      // On mobile, hide sidebar to show chat
      if (isMobile) {
        setSidebarVisible(false);
      }
    }

    setShowNewConversation(false);
    setMemberSearchQuery("");
  };

  // Handle typing indicators
  const handleTypingStart = useCallback(() => {
    if (socket && isConnected && selectedConversation) {
      socket.emit("dm_typing_start", {
        targetUserId: selectedConversation.other_user_id,
        userName: user.name,
      });
    }
  }, [socket, isConnected, selectedConversation, user?.name]);

  const handleTypingStop = useCallback(() => {
    if (socket && isConnected && selectedConversation) {
      socket.emit("dm_typing_stop", {
        targetUserId: selectedConversation.other_user_id,
      });
    }
  }, [socket, isConnected, selectedConversation]);

  // Handle message input changes
  const handleInputChange = (e) => {
    const value = e.target.value;
    setNewMessage(value);

    // Handle typing indicators
    if (value.trim() !== "") {
      handleTypingStart();

      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }

      typingTimeoutRef.current = setTimeout(() => {
        handleTypingStop();
      }, 2000);
    } else {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      handleTypingStop();
    }

    // Auto-resize textarea
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height =
        Math.min(textareaRef.current.scrollHeight, 120) + "px";
    }
  };

  // Send message
  const sendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedConversation || sending) return;

    setSending(true);
    try {
      const messageData = {
        content: newMessage.trim(),
        receiver_id: selectedConversation.other_user_id,
        reply_to: replyingTo?.message_id || null,
      };

      if (editingMessage) {
        // Update existing message
        const response = await axios.put(
          `${import.meta.env.VITE_BASE_URL}/api/direct-messages/messages/${
            editingMessage.message_id
          }`,
          { content: newMessage.trim() },
          { withCredentials: true }
        );
        setEditingMessage(null);

        // Update the message in the local state immediately
        setMessages((prev) =>
          prev.map((msg) =>
            msg.message_id === editingMessage.message_id
              ? {
                  ...msg,
                  content: newMessage.trim(),
                  updated_at: new Date().toISOString(),
                }
              : msg
          )
        );
      } else {
        // Send new message
        const response = await axios.post(
          `${import.meta.env.VITE_BASE_URL}/api/direct-messages/messages`,
          messageData,
          { withCredentials: true }
        );

        // Add message to local state immediately for better UX
        const newMessageObj = {
          ...response.data.message,
          isNew: true,
        };
        setMessages((prev) => [...prev, newMessageObj]);

        // Update conversations list to show this conversation at the top
        setConversations((prev) => {
          const updated = [...prev];
          const convIndex = updated.findIndex(
            (conv) => conv.other_user_id === selectedConversation.other_user_id
          );

          const conversationUpdate = {
            other_user_id: selectedConversation.other_user_id,
            other_user_name: selectedConversation.other_user_name,
            other_user_photo: selectedConversation.other_user_photo,
            other_user_email: selectedConversation.other_user_email,
            last_message_content: newMessage.trim(),
            last_message_time:
              response.data.message.created_at || new Date().toISOString(),
            unread_count: 0,
          };

          if (convIndex >= 0) {
            // Update existing conversation and move to top
            updated[convIndex] = conversationUpdate;
            const conversation = updated.splice(convIndex, 1)[0];
            updated.unshift(conversation);
          } else {
            // Add new conversation at the top
            updated.unshift(conversationUpdate);
          }

          return updated;
        });

        // Remove the isNew flag after animation
        setTimeout(() => {
          setMessages((prev) =>
            prev.map((msg) =>
              msg.message_id === newMessageObj.message_id
                ? { ...msg, isNew: false }
                : msg
            )
          );
        }, 1000);
      }

      setNewMessage("");
      setReplyingTo(null);
      handleTypingStop();

      if (textareaRef.current) {
        textareaRef.current.style.height = "auto";
      }

      // Scroll to bottom after sending
      setTimeout(scrollToBottom, 100);

      // Focus back on the input
      setTimeout(() => {
        textareaRef.current?.focus();
      }, 50);
    } catch (error) {
      console.error("Error sending message:", error);
      toast.error("Failed to send message");
    } finally {
      setSending(false);
    }
  };

  // Handle file upload
  const handleFileUpload = async (files) => {
    if (!selectedConversation) return;

    const uploadPromises = files.map(async (file) => {
      try {
        const fileName = file.name || "Unknown file";
        const uploadToast = toast.loading(`Uploading ${fileName}...`);

        const formData = new FormData();
        formData.append("file", file);
        formData.append("receiver_id", selectedConversation.other_user_id);

        const response = await axios.post(
          `${import.meta.env.VITE_BASE_URL}/api/direct-messages/messages/file`,
          formData,
          {
            withCredentials: true,
            headers: { "Content-Type": "multipart/form-data" },
            timeout: 60000,
          }
        );

        toast.success(`${fileName} uploaded successfully!`, {
          id: uploadToast,
        });

        return response.data;
      } catch (error) {
        console.error("Error uploading file:", error);
        toast.error(`Failed to upload ${file.name}`);
        throw error;
      }
    });

    try {
      await Promise.all(uploadPromises);
      setShowFileUpload(false);
    } catch (error) {
      console.error("Some files failed to upload:", error);
    }
  };

  // Handle message reactions
  const handleReaction = async (messageId, emoji) => {
    try {
      const response = await axios.post(
        `${
          import.meta.env.VITE_BASE_URL
        }/api/direct-messages/messages/${messageId}/reactions`,
        { emoji },
        { withCredentials: true }
      );

      setMessages((prev) =>
        prev.map((msg) =>
          msg.message_id === messageId
            ? { ...msg, reactions: response.data.reactions || [] }
            : msg
        )
      );
    } catch (error) {
      console.error("Error adding reaction:", error);
      toast.error("Failed to add reaction");
    }
  };

  // Handle message deletion
  const handleDeleteMessage = async (messageId) => {
    try {
      await axios.delete(
        `${
          import.meta.env.VITE_BASE_URL
        }/api/direct-messages/messages/${messageId}`,
        { withCredentials: true }
      );
      toast.success("Message deleted");
    } catch (error) {
      console.error("Error deleting message:", error);
      toast.error("Failed to delete message");
    }
  };

  // Handle message editing
  const handleEditMessage = (message) => {
    setEditingMessage(message);
    setNewMessage(message.content);
    textareaRef.current?.focus();
  };

  // Handle reply
  const handleReply = (message) => {
    setReplyingTo(message);
    textareaRef.current?.focus();
  };

  // Handle emoji selection
  const handleEmojiSelect = (emoji) => {
    setNewMessage((prev) => prev + emoji);
    setShowEmojiPicker(false);
    textareaRef.current?.focus();
  };

  // Format timestamp with accurate timing and timezone handling
  const formatTime = (timestamp) => {
    if (!timestamp) return "";

    // Handle different timestamp formats and ensure proper parsing
    let date;
    try {
      if (typeof timestamp === "string") {
        // Handle ISO string formats, ensure UTC parsing if no timezone info
        if (
          timestamp.includes("T") &&
          !timestamp.includes("Z") &&
          !timestamp.includes("+") &&
          !timestamp.includes("-", 10)
        ) {
          // Assume UTC if no timezone specified in ISO format
          date = new Date(timestamp + "Z");
        } else {
          date = new Date(timestamp);
        }
      } else if (typeof timestamp === "number") {
        // Handle Unix timestamp (seconds or milliseconds)
        date =
          timestamp > 1000000000000
            ? new Date(timestamp)
            : new Date(timestamp * 1000);
      } else {
        date = new Date(timestamp);
      }

      // Check if date is valid
      if (isNaN(date.getTime())) {
        console.warn("Invalid timestamp:", timestamp);
        return "Invalid date";
      }
    } catch (error) {
      console.warn("Error parsing timestamp:", timestamp, error);
      return "Invalid date";
    }

    const now = new Date();
    const diff = now.getTime() - date.getTime();

    // Handle future dates (clock sync issues)
    if (diff < 0) {
      const futureDiff = Math.abs(diff);
      if (futureDiff < 30000) return "Just now"; // Within 30 seconds, assume clock sync issue
      return "Just now"; // Don't show future times
    }

    // Less than 30 seconds
    if (diff < 30000) return "Just now";

    // Less than 1 minute
    if (diff < 60000) return "Less than a minute ago";

    // Less than 1 hour
    if (diff < 3600000) {
      const minutes = Math.floor(diff / 60000);
      return `${minutes} minute${minutes === 1 ? "" : "s"} ago`;
    }

    // Same day
    const isToday = date.toDateString() === now.toDateString();
    if (isToday) {
      return date.toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      });
    }

    // Yesterday
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    if (date.toDateString() === yesterday.toDateString()) {
      return `Yesterday at ${date.toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      })}`;
    }

    // Less than 7 days
    if (diff < 604800000) {
      const days = Math.floor(diff / 86400000);
      return `${days} day${days === 1 ? "" : "s"} ago`;
    }

    // More than 7 days
    const currentYear = now.getFullYear();
    const messageYear = date.getFullYear();

    if (currentYear === messageYear) {
      return date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      });
    } else {
      return date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      });
    }
  };

  // Get status icon
  const getStatusIcon = (isRead) => {
    return isRead ? (
      <CheckCheck size={14} className="text-blue-500" />
    ) : (
      <CheckCheck size={14} className="text-gray-400" />
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full bg-white">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading conversations...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex bg-gray-50 relative overflow-hidden">
      {/* Conversations Sidebar */}
      <div
        className={`${
          selectedConversation && isMobile ? "hidden" : "flex"
        } flex-col bg-white border-r border-gray-200 transition-all duration-300 ease-out transform ${
          !sidebarVisible
            ? "w-0 min-w-0 -translate-x-full opacity-0 pointer-events-none"
            : "w-full md:w-80 translate-x-0 opacity-100 pointer-events-auto"
        } ${
          selectedConversation && !isMobile ? "hidden md:flex" : ""
        } overflow-hidden shadow-lg`}
      >
        {/* Header */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-xl font-bold text-gray-900">Messages</h1>
            <button
              onClick={() => setShowNewConversation(true)}
              className="p-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
              title="New conversation cursor-pointer"
            >
              <Plus size={18} className="cursor-pointer" />
            </button>
          </div>

          {/* Search */}
          <div className="relative">
            <Search
              size={18}
              className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
            />
            <input
              type="text"
              placeholder="Search conversations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-gray-100 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
            />
          </div>
        </div>

        {/* Conversations List */}
        <div className="flex-1 overflow-y-auto">
          {filteredConversations.length === 0 ? (
            <div className="text-center py-8">
              <MessageCircle size={40} className="mx-auto mb-4 text-gray-400" />
              <p className="text-gray-600 text-sm">
                {searchQuery
                  ? "No conversations found"
                  : "No conversations yet"}
              </p>
              {!searchQuery && (
                <button
                  onClick={() => setShowNewConversation(true)}
                  className="mt-2 text-purple-600 hover:text-purple-700 text-sm font-medium"
                >
                  Start a conversation
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-1 p-2">
              {filteredConversations.map((conversation) => (
                <div
                  key={conversation.other_user_id}
                  className={`flex items-center p-3 rounded-lg cursor-pointer transition-colors ${
                    selectedConversation?.other_user_id ===
                    conversation.other_user_id
                      ? "bg-purple-100 border border-purple-200"
                      : "hover:bg-gray-100"
                  }`}
                  onClick={() => handleSelectConversation(conversation)}
                >
                  {/* Avatar */}
                  <div className="relative flex-shrink-0">
                    <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-full flex items-center justify-center text-white font-semibold overflow-hidden">
                      {conversation.other_user_photo ? (
                        <img
                          src={conversation.other_user_photo}
                          alt={conversation.other_user_name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        conversation.other_user_name
                          ?.charAt(0)
                          ?.toUpperCase() || "U"
                      )}
                    </div>
                  </div>

                  {/* Content */}
                  <div className="flex-1 ml-3 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <h3 className="font-semibold text-gray-900 truncate">
                        {conversation.other_user_name}
                      </h3>
                      <span className="text-xs text-gray-500">
                        {formatTime(conversation.last_message_time)}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <p className="text-sm text-gray-600 truncate flex-1">
                        {conversation.last_message_content || "No messages yet"}
                      </p>

                      {conversation.unread_count > 0 && (
                        <div className="ml-2 flex items-center justify-center w-5 h-5 bg-purple-600 text-white text-xs font-bold rounded-full">
                          {conversation.unread_count}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Chat Area */}
      {selectedConversation ? (
        <div className="flex-1 flex flex-col transition-all duration-300 ease-in-out">
          {/* Chat Header */}
          <div className="bg-white border-b border-gray-200 p-4 flex items-center">
            {/* Sidebar Toggle Button */}
            <button
              onClick={() => setSidebarVisible(!sidebarVisible)}
              className="hidden md:flex mr-3 p-2 hover:bg-gray-100 rounded-lg transition-colors"
              title={
                sidebarVisible
                  ? "Hide conversations (Ctrl+B)"
                  : "Show conversations (Ctrl+B)"
              }
            >
              {sidebarVisible ? (
                <PanelLeftClose size={20} className="text-gray-600" />
              ) : (
                <PanelLeftOpen size={20} className="text-gray-600" />
              )}
            </button>

            {/* Mobile Back Button */}
            <button
              onClick={() => {
                setSelectedConversation(null);
                setSearchParams({});
              }}
              className="md:hidden mr-3 p-2 hover:bg-gray-100 rounded-lg"
            >
              <ArrowLeft size={20} />
            </button>

            <div className="flex items-center">
              <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-full flex items-center justify-center text-white font-semibold overflow-hidden">
                {selectedConversation.other_user_photo ? (
                  <img
                    src={selectedConversation.other_user_photo}
                    alt={selectedConversation.other_user_name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  selectedConversation.other_user_name
                    ?.charAt(0)
                    ?.toUpperCase() || "U"
                )}
              </div>
              <div className="ml-3 flex-1">
                <h2 className="font-semibold text-gray-900">
                  {selectedConversation.other_user_name}
                </h2>
                <p className="text-sm text-gray-500">
                  {selectedConversation.other_user_email}
                </p>
              </div>

              {/* Connection Status */}
              <div className="flex items-center gap-2">
                <div
                  className={`w-2 h-2 rounded-full ${
                    isConnected ? "bg-green-500" : "bg-red-500"
                  }`}
                ></div>
                <span className="text-xs text-gray-500">
                  {isConnected ? "Connected" : "Disconnected"}
                </span>
              </div>
            </div>
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50">
            {messagesLoading ? (
              <div className="flex items-center justify-center h-full">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-purple-600"></div>
              </div>
            ) : messages.length === 0 ? (
              <div className="text-center py-8">
                <MessageCircle
                  size={40}
                  className="mx-auto mb-4 text-gray-400"
                />
                <p className="text-gray-600">
                  Start a conversation with{" "}
                  {selectedConversation.other_user_name}
                </p>
              </div>
            ) : (
              messages.map((message, index) => {
                const showAvatar =
                  index === 0 ||
                  messages[index - 1].sender_id !== message.sender_id;
                const isOwnMessage = message.sender_id === user.user_id;

                return (
                  <div
                    key={message.message_id}
                    className={`group transition-all duration-200 hover:bg-gray-100/50 rounded-lg p-2 -m-2 ${
                      showAvatar ? "mt-4" : "mt-1"
                    } ${
                      message.isNew
                        ? "animate-in slide-in-from-bottom-2 duration-300"
                        : ""
                    }`}
                  >
                    <div
                      className={`flex gap-2 ${
                        isOwnMessage ? "flex-row-reverse" : ""
                      }`}
                    >
                      {/* Avatar */}
                      {showAvatar ? (
                        <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-full flex items-center justify-center text-white font-semibold text-sm overflow-hidden flex-shrink-0">
                          {isOwnMessage ? (
                            user.user_photo ? (
                              <img
                                src={user.user_photo}
                                alt={user.name}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              user.name?.charAt(0)?.toUpperCase() || "U"
                            )
                          ) : selectedConversation.other_user_photo ? (
                            <img
                              src={selectedConversation.other_user_photo}
                              alt={selectedConversation.other_user_name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            selectedConversation.other_user_name
                              ?.charAt(0)
                              ?.toUpperCase() || "U"
                          )}
                        </div>
                      ) : (
                        <div className="w-8 flex-shrink-0"></div>
                      )}

                      <div
                        className={`flex-1 min-w-0 ${
                          isOwnMessage ? "text-right" : ""
                        }`}
                      >
                        {/* Header with actions */}
                        {showAvatar && (
                          <div
                            className={`flex items-center gap-2 mb-1 ${
                              isOwnMessage ? "flex-row-reverse" : ""
                            }`}
                          >
                            <span className="text-xs text-gray-500">
                              {formatTime(message.created_at)}
                            </span>

                            {/* Message actions */}
                            {!message.isDeleted && (
                              <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                                <div className="bg-white border border-gray-200 rounded-full shadow-lg flex">
                                  <button
                                    onClick={() =>
                                      handleReaction(message.message_id, "👍")
                                    }
                                    className="p-1.5 hover:bg-blue-50 rounded-full text-gray-500 hover:text-blue-600 transition-colors"
                                    title="Like"
                                  >
                                    <ThumbsUp size={12} />
                                  </button>
                                  <button
                                    onClick={() =>
                                      handleReaction(message.message_id, "❤️")
                                    }
                                    className="p-1.5 hover:bg-blue-50 rounded-full text-gray-500 hover:text-red-600 transition-colors"
                                    title="Love"
                                  >
                                    <Heart size={12} />
                                  </button>
                                  <button
                                    onClick={() => handleReply(message)}
                                    className="p-1.5 hover:bg-blue-50 rounded-full text-gray-500 hover:text-blue-600 transition-colors"
                                    title="Reply"
                                  >
                                    <Reply size={12} />
                                  </button>
                                  {isOwnMessage && (
                                    <>
                                      <button
                                        onClick={() =>
                                          handleEditMessage(message)
                                        }
                                        className="p-1.5 hover:bg-blue-50 rounded-full text-gray-500 hover:text-blue-600 transition-colors"
                                        title="Edit"
                                      >
                                        <Edit2 size={12} />
                                      </button>
                                      <button
                                        onClick={() =>
                                          handleDeleteMessage(
                                            message.message_id
                                          )
                                        }
                                        className="p-1.5 hover:bg-red-50 rounded-full text-gray-500 hover:text-red-600 transition-colors"
                                        title="Delete"
                                      >
                                        <Trash2 size={12} />
                                      </button>
                                    </>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>
                        )}

                        {/* Reply indicator */}
                        {message.reply_to && (
                          <div
                            className={`bg-gray-100 border-l-4 border-gray-300 pl-3 py-2 mb-2 rounded-r ${
                              isOwnMessage ? "bg-blue-50 border-blue-300" : ""
                            }`}
                          >
                            <div className="text-xs text-gray-600 mb-1">
                              Replying to {message.reply_to_sender_name}
                            </div>
                            <div className="text-sm text-gray-800 truncate">
                              {message.reply_to_content}
                            </div>
                          </div>
                        )}

                        {/* Message content */}
                        <div
                          className={`flex flex-col ${
                            isOwnMessage ? "items-end" : "items-start"
                          }`}
                        >
                          {message.file_url ? (
                            <div
                              className={`rounded-2xl p-4 inline-block max-w-xs sm:max-w-md shadow-sm ${
                                isOwnMessage
                                  ? "bg-gradient-to-r from-blue-500 to-blue-600 text-white ml-auto rounded-br-md"
                                  : "bg-white border border-gray-200 rounded-bl-md"
                              }`}
                            >
                              {message.file_type?.startsWith("image/") ? (
                                <div className="relative">
                                  <img
                                    src={message.file_url}
                                    alt={message.file_name}
                                    className="max-w-full h-auto rounded cursor-pointer"
                                    onClick={() =>
                                      window.open(message.file_url, "_blank")
                                    }
                                  />
                                  {message.file_name && (
                                    <div className="mt-2 text-xs opacity-75">
                                      {message.file_name}
                                    </div>
                                  )}
                                </div>
                              ) : (
                                <div className="flex items-center gap-3">
                                  <File
                                    size={24}
                                    className={
                                      isOwnMessage
                                        ? "text-white"
                                        : "text-gray-600"
                                    }
                                  />
                                  <div className="flex-1 min-w-0">
                                    <div
                                      className={`text-sm font-medium truncate ${
                                        isOwnMessage
                                          ? "text-white"
                                          : "text-gray-900"
                                      }`}
                                    >
                                      {message.file_name}
                                    </div>
                                  </div>
                                  <button
                                    onClick={() =>
                                      window.open(message.file_url, "_blank")
                                    }
                                    className={`p-2 rounded ${
                                      isOwnMessage
                                        ? "hover:bg-blue-600"
                                        : "hover:bg-gray-200"
                                    }`}
                                    title="Download file"
                                  >
                                    <Download
                                      size={16}
                                      className={
                                        isOwnMessage
                                          ? "text-white"
                                          : "text-gray-600"
                                      }
                                    />
                                  </button>
                                </div>
                              )}
                            </div>
                          ) : (
                            <div
                              className={`text-sm leading-relaxed break-words p-4 rounded-2xl shadow-sm inline-block max-w-xs sm:max-w-md ${
                                message.isDeleted
                                  ? "bg-gray-100 text-gray-500 italic"
                                  : isOwnMessage
                                  ? "bg-gradient-to-r from-blue-500 to-blue-600 text-white ml-auto rounded-br-md"
                                  : "bg-white text-gray-800 rounded-bl-md border border-gray-200"
                              }`}
                            >
                              {message.content}
                            </div>
                          )}

                          {/* Reactions */}
                          {!message.isDeleted && (
                            <div className="mt-1">
                              <MessageReactions
                                reactions={message.reactions || []}
                                onReactionClick={(emoji) =>
                                  handleReaction(message.message_id, emoji)
                                }
                                currentUserId={user.user_id}
                                isOwnMessage={isOwnMessage}
                              />
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Typing indicator */}
          {typingUsers.length > 0 && (
            <div className="px-4 pb-2">
              <TypingIndicator users={typingUsers} />
            </div>
          )}

          {/* Reply indicator */}
          {replyingTo && (
            <div className="bg-blue-50 border-t border-blue-200 p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Reply size={16} className="text-blue-600" />
                  <div>
                    <span className="text-sm font-semibold text-blue-800">
                      Replying to {replyingTo.sender_name}
                    </span>
                    <div className="text-sm text-gray-700 truncate max-w-xs">
                      {replyingTo.content}
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => setReplyingTo(null)}
                  className="p-2 hover:bg-blue-100 rounded-full"
                >
                  <X size={16} className="text-blue-600" />
                </button>
              </div>
            </div>
          )}

          {/* Edit indicator */}
          {editingMessage && (
            <div className="bg-amber-50 border-t border-amber-200 p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Edit2 size={16} className="text-amber-600" />
                  <span className="text-sm font-semibold text-amber-800">
                    Editing message
                  </span>
                </div>
                <button
                  onClick={() => {
                    setEditingMessage(null);
                    setNewMessage("");
                  }}
                  className="p-2 hover:bg-amber-100 rounded-full"
                >
                  <X size={16} className="text-amber-600" />
                </button>
              </div>
            </div>
          )}

          {/* Message Input */}
          <div className="border-t border-gray-200 bg-white p-4">
            <form onSubmit={sendMessage} className="relative">
              <div className="bg-white border-2 border-gray-200 rounded-2xl focus-within:border-purple-500 focus-within:ring-4 focus-within:ring-purple-100 transition-all duration-200">
                <textarea
                  ref={textareaRef}
                  value={newMessage}
                  onChange={handleInputChange}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      const syntheticEvent = {
                        preventDefault: () => {},
                        target: e.target,
                        currentTarget: e.currentTarget,
                      };
                      sendMessage(syntheticEvent);
                    }
                  }}
                  placeholder={`Message ${selectedConversation.other_user_name}...`}
                  className="w-full bg-transparent text-gray-900 placeholder-gray-400 px-6 py-4 pr-24 resize-none outline-none max-h-[120px] leading-relaxed"
                  rows="1"
                  disabled={sending}
                />

                <div className="flex items-center justify-between px-4 pb-4">
                  <div className="flex items-center gap-3">
                    <div className="relative" ref={emojiPickerRef}>
                      <button
                        type="button"
                        onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                        className="p-2 hover:bg-purple-100 rounded-xl text-gray-600 hover:text-purple-600 transition-colors cursor-pointer"
                        title="Add emoji"
                      >
                        <Smile size={18} className="cursor-pointer" />
                      </button>
                      {showEmojiPicker && (
                        <div className="absolute bottom-full left-0 mb-2 z-50 cursor-pointer">
                          <EmojiPicker
                            onEmojiSelect={handleEmojiSelect}
                            className="cursor-pointer"
                          />
                        </div>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={() => setShowFileUpload(true)}
                      className="p-2 hover:bg-purple-100 rounded-xl text-gray-600 hover:text-purple-600 transition-colors cursor-pointer"
                      title="Attach files"
                    >
                      <Paperclip size={18} className="cursor-pointer" />
                    </button>
                  </div>

                  <button
                    type="submit"
                    disabled={!newMessage.trim() || sending}
                    onClick={(e) => {
                      e.preventDefault();
                      sendMessage(e);
                    }}
                    className={`flex items-center gap-3 px-6 py-3 rounded-xl font-semibold text-sm transition-all duration-200 cursor-pointer ${
                      newMessage.trim() && !sending
                        ? "bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white shadow-lg hover:shadow-xl transform hover:scale-105"
                        : "bg-gray-200 text-gray-400 cursor-not-allowed"
                    }`}
                  >
                    {sending ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-white"></div>
                    ) : (
                      <Send size={14} />
                    )}
                    {editingMessage ? "Update" : "Send"}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      ) : (
        <div className="hidden md:flex flex-1 flex-col bg-gray-50 transition-all duration-300 ease-in-out">
          {/* Empty State Header with Sidebar Toggle */}
          <div className="bg-white border-b border-gray-200 p-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">Messages</h2>
            <button
              onClick={() => setSidebarVisible(!sidebarVisible)}
              className="p-2 hover:bg-gray-100 rounded-lg transition-all cursor-pointer"
              title={
                sidebarVisible
                  ? "Hide conversations (Ctrl+B)"
                  : "Show conversations (Ctrl+B)"
              }
            >
              {sidebarVisible ? (
                <PanelLeftClose size={20} className="text-gray-600" />
              ) : (
                <PanelLeftOpen size={20} className="text-gray-600" />
              )}
            </button>
          </div>

          {/* Empty State Content */}
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <MessageCircle size={64} className="mx-auto mb-4 text-gray-400" />
              <h2 className="text-xl font-semibold text-gray-700 mb-2">
                {sidebarVisible
                  ? "Select a conversation"
                  : "No conversation selected"}
              </h2>
              <p className="text-gray-500 mb-4">
                {sidebarVisible
                  ? "Choose a conversation from the sidebar to start messaging"
                  : "Open the sidebar to see your conversations"}
              </p>
              {!sidebarVisible && (
                <button
                  onClick={() => setSidebarVisible(true)}
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                >
                  Show Conversations
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* New Conversation Modal */}
      {showNewConversation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">
                  New Conversation
                </h2>
                <button
                  onClick={() => {
                    setShowNewConversation(false);
                    setMemberSearchQuery("");
                  }}
                  className="p-2 hover:bg-gray-100 rounded-lg cursor-pointer"
                >
                  <X size={20} className="cursor-pointer" />
                </button>
              </div>

              {/* Search members */}
              <div className="relative mb-4">
                <Search
                  size={18}
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                />
                <input
                  type="text"
                  placeholder="Search members..."
                  value={memberSearchQuery}
                  onChange={(e) => setMemberSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              {/* Members list */}
              <div className="max-h-64 overflow-y-auto space-y-2">
                {organizationMembers
                  .filter(
                    (member) =>
                      member.name
                        .toLowerCase()
                        .includes(memberSearchQuery.toLowerCase()) ||
                      member.email
                        .toLowerCase()
                        .includes(memberSearchQuery.toLowerCase())
                  )
                  .map((member) => (
                    <div
                      key={member.user_id}
                      className="flex items-center p-3 hover:bg-gray-100 rounded-lg cursor-pointer"
                      onClick={() => handleStartNewConversation(member)}
                    >
                      <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-full flex items-center justify-center text-white font-semibold overflow-hidden">
                        {member.user_photo ? (
                          <img
                            src={member.user_photo}
                            alt={member.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          member.name.charAt(0).toUpperCase()
                        )}
                      </div>
                      <div className="ml-3">
                        <h3 className="font-medium text-gray-900">
                          {member.name}
                        </h3>
                        <p className="text-sm text-gray-500">{member.email}</p>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* File Upload Modal */}
      {showFileUpload && (
        <FileUpload
          onUpload={handleFileUpload}
          onClose={() => setShowFileUpload(false)}
          maxFiles={5}
          maxSize={10 * 1024 * 1024}
        />
      )}
    </div>
  );
};

export default Messages;
