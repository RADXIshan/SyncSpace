import { useState } from "react";

const EmojiPicker = ({ onEmojiSelect }) => {
  const [activeCategory, setActiveCategory] = useState("smileys");

  const emojiCategories = {
    smileys: {
      name: "Smileys & People",
      emojis: ["😀", "😃", "😄", "😁", "😆", "😅", "😂", "🤣", "😊", "😇", "🙂", "🙃", "😉", "😌", "😍", "🥰", "😘", "😗", "😙", "😚", "😋", "😛", "😝", "😜", "🤪", "🤨", "🧐", "🤓", "😎", "🤩", "🥳", "😏", "😒", "😞", "😔", "😟", "😕", "🙁", "☹️", "😣", "😖", "😫", "😩", "🥺", "😢", "😭", "😤", "😠", "😡", "🤬", "🤯", "😳", "🥵", "🥶", "😱", "😨", "😰", "😥", "😓", "🤗", "🤔", "🤭", "🤫", "🤥", "😶", "😐", "😑", "😬", "🙄", "😯", "😦", "😧", "😮", "😲", "🥱", "😴", "🤤", "😪", "😵", "🤐", "🥴", "🤢", "🤮", "🤧", "😷", "🤒", "🤕"]
    },
    gestures: {
      name: "Gestures",
      emojis: ["👍", "👎", "👌", "✌️", "🤞", "🤟", "🤘", "🤙", "👈", "👉", "👆", "🖕", "👇", "☝️", "👋", "🤚", "🖐️", "✋", "🖖", "👏", "🙌", "🤲", "🤝", "🙏", "✍️", "💪", "🦾", "🦿", "🦵", "🦶", "👂", "🦻", "👃", "🧠", "🫀", "🫁", "🦷", "🦴", "👀", "👁️", "👅", "👄", "💋"]
    },
    hearts: {
      name: "Hearts",
      emojis: ["❤️", "🧡", "💛", "💚", "💙", "💜", "🖤", "🤍", "🤎", "💔", "❣️", "💕", "💞", "💓", "💗", "💖", "💘", "💝", "💟"]
    },
    objects: {
      name: "Objects",
      emojis: ["🎉", "🎊", "🎈", "🎁", "🏆", "🥇", "🥈", "🥉", "⭐", "🌟", "💫", "✨", "🔥", "💯", "💢", "💥", "💦", "💨", "🕳️", "💣", "💬", "👁️‍🗨️", "🗨️", "🗯️", "💭", "💤"]
    }
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-3 w-80 max-h-64 overflow-hidden">
      {/* Category tabs */}
      <div className="flex gap-1 mb-3 border-b border-gray-200 pb-2">
        {Object.entries(emojiCategories).map(([key, category]) => (
          <button
            key={key}
            onClick={() => setActiveCategory(key)}
            className={`px-3 py-1 text-xs rounded transition-colors ${
              activeCategory === key
                ? "bg-purple-100 text-purple-700"
                : "text-gray-600 hover:bg-gray-100"
            }`}
          >
            {category.name.split(" ")[0]}
          </button>
        ))}
      </div>

      {/* Emoji grid */}
      <div className="grid grid-cols-8 gap-1 max-h-40 overflow-y-auto">
        {emojiCategories[activeCategory].emojis.map((emoji, index) => (
          <button
            key={index}
            onClick={() => onEmojiSelect(emoji)}
            className="w-8 h-8 flex items-center justify-center text-lg hover:bg-gray-100 rounded transition-colors"
            title={emoji}
          >
            {emoji}
          </button>
        ))}
      </div>
    </div>
  );
};

export default EmojiPicker;