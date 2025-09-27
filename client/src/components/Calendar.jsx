import { useEffect, useState } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction"; 
import axios from "axios";
import { Info, X } from "lucide-react";
import { toast } from "react-hot-toast";
import EventInputForm from "./EventInputForm";

const Calendar = () => {
  const [events, setEvents] = useState([]);
  const [showInfo, setShowInfo] = useState(true);
  const [showEventInputForm, setShowEventInputForm] = useState(false); // State to control form visibility
  const [selectedDate, setSelectedDate] = useState(null); // State to store selected date for new event

  // Fetch events from backend
  useEffect(() => {
    let toastId;
    toastId = toast.loading("Fetching events...");
    axios.get(`${import.meta.env.VITE_BASE_URL}/api/events`)
      .then(res => {
        setEvents(res.data);
        toast.success("Events loaded successfully", { id: toastId });
      })
      .catch(err => {
        console.error(err);
        toast.error("Failed to load events", { id: toastId });
      });
  }, []);

  // Handle adding new event
  const handleDateClick = (info) => {
    setSelectedDate(info.dateStr);
    setShowEventInputForm(true);
  };

  const handleAddEvent = (newEvent) => {
    let toastId;
    toastId = toast.loading("Adding event...");
    axios.post(`${import.meta.env.VITE_BASE_URL}/api/events`, newEvent)
      .then(res => {
        setEvents([...events, res.data]);
        toast.success("Event added successfully", { id: toastId });
        setShowEventInputForm(false); // Hide the form after successful submission
      })
      .catch(err => {
        console.error(err);
        toast.error("Failed to add event", { id: toastId });
      });
  };

  return (
    <div className="p-4">
      <h2 className="text-3xl font-bold mb-6 flex items-center gap-2">📅 Calendar</h2>
      <div className="bg-white rounded-lg shadow ring-1 ring-gray-200 p-4">
        {showInfo && (
        <div className="flex items-start bg-violet-50 text-violet-700 rounded-md px-3 py-2 mb-4 text-sm">
          <Info size={16} className="mr-2 mt-0.5" />
          <span className="flex-1">Tap or click on a date to add an event.</span>
          <button
            onClick={() => setShowInfo(false)}
            className="ml-2 hover:text-violet-900 cursor-pointer"
            aria-label="Dismiss info"
          >
            <X size={16} />
          </button>
        </div>
        )}
        {showEventInputForm && (
          <EventInputForm
            onAddEvent={handleAddEvent}
            initialDate={selectedDate}
            onClose={() => setShowEventInputForm(false)} // Add onClose prop
          />
        )}
        <FullCalendar
          plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
          initialView="dayGridMonth"
          headerToolbar={{
            left: "prev,next today",
            center: "title",
            right: "dayGridMonth,timeGridWeek,timeGridDay"
          }}
          buttonText={{
            today: "Today",
            month: "Month",
            week: "Week",
            day: "Day"
          }}
          events={events}
          dateClick={handleDateClick}
          editable={true}
          selectable={true}
          selectMirror={true}
          dayMaxEvents={3}
          eventColor="#7C3AED"
          eventClick={(info) => alert(`Event: ${info.event.title}`)}
          height="auto"
          className="custom-fullcalendar"
        />
      </div>
    </div>
  );
}

export default Calendar;