import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router';
import { Video, Calendar, Clock, Users, ExternalLink } from 'lucide-react';
import { toast } from 'react-hot-toast';
import axios from 'axios';

const MeetingInvite = () => {
  const { meetingId } = useParams();
  const navigate = useNavigate();
  const [meeting, setMeeting] = useState(null);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    const fetchMeeting = async () => {
      try {
        const token = localStorage.getItem('token');
        if (token) {
          const payload = JSON.parse(atob(token.split('.')[1]));
          setCurrentUser({
            id: payload.userId,
            name: payload.name,
            email: payload.email
          });
        }

        const response = await axios.get(
          `${import.meta.env.VITE_BASE_URL}/api/meetings/${meetingId}`,
          { withCredentials: true }
        );
        
        setMeeting(response.data);
      } catch (error) {
        console.error('Error fetching meeting:', error);
        toast.error('Meeting not found');
        navigate('/home/dashboard');
      } finally {
        setLoading(false);
      }
    };

    if (meetingId) {
      fetchMeeting();
    }
  }, [meetingId, navigate]);

  const joinMeeting = async () => {
    if (!meeting) return;

    setJoining(true);
    
    try {
      // Extract room ID from meeting link
      const roomId = meeting.meeting_link.split('/meeting/')[1] || meetingId;
      
      // Navigate to meeting room
      navigate(`/meeting/${roomId}?email=${currentUser?.email || 'guest'}`);
    } catch (error) {
      console.error('Error joining meeting:', error);
      toast.error('Failed to join meeting');
    } finally {
      setJoining(false);
    }
  };

  const openExternalLink = () => {
    if (meeting?.meeting_link && !meeting.meeting_link.includes(window.location.origin)) {
      window.open(meeting.meeting_link, '_blank');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center text-white">
          <div className="w-8 h-8 border-2 border-white/30 border-t-white rounded-full animate-spin mx-auto mb-4"></div>
          <p>Loading meeting details...</p>
        </div>
      </div>
    );
  }

  if (!meeting) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center text-white">
          <Video size={64} className="mx-auto mb-4 opacity-50" />
          <h2 className="text-2xl font-bold mb-2">Meeting Not Found</h2>
          <p className="text-gray-400 mb-6">The meeting you're looking for doesn't exist or has been removed.</p>
          <button
            type="button"
            onClick={() => navigate('/home/dashboard')}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    );
  }

  const startTime = new Date(meeting.start_time);
  const now = new Date();
  const isUpcoming = startTime > now;
  const timeUntilMeeting = isUpcoming ? startTime.getTime() - now.getTime() : 0;
  const isInternal = meeting.meeting_link?.includes(window.location.origin);

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-gray-800 rounded-2xl p-8 text-center">
        <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-6">
          <Video size={32} className="text-white" />
        </div>

        <h1 className="text-2xl font-bold text-white mb-2">{meeting.title}</h1>
        
        {meeting.description && (
          <p className="text-gray-300 mb-6">{meeting.description}</p>
        )}

        <div className="space-y-4 mb-8">
          <div className="flex items-center gap-3 text-gray-300">
            <Calendar size={20} />
            <span>{startTime.toLocaleDateString()}</span>
          </div>
          
          <div className="flex items-center gap-3 text-gray-300">
            <Clock size={20} />
            <span>{startTime.toLocaleTimeString()}</span>
          </div>

          {meeting.created_by_name && (
            <div className="flex items-center gap-3 text-gray-300">
              <Users size={20} />
              <span>Hosted by {meeting.created_by_name}</span>
            </div>
          )}
        </div>

        {isUpcoming && timeUntilMeeting > 5 * 60 * 1000 && (
          <div className="bg-yellow-900/30 border border-yellow-600/30 rounded-lg p-4 mb-6">
            <p className="text-yellow-400 text-sm">
              Meeting starts in {Math.ceil(timeUntilMeeting / (1000 * 60))} minutes
            </p>
          </div>
        )}

        <div className="space-y-3">
          {isInternal ? (
            <button
              type="button"
              onClick={joinMeeting}
              disabled={joining}
              className="w-full px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 text-white rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              {joining ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  <span>Joining...</span>
                </>
              ) : (
                <>
                  <Video size={20} />
                  <span>Join Meeting</span>
                </>
              )}
            </button>
          ) : (
            <button
              type="button"
              onClick={openExternalLink}
              className="w-full px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              <ExternalLink size={20} />
              <span>Open Meeting Link</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => navigate('/home/dashboard')}
            className="w-full px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
          >
            Back to Dashboard
          </button>
        </div>

        {currentUser && (
          <div className="mt-6 pt-6 border-t border-gray-700">
            <p className="text-gray-400 text-sm">
              Joining as: {currentUser.name} ({currentUser.email})
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default MeetingInvite;