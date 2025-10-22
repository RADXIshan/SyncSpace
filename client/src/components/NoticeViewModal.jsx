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
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 transition-all duration-300">
      <div className="bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 rounded-2xl p-6 w-full max-w-3xl border border-white/20 shadow-2xl max-h-[90vh] overflow-y-auto animate-fadeIn transform transition-all duration-300 scale-100">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-full bg-purple-400/20">
              <Pin size={22} className="text-purple-400" />
            </div>
            <h2 className="text-2xl font-semibold text-white">Notice Details</h2>
          </div>
          <div className="flex items-center gap-2">
            {canEdit && (
              <button
                onClick={() => onEdit(notice)}
                className="p-2 rounded-full bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 hover:text-blue-300 transition-all transform hover:scale-110 active:scale-95"
                title="Edit Notice"
              >
                <Edit size={18} />
              </button>
            )}
            <button
              onClick={onClose}
              className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-all transform hover:scale-110 active:scale-95"
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
                  <div className="text-white font-medium">{notice.created_by_name}</div>
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
            className="px-6 py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl transition-all font-medium transform hover:scale-105 active:scale-95"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default NoticeViewModal;