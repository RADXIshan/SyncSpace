import {
  Bell,
  Users,
  Plus
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import JoinedOrgDash from "./JoinedOrgDash";

const Dashboard = ({ onSettingsClick, onJoinOrgClick, onCreateOrgClick }) => {
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
        <header className="flex justify-between items-center gap-4 p-6">
          {/* Header Title */}
          <div className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-violet-600 to-indigo-600 cursor-default">
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
              className="w-12 h-12 rounded-full gradient-bg flex items-center justify-center  
                         transition-all cursor-pointer overflow-hidden border-2 border-violet-600"
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

        {user.org_id? <JoinedOrgDash activities={activities} tasks={tasks} /> : 
          <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-6 h-[500px] flex items-center justify-center flex-col gap-4">
            <h1 className="text-5xl font-bold text-accent">
              Join and collaborate with your team
            </h1>
            <button onClick={onJoinOrgClick} className="btn-primary font-semibold transition-all duration-200 cursor-pointer active:scale-95 w-[280px] mt-8 shadow-lg text-lg">
              <Users size={24} className="inline-block mr-2 text-primary" />
              Join Organisation
            </button>
            <button onClick={onCreateOrgClick} className="btn-secondary font-semibold transition-all duration-200 cursor-pointer active:scale-95 w-[280px] shadow-lg text-lg">
              <Plus size={24} className="inline-block mr-2 text-violet-600" />
              Create Organisation
            </button>
          </div> 
        }
      </div>
    </div>
  );
};

export default Dashboard;