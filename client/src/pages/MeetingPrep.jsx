import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router";
import { useAuth } from "../context/AuthContext";
import {
  Video,
  VideoOff,
  Mic,
  MicOff,
  Settings,
  ArrowLeft,
  Users,
  Calendar,
  Clock,
} from "lucide-react";
import { toast } from "react-hot-toast";
import axios from "axios";

// Add custom styles for the date picker
const datePickerStyles = `
  .react-datepicker {
    background-color: #1f2937 !important;
    border: 1px solid #374151 !important;
    color: white !important;
  }
  .react-datepicker__header {
    background-color: #374151 !important;
    border-bottom: 1px solid #4b5563 !important;
  }
  .react-datepicker__current-month,
  .react-datepicker__day-name {
    color: white !important;
  }
  .react-datepicker__day {
    color: #d1d5db !important;
  }
  .react-datepicker__day:hover {
    background-color: #6366f1 !important;
  }
  .react-datepicker__day--selected {
    background-color: #8b5cf6 !important;
  }
  .react-datepicker__time-container {
    border-left: 1px solid #4b5563 !important;
  }
  .react-datepicker__time-list-item {
    color: #d1d5db !important;
  }
  .react-datepicker__time-list-item:hover {
    background-color: #6366f1 !important;
  }
`;

// Inject styles
if (typeof document !== "undefined") {
  const styleElement = document.createElement("style");
  styleElement.textContent = datePickerStyles;
  document.head.appendChild(styleElement);
}

