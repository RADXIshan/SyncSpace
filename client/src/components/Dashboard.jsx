import React from "react";
import {
  Bell,
  Calendar,
  CheckCircle,
  CloudSun,
  MessageSquare,
  Music,
  Users,
  Search,
  Activity,
} from "lucide-react";

const Dashboard = () => {
  const activities = [
    "Alex pushed updates to repo 🚀",
    "Meeting scheduled for 4:30 PM 📅",
    "Mira joined #frontend channel 💬",
  ];

  const tasks = [
    { id: 1, text: "Finalize sprint tasks", done: false },
    { id: 2, text: "Review pull requests", done: true },
    { id: 3, text: "Prepare meeting summary", done: false },
  ];

  return (
    <div className="p-6 lg:p-10 w-full text-[var(--color-accent)] space-y-8">
      {/* Top Navbar */}
      <header className="flex justify-between items-center gap-4">
        {/* Search */}
        <div className="flex items-center gap-3 bg-white backdrop-blur-md px-4 py-2 rounded-lg shadow-sm flex-1 max-w-md">
          <Search size={18} className="text-gray-500" />
          <input
            type="text"
            placeholder="Search workspace..."
            className="flex-1 bg-transparent outline-none text-sm placeholder-gray-500"
          />
        </div>

        {/* Notification & Avatar */}
        <div className="flex items-center gap-4">
          <Bell
            size={22}
            className="text-gray-600 hover:text-[var(--color-secondary)] transition-colors cursor-pointer"
          />
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[var(--color-secondary)] to-indigo-500" />
        </div>
      </header>

      {/* Dashboard Grid */}
      <main className="grid grid-cols-12 gap-6 auto-rows-[300px]">
        {/* Recent Activity */}
        <section className="col-span-12 md:col-span-6 bg-gray-900/90 backdrop-blur-lg rounded-3xl p-6 shadow-sm hover:shadow-md border border-white/20 flex flex-col text-white">
          <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
            <Activity size={18} /> Recent Activity
          </h2>
          <ul className="space-y-3 text-md">
            {activities.map((a, i) => (
              <li key={i} className="flex items-center gap-2">
                <div className="w-2 h-2 bg-[var(--color-secondary)] rounded-full" />
                {a}
              </li>
            ))}
          </ul>
        </section>

        {/* Tasks */}
        <section className="col-span-12 md:col-span-6 bg-white backdrop-blur-lg rounded-3xl p-6 shadow-sm hover:shadow-md border border-white/20 flex flex-col text-accent">
          <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
            <CheckCircle size={18} /> Team Tasks
          </h2>
          <ul className="space-y-3 text-md">
            {tasks.map((task) => (
              <li key={task.id} className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={task.done}
                  readOnly
                  className="w-4 h-4 accent-[var(--color-secondary)] rounded"
                />
                <span className={task.done ? "line-through text-gray-400" : ""}>
                  {task.text}
                </span>
              </li>
            ))}
          </ul>
        </section>

        {/* Calendar */}
        <section className="col-span-12 md:col-span-6 bg-white rounded-3xl p-6 shadow-sm border border-white/20 flex flex-col justify-between">
          <h2 className="text-2xl font-bold mb-4 flex items-center gap-2 text-[var(--color-accent)]">
            <Calendar size={18} /> Meetings
          </h2>
          <div className="flex flex-col gap-2 text-md">
            <p>🕓 2:00 PM — Sprint Planning</p>
            <p>📞 4:30 PM — Design Sync</p>
            <p>💬 7:00 PM — Standup Recap</p>
          </div>
          <button className="mt-4 px-5 py-2 text-md rounded-full bg-[var(--color-secondary)] text-white shadow hover:bg-violet-700 transition font-semibold cursor-pointer">
            View Calendar
          </button>
        </section>

                {/* Chat Summary */}
        <section className="col-span-12 md:col-span-6 bg-gray-900/90 to-[var(--color-secondary)] rounded-3xl p-6 text-white shadow-md flex flex-col justify-between">
          <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
            <MessageSquare size={18} /> Chat Summary
          </h2>
          <div className="flex-1 flex flex-col justify-center items-center text-center">
            <p className="text-5xl font-bold">12</p>
            <p className="text-md opacity-90 mt-1">Unread messages</p>
          </div>
          <button className="mt-4 px-5 py-2 text-md rounded-full bg-white text-[var(--color-accent)] font-semibold shadow hover:bg-gray-200 transition cursor-pointer">
            Open Chat
          </button>
        </section>

      </main>
    </div>
  );
};

export default Dashboard;
