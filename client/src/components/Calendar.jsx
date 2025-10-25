import { useEffect, useState, useCallback } from "react";
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
  const [loading, setLoading] = useState(true);
  const [isMobile, setIsMobile] = useState(false);

  // Centralized fetcher so we can refresh events after CRUD operations
  const getEvents = useCallback(() => {
    if (!user) return;
    setLoading(true);
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
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        toast.error("Failed to load events", { id: toastId });
        setLoading(false);
      });
  }, [user]);

  const refreshEvents = useCallback(() => {
    getEvents();
  }, [getEvents]);

  // Check if screen is mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Fetch events on initial load / user change
  useEffect(() => {
    getEvents();
  }, [getEvents]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full bg-gradient-to-br from-violet-50 via-indigo-50 to-purple-100">
        <div className="text-center p-6">
          <div className="animate-spin rounded-full h-8 w-8 sm:h-12 sm:w-12 border-t-2 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600 text-sm sm:text-base">Loading calendar...</p>
        </div>
      </div>
    );
  }

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
        refreshEvents();
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
      .then(() => {
        toast.success("Event updated", { id: toastId });
        setSelectedEvent(null);
        refreshEvents(); // Refresh events after update
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
        toast.success("Event deleted", { id: toastId });
        setSelectedEvent(null);
        refreshEvents(); // Refresh events after deletion
      })
      .catch((err) => {
        console.error(err);
        toast.error("Failed to delete", { id: toastId });
      });
  };

  return (
    <div className="pt-10 sm:pt-0 min-h-screen bg-gradient-to-br from-violet-50 via-indigo-50 to-purple-100 relative overflow-hidden">
      {/* Animated gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-violet-200/20 via-indigo-200/15 to-purple-200/25 animate-pulse"></div>
      <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-tr from-transparent via-white/10 to-violet-100/20"></div>
      
      <div className="relative z-10 p-3 sm:p-6">
        {/* Header */}
        <div className="max-w-7xl mx-auto p-6 sm:p-6">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-violet-600 to-indigo-600 mb-2 sm:mb-3">
            Calendar
          </h1>
          <p className="text-gray-600 text-sm sm:text-base lg:text-lg">Organize your schedule and manage events</p>
        </div>
        
        <div className="max-w-7xl mx-auto">
          <div className="bg-white/80 backdrop-blur-xl rounded-2xl sm:rounded-3xl border border-gray-200/50 shadow-2xl p-4 sm:p-6 lg:p-8 animate-fadeIn">
            {showInfo && (
              <div className="flex items-start sm:items-center justify-between bg-gradient-to-r from-violet-100/80 to-purple-100/80 text-violet-800 rounded-lg sm:rounded-xl pl-3 sm:pl-4 pr-2 py-2 sm:py-2 mb-4 sm:mb-6 border border-violet-200/50 animate-slideIn shadow-sm">
                <div className="flex items-start sm:items-center flex-1 min-w-0">
                  <Info size={16} className="mr-2 sm:mr-4 text-violet-600 flex-shrink-0 mt-0.5 sm:mt-0" />
                  <p className="text-xs sm:text-sm text-violet-700 leading-relaxed">Click on any date to create a new event, or click on existing events to edit them.</p>
                </div>
          
                <button
                  onClick={() => setShowInfo(false)}
                  className="ml-2 sm:ml-4 hover:text-violet-900 cursor-pointer p-2 rounded-full hover:bg-violet-200/50 transition-all duration-300 hover:scale-110 flex-shrink-0 hover:rotate-90 transform"
                  aria-label="Dismiss info"
                >
                  <X size={16} className="sm:w-5 sm:h-5" />
                </button>
              </div>
            )}
          <div className="rounded-xl sm:rounded-2xl overflow-hidden shadow-inner bg-white/50 enhanced-fullcalendar">
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
              dayMaxEvents={2}
              height="auto"
              aspectRatio={1.8}
              dayMaxEventRows={2}
              moreLinkClick="popover"
              eventDisplay="block"
              eventStartEditable={true}
              eventDurationEditable={true}
              eventResizableFromStart={true}
              eventOverlap={false}
              slotMinTime="06:00:00"
              slotMaxTime="22:00:00"
              allDaySlot={true}
              nowIndicator={true}
              scrollTime="08:00:00"
              scrollTimeReset={false}
              stickyHeaderDates={true}
              stickyFooterScrollbar={true}
              dayHeaderFormat={{ weekday: 'short' }}
              dayCellContent={(info) => (
                <div className="text-xs sm:text-sm font-medium text-gray-700">
                  {info.dayNumberText}
                </div>
              )}
              titleFormat={{ 
                year: 'numeric', 
                month: 'short' 
              }}
              eventContent={(arg) => (
                <div className="group flex items-center w-full gap-1 sm:gap-2 pl-2 sm:pl-3 pr-1 py-0.5 sm:py-1 rounded-md sm:rounded-[0.6rem] bg-gradient-to-r from-violet-600 to-indigo-600 text-white hover:scale-[1.02] sm:hover:scale-[1.05] active:scale-95 transition-all duration-300 max-w-full text-xs sm:text-sm font-semibold cursor-pointer border border-white/20" title="Click to view event details">
                  <div className="h-1 w-1 sm:h-1.5 sm:w-1.5 rounded-full bg-white/90 shrink-0 group-hover:scale-110 transition-transform" />
                  <span className="truncate flex-1 group-hover:text-white text-xs sm:text-sm">
                    {arg.event.title}
                  </span>
                  {arg.timeText && (
                    <span className="ml-1 text-xs bg-white/25 px-1 sm:px-2 py-0.5 sm:py-1 rounded sm:rounded-md whitespace-nowrap font-medium group-hover:bg-white/30 transition-colors hidden sm:inline">
                      {arg.timeText}
                    </span>
                  )}
                </div>
              )}
              eventClick={handleEventClick}
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

