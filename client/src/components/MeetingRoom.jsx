import { useEffect, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router";
import {
  Video as VideoIcon,
  VideoOff,
  Mic,
  MicOff,
  PhoneOff,
  Users,
  Settings,
  Monitor,
  MonitorOff,
} from "lucide-react";
import { toast } from "react-hot-toast";
import { io } from "socket.io-client";
import MeetingSettings from "./MeetingSettings";

const MeetingRoom = () => {
  const { roomId } = useParams();
  const navigate = useNavigate();

  // State management
  const [peers, setPeers] = useState([]);
  const [localStream, setLocalStream] = useState(null);
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [socket, setSocket] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);

  // Refs
  const localVideoRef = useRef();
  const peersRef = useRef([]);
  const socketRef = useRef();

  const iceServers = {
    iceServers: [
      { urls: "stun:stun.l.google.com:19302" },
      { urls: "stun:stun1.l.google.com:19302" },
    ],
  };

  // Initialize socket connection
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      toast.error("Authentication required");
      navigate("/login");
      return;
    }

    try {
      const payload = JSON.parse(atob(token.split(".")[1]));
      setCurrentUser({
        id: payload.userId,
        name: payload.name,
        email: payload.email,
      });

      const socketInstance = io(
        import.meta.env.VITE_BASE_URL || "http://localhost:3000",
        {
          auth: { token },
          transports: ["websocket", "polling"],
        }
      );

      socketInstance.on("connect", () => {
        console.log("Connected to server");
        setSocket(socketInstance);
        socketRef.current = socketInstance;
        setIsConnected(true);
        toast.success("Connected to meeting server");
      });

      socketInstance.on("connect_error", (error) => {
        console.error("Connection error:", error);
        toast.error("Failed to connect to server");
      });

      socketInstance.on("disconnect", () => {
        console.log("Disconnected from server");
        setIsConnected(false);
      });

      return () => {
        // Cleanup on unmount
        if (localStream) {
          localStream.getTracks().forEach((track) => track.stop());
        }
        
        peersRef.current.forEach((peerObj) => {
          if (peerObj.peer) {
            peerObj.peer.close();
          }
        });

        if (socketInstance.connected) {
          socketInstance.emit("leave-room", roomId);
          socketInstance.disconnect();
        }
      };
    } catch (error) {
      console.error("Error parsing token:", error);
      toast.error("Invalid authentication token");
      navigate("/login");
    }
  }, [navigate, roomId]);

  // Initialize local media stream
  useEffect(() => {
    const initializeMedia = async () => {
      try {
        console.log("Requesting user media...");
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
          },
        });

        console.log("Got media stream:", stream.getTracks().map(t => `${t.kind}: ${t.enabled}`));
        
        setLocalStream(stream);
        
        // Set initial states based on actual track states
        const videoTrack = stream.getVideoTracks()[0];
        const audioTrack = stream.getAudioTracks()[0];
        
        if (videoTrack) {
          setIsVideoEnabled(videoTrack.enabled);
          console.log("Video track enabled:", videoTrack.enabled);
        }
        if (audioTrack) {
          setIsAudioEnabled(audioTrack.enabled);
          console.log("Audio track enabled:", audioTrack.enabled);
        }

        console.log("Local media initialized successfully");
      } catch (error) {
        console.error("Error accessing media devices:", error);
        toast.error("Failed to access camera/microphone");
      }
    };

    if (isConnected) {
      initializeMedia();
    }
  }, [isConnected]);

  // Handle local video element setup
  useEffect(() => {
    if (localStream && localVideoRef.current && isVideoEnabled) {
      console.log("Setting up local video element");
      localVideoRef.current.srcObject = localStream;
      
      // Ensure video plays
      localVideoRef.current.onloadedmetadata = () => {
        console.log("Local video metadata loaded, dimensions:", 
          localVideoRef.current.videoWidth, 'x', localVideoRef.current.videoHeight);
        localVideoRef.current.play().catch(console.error);
      };

      localVideoRef.current.oncanplay = () => {
        console.log("Local video can play");
        setIsVideoPlaying(true);
      };

      localVideoRef.current.onplaying = () => {
        console.log("Local video is playing");
        setIsVideoPlaying(true);
      };

      localVideoRef.current.onerror = (e) => {
        console.error("Local video error:", e);
        setIsVideoPlaying(false);
      };
    }
  }, [localStream, isVideoEnabled]);

  // Setup WebRTC signaling
  useEffect(() => {
    if (!socket || !localStream) return;

    console.log("Setting up WebRTC signaling");

    // Join room
    socket.emit("join-room", roomId);

    // Handle existing users
    socket.on("existing-users", (users) => {
      console.log("Existing users:", users);
      
      // Clear existing peers to prevent duplicates
      peersRef.current.forEach((peerObj) => {
        if (peerObj.peer) {
          peerObj.peer.close();
        }
      });
      peersRef.current = [];
      
      users.forEach((user) => {
        const peer = createPeer(user.socketId, socket.id, localStream);
        const peerObj = {
          peerID: user.socketId,
          peer,
          userName: user.userName,
          userEmail: user.userEmail,
          userId: user.userId,
          videoEnabled: true,
          audioEnabled: true,
        };
        
        peersRef.current.push(peerObj);
      });
      setPeers([...peersRef.current]);
    });

    // Handle new user joining
    socket.on("user-joined", (payload) => {
      console.log("User joined:", payload);
      
      if (payload.signal && payload.signal.type === "offer") {
        // This is a WebRTC offer - check if peer already exists
        const existingPeer = peersRef.current.find((p) => p.peerID === payload.callerID);
        if (!existingPeer) {
          const peer = addPeer(payload.signal, payload.callerID, localStream);
          const peerObj = {
            peerID: payload.callerID,
            peer,
            userName: payload.userName,
            userEmail: payload.userEmail,
            userId: payload.userId,
            videoEnabled: true,
            audioEnabled: true,
          };

          peersRef.current.push(peerObj);
          setPeers([...peersRef.current]);
        }
      } else if (payload.signal && payload.signal.candidate) {
        // This is an ICE candidate
        const existingPeer = peersRef.current.find((p) => p.peerID === payload.callerID);
        if (existingPeer) {
          try {
            existingPeer.peer.addIceCandidate(new RTCIceCandidate(payload.signal));
          } catch (error) {
            console.error("Error adding ICE candidate:", error);
          }
        }
      } else if (!payload.signal) {
        // This is just a user joined notification, not a WebRTC signal
        console.log("New user joined room:", payload.callerID);
      }
    });

    // Handle receiving answer
    socket.on("receiving-answer", (payload) => {
      console.log("Receiving answer:", payload);
      const item = peersRef.current.find((p) => p.peerID === payload.id);
      if (item && payload.signal) {
        try {
          if (payload.signal.type === "answer") {
            item.peer.setRemoteDescription(new RTCSessionDescription(payload.signal));
          } else if (payload.signal.candidate) {
            item.peer.addIceCandidate(new RTCIceCandidate(payload.signal));
          }
        } catch (error) {
          console.error("Error handling answer/candidate:", error);
        }
      }
    });

    // Handle user leaving
    socket.on("user-left", (id) => {
      console.log("User left:", id);
      const peerObj = peersRef.current.find((p) => p.peerID === id);
      if (peerObj) {
        peerObj.peer.close();
      }
      const filteredPeers = peersRef.current.filter((p) => p.peerID !== id);
      peersRef.current = filteredPeers;
      setPeers(filteredPeers);
    });

    // Handle media state changes
    socket.on("user-video-toggle", (data) => {
      console.log("User video toggle:", data);
      const peerObj = peersRef.current.find((p) => p.peerID === data.socketId);
      if (peerObj) {
        peerObj.videoEnabled = data.videoEnabled;
        setPeers([...peersRef.current]);
      }
    });

    socket.on("user-audio-toggle", (data) => {
      console.log("User audio toggle:", data);
      const peerObj = peersRef.current.find((p) => p.peerID === data.socketId);
      if (peerObj) {
        peerObj.audioEnabled = data.audioEnabled;
        setPeers([...peersRef.current]);
      }
    });

    return () => {
      socket.off("existing-users");
      socket.off("user-joined");
      socket.off("receiving-answer");
      socket.off("user-left");
      socket.off("user-video-toggle");
      socket.off("user-audio-toggle");
    };
  }, [socket, localStream, roomId]);

  // Create peer for outgoing call
  const createPeer = (userToSignal, callerID, stream) => {
    console.log("Creating peer for:", userToSignal);
    const peer = new RTCPeerConnection(iceServers);

    // Add connection state logging
    peer.onconnectionstatechange = () => {
      console.log(`Peer connection state (${userToSignal}):`, peer.connectionState);
    };

    // Add local stream tracks
    stream.getTracks().forEach((track) => {
      console.log(`Adding ${track.kind} track to peer ${userToSignal}`);
      peer.addTrack(track, stream);
    });

    // Handle ICE candidates
    peer.onicecandidate = (event) => {
      if (event.candidate) {
        console.log(`Sending ICE candidate to ${userToSignal}`);
        socket.emit("sending-signal", {
          userToSignal,
          callerID,
          signal: event.candidate,
        });
      }
    };

    // Create and send offer
    peer
      .createOffer()
      .then((offer) => {
        console.log(`Created offer for ${userToSignal}`);
        peer.setLocalDescription(offer);
        socket.emit("sending-signal", {
          userToSignal,
          callerID,
          signal: offer,
        });
      })
      .catch((error) => {
        console.error("Error creating offer:", error);
      });

    return peer;
  };

  // Add peer for incoming call
  const addPeer = (incomingSignal, callerID, stream) => {
    console.log("Adding peer for incoming call from:", callerID);
    const peer = new RTCPeerConnection(iceServers);

    // Add connection state logging
    peer.onconnectionstatechange = () => {
      console.log(`Peer connection state (${callerID}):`, peer.connectionState);
    };

    // Add local stream tracks
    stream.getTracks().forEach((track) => {
      console.log(`Adding ${track.kind} track to peer ${callerID}`);
      peer.addTrack(track, stream);
    });

    // Handle ICE candidates
    peer.onicecandidate = (event) => {
      if (event.candidate) {
        console.log(`Sending return ICE candidate to ${callerID}`);
        socket.emit("returning-signal", {
          signal: event.candidate,
          callerID,
        });
      }
    };

    // Validate incoming signal before processing
    if (!incomingSignal || !incomingSignal.type) {
      console.error("Invalid incoming signal:", incomingSignal);
      return peer;
    }

    console.log(`Processing ${incomingSignal.type} from ${callerID}`);

    // Handle incoming offer
    peer
      .setRemoteDescription(new RTCSessionDescription(incomingSignal))
      .then(() => {
        console.log(`Set remote description for ${callerID}, creating answer`);
        return peer.createAnswer();
      })
      .then((answer) => {
        console.log(`Created answer for ${callerID}`);
        peer.setLocalDescription(answer);
        socket.emit("returning-signal", {
          signal: answer,
          callerID,
        });
      })
      .catch((error) => {
        console.error("Error handling offer:", error);
      });

    return peer;
  };

  // Toggle video
  const toggleVideo = () => {
    if (localStream) {
      const videoTrack = localStream.getVideoTracks()[0];
      if (videoTrack) {
        const newState = !videoTrack.enabled;
        videoTrack.enabled = newState;
        setIsVideoEnabled(newState);

        console.log("Video toggled:", newState);

        // Update video element visibility
        if (localVideoRef.current) {
          if (newState) {
            localVideoRef.current.srcObject = localStream;
            localVideoRef.current.play().catch(console.error);
          } else {
            // Keep the stream but hide the video
            localVideoRef.current.srcObject = null;
          }
        }

        // Broadcast state change
        if (socket) {
          socket.emit("toggle-video", {
            roomId,
            videoEnabled: newState,
          });
        }
      }
    }
  };

  // Toggle audio
  const toggleAudio = () => {
    if (localStream) {
      const audioTrack = localStream.getAudioTracks()[0];
      if (audioTrack) {
        const newState = !audioTrack.enabled;
        audioTrack.enabled = newState;
        setIsAudioEnabled(newState);

        console.log("Audio toggled:", newState);

        // Broadcast state change
        if (socket) {
          socket.emit("toggle-audio", {
            roomId,
            audioEnabled: newState,
          });
        }
      }
    }
  };

  // Toggle screen share
  const toggleScreenShare = async () => {
    try {
      if (!isScreenSharing) {
        const screenStream = await navigator.mediaDevices.getDisplayMedia({
          video: true,
          audio: false,
        });

        const videoTrack = screenStream.getVideoTracks()[0];

        // Replace video track in all peer connections
        peersRef.current.forEach((peerObj) => {
          const sender = peerObj.peer
            .getSenders()
            .find((s) => s.track && s.track.kind === "video");
          if (sender) {
            sender.replaceTrack(videoTrack);
          }
        });

        // Replace local video track
        const oldVideoTrack = localStream.getVideoTracks()[0];
        if (oldVideoTrack) {
          localStream.removeTrack(oldVideoTrack);
          oldVideoTrack.stop();
        }
        localStream.addTrack(videoTrack);

        // Update local video element
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = localStream;
        }

        // Handle screen share ending
        videoTrack.onended = async () => {
          setIsScreenSharing(false);
          
          try {
            // Get camera back
            const cameraStream = await navigator.mediaDevices.getUserMedia({
              video: {
                width: { ideal: 1280 },
                height: { ideal: 720 },
              },
              audio: false,
            });

            const newVideoTrack = cameraStream.getVideoTracks()[0];

            // Replace screen share with camera in all peer connections
            peersRef.current.forEach((peerObj) => {
              const sender = peerObj.peer
                .getSenders()
                .find((s) => s.track && s.track.kind === "video");
              if (sender) {
                sender.replaceTrack(newVideoTrack);
              }
            });

            // Update local stream
            localStream.removeTrack(videoTrack);
            localStream.addTrack(newVideoTrack);

            if (localVideoRef.current) {
              localVideoRef.current.srcObject = localStream;
            }
          } catch (error) {
            console.error("Error switching back to camera:", error);
          }
        };

        setIsScreenSharing(true);
        toast.success("Screen sharing started");
      } else {
        // Stop screen sharing manually
        const videoTrack = localStream.getVideoTracks()[0];
        if (videoTrack) {
          videoTrack.stop();
        }
        setIsScreenSharing(false);
      }
    } catch (error) {
      console.error("Error toggling screen share:", error);
      toast.error("Failed to share screen");
    }
  };

  // Leave meeting
  const leaveMeeting = () => {
    // Stop local stream
    if (localStream) {
      localStream.getTracks().forEach((track) => track.stop());
    }

    // Close all peer connections
    peersRef.current.forEach((peerObj) => {
      peerObj.peer.close();
    });

    // Leave room
    if (socket) {
      socket.emit("leave-room", roomId);
      socket.disconnect();
    }

    toast.success("Left meeting");
    navigate("/home/dashboard");
  };

  // Peer video component
  const PeerVideo = ({ peer, userName, userEmail, videoEnabled, audioEnabled }) => {
    const ref = useRef();

    useEffect(() => {
      peer.ontrack = (event) => {
        console.log("Received track from peer:", event.track.kind);
        if (ref.current && event.streams[0]) {
          ref.current.srcObject = event.streams[0];
        }
      };
    }, [peer]);

    return (
      <div className="relative bg-black rounded-2xl overflow-hidden min-h-0">
        {videoEnabled ? (
          <video
            ref={ref}
            autoPlay
            playsInline
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-gray-800 to-gray-900">
            <div className="mb-4">
              <div className="w-24 h-24 rounded-full bg-purple-600 flex items-center justify-center border-4 border-white/20">
                <span className="text-2xl font-bold text-white">
                  {(userName || userEmail || "U").charAt(0).toUpperCase()}
                </span>
              </div>
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">
              {userName || userEmail?.split("@")[0] || "User"}
            </h3>
            <div className="flex items-center gap-2 text-white/60">
              <VideoOff size={20} />
              <span className="text-sm">Camera is off</span>
            </div>
          </div>
        )}

        <div className="absolute bottom-4 left-4 bg-black/50 backdrop-blur-sm px-3 py-1 rounded-lg">
          <span className="text-white text-sm font-medium">
            {userName || userEmail?.split("@")[0] || "User"}
          </span>
        </div>

        <div className="absolute top-4 right-4 flex gap-2">
          {!audioEnabled && (
            <div className="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center">
              <MicOff size={16} className="text-white" />
            </div>
          )}
          <div className="w-3 h-3 bg-green-500 rounded-full"></div>
        </div>
      </div>
    );
  };

  // Loading state
  if (!isConnected) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center text-white">
          <div className="w-8 h-8 border-2 border-white/30 border-t-white rounded-full animate-spin mx-auto mb-4"></div>
          <p>Connecting to meeting server...</p>
        </div>
      </div>
    );
  }

  if (!localStream) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center text-white">
          <div className="w-8 h-8 border-2 border-white/30 border-t-white rounded-full animate-spin mx-auto mb-4"></div>
          <p>Accessing camera and microphone...</p>
          <p className="text-sm text-white/60 mt-2">Please allow camera and microphone access</p>
        </div>
      </div>
    );
  }

  const totalParticipants = peers.length + 1;

  return (
    <div className="min-h-screen bg-gray-900 flex flex-col relative">
      {/* Header */}
      <div className="bg-black/50 backdrop-blur-sm p-4 z-10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-white font-medium">
              Meeting Room: {roomId}
            </span>
            {/* Debug info */}
            <span className="text-xs text-white/50">
              Video: {isVideoEnabled ? 'ON' : 'OFF'} | Audio: {isAudioEnabled ? 'ON' : 'OFF'} | Stream: {localStream ? 'OK' : 'LOADING'} | Playing: {isVideoPlaying ? 'YES' : 'NO'}
            </span>
          </div>
          <div className="flex items-center gap-2 text-white/80">
            <Users size={18} />
            <span>
              {totalParticipants} participant{totalParticipants !== 1 ? "s" : ""}
            </span>
          </div>
        </div>
      </div>

      {/* Video Area */}
      <div className="flex-1 p-4 overflow-hidden">
        <div
          className="w-full grid gap-4 overflow-hidden"
          style={{
            height: "calc(100vh - 200px)",
            gridTemplateColumns:
              peers.length === 0
                ? "1fr"
                : peers.length === 1
                ? "1fr 1fr"
                : peers.length <= 4
                ? "repeat(2, 1fr)"
                : "repeat(3, 1fr)",
            gridTemplateRows:
              peers.length <= 2
                ? "1fr"
                : peers.length <= 4
                ? "repeat(2, 1fr)"
                : "repeat(3, 1fr)",
          }}
        >
          {/* Local Video */}
          <div className="relative bg-black rounded-2xl overflow-hidden min-h-0">
            {isVideoEnabled && localStream ? (
              <video
                ref={localVideoRef}
                autoPlay
                muted
                playsInline
                className="w-full h-full object-cover -scale-x-100"
                onLoadedData={() => console.log("Local video loaded")}
                onError={(e) => console.error("Local video error:", e)}
              />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-gray-800 to-gray-900">
                <div className="mb-4">
                  <div className="w-24 h-24 rounded-full bg-purple-600 flex items-center justify-center border-4 border-white/20">
                    <span className="text-2xl font-bold text-white">
                      {(currentUser?.name || currentUser?.email || "U")
                        .charAt(0)
                        .toUpperCase()}
                    </span>
                  </div>
                </div>
                <h3 className="text-xl font-semibold text-white mb-2">
                  {currentUser?.name ||
                    currentUser?.email?.split("@")[0] ||
                    "You"}
                </h3>
                <div className="flex items-center gap-2 text-white/60">
                  <VideoOff size={20} />
                  <span className="text-sm">
                    {!localStream ? "Loading camera..." : "Camera is off"}
                  </span>
                </div>
              </div>
            )}

            <div className="absolute bottom-4 left-4 bg-black/50 backdrop-blur-sm px-3 py-1 rounded-lg">
              <span className="text-white text-sm font-medium">You</span>
            </div>

            <div className="absolute top-4 right-4 flex gap-2">
              {!isAudioEnabled && (
                <div className="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center">
                  <MicOff size={16} className="text-white" />
                </div>
              )}
              {/* Connection status indicator */}
              <div className={`w-3 h-3 rounded-full ${isVideoPlaying ? 'bg-green-500' : localStream ? 'bg-yellow-500 animate-pulse' : 'bg-red-500'}`}></div>
              
              {/* Debug play button */}
              {localStream && !isVideoPlaying && (
                <button
                  onClick={() => {
                    if (localVideoRef.current) {
                      localVideoRef.current.play().catch(console.error);
                    }
                  }}
                  className="text-xs bg-blue-500 text-white px-2 py-1 rounded"
                >
                  Play
                </button>
              )}
            </div>
          </div>

          {/* Remote Videos */}
          {peers.map((peerObj, index) => (
            <PeerVideo
              key={`${peerObj.peerID}-${index}`}
              peer={peerObj.peer}
              userName={peerObj.userName}
              userEmail={peerObj.userEmail}
              videoEnabled={peerObj.videoEnabled}
              audioEnabled={peerObj.audioEnabled}
            />
          ))}
        </div>
      </div>

      {/* Controls */}
      <div className="bg-black/50 backdrop-blur-sm p-6 z-10">
        <div className="flex items-center justify-center gap-4">
          <button
            onClick={toggleAudio}
            className={`p-4 rounded-full transition-all duration-200 ${
              isAudioEnabled
                ? "bg-white/20 hover:bg-white/30 text-white"
                : "bg-red-600 hover:bg-red-700 text-white"
            }`}
            title={isAudioEnabled ? "Mute microphone" : "Unmute microphone"}
          >
            {isAudioEnabled ? <Mic size={24} /> : <MicOff size={24} />}
          </button>

          <button
            onClick={toggleVideo}
            className={`p-4 rounded-full transition-all duration-200 ${
              isVideoEnabled
                ? "bg-white/20 hover:bg-white/30 text-white"
                : "bg-red-600 hover:bg-red-700 text-white"
            }`}
            title={isVideoEnabled ? "Turn off camera" : "Turn on camera"}
          >
            {isVideoEnabled ? <VideoIcon size={24} /> : <VideoOff size={24} />}
          </button>

          <button
            onClick={toggleScreenShare}
            className={`p-4 rounded-full transition-all duration-200 ${
              isScreenSharing
                ? "bg-blue-600 hover:bg-blue-700 text-white"
                : "bg-white/20 hover:bg-white/30 text-white"
            }`}
            title={isScreenSharing ? "Stop sharing screen" : "Share screen"}
          >
            {isScreenSharing ? <MonitorOff size={24} /> : <Monitor size={24} />}
          </button>

          <button
            onClick={() => setShowSettings(!showSettings)}
            className={`p-4 rounded-full transition-all duration-200 ${
              showSettings
                ? "bg-blue-600 hover:bg-blue-700 text-white"
                : "bg-white/20 hover:bg-white/30 text-white"
            }`}
            title="Settings"
          >
            <Settings size={24} />
          </button>

          <button
            onClick={leaveMeeting}
            className="p-4 rounded-full bg-red-600 hover:bg-red-700 text-white transition-all"
            title="Leave meeting"
          >
            <PhoneOff size={24} />
          </button>
        </div>
      </div>

      {/* Meeting Settings Modal */}
      <MeetingSettings
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
        localStream={localStream}
      />
    </div>
  );
};

export default MeetingRoom;