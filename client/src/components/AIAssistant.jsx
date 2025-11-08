import { useState } from 'react';
import { Sparkles, Send, X, Lightbulb } from 'lucide-react';

const AIAssistant = ({ onClose }) => {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: '👋 Hi! I\'m your AI assistant. I can help you with:\n\n• Summarizing meetings\n• Finding information\n• Scheduling tasks\n• Answering questions\n\nWhat can I help you with today?',
    },
  ]);

  const suggestions = [
    'Summarize today\'s meetings',
    'Find messages about project X',
    'Schedule a team meeting',
    'Show me my tasks',
  ];

  const handleSend = () => {
    if (!input.trim()) return;

    setMessages([
      ...messages,
      { role: 'user', content: input },
      {
        role: 'assistant',
        content: '🚀 AI features coming soon! This is a preview of what\'s possible with SyncSpace AI.',
      },
    ]);
    setInput('');
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-in fade-in duration-300">
      <div className="bg-white dark:bg-gray-800 rounded-3xl w-full max-w-2xl shadow-2xl flex flex-col max-h-[80vh] border border-gray-200 dark:border-gray-700 animate-in slide-in-from-bottom-8 duration-500">
        {/* Header */}
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl shadow-lg">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-gray-800 dark:text-white">
                  AI Assistant
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">
                  Powered by SyncSpace AI
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-all hover:scale-105"
            >
              <X className="w-5 h-5 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-white transition-colors" />
            </button>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {messages.map((message, idx) => (
            <div
              key={idx}
              className={`flex gap-3 ${
                message.role === 'user' ? 'flex-row-reverse' : ''
              }`}
            >
              <div
                className={`p-2 rounded-lg ${
                  message.role === 'user'
                    ? 'bg-purple-500'
                    : 'bg-gradient-to-br from-purple-500 to-pink-500'
                }`}
              >
                {message.role === 'user' ? (
                  <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center text-white text-sm font-bold">
                    U
                  </div>
                ) : (
                  <Sparkles className="w-6 h-6 text-white" />
                )}
              </div>
              <div
                className={`flex-1 p-4 rounded-2xl ${
                  message.role === 'user'
                    ? 'bg-purple-100 dark:bg-purple-900/30'
                    : 'bg-gray-100 dark:bg-gray-700'
                }`}
              >
                <p className="text-gray-800 dark:text-white whitespace-pre-wrap">
                  {message.content}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Suggestions */}
        {messages.length === 1 && (
          <div className="px-6 pb-4">
            <div className="flex items-center gap-2 mb-3">
              <Lightbulb className="w-5 h-5 text-yellow-500" />
              <span className="text-sm font-bold text-gray-600 dark:text-gray-400 uppercase tracking-wide">
                Try asking:
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {suggestions.map((suggestion, idx) => (
                <button
                  key={idx}
                  onClick={() => setInput(suggestion)}
                  className="group text-left p-3 rounded-xl bg-gray-100 dark:bg-gray-700 hover:bg-purple-50 dark:hover:bg-purple-900/30 transition-all text-sm text-gray-700 dark:text-gray-300 hover:text-purple-700 dark:hover:text-purple-300 font-medium hover:scale-105 hover:shadow-md border border-transparent hover:border-purple-200 dark:hover:border-purple-700"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Input */}
        <div className="p-6 border-t border-gray-200 dark:border-gray-700">
          <div className="flex gap-3">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSend()}
              placeholder="Ask me anything..."
              className="flex-1 px-4 py-3 bg-gray-100 dark:bg-gray-700 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none text-gray-800 dark:text-white font-medium transition-all"
            />
            <button
              onClick={handleSend}
              disabled={!input.trim()}
              className="px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl font-semibold transition-all flex items-center gap-2 hover:scale-105 shadow-lg hover:shadow-purple-500/50"
            >
              <Send className="w-5 h-5" />
              Send
            </button>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-3 text-center font-medium">
            🚀 AI features coming in v2.1 - This is a preview
          </p>
        </div>
      </div>
    </div>
  );
};

export default AIAssistant;
