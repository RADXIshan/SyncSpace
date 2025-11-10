import { useState, useRef, useEffect } from 'react';
import { 
  Search, Focus, Command, Zap, Sparkles, X
} from 'lucide-react';
import SmartSearch from './SmartSearch';
import FocusMode from './FocusMode';
import KeyboardShortcuts from './KeyboardShortcuts';
import AIAssistant from './AIAssistant';
import useKeyboardShortcuts from '../hooks/useKeyboardShortcuts';

const FeatureHub = ({ channelId, onFeatureAction }) => {
  const [activeFeature, setActiveFeature] = useState(null);
  const [isCollapsed, setIsCollapsed] = useState(true);
  const buttonRef = useRef(null);
  const menuRef = useRef(null);
  const [closedScale, setClosedScale] = useState(0.14);
  const [closedTranslate, setClosedTranslate] = useState({ x: 0, y: 0 });

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

  // compute transform-origin and closed scale so the hub opens from the exact button position
  useEffect(() => {
    const updateOrigin = () => {
      const menuEl = menuRef.current;
      const btnEl = buttonRef.current;
      if (!menuEl || !btnEl) return;

      const menuRect = menuEl.getBoundingClientRect();
      const btnRect = btnEl.getBoundingClientRect();

      // set transform-origin to bottom-right so the hub opens from bottom-right and closes back there
      menuEl.style.transformOrigin = '100% 100%';

      // calculate closed scale such that menu width reduces to button width
      const scale = Math.max(0.04, Math.min(1, btnRect.width / menuRect.width));
      setClosedScale(scale);

      // no translate needed — using bottom-right origin makes the hub scale into that corner
      setClosedTranslate({ x: 0, y: 0 });
    };

    updateOrigin();
    window.addEventListener('resize', updateOrigin);
    return () => window.removeEventListener('resize', updateOrigin);
  }, [isCollapsed]);

  const handleFeatureClick = (featureId) => {
    setActiveFeature(featureId);
    if (onFeatureAction) {
      // notify parent that a feature was opened
      try {
        onFeatureAction('open-feature', { featureId, channelId });
      } catch {
        // fallback: if parent expects a different signature, call with featureId
        onFeatureAction(featureId);
      }
    }
  };

  const closeFeature = () => setActiveFeature(null);

  return (
    <>
      {/* Main Toggle Button - Fixed position to avoid chat input overlap */}
      <div className="fixed bottom-40 right-4 z-40 sm:bottom-44 md:bottom-40 lg:bottom-36 xl:bottom-6">
        <button
          ref={buttonRef}
          onClick={() => {
            const newState = !isCollapsed;
            setIsCollapsed(newState);
            if (onFeatureAction) {
              try {
                onFeatureAction(newState ? 'hub-opened' : 'hub-closed', { open: newState, channelId });
              } catch {
                onFeatureAction(newState);
              }
            }
          }}
          className={`cursor-pointer relative p-4 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white rounded-full shadow-2xl hover:shadow-purple-500/50 transition-all duration-300 group ${
            isCollapsed ? 'scale-100' : 'scale-120'
          }`}
          title={isCollapsed ? "Open features" : "Close features"}
        >
          <Zap className={`w-6 h-6 transition-all duration-300 ${
            isCollapsed ? 'rotate-0' : 'rotate-180 scale-110'
          }`} />
        </button>

        {/* Feature Menu - expands from the button (grows upward) */}
        <div
          className="absolute bottom-16 right-0 ease-out"
          // menuRef used to compute transformOrigin
          ref={menuRef}
          style={{ pointerEvents: isCollapsed ? 'none' : 'auto' }}
        >
          <div
            className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl border border-gray-200 dark:border-gray-700 p-4 min-w-[84px] relative"
            style={{
              // smooth open/close using translate + scale + opacity; closedScale/closedTranslate computed from button/menu sizes
              transform: isCollapsed
                ? `translate(${closedTranslate.x}px, ${closedTranslate.y}px) scale(${closedScale})`
                : 'translate(0px, -6px) scale(1)',
              opacity: isCollapsed ? 0 : 1,
              pointerEvents: isCollapsed ? 'none' : 'auto',
              transition: 'transform 320ms cubic-bezier(.2,.9,.2,1), opacity 240ms linear',
              willChange: 'transform, opacity'
            }}
          >
            {/* Header: title + Esc hint + close button */}
            <div className="flex items-center justify-between mb-2">
              <div className="text-sm text-gray-600 dark:text-gray-300 font-semibold">Quick Actions</div>
              <div className="flex items-center gap-2">
                <div className="text-[11px] text-gray-500 dark:text-gray-400 px-2 py-0.5 border border-gray-200 dark:border-gray-700 rounded bg-gray-50 dark:bg-gray-800">Esc</div>
                <button
                  onClick={() => setIsCollapsed(true)}
                  aria-label="Close features"
                  className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-all duration-300 cursor-pointer"
                >
                  <X className="w-4 h-4 text-gray-600 dark:text-gray-300 cursor-pointer" />
                </button>
              </div>
            </div>
            <div className="flex flex-col items-center gap-3">
              {features.map((feature, index) => {
                const Icon = feature.icon;
                const colorClasses = {
                  purple: 'from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700',
                  orange: 'from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700',
                  gray: 'from-gray-500 to-gray-600 hover:from-gray-600 hover:to-gray-700',
                  gradient: 'from-purple-500 via-pink-500 to-blue-500 hover:from-purple-600 hover:via-pink-600 hover:to-blue-600'
                };
                
                return (
                  <button
                    key={feature.id}
                    onClick={() => handleFeatureClick(feature.id)}
                    className={`cursor-pointer group relative flex items-center gap-4 px-4 rounded-xl transition-all duration-200 w-[220px] h-[72px] ${
                      activeFeature === feature.id 
                        ? 'bg-gradient-to-br ' + colorClasses[feature.color] + ' shadow-lg' 
                        : 'bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600'
                    }`}
                    style={{
                      // per-item entrance: slight translate + fade with stagger
                      transition: 'transform 220ms ease, opacity 180ms ease',
                      transitionDelay: `${index * 40}ms`,
                      transform: isCollapsed ? 'translateY(6px) scale(0.96)' : 'translateY(0) scale(1)',
                      opacity: isCollapsed ? 0 : 1
                    }}
                    title={`${feature.label} (${feature.shortcut})`}
                  >
                    {/* Icon */}
                    <div className={`flex items-center justify-center w-12 h-12 rounded-md transition-all duration-200 ${
                      activeFeature === feature.id ? 'scale-110' : 'group-hover:scale-110'
                    }`}>
                      <Icon className={`w-5 h-5 ${
                        activeFeature === feature.id 
                          ? 'text-white' 
                          : 'text-gray-600 dark:text-gray-300 group-hover:text-gray-900 dark:group-hover:text-white'
                      }`} />
                    </div>

                    {/* Text block: name to the right, shortcut below */}
                    <div className="flex flex-col items-start flex-1 min-w-0">
                      <span className={`text-sm font-semibold truncate ${
                        activeFeature === feature.id ? 'text-white' : 'text-gray-800 dark:text-gray-100'
                      }`} style={{ transition: 'opacity 200ms', opacity: isCollapsed ? 0 : 1 }}>
                        {feature.label}
                      </span>
                      <span className="text-xs text-gray-500 dark:text-gray-400 mt-0.5" style={{ transition: 'opacity 200ms', opacity: isCollapsed ? 0 : 1 }}>
                        {feature.shortcut}
                      </span>
                    </div>

                    {/* Active indicator dot */}
                    {activeFeature === feature.id && (
                      <div className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-green-400 border-2 border-white dark:border-gray-800 animate-pulse" />
                    )}
                  </button>
                );
              })}
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
        <AIAssistant 
          onClose={closeFeature}
          context={{
            page: 'channel',
            channelId: channelId,
          }}
        />
      )}
    </>
  );
};

export default FeatureHub;
