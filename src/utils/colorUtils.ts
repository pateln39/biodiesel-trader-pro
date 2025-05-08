
/**
 * Utility functions for color operations
 */

// Updated color palette with more distinct colors across different hues
export const GROUP_COLORS = [
  'bg-purple-500/20 ring-purple-400/30 border-purple-400/30', // Default purple
  'bg-amber-500/20 ring-amber-400/30 border-amber-400/30',    // Warm amber
  'bg-emerald-500/20 ring-emerald-400/30 border-emerald-400/30', // Green
  'bg-sky-500/20 ring-sky-400/30 border-sky-400/30',          // Blue
  'bg-rose-500/20 ring-rose-400/30 border-rose-400/30',       // Red/Pink
  'bg-lime-500/20 ring-lime-400/30 border-lime-400/30',       // Lime green
  'bg-orange-500/20 ring-orange-400/30 border-orange-400/30', // Orange
  'bg-cyan-500/20 ring-cyan-400/30 border-cyan-400/30',       // Cyan
];

/**
 * Generates a deterministic index for a group ID to map to a color
 * @param groupId UUID string
 * @returns Index to use in the GROUP_COLORS array
 */
export const getGroupColorIndex = (groupId: string | null | undefined): number => {
  if (!groupId) return 0;
  
  // Simple hash function to convert groupId to a number
  let hash = 0;
  for (let i = 0; i < groupId.length; i++) {
    const char = groupId.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0; // Convert to 32bit integer
  }
  
  // Ensure positive value and map to color array index
  const positiveHash = Math.abs(hash);
  return positiveHash % GROUP_COLORS.length;
};

/**
 * Returns CSS classes for a group based on its ID
 * @param groupId Group UUID
 * @returns Tailwind CSS classes for the group's color theme
 */
export const getGroupColorClasses = (groupId: string | null | undefined): string => {
  if (!groupId) return GROUP_COLORS[0];
  
  const colorIndex = getGroupColorIndex(groupId);
  return GROUP_COLORS[colorIndex];
};
