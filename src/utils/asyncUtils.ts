
/**
 * Creates a promise that resolves after the specified delay
 * @param ms Milliseconds to delay
 * @returns Promise that resolves after the delay
 */
export const delay = (ms: number): Promise<void> => {
  return new Promise(resolve => setTimeout(resolve, ms));
};

/**
 * Executes an operation with a controlled refresh afterwards
 * @param operation Function to execute
 * @param refreshFn Optional function to call after delay
 * @param delayMs Milliseconds to wait before refresh (default: 300ms)
 */
export const executeWithRefresh = async (
  operation: () => Promise<any>,
  refreshFn?: () => void,
  delayMs = 300
): Promise<void> => {
  try {
    // Execute the main operation
    await operation();
    
    // Wait for a short delay to allow DB operations to complete
    await delay(delayMs);
    
    // Execute refresh function if provided
    if (refreshFn) {
      refreshFn();
    }
  } catch (error) {
    // Re-throw the error to be handled by the caller
    throw error;
  }
};
