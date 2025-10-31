import { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { Bell, Users, Plus, MessageCircle } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import JoinedOrgDash from "./JoinedOrgDash";

const Dashboard = ({
  onSettingsClick,
  onJoinOrgClick,
  onCreateOrgClick,
  onMessagesClick,
  onNotificationsClick,
}) => {
  const { user, checkAuth } = useAuth();

  const [organization, setOrganization] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchOrg = useCallback(async () => {
    if (!user?.org_id) {
      setOrganization(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);

      // Fetch organization data and role
      const [orgRes] = await Promise.all([
        axios.get(`${import.meta.env.VITE_BASE_URL}/api/orgs/${user.org_id}`, {
          withCredentials: true,
        }),
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
  }, [user?.org_id]);
  useEffect(() => {
    const init = async () => {
      await checkAuth(); // ensures user data is fresh and includes org_id
      await fetchOrg();
    };
    init();
  }, [checkAuth, fetchOrg]);

  if (loading) {
    return (
      <div className="pt-10 sm:pt-0 min-h-screen bg-gradient-to-br from-violet-50 via-indigo-50 to-purple-100 flex items-center justify-center">
        <div className="text-center p-6">
          <div className="animate-spin rounded-full h-8 w-8 sm:h-12 sm:w-12 border-t-2 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600 text-sm sm:text-base">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="pt-10 sm:pt-0 min-h-screen bg-gradient-to-br from-violet-50 via-indigo-50 to-purple-100 flex flex-col items-center justify-center gap-4 p-4">
        <div className="glass rounded-2xl sm:rounded-3xl p-6 sm:p-8 text-center relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-red-500/5 via-transparent to-orange-500/5"></div>
          <div className="relative z-10">
            <h1 className="text-2xl sm:text-3xl font-semibold text-red-400 mb-4">
              Something went wrong
            </h1>
            <p className="text-white/80 text-sm sm:text-base mb-6">{error}</p>
            <button
              onClick={onJoinOrgClick}
              className="glass-button hover:glass-button-enhanced px-6 py-3 text-base sm:text-lg font-semibold cursor-pointer text-white hover:text-purple-300 transition-all duration-300"
            >
              Try Joining an Organisation
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="pt-10 sm:pt-0 min-h-screen bg-gradient-to-br from-violet-50 via-indigo-50 to-purple-100 relative overflow-hidden">
      {/* Animated gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-violet-200/20 via-indigo-200/15 to-purple-200/25 animate-pulse"></div>
      <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-tr from-transparent via-white/10 to-violet-100/20"></div>
      
      <div className="relative z-10 h-full flex flex-col p-3 sm:p-6">
        <div className="max-w-7xl mx-auto flex flex-col h-full gap-4 sm:gap-6 w-full">
          {/* ---------------- HEADER ---------------- */}
          <header className="flex-shrink-0 flex flex-row sm:justify-between sm:items-center gap-3 sm:gap-4 p-3 pt-6">
          {/* Welcome Message - Full width on mobile, flexible on desktop */}
          <div className="flex-1 min-w-0">
            <h1 className="text-xl sm:text-2xl lg:text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-violet-600 to-indigo-600 cursor-default leading-tight">
              Welcome back, {user?.name || "User"}
            </h1>
          </div>

          {/* Right-side: Messages + Notifications + Avatar */}
          <div className="flex items-center justify-end sm:gap-3 flex-shrink-0">
            <div className="relative group/chat hover:scale-110 hover:bg-blue-500/20 transition-all duration-300 p-2.5 rounded-full cursor-pointer">
              <MessageCircle
                size={20}
                className="text-gray-800 group-hover/chat:text-blue-500 transition-colors cursor-pointer sm:w-[23px] sm:h-[23px]"
                onClick={onMessagesClick}
                title="Messages"
              />
              <div className="absolute scale-0 group-hover/chat:scale-100 top-0 -right-0.5 w-2 h-2 sm:w-[11px] sm:h-[11px] bg-blue-500 rounded-full transform transition-all duration-300"></div>
            </div>

            <div className="relative group/notifications hover:scale-110 hover:bg-red-500/20 transition-all duration-300 p-2.5 rounded-full cursor-pointer">
              <Bell
                size={20}
                className="text-gray-800 group-hover/notifications:text-red-500 transition-colors cursor-pointer sm:w-[23px] sm:h-[23px]"
                onClick={onNotificationsClick}
                title="Notifications"
              />
              <div className="absolute scale-0 group-hover/notifications:scale-100 top-0 -right-0.5 w-2 h-2 sm:w-[11px] sm:h-[11px] bg-red-500 rounded-full transform transition-all duration-300"></div>
            </div>

            <div className="relative group/avatar hover:scale-110 hover:bg-violet-500/20 transition-all duration-300 p-2.5 rounded-full cursor-pointer">
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
              <div className="absolute scale-0 group-hover/avatar:scale-100 top-0.5 right-0.5 w-2 h-2 sm:w-3 sm:h-3 bg-violet-500 rounded-full transform transition-all duration-300"></div>
            </div>
          </div>
        </header>

        {/* ---------------- BODY ---------------- */}
        <div className="flex-1 min-h-0">
          {organization ? (
            <JoinedOrgDash />
          ) : (
            <div className="glass-dark rounded-2xl sm:rounded-3xl p-6 sm:p-8 lg:p-12 h-full flex items-center justify-center flex-col gap-6 relative overflow-hidden">
              <div className="absolute inset-0 cosmic-bg"></div>
              
              {/* Background Elements */}
              <div className="absolute inset-0 overflow-hidden">
                <div className="absolute top-1/4 left-1/4 w-32 h-32 bg-purple-500/5 rounded-full blur-2xl"></div>
                <div className="absolute bottom-1/4 right-1/4 w-24 h-24 bg-blue-500/5 rounded-full blur-2xl"></div>
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-40 h-40 bg-gradient-to-r from-purple-500/3 to-blue-500/3 rounded-full blur-2xl"></div>
              </div>

              <div className="relative z-10 flex flex-col items-center gap-6 text-center max-w-4xl mx-auto">
                <div className="space-y-4">
                  <h1 className="text-3xl sm:text-4xl lg:text-6xl font-bold gradient-text-purple leading-tight">
                    Join and collaborate with your team
                  </h1>
                  <p className="text-white/70 text-base sm:text-lg lg:text-xl max-w-2xl mx-auto leading-relaxed">
                    Connect with your organization to access channels, meetings, and collaborative tools
                  </p>
                </div>

                <div className="flex flex-col gap-4 sm:gap-6 mt-8 sm:mt-12 w-full max-w-md sm:max-w-none sm:flex-row sm:justify-center">
                  <button
                    onClick={onJoinOrgClick}
                    className="glass-button hover:glass-button-enhanced font-semibold transition-all duration-300 cursor-pointer active:scale-95 w-full sm:w-[320px] text-base sm:text-lg py-4 sm:py-5 text-white/80 hover:text-purple-300 group/join rounded-xl"
                  >
                    <Users
                      size={20}
                      className="inline-block mr-3 group-hover/join:scale-110 transition-transform duration-300 sm:w-6 sm:h-6"
                    />
                    Join Organisation
                  </button>

                  <button
                    onClick={onCreateOrgClick}
                    className="glass-button hover:glass-button-enhanced font-semibold transition-all duration-300 cursor-pointer active:scale-95 w-full sm:w-[320px] text-base sm:text-lg py-4 sm:py-5 text-white/80 hover:text-purple-300 group/create rounded-xl"
                  >
                    <Plus
                      size={20}
                      className="inline-block mr-3 group-hover/create:scale-110 group-hover/create:rotate-90 transition-all duration-300 sm:w-6 sm:h-6"
                    />
                    Create Organisation
                  </button>
                </div>

                <div className="mt-8 sm:mt-12 text-center">
                  <p className="text-white/50 text-sm sm:text-base">
                    New to the platform? Create your own organization or ask your team admin for an invite code
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
