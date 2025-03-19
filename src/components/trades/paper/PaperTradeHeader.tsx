
import React from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useCreateBroker } from '@/hooks/useCreateBroker';

interface PaperTradeHeaderProps {
  comment: string;
  setComment: (comment: string) => void;
  selectedBroker: string;
  setSelectedBroker: (broker: string) => void;
  brokers: { id: string; name: string }[];
}

export const PaperTradeHeader: React.FC<PaperTradeHeaderProps> = ({
  comment,
  setComment,
  selectedBroker,
  setSelectedBroker,
  brokers
}) => {
  const { newBroker, setNewBroker, createBroker, isCreating } = useCreateBroker();
  
  const handleAddBroker = async () => {
    const createdBroker = await createBroker();
    if (createdBroker) {
      setSelectedBroker(createdBroker.name);
    }
  };
  
  return (
    <div className="grid grid-cols-1 gap-6">
      <div className="space-y-2">
        <Label htmlFor="comment">Comment</Label>
        <Input
          id="comment"
          placeholder="Add optional trade comment"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
        />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="broker">Broker</Label>
        <div className="flex gap-2">
          <Select
            value={selectedBroker}
            onValueChange={setSelectedBroker}
          >
            <SelectTrigger id="broker" className="flex-1">
              <SelectValue placeholder="Select broker" />
            </SelectTrigger>
            <SelectContent>
              {brokers.map((broker) => (
                <SelectItem key={broker.id} value={broker.name}>
                  {broker.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <div className="flex items-center gap-2">
            <Input
              placeholder="New broker name"
              value={newBroker}
              onChange={(e) => setNewBroker(e.target.value)}
              className="w-36"
            />
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={handleAddBroker}
              disabled={isCreating || !newBroker.trim()}
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
