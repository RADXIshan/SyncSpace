import { X, Pin, Edit, Calendar, User } from "lucide-react";
import { getRoleStyle } from "../utils/roleColors";

const NoticeViewModal = ({ isOpen, onClose, notice, onEdit, canEdit = false }) => {
  if (!isOpen || !notice) return null;

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md p-2 sm:p-4 transition-all duration-300">
      <div className="relative w-full max-w-3xl max-h-[98vh] sm:max-h-[95vh] bg-gray-900/95 backdrop-blur-xl border border-gray-700/50 rounded-2xl sm:rounded-3xl shadow-2xl overflow-hidden animate-fadeIn hover:scale-[1.01] transition-transform">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-900/20 via-gray-900/50 to-indigo-900/20"></div>
        <div className="relative overflow-y-auto max-h-[98vh] sm:max-h-[95vh] px-4 py-6 sm:px-8 sm:py-10">
          
          {/* Header */}
          <div className="flex items-center justify-between mb-6 sm:mb-8">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-full bg-purple-500/20 border border-purple-500/30">
                <Pin size={22} className="text-purple-400" />
              </div>
              <div>
                <h2 className="text-2xl sm:text-3xl font-bold text-white">Notice Details</h2>
              </div>
            </div>
            
            {/* Action Buttons */}
            <div className="flex items-center gap-2">
              {canEdit && (
                <button
                  onClick={() => onEdit(notice)}
                  className="p-2.5 rounded-full hover:bg-blue-500/30 text-blue-400 hover:text-blue-300 transition-all transform hover:scale-110 active:scale-95 cursor-pointer shadow-md hover:shadow-lg duration-300"
                  title="Edit Notice"
                >
                  <Edit size={18} />
                </button>
              )}
              <button
                onClick={onClose}
                className="p-2 rounded-full hover:bg-gray-700/50 text-gray-300 hover:text-white transition-all transform hover:scale-110 active:scale-95 cursor-pointer shadow-md hover:shadow-lg duration-300 hover:rotate-90"
                title="Close"
              >
                <X size={20} />
              </button>
            </div>
          </div>

          {/* Notice Content */}
          <div className="space-y-6 sm:space-y-8">
            {/* Title Section */}
            <div className="bg-gradient-to-r from-purple-500/10 to-indigo-500/10 rounded-2xl p-6 border border-purple-500/20">
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white leading-tight mb-4">
                {notice.title}
              </h1>
              
              {/* Meta Information */}
              <div className="flex flex-wrap items-center gap-4 text-sm text-gray-300">
                {notice.created_by_name && (
                  <div className="flex items-center gap-2 bg-gray-800/50 px-3 py-2 rounded-lg border border-gray-600/30">
                    <User size={16} className="text-purple-400" />
                    <span>By {notice.created_by_name}</span>
                    {notice.created_by_role && (
                      <span
                        className={`px-2 py-1 rounded-md text-xs border ${getRoleStyle(notice.created_by_role).background} ${getRoleStyle(notice.created_by_role).border} ${getRoleStyle(notice.created_by_role).text}`}
                      >
                        {notice.created_by_role}
                      </span>
                    )}
                  </div>
                )}
                <div className="flex items-center gap-2 bg-gray-800/50 px-3 py-2 rounded-lg border border-gray-600/30">
                  <Calendar size={16} className="text-green-400" />
                  <span>Created {formatDate(notice.created_at)}</span>
                </div>
                {notice.updated_at && notice.updated_at !== notice.created_at && (
                  <div className="flex items-center gap-2 bg-gray-800/50 px-3 py-2 rounded-lg border border-gray-600/30">
                    <Calendar size={16} className="text-blue-400" />
                    <span>Updated {formatDate(notice.updated_at)}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Body Content */}
            <div className="bg-gray-800/50 rounded-2xl p-6 sm:p-8 border border-gray-600/50">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-1 h-6 bg-gradient-to-b from-purple-500 to-indigo-500 rounded-full"></div>
                <h3 className="text-lg font-semibold text-purple-300">Notice Content</h3>
              </div>
              <div className="text-gray-200 leading-relaxed whitespace-pre-wrap text-base sm:text-lg">
                {notice.body}
              </div>
            </div>

            {/* Author Info */}
            {notice.created_by_name && (
              <div className="bg-gradient-to-r from-gray-800/50 to-gray-700/50 rounded-2xl p-6 border border-gray-600/50">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-1 h-6 bg-gradient-to-b from-blue-500 to-purple-500 rounded-full"></div>
                  <h3 className="text-lg font-semibold text-blue-300">Author Information</h3>
                </div>
                <div className="flex items-center gap-4">
                  {notice.created_by_photo ? (
                    <img
                      src={notice.created_by_photo}
                      alt={notice.created_by_name}
                      className="w-14 h-14 rounded-full object-cover border-2 border-purple-500/30"
                    />
                  ) : (
                    <div className="w-14 h-14 rounded-full bg-gradient-to-br from-purple-500/20 to-indigo-500/20 flex items-center justify-center border-2 border-purple-500/30">
                      <User size={24} className="text-purple-400" />
                    </div>
                  )}
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="text-white font-semibold text-lg">
                        {notice.created_by_name}
                      </div>
                      {notice.created_by_role && (
                        <span
                          className={`px-3 py-1 rounded-lg text-sm font-medium border ${getRoleStyle(notice.created_by_role).background} ${getRoleStyle(notice.created_by_role).border} ${getRoleStyle(notice.created_by_role).text}`}
                        >
                          {notice.created_by_role}
                        </span>
                      )}
                    </div>
                    <div className="text-gray-400 text-sm">Notice Author</div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 pt-6 sm:pt-8 mt-6 sm:mt-8 border-t border-gray-700/50">
            <button
              onClick={onClose}
              className="px-6 py-2.5 sm:px-8 sm:py-3 rounded-lg sm:rounded-xl bg-gray-800/60 hover:bg-gray-700/80 border border-gray-600/50 text-gray-300 hover:text-white font-semibold transition-all duration-200 cursor-pointer active:scale-95 shadow-lg hover:shadow-xl text-sm sm:text-base"
            >
              Close
            </button>
            {canEdit && (
              <button
                onClick={() => onEdit(notice)}
                className="px-4 py-2.5 sm:px-6 sm:py-3 rounded-lg sm:rounded-xl bg-violet-900/40 hover:bg-violet-900/60 border border-violet-700/50 text-violet-400 hover:text-violet-300 font-semibold transition-all duration-200 cursor-pointer active:scale-95 shadow-lg hover:shadow-xl text-sm sm:text-base flex items-center justify-center gap-2"
              >
                <Edit size={18} />
                Edit Notice
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default NoticeViewModal;