const MeetingPrep = () => {
  const { meetingId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const videoRef = useRef(null);
  const [stream, setStream] = useState(null);

  // Form state
  const [email, setEmail] = useState(user?.email || "");
  const [isLoading, setIsLoading] = useState(false);

  // Media controls
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [devices, setDevices] = useState({ cameras: [], microphones: [] });
  const [selectedCamera, setSelectedCamera] = useState("");
  const [selectedMicrophone, setSelectedMicrophone] = useState("");

  // Meeting info
  const [meetingInfo, setMeetingInfo] = useState(null);
  const [meetingLoading, setMeetingLoading] = useState(true);
  const [userPermissions, setUserPermissions] = useState(null);

  // Function to reinitialize media stream
  const reinitializeStream = async () => {
    try {
      // Stop existing stream
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }

      // If both video and audio are disabled, don't create a stream
      if (!isVideoEnabled && !isAudioEnabled) {
        setStream(null);
        if (videoRef.current) {
          videoRef.current.srcObject = null;
        }
        toast.success("Devices refreshed successfully");
        return null;
      }

      // Only request enabled devices
      const constraints = {
        video: isVideoEnabled
          ? (selectedCamera ? { deviceId: { exact: selectedCamera } } : true)
          : false,
        audio: isAudioEnabled
          ? (selectedMicrophone ? { deviceId: { exact: selectedMicrophone } } : true)
          : false,
      };

      let newStream;
      try {
        newStream = await navigator.mediaDevices.getUserMedia(constraints);
      } catch (error) {
        console.warn("Failed with specific devices, trying defaults:", error);
        // Fallback to default devices
        try {
          newStream = await navigator.mediaDevices.getUserMedia({
            video: isVideoEnabled,
            audio: isAudioEnabled,
          });
        } catch (fallbackError) {
          console.error("Failed to reinitialize with defaults:", fallbackError);
          toast.error(
            "Failed to reinitialize. Please check device permissions and try again."
          );
          throw fallbackError;
        }
      }

      setStream(newStream);

      // Set video if enabled
      if (isVideoEnabled && videoRef.current) {
        videoRef.current.srcObject = newStream;
      } else if (videoRef.current) {
        videoRef.current.srcObject = null;
      }

      toast.success("Camera and microphone refreshed successfully");
      return newStream;
    } catch (error) {
      console.error("Error reinitializing stream:", error);
      throw error;
    }
  };

  // Get user media and devices
  useEffect(() => {
    let isMounted = true;

    const initializeMedia = async () => {
      try {
        // Clean up any existing stream first
        if (stream) {
          stream.getTracks().forEach((track) => track.stop());
        }

        // Try to get both video and audio first
        let mediaStream;
        try {
          mediaStream = await navigator.mediaDevices.getUserMedia({
            video: true,
            audio: true,
          });
        } catch (error) {
          console.warn(
            "Failed to get both video and audio, trying audio only:",
            error
          );
          try {
            // If both fail, try audio only
            mediaStream = await navigator.mediaDevices.getUserMedia({
              video: false,
              audio: true,
            });
            if (isMounted) {
              toast.error("Camera access denied. Audio only mode enabled.");
              setIsVideoEnabled(false);
            }
          } catch (audioError) {
            console.warn("Failed to get audio, trying video only:", audioError);
            try {
              // If audio fails, try video only
              mediaStream = await navigator.mediaDevices.getUserMedia({
                video: true,
                audio: false,
              });
              if (isMounted) {
                toast.error(
                  "Microphone access denied. Video only mode enabled."
                );
                setIsAudioEnabled(false);
              }
            } catch (videoError) {
              console.error("Failed to get any media:", videoError);
              if (isMounted) {
                toast.error(
                  "Unable to access camera or microphone. Please check permissions."
                );
              }
              return;
            }
          }
        }

        // Only set stream if component is still mounted
        if (isMounted && mediaStream) {
          setStream(mediaStream);
          if (videoRef.current) {
            videoRef.current.srcObject = mediaStream;
          }
        } else if (mediaStream) {
          // Component unmounted, clean up the stream
          mediaStream.getTracks().forEach((track) => track.stop());
          return;
        }

        // Get available devices
        const deviceList = await navigator.mediaDevices.enumerateDevices();
        const cameras = deviceList.filter(
          (device) => device.kind === "videoinput"
        );
        const microphones = deviceList.filter(
          (device) => device.kind === "audioinput"
        );

        if (isMounted) {
          setDevices({ cameras, microphones });

          if (cameras.length > 0) setSelectedCamera(cameras[0].deviceId);
          if (microphones.length > 0)
            setSelectedMicrophone(microphones[0].deviceId);
        }
      } catch (error) {
        console.error("Error accessing media devices:", error);
        if (isMounted) {
          toast.error(
            "Unable to initialize media devices. Please refresh and check permissions."
          );
        }
      }
    };

    initializeMedia();

    // Cleanup function
    return () => {
      isMounted = false;
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, []); // Remove stream dependency to avoid infinite re-renders

  // Fetch meeting information
  useEffect(() => {
    const fetchMeetingInfo = async () => {
      if (!meetingId || !user?.org_id) return;

      try {
        setMeetingLoading(true);
        const response = await axios.get(
          `${import.meta.env.VITE_BASE_URL}/api/meetings/${meetingId}`,
          { withCredentials: true }
        );
        setMeetingInfo(response.data.meeting);
        setUserPermissions(response.data.userPermissions);
      } catch (error) {
        console.error("Error fetching meeting info:", error);
        toast.error("Failed to load meeting information");
        navigate(-1); // Go back if meeting not found
      } finally {
        setMeetingLoading(false);
      }
    };

    fetchMeetingInfo();
  }, [meetingId, user?.org_id, navigate]);

  // Handle video element when stream changes
  useEffect(() => {
    if (videoRef.current) {
      if (stream && isVideoEnabled) {
        videoRef.current.srcObject = stream;
        // Add a small delay to ensure the video element is ready
        setTimeout(() => {
          if (videoRef.current) {
            videoRef.current.play().catch(console.error);
          }
        }, 100);
      } else {
        // Clear video element when video is disabled or no stream
        videoRef.current.srcObject = null;
      }
    }
  }, [stream, isVideoEnabled]);

  // Handle page visibility changes to manage stream properly
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        // Page is hidden, pause video to save resources
        if (stream && videoRef.current) {
          videoRef.current.pause();
        }
      } else {
        // Page is visible, resume video
        if (stream && videoRef.current) {
          videoRef.current.play().catch(console.error);
        }
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [stream]);

  // Toggle video
  const toggleVideo = async () => {
    if (!isVideoEnabled) {
      // Turning video ON - restart the stream with video
      try {
        // Stop existing stream
        if (stream) {
          stream.getTracks().forEach((track) => track.stop());
        }

        const constraints = {
          video: selectedCamera
            ? { deviceId: { exact: selectedCamera } }
            : true,
          audio: isAudioEnabled
            ? (selectedMicrophone ? { deviceId: { exact: selectedMicrophone } } : true)
            : false,
        };

        const newStream = await navigator.mediaDevices.getUserMedia(
          constraints
        );

        setStream(newStream);
        if (videoRef.current) {
          videoRef.current.srcObject = newStream;
        }

        setIsVideoEnabled(true);
      } catch (error) {
        console.error("Error turning on camera:", error);
        toast.error(
          "Failed to turn on camera. Please check your camera permissions."
        );
      }
    } else {
      // Turning video OFF
      if (isAudioEnabled) {
        // If audio is enabled, create audio-only stream
        try {
          if (stream) {
            stream.getTracks().forEach((track) => track.stop());
          }

          const audioConstraints = {
            audio: selectedMicrophone
              ? { deviceId: { exact: selectedMicrophone } }
              : true,
          };

          const audioOnlyStream = await navigator.mediaDevices.getUserMedia(
            audioConstraints
          );

          setStream(audioOnlyStream);
          if (videoRef.current) {
            videoRef.current.srcObject = null;
          }
        } catch (error) {
          console.error("Error creating audio-only stream:", error);
          // If audio fails, stop everything
          if (stream) {
            stream.getTracks().forEach((track) => track.stop());
          }
          setStream(null);
          if (videoRef.current) {
            videoRef.current.srcObject = null;
          }
        }
      } else {
        // If audio is also disabled, stop the entire stream
        if (stream) {
          stream.getTracks().forEach((track) => track.stop());
          setStream(null);
          if (videoRef.current) {
            videoRef.current.srcObject = null;
          }
        }
      }
      setIsVideoEnabled(false);
    }
  };

  // Toggle audio
  const toggleAudio = async () => {
    if (!isAudioEnabled) {
      // Turning audio ON
      if (!stream) {
        // No stream exists, create one
        try {
          const constraints = {
            video: isVideoEnabled 
              ? (selectedCamera ? { deviceId: { exact: selectedCamera } } : true)
              : false,
            audio: selectedMicrophone
              ? { deviceId: { exact: selectedMicrophone } }
              : true,
          };

          const newStream = await navigator.mediaDevices.getUserMedia(constraints);
          setStream(newStream);
          
          if (isVideoEnabled && videoRef.current) {
            videoRef.current.srcObject = newStream;
          }
          
          setIsAudioEnabled(true);
        } catch (error) {
          console.error("Error turning on microphone:", error);
          toast.error("Failed to turn on microphone. Please check permissions.");
        }
      } else {
        // Stream exists, just enable audio track
        const audioTrack = stream.getAudioTracks()[0];
        if (audioTrack) {
          audioTrack.enabled = true;
          setIsAudioEnabled(true);
        }
      }
    } else {
      // Turning audio OFF
      if (stream) {
        const audioTrack = stream.getAudioTracks()[0];
        if (audioTrack) {
          audioTrack.enabled = false;
          setIsAudioEnabled(false);
          
          // If video is also off, stop the entire stream
          if (!isVideoEnabled) {
            stream.getTracks().forEach((track) => track.stop());
            setStream(null);
            if (videoRef.current) {
              videoRef.current.srcObject = null;
            }
          }
        }
      }
    }
  };

  // Change camera
  const changeCamera = async (deviceId) => {
    try {
      // Only change camera if video is enabled or we need to create a stream
      if (!isVideoEnabled && !isAudioEnabled) {
        // Just update the selected camera, don't create stream
        setSelectedCamera(deviceId);
        return;
      }

      // Stop existing stream
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }

      const constraints = {
        video: isVideoEnabled ? { deviceId: { exact: deviceId } } : false,
        audio: isAudioEnabled 
          ? (selectedMicrophone ? { deviceId: { exact: selectedMicrophone } } : true)
          : false,
      };

      const newStream = await navigator.mediaDevices.getUserMedia(constraints);

      setStream(newStream);

      // Only set video if enabled
      if (isVideoEnabled && videoRef.current) {
        videoRef.current.srcObject = newStream;
      }

      setSelectedCamera(deviceId);
    } catch (error) {
      console.error("Error changing camera:", error);
      toast.error("Failed to change camera. Please check device permissions.");
    }
  };

  // Change microphone
  const changeMicrophone = async (deviceId) => {
    try {
      // Only change microphone if audio is enabled or we need to create a stream
      if (!isVideoEnabled && !isAudioEnabled) {
        // Just update the selected microphone, don't create stream
        setSelectedMicrophone(deviceId);
        return;
      }

      // Stop existing stream
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }

      const constraints = {
        video: isVideoEnabled
          ? (selectedCamera ? { deviceId: { exact: selectedCamera } } : true)
          : false,
        audio: isAudioEnabled ? { deviceId: { exact: deviceId } } : false,
      };

      const newStream = await navigator.mediaDevices.getUserMedia(constraints);

      setStream(newStream);

      // Only set video if enabled
      if (isVideoEnabled && videoRef.current) {
        videoRef.current.srcObject = newStream;
      }

      setSelectedMicrophone(deviceId);
    } catch (error) {
      console.error("Error changing microphone:", error);
      toast.error(
        "Failed to change microphone. Please check device permissions."
      );
    }
  };

  // Join meeting
  const handleJoinMeeting = async (e) => {
    e.preventDefault();

    if (!email.trim()) {
      toast.error("Please enter your email");
      return;
    }

    setIsLoading(true);

    try {
      // Only attempt to start the meeting if:
      // 1. It hasn't been started yet
      // 2. User has permission to start it
      if (!meetingInfo.started && userPermissions?.canStart) {
        try {
          const token = localStorage.getItem("token");
          const headers = token ? { Authorization: `Bearer ${token}` } : {};
          
          await axios.patch(
            `${import.meta.env.VITE_BASE_URL}/api/meetings/${meetingId}/start`,
            {},
            { 
              withCredentials: true,
              headers
            }
          );
          toast.success("Meeting started successfully");
        } catch (startError) {
          console.error("Error starting meeting:", startError);
          toast.error("Failed to start meeting");
          setIsLoading(false);
          return;
        }
      } else if (!meetingInfo.started && !userPermissions?.canStart) {
        // User doesn't have permission to start the meeting
        toast.error("Only users with meeting access can start this meeting");
        setIsLoading(false);
        return;
      }

      // Stop the current stream since we're leaving this page
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }

      // Navigate to the actual meeting room
      if (meetingInfo?.meeting_link) {
        // If it's an external link, open in new tab
        if (!meetingInfo.meeting_link.includes(window.location.origin)) {
          window.open(meetingInfo.meeting_link, "_blank");
          navigate(-1); // Go back to previous page
        } else {
          // If it's an internal meeting room, navigate to it with settings
          const roomId = meetingInfo.meeting_link.split("/meeting/")[1];
          
          // Store meeting data for report creation later
          const meetingData = {
            title: meetingInfo.title,
            channelId: meetingInfo.channel_id,
            orgId: meetingInfo.org_id,
            startedAt: new Date().toISOString(),
            participants: [
              {
                id: user.user_id,
                name: user.name,
                email: user.email
              }
            ]
          };
          localStorage.setItem(`meeting_${roomId}`, JSON.stringify(meetingData));
          
          const params = new URLSearchParams({
            email: email,
            video: isVideoEnabled.toString(),
            audio: isAudioEnabled.toString()
          });
          navigate(`/meeting/${roomId}?${params.toString()}`);
        }
      }
    } catch (error) {
      console.error("Error joining meeting:", error);
      toast.error("Failed to join meeting");
    } finally {
      setIsLoading(false);
    }
  };

  const formatMeetingTime = (startTime) => {
    const date = new Date(startTime);
    return {
      date: date.toLocaleDateString("en-US", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      }),
      time: date.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
      }),
    };
  };

  if (meetingLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-indigo-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-400 mx-auto mb-4"></div>
          <p className="text-white">Loading meeting information...</p>
        </div>
      </div>
    );
  }

  if (!meetingInfo) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-indigo-900 flex items-center justify-center">
        <div className="text-center text-white">
          <h2 className="text-2xl font-bold mb-4">Meeting Not Found</h2>
          <p className="mb-6">
            The meeting you're trying to join doesn't exist or you don't have
            access.
          </p>
          <button
            onClick={() => navigate(-1)}
            className="px-6 py-3 bg-purple-600 hover:bg-purple-700 rounded-lg font-semibold duration-300 cursor-pointer"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  const meetingTime = formatMeetingTime(meetingInfo.start_time);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-indigo-900">
      {/* Header */}
      <div className="bg-black/20 backdrop-blur-sm border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => navigate(-1)}
              className="flex items-center gap-2 text-white/80 hover:text-white duration-300 cursor-pointer border border-white/20 rounded-lg px-4 py-2 hover:bg-white/10 transition-all"
            >
              <ArrowLeft size={20} />
              <span>Back</span>
            </button>
            <h1 className="text-2xl font-semibold text-white">
              Meeting Preparation
            </h1>
            <div className="w-20"></div> {/* Spacer for centering */}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Side - Video Preview and Controls */}
          <div className="space-y-6">
            {/* Video Preview */}
            <div className="relative bg-black rounded-2xl overflow-hidden aspect-video">
              {isVideoEnabled && stream ? (
                <video
                  ref={videoRef}
                  autoPlay
                  muted
                  playsInline
                  className="w-full h-full object-cover -scale-x-100"
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-gray-800 to-gray-900">
                  {/* User Profile Photo */}
                  <div className="mb-4">
                    {user?.profile_photo ? (
                      <img
                        src={user.profile_photo}
                        alt={user.name || user.email}
                        className="w-24 h-24 rounded-full object-cover border-4 border-white/20"
                      />
                    ) : (
                      <div className="w-24 h-24 rounded-full bg-purple-600 flex items-center justify-center border-4 border-white/20">
                        <span className="text-2xl font-bold text-white">
                          {(user?.name || user?.email || "U")
                            .charAt(0)
                            .toUpperCase()}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* User Name */}
                  <h3 className="text-xl font-semibold text-white mb-2">
                    {user?.name || user?.email?.split("@")[0] || "User"}
                  </h3>

                  {/* Camera Off Indicator */}
                  <div className="flex items-center gap-2 text-white/60">
                    <VideoOff size={20} />
                    <span className="text-sm">Camera is off</span>
                  </div>
                </div>
              )}

              {/* Video Controls Overlay */}
              <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex items-center gap-4">
                <button
                  onClick={toggleVideo}
                  className={`p-3 rounded-full transition-all cursor-pointer ${
                    isVideoEnabled
                      ? "bg-white/20 hover:bg-white/30 text-white"
                      : "bg-red-600 hover:bg-red-700 text-white"
                  }`}
                >
                  {isVideoEnabled ? (
                    <Video size={20} />
                  ) : (
                    <VideoOff size={20} />
                  )}
                </button>

                <button
                  onClick={toggleAudio}
                  className={`p-3 rounded-full transition-all cursor-pointer ${
                    isAudioEnabled
                      ? "bg-white/20 hover:bg-white/30 text-white"
                      : "bg-red-600 hover:bg-red-700 text-white"
                  }`}
                >
                  {isAudioEnabled ? <Mic size={20} /> : <MicOff size={20} />}
                </button>
              </div>
            </div>

            {/* Device Settings */}
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 space-y-4">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2 text-white">
                  <Settings size={20} />
                  <h3 className="font-semibold">Device Settings</h3>
                </div>
                <button
                  onClick={reinitializeStream}
                  className="px-3 py-1 text-xs bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
                  title="Refresh camera and microphone"
                >
                  Refresh
                </button>
              </div>

              {/* Camera Selection */}
              <div>
                <label className="block text-sm font-medium text-white/80 mb-2">
                  Camera
                </label>
                <select
                  value={selectedCamera}
                  onChange={(e) => changeCamera(e.target.value)}
                  className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                >
                  {devices.cameras.map((camera) => (
                    <option
                      key={camera.deviceId}
                      value={camera.deviceId}
                      className="bg-gray-800"
                    >
                      {camera.label || `Camera ${camera.deviceId.slice(0, 8)}`}
                    </option>
                  ))}
                </select>
              </div>

              {/* Microphone Selection */}
              <div>
                <label className="block text-sm font-medium text-white/80 mb-2">
                  Microphone
                </label>
                <select
                  value={selectedMicrophone}
                  onChange={(e) => changeMicrophone(e.target.value)}
                  className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                >
                  {devices.microphones.map((mic) => (
                    <option
                      key={mic.deviceId}
                      value={mic.deviceId}
                      className="bg-gray-800"
                    >
                      {mic.label || `Microphone ${mic.deviceId.slice(0, 8)}`}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Right Side - Meeting Info and Join Form */}
          <div className="space-y-6">
            {/* Meeting Information */}
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6">
              <h2 className="text-2xl font-bold text-white mb-4">
                {meetingInfo.title}
              </h2>

              {meetingInfo.description && (
                <p className="text-white/80 mb-4">{meetingInfo.description}</p>
              )}

              <div className="space-y-3">
                <div className="flex items-center gap-3 text-white/80">
                  <Calendar size={18} />
                  <span>{meetingTime.date}</span>
                </div>
                <div className="flex items-center gap-3 text-white/80">
                  <Clock size={18} />
                  <span>{meetingTime.time}</span>
                </div>
                {meetingInfo.created_by_name && (
                  <div className="flex items-center gap-3 text-white/80">
                    <Users size={18} />
                    <span>Hosted by {meetingInfo.created_by_name}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Join Form */}
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-semibold text-white">
                  {meetingInfo && !meetingInfo.started && userPermissions?.canStart
                    ? "Start Meeting"
                    : "Join Meeting"}
                </h3>
                {meetingInfo && (
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-medium ${
                      meetingInfo.started
                        ? "bg-green-500/20 text-green-300 border border-green-500/30"
                        : "bg-purple-500/20 text-purple-300 border border-purple-500/30"
                    }`}
                  >
                    {meetingInfo.started
                      ? "Ongoing"
                      : userPermissions?.canStart
                      ? "Ready to Start"
                      : "Waiting to Start"}
                  </span>
                )}
              </div>

              <form onSubmit={handleJoinMeeting} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-white/80 mb-2">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email"
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    required
                  />
                </div>

                {!meetingInfo.started && !userPermissions?.canStart && (
                  <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-3 text-sm text-yellow-200">
                    This meeting hasn't started yet. Only users with meeting access can start it.
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isLoading || !email.trim() || (!meetingInfo.started && !userPermissions?.canStart)}
                  className="w-full py-3 px-6 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 disabled:from-gray-600 disabled:to-gray-700 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer"
                >
                  {isLoading ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      <span>
                        {meetingInfo && !meetingInfo.started && userPermissions?.canStart
                          ? "Starting..."
                          : "Joining..."}
                      </span>
                    </>
                  ) : (
                    <>
                      <Video size={20} />
                      <span>
                        {meetingInfo && !meetingInfo.started && userPermissions?.canStart
                          ? "Start Meeting"
                          : "Join Meeting"}
                      </span>
                    </>
                  )}
                </button>
              </form>
            </div>

            {/* Meeting ID Display */}
            <div className="bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/10">
              <div className="text-center">
                <p className="text-white/60 text-sm mb-1">Meeting ID</p>
                <p className="text-white font-mono text-lg">
                  {meetingInfo?.meeting_link?.includes(window.location.origin)
                    ? meetingInfo.meeting_link.split("/meeting/")[1] ||
                      meetingId
                    : meetingId}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MeetingPrep;
