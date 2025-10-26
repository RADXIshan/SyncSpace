import { Calendar, Video, Clock } from "lucide-react";
import { useNavigate } from "react-router";
import { useState, useEffect } from "react";
import NoticeBoard from "./NoticeBoard";
import { useAuth } from "../context/AuthContext";

const JoinedOrgDash = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [meetings, setMeetings] = useState([]);

  // Fetch meetings for today and tomorrow
  useEffect(() => {
    const fetchMeetings = async () => {
      if (!user?.user_id || !user?.org_id) return;

      try {
        // First get user's role and accessible teams
        const userRoleResponse = await fetch(
          `${import.meta.env.VITE_BASE_URL}/api/orgs/${user.org_id}/role`,
          {
            credentials: "include",
          }
        );
        let userAccessibleTeams = [];
        let isOwner = false;

        if (userRoleResponse.ok) {
          const roleData = await userRoleResponse.json();
          isOwner = roleData.isOwner;

          // Get user's accessible teams from organization members
          const membersResponse = await fetch(
            `${import.meta.env.VITE_BASE_URL}/api/orgs/${user.org_id}/members`,
            {
              credentials: "include",
            }
          );
          if (membersResponse.ok) {
            const membersData = await membersResponse.json();
            const currentUserMember = membersData.members.find(
              (member) => member.userId === user.user_id
            );
            userAccessibleTeams = currentUserMember?.accessible_teams || [];
          }
        }

        // Fetch all meetings for the organization
        const meetingsResponse = await fetch(
          `${import.meta.env.VITE_BASE_URL}/api/meetings?org_id=${user.org_id}`,
          {
            credentials: "include",
          }
        );
        if (meetingsResponse.ok) {
          const meetingsData = await meetingsResponse.json();
          const allMeetings = meetingsData.meetings || [];

          // Filter meetings based on accessible teams and date range
          const now = new Date();
          const today = new Date(
            now.getFullYear(),
            now.getMonth(),
            now.getDate()
          );
          const tomorrow = new Date(today);
          tomorrow.setDate(tomorrow.getDate() + 1);
          const dayAfterTomorrow = new Date(tomorrow);
          dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 1);

          const upcomingMeetings = allMeetings
            .filter((meeting) => {
              const meetingDate = new Date(meeting.start_time);
              const isInDateRange =
                meetingDate >= today && meetingDate < dayAfterTomorrow;

              if (!isInDateRange) return false;

              // If user is owner, they can see all meetings
              if (isOwner) return true;

              // If meeting has no channel (org-wide), all members can see it
              if (!meeting.channel_name) return true;

              // If user has no accessible teams restriction, they can see all meetings
              if (
                !Array.isArray(userAccessibleTeams) ||
                userAccessibleTeams.length === 0
              )
                return true;

              // Check if user has access to the meeting's channel
              return userAccessibleTeams.includes(meeting.channel_name);
            })
            .sort((a, b) => new Date(a.start_time) - new Date(b.start_time))
            .map((meeting) => {
              const meetingDate = new Date(meeting.start_time);
              const isToday = meetingDate >= today && meetingDate < tomorrow;
              const time = meetingDate.toLocaleTimeString("en-US", {
                hour: "numeric",
                minute: "2-digit",
                hour12: true,
              });

              return {
                ...meeting,
                displayTime: time,
                isToday,
                dayLabel: isToday ? "Today" : "Tomorrow",
              };
            });

          setMeetings(upcomingMeetings);
        }
      } catch (error) {
        console.error("Error fetching meetings:", error);
      }
    };

    fetchMeetings();
  }, [user?.user_id, user?.org_id]);

  // Helper function to get meeting icon based on title or type

  return (
    <>
      {/* Dashboard Grid - Side by side layout */}
      <main className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6 h-full">
        {/* Meetings - Left side */}
        <section className="relative bg-gray-900/95 backdrop-blur-xl border border-gray-700/50 rounded-2xl sm:rounded-3xl shadow-2xl overflow-hidden group/meetings flex flex-col transition-all duration-500 hover:scale-[1.02]">
          {/* Background gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-br from-purple-900/20 via-gray-900/50 to-indigo-900/20"></div>

          <div className="relative z-10 p-4 sm:p-6 lg:p-8 flex flex-col h-full">
            <div className="flex items-center justify-between mb-4 sm:mb-6 lg:mb-8">
              <div className="flex items-center gap-2 sm:gap-3 lg:gap-4 flex-1 min-w-0">
                <div className="p-2 sm:p-3 lg:p-4 rounded-full bg-purple-500/20 border border-purple-500/30 group-hover/meetings:bg-purple-500/30 transition-all duration-300 flex-shrink-0">
                  <Clock
                    size={18}
                    className="text-purple-400 group-hover/meetings:scale-110 transition-all duration-300 sm:w-6 sm:h-6"
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <h2 className="text-lg sm:text-xl lg:text-2xl font-bold text-white group-hover/meetings:text-purple-100 transition-colors duration-300">
                    Meetings
                  </h2>
                  <p className="text-gray-400 text-xs sm:text-sm mt-1 hidden sm:block">
                    Today & tomorrow's schedule
                  </p>
                </div>
              </div>
            </div>

            <div className="flex-1 overflow-hidden">
              {meetings.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 sm:py-12 lg:py-16 text-center px-4">
                  <div className="relative mb-4 sm:mb-6">
                    <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-gradient-to-br from-purple-500/20 to-indigo-500/20 flex items-center justify-center border border-purple-500/30">
                      <Calendar
                        size={24}
                        className="text-purple-400 opacity-60 sm:w-8 sm:h-8"
                      />
                    </div>
                    <div className="absolute -top-1 -right-1 w-4 h-4 sm:w-6 sm:h-6 rounded-full bg-gradient-to-br from-purple-500/30 to-indigo-500/30 animate-pulse"></div>
                  </div>
                  <h3 className="text-lg sm:text-xl font-semibold text-gray-300 mb-2">
                    No meetings scheduled
                  </h3>
                  <p className="text-gray-400 text-xs sm:text-sm max-w-xs">
                    Your calendar is clear for today and tomorrow
                  </p>
                </div>
              ) : (
                <div className="space-y-2 sm:space-y-3 max-h-full overflow-y-auto pr-1 sm:pr-2 scrollbar-thin scrollbar-thumb-purple-500/30 scrollbar-track-transparent">
                  {meetings.map((meeting, index) => (
                    <div
                      key={meeting.event_id || index}
                      className="group/card relative bg-gray-800/50 hover:bg-gray-700/50 border border-gray-600/50 hover:border-purple-500/50 rounded-lg sm:rounded-xl lg:rounded-2xl p-3 sm:p-4 lg:p-6 cursor-pointer transition-all duration-300 transform hover:shadow-lg hover:shadow-purple-500/10"
                    >
                      {/* Hover gradient overlay */}
                      <div className="absolute inset-0 bg-gradient-to-r from-purple-500/5 to-indigo-500/5 rounded-lg sm:rounded-xl lg:rounded-2xl opacity-0 group-hover/card:opacity-100 transition-opacity duration-300"></div>

                      <div className="relative z-10">
                        {/* Header */}
                        <div className="flex justify-between items-start gap-2 sm:gap-3 mb-2 sm:mb-3">
                          <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
                            <div className="text-base sm:text-lg flex-shrink-0">
                              <Video size={20} className="text-purple-400" />
                            </div>
                            <h3 className="text-sm sm:text-base lg:text-lg font-semibold text-white group-hover/card:text-purple-100 transition-colors duration-300 flex-1 line-clamp-2 leading-tight">
                              {meeting.title}
                            </h3>
                          </div>
                        </div>

                        {/* Tags */}
                        <div className="mb-3 sm:mb-4">
                          <div className="flex items-center gap-1 sm:gap-2 flex-wrap">
                            <span className="text-xs font-mono text-blue-300 bg-blue-500/10 px-2 py-1 rounded-full border border-blue-500/20">
                              {meeting.displayTime}
                            </span>
                            <span
                              className={`text-xs px-2 py-1 rounded-full font-medium ${
                                meeting.isToday
                                  ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                                  : "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                              }`}
                            >
                              {meeting.dayLabel}
                            </span>
                            {meeting.channel_name && (
                              <span className="text-xs text-purple-300 bg-purple-500/15 px-2 py-1 rounded-full border border-purple-500/25">
                                #{meeting.channel_name}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Footer */}
                        <div className="flex items-center justify-between text-xs">
                          <div className="flex items-center gap-2 text-gray-400 group-hover/card:text-gray-300 transition-colors">
                            <Calendar size={14} />
                            <span className="font-medium">
                              Scheduled meeting
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* View Calendar Button */}
            <div className="mt-4 pt-4 border-t border-gray-700/50">
              <button
                onClick={() => navigate("/home/calendar")}
                className="w-full px-4 py-3 text-sm font-semibold rounded-xl bg-purple-600/20 hover:bg-purple-600/30 border border-purple-500/30 text-purple-400 hover:text-purple-300 transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98] shadow-lg backdrop-blur-sm group/btn cursor-pointer"
              >
                <div className="flex items-center justify-center gap-2">
                  <Calendar
                    size={16}
                    className="group-hover/btn:scale-110 transition-transform duration-300"
                  />
                  <span>View Full Calendar</span>
                </div>
              </button>
            </div>
          </div>
        </section>

        {/* Notice Board - Right side */}
        <NoticeBoard orgId={user?.org_id} className="col-span-1" />
      </main>
    </>
  );
};

export default JoinedOrgDash;
