import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router";
import { useAuth } from "../context/AuthContext";
import axios from "axios";
import { ArrowLeft, FileText } from "lucide-react";
import { toast } from "react-hot-toast";
import MeetingReports from "../components/MeetingReports";

const MeetingReportsPage = () => {
  const { channelId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [channel, setChannel] = useState(null);
  const [loading, setLoading] = useState(true);
  const [hasAccess, setHasAccess] = useState(false);

  // Fetch channel details and check access
  useEffect(() => {
    const fetchChannelDetails = async () => {
      try {
        setLoading(true);
        
        // Get channel details
        const baseURL = import.meta.env.VITE_BASE_URL || 'http://localhost:3000';
        const channelResponse = await axios.get(
          `${baseURL}/api/orgs/${user.org_id}/channels/${channelId}`,
          { withCredentials: true }
        );
        
        setChannel(channelResponse.data.channel);

        // Check if user has meeting access
        const roleResponse = await axios.get(
          `${baseURL}/api/orgs/${user.org_id}/role`,
          { withCredentials: true }
        );

        const permissions = roleResponse.data.permissions;
        setHasAccess(permissions.meeting_access || permissions.isOwner);

        if (!permissions.meeting_access && !permissions.isOwner) {
          toast.error("You don't have permission to view meeting reports");
          navigate(`/home/channels/${channelId}`);
          return;
        }

      } catch (error) {
        console.error("Error fetching channel details:", error);
        if (error.response?.status === 403) {
          toast.error("You don't have access to this channel");
          navigate("/home/dashboard");
        } else if (error.response?.status === 404) {
          toast.error("Channel not found");
          navigate("/home/dashboard");
        } else {
          toast.error("Failed to load channel details");
        }
      } finally {
        setLoading(false);
      }
    };

    if (channelId && user?.org_id) {
      fetchChannelDetails();
    }
  }, [channelId, user?.org_id, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading channel details...</p>
        </div>
      </div>
    );
  }

  if (!hasAccess) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <FileText className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Access Denied
          </h2>
          <p className="text-gray-600 mb-4">
            You need meeting access permission to view meeting reports.
          </p>
          <button
            onClick={() => navigate("/home/dashboard")}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors cursor-pointer"
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => navigate(`/home/channels/${channelId}`)}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4 transition-colors cursor-pointer"
          >
            <ArrowLeft size={20} />
            <span>Back to Channel</span>
          </button>
          
          <div className="flex items-center gap-3">
            <FileText className="h-8 w-8 text-purple-600" />
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Meeting Reports
              </h1>
              {channel && (
                <p className="text-gray-600 mt-1">
                  Reports for #{channel.name}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Meeting Reports Component */}
        {channel && (
          <MeetingReports
            channelId={channelId}
            channelName={channel.name}
            orgId={user.org_id}
            showAll={false}
          />
        )}
      </div>
    </div>
  );
};

export default MeetingReportsPage;