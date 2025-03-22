
// This is a legacy file redirecting to the new modular implementation
// We should gradually migrate all imports to use the core implementation directly
import { useReferenceData as coreUseReferenceData } from '@/core/hooks/useReferenceData';

// Re-export the core implementation to maintain backward compatibility
export const useReferenceData = coreUseReferenceData;
