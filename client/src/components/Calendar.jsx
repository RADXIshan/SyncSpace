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

  // Centralised fetcher so we can refresh events after CRUD operations
  const getEvents = () => {
    if (!user) return;
    let toastId = toast.loading("Fetching events...");
    const token = localStorage.getItem("token");
    axios
      .get(`${import.meta.env.VITE_BASE_URL}/api/events`, {
        params: { user_id: user.user_id },
        withCredentials: true,
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      })
      .then((res) => {
        const formatted = res.data.map((ev) => {
          const startStr = ev.time || ev.start;
          const startDate = startStr ? new Date(startStr) : null;
          return { ...ev, start: startDate };
        });
        setEvents(formatted);
        toast.success("Events loaded successfully", { id: toastId });
      })
      .catch((err) => {
        console.error(err);
        toast.error("Failed to load events", { id: toastId });
      });
  };

  // Fetch events on initial load / user change
  useEffect(() => {
    getEvents();
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
      .then((_) => {
        toast.success("Event added successfully", { id: toastId });
        setShowEventInputForm(false); 
        getEvents();
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
        // Optionally refresh the list to ensure consistency
        getEvents();
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
        // Refresh events list
        getEvents();
      })
      .catch((err) => {
        console.error(err);
        toast.error("Failed to delete", { id: toastId });
      });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-50 via-indigo-50 to-purple-100 relative overflow-hidden">
      {/* Animated gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-violet-200/20 via-indigo-200/15 to-purple-200/25 animate-pulse"></div>
      <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-tr from-transparent via-white/10 to-violet-100/20"></div>
      
      <div className="relative z-10 p-6">
        {/* Header */}
        <div className="max-w-7xl mx-auto mb-8">
          <div className="text-center">
            <h1 className="text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-violet-600 to-indigo-600 mb-3">
              Calendar
            </h1>
            <p className="text-gray-600 text-lg">Organize your schedule and manage events</p>
          </div>
        </div>
        
        <div className="max-w-7xl mx-auto">
          <div className="bg-white/80 backdrop-blur-xl rounded-3xl border border-gray-200/50 shadow-2xl p-8 animate-fadeIn">
            {showInfo && (
              <div className="flex items-start bg-gradient-to-r from-violet-100/80 to-purple-100/80 text-violet-800 rounded-2xl px-6 py-4 mb-8 border border-violet-200/50 animate-slideIn shadow-sm">
                <Info size={20} className="mr-4 mt-0.5 text-violet-600 flex-shrink-0" />
                <div className="flex-1 space-y-1">
                  <p className="font-semibold text-lg">Getting Started</p>
                  <p className="text-sm text-violet-700">Click on any date to create a new event, or click on existing events to edit them.</p>
                </div>
                <button
                  onClick={() => setShowInfo(false)}
                  className="ml-4 hover:text-violet-900 cursor-pointer p-2 rounded-xl hover:bg-violet-200/50 transition-all duration-200 hover:scale-110"
                  aria-label="Dismiss info"
                >
                  <X size={20} />
                </button>
              </div>
            )}
          <div className="rounded-2xl overflow-hidden shadow-inner bg-white/50 p-4 enhanced-fullcalendar">
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
              eventTimeFormat={{ hour: 'numeric', minute: '2-digit', meridiem: 'short' }}
              events={events}
              dateClick={handleDateClick}
              editable
              selectable
              selectMirror
              dayMaxEvents={3}
              eventContent={(arg) => (
                <div className="group flex items-center gap-2 px-3 py-2 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-lg hover:shadow-xl hover:scale-[1.05] active:scale-95 transition-all duration-300 max-w-full text-sm font-semibold cursor-pointer border border-white/20" title="Click to view event details">
                  <div className="h-2.5 w-2.5 rounded-full bg-white/90 shrink-0 group-hover:scale-110 transition-transform" />
                  <span className="truncate flex-1 group-hover:text-white">
                    {arg.event.title}
                  </span>
                  {arg.timeText && (
                    <span className="ml-1 text-xs bg-white/25 px-2 py-1 rounded-lg whitespace-nowrap font-medium group-hover:bg-white/30 transition-colors">
                      {arg.timeText}
                    </span>
                  )}
                </div>
              )}
              eventClick={handleEventClick}
              height="auto"
            />
          </div>
          </div>
        </div>
      </div>

      {showEventInputForm && (
        <EventInputForm
          onAddEvent={handleAddEvent}
          initialDate={selectedDate}
          onClose={() => setShowEventInputForm(false)}
        />
      )}

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
