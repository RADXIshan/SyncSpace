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
        <div className="relative w-full max-w-2xl max-h-[98vh] sm:max-h-[95vh] bg-gray-900/95 backdrop-blur-xl border border-gray-700/50 rounded-2xl sm:rounded-3xl shadow-2xl overflow-hidden animate-fadeIn hover:scale-[1.01] transition-transform">
          <div className="absolute inset-0 bg-gradient-to-br from-violet-900/20 via-gray-900/50 to-indigo-900/20"></div>
          <div className="relative overflow-y-auto max-h-[98vh] sm:max-h-[95vh] px-4 py-6 sm:px-8 sm:py-10">
            <form onSubmit={handleSubmit} className="space-y-8">
              {/* Close Button */}
              <button
                type="button"
                onClick={handleClose}
                className="absolute top-3 right-3 sm:top-5 sm:right-5 text-gray-400 hover:text-white transition-colors text-xl cursor-pointer active:scale-95 z-10 p-2 rounded-full hover:bg-gray-800/80 hover:rotate-90"
              >
                <X size={20} className="sm:w-6 sm:h-6" />
              </button>

              {/* Header */}
              <div className="text-center mb-6 sm:mb-8">
                <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br from-violet-600 to-indigo-700 rounded-xl sm:rounded-2xl flex items-center justify-center mx-auto mb-3 sm:mb-4 shadow-lg">
                  <Hash size={24} className="text-white sm:w-8 sm:h-8" />
                </div>
                <h2 className="text-2xl sm:text-3xl font-bold mb-2 text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-indigo-400">
                  Edit Channel
                </h2>
                <p className="text-gray-300 text-sm sm:text-base">
                  Edit the details of the channel
                </p>
              </div>

              {/* Channel Details */}
              <div className="space-y-6 sm:space-y-8">
                {/* Channel Name */}
                <div>
                  <label className="block text-sm font-semibold text-gray-200 mb-2 sm:mb-3">
                    Channel Name *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                    placeholder="Enter channel name..."
                    maxLength={50}
                    className="w-full px-3 py-3 sm:px-4 sm:py-4 rounded-xl sm:rounded-2xl border border-gray-600/50 bg-gray-800/80 text-white text-sm sm:text-base focus:ring-2 focus:ring-violet-500 focus:border-violet-500/50 focus:outline-none placeholder-gray-400 transition-all duration-200 shadow-sm hover:shadow-md hover:bg-gray-800/90"
                  />
                  <div className="text-xs text-gray-400 mt-1">
                    {formData.name.length}/50 characters
                  </div>
                </div>

                {/* Channel Description */}
                <div>
                  <label className="block text-sm font-semibold text-gray-200 mb-2 sm:mb-3">
                    Description
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows="4"
                    placeholder="Enter channel description..."
                    maxLength={200}
                    className="w-full px-3 py-3 sm:px-4 sm:py-4 rounded-xl sm:rounded-2xl border border-gray-600/50 bg-gray-800/80 text-white text-sm sm:text-base focus:ring-2 focus:ring-violet-500 focus:border-violet-500/50 focus:outline-none resize-none placeholder-gray-400 transition-all duration-200 shadow-sm hover:shadow-md hover:bg-gray-800/90"
                  />
                  <div className="text-xs text-gray-400 mt-1">
                    {formData.description.length}/200 characters
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row justify-end gap-3 sm:gap-4 pt-4 sm:pt-6 border-t border-gray-700/50">
                <button
                  type="button"
                  onClick={handleClose}
                  disabled={isLoading}
                  className="px-6 py-2.5 sm:px-8 sm:py-3 rounded-lg sm:rounded-xl bg-gray-800/60 hover:bg-gray-700/80 border border-gray-600/50 text-gray-300 hover:text-white font-semibold transition-all duration-200 cursor-pointer active:scale-95 disabled:opacity-50 shadow-lg hover:shadow-xl text-sm sm:text-base order-2 sm:order-1"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isLoading || !formData.name.trim()}
                  className={`px-6 py-2.5 sm:px-8 sm:py-3 rounded-lg sm:rounded-xl font-semibold transition-all duration-200 cursor-pointer active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 justify-center shadow-lg hover:shadow-xl text-sm sm:text-base order-1 sm:order-2 ${
                    hasUnsavedChanges 
                      ? 'bg-orange-600/20 hover:bg-orange-600/30 border border-orange-500/30 text-orange-400 hover:text-orange-300' 
                      : 'bg-violet-900/40 hover:bg-violet-900/60 border border-violet-700/50 text-violet-400 hover:text-violet-300'
                  }`}
                >
                  {isLoading ? (
                    <>
                      <div className="w-3 h-3 sm:w-4 sm:h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      <span className="hidden sm:inline">Updating...</span>
                      <span className="sm:hidden">Saving...</span>
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