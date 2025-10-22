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
}) => {
  const [formData, setFormData] = useState({
    title: "",
    body: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showUnsavedChangesModal, setShowUnsavedChangesModal] = useState(false);
  const [pendingAction, setPendingAction] = useState(null);

  const isEditing = Boolean(notice);

  // Original values for change detection
  const originalValues = useRef({
    title: "",
    body: "",
  });

  // Check for unsaved changes
  const checkForUnsavedChanges = () => {
    const original = originalValues.current;
    return (
      formData.title.trim() !== original.title.trim() ||
      formData.body.trim() !== original.body.trim()
    );
  };

  // Track changes for unsaved changes detection
  useEffect(() => {
    const hasChanges = checkForUnsavedChanges();
    setHasUnsavedChanges(hasChanges);
  }, [formData]);

  // API Functions
  const createNotice = async (noticeData) => {
    try {
      const token = localStorage.getItem("token");
      const headers = {};
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }

      const response = await axios.post(
        `${import.meta.env.VITE_BASE_URL}/api/notices`,
        noticeData,
        {
          withCredentials: true,
          headers,
        }
      );
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  };

  const updateNotice = async (noticeId, noticeData) => {
    try {
      const token = localStorage.getItem("token");
      const headers = {};
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }

      const response = await axios.put(
        `${import.meta.env.VITE_BASE_URL}/api/notices/${noticeId}`,
        noticeData,
        {
          withCredentials: true,
          headers,
        }
      );
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  };

  const deleteNotice = async (noticeId) => {
    try {
      const token = localStorage.getItem("token");
      const headers = {};
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }

      const response = await axios.delete(
        `${import.meta.env.VITE_BASE_URL}/api/notices/${noticeId}`,
        {
          withCredentials: true,
          headers,
        }
      );
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  };

  useEffect(() => {
    if (notice) {
      const initialData = {
        title: notice.title || "",
        body: notice.body || "",
      };
      setFormData(initialData);
      originalValues.current = { ...initialData };
    } else {
      const initialData = {
        title: "",
        body: "",
      };
      setFormData(initialData);
      originalValues.current = { ...initialData };
    }
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
        await updateNotice(notice.notice_id, {
          title: formData.title.trim(),
          body: formData.body.trim(),
        });
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

  const handleDelete = () => {
    setShowDeleteConfirm(true);
  };

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
    if (pendingAction === "close") {
      onClose();
    }
    setPendingAction(null);
  };

  const cancelUnsavedChanges = () => {
    setShowUnsavedChangesModal(false);
    setPendingAction(null);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 transition-all duration-300">
      <div className="bg-gray-900/80 backdrop-blur-xl border border-white/20 rounded-2xl p-6 w-full max-w-2xl shadow-2xl animate-fadeIn transform transition-all duration-300 scale-100">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-full bg-purple-400/20">
              <Pin size={22} className="text-purple-400" />
            </div>
            <h2 className="text-2xl font-semibold text-white">
              {isEditing ? "Edit Notice" : "Create Notice"}
            </h2>
          </div>
          <div className="flex items-center gap-2">
            {isEditing && (
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                className="p-2 rounded-full bg-red-500/20 hover:bg-red-500/30 text-red-400 hover:text-red-300 transition-all disabled:opacity-50 transform hover:scale-110 active:scale-95"
                title="Delete Notice"
              >
                <Trash2 size={18} />
              </button>
            )}
            <button
              onClick={handleClose}
              className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-all transform hover:scale-110 active:scale-95"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Title Input */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
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
            <label className="block text-sm font-medium text-gray-300 mb-2">
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
              className="px-6 py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl transition-all font-medium transform hover:scale-105 active:scale-95"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={
                isLoading || !formData.title.trim() || !formData.body.trim()
              }
              className={`px-6 py-3 rounded-xl transition-all font-medium flex items-center gap-2 disabled:cursor-not-allowed transform hover:scale-105 active:scale-95 ${
                hasUnsavedChanges
                  ? "bg-green-600 hover:bg-green-700 disabled:bg-green-600/50 text-white shadow-lg shadow-green-500/25"
                  : "bg-purple-600 hover:bg-purple-700 disabled:bg-purple-600/50 text-white"
              }`}
            >
              <Save size={18} />
              {isLoading
                ? "Saving..."
                : hasUnsavedChanges
                ? "Save Changes"
                : isEditing
                ? "Update"
                : "Create"}
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
