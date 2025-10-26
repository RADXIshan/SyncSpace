const TypingIndicator = ({ users }) => {
  if (!users || users.length === 0) return null;

  const getTypingText = () => {
    if (users.length === 1) {
      return `${users[0].userName} is typing...`;
    } else if (users.length === 2) {
      return `${users[0].userName} and ${users[1].userName} are typing...`;
    } else if (users.length === 3) {
      return `${users[0].userName}, ${users[1].userName}, and ${users[2].userName} are typing...`;
    } else {
      return "Many people are typing...";
    }
  };

  return (
    <div className="flex items-center gap-3 px-4 py-2 bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-xl shadow-sm transition-all duration-300 ease-in-out animate-in slide-in-from-bottom-2">
      <div className="flex items-center gap-3">
        <div className="flex gap-1 bg-white rounded-full px-2 py-1 shadow-sm border border-purple-200">
          <div className="w-1.5 h-1.5 bg-purple-500 rounded-full animate-bounce"></div>
          <div className="w-1.5 h-1.5 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: "0.1s" }}></div>
          <div className="w-1.5 h-1.5 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: "0.2s" }}></div>
        </div>
        <span className="text-xs text-purple-700 font-medium">
          {getTypingText()}
        </span>
      </div>
    </div>
  );
};

export default TypingIndicator;