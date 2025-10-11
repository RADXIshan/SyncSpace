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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-md p-4 sm:p-6 transition-opacity duration-300">
      <div className="relative w-full max-w-lg bg-white/10 dark:bg-gray-900/80 backdrop-blur-xl border border-white/20 rounded-3xl shadow-2xl overflow-hidden animate-fadeIn hover:scale-[1.01] transition-transform">
        <div className="absolute inset-0 bg-gradient-to-br from-violet-500/10 via-transparent to-indigo-500/10"></div>
        <form
          onSubmit={handleSubmit}
          className="relative p-8"
        >
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors cursor-pointer active:scale-95 p-2 rounded-full hover:bg-white/10"
        >
          <X size={20} />
        </button>

        {/* Heading */}
        <h2 className="text-3xl font-bold mb-8 gradient-text">
          Add New Event
        </h2>

        {/* Title Input */}
        <div className="form-group">
          <label
            htmlFor="title"
            className="form-label-dark"
          >
            Event Title
          </label>
          <input
            type="text"
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            placeholder="Enter your event title"
            className="input-glass"
          />
        </div>

        {/* Date & Time Picker */}
        <div className="form-group">
          <label className="form-label-dark">
            Date & Time
          </label>
          <div className="relative">
            <Calendar
              className="absolute left-3 top-3.5 text-purple-400 pointer-events-none z-10"
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
              className="w-full pl-10 px-4 py-3 rounded-lg bg-white/10 backdrop-blur-sm border border-white/20 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition-all duration-200 text-white placeholder-gray-300"
              portalId="datepicker-portal"
              withPortal
            />
          </div>
        </div>

        {/* Description */}
        <div className="form-group">
          <label
            htmlFor="description"
            className="form-label-dark"
          >
            Description
          </label>
          <textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows="3"
            placeholder="Write a short note about the event..."
            className="input-glass resize-none"
          />
        </div>

        {/* Buttons */}
        <div className="flex flex-col sm:flex-row justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-3 rounded-lg bg-gray-600/20 hover:bg-gray-600/30 border border-gray-500/30 text-gray-400 hover:text-gray-300 font-semibold transition-all duration-200 cursor-pointer active:scale-95 w-full sm:w-auto"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isLoading}
            className={`px-6 py-3 rounded-lg bg-violet-600/20 hover:bg-violet-600/30 border border-violet-500/30 text-violet-400 hover:text-violet-300 font-semibold transition-all duration-200 cursor-pointer active:scale-95 w-full sm:w-auto ${isLoading ? "opacity-50 cursor-not-allowed" : ""}`}
          >
            {isLoading ? "Adding..." : "Add Event"}
          </button>
        </div>
        </form>
      </div>
    </div>
  );
};

export default EventInputForm;
