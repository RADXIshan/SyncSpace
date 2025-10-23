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
    <div className="max-h-screen p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* ---------------- HEADER ---------------- */}
        <header className="flex justify-between items-center gap-4 p-6">
          <div className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-violet-600 to-indigo-600 cursor-default">
            Welcome back, {user?.name || "User"}
          </div>

          {/* Right-side: Messages + Notifications + Avatar */}
          <div className="flex items-center gap-2.5">
            <div className="relative group/chat hover:text-blue-500 hover:scale-120 transition-all cursor-pointer duration-300 border-2 border-transparent rounded-full p-2 hover:bg-blue-500/10 h-10 w-10 flex items-center justify-center">
              <MessageCircle
                size={23}
                className="text-gray-800 group-hover/chat:text-blue-500 transition-all cursor-pointer duration-300"
                onClick={onMessagesClick}
                title="Messages"
              />
              <div className="scale-0 group-hover/chat:scale-100 absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-blue-500 rounded-full transition-all duration-300"></div>
            </div>
            
            <div className="relative group/bell hover:text-red-500 hover:scale-120 transition-all cursor-pointer duration-300 border-2 border-transparent rounded-full p-2 hover:bg-red-500/10 h-10 w-10 flex items-center justify-center">
              <Bell
                size={23}
                className="text-gray-800 group-hover/bell:text-red-500 cursor-pointer transition-all duration-300"
                onClick={onNotificationsClick}
                title="Notifications"
              />
              <div className="scale-0 group-hover/bell:scale-100 absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-red-500 rounded-full transition-all duration-300"></div>
            </div>

            <div className="ml-0 relative group/settings hover:text-violet-500 hover:scale-110 transition-all cursor-pointer duration-300 border-2 border-transparent rounded-full p-2 hover:bg-violet-500/10 h-full w-full flex items-center justify-center">
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
              <div className="scale-0 group-hover/settings:scale-100 absolute top-0.5 right-0.5 w-[11px] h-[11px] bg-purple-500 rounded-full transition-all duration-300"></div>
              </div>
          </div>
        </header>

        {/* ---------------- BODY ---------------- */}
        {organization ? (
          <JoinedOrgDash
            org={organization}
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
