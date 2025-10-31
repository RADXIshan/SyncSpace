// Dynamic role color system with unique colors
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
  { background: 'bg-slate-500/20', border: 'border-slate-400', text: 'text-slate-200' },
  { background: 'bg-zinc-500/20', border: 'border-zinc-400', text: 'text-zinc-200' },
  { background: 'bg-stone-500/20', border: 'border-stone-400', text: 'text-stone-200' },
  { background: 'bg-neutral-500/20', border: 'border-neutral-400', text: 'text-neutral-200' },
];

// Reserved Owner role styling
const OWNER_STYLE = {
  background: 'bg-gradient-to-r from-yellow-500/25 to-orange-500/25',
  border: 'border-yellow-400',
  text: 'text-yellow-200'
};

// Store for tracking assigned colors to prevent duplicates
let assignedColors = new Map(); // role name -> color index

// Generate consistent hash for role names
export const generateRoleHash = (role) => {
  let hash = 0;
  for (let i = 0; i < role.length; i++) {
    hash = ((hash << 5) - hash + role.charCodeAt(i)) & 0xffffffff;
  }
  return Math.abs(hash);
};

// Function to get unique color assignment for roles
export const getRoleStyle = (role) => {
  if (!role) return { background: 'bg-gray-500/20', border: 'border-gray-400', text: 'text-gray-300' };
  
  const normalizedRole = role.toLowerCase();
  
  // Special case for Owner role - always gets the same reserved style
  if (normalizedRole === 'owner') {
    return OWNER_STYLE;
  }
  
  // If we already have a color assigned to this role, return it
  if (assignedColors.has(normalizedRole)) {
    const colorIndex = assignedColors.get(normalizedRole);
    return roleColors[colorIndex];
  }
  
  // Find the next available color that hasn't been used
  const usedColorIndices = new Set(Array.from(assignedColors.values()));
  let availableColorIndex = -1;
  
  // Try to find an unused color
  for (let i = 0; i < roleColors.length; i++) {
    if (!usedColorIndices.has(i)) {
      availableColorIndex = i;
      break;
    }
  }
  
  // If all colors are used, fall back to hash-based assignment with offset
  if (availableColorIndex === -1) {
    const hash = generateRoleHash(normalizedRole);
    availableColorIndex = hash % roleColors.length;
  }
  
  // Store the assignment
  assignedColors.set(normalizedRole, availableColorIndex);
  
  return roleColors[availableColorIndex];
};

// Function to initialize role colors for a set of roles (for consistency)
export const initializeRoleColors = (roles) => {
  // Clear existing assignments
  assignedColors.clear();
  
  // Sort roles to ensure consistent assignment order
  const sortedRoles = [...roles]
    .filter(role => role && role.toLowerCase() !== 'owner') // Exclude owner from assignment
    .sort((a, b) => a.toLowerCase().localeCompare(b.toLowerCase()));
  
  // Assign colors in order
  sortedRoles.forEach((role, index) => {
    if (index < roleColors.length) {
      assignedColors.set(role.toLowerCase(), index);
    }
  });
};

// Function to reset role color assignments
export const resetRoleColors = () => {
  assignedColors.clear();
};
