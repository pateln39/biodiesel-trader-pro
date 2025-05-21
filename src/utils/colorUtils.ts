
/**
 * Utility functions for color operations
 */

// Updated color palette with more distinct visual patterns, not just colors
export const GROUP_COLORS = [
  'bg-purple-500/20 ring-purple-400/30 border-purple-400/30 border-solid', // Default purple
  'bg-amber-500/20 ring-amber-400/30 border-amber-400/30 border-dashed',    // Warm amber
  'bg-emerald-500/20 ring-emerald-400/30 border-emerald-400/30 border-dotted', // Green
  'bg-sky-500/20 ring-sky-400/30 border-sky-400/30 border-double',          // Blue
  'bg-rose-500/20 ring-rose-400/30 border-rose-400/30 border-solid',       // Red/Pink
  'bg-lime-500/20 ring-lime-400/30 border-lime-400/30 border-dashed',       // Lime green
  'bg-orange-500/20 ring-orange-400/30 border-orange-400/30 border-dotted', // Orange
  'bg-cyan-500/20 ring-cyan-400/30 border-cyan-400/30 border-double',       // Cyan
];

// Border patterns for additional visual distinction
export const GROUP_BORDER_PATTERNS = [
  'border-solid',
  'border-dashed',
  'border-dotted',
  'border-double',
  'border-solid',
  'border-dashed',
  'border-dotted',
  'border-double'
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

/**
 * Get a number from 1-8 assigned to this group (for labeling purposes)
 * @param groupId Group UUID 
 * @returns Number from 1-8
 */
export const getGroupNumber = (groupId: string | null | undefined): number => {
  if (!groupId) return 1;
  
  const colorIndex = getGroupColorIndex(groupId);
  return colorIndex + 1; // Make 1-based instead of 0-based
};

/**
 * Generate a map of group IDs to help track which movement belongs to which group
 * @param movements Array of movements that may contain group IDs
 * @returns Object mapping group IDs to their assigned number (1-8)
 */
export const generateGroupMap = (movements: any[]): Record<string, number> => {
  const groupMap: Record<string, number> = {};
  let nextGroupNumber = 1;
  
  movements.forEach(movement => {
    if (movement.group_id && !groupMap[movement.group_id]) {
      groupMap[movement.group_id] = nextGroupNumber;
      nextGroupNumber = (nextGroupNumber % 8) + 1; // Cycle through 1-8
    }
  });
  
  return groupMap;
};

