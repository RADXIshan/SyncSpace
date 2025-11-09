import { useState, useEffect, useRef } from 'react';
import { X, Play, Pause, RotateCcw, Coffee, Target } from 'lucide-react';
import { toast } from 'react-hot-toast';

const FocusMode = ({ onClose }) => {
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [mode, setMode] = useState('work'); // work, shortBreak, longBreak
  const [sessions, setSessions] = useState(() => {
    // Load sessions from localStorage on mount
    const today = new Date().toDateString();
    const stored = localStorage.getItem('focusModeSessions');
    if (stored) {
      try {
        const data = JSON.parse(stored);
        // Reset if it's a new day
        if (data.date === today) {
          return data.count;
        }
      } catch (e) {
        console.error('Error loading focus sessions:', e);
      }
    }
    return 0;
  });
  const intervalRef = useRef(null);

  const modes = {
    work: { duration: 25 * 60, label: 'Focus Time', icon: Target, color: 'purple' },
    shortBreak: { duration: 5 * 60, label: 'Short Break', icon: Coffee, color: 'green' },
    longBreak: { duration: 15 * 60, label: 'Long Break', icon: Coffee, color: 'blue' }
  };

  useEffect(() => {
    if (isRunning && timeLeft > 0) {
      intervalRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            handleTimerComplete();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(intervalRef.current);
  }, [isRunning, timeLeft]);

  const handleTimerComplete = () => {
    setIsRunning(false);
    if (mode === 'work') {
      setSessions(prev => {
        const newCount = prev + 1;
        // Save to localStorage
        const today = new Date().toDateString();
        localStorage.setItem('focusModeSessions', JSON.stringify({
          date: today,
          count: newCount
        }));
        return newCount;
      });
      toast.success('Focus session complete! Time for a break.', { duration: 5000 });
      new Audio('/notification.mp3').play().catch(() => {});
    } else {
      toast.success('Break complete! Ready to focus?', { duration: 5000 });
    }
  };

  const toggleTimer = () => setIsRunning(!isRunning);
  
  const resetTimer = () => {
    setIsRunning(false);
    setTimeLeft(modes[mode].duration);
  };

  const switchMode = (newMode) => {
    setMode(newMode);
    setTimeLeft(modes[newMode].duration);
    setIsRunning(false);
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const progress = ((modes[mode].duration - timeLeft) / modes[mode].duration) * 100;
  const ModeIcon = modes[mode].icon;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md p-2 sm:p-4 transition-all duration-300">
      <div className="relative w-full max-w-md glass-dark rounded-2xl sm:rounded-3xl p-6 sm:p-8 overflow-hidden animate-fadeIn hover:scale-[1.01] transition-transform">
        <div className="absolute inset-0 cosmic-bg"></div>
        <div className="relative flex justify-between items-center mb-6 sm:mb-8 z-10">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-purple-500 to-blue-500 rounded-xl">
              <Target className="w-6 h-6 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-white">Focus Mode</h2>
          </div>
          <button onClick={onClose} className="cursor-pointer p-2.5 hover:bg-white/20 rounded-xl transition-all duration-200 hover:scale-110 active:scale-95 hover:rotate-90">
            <X className="w-5.5 h-5.5 text-gray-400 hover:text-white transition-colors" />
          </button>
        </div>

        <div className="relative flex gap-2 mb-6 sm:mb-8 z-10">
          {Object.entries(modes).map(([key, { label, color }]) => (
            <button key={key} onClick={() => switchMode(key)}
              className={`flex-1 px-2.5 py-3 rounded-xl font-semibold transition-all duration-300 cursor-pointer active:scale-95 flex items-center gap-2 justify-center glass-button text-white-400 hover:text-violet-400 text-sm sm:text-base disabled:opacity-50 disabled:cursor-not-allowed ${
                mode === key 
                  ? color === 'purple' ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/50 glass-button-enhanced' 
                  : color === 'green' ? 'bg-green-600 text-white shadow-lg shadow-green-500/50 glass-button-enhanced'
                  : 'bg-blue-600 text-white shadow-lg shadow-blue-500/50 glass-button-enhanced'
                  : 'bg-gray-700 text-gray-400/60 hover:bg-gray-600 glass-button'
              }`}>
              {label}
            </button>
          ))}
        </div>

        <div className="relative mb-6 sm:mb-8 z-10">
          <svg className="w-full h-64" viewBox="0 0 200 200">
            <circle cx="100" cy="100" r="90" fill="none" stroke="#374151" strokeWidth="8" />
            <circle cx="100" cy="100" r="90" fill="none" stroke={`rgb(${mode === 'work' ? '147, 51, 234' : mode === 'shortBreak' ? '34, 197, 94' : '59, 130, 246'})`}
              strokeWidth="8" strokeDasharray={`${2 * Math.PI * 90}`}
              strokeDashoffset={`${2 * Math.PI * 90 * (1 - progress / 100)}`}
              strokeLinecap="round" transform="rotate(-90 100 100)" className="transition-all duration-1000" />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <ModeIcon className="w-8 h-8 text-gray-400 mb-2" />
            <div className="text-5xl font-bold text-white mb-2">{formatTime(timeLeft)}</div>
            <div className="text-sm text-gray-400">
              {sessions} {sessions === 1 ? 'session' : 'sessions'} today
            </div>
          </div>
        </div>

        {/* Session Stats */}
        {sessions > 0 && (
          <div className="relative mb-6 p-4 bg-gray-700/50 rounded-xl border border-gray-600 z-10">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-gray-400 mb-1">Today's Progress</div>
                <div className="text-2xl font-bold text-white">{sessions * 25} minutes focused</div>
              </div>
              <button
                onClick={() => {
                  if (confirm('Reset today\'s session count?')) {
                    setSessions(0);
                    localStorage.removeItem('focusModeSessions');
                    toast.success('Session count reset');
                  }
                }}
                className="px-3 py-2 text-xs bg-gray-600 hover:bg-gray-500 text-gray-300 rounded-lg transition-all"
              >
                Reset Count
              </button>
            </div>
            {sessions >= 4 && (
              <div className="mt-3 text-sm text-green-400 flex items-center gap-2">
                <span className="text-lg">🎉</span>
                Great job! You've completed {sessions} sessions today!
              </div>
            )}
          </div>
        )}

        <div className="relative flex gap-3 z-10">
          <button onClick={toggleTimer}
            className={`flex-1 py-4 rounded-xl font-semibold text-white transition-all hover:scale-105 shadow-lg ${
              isRunning 
                ? 'px-6 py-3 rounded-xl font-semibold transition-all duration-300 cursor-pointer active:scale-95 flex items-center gap-2 justify-center btn-glass-primary text-red-400 hover:text-red-400 text-sm sm:text-base disabled:opacity-50 disabled:cursor-not-allowed' 
                : 'px-6 py-3 rounded-xl font-semibold transition-all duration-300 cursor-pointer active:scale-95 flex items-center gap-2 justify-center btn-glass-primary text-violet-400 hover:text-violet-400 text-sm sm:text-base disabled:opacity-50 disabled:cursor-not-allowed'
            }`}>
            {isRunning ? <><Pause className="w-5 h-5 inline mr-2" />Pause</> : <><Play className="w-5 h-5 inline mr-2" />Start</>}
          </button>
          <button onClick={resetTimer}
            className="px-6 py-3 rounded-xl font-semibold transition-all duration-300 cursor-pointer active:scale-95 flex items-center gap-2 justify-center btn-glass-primary text-white hover:text-violet-400 text-sm sm:text-base disabled:opacity-50 disabled:cursor-not-allowed"
            title="Reset timer">
            <RotateCcw className="w-5 h-5 group-hover:text-violet-400" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default FocusMode;
