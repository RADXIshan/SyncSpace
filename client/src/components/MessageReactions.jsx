import { useState } from "react";
import { Plus } from "lucide-react";
import EmojiPicker from "./EmojiPicker";

const MessageReactions = ({ reactions, onReactionClick, currentUserId }) => {
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  // Group reactions by emoji
  const groupedReactions = reactions.reduce((acc, reaction) => {
    if (!acc[reaction.emoji]) {
      acc[reaction.emoji] = {
        emoji: reaction.emoji,
        count: 0,
        users: [],
        hasCurrentUser: false
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

  if (reactionGroups.length === 0) return null;

  return (
    <div className="flex items-center gap-1 mt-2 flex-wrap">
      {reactionGroups.map((group) => (
        <button
          key={group.emoji}
          onClick={() => onReactionClick(group.emoji)}
          className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs border transition-colors ${
            group.hasCurrentUser
              ? "bg-blue-100 border-blue-300 text-blue-700"
              : "bg-gray-100 border-gray-300 text-gray-700 hover:bg-gray-200"
          }`}
          title={`${group.users.join(", ")} reacted with ${group.emoji}`}
        >
          <span>{group.emoji}</span>
          <span className="font-medium">{group.count}</span>
        </button>
      ))}
      
      {/* Add reaction button */}
      <div className="relative">
        <button
          onClick={() => setShowEmojiPicker(!showEmojiPicker)}
          className="flex items-center justify-center w-6 h-6 rounded-full bg-gray-100 border border-gray-300 text-gray-500 hover:bg-gray-200 transition-colors"
          title="Add reaction"
        >
          <Plus size={12} />
        </button>
        
        {showEmojiPicker && (
          <div className="absolute bottom-full left-0 mb-2 z-10">
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