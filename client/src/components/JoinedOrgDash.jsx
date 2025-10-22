import {Calendar, Pin, Activity, Plus, ChevronDown} from "lucide-react";

const JoinedOrgDash = ({ activities, notices }) => {

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
        <section className="col-span-6 row-span-2 bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 group/notice rounded-2xl p-6 shadow-lg hover:shadow-xl border border-white/20 flex flex-col transition-all">

          <div className="flex flex-col justify-between">
            <div className="flex items-center justify-between mb-6">
              {/* Left section: Pin + Title */}
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-full bg-purple-400/20">
                  <Pin size={22} className="text-purple-400 rotate-45 group-hover/notice:rotate-0 duration-200 group-hover/notice:scale-110" />
                </div>
                <h2 className="text-2xl font-semibold text-slate-100">Notice Board</h2>
              </div>

              {/* Right section: Plus button */}
              <button 
                title="Add Notice"
                className="text-purple-400 hover:text-purple-300 cursor-pointer p-1.5 rounded-full 
                          bg-purple-400/20 hover:bg-purple-400/30 shadow-sm hover:shadow-md 
                          duration-300 group/plus">
                <Plus size={20} className="group-hover/plus:scale-125 group-hover/plus:rotate-90 duration-300" />
              </button>
            </div>
          </div>
          <div className="space-y-4 flex-1 overflow-y-auto p-1">
            {notices.map((notice) => (
              <div className="border border-purple-700/50 bg-purple-700/10 p-4 rounded-xl cursor-pointer transition-all duration-300 group/card hover:border-purple-500 hover:bg-purple-500/20">
                <div className="flex justify-between items-start gap-4">
                  <span className="text-lg font-semibold text-slate-400 group-hover/card:text-slate-100 duration-300 max-w-60">
                    {notice.title}
                  </span>

                  <div className="author flex items-center gap-1">
                    <p className="text-xs text-slate-400 group-hover/card:text-slate-300 duration-300">
                      {notice.author}
                    </p>

                    <div className="role-placeholder relative">
                      <div className="hover-dealer top-0 bottom-0 left-0 right-0 absolute bg-black/20 group-hover/card:bg-transparent duration-300"></div>

                      {/* TODO: REPLACE THIS SPAN WITH USER ROLE */}
                      <span className="text-white text-xs bg-slate-500 px-1 py-0.5 rounded-sm">Roles</span>
                    </div>
                  </div>
                </div>

                <div className="relative max-h-10 overflow-hidden mt-1">
                  <p className="text-sm text-violet-500/60 leading-snug group-hover/card:text-violet-300/50 duration-300">{notice.body}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

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