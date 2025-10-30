import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { useAuth } from "../context/AuthContext";
import { FileText, Calendar, Users, Eye, ArrowRight } from "lucide-react";
import { fetchOrgReports } from "../utils/meetingReports";

const MeetingReportsOverview = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [hasAccess, setHasAccess] = useState(false);

  useEffect(() => {
    const fetchRecentReports = async () => {
      if (!user?.org_id) return;

      try {
        setLoading(true);

        // Check if user has meeting access
        const roleResponse = await fetch(
          `${import.meta.env.VITE_BASE_URL}/api/orgs/${user.org_id}/role`,
          { credentials: "include" }
        );

        if (roleResponse.ok) {
          const roleData = await roleResponse.json();
          const permissions = roleData.permissions;
          const hasPermission = permissions.meeting_access || permissions.isOwner;
          setHasAccess(hasPermission);

          if (hasPermission) {
            // Fetch recent reports (limit to 5 for overview)
            const reportsData = await fetchOrgReports(user.org_id, { limit: 5, offset: 0 });
            setReports(reportsData.reports || []);
          }
        }
      } catch (error) {
        console.error("Error fetching meeting reports:", error);
        // Don't show error toast for permission issues in overview
      } finally {
        setLoading(false);
      }
    };

    fetchRecentReports();
  }, [user?.org_id]);

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = now - date;
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays} days ago`;
    
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  };

  const formatDuration = (minutes) => {
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return `${hours}h ${remainingMinutes}m`;
  };

  const handleViewAllReports = () => {
    // Navigate to a general reports page or the first channel with reports
    if (reports.length > 0) {
      navigate(`/home/channels/${reports[0].channelId}/reports`);
    }
  };

  const handleViewReport = (report) => {
    navigate(`/home/channels/${report.channelId}/reports`);
  };

  if (!hasAccess) {
    return null; // Don't show the component if user doesn't have access
  }

  return (
    <section className="relative glass-dark rounded-2xl sm:rounded-3xl overflow-hidden group/reports flex flex-col transition-all duration-500 hover:scale-[1.02]">
      {/* Background Elements */}
      <div className="absolute inset-0 cosmic-bg"></div>

      <div className="relative z-10 p-4 pb-4.5 sm:p-6 lg:p-8 flex flex-col sm:max-h-[40rem] max-h-[25rem]">
        <div className="flex items-center justify-between mb-4 sm:mb-6 lg:mb-8">
          <div className="flex items-center gap-2 sm:gap-3 lg:gap-4 flex-1 min-w-0">
            <div className="p-2 sm:p-3 lg:p-4 rounded-full glass-button group-hover/reports:glass-button-enhanced transition-all duration-300 flex-shrink-0">
              <FileText
                size={18}
                className="text-purple-400 group-hover/reports:scale-110 transition-all duration-300 sm:w-6 sm:h-6"
              />
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="text-lg sm:text-xl lg:text-2xl font-bold text-white group-hover/reports:text-purple-100 transition-colors duration-300">
                Meeting Reports
              </h2>
              <p className="text-gray-400 text-xs sm:text-sm mt-1 hidden sm:block">
                Recent meeting summaries
              </p>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-hidden overflow-x-visible z-100">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-8 sm:py-12 lg:py-16">
              <div className="relative">
                <div className="animate-spin rounded-full h-8 w-8 sm:h-12 sm:w-12 border-2 border-purple-500/30"></div>
                <div className="animate-spin rounded-full h-8 w-8 sm:h-12 sm:w-12 border-t-2 border-purple-500 absolute top-0 left-0"></div>
              </div>
              <p className="text-gray-400 mt-4 text-xs sm:text-sm">
                Loading reports...
              </p>
            </div>
          ) : reports.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 sm:py-12 lg:py-16 text-center px-4">
              <div className="relative mb-4 sm:mb-6">
                <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full glass-button flex items-center justify-center">
                  <FileText
                    size={24}
                    className="text-purple-400 opacity-60 sm:w-8 sm:h-8"
                  />
                </div>
                <div className="absolute -top-1 -right-1 w-4 h-4 sm:w-6 sm:h-6 rounded-full glass-button animate-pulse"></div>
              </div>
              <h3 className="text-lg sm:text-xl font-semibold text-gray-300 mb-2">
                No meeting reports yet
              </h3>
              <p className="text-gray-400 text-xs sm:text-sm max-w-xs">
                Reports will appear here after meetings end
              </p>
            </div>
          ) : (
            <div className="space-y-2 sm:space-y-3 max-h-full overflow-y-auto overflow-x-visible pr-1 sm:pr-2 scrollbar-extrathin scrollbar-thumb-purple-500/30 scrollbar-track-transparent z-100">
              {reports.map((report) => (
                <div
                  key={report.id}
                  onClick={() => handleViewReport(report)}
                  className="group/card relative glass hover:glass-button-enhanced rounded-lg sm:rounded-xl lg:rounded-2xl p-3 sm:p-4 lg:p-6 cursor-pointer transition-all duration-300 transform"
                >
                  {/* Hover gradient overlay */}
                  <div className="absolute inset-0 bg-gradient-to-r from-purple-500/5 to-indigo-500/5 rounded-lg sm:rounded-xl lg:rounded-2xl opacity-0 group-hover/card:opacity-100 transition-opacity duration-300"></div>

                  <div className="relative z-10">
                    {/* Header */}
                    <div className="flex justify-between items-start gap-2 sm:gap-3 mb-2 sm:mb-3">
                      <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
                        <div className="text-base sm:text-lg flex-shrink-0">
                          <FileText size={16} className="text-purple-400" />
                        </div>
                        <h3 className="text-sm sm:text-base lg:text-lg font-semibold text-white group-hover/card:text-purple-100 transition-colors duration-300 flex-1 line-clamp-2 leading-tight">
                          {report.title}
                        </h3>
                      </div>
                      <Eye size={14} className="text-gray-400 group-hover/card:text-purple-300 transition-colors duration-300 flex-shrink-0 cursor-pointer" />
                    </div>

                    {/* Tags */}
                    <div className="mb-3 sm:mb-4">
                      <div className="flex items-center gap-1 sm:gap-2 flex-wrap">
                        <span className="text-xs font-mono text-blue-300 bg-blue-500/10 px-2 py-1 rounded-full border border-blue-500/20">
                          {formatDate(report.createdAt)}
                        </span>
                        <span className="text-xs text-green-300 bg-green-500/15 px-2 py-1 rounded-full border border-green-500/25">
                          {formatDuration(report.durationMinutes)}
                        </span>
                        <span className="text-xs text-purple-300 bg-purple-500/15 px-2 py-1 rounded-full border border-purple-500/25">
                          #{report.channelName}
                        </span>
                      </div>
                    </div>

                    {/* Footer */}
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-4 text-gray-400 group-hover/card:text-gray-300 transition-colors">
                        <div className="flex items-center gap-1">
                          <Users size={12} />
                          <span>{Array.isArray(report.participants) ? report.participants.length : 0}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Calendar size={12} />
                          <span>{report.messageCount} messages</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* View All Reports Button */}
        {reports.length > 0 && (
          <div className="mt-4 pt-4 border-t border-white/10">
            <button
              onClick={handleViewAllReports}
              className="w-full px-4 py-3 text-sm font-semibold rounded-xl glass-button hover:glass-button-enhanced text-purple-400 hover:text-purple-300 transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98] group/btn cursor-pointer"
            >
              <div className="flex items-center justify-center gap-2">
                <FileText
                  size={16}
                  className="group-hover/btn:scale-110 transition-transform duration-300"
                />
                <span>View All Reports</span>
                <ArrowRight
                  size={14}
                  className="group-hover/btn:translate-x-1 transition-transform duration-300"
                />
              </div>
            </button>
          </div>
        )}
      </div>
    </section>
  );
};

export default MeetingReportsOverview;