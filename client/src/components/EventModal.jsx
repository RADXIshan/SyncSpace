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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-md p-4 sm:p-6">
      <div className="relative w-full max-w-lg bg-white/10 dark:bg-gray-900/80 backdrop-blur-xl border border-white/20 rounded-3xl shadow-2xl overflow-hidden animate-fadeIn hover:scale-[1.01] transition-transform">
        <div className="absolute inset-0 bg-gradient-to-br from-violet-500/10 via-transparent to-indigo-500/10"></div>
        <form
          onSubmit={handleSubmit}
          className="relative p-8"
        >
        {/* Close */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors cursor-pointer active:scale-95 p-2 rounded-full hover:bg-white/10"
        >
          <X size={20} />
        </button>
        <h2 className="text-3xl font-bold mb-8 gradient-text">
          Event Details
        </h2>
        {/* Title */}
        <div className="form-group">
          <label className="form-label-dark">Event Title</label>
          {isEditing ? (
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              className="input-glass"
            />
          ) : (
            <div className="w-full px-4 py-3 rounded-lg bg-white/10 text-white">
              {title || "-"}
            </div>
          )}
        </div>
        {/* Date */}
        <div className="form-group">
          <label className="form-label-dark">Date & Time</label>
          {isEditing ? (
            <div className="relative">
              <Calendar className="absolute left-3 top-3.5 text-purple-400 pointer-events-none z-10" size={18} />
              <DatePicker
                selected={dateTime}
                onChange={(date) => setDateTime(date)}
                showTimeSelect
                timeFormat="HH:mm"
                timeIntervals={15}
                dateFormat="yyyy-MM-dd h:mm aa"
                className="w-full pl-10 px-4 py-3 rounded-lg bg-white/10 backdrop-blur-sm border border-white/20 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition-all duration-200 text-white placeholder-gray-300"
                portalId="datepicker-portal"
                withPortal
              />
            </div>
          ) : (
            <div className="w-full px-4 py-3 rounded-lg bg-white/10 text-white border border-white/20">
              {new Date(dateTime).toLocaleString(undefined, { year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit", hour12: true })}
            </div>
          )}
        </div>
        {/* Description */}
        <div className="form-group">
          <label className="form-label-dark">Description</label>
          {isEditing ? (
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows="3"
              className="input-glass resize-none"
            />
          ) : (
            <div className="w-full px-4 py-3 rounded-lg bg-white/10 text-white whitespace-pre-wrap min-h-[84px]">
              {description || "-"}
            </div>
          )}
        </div>
        <div className="flex justify-between items-center gap-4">
          <button
            type="button"
            onClick={handleDelete}
            className="px-6 py-3 rounded-lg bg-red-600/20 hover:bg-red-600/30 border border-red-500/30 text-red-400 hover:text-red-300 font-semibold transition-all duration-200 cursor-pointer active:scale-95"
          >
            Delete
          </button>
          <div className="flex-1 text-right space-x-3">
            {!isEditing && (
              <button
                type="button"
                onClick={() => setIsEditing(true)}
                className="px-6 py-3 rounded-lg bg-violet-600/20 hover:bg-violet-600/30 border border-violet-500/30 text-violet-400 hover:text-violet-300 font-semibold transition-all duration-200 cursor-pointer active:scale-95 w-full sm:w-auto"
              >
                Edit
              </button>
            )}
            {isEditing && (
              <button
                type="button"
                onClick={() => { setIsEditing(false); setTitle(event.title); setDateTime(new Date(event.start)); setDescription(event.description || ""); }}
                className="px-6 py-3 rounded-lg bg-gray-600/20 hover:bg-gray-600/30 border border-gray-500/30 text-gray-400 hover:text-gray-300 font-semibold transition-all duration-200 cursor-pointer active:scale-95 w-full sm:w-auto"
              >
                Cancel
              </button>
            )}
            {isEditing ? (
              <button
                type="submit"
                disabled={isSaving}
                className={`px-6 py-3 rounded-lg bg-violet-600/20 hover:bg-violet-600/30 border border-violet-500/30 text-violet-400 hover:text-violet-300 font-semibold transition-all duration-200 cursor-pointer active:scale-95 w-full sm:w-auto ${isSaving ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {isSaving ? 'Saving...' : 'Save Changes'}
              </button>
            ) : (
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-3 rounded-lg bg-gray-600/20 hover:bg-gray-600/30 border border-gray-500/30 text-gray-400 hover:text-gray-300 font-semibold transition-all duration-200 cursor-pointer active:scale-95 w-full sm:w-auto"
              >
                Close
              </button>
            )}
          </div>
        </div>
        </form>
      </div>
    </div>
  );
};

export default EventModal;