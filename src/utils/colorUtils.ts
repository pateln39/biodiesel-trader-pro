
/**
 * Utility functions for color operations
 */

// Color palette for group backgrounds (soft purples with varying hues)
export const GROUP_COLORS = [
  'bg-purple-500/20 ring-purple-400/30 border-purple-400/30', // Default purple
  'bg-indigo-500/20 ring-indigo-400/30 border-indigo-400/30',
  'bg-blue-500/20 ring-blue-400/30 border-blue-400/30',
  'bg-violet-500/20 ring-violet-400/30 border-violet-400/30',
  'bg-fuchsia-500/20 ring-fuchsia-400/30 border-fuchsia-400/30',
  'bg-pink-500/20 ring-pink-400/30 border-pink-400/30',
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

