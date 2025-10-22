import { useState, useEffect, useCallback } from "react";
import { Pin, Plus, Calendar, User, Eye } from "lucide-react";
import { toast } from "react-hot-toast";
import axios from "axios";
import { useAuth } from "../context/AuthContext";
import { getRoleStyle } from "../utils/roleColors";
import NoticeModal from "./NoticeModal";
import NoticeViewModal from "./NoticeViewModal";

const NoticeBoard = ({ orgId, className = "" }) => {
  const { user } = useAuth();
  const [notices, setNotices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // API Functions
  const getNotices = async (orgId) => {
    try {
      const params = { org_id: orgId };

      const token = localStorage.getItem("token");
      const headers = {};
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }

      const response = await axios.get(`${import.meta.env.VITE_BASE_URL}/api/notices`, {
        params,
        withCredentials: true,
        headers,
      });
      
      return response.data;
    } catch (error) {
      console.error("API Error:", error);
      throw error.response?.data || error;
    }
  };

  const fetchNotices = useCallback(async () => {
    if (!orgId) {
      setNotices([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const response = await getNotices(orgId);
      setNotices(response.notices || []);
    } catch (err) {
      console.error("Error fetching notices:", err);
      setError(err);
      
      // Only show error toast for actual errors, not auth issues
      const errorMessage = err.message || "Unknown error";
      if (!["No token provided", "Invalid token", "Token expired"].includes(errorMessage)) {
        // Check if it's a network error or server error
        if (err.code === "NETWORK_ERROR" || err.code === "ERR_NETWORK") {
          toast.error("Network error. Please check your connection.");
        } else if (err.status >= 500) {
          toast.error("Server error. Please try again later.");
        } else if (err.status === 404) {
          // Notices endpoint not found - this might be expected for new orgs
          setNotices([]);
        } else {
          toast.error(`Failed to load notices: ${errorMessage}`);
        }
      }
    } finally {
      setLoading(false);
    }
  }, [orgId]);

  const refreshNotices = useCallback(() => {
    fetchNotices();
  }, [fetchNotices]);

  useEffect(() => {
    fetchNotices();
  }, [fetchNotices]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedNotice, setSelectedNotice] = useState(null);
  const [hasNoticeAccess, setHasNoticeAccess] = useState(false);

  // Check if user has notice access (simplified - you might want to get this from API)
  useEffect(() => {
    // For now, assume all users have access. You can implement proper role checking here
    setHasNoticeAccess(true);
  }, [user]);

  const handleNoticeClick = (notice) => {
    setSelectedNotice(notice);
    setShowViewModal(true);
  };

  const handleEditNotice = (notice) => {
    setSelectedNotice(notice);
    setShowViewModal(false);
    setShowEditModal(true);
  };

  const handleCloseModals = () => {
    setShowCreateModal(false);
    setShowViewModal(false);
    setShowEditModal(false);
    setSelectedNotice(null);
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 1) return "Today";
    if (diffDays === 2) return "Yesterday";
    if (diffDays <= 7) return `${diffDays - 1} days ago`;
    
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: date.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
    });
  };

  const truncateText = (text, maxLength = 120) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + "...";
  };

  return (
    <>
      <section className={`bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 group/notice rounded-2xl p-6 shadow-lg hover:shadow-xl border border-white/20 flex flex-col transition-all ${className}`}>
        <div className="flex flex-col justify-between">
          <div className="flex items-center justify-between mb-6">
            {/* Left section: Pin + Title */}
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-full bg-purple-400/20">
                <Pin size={22} className="text-purple-400 rotate-45 group-hover/notice:rotate-0 duration-200 group-hover/notice:scale-110" />
              </div>
              <h2 className="text-2xl font-semibold text-slate-100">
                Notice Board
              </h2>
            </div>

            {/* Right section: Plus button */}
            {hasNoticeAccess && (
              <button 
                onClick={() => setShowCreateModal(true)}
                title="Add Notice"
                className="text-purple-400 hover:text-purple-300 cursor-pointer p-1.5 rounded-full 
                          bg-purple-400/20 hover:bg-purple-400/30 shadow-sm hover:shadow-md 
                          duration-300 group/plus"
              >
                <Plus size={20} className="group-hover/plus:scale-125 group-hover/plus:rotate-90 duration-300" />
              </button>
            )}
          </div>
        </div>

        <div className="space-y-4 flex-1 overflow-y-auto p-1">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-400"></div>
            </div>
          ) : notices.length === 0 ? (
            <div className="text-center py-8">
              <Pin size={48} className="text-gray-500 mx-auto mb-4 opacity-50" />
              <p className="text-gray-400 text-lg">No notices yet</p>
              {hasNoticeAccess && (
                <p className="text-gray-500 text-sm mt-2">
                  Click the + button to create the first notice
                </p>
              )}
            </div>
          ) : (
            notices.map((notice) => (
              <div 
                key={notice.notice_id}
                className="border border-purple-700/50 bg-purple-700/10 p-4 rounded-xl cursor-pointer transition-all duration-300 group/card hover:border-purple-500 hover:bg-purple-500/20 transform hover:shadow-lg hover:shadow-purple-500/10"
                onClick={() => handleNoticeClick(notice)}
              >
                <div className="flex justify-between items-start gap-4 mb-3">
                  <span className="text-lg font-semibold text-slate-400 group-hover/card:text-slate-100 duration-300 flex-1 line-clamp-2">
                    {notice.title}
                  </span>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    <Eye size={16} className="text-gray-500 group-hover/card:text-gray-300 opacity-0 group-hover/card:opacity-100 transition-opacity" />
                  </div>
                </div>

                <div className="relative max-h-12 overflow-hidden mb-3">
                  <p className="text-sm text-violet-500/60 leading-snug group-hover/card:text-violet-300/70 duration-300">
                    {truncateText(notice.body)}
                  </p>
                </div>

                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-3">
                    {notice.created_by_name && (
                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1 text-slate-500 group-hover/card:text-slate-400">
                          <User size={12} />
                          <span>{notice.created_by_name}</span>
                        </div>
                        {notice.created_by_role && (
                          <span 
                            className={`px-2 py-1 rounded text-xs border ${getRoleStyle(notice.created_by_role).background} ${getRoleStyle(notice.created_by_role).border} ${getRoleStyle(notice.created_by_role).text}`}
                          >
                            {notice.created_by_role}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-1 text-slate-500 group-hover/card:text-slate-400">
                    <Calendar size={12} />
                    <span>{formatDate(notice.created_at)}</span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </section>

      {/* Modals */}
      <NoticeModal
        isOpen={showCreateModal}
        onClose={handleCloseModals}
        orgId={orgId}
        onNoticeChange={refreshNotices}
      />

      <NoticeModal
        isOpen={showEditModal}
        onClose={handleCloseModals}
        orgId={orgId}
        notice={selectedNotice}
        onNoticeChange={refreshNotices}
      />

      <NoticeViewModal
        isOpen={showViewModal}
        onClose={handleCloseModals}
        notice={selectedNotice}
        onEdit={handleEditNotice}
        canEdit={hasNoticeAccess}
      />
    </>
  );
};

export default NoticeBoard;