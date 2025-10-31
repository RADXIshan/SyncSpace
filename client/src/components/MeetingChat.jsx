import { useState, useEffect, useRef, useCallback } from "react";
import { useAuth } from "../context/AuthContext";
import { useSocket } from "../context/SocketContext";
import axios from "axios";
import {
  Send,
  Smile,
  Reply,
  Edit2,
  Trash2,
  X,
  Heart,
  ThumbsUp,
  MessageCircle,
} from "lucide-react";
import { toast } from "react-hot-toast";
import EmojiPicker from "./EmojiPicker";
import MessageReactions from "./MessageReactions";
import TypingIndicator from "./TypingIndicator";

const MeetingChat = ({ roomId, isVisible, onToggle, participantCount = 0 }) => {
  const { user } = useAuth();
  const { socket, isConnected } = useSocket();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [replyingTo, setReplyingTo] = useState(null);
  const [editingMessage, setEditingMessage] = useState(null);
  const [typingUsers, setTypingUsers] = useState([]);

  const [unreadCount, setUnreadCount] = useState(0);
  const [isAtBottom, setIsAtBottom] = useState(true);

  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  const emojiPickerRef = useRef(null);
  const messagesContainerRef = useRef(null);

  // Optimized scroll to bottom
  const scrollToBottom = useCallback((instant = false) => {
    if (messagesEndRef.current) {
      if (instant) {
        messagesEndRef.current.scrollIntoView({ behavior: "auto" });
      } else {
        messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
      }
    }
  }, []);

  // Check if user is at bottom of messages
  const checkIfAtBottom = useCallback(() => {
    if (messagesContainerRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = messagesContainerRef.current;
      const atBottom = scrollTop + clientHeight >= scrollHeight - 50; // 50px threshold
      setIsAtBottom(atBottom);
    }
  }, []);

  // Fetch meeting messages
  const fetchMessages = useCallback(async () => {
    if (!roomId) return;

    try {
      setLoading(true);
      const response = await axios.get(
        `${import.meta.env.VITE_BASE_URL}/api/meeting-chat/${roomId}/messages`,
        { withCredentials: true }
      );
      setMessages(response.data.messages || []);
      
      // Reset unread count when fetching messages
      setUnreadCount(0);
    } catch (error) {
      if (error.response?.status !== 404) {
        toast.error("Failed to load meeting messages");
      }
    } finally {
      setLoading(false);
    }
  }, [roomId]);

  // Socket event handlers
  useEffect(() => {
    if (!socket || !isConnected || !roomId) {
      return;
    }

    // Join meeting chat room
    socket.emit("join_meeting_chat", roomId);

    // Listen for new messages
    const handleNewMessage = (message) => {
      setMessages((prev) => [...prev, { ...message, isNew: true }]);

      // Increment unread count if chat is not visible or user is not at bottom
      if (!isVisible || !isAtBottom) {
        setUnreadCount((prev) => prev + 1);
      }

      // Auto-scroll if user is at bottom or chat is visible
      if (isVisible && isAtBottom) {
        requestAnimationFrame(() => {
          scrollToBottom(true);
        });
      }

      // Remove the isNew flag after animation
      setTimeout(() => {
        setMessages((prev) =>
          prev.map((msg) =>
            msg.message_id === message.message_id
              ? { ...msg, isNew: false }
              : msg
          )
        );
      }, 500);
    };

    // Listen for message updates
    const handleMessageUpdate = (updatedMessage) => {
      setMessages((prev) =>
        prev.map((msg) =>
          msg.message_id === updatedMessage.message_id ? updatedMessage : msg
        )
      );
    };

    // Listen for message deletions
    const handleMessageDelete = (messageId) => {
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
      if (data.userId !== user.user_id) {
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

    socket.on("new_meeting_message", handleNewMessage);
    socket.on("meeting_message_updated", handleMessageUpdate);
    socket.on("meeting_message_deleted", handleMessageDelete);
    socket.on("meeting_user_typing", handleUserTyping);
    socket.on("meeting_user_stopped_typing", handleUserStoppedTyping);
    socket.on("meeting_reaction_updated", handleReactionUpdate);

    return () => {
      socket.off("new_meeting_message", handleNewMessage);
      socket.off("meeting_message_updated", handleMessageUpdate);
      socket.off("meeting_message_deleted", handleMessageDelete);
      socket.off("meeting_user_typing", handleUserTyping);
      socket.off("meeting_user_stopped_typing", handleUserStoppedTyping);
      socket.off("meeting_reaction_updated", handleReactionUpdate);
      socket.emit("leave_meeting_chat", roomId);
    };
  }, [socket, isConnected, roomId, user?.user_id, isVisible, isAtBottom, scrollToBottom]);

  // Initialize data
  useEffect(() => {
    fetchMessages();
  }, [fetchMessages]);

  // Reset unread count when chat becomes visible
  useEffect(() => {
    if (isVisible) {
      setUnreadCount(0);
      // Scroll to bottom when chat becomes visible
      setTimeout(() => {
        scrollToBottom(true);
      }, 100);
    }
  }, [isVisible, scrollToBottom]);

  // Handle click outside for emoji picker
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        emojiPickerRef.current &&
        !emojiPickerRef.current.contains(event.target)
      ) {
        setShowEmojiPicker(false);
      }
    };

    if (showEmojiPicker) {
      document.addEventListener("mousedown", handleClickOutside);
      return () =>
        document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [showEmojiPicker]);

  // Auto-scroll on new messages
  useEffect(() => {
    if (messages.length > 0 && isVisible) {
      const lastMessage = messages[messages.length - 1];
      const shouldScroll =
        lastMessage.isNew || lastMessage.user_id === user.user_id;

      if (shouldScroll && isAtBottom) {
        requestAnimationFrame(() => {
          scrollToBottom(true);
        });
      }
    }
  }, [messages.length, user.user_id, scrollToBottom, isVisible, isAtBottom]);

  // Cleanup typing timeout
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      if (socket && isConnected && roomId) {
        socket.emit("meeting_typing_stop", { roomId });
      }
    };
  }, [roomId, socket, isConnected]);

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

  // Handle typing indicators
  const handleTypingStart = useCallback(() => {
    if (socket && isConnected && roomId) {
      socket.emit("meeting_typing_start", {
        roomId,
        userName: user.name,
      });
    }
  }, [socket, isConnected, roomId, user?.name]);

  const handleTypingStop = useCallback(() => {
    if (socket && isConnected && roomId) {
      socket.emit("meeting_typing_stop", { roomId });
    }
  }, [socket, isConnected, roomId]);

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
      }, 1500);
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
    if (!newMessage.trim() && !replyingTo) return;

    const messageContent = newMessage.trim();
    const currentReplyingTo = replyingTo;

    // Clear input immediately
    setNewMessage("");
    setReplyingTo(null);
    handleTypingStop();

    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }

    setSending(true);
    try {
      const messageData = {
        content: messageContent,
        room_id: roomId,
        reply_to: currentReplyingTo?.message_id || null,
      };

      if (editingMessage) {
        // Update existing message
        await axios.put(
          `${import.meta.env.VITE_BASE_URL}/api/meeting-chat/messages/${
            editingMessage.message_id
          }`,
          { content: messageContent },
          { withCredentials: true }
        );
        setEditingMessage(null);
      } else {
        // Send new message
        await axios.post(
          `${import.meta.env.VITE_BASE_URL}/api/meeting-chat/messages`,
          messageData,
          { withCredentials: true }
        );
      }
    } catch (error) {
      toast.error("Failed to send message");
    } finally {
      setSending(false);
    }
  };

  // Handle emoji selection
  const handleEmojiSelect = (emoji) => {
    setNewMessage((prev) => prev + emoji);
    setShowEmojiPicker(false);
    textareaRef.current?.focus();
  };



  // Handle message reactions
  const handleReaction = async (messageId, emoji) => {
    const currentMessage = messages.find((msg) => msg.message_id === messageId);
    if (!currentMessage) return;

    const existingReactions = currentMessage.reactions || [];
    const existingReaction = existingReactions.find(
      (r) => r.emoji === emoji && r.user_id === user.user_id
    );

    let optimisticReactions;
    if (existingReaction) {
      optimisticReactions = existingReactions.filter(
        (r) => !(r.emoji === emoji && r.user_id === user.user_id)
      );
    } else {
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
      const response = await axios.post(
        `${import.meta.env.VITE_BASE_URL}/api/meeting-chat/messages/${messageId}/reactions`,
        { emoji },
        { withCredentials: true }
      );

      // Update with server response
      setMessages((prev) =>
        prev.map((msg) =>
          msg.message_id === messageId
            ? { ...msg, reactions: response.data.reactions || [] }
            : msg
        )
      );
    } catch (error) {
      toast.error("Failed to add reaction");

      // Revert optimistic update
      setMessages((prev) =>
        prev.map((msg) =>
          msg.message_id === messageId
            ? { ...msg, reactions: existingReactions }
            : msg
        )
      );
    }
  };

  // Handle message deletion
  const handleDeleteMessage = async (messageId) => {
    const deleteToast = toast.loading("Deleting message...");

    try {
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

      await axios.delete(
        `${import.meta.env.VITE_BASE_URL}/api/meeting-chat/messages/${messageId}`,
        { withCredentials: true }
      );

      toast.success("Message deleted", { id: deleteToast });
    } catch (error) {

      setMessages((prev) =>
        prev.map((msg) =>
          msg.message_id === messageId && msg.isDeleted
            ? {
                ...msg,
                isDeleted: false,
                content: msg.originalContent || msg.content,
              }
            : msg
        )
      );

      toast.error("Failed to delete message", { id: deleteToast });
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
        return "Invalid date";
      }
    } catch (error) {
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



  if (!isVisible) {
    return (
      <div className="fixed bottom-24 right-4 z-50">
        <button
          onClick={onToggle}
          className="relative bg-purple-600 hover:bg-purple-700 text-white p-4 rounded-full shadow-lg transition-all duration-300 group cursor-pointer"
          title="Open meeting chat"
        >
          <MessageCircle size={24} />
          {unreadCount > 0 && (
            <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full min-w-[20px] h-5 flex items-center justify-center px-1">
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          )}
          <div className="absolute bottom-full right-0 mb-2 px-3 py-1 bg-black/80 text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap">
            Meeting Chat {participantCount > 0 && `(${participantCount})`}
          </div>
        </button>
      </div>
    );
  }

  return (
    <div className="fixed bottom-0 right-4 w-96 h-[600px] bg-black/80 backdrop-blur-lg border border-white/20 rounded-t-2xl shadow-2xl z-50 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-white/20">
        <div className="flex items-center gap-3">
          <MessageCircle size={20} className="text-purple-400" />
          <div>
            <h3 className="text-white font-semibold">Meeting Chat</h3>
            <p className="text-white/60 text-sm">
              {participantCount} participant{participantCount !== 1 ? "s" : ""}
            </p>
          </div>
        </div>
        <button
          onClick={onToggle}
          className="p-2 hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
          title="Close chat"
        >
          <X size={18} className="text-white/70" />
        </button>
      </div>

      {/* Messages */}
      <div
        ref={messagesContainerRef}
        className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-none"
        onScroll={checkIfAtBottom}
      >
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-white/60">
            <MessageCircle size={48} className="mb-4 opacity-50" />
            <p className="text-center">
              No messages yet.
              <br />
              Start the conversation!
            </p>
          </div>
        ) : (
          messages.map((message) => (
            <div
              key={message.message_id}
              className={`group ${
                message.isNew ? "animate-fadeIn" : ""
              } ${message.user_id === user.user_id ? "ml-8" : "mr-8"}`}
            >
              <div
                className={`flex gap-3 ${
                  message.user_id === user.user_id
                    ? "flex-row-reverse"
                    : "flex-row"
                }`}
              >
                {/* Avatar */}
                <div className="flex-shrink-0">
                  {message.user_photo ? (
                    <img
                      src={message.user_photo}
                      alt={message.user_name}
                      className="w-8 h-8 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-purple-600 flex items-center justify-center">
                      <span className="text-xs font-bold text-white">
                        {(message.user_name || "U").charAt(0).toUpperCase()}
                      </span>
                    </div>
                  )}
                </div>

                {/* Message Content */}
                <div
                  className={`flex-1 ${
                    message.user_id === user.user_id
                      ? "text-right"
                      : "text-left"
                  }`}
                >
                  {/* User name and time */}
                  <div
                    className={`flex items-center gap-2 mb-1 ${
                      message.user_id === user.user_id
                        ? "justify-end"
                        : "justify-start"
                    }`}
                  >
                    <span className="text-white/80 text-sm font-medium">
                      {message.user_name || "Unknown User"}
                    </span>
                    <span className="text-white/50 text-xs">
                      {formatTime(message.created_at)}
                    </span>
                  </div>

                  {/* Reply indicator */}
                  {message.reply_to && (
                    <div className="mb-2 p-2 bg-white/5 rounded-lg border-l-2 border-purple-400">
                      <p className="text-white/60 text-xs">
                        Replying to {message.reply_to_user_name}
                      </p>
                      <p className="text-white/80 text-sm truncate">
                        {message.reply_to_content}
                      </p>
                    </div>
                  )}

                  {/* Message bubble */}
                  <div
                    className={`inline-block max-w-full p-3 rounded-2xl ${
                      message.user_id === user.user_id
                        ? "bg-purple-600 text-white"
                        : "bg-white/10 text-white"
                    } ${message.isDeleted ? "opacity-60 italic" : ""}`}
                  >
                    {/* Text message */}
                    <p className="whitespace-pre-wrap break-words">
                      {message.content}
                    </p>
                  </div>

                  {/* Message actions */}
                  {!message.isDeleted && (
                    <div
                      className={`flex items-center gap-2 mt-1 opacity-0 group-hover:opacity-100 transition-opacity ${
                        message.user_id === user.user_id
                          ? "justify-end"
                          : "justify-start"
                      }`}
                    >
                      <button
                        onClick={() => handleReaction(message.message_id, "👍")}
                        className="p-1 hover:bg-white/10 rounded text-white/60 hover:text-white transition-colors cursor-pointer"
                        title="Like"
                      >
                        <ThumbsUp size={14} />
                      </button>
                      <button
                        onClick={() => handleReaction(message.message_id, "❤️")}
                        className="p-1 hover:bg-white/10 rounded text-white/60 hover:text-white transition-colors cursor-pointer"
                        title="Love"
                      >
                        <Heart size={14} />
                      </button>
                      <button
                        onClick={() => handleReply(message)}
                        className="p-1 hover:bg-white/10 rounded text-white/60 hover:text-white transition-colors cursor-pointer"
                        title="Reply"
                      >
                        <Reply size={14} />
                      </button>
                      {message.user_id === user.user_id && (
                        <>
                          <button
                            onClick={() => handleEditMessage(message)}
                            className="p-1 hover:bg-white/10 rounded text-white/60 hover:text-white transition-colors cursor-pointer"
                            title="Edit"
                          >
                            <Edit2 size={14} />
                          </button>
                          <button
                            onClick={() =>
                              handleDeleteMessage(message.message_id)
                            }
                            className="p-1 hover:bg-white/10 rounded text-red-400 hover:text-red-300 transition-colors cursor-pointer"
                            title="Delete"
                          >
                            <Trash2 size={14} />
                          </button>
                        </>
                      )}
                    </div>
                  )}

                  {/* Reactions */}
                  {!message.isDeleted && (
                    <div className={`mt-1 ${
                      message.user_id === user.user_id ? "text-right" : "text-left"
                    }`}>
                      <MessageReactions
                        reactions={message.reactions || []}
                        onReactionClick={(emoji) =>
                          handleReaction(message.message_id, emoji)
                        }
                        currentUserId={user.user_id}
                        isOwnMessage={message.user_id === user.user_id}
                        zIndex={9999}
                        theme="dark"
                        useViewportPositioning={true}
                        containerBounds={{
                          width: window.innerWidth,
                          height: window.innerHeight,
                          left: 0,
                          top: 0,
                          right: window.innerWidth,
                          bottom: window.innerHeight
                        }}
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))
        )}

        {/* Typing indicator */}
        {typingUsers.length > 0 && (
          <TypingIndicator users={typingUsers} />
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Reply indicator */}
      {replyingTo && (
        <div className="px-4 py-2 bg-white/5 border-t border-white/10">
          <div className="flex items-center justify-between">
            <div className="flex-1 min-w-0">
              <p className="text-white/60 text-xs">
                Replying to {replyingTo.user_name}
              </p>
              <p className="text-white/80 text-sm truncate">
                {replyingTo.content}
              </p>
            </div>
            <button
              onClick={() => setReplyingTo(null)}
              className="p-1 hover:bg-white/10 rounded text-white/60 hover:text-white transition-colors cursor-pointer"
            >
              <X size={16} />
            </button>
          </div>
        </div>
      )}

      {/* Input */}
      <div className="p-4 border-t border-white/20">
        <form onSubmit={sendMessage} className="flex items-center gap-3">
          <div className="flex-1 relative">
            <textarea
              ref={textareaRef}
              value={newMessage}
              onChange={handleInputChange}
              placeholder={
                editingMessage ? "Edit message..." : "Type a message..."
              }
              className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 pr-12 text-white placeholder-white/50 resize-none focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent max-h-[120px] scrollbar-none"
              rows={1}
              disabled={sending}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  sendMessage(e);
                }
              }}
            />
            <div className="absolute right-3 bottom-3" ref={emojiPickerRef}>
              <button
                type="button"
                onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                className="p-1 hover:bg-white/10 rounded-lg transition-colors text-white/60 hover:text-white cursor-pointer"
                title="Add emoji"
              >
                <Smile size={18} />
              </button>
              {showEmojiPicker && (
                <div className="absolute bottom-full right-0 mb-2 z-50 transform -translate-x-1/2">
                  <EmojiPicker onEmojiSelect={handleEmojiSelect} />
                </div>
              )}
            </div>
          </div>
          <button
            type="submit"
            disabled={(!newMessage.trim() && !replyingTo) || sending}
            className="p-3 bg-purple-600 hover:bg-purple-700 disabled:bg-white/10 disabled:text-white/30 text-white rounded-xl transition-colors cursor-pointer disabled:cursor-not-allowed flex-shrink-0"
            title="Send message"
          >
            {sending ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <Send size={18} />
            )}
          </button>
        </form>



      </div>
    </div>
  );
};

export default MeetingChat;