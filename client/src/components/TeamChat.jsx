import { useState, useEffect, useRef, useCallback } from "react";
import { useAuth } from "../context/AuthContext";
import { useSocket } from "../context/SocketContext";
import axios from "axios";
import {
  Hash,
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
} from "lucide-react";
import { toast } from "react-hot-toast";
import EmojiPicker from "./EmojiPicker";
import MessageReactions from "./MessageReactions";
import TypingIndicator from "./TypingIndicator";
import MentionsList from "./MentionsList";

const TeamChat = ({ channelId, channelName }) => {
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
  const [showMentions, setShowMentions] = useState(false);
  const [mentionQuery, setMentionQuery] = useState("");
  const [mentionPosition, setMentionPosition] = useState(0);
  const [selectedMentionIndex, setSelectedMentionIndex] = useState(0);
  const [channelMembers, setChannelMembers] = useState([]);

  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const fileInputRef = useRef(null);
  const emojiPickerRef = useRef(null);
  const mentionsRef = useRef(null);

  // Scroll to bottom
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  // Fetch messages
  const fetchMessages = useCallback(async () => {
    if (!channelId || !user?.org_id) return;

    try {
      setLoading(true);
      const response = await axios.get(
        `${import.meta.env.VITE_BASE_URL}/api/channels/${channelId}/messages`,
        { withCredentials: true }
      );
      setMessages(response.data.messages || []);
    } catch (error) {
      console.error("Error fetching messages:", error);
      toast.error("Failed to load messages");
    } finally {
      setLoading(false);
    }
  }, [channelId, user?.org_id]);

  // Fetch channel members for mentions
  const fetchChannelMembers = useCallback(async () => {
    if (!channelId || !user?.org_id) return;

    try {
      const response = await axios.get(
        `${import.meta.env.VITE_BASE_URL}/api/channels/${channelId}/members`,
        { withCredentials: true }
      );
      const members = response.data.members || [];
      setChannelMembers(members);
    } catch (error) {
      console.error("Error fetching channel members:", error);
      toast.error("Failed to load channel members");
    }
  }, [channelId, user?.org_id]);

  // Socket event handlers
  useEffect(() => {
    if (!socket || !isConnected || !channelId) return;

    // Join channel room
    socket.emit("join_channel", channelId);

    // Listen for new messages
    const handleNewMessage = (message) => {
      setMessages((prev) => [...prev, { ...message, isNew: true }]);
      scrollToBottom();

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
      setMessages((prev) => prev.filter((msg) => msg.message_id !== messageId));
    };

    // Listen for typing indicators
    const handleUserTyping = (data) => {
      if (data.userId !== user.user_id) {
        setTypingUsers((prev) => {
          const existing = prev.find((u) => u.userId === data.userId);
          if (!existing) {
            return [...prev, { userId: data.userId, userName: data.userName }];
          }
          return prev;
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

    socket.on("new_message", handleNewMessage);
    socket.on("message_updated", handleMessageUpdate);
    socket.on("message_deleted", handleMessageDelete);
    socket.on("user_typing", handleUserTyping);
    socket.on("user_stopped_typing", handleUserStoppedTyping);
    socket.on("reaction_updated", handleReactionUpdate);

    // Listen for mention notifications
    socket.on("user_mentioned", (data) => {
      if (data.mentionedUserId === user.user_id) {
        toast.success(
          `${data.mentionedBy} mentioned you in #${data.channelName}`,
          {
            duration: 5000,
            icon: "👋",
          }
        );
      }
    });

    return () => {
      socket.off("new_message", handleNewMessage);
      socket.off("message_updated", handleMessageUpdate);
      socket.off("message_deleted", handleMessageDelete);
      socket.off("user_typing", handleUserTyping);
      socket.off("user_stopped_typing", handleUserStoppedTyping);
      socket.off("reaction_updated", handleReactionUpdate);
      socket.off("user_mentioned");
      socket.emit("leave_channel", channelId);
    };
  }, [socket, isConnected, channelId, user?.user_id, scrollToBottom]);

  // Initialize data
  useEffect(() => {
    fetchMessages();
    fetchChannelMembers();
  }, [fetchMessages, fetchChannelMembers]);

  // Ensure members are fetched when channel changes
  useEffect(() => {
    if (channelId && user?.org_id) {
      fetchChannelMembers();
    }
  }, [channelId, user?.org_id]);

  // Debug state changes
  useEffect(() => {
    console.log("🔄 Mentions state:", {
      showMentions,
      query: mentionQuery,
      membersCount: channelMembers.length,
    });
  }, [showMentions, mentionQuery, channelMembers.length]);

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

  // Handle click outside for mentions
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        mentionsRef.current &&
        !mentionsRef.current.contains(event.target) &&
        textareaRef.current &&
        !textareaRef.current.contains(event.target)
      ) {
        setShowMentions(false);
        setMentionQuery("");
      }
    };

    if (showMentions) {
      document.addEventListener("mousedown", handleClickOutside);
      return () =>
        document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [showMentions]);

  // Auto-scroll on new messages
  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  // Handle typing indicators
  const handleTypingStart = useCallback(() => {
    if (socket && isConnected) {
      socket.emit("typing_start", {
        channelId,
        userName: user.name,
      });
    }
  }, [socket, isConnected, channelId, user?.name]);

  const handleTypingStop = useCallback(() => {
    if (socket && isConnected) {
      socket.emit("typing_stop", { channelId });
    }
  }, [socket, isConnected, channelId]);

  // Handle message input changes
  const handleInputChange = (e) => {
    const value = e.target.value;
    setNewMessage(value);

    // Handle mentions - support multi-word names
    const cursorPosition = e.target.selectionStart;
    const textBeforeCursor = value.substring(0, cursorPosition);
    const mentionMatch = textBeforeCursor.match(/@([a-zA-Z0-9_\s]*)$/);

    if (mentionMatch) {
      const query = mentionMatch[1];
      console.log("🎯 Mention triggered:", {
        query,
        membersCount: channelMembers.length,
      });
      setShowMentions(true);
      setMentionQuery(query);
      setMentionPosition(cursorPosition);
      setSelectedMentionIndex(0); // Reset selection
    } else {
      setShowMentions(false);
      setMentionQuery("");
      setSelectedMentionIndex(0);
    }

    // Handle typing indicators
    handleTypingStart();

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      handleTypingStop();
    }, 1000);

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

    setSending(true);
    try {
      const messageData = {
        content: newMessage.trim(),
        channel_id: channelId,
        reply_to: replyingTo?.message_id || null,
        mentions: extractMentions(newMessage),
      };

      if (editingMessage) {
        // Update existing message
        await axios.put(
          `${import.meta.env.VITE_BASE_URL}/api/messages/${
            editingMessage.message_id
          }`,
          { content: newMessage.trim() },
          { withCredentials: true }
        );
        setEditingMessage(null);
      } else {
        // Send new message
        await axios.post(
          `${import.meta.env.VITE_BASE_URL}/api/messages`,
          messageData,
          { withCredentials: true }
        );
      }

      setNewMessage("");
      setReplyingTo(null);
      setShowMentions(false);
      handleTypingStop();

      if (textareaRef.current) {
        textareaRef.current.style.height = "auto";
      }
    } catch (error) {
      console.error("Error sending message:", error);
      toast.error("Failed to send message");
    } finally {
      setSending(false);
    }
  };

  // Extract mentions from message
  const extractMentions = (text) => {
    const mentions = [];

    // Find all @mentions in the text
    channelMembers.forEach((member) => {
      const mentionPattern = new RegExp(
        `@${member.name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}(?=\\s|$)`,
        "gi"
      );
      if (mentionPattern.test(text)) {
        mentions.push(member.user_id);
      }
    });

    return [...new Set(mentions)]; // Remove duplicates
  };

  // Handle mention selection
  const handleMentionSelect = (member) => {
    const beforeMention = newMessage.substring(
      0,
      mentionPosition - mentionQuery.length - 1
    );
    const afterMention = newMessage.substring(mentionPosition);
    const newText = `${beforeMention}@${member.name} ${afterMention}`;

    setNewMessage(newText);
    setShowMentions(false);
    setMentionQuery("");

    // Set cursor position after the mention
    setTimeout(() => {
      if (textareaRef.current) {
        const newCursorPosition = beforeMention.length + member.name.length + 2; // +2 for @ and space
        textareaRef.current.focus();
        textareaRef.current.setSelectionRange(
          newCursorPosition,
          newCursorPosition
        );
      }
    }, 0);
  };

  // Handle emoji selection
  const handleEmojiSelect = (emoji) => {
    setNewMessage((prev) => prev + emoji);
    setShowEmojiPicker(false);
    textareaRef.current?.focus();
  };

  // Handle file upload
  const handleFileUpload = async (files) => {
    for (const file of files) {
      try {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("channel_id", channelId);

        await axios.post(
          `${import.meta.env.VITE_BASE_URL}/api/messages/file`,
          formData,
          {
            withCredentials: true,
            headers: { "Content-Type": "multipart/form-data" },
          }
        );
      } catch (error) {
        console.error("Error uploading file:", error);
        toast.error(`Failed to upload ${file.name}`);
      }
    }
    setShowFileUpload(false);
  };

  // Handle message reactions
  const handleReaction = async (messageId, emoji) => {
    // Optimistic update - update UI immediately
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
        `${import.meta.env.VITE_BASE_URL}/api/messages/${messageId}/reactions`,
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

  // Handle message deletion
  const handleDeleteMessage = async (messageId) => {
    try {
      await axios.delete(
        `${import.meta.env.VITE_BASE_URL}/api/messages/${messageId}`,
        { withCredentials: true }
      );

      // Update local state immediately for better UX
      setMessages((prev) => prev.filter((msg) => msg.message_id !== messageId));
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

  // Format timestamp
  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now - date;

    if (diff < 60000) return "Just now";
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (date.toDateString() === now.toDateString()) {
      return date.toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
      });
    }
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  };

  // Render message content with mentions
  const renderMessageContent = (content) => {
    if (!content) return "";

    let processedContent = content;

    // Replace mentions for each member
    channelMembers.forEach((member) => {
      const mentionPattern = new RegExp(
        `@${member.name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}(?=\\s|$)`,
        "gi"
      );
      processedContent = processedContent.replace(mentionPattern, (match) => {
        return `<span class="inline-flex items-center text-blue-600 font-semibold bg-blue-100 px-2 py-1 rounded-md border border-blue-200 text-sm">${match}</span>`;
      });
    });

    return processedContent;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-purple-600"></div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-gradient-to-b from-gray-50 to-white">
      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {/* Welcome Message */}
        <div className="bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50 border border-purple-200 rounded-2xl p-8 text-center shadow-sm">
          <div className="bg-white w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 border-2 border-purple-300 shadow-lg">
            <Hash size={28} className="text-purple-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-3">
            Welcome to #{channelName}
          </h2>
          <p className="text-gray-700 text-lg">
            This is the beginning of the{" "}
            <span className="text-purple-600 font-semibold">
              #{channelName}
            </span>{" "}
            channel. Start the conversation! 🚀
          </p>
        </div>

        {/* Messages */}
        {messages.map((message, index) => {
          const showAvatar =
            index === 0 || messages[index - 1].user_id !== message.user_id;
          const isOwnMessage = message.user_id === user.user_id;

          return (
            <div
              key={message.message_id}
              className={`group transition-all duration-200 hover:bg-gray-50 rounded-lg p-2 -m-2 ${
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
                  message.user_photo ? (
                    <img
                      src={message.user_photo}
                      alt={message.user_name}
                      className="w-10 h-10 rounded-full object-cover border-2 border-white shadow-md flex-shrink-0 transition-transform hover:scale-105"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-600 to-indigo-600 flex items-center justify-center text-white font-bold text-sm border-2 border-white shadow-md flex-shrink-0 transition-transform hover:scale-105">
                      {message.user_name?.charAt(0) || "U"}
                    </div>
                  )
                ) : (
                  <div className="w-10 flex-shrink-0"></div>
                )}

                <div
                  className={`flex-1 min-w-0 ${
                    isOwnMessage ? "text-right" : ""
                  }`}
                >
                  {/* Header with action buttons */}
                  {showAvatar && (
                    <div
                      className={`flex items-center gap-2 mb-1 justify-start ${
                        isOwnMessage
                          ? "flex-row-reverse"
                          : ""
                      }`}
                    >
                      <div
                        className={`flex items-center gap-2 ${
                          isOwnMessage ? "flex-row-reverse" : ""
                        }`}
                      >
                        <span className="font-semibold text-gray-900 text-sm">
                          {isOwnMessage ? "You" : message.user_name}
                        </span>
                        <span className="text-xs text-gray-500">
                          {formatTime(message.created_at)}
                        </span>
                      </div>

                      {/* Message actions in header */}
                      <div className="opacity-0 group-hover:opacity-100 transition-all duration-200">
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
                            className="p-1.5 hover:bg-red-50 rounded-full text-gray-500 hover:text-red-600 transition-colors"
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
                                onClick={() => handleEditMessage(message)}
                                className="p-1.5 hover:bg-blue-50 rounded-full text-gray-500 hover:text-blue-600 transition-colors"
                                title="Edit"
                              >
                                <Edit2 size={12} />
                              </button>
                              <button
                                onClick={() =>
                                  handleDeleteMessage(message.message_id)
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
                        Replying to {message.reply_to_user_name}
                      </div>
                      <div className="text-sm text-gray-800 truncate">
                        {message.reply_to_content}
                      </div>
                    </div>
                  )}

                  {/* Message content wrapper */}
                  <div
                    className={`flex flex-col ${
                      isOwnMessage ? "items-end" : "items-start"
                    }`}
                  >
                    <div className="min-w-0">
                      {message.file_url ? (
                        <div
                          className={`rounded-2xl p-4 inline-block max-w-xs sm:max-w-md shadow-sm ${
                            isOwnMessage
                              ? "bg-gradient-to-r from-blue-500 to-blue-600 text-white ml-auto rounded-br-md"
                              : "bg-white border border-gray-200 rounded-bl-md"
                          }`}
                        >
                          {message.file_type?.startsWith("image/") ? (
                            <img
                              src={message.file_url}
                              alt={message.file_name}
                              className="max-w-full h-auto rounded cursor-pointer"
                              onClick={() =>
                                window.open(message.file_url, "_blank")
                              }
                            />
                          ) : (
                            <div className="flex items-center gap-2">
                              <File
                                size={20}
                                className={
                                  isOwnMessage ? "text-white" : "text-gray-600"
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
                                <div
                                  className={`text-xs ${
                                    isOwnMessage
                                      ? "text-blue-100"
                                      : "text-gray-500"
                                  }`}
                                >
                                  {message.file_size &&
                                    `${(
                                      message.file_size /
                                      1024 /
                                      1024
                                    ).toFixed(1)} MB`}
                                </div>
                              </div>
                              <button
                                onClick={() =>
                                  window.open(message.file_url, "_blank")
                                }
                                className={`p-1 rounded ${
                                  isOwnMessage
                                    ? "hover:bg-blue-600"
                                    : "hover:bg-gray-200"
                                }`}
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
                          className={`text-sm leading-relaxed break-words p-4 rounded-2xl shadow-sm transition-all duration-200 inline-block max-w-xs sm:max-w-md lg:max-w-lg ${
                            isOwnMessage
                              ? "bg-gradient-to-r from-blue-500 to-blue-600 text-white ml-auto rounded-br-md hover:shadow-md"
                              : "bg-white text-gray-800 rounded-bl-md border border-gray-200 hover:shadow-md hover:border-gray-300"
                          }`}
                          dangerouslySetInnerHTML={{
                            __html: renderMessageContent(message.content),
                          }}
                        />
                      )}

                      {/* Reactions */}
                      <div
                        className={`mt-1 ${isOwnMessage ? "text-right" : ""}`}
                      >
                        <MessageReactions
                          reactions={message.reactions || []}
                          onReactionClick={(emoji) =>
                            handleReaction(message.message_id, emoji)
                          }
                          currentUserId={user.user_id}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}

        {/* Typing indicator */}
        {typingUsers.length > 0 && <TypingIndicator users={typingUsers} />}

        <div ref={messagesEndRef} />
      </div>

      {/* Reply indicator */}
      {replyingTo && (
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 border-t border-blue-200 p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-full">
                <Reply size={16} className="text-blue-600" />
              </div>
              <div>
                <span className="text-sm font-semibold text-blue-800">
                  Replying to {replyingTo.user_name}
                </span>
                <div className="text-sm text-gray-700 truncate max-w-xs bg-white px-3 py-1 rounded-lg mt-1 border border-blue-200">
                  {replyingTo.content}
                </div>
              </div>
            </div>
            <button
              onClick={() => setReplyingTo(null)}
              className="p-2 hover:bg-blue-100 rounded-full transition-colors"
            >
              <X size={16} className="text-blue-600" />
            </button>
          </div>
        </div>
      )}

      {/* Edit indicator */}
      {editingMessage && (
        <div className="bg-gradient-to-r from-amber-50 to-orange-50 border-t border-amber-200 p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-amber-100 rounded-full">
                <Edit2 size={16} className="text-amber-600" />
              </div>
              <span className="text-sm font-semibold text-amber-800">
                Editing message
              </span>
            </div>
            <button
              onClick={() => {
                setEditingMessage(null);
                setNewMessage("");
              }}
              className="p-2 hover:bg-amber-100 rounded-full transition-colors"
            >
              <X size={16} className="text-amber-600" />
            </button>
          </div>
        </div>
      )}

      {/* Message Input */}
      <div className="border-t border-gray-200 bg-white p-3 sm:p-6 shadow-lg">
        <form onSubmit={sendMessage} className="relative">
          {/* Mentions dropdown - positioned above input */}
          {showMentions && (
            <div
              ref={mentionsRef}
              className="absolute bottom-full left-0 right-0 mb-2 z-[9999] max-w-full sm:max-w-md"
            >
              <MentionsList
                members={channelMembers}
                query={mentionQuery}
                selectedIndex={selectedMentionIndex}
                onSelect={handleMentionSelect}
              />
            </div>
          )}

          <div className="bg-white border-2 border-gray-200 rounded-2xl focus-within:border-purple-500 focus-within:ring-4 focus-within:ring-purple-100 transition-all duration-200 shadow-sm hover:shadow-md">
            <textarea
              ref={textareaRef}
              value={newMessage}
              onChange={handleInputChange}
              onKeyDown={(e) => {
                if (showMentions) {
                  const filteredMembers = channelMembers
                    .filter((member) =>
                      member.name
                        .toLowerCase()
                        .includes(mentionQuery.toLowerCase())
                    )
                    .slice(0, 5);

                  if (e.key === "ArrowDown") {
                    e.preventDefault();
                    setSelectedMentionIndex((prev) =>
                      prev < filteredMembers.length - 1 ? prev + 1 : 0
                    );
                  } else if (e.key === "ArrowUp") {
                    e.preventDefault();
                    setSelectedMentionIndex((prev) =>
                      prev > 0 ? prev - 1 : filteredMembers.length - 1
                    );
                  } else if (e.key === "Enter" || e.key === "Tab") {
                    e.preventDefault();
                    if (filteredMembers[selectedMentionIndex]) {
                      handleMentionSelect(
                        filteredMembers[selectedMentionIndex]
                      );
                    }
                  } else if (e.key === "Escape") {
                    setShowMentions(false);
                    setMentionQuery("");
                  }
                } else if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  sendMessage(e);
                }
              }}
              placeholder={`Message #${channelName}...`}
              className="w-full bg-transparent text-gray-900 placeholder-gray-400 px-3 sm:px-6 py-3 sm:py-4 pr-20 sm:pr-24 resize-none outline-none text-sm sm:text-base max-h-[120px] leading-relaxed"
              rows="1"
              disabled={sending}
            />

            <div className="flex items-center justify-between px-2 sm:px-4 pb-3 sm:pb-4">
              <div className="flex items-center gap-1 sm:gap-3">
                <div className="relative" ref={emojiPickerRef}>
                  <button
                    type="button"
                    onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                    className="p-1.5 sm:p-2 hover:bg-purple-100 rounded-xl text-gray-600 hover:text-purple-600 transition-all duration-200"
                    title="Add emoji"
                  >
                    <Smile size={18} className="sm:w-5 sm:h-5" />
                  </button>
                  {showEmojiPicker && (
                    <div className="absolute bottom-full left-0 mb-2 z-50">
                      <EmojiPicker onEmojiSelect={handleEmojiSelect} />
                    </div>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="p-1.5 sm:p-2 hover:bg-purple-100 rounded-xl text-gray-600 hover:text-purple-600 transition-all duration-200"
                  title="Attach file"
                >
                  <Paperclip size={18} className="sm:w-5 sm:h-5" />
                </button>

                {/* Debug button for mentions */}
                {process.env.NODE_ENV === "development" && (
                  <button
                    type="button"
                    onClick={() => {
                      console.log("🔍 Debug: Force showing mentions");
                      console.log("Members:", channelMembers);
                      setShowMentions(true);
                      setMentionQuery("");
                    }}
                    className="p-2 hover:bg-blue-100 rounded-xl text-gray-600 hover:text-blue-600 transition-all duration-200 text-xs"
                    title="Test mentions"
                  >
                    @
                  </button>
                )}

                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files?.length) {
                      handleFileUpload(Array.from(e.target.files));
                    }
                  }}
                />
              </div>

              <button
                type="submit"
                disabled={!newMessage.trim() || sending}
                className={`flex items-center gap-1.5 sm:gap-3 px-3 sm:px-6 py-2 sm:py-3 rounded-xl font-semibold text-xs sm:text-sm transition-all duration-200 shadow-sm ${
                  newMessage.trim() && !sending
                    ? "bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white shadow-lg hover:shadow-xl transform hover:scale-105"
                    : "bg-gray-200 text-gray-400 cursor-not-allowed"
                }`}
              >
                {sending ? (
                  <div className="animate-spin rounded-full h-3 w-3 sm:h-4 sm:w-4 border-t-2 border-white"></div>
                ) : (
                  <Send size={14} className="sm:w-4 sm:h-4" />
                )}
                <span className="hidden sm:inline">
                  {editingMessage ? "Update" : "Send"}
                </span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TeamChat;
