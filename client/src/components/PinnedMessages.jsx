import { useState, useEffect } from 'react';
import { Pin, X, ChevronDown, ChevronUp, ArrowDown } from 'lucide-react';
import axios from 'axios';
import { toast } from 'react-hot-toast';

const PinnedMessages = ({ channelId, onScrollToMessage }) => {
  const [pinnedMessages, setPinnedMessages] = useState([]);
  const [isExpanded, setIsExpanded] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (channelId) {
      fetchPinnedMessages();
    }
  }, [channelId]);

  const fetchPinnedMessages = async () => {
    setLoading(true);
    try {
      const response = await axios.get(
        `${import.meta.env.VITE_BASE_URL}/api/channels/${channelId}/pinned`,
        { withCredentials: true }
      );
      setPinnedMessages(response.data.pinnedMessages || []);
    } catch (error) {
      console.error('Error fetching pinned messages:', error);
    } finally {
      setLoading(false);
    }
  };

  const unpinMessage = async (messageId) => {
    try {
      await axios.delete(
        `${import.meta.env.VITE_BASE_URL}/api/messages/${messageId}/pin`,
        { withCredentials: true }
      );
      setPinnedMessages(prev => prev.filter(m => m.message_id !== messageId));
      toast.success('Message unpinned');
    } catch (error) {
      console.error('Error unpinning message:', error);
      toast.error('Failed to unpin message');
    }
  };

  const handleScrollToMessage = (messageId) => {
    if (onScrollToMessage) {
      onScrollToMessage(messageId);
      setIsExpanded(false);
    }
  };

  if (pinnedMessages.length === 0) return null;

  return (
    <div className="bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20 border-b border-purple-200 dark:border-purple-800 shadow-sm">
      <div className="px-4 py-3">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center justify-between w-full text-left group hover:opacity-80 transition-all duration-200 cursor-pointer"
        >
          <div className="flex items-center gap-3">
            <div className="p-1.5 bg-purple-500/20 rounded-lg">
              <Pin className="w-4 h-4 text-purple-600 dark:text-purple-400 fill-current" />
            </div>
            <span className="text-sm font-semibold text-purple-800 dark:text-purple-200">
              {pinnedMessages.length} pinned {pinnedMessages.length === 1 ? 'message' : 'messages'}
            </span>
          </div>
          {isExpanded ? (
            <ChevronUp className="w-5 h-5 text-purple-600 dark:text-purple-400" />
          ) : (
            <ChevronDown className="w-5 h-5 text-purple-600 dark:text-purple-400" />
          )}
        </button>

        {isExpanded && (
          <div className="mt-3 space-y-2 max-h-80 overflow-y-auto custom-scrollbar">
            {pinnedMessages.map(msg => (
              <div
                key={msg.message_id}
                className="group bg-white dark:bg-gray-800 rounded-xl p-3 flex items-start gap-3 hover:shadow-md transition-all border border-gray-200 dark:border-gray-700"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="text-xs font-bold text-purple-600 dark:text-purple-400">
                      {msg.user_name}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      {new Date(msg.pinned_at).toLocaleDateString()}
                    </div>
                  </div>
                  <div className="text-sm text-gray-800 dark:text-white line-clamp-2 mb-2">
                    {msg.content || msg.file_name || 'File attachment'}
                  </div>
                  <button
                    onClick={() => handleScrollToMessage(msg.message_id)}
                    className="flex items-center gap-1 text-xs text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 font-medium transition-all duration-200 cursor-pointer"
                  >
                    <ArrowDown className="w-3 h-3" />
                    Jump to message
                  </button>
                </div>
                <button
                  onClick={() => unpinMessage(msg.message_id)}
                  className="p-1.5 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all duration-200 opacity-0 group-hover:opacity-100 cursor-pointer"
                  title="Unpin message"
                >
                  <X className="w-4 h-4 text-red-500" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default PinnedMessages;

