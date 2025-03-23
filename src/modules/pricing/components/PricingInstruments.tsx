import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Pencil, Plus, Search } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

type PricingInstrument = {
  id: string;
  instrument_code: string;
  display_name: string;
  description: string | null;
  category: string | null;
  is_active: boolean;
};

const PricingInstruments = () => {
  const [instruments, setInstruments] = useState<PricingInstrument[]>([]);
  const [filteredInstruments, setFilteredInstruments] = useState<PricingInstrument[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [currentInstrument, setCurrentInstrument] = useState<Partial<PricingInstrument> | null>(null);
  
  const fetchInstruments = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('pricing_instruments')
        .select('*')
        .order('display_name');
      
      if (error) throw error;
      setInstruments(data || []);
      setFilteredInstruments(data || []);
    } catch (error: any) {
      console.error('Error fetching instruments:', error.message);
      toast.error('Failed to load pricing instruments');
    } finally {
      setIsLoading(false);
    }
  };
  
  useEffect(() => {
    fetchInstruments();
  }, []);
  
  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredInstruments(instruments);
    } else {
      const term = searchTerm.toLowerCase();
      const filtered = instruments.filter(
        instrument => 
          instrument.instrument_code.toLowerCase().includes(term) ||
          instrument.display_name.toLowerCase().includes(term) ||
          (instrument.description && instrument.description.toLowerCase().includes(term)) ||
          (instrument.category && instrument.category.toLowerCase().includes(term))
      );
      setFilteredInstruments(filtered);
    }
  }, [searchTerm, instruments]);
  
  const handleEdit = (instrument: PricingInstrument) => {
    setCurrentInstrument(instrument);
    setIsDialogOpen(true);
  };
  
  const handleAdd = () => {
    setCurrentInstrument({
      instrument_code: '',
      display_name: '',
      description: '',
      category: '',
      is_active: true
    });
    setIsDialogOpen(true);
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!currentInstrument || !currentInstrument.instrument_code || !currentInstrument.display_name) {
      toast.error('Code and name are required');
      return;
    }
    
    try {
      if (currentInstrument.id) {
        // Update existing
        const { error } = await supabase
          .from('pricing_instruments')
          .update({
            instrument_code: currentInstrument.instrument_code,
            display_name: currentInstrument.display_name,
            description: currentInstrument.description,
            category: currentInstrument.category,
            is_active: currentInstrument.is_active,
            updated_at: new Date().toISOString()
          })
          .eq('id', currentInstrument.id);
          
        if (error) throw error;
        toast.success('Instrument updated successfully');
      } else {
        // Insert new
        const { error } = await supabase
          .from('pricing_instruments')
          .insert({
            instrument_code: currentInstrument.instrument_code,
            display_name: currentInstrument.display_name,
            description: currentInstrument.description,
            category: currentInstrument.category,
            is_active: currentInstrument.is_active
          });
          
        if (error) throw error;
        toast.success('Instrument added successfully');
      }
      
      // Refresh list and close dialog
      await fetchInstruments();
      setIsDialogOpen(false);
    } catch (error: any) {
      console.error('Error saving instrument:', error.message);
      toast.error(`Failed to save: ${error.message}`);
    }
  };
  
  const handleToggleActive = async (instrument: PricingInstrument) => {
    try {
      const { error } = await supabase
        .from('pricing_instruments')
        .update({ 
          is_active: !instrument.is_active,
          updated_at: new Date().toISOString()
        })
        .eq('id', instrument.id);
        
      if (error) throw error;
      
      // Update local state
      setInstruments(instruments.map(item => 
        item.id === instrument.id 
          ? { ...item, is_active: !item.is_active } 
          : item
      ));
      
      toast.success(`Instrument ${instrument.is_active ? 'deactivated' : 'activated'}`);
    } catch (error: any) {
      console.error('Error updating instrument status:', error.message);
      toast.error('Failed to update instrument status');
    }
  };
  
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search" 
            placeholder="Search instruments..."
            className="pl-8 w-[300px]"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <Button onClick={handleAdd}>
          <Plus className="mr-2 h-4 w-4" />
          Add Instrument
        </Button>
      </div>
      
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Code</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-[100px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredInstruments.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-4 text-muted-foreground">
                  {isLoading ? 'Loading instruments...' : 'No instruments found'}
                </TableCell>
              </TableRow>
            ) : (
              filteredInstruments.map((instrument) => (
                <TableRow key={instrument.id}>
                  <TableCell className="font-mono">{instrument.instrument_code}</TableCell>
                  <TableCell>{instrument.display_name}</TableCell>
                  <TableCell>{instrument.category || '—'}</TableCell>
                  <TableCell className="max-w-[300px] truncate">
                    {instrument.description || '—'}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <Switch
                        checked={instrument.is_active}
                        onCheckedChange={() => handleToggleActive(instrument)}
                        aria-label="Toggle active state"
                      />
                      <span className={instrument.is_active ? 'text-green-600' : 'text-muted-foreground'}>
                        {instrument.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => handleEdit(instrument)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
      
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <form onSubmit={handleSubmit}>
            <DialogHeader>
              <DialogTitle>
                {currentInstrument?.id ? 'Edit Instrument' : 'Add New Instrument'}
              </DialogTitle>
              <DialogDescription>
                {currentInstrument?.id 
                  ? 'Update the details for this pricing instrument' 
                  : 'Add a new pricing instrument to the system'}
              </DialogDescription>
            </DialogHeader>
            
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="instrument-code" className="text-right">
                  Code
                </Label>
                <Input
                  id="instrument-code"
                  value={currentInstrument?.instrument_code || ''}
                  onChange={(e) => setCurrentInstrument({
                    ...currentInstrument!,
                    instrument_code: e.target.value
                  })}
                  className="col-span-3"
                  required
                />
              </div>
              
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="display-name" className="text-right">
                  Name
                </Label>
                <Input
                  id="display-name"
                  value={currentInstrument?.display_name || ''}
                  onChange={(e) => setCurrentInstrument({
                    ...currentInstrument!,
                    display_name: e.target.value
                  })}
                  className="col-span-3"
                  required
                />
              </div>
              
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="category" className="text-right">
                  Category
                </Label>
                <Select
                  value={currentInstrument?.category || ''}
                  onValueChange={(value) => setCurrentInstrument({
                    ...currentInstrument!,
                    category: value
                  })}
                >
                  <SelectTrigger className="col-span-3" id="category">
                    <SelectValue placeholder="Select a category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">None</SelectItem>
                    <SelectItem value="Biodiesel">Biodiesel</SelectItem>
                    <SelectItem value="Feedstock">Feedstock</SelectItem>
                    <SelectItem value="Refined Products">Refined Products</SelectItem>
                    <SelectItem value="HVO">HVO</SelectItem>
                    <SelectItem value="Ethanol">Ethanol</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="description" className="text-right">
                  Description
                </Label>
                <Input
                  id="description"
                  value={currentInstrument?.description || ''}
                  onChange={(e) => setCurrentInstrument({
                    ...currentInstrument!,
                    description: e.target.value
                  })}
                  className="col-span-3"
                />
              </div>
              
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="is-active" className="text-right">
                  Active
                </Label>
                <div className="flex items-center space-x-2 col-span-3">
                  <Switch
                    id="is-active"
                    checked={currentInstrument?.is_active}
                    onCheckedChange={(checked) => setCurrentInstrument({
                      ...currentInstrument!,
                      is_active: checked
                    })}
                  />
                  <Label htmlFor="is-active" className="cursor-pointer">
                    {currentInstrument?.is_active ? 'Active' : 'Inactive'}
                  </Label>
                </div>
              </div>
            </div>
            
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">
                {currentInstrument?.id ? 'Update' : 'Create'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PricingInstruments;
