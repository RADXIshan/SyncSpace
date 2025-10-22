import { useState, useEffect, useRef } from "react";
import { X, Hash, Save } from "lucide-react";
import { toast } from "react-hot-toast";
import ConfirmationModal from "./ConfirmationModal";

const EditChannel = ({ isOpen, onClose, onSubmit, channel }) => {
  const [formData, setFormData] = useState({
    name: "",
    description: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [showUnsavedChangesModal, setShowUnsavedChangesModal] = useState(false);
  const [pendingAction, setPendingAction] = useState(null);

  // Original values for change detection
  const originalValues = useRef({
    name: "",
    description: "",
  });

  // Check for unsaved changes
  const checkForUnsavedChanges = () => {
    const original = originalValues.current;
    return (
      formData.name.trim() !== original.name.trim() ||
      formData.description.trim() !== original.description.trim()
    );
  };

  // Track changes for unsaved changes detection
  useEffect(() => {
    const hasChanges = checkForUnsavedChanges();
    setHasUnsavedChanges(hasChanges);
  }, [formData]);

  useEffect(() => {
    if (channel && isOpen) {
      const initialData = {
        name: channel.name || "",
        description: channel.description || "",
      };
      setFormData(initialData);
      originalValues.current = { ...initialData };
      setHasUnsavedChanges(false);
    }
  }, [channel, isOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      toast.error("Channel name is required");
      return;
    }

    setIsLoading(true);
    try {
      await onSubmit(formData);
    } catch (error) {
      // Error is handled in the parent component
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    if (hasUnsavedChanges) {
      setPendingAction('close');
      setShowUnsavedChangesModal(true);
    } else {
      setFormData({ name: "", description: "" });
      onClose();
    }
  };

  const confirmUnsavedChanges = () => {
    setShowUnsavedChangesModal(false);
    if (pendingAction === 'close') {
      setFormData({ name: "", description: "" });
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
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md p-2 sm:p-4 transition-all duration-300">
        <div className="bg-gray-900/80 backdrop-blur-xl border border-white/20 rounded-2xl p-6 w-full max-w-2xl shadow-2xl animate-fadeIn transform transition-all duration-300 scale-100 relative">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-full bg-violet-400/20">
                <Hash size={22} className="text-violet-400" />
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-indigo-400">Edit Channel</h2>
            </div>
            <button
              onClick={handleClose}
              className="absolute top-5 right-5 text-gray-400 hover:text-white transition-colors cursor-pointer active:scale-95 z-10 p-2 rounded-full hover:bg-white/10 border border-transparent shadow-md hover:shadow-lg duration-300"
            >
              <X size={20} />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Channel Name */}
            <div>
              <label className="block text-sm font-semibold text-gray-300 mb-2">
                Channel Name
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all"
                placeholder="Enter channel name..."
                maxLength={50}
                required
              />
              <div className="text-xs text-gray-400 mt-1">
                {formData.name.length}/50 characters
              </div>
            </div>

            {/* Channel Description */}
            <div>
              <label className="block text-sm font-semibold text-gray-300 mb-2">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all resize-none"
                placeholder="Enter channel description..."
                rows={4}
                maxLength={200}
              />
              <div className="text-xs text-gray-400 mt-1">
                {formData.description.length}/200 characters
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
                disabled={isLoading || !formData.name.trim()}
                className={`px-6 py-3 rounded-xl transition-all font-medium flex items-center gap-2 disabled:cursor-not-allowed transform hover:scale-105 active:scale-95 ${
                  hasUnsavedChanges 
                    ? 'bg-green-600 hover:bg-green-700 disabled:bg-green-600/50 text-white shadow-lg shadow-green-500/25' 
                    : 'bg-violet-600 hover:bg-violet-700 disabled:bg-violet-600/50 text-white'
                }`}
              >
                <Save size={18} />
                {isLoading ? "Saving..." : hasUnsavedChanges ? "Save Changes" : "Save"}
              </button>
            </div>
          </form>
        </div>
      </div>

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
    </>
  );
};

export default EditChannel;