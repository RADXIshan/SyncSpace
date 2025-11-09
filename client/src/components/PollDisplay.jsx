import { useState, useEffect } from 'react';
import { BarChart3, Check, ThumbsUp, Heart, Reply } from 'lucide-react';
import { toast } from 'react-hot-toast';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import MessageReactions from './MessageReactions';

const PollDisplay = ({ poll, onVote, onDelete, onReaction, onReply, reactions = [] }) => {
  const { user } = useAuth();
  const [selectedOptions, setSelectedOptions] = useState([]);
  const [hasVoted, setHasVoted] = useState(false);
  const [voting, setVoting] = useState(false);

  useEffect(() => {
    // Check if user has already voted
    if (poll.votes && user) {
      const userVote = poll.votes.find(v => v.user_id === user.user_id);
      if (userVote) {
        setHasVoted(true);
        setSelectedOptions(userVote.selected_options || []);
      }
    }
  }, [poll, user]);

  const handleOptionClick = (optionIndex) => {
    if (hasVoted) return;

    if (poll.allow_multiple) {
      setSelectedOptions(prev => 
        prev.includes(optionIndex)
          ? prev.filter(i => i !== optionIndex)
          : [...prev, optionIndex]
      );
    } else {
      setSelectedOptions([optionIndex]);
    }
  };

  const handleVote = async () => {
    if (selectedOptions.length === 0) {
      toast.error('Please select at least one option');
      return;
    }

    setVoting(true);
    try {
      const response = await axios.post(
        `${import.meta.env.VITE_BASE_URL}/api/polls/${poll.poll_id}/vote`,
        { selected_options: selectedOptions },
        { withCredentials: true }
      );

      setHasVoted(true);
      toast.success('Vote submitted!');
      if (onVote) onVote(response.data.poll);
    } catch (error) {
      console.error('Error voting:', error);
      toast.error('Failed to submit vote');
    } finally {
      setVoting(false);
    }
  };

  const getTotalVotes = () => {
    return poll.votes ? poll.votes.length : 0;
  };

  const getOptionVotes = (optionIndex) => {
    if (!poll.votes) return 0;
    return poll.votes.filter(v => 
      v.selected_options && v.selected_options.includes(optionIndex)
    ).length;
  };

  const getOptionVoters = (optionIndex) => {
    if (!poll.votes || poll.anonymous) return [];
    return poll.votes
      .filter(v => v.selected_options && v.selected_options.includes(optionIndex))
      .map(v => v.user_name || 'Unknown User');
  };

  const getOptionPercentage = (optionIndex) => {
    const total = getTotalVotes();
    if (total === 0) return 0;
    return Math.round((getOptionVotes(optionIndex) / total) * 100);
  };

  return (
    <div className="group bg-white dark:bg-gray-800 rounded-2xl p-5 border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-start gap-3 mb-4">
        <div className="p-2.5 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl shadow-lg">
          <BarChart3 className="w-5 h-5 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="font-semibold text-gray-900 dark:text-white mb-2 text-base leading-snug">
            {poll.question}
          </h4>
          <div className="flex items-center gap-2 flex-wrap text-xs">
            <span className="px-2 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-full font-medium">
              {getTotalVotes()} {getTotalVotes() === 1 ? 'vote' : 'votes'}
            </span>
            {poll.allow_multiple && (
              <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full font-medium">
                Multiple choice
              </span>
            )}
            {poll.anonymous && (
              <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-full font-medium">
                Anonymous
              </span>
            )}
          </div>
        </div>
        {onDelete && (
          <button
            onClick={onDelete}
            className="p-2 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-all duration-200 text-red-500 hover:text-red-600 dark:text-red-400 dark:hover:text-red-300 cursor-pointer"
            title="Delete poll"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        )}
      </div>

      <div className="space-y-2.5 mb-5">
        {poll.options.map((option, index) => {
          const votes = getOptionVotes(index);
          const percentage = getOptionPercentage(index);
          const isSelected = selectedOptions.includes(index);

          return (
            <button
              key={index}
              onClick={() => handleOptionClick(index)}
              disabled={hasVoted}
              className={`w-full text-left p-4 rounded-xl transition-all duration-200 ${
                hasVoted
                  ? 'cursor-default'
                  : 'cursor-pointer hover:scale-[1.01] hover:shadow-sm'
              } ${
                isSelected && !hasVoted
                  ? 'bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-900/30 dark:to-indigo-900/30 border-2 border-purple-500 dark:border-purple-400 shadow-sm'
                  : 'bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2.5 flex-1 min-w-0">
                  {isSelected && !hasVoted && (
                    <div className="flex-shrink-0 w-5 h-5 bg-purple-600 rounded-full flex items-center justify-center">
                      <Check className="w-3.5 h-3.5 text-white" />
                    </div>
                  )}
                  {hasVoted && isSelected && (
                    <div className="flex-shrink-0 w-5 h-5 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-full flex items-center justify-center">
                      <Check className="w-3.5 h-3.5 text-white" />
                    </div>
                  )}
                  <span className="text-sm font-medium text-gray-900 dark:text-white truncate">
                    {option}
                  </span>
                </div>
                {hasVoted && (
                  <span className="text-sm font-bold text-purple-600 dark:text-purple-400 ml-2 flex-shrink-0">
                    {percentage}%
                  </span>
                )}
              </div>
              {hasVoted && (
                <>
                  <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2.5 overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-purple-500 via-purple-600 to-indigo-600 h-2.5 rounded-full transition-all duration-700 ease-out shadow-sm"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                  {!poll.anonymous && votes > 0 && (
                    <div className="mt-2">
                      <div className="text-xs text-gray-600 dark:text-gray-400 font-medium">
                        {votes} {votes === 1 ? 'vote' : 'votes'}
                      </div>
                      {getOptionVoters(index).length > 0 && (
                        <div className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                          {getOptionVoters(index).slice(0, 3).join(', ')}
                          {getOptionVoters(index).length > 3 && ` +${getOptionVoters(index).length - 3} more`}
                        </div>
                      )}
                    </div>
                  )}
                </>
              )}
            </button>
          );
        })}
      </div>

      {!hasVoted && (
        <button
          onClick={handleVote}
          disabled={voting || selectedOptions.length === 0}
          className="w-full px-5 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 disabled:from-gray-400 disabled:to-gray-400 disabled:cursor-not-allowed text-white rounded-xl font-semibold transition-all duration-200 shadow-md hover:shadow-lg disabled:shadow-none transform hover:scale-[1.02] disabled:scale-100"
        >
          {voting ? (
            <span className="flex items-center justify-center gap-2">
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Submitting...
            </span>
          ) : (
            'Submit Vote'
          )}
        </button>
      )}

      {hasVoted && (
        <div className="flex items-center justify-center gap-2 text-sm text-green-600 dark:text-green-400 font-semibold bg-green-50 dark:bg-green-900/20 py-2.5 rounded-xl">
          <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
            <Check className="w-3 h-3 text-white" />
          </div>
          You voted
        </div>
      )}

      {/* Reactions and Reply Actions - Only show if handlers are provided */}
      {(onReaction || onReply || (reactions && reactions.length > 0)) && (
        <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-1">
            {/* Quick reaction buttons */}
            {onReaction && (
              <>
                <button
                  onClick={() => onReaction(poll.poll_id, '👍')}
                  className="p-2 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg text-gray-500 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400 transition-all duration-200 opacity-0 group-hover:opacity-100 cursor-pointer"
                  title="Like"
                >
                  <ThumbsUp size={16} />
                </button>
                <button
                  onClick={() => onReaction(poll.poll_id, '❤️')}
                  className="p-2 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg text-gray-500 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-400 transition-all duration-200 opacity-0 group-hover:opacity-100 cursor-pointer"
                  title="Love"
                >
                  <Heart size={16} />
                </button>
              </>
            )}
            {onReply && (
              <button
                onClick={() => onReply(poll)}
                className="p-2 hover:bg-purple-50 dark:hover:bg-purple-900/20 rounded-lg text-gray-500 hover:text-purple-600 dark:text-gray-400 dark:hover:text-purple-400 transition-all duration-200 opacity-0 group-hover:opacity-100 cursor-pointer"
                title="Reply"
              >
                <Reply size={16} />
              </button>
            )}
          </div>

          {/* Display reactions */}
          {reactions && reactions.length > 0 && (
            <MessageReactions reactions={reactions} />
          )}
        </div>
      )}
    </div>
  );
};

export default PollDisplay;
