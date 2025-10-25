import { useState, useEffect } from "react";
import { X, Video, Calendar, FileText } from "lucide-react";
import { toast } from "react-hot-toast";
import axios from "axios";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import ConfirmationModal from "./ConfirmationModal";

const MeetingModal = ({
  isOpen,
  onClose,
  orgId,
  channelId = null,
  meeting = null,
  onMeetingChange,
}) => {
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    meeting_link: "",
  });
  const [startDateTime, setStartDateTime] = useState(new Date());
  const [isLoading, setIsLoading] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [linkOption, setLinkOption] = useState("custom"); // "custom" or "generate"
  const [generatedRoomId, setGeneratedRoomId] = useState("");
  const [showUnsavedChangesModal, setShowUnsavedChangesModal] = useState(false);
  const [pendingAction, setPendingAction] = useState(null);

  const isEditing = Boolean(meeting);

  // Check if meeting has started (either marked as started or past start time)
  const isMeetingStarted =
    meeting && (meeting.started || new Date(meeting.start_time) <= new Date());

  const getBaseUrl = () => {
    if (typeof window !== "undefined") {
      return window.location.origin;
    }
    return "";
  };

  // Initialize form data when modal opens or meeting prop changes
  useEffect(() => {
    if (isOpen && meeting) {
      const startTime = new Date(meeting.start_time);
      setStartDateTime(startTime);

      setFormData({
        title: meeting.title || "",
        description: meeting.description || "",
        meeting_link: meeting.meeting_link || "",
      });
      // Determine link option based on meeting_link
      if (meeting.meeting_link?.startsWith(getBaseUrl() + "/meeting/")) {
        setLinkOption("generate");
        setGeneratedRoomId(meeting.meeting_link.split("/meeting/")[1]);
      } else {
        setLinkOption("custom");
      }
    } else if (isOpen && !meeting) {
      // Reset form for new meeting
      const defaultTime = new Date();
      defaultTime.setHours(defaultTime.getHours() + 1);
      setStartDateTime(defaultTime);

      const newRoomId = Math.random().toString(36).substring(2, 10);
      setGeneratedRoomId(newRoomId);

      setFormData({
        title: "",
        description: "",
        meeting_link: `${getBaseUrl()}/meeting/${newRoomId}`,
      });
      setLinkOption("generate");
    }
  }, [isOpen, meeting]);

  // Update meeting link when option or room ID changes
  useEffect(() => {
    if (linkOption === "generate" && generatedRoomId) {
      const generatedLink = `${getBaseUrl()}/meeting/${generatedRoomId}`;
      setFormData((prev) => ({ ...prev, meeting_link: generatedLink }));
    } else if (
      linkOption === "custom" &&
      formData.meeting_link.startsWith(getBaseUrl() + "/meeting/")
    ) {
      // Clear the link if switching from generate to custom
      setFormData((prev) => ({ ...prev, meeting_link: "" }));
    }
  }, [linkOption, generatedRoomId]);

  // Track changes
  useEffect(() => {
    if (!meeting) {
      setHasUnsavedChanges(
        formData.title.trim() !== "" ||
          formData.description.trim() !== "" ||
          (linkOption === "custom" && formData.meeting_link.trim() !== "") ||
          (linkOption === "generate" && generatedRoomId !== "")
      );
    } else {
      const originalStartTime = new Date(meeting.start_time);

      setHasUnsavedChanges(
        formData.title !== (meeting.title || "") ||
          formData.description !== (meeting.description || "") ||
          startDateTime.getTime() !== originalStartTime.getTime() ||
          formData.meeting_link !== (meeting.meeting_link || "")
      );
    }
  }, [formData, startDateTime, meeting, linkOption, generatedRoomId]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleGenerateRoomId = () => {
    const newRoomId = Math.random().toString(36).substring(2, 10);
    setGeneratedRoomId(newRoomId);
    setLinkOption("generate");
    setFormData((prev) => ({
      ...prev,
      meeting_link: `${getBaseUrl()}/meeting/${newRoomId}`,
    }));
  };

  const handleClose = () => {
    if (isEditing && hasUnsavedChanges) {
      setPendingAction(() => onClose);
      setShowUnsavedChangesModal(true);
    } else {
      onClose();
    }
  };

  const discardChanges = () => {
    setShowUnsavedChangesModal(false);
    setHasUnsavedChanges(false);
    if (pendingAction) {
      pendingAction();
      setPendingAction(null);
    }
  };

  const cancelUnsavedChanges = () => {
    setShowUnsavedChangesModal(false);
    setPendingAction(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    if (!formData.title.trim() || !startDateTime) {
      toast.error("Please fill in all required fields");
      setIsLoading(false);
      return;
    }

    if (linkOption === "custom" && !formData.meeting_link.trim()) {
      toast.error("Please provide a meeting link");
      setIsLoading(false);
      return;
    }

    // Validate start time is in the future (only for new meetings or meetings that haven't started)
    if (!isEditing || !isMeetingStarted) {
      if (startDateTime <= new Date()) {
        toast.error("Meeting start time must be in the future");
        setIsLoading(false);
        return;
      }
    }

    try {
      const meetingData = {
        org_id: orgId,
        channel_id: channelId,
        title: formData.title.trim(),
        description: formData.description.trim() || null,
        start_time: startDateTime.toISOString(),
        meeting_link: formData.meeting_link.trim(),
      };

      if (isEditing) {
        await axios.put(
          `${import.meta.env.VITE_BASE_URL}/api/meetings/${meeting.meeting_id}`,
          meetingData,
          { withCredentials: true }
        );
        toast.success("Meeting updated successfully");
      } else {
        await axios.post(
          `${import.meta.env.VITE_BASE_URL}/api/meetings`,
          meetingData,
          { withCredentials: true }
        );
        toast.success("Meeting created successfully");
      }

      if (onMeetingChange) onMeetingChange();
      onClose();
    } catch (error) {
      console.error("Error saving meeting:", error);
      const errorMessage =
        error.response?.data?.message || "Failed to save meeting";
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md p-2 sm:p-4 transition-all duration-300">
      <div className="relative w-full max-w-2xl max-h-[98vh] sm:max-h-[95vh] bg-gray-900/95 backdrop-blur-xl border border-gray-700/50 rounded-2xl sm:rounded-3xl shadow-2xl overflow-hidden animate-fadeIn hover:scale-[1.01] transition-transform">
        <div className="absolute inset-0 bg-gradient-to-br from-violet-500/10 via-transparent to-indigo-500/10"></div>
        <div className="relative overflow-y-auto max-h-[98vh] sm:max-h-[95vh] px-4 py-6 sm:px-8 sm:py-10">
          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Close Button */}
            <button
              type="button"
              onClick={handleClose}
              className="absolute top-3 right-3 sm:top-5 sm:right-5 text-gray-400 hover:text-white transition-all transform text-xl cursor-pointer active:scale-95 z-10 p-2 rounded-full hover:bg-gray-800/80 hover:rotate-90 duration-300"
            >
              <X size={22} className="sm:w-6 sm:h-6" />
            </button>

            {/* Header */}
            <div className="text-center mb-6 sm:mb-8">
              <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br from-violet-600 to-indigo-700 rounded-xl sm:rounded-2xl flex items-center justify-center mx-auto mb-3 sm:mb-4 shadow-lg">
                <Video size={24} className="text-white sm:w-8 sm:h-8" />
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold mb-2 text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-indigo-400">
                {isEditing ? "Edit Meeting" : "Schedule Meeting"}
              </h2>
              <p className="text-gray-300 text-sm sm:text-base">
                {isEditing
                  ? "Update meeting details"
                  : "Create a new meeting for your team"}
              </p>
            </div>

            {/* Meeting Details */}
            <div className="space-y-6 sm:space-y-8">
              {/* Title Input */}
              <div>
                <label className="block text-sm font-semibold text-gray-200 mb-2 sm:mb-3">
                  Meeting Title
                </label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  placeholder="Team Sync, Project Review, etc."
                  className="w-full px-3 py-3 sm:px-4 sm:py-4 rounded-xl sm:rounded-2xl border border-gray-600/50 bg-gray-800/80 text-white text-sm sm:text-base focus:ring-2 focus:ring-blue-500 focus:border-blue-500/50 focus:outline-none placeholder-gray-400 transition-all duration-200 shadow-sm"
                  required
                />
              </div>

              {/* Description Input */}
              <div>
                <label className="block text-sm font-semibold text-gray-200 mb-2 sm:mb-3">
                  Description (Optional)
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  rows="3"
                  placeholder="Brief agenda or key discussion points"
                  className="w-full px-3 py-3 sm:px-4 sm:py-4 rounded-xl sm:rounded-2xl border border-gray-600/50 bg-gray-800/80 text-white text-sm sm:text-base focus:ring-2 focus:ring-blue-500 focus:border-blue-500/50 focus:outline-none placeholder-gray-400 transition-all duration-200 shadow-sm"
                ></textarea>
              </div>

              {/* Date and Time Input */}
              <div>
                <label className="block text-sm font-semibold text-gray-200 mb-2 sm:mb-3">
                  Date and Time
                </label>
                <div className="relative">
                  <Calendar className="absolute top-5 left-5 text-violet-400 pointer-events-none z-10" size={18} />
                  <DatePicker
                    selected={startDateTime}
                    onChange={(date) => setStartDateTime(date)}
                    showTimeSelect
                    timeFormat="HH:mm"
                    timeIntervals={15}
                    dateFormat="yyyy-MM-dd h:mm aa"
                    disabled={isMeetingStarted}
                    className={`w-full pl-10 sm:pl-12 pr-3 sm:pr-4 py-3 sm:py-4 rounded-xl sm:rounded-2xl border border-gray-600/50 bg-gray-800/80 text-white text-sm sm:text-base focus:ring-2 focus:ring-blue-500 focus:border-blue-500/50 focus:outline-none placeholder-gray-400 transition-all duration-200 shadow-sm hover:shadow-md hover:bg-gray-800/90 ${isMeetingStarted ? "opacity-60 cursor-not-allowed" : ""}`}
                    calendarClassName="react-datepicker--light"
                    portalId="datepicker-portal"
                    withPortal
                  />
                </div>
                {isMeetingStarted && (
                  <div className="text-xs text-yellow-400 mt-1">
                    The meeting time cannot be changed because the meeting has
                    already started.
                  </div>
                )}
              </div>

              {/* Meeting Link Options */}
              <div>
                <label className="block text-sm font-semibold text-gray-200 mb-2 sm:mb-3">
                  Meeting Link
                </label>

                {/* Link Option Selector */}
                <div className="flex gap-4 mb-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="linkOption"
                      value="generate"
                      checked={linkOption === "generate"}
                      onChange={(e) => setLinkOption(e.target.value)}
                      className="w-4 h-4 accent-violet-600 bg-gray-800 border-gray-600 focus:ring-violet-500"
                    />
                    <span className="text-sm text-gray-300">
                      Generate meeting room
                    </span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="linkOption"
                      value="custom"
                      checked={linkOption === "custom"}
                      onChange={(e) => setLinkOption(e.target.value)}
                      className="w-4 h-4 accent-violet-600 bg-gray-800 border-gray-600 focus:ring-violet-500"
                    />
                    <span className="text-sm text-gray-300">
                      Custom link
                    </span>
                  </label>
                </div>

                {linkOption === "generate" ? (
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={`${getBaseUrl()}/meeting/${generatedRoomId}`}
                      readOnly
                      className="w-full px-3 py-3 sm:px-4 sm:py-4 rounded-xl sm:rounded-2xl border border-gray-600/50 bg-gray-800/80 text-white text-sm sm:text-base focus:ring-2 focus:ring-blue-500 focus:border-blue-500/50 focus:outline-none placeholder-gray-400 transition-all duration-200 shadow-sm cursor-not-allowed"
                    />
                    <button
                      type="button"
                      onClick={handleGenerateRoomId}
                      className="px-4 py-2.5 sm:px-6 sm:py-3 rounded-lg bg-violet-600/20 hover:bg-violet-600/30 border border-violet-500/30 text-violet-400 hover:text-violet-300 font-semibold transition-all duration-200 cursor-pointer active:scale-95 shadow-lg hover:shadow-xl text-sm sm:text-base whitespace-nowrap"
                    >
                      Generate ID
                    </button>
                  </div>
                ) : (
                  <div className="relative">
                    <input
                      type="url"
                      value={formData.meeting_link}
                      onChange={(e) =>
                        setFormData({ ...formData, meeting_link: e.target.value })
                      }
                      required
                      placeholder="https://meet.google.com/abc-defg-hij"
                      className="w-full px-3 py-3 sm:px-4 sm:py-4 rounded-xl sm:rounded-2xl border border-gray-600/50 bg-gray-800/80 text-white text-sm sm:text-base focus:ring-2 focus:ring-blue-500 focus:border-blue-500/50 focus:outline-none placeholder-gray-400 transition-all duration-200 shadow-sm"
                    />
                  </div>
                )}

                <div className="text-xs text-gray-400 mt-2">
                  {linkOption === "generate"
                    ? "Generate a meeting room that opens in a new page with the room ID"
                    : "Enter the full meeting URL (Google Meet, Zoom, Teams, etc.)"}
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row justify-end gap-3 sm:gap-4 pt-6 sm:pt-8 border-t border-gray-700/50">
              <button
                type="button"
                onClick={handleClose}
                className="px-4 py-2.5 sm:px-6 sm:py-3 rounded-lg bg-gray-600/20 hover:bg-gray-600/30 border border-gray-500/30 text-gray-400 hover:text-gray-300 font-semibold transition-all duration-200 cursor-pointer active:scale-95 disabled:opacity-50 text-sm sm:text-base shadow-lg hover:shadow-xl"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isLoading || !formData.title.trim() || !startDateTime || !formData.meeting_link.trim()}
                className={`px-6 py-3 rounded-xl font-semibold transition-all duration-300 cursor-pointer active:scale-95 flex items-center gap-2 justify-center shadow-lg hover:shadow-xl ${
                  isEditing && hasUnsavedChanges
                    ? "bg-orange-600/20 hover:bg-orange-600/30 border border-orange-500/30 text-orange-400 hover:text-orange-300"
                    : "bg-violet-600/20 hover:bg-violet-600/30 border border-violet-500/30 text-violet-400 hover:text-violet-300"
                }`}
              >
                {isLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <FileText size={16} />
                    <span>
                      {isEditing && hasUnsavedChanges
                        ? "Save Changes*"
                        : "Save Changes"}
                    </span>
                    {isEditing && hasUnsavedChanges && (
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

export default MeetingModal;