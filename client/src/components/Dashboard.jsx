import { useNavigate } from "react-router";
import {
  Bell,
  Calendar,
  CheckCircle,
  MessageSquare,
  Activity,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";

const Dashboard = ({ onSettingsClick }) => {
  const navigate = useNavigate();
  const { user } = useAuth();

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
    <div className="max-h-screen p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Top Navbar */}
        <header className="flex justify-between items-center gap-4 bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-6">
          {/* Header Title */}
          <div className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-violet-600 to-indigo-600 cursor-pointer">
            Welcome back, {user.name}
          </div>

          {/* Notification & Avatar */}
          <div className="flex items-center gap-4">
            <div className="relative">
              <Bell
                size={23}
                className="text-gray-800 hover:text-violet-500 transition-colors cursor-pointer"
              />
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
            </div>
            
            <div
              onClick={onSettingsClick}
              className="w-12 h-12 rounded-full bg-gradient-to-br from-violet-800 to-indigo-800 
                        flex items-center justify-center border-2 border-violet-500/20 
                        hover:border-violet-500/40 transition-all cursor-pointer overflow-hidden"
            >
              {user?.photo ? (
                <img
                  src={user.photo}
                  alt="Profile"
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-lg font-semibold text-white">
                  {user?.name?.charAt(0) || "U"}
                </span>
              )}
            </div>
          </div>
        </header>

      {/* Dashboard Grid */}
      <main className="grid grid-cols-12 gap-6 auto-rows-[300px]">
        {/* Recent Activity */}
        <section className="col-span-12 md:col-span-6 bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 rounded-2xl p-6 shadow-lg hover:shadow-xl border border-white/10 flex flex-col text-white transition-all">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 rounded-full bg-violet-500/20">
              <Activity size={22} className="text-violet-400" />
            </div>
            <h2 className="text-2xl font-semibold">Recent Activity</h2>
          </div>
          <ul className="space-y-4 flex-1">
            {activities.map((a, i) => (
              <li key={i} className="flex items-center gap-3 p-3 rounded-xl hover:bg-white/5 border border-transparent hover:border-white/10 transition-all cursor-pointer">
                <div className="w-2 h-2 bg-violet-400 rounded-full animate-pulse" />
                <span className="text-md text-gray-300 hover:text-white transition-colors">{a}</span>
              </li>
            ))}
          </ul>
        </section>

        {/* Tasks */}
        <section className="col-span-12 md:col-span-6 bg-white backdrop-blur-xl rounded-2xl p-6 shadow-lg hover:shadow-xl border border-white/10 flex flex-col text-[var(--color-accent)] transition-all">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 rounded-full bg-green-500/20">
              <CheckCircle size={22} className="text-green-500" />
            </div>
            <h2 className="text-2xl font-semibold">Team Tasks</h2>
          </div>
          <ul className="space-y-4 flex-1">
            {tasks.map((task) => (
              <li key={task.id} className="flex items-center gap-3 p-3 rounded-xl hover:bg-white/5 border border-transparent hover:border-white/10 transition-all">
                <input
                  type="checkbox"
                  checked={task.done}
                  readOnly
                  className="w-5 h-5 rounded border-white/20 bg-white/5 focus:ring-offset-0"
                />
                <span className={`text-md transition-colors ${task.done ? 'text-[var(--color-accent)] line-through' : 'text-[var(--color-accent)] hover:text-[var(--color-secondary)]'}`}>
                  {task.text}
                </span>
              </li>
            ))}
          </ul>
        </section>

        {/* Calendar */}
        <section className="col-span-12 md:col-span-6 bg-white rounded-3xl p-6 shadow-lg hover:shadow-xl border border-white/20 flex flex-col justify-between">
          <h2 className="text-2xl font-bold mb-4 flex items-center gap-2 text-[var(--color-accent)]">
            <div className="bg-violet-700/20 rounded-full p-3">
              <Calendar className="text-slate-800" size={22} />
            </div>
            Meetings
          </h2>
          <div className="flex flex-col gap-2 text-md">
            <p>🕓 2:00 PM — Sprint Planning</p>
            <p>📞 4:30 PM — Design Sync</p>
            <p>💬 7:00 PM — Standup Recap</p>
          </div>
          <button
            onClick={() => navigate('/home/calendar')}
            className="mt-4 px-5 py-2 text-md font-semibold rounded-full bg-violet-700/20 hover:bg-violet-700/30 border border-violet-800/30 text-violet-700 hover:text-violet-600 transition cursor-pointer">
            View Calendar
          </button>
        </section>

        {/* Chat Summary */}
        <section className="col-span-12 md:col-span-6 bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 rounded-3xl p-6 text-white flex flex-col justify-between shadow-lg hover:shadow-xl">
          <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
            <div className="bg-slate-300/20 rounded-full p-3">
              <MessageSquare className="text-[var(--primary)]" size={22} />
            </div>
             Chat Summary
          </h2>
          <div className="flex-1 flex flex-col justify-center items-center text-center">
            <p className="text-5xl font-bold">12</p>
            <p className="text-md opacity-90 mt-1">Unread messages</p>
          </div>
          <button className="mt-4 px-5 py-2 text-md font-semibold rounded-full bg-slate-300/20 hover:bg-slate-300/30 border border-slate-800 text-primary hover:text-slate-200 transition cursor-pointer">
            Open Chat
          </button>
        </section>

      </main>
      </div>
    </div>
  );
};

export default Dashboard;