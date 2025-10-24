import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router";
import {
  Video,
  Users,
  Mic,
  MicOff,
  VideoOff,
  Phone,
  Settings,
  Copy,
  ExternalLink,
} from "lucide-react";
import { toast } from "react-hot-toast";

const MeetingRoom = () => {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const [isMicOn, setIsMicOn] = useState(false);
  const [isVideoOn, setIsVideoOn] = useState(false);
  const [participants] = useState([
    { id: 1, name: "You", isMuted: !isMicOn, hasVideo: isVideoOn },
  ]);

  useEffect(() => {
    if (!roomId) {
      navigate("/");
      return;
    }
  }, [roomId, navigate]);

  const handleCopyLink = () => {
    const meetingLink = `${window.location.origin}/meeting/${roomId}`;
    navigator.clipboard.writeText(meetingLink);
    toast.success("Meeting link copied to clipboard!");
  };

  const handleLeaveMeeting = () => {
    navigate(-1); // Go back to previous page
  };

  const toggleMic = () => {
    setIsMicOn(!isMicOn);
    toast.success(isMicOn ? "Microphone muted" : "Microphone unmuted");
  };

  const toggleVideo = () => {
    setIsVideoOn(!isVideoOn);
    toast.success(isVideoOn ? "Camera turned off" : "Camera turned on");
  };

  if (!roomId) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex flex-col">
      {/* Header */}
      <div className="bg-gray-800/50 backdrop-blur-xl border-b border-gray-700/50 px-4 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-600/20 border border-blue-500/30">
              <Video size={20} className="text-blue-400" />
            </div>
            <div>
              <h1 className="text-lg font-semibold text-white">Meeting Room</h1>
              <p className="text-sm text-gray-400">Room ID: {roomId}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyLink}
              className="flex items-center gap-2 px-3 py-2 bg-gray-700/50 hover:bg-gray-600/50 text-gray-300 hover:text-white rounded-lg transition-all text-sm border border-gray-600/30"
            >
              <Copy size={16} />
              Copy Link
            </button>
            <button
              onClick={() =>
                window.open(`https://meet.google.com/${roomId}`, "_blank")
              }
              className="flex items-center gap-2 px-3 py-2 bg-green-600/20 hover:bg-green-600/30 text-green-400 hover:text-green-300 rounded-lg transition-all text-sm border border-green-500/30"
            >
              <ExternalLink size={16} />
              Open in Google Meet
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Video Grid */}
        <div className="flex-1 p-4">
          <div className="max-w-7xl mx-auto h-full">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 h-full">
              {/* Main Video Area */}
              <div className="md:col-span-2 lg:col-span-2">
                <div className="relative h-full min-h-[400px] bg-gray-800/50 rounded-2xl border border-gray-700/50 overflow-hidden">
                  {isVideoOn ? (
                    <div className="w-full h-full bg-gradient-to-br from-blue-900/20 to-purple-900/20 flex items-center justify-center">
                      <div className="text-center">
                        <div className="w-24 h-24 bg-gradient-to-br from-blue-600 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
                          <Video size={32} className="text-white" />
                        </div>
                        <p className="text-white text-lg font-medium">
                          Your Video
                        </p>
                        <p className="text-gray-400 text-sm">Camera is on</p>
                      </div>
                    </div>
                  ) : (
                    <div className="w-full h-full bg-gray-800/80 flex items-center justify-center">
                      <div className="text-center">
                        <div className="w-24 h-24 bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
                          <VideoOff size={32} className="text-gray-400" />
                        </div>
                        <p className="text-white text-lg font-medium">You</p>
                        <p className="text-gray-400 text-sm">Camera is off</p>
                      </div>
                    </div>
                  )}

                  {/* Participant Info Overlay */}
                  <div className="absolute bottom-4 left-4 flex items-center gap-2 bg-black/50 backdrop-blur-sm px-3 py-2 rounded-lg">
                    <div className="flex items-center gap-2">
                      {isMicOn ? (
                        <Mic size={16} className="text-green-400" />
                      ) : (
                        <MicOff size={16} className="text-red-400" />
                      )}
                      <span className="text-white text-sm font-medium">
                        You
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Participants Panel */}
              <div className="space-y-4">
                <div className="bg-gray-800/50 rounded-2xl border border-gray-700/50 p-4">
                  <div className="flex items-center gap-2 mb-4">
                    <Users size={18} className="text-blue-400" />
                    <h3 className="text-white font-medium">
                      Participants ({participants.length})
                    </h3>
                  </div>

                  <div className="space-y-3">
                    {participants.map((participant) => (
                      <div
                        key={participant.id}
                        className="flex items-center gap-3 p-3 bg-gray-700/30 rounded-lg"
                      >
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-full flex items-center justify-center">
                          <span className="text-white text-sm font-medium">
                            {participant.name.charAt(0)}
                          </span>
                        </div>
                        <div className="flex-1">
                          <p className="text-white text-sm font-medium">
                            {participant.name}
                          </p>
                          <div className="flex items-center gap-2 mt-1">
                            {participant.isMuted ? (
                              <MicOff size={12} className="text-red-400" />
                            ) : (
                              <Mic size={12} className="text-green-400" />
                            )}
                            {participant.hasVideo ? (
                              <Video size={12} className="text-blue-400" />
                            ) : (
                              <VideoOff size={12} className="text-gray-400" />
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Meeting Info */}
                <div className="bg-gray-800/50 rounded-2xl border border-gray-700/50 p-4">
                  <h3 className="text-white font-medium mb-3">Meeting Info</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Room ID:</span>
                      <span className="text-white font-mono">{roomId}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Status:</span>
                      <span className="text-green-400">Active</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Controls Bar */}
        <div className="bg-gray-800/80 backdrop-blur-xl border-t border-gray-700/50 px-4 py-4">
          <div className="max-w-7xl mx-auto flex items-center justify-center gap-4">
            <button
              onClick={toggleMic}
              className={`p-4 rounded-full transition-all transform hover:scale-110 active:scale-95 ${
                isMicOn
                  ? "bg-gray-700/50 hover:bg-gray-600/50 text-white"
                  : "bg-red-600/20 hover:bg-red-600/30 text-red-400 border border-red-500/30"
              }`}
            >
              {isMicOn ? <Mic size={20} /> : <MicOff size={20} />}
            </button>

            <button
              onClick={toggleVideo}
              className={`p-4 rounded-full transition-all transform hover:scale-110 active:scale-95 ${
                isVideoOn
                  ? "bg-gray-700/50 hover:bg-gray-600/50 text-white"
                  : "bg-red-600/20 hover:bg-red-600/30 text-red-400 border border-red-500/30"
              }`}
            >
              {isVideoOn ? <Video size={20} /> : <VideoOff size={20} />}
            </button>

            <button className="p-4 rounded-full bg-gray-700/50 hover:bg-gray-600/50 text-white transition-all transform hover:scale-110 active:scale-95">
              <Settings size={20} />
            </button>

            <button
              onClick={handleLeaveMeeting}
              className="p-4 rounded-full bg-red-600 hover:bg-red-700 text-white transition-all transform hover:scale-110 active:scale-95 shadow-lg shadow-red-500/25"
            >
              <Phone size={20} className="rotate-[135deg]" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MeetingRoom;
