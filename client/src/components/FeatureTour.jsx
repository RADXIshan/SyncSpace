import { useState } from 'react';
import { X, ChevronLeft, ChevronRight, Sparkles } from 'lucide-react';

const FeatureTour = ({ onClose, onComplete }) => {
  const [currentStep, setCurrentStep] = useState(0);

  const steps = [
    {
      title: 'Welcome to SyncSpace! 🎉',
      description: 'Your all-in-one team collaboration platform. Let\'s explore what you can do here!',
      image: '🚀',
      highlight: 'Get ready to transform how your team works together!'
    },
    {
      title: 'Real-Time Messaging 💬',
      description: 'Chat with your team in channels or direct messages. Send text, files, and more with instant delivery.',
      image: '💬',
      tip: 'React to messages with emojis and reply to create threads'
    },
    {
      title: 'Voice Messages 🎤',
      description: 'Record and send voice messages instantly. Perfect for quick updates without typing.',
      image: '🎤',
      shortcut: 'Ctrl+Shift+V',
      tip: 'Keep messages under 1 minute for best results'
    },
    {
      title: 'Quick Polls 📊',
      description: 'Create instant polls to make team decisions faster. Get real-time feedback from your team.',
      image: '📊',
      shortcut: 'Ctrl+Shift+P',
      tip: 'Use anonymous voting for sensitive topics'
    },
    {
      title: 'Video Meetings 🎥',
      description: 'Start HD video calls with screen sharing. Integrated chat and automatic meeting reports.',
      image: '🎥',
      tip: 'Test your camera and mic in Meeting Prep before joining'
    },
    {
      title: 'Smart Calendar 📅',
      description: 'Schedule events, set reminders, and manage your team\'s time. Sync with your workflow.',
      image: '📅',
      tip: 'Create events and invite team members directly'
    },
    {
      title: 'Smart Search 🔍',
      description: 'Find anything instantly - messages, files, meetings, or people. Lightning-fast results.',
      image: '🔍',
      shortcut: 'Ctrl+K',
      tip: 'Use filters to narrow down results'
    },
    {
      title: 'Focus Mode 🎯',
      description: 'Stay productive with our built-in Pomodoro timer. 25-minute focus sessions with breaks.',
      image: '🎯',
      shortcut: 'Ctrl+Shift+F',
      tip: 'Complete 4 sessions before taking a long break'
    },
    {
      title: 'Message Pinning 📌',
      description: 'Pin important messages to keep them easily accessible at the top of channels.',
      image: '📌',
      tip: 'Perfect for meeting links and important announcements'
    },
    {
      title: 'Notifications 🔔',
      description: 'Stay updated with real-time notifications. Filter by type and never miss important updates.',
      image: '🔔',
      tip: 'Customize notification preferences in settings'
    },
    {
      title: 'Notes & Notices 📝',
      description: 'Create collaborative notes and post important announcements on the notice board.',
      image: '📝',
      tip: 'Share notes with specific channels or the entire organization'
    },
    {
      title: 'Meeting Reports 📈',
      description: 'Automatic reports for every meeting with analytics, duration, and participant insights.',
      image: '📈',
      tip: 'Access reports from the channel menu'
    },
    {
      title: 'Keyboard Shortcuts ⌨️',
      description: 'Master keyboard shortcuts to work faster. Access any feature with a quick key combo.',
      image: '⌨️',
      shortcut: 'Ctrl+/',
      tip: 'Press Ctrl+/ anytime to view all shortcuts'
    },
    {
      title: 'Feature Hub 🎯',
      description: 'Quick access to all features from the floating hub in the bottom-right corner.',
      image: '🎯',
      tip: 'Click the hub icon to access voice messages, polls, and more'
    },
    {
      title: 'You\'re All Set! 🎊',
      description: 'Start collaborating with your team now. Explore channels, start meetings, and stay connected!',
      image: '🎊',
      highlight: 'Happy collaborating!'
    }
  ];

  const currentStepData = steps[currentStep];
  const isFirstStep = currentStep === 0;
  const isLastStep = currentStep === steps.length - 1;

  const handleNext = () => {
    if (isLastStep) {
      onComplete?.();
      onClose();
    } else {
      setCurrentStep(prev => prev + 1);
    }
  };

  const handlePrev = () => {
    if (!isFirstStep) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const handleSkip = () => {
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-md z-50 flex items-center justify-center p-4">
      <div className="glass-dark rounded-3xl p-8 max-w-2xl w-full shadow-2xl relative overflow-hidden">
        {/* Background decoration */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-purple-500/10 to-blue-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-gradient-to-tr from-pink-500/10 to-purple-500/10 rounded-full blur-3xl" />

        {/* Close button */}
        <button
          onClick={handleSkip}
          className="absolute top-4 right-4 p-2 glass-button hover:glass-button-enhanced rounded-lg transition-all duration-300 z-10"
        >
          <X className="w-5 h-5 text-white/80" />
        </button>

        {/* Progress bar */}
        <div className="mb-8 relative z-10">
          <div className="flex gap-1">
            {steps.map((_, idx) => (
              <div
                key={idx}
                className={`h-1 flex-1 rounded-full transition-all duration-300 ${
                  idx <= currentStep
                    ? 'bg-gradient-to-r from-purple-600 to-blue-600'
                    : 'bg-white/20'
                }`}
              />
            ))}
          </div>
          <div className="text-sm text-white/60 mt-2 text-center">
            Step {currentStep + 1} of {steps.length}
          </div>
        </div>

        {/* Content */}
        <div className="text-center mb-8 relative z-10">
          <div className="text-7xl mb-6 animate-bounce">
            {currentStepData.image}
          </div>
          
          <h2 className="text-3xl font-bold gradient-text-purple mb-4">
            {currentStepData.title}
          </h2>
          
          <p className="text-lg text-white/80 mb-6 leading-relaxed">
            {currentStepData.description}
          </p>

          {currentStepData.shortcut && (
            <div className="inline-flex items-center gap-2 px-4 py-2 glass-button rounded-lg mb-4">
              <span className="text-sm text-purple-300 font-medium">
                Shortcut:
              </span>
              <kbd className="px-3 py-1 glass-button-enhanced text-purple-300 rounded font-mono text-sm shadow">
                {currentStepData.shortcut}
              </kbd>
            </div>
          )}

          {currentStepData.tip && (
            <div className="flex items-start gap-2 p-4 glass-button rounded-xl text-left max-w-md mx-auto">
              <Sparkles className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
              <div>
                <div className="text-sm font-medium text-blue-300 mb-1">
                  Pro Tip
                </div>
                <div className="text-sm text-white/70">
                  {currentStepData.tip}
                </div>
              </div>
            </div>
          )}

          {currentStepData.highlight && (
            <div className="text-xl font-semibold gradient-text-purple mt-4">
              {currentStepData.highlight}
            </div>
          )}
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between gap-4 relative z-10">
          <button
            onClick={handlePrev}
            disabled={isFirstStep}
            className="px-6 py-3 glass-button hover:glass-button-enhanced disabled:opacity-50 disabled:cursor-not-allowed text-white/80 hover:text-purple-300 rounded-xl font-medium transition-all duration-300 flex items-center gap-2"
          >
            <ChevronLeft className="w-5 h-5" />
            Previous
          </button>

          <button
            onClick={handleSkip}
            className="text-white/60 hover:text-white/90 font-medium transition-colors"
          >
            Skip Tour
          </button>

          <button
            onClick={handleNext}
            className="px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white rounded-xl font-medium transition-all duration-300 flex items-center gap-2 shadow-lg hover:shadow-xl hover:scale-105 active:scale-95"
          >
            {isLastStep ? 'Get Started' : 'Next'}
            {!isLastStep && <ChevronRight className="w-5 h-5" />}
          </button>
        </div>
      </div>
    </div>
  );
};

export default FeatureTour;
