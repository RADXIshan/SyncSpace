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

  // Load settings from localStorage or URL params on component mount
  useEffect(() => {
    // Check URL params for settings (from MeetingPrep)
    const urlParams = new URLSearchParams(window.location.search);
    const videoParam = urlParams.get('video');
    const audioParam = urlParams.get('audio');
    
    // Load saved settings from localStorage
    const savedSettings = localStorage.getItem('meetingSettings');
    let settings = {};
    
    if (savedSettings) {
      try {
        settings = JSON.parse(savedSettings);
      } catch (error) {
        console.error('Error parsing saved settings:', error);
      }
    }
    
    // URL params take precedence over localStorage
    const initialVideoEnabled = videoParam !== null ? videoParam === 'true' : (settings.videoEnabled !== false);
    const initialAudioEnabled = audioParam !== null ? audioParam === 'true' : (settings.audioEnabled !== false);
    
    setIsVideoEnabled(initialVideoEnabled);
    setIsAudioEnabled(initialAudioEnabled);
    
    console.log('Initial settings loaded:', { video: initialVideoEnabled, audio: initialAudioEnabled });
  }, []);

  // Refs
  const localVideoRef = useRef();
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
        console.log("Requesting user media with settings:", { video: isVideoEnabled, audio: isAudioEnabled });
        
        // Load saved device preferences
        const savedSettings = localStorage.getItem('meetingSettings');
        let deviceSettings = {};
        if (savedSettings) {
          try {
            deviceSettings = JSON.parse(savedSettings);
          } catch (error) {
            console.error('Error parsing saved device settings:', error);
          }
        }
        
        // Build constraints based on enabled settings and saved devices
        const constraints = {};
        if (isVideoEnabled) {
          constraints.video = deviceSettings.videoDevice ? 
            { deviceId: deviceSettings.videoDevice } : 
            {
              width: { ideal: 1280 },
              height: { ideal: 720 },
              facingMode: "user",
            };
        }
        if (isAudioEnabled) {
          constraints.audio = deviceSettings.audioInput ? 
            { deviceId: deviceSettings.audioInput } : 
            {
              echoCancellation: true,
              noiseSuppression: true,
              autoGainControl: true,
            };
        }
        
        // If both are disabled, create a minimal stream for future use
        if (!isVideoEnabled && !isAudioEnabled) {
          console.log("Both video and audio disabled, creating minimal stream for future use");
          try {
            // Create a minimal audio stream that we can disable immediately
            const minimalStream = await navigator.mediaDevices.getUserMedia({ 
              audio: {
                echoCancellation: true,
                noiseSuppression: true,
                autoGainControl: true,
              }
            });
            const audioTrack = minimalStream.getAudioTracks()[0];
            if (audioTrack) {
              audioTrack.enabled = false; // Disable it immediately
            }
            setLocalStream(minimalStream);
            console.log("Minimal stream created for future track addition");
            return;
          } catch (error) {
            console.log("Could not create minimal stream, will create on demand");
            setLocalStream(null);
            return;
          }
        }

        const stream = await navigator.mediaDevices.getUserMedia(constraints);

        console.log(
          "Got media stream:",
          stream
            .getTracks()
            .map((t) => `${t.kind}: ${t.enabled}, readyState: ${t.readyState}`)
        );

        // Set track states based on our settings
        const videoTrack = stream.getVideoTracks()[0];
        const audioTrack = stream.getAudioTracks()[0];

        if (videoTrack) {
          videoTrack.enabled = isVideoEnabled;
          console.log(
            "Video track enabled:",
            videoTrack.enabled,
            "readyState:",
            videoTrack.readyState
          );

          // Add track event listeners for debugging
          videoTrack.onended = () => {
            console.log("Video track ended");
          };

          videoTrack.onmute = () => {
            console.log("Video track muted");
          };

          videoTrack.onunmute = () => {
            console.log("Video track unmuted");
          };
        }

        if (audioTrack) {
          audioTrack.enabled = isAudioEnabled;
          console.log(
            "Audio track enabled:",
            audioTrack.enabled,
            "readyState:",
            audioTrack.readyState
          );

          // Add track event listeners for debugging
          audioTrack.onended = () => {
            console.log("Audio track ended");
          };

          audioTrack.onmute = () => {
            console.log("Audio track muted");
          };

          audioTrack.onunmute = () => {
            console.log("Audio track unmuted");
          };
        }

        setLocalStream(stream);
        console.log("Local media initialized successfully");
      } catch (error) {
        console.error("Error accessing media devices:", error);

        // Provide more specific error messages
        if (error.name === "NotAllowedError") {
          toast.error(
            "Camera/microphone access denied. Please allow access and refresh."
          );
        } else if (error.name === "NotFoundError") {
          toast.error("No camera/microphone found. Please check your devices.");
        } else if (error.name === "NotReadableError") {
          toast.error(
            "Camera/microphone is being used by another application."
          );
        } else {
          toast.error("Failed to access camera/microphone: " + error.message);
        }
      }
    };

    if (isConnected) {
      initializeMedia();
    }
  }, [isConnected]); // Remove isVideoEnabled and isAudioEnabled from dependencies to prevent re-initialization

  // Handle local video element setup
  useEffect(() => {
    if (localStream && localVideoRef.current) {
      console.log(
        "Setting up local video element, video enabled:",
        isVideoEnabled
      );
      
      // Always set the stream object, regardless of video enabled state
      localVideoRef.current.srcObject = localStream;

      // Ensure video plays
      localVideoRef.current.onloadedmetadata = () => {
        console.log(
          "Local video metadata loaded, dimensions:",
          localVideoRef.current.videoWidth,
          "x",
          localVideoRef.current.videoHeight
        );
        
        // Check if we have video tracks and they're enabled
        const videoTrack = localStream.getVideoTracks()[0];
        const shouldPlay = videoTrack && videoTrack.enabled && isVideoEnabled;
        
        if (shouldPlay) {
          localVideoRef.current
            .play()
            .then(() => {
              console.log("Local video started playing successfully");
              setIsVideoPlaying(true);
            })
            .catch((error) => {
              console.error("Local video play error:", error);
              setIsVideoPlaying(false);
            });
        } else {
          setIsVideoPlaying(false);
        }
      };

      localVideoRef.current.oncanplay = () => {
        console.log("Local video can play");
        const videoTrack = localStream.getVideoTracks()[0];
        if (videoTrack && videoTrack.enabled && isVideoEnabled) {
          setIsVideoPlaying(true);
        }
      };

      localVideoRef.current.onplaying = () => {
        console.log("Local video is playing");
        setIsVideoPlaying(true);
      };

      localVideoRef.current.onpause = () => {
        console.log("Local video paused");
        setIsVideoPlaying(false);
      };

      localVideoRef.current.onerror = (e) => {
        console.error("Local video error:", e);
        setIsVideoPlaying(false);
      };

      // Trigger initial setup
      const videoTrack = localStream.getVideoTracks()[0];
      if (videoTrack && videoTrack.enabled && isVideoEnabled) {
        // Small delay to ensure everything is ready
        setTimeout(() => {
          if (localVideoRef.current && localVideoRef.current.readyState >= 2) {
            localVideoRef.current.play().catch(console.error);
          }
        }, 100);
      }
    }
  }, [localStream, isVideoEnabled]); // Add isVideoEnabled back to handle state changes

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
        console.log(
          `Creating peer for existing user: ${user.userName} (${user.socketId})`
        );
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

    // Handle new user joining
    socket.on("user-joined", (payload) => {
      console.log("User joined:", payload);

      if (payload.signal && payload.signal.type === "offer") {
        // This is a WebRTC offer - check if peer already exists
        const existingPeer = peersRef.current.find(
          (p) => p.peerID === payload.callerID
        );
        if (!existingPeer) {
          console.log(
            `Adding peer for incoming offer from: ${payload.userName} (${payload.callerID})`
          );
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
      } else if (payload.signal && payload.signal.candidate) {
        // This is an ICE candidate
        const existingPeer = peersRef.current.find(
          (p) => p.peerID === payload.callerID
        );
        if (existingPeer) {
          console.log(`Adding ICE candidate from ${payload.callerID}`);
          try {
            existingPeer.peer
              .addIceCandidate(new RTCIceCandidate(payload.signal))
              .then(() => {
                console.log(
                  `Successfully added ICE candidate from ${payload.callerID}`
                );
              })
              .catch((error) => {
                console.error(
                  `Error adding ICE candidate from ${payload.callerID}:`,
                  error
                );
              });
          } catch (error) {
            console.error("Error adding ICE candidate:", error);
          }
        } else {
          console.warn(
            `No peer found for ICE candidate from ${payload.callerID}`
          );
        }
      } else if (!payload.signal) {
        // This is just a user joined notification, not a WebRTC signal
        console.log(
          "New user joined room (notification only):",
          payload.callerID
        );
      }
    });

    // Handle receiving answer
    socket.on("receiving-answer", (payload) => {
      console.log("Receiving answer:", payload);
      const item = peersRef.current.find((p) => p.peerID === payload.id);
      if (item && payload.signal) {
        try {
          if (payload.signal.type === "answer") {
            console.log(
              `Setting remote description (answer) for ${payload.id}`
            );
            item.peer
              .setRemoteDescription(new RTCSessionDescription(payload.signal))
              .then(() => {
                console.log(
                  `Successfully set remote description for ${payload.id}`
                );
              })
              .catch((error) => {
                console.error(
                  `Error setting remote description for ${payload.id}:`,
                  error
                );
              });
          } else if (payload.signal.candidate) {
            console.log(`Adding ICE candidate for ${payload.id}`);
            item.peer
              .addIceCandidate(new RTCIceCandidate(payload.signal))
              .then(() => {
                console.log(
                  `Successfully added ICE candidate for ${payload.id}`
                );
              })
              .catch((error) => {
                console.error(
                  `Error adding ICE candidate for ${payload.id}:`,
                  error
                );
              });
          }
        } catch (error) {
          console.error("Error handling answer/candidate:", error);
        }
      } else {
        console.warn(`No peer found for ${payload.id} or missing signal`);
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
      console.log(
        `Peer connection state (${userToSignal}):`,
        peer.connectionState
      );
      if (peer.connectionState === "failed") {
        console.error(`Peer connection failed for ${userToSignal}`);
        // Try to restart ICE
        peer.restartIce();
      }
    };

    // Add ICE connection state logging
    peer.oniceconnectionstatechange = () => {
      console.log(
        `ICE connection state (${userToSignal}):`,
        peer.iceConnectionState
      );
      if (peer.iceConnectionState === "failed") {
        console.error(
          `ICE connection failed for ${userToSignal}, restarting...`
        );
        peer.restartIce();
      }
    };

    // Handle incoming remote stream - CRITICAL FIX
    peer.ontrack = (event) => {
      console.log(
        `createPeer: Received ${event.track.kind} track from ${userToSignal}`,
        event
      );
      console.log(
        `createPeer: Track enabled: ${event.track.enabled}, readyState: ${event.track.readyState}`
      );

      if (event.streams && event.streams[0]) {
        console.log(
          `createPeer: Stream has ${event.streams[0].getTracks().length} tracks`
        );
        event.streams[0].getTracks().forEach((track) => {
          console.log(
            `createPeer: Stream track - ${track.kind}: enabled=${track.enabled}, readyState=${track.readyState}`
          );
        });
      }
    };

    // Add local stream tracks
    stream.getTracks().forEach((track) => {
      console.log(
        `Adding ${track.kind} track to peer ${userToSignal} - enabled: ${track.enabled}`
      );
      peer.addTrack(track, stream);
    });

    // Handle ICE candidates
    peer.onicecandidate = (event) => {
      if (event.candidate) {
        console.log(
          `Sending ICE candidate to ${userToSignal}:`,
          event.candidate.type
        );
        socket.emit("sending-signal", {
          userToSignal,
          callerID,
          signal: event.candidate,
        });
      } else {
        console.log(`ICE gathering complete for ${userToSignal}`);
      }
    };

    // Create and send offer with better error handling
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
        console.error(
          `Error creating/sending offer to ${userToSignal}:`,
          error
        );
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
      if (peer.connectionState === "failed") {
        console.error(`Peer connection failed for ${callerID}`);
        // Try to restart ICE
        peer.restartIce();
      }
    };

    // Add ICE connection state logging
    peer.oniceconnectionstatechange = () => {
      console.log(
        `ICE connection state (${callerID}):`,
        peer.iceConnectionState
      );
      if (peer.iceConnectionState === "failed") {
        console.error(`ICE connection failed for ${callerID}, restarting...`);
        peer.restartIce();
      }
    };

    // Handle incoming remote stream - CRITICAL FIX
    peer.ontrack = (event) => {
      console.log(
        `addPeer: Received ${event.track.kind} track from ${callerID}`,
        event
      );
      console.log(
        `addPeer: Track enabled: ${event.track.enabled}, readyState: ${event.track.readyState}`
      );

      if (event.streams && event.streams[0]) {
        console.log(
          `addPeer: Stream has ${event.streams[0].getTracks().length} tracks`
        );
        event.streams[0].getTracks().forEach((track) => {
          console.log(
            `addPeer: Stream track - ${track.kind}: enabled=${track.enabled}, readyState=${track.readyState}`
          );
        });
      }
    };

    // Add local stream tracks
    stream.getTracks().forEach((track) => {
      console.log(
        `Adding ${track.kind} track to peer ${callerID} - enabled: ${track.enabled}`
      );
      peer.addTrack(track, stream);
    });

    // Handle ICE candidates
    peer.onicecandidate = (event) => {
      if (event.candidate) {
        console.log(
          `Sending return ICE candidate to ${callerID}:`,
          event.candidate.type
        );
        socket.emit("returning-signal", {
          signal: event.candidate,
          callerID,
        });
      } else {
        console.log(`ICE gathering complete for ${callerID}`);
      }
    };

    // Validate incoming signal before processing
    if (!incomingSignal || !incomingSignal.type) {
      console.error("Invalid incoming signal:", incomingSignal);
      return peer;
    }

    console.log(`Processing ${incomingSignal.type} from ${callerID}`);

    // Handle incoming offer with better error handling
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
    const newState = !isVideoEnabled;
    console.log("Toggling video from", isVideoEnabled, "to", newState);

    if (newState) {
      // Turning video ON
      if (localStream) {
        const videoTrack = localStream.getVideoTracks()[0];
        if (videoTrack) {
          // Video track exists, just enable it
          videoTrack.enabled = true;
          setIsVideoEnabled(true);
          
          // Ensure video element is properly set up and playing
          if (localVideoRef.current) {
            localVideoRef.current.srcObject = localStream;
            // Add a small delay to ensure the track is ready
            setTimeout(() => {
              if (localVideoRef.current) {
                localVideoRef.current.play()
                  .then(() => {
                    setIsVideoPlaying(true);
                    console.log("Video track enabled and playing");
                  })
                  .catch(console.error);
              }
            }, 100);
          }
        } else {
          // No video track, need to get new stream with video
          try {
            const videoConstraints = {
              width: { ideal: 1280 },
              height: { ideal: 720 },
              facingMode: "user",
            };
            
            const videoStream = await navigator.mediaDevices.getUserMedia({
              video: videoConstraints
            });
            
            const newVideoTrack = videoStream.getVideoTracks()[0];
            
            // Add the new video track to existing stream
            localStream.addTrack(newVideoTrack);
            setIsVideoEnabled(true);
            
            // Update video element with proper setup
            if (localVideoRef.current) {
              localVideoRef.current.srcObject = localStream;
              localVideoRef.current.onloadedmetadata = () => {
                localVideoRef.current.play()
                  .then(() => {
                    setIsVideoPlaying(true);
                    console.log("New video track playing");
                  })
                  .catch(console.error);
              };
            }
            
            // Update all peer connections with new video track
            peersRef.current.forEach((peerObj) => {
              peerObj.peer.addTrack(newVideoTrack, localStream);
            });
            
            console.log("New video track added to existing stream");
          } catch (error) {
            console.error("Error enabling video:", error);
            toast.error("Failed to enable camera");
            return;
          }
        }
      } else {
        // No stream at all, create new one with video
        try {
          const constraints = {
            video: {
              width: { ideal: 1280 },
              height: { ideal: 720 },
              facingMode: "user",
            },
            audio: isAudioEnabled ? {
              echoCancellation: true,
              noiseSuppression: true,
              autoGainControl: true,
            } : false
          };
          
          const newStream = await navigator.mediaDevices.getUserMedia(constraints);
          setLocalStream(newStream);
          setIsVideoEnabled(true);
          
          if (localVideoRef.current) {
            localVideoRef.current.srcObject = newStream;
            localVideoRef.current.onloadedmetadata = () => {
              localVideoRef.current.play()
                .then(() => {
                  setIsVideoPlaying(true);
                  console.log("New stream with video playing");
                })
                .catch(console.error);
            };
          }
          
          // Update all peer connections with new tracks
          peersRef.current.forEach((peerObj) => {
            newStream.getTracks().forEach(track => {
              peerObj.peer.addTrack(track, newStream);
            });
          });
          
          console.log("New stream created with video (no existing stream)");
        } catch (error) {
          console.error("Error creating stream with video:", error);
          toast.error("Failed to enable camera");
          return;
        }
      }
    } else {
      // Turning video OFF - just disable the track
      if (localStream) {
        const videoTrack = localStream.getVideoTracks()[0];
        if (videoTrack) {
          videoTrack.enabled = false;
          setIsVideoEnabled(false);
          setIsVideoPlaying(false); // Update playing state immediately
          console.log("Video track disabled");
        }
      }
    }

    // Broadcast state change
    if (socket) {
      socket.emit("toggle-video", {
        roomId,
        videoEnabled: newState,
      });
    }
  };

  // Toggle audio
  const toggleAudio = async () => {
    const newState = !isAudioEnabled;
    console.log("Toggling audio from", isAudioEnabled, "to", newState);

    if (newState) {
      // Turning audio ON
      if (localStream) {
        const audioTrack = localStream.getAudioTracks()[0];
        if (audioTrack) {
          // Audio track exists, just enable it
          audioTrack.enabled = true;
          setIsAudioEnabled(true);
          console.log("Audio track enabled");
        } else {
          // No audio track, need to get new stream with audio
          try {
            const audioConstraints = {
              echoCancellation: true,
              noiseSuppression: true,
              autoGainControl: true,
            };
            
            const audioStream = await navigator.mediaDevices.getUserMedia({
              audio: audioConstraints
            });
            
            const newAudioTrack = audioStream.getAudioTracks()[0];
            
            // Add the new audio track to existing stream
            localStream.addTrack(newAudioTrack);
            setIsAudioEnabled(true);
            
            // Update all peer connections with new audio track
            peersRef.current.forEach((peerObj) => {
              peerObj.peer.addTrack(newAudioTrack, localStream);
            });
            
            console.log("New audio track added to existing stream");
          } catch (error) {
            console.error("Error enabling audio:", error);
            toast.error("Failed to enable microphone");
            return;
          }
        }
      } else {
        // No stream at all, create new one with audio
        try {
          const constraints = {
            video: isVideoEnabled ? {
              width: { ideal: 1280 },
              height: { ideal: 720 },
              facingMode: "user",
            } : false,
            audio: {
              echoCancellation: true,
              noiseSuppression: true,
              autoGainControl: true,
            }
          };
          
          const newStream = await navigator.mediaDevices.getUserMedia(constraints);
          setLocalStream(newStream);
          setIsAudioEnabled(true);
          
          if (isVideoEnabled && localVideoRef.current) {
            localVideoRef.current.srcObject = newStream;
          }
          
          // Update all peer connections with new tracks
          peersRef.current.forEach((peerObj) => {
            newStream.getTracks().forEach(track => {
              peerObj.peer.addTrack(track, newStream);
            });
          });
          
          console.log("New stream created with audio (no existing stream)");
        } catch (error) {
          console.error("Error creating stream with audio:", error);
          toast.error("Failed to enable microphone");
          return;
        }
      }
    } else {
      // Turning audio OFF - just disable the track, don't remove it
      if (localStream) {
        const audioTrack = localStream.getAudioTracks()[0];
        if (audioTrack) {
          audioTrack.enabled = false;
          setIsAudioEnabled(false);
          console.log("Audio track disabled");
        }
      }
    }

    // Broadcast state change
    if (socket) {
      socket.emit("toggle-audio", {
        roomId,
        audioEnabled: newState,
      });
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
  const PeerVideo = ({
    peer,
    userName,
    userEmail,
    videoEnabled,
    audioEnabled,
  }) => {
    const ref = useRef();
    const [remoteStream, setRemoteStream] = useState(null);
    const [isStreamReady, setIsStreamReady] = useState(false);

    useEffect(() => {
      if (!peer) return;

      let stream = null;

      const handleTrack = (event) => {
        console.log(
          `PeerVideo: Received ${event.track.kind} track from ${userName}`,
          event
        );

        if (event.streams && event.streams[0]) {
          stream = event.streams[0];
          console.log(
            `PeerVideo: Setting remote stream for ${userName}`,
            stream.getTracks().map((t) => `${t.kind}: ${t.enabled}`)
          );
          setRemoteStream(stream);
          setIsStreamReady(true);

          if (ref.current) {
            ref.current.srcObject = stream;

            // Add event listeners for better debugging
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

          // Add track event listeners to handle mute/unmute
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

      // Set up the track handler
      peer.ontrack = handleTrack;

      // Check for existing remote streams
      const checkExistingStreams = () => {
        const receivers = peer.getReceivers();
        const tracks = receivers
          .map((receiver) => receiver.track)
          .filter((track) => track);

        if (tracks.length > 0) {
          console.log(
            `PeerVideo: Found ${tracks.length} existing tracks for ${userName}`
          );
          const existingStream = new MediaStream(tracks);
          setRemoteStream(existingStream);
          setIsStreamReady(true);

          if (ref.current) {
            ref.current.srcObject = existingStream;
            ref.current.play().catch(console.error);
          }

          // Add track event listeners for existing tracks
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

      // Check immediately and after a short delay
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
      <div className="relative bg-black rounded-2xl overflow-hidden min-h-0">
        {videoEnabled && remoteStream && isStreamReady && 
         remoteStream.getVideoTracks().length > 0 && 
         remoteStream.getVideoTracks()[0].enabled ? (
          <video
            ref={ref}
            autoPlay
            playsInline
            muted={false}
            className="w-full h-full object-cover"
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
              <span className="text-sm">
                {!remoteStream ? "Connecting..." : "Camera is off"}
              </span>
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
          {/* Connection status */}
          <div
            className={`w-3 h-3 rounded-full ${
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

  // Only show loading if we're still trying to initialize and both video/audio are enabled
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
            {isVideoEnabled && localStream && localStream.getVideoTracks().length > 0 && localStream.getVideoTracks()[0].enabled ? (
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
              <div
                className={`w-3 h-3 rounded-full ${
                  localStream && (isVideoEnabled ? isVideoPlaying : isAudioEnabled)
                    ? "bg-green-500"
                    : localStream
                    ? "bg-yellow-500 animate-pulse"
                    : "bg-red-500"
                }`}
              ></div>
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
