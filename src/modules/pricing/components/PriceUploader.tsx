
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { uploadPriceData } from '@/modules/pricing/utils/priceUploadUtils';

interface PriceData {
  instrument: string;
  date: string;
  price: number;
}

const PriceUploader: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [selectedInstrument, setSelectedInstrument] = useState<string>('');

  // Fetch available instruments
  const { data: instruments, isLoading } = useQuery({
    queryKey: ['instruments'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('pricing_instruments')
        .select('instrument_code, display_name');

      if (error) {
        throw new Error(`Error fetching instruments: ${error.message}`);
      }

      return data || [];
    }
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
    }
  };

  const handleInstrumentChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedInstrument(e.target.value);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!file) {
      toast.error('Please select a file to upload');
      return;
    }

    if (!selectedInstrument) {
      toast.error('Please select an instrument');
      return;
    }

    setIsUploading(true);

    try {
      // This is a simplified example - you would normally parse CSV or Excel file
      // For demonstration, we'll create some mock data based on the file name
      const mockData: PriceData[] = [];
      
      // Generate mock data for the last 10 days
      const today = new Date();
      for (let i = 0; i < 10; i++) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        
        mockData.push({
          instrument: selectedInstrument,
          date: date.toISOString().split('T')[0],
          price: 500 + Math.random() * 100 // Random price between 500 and 600
        });
      }

      // Upload the prices
      const success = await uploadPriceData(mockData);
      
      if (success) {
        setFile(null);
        setSelectedInstrument('');
        // Reset the file input by clearing its value
        const fileInput = document.getElementById('price-file') as HTMLInputElement;
        if (fileInput) {
          fileInput.value = '';
        }
      }
    } catch (error: any) {
      console.error('Error uploading price data:', error);
      toast.error('Failed to upload price data', {
        description: error.message || 'Unknown error'
      });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Upload Price Data</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="instrument">Instrument</Label>
              <select
                id="instrument"
                className="w-full p-2 border rounded"
                value={selectedInstrument}
                onChange={handleInstrumentChange}
                disabled={isLoading || isUploading}
              >
                <option value="">Select Instrument</option>
                {instruments?.map((inst: any) => (
                  <option key={inst.instrument_code} value={inst.instrument_code}>
                    {inst.display_name}
                  </option>
                ))}
              </select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="price-file">Price File (CSV/Excel)</Label>
              <Input
                id="price-file"
                type="file"
                accept=".csv,.xlsx,.xls"
                onChange={handleFileChange}
                disabled={isUploading}
              />
              <p className="text-sm text-gray-500">
                File should contain columns for date and price
              </p>
            </div>
            <Button type="submit" disabled={isUploading || !file || !selectedInstrument}>
              {isUploading ? 'Uploading...' : 'Upload Prices'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export default PriceUploader;
