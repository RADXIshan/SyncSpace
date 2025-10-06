import { useState, useEffect } from 'react';
import { X, Calendar } from 'lucide-react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

const EventInputForm = ({ onAddEvent, onClose }) => {
  const [title, setTitle] = useState('');
  const [dateTime, setDateTime] = useState(null);
  const [description, setDescription] = useState('');

  useEffect(() => {
    const now = new Date(); // Current time with today's date
    setDateTime(now);
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!title || !dateTime) {
      alert('Please fill in all required fields: Title and Date/Time');
      return;
    }

    const newEvent = {
      title,
      start: dateTime.toISOString(),
      end: dateTime.toISOString(),
      description,
    };

    onAddEvent(newEvent);
    setTitle('');
    setDateTime(null);
    setDescription('');
  };

  return (
    <div className="fixed inset-0 bg-opacity-50 backdrop-blur-sm flex justify-center items-center z-50 transition-opacity duration-300">
      <form
        onSubmit={handleSubmit}
        className="bg-primary p-8 rounded-xl shadow-2xl w-full max-w-md relative transition-all duration-300 transform scale-100 hover:scale-[1.01] border-2 border-secondary"
      >
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-accent">Add New Event</h2>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-secondary absolute top-4 right-4 transition duration-200 cursor-pointer"
            aria-label="Close"
          >
            <X size={22} />
          </button>
        </div>

        {/* Title */}
        <div className="mb-5">
          <label htmlFor="title" className="block text-sm font-semibold text-accent mb-1">
            Title:
          </label>
          <input
            type="text"
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-secondary transition"
          />
        </div>

        {/* Date and Time */}
        <div className="mb-5">
          <label className="block text-sm font-semibold text-accent mb-1">
            Date and Time:
          </label>
          <div className="relative">
            <Calendar className="absolute left-3 top-4 text-secondary pointer-events-none" size={18} />
            <DatePicker
              selected={dateTime}
              onChange={(date) => setDateTime(date)}
              showTimeSelect
              timeFormat="HH:mm"
              timeIntervals={15}
              dateFormat="yyyy-MM-dd h:mm aa"
              placeholderText="Select date and time"
              className="w-full pl-10 p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-secondary transition cursor-pointer"
            />
          </div>
        </div>

        {/* Description */}
        <div className="mb-6">
          <label htmlFor="description" className="block text-sm font-semibold text-accent mb-1">
            Description:
          </label>
          <textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows="3"
            className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-secondary transition resize-none"
          />
        </div>

        <button
          type="submit"
          className="w-full py-3 px-4 rounded-md bg-secondary text-white font-semibold hover:bg-accent transition duration-300 cursor-pointer"
        >
          Add Event
        </button>
      </form>
    </div>
  );
};

export default EventInputForm;
