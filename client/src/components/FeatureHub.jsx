import { useState } from 'react';
import { 
  Search, Focus, Command, Zap, Sparkles
} from 'lucide-react';
import SmartSearch from './SmartSearch';
import FocusMode from './FocusMode';
import KeyboardShortcuts from './KeyboardShortcuts';
import AIAssistant from './AIAssistant';
import useKeyboardShortcuts from '../hooks/useKeyboardShortcuts';

const FeatureHub = ({ channelId, onFeatureAction }) => {
  const [activeFeature, setActiveFeature] = useState(null);
  const [isCollapsed, setIsCollapsed] = useState(true);

  const features = [
    { 
      id: 'search', 
      icon: Search, 
      label: 'Smart Search', 
      shortcut: 'Ctrl+K',
      description: 'Search messages, files, and more',
      color: 'purple'
    },
    { 
      id: 'focus', 
      icon: Focus, 
      label: 'Focus Mode', 
      shortcut: 'Ctrl+Shift+F',
      description: 'Pomodoro timer for productivity',
      color: 'orange'
    },
    { 
      id: 'shortcuts', 
      icon: Command, 
      label: 'Shortcuts', 
      shortcut: 'Ctrl+/',
      description: 'View all keyboard shortcuts',
      color: 'gray'
    },
    { 
      id: 'ai', 
      icon: Sparkles, 
      label: 'AI Assistant', 
      shortcut: 'Ctrl+Shift+A',
      description: 'Chat with AI assistant (Preview)',
      color: 'gradient'
    },
  ];

  // Setup keyboard shortcut for Escape to close menu
  useKeyboardShortcuts([
    { key: 'Escape', callback: () => {
      if (activeFeature) {
        setActiveFeature(null);
      } else if (!isCollapsed) {
        setIsCollapsed(true);
      }
    }, allowInInput: true },
  ]);

  const handleFeatureClick = (featureId) => {
    setActiveFeature(featureId);
    if (onFeatureAction) {
      onFeatureAction(featureId);
    }
  };

  const closeFeature = () => setActiveFeature(null);

  return (
    <>
      {/* Main Toggle Button - Fixed position to avoid chat input overlap */}
      <div className="fixed bottom-40 right-4 z-40 sm:bottom-44 md:bottom-40 lg:bottom-36 xl:bottom-6">
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className={`relative p-4 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white rounded-full shadow-2xl hover:shadow-purple-500/50 transition-all duration-300 group ${
            isCollapsed ? 'scale-100' : 'scale-110'
          }`}
          title={isCollapsed ? "Open features" : "Close features"}
        >
          <Zap className={`w-6 h-6 transition-transform duration-300 ${
            isCollapsed ? 'rotate-0' : 'rotate-180 scale-110'
          }`} />
        </button>

        {/* Feature Menu - Opens from button */}
        <div className={`absolute bottom-20 right-0 transition-all duration-300 origin-bottom-right ${
          isCollapsed 
            ? 'scale-0 opacity-0 pointer-events-none translate-y-4' 
            : 'scale-100 opacity-100 translate-y-0'
        }`}>
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-3 border border-gray-200 dark:border-gray-700 min-w-[200px]">
            <div className="flex flex-col gap-2">
              {features.map((feature, index) => {
                const Icon = feature.icon;
                return (
                  <button
                    key={feature.id}
                    onClick={() => handleFeatureClick(feature.id)}
                    className={`group relative flex items-center gap-3 p-3 rounded-xl transition-all hover:scale-105 ${
                      activeFeature === feature.id 
                        ? 'bg-purple-100 dark:bg-purple-900/30 shadow-md' 
                        : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                    }`}
                    style={{
                      transitionDelay: isCollapsed ? '0ms' : `${index * 50}ms`
                    }}
                  >
                    <div className={`p-2 rounded-lg ${
                      activeFeature === feature.id
                        ? 'bg-purple-600 text-white'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                    }`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    
                    <div className="flex-1 text-left">
                      <div className={`font-medium text-sm ${
                        activeFeature === feature.id
                          ? 'text-purple-600 dark:text-purple-400'
                          : 'text-gray-800 dark:text-white'
                      }`}>
                        {feature.label}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400 font-mono">
                        {feature.shortcut}
                      </div>
                    </div>

                    {/* Active indicator */}
                    {activeFeature === feature.id && (
                      <div className="w-2 h-2 rounded-full bg-purple-600 animate-pulse" />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Footer tip */}
            <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
              <p className="text-xs text-center text-gray-500 dark:text-gray-400">
                Press <kbd className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-700 rounded font-mono">Esc</kbd> to close
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Backdrop when menu is open - only dims, no blur */}
      {!isCollapsed && (
        <div 
          className="fixed inset-0 bg-black/10 z-30 animate-in fade-in duration-200"
          onClick={() => setIsCollapsed(true)}
        />
      )}

      {/* Feature Modals */}
      {activeFeature === 'search' && (
        <SmartSearch onClose={closeFeature} />
      )}
      
      {activeFeature === 'focus' && (
        <FocusMode onClose={closeFeature} />
      )}
      
      {activeFeature === 'shortcuts' && (
        <KeyboardShortcuts onClose={closeFeature} />
      )}

      {activeFeature === 'ai' && (
        <AIAssistant onClose={closeFeature} />
      )}
    </>
  );
};

export default FeatureHub;
