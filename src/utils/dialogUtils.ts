
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
  
  // Use a set timeout to ensure animations complete
  // Update state in a specific sequence to avoid race conditions
  setTimeout(() => {
    setIsDeleting(false);
    setDeletionProgress(0);
    
    // Use nested timeouts to better coordinate with UI animations
    setTimeout(() => {
      setShowConfirmation(false);
      
      // Reset item details last
      setTimeout(() => {
        setItemDetails(defaultDetails);
      }, 100);
    }, 50);
  }, 10);
};
