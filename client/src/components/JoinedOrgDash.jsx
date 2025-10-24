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
        <section className="order-2 lg:order-1 col-span-1 lg:col-span-6 relative bg-gray-900/95 backdrop-blur-xl border border-gray-700/50 rounded-2xl sm:rounded-3xl shadow-2xl overflow-hidden group/activity flex flex-col transition-all duration-500 hover:scale-[1.02] min-h-[300px]">
          {/* Background gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-br from-purple-900/20 via-gray-900/50 to-indigo-900/20"></div>
          
          <div className="relative z-10 p-4 sm:p-6 lg:p-8 flex flex-col h-full">
            <div className="flex items-center gap-2 sm:gap-3 lg:gap-4 mb-4 sm:mb-6 lg:mb-8">
              <div className="p-2 sm:p-3 lg:p-4 rounded-full bg-purple-500/20 border border-purple-500/30 group-hover/activity:bg-purple-500/30 transition-all duration-300 flex-shrink-0">
                <Activity size={18} className="text-purple-400 group-hover/activity:scale-110 transition-all duration-300 sm:w-6 sm:h-6" />
              </div>
              <div className="min-w-0 flex-1">
                <h2 className="text-lg sm:text-xl lg:text-2xl font-bold text-white group-hover/activity:text-purple-100 transition-colors duration-300">
                  Recent Activity
                </h2>
                <p className="text-gray-400 text-xs sm:text-sm mt-1 hidden sm:block">Latest organization updates</p>
              </div>
            </div>
            
            <div className="flex-1 overflow-hidden">
              <ul className="space-y-2 sm:space-y-3 max-h-full overflow-y-auto pr-1 sm:pr-2 scrollbar-thin scrollbar-thumb-purple-500/30 scrollbar-track-transparent">
                {activities.map((a, i) => (
                  <li key={i} className="group/card relative bg-gray-800/50 hover:bg-gray-700/50 border border-gray-600/50 hover:border-purple-500/50 rounded-lg sm:rounded-xl p-3 sm:p-4 cursor-pointer transition-all duration-300 transform hover:shadow-lg hover:shadow-purple-500/10">
                    {/* Hover gradient overlay */}
                    <div className="absolute inset-0 bg-gradient-to-r from-purple-500/5 to-indigo-500/5 rounded-lg sm:rounded-xl opacity-0 group-hover/card:opacity-100 transition-opacity duration-300"></div>
                    
                    <div className="relative z-10 flex items-center gap-2 sm:gap-3">
                      <div className="w-2 h-2 bg-purple-400 rounded-full flex-shrink-0 group-hover/card:bg-purple-300 transition-colors duration-300" />
                      <span className="text-sm sm:text-base text-gray-300 group-hover/card:text-gray-200 transition-colors duration-300">{a}</span>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        {/* Calendar - Third on mobile */}
        <section className="order-3 lg:order-3 col-span-1 lg:col-span-6 relative bg-gray-900/95 backdrop-blur-xl border border-gray-700/50 rounded-2xl sm:rounded-3xl shadow-2xl overflow-hidden group/meetings flex flex-col transition-all duration-500 hover:scale-[1.02] mb-4 sm:mb-0">
          {/* Background gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-br from-purple-900/20 via-gray-900/50 to-indigo-900/20"></div>
          
          <div className="relative z-10 p-4 sm:p-6 lg:p-8 flex flex-col h-full">
            <div className="flex items-center justify-between mb-4 sm:mb-6 lg:mb-8">
              <div className="flex items-center gap-2 sm:gap-3 lg:gap-4 flex-1 min-w-0">
                <div className="p-2 sm:p-3 lg:p-4 rounded-full bg-purple-500/20 border border-purple-500/30 group-hover/meetings:bg-purple-500/30 transition-all duration-300 flex-shrink-0">
                  <Calendar size={18} className="text-purple-400 group-hover/meetings:scale-110 transition-all duration-300 sm:w-6 sm:h-6" />
                </div>
                <div className="min-w-0 flex-1">
                  <h2 className="text-lg sm:text-xl lg:text-2xl font-bold text-white group-hover/meetings:text-purple-100 transition-colors duration-300">
                    Meetings
                  </h2>
                  <p className="text-gray-400 text-xs sm:text-sm mt-1 hidden sm:block">Upcoming scheduled meetings</p>
                </div>
              </div>
            </div>
            
            <div className="flex-1 overflow-hidden">
              <div className="space-y-2 sm:space-y-3 max-h-full overflow-y-auto pr-1 sm:pr-2 scrollbar-thin scrollbar-thumb-purple-500/30 scrollbar-track-transparent">
                <div className="group/card relative bg-gray-800/50 hover:bg-gray-700/50 border border-gray-600/50 hover:border-purple-500/50 rounded-lg sm:rounded-xl p-3 sm:p-4 cursor-pointer transition-all duration-300 transform hover:shadow-lg hover:shadow-purple-500/10">
                  <div className="absolute inset-0 bg-gradient-to-r from-purple-500/5 to-indigo-500/5 rounded-lg sm:rounded-xl opacity-0 group-hover/card:opacity-100 transition-opacity duration-300"></div>
                  <div className="relative z-10">
                    <p className="text-sm sm:text-base text-gray-300 group-hover/card:text-gray-200 transition-colors duration-300">🕓 2:00 PM — Sprint Planning</p>
                  </div>
                </div>
                
                <div className="group/card relative bg-gray-800/50 hover:bg-gray-700/50 border border-gray-600/50 hover:border-purple-500/50 rounded-lg sm:rounded-xl p-3 sm:p-4 cursor-pointer transition-all duration-300 transform hover:shadow-lg hover:shadow-purple-500/10">
                  <div className="absolute inset-0 bg-gradient-to-r from-purple-500/5 to-indigo-500/5 rounded-lg sm:rounded-xl opacity-0 group-hover/card:opacity-100 transition-opacity duration-300"></div>
                  <div className="relative z-10">
                    <p className="text-sm sm:text-base text-gray-300 group-hover/card:text-gray-200 transition-colors duration-300">📞 4:30 PM — Design Sync</p>
                  </div>
                </div>
                
                <div className="group/card relative bg-gray-800/50 hover:bg-gray-700/50 border border-gray-600/50 hover:border-purple-500/50 rounded-lg sm:rounded-xl p-3 sm:p-4 cursor-pointer transition-all duration-300 transform hover:shadow-lg hover:shadow-purple-500/10">
                  <div className="absolute inset-0 bg-gradient-to-r from-purple-500/5 to-indigo-500/5 rounded-lg sm:rounded-xl opacity-0 group-hover/card:opacity-100 transition-opacity duration-300"></div>
                  <div className="relative z-10">
                    <p className="text-sm sm:text-base text-gray-300 group-hover/card:text-gray-200 transition-colors duration-300">💬 7:00 PM — Standup Recap</p>
                  </div>
                </div>
              </div>
            </div>
            
            <button
              onClick={() => navigate('/home/calendar')}
              className="mt-3 sm:mt-4 px-4 sm:px-5 py-2 text-sm sm:text-base font-semibold rounded-full bg-purple-600/20 hover:bg-purple-600/30 border border-purple-500/30 text-purple-400 hover:text-purple-300 transition-all duration-300 transform hover:scale-105 active:scale-95 shadow-lg cursor-pointer">
              View Calendar
            </button>
          </div>
        </section>
      </main>
    </>
  )
}

export default JoinedOrgDash