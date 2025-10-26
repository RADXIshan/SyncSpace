import { useState, useRef, useEffect } from "react";
import { Plus } from "lucide-react";
import EmojiPicker from "./EmojiPicker";

const MessageReactions = ({
  reactions = [],
  onReactionClick,
  currentUserId,
  isOwnMessage = false,
}) => {
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const emojiPickerRef = useRef(null);

  // Handle click outside for emoji picker
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        emojiPickerRef.current &&
        !emojiPickerRef.current.contains(event.target)
      ) {
        setShowEmojiPicker(false);
      }
    };

    if (showEmojiPicker) {
      document.addEventListener("mousedown", handleClickOutside);
      return () =>
        document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [showEmojiPicker]);

  // Group reactions by emoji
  const groupedReactions = (reactions || []).reduce((acc, reaction) => {
    if (!acc[reaction.emoji]) {
      acc[reaction.emoji] = {
        emoji: reaction.emoji,
        count: 0,
        users: [],
        hasCurrentUser: false,
      };
    }
    acc[reaction.emoji].count++;
    acc[reaction.emoji].users.push(reaction.user_name);
    if (reaction.user_id === currentUserId) {
      acc[reaction.emoji].hasCurrentUser = true;
    }
    return acc;
  }, {});

  const reactionGroups = Object.values(groupedReactions);

  // Always show the add reaction button, even if no reactions exist
  const hasReactions = reactionGroups.length > 0;

  return (
    <div
      className={`flex items-center gap-2 mt-2 flex-wrap ${
        isOwnMessage ? "justify-start" : "justify-end"
      }`}
    >
      {hasReactions &&
        reactionGroups.map((group) => (
          <button
            key={group.emoji}
            onClick={() => onReactionClick(group.emoji)}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm border-2 transition-all duration-200 transform hover:scale-105 ${
              group.hasCurrentUser
                ? "bg-gradient-to-r from-blue-100 to-purple-100 border-blue-300 text-blue-800 shadow-md"
                : "bg-white border-gray-200 text-gray-700 hover:bg-gray-50 hover:border-gray-300 shadow-sm"
            }`}
            title={`${group.users.join(", ")} reacted with ${group.emoji}`}
          >
            <span className="text-base">{group.emoji}</span>
            <span className="font-semibold">{group.count}</span>
          </button>
        ))}

      {/* Add reaction button - always visible */}
      <div className="relative" ref={emojiPickerRef}>
        <button
          onClick={() => setShowEmojiPicker(!showEmojiPicker)}
          className="flex items-center justify-center w-8 h-8 rounded-full bg-white border-2 border-gray-200 text-gray-500 hover:bg-purple-50 hover:border-purple-300 hover:text-purple-600 opacity-0 group-hover:opacity-100 transition-all duration-200 transform hover:scale-110 shadow-sm"
          title="Add reaction"
        >
          <Plus size={14} />
        </button>

        {showEmojiPicker && (
          <div className="absolute bottom-full left-0 mb-2 z-50">
            <EmojiPicker
              onEmojiSelect={(emoji) => {
                onReactionClick(emoji);
                setShowEmojiPicker(false);
              }}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default MessageReactions;
