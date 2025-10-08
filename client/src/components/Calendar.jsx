import { useEffect, useState } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction"; 
import axios from "axios";
import { Info, X } from "lucide-react";
import { toast } from "react-hot-toast";
import EventInputForm from "./EventInputForm";
import { useAuth } from "../context/AuthContext";
import EventModal from "./EventModal";

const Calendar = () => {
  const { user } = useAuth();
  const [events, setEvents] = useState([]);
  const [showInfo, setShowInfo] = useState(true);
  const [showEventInputForm, setShowEventInputForm] = useState(false); // State to control form visibility
  const [selectedDate, setSelectedDate] = useState(null); // State to store selected date for new event
  const [selectedEvent, setSelectedEvent] = useState(null);

  // Fetch events from backend
  useEffect(() => {
    if(!user) return; // wait until user data is available
    let toastId;
    toastId = toast.loading("Fetching events...");
    const token = localStorage.getItem("token");
    axios.get(
      `${import.meta.env.VITE_BASE_URL}/api/events`,
      {
        params: { user_id: user.user_id },
        withCredentials: true,
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      }
    )
      .then(res => {
        const formatted = res.data.map((ev) => ({ ...ev, start: ev.time || ev.start }));
        setEvents(formatted);
        toast.success("Events loaded successfully", { id: toastId });
      })
      .catch(err => {
        console.error(err);
        toast.error("Failed to load events", { id: toastId });
      });
  }, [user]);

  // Handle adding new event
  const handleDateClick = (info) => {
    setSelectedDate(info.dateStr);
    setShowEventInputForm(true);
  };

  const handleAddEvent = (newEvent) => {
    let toastId;
    toastId = toast.loading("Adding event...");
    const token = localStorage.getItem("token");
    const payload = { ...newEvent, user_id: user?.user_id };
    axios.post(
      `${import.meta.env.VITE_BASE_URL}/api/events`,
      payload,
      {
        withCredentials: true,
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      }
    )
      .then(res => {
        setEvents([...events, { ...res.data, start: res.data.time }]);
        toast.success("Event added successfully", { id: toastId });
        setShowEventInputForm(false); // Hide the form after successful submission
      })
      .catch(err => {
        console.error(err);
        toast.error("Failed to add event", { id: toastId });
      });
  };

  const handleEventClick = (info) => {
    setSelectedEvent({ ...info.event.extendedProps, title: info.event.title, start: info.event.start });
  };

  const handleUpdateEvent = (updated) => {
    let toastId = toast.loading("Updating event...");
    const token = localStorage.getItem("token");
    axios.put(
      `${import.meta.env.VITE_BASE_URL}/api/events/${updated.event_id || updated.id}`,
      { title: updated.title, time: updated.time, description: updated.description },
      { withCredentials: true, headers: token ? { Authorization: `Bearer ${token}` } : {} }
    )
      .then((res) => {
        const updatedEventData = { ...res.data, start: res.data.time || res.data.start };
        setEvents(events.map((ev) => (ev.event_id === updatedEventData.event_id ? updatedEventData : ev)));
        toast.success("Event updated", { id: toastId });
        setSelectedEvent(null);
      })
      .catch((err) => {
        console.error(err);
        toast.error("Failed to update", { id: toastId });
      });
  };

  const handleDeleteEvent = (id) => {
    let toastId = toast.loading("Deleting event...");
    const token = localStorage.getItem("token");
    axios.delete(`${import.meta.env.VITE_BASE_URL}/api/events/${id}`, {
      withCredentials: true,
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    })
      .then(() => {
        setEvents(events.filter((ev) => ev.event_id !== id));
        toast.success("Event deleted", { id: toastId });
        setSelectedEvent(null);
      })
      .catch((err) => {
        console.error(err);
        toast.error("Failed to delete", { id: toastId });
      });
  };

  return (
    <div className="p-4 relative">
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
            onClose={() => setShowEventInputForm(false)}
          />
        )}
        <FullCalendar
          plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
          initialView="dayGridMonth"
          headerToolbar={{
            left: "prev,next today",
            center: "title",
            right: "dayGridMonth,timeGridWeek,timeGridDay",
          }}
          buttonText={{
            today: "Today",
            month: "Month",
            week: "Week",
            day: "Day",
          }}
          events={events}
          dateClick={handleDateClick}
          editable
          selectable
          selectMirror
          dayMaxEvents={3}
            eventContent={(arg) => (
             <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-white/10 backdrop-blur-md border border-violet-500/30 shadow-sm hover:brightness-110 transition max-w-full text-[15px] text-black">
               <div className="h-2 w-2 rounded-full bg-violet-400 shrink-0" />
               <span className="truncate font-medium flex-1">
                 {arg.event.title}
               </span>
               {arg.timeText && (
                 <span className="ml-1 text-[15px] text-indigo-500 whitespace-nowrap">
                   {arg.timeText}
                 </span>
               )}
             </div>
           )}
          eventClick={handleEventClick}
          height="auto"
          className="custom-fullcalendar"
        />
      </div>

      {selectedEvent && (
        <EventModal
          event={selectedEvent}
          onClose={() => setSelectedEvent(null)}
          onUpdate={handleUpdateEvent}
          onDelete={handleDeleteEvent}
        />
      )}
    </div>
  );
}

export default Calendar;