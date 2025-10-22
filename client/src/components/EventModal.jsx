import { useState, useEffect, useRef } from "react";
import { X, Calendar } from "lucide-react";
import { toast } from "react-hot-toast";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import ConfirmationModal from "./ConfirmationModal";

const EventModal = ({ event, onClose, onUpdate, onDelete }) => {
  const [title, setTitle] = useState(event?.title || "");
  const [dateTime, setDateTime] = useState(event ? new Date(event.start) : new Date());
  const [description, setDescription] = useState(event?.description || "");
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [showUnsavedChangesModal, setShowUnsavedChangesModal] = useState(false);
  const [pendingAction, setPendingAction] = useState(null);
  const [showDeleteConfirmModal, setShowDeleteConfirmModal] = useState(false);

  // Store original values for comparison
  const originalValues = useRef({
    title: event?.title || "",
    dateTime: event ? new Date(event.start) : new Date(),
    description: event?.description || "",
  });

  // Check if any field differs from original
  const checkForUnsavedChanges = () => {
    if (!isEditing) return false;
    const original = originalValues.current;
    return (
      title !== original.title ||
      dateTime.getTime() !== original.dateTime.getTime() ||
      description !== original.description
    );
  };

  // Update when a new event prop is passed
  useEffect(() => {
    if (event) {
      setTitle(event.title);
      setDateTime(new Date(event.start));
      setDescription(event.description || "");
      originalValues.current = {
        title: event.title,
        dateTime: new Date(event.start),
        description: event.description || "",
      };
    }
  }, [event]);

  // Detect unsaved changes
  useEffect(() => {
    if (isEditing) {
      setHasUnsavedChanges(checkForUnsavedChanges());
    } else {
      setHasUnsavedChanges(false);
    }
  }, [title, dateTime, description, isEditing]);

  // Close with unsaved check
  const handleClose = () => {
    if (hasUnsavedChanges) {
      setPendingAction(() => onClose);
      setShowUnsavedChangesModal(true);
    } else {
      onClose();
    }
  };

  // Cancel editing with unsaved check
  const handleCancelEdit = () => {
    if (hasUnsavedChanges) {
      setPendingAction(() => () => {
        setIsEditing(false);
        setTitle(originalValues.current.title);
        setDateTime(originalValues.current.dateTime);
        setDescription(originalValues.current.description);
        setHasUnsavedChanges(false);
      });
      setShowUnsavedChangesModal(true);
    } else {
      setIsEditing(false);
      setTitle(originalValues.current.title);
      setDateTime(originalValues.current.dateTime);
      setDescription(originalValues.current.description);
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

  // Delete confirmation handlers
  const handleDeleteClick = () => {
    setShowDeleteConfirmModal(true);
  };

  const confirmDelete = () => {
    onDelete(event.event_id || event.id);
    setShowDeleteConfirmModal(false);
  };

  const cancelDelete = () => {
    setShowDeleteConfirmModal(false);
  };

  // Submit updates
  const handleSubmit = (e) => {
    e.preventDefault();
    // ... existing code ...
        if (!title || !dateTime) return;
        if (!hasUnsavedChanges) {
          toast("No changes to update");
          return;
        }
    setIsSaving(true);

    const utcISOString = dateTime.toISOString();
    originalValues.current = { title, dateTime, description };
    setHasUnsavedChanges(false);

    const maybePromise = onUpdate({ ...event, title, time: utcISOString, description });
    if (maybePromise && typeof maybePromise.finally === "function") {
      maybePromise.finally(() => setIsSaving(false));
    } else {
      setIsSaving(false);
    }
  };

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
              className="absolute top-3 right-3 sm:top-5 sm:right-5 text-gray-400 hover:text-white transition-colors text-xl cursor-pointer active:scale-95 z-10 p-2 rounded-full hover:bg-gray-800/80 hover:rotate-90"
            >
              <X size={20} className="sm:w-6 sm:h-6" />
            </button>

            {/* Header */}
            <div className="text-center mb-6 sm:mb-8">
              <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br from-violet-600 to-indigo-700 rounded-xl sm:rounded-2xl flex items-center justify-center mx-auto mb-3 sm:mb-4 shadow-lg">
                <Calendar size={24} className="text-white sm:w-8 sm:h-8" />
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold mb-2 text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-indigo-400">
                Event Details
              </h2>
              <p className="text-gray-300 text-sm sm:text-base">
                {isEditing ? "Edit your event information" : "View and manage your event"}
              </p>
            </div>

            {/* Event Information */}
            <div className="space-y-6 sm:space-y-8">
              {/* Title */}
              <div>
                <label className="block text-sm font-semibold text-gray-200 mb-2 sm:mb-3">
                  Event Title {isEditing && "*"}
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    required
                    className="w-full px-3 py-3 sm:px-4 sm:py-4 rounded-xl sm:rounded-2xl border border-gray-600/50 bg-gray-800/80 text-white text-sm sm:text-base focus:ring-2 focus:ring-violet-500 focus:border-violet-500/50 focus:outline-none transition-all duration-200 shadow-sm hover:shadow-md hover:bg-gray-800/90"
                  />
                ) : (
                  <div className="w-full px-3 py-3 sm:px-4 sm:py-4 rounded-xl sm:rounded-2xl border border-gray-600/50 bg-gray-800/60 text-gray-200 font-medium text-sm sm:text-base">
                    {title || "No title provided"}
                  </div>
                )}
              </div>

              {/* Date */}
              <div>
                <label className="block text-sm font-semibold text-gray-200 mb-2 sm:mb-3">
                  Date & Time {isEditing && "*"}
                </label>
                {isEditing ? (
                  <div className="relative">
                    <Calendar className="absolute left-3 top-3 sm:left-4 sm:top-4 text-violet-400 pointer-events-none z-10" size={16} />
                    <DatePicker
                      selected={dateTime}
                      onChange={(date) => setDateTime(date)}
                      showTimeSelect
                      timeFormat="HH:mm"
                      timeIntervals={15}
                      dateFormat="yyyy-MM-dd h:mm aa"
                      className="w-full pl-10 sm:pl-12 pr-3 sm:pr-4 py-3 sm:py-4 rounded-xl sm:rounded-2xl border border-gray-600/50 bg-gray-800/80 text-white text-sm sm:text-base focus:ring-2 focus:ring-violet-500 focus:border-violet-500/50 focus:outline-none placeholder-gray-400 transition-all duration-200 shadow-sm hover:shadow-md hover:bg-gray-800/90"
                      calendarClassName="react-datepicker--light"
                      portalId="datepicker-portal"
                      withPortal
                    />
                  </div>
                ) : (
                  <div className="w-full px-3 py-3 sm:px-4 sm:py-4 rounded-xl sm:rounded-2xl border border-gray-600/50 bg-gray-800/60 text-white font-medium text-sm sm:text-base">
                    {new Date(dateTime).toLocaleString(undefined, {
                      weekday: "long",
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                      hour12: true,
                    })}
                  </div>
                )}
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-semibold text-gray-200 mb-2 sm:mb-3">
                  Description
                </label>
                {isEditing ? (
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows="3"
                    className="w-full px-3 py-3 sm:px-4 sm:py-4 rounded-xl sm:rounded-2xl border border-gray-600/50 bg-gray-800/80 text-white text-sm sm:text-base focus:ring-2 focus:ring-violet-500 focus:border-violet-500/50 focus:outline-none resize-none placeholder-gray-400 transition-all duration-200 shadow-sm hover:shadow-md hover:bg-gray-800/90"
                    placeholder="Add a description for your event..."
                  />
                ) : (
                  <div className="w-full px-3 py-3 sm:px-4 sm:py-4 rounded-xl sm:rounded-2xl border border-gray-600/50 bg-gray-800/60 text-gray-200 whitespace-pre-wrap min-h-[80px] sm:min-h-[100px] text-sm sm:text-base">
                    {description || "No description provided"}
                  </div>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3 sm:gap-4 pt-4 sm:pt-6 border-t border-gray-700/50">
              <button
                type="button"
                onClick={handleDeleteClick}
                className="px-4 py-2.5 sm:px-6 sm:py-3 rounded-lg sm:rounded-xl bg-red-900/40 hover:bg-red-900/60 border border-red-700/50 text-red-400 hover:text-red-300 font-semibold transition-all duration-200 cursor-pointer active:scale-95 shadow-lg hover:shadow-xl text-sm sm:text-base order-2 sm:order-1"
              >
                Delete Event
              </button>

              <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 order-1 sm:order-2">
                {!isEditing && (
                  <button
                    type="button"
                    onClick={() => setIsEditing(true)}
                    className="px-4 py-2.5 sm:px-6 sm:py-3 rounded-lg sm:rounded-xl bg-violet-900/40 hover:bg-violet-900/60 border border-violet-700/50 text-violet-400 hover:text-violet-300 font-semibold transition-all duration-200 cursor-pointer active:scale-95 shadow-lg hover:shadow-xl text-sm sm:text-base"
                  >
                    Edit Event
                  </button>
                )}
                {isEditing && (
                  <button
                    type="button"
                    onClick={handleCancelEdit}
                    className="px-4 py-2.5 sm:px-6 sm:py-3 rounded-lg sm:rounded-xl bg-gray-800/60 hover:bg-gray-700/80 border border-gray-600/50 text-gray-300 hover:text-white font-semibold transition-all duration-200 cursor-pointer active:scale-95 shadow-lg hover:shadow-xl text-sm sm:text-base"
                  >
                    Cancel
                  </button>
                )}
                {isEditing ? (
                  <button
                    type="submit"
                    disabled={isSaving}
                    className={`px-6 py-2.5 sm:px-8 sm:py-3 rounded-lg sm:rounded-xl font-semibold transition-all duration-200 cursor-pointer active:scale-95 flex items-center gap-2 justify-center shadow-lg hover:shadow-xl text-sm sm:text-base ${
                      isSaving ? "opacity-50 cursor-not-allowed" : ""
                    } ${
                      hasUnsavedChanges
                        ? "bg-orange-600/20 hover:bg-orange-600/30 border border-orange-500/30 text-orange-400 hover:text-orange-300"
                        : "bg-violet-900/40 hover:bg-violet-900/60 border border-violet-700/50 text-violet-400 hover:text-violet-300"
                    }`}
                  >
                    {isSaving ? (
                      <>
                        <div className="w-3 h-3 sm:w-4 sm:h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                        <span className="hidden sm:inline">Saving...</span>
                        <span className="sm:hidden">Save...</span>
                      </>
                    ) : (
                      <>
                        <Calendar size={14} className="sm:w-4 sm:h-4" />
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
                ) : (
                  <button
                    type="button"
                    onClick={handleClose}
                    className="px-6 py-2.5 sm:px-8 sm:py-3 rounded-lg sm:rounded-xl bg-gray-800/60 hover:bg-gray-700/80 border border-gray-600/50 text-gray-300 hover:text-white font-semibold transition-all duration-200 cursor-pointer active:scale-95 shadow-lg hover:shadow-xl text-sm sm:text-base"
                  >
                    Close
                  </button>
                )}
              </div>
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

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={showDeleteConfirmModal}
        onClose={cancelDelete}
        onConfirm={confirmDelete}
        title="Delete Event"
        message="Are you sure you want to delete this event? This action cannot be undone."
        confirmText="Delete Event"
        cancelText="Cancel"
        type="danger"
        loading={false}
      />
    </div>
  );
};

export default EventModal;
