// Dynamic role color system
export const roleColors = [
  { background: 'bg-blue-500/20', border: 'border-blue-400', text: 'text-blue-200' },
  { background: 'bg-green-500/20', border: 'border-green-400', text: 'text-green-200' },
  { background: 'bg-purple-500/20', border: 'border-purple-400', text: 'text-purple-200' },
  { background: 'bg-pink-500/20', border: 'border-pink-400', text: 'text-pink-200' },
  { background: 'bg-indigo-500/20', border: 'border-indigo-400', text: 'text-indigo-200' },
  { background: 'bg-teal-500/20', border: 'border-teal-400', text: 'text-teal-200' },
  { background: 'bg-cyan-500/20', border: 'border-cyan-400', text: 'text-cyan-200' },
  { background: 'bg-emerald-500/20', border: 'border-emerald-400', text: 'text-emerald-200' },
  { background: 'bg-lime-500/20', border: 'border-lime-400', text: 'text-lime-200' },
  { background: 'bg-amber-500/20', border: 'border-amber-400', text: 'text-amber-200' },
  { background: 'bg-orange-500/20', border: 'border-orange-400', text: 'text-orange-200' },
  { background: 'bg-red-500/20', border: 'border-red-400', text: 'text-red-200' },
  { background: 'bg-rose-500/20', border: 'border-rose-400', text: 'text-rose-200' },
  { background: 'bg-fuchsia-500/20', border: 'border-fuchsia-400', text: 'text-fuchsia-200' },
  { background: 'bg-violet-500/20', border: 'border-violet-400', text: 'text-violet-200' },
  { background: 'bg-sky-500/20', border: 'border-sky-400', text: 'text-sky-200' },
];

// Generate consistent hash for role names
export const generateRoleHash = (role) => {
  let hash = 0;
  for (let i = 0; i < role.length; i++) {
    hash = ((hash << 5) - hash + role.charCodeAt(i)) & 0xffffffff;
  }
  return Math.abs(hash);
};

// Get role-specific styling with dynamic colors
export const getRoleStyle = (role) => {
  if (!role) return { background: 'bg-gray-500/20', border: 'border-gray-400', text: 'text-gray-300' };
  
  // Special case for Creator role
  if (role.toLowerCase() === 'creator') {
    return { 
      background: 'bg-gradient-to-r from-yellow-500/25 to-orange-500/25', 
      border: 'border-yellow-400', 
      text: 'text-yellow-200'
    };
  }
  
  // Generate consistent color for other roles
  const hash = generateRoleHash(role.toLowerCase());
  const colorIndex = hash % roleColors.length;
  return roleColors[colorIndex];
};
