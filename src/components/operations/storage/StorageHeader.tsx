
import React from 'react';
import { Filter } from 'lucide-react';

interface StorageHeaderProps {
  title: string;
}

const StorageHeader: React.FC<StorageHeaderProps> = ({ title }) => {
  return (
    <div className="flex justify-between items-center mb-6">
      <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
      <div className="flex items-center space-x-2">
        <Filter className="h-5 w-5 text-muted-foreground" />
        <span className="text-sm text-muted-foreground">Filter</span>
      </div>
    </div>
  );
};

export default StorageHeader;
