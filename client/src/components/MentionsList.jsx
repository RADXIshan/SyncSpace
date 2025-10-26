import { AtSign } from "lucide-react";

const MentionsList = ({ members, query, selectedIndex = 0, onSelect }) => {
  console.log("🎯 MentionsList rendering:", { membersCount: members.length, query, selectedIndex });
  
  // Filter and sort members based on query
  let filteredMembers;
  
  if (!query || query.trim() === '') {
    // If no query, show all members alphabetically
    filteredMembers = [...members].sort((a, b) => a.name.localeCompare(b.name));
  } else {
    // Filter based on query and prioritize matches
    const queryLower = query.toLowerCase();
    filteredMembers = members
      .filter(member => member.name.toLowerCase().includes(queryLower))
      .sort((a, b) => {
        const aName = a.name.toLowerCase();
        const bName = b.name.toLowerCase();
        
        // Prioritize exact matches at the start
        const aStartsWith = aName.startsWith(queryLower);
        const bStartsWith = bName.startsWith(queryLower);
        
        if (aStartsWith && !bStartsWith) return -1;
        if (!aStartsWith && bStartsWith) return 1;
        
        // Then alphabetical order
        return aName.localeCompare(bName);
      });
  }
  
  // Limit to 8 suggestions for better UX
  filteredMembers = filteredMembers.slice(0, 8);

  if (filteredMembers.length === 0) {
    if (members.length === 0) {
      return (
        <div className="bg-white border border-gray-200 rounded-2xl shadow-2xl py-4 px-4 backdrop-blur-sm">
          <div className="text-center text-gray-500">
            Loading members...
          </div>
        </div>
      );
    } else {
      return (
        <div className="bg-white border border-gray-200 rounded-2xl shadow-2xl py-4 px-4 backdrop-blur-sm">
          <div className="text-center text-gray-500">
            No members matching "{query}"
          </div>
        </div>
      );
    }
  }

  return (
    <div className="bg-white border-4 border-blue-500 rounded-2xl shadow-2xl py-2 max-h-64 overflow-y-auto backdrop-blur-sm">
      <div className="px-4 py-2 text-xs font-semibold text-blue-600 uppercase tracking-wide border-b border-blue-200 bg-blue-50">
        {query ? `Matching "${query}"` : 'All Members'} ({filteredMembers.length})
      </div>
      {filteredMembers.map((member, index) => (
        <button
          key={member.user_id}
          onClick={() => onSelect(member)}
          className={`w-full flex items-center gap-3 px-4 py-3 transition-all duration-200 text-left ${
            index === selectedIndex 
              ? "bg-gradient-to-r from-purple-100 to-blue-100 text-purple-900 border-l-4 border-purple-500" 
              : "hover:bg-gray-50 hover:translate-x-1"
          }`}
        >
          {member.user_photo ? (
            <img
              src={member.user_photo}
              alt={member.name}
              className="w-10 h-10 rounded-full object-cover border-2 border-white shadow-md"
            />
          ) : (
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-600 to-indigo-600 flex items-center justify-center text-white font-bold text-sm shadow-md">
              {member.name.charAt(0)}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <div className="font-semibold text-gray-900 truncate">
              {member.name}
            </div>
            {member.role && (
              <div className="text-xs text-gray-500 truncate capitalize">
                {member.role}
              </div>
            )}
          </div>
          <AtSign size={16} className={`${index === selectedIndex ? 'text-purple-500' : 'text-gray-400'} transition-colors`} />
        </button>
      ))}
    </div>
  );
};

export default MentionsList;