import {Calendar, Pin, Activity, Plus} from "lucide-react";

const JoinedOrgDash = ({ activities, tasks }) => {

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

        {/* Tasks */}
        <section className="col-span-6 row-span-2 bg-white backdrop-blur-xl rounded-2xl p-6 shadow-lg hover:shadow-xl border border-white/10 flex flex-col text-[var(--color-accent)] transition-all">
          <div className="flex flex-col justify-between">
            <div className="flex items-center justify-between mb-6">
              {/* Left section: Pin + Title */}
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-full bg-green-500/20">
                  <Pin size={22} className="text-green-500" />
                </div>
                <h2 className="text-2xl font-semibold">Notice Board</h2>
              </div>

              {/* Right section: Plus button */}
              <button 
                className="text-green-600 hover:text-green-700 p-1.5 rounded-full hover:bg-green-50 transition-colors cursor-pointer duration-300 group"
              >
                <Plus size={20} className="group-hover:scale-125 group-hover:rotate-90 duration-300" />
              </button>
            </div>
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