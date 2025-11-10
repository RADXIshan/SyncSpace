import { X, Command } from "lucide-react";

const KeyboardShortcuts = ({ onClose }) => {
  const shortcuts = [
    {
      category: "Navigation",
      items: [
        { keys: ["Ctrl", "K"], description: "Quick search" },
        { keys: ["Ctrl", "Shift", "F"], description: "Focus mode" },
        { keys: ["Ctrl", "/"], description: "Show shortcuts" },
        { keys: ["Ctrl", "Shift", "A"], description: "AI Assistant" },
      ],
    },
    {
      category: "Meetings",
      items: [
        { keys: ["Ctrl", "D"], description: "Toggle video" },
        { keys: ["Ctrl", "M"], description: "Toggle audio" },
        { keys: ["Ctrl", "E"], description: "End call" },
      ],
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md p-2 sm:p-4 transition-all duration-300">
      <div className="relative w-full max-w-2xl max-h-[90vh] glass-dark rounded-2xl sm:rounded-3xl overflow-hidden animate-fadeIn hover:scale-[1.01] transition-transform">
        <div className="absolute inset-0 cosmic-bg"></div>
        <div className="relative overflow-y-auto max-h-[90vh] p-6 sm:p-8 z-10">
          <div className="flex items-center justify-between mb-6 sm:mb-8">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-gradient-to-br from-purple-500 to-blue-500 rounded-xl shadow-lg">
                <Command className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-gray-800 dark:text-white">
                Keyboard Shortcuts
              </h3>
            </div>
            <button
              onClick={onClose}
              className="cursor-pointer p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-all hover:scale-105"
            >
              <X className="w-5 h-5 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-white transition-colors" />
            </button>
          </div>

          <div className="space-y-6">
            {shortcuts.map((section, idx) => (
              <div key={idx}>
                <h4 className="text-sm font-bold text-gray-600 dark:text-gray-400 uppercase mb-3 tracking-wide">
                  {section.category}
                </h4>
                <div className="space-y-2">
                  {section.items.map((item, i) => (
                    <div
                      key={i}
                      className="group flex items-center justify-between py-3 px-4 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-all hover:shadow-md hover:scale-[1.02] border border-transparent hover:border-gray-200 dark:hover:border-gray-600"
                    >
                      <span className="text-gray-700 dark:text-gray-300 font-medium group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                        {item.description}
                      </span>
                      <div className="flex gap-1">
                        {item.keys.map((key, k) => (
                          <kbd
                            key={k}
                            className="px-2.5 py-1.5 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-lg text-xs font-mono shadow-sm group-hover:bg-purple-100 dark:group-hover:bg-purple-900/30 group-hover:text-purple-700 dark:group-hover:text-purple-300 transition-colors"
                          >
                            {key}
                          </kbd>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default KeyboardShortcuts;
