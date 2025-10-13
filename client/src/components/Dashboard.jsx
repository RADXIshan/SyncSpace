import { useState, useEffect } from "react";
import axios from "axios";
import { Bell, Users, Plus } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import JoinedOrgDash from "./JoinedOrgDash";

const Dashboard = ({ onSettingsClick, onJoinOrgClick, onCreateOrgClick }) => {
  const { user, setUser } = useAuth();

  const [organization, setOrganization] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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

  const fetchOrg = async (orgId) => {
    if (!orgId) {
      setOrganization(null);
      setLoading(false);
      return;
    }

    try {
      const res = await axios.get(
        `${import.meta.env.VITE_BASE_URL}/api/orgs/${orgId}`,
        { withCredentials: true }
      );
      setOrganization(res.data.organization);
      setError(null);
    } catch (err) {
      console.error("Error fetching organization:", err);
      setOrganization(null);
      setError("Organization not found");
    } finally {
      setLoading(false);
    }
  };

  const refreshUser = async () => {
    try {
      const res = await axios.post(
        `${import.meta.env.VITE_BASE_URL}/api/auth/getMe`,
        {},
        { withCredentials: true }
      );
      if (res.data.user) {
        setUser(res.data.user);
      }
    } catch (err) {
      console.error("Failed to refresh user:", err);
    }
  };

  useEffect(() => {
    const init = async () => {
      await refreshUser(); // ensures user.org_id is latest
      await fetchOrg(user?.org_id);
    };
    init();
  }, []);

  useEffect(() => {
    if (user?.org_id) {
      fetchOrg(user.org_id);
    } else {
      setOrganization(null);
    }
  }, [user?.org_id]);

  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const res = await axios.post(
          `${import.meta.env.VITE_BASE_URL}/api/auth/getMe`,
          {},
          { withCredentials: true }
        );
        if (
          res.data.user?.org_id &&
          res.data.user.org_id !== user?.org_id
        ) {
          setUser(res.data.user);
        }
      } catch (err) {
        console.error("Polling failed:", err);
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [user, setUser]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen text-lg text-gray-400">
        Loading dashboard...
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
    <div className="max-h-screen p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* ---------------- HEADER ---------------- */}
        <header className="flex justify-between items-center gap-4 p-6">
          <div className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-violet-600 to-indigo-600 cursor-default">
            Welcome back, {user?.name || "User"}
          </div>

          {/* Right-side: Notifications + Avatar */}
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

        {/* ---------------- BODY ---------------- */}
        {organization ? (
          <JoinedOrgDash
            org={organization}
            activities={activities}
            tasks={tasks}
          />
        ) : (
          <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-6 h-[500px] flex items-center justify-center flex-col gap-4">
            <h1 className="text-5xl font-bold text-accent text-center">
              Join and collaborate with your team
            </h1>

            <div className="flex flex-col sm:flex-row gap-4 mt-8">
              <button
                onClick={onJoinOrgClick}
                className="btn-primary font-semibold transition-all duration-200 cursor-pointer active:scale-95 w-[280px] shadow-lg text-lg"
              >
                <Users size={24} className="inline-block mr-2 text-primary" />
                Join Organisation
              </button>

              <button
                onClick={onCreateOrgClick}
                className="btn-secondary font-semibold transition-all duration-200 cursor-pointer active:scale-95 w-[280px] shadow-lg text-lg"
              >
                <Plus size={24} className="inline-block mr-2 text-violet-600" />
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
