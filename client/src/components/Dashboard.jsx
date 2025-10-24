import { useState, useEffect } from "react";
import axios from "axios";
import { Bell, Users, Plus, MessageCircle } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import JoinedOrgDash from "./JoinedOrgDash";

const Dashboard = ({ onSettingsClick, onJoinOrgClick, onCreateOrgClick, onMessagesClick, onNotificationsClick }) => {
  const { user, checkAuth } = useAuth();

  const [organization, setOrganization] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const activities = [
    "Alex pushed updates to repo 🚀",
    "Meeting scheduled for 4:30 PM 📅",
    "Mira joined #frontend channel 💬",
  ];

  const notices = [
    { 
      id: 100,
      title: "All - Updated Paid Leave Policy",
      body: "The HR department has updated the paid leave policy effective from next month. Please review the changes in the HR portal.",
      date: "2024-06-15",
      author: "Varun Satapathy",
      author_role: "Admin"
    },
    {
      id: 101,
      title: "Frontend - New Design System Implementation",
      body: "We're rolling out our new design system components. Please update your components to match the new guidelines.",
      date: "2024-06-18",
      author: "Sarah Chen",
      author_role: "Lead Designer"
    },
    {
      id: 102,
      title: "Backend - Database Migration Schedule",
      body: "Scheduled database migration to PostgreSQL 15. Downtime expected on Saturday night. Please prepare your services accordingly.",
      date: "2024-06-20",
      author: "Mike Rodriguez",
      author_role: "DevOps Lead"
    },
    {
      id: 103,
      title: "Marketing - Q3 Campaign Planning",
      body: "Team meeting to discuss and finalize Q3 marketing campaign strategies. Please prepare your proposals.",
      date: "2024-06-22",
      author: "Emily Thompson",
      author_role: "Marketing Director"
    },
    {
      id: 104,
      title: "All - Company Town Hall",
      body: "Monthly town hall meeting to discuss company updates, project progress, and team achievements. Attendance is mandatory.",
      date: "2024-06-25",
      author: "David Kumar",
      author_role: "CEO"
    }
  ];

  const fetchOrg = async () => {
    if (!user?.org_id) {
      setOrganization(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);

      // Fetch organization data and role
      const [orgRes] = await Promise.all([
        axios.get(
          `${import.meta.env.VITE_BASE_URL}/api/orgs/${user.org_id}`,
          { withCredentials: true }
        ),
        axios.get(
          `${import.meta.env.VITE_BASE_URL}/api/orgs/${user.org_id}/role`,
          { withCredentials: true }
        ),
      ]);

      setOrganization(orgRes.data.organization);
      setError(null);
    } catch (err) {
      console.error("Error fetching organization:", err);
      setOrganization(null);
      setError("Organization not found");
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    const init = async () => {
      await checkAuth(); // ensures user data is fresh and includes org_id
      await fetchOrg();
    };
    init();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full bg-white">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-screen gap-4">
        <h1 className="text-3xl font-semibold text-red-500">
          Something went wrong
        </h1>
        <p className="text-gray-400">{error}</p>
        <button
          onClick={onJoinOrgClick}
          className="btn-primary px-6 py-2 text-lg font-semibold rounded-md"
        >
          Try Joining an Organisation
        </button>
      </div>
    );
  }

  return (
    <div className="max-h-screen p-3 sm:p-6">
      <div className="max-w-7xl mx-auto space-y-4 sm:space-y-8">
        {/* ---------------- HEADER ---------------- */}
        <header className="flex pt-15 sm:pt-0 flex-row sm:justify-between sm:items-center gap-3 sm:gap-4 p-3 sm:p-6">
          {/* Welcome Message - Full width on mobile, flexible on desktop */}
          <div className="flex-1 min-w-0">
            <h1 className="text-xl sm:text-2xl lg:text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-violet-600 to-indigo-600 cursor-default leading-tight">
              Welcome back, {user?.name || "User"}
            </h1>
          </div>

          {/* Right-side: Messages + Notifications + Avatar */}
          <div className="flex items-center justify-end gap-3 sm:gap-5 flex-shrink-0">
            <div className="relative">
              <MessageCircle
                size={20}
                className="text-gray-800 hover:text-violet-500 transition-colors cursor-pointer sm:w-[23px] sm:h-[23px]"
                onClick={onMessagesClick}
                title="Messages"
              />
              <div className="absolute -top-1 -right-1 w-2 h-2 sm:w-2.5 sm:h-2.5 bg-blue-500 rounded-full"></div>
            </div>
            
            <div className="relative">
              <Bell
                size={20}
                className="text-gray-800 hover:text-violet-500 transition-colors cursor-pointer sm:w-[23px] sm:h-[23px]"
                onClick={onNotificationsClick}
                title="Notifications"
              />
              <div className="absolute -top-1 -right-1 w-2 h-2 sm:w-2.5 sm:h-2.5 bg-red-500 rounded-full"></div>
            </div>

            <div
              onClick={onSettingsClick}
              className="w-10 h-10 sm:w-12 sm:h-12 rounded-full gradient-bg flex items-center justify-center  
                         transition-all cursor-pointer overflow-hidden border-2 border-violet-600"
            >
              {user?.photo ? (
                <img
                  src={user.photo}
                  alt="Profile"
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-base sm:text-lg font-semibold text-white">
                  {user?.name?.charAt(0) || "U"}
                </span>
              )}
            </div>
          </div>
        </header>

        {/* ---------------- BODY ---------------- */}
        {organization ? (
          <JoinedOrgDash
            org={organization}
            activities={activities}
            notices={notices}
          />
        ) : (
          <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-4 sm:p-6 min-h-[400px] sm:h-[500px] flex items-center justify-center flex-col gap-4">
            <h1 className="text-2xl sm:text-5xl font-bold text-accent text-center px-4">
              Join and collaborate with your team
            </h1>

            <div className="flex flex-col gap-3 sm:gap-4 mt-6 sm:mt-8 w-full max-w-sm sm:max-w-none sm:flex-row sm:justify-center">
              <button
                onClick={onJoinOrgClick}
                className="btn-primary font-semibold transition-all duration-200 cursor-pointer active:scale-95 w-full sm:w-[280px] shadow-lg text-base sm:text-lg py-3 sm:py-4"
              >
                <Users size={20} className="inline-block mr-2 text-primary sm:w-6 sm:h-6" />
                Join Organisation
              </button>

              <button
                onClick={onCreateOrgClick}
                className="btn-secondary font-semibold transition-all duration-200 cursor-pointer active:scale-95 w-full sm:w-[280px] shadow-lg text-base sm:text-lg py-3 sm:py-4"
              >
                <Plus size={20} className="inline-block mr-2 text-violet-600 sm:w-6 sm:h-6" />
                Create Organisation
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
