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
      <div className="bg-gray-900/80 backdrop-blur-xl border border-white/20 rounded-2xl p-6 w-full max-w-2xl shadow-2xl animate-fadeIn transform transition-all duration-300 scale-100 relative">
        {/* Header */}
        <div className="relative mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-full bg-purple-400/20">
                <Pin size={22} className="text-purple-400" />
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-indigo-400">
                {isEditing ? "Edit Notice" : "Create Notice"}
              </h2>
            </div>

            <div className="flex items-center gap-2">
              {isEditing && (
                <button
                  onClick={handleDelete}
                  disabled={isDeleting}
                  title="Delete Notice"
                  className="absolute top-1 right-12 text-red-400 hover:text-red-300 transition-colors cursor-pointer active:scale-95 z-10 p-2.5 rounded-full border border-transparent hover:bg-red-500/10 duration-300 shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Trash2 size={18} />
                </button>
              )}
              <button
                onClick={handleClose}
                title="Close"
                className="absolute top-1 right-1 text-gray-400 hover:text-white transition-colors cursor-pointer active:scale-95 z-10 p-2 rounded-full hover:bg-white/10 border border-transparent shadow-md hover:shadow-lg duration-300"
              >
                <X size={20} />
              </button>
            </div>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Title Input */}
          <div>
            <label className="block text-sm font-semibold text-gray-300 mb-2">
              Title
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) =>
                setFormData({ ...formData, title: e.target.value })
              }
              className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
              placeholder="Enter notice title..."
              maxLength={100}
              required
            />
            <div className="text-xs text-gray-400 mt-1">
              {formData.title.length}/100 characters
            </div>
          </div>

          {/* Body Input */}
          <div>
            <label className="block text-sm font-semibold text-gray-300 mb-2">
              Content
            </label>
            <textarea
              value={formData.body}
              onChange={(e) =>
                setFormData({ ...formData, body: e.target.value })
              }
              className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all resize-none"
              placeholder="Enter notice content..."
              rows={6}
              maxLength={500}
              required
            />
            <div className="text-xs text-gray-400 mt-1">
              {formData.body.length}/500 characters
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2.5 sm:px-6 sm:py-3 rounded-lg bg-gray-600/20 hover:bg-gray-600/30 border border-gray-500/30 text-gray-400 hover:text-gray-300 font-semibold transition-all duration-200 cursor-pointer active:scale-95 text-sm sm:text-base shadow-lg hover:shadow-xl"
            >
              Cancel
            </button>
            <button
              type="submit"
              className={`px-4 py-2.5 sm:px-6 sm:py-3 rounded-lg font-semibold transition-all duration-200 cursor-pointer active:scale-95 disabled:opacity-50 flex items-center gap-2 text-sm sm:text-base justify-center shadow-lg hover:shadow-xl ${
                hasUnsavedChanges
                  ? "bg-orange-600/20 hover:bg-orange-600/30 border border-orange-500/30 text-orange-400 hover:text-orange-300"
                  : "bg-violet-600/20 hover:bg-violet-600/30 border border-violet-500/30 text-violet-400 hover:text-violet-300"
              }`}
            >
              {isLoading ? (
                <>
                  <div className="w-3 h-3 sm:w-4 sm:h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  <span className="hidden sm:inline">
                    {isEditing ? "Updating..." : "Saving..."}
                  </span>
                  <span className="sm:hidden">
                    {isEditing ? "Upd..." : "Save..."}
                  </span>
                </>
              ) : (
                <>
                  <Save size={14} className="sm:w-4 sm:h-4" />
                  <span className="hidden sm:inline">
                    {hasUnsavedChanges ? "Save Changes*" : "Save Changes"}
                  </span>
                  <span className="sm:hidden">
                    {hasUnsavedChanges ? "Save*" : "Save"}
                  </span>
                  {hasUnsavedChanges && (
                    <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-orange-400 rounded-full animate-pulse" />
                  )}
                </>
              )}
            </button>
          </div>
        </form>
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
