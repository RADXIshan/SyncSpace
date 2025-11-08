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
      title: 'Organizations & Channels 🏢',
      description: 'Join or create organizations to collaborate with your team. Organize conversations into channels for different topics and projects.',
      image: '🏢',
      tip: 'Create channels from the dashboard and invite team members to join'
    },
    {
      title: 'Real-Time Messaging 💬',
      description: 'Chat with your team in channels or direct messages. Send text, files, images, and more with instant delivery.',
      image: '💬',
      tip: 'React to messages with emojis, reply to create threads, and pin important messages'
    },
    {
      title: 'Direct Messages 📨',
      description: 'Have private one-on-one conversations with team members. Access DMs from the messages icon in the dashboard.',
      image: '📨',
      tip: 'Click on any team member to start a direct conversation'
    },
    {
      title: 'Voice Messages 🎤',
      description: 'Record and send voice messages instantly. Perfect for quick updates without typing.',
      image: '🎤',
      shortcut: 'Ctrl+Shift+V',
      tip: 'Access voice recorder from the Feature Hub or message input'
    },
    {
      title: 'Quick Polls 📊',
      description: 'Create instant polls to make team decisions faster. Support for single or multiple choice, anonymous voting.',
      image: '📊',
      shortcut: 'Ctrl+Shift+P',
      tip: 'Use anonymous voting for sensitive topics and see real-time results'
    },
    {
      title: 'Video Meetings 🎥',
      description: 'Start HD video calls with screen sharing, audio/video controls. Integrated meeting chat and automatic meeting reports.',
      image: '🎥',
      tip: 'Use Meeting Prep to test your camera and mic before joining'
    },
    {
      title: 'Meeting Chat 💭',
      description: 'Chat during meetings without interrupting. All messages are saved in the meeting report for later reference.',
      image: '💭',
      tip: 'Toggle chat panel during meetings to stay focused on video'
    },
    {
      title: 'Screen Sharing 🖥️',
      description: 'Share your screen during meetings for presentations and collaboration. Your camera stays visible in picture-in-picture.',
      image: '🖥️',
      tip: 'Click the screen share button in the meeting controls'
    },
    {
      title: 'Meeting Reports 📈',
      description: 'Automatic reports for every meeting with duration, participants, chat messages, and analytics. Export to CSV.',
      image: '📈',
      tip: 'Access reports from the channel menu or view all reports across channels'
    },
    {
      title: 'Smart Calendar 📅',
      description: 'Schedule events, set reminders, and manage your team\'s time. Click any date to create events.',
      image: '📅',
      tip: 'Meeting events are automatically added to your calendar'
    },
    {
      title: 'Smart Search 🔍',
      description: 'Find anything instantly - messages, files, meetings, or people. Filter by type for precise results.',
      image: '🔍',
      shortcut: 'Ctrl+K',
      tip: 'Search across all channels and direct messages at once'
    },
    {
      title: 'Focus Mode 🎯',
      description: 'Stay productive with our built-in Pomodoro timer. 25-minute focus sessions with 5-minute breaks.',
      image: '🎯',
      shortcut: 'Ctrl+Shift+F',
      tip: 'Track your daily sessions and take a long break after 4 sessions'
    },
    {
      title: 'Message Pinning 📌',
      description: 'Pin important messages to keep them easily accessible at the top of channels. Jump to pinned messages anytime.',
      image: '📌',
      tip: 'Perfect for meeting links, important announcements, and key information'
    },
    {
      title: 'Message Reactions ❤️',
      description: 'React to messages with emojis to show quick feedback. See who reacted and add multiple reactions.',
      image: '❤️',
      tip: 'Hover over messages to see reaction options'
    },
    {
      title: 'File Sharing 📎',
      description: 'Share files, images, and documents in channels and DMs. Preview images directly in chat.',
      image: '📎',
      tip: 'Drag and drop files or click the attachment icon'
    },
    {
      title: 'Notifications 🔔',
      description: 'Stay updated with real-time notifications for mentions, meetings, new members, and more. Filter by type.',
      image: '🔔',
      tip: 'Access notifications from the bell icon in the dashboard'
    },
    {
      title: 'Notes & Notices 📝',
      description: 'Create collaborative notes and post important announcements on the notice board visible to all members.',
      image: '📝',
      tip: 'Share notes with specific channels or the entire organization'
    },
    {
      title: 'Team Management 👥',
      description: 'View all organization members, manage roles, and see who\'s online. Invite new members with invite codes.',
      image: '👥',
      tip: 'Organization owners can manage member permissions'
    },
    {
      title: 'AI Assistant 🤖',
      description: 'Get help with summaries, finding information, and answering questions. AI features coming soon!',
      image: '🤖',
      shortcut: 'Ctrl+Shift+A',
      tip: 'Preview feature - full AI capabilities launching in v2.1'
    },
    {
      title: 'Keyboard Shortcuts ⌨️',
      description: 'Master keyboard shortcuts to work faster. Access any feature with a quick key combo.',
      image: '⌨️',
      shortcut: 'Ctrl+/',
      tip: 'Press Ctrl+/ anytime to view all available shortcuts'
    },
    {
      title: 'AI Assistant 🤖',
      description: 'Get instant help with our AI-powered assistant. Ask questions about features, get guidance, and receive auto-generated meeting summaries.',
      image: '✨',
      shortcut: 'Ctrl+Shift+A',
      tip: 'Access from Feature Hub or use the keyboard shortcut for instant help'
    },
    {
      title: 'Feature Hub ⚡',
      description: 'Quick access to all productivity features from the floating hub in the bottom-right corner. Includes Smart Search, Focus Mode, Keyboard Shortcuts, and AI Assistant.',
      image: '⚡',
      tip: 'Click the lightning bolt icon to open the feature menu'
    },
    {
      title: 'Profile & Settings ⚙️',
      description: 'Customize your profile, update settings, and manage your account. Upload a profile photo and update your information.',
      image: '⚙️',
      tip: 'Click your avatar in the dashboard to access settings'
    },
    {
      title: 'You\'re All Set! 🎊',
      description: 'Start collaborating with your team now. Explore channels, start meetings, send messages, and stay connected!',
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
        <div className="mb-8 relative z-10 pr-12">
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
          <div className="text-sm text-white/60 mt-2 text-left">
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
