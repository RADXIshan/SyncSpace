import { useState, useEffect, useRef, useCallback, useMemo } from "react";
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
  AlertTriangle,
} from "lucide-react";
import { toast } from "react-hot-toast";
import EmojiPicker from "./EmojiPicker";
import MessageReactions from "./MessageReactions";
import TypingIndicator from "./TypingIndicator";
import FileUpload from "./FileUpload";
import ConfirmationModal from "./ConfirmationModal";

const Messages = () => {
  const { user } = useAuth();
  const { socket, isConnected } = useSocket();
  const { markDirectMessagesAsRead } = useUnread();
  const [searchParams, setSearchParams] = useSearchParams();

  // State for conversations list
  const [conversations, setConversations] = useState([]);
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

  // State for conversation actions
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [conversationToDelete, setConversationToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Refs
  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const fileInputRef = useRef(null);
  const emojiPickerRef = useRef(null);

  // Optimized scroll to bottom for WhatsApp-like experience
  const scrollToBottom = useCallback((instant = false) => {
    if (messagesEndRef.current) {
      if (instant) {
        // Instant scroll for real-time messages
        messagesEndRef.current.scrollIntoView({ behavior: "auto" });
      } else {
        // Smooth scroll for user actions
        messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
      }
    }
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

  // Socket event handlers - Optimized for WhatsApp-like real-time experience
  useEffect(() => {
    if (!socket || !isConnected || !user?.user_id) {
      return;
    }

    // Debounce function to prevent rapid updates - reduced wait time for faster response
    const debounce = (func, wait) => {
      let timeout;
      return function executedFunction(...args) {
        const later = () => {
          clearTimeout(timeout);
          func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
      };
    };

    // Listen for new direct messages - Optimized for instant WhatsApp-like updates
    const handleNewDirectMessage = (message) => {
      // Determine if this message is for the current conversation
      const isCurrentConversation =
        selectedConversation &&
        (message.sender_id === selectedConversation.other_user_id ||
          message.receiver_id === selectedConversation.other_user_id);

      // Update messages if this conversation is currently selected - instant update
      if (isCurrentConversation) {
        setMessages((prev) => {
          // Check if this message already exists (avoid duplicates from optimistic updates)
          const existingMessage = prev.find(
            (msg) =>
              msg.message_id === message.message_id ||
              (msg.isOptimistic &&
                msg.content === message.content &&
                msg.sender_id === message.sender_id &&
                msg.receiver_id === message.receiver_id &&
                Math.abs(
                  new Date(msg.created_at) - new Date(message.created_at)
                ) < 10000) // Increased time window and added more matching criteria
          );

          if (existingMessage) {
            // Replace optimistic message with real message instantly
            return prev.map((msg) =>
              msg.message_id === existingMessage.message_id
                ? { ...message, isNew: true, isOptimistic: false }
                : msg
            );
          } else {
            // Add new message instantly
            return [...prev, { ...message, isNew: true }];
          }
        });

        // Immediate instant scroll for real-time feel
        requestAnimationFrame(() => {
          scrollToBottom(true); // Instant scroll for new messages
        });

        // Remove the isNew flag after shorter animation for faster feel
        setTimeout(() => {
          setMessages((prev) =>
            prev.map((msg) =>
              msg.message_id === message.message_id
                ? { ...msg, isNew: false }
                : msg
            )
          );
        }, 500); // Reduced from 1000ms to 500ms
      }

      // Update conversations list locally with smooth animations
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
          // Update existing conversation smoothly
          const existingConv = updated[convIndex];
          const updatedConv = {
            ...existingConv,
            last_message_content: messageContent,
            last_message_time: message.created_at,
            unread_count:
              message.receiver_id === user.user_id && !isCurrentConversation
                ? existingConv.unread_count + 1
                : existingConv.unread_count,
            hasNewMessage:
              !isCurrentConversation && message.sender_id !== user.user_id, // Flag for animation
          };

          // Only move to top if it's not already at the top (avoid unnecessary re-renders)
          if (convIndex === 0) {
            updated[0] = updatedConv;
          } else {
            // Move to top smoothly
            updated.splice(convIndex, 1);
            updated.unshift(updatedConv);
          }

          // Remove the new message flag after animation
          if (updatedConv.hasNewMessage) {
            setTimeout(() => {
              setConversations((prevConvs) =>
                prevConvs.map((conv) =>
                  conv.other_user_id === otherUserId
                    ? { ...conv, hasNewMessage: false }
                    : conv
                )
              );
            }, 500);
          }
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
            hasNewMessage: true,
          };
          updated.unshift(newConversation);

          // Remove the new message flag after animation
          setTimeout(() => {
            setConversations((prevConvs) =>
              prevConvs.map((conv) =>
                conv.other_user_id === message.sender_id
                  ? { ...conv, hasNewMessage: false }
                  : conv
              )
            );
          }, 500);
        }

        return updated;
      });
    };

    // Listen for message updates - same as TeamChat
    const handleDirectMessageUpdate = (updatedMessage) => {
      setMessages((prev) =>
        prev.map((msg) =>
          msg.message_id === updatedMessage.message_id ? updatedMessage : msg
        )
      );
    };

    // Listen for message deletions - same as TeamChat
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

    // Listen for typing indicators - Optimized for instant WhatsApp-like response
    const handleUserTyping = debounce((data) => {
      if (
        selectedConversation &&
        data.userId === selectedConversation.other_user_id &&
        data.userId !== user.user_id
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
            // Update timestamp for existing user
            return prev.map((u) =>
              u.userId === data.userId ? { ...u, timestamp: Date.now() } : u
            );
          }
        });
      }
    }, 50); // Reduced from 100ms to 50ms for faster typing indicator response

    const handleUserStoppedTyping = (data) => {
      setTypingUsers((prev) => prev.filter((u) => u.userId !== data.userId));
    };

    // Listen for reactions - same as TeamChat
    const handleReactionUpdate = (data) => {
      setMessages((prev) =>
        prev.map((msg) =>
          msg.message_id === data.messageId
            ? { ...msg, reactions: data.reactions || [] }
            : msg
        )
      );
    };

    // Listen for conversation deletions
    const handleConversationDeleted = (data) => {
      // Remove the conversation from the list
      setConversations((prev) =>
        prev.filter((conv) => conv.other_user_id !== data.otherUserId)
      );

      // If the deleted conversation is currently selected, clear it
      if (selectedConversation?.other_user_id === data.otherUserId) {
        setSelectedConversation(null);
        setMessages([]);
        setSearchParams({});
      }

      // Show toast notification
      if (data.deletedBy === user.user_id) {
        toast.success("Conversation deleted successfully");
      } else {
        // Find the user who deleted the conversation
        const deletedByUser = conversations.find(
          (conv) => conv.other_user_id === data.deletedBy
        );
        toast.info(
          `Conversation with ${
            deletedByUser?.other_user_name || "someone"
          } was deleted`
        );
      }
    };

    // Listen for chat history cleared
    const handleChatHistoryCleared = (data) => {
      // Clear messages if this is the currently selected conversation
      if (selectedConversation?.other_user_id === data.otherUserId) {
        setMessages([]);
        setSelectedConversation(null);
        setSearchParams({});
      }

      // Remove conversation from sidebar for this user (they can start a new one)
      setConversations((prev) =>
        prev.filter((conv) => conv.other_user_id !== data.otherUserId)
      );
    };

    socket.on("new_direct_message", handleNewDirectMessage);
    socket.on("direct_message_updated", handleDirectMessageUpdate);
    socket.on("direct_message_deleted", handleDirectMessageDelete);
    socket.on("dm_user_typing", handleUserTyping);
    socket.on("dm_user_stopped_typing", handleUserStoppedTyping);
    socket.on("direct_message_reaction_updated", handleReactionUpdate);
    socket.on("conversation_deleted", handleConversationDeleted);
    socket.on("chat_history_cleared", handleChatHistoryCleared);

    return () => {
      socket.off("new_direct_message", handleNewDirectMessage);
      socket.off("direct_message_updated", handleDirectMessageUpdate);
      socket.off("direct_message_deleted", handleDirectMessageDelete);
      socket.off("dm_user_typing", handleUserTyping);
      socket.off("dm_user_stopped_typing", handleUserStoppedTyping);
      socket.off("direct_message_reaction_updated", handleReactionUpdate);
      socket.off("conversation_deleted", handleConversationDeleted);
      socket.off("chat_history_cleared", handleChatHistoryCleared);
    };
  }, [
    socket,
    isConnected,
    user?.user_id,
    selectedConversation?.other_user_id, // Only depend on the ID, not the entire object
    scrollToBottom,
  ]);

  // Initialize data
  useEffect(() => {
    fetchConversations();
    fetchOrganizationMembers();
  }, [fetchConversations, fetchOrganizationMembers]);

  // Remove periodic refresh - rely on real-time updates only
  // Real-time updates through socket events should handle all conversation updates

  // Handle URL parameters for direct user selection - optimized to prevent unnecessary re-renders
  useEffect(() => {
    const userParam = searchParams.get("user");
    if (
      userParam &&
      (conversations.length > 0 || organizationMembers.length > 0) &&
      !selectedConversation // Only run if no conversation is selected
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
  }, [
    searchParams.get("user"),
    conversations.length,
    organizationMembers.length,
    selectedConversation,
  ]); // Optimized dependencies

  // Filter conversations based on search query - optimized with useMemo
  const filteredConversations = useMemo(() => {
    if (!searchQuery.trim()) {
      return conversations;
    } else {
      return conversations.filter(
        (conv) =>
          conv.other_user_name
            ?.toLowerCase()
            .includes(searchQuery.toLowerCase()) ||
          conv.last_message_content
            ?.toLowerCase()
            .includes(searchQuery.toLowerCase())
      );
    }
  }, [conversations, searchQuery]);

  // Auto-scroll on new messages - Optimized to prevent unnecessary scrolling
  useEffect(() => {
    // Only scroll if there are messages and the last message is new or from current user
    if (messages.length > 0) {
      const lastMessage = messages[messages.length - 1];
      const shouldScroll =
        lastMessage.isNew ||
        lastMessage.sender_id === user.user_id ||
        lastMessage.isOptimistic;

      if (shouldScroll) {
        // Use requestAnimationFrame for smoother scrolling
        requestAnimationFrame(() => {
          scrollToBottom(true); // Instant scroll for better performance
        });
      }
    }
  }, [messages.length, user.user_id, scrollToBottom]); // Only depend on messages length, not entire array

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

  // Keyboard shortcuts for sidebar toggle and close dropdowns
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Ctrl/Cmd + B to toggle sidebar (desktop only)
      if ((e.ctrlKey || e.metaKey) && e.key === "b" && !isMobile) {
        e.preventDefault();
        setSidebarVisible((prev) => !prev);
      }
      // Escape to show sidebar if hidden or close modals
      if (e.key === "Escape") {
        if (showDeleteModal) {
          setShowDeleteModal(false);
          setConversationToDelete(null);
        } else if (showNewConversation) {
          setShowNewConversation(false);
          setMemberSearchQuery("");
        } else if (!sidebarVisible && !isMobile) {
          setSidebarVisible(true);
        }
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [sidebarVisible, isMobile, showDeleteModal]);

  // Update timestamps every 30 seconds for better accuracy - optimized to avoid unnecessary re-renders
  useEffect(() => {
    const interval = setInterval(() => {
      // Only update if there are messages and user is actively viewing
      if (messages.length > 0 && document.visibilityState === "visible") {
        // Force re-render to update timestamps only when needed
        setMessages((prev) => [...prev]);
      }
    }, 30000); // Update every 30 seconds

    return () => clearInterval(interval);
  }, [messages.length]); // Only depend on messages length, not the entire messages array

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
      }, 1500); // Optimized to 1.5 seconds for faster WhatsApp-like response
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

  // Send message with instant optimistic updates - WhatsApp-like experience
  const sendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() && !replyingTo) return;

    const messageContent = newMessage.trim();
    const currentReplyingTo = replyingTo;

    // Clear input immediately for instant feel
    setNewMessage("");
    setReplyingTo(null);
    handleTypingStop();

    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }

    setSending(true);

    // Create optimistic message for immediate UI update
    const optimisticMessage = {
      message_id: `temp-${Date.now()}-${Math.random()}`,
      content: messageContent,
      sender_id: user.user_id,
      sender_name: user.name,
      sender_photo: user.user_photo,
      receiver_id: selectedConversation.other_user_id,
      created_at: new Date().toISOString(),
      reply_to: currentReplyingTo?.message_id || null,
      reply_to_sender_name: currentReplyingTo?.sender_name || null,
      reply_to_content: currentReplyingTo?.content || null,
      isOptimistic: true,
      reactions: [],
      status: "sending", // Add sending status
    };

    try {
      const messageData = {
        content: messageContent,
        receiver_id: selectedConversation.other_user_id,
        reply_to: currentReplyingTo?.message_id || null,
      };

      if (editingMessage) {
        // Update existing message
        await axios.put(
          `${import.meta.env.VITE_BASE_URL}/api/direct-messages/messages/${
            editingMessage.message_id
          }`,
          { content: messageContent },
          { withCredentials: true }
        );
        setEditingMessage(null);
      } else {
        // Add optimistic message immediately for instant WhatsApp-like feel
        setMessages((prev) => [...prev, optimisticMessage]);

        // Immediate smooth scroll
        requestAnimationFrame(() => {
          scrollToBottom();
        });

        // Send new message - socket will handle the real server response
        const response = await axios.post(
          `${import.meta.env.VITE_BASE_URL}/api/direct-messages/messages`,
          messageData,
          { withCredentials: true }
        );

        // Replace optimistic message with real message from server
        // The socket event will also try to add this message, so we need to handle that
        setMessages((prev) =>
          prev.map((msg) =>
            msg.message_id === optimisticMessage.message_id
              ? {
                  ...response.data.message,
                  isNew: true,
                  status: "sent",
                  isOptimistic: false,
                }
              : msg
          )
        );
      }
    } catch (error) {
      console.error("Error sending message:", error);
      toast.error("Failed to send message");

      // Mark optimistic message as failed instead of removing it
      if (!editingMessage) {
        setMessages((prev) =>
          prev.map((msg) =>
            msg.message_id === optimisticMessage.message_id
              ? { ...msg, status: "failed", isOptimistic: false }
              : msg
          )
        );
      }
    } finally {
      setSending(false);
    }
  };

  // Handle file upload with instant optimistic updates - WhatsApp-like file sharing
  const handleFileUpload = async (files) => {
    if (!selectedConversation) return;

    const uploadPromises = files.map(async (file) => {
      try {
        const fileName = file.name || "Unknown file";
        const uploadToast = toast.loading(`Uploading ${fileName}...`);

        // Create optimistic file message for immediate UI feedback
        const optimisticFileMessage = {
          message_id: `temp-file-${Date.now()}-${Math.random()}`,
          sender_id: user.user_id,
          sender_name: user.name,
          sender_photo: user.user_photo,
          receiver_id: selectedConversation.other_user_id,
          created_at: new Date().toISOString(),
          file_name: fileName,
          file_url: URL.createObjectURL(file), // Temporary local URL for preview
          file_type: file.type,
          file_size: file.size,
          content: null,
          isOptimistic: true,
          isUploading: true,
          status: "uploading",
          reactions: [],
        };

        // Add optimistic message immediately for instant feedback
        setMessages((prev) => [...prev, optimisticFileMessage]);

        // Immediate instant scroll for file uploads
        requestAnimationFrame(() => {
          scrollToBottom(true); // Instant scroll for file messages
        });

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
            onUploadProgress: (progressEvent) => {
              if (progressEvent.total && progressEvent.loaded) {
                const percentCompleted = Math.round(
                  (progressEvent.loaded * 100) / progressEvent.total
                );
                toast.loading(`Uploading ${fileName}... ${percentCompleted}%`, {
                  id: uploadToast,
                });
              }
            },
          }
        );

        // Replace optimistic message with real message from server
        setMessages((prev) =>
          prev.map((msg) =>
            msg.message_id === optimisticFileMessage.message_id
              ? { ...response.data.message, isNew: true, status: "sent" }
              : msg
          )
        );

        // Clean up the temporary URL
        URL.revokeObjectURL(optimisticFileMessage.file_url);

        toast.success(`${fileName} uploaded successfully!`, {
          id: uploadToast,
        });

        return response.data;
      } catch (error) {
        console.error("Error uploading file:", error);

        // Mark optimistic message as failed instead of removing it
        setMessages((prev) =>
          prev.map((msg) =>
            msg.message_id === optimisticFileMessage.message_id
              ? {
                  ...msg,
                  status: "failed",
                  isUploading: false,
                  isOptimistic: false,
                }
              : msg
          )
        );

        // Clean up the temporary URL on error
        URL.revokeObjectURL(optimisticFileMessage.file_url);

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
    // Optimistic update - update UI immediately like TeamChat
    const currentMessage = messages.find((msg) => msg.message_id === messageId);
    if (!currentMessage) return;

    const existingReactions = currentMessage.reactions || [];
    const existingReaction = existingReactions.find(
      (r) => r.emoji === emoji && r.user_id === user.user_id
    );

    let optimisticReactions;
    if (existingReaction) {
      // Remove reaction optimistically
      optimisticReactions = existingReactions.filter(
        (r) => !(r.emoji === emoji && r.user_id === user.user_id)
      );
    } else {
      // Add reaction optimistically
      optimisticReactions = [
        ...existingReactions,
        {
          emoji,
          user_id: user.user_id,
          user_name: user.name,
          created_at: new Date().toISOString(),
        },
      ];
    }

    // Update UI immediately
    setMessages((prev) =>
      prev.map((msg) =>
        msg.message_id === messageId
          ? { ...msg, reactions: optimisticReactions }
          : msg
      )
    );

    try {
      // Send to server
      const response = await axios.post(
        `${
          import.meta.env.VITE_BASE_URL
        }/api/direct-messages/messages/${messageId}/reactions`,
        { emoji },
        { withCredentials: true }
      );

      // Update with server response (in case of conflicts)
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

      // Revert optimistic update on error
      setMessages((prev) =>
        prev.map((msg) =>
          msg.message_id === messageId
            ? { ...msg, reactions: existingReactions }
            : msg
        )
      );
    }
  };

  // Handle message deletion with smooth optimistic updates
  const handleDeleteMessage = async (messageId) => {
    try {
      // Store original message for potential revert
      const originalMessage = messages.find(
        (msg) => msg.message_id === messageId
      );
      if (!originalMessage) return;

      // Optimistically update the message to show as deleted immediately
      setMessages((prev) =>
        prev.map((msg) =>
          msg.message_id === messageId
            ? {
                ...msg,
                isDeleted: true,
                originalContent: msg.originalContent || msg.content,
                content: "This message was deleted",
                isDeleting: true, // Add deleting state for smooth animation
              }
            : msg
        )
      );

      // Remove deleting state after animation
      setTimeout(() => {
        setMessages((prev) =>
          prev.map((msg) =>
            msg.message_id === messageId ? { ...msg, isDeleting: false } : msg
          )
        );
      }, 300);

      await axios.delete(
        `${
          import.meta.env.VITE_BASE_URL
        }/api/direct-messages/messages/${messageId}`,
        { withCredentials: true }
      );

      // Success - no need for toast, the UI already shows the deletion
    } catch (error) {
      console.error("Error deleting message:", error);

      // Revert the optimistic update on error
      setMessages((prev) =>
        prev.map((msg) =>
          msg.message_id === messageId && msg.isDeleted
            ? {
                ...originalMessage,
                isDeleting: false,
              }
            : msg
        )
      );

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

  // Handle delete conversation
  const handleDeleteConversation = async () => {
    if (!conversationToDelete) return;

    setIsDeleting(true);
    try {
      await axios.delete(
        `${import.meta.env.VITE_BASE_URL}/api/direct-messages/conversations/${
          conversationToDelete.other_user_id
        }`,
        { withCredentials: true }
      );

      // The socket event will handle UI updates
      setShowDeleteModal(false);
      setConversationToDelete(null);
    } catch (error) {
      console.error("Error deleting conversation:", error);
      toast.error("Failed to delete conversation");
    } finally {
      setIsDeleting(false);
    }
  };

  // Handle clear chat history
  const handleClearChatHistory = async (conversation) => {
    setIsClearing(true);
    try {
      await axios.post(
        `${import.meta.env.VITE_BASE_URL}/api/direct-messages/conversations/${
          conversation.other_user_id
        }/clear`,
        {},
        { withCredentials: true }
      );

      // Clear messages locally for this user
      if (selectedConversation?.other_user_id === conversation.other_user_id) {
        setMessages([]);
        setSelectedConversation(null);
        setSearchParams({});
      }

      // Remove conversation from sidebar for this user (they can start a new one)
      setConversations((prev) =>
        prev.filter((conv) => conv.other_user_id !== conversation.other_user_id)
      );

      setShowClearModal(false);
      setConversationToClear(null);
      toast.success(
        "Chat history cleared - you can start a new conversation anytime"
      );
    } catch (error) {
      console.error("Error clearing chat history:", error);
      toast.error("Failed to clear chat history");
    } finally {
      setIsClearing(false);
    }
  };

  // Handle drag and drop for the entire chat area - like TeamChat
  const handleChatDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(true);
  };

  const handleChatDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    // Only hide drag overlay if we're leaving the main container
    if (!e.currentTarget.contains(e.relatedTarget)) {
      setDragOver(false);
    }
  };

  const handleChatDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileUpload(Array.from(e.dataTransfer.files));
    }
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
                  className={`conversation-item flex items-center p-3 rounded-lg cursor-pointer group relative ${
                    selectedConversation?.other_user_id ===
                    conversation.other_user_id
                      ? "bg-purple-100 border border-purple-200"
                      : "hover:bg-gray-100"
                  } ${
                    conversation.hasNewMessage ? "conversation-new-message" : ""
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

                  {/* Conversation Actions */}
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setConversationToDelete(conversation);
                        setShowDeleteModal(true);
                      }}
                      className="p-2 hover:bg-red-50 rounded-lg transition-colors"
                      title="Delete conversation"
                    >
                      <Trash2
                        size={16}
                        className="text-gray-400 hover:text-red-600"
                      />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Chat Area */}
      {selectedConversation ? (
        <div
          className="flex-1 flex flex-col transition-all duration-300 ease-in-out relative"
          onDragOver={handleChatDragOver}
          onDragLeave={handleChatDragLeave}
          onDrop={handleChatDrop}
        >
          {/* Chat Header */}
          <div className="bg-white border-b border-gray-200 p-4 flex items-center">
            {/* Sidebar Toggle Button */}
            <button
              onClick={() => setSidebarVisible(!sidebarVisible)}
              className="hidden md:flex mr-3 p-2 hover:bg-gray-100 rounded-lg transition-all cursor-pointer"
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
            </div>
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50 messages-smooth-scroll">
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
                    } ${message.isOptimistic ? "opacity-80" : ""} ${
                      message.isDeleting
                        ? "animate-out slide-out-to-right-2 duration-300"
                        : ""
                    } ${message.status === "failed" ? "opacity-60" : ""}`}
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
                              className={`rounded-2xl p-4 inline-block max-w-xs sm:max-w-md shadow-sm relative transition-all duration-200 ${
                                isOwnMessage
                                  ? "bg-gradient-to-r from-blue-500 to-blue-600 text-white ml-auto rounded-br-md"
                                  : "bg-white border border-gray-200 rounded-bl-md"
                              } ${
                                message.isUploading ||
                                message.status === "uploading"
                                  ? "opacity-75 animate-pulse"
                                  : ""
                              } ${
                                message.status === "failed"
                                  ? "opacity-60 border-red-200"
                                  : ""
                              }`}
                            >
                              {/* Upload progress overlay */}
                              {message.isUploading && (
                                <div className="absolute inset-0 bg-black bg-opacity-20 rounded-2xl flex items-center justify-center">
                                  <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-white"></div>
                                </div>
                              )}

                              {message.file_type?.startsWith("image/") ? (
                                <div className="relative">
                                  <img
                                    src={message.file_url}
                                    alt={message.file_name}
                                    className={`max-w-full h-auto rounded cursor-pointer transition-opacity ${
                                      message.isUploading ? "opacity-50" : ""
                                    }`}
                                    onClick={() => {
                                      if (!message.isUploading) {
                                        window.open(message.file_url, "_blank");
                                      }
                                    }}
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
                                    {message.isUploading && (
                                      <div className="text-xs opacity-75 mt-1">
                                        Uploading...
                                      </div>
                                    )}
                                  </div>
                                  {!message.isUploading && (
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
                                  )}
                                </div>
                              )}
                            </div>
                          ) : (
                            <div
                              className={`text-sm leading-relaxed break-words p-4 rounded-2xl shadow-sm inline-block max-w-xs sm:max-w-md transition-all duration-200 relative ${
                                message.isDeleted
                                  ? "bg-gray-100 text-gray-500 italic"
                                  : isOwnMessage
                                  ? "bg-gradient-to-r from-blue-500 to-blue-600 text-white ml-auto rounded-br-md"
                                  : "bg-white text-gray-800 rounded-bl-md border border-gray-200"
                              } ${
                                message.isOptimistic ||
                                message.status === "sending"
                                  ? "opacity-80"
                                  : ""
                              } ${
                                message.status === "failed"
                                  ? "opacity-60 border-red-200 bg-red-50"
                                  : ""
                              }`}
                            >
                              {message.content}

                              {/* Status indicators for own messages */}
                              {isOwnMessage && !message.isDeleted && (
                                <div className="absolute -bottom-1 -right-1">
                                  {message.status === "sending" ||
                                  message.isOptimistic ? (
                                    <div className="w-3 h-3 bg-gray-300 rounded-full animate-pulse"></div>
                                  ) : message.status === "failed" ? (
                                    <div
                                      className="w-3 h-3 bg-red-400 rounded-full"
                                      title="Failed to send"
                                    ></div>
                                  ) : (
                                    <CheckCheck
                                      size={14}
                                      className="text-blue-200"
                                    />
                                  )}
                                </div>
                              )}
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
            <div className="px-4 pb-2 typing-indicator">
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

                    <div className="relative">
                      <button
                        type="button"
                        onClick={() => setShowFileUpload(true)}
                        onContextMenu={(e) => {
                          e.preventDefault();
                          fileInputRef.current?.click();
                        }}
                        className="p-2 hover:bg-purple-100 rounded-xl text-gray-600 hover:text-purple-600 transition-colors cursor-pointer"
                        title="Attach files - Click to browse, right-click for quick upload, or drag & drop files anywhere"
                      >
                        <Paperclip size={18} className="cursor-pointer" />
                      </button>

                      {/* Quick file input for single file uploads - like TeamChat */}
                      <input
                        ref={fileInputRef}
                        type="file"
                        multiple
                        className="hidden"
                        onChange={(e) => {
                          if (e.target.files?.length) {
                            handleFileUpload(Array.from(e.target.files));
                            e.target.value = ""; // Reset input
                          }
                        }}
                      />
                    </div>
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md p-3 sm:p-4 transition-all duration-300">
          <div className="relative w-full max-w-sm sm:max-w-md glass-dark rounded-2xl sm:rounded-3xl overflow-hidden animate-fadeIn hover:scale-[1.01] transition-transform mx-auto">
            <div className="absolute inset-0 cosmic-bg"></div>
            <div className="relative p-4 sm:p-6">
              {/* Close Button */}
              <button
                onClick={() => {
                  setShowNewConversation(false);
                  setMemberSearchQuery("");
                }}
                className="absolute top-3 right-3 sm:top-4 sm:right-4 text-gray-400 hover:text-white transition-all cursor-pointer active:scale-95 p-1.5 sm:p-2 rounded-full hover:bg-gray-800/80 hover:rotate-90 transform duration-300"
              >
                <X size={18} className="sm:w-5 sm:h-5" />
              </button>

              {/* Header */}
              <div className="text-center mb-4 sm:mb-6">
                <div className="w-12 h-12 sm:w-16 sm:h-16 glass-button-enhanced rounded-xl sm:rounded-2xl flex items-center justify-center mx-auto mb-3 sm:mb-4">
                  <MessageCircle size={20} className="text-purple-400 sm:w-6 sm:h-6" />
                </div>
                <h2 className="text-lg sm:text-xl font-bold mb-2 text-white">
                  New Conversation
                </h2>
                <p className="text-gray-300 text-sm">
                  Start a conversation with a team member
                </p>
              </div>

              {/* Search members */}
              <div className="relative mb-4">
                <Search
                  size={16}
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                />
                <input
                  type="text"
                  placeholder="Search members..."
                  value={memberSearchQuery}
                  onChange={(e) => setMemberSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 sm:py-3 rounded-xl glass-effect text-white text-sm focus:ring-2 focus:ring-violet-500 focus:border-violet-500/50 focus:outline-none placeholder-gray-400 transition-all duration-200"
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
                      className="flex items-center p-3 hover:bg-gray-800/50 rounded-xl cursor-pointer transition-all duration-200 glass-button"
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
                        <h3 className="font-medium text-white text-sm">
                          {member.name}
                        </h3>
                        <p className="text-xs text-gray-400">{member.email}</p>
                      </div>
                    </div>
                  ))}
                {organizationMembers.filter(
                  (member) =>
                    member.name
                      .toLowerCase()
                      .includes(memberSearchQuery.toLowerCase()) ||
                    member.email
                      .toLowerCase()
                      .includes(memberSearchQuery.toLowerCase())
                ).length === 0 && (
                  <div className="text-center py-8">
                    <MessageCircle size={32} className="mx-auto mb-3 text-gray-500" />
                    <p className="text-gray-400 text-sm">
                      {memberSearchQuery ? "No members found" : "No members available"}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Drag and Drop Overlay - like TeamChat */}
      {dragOver && selectedConversation && (
        <div className="absolute inset-0 bg-purple-500/10 backdrop-blur-sm border-2 border-dashed border-purple-400 rounded-lg flex items-center justify-center z-40">
          <div className="text-center p-8">
            <div className="text-6xl mb-4">📁</div>
            <h3 className="text-xl font-semibold text-purple-700 mb-2">
              Drop files here
            </h3>
            <p className="text-purple-600">
              Release to upload files to {selectedConversation.other_user_name}
            </p>
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

      {/* Delete Conversation Modal */}
      {showDeleteModal && conversationToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
            <div className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                  <AlertTriangle size={24} className="text-red-600" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">
                    Delete Conversation
                  </h2>
                  <p className="text-sm text-gray-600">
                    This action cannot be undone
                  </p>
                </div>
              </div>

              <div className="mb-6">
                <p className="text-gray-700 mb-4">
                  Are you sure you want to delete your entire conversation with{" "}
                  <span className="font-semibold">
                    {conversationToDelete.other_user_name}
                  </span>
                  ? This will permanently remove all messages, files, and
                  reactions from this conversation for both users.
                </p>

                <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                  <p className="text-sm text-red-800 mb-2">
                    To confirm deletion, please type{" "}
                    <span className="font-mono font-semibold bg-red-100 px-1 rounded">
                      {conversationToDelete.other_user_name}
                    </span>{" "}
                    below:
                  </p>
                  <input
                    type="text"
                    value={deleteConfirmText}
                    onChange={(e) => setDeleteConfirmText(e.target.value)}
                    placeholder={conversationToDelete.other_user_name}
                    className="w-full px-3 py-2 border border-red-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
                    disabled={isDeleting}
                  />
                </div>
              </div>

              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => {
                    setShowDeleteModal(false);
                    setConversationToDelete(null);
                    setDeleteConfirmText("");
                  }}
                  className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                  disabled={isDeleting}
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleDeleteConversation(conversationToDelete)}
                  disabled={
                    deleteConfirmText !==
                      conversationToDelete.other_user_name || isDeleting
                  }
                  className={`px-4 py-2 rounded-lg transition-colors flex items-center gap-2 ${
                    deleteConfirmText ===
                      conversationToDelete.other_user_name && !isDeleting
                      ? "bg-red-600 hover:bg-red-700 text-white"
                      : "bg-gray-300 text-gray-500 cursor-not-allowed"
                  }`}
                >
                  {isDeleting && (
                    <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-white"></div>
                  )}
                  {isDeleting ? "Deleting..." : "Delete Conversation"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Messages;
