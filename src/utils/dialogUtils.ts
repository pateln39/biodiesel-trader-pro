
/**
 * Utility for safely canceling dialog operations
 * Ensures proper cleanup of timers and state
 */
export const safelyCloseDialog = (
  setIsDeleting: (value: boolean) => void,
  setDeletionProgress: (value: number) => void,
  setShowConfirmation: (value: boolean) => void,
  setItemDetails: (value: any) => void,
  progressTimerRef: React.MutableRefObject<ReturnType<typeof setTimeout> | null>,
  defaultDetails = { id: '', reference: '' }
) => {
  // First clean up any timers
  if (progressTimerRef.current) {
    clearInterval(progressTimerRef.current);
    progressTimerRef.current = null;
  }
  
  // Use requestAnimationFrame to coordinate with browser's rendering cycle
  // This helps ensure we're not fighting with React's own scheduling
  requestAnimationFrame(() => {
    // Update state in a specific sequence to avoid race conditions
    setIsDeleting(false);
    setDeletionProgress(0);
    
    // Use a single animation frame to coordinate state updates with UI
    requestAnimationFrame(() => {
      // This ensures dialog closing animation has started before we reset other states
      setShowConfirmation(false);
      
      // After dialog is closed, reset item details
      // Wait for Radix UI's animation duration (300ms) to complete
      setTimeout(() => {
        setItemDetails(defaultDetails);
      }, 300);
    });
  });
};
