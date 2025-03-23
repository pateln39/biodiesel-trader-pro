
import React from 'react';
import { Progress } from '@/components/ui/progress';

interface DeleteProgressIndicatorProps {
  isDeleting: boolean;
  deletingId: string;
  progress: number;
}

const DeleteProgressIndicator: React.FC<DeleteProgressIndicatorProps> = ({
  isDeleting,
  deletingId,
  progress,
}) => {
  if (!isDeleting) return null;

  return (
    <div className="mb-4">
      <p className="text-sm text-muted-foreground mb-1">
        Deleting {deletingId}... Please wait
      </p>
      <Progress value={progress} className="h-2" />
    </div>
  );
};

export default DeleteProgressIndicator;
