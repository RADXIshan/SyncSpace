import React from 'react';

const Calendar = () => {
  // Simple calendar grid for demonstration
  const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const currentDate = new Date();
  const currentMonth = currentDate.getMonth();
  const currentYear = currentDate.getFullYear();
  
  // Get days in month and first day of month
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay();
  
  // Create calendar grid
  const calendarDays = [];
  let dayCount = 1;
  
  // Create weeks
  for (let i = 0; i < 6; i++) {
    const week = [];
    // Create days in a week
    for (let j = 0; j < 7; j++) {
      if ((i === 0 && j < firstDayOfMonth) || dayCount > daysInMonth) {
        week.push(null); // Empty cell
      } else {
        week.push(dayCount++);
      }
    }
    calendarDays.push(week);
    if (dayCount > daysInMonth) break;
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Calendar</h1>
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">
            {new Date(currentYear, currentMonth).toLocaleString('default', { month: 'long' })} {currentYear}
          </h2>
          <div className="flex space-x-2">
            <button className="p-2 rounded hover:bg-gray-100">
              &lt; Prev
            </button>
            <button className="p-2 rounded hover:bg-gray-100">
              Today
            </button>
            <button className="p-2 rounded hover:bg-gray-100">
              Next &gt;
            </button>
          </div>
        </div>
        
        <div className="grid grid-cols-7 gap-1">
          {daysOfWeek.map(day => (
            <div key={day} className="text-center font-medium py-2">
              {day}
            </div>
          ))}
          
          {calendarDays.map((week, weekIndex) => (
            week.map((day, dayIndex) => (
              <div 
                key={`${weekIndex}-${dayIndex}`} 
                className={`h-12 border rounded-md flex items-center justify-center ${
                  day === currentDate.getDate() ? 'bg-[var(--color-secondary)] text-white' : ''
                } ${day ? 'hover:bg-gray-100 cursor-pointer' : ''}`}
              >
                {day}
              </div>
            ))
          ))}
        </div>
      </div>
    </div>
  );
};

export default Calendar;