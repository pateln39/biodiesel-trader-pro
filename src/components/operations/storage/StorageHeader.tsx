
import React from 'react';
import { Wrench, Filter } from "lucide-react";
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface Props {
  onMaintenance: () => void;
}

const StorageHeader: React.FC<Props> = ({ onMaintenance }) => (
  <div className="flex justify-between items-center mb-6">
    <h1 className="text-3xl font-bold tracking-tight">Storage Management</h1>
    <div className="flex items-center space-x-2">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className="mr-2">
            <Wrench className="h-4 w-4 mr-1" />
            Maintenance
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={onMaintenance}>
            <Wrench className="h-4 w-4 mr-2" />
            Cleanup Tank Data
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <Filter className="h-5 w-5 text-muted-foreground" />
      <span className="text-sm text-muted-foreground">Filter</span>
    </div>
  </div>
);

export default StorageHeader;
