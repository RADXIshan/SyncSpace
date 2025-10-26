const TypingIndicator = ({ users }) => {
  if (!users || users.length === 0) return null;

  const getTypingText = () => {
    if (users.length === 1) {
      return `${users[0].userName} is typing...`;
    } else if (users.length === 2) {
      return `${users[0].userName} and ${users[1].userName} are typing...`;
    } else {
      return `${users[0].userName} and ${users.length - 1} others are typing...`;
    }
  };

  return (
    <div className="flex items-center gap-3 px-4 py-3 bg-gray-50 rounded-2xl mb-4 shadow-sm">
      <div className="w-10 flex-shrink-0"></div>
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex gap-1 bg-white rounded-full px-3 py-2 shadow-sm">
          <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce"></div>
          <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: "0.1s" }}></div>
          <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: "0.2s" }}></div>
        </div>
        <span className="text-sm text-gray-600 font-medium">
          {getTypingText()}
        </span>
      </div>
    </div>
  );
};

export default TypingIndicator;