import { Calendar, Activity } from "lucide-react";
import { useNavigate } from "react-router";
import NoticeBoard from "./NoticeBoard";
import { useAuth } from "../context/AuthContext";

const JoinedOrgDash = ({ activities }) => {
  const { user } = useAuth();
  const navigate = useNavigate();

  return (
    <>
        {/* Dashboard Grid - Mobile: Notice Board on top, then stacked layout */}
      <main className="grid grid-cols-1 lg:grid-cols-12 gap-3 sm:gap-6 auto-rows-auto lg:auto-rows-[300px]">
        {/* Notice Board - First on mobile, spans full width */}
        <NoticeBoard 
          orgId={user?.org_id} 
          className="order-1 lg:order-2 col-span-1 lg:col-span-6 lg:row-span-2 min-h-[400px] lg:min-h-0" 
        />

        {/* Recent Activity - Second on mobile */}
        <section className="order-2 lg:order-1 col-span-1 lg:col-span-6 bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 rounded-2xl p-4 sm:p-6 shadow-lg hover:shadow-xl border border-white/10 flex flex-col text-white transition-all min-h-[300px]">
          <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
            <div className="p-2 sm:p-3 rounded-full bg-violet-500/20">
              <Activity size={18} className="text-violet-400 sm:w-[22px] sm:h-[22px]" />
            </div>
            <h2 className="text-xl sm:text-2xl font-semibold">Recent Activity</h2>
          </div>
          <ul className="space-y-3 sm:space-y-4 flex-1">
            {activities.map((a, i) => (
              <li key={i} className="flex items-center gap-2 sm:gap-3 p-2 sm:p-3 rounded-xl hover:bg-white/5 border border-transparent hover:border-white/10 transition-all cursor-pointer">
                <div className="w-2 h-2 bg-violet-400 rounded-full flex-shrink-0" />
                <span className="text-sm sm:text-base text-gray-300 hover:text-white transition-colors">{a}</span>
              </li>
            ))}
          </ul>
        </section>

        {/* Calendar - Third on mobile */}
        <section className="order-3 lg:order-3 col-span-1 lg:col-span-6 bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-lg hover:shadow-xl border border-white/20 flex flex-col justify-between max-h-full mb-4 sm:mb-0">
          <h2 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-4 flex items-center gap-2 sm:gap-3 text-[var(--color-accent)]">
            <div className="bg-violet-700/20 rounded-full p-2 sm:p-3">
              <Calendar className="text-violet-500 sm:w-[22px] sm:h-[22px]" size={18} />
            </div>
            Meetings
          </h2>
          <div className="flex flex-col gap-2 text-sm sm:text-base flex-1">
            <p>🕓 2:00 PM — Sprint Planning</p>
            <p>📞 4:30 PM — Design Sync</p>
            <p>💬 7:00 PM — Standup Recap</p>
          </div>
          <button
            onClick={() => navigate('/home/calendar')}
            className="mt-3 sm:mt-4 px-4 sm:px-5 py-2 text-sm sm:text-base font-semibold rounded-full bg-violet-700/20 hover:bg-violet-700/30 border border-violet-800/30 text-violet-700 hover:text-violet-600 transition cursor-pointer">
            View Calendar
          </button>
        </section>
      </main>
    </>
  )
}

export default JoinedOrgDash