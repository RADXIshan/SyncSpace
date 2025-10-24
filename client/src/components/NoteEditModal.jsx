import { useState, useEffect, useRef } from "react";
import { X, FileText, Pin } from "lucide-react";
import { toast } from "react-hot-toast";
import ConfirmationModal from "./ConfirmationModal";

const NoteEditModal = ({ isOpen, onClose, onSubmit, note }) => {
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [pinned, setPinned] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [showUnsavedChangesModal, setShowUnsavedChangesModal] = useState(false);
  const [pendingAction, setPendingAction] = useState(null);

  // Store original values for comparison
  const originalValues = useRef({
    title: "",
    body: "",
    pinned: false
  });

  // Update form when note changes
  useEffect(() => {
    if (note) {
      setTitle(note.title || "");
      setBody(note.body || "");
      setPinned(note.pinned || false);
      originalValues.current = {
        title: note.title || "",
        body: note.body || "",
        pinned: note.pinned || false
      };
    }
  }, [note]);

  // Check if any field differs from original
  const checkForUnsavedChanges = () => {
    const original = originalValues.current;
    return (
      title !== original.title ||
      body !== original.body ||
      pinned !== original.pinned
    );
  };

  // Detect unsaved changes
  useEffect(() => {
    if (isOpen) {
      setHasUnsavedChanges(checkForUnsavedChanges());
    } else {
      setHasUnsavedChanges(false);
    }
  }, [title, body, pinned, isOpen]);

  // Close with unsaved check
  const handleClose = () => {
    if (hasUnsavedChanges) {
      setPendingAction(() => onClose);
      setShowUnsavedChangesModal(true);
    } else {
      onClose();
    }
  };

  // Confirm discard of unsaved changes
  const discardChanges = () => {
    setShowUnsavedChangesModal(false);
    setHasUnsavedChanges(false);
    if (pendingAction) {
      pendingAction();
      setPendingAction(null);
    }
  };

  // Cancel unsaved changes modal
  const cancelUnsavedChanges = () => {
    setShowUnsavedChangesModal(false);
    setPendingAction(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!title.trim() || !body.trim()) {
      toast.error("Please fill in all required fields");
      return;
    }

    if (!hasUnsavedChanges) {
      toast.info("No changes to update");
      return;
    }

    setIsSaving(true);

    // Update original values
    originalValues.current = { title, body, pinned };
    setHasUnsavedChanges(false);

    try {
      await onSubmit({ title: title.trim(), body: body.trim(), pinned });
      onClose();
    } catch (error) {
      console.error("Error updating note:", error);
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen || !note) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md p-2 sm:p-4 transition-all duration-300">
      <div className="relative w-full max-w-2xl max-h-[98vh] sm:max-h-[95vh] bg-gray-900/95 backdrop-blur-xl border border-gray-700/50 rounded-2xl sm:rounded-3xl shadow-2xl overflow-hidden animate-fadeIn hover:scale-[1.01] transition-transform">
        <div className="absolute inset-0 bg-gradient-to-br from-violet-900/20 via-gray-900/50 to-indigo-900/20"></div>
        <div className="relative overflow-y-auto max-h-[98vh] sm:max-h-[95vh] px-4 py-6 sm:px-8 sm:py-10">
          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Close Button */}
            <button
              type="button"
              onClick={handleClose}
              disabled={isSaving}
              className="absolute top-3 right-3 sm:top-5 sm:right-5 text-gray-400 hover:text-white transition-all transform text-xl cursor-pointer active:scale-95 p-2 rounded-full hover:bg-gray-800/80 hover:rotate-90 duration-300"
            >
              <X size={22} className="sm:w-6 sm:h-6" />
            </button>

            {/* Header */}
            <div className="text-center mb-6 sm:mb-8">
              <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br from-violet-600 to-indigo-700 rounded-xl sm:rounded-2xl flex items-center justify-center mx-auto mb-3 sm:mb-4 shadow-lg">
                <FileText size={24} className="text-white sm:w-8 sm:h-8" />
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold mb-2 text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-indigo-400">
                Edit Note
              </h2>
              <p className="text-gray-300 text-sm sm:text-base">
                Update your note content and settings
              </p>
            </div>

            {/* Note Details */}
            <div className="space-y-6 sm:space-y-8">
              {/* Title Input */}
              <div>
                <label className="block text-sm font-semibold text-gray-200 mb-2 sm:mb-3">
                  Note Title *
                </label>
                <input
                  type="text"
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                  disabled={isSaving}
                  placeholder="Enter your note title"
                  className="w-full px-3 py-3 sm:px-4 sm:py-4 rounded-xl sm:rounded-2xl border border-gray-600/50 bg-gray-800/80 text-white text-sm sm:text-base focus:ring-2 focus:ring-violet-500 focus:border-violet-500/50 focus:outline-none placeholder-gray-400 transition-all duration-200 shadow-sm hover:shadow-md hover:bg-gray-800/90 disabled:opacity-50 disabled:cursor-not-allowed"
                />
              </div>

              {/* Body Input */}
              <div>
                <label className="block text-sm font-semibold text-gray-200 mb-2 sm:mb-3">
                  Note Content *
                </label>
                <textarea
                  id="body"
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  required
                  disabled={isSaving}
                  rows="4"
                  placeholder="Write your note content here..."
                  className="w-full px-3 py-3 sm:px-4 sm:py-4 rounded-xl sm:rounded-2xl border border-gray-600/50 bg-gray-800/80 text-white text-sm sm:text-base focus:ring-2 focus:ring-violet-500 focus:border-violet-500/50 focus:outline-none resize-none placeholder-gray-400 transition-all duration-200 shadow-sm hover:shadow-md hover:bg-gray-800/90 disabled:opacity-50 disabled:cursor-not-allowed"
                />
              </div>

              {/* Pin Toggle */}
              <div className="flex items-center justify-between p-4 rounded-xl bg-gray-800/50 border border-gray-600/30">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center">
                    <Pin size={18} className="text-purple-400" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-gray-200">Pin Note</h3>
                    <p className="text-xs text-gray-400">Keep this note at the top of the list</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setPinned(!pinned)}
                  disabled={isSaving}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-violet-500 focus:ring-offset-2 focus:ring-offset-gray-900 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer ${
                    pinned ? 'bg-violet-600' : 'bg-gray-600'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      pinned ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row justify-end gap-3 sm:gap-4 pt-4 sm:pt-6 border-t border-gray-700/50">
              <button
                type="button"
                onClick={handleClose}
                disabled={isSaving}
                className="px-4 py-2.5 sm:px-6 sm:py-3 rounded-lg bg-gray-600/20 hover:bg-gray-600/30 border border-gray-500/30 text-gray-400 hover:text-gray-300 font-semibold transition-all duration-200 cursor-pointer active:scale-95 disabled:opacity-50 text-sm sm:text-base shadow-lg hover:shadow-xl"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSaving || !title.trim() || !body.trim()}
                className={`px-6 py-3 rounded-xl font-semibold transition-all duration-300 cursor-pointer active:scale-95 flex items-center gap-2 justify-center shadow-lg hover:shadow-xl ${
                  isSaving ? "opacity-50 cursor-not-allowed" : ""
                } ${
                  hasUnsavedChanges
                    ? "bg-orange-600/20 hover:bg-orange-600/30 border border-orange-500/30 text-orange-400 hover:text-orange-300"
                    : "bg-violet-600/20 hover:bg-violet-600/30 border border-violet-500/30 text-violet-400 hover:text-violet-300"
                }`}
              >
                {isSaving ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <FileText size={16} />
                    <span>
                      {hasUnsavedChanges ? "Save Changes*" : "Save Changes"}
                    </span>
                    {hasUnsavedChanges && (
                      <span className="w-2 h-2 bg-orange-400 rounded-full animate-pulse" />
                    )}
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Unsaved Changes Modal */}
      <ConfirmationModal
        isOpen={showUnsavedChangesModal}
        onClose={cancelUnsavedChanges}
        onConfirm={discardChanges}
        title="Unsaved Changes"
        message="You have unsaved changes that will be lost if you continue. Are you sure you want to discard these changes?"
        confirmText="Discard Changes"
        cancelText="Keep Editing"
        type="warning"
        loading={false}
      />
    </div>
  );
};

export default NoteEditModal;
