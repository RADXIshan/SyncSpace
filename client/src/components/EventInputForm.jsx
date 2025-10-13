import { useState, useEffect } from "react";
import { X, Calendar } from "lucide-react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

const EventInputForm = ({ onAddEvent, onClose, initialDate }) => {
  const [title, setTitle] = useState("");
  const [dateTime, setDateTime] = useState(null);
  const [description, setDescription] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    let date = initialDate ? new Date(initialDate) : new Date();
    date.setHours(8, 0, 0, 0);
    setDateTime(date);
  }, [initialDate]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!title || !dateTime) {
      alert("Please fill in all required fields: Title and Date/Time");
      return;
    }

    // Remove manual offset adjustment; store true UTC instant
    const utcISOString = dateTime.toISOString();

    const newEvent = {
      title,
      time: utcISOString, // store as UTC ISO string; DB column should be timestamptz
      description,
    };

    try {
      setIsLoading(true);
      await onAddEvent(newEvent); // Ensure async handling works
      setTitle("");
      setDateTime(null);
      setDescription("");
    } catch (err) {
      console.error("Error adding event:", err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md p-4 transition-all duration-300">
      <div className="relative w-full max-w-2xl max-h-[95vh] bg-gray-900/95 backdrop-blur-xl border border-gray-700/50 rounded-3xl shadow-2xl overflow-hidden animate-fadeIn hover:scale-[1.01] transition-transform">
        <div className="absolute inset-0 bg-gradient-to-br from-violet-900/20 via-gray-900/50 to-indigo-900/20"></div>
        <div className="relative overflow-y-auto max-h-[95vh] px-8 py-10">
          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Close Button */}
            <button
              type="button"
              onClick={onClose}
              className="absolute top-5 right-5 text-gray-400 hover:text-white transition-colors text-xl cursor-pointer active:scale-95 z-10 p-2 rounded-full hover:bg-gray-800/80"
            >
              <X size={22} />
            </button>

            {/* Header */}
            <div className="text-center mb-8 pt-4">
              <div className="w-16 h-16 bg-gradient-to-br from-violet-600 to-indigo-700 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                <Calendar size={32} className="text-white" />
              </div>
              <h2 className="text-3xl font-bold mb-2 text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-indigo-400">
                Add New Event
              </h2>
              <p className="text-gray-300 text-base">
                Create a new event for your calendar
              </p>
            </div>

            {/* Event Details */}
            <div className="space-y-8">
              {/* Title Input */}
              <div>
                <label className="block text-sm font-semibold text-gray-200 mb-3">
                  Event Title *
                </label>
                <input
                  type="text"
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                  placeholder="Enter your event title"
                  className="w-full px-4 py-4 rounded-2xl border border-gray-600/50 bg-gray-800/80 text-white focus:ring-2 focus:ring-violet-500 focus:border-violet-500/50 focus:outline-none placeholder-gray-400 transition-all duration-200 shadow-sm hover:shadow-md hover:bg-gray-800/90"
                />
              </div>

              {/* Date & Time Picker */}
              <div>
                <label className="block text-sm font-semibold text-gray-200 mb-3">
                  Date & Time *
                </label>
                <div className="relative">
                  <Calendar
                    className="absolute left-4 top-4 text-violet-400 pointer-events-none z-10"
                    size={20}
                  />
                  <DatePicker
                    selected={dateTime}
                    onChange={(date) => setDateTime(date)}
                    showTimeSelect
                    timeFormat="HH:mm"
                    timeIntervals={15}
                    dateFormat="yyyy-MM-dd h:mm aa"
                    placeholderText="Select date and time"
                    className="w-full pl-12 pr-4 py-4 rounded-2xl border border-gray-600/50 bg-gray-800/80 text-white focus:ring-2 focus:ring-violet-500 focus:border-violet-500/50 focus:outline-none placeholder-gray-400 transition-all duration-200 shadow-sm hover:shadow-md hover:bg-gray-800/90"
                    calendarClassName="react-datepicker--dark-theme"
                    portalId="datepicker-portal"
                    withPortal
                  />
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-semibold text-gray-200 mb-3">
                  Description
                </label>
                <textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows="4"
                  placeholder="Write a short note about the event..."
                  className="w-full px-4 py-4 rounded-2xl border border-gray-600/50 bg-gray-800/80 text-white focus:ring-2 focus:ring-violet-500 focus:border-violet-500/50 focus:outline-none resize-none placeholder-gray-400 transition-all duration-200 shadow-sm hover:shadow-md hover:bg-gray-800/90"
                />
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end gap-4 pt-6 border-t border-gray-700/50">
              <button
                type="button"
                onClick={onClose}
                disabled={isLoading}
                className="px-8 py-3 rounded-xl bg-gray-800/60 hover:bg-gray-700/80 border border-gray-600/50 text-gray-300 hover:text-white font-semibold transition-all duration-200 cursor-pointer active:scale-95 disabled:opacity-50 shadow-sm hover:shadow-md"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isLoading || !title.trim()}
                className="px-8 py-3 rounded-xl  bg-violet-900/40 hover:bg-violet-900/60 border border-violet-700/50 text-violet-400 hover:text-violet-300 font-semibold transition-all duration-200 cursor-pointer active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shadow-lg hover:shadow-xl"
              >
                {isLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    Creating Event...
                  </>
                ) : (
                  <>
                    <Calendar size={16} />
                    Create Event
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default EventInputForm;
