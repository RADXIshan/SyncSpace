import { Calendar, Activity } from "lucide-react";
import { useNavigate } from "react-router";
import NoticeBoard from "./NoticeBoard";
import { useAuth } from "../context/AuthContext";

const JoinedOrgDash = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const activities = [
    "Alex pushed updates to repo 🚀",
    "Meeting scheduled for 4:30 PM 📅",
    "Mira joined #frontend channel 💬",
  ];

  return (
    <>
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
                <div className="w-2 h-2 bg-violet-400 rounded-full" />
                <span className="text-md text-gray-300 hover:text-white transition-colors">{a}</span>
              </li>
            ))}
          </ul>
        </section>

        {/* Notice Board */}
        <NoticeBoard 
          orgId={user?.org_id} 
          className="col-span-6 row-span-2" 
        />

        {/* Calendar */}
        <section className="col-span-12 md:col-span-6 bg-white rounded-3xl p-6 shadow-lg hover:shadow-xl border border-white/20 flex flex-col justify-between">
          <h2 className="text-2xl font-bold mb-4 flex items-center gap-3 text-[var(--color-accent)]">
            <div className="bg-violet-700/20 rounded-full p-3">
              <Calendar className="text-violet-500" size={22} />
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
      </main>
    </>
  )
}

export default JoinedOrgDash