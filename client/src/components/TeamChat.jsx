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
  MoreVertical,
  Edit2,
  Trash2,
  Download,
  Image,
  File,
  X,
  AtSign,
  Heart,
  ThumbsUp,
  Plus,
} from "lucide-react";
import { toast } from "react-hot-toast";
import EmojiPicker from "./EmojiPicker";
import FileUpload from "./FileUpload";
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
  const [showFileUpload, setShowFileUpload] = useState(false);
  const [replyingTo, setReplyingTo] = useState(null);
  const [editingMessage, setEditingMessage] = useState(null);
  const [typingUsers, setTypingUsers] = useState([]);
  const [showMentions, setShowMentions] = useState(false);
  const [mentionQuery, setMentionQuery] = useState("");
  const [mentionPosition, setMentionPosition] = useState(0);
  const [channelMembers, setChannelMembers] = useState([]);
  
  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const fileInputRef = useRef(null);

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
      setChannelMembers(response.data.members || []);
    } catch (error) {
      console.error("Error fetching channel members:", error);
    }
  }, [channelId, user?.org_id]);

  // Socket event handlers
  useEffect(() => {
    if (!socket || !isConnected || !channelId) return;

    // Join channel room
    socket.emit("join_channel", channelId);

    // Listen for new messages
    const handleNewMessage = (message) => {
      setMessages(prev => [...prev, message]);
      scrollToBottom();
    };

    // Listen for message updates
    const handleMessageUpdate = (updatedMessage) => {
      setMessages(prev => 
        prev.map(msg => 
          msg.message_id === updatedMessage.message_id ? updatedMessage : msg
        )
      );
    };

    // Listen for message deletions
    const handleMessageDelete = (messageId) => {
      setMessages(prev => prev.filter(msg => msg.message_id !== messageId));
    };

    // Listen for typing indicators
    const handleUserTyping = (data) => {
      if (data.userId !== user.user_id) {
        setTypingUsers(prev => {
          const existing = prev.find(u => u.userId === data.userId);
          if (!existing) {
            return [...prev, { userId: data.userId, userName: data.userName }];
          }
          return prev;
        });
      }
    };

    const handleUserStoppedTyping = (data) => {
      setTypingUsers(prev => prev.filter(u => u.userId !== data.userId));
    };

    // Listen for reactions
    const handleReactionUpdate = (data) => {
      setMessages(prev =>
        prev.map(msg =>
          msg.message_id === data.messageId
            ? { ...msg, reactions: data.reactions }
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

    return () => {
      socket.off("new_message", handleNewMessage);
      socket.off("message_updated", handleMessageUpdate);
      socket.off("message_deleted", handleMessageDelete);
      socket.off("user_typing", handleUserTyping);
      socket.off("user_stopped_typing", handleUserStoppedTyping);
      socket.off("reaction_updated", handleReactionUpdate);
      socket.emit("leave_channel", channelId);
    };
  }, [socket, isConnected, channelId, user?.user_id, scrollToBottom]);

  // Initialize data
  useEffect(() => {
    fetchMessages();
    fetchChannelMembers();
  }, [fetchMessages, fetchChannelMembers]);

  // Auto-scroll on new messages
  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  // Handle typing indicators
  const handleTypingStart = useCallback(() => {
    if (socket && isConnected) {
      socket.emit("typing_start", {
        channelId,
        userName: user.name
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

    // Handle mentions
    const cursorPosition = e.target.selectionStart;
    const textBeforeCursor = value.substring(0, cursorPosition);
    const mentionMatch = textBeforeCursor.match(/@(\w*)$/);
    
    if (mentionMatch) {
      setShowMentions(true);
      setMentionQuery(mentionMatch[1]);
      setMentionPosition(cursorPosition);
    } else {
      setShowMentions(false);
      setMentionQuery("");
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
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 120) + "px";
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
        mentions: extractMentions(newMessage)
      };

      if (editingMessage) {
        // Update existing message
        await axios.put(
          `${import.meta.env.VITE_BASE_URL}/api/messages/${editingMessage.message_id}`,
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
    const mentionRegex = /@(\w+)/g;
    const mentions = [];
    let match;
    
    while ((match = mentionRegex.exec(text)) !== null) {
      const username = match[1];
      const member = channelMembers.find(m => 
        m.name.toLowerCase().includes(username.toLowerCase())
      );
      if (member) {
        mentions.push(member.user_id);
      }
    }
    
    return mentions;
  };

  // Handle mention selection
  const handleMentionSelect = (member) => {
    const beforeMention = newMessage.substring(0, mentionPosition - mentionQuery.length - 1);
    const afterMention = newMessage.substring(mentionPosition);
    const newText = `${beforeMention}@${member.name} ${afterMention}`;
    
    setNewMessage(newText);
    setShowMentions(false);
    setMentionQuery("");
    textareaRef.current?.focus();
  };

  // Handle emoji selection
  const handleEmojiSelect = (emoji) => {
    setNewMessage(prev => prev + emoji);
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
            headers: { "Content-Type": "multipart/form-data" }
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
    try {
      await axios.post(
        `${import.meta.env.VITE_BASE_URL}/api/messages/${messageId}/reactions`,
        { emoji },
        { withCredentials: true }
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
        `${import.meta.env.VITE_BASE_URL}/api/messages/${messageId}`,
        { withCredentials: true }
      );
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
    
    return content.replace(/@(\w+)/g, (match, username) => {
      return `<span class="text-blue-600 font-medium bg-blue-100 px-1 rounded">${match}</span>`;
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-purple-600"></div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Welcome Message */}
        <div className="bg-gradient-to-br from-purple-50 to-indigo-50 border border-purple-200 rounded-xl p-6 text-center">
          <div className="bg-white w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 border-2 border-purple-300">
            <Hash size={24} className="text-purple-600" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">
            Welcome to #{channelName}
          </h2>
          <p className="text-gray-700">
            This is the beginning of the{" "}
            <span className="text-purple-600 font-medium">#{channelName}</span>{" "}
            channel.
          </p>
        </div>

        {/* Messages */}
        {messages.map((message, index) => {
          const showAvatar = index === 0 || messages[index - 1].user_id !== message.user_id;
          const isOwnMessage = message.user_id === user.user_id;

          return (
            <div key={message.message_id} className={`group ${showAvatar ? "mt-4" : "mt-1"}`}>
              <div className={`flex gap-3 ${isOwnMessage ? "flex-row-reverse" : ""}`}>
                {/* Avatar */}
                {showAvatar ? (
                  message.user_photo ? (
                    <img
                      src={message.user_photo}
                      alt={message.user_name}
                      className="w-10 h-10 rounded-full object-cover border-2 border-gray-200 flex-shrink-0"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-600 to-indigo-600 flex items-center justify-center text-white font-bold text-sm border-2 border-gray-200 flex-shrink-0">
                      {message.user_name?.charAt(0) || "U"}
                    </div>
                  )
                ) : (
                  <div className="w-10 flex-shrink-0"></div>
                )}

                <div className={`flex-1 min-w-0 max-w-xs sm:max-w-md ${isOwnMessage ? "text-right" : ""}`}>
                  {/* Header */}
                  {showAvatar && (
                    <div className={`flex items-center gap-2 mb-1 ${isOwnMessage ? "justify-end" : ""}`}>
                      <span className="font-semibold text-gray-900 text-sm">
                        {isOwnMessage ? "You" : message.user_name}
                      </span>
                      <span className="text-xs text-gray-500">
                        {formatTime(message.created_at)}
                      </span>
                    </div>
                  )}

                  {/* Reply indicator */}
                  {message.reply_to && (
                    <div className={`bg-gray-100 border-l-4 border-gray-300 pl-3 py-2 mb-2 rounded-r ${isOwnMessage ? "bg-blue-50 border-blue-300" : ""}`}>
                      <div className="text-xs text-gray-600 mb-1">
                        Replying to {message.reply_to_user_name}
                      </div>
                      <div className="text-sm text-gray-800 truncate">
                        {message.reply_to_content}
                      </div>
                    </div>
                  )}

                  {/* Message content */}
                  <div className={`flex items-start gap-2 ${isOwnMessage ? "flex-row-reverse" : ""}`}>
                    <div className="flex-1">
                      {message.file_url ? (
                        <div className={`rounded-lg p-3 max-w-sm ${
                          isOwnMessage 
                            ? "bg-blue-500 text-white ml-auto" 
                            : "bg-gray-100"
                        }`}>
                          {message.file_type?.startsWith("image/") ? (
                            <img
                              src={message.file_url}
                              alt={message.file_name}
                              className="max-w-full h-auto rounded cursor-pointer"
                              onClick={() => window.open(message.file_url, "_blank")}
                            />
                          ) : (
                            <div className="flex items-center gap-2">
                              <File size={20} className={isOwnMessage ? "text-white" : "text-gray-600"} />
                              <div className="flex-1 min-w-0">
                                <div className={`text-sm font-medium truncate ${
                                  isOwnMessage ? "text-white" : "text-gray-900"
                                }`}>
                                  {message.file_name}
                                </div>
                                <div className={`text-xs ${
                                  isOwnMessage ? "text-blue-100" : "text-gray-500"
                                }`}>
                                  {message.file_size && `${(message.file_size / 1024 / 1024).toFixed(1)} MB`}
                                </div>
                              </div>
                              <button
                                onClick={() => window.open(message.file_url, "_blank")}
                                className={`p-1 rounded ${
                                  isOwnMessage ? "hover:bg-blue-600" : "hover:bg-gray-200"
                                }`}
                              >
                                <Download size={16} className={isOwnMessage ? "text-white" : "text-gray-600"} />
                              </button>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div
                          className={`text-sm leading-relaxed break-words p-3 rounded-lg ${
                            isOwnMessage 
                              ? "bg-blue-500 text-white ml-auto rounded-br-sm" 
                              : "bg-gray-100 text-gray-800 rounded-bl-sm"
                          }`}
                          dangerouslySetInnerHTML={{
                            __html: renderMessageContent(message.content)
                          }}
                        />
                      )}

                      {/* Reactions */}
                      {message.reactions && message.reactions.length > 0 && (
                        <div className={`mt-1 ${isOwnMessage ? "text-right" : ""}`}>
                          <MessageReactions
                            reactions={message.reactions}
                            onReactionClick={(emoji) => handleReaction(message.message_id, emoji)}
                            currentUserId={user.user_id}
                          />
                        </div>
                      )}
                    </div>

                    {/* Message actions */}
                    <div className={`opacity-0 group-hover:opacity-100 transition-opacity flex gap-1 ${
                      isOwnMessage ? "flex-row-reverse" : ""
                    }`}>
                      <button
                        onClick={() => handleReaction(message.message_id, "👍")}
                        className="p-1 hover:bg-gray-100 rounded text-gray-500 hover:text-blue-600"
                        title="Add reaction"
                      >
                        <Heart size={14} />
                      </button>
                      <button
                        onClick={() => handleReply(message)}
                        className="p-1 hover:bg-gray-100 rounded text-gray-500 hover:text-blue-600"
                        title="Reply"
                      >
                        <Reply size={14} />
                      </button>
                      {isOwnMessage && (
                        <>
                          <button
                            onClick={() => handleEditMessage(message)}
                            className="p-1 hover:bg-gray-100 rounded text-gray-500 hover:text-blue-600"
                            title="Edit"
                          >
                            <Edit2 size={14} />
                          </button>
                          <button
                            onClick={() => handleDeleteMessage(message.message_id)}
                            className="p-1 hover:bg-gray-100 rounded text-gray-500 hover:text-red-600"
                            title="Delete"
                          >
                            <Trash2 size={14} />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}

        {/* Typing indicator */}
        {typingUsers.length > 0 && (
          <TypingIndicator users={typingUsers} />
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Reply indicator */}
      {replyingTo && (
        <div className="bg-gray-100 border-t border-gray-200 p-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Reply size={16} className="text-gray-500" />
              <span className="text-sm text-gray-600">
                Replying to {replyingTo.user_name}
              </span>
              <span className="text-sm text-gray-800 truncate max-w-xs">
                {replyingTo.content}
              </span>
            </div>
            <button
              onClick={() => setReplyingTo(null)}
              className="p-1 hover:bg-gray-200 rounded"
            >
              <X size={16} className="text-gray-500" />
            </button>
          </div>
        </div>
      )}

      {/* Edit indicator */}
      {editingMessage && (
        <div className="bg-yellow-100 border-t border-yellow-200 p-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Edit2 size={16} className="text-yellow-600" />
              <span className="text-sm text-yellow-800">
                Editing message
              </span>
            </div>
            <button
              onClick={() => {
                setEditingMessage(null);
                setNewMessage("");
              }}
              className="p-1 hover:bg-yellow-200 rounded"
            >
              <X size={16} className="text-yellow-600" />
            </button>
          </div>
        </div>
      )}

      {/* Message Input */}
      <div className="border-t border-gray-200 bg-white p-4">
        <form onSubmit={sendMessage} className="relative">
          <div className="bg-gray-50 border border-gray-300 rounded-xl focus-within:border-purple-500 focus-within:ring-2 focus-within:ring-purple-200 transition-all duration-200">
            <textarea
              ref={textareaRef}
              value={newMessage}
              onChange={handleInputChange}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  sendMessage(e);
                }
              }}
              placeholder={`Message #${channelName}`}
              className="w-full bg-transparent text-gray-900 placeholder-gray-500 px-4 py-3 pr-24 resize-none outline-none text-sm max-h-[120px]"
              rows="1"
              disabled={sending}
            />

            <div className="flex items-center justify-between px-3 pb-3">
              <div className="flex items-center gap-2">
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                    className="p-2 hover:bg-gray-200 rounded-lg text-gray-600 hover:text-gray-900"
                    title="Add emoji"
                  >
                    <Smile size={18} />
                  </button>
                  {showEmojiPicker && (
                    <div className="absolute bottom-full left-0 mb-2">
                      <EmojiPicker onEmojiSelect={handleEmojiSelect} />
                    </div>
                  )}
                </div>
                
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="p-2 hover:bg-gray-200 rounded-lg text-gray-600 hover:text-gray-900"
                  title="Attach file"
                >
                  <Paperclip size={18} />
                </button>
                
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
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-all ${
                  newMessage.trim() && !sending
                    ? "bg-purple-600 hover:bg-purple-700 text-white"
                    : "bg-gray-300 text-gray-500 cursor-not-allowed"
                }`}
              >
                {sending ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-white"></div>
                ) : (
                  <Send size={16} />
                )}
                {editingMessage ? "Update" : "Send"}
              </button>
            </div>
          </div>
        </form>

        {/* Mentions dropdown */}
        {showMentions && (
          <div className="absolute bottom-full left-4 right-4 mb-2">
            <MentionsList
              members={channelMembers}
              query={mentionQuery}
              onSelect={handleMentionSelect}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default TeamChat;