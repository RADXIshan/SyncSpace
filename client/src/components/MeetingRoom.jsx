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
  const [screenSharingUser, setScreenSharingUser] = useState(null);
  const [savedSettings, setSavedSettings] = useState({ videoEnabled: true, audioEnabled: true });
  const [cameraStream, setCameraStream] = useState(null);

  // Load settings from URL params on component mount
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const videoParam = urlParams.get('video');
    const audioParam = urlParams.get('audio');
    
    // URL params take precedence, default to true if not provided
    const initialVideoEnabled = videoParam !== null ? videoParam === 'true' : savedSettings.videoEnabled;
    const initialAudioEnabled = audioParam !== null ? audioParam === 'true' : savedSettings.audioEnabled;
    
    setIsVideoEnabled(initialVideoEnabled);
    setIsAudioEnabled(initialAudioEnabled);
    
    console.log('Initial settings loaded:', { video: initialVideoEnabled, audio: initialAudioEnabled });
    
    // Clean up URL params
    const newUrl = window.location.pathname;
    window.history.replaceState({}, document.title, newUrl);
  }, []);

  // Refs
  const localVideoRef = useRef();
  const cameraVideoRef = useRef();
  const peersRef = useRef([]);
  const socketRef = useRef();

  const iceServers = {
    iceServers: [
      { urls: "stun:stun.l.google.com:19302" },
      { urls: "stun:stun1.l.google.com:19302" },
      { urls: "stun:stun2.l.google.com:19302" },
      { urls: "stun:stun3.l.google.com:19302" },
      { urls: "stun:stun4.l.google.com:19302" },
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
        if (localStream) {
          localStream.getTracks().forEach((track) => track.stop());
        }

        if (cameraStream) {
          cameraStream.getTracks().forEach((track) => track.stop());
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
        console.log("Requesting user media with settings:", { video: isVideoEnabled, audio: isAudioEnabled });
        
        const constraints = {
          video: savedSettings.videoDevice ? 
            { deviceId: savedSettings.videoDevice } : 
            {
              width: { ideal: 1280 },
              height: { ideal: 720 },
              facingMode: "user",
            },
          audio: savedSettings.audioInput ? 
            { deviceId: savedSettings.audioInput } : 
            {
              echoCancellation: true,
              noiseSuppression: true,
              autoGainControl: true,
            }
        };

        const stream = await navigator.mediaDevices.getUserMedia(constraints);

        console.log(
          "Got media stream:",
          stream
            .getTracks()
            .map((t) => `${t.kind}: ${t.enabled}, readyState: ${t.readyState}`)
        );

        const videoTrack = stream.getVideoTracks()[0];
        const audioTrack = stream.getAudioTracks()[0];

        if (videoTrack) {
          videoTrack.enabled = isVideoEnabled;
          console.log("Video track enabled:", videoTrack.enabled, "readyState:", videoTrack.readyState);
        }

        if (audioTrack) {
          audioTrack.enabled = isAudioEnabled;
          console.log("Audio track enabled:", audioTrack.enabled, "readyState:", audioTrack.readyState);
        }

        setLocalStream(stream);
        console.log("Local media initialized successfully");
      } catch (error) {
        console.error("Error accessing media devices:", error);

        if (error.name === "NotAllowedError") {
          toast.error("Camera/microphone access denied. Please allow access and refresh.");
        } else if (error.name === "NotFoundError") {
          toast.error("No camera/microphone found. Please check your devices.");
        } else if (error.name === "NotReadableError") {
          toast.error("Camera/microphone is being used by another application.");
        } else {
          toast.error("Failed to access camera/microphone: " + error.message);
        }
      }
    };

    if (isConnected && !localStream) {
      initializeMedia();
    }
  }, [isConnected, isVideoEnabled, isAudioEnabled]);

  // Handle local video element setup
  useEffect(() => {
    if (localStream && localVideoRef.current) {
      console.log("Setting up local video element, video enabled:", isVideoEnabled);
      
      localVideoRef.current.srcObject = localStream;

      const videoElement = localVideoRef.current;
      
      const handleLoadedMetadata = () => {
        console.log("Local video metadata loaded");
        const videoTrack = localStream.getVideoTracks()[0];
        if (videoTrack && videoTrack.enabled && isVideoEnabled) {
          videoElement.play()
            .then(() => {
              console.log("Local video playing");
            })
            .catch((error) => {
              console.error("Local video play error:", error);
            });
        }
      };

      const handleCanPlay = () => {
        console.log("Local video can play");
      };

      const handlePlaying = () => {
        console.log("Local video is playing");
      };

      const handlePause = () => {
        console.log("Local video paused");
      };

      const handleError = (e) => {
        console.error("Local video error:", e);
      };

      videoElement.onloadedmetadata = handleLoadedMetadata;
      videoElement.oncanplay = handleCanPlay;
      videoElement.onplaying = handlePlaying;
      videoElement.onpause = handlePause;
      videoElement.onerror = handleError;

      const videoTrack = localStream.getVideoTracks()[0];
      if (videoTrack && videoTrack.enabled && isVideoEnabled && videoElement.readyState >= 2) {
        videoElement.play().catch(console.error);
      }

      return () => {
        if (videoElement) {
          videoElement.onloadedmetadata = null;
          videoElement.oncanplay = null;
          videoElement.onplaying = null;
          videoElement.onpause = null;
          videoElement.onerror = null;
        }
      };
    }
  }, [localStream, isVideoEnabled]);

  // Handle camera video element setup for screen sharing
  useEffect(() => {
    if (cameraStream && cameraVideoRef.current) {
      console.log("Setting up camera video element for screen sharing");
      
      cameraVideoRef.current.srcObject = cameraStream;
      
      const videoElement = cameraVideoRef.current;
      
      const handleLoadedMetadata = () => {
        console.log("Camera video metadata loaded");
        videoElement.play().catch((error) => {
          console.error("Camera video play error:", error);
        });
      };

      const handleCanPlay = () => {
        console.log("Camera video can play");
      };

      const handlePlaying = () => {
        console.log("Camera video is playing");
      };

      const handleError = (e) => {
        console.error("Camera video error:", e);
      };

      videoElement.onloadedmetadata = handleLoadedMetadata;
      videoElement.oncanplay = handleCanPlay;
      videoElement.onplaying = handlePlaying;
      videoElement.onerror = handleError;

      if (videoElement.readyState >= 2) {
        videoElement.play().catch(console.error);
      }

      return () => {
        if (videoElement) {
          videoElement.onloadedmetadata = null;
          videoElement.oncanplay = null;
          videoElement.onplaying = null;
          videoElement.onerror = null;
        }
      };
    }
  }, [cameraStream]);

  // Setup WebRTC signaling
  useEffect(() => {
    if (!socket || !localStream) return;

    console.log("Setting up WebRTC signaling");

    socket.emit("join-room", roomId);

    socket.on("existing-users", (users) => {
      console.log("Existing users:", users);

      peersRef.current.forEach((peerObj) => {
        if (peerObj.peer) {
          peerObj.peer.close();
        }
      });
      peersRef.current = [];

      users.forEach((user) => {
        console.log(`Creating peer for existing user: ${user.userName} (${user.socketId})`);
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

      console.log(`Added ${peersRef.current.length} peers for existing users`);
      setPeers([...peersRef.current]);
    });

    socket.on("user-joined", (payload) => {
      console.log("User joined:", payload);

      if (payload.signal && payload.signal.type === "offer") {
        const existingPeer = peersRef.current.find((p) => p.peerID === payload.callerID);
        if (!existingPeer) {
          console.log(`Adding peer for incoming offer from: ${payload.userName} (${payload.callerID})`);
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
          console.log(`Now have ${peersRef.current.length} total peers`);
          setPeers([...peersRef.current]);
        } else {
          console.log(`Peer already exists for ${payload.callerID}, skipping`);
        }
      } else if (!payload.signal) {
        // New user joined notification
        toast(`${payload.userName || "User"} joined the meeting`, {
          icon: "👋",
          duration: 3000,
        });
      } else if (payload.signal && payload.signal.candidate) {
        const existingPeer = peersRef.current.find((p) => p.peerID === payload.callerID);
        if (existingPeer) {
          console.log(`Adding ICE candidate from ${payload.callerID}`);
          try {
            existingPeer.peer
              .addIceCandidate(new RTCIceCandidate(payload.signal))
              .then(() => console.log(`Successfully added ICE candidate from ${payload.callerID}`))
              .catch((error) => console.error(`Error adding ICE candidate from ${payload.callerID}:`, error));
          } catch (error) {
            console.error("Error adding ICE candidate:", error);
          }
        } else {
          console.warn(`No peer found for ICE candidate from ${payload.callerID}`);
        }
      }
    });

    socket.on("receiving-answer", (payload) => {
      console.log("Receiving answer:", payload);
      const item = peersRef.current.find((p) => p.peerID === payload.id);
      if (item && payload.signal) {
        try {
          if (payload.signal.type === "answer") {
            console.log(`Setting remote description (answer) for ${payload.id}`);
            item.peer
              .setRemoteDescription(new RTCSessionDescription(payload.signal))
              .then(() => console.log(`Successfully set remote description for ${payload.id}`))
              .catch((error) => console.error(`Error setting remote description for ${payload.id}:`, error));
          } else if (payload.signal.candidate) {
            console.log(`Adding ICE candidate for ${payload.id}`);
            item.peer
              .addIceCandidate(new RTCIceCandidate(payload.signal))
              .then(() => console.log(`Successfully added ICE candidate for ${payload.id}`))
              .catch((error) => console.error(`Error adding ICE candidate for ${payload.id}:`, error));
          }
        } catch (error) {
          console.error("Error handling answer/candidate:", error);
        }
      } else {
        console.warn(`No peer found for ${payload.id} or missing signal`);
      }
    });

    socket.on("user-left", (id) => {
      console.log("User left:", id);
      const peerObj = peersRef.current.find((p) => p.peerID === id);
      if (peerObj) {
        peerObj.peer.close();
        toast(`${peerObj.userName || "User"} left the meeting`, {
          icon: "👋",
          duration: 3000,
        });
      }
      const filteredPeers = peersRef.current.filter((p) => p.peerID !== id);
      peersRef.current = filteredPeers;
      setPeers(filteredPeers);
    });

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

    socket.on("user-started-screen-share", (data) => {
      console.log("User started screen sharing:", data);
      setScreenSharingUser(data.socketId);
      const peerObj = peersRef.current.find((p) => p.peerID === data.socketId);
      if (peerObj) {
        peerObj.isScreenSharing = true;
        setPeers([...peersRef.current]);
      }
    });

    socket.on("user-stopped-screen-share", (data) => {
      console.log("User stopped screen sharing:", data);
      setScreenSharingUser(null);
      const peerObj = peersRef.current.find((p) => p.peerID === data.socketId);
      if (peerObj) {
        peerObj.isScreenSharing = false;
        setPeers([...peersRef.current]);
      }
    });

    socket.on("meeting_started_notification", (data) => {
      console.log("Meeting started notification:", data);
      toast.success(data.message, {
        duration: 5000,
        icon: "📹",
      });
    });

    return () => {
      socket.off("existing-users");
      socket.off("user-joined");
      socket.off("receiving-answer");
      socket.off("user-left");
      socket.off("user-video-toggle");
      socket.off("user-audio-toggle");
      socket.off("user-started-screen-share");
      socket.off("user-stopped-screen-share");
      socket.off("meeting_started_notification");
    };
  }, [socket, localStream, roomId]);

  // Create peer for outgoing call
  const createPeer = (userToSignal, callerID, stream) => {
    console.log("Creating peer for:", userToSignal);
    const peer = new RTCPeerConnection(iceServers);

    peer.onconnectionstatechange = () => {
      console.log(`Peer connection state (${userToSignal}):`, peer.connectionState);
      if (peer.connectionState === "failed") {
        console.error(`Peer connection failed for ${userToSignal}`);
        peer.restartIce();
      }
    };

    peer.oniceconnectionstatechange = () => {
      console.log(`ICE connection state (${userToSignal}):`, peer.iceConnectionState);
      if (peer.iceConnectionState === "failed") {
        console.error(`ICE connection failed for ${userToSignal}, restarting...`);
        peer.restartIce();
      }
    };

    peer.ontrack = (event) => {
      console.log(`createPeer: Received ${event.track.kind} track from ${userToSignal}`, event);
      console.log(`createPeer: Track enabled: ${event.track.enabled}, readyState: ${event.track.readyState}`);

      if (event.streams && event.streams[0]) {
        console.log(`createPeer: Stream has ${event.streams[0].getTracks().length} tracks`);
        event.streams[0].getTracks().forEach((track) => {
          console.log(`createPeer: Stream track - ${track.kind}: enabled=${track.enabled}, readyState=${track.readyState}`);
        });
      }
    };

    stream.getTracks().forEach((track) => {
      console.log(`Adding ${track.kind} track to peer ${userToSignal} - enabled: ${track.enabled}`);
      peer.addTrack(track, stream);
    });

    peer.onicecandidate = (event) => {
      if (event.candidate) {
        console.log(`Sending ICE candidate to ${userToSignal}:`, event.candidate.type);
        socket.emit("sending-signal", {
          userToSignal,
          callerID,
          signal: event.candidate,
        });
      } else {
        console.log(`ICE gathering complete for ${userToSignal}`);
      }
    };

    peer
      .createOffer({
        offerToReceiveAudio: true,
        offerToReceiveVideo: true,
      })
      .then((offer) => {
        console.log(`Created offer for ${userToSignal}:`, offer.type);
        return peer.setLocalDescription(offer);
      })
      .then(() => {
        console.log(`Set local description for ${userToSignal}, sending offer`);
        socket.emit("sending-signal", {
          userToSignal,
          callerID,
          signal: peer.localDescription,
        });
      })
      .catch((error) => {
        console.error(`Error creating/sending offer to ${userToSignal}:`, error);
      });

    return peer;
  };

  // Add peer for incoming call
  const addPeer = (incomingSignal, callerID, stream) => {
    console.log("Adding peer for incoming call from:", callerID);
    const peer = new RTCPeerConnection(iceServers);

    peer.onconnectionstatechange = () => {
      console.log(`Peer connection state (${callerID}):`, peer.connectionState);
      if (peer.connectionState === "failed") {
        console.error(`Peer connection failed for ${callerID}`);
        peer.restartIce();
      }
    };

    peer.oniceconnectionstatechange = () => {
      console.log(`ICE connection state (${callerID}):`, peer.iceConnectionState);
      if (peer.iceConnectionState === "failed") {
        console.error(`ICE connection failed for ${callerID}, restarting...`);
        peer.restartIce();
      }
    };

    peer.ontrack = (event) => {
      console.log(`addPeer: Received ${event.track.kind} track from ${callerID}`, event);
      console.log(`addPeer: Track enabled: ${event.track.enabled}, readyState: ${event.track.readyState}`);

      if (event.streams && event.streams[0]) {
        console.log(`addPeer: Stream has ${event.streams[0].getTracks().length} tracks`);
        event.streams[0].getTracks().forEach((track) => {
          console.log(`addPeer: Stream track - ${track.kind}: enabled=${track.enabled}, readyState=${track.readyState}`);
        });
      }
    };

    stream.getTracks().forEach((track) => {
      console.log(`Adding ${track.kind} track to peer ${callerID} - enabled: ${track.enabled}`);
      peer.addTrack(track, stream);
    });

    peer.onicecandidate = (event) => {
      if (event.candidate) {
        console.log(`Sending return ICE candidate to ${callerID}:`, event.candidate.type);
        socket.emit("returning-signal", {
          signal: event.candidate,
          callerID,
        });
      } else {
        console.log(`ICE gathering complete for ${callerID}`);
      }
    };

    if (!incomingSignal || !incomingSignal.type) {
      console.error("Invalid incoming signal:", incomingSignal);
      return peer;
    }

    console.log(`Processing ${incomingSignal.type} from ${callerID}`);

    peer
      .setRemoteDescription(new RTCSessionDescription(incomingSignal))
      .then(() => {
        console.log(`Set remote description for ${callerID}, creating answer`);
        return peer.createAnswer({
          offerToReceiveAudio: true,
          offerToReceiveVideo: true,
        });
      })
      .then((answer) => {
        console.log(`Created answer for ${callerID}:`, answer.type);
        return peer.setLocalDescription(answer);
      })
      .then(() => {
        console.log(`Set local description for ${callerID}, sending answer`);
        socket.emit("returning-signal", {
          signal: peer.localDescription,
          callerID,
        });
      })
      .catch((error) => {
        console.error(`Error handling offer from ${callerID}:`, error);
      });

    return peer;
  };

  // Toggle video
  const toggleVideo = async () => {
    if (isScreenSharing) {
      toast.error("Cannot toggle camera while screen sharing");
      return;
    }

    const newState = !isVideoEnabled;
    console.log("Toggling video from", isVideoEnabled, "to", newState);

    try {
      if (localStream) {
        const videoTrack = localStream.getVideoTracks()[0];
        if (videoTrack) {
          videoTrack.enabled = newState;
          setIsVideoEnabled(newState);
          console.log("Video track", newState ? "enabled" : "disabled");
          
          // Force video element refresh when enabling video
          if (newState && localVideoRef.current) {
            localVideoRef.current.play().catch(console.error);
          }
        } else if (newState) {
          const videoConstraints = {
            width: { ideal: 1280 },
            height: { ideal: 720 },
            facingMode: "user",
          };
          
          const videoStream = await navigator.mediaDevices.getUserMedia({
            video: videoConstraints
          });
          
          const newVideoTrack = videoStream.getVideoTracks()[0];
          newVideoTrack.enabled = true;
          
          localStream.addTrack(newVideoTrack);
          
          // Force video element refresh
          if (localVideoRef.current) {
            localVideoRef.current.srcObject = null;
            setTimeout(() => {
              if (localVideoRef.current && localStream) {
                localVideoRef.current.srcObject = localStream;
                localVideoRef.current.play().catch(console.error);
              }
            }, 100);
          }
          
          peersRef.current.forEach((peerObj) => {
            peerObj.peer.addTrack(newVideoTrack, localStream);
          });
          
          setIsVideoEnabled(true);
          console.log("New video track added");
        }
      }

      if (socket) {
        socket.emit("toggle-video", {
          roomId,
          videoEnabled: newState,
        });
      }

    } catch (error) {
      console.error("Error toggling video:", error);
      toast.error("Failed to toggle camera");
    }
  };

  // Toggle audio
  const toggleAudio = async () => {
    const newState = !isAudioEnabled;
    console.log("Toggling audio from", isAudioEnabled, "to", newState);

    try {
      if (localStream) {
        const audioTrack = localStream.getAudioTracks()[0];
        if (audioTrack) {
          audioTrack.enabled = newState;
          setIsAudioEnabled(newState);
          console.log("Audio track", newState ? "enabled" : "disabled");
        } else if (newState) {
          const audioConstraints = {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
          };
          
          const audioStream = await navigator.mediaDevices.getUserMedia({
            audio: audioConstraints
          });
          
          const newAudioTrack = audioStream.getAudioTracks()[0];
          newAudioTrack.enabled = true;
          
          localStream.addTrack(newAudioTrack);
          
          peersRef.current.forEach((peerObj) => {
            peerObj.peer.addTrack(newAudioTrack, localStream);
          });
          
          setIsAudioEnabled(true);
          console.log("New audio track added");
        }
      }

      if (socket) {
        socket.emit("toggle-audio", {
          roomId,
          audioEnabled: newState,
        });
      }

    } catch (error) {
      console.error("Error toggling audio:", error);
      toast.error("Failed to toggle microphone");
    }
  };

  // Toggle screen share
  const toggleScreenShare = async () => {
    try {
      if (!isScreenSharing) {
        if (screenSharingUser && screenSharingUser !== socket.id) {
          toast.error("Someone else is already sharing their screen");
          return;
        }

        const screenStream = await navigator.mediaDevices.getDisplayMedia({
          video: true,
          audio: false,
        });

        const videoTrack = screenStream.getVideoTracks()[0];

        // Keep camera stream separate for user's video
        if (isVideoEnabled) {
          try {
            const newCameraStream = await navigator.mediaDevices.getUserMedia({
              video: {
                width: { ideal: 1280 },
                height: { ideal: 720 },
                facingMode: "user",
              },
              audio: false,
            });
            
            console.log("Created camera stream for screen sharing:", newCameraStream.getVideoTracks().length, "video tracks");
            setCameraStream(newCameraStream);
            
            // Ensure video track is enabled
            const videoTrack = newCameraStream.getVideoTracks()[0];
            if (videoTrack) {
              videoTrack.enabled = true;
              console.log("Camera track enabled for screen sharing");
            }
            
            if (cameraVideoRef.current) {
              cameraVideoRef.current.srcObject = newCameraStream;
              setTimeout(() => {
                if (cameraVideoRef.current) {
                  cameraVideoRef.current.play().catch(console.error);
                }
              }, 100);
            }
          } catch (error) {
            console.error("Error getting camera stream for screen share:", error);
          }
        } else {
          console.log("Video is disabled, not creating camera stream for screen sharing");
        }

        peersRef.current.forEach((peerObj) => {
          const sender = peerObj.peer
            .getSenders()
            .find((s) => s.track && s.track.kind === "video");
          if (sender) {
            sender.replaceTrack(videoTrack);
          }
        });

        const oldVideoTrack = localStream.getVideoTracks()[0];
        if (oldVideoTrack) {
          localStream.removeTrack(oldVideoTrack);
          oldVideoTrack.stop();
        }
        localStream.addTrack(videoTrack);

        if (localVideoRef.current) {
          localVideoRef.current.srcObject = localStream;
        }

        if (socket) {
          socket.emit("start-screen-share", { roomId });
        }

        videoTrack.onended = async () => {
          await stopScreenShare();
        };

        setIsScreenSharing(true);
        setScreenSharingUser(socket.id);
        toast.success("Screen sharing started");
      } else {
        await stopScreenShare();
      }
    } catch (error) {
      console.error("Error toggling screen share:", error);
      if (error.name === "NotAllowedError") {
        toast.error("Screen sharing permission denied");
      } else {
        toast.error("Failed to share screen");
      }
    }
  };

  // Stop screen sharing helper
  const stopScreenShare = async () => {
    try {
      // Clean up camera stream
      if (cameraStream) {
        cameraStream.getTracks().forEach(track => track.stop());
        setCameraStream(null);
      }

      const newCameraStream = await navigator.mediaDevices.getUserMedia({
        video: isVideoEnabled ? {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: "user",
        } : false,
        audio: false,
      });

      const newVideoTrack = newCameraStream.getVideoTracks()[0];

      // Replace track in peer connections
      peersRef.current.forEach((peerObj) => {
        const sender = peerObj.peer
          .getSenders()
          .find((s) => s.track && s.track.kind === "video");
        if (sender && newVideoTrack) {
          sender.replaceTrack(newVideoTrack);
        }
      });

      // Stop and remove old video track
      const oldVideoTrack = localStream.getVideoTracks()[0];
      if (oldVideoTrack) {
        localStream.removeTrack(oldVideoTrack);
        oldVideoTrack.stop();
      }
      
      // Add new video track if camera should be enabled
      if (newVideoTrack) {
        newVideoTrack.enabled = isVideoEnabled;
        localStream.addTrack(newVideoTrack);
      }

      // Force video element refresh by clearing and reassigning srcObject
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = null;
        // Small delay to ensure the video element resets
        setTimeout(() => {
          if (localVideoRef.current && localStream) {
            localVideoRef.current.srcObject = localStream;
            // Force play if video is enabled
            if (isVideoEnabled && newVideoTrack) {
              localVideoRef.current.play().catch(console.error);
            }
          }
        }, 100);
      }

      if (socket) {
        socket.emit("stop-screen-share", { roomId });
      }

      setIsScreenSharing(false);
      setScreenSharingUser(null);
      toast.success("Screen sharing stopped");
    } catch (error) {
      console.error("Error stopping screen share:", error);
      setIsScreenSharing(false);
      setScreenSharingUser(null);
    }
  };

  // Leave meeting
  const leaveMeeting = () => {
    if (localStream) {
      localStream.getTracks().forEach((track) => track.stop());
    }

    peersRef.current.forEach((peerObj) => {
      peerObj.peer.close();
    });

    if (socket) {
      socket.emit("leave-room", roomId);
      socket.disconnect();
    }

    toast.success("Left meeting");
    navigate("/home/dashboard");
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

  if (!localStream && (isVideoEnabled || isAudioEnabled)) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center text-white">
          <div className="w-8 h-8 border-2 border-white/30 border-t-white rounded-full animate-spin mx-auto mb-4"></div>
          <p>Accessing camera and microphone...</p>
          <p className="text-sm text-white/60 mt-2">
            Please allow camera and microphone access
          </p>
        </div>
      </div>
    );
  }

  // Peer video component
  const PeerVideo = ({
    peer,
    userName,
    userEmail,
    videoEnabled,
    audioEnabled,
    isScreenShare = false,
    isThumbnail = false,
  }) => {
    const ref = useRef();
    const [remoteStream, setRemoteStream] = useState(null);
    const [isStreamReady, setIsStreamReady] = useState(false);

    useEffect(() => {
      if (!peer) return;

      let stream = null;

      const handleTrack = (event) => {
        console.log(`PeerVideo: Received ${event.track.kind} track from ${userName}`, event);

        if (event.streams && event.streams[0]) {
          stream = event.streams[0];
          console.log(`PeerVideo: Setting remote stream for ${userName}`, stream.getTracks().map((t) => `${t.kind}: ${t.enabled}`));
          setRemoteStream(stream);
          setIsStreamReady(true);

          if (ref.current) {
            ref.current.srcObject = stream;

            ref.current.onloadedmetadata = () => {
              console.log(`Remote video metadata loaded for ${userName}`);
              ref.current
                .play()
                .catch((e) => console.error(`Play error for ${userName}:`, e));
            };

            ref.current.oncanplay = () => {
              console.log(`Remote video can play for ${userName}`);
            };

            ref.current.onplaying = () => {
              console.log(`Remote video is playing for ${userName}`);
            };
          }

          stream.getTracks().forEach(track => {
            track.onmute = () => {
              console.log(`${track.kind} track muted for ${userName}`);
            };
            
            track.onunmute = () => {
              console.log(`${track.kind} track unmuted for ${userName}`);
            };
            
            track.onended = () => {
              console.log(`${track.kind} track ended for ${userName}`);
            };
          });
        }
      };

      peer.ontrack = handleTrack;

      const checkExistingStreams = () => {
        const receivers = peer.getReceivers();
        const tracks = receivers
          .map((receiver) => receiver.track)
          .filter((track) => track);

        if (tracks.length > 0) {
          console.log(`PeerVideo: Found ${tracks.length} existing tracks for ${userName}`);
          const existingStream = new MediaStream(tracks);
          setRemoteStream(existingStream);
          setIsStreamReady(true);

          if (ref.current) {
            ref.current.srcObject = existingStream;
            ref.current.play().catch(console.error);
          }

          tracks.forEach(track => {
            track.onmute = () => {
              console.log(`${track.kind} track muted for ${userName}`);
            };
            
            track.onunmute = () => {
              console.log(`${track.kind} track unmuted for ${userName}`);
            };
            
            track.onended = () => {
              console.log(`${track.kind} track ended for ${userName}`);
            };
          });
        }
      };

      checkExistingStreams();
      const timeoutId = setTimeout(checkExistingStreams, 1000);

      return () => {
        clearTimeout(timeoutId);
        if (peer) {
          peer.ontrack = null;
        }
        if (stream) {
          stream.getTracks().forEach((track) => {
            console.log(`Cleaning up ${track.kind} track for ${userName}`);
            track.onmute = null;
            track.onunmute = null;
            track.onended = null;
          });
        }
      };
    }, [peer, userName]);

    return (
      <div className={`relative bg-black overflow-hidden min-h-0 ${
        isThumbnail ? 'rounded-lg' : 'rounded-2xl'
      }`}>
        {videoEnabled && remoteStream && isStreamReady && 
         remoteStream.getVideoTracks().length > 0 ? (
          <video
            ref={ref}
            autoPlay
            playsInline
            muted={false}
            className={`w-full h-full ${
              isScreenShare ? 'object-contain' : 'object-cover'
            }`}
            onLoadedData={() =>
              console.log(`Remote video loaded for ${userName}`)
            }
            onError={(e) =>
              console.error(`Remote video error for ${userName}:`, e)
            }
            onPlay={() =>
              console.log(`Remote video started playing for ${userName}`)
            }
            onPause={() => console.log(`Remote video paused for ${userName}`)}
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-gray-800 to-gray-900">
            <div className={isThumbnail ? "mb-1" : "mb-4"}>
              <div className={`rounded-full bg-purple-600 flex items-center justify-center border-4 border-white/20 ${
                isThumbnail ? "w-8 h-8" : "w-24 h-24"
              }`}>
                <span className={`font-bold text-white ${
                  isThumbnail ? "text-xs" : "text-2xl"
                }`}>
                  {(userName || userEmail || "U").charAt(0).toUpperCase()}
                </span>
              </div>
            </div>
            {!isThumbnail && (
              <>
                <h3 className="text-xl font-semibold text-white mb-2">
                  {userName || userEmail?.split("@")[0] || "User"}
                </h3>
                <div className="flex items-center gap-2 text-white/60">
                  <VideoOff size={20} />
                  <span className="text-sm">
                    {!remoteStream ? "Connecting..." : "Camera is off"}
                  </span>
                </div>
              </>
            )}
          </div>
        )}

        {!isThumbnail && (
          <div className="absolute bottom-4 left-4 bg-black/50 backdrop-blur-sm px-3 py-1 rounded-lg">
            <span className="text-white text-sm font-medium">
              {userName || userEmail?.split("@")[0] || "User"}
            </span>
          </div>
        )}

        {isThumbnail && (
          <div className="absolute bottom-1 left-1 bg-black/50 backdrop-blur-sm px-2 py-1 rounded text-xs text-white">
            {userName || userEmail?.split("@")[0] || "User"}
          </div>
        )}

        <div className={`absolute flex gap-2 ${
          isThumbnail ? "top-1 right-1" : "top-4 right-4"
        }`}>
          {!audioEnabled && (
            <div className={`bg-red-500 rounded-full flex items-center justify-center ${
              isThumbnail ? "w-4 h-4" : "w-8 h-8"
            }`}>
              <MicOff size={isThumbnail ? 8 : 16} className="text-white" />
            </div>
          )}
          <div
            className={`rounded-full ${
              isThumbnail ? "w-2 h-2" : "w-3 h-3"
            } ${
              remoteStream && isStreamReady
                ? "bg-green-500"
                : remoteStream
                ? "bg-yellow-500 animate-pulse"
                : "bg-red-500"
            }`}
          ></div>
        </div>
      </div>
    );
  };

  const totalParticipants = peers.length + 1;

  return (
    <div className="min-h-screen bg-gray-900 flex flex-col relative">
      <div className="bg-black/50 backdrop-blur-sm p-4 z-10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-white font-medium">
              Meeting Room: {roomId}
            </span>
          </div>
          <div className="flex items-center gap-2 text-white/80">
            <Users size={18} />
            <span>
              {totalParticipants} participant
              {totalParticipants !== 1 ? "s" : ""}
            </span>
          </div>
        </div>
      </div>

      <div className="flex-1 p-4 overflow-hidden">
        {screenSharingUser ? (
          <div className="w-full h-full flex gap-4" style={{ height: "calc(100vh - 200px)" }}>
            <div className="flex-1 flex items-center justify-center">
              {screenSharingUser === socket.id ? (
                <div className="relative bg-black rounded-2xl overflow-hidden w-full h-full max-w-6xl">
                  <video
                    ref={localVideoRef}
                    autoPlay
                    muted
                    playsInline
                    className="w-full h-full object-contain"
                  />
                  <div className="absolute bottom-4 left-4 bg-black/50 backdrop-blur-sm px-3 py-1 rounded-lg">
                    <span className="text-white text-sm font-medium">You (Screen Sharing)</span>
                  </div>
                </div>
              ) : (
                peers
                  .filter(peer => peer.peerID === screenSharingUser)
                  .map((peerObj, index) => (
                    <div key={`screen-${peerObj.peerID}-${index}`} className="relative bg-black rounded-2xl overflow-hidden w-full h-full max-w-6xl">
                      <PeerVideo
                        peer={peerObj.peer}
                        userName={peerObj.userName}
                        userEmail={peerObj.userEmail}
                        videoEnabled={true}
                        audioEnabled={peerObj.audioEnabled}
                        isScreenShare={true}
                      />
                      <div className="absolute bottom-4 left-4 bg-black/50 backdrop-blur-sm px-3 py-1 rounded-lg">
                        <span className="text-white text-sm font-medium">{peerObj.userName || peerObj.userEmail?.split("@")[0] || "User"} (Screen Sharing)</span>
                      </div>
                    </div>
                  ))
              )}
            </div>
            
            <div className="w-64 flex flex-col gap-2 overflow-y-auto">
              {/* Always show user's camera video when screen sharing */}
              <div className="relative bg-black rounded-lg overflow-hidden aspect-video">
                {screenSharingUser === socket.id ? (
                  // Show camera stream when user is screen sharing
                  isVideoEnabled && cameraStream ? (
                    <video
                      ref={cameraVideoRef}
                      autoPlay
                      muted
                      playsInline
                      className="w-full h-full object-cover -scale-x-100"
                      onLoadedData={() => console.log("Camera video loaded for screen sharing")}
                      onError={(e) => console.error("Camera video error for screen sharing:", e)}
                      onPlay={() => console.log("Camera video started playing for screen sharing")}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-800 to-gray-900">
                      <div className="w-12 h-12 rounded-full bg-purple-600 flex items-center justify-center">
                        <span className="text-sm font-bold text-white">
                          {(currentUser?.name || currentUser?.email || "U").charAt(0).toUpperCase()}
                        </span>
                      </div>
                    </div>
                  )
                ) : (
                  // Show local video when someone else is screen sharing
                  isVideoEnabled && localStream && localStream.getVideoTracks().length > 0 ? (
                    <video
                      ref={localVideoRef}
                      autoPlay
                      muted
                      playsInline
                      className="w-full h-full object-cover -scale-x-100"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-800 to-gray-900">
                      <div className="w-12 h-12 rounded-full bg-purple-600 flex items-center justify-center">
                        <span className="text-sm font-bold text-white">
                          {(currentUser?.name || currentUser?.email || "U").charAt(0).toUpperCase()}
                        </span>
                      </div>
                    </div>
                  )
                )}
                <div className="absolute bottom-1 left-1 bg-black/50 backdrop-blur-sm px-2 py-1 rounded text-xs text-white">
                  You {screenSharingUser === socket.id ? "(Camera)" : ""}
                </div>
                <div className="absolute top-1 right-1 flex gap-1">
                  {!isAudioEnabled && (
                    <div className="w-4 h-4 bg-red-500 rounded-full flex items-center justify-center">
                      <MicOff size={8} className="text-white" />
                    </div>
                  )}
                </div>
              </div>
              
              {peers
                .filter(peer => peer.peerID !== screenSharingUser)
                .map((peerObj, index) => (
                  <div key={`thumb-${peerObj.peerID}-${index}`} className="relative bg-black rounded-lg overflow-hidden aspect-video">
                    <PeerVideo
                      peer={peerObj.peer}
                      userName={peerObj.userName}
                      userEmail={peerObj.userEmail}
                      videoEnabled={peerObj.videoEnabled}
                      audioEnabled={peerObj.audioEnabled}
                      isThumbnail={true}
                    />
                  </div>
                ))}
            </div>
          </div>
        ) : (
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
            <div className="relative bg-black rounded-2xl overflow-hidden min-h-0">
              {isVideoEnabled && localStream && localStream.getVideoTracks().length > 0 ? (
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
                <div
                  className={`w-3 h-3 rounded-full ${
                    localStream && isConnected
                      ? "bg-green-500"
                      : localStream
                      ? "bg-yellow-500 animate-pulse"
                      : "bg-red-500"
                  }`}
                ></div>
              </div>
            </div>

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
        )}
      </div>

      <div className="bg-black/50 backdrop-blur-sm p-6 z-10">
        <div className="flex items-center justify-center gap-4">
          <button
            type="button"
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
            type="button"
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
            type="button"
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
            type="button"
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
            type="button"
            onClick={leaveMeeting}
            className="p-4 rounded-full bg-red-600 hover:bg-red-700 text-white transition-all"
            title="Leave meeting"
          >
            <PhoneOff size={24} />
          </button>
        </div>
      </div>

      <MeetingSettings
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
        localStream={localStream}
        onSettingsChange={(settings) => setSavedSettings(settings)}
      />
    </div>
  );
};

export default MeetingRoom;