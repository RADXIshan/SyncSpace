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
      <div className="relative w-full max-w-2xl max-h-[98vh] sm:max-h-[95vh] bg-gray-900/95 backdrop-blur-xl border border-gray-700/50 rounded-2xl sm:rounded-3xl shadow-2xl overflow-hidden animate-fadeIn hover:scale-[1.01] transition-transform">
        <div className="absolute inset-0 bg-gradient-to-br from-violet-500/10 via-transparent to-indigo-500/10"></div>
        <div className="relative overflow-y-auto max-h-[98vh] sm:max-h-[95vh] px-4 py-6 sm:px-8 sm:py-10">
          
          {/* Edit Button and Close Button */}
          {canEdit && (
            <button
              onClick={() => onEdit(notice)}
              title="Edit Notice"
              className="absolute top-3 right-12 sm:top-5 sm:right-16 text-blue-400 hover:text-blue-300 cursor-pointer active:scale-95 hover:shadow-lg hover:scale-110 z-10 p-2.5 rounded-full hover:bg-blue-500/10 transition-all duration-300"
            >
              <Edit size={20} className="sm:w-5 sm:h-5" />
            </button>
          )}
          <button
            onClick={onClose}
            className="absolute top-3 right-3 sm:top-5 sm:right-5 text-gray-400 hover:text-white transition-all transform text-xl cursor-pointer active:scale-95 p-2 rounded-full hover:bg-gray-800/80 hover:rotate-90 duration-300"
          >
            <X size={22} className="sm:w-6 sm:h-6" />
          </button>

          {/* Header */}
          <div className="text-center mb-6 sm:mb-8">
            <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br from-violet-600 to-indigo-700 rounded-xl sm:rounded-2xl flex items-center justify-center mx-auto mb-3 sm:mb-4 shadow-lg">
              <Pin size={24} className="text-white sm:w-8 sm:h-8" />
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold mb-2 text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-indigo-400">
              Notice Details
            </h2>
            <p className="text-gray-300 text-sm sm:text-base">
              View notice information and content
            </p>
          </div>

          {/* Notice Content */}
          <div className="space-y-6 sm:space-y-8">
            {/* Title */}
            <div>
              <label className="block text-sm font-semibold text-gray-200 mb-2 sm:mb-3">
                Title
              </label>
              <div className="w-full px-3 py-3 sm:px-4 sm:py-4 rounded-xl sm:rounded-2xl border border-gray-600/50 bg-gray-800/60 text-white font-medium text-sm sm:text-base">
                {notice.title}
              </div>
            </div>

            {/* Content */}
            <div>
              <label className="block text-sm font-semibold text-gray-200 mb-2 sm:mb-3">
                Content
              </label>
              <div className="w-full px-3 py-3 sm:px-4 sm:py-4 rounded-xl sm:rounded-2xl border border-gray-600/50 bg-gray-800/60 text-gray-200 whitespace-pre-wrap min-h-[120px] text-sm sm:text-base leading-relaxed">
                {notice.body}
              </div>
            </div>

            {/* Meta Information */}
            <div>
              <label className="block text-sm font-semibold text-gray-200 mb-2 sm:mb-3">
                Notice Information
              </label>
              <div className="space-y-3">
                {/* Author */}
                {notice.created_by_name && (
                  <div className="flex items-center gap-3 px-3 py-3 sm:px-4 sm:py-4 rounded-xl border border-gray-600/50 bg-gray-800/60">
                    <User size={16} className="text-violet-400 flex-shrink-0" />
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <span className="text-gray-200 text-sm sm:text-base">Created by</span>
                      <span className="text-white font-medium text-sm sm:text-base truncate">{notice.created_by_name}</span>
                      {notice.created_by_role && (
                        <span
                          className={`px-2 py-1 rounded text-xs font-medium border flex-shrink-0 ${getRoleStyle(notice.created_by_role).background} ${getRoleStyle(notice.created_by_role).border} ${getRoleStyle(notice.created_by_role).text}`}
                        >
                          {notice.created_by_role}
                        </span>
                      )}
                    </div>
                  </div>
                )}
                
                {/* Created Date */}
                <div className="flex items-center gap-3 px-3 py-3 sm:px-4 sm:py-4 rounded-xl border border-gray-600/50 bg-gray-800/60">
                  <Calendar size={16} className="text-green-400 flex-shrink-0" />
                  <div className="flex items-center gap-2">
                    <span className="text-gray-200 text-sm sm:text-base">Created on</span>
                    <span className="text-white font-medium text-sm sm:text-base">{formatDate(notice.created_at)}</span>
                  </div>
                </div>

                {/* Updated Date */}
                {notice.updated_at && notice.updated_at !== notice.created_at && (
                  <div className="flex items-center gap-3 px-3 py-3 sm:px-4 sm:py-4 rounded-xl border border-gray-600/50 bg-gray-800/60">
                    <Calendar size={16} className="text-blue-400 flex-shrink-0" />
                    <div className="flex items-center gap-2">
                      <span className="text-gray-200 text-sm sm:text-base">Last updated</span>
                      <span className="text-white font-medium text-sm sm:text-base">{formatDate(notice.updated_at)}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row justify-end gap-3 sm:gap-4 pt-6 sm:pt-8 mt-6 sm:mt-8 border-t border-gray-700/50">
            <button
              onClick={onClose}
              className="px-4 py-2.5 sm:px-6 sm:py-3 rounded-lg bg-gray-600/20 hover:bg-gray-600/30 border border-gray-500/30 text-gray-400 hover:text-gray-300 font-semibold transition-all duration-200 cursor-pointer active:scale-95 text-sm sm:text-base shadow-lg hover:shadow-xl"
            >
              Close
            </button>
            {canEdit && (
              <button
                onClick={() => onEdit(notice)}
                className="px-6 py-3 rounded-xl font-semibold bg-violet-600/20 hover:bg-violet-600/30 border border-violet-500/30 text-violet-400 hover:text-violet-300 transition-all duration-200 shadow-lg hover:shadow-xl cursor-pointer active:scale-95 flex items-center gap-2 justify-center"
              >
                <Edit size={16} />
                <span>Edit Notice</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default NoticeViewModal;
