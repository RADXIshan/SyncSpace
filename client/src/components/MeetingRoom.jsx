import { useState, useEffect } from "react";
import { useParams, useSearchParams } from "react-router";
import { Video, VideoOff, Mic, MicOff, PhoneOff, Users } from "lucide-react";

const MeetingRoom = () => {
  const { roomId } = useParams();
  const [searchParams] = useSearchParams();
  const email = searchParams.get("email");
  
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);

  useEffect(() => {
    // Here you would initialize your video calling solution
    // This could be WebRTC, Agora, Twilio, etc.
  }, [roomId, email]);

  const toggleVideo = () => setIsVideoEnabled(!isVideoEnabled);
  const toggleAudio = () => setIsAudioEnabled(!isAudioEnabled);
  const leaveMeeting = () => {
    // Handle leaving the meeting
    window.close(); // Close the tab/window
  };

  return (
    <div className="min-h-screen bg-gray-900 flex flex-col">
      {/* Header */}
      <div className="bg-black/50 backdrop-blur-sm p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
            <span className="text-white font-medium">Meeting Room: {roomId}</span>
          </div>
          <div className="flex items-center gap-2 text-white/80">
            <Users size={18} />
            <span>1 participant</span>
          </div>
        </div>
      </div>

      {/* Main Video Area */}
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="relative bg-black rounded-2xl overflow-hidden max-w-4xl w-full aspect-video">
          {/* Placeholder for video content */}
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-purple-900 to-indigo-900">
            <div className="text-center text-white">
              <Video size={64} className="mx-auto mb-4 opacity-50" />
              <h2 className="text-2xl font-bold mb-2">Meeting Room</h2>
              <p className="text-white/80">Room ID: {roomId}</p>
              {email && <p className="text-white/60 text-sm mt-2">Joined as: {email}</p>}
            </div>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="bg-black/50 backdrop-blur-sm p-6">
        <div className="flex items-center justify-center gap-4">
          <button
            onClick={toggleAudio}
            className={`p-4 rounded-full transition-all ${
              isAudioEnabled 
                ? "bg-white/20 hover:bg-white/30 text-white" 
                : "bg-red-600 hover:bg-red-700 text-white"
            }`}
          >
            {isAudioEnabled ? <Mic size={24} /> : <MicOff size={24} />}
          </button>
          
          <button
            onClick={toggleVideo}
            className={`p-4 rounded-full transition-all ${
              isVideoEnabled 
                ? "bg-white/20 hover:bg-white/30 text-white" 
                : "bg-red-600 hover:bg-red-700 text-white"
            }`}
          >
            {isVideoEnabled ? <Video size={24} /> : <VideoOff size={24} />}
          </button>
          
          <button
            onClick={leaveMeeting}
            className="p-4 rounded-full bg-red-600 hover:bg-red-700 text-white transition-all"
          >
            <PhoneOff size={24} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default MeetingRoom;