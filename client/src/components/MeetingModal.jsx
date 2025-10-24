import { useState, useEffect } from "react";
import { X, Save, Video, Calendar, Clock, Link, FileText } from "lucide-react";
import { toast } from "react-hot-toast";
import axios from "axios";

const MeetingModal = ({ 
  isOpen, 
  onClose, 
  orgId, 
  channelId = null, 
  meeting = null, 
  onMeetingChange, 
  canEdit = false 
}) => {
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    start_time: "",
    meeting_link: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [linkOption, setLinkOption] = useState("custom"); // "custom" or "generate"
  const [generatedRoomId, setGeneratedRoomId] = useState("");

  const isEditing = Boolean(meeting);
  
  // Check if meeting has started (either marked as started or past start time)
  const isMeetingStarted = meeting && (
    meeting.started || 
    new Date(meeting.start_time) <= new Date()
  );

  // Generate a random room ID
  const generateRoomId = () => {
    const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < 12; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  };

  // Get the base URL for generated meeting links
  const getBaseUrl = () => {
    return window.location.origin;
  };

  // Initialize form data
  useEffect(() => {
    if (meeting) {
      const startTime = new Date(meeting.start_time);
      const formattedDateTime = startTime.toISOString().slice(0, 16); // Format for datetime-local input
      
      setFormData({
        title: meeting.title || "",
        description: meeting.description || "",
        start_time: formattedDateTime,
        meeting_link: meeting.meeting_link || "",
      });
      
      // Determine if it's a generated link or custom link
      const baseUrl = getBaseUrl();
      if (meeting.meeting_link && meeting.meeting_link.startsWith(`${baseUrl}/meeting/`)) {
        setLinkOption("generate");
        const roomId = meeting.meeting_link.replace(`${baseUrl}/meeting/`, "");
        setGeneratedRoomId(roomId);
      } else {
        setLinkOption("custom");
      }
    } else {
      // Set default start time to 1 hour from now
      const defaultTime = new Date();
      defaultTime.setHours(defaultTime.getHours() + 1);
      const formattedDateTime = defaultTime.toISOString().slice(0, 16);
      
      // Generate a new room ID for new meetings
      const newRoomId = generateRoomId();
      setGeneratedRoomId(newRoomId);
      
      setFormData({
        title: "",
        description: "",
        start_time: formattedDateTime,
        meeting_link: "",
      });
      
      setLinkOption("generate"); // Default to generate for new meetings
    }
    setHasUnsavedChanges(false);
  }, [meeting, isOpen]);

  // Update meeting link when option or room ID changes
  useEffect(() => {
    if (linkOption === "generate" && generatedRoomId) {
      const generatedLink = `${getBaseUrl()}/meeting/${generatedRoomId}`;
      setFormData(prev => ({ ...prev, meeting_link: generatedLink }));
    } else if (linkOption === "custom" && formData.meeting_link.startsWith(getBaseUrl())) {
      // Clear the link if switching from generate to custom
      setFormData(prev => ({ ...prev, meeting_link: "" }));
    }
  }, [linkOption, generatedRoomId]);

  // Track changes
  useEffect(() => {
    if (!meeting) {
      setHasUnsavedChanges(
        formData.title.trim() !== "" || 
        formData.description.trim() !== "" || 
        formData.meeting_link.trim() !== ""
      );
    } else {
      const startTime = new Date(meeting.start_time);
      const formattedDateTime = startTime.toISOString().slice(0, 16);
      
      setHasUnsavedChanges(
        formData.title !== (meeting.title || "") ||
        formData.description !== (meeting.description || "") ||
        formData.start_time !== formattedDateTime ||
        formData.meeting_link !== (meeting.meeting_link || "")
      );
    }
  }, [formData, meeting]);

  const handleClose = () => {
    if (hasUnsavedChanges) {
      if (window.confirm("You have unsaved changes. Are you sure you want to close?")) {
        onClose();
      }
    } else {
      onClose();
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.title.trim()) {
      toast.error("Meeting title is required");
      return;
    }
    
    if (!formData.start_time) {
      toast.error("Meeting start time is required");
      return;
    }
    
    if (!formData.meeting_link.trim()) {
      toast.error("Meeting link is required");
      return;
    }

    // Validate start time is in the future (only for new meetings or meetings that haven't started)
    if (!isMeetingStarted) {
      const startTime = new Date(formData.start_time);
      if (startTime <= new Date()) {
        toast.error("Meeting start time must be in the future");
        return;
      }
    }

    setIsLoading(true);

    try {
      const meetingData = {
        org_id: orgId,
        channel_id: channelId,
        title: formData.title.trim(),
        description: formData.description.trim() || null,
        start_time: formData.start_time,
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
      const errorMessage = error.response?.data?.message || "Failed to save meeting";
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md p-2 sm:p-4 transition-all duration-300">
      <div className="relative w-full max-w-2xl max-h-[98vh] sm:max-h-[95vh] bg-gray-900/95 backdrop-blur-xl border border-gray-700/50 rounded-2xl sm:rounded-3xl shadow-2xl overflow-hidden animate-fadeIn hover:scale-[1.01] transition-transform">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-900/20 via-gray-900/50 to-indigo-900/20"></div>
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
              <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-xl sm:rounded-2xl flex items-center justify-center mx-auto mb-3 sm:mb-4 shadow-lg">
                <Video size={24} className="text-white sm:w-8 sm:h-8" />
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold mb-2 text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-400">
                {isEditing ? "Edit Meeting" : "Schedule Meeting"}
              </h2>
              <p className="text-gray-300 text-sm sm:text-base">
                {isEditing ? "Update meeting details" : "Create a new meeting for your team"}
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
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                  placeholder="Enter meeting title..."
                  maxLength={255}
                  className="w-full px-3 py-3 sm:px-4 sm:py-4 rounded-xl sm:rounded-2xl border border-gray-600/50 bg-gray-800/80 text-white text-sm sm:text-base focus:ring-2 focus:ring-blue-500 focus:border-blue-500/50 focus:outline-none placeholder-gray-400 transition-all duration-200 shadow-sm hover:shadow-md hover:bg-gray-800/90"
                />
                <div className="text-xs text-gray-400 mt-1">
                  {formData.title.length}/255 characters
                </div>
              </div>

              {/* Description Input */}
              <div>
                <label className="block text-sm font-semibold text-gray-200 mb-2 sm:mb-3">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows="4"
                  placeholder="Enter meeting description..."
                  maxLength={1000}
                  className="w-full px-3 py-3 sm:px-4 sm:py-4 rounded-xl sm:rounded-2xl border border-gray-600/50 bg-gray-800/80 text-white text-sm sm:text-base focus:ring-2 focus:ring-blue-500 focus:border-blue-500/50 focus:outline-none resize-none placeholder-gray-400 transition-all duration-200 shadow-sm hover:shadow-md hover:bg-gray-800/90"
                />
                <div className="text-xs text-gray-400 mt-1">
                  {formData.description.length}/1000 characters
                </div>
              </div>

              {/* Start Time Input */}
              <div>
                <label className="block text-sm font-semibold text-gray-200 mb-2 sm:mb-3">
                  Start Time
                  {isMeetingStarted && (
                    <span className="ml-2 text-xs text-yellow-400 font-normal">
                      (Cannot be changed - meeting has started)
                    </span>
                  )}
                </label>
                <div className="relative">
                  <input
                    type="datetime-local"
                    value={formData.start_time}
                    onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                    required
                    disabled={isMeetingStarted}
                    className={`w-full px-3 py-3 sm:px-4 sm:py-4 rounded-xl sm:rounded-2xl border text-sm sm:text-base focus:outline-none transition-all duration-200 ${
                      isMeetingStarted
                        ? 'border-gray-700/50 bg-gray-700/50 text-gray-400 cursor-not-allowed'
                        : 'border-gray-600/50 bg-gray-800/80 text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500/50 shadow-sm hover:shadow-md hover:bg-gray-800/90'
                    }`}
                  />
                  <Calendar size={20} className={`absolute right-4 top-1/2 transform -translate-y-1/2 pointer-events-none ${
                    isMeetingStarted ? 'text-gray-500' : 'text-gray-400'
                  }`} />
                </div>
                {isMeetingStarted && (
                  <div className="text-xs text-yellow-400 mt-1">
                    The meeting time cannot be changed because the meeting has already started.
                  </div>
                )}
              </div>

              {/* Meeting Link Options */}
              <div>
                <label className="block text-sm font-semibold text-gray-200 mb-2 sm:mb-3">
                  Meeting Link *
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
                      className="w-4 h-4 text-blue-600 bg-gray-800 border-gray-600 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-300">Generate meeting room</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="linkOption"
                      value="custom"
                      checked={linkOption === "custom"}
                      onChange={(e) => setLinkOption(e.target.value)}
                      className="w-4 h-4 text-blue-600 bg-gray-800 border-gray-600 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-300">Custom meeting link</span>
                  </label>
                </div>

                {linkOption === "generate" ? (
                  <div className="space-y-3">
                    {/* Generated Room ID Input */}
                    <div>
                      <label className="block text-xs font-medium text-gray-400 mb-2">
                        Room ID
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={generatedRoomId}
                          onChange={(e) => setGeneratedRoomId(e.target.value.toLowerCase().replace(/[^a-z0-9]/g, ''))}
                          placeholder="room-id"
                          className="flex-1 px-3 py-2 rounded-lg border border-gray-600/50 bg-gray-800/80 text-white text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500/50 focus:outline-none placeholder-gray-400"
                          maxLength={20}
                        />
                        <button
                          type="button"
                          onClick={() => setGeneratedRoomId(generateRoomId())}
                          className="px-3 py-2 bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/30 text-blue-400 rounded-lg text-sm transition-all"
                        >
                          Generate
                        </button>
                      </div>
                    </div>
                    
                    {/* Generated Link Preview */}
                    <div className="p-3 bg-gray-700/30 rounded-lg border border-gray-600/30">
                      <div className="text-xs text-gray-400 mb-1">Generated meeting link:</div>
                      <div className="text-sm text-blue-400 font-mono break-all">
                        {getBaseUrl()}/meeting/{generatedRoomId || 'room-id'}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="relative">
                    <input
                      type="url"
                      value={formData.meeting_link}
                      onChange={(e) => setFormData({ ...formData, meeting_link: e.target.value })}
                      required
                      placeholder="https://meet.google.com/abc-defg-hij or https://zoom.us/j/123456789"
                      className="w-full px-3 py-3 sm:px-4 sm:py-4 pl-12 rounded-xl sm:rounded-2xl border border-gray-600/50 bg-gray-800/80 text-white text-sm sm:text-base focus:ring-2 focus:ring-blue-500 focus:border-blue-500/50 focus:outline-none placeholder-gray-400 transition-all duration-200 shadow-sm hover:shadow-md hover:bg-gray-800/90"
                    />
                  </div>
                )}
                
                <div className="text-xs text-gray-400 mt-2">
                  {linkOption === "generate" 
                    ? "Generate a meeting room that opens in a new page with the room ID"
                    : "Enter the full meeting URL (Google Meet, Zoom, Teams, etc.)"
                  }
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 pt-6 sm:pt-8 border-t border-gray-700/50">
              <button
                type="button"
                onClick={handleClose}
                className="px-4 py-2.5 sm:px-6 sm:py-3 rounded-lg bg-gray-600/20 hover:bg-gray-600/30 border border-gray-500/30 text-gray-400 hover:text-gray-300 font-semibold transition-all duration-200 cursor-pointer active:scale-95 disabled:opacity-50 text-sm sm:text-base shadow-lg hover:shadow-xl"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isLoading || !formData.title.trim() || !formData.start_time || !formData.meeting_link.trim()}
                className={`w-full sm:w-auto px-6 sm:px-8 py-3 sm:py-4 rounded-xl sm:rounded-2xl transition-all font-medium flex items-center justify-center gap-2 disabled:cursor-not-allowed transform hover:scale-105 active:scale-95 ${
                  hasUnsavedChanges 
                    ? 'bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 disabled:from-green-600/50 disabled:to-green-700/50 text-white shadow-lg shadow-green-500/25 border border-green-500/30' 
                    : 'px-6 py-3 rounded-xl font-medium bg-gradient-to-r bg-violet-600/20 hover:bg-violet-600/30 border border-violet-500/30 text-violet-400 hover:text-violet-300 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl cursor-pointer'
                }`}
              >
                <Save size={18} />
                {isLoading ? "Saving..." : hasUnsavedChanges ? "Save Changes" : isEditing ? "Update Meeting" : "Schedule Meeting"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default MeetingModal;