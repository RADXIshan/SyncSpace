import { useState, useEffect, useRef } from "react";
import { X, Calendar } from "lucide-react";
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
  
  // Original values for change detection
  const originalValues = useRef({
    title: event?.title || "",
    dateTime: event ? new Date(event.start) : new Date(),
    description: event?.description || ""
  });

  // Check for unsaved changes
  const checkForUnsavedChanges = () => {
    if (!isEditing) return false;
    
    const original = originalValues.current;
    return (
      title !== original.title ||
      dateTime.getTime() !== original.dateTime.getTime() ||
      description !== original.description
    );
  };
  
  useEffect(() => {
    if (event) {
      setTitle(event.title);
      setDateTime(new Date(event.start));
      setDescription(event.description || "");
      
      // Update original values
      originalValues.current = {
        title: event.title,
        dateTime: new Date(event.start),
        description: event.description || ""
      };
    }
  }, [event]);
  
  // Track changes for unsaved changes detection
  useEffect(() => {
    if (isEditing) {
      const hasChanges = checkForUnsavedChanges();
      setHasUnsavedChanges(hasChanges);
    } else {
      setHasUnsavedChanges(false);
    }
  }, [title, dateTime, description, isEditing]);
  
  // Handle closing with unsaved changes
  const handleClose = () => {
    if (hasUnsavedChanges) {
      setPendingAction(() => onClose);
      setShowUnsavedChangesModal(true);
    } else {
      onClose();
    }
  };
  
  // Handle cancel editing with unsaved changes
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
  
  // Discard changes and proceed with pending action
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

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!title || !dateTime) return;
    setIsSaving(true);
    const utcISOString = dateTime.toISOString();
    
    // Update original values to reflect the saved state
    originalValues.current = {
      title,
      dateTime,
      description
    };
    setHasUnsavedChanges(false);
    
    const maybePromise = onUpdate({ ...event, title, time: utcISOString, description });
   if (maybePromise && typeof maybePromise.finally === 'function') {
      maybePromise.finally(() => setIsSaving(false));
   } else {
      setIsSaving(false);
   }
  };

  const handleDelete = () => onDelete(event.event_id || event.id);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-md p-4 transition-all duration-300">
      <div className="relative w-full max-w-2xl max-h-[90vh] bg-white/10 dark:bg-gray-900/80 backdrop-blur-xl border border-white/20 rounded-3xl shadow-2xl overflow-hidden animate-fadeIn hover:scale-[1.01] transition-transform">
        <div className="absolute inset-0 bg-gradient-to-br from-violet-500/10 via-transparent to-indigo-500/10"></div>
        <div className="relative overflow-y-auto max-h-[90vh] px-8 py-10">
          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Close Button */}
            <button
              type="button"
              onClick={handleClose}
              className="absolute top-5 right-5 text-gray-400 hover:text-white transition-colors text-xl cursor-pointer active:scale-95 z-10"
            >
              <X size={22} />
            </button>
            
            {/* Header */}
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold mb-2 text-transparent bg-clip-text bg-gradient-to-r from-violet-500 to-indigo-400">
                Event Details
              </h2>
              <p className="text-gray-400 text-sm">
                View and manage your event information
              </p>
            </div>
            {/* Event Information */}
            <div className="space-y-6">
              {/* Title */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Event Title</label>
                {isEditing ? (
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    required
                    className="w-full px-4 py-3 rounded-xl border border-white/10 bg-white/5 text-white focus:ring-2 focus:ring-violet-500 focus:outline-none"
                  />
                ) : (
                  <div className="w-full px-4 py-3 rounded-xl border border-white/10 bg-white/5 text-white">
                    {title || "-"}
                  </div>
                )}
              </div>
              {/* Date */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Date & Time</label>
                {isEditing ? (
                  <div className="relative">
                    <Calendar className="absolute left-3 top-3.5 text-violet-400 pointer-events-none z-10" size={18} />
                    <DatePicker
                      selected={dateTime}
                      onChange={(date) => setDateTime(date)}
                      showTimeSelect
                      timeFormat="HH:mm"
                      timeIntervals={15}
                      dateFormat="yyyy-MM-dd h:mm aa"
                      className="w-full pl-10 px-4 py-3 rounded-xl border border-white/10 bg-white/5 text-white focus:ring-2 focus:ring-violet-500 focus:outline-none placeholder-gray-400"
                      portalId="datepicker-portal"
                      withPortal
                    />
                  </div>
                ) : (
                  <div className="w-full px-4 py-3 rounded-xl border border-white/10 bg-white/5 text-white">
                    {new Date(dateTime).toLocaleString(undefined, { year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit", hour12: true })}
                  </div>
                )}
              </div>
              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Description</label>
                {isEditing ? (
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows="3"
                    className="w-full px-4 py-3 rounded-xl border border-white/10 bg-white/5 text-white focus:ring-2 focus:ring-violet-500 focus:outline-none resize-none placeholder-gray-400"
                    placeholder="Add a description for your event..."
                  />
                ) : (
                  <div className="w-full px-4 py-3 rounded-xl border border-white/10 bg-white/5 text-white whitespace-pre-wrap min-h-[84px]">
                    {description || "-"}
                  </div>
                )}
              </div>
            </div>
            
            {/* Action Buttons */}
            <div className="flex justify-between items-center gap-4 pt-4">
              <button
                type="button"
                onClick={handleDelete}
                className="px-6 py-3 rounded-lg bg-red-600/20 hover:bg-red-600/30 border border-red-500/30 text-red-400 hover:text-red-300 font-semibold transition-all duration-200 cursor-pointer active:scale-95"
              >
                Delete Event
              </button>
              <div className="flex gap-3">
                {!isEditing && (
                  <button
                    type="button"
                    onClick={() => setIsEditing(true)}
                    className="px-6 py-3 rounded-lg bg-violet-600/20 hover:bg-violet-600/30 border border-violet-500/30 text-violet-400 hover:text-violet-300 font-semibold transition-all duration-200 cursor-pointer active:scale-95"
                  >
                    Edit Event
                  </button>
                )}
                {isEditing && (
                  <button
                    type="button"
                    onClick={handleCancelEdit}
                    className="px-6 py-3 rounded-lg bg-gray-600/20 hover:bg-gray-600/30 border border-gray-500/30 text-gray-400 hover:text-gray-300 font-semibold transition-all duration-200 cursor-pointer active:scale-95"
                  >
                    Cancel
                  </button>
                )}
                {isEditing ? (
                  <button
                    type="submit"
                    disabled={isSaving}
                    className={`px-6 py-3 rounded-lg font-semibold transition-all duration-200 cursor-pointer active:scale-95 flex items-center gap-2 justify-center ${
                      isSaving ? 'opacity-50 cursor-not-allowed' : ''
                    } ${
                      hasUnsavedChanges 
                        ? "bg-orange-600/20 hover:bg-orange-600/30 border border-orange-500/30 text-orange-400 hover:text-orange-300" 
                        : "bg-violet-600/20 hover:bg-violet-600/30 border border-violet-500/30 text-violet-400 hover:text-violet-300"
                    }`}
                  >
                    {isSaving ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                        Saving...
                      </>
                    ) : (
                      <>
                        {hasUnsavedChanges ? 'Save Changes*' : 'Save Changes'}
                        {hasUnsavedChanges && (
                          <span className="w-2 h-2 bg-orange-400 rounded-full animate-pulse" />
                        )}
                      </>
                    )}
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleClose}
                    className="px-6 py-3 rounded-lg bg-gray-600/20 hover:bg-gray-600/30 border border-gray-500/30 text-gray-400 hover:text-gray-300 font-semibold transition-all duration-200 cursor-pointer active:scale-95"
                  >
                    Close
                  </button>
                )}
              </div>
            </div>
          </form>
        </div>
      </div>
      
      {/* Unsaved Changes Confirmation Modal */}
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

export default EventModal;
