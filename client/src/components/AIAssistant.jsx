import { useState, useRef, useEffect, useCallback } from "react";
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
      content: "👋 Hi! I'm your SyncSpace AI assistant with comprehensive real-time access to your entire workspace.\n\n🔍 I Have Full Access To:\n• Your organizations and current org\n• All channels and their descriptions\n• Team members, roles, and permissions\n• Who's online right now\n• Scheduled meetings and active meetings\n• Meeting reports with summaries\n• Notes and documents\n• Notices and announcements\n• Calendar events\n• Recent activity and messages\n\n✨ Platform Features I Can Help With:\n• Video meetings & screen sharing\n• Team chat & direct messages\n• Voice messages & polls\n• Meeting reports & analytics\n• Notes & collaborative documents\n• Notice board & announcements\n• Smart search & focus mode\n• Calendar & event management\n\n🎯 Ask Me Anything:\n• \"What's my organization name?\"\n• \"List all my channels\"\n• \"Who's online right now?\"\n• \"Show me recent meeting reports\"\n• \"What notes do we have?\"\n• \"What notices were posted recently?\"\n• \"What events are coming up?\"\n• \"What roles exist in my org?\"\n• \"What permissions does the Admin role have?\"\n• \"How many members are in my organization?\"\n• \"Summarize our last meeting\"\n\n💡 I can also help with:\n• Creating organizations & channels\n• Managing roles & permissions\n• Understanding meeting reports\n• Finding notes and documents\n• Checking upcoming events\n• Troubleshooting issues\n• Best practices for collaboration\n\nWhat would you like to know?"
    }
  ]);
  const [inputMessage, setInputMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [realtimeContext, setRealtimeContext] = useState({
    onlineUsers: [],
    currentPage: window.location.pathname,
    userOrganizations: [],
    userChannels: [],
    recentMessages: [],
    activeMeetings: [],
    userRole: null,
    lastActivity: null
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

  // Gather comprehensive real-time context
  const gatherContext = useCallback(async () => {
    try {
      const baseURL = import.meta.env.VITE_BASE_URL || 'http://localhost:3000';
      
      console.log('🔍 Starting context gathering for user:', user?.user_id);
      
      // Get user's organizations with proper schema fields
      const orgsResponse = await axios.get(`${baseURL}/api/orgs/user/organizations`, { withCredentials: true });
      const organizations = orgsResponse.data.organizations || [];
      
      console.log('📋 Fetched organizations:', organizations.length);
      
      // Get current organization from user.org_id (not localStorage)
      const currentOrgId = user?.org_id;
      const currentOrg = currentOrgId ? organizations.find(org => org.org_id === parseInt(currentOrgId)) : null;
      
      console.log('🏢 Current org ID:', currentOrgId, 'Found:', currentOrg?.org_name);
        
        // Get channels, members, roles, and meetings if in an organization
        let channels = [];
        let orgMembers = [];
        let orgRoles = [];
        let scheduledMeetings = [];
        let meetingReports = [];
        let notes = [];
        let notices = [];
        let events = [];
        
        if (currentOrgId) {
          try {
            // Get organization details (includes channels and roles)
            console.log('📡 Fetching organization details for org:', currentOrgId);
            const orgResponse = await axios.get(`${baseURL}/api/orgs/${currentOrgId}`, { withCredentials: true });
            channels = orgResponse.data.organization?.channels || [];
            orgRoles = orgResponse.data.organization?.roles || [];
            console.log('📺 Fetched channels:', channels.length);
            console.log('🎭 Fetched roles:', orgRoles.length);
            
            // Get organization members
            console.log('👥 Fetching members for org:', currentOrgId);
            const membersResponse = await axios.get(`${baseURL}/api/orgs/${currentOrgId}/members`, { withCredentials: true });
            orgMembers = membersResponse.data.members || [];
            console.log('👥 Fetched members:', orgMembers.length);
            
            // Get scheduled meetings
            console.log('📅 Fetching meetings for org:', currentOrgId);
            const meetingsResponse = await axios.get(`${baseURL}/api/meetings?org_id=${currentOrgId}`, { withCredentials: true });
            scheduledMeetings = meetingsResponse.data.meetings || [];
            console.log('📅 Fetched meetings:', scheduledMeetings.length);
            
            // Get meeting reports
            try {
              console.log('📊 Fetching meeting reports for org:', currentOrgId);
              const reportsResponse = await axios.get(`${baseURL}/api/meeting-reports/organization/${currentOrgId}`, { withCredentials: true });
              meetingReports = reportsResponse.data.reports || [];
              console.log('📊 Fetched meeting reports:', meetingReports.length);
              if (meetingReports.length > 0) {
                console.log('📊 Sample report:', meetingReports[0]);
              }
            } catch (reportError) {
              console.error('❌ Error fetching meeting reports:', reportError.response?.status, reportError.response?.data || reportError.message);
              meetingReports = [];
            }
            
            // Get notes
            try {
              console.log('📝 Fetching notes for org:', currentOrgId);
              const notesResponse = await axios.get(`${baseURL}/api/notes?org_id=${currentOrgId}`, { withCredentials: true });
              notes = notesResponse.data.notes || [];
              console.log('📝 Fetched notes:', notes.length);
            } catch (notesError) {
              console.error('❌ Error fetching notes:', notesError.response?.status, notesError.response?.data || notesError.message);
              notes = [];
            }
            
            // Get notices
            try {
              console.log('📢 Fetching notices for org:', currentOrgId);
              const noticesResponse = await axios.get(`${baseURL}/api/notices?org_id=${currentOrgId}`, { withCredentials: true });
              notices = noticesResponse.data.notices || [];
              console.log('📢 Fetched notices:', notices.length);
            } catch (noticesError) {
              console.error('❌ Error fetching notices:', noticesError.response?.status, noticesError.response?.data || noticesError.message);
              notices = [];
            }
            
            // Get events
            try {
              console.log('📆 Fetching events for org:', currentOrgId);
              const eventsResponse = await axios.get(`${baseURL}/api/events?user_id=${user?.user_id}&org_id=${currentOrgId}`, { withCredentials: true });
              events = eventsResponse.data.events || [];
              console.log('📆 Fetched events:', events.length);
            } catch (eventsError) {
              console.error('❌ Error fetching events:', eventsError.response?.status, eventsError.response?.data || eventsError.message);
              events = [];
            }
            
          } catch (error) {
            console.error('❌ Error fetching org data:', error.response?.data || error.message);
          }
        } else {
          console.log('⚠️ No current organization - user may not be in an org yet');
        }
        
        // Build context data with all information
        const contextData = {
          userOrganizations: organizations.map(org => ({
            id: org.org_id,
            name: org.org_name,
            role: org.role,
            isOwner: org.created_by === user?.user_id,
            memberCount: org.member_count,
            channelCount: org.channel_count,
            joinedAt: org.joined_at
          })),
          currentOrganization: currentOrg ? {
            id: currentOrg.org_id,
            name: currentOrg.org_name,
            role: currentOrg.role,
            memberCount: currentOrg.member_count,
            channelCount: currentOrg.channel_count,
            isOwner: currentOrg.created_by === user?.user_id
          } : null,
          userChannels: channels.map(ch => ({
            id: ch.id || ch.channel_id,
            name: ch.name || ch.channel_name,
            description: ch.description || ch.channel_description
          })),
          organizationMembers: orgMembers.map(m => ({
            id: m.user_id,
            name: m.name,
            email: m.email,
            role: m.role,
            joinedAt: m.joined_at
          })),
          organizationRoles: orgRoles.map(r => ({
            id: r.id || r.role_id,
            name: r.name || r.role_name,
            permissions: {
              manageChannels: r.manageChannels || r.manage_channels,
              manageUsers: r.manageUsers || r.manage_users,
              settingsAccess: r.settingsAccess || r.settings_access,
              notesAccess: r.notesAccess || r.notes_access,
              meetingAccess: r.meetingAccess || r.meeting_access,
              noticeboardAccess: r.noticeboardAccess || r.noticeboard_access,
              rolesAccess: r.rolesAccess || r.roles_access,
              inviteAccess: r.inviteAccess || r.invite_access
            },
            accessibleTeams: r.accessibleTeams || r.accessible_teams || []
          })),
          scheduledMeetings: scheduledMeetings.map(m => ({
            id: m.meeting_id,
            title: m.title,
            description: m.description,
            channelId: m.channel_id,
            channelName: m.channel_name,
            startTime: m.start_time,
            meetingLink: m.meeting_link,
            started: m.started,
            createdBy: m.created_by,
            createdByName: m.created_by_name
          })),
          currentPage: window.location.pathname,
          onlineUsers: [], // Will be populated by socket
          recentMessages: [],
          activeMeetings: [],
          lastActivity: null,
          meetingReports: (meetingReports || []).map(r => ({
            id: r.id,
            title: r.title,
            channelId: r.channelId,
            channelName: r.channelName,
            createdBy: r.createdBy?.name || 'Unknown',
            startedAt: r.startedAt,
            endedAt: r.endedAt,
            durationMinutes: r.durationMinutes,
            participantCount: r.participants?.length || 0,
            messageCount: r.messageCount,
            summary: r.summary,
            createdAt: r.createdAt
          })),
          notes: (notes || []).map(n => ({
            id: n.note_id,
            title: n.title,
            body: n.body?.substring(0, 200), // First 200 chars for context
            pinned: n.pinned,
            channelId: n.channel_id,
            channelName: n.channel_name,
            createdBy: n.created_by_name,
            createdAt: n.created_at,
            updatedAt: n.updated_at
          })),
          notices: (notices || []).map(n => ({
            id: n.notice_id,
            title: n.title,
            body: n.body?.substring(0, 200), // First 200 chars for context
            createdBy: n.created_by_name,
            createdAt: n.created_at
          })),
          events: (events || []).map(e => ({
            id: e.event_id,
            title: e.event_title,
            description: e.event_description,
            time: e.event_time,
            meetingId: e.meeting_id,
            isMeetingEvent: e.is_meeting_event
          }))
        };
        
        console.log('✅ Context gathered successfully:', {
          orgs: contextData.userOrganizations.length,
          currentOrg: contextData.currentOrganization?.name || 'none',
          channels: contextData.userChannels.length,
          members: contextData.organizationMembers.length,
          roles: contextData.organizationRoles.length,
          meetings: contextData.scheduledMeetings.length,
          reports: contextData.meetingReports?.length || 0,
          notes: contextData.notes?.length || 0,
          notices: contextData.notices?.length || 0,
          events: contextData.events?.length || 0
        });
        
        setRealtimeContext(contextData);
    } catch (error) {
      console.error('❌ Error gathering context:', error.response?.data || error.message);
      // Set empty context on error
      setRealtimeContext({
        userOrganizations: [],
        currentOrganization: null,
        userChannels: [],
        organizationMembers: [],
        currentPage: window.location.pathname,
        onlineUsers: [],
        recentMessages: [],
        activeMeetings: [],
        lastActivity: null,
        meetingReports: [],
        notes: [],
        notices: [],
        events: []
      });
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      gatherContext();
    }
  }, [user, user?.org_id, gatherContext]); // Re-fetch when user or org_id changes

  // Listen to real-time socket events for context (same as org settings members tab)
  useEffect(() => {
    if (!socket) return;

    // Listen for online users list (initial load)
    const handleOnlineUsersList = (users) => {
      console.log('Received online users list:', users);
      setRealtimeContext(prev => ({
        ...prev,
        onlineUsers: Array.isArray(users) ? users.map(u => ({
          id: u.id,
          name: u.name,
          email: u.email,
          photo: u.photo,
          status: u.status || 'online',
          customStatus: u.customStatus,
          lastSeen: u.lastSeen
        })) : []
      }));
    };

    // Listen for user status changes (online/offline/away/busy)
    const handleUserStatusChanged = (data) => {
      console.log('User status changed:', data);
      setRealtimeContext(prev => {
        const existingUser = prev.onlineUsers.find(u => u.id === data.userId);
        
        if (data.status === 'offline') {
          // Remove user from online list
          return {
            ...prev,
            onlineUsers: prev.onlineUsers.filter(u => u.id !== data.userId)
          };
        } else if (existingUser) {
          // Update existing user status
          return {
            ...prev,
            onlineUsers: prev.onlineUsers.map(u => 
              u.id === data.userId 
                ? { ...u, status: data.status, customStatus: data.customStatus }
                : u
            )
          };
        } else {
          // Add new online user
          return {
            ...prev,
            onlineUsers: [...prev.onlineUsers, {
              id: data.userId,
              name: data.user?.name || 'Unknown',
              email: data.user?.email || '',
              photo: data.user?.photo || null,
              status: data.status,
              customStatus: data.customStatus
            }]
          };
        }
      });
    };

    // Listen for new messages
    const handleNewMessage = (message) => {
      setRealtimeContext(prev => ({
        ...prev,
        recentMessages: [...prev.recentMessages.slice(-4), {
          channelId: message.channelId,
          userName: message.userName,
          timestamp: Date.now()
        }],
        lastActivity: 'message_received'
      }));
    };

    // Listen for meeting events
    const handleMeetingStart = (data) => {
      console.log('🎥 Meeting started, refreshing context...');
      gatherContext(); // Refresh full context
      setRealtimeContext(prev => ({
        ...prev,
        activeMeetings: [...prev.activeMeetings, {
          channelId: data.channelId,
          roomId: data.roomId,
          startedAt: Date.now()
        }],
        lastActivity: 'meeting_started'
      }));
    };

    const handleMeetingEnd = (data) => {
      console.log('🎥 Meeting ended, refreshing context...');
      gatherContext(); // Refresh full context to get new meeting report
      setRealtimeContext(prev => ({
        ...prev,
        activeMeetings: prev.activeMeetings.filter(m => m.roomId !== data.roomId),
        lastActivity: 'meeting_ended'
      }));
    };

    // Listen for new notes
    const handleNewNote = (data) => {
      console.log('📝 New note created, refreshing context...', data);
      gatherContext(); // Refresh full context
    };

    // Listen for new notices
    const handleNewNotice = (data) => {
      console.log('📢 New notice posted, refreshing context...', data);
      gatherContext(); // Refresh full context
    };

    // Listen for new meetings scheduled
    const handleNewMeeting = (data) => {
      console.log('📅 New meeting scheduled, refreshing context...', data);
      gatherContext(); // Refresh full context
    };

    // Listen for meeting updates
    const handleMeetingUpdate = (data) => {
      console.log('📅 Meeting updated, refreshing context...', data);
      gatherContext(); // Refresh full context
    };

    // Register socket listeners
    socket.on('online_users_list', handleOnlineUsersList);
    socket.on('user_status_changed', handleUserStatusChanged);
    socket.on('newMessage', handleNewMessage);
    socket.on('meetingStarted', handleMeetingStart);
    socket.on('meetingEnded', handleMeetingEnd);
    socket.on('new_note', handleNewNote);
    socket.on('new_notice', handleNewNotice);
    socket.on('new_meeting', handleNewMeeting);
    socket.on('meeting_updated', handleMeetingUpdate);

    // Request current online users when component mounts
    const currentOrgId = user?.org_id;
    if (currentOrgId && user) {
      console.log('🔌 Emitting user_online for org:', currentOrgId);
      socket.emit('user_online', {
        name: user.name,
        photo: user.user_photo,
        org_id: parseInt(currentOrgId)
      });
    } else {
      console.log('⚠️ Not emitting user_online - no org_id on user');
    }

    return () => {
      socket.off('online_users_list', handleOnlineUsersList);
      socket.off('user_status_changed', handleUserStatusChanged);
      socket.off('newMessage', handleNewMessage);
      socket.off('meetingStarted', handleMeetingStart);
      socket.off('meetingEnded', handleMeetingEnd);
      socket.off('new_note', handleNewNote);
      socket.off('new_notice', handleNewNotice);
      socket.off('new_meeting', handleNewMeeting);
      socket.off('meeting_updated', handleMeetingUpdate);
    };
  }, [socket, user, gatherContext]);

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

      const contextToSend = {
        user: {
          id: user?.user_id,
          name: user?.name,
          email: user?.email
        },
        onlineUsers: realtimeContext.onlineUsers || [],
        currentPage: realtimeContext.currentPage || window.location.pathname,
        currentOrganization: realtimeContext.currentOrganization || null,
        userOrganizations: realtimeContext.userOrganizations || [],
        userChannels: realtimeContext.userChannels || [],
        organizationMembers: realtimeContext.organizationMembers || [],
        organizationRoles: realtimeContext.organizationRoles || [],
        scheduledMeetings: realtimeContext.scheduledMeetings || [],
        meetingReports: realtimeContext.meetingReports || [],
        notes: realtimeContext.notes || [],
        notices: realtimeContext.notices || [],
        events: realtimeContext.events || [],
        recentMessages: realtimeContext.recentMessages || [],
        activeMeetings: realtimeContext.activeMeetings || [],
        lastActivity: realtimeContext.lastActivity || null
      };
      
      console.log('Sending context to AI:', contextToSend);

      const response = await axios.post(
        `${baseURL}/api/ai/chat`,
        {
          message: userMessage,
          conversationHistory,
          realtimeContext: contextToSend
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
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md p-2 sm:p-4 transition-all duration-300"
        onClick={onClose}
      >
        {/* Chat Window */}
        <div 
          className="relative w-full max-w-3xl h-[650px] glass-dark rounded-2xl sm:rounded-3xl flex flex-col overflow-hidden animate-fadeIn hover:scale-[1.01] transition-transform"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="absolute inset-0 cosmic-bg"></div>
          {/* Header */}
          <div className="relative bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-700 text-white p-4 sm:p-5 flex items-center justify-between overflow-hidden z-10">
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
          <div className="relative flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 bg-gradient-to-b from-transparent to-purple-50/30 dark:to-purple-900/10 z-10">
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
          <div className="relative p-4 sm:p-5 bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl border-t border-purple-200/30 dark:border-purple-500/20 z-10">
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
