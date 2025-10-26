import { Calendar, Activity } from "lucide-react";
import { useNavigate } from "react-router";
import { useState, useEffect } from "react";
import NoticeBoard from "./NoticeBoard";
import { useAuth } from "../context/AuthContext";

const JoinedOrgDash = ({ activities }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [meetings, setMeetings] = useState([]);

  // Fetch meetings for today and tomorrow
  useEffect(() => {
    const fetchMeetings = async () => {
      if (!user?.user_id || !user?.org_id) return;

      try {
        // First get user's role and accessible teams
        const userRoleResponse = await fetch(`${import.meta.env.VITE_BASE_URL}/api/orgs/${user.org_id}/role`, {
          credentials: 'include'
        });
        let userAccessibleTeams = [];
        let isOwner = false;
        
        if (userRoleResponse.ok) {
          const roleData = await userRoleResponse.json();
          isOwner = roleData.isOwner;
          
          // Get user's accessible teams from organization members
          const membersResponse = await fetch(`${import.meta.env.VITE_BASE_URL}/api/orgs/${user.org_id}/members`, {
            credentials: 'include'
          });
          if (membersResponse.ok) {
            const membersData = await membersResponse.json();
            const currentUserMember = membersData.members.find(member => member.userId === user.user_id);
            userAccessibleTeams = currentUserMember?.accessible_teams || [];
          }
        }

        // Fetch all meetings for the organization
        const meetingsResponse = await fetch(`${import.meta.env.VITE_BASE_URL}/api/meetings?org_id=${user.org_id}`, {
          credentials: 'include'
        });
        if (meetingsResponse.ok) {
          const meetingsData = await meetingsResponse.json();
          const allMeetings = meetingsData.meetings || [];
          
          // Filter meetings based on accessible teams and date range
          const now = new Date();
          const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
          const tomorrow = new Date(today);
          tomorrow.setDate(tomorrow.getDate() + 1);
          const dayAfterTomorrow = new Date(tomorrow);
          dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 1);

          const upcomingMeetings = allMeetings
            .filter(meeting => {
              const meetingDate = new Date(meeting.start_time);
              const isInDateRange = meetingDate >= today && meetingDate < dayAfterTomorrow;
              
              if (!isInDateRange) return false;
              
              // If user is owner, they can see all meetings
              if (isOwner) return true;
              
              // If meeting has no channel (org-wide), all members can see it
              if (!meeting.channel_name) return true;
              
              // If user has no accessible teams restriction, they can see all meetings
              if (!Array.isArray(userAccessibleTeams) || userAccessibleTeams.length === 0) return true;
              
              // Check if user has access to the meeting's channel
              return userAccessibleTeams.includes(meeting.channel_name);
            })
            .sort((a, b) => new Date(a.start_time) - new Date(b.start_time))
            .map(meeting => {
              const meetingDate = new Date(meeting.start_time);
              const isToday = meetingDate >= today && meetingDate < tomorrow;
              const time = meetingDate.toLocaleTimeString('en-US', { 
                hour: 'numeric', 
                minute: '2-digit', 
                hour12: true 
              });
              
              return {
                ...meeting,
                displayTime: time,
                isToday,
                dayLabel: isToday ? 'Today' : 'Tomorrow'
              };
            });

          setMeetings(upcomingMeetings);
        }
      } catch (error) {
        console.error('Error fetching meetings:', error);
      }
    };

    fetchMeetings();
  }, [user?.user_id, user?.org_id]);

  // Helper function to get meeting icon based on title or type
  const getMeetingIcon = (title) => {
    const lowerTitle = title.toLowerCase();
    if (lowerTitle.includes('standup') || lowerTitle.includes('daily')) return '💬';
    if (lowerTitle.includes('design') || lowerTitle.includes('ui') || lowerTitle.includes('ux')) return '🎨';
    if (lowerTitle.includes('planning') || lowerTitle.includes('sprint')) return '📋';
    if (lowerTitle.includes('review') || lowerTitle.includes('demo')) return '👀';
    if (lowerTitle.includes('retrospective') || lowerTitle.includes('retro')) return '🔄';
    if (lowerTitle.includes('sync') || lowerTitle.includes('meeting')) return '📞';
    return '🕓';
  };

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
                {meetings.length > 0 ? (
                  meetings.map((meeting, index) => (
                    <div key={meeting.event_id || index} className="group/card relative bg-gray-800/50 hover:bg-gray-700/50 border border-gray-600/50 hover:border-purple-500/50 rounded-lg sm:rounded-xl p-3 sm:p-4 cursor-pointer transition-all duration-300 transform hover:shadow-lg hover:shadow-purple-500/10">
                      <div className="absolute inset-0 bg-gradient-to-r from-purple-500/5 to-indigo-500/5 rounded-lg sm:rounded-xl opacity-0 group-hover/card:opacity-100 transition-opacity duration-300"></div>
                      <div className="relative z-10">
                        <div className="flex items-center justify-between">
                          <p className="text-sm sm:text-base text-gray-300 group-hover/card:text-gray-200 transition-colors duration-300">
                            {getMeetingIcon(meeting.title)} {meeting.displayTime} — {meeting.title}
                          </p>
                          <span className={`text-xs px-2 py-1 rounded-full ${
                            meeting.isToday 
                              ? 'bg-green-500/20 text-green-400 border border-green-500/30' 
                              : 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                          }`}>
                            {meeting.dayLabel}
                          </span>
                        </div>
                        <div className="flex items-center justify-between mt-1">
                          {meeting.description && (
                            <p className="text-xs text-gray-400 truncate flex-1">
                              {meeting.description}
                            </p>
                          )}
                          {meeting.channel_name && (
                            <span className="text-xs text-purple-400 bg-purple-500/10 px-2 py-1 rounded-full ml-2 flex-shrink-0">
                              #{meeting.channel_name}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8">
                    <Calendar className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                    <p className="text-gray-400 text-sm">No meetings scheduled for today or tomorrow</p>
                  </div>
                )}
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