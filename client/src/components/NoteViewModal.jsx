import { X, FileText, Pin, Edit2 } from "lucide-react";

const NoteViewModal = ({ isOpen, onClose, note, onEdit, canEdit }) => {
  if (!isOpen || !note) return null;

  const handleEdit = () => {
    onClose();
    onEdit(note);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md p-2 sm:p-4 transition-all duration-300">
      <div className="relative w-full max-w-2xl max-h-[98vh] sm:max-h-[95vh] glass-dark rounded-2xl sm:rounded-3xl overflow-hidden animate-fadeIn hover:scale-[1.01] transition-transform">
        <div className="absolute inset-0 cosmic-bg"></div>
        <div className="relative overflow-y-auto max-h-[98vh] sm:max-h-[95vh] px-4 py-6 sm:px-8 sm:py-10">
          {/* Close Button */}
          <button
            type="button"
            onClick={onClose}
            className="absolute top-3 right-3 sm:top-5 sm:right-5 text-gray-400 hover:text-white transition-all transform text-xl cursor-pointer active:scale-95 p-2 rounded-full hover:bg-gray-800/80 hover:rotate-90 duration-300"
          >
            <X size={22} className="sm:w-6 sm:h-6" />
          </button>

          {/* Header */}
          <div className="text-center mb-6 sm:mb-8">
            <div className="w-12 h-12 sm:w-16 sm:h-16 glass-button-enhanced rounded-xl sm:rounded-2xl flex items-center justify-center mx-auto mb-3 sm:mb-4">
              <FileText size={24} className="text-purple-400 sm:w-8 sm:h-8" />
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold mb-2 gradient-text">
              View Note
            </h2>
            <p className="text-gray-300 text-sm sm:text-base">
              Read-only view of the note
            </p>
          </div>

          {/* Note Content */}
          <div className="space-y-6 sm:space-y-8">
            {/* Title */}
            <div>
              <label className="block text-sm font-semibold text-gray-200 mb-2 sm:mb-3">
                Note Title
              </label>
              <div className="w-full px-3 py-3 sm:px-4 sm:py-4 rounded-xl sm:rounded-2xl glass-effect text-white text-sm sm:text-base bg-gray-800/30">
                <div className="flex items-center gap-2">
                  <span>{note.title}</span>
                  {note.pinned && (
                    <span className="px-2 py-1 bg-purple-500/20 border border-purple-500/30 text-purple-300 text-xs font-medium rounded-full">
                      Pinned
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Body */}
            <div>
              <label className="block text-sm font-semibold text-gray-200 mb-2 sm:mb-3">
                Note Content
              </label>
              <div className="w-full px-3 py-3 sm:px-4 sm:py-4 rounded-xl sm:rounded-2xl glass-effect text-white text-sm sm:text-base bg-gray-800/30 min-h-[120px] whitespace-pre-wrap">
                {note.body}
              </div>
            </div>

            {/* Metadata */}
            <div className="p-4 rounded-xl glass-effect">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <div className="text-sm text-gray-400">
                  <span>Created: {new Date(note.created_at).toLocaleDateString()}</span>
                  {note.created_by_name && (
                    <span className="ml-2">by {note.created_by_name}</span>
                  )}
                </div>
                {note.updated_at && note.updated_at !== note.created_at && (
                  <div className="text-sm text-gray-400">
                    Last updated: {new Date(note.updated_at).toLocaleDateString()}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row justify-end gap-3 sm:gap-4 pt-4 sm:pt-6 border-t border-gray-700/50">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 sm:px-6 sm:py-3 rounded-lg glass-button text-gray-400 hover:text-gray-300 font-semibold transition-all duration-200 cursor-pointer active:scale-95 text-sm sm:text-base"
            >
              Close
            </button>
            {canEdit && (
              <button
                type="button"
                onClick={handleEdit}
                className="px-6 py-3 rounded-xl font-semibold transition-all duration-300 cursor-pointer active:scale-95 flex items-center gap-2 justify-center glass-button-enhanced text-blue-400 hover:text-blue-300"
              >
                <Edit2 size={16} />
                <span>Edit Note</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default NoteViewModal;