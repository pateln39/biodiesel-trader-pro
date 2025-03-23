// Import from the original location src/components/pricing/PriceUploader.tsx
// Update imports to use the new module structure
import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from 'sonner';
import { Loader2, AlertCircle, CheckCircle2, Upload, X } from 'lucide-react';
import { formatDateString, parseExcelDateSerial } from '@/core/utils/dateParsingUtils';
import { read, utils } from 'xlsx';
import { supabase } from '@/integrations/supabase/client';

interface UploadedPrice {
  date: string;
  instrument: string;
  price: number;
}

const PriceUploader = () => {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [previewData, setPreviewData] = useState<UploadedPrice[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setUploadSuccess(false);
      setUploadError(null);
      setPreviewData([]);

      const reader = new FileReader();
      reader.onload = (event: ProgressEvent<FileReader>) => {
        const fileData = event.target?.result;
        if (typeof fileData === 'string') {
          try {
            const workbook = read(fileData, { type: 'binary' });
            const sheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[sheetName];
            const jsonData: any[] = utils.sheet_to_json(worksheet, { header: 1 });

            if (!jsonData || jsonData.length < 2) {
              setUploadError('The file is empty or does not contain enough data.');
              return;
            }

            const headers = jsonData[0] as string[];
            if (!headers.includes('Date') || !headers.includes('Instrument') || !headers.includes('Price')) {
              setUploadError('The file must contain columns named "Date", "Instrument", and "Price".');
              return;
            }

            const parsedData: UploadedPrice[] = [];
            for (let i = 1; i < jsonData.length; i++) {
              const row = jsonData[i] as any[];
              if (row.length !== headers.length) {
                console.warn(`Row ${i + 1} has an unexpected number of columns and will be skipped.`);
                continue;
              }

              const rowData: { [key: string]: any } = {};
              for (let j = 0; j < headers.length; j++) {
                rowData[headers[j]] = row[j];
              }

              let dateValue = rowData['Date'];
              if (typeof dateValue === 'number') {
                dateValue = formatDateString(parseExcelDateSerial(dateValue));
              } else if (dateValue instanceof Date) {
                dateValue = formatDateString(dateValue);
              } else {
                dateValue = formatDateString(new Date(dateValue));
              }

              const instrument = rowData['Instrument'];
              const price = parseFloat(rowData['Price']);

              if (!dateValue || isNaN(price) || !instrument) {
                console.warn(`Row ${i + 1} has invalid data and will be skipped.`);
                continue;
              }

              parsedData.push({
                date: dateValue,
                instrument: String(instrument),
                price: price,
              });
            }

            setPreviewData(parsedData);
          } catch (parseError: any) {
            console.error('Error parsing Excel file:', parseError);
            setUploadError('Failed to parse Excel file. Make sure it is a valid .xlsx file.');
          }
        } else {
          setUploadError('Failed to read file.');
        }
      };

      reader.onerror = () => {
        setUploadError('Failed to read file.');
      };

      reader.readAsBinaryString(selectedFile);
    }
  };

  const handleUpload = async () => {
    if (!file || previewData.length === 0) {
      toast.error('No file selected or no data to upload.');
      return;
    }

    setUploading(true);
    setUploadSuccess(false);
    setUploadError(null);

    try {
      const { data: instruments, error: instrumentsError } = await supabase
        .from('pricing_instruments')
        .select('instrument_code')

      if (instrumentsError) {
        throw new Error(`Failed to fetch valid instruments: ${instrumentsError.message}`);
      }

      const validInstruments = instruments.map(i => i.instrument_code);

      for (const priceData of previewData) {
        if (!validInstruments.includes(priceData.instrument)) {
          throw new Error(`Instrument "${priceData.instrument}" is not a valid instrument.`);
        }

        const { data, error } = await supabase
          .from('prices')
          .upsert([
            {
              instrument: priceData.instrument,
              date: priceData.date,
              price: priceData.price,
            },
          ], { onConflict: 'instrument, date' });

        if (error) {
          throw new Error(`Failed to upload price for ${priceData.instrument} on ${priceData.date}: ${error.message}`);
        }
      }

      setUploadSuccess(true);
      toast.success('Prices uploaded successfully!');
    } catch (error: any) {
      console.error('Upload error:', error.message);
      setUploadError(error.message);
      toast.error(`Upload failed: ${error.message}`);
    } finally {
      setUploading(false);
    }
  };

  const handleClearFile = () => {
    setFile(null);
    setPreviewData([]);
    setUploadSuccess(false);
    setUploadError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Upload Prices</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="price-file">Select Excel File (.xlsx)</Label>
          <Input
            type="file"
            id="price-file"
            accept=".xlsx"
            onChange={handleFileChange}
            disabled={uploading}
            ref={fileInputRef}
          />
        </div>

        {file && (
          <div className="space-y-2">
            <Label>File Preview</Label>
            {previewData.length > 0 ? (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Instrument</TableHead>
                      <TableHead>Price</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {previewData.map((item, index) => (
                      <TableRow key={index}>
                        <TableCell>{item.date}</TableCell>
                        <TableCell>{item.instrument}</TableCell>
                        <TableCell>{item.price}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : uploadError ? (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{uploadError}</AlertDescription>
              </Alert>
            ) : (
              <div className="flex items-center space-x-2">
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                <p className="text-sm text-muted-foreground">Parsing file...</p>
              </div>
            )}
          </div>
        )}

        {uploadSuccess && (
          <Alert variant="success">
            <CheckCircle2 className="h-4 w-4" />
            <AlertTitle>Success</AlertTitle>
            <AlertDescription>Prices uploaded successfully!</AlertDescription>
          </Alert>
        )}

        {uploadError && !previewData && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{uploadError}</AlertDescription>
          </Alert>
        )}

        <div className="flex justify-end space-x-2">
          {file && (
            <Button type="button" variant="secondary" onClick={handleClearFile} disabled={uploading}>
              <X className="h-4 w-4 mr-2" />
              Clear File
            </Button>
          )}
          <Button type="button" onClick={handleUpload} disabled={uploading || previewData.length === 0}>
            {uploading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                <Upload className="mr-2 h-4 w-4" />
                Upload Prices
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default PriceUploader;
