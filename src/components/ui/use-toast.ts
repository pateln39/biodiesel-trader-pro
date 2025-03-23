
// Redirect to Sonner toast for consistency
import { toast } from "sonner";

export { toast };

// For backward compatibility with any existing useToast references
export const useToast = () => {
  return {
    toast,
    dismiss: () => {}
  };
};
