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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-md p-4 transition-all duration-300">
      <div className="relative w-full max-w-2xl max-h-[90vh] bg-white/10 dark:bg-gray-900/80 backdrop-blur-xl border border-white/20 rounded-3xl shadow-2xl overflow-hidden animate-fadeIn hover:scale-[1.01] transition-transform">
        <div className="absolute inset-0 bg-gradient-to-br from-violet-500/10 via-transparent to-indigo-500/10"></div>
        <div className="relative overflow-y-auto max-h-[90vh] px-8 py-10">
          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Close Button */}
            <button
              type="button"
              onClick={onClose}
              className="absolute top-5 right-5 text-gray-400 hover:text-white transition-colors text-xl cursor-pointer active:scale-95 z-10"
            >
              <X size={22} />
            </button>

            {/* Header */}
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold mb-2 text-transparent bg-clip-text bg-gradient-to-r from-violet-500 to-indigo-400">
                Add New Event
              </h2>
              <p className="text-gray-400 text-sm">
                Create a new event for your calendar
              </p>
            </div>

            {/* Event Details */}
            <div className="space-y-6">
              {/* Title Input */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Event Title
                </label>
                <input
                  type="text"
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                  placeholder="Enter your event title"
                  className="w-full px-4 py-3 rounded-xl border border-white/10 bg-white/5 text-white focus:ring-2 focus:ring-violet-500 focus:outline-none"
                />
              </div>

              {/* Date & Time Picker */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Date & Time
                </label>
                <div className="relative">
                  <Calendar
                    className="absolute left-3 top-3.5 text-violet-400 pointer-events-none z-10"
                    size={18}
                  />
                  <DatePicker
                    selected={dateTime}
                    onChange={(date) => setDateTime(date)}
                    showTimeSelect
                    timeFormat="HH:mm"
                    timeIntervals={15}
                    dateFormat="yyyy-MM-dd h:mm aa"
                    placeholderText="Select date and time"
                    className="w-full pl-10 px-4 py-3 rounded-xl border border-white/10 bg-white/5 text-white focus:ring-2 focus:ring-violet-500 focus:outline-none placeholder-gray-400"
                    portalId="datepicker-portal"
                    withPortal
                  />
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Description
                </label>
                <textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows="3"
                  placeholder="Write a short note about the event..."
                  className="w-full px-4 py-3 rounded-xl border border-white/10 bg-white/5 text-white focus:ring-2 focus:ring-violet-500 focus:outline-none resize-none placeholder-gray-400"
                />
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end gap-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                disabled={isLoading}
                className="px-6 py-3 rounded-lg bg-gray-600/20 hover:bg-gray-600/30 border border-gray-500/30 text-gray-400 hover:text-gray-300 font-semibold transition-all duration-200 cursor-pointer active:scale-95 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isLoading || !title.trim()}
                className="px-6 py-3 rounded-lg bg-violet-600/20 hover:bg-violet-600/30 border border-violet-500/30 text-violet-400 hover:text-violet-300 font-semibold transition-all duration-200 cursor-pointer active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {isLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    Adding...
                  </>
                ) : (
                  "Add Event"
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
