import { useState, useEffect, useRef } from "react";
import { X, Pin, Save, Trash2 } from "lucide-react";
import { toast } from "react-hot-toast";
import axios from "axios";
import ConfirmationModal from "./ConfirmationModal";

const NoticeModal = ({
  isOpen,
  onClose,
  orgId,
  notice = null,
  onNoticeChange,
  canEdit = false,
}) => {
  const [formData, setFormData] = useState({ title: "", body: "" });
  const [isLoading, setIsLoading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showUnsavedChangesModal, setShowUnsavedChangesModal] = useState(false);
  const [pendingAction, setPendingAction] = useState(null);

  const isEditing = Boolean(notice);
  const originalValues = useRef({ title: "", body: "" });

  const checkForUnsavedChanges = () => {
    const original = originalValues.current;
    return (
      formData.title.trim() !== original.title.trim() ||
      formData.body.trim() !== original.body.trim()
    );
  };

  useEffect(() => {
    const hasChanges = checkForUnsavedChanges();
    setHasUnsavedChanges(hasChanges);
  }, [formData]);

  const createNotice = async (noticeData) => {
    try {
      const token = localStorage.getItem("token");
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      const response = await axios.post(
        `${import.meta.env.VITE_BASE_URL}/api/notices`,
        noticeData,
        { withCredentials: true, headers }
      );
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  };

  const updateNotice = async (noticeId, noticeData) => {
    try {
      const token = localStorage.getItem("token");
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      const response = await axios.put(
        `${import.meta.env.VITE_BASE_URL}/api/notices/${noticeId}`,
        noticeData,
        { withCredentials: true, headers }
      );
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  };

  const deleteNotice = async (noticeId) => {
    try {
      const token = localStorage.getItem("token");
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      const response = await axios.delete(
        `${import.meta.env.VITE_BASE_URL}/api/notices/${noticeId}`,
        { withCredentials: true, headers }
      );
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  };

  useEffect(() => {
    const initialData = notice
      ? { title: notice.title || "", body: notice.body || "" }
      : { title: "", body: "" };
    setFormData(initialData);
    originalValues.current = { ...initialData };
    setHasUnsavedChanges(false);
  }, [notice, isOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.body.trim()) {
      toast.error("Please fill in all fields");
      return;
    }

    setIsLoading(true);
    let toastId;

    try {
      const noticeData = {
        org_id: orgId,
        title: formData.title.trim(),
        body: formData.body.trim(),
      };

      if (isEditing) {
        toastId = toast.loading("Updating notice...");
        await updateNotice(notice.notice_id, noticeData);
        toast.success("Notice updated successfully!", { id: toastId });
      } else {
        toastId = toast.loading("Creating notice...");
        await createNotice(noticeData);
        toast.success("Notice created successfully!", { id: toastId });
      }

      onNoticeChange();
      onClose();
    } catch (error) {
      console.error("Error saving notice:", error);
      toast.error(error.message || "Failed to save notice", { id: toastId });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = () => setShowDeleteConfirm(true);

  const confirmDelete = async () => {
    setIsDeleting(true);
    let toastId;
    try {
      toastId = toast.loading("Deleting notice...");
      await deleteNotice(notice.notice_id);
      toast.success("Notice deleted successfully!", { id: toastId });
      setShowDeleteConfirm(false);
      onNoticeChange();
      onClose();
    } catch (error) {
      console.error("Error deleting notice:", error);
      toast.error(error.message || "Failed to delete notice", { id: toastId });
    } finally {
      setIsDeleting(false);
    }
  };

  const handleClose = () => {
    if (hasUnsavedChanges) {
      setPendingAction("close");
      setShowUnsavedChangesModal(true);
    } else {
      onClose();
    }
  };

  const confirmUnsavedChanges = () => {
    setShowUnsavedChangesModal(false);
    if (pendingAction === "close") onClose();
    setPendingAction(null);
  };

  const cancelUnsavedChanges = () => {
    setShowUnsavedChangesModal(false);
    setPendingAction(null);
  };

  if (!isOpen || !canEdit) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md p-2 sm:p-4 transition-all duration-300">
      <div className="relative w-full max-w-2xl max-h-[98vh] sm:max-h-[95vh] bg-gray-900/95 backdrop-blur-xl border border-gray-700/50 rounded-2xl sm:rounded-3xl shadow-2xl overflow-hidden animate-fadeIn hover:scale-[1.01] transition-transform">
        <div className="absolute inset-0 bg-gradient-to-br from-violet-500/10 via-transparent to-indigo-500/10"></div>
        <div className="relative overflow-y-auto max-h-[98vh] sm:max-h-[95vh] px-4 py-6 sm:px-8 sm:py-10">
          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Close Button and Delete Button */}
            {isEditing && (
              <button
                type="button"
                onClick={handleDelete}
                disabled={isDeleting}
                title="Delete Notice"
                className="absolute top-3 right-12 sm:top-5 sm:right-16 text-red-400 hover:text-red-300 cursor-pointer active:scale-95 hover:shadow-lg hover:scale-110 z-10 p-2.5 rounded-full hover:bg-red-500/10 transition-all duration-300"
              >
                <Trash2 size={20} className="sm:w-5 sm:h-5" />
              </button>
            )}
            <button
              type="button"
              onClick={handleClose}
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
                {isEditing ? "Edit Notice" : "Create Notice"}
              </h2>
              <p className="text-gray-300 text-sm sm:text-base">
                {isEditing ? "Update the notice details" : "Create a new notice for your organization"}
              </p>
            </div>

            {/* Notice Details */}
            <div className="space-y-6 sm:space-y-8">
              {/* Title Input */}
              <div>
                <label className="block text-sm font-semibold text-gray-200 mb-2 sm:mb-3">
                  Title
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                  placeholder="Enter notice title..."
                  maxLength={100}
                  className="w-full px-3 py-3 sm:px-4 sm:py-4 rounded-xl sm:rounded-2xl border border-gray-600/50 bg-gray-800/80 text-white text-sm sm:text-base focus:ring-2 focus:ring-blue-500 focus:border-blue-500/50 focus:outline-none placeholder-gray-400 transition-all duration-200 shadow-sm"
                />
                <div className="text-xs text-gray-400 mt-1">
                  {formData.title.length}/100 characters
                </div>
              </div>

              {/* Body Input */}
              <div>
                <label className="block text-sm font-semibold text-gray-200 mb-2 sm:mb-3">
                  Content
                </label>
                <textarea
                  value={formData.body}
                  onChange={(e) => setFormData({ ...formData, body: e.target.value })}
                  rows="6"
                  placeholder="Enter notice content..."
                  maxLength={500}
                  required
                  className="w-full px-3 py-3 sm:px-4 sm:py-4 rounded-xl sm:rounded-2xl border border-gray-600/50 bg-gray-800/80 text-white text-sm sm:text-base focus:ring-2 focus:ring-blue-500 focus:border-blue-500/50 focus:outline-none resize-none placeholder-gray-400 transition-all duration-200 shadow-sm"
                />
                <div className="text-xs text-gray-400 mt-1">
                  {formData.body.length}/500 characters
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row justify-end gap-3 sm:gap-4 pt-6 sm:pt-8 border-t border-gray-700/50">
              <button
                type="button"
                onClick={handleClose}
                disabled={isLoading}
                className="px-4 py-2.5 sm:px-6 sm:py-3 rounded-lg bg-gray-600/20 hover:bg-gray-600/30 border border-gray-500/30 text-gray-400 hover:text-gray-300 font-semibold transition-all duration-200 cursor-pointer active:scale-95 disabled:opacity-50 text-sm sm:text-base shadow-lg hover:shadow-xl"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isLoading || !formData.title.trim() || !formData.body.trim()}
                className={`px-6 py-3 rounded-xl font-semibold transition-all duration-300 cursor-pointer active:scale-95 flex items-center gap-2 justify-center shadow-lg hover:shadow-xl ${
                  hasUnsavedChanges
                    ? "bg-orange-600/20 hover:bg-orange-600/30 border border-orange-500/30 text-orange-400 hover:text-orange-300 text-sm sm:text-base disabled:opacity-50 disabled:cursor-not-allowed"
                    : "bg-violet-600/20 hover:bg-violet-600/30 border border-violet-500/30 text-violet-400 hover:text-violet-300 text-sm sm:text-base disabled:opacity-50 disabled:cursor-not-allowed"
                }`}
              >
                {isLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <Save size={16} />
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

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={confirmDelete}
        title="Delete Notice"
        message="Are you sure you want to delete this notice? This action cannot be undone."
        confirmText="Delete Notice"
        cancelText="Cancel"
        type="danger"
        loading={isDeleting}
      />

      {/* Unsaved Changes Confirmation Modal */}
      <ConfirmationModal
        isOpen={showUnsavedChangesModal}
        onClose={cancelUnsavedChanges}
        onConfirm={confirmUnsavedChanges}
        title="Unsaved Changes"
        message="You have unsaved changes. Are you sure you want to close without saving?"
        confirmText="Discard Changes"
        cancelText="Keep Editing"
        type="warning"
      />
    </div>
  );
};

export default NoticeModal;
