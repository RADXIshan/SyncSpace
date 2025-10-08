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

    const localDate = new Date(dateTime.getTime() - dateTime.getTimezoneOffset() * 60000);
    const formattedTime = localDate.toISOString().slice(0, 19); 

    const newEvent = {
      title,
      time: formattedTime,
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-md p-4 sm:p-6 transition-opacity duration-300">
      <form
        onSubmit={handleSubmit}
        className="relative w-full max-w-lg dark:bg-gray-900/90 backdrop-filter backdrop-blur-lg rounded-2xl shadow-2xl ring-1 ring-black/10 border border-secondary/30 p-8 transition-transform duration-300 transform-gpu hover:scale-[1.02]"
      >
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-white transition-all active:scale-95 cursor-pointer"
        >
          <X size={22} />
        </button>

        {/* Heading */}
        <h2 className="text-3xl font-extrabold mb-8 text-transparent bg-clip-text bg-gradient-to-r from-violet-600 to-indigo-600">
          Add New Event
        </h2>

        {/* Title Input */}
        <div className="mb-6">
          <label
            htmlFor="title"
            className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2"
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
            className="w-full px-4 py-2.5 border border-gray-400 rounded-md bg-white/70 dark:bg-gray-800/70 focus:outline-none focus:ring-2 focus:ring-[var(--color-secondary)] focus:border-secondary transition-all text-gray-800 dark:text-white"
          />
        </div>

        {/* Date & Time Picker */}
        <div className="mb-6">
          <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
            Date & Time
          </label>
          <div className="relative">
            <Calendar
              className="absolute left-3 top-3.5 text-indigo-600 pointer-events-none z-10"
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
              className="w-full pl-10 px-4 py-2.5 border border-gray-400 rounded-md bg-white/70 dark:bg-gray-800/70 focus:outline-none focus:ring-2 focus:ring-[var(--color-secondary)] focus:border-secondary transition-all cursor-pointer text-gray-800 dark:text-white"
            />
          </div>
        </div>

        {/* Description */}
        <div className="mb-8">
          <label
            htmlFor="description"
            className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2"
          >
            Description
          </label>
          <textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows="3"
            placeholder="Write a short note about the event..."
            className="w-full px-4 py-2.5 border border-gray-400 rounded-md bg-white/70 dark:bg-gray-800/70 focus:outline-none focus:ring-2 focus:ring-[var(--color-secondary)] focus:border-secondary transition-all resize-none text-gray-800 dark:text-white"
          />
        </div>

        {/* Buttons */}
        <div className="flex justify-end space-x-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-white/10 text-gray-300 hover:bg-white/20 font-semibold transition-all cursor-pointer active:scale-95"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isLoading}
            className={`px-5 py-2 bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-semibold rounded-md shadow-md transition-all ${
              isLoading
                ? "opacity-50 cursor-not-allowed"
                : "hover:opacity-90 cursor-pointer active:scale-95"
            }`}
          >
            {isLoading ? "Adding..." : "Add Event"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default EventInputForm;
