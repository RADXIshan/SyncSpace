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
  const [userPermissions, setUserPermissions] = useState(null);

  // Fetch user permissions
  useEffect(() => {
    const fetchPermissions = async () => {
      if (!user?.org_id) {
        setHasNoticeAccess(false);
        return;
      }

      try {
        // Fetch both role permissions and organization info
        const [roleRes, orgRes] = await Promise.all([
          axios.get(
            `${import.meta.env.VITE_BASE_URL}/api/orgs/${user.org_id}/role`,
            { withCredentials: true }
          ),
          axios.get(
            `${import.meta.env.VITE_BASE_URL}/api/orgs/${user.org_id}`,
            { withCredentials: true }
          )
        ]);

        const permissions = roleRes.data.permissions || {};
        const organization = orgRes.data.organization || {};
        
        setUserPermissions(permissions);
        
        // User has notice access if they have the permission OR are the org creator
        const isCreator = organization.created_by === user.user_id;
        const hasPermission = Boolean(permissions.noticeboard_access);
        setHasNoticeAccess(isCreator || hasPermission);
      } catch (err) {
        console.error("Error fetching permissions:", err);
        setUserPermissions(null);
        setHasNoticeAccess(false);
      }
    };

    fetchPermissions();
  }, [user?.org_id, user?.user_id]);

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
      <section className={`relative bg-gray-900/95 backdrop-blur-xl border border-gray-700/50 rounded-2xl sm:rounded-3xl shadow-2xl overflow-hidden group/notice flex flex-col transition-all duration-500 hover:scale-[1.02] ${className}`}>
        {/* Background gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-purple-900/20 via-gray-900/50 to-indigo-900/20"></div>
        
        <div className="relative z-10 p-6 sm:p-8 flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between mb-6 sm:mb-8">
            <div className="flex items-center gap-3 sm:gap-4">
              <div className="p-3 sm:p-4 rounded-full bg-purple-500/20 border border-purple-500/30 group-hover/notice:bg-purple-500/30 transition-all duration-300">
                <Pin size={24} className="text-purple-400 rotate-45 group-hover/notice:rotate-0 group-hover/notice:scale-110 transition-all duration-300" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white group-hover/notice:text-purple-100 transition-colors duration-300">
                  Notice Board
                </h2>
                <p className="text-gray-400 text-sm mt-1">Organization announcements</p>
              </div>
            </div>

            {/* Action button */}
            {hasNoticeAccess && (
              <button 
                onClick={() => setShowCreateModal(true)}
                title="Create New Notice"
                className="p-3 rounded-full bg-purple-600/20 hover:bg-purple-600/30 border border-purple-500/30 text-purple-400 hover:text-purple-300 transition-all duration-300 transform hover:scale-110 active:scale-95 shadow-lg group/plus cursor-pointer"
              >
                <Plus size={20} className="group-hover/plus:rotate-90 transition-transform duration-300" />
              </button>
            )}
          </div>

          {/* Content Area */}
          <div className="flex-1 overflow-hidden">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-12 sm:py-16">
                <div className="relative">
                  <div className="animate-spin rounded-full h-12 w-12 border-2 border-purple-500/30"></div>
                  <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-purple-500 absolute top-0 left-0"></div>
                </div>
                <p className="text-gray-400 mt-4 text-sm">Loading notices...</p>
              </div>
            ) : notices.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 sm:py-16 text-center">
                <div className="relative mb-6">
                  <div className="w-20 h-20 rounded-full bg-gradient-to-br from-purple-500/20 to-indigo-500/20 flex items-center justify-center border border-purple-500/30">
                    <Pin size={32} className="text-purple-400 opacity-60" />
                  </div>
                  <div className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-gradient-to-br from-purple-500/30 to-indigo-500/30 animate-pulse"></div>
                </div>
                <h3 className="text-xl font-semibold text-gray-300 mb-2">No notices yet</h3>
                {hasNoticeAccess ? (
                  <p className="text-gray-400 text-sm max-w-xs">
                    Click the + button above to create your first notice and keep everyone informed
                  </p>
                ) : (
                  <p className="text-gray-400 text-sm max-w-xs">
                    Only users with noticeboard access can create notices
                  </p>
                )}
              </div>
            ) : (
              <div className="space-y-3 max-h-full overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-purple-500/30 scrollbar-track-transparent">
                {notices.map((notice) => (
                  <div 
                    key={notice.notice_id}
                    className="group/card relative bg-gray-800/50 hover:bg-gray-700/50 border border-gray-600/50 hover:border-purple-500/50 rounded-xl sm:rounded-2xl p-4 sm:p-6 cursor-pointer transition-all duration-300 transform hover:shadow-lg hover:shadow-purple-500/10"
                    onClick={() => handleNoticeClick(notice)}
                  >
                    {/* Hover gradient overlay */}
                    <div className="absolute inset-0 bg-gradient-to-r from-purple-500/5 to-indigo-500/5 rounded-xl sm:rounded-2xl opacity-0 group-hover/card:opacity-100 transition-opacity duration-300"></div>
                    
                    <div className="relative z-10">
                      {/* Header */}
                      <div className="flex justify-between items-start gap-3 mb-3">
                        <h3 className="text-lg font-semibold text-white group-hover/card:text-purple-100 transition-colors duration-300 flex-1 line-clamp-2 leading-tight">
                          {notice.title}
                        </h3>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <div className="p-1.5 rounded-full bg-purple-500/20 opacity-0 group-hover/card:opacity-100 transition-all duration-300 transform scale-90 group-hover/card:scale-100">
                            <Eye size={14} className="text-purple-400" />
                          </div>
                        </div>
                      </div>

                      {/* Content preview */}
                      <div className="mb-4">
                        <p className="text-xs sm:text-base text-gray-300 group-hover/card:text-gray-200 leading-relaxed line-clamp-2 transition-colors duration-300">
                          {truncateText(notice.body)}
                        </p>
                      </div>

                      {/* Footer */}
                      <div className="flex items-center justify-between text-xs sm:text-sm">
                        <div className="flex items-center gap-3">
                          {notice.created_by_name && (
                            <div className="flex items-center gap-2">
                              <div className="flex items-center gap-2 text-gray-400 group-hover/card:text-gray-300 transition-colors">
                                <User size={14} />
                                <span className="font-medium">{notice.created_by_name}</span>
                              </div>
                              {notice.created_by_role && (
                                <span 
                                  className={`px-2 py-1 rounded-md text-xs font-medium border ${getRoleStyle(notice.created_by_role).background} ${getRoleStyle(notice.created_by_role).border} ${getRoleStyle(notice.created_by_role).text}`}
                                >
                                  {notice.created_by_role}
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                        
                        <div className="flex items-center gap-2 text-gray-400 group-hover/card:text-gray-300 transition-colors">
                          <Calendar size={14} />
                          <span className="font-medium">{formatDate(notice.created_at)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Modals */}
      <NoticeModal
        isOpen={showCreateModal}
        onClose={handleCloseModals}
        orgId={orgId}
        onNoticeChange={refreshNotices}
        canEdit={hasNoticeAccess}
      />

      <NoticeModal
        isOpen={showEditModal}
        onClose={handleCloseModals}
        orgId={orgId}
        notice={selectedNotice}
        onNoticeChange={refreshNotices}
        canEdit={hasNoticeAccess}
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