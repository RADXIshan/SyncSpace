import { useState, useEffect, useRef } from 'react';
import { X, Camera, Mic, Speaker, Monitor, Settings } from 'lucide-react';
import { toast } from 'react-hot-toast';

const MeetingSettings = ({ isOpen, onClose, localStream }) => {
  const [videoDevices, setVideoDevices] = useState([]);
  const [audioInputDevices, setAudioInputDevices] = useState([]);
  const [audioOutputDevices, setAudioOutputDevices] = useState([]);
  const [selectedVideoDevice, setSelectedVideoDevice] = useState('');
  const [selectedAudioInput, setSelectedAudioInput] = useState('');
  const [selectedAudioOutput, setSelectedAudioOutput] = useState('');
  const [videoEnabled, setVideoEnabled] = useState(true);
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [loading, setLoading] = useState(false);

  const previewVideoRef = useRef(null);
  const testAudioRef = useRef(null);

  // Get available media devices
  const getMediaDevices = async () => {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      
      const videoInputs = devices.filter(device => device.kind === 'videoinput');
      const audioInputs = devices.filter(device => device.kind === 'audioinput');
      const audioOutputs = devices.filter(device => device.kind === 'audiooutput');

      setVideoDevices(videoInputs);
      setAudioInputDevices(audioInputs);
      setAudioOutputDevices(audioOutputs);

      // Set default selections
      if (videoInputs.length > 0 && !selectedVideoDevice) {
        setSelectedVideoDevice(videoInputs[0].deviceId);
      }
      if (audioInputs.length > 0 && !selectedAudioInput) {
        setSelectedAudioInput(audioInputs[0].deviceId);
      }
      if (audioOutputs.length > 0 && !selectedAudioOutput) {
        setSelectedAudioOutput(audioOutputs[0].deviceId);
      }
    } catch (error) {
      console.error('Error getting media devices:', error);
      toast.error('Failed to get media devices');
    }
  };

  // Initialize preview stream
  const initializePreview = async () => {
    try {
      const constraints = {
        video: selectedVideoDevice ? { deviceId: selectedVideoDevice } : true,
        audio: selectedAudioInput ? { deviceId: selectedAudioInput } : true
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      
      if (previewVideoRef.current) {
        previewVideoRef.current.srcObject = stream;
      }

      // Set initial states based on current stream
      if (localStream) {
        const videoTrack = localStream.getVideoTracks()[0];
        const audioTrack = localStream.getAudioTracks()[0];
        
        setVideoEnabled(videoTrack ? videoTrack.enabled : false);
        setAudioEnabled(audioTrack ? audioTrack.enabled : false);
      }

      return stream;
    } catch (error) {
      console.error('Error initializing preview:', error);
      toast.error('Failed to initialize camera/microphone preview');
    }
  };

  // Test audio output
  const testAudioOutput = async () => {
    try {
      // Create a simple beep sound using Web Audio API
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
      oscillator.type = 'sine';
      
      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
      
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.5);
      
      // If a specific output device is selected, try to set it
      if (selectedAudioOutput && audioContext.setSinkId) {
        await audioContext.setSinkId(selectedAudioOutput);
      }
      
      toast.success('Audio output test played');
    } catch (error) {
      console.error('Error testing audio output:', error);
      toast.error('Failed to test audio output');
    }
  };

  // Apply settings
  const applySettings = async () => {
    setLoading(true);
    
    try {
      // Update video device
      if (localStream && selectedVideoDevice) {
        const videoTrack = localStream.getVideoTracks()[0];
        if (videoTrack) {
          const newConstraints = { deviceId: selectedVideoDevice };
          const newStream = await navigator.mediaDevices.getUserMedia({ video: newConstraints });
          const newVideoTrack = newStream.getVideoTracks()[0];
          
          // Replace the track in the stream
          localStream.removeTrack(videoTrack);
          localStream.addTrack(newVideoTrack);
          videoTrack.stop();
        }
      }

      // Update audio input device
      if (localStream && selectedAudioInput) {
        const audioTrack = localStream.getAudioTracks()[0];
        if (audioTrack) {
          const newConstraints = { deviceId: selectedAudioInput };
          const newStream = await navigator.mediaDevices.getUserMedia({ audio: newConstraints });
          const newAudioTrack = newStream.getVideoTracks()[0];
          
          // Replace the track in the stream
          localStream.removeTrack(audioTrack);
          localStream.addTrack(newAudioTrack);
          audioTrack.stop();
        }
      }

      // Save settings to localStorage
      localStorage.setItem('meetingSettings', JSON.stringify({
        videoDevice: selectedVideoDevice,
        audioInput: selectedAudioInput,
        audioOutput: selectedAudioOutput,
        videoEnabled,
        audioEnabled
      }));

      toast.success('Settings applied successfully');
      onClose();
    } catch (error) {
      console.error('Error applying settings:', error);
      toast.error('Failed to apply settings');
    } finally {
      setLoading(false);
    }
  };

  // Load saved settings
  const loadSavedSettings = () => {
    try {
      const saved = localStorage.getItem('meetingSettings');
      if (saved) {
        const settings = JSON.parse(saved);
        setSelectedVideoDevice(settings.videoDevice || '');
        setSelectedAudioInput(settings.audioInput || '');
        setSelectedAudioOutput(settings.audioOutput || '');
        setVideoEnabled(settings.videoEnabled !== false);
        setAudioEnabled(settings.audioEnabled !== false);
      }
    } catch (error) {
      console.error('Error loading saved settings:', error);
    }
  };

  useEffect(() => {
    if (isOpen) {
      getMediaDevices();
      loadSavedSettings();
    }
  }, [isOpen]);

  useEffect(() => {
    if (isOpen && (selectedVideoDevice || selectedAudioInput)) {
      initializePreview();
    }
  }, [isOpen, selectedVideoDevice, selectedAudioInput]);

  // Cleanup preview stream when closing
  useEffect(() => {
    return () => {
      if (previewVideoRef.current && previewVideoRef.current.srcObject) {
        const stream = previewVideoRef.current.srcObject;
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md p-4">
      <div className="relative w-full max-w-4xl max-h-[90vh] bg-gray-800 rounded-2xl overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-gray-800 to-gray-900"></div>
        
        <div className="relative overflow-y-auto max-h-[90vh] p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                <Settings size={20} className="text-white" />
              </div>
              <h2 className="text-2xl font-bold text-white">Meeting Settings</h2>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white transition-colors p-2 rounded-lg hover:bg-gray-700"
            >
              <X size={24} />
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Preview Section */}
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                <Camera size={20} />
                Camera Preview
              </h3>
              
              <div className="relative bg-black rounded-xl overflow-hidden aspect-video">
                <video
                  ref={previewVideoRef}
                  autoPlay
                  muted
                  playsInline
                  className="w-full h-full object-cover"
                />
                {!videoEnabled && (
                  <div className="absolute inset-0 bg-gray-800 flex items-center justify-center">
                    <div className="text-center text-white">
                      <Camera size={48} className="mx-auto mb-2 opacity-50" />
                      <p>Camera Off</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Audio Test */}
              <div className="space-y-3">
                <h4 className="text-md font-medium text-white flex items-center gap-2">
                  <Speaker size={18} />
                  Audio Output Test
                </h4>
                <button
                  onClick={testAudioOutput}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                >
                  Test Speaker
                </button>

              </div>
            </div>

            {/* Settings Section */}
            <div className="space-y-6">
              {/* Video Settings */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                  <Camera size={20} />
                  Video Settings
                </h3>
                
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Camera
                  </label>
                  <select
                    value={selectedVideoDevice}
                    onChange={(e) => setSelectedVideoDevice(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {videoDevices.map((device) => (
                      <option key={device.deviceId} value={device.deviceId}>
                        {device.label || `Camera ${device.deviceId.slice(0, 8)}`}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="videoEnabled"
                    checked={videoEnabled}
                    onChange={(e) => setVideoEnabled(e.target.checked)}
                    className="w-4 h-4 accent-blue-600"
                  />
                  <label htmlFor="videoEnabled" className="text-gray-300">
                    Enable camera by default
                  </label>
                </div>
              </div>

              {/* Audio Input Settings */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                  <Mic size={20} />
                  Audio Input Settings
                </h3>
                
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Microphone
                  </label>
                  <select
                    value={selectedAudioInput}
                    onChange={(e) => setSelectedAudioInput(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {audioInputDevices.map((device) => (
                      <option key={device.deviceId} value={device.deviceId}>
                        {device.label || `Microphone ${device.deviceId.slice(0, 8)}`}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="audioEnabled"
                    checked={audioEnabled}
                    onChange={(e) => setAudioEnabled(e.target.checked)}
                    className="w-4 h-4 accent-blue-600"
                  />
                  <label htmlFor="audioEnabled" className="text-gray-300">
                    Enable microphone by default
                  </label>
                </div>
              </div>

              {/* Audio Output Settings */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                  <Speaker size={20} />
                  Audio Output Settings
                </h3>
                
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Speaker
                  </label>
                  <select
                    value={selectedAudioOutput}
                    onChange={(e) => setSelectedAudioOutput(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {audioOutputDevices.map((device) => (
                      <option key={device.deviceId} value={device.deviceId}>
                        {device.label || `Speaker ${device.deviceId.slice(0, 8)}`}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-4 mt-8 pt-6 border-t border-gray-700">
            <button
              onClick={onClose}
              className="px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={applySettings}
              disabled={loading}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 text-white rounded-lg transition-colors flex items-center gap-2"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  <span>Applying...</span>
                </>
              ) : (
                <span>Apply Settings</span>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MeetingSettings;