import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router";
import {
  Search,
  X,
  Hash,
  File,
  Video,
  User,
  Calendar,
  FileText,
  Bell,
  MessageCircle,
  ClipboardList,
} from "lucide-react";
import axios from "axios";
import { toast } from "react-hot-toast";

const SmartSearch = ({ onClose, onNavigate }) => {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState({
    messages: [],
    files: [],
    meetings: [],
    meetingReports: [],
    users: [],
    notes: [],
    channels: [],
    notices: [],
    events: [],
    directMessages: [],
  });
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("all");
  const inputRef = useRef(null);
  const debounceRef = useRef(null);
  // Cache recent queries to reduce duplicate network calls and improve perceived performance
  const cacheRef = useRef(new Map());
  // AbortController for cancelling in-flight requests when user types quickly
  const controllerRef = useRef(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    // Don't trigger for very short queries
    if (query.length < 1) {
      // Cancel any inflight request
      if (controllerRef.current) {
        try {
          controllerRef.current.abort();
        } catch (e) {}
        controllerRef.current = null;
      }
      setResults({
        messages: [],
        files: [],
        meetings: [],
        meetingReports: [],
        users: [],
        notes: [],
        channels: [],
        notices: [],
        events: [],
        directMessages: [],
      });
      setLoading(false);
      return;
    }

    if (debounceRef.current) clearTimeout(debounceRef.current);

    // Less aggressive debounce to allow for partial word matches
    debounceRef.current = setTimeout(() => {
      performSearch(query);
    }, 150);

    return () => clearTimeout(debounceRef.current);
  }, [query]);

  const performSearch = async (q) => {
    if (!q) return;

    // Return cached result if available
    if (cacheRef.current.has(q)) {
      setResults(cacheRef.current.get(q));
      return;
    }

    setLoading(true);

    // Cancel previous request if any
    if (controllerRef.current) {
      try {
        controllerRef.current.abort();
      } catch (e) {}
    }

    const controller = new AbortController();
    controllerRef.current = controller;

    try {
      // Simple query cleaning - just trim and ensure spaces
      const cleanQuery = q.trim().replace(/\s+/g, " ");

      console.log("Search request:", {
        query: cleanQuery,
        url: `${
          import.meta.env.VITE_BASE_URL
        }/api/search?q=${encodeURIComponent(cleanQuery)}`,
      });

      const response = await axios.get(
        `${import.meta.env.VITE_BASE_URL}/api/search?q=${encodeURIComponent(
          cleanQuery
        )}`,
        {
          withCredentials: true,
          signal: controller.signal,
          timeout: 8000,
        }
      );

      // Log the response for debugging
      console.log("Search response:", {
        query: cleanQuery,
        resultsCount: {
          messages: response.data.messages?.length || 0,
          files: response.data.files?.length || 0,
          meetings: response.data.meetings?.length || 0,
          meetingReports: response.data.meetingReports?.length || 0,
          notes: response.data.notes?.length || 0,
          channels: response.data.channels?.length || 0,
          users: response.data.users?.length || 0,
          notices: response.data.notices?.length || 0,
          events: response.data.events?.length || 0,
          directMessages: response.data.directMessages?.length || 0,
        },
      });

      console.log("Search response:", response.data); // Debug log

      // Initialize empty results object
      const emptyResults = {
        messages: [],
        files: [],
        meetings: [],
        meetingReports: [],
        users: [],
        notes: [],
        channels: [],
        notices: [],
        events: [],
        directMessages: [],
      };

      // Handle both successful responses and no results
      const searchResults = response.data || emptyResults;

      // Cache the results for quick subsequent access
      cacheRef.current.set(q, searchResults);

      // Set results with fallbacks for each category
      setResults({
        messages: searchResults.messages || [],
        files: searchResults.files || [],
        meetings: searchResults.meetings || [],
        meetingReports: searchResults.meetingReports || [],
        users: searchResults.users || [],
        notes: searchResults.notes || [],
        channels: searchResults.channels || [],
        notices: searchResults.notices || [],
        events: searchResults.events || [],
        directMessages: searchResults.directMessages || [],
      });
    } catch (error) {
      // Ignore abort errors caused by quick typing
      if (error.name === "CanceledError" || error.name === "AbortError") {
        // Request was cancelled, do nothing
        return;
      }

      // Handle server errors gracefully with detailed logging
      if (error.response) {
        console.error("Search error response:", {
          status: error.response.status,
          data: error.response.data,
          query: q,
        });

        // Set empty results for server errors
        setResults({
          messages: [],
          files: [],
          meetings: [],
          meetingReports: [],
          users: [],
          notes: [],
          channels: [],
          notices: [],
          events: [],
          directMessages: [],
        });
        return;
      }

      console.error("Search error:", error);
      toast.error("Search failed");
    } finally {
      // Only clear loading if the current controller is ours
      if (controllerRef.current === controller) {
        setLoading(false);
        controllerRef.current = null;
      }
    }
  };

  const tabs = [
    { id: "all", label: "All", count: Object.values(results).flat().length },
    {
      id: "messages",
      label: "Messages",
      icon: Hash,
      count: results.messages?.length || 0,
    },
    {
      id: "directMessages",
      label: "DMs",
      icon: MessageCircle,
      count: results.directMessages?.length || 0,
    },
    {
      id: "files",
      label: "Files",
      icon: File,
      count: results.files?.length || 0,
    },
    {
      id: "meetings",
      label: "Meetings",
      icon: Video,
      count: results.meetings?.length || 0,
    },
    {
      id: "meetingReports",
      label: "Reports",
      icon: ClipboardList,
      count: results.meetingReports?.length || 0,
    },
    {
      id: "notes",
      label: "Notes",
      icon: FileText,
      count: results.notes?.length || 0,
    },
    {
      id: "channels",
      label: "Channels",
      icon: Hash,
      count: results.channels?.length || 0,
    },
    {
      id: "users",
      label: "People",
      icon: User,
      count: results.users?.length || 0,
    },
    {
      id: "notices",
      label: "Notices",
      icon: Bell,
      count: results.notices?.length || 0,
    },
    {
      id: "events",
      label: "Events",
      icon: Calendar,
      count: results.events?.length || 0,
    },
  ];

  const getFilteredResults = () => {
    if (activeTab === "all") return results;
    return { [activeTab]: results[activeTab] || [] };
  };

  const filteredResults = getFilteredResults();

  const handleResultClick = (type, item) => {
    // Close the search modal
    onClose();

    // Navigate based on result type
    switch (type) {
      case "messages":
      case "files":
        // Navigate to the channel where the message/file is
        if (item.channel_id) {
          navigate(`/home/channels/${item.channel_id}`);
        }
        break;

      case "directMessages":
        // Navigate to direct messages with the other user
        if (item.other_user_id) {
          navigate(`/home/messages?user=${item.other_user_id}`);
        }
        break;

      case "channels":
        // Navigate to the channel
        if (item.channel_id) {
          navigate(`/home/channels/${item.channel_id}`);
        }
        break;

      case "meetings":
        // Navigate to calendar or meeting prep
        if (item.meeting_id) {
          navigate(`/home/calendar`);
        }
        break;

      case "meetingReports":
        // Navigate to meeting reports page for that channel
        if (item.channel_id) {
          navigate(`/home/channels/${item.channel_id}/reports`);
        }
        break;

      case "notes":
        // Navigate to the channel where the note is
        if (item.channel_id) {
          navigate(`/home/channels/${item.channel_id}`);
        }
        break;

      case "users":
        // Navigate to direct messages with the user
        if (item.user_id) {
          navigate(`/home/messages?user=${item.user_id}`);
        }
        break;

      case "notices":
        // Navigate to dashboard where notices are displayed
        navigate("/home/dashboard");
        break;

      case "events":
        // Navigate to calendar
        navigate("/home/calendar");
        break;

      default:
        // If custom onNavigate is provided, use it
        if (onNavigate) {
          onNavigate(type, item);
        }
        break;
    }
  };

  return (
    <>
      <style>{`
        .thin-scrollbar::-webkit-scrollbar {
          height: 4px;
          width: 4px;
        }
        .thin-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .thin-scrollbar::-webkit-scrollbar-thumb {
          background-color: rgba(156, 163, 175, 0.3);
          border-radius: 9999px;
        }
        .thin-scrollbar::-webkit-scrollbar-thumb:hover {
          background-color: rgba(156, 163, 175, 0.5);
        }
        .no-scrollbar {
          scrollbar-width: thin;
          scrollbar-color: rgba(156, 163, 175, 0.3) transparent;
        }
      `}</style>
      <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/60 backdrop-blur-md p-2 sm:p-4 pt-20 transition-all duration-300">
        <div className="relative w-full max-w-3xl max-h-[80vh] glass-dark rounded-2xl sm:rounded-3xl flex flex-col overflow-hidden animate-fadeIn hover:scale-[1.01] transition-transform">
          <div className="absolute inset-0 cosmic-bg"></div>
          <div className="relative p-4 sm:p-6 border-b border-gray-200 dark:border-gray-700 z-10">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-gradient-to-br from-purple-500 to-blue-500 rounded-xl shadow-lg">
                <Search className="w-5 h-5 text-white" />
              </div>
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search anything related to your organisation..."
                className="flex-1 bg-transparent text-gray-800 dark:text-white placeholder-gray-400 outline-none text-lg font-medium"
              />
              {loading && (
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 border-2 border-purple-600 border-t-transparent rounded-full animate-spin" />
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    Searching...
                  </span>
                </div>
              )}
              <kbd className="hidden sm:inline-block px-2.5 py-1.5 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded-lg text-xs font-mono shadow-sm">
                ESC
              </kbd>
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-all hover:scale-105"
              >
                <X className="w-5 h-5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200" />
              </button>
            </div>
          </div>

          <div className="relative flex gap-2 px-4 sm:px-6 py-3 border-b border-gray-200 dark:border-gray-700 overflow-x-auto thin-scrollbar z-10 no-scrollbar">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all hover:scale-105 ${
                    activeTab === tab.id
                      ? "bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-lg"
                      : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"
                  }`}
                >
                  {Icon && <Icon className="w-4 h-4" />}
                  {tab.label}
                  {tab.count > 0 && (
                    <span
                      className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                        activeTab === tab.id
                          ? "bg-white/20"
                          : "bg-gray-200 dark:bg-gray-700"
                      }`}
                    >
                      {tab.count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          <div className="relative flex-1 overflow-y-auto p-4 sm:p-6 z-10">
            {query.length < 1 ? (
              <div className="text-center py-16">
                <Search className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
                <p className="text-gray-500 dark:text-gray-400 font-medium">
                  Start typing to search across your organization
                </p>
              </div>
            ) : loading ? (
              // Loading skeleton to indicate active search while typing
              <div className="space-y-3">
                {[1, 2, 3, 4].map((i) => (
                  <div
                    key={i}
                    className="animate-pulse flex items-center gap-3 p-4 rounded-xl bg-gray-100 dark:bg-gray-800/40"
                  >
                    <div className="w-5 h-5 bg-gray-300 dark:bg-gray-700 rounded" />
                    <div className="flex-1">
                      <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-3/4 mb-2" />
                      <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />
                    </div>
                  </div>
                ))}
              </div>
            ) : Object.values(filteredResults).flat().length === 0 ? (
              <div className="text-center py-16">
                <Search className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
                <p className="text-gray-500 dark:text-gray-400 font-medium">
                  No results found for "{query}"
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                {Object.entries(filteredResults).map(
                  ([type, items]) =>
                    items &&
                    items.length > 0 && (
                      <div key={type}>
                        {activeTab === "all" && (
                          <h3 className="text-sm font-bold text-gray-600 dark:text-gray-400 uppercase mb-3 tracking-wide">
                            {type}
                          </h3>
                        )}
                        <div className="space-y-2">
                          {items.map((item, idx) => (
                            <div
                              key={idx}
                              onClick={() => handleResultClick(type, item)}
                              className="group p-4 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer transition-all hover:shadow-md hover:scale-[1.02] border border-transparent hover:border-gray-200 dark:hover:border-gray-600"
                            >
                              <div className="flex items-start gap-3">
                                {type === "messages" && (
                                  <Hash className="w-5 h-5 text-purple-600 mt-0.5 group-hover:scale-110 transition-transform" />
                                )}
                                {type === "directMessages" && (
                                  <MessageCircle className="w-5 h-5 text-blue-500 mt-0.5 group-hover:scale-110 transition-transform" />
                                )}
                                {type === "files" && (
                                  <File className="w-5 h-5 text-blue-600 mt-0.5 group-hover:scale-110 transition-transform" />
                                )}
                                {type === "meetings" && (
                                  <Video className="w-5 h-5 text-green-600 mt-0.5 group-hover:scale-110 transition-transform" />
                                )}
                                {type === "notes" && (
                                  <FileText className="w-5 h-5 text-indigo-600 mt-0.5 group-hover:scale-110 transition-transform" />
                                )}
                                {type === "channels" && (
                                  <Hash className="w-5 h-5 text-teal-600 mt-0.5 group-hover:scale-110 transition-transform" />
                                )}
                                {type === "users" && (
                                  <User className="w-5 h-5 text-orange-600 mt-0.5 group-hover:scale-110 transition-transform" />
                                )}
                                {type === "notices" && (
                                  <Bell className="w-5 h-5 text-red-600 mt-0.5 group-hover:scale-110 transition-transform" />
                                )}
                                {type === "events" && (
                                  <Calendar className="w-5 h-5 text-pink-600 mt-0.5 group-hover:scale-110 transition-transform" />
                                )}
                                {type === "meetingReports" && (
                                  <ClipboardList className="w-5 h-5 text-emerald-600 mt-0.5 group-hover:scale-110 transition-transform" />
                                )}
                                <div className="flex-1 min-w-0">
                                  <div className="text-sm font-semibold text-gray-800 dark:text-white truncate group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                                    {item.other_user_name
                                      ? `DM with ${item.other_user_name}`
                                      : item.meeting_title ||
                                        item.title ||
                                        item.name ||
                                        item.event_title ||
                                        item.file_name ||
                                        item.channel_name}
                                  </div>
                                  {(item.content ||
                                    item.body ||
                                    item.summary ||
                                    item.event_description ||
                                    item.description ||
                                    item.channel_description) && (
                                    <div className="text-xs text-gray-600 dark:text-gray-400 mt-1 line-clamp-2">
                                      {item.content ||
                                        item.body ||
                                        item.summary ||
                                        item.event_description ||
                                        item.description ||
                                        item.channel_description}
                                    </div>
                                  )}
                                  <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                    {item.channel_name &&
                                      `#${item.channel_name} • `}
                                    {item.created_by_name &&
                                      `By ${item.created_by_name} • `}
                                    {item.user_name &&
                                      `By ${item.user_name} • `}
                                    {item.sender_name &&
                                      !item.other_user_name &&
                                      `From ${item.sender_name} • `}
                                    {item.email && `${item.email} • `}
                                    {(item.created_at || item.event_time) &&
                                      new Date(
                                        item.created_at || item.event_time
                                      ).toLocaleDateString()}
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default SmartSearch;
