import { AtSign } from "lucide-react";

const MentionsList = ({ members, query, onSelect }) => {
  // Filter members based on query
  const filteredMembers = members.filter(member =>
    member.name.toLowerCase().includes(query.toLowerCase())
  ).slice(0, 5); // Limit to 5 suggestions

  if (filteredMembers.length === 0) return null;

  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-lg py-2 max-h-48 overflow-y-auto">
      {filteredMembers.map((member) => (
        <button
          key={member.user_id}
          onClick={() => onSelect(member)}
          className="w-full flex items-center gap-3 px-4 py-2 hover:bg-gray-100 transition-colors text-left"
        >
          {member.user_photo ? (
            <img
              src={member.user_photo}
              alt={member.name}
              className="w-8 h-8 rounded-full object-cover border border-gray-200"
            />
          ) : (
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-600 to-indigo-600 flex items-center justify-center text-white font-bold text-sm">
              {member.name.charAt(0)}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <div className="font-medium text-gray-900 truncate">
              {member.name}
            </div>
            {member.role && (
              <div className="text-xs text-gray-500 truncate">
                {member.role}
              </div>
            )}
          </div>
          <AtSign size={16} className="text-gray-400" />
        </button>
      ))}
    </div>
  );
};

export default MentionsList;