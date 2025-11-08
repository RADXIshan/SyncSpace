import { useState, useRef, useEffect } from "react";
import { Send, X, Sparkles, Loader2, Trash2, Bot } from "lucide-react";
import axios from "axios";
import { toast } from "react-hot-toast";
import { useSocket } from "../context/SocketContext";
import { useAuth } from "../context/AuthContext";

const AIAssistant = ({ onClose }) => {
  const { socket } = useSocket();
  const { user } = useAuth();
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content: "👋 Hi! I'm your SyncSpace AI assistant. I can help you with:\n\n✨ Platform Features\n• Video meetings & screen sharing\n• Team chat & direct messages\n• Voice messages & polls\n• Meeting reports & analytics\n• Smart search & focus mode\n\n🎯 Getting Started\n• Creating organizations & channels\n• Inviting team members\n• Managing roles & permissions\n• Scheduling events & meetings\n\n💡 Best Practices\n• Effective collaboration tips\n• Productivity workflows\n• Troubleshooting common issues\n\nWhat would you like to know?"
    }
  ]);
  const [inputMessage, setInputMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [realtimeContext, setRealtimeContext] = useState({
    onlineUsers: 0,
    activeChannels: [],
    recentActivity: []
  });
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Function to strip markdown formatting from text
  const stripMarkdown = (text) => {
    if (!text) return text;
    
    return text
      // Remove bold/italic markers
      .replace(/\*\*\*(.+?)\*\*\*/g, '$1')  // Bold + Italic
      .replace(/\*\*(.+?)\*\*/g, '$1')      // Bold
      .replace(/\*(.+?)\*/g, '$1')          // Italic
      .replace(/__(.+?)__/g, '$1')          // Bold (underscore)
      .replace(/_(.+?)_/g, '$1')            // Italic (underscore)
      // Remove headers
      .replace(/^#{1,6}\s+(.+)$/gm, '$1')   // Headers
      // Remove code blocks
      .replace(/```[\s\S]*?```/g, '')       // Code blocks
      .replace(/`(.+?)`/g, '$1')            // Inline code
      // Remove links but keep text
      .replace(/\[(.+?)\]\(.+?\)/g, '$1')   // Links
      // Remove images
      .replace(/!\[.*?\]\(.+?\)/g, '')      // Images
      // Remove horizontal rules
      .replace(/^[-*_]{3,}$/gm, '')         // Horizontal rules
      // Remove blockquotes
      .replace(/^>\s+(.+)$/gm, '$1')        // Blockquotes
      // Clean up extra whitespace
      .replace(/\n{3,}/g, '\n\n')           // Multiple newlines
      .trim();
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  // Listen to real-time socket events for context
  useEffect(() => {
    if (!socket) return;

    // Listen for online users updates
    const handleOnlineUsers = (users) => {
      setRealtimeContext(prev => ({
        ...prev,
        onlineUsers: users?.length || 0
      }));
    };

    // Listen for new messages
    const handleNewMessage = (message) => {
      setRealtimeContext(prev => ({
        ...prev,
        recentActivity: [...prev.recentActivity.slice(-9), {
          type: 'message',
          channelId: message.channelId,
          timestamp: Date.now()
        }]
      }));
    };

    // Listen for meeting events
    const handleMeetingStart = (data) => {
      setRealtimeContext(prev => ({
        ...prev,
        recentActivity: [...prev.recentActivity.slice(-9), {
          type: 'meeting_started',
          channelId: data.channelId,
          timestamp: Date.now()
        }]
      }));
    };

    socket.on('onlineUsers', handleOnlineUsers);
    socket.on('newMessage', handleNewMessage);
    socket.on('meetingStarted', handleMeetingStart);

    return () => {
      socket.off('onlineUsers', handleOnlineUsers);
      socket.off('newMessage', handleNewMessage);
      socket.off('meetingStarted', handleMeetingStart);
    };
  }, [socket]);

  const sendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;

    const userMessage = inputMessage.trim();
    setInputMessage("");

    // Add user message to chat
    const newUserMessage = {
      role: "user",
      content: userMessage
    };
    setMessages(prev => [...prev, newUserMessage]);
    setIsLoading(true);

    try {
      const baseURL = import.meta.env.VITE_BASE_URL || 'http://localhost:3000';
      
      // Prepare conversation history (last 10 messages for context)
      const conversationHistory = messages.slice(-10).map(msg => ({
        role: msg.role === "assistant" ? "model" : "user",
        content: msg.content
      }));

      // Add real-time context to the message
      const contextualMessage = userMessage + `\n\n[Real-time Context: ${realtimeContext.onlineUsers} users online, ${realtimeContext.recentActivity.length} recent activities]`;

      const response = await axios.post(
        `${baseURL}/api/ai/chat`,
        {
          message: contextualMessage,
          conversationHistory,
          realtimeContext: {
            onlineUsers: realtimeContext.onlineUsers,
            userName: user?.name,
            userEmail: user?.email
          }
        },
        { withCredentials: true }
      );

      // Add AI response to chat (strip markdown formatting)
      const aiMessage = {
        role: "assistant",
        content: stripMarkdown(response.data.response)
      };
      setMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      console.error("Error sending message to AI:", error);
      
      let errorContent = "I apologize, but I'm having trouble responding right now. Please try again in a moment.";
      let toastMessage = "Failed to get AI response";
      
      // Handle specific error types
      if (error.response?.status === 429) {
        errorContent = "⏳ The AI service is currently experiencing high demand. Please wait a moment and try again.";
        toastMessage = "AI service is busy - please wait";
      } else if (error.response?.data?.message) {
        errorContent = `⚠️ ${error.response.data.message}`;
      }
      
      const errorMessage = {
        role: "assistant",
        content: errorContent
      };
      setMessages(prev => [...prev, errorMessage]);
      
      toast.error(toastMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const clearChat = () => {
    setMessages([
      {
        role: "assistant",
        content: "Chat cleared! How can I help you today?"
      }
    ]);
  };

  // Handle escape key to close
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && onClose) {
        onClose();
      }
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/70 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-in fade-in duration-300"
        onClick={onClose}
      >
        {/* Chat Window */}
        <div 
          className="w-full max-w-3xl h-[650px] bg-gradient-to-br from-slate-50 to-gray-100 dark:from-gray-900 dark:to-slate-900 rounded-3xl shadow-2xl flex flex-col overflow-hidden border border-purple-200/20 dark:border-purple-500/20 animate-in zoom-in-95 duration-300"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="relative bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-700 text-white p-5 flex items-center justify-between overflow-hidden">
            {/* Animated background effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-purple-400/20 to-indigo-400/20 animate-pulse"></div>
            
            <div className="relative flex items-center gap-4">
              <div className="relative">
                <div className="absolute inset-0 bg-white/30 rounded-full blur-xl animate-pulse"></div>
                <div className="relative bg-white/20 backdrop-blur-sm p-2.5 rounded-full border border-white/30">
                  <Bot size={24} className="text-white" />
                </div>
                <span className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full border-2 border-white animate-pulse"></span>
              </div>
              <div>
                <h3 className="font-bold text-lg flex items-center gap-2">
                  AI Assistant
                  <Sparkles size={16} className="text-yellow-300 animate-pulse" />
                </h3>
                <p className="text-xs text-purple-100 font-medium flex items-center gap-2">
                  Here to help
                  {socket && (
                    <>
                      <span className="text-purple-200">•</span>
                      <span className="flex items-center gap-1">
                        <span className="w-1.5 h-1.5 bg-green-300 rounded-full animate-pulse"></span>
                        Online
                      </span>
                    </>
                  )}
                </p>
              </div>
            </div>
            <div className="relative flex items-center gap-2">
              <button
                onClick={clearChat}
                className="cursor-pointer p-2.5 hover:bg-red-300/20 rounded-xl transition-all duration-200 hover:scale-110 active:scale-95 group"
                title="Clear chat"
              >
                <Trash2 size={18} className="group-hover:text-red-300 transition-colors" />
              </button>
              <button
                onClick={onClose}
                className="cursor-pointer p-2.5 hover:bg-white/20 rounded-xl transition-all duration-200 hover:scale-110 active:scale-95 hover:rotate-90"
                title="Close"
              >
                <X size={18} />
              </button>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-gradient-to-b from-transparent to-purple-50/30 dark:to-purple-900/10">
            {messages.map((message, index) => (
              <div
                key={index}
                className={`flex ${message.role === "user" ? "justify-end" : "justify-start"} animate-in slide-in-from-bottom-2 duration-300`}
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <div
                  className={`max-w-[85%] rounded-2xl px-5 py-3.5 shadow-lg ${
                    message.role === "user"
                      ? "bg-gradient-to-br from-purple-600 via-purple-500 to-indigo-600 text-white"
                      : "bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 border border-purple-100 dark:border-purple-500/20"
                  }`}
                >
                  {message.role === "assistant" && (
                    <div className="flex items-center gap-2 mb-2 pb-2 border-b border-purple-100 dark:border-purple-500/20">
                      <Bot size={14} className="text-purple-600 dark:text-purple-400" />
                      <span className="text-xs font-semibold text-purple-600 dark:text-purple-400">AI Assistant</span>
                    </div>
                  )}
                  <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">{message.content}</p>
                </div>
              </div>
            ))}
            
            {isLoading && (
              <div className="flex justify-start animate-in slide-in-from-bottom-2 duration-300">
                <div className="bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 rounded-2xl px-5 py-3.5 shadow-lg border border-purple-100 dark:border-purple-500/20">
                  <div className="flex items-center gap-3">
                    <Loader2 size={18} className="animate-spin text-purple-600 dark:text-purple-400" />
                    <span className="text-sm font-medium">AI is thinking...</span>
                    <div className="flex gap-1">
                      <span className="w-2 h-2 bg-purple-600 dark:bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                      <span className="w-2 h-2 bg-purple-600 dark:bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                      <span className="w-2 h-2 bg-purple-600 dark:bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="p-5 bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl border-t border-purple-200/30 dark:border-purple-500/20">
            <div className="flex items-end gap-3">
              <div className="flex-1 relative">
                <textarea
                  ref={inputRef}
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Ask me anything about SyncSpace..."
                  className="w-full text-white resize-none rounded-2xl border-2 border-purple-200 dark:border-purple-500/30 bg-white dark:bg-gray-900 px-5 py-3.5 pr-12 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 max-h-32 text-sm placeholder:text-gray-400 dark:placeholder:text-gray-500 transition-all duration-200"
                  rows={1}
                  disabled={isLoading}
                />
                <div className="absolute right-3 bottom-3 text-xs text-gray-400 dark:text-gray-500 font-mono">
                  {inputMessage.length}/500
                </div>
              </div>
              <button
                onClick={sendMessage}
                disabled={!inputMessage.trim() || isLoading}
                className="p-4 bg-gradient-to-br from-purple-600 via-purple-500 to-indigo-600 text-white rounded-2xl hover:shadow-xl hover:shadow-purple-500/50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 hover:scale-105 active:scale-95 disabled:hover:scale-100 group"
                title="Send message"
              >
                <Send size={20} className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
              </button>
            </div>
            <div className="flex items-center justify-between mt-3 px-1">
              <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-2">
                <kbd className="px-2 py-0.5 bg-gray-200 dark:bg-gray-700 rounded text-xs font-mono">Enter</kbd>
                <span>to send</span>
                <span className="text-gray-400">•</span>
                <kbd className="px-2 py-0.5 bg-gray-200 dark:bg-gray-700 rounded text-xs font-mono">Shift+Enter</kbd>
                <span>new line</span>
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default AIAssistant;
