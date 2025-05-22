
import React, { useState } from 'react';
import { Check } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ContractStatus } from '@/types';

interface ContractStatusSelectProps {
  tradeId: string;
  legId: string;
  initialValue?: ContractStatus;
}

const ContractStatusSelect: React.FC<ContractStatusSelectProps> = ({
  tradeId,
  legId,
  initialValue,
}) => {
  const [status, setStatus] = useState<ContractStatus | undefined>(initialValue);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleStatusChange = async (newStatus: ContractStatus) => {
    setStatus(newStatus);
    setIsLoading(true);
    
    try {
      const { error } = await supabase
        .from('trade_legs')
        .update({ contract_status: newStatus })
        .eq('id', legId);
        
      if (error) {
        console.error('Error updating contract status:', error);
        toast({
          title: 'Failed to update status',
          description: error.message,
          variant: 'destructive',
        });
        // Revert to original value if there was an error
        setStatus(initialValue);
      } else {
        toast({
          title: 'Status updated',
          description: `Contract status set to ${newStatus}`,
        });
      }
    } catch (err) {
      console.error('Exception when updating contract status:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Using null as a fallback value instead of undefined
  const currentStatus = status || "not_set";

  return (
    <Select 
      value={currentStatus} 
      onValueChange={(value: string) => handleStatusChange(value as ContractStatus)}
      disabled={isLoading}
    >
      <SelectTrigger className="w-full text-xs h-8 px-2">
        <SelectValue placeholder="Select status" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="sent" className="text-xs">
          <div className="flex items-center">
            {status === 'sent' && <Check className="mr-2 h-3 w-3" />}
            Sent
          </div>
        </SelectItem>
        <SelectItem value="in process" className="text-xs">
          <div className="flex items-center">
            {status === 'in process' && <Check className="mr-2 h-3 w-3" />}
            In Process
          </div>
        </SelectItem>
        <SelectItem value="action needed" className="text-xs">
          <div className="flex items-center">
            {status === 'action needed' && <Check className="mr-2 h-3 w-3" />}
            Action Needed
          </div>
        </SelectItem>
        <SelectItem value="not_set" className="text-xs">
          <div className="flex items-center">
            {status === undefined && <Check className="mr-2 h-3 w-3" />}
            Not Set
          </div>
        </SelectItem>
      </SelectContent>
    </Select>
  );
};

export default ContractStatusSelect;
