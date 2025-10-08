import { useState, useEffect } from "react";
import { X, Calendar } from "lucide-react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

const EventModal = ({ event, onClose, onUpdate, onDelete }) => {
  const [title, setTitle] = useState(event?.title || "");
  const [dateTime, setDateTime] = useState(event ? new Date(event.start) : new Date());
  const [description, setDescription] = useState(event?.description || "");
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (event) {
      setTitle(event.title);
      setDateTime(new Date(event.start));
      setDescription(event.description || "");
    }
  }, [event]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!title || !dateTime) return;
    setIsSaving(true);
    const utcISOString = dateTime.toISOString();
    const maybePromise = onUpdate({ ...event, title, time: utcISOString, description });
   if (maybePromise && typeof maybePromise.finally === 'function') {
      maybePromise.finally(() => setIsSaving(false));
   } else {
      setIsSaving(false);
   }
  };

  const handleDelete = () => onDelete(event.event_id || event.id);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-md p-4 sm:p-6">
      <form
        onSubmit={handleSubmit}
        className="relative w-full max-w-lg bg-white dark:bg-gray-900/90 rounded-2xl shadow-2xl ring-1 ring-black/10 border border-secondary/30 p-8 hover:scale-[1.02] transition-transform duration-300 transform-gpu"
      >
        {/* Close */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-white transition-colors cursor-pointer active:scale-95"
        >
          <X size={22} />
        </button>
        <h2 className="text-3xl font-extrabold mb-8 text-transparent bg-clip-text bg-gradient-to-r from-violet-600 to-indigo-600">
          Event Details
        </h2>
        {/* Title */}
        <div className="mb-6">
          <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Event Title</label>
          {isEditing ? (
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              className="w-full px-4 py-2.5 border border-gray-400 rounded-md bg-white/70 dark:bg-gray-800/70 focus:outline-none focus:ring-2 focus:ring-[var(--color-secondary)] transition-all text-gray-800 dark:text-white"
            />
          ) : (
            <div className="w-full px-4 py-2.5 rounded-md bg-white/10 dark:bg-gray-800/70 text-gray-800 dark:text-white">
              {title || "-"}
            </div>
          )}
        </div>
        {/* Date */}
        <div className="mb-6">
          <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Date & Time</label>
          {isEditing ? (
            <div className="relative">
              <Calendar className="absolute left-3 top-3.5 text-indigo-600 pointer-events-none z-10" size={18} />
              <DatePicker
                selected={dateTime}
                onChange={(date) => setDateTime(date)}
                showTimeSelect
                timeFormat="HH:mm"
                timeIntervals={15}
                dateFormat="yyyy-MM-dd h:mm aa"
                className="w-full pl-10 px-4 py-2.5 border border-gray-400 rounded-md bg-white/70 dark:bg-gray-800/70 focus:outline-none focus:ring-2 focus:ring-[var(--color-secondary)] transition-all cursor-pointer text-gray-800 dark:text-white"
              />
            </div>
          ) : (
            <div className="w-full px-4 py-2.5 rounded-md bg-white/10 dark:bg-gray-800/70 text-gray-800 dark:text-white">
              {new Date(dateTime).toLocaleString(undefined, { year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit", hour12: true })}
            </div>
          )}
        </div>
        {/* Description */}
        <div className="mb-8">
          <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Description</label>
          {isEditing ? (
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows="3"
              className="w-full px-4 py-2.5 border border-gray-400 rounded-md bg-white/70 dark:bg-gray-800/70 focus:outline-none focus:ring-2 focus:ring-[var(--color-secondary)] transition-all resize-none text-gray-800 dark:text-white"
            />
          ) : (
            <div className="w-full px-4 py-2.5 rounded-md bg-white/10 dark:bg-gray-800/70 text-gray-800 dark:text-white whitespace-pre-wrap min-h-[84px]">
              {description || "-"}
            </div>
          )}
        </div>
        <div className="flex justify-between items-center gap-4">
          <button
            type="button"
            onClick={handleDelete}
            className="px-4 py-2 rounded-lg bg-red-700 hover:bg-red-600 active:bg-red-800 transition-all text-white font-semibold shadow-md cursor-pointer active:scale-95"
          >
            Delete
          </button>
          <div className="flex-1 text-right space-x-3">
            {!isEditing && (
              <button
                type="button"
                onClick={() => setIsEditing(true)}
                className="px-4 py-2 rounded-lg bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-md hover:opacity-90 transition-all cursor-pointer font-semibold active:scale-95"
              >
                Edit
              </button>
            )}
            {isEditing && (
              <button
                type="button"
                onClick={() => { setIsEditing(false); setTitle(event.title); setDateTime(new Date(event.start)); setDescription(event.description || ""); }}
                className="px-4 py-2 rounded-lg bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600 transition-all cursor-pointer font-semibold active:scale-95"
              >
                Cancel
              </button>
            )}
            {isEditing ? (
              <button
                type="submit"
                disabled={isSaving}
                className={`px-5 py-2 rounded-lg bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-semibold shadow-md transition-all ${isSaving ? 'opacity-50 cursor-not-allowed' : 'hover:opacity-90 cursor-pointer active:scale-95'}`}
              >
                {isSaving ? 'Saving...' : 'Save Changes'}
              </button>
            ) : (
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-lg bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600 transition cursor-pointer font-semibold"
              >
                Close
              </button>
            )}
          </div>
        </div>
      </form>
    </div>
  );
};

export default EventModal;