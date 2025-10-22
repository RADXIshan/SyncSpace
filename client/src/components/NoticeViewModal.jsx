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
      <div className="bg-gray-900/80 backdrop-blur-xl border border-white/20 rounded-2xl p-6 w-full max-w-2xl shadow-2xl animate-fadeIn transform transition-all duration-300 scale-100 relative">
        
        {/* Header */}
        <div className="relative mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-full bg-purple-400/20">
                <Pin size={22} className="text-purple-400" />
              </div>
              <h2 className="text-2xl font-semibold text-white">Notice Details</h2>
            </div>
          </div>

          {/* Edit and Close Buttons */}
          <div className="absolute top-0 right-0 flex items-center gap-2">
            {canEdit && (
              <button
                onClick={() => onEdit(notice)}
                className="text-blue-400 hover:text-blue-300 hover:bg-blue-400/10 transition-colors text-xl cursor-pointer active:scale-95 p-2.5 rounded-full duration-300"
                title="Edit Notice"
              >
                <Edit size={18} />
              </button>
            )}
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white transition-colors text-xl cursor-pointer active:scale-95 p-2 rounded-full hover:bg-white/10 duration-300"
              title="Close"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Notice Content */}
        <div className="space-y-6">
          {/* Title */}
          <div>
            <h1 className="text-3xl font-bold text-white mb-4 leading-tight">
              {notice.title}
            </h1>
          </div>

          {/* Meta Information */}
          <div className="flex flex-wrap items-center gap-4 text-sm text-gray-400 border-b border-white/10 pb-4">
            {notice.created_by_name && (
              <div className="flex items-center gap-2">
                <User size={16} />
                <span>By {notice.created_by_name}</span>
                {notice.created_by_role && (
                  <span
                    className={`px-2 py-1 rounded text-xs border ${getRoleStyle(notice.created_by_role).background} ${getRoleStyle(notice.created_by_role).border} ${getRoleStyle(notice.created_by_role).text}`}
                  >
                    {notice.created_by_role}
                  </span>
                )}
              </div>
            )}
            <div className="flex items-center gap-2">
              <Calendar size={16} />
              <span>Created {formatDate(notice.created_at)}</span>
            </div>
            {notice.updated_at && notice.updated_at !== notice.created_at && (
              <div className="flex items-center gap-2">
                <Calendar size={16} />
                <span>Updated {formatDate(notice.updated_at)}</span>
              </div>
            )}
          </div>

          {/* Body */}
          <div className="bg-white/5 rounded-xl p-6 border border-white/10">
            <div className="text-gray-200 leading-relaxed whitespace-pre-wrap">
              {notice.body}
            </div>
          </div>

          {/* Author Info */}
          {notice.created_by_name && (
            <div className="flex items-center gap-3 p-4 bg-white/5 rounded-xl border border-white/10">
              {notice.created_by_photo ? (
                <img
                  src={notice.created_by_photo}
                  alt={notice.created_by_name}
                  className="w-10 h-10 rounded-full object-cover"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center">
                  <User size={20} className="text-purple-400" />
                </div>
              )}
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <div className="text-white font-medium">
                    {notice.created_by_name}
                  </div>
                  {notice.created_by_role && (
                    <span
                      className={`px-2 py-1 rounded text-xs border ${getRoleStyle(notice.created_by_role).background} ${getRoleStyle(notice.created_by_role).border} ${getRoleStyle(notice.created_by_role).text}`}
                    >
                      {notice.created_by_role}
                    </span>
                  )}
                </div>
                <div className="text-gray-400 text-sm">Notice Author</div>
              </div>
            </div>
          )}
        </div>

        {/* Close Button */}
        <div className="flex justify-end pt-6 mt-6 border-t border-white/10">
          <button
            onClick={onClose}
            className="px-4 py-2.5 sm:px-6 sm:py-3 rounded-lg bg-gray-600/20 hover:bg-gray-600/30 border border-gray-500/30 text-gray-400 hover:text-gray-300 font-semibold transition-all duration-300 cursor-pointer active:scale-95 text-sm sm:text-base shadow-lg hover:shadow-xl"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default NoticeViewModal;
