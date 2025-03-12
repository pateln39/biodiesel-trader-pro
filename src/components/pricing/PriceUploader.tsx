
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Loader2, UploadCloud, AlertCircle, CheckCircle2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import * as XLSX from 'xlsx';
import { format } from 'date-fns';

// Define validation error types
type ValidationError = {
  row: number;
  column: string;
  message: string;
};

// Define upload result type
type UploadResult = {
  success: boolean;
  message: string;
  errors?: ValidationError[];
  rowsProcessed?: number;
  rowsInserted?: number;
};

const PriceUploader = () => {
  const [file, setFile] = useState<File | null>(null);
  const [priceType, setPriceType] = useState<'historical' | 'forward'>('historical');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState<UploadResult | null>(null);
  const [instruments, setInstruments] = useState<any[]>([]);

  // Fetch pricing instruments on component mount
  React.useEffect(() => {
    const fetchInstruments = async () => {
      try {
        const { data, error } = await supabase
          .from('pricing_instruments')
          .select('id, instrument_code, display_name')
          .order('display_name');
        
        if (error) throw error;
        setInstruments(data || []);
      } catch (error: any) {
        console.error('Error fetching instruments:', error.message);
        toast.error('Failed to load pricing instruments');
      }
    };

    fetchInstruments();
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
      setUploadResult(null);
    }
  };

  const validateHistoricalPriceData = (data: any[]): ValidationError[] => {
    const errors: ValidationError[] = [];
    const instrumentCodes = new Set(instruments.map(i => i.instrument_code));
    const processedDates = new Map<string, Set<string>>();

    data.forEach((row, index) => {
      const rowNum = index + 2; // +2 because of 0-indexing and header row
      
      // Validate date
      if (!row.Date) {
        errors.push({ row: rowNum, column: 'Date', message: 'Missing date' });
      } else if (!(row.Date instanceof Date) || isNaN(row.Date.getTime())) {
        errors.push({ row: rowNum, column: 'Date', message: 'Invalid date format' });
      }

      // Check for each instrument column
      Object.keys(row).forEach(key => {
        if (key === 'Date') return;
        
        // Validate instrument code
        if (!instrumentCodes.has(key)) {
          errors.push({ row: rowNum, column: key, message: `Unknown instrument code: ${key}` });
          return;
        }
        
        // Validate price value
        const price = row[key];
        if (price === undefined || price === null || price === '') {
          // Empty prices are allowed, they'll be skipped
          return;
        }
        
        const numPrice = Number(price);
        if (isNaN(numPrice)) {
          errors.push({ row: rowNum, column: key, message: `Invalid price value: ${price}` });
        }
        
        // Check for duplicate dates per instrument
        if (row.Date && !isNaN(row.Date.getTime())) {
          const dateStr = format(row.Date, 'yyyy-MM-dd');
          if (!processedDates.has(key)) {
            processedDates.set(key, new Set());
          }
          
          const datesForInstrument = processedDates.get(key)!;
          if (datesForInstrument.has(dateStr)) {
            errors.push({ 
              row: rowNum, 
              column: key, 
              message: `Duplicate date ${dateStr} for instrument ${key}` 
            });
          } else {
            datesForInstrument.add(dateStr);
          }
        }
      });
    });

    return errors;
  };

  const validateForwardPriceData = (data: any[]): ValidationError[] => {
    const errors: ValidationError[] = [];
    const instrumentCodes = new Set(instruments.map(i => i.instrument_code));
    const processedMonths = new Map<string, Set<string>>();

    data.forEach((row, index) => {
      const rowNum = index + 2; // +2 because of 0-indexing and header row
      
      // Validate forward month
      if (!row['Forward Month']) {
        errors.push({ row: rowNum, column: 'Forward Month', message: 'Missing forward month' });
      } else {
        // Check if it's a valid month in format YYYY-MM
        const monthStr = String(row['Forward Month']);
        const monthRegex = /^\d{4}-\d{2}$/;
        if (!monthRegex.test(monthStr)) {
          errors.push({ 
            row: rowNum, 
            column: 'Forward Month', 
            message: 'Invalid month format. Use YYYY-MM' 
          });
        } else {
          // Check if it's a valid date when appending "-01"
          const dateStr = `${monthStr}-01`;
          const date = new Date(dateStr);
          if (isNaN(date.getTime())) {
            errors.push({ 
              row: rowNum, 
              column: 'Forward Month', 
              message: 'Invalid month value' 
            });
          }
        }
      }

      // Check for each instrument column
      Object.keys(row).forEach(key => {
        if (key === 'Forward Month') return;
        
        // Validate instrument code
        if (!instrumentCodes.has(key)) {
          errors.push({ row: rowNum, column: key, message: `Unknown instrument code: ${key}` });
          return;
        }
        
        // Validate price value
        const price = row[key];
        if (price === undefined || price === null || price === '') {
          // Empty prices are allowed, they'll be skipped
          return;
        }
        
        const numPrice = Number(price);
        if (isNaN(numPrice)) {
          errors.push({ row: rowNum, column: key, message: `Invalid price value: ${price}` });
        }
        
        // Check for duplicate months per instrument
        if (row['Forward Month']) {
          const monthStr = String(row['Forward Month']);
          if (!processedMonths.has(key)) {
            processedMonths.set(key, new Set());
          }
          
          const monthsForInstrument = processedMonths.get(key)!;
          if (monthsForInstrument.has(monthStr)) {
            errors.push({ 
              row: rowNum, 
              column: key, 
              message: `Duplicate month ${monthStr} for instrument ${key}` 
            });
          } else {
            monthsForInstrument.add(monthStr);
          }
        }
      });
    });

    return errors;
  };

  const processHistoricalPriceData = async (data: any[]): Promise<UploadResult> => {
    const instrumentIdMap = new Map(instruments.map(i => [i.instrument_code, i.id]));
    let rowsProcessed = 0;
    let rowsInserted = 0;
    const batchSize = 50;
    const rows = [];

    for (const row of data) {
      rowsProcessed++;
      if (!row.Date || isNaN(row.Date.getTime())) continue;
      
      const dateStr = format(row.Date, 'yyyy-MM-dd');
      
      for (const [key, value] of Object.entries(row)) {
        if (key === 'Date' || value === '' || value === null || value === undefined) continue;
        
        const instrumentId = instrumentIdMap.get(key);
        if (!instrumentId) continue;
        
        const price = Number(value);
        if (isNaN(price)) continue;
        
        rows.push({
          instrument_id: instrumentId,
          price_date: dateStr,
          price: price
        });
      }
    }

    // Process in batches
    for (let i = 0; i < rows.length; i += batchSize) {
      const batch = rows.slice(i, i + batchSize);
      const { error } = await supabase
        .from('historical_prices')
        .upsert(batch, { onConflict: 'instrument_id,price_date' });
      
      if (error) {
        console.error('Error inserting historical prices:', error);
        return {
          success: false,
          message: `Error inserting data: ${error.message}`,
          rowsProcessed,
          rowsInserted: i
        };
      }
      
      rowsInserted += batch.length;
    }

    return {
      success: true,
      message: `Successfully processed ${rowsProcessed} rows and inserted ${rowsInserted} price points.`,
      rowsProcessed,
      rowsInserted
    };
  };

  const processForwardPriceData = async (data: any[]): Promise<UploadResult> => {
    const instrumentIdMap = new Map(instruments.map(i => [i.instrument_code, i.id]));
    let rowsProcessed = 0;
    let rowsInserted = 0;
    const batchSize = 50;
    const rows = [];

    for (const row of data) {
      rowsProcessed++;
      if (!row['Forward Month']) continue;
      
      const monthStr = String(row['Forward Month']);
      const dateStr = `${monthStr}-01`; // First day of month
      
      for (const [key, value] of Object.entries(row)) {
        if (key === 'Forward Month' || value === '' || value === null || value === undefined) continue;
        
        const instrumentId = instrumentIdMap.get(key);
        if (!instrumentId) continue;
        
        const price = Number(value);
        if (isNaN(price)) continue;
        
        rows.push({
          instrument_id: instrumentId,
          forward_month: dateStr,
          price: price
        });
      }
    }

    // Process in batches
    for (let i = 0; i < rows.length; i += batchSize) {
      const batch = rows.slice(i, i + batchSize);
      const { error } = await supabase
        .from('forward_prices')
        .upsert(batch, { onConflict: 'instrument_id,forward_month' });
      
      if (error) {
        console.error('Error inserting forward prices:', error);
        return {
          success: false,
          message: `Error inserting data: ${error.message}`,
          rowsProcessed,
          rowsInserted: i
        };
      }
      
      rowsInserted += batch.length;
    }

    return {
      success: true,
      message: `Successfully processed ${rowsProcessed} rows and inserted ${rowsInserted} price points.`,
      rowsProcessed,
      rowsInserted
    };
  };

  const handleUpload = async () => {
    if (!file) {
      toast.error('Please select a file to upload');
      return;
    }

    setIsUploading(true);
    setUploadResult(null);

    try {
      // Parse Excel file
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data);
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      
      // Convert to JSON with date parsing
      const options = { 
        raw: false, 
        dateNF: 'yyyy-mm-dd',
        cellDates: true
      };
      const jsonData = XLSX.utils.sheet_to_json(worksheet, options);
      
      if (jsonData.length === 0) {
        setUploadResult({
          success: false,
          message: 'The uploaded file contains no data'
        });
        setIsUploading(false);
        return;
      }

      // Validate data
      const errors = priceType === 'historical' 
        ? validateHistoricalPriceData(jsonData)
        : validateForwardPriceData(jsonData);
      
      if (errors.length > 0) {
        setUploadResult({
          success: false,
          message: `Validation failed with ${errors.length} errors`,
          errors
        });
        setIsUploading(false);
        return;
      }

      // Process and upload data
      const result = priceType === 'historical'
        ? await processHistoricalPriceData(jsonData)
        : await processForwardPriceData(jsonData);
      
      setUploadResult(result);
      
      if (result.success) {
        toast.success('Price data uploaded successfully');
      } else {
        toast.error('Failed to upload price data');
      }
    } catch (error: any) {
      console.error('Error processing file:', error);
      setUploadResult({
        success: false,
        message: `Error processing file: ${error.message}`
      });
      toast.error('Failed to process file');
    } finally {
      setIsUploading(false);
    }
  };

  const downloadTemplate = () => {
    const templateData = [
      priceType === 'historical' 
        ? { Date: new Date() }
        : { 'Forward Month': format(new Date(), 'yyyy-MM') }
    ];
    
    // Add instrument columns
    const rowData = templateData[0];
    instruments.forEach(instrument => {
      rowData[instrument.instrument_code] = '';
    });
    
    // Create worksheet and workbook
    const worksheet = XLSX.utils.json_to_sheet(templateData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Template');
    
    // Download
    const fileName = priceType === 'historical' 
      ? 'historical_prices_template.xlsx' 
      : 'forward_prices_template.xlsx';
    XLSX.writeFile(workbook, fileName);
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="price-type">Price Type</Label>
          <Select
            value={priceType}
            onValueChange={(value) => setPriceType(value as 'historical' | 'forward')}
          >
            <SelectTrigger id="price-type">
              <SelectValue placeholder="Select price type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="historical">Historical Prices</SelectItem>
              <SelectItem value="forward">Forward Prices</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div>
          <Label htmlFor="excel-file">Excel File</Label>
          <div className="flex items-center gap-2">
            <Input
              id="excel-file"
              type="file"
              accept=".xlsx,.xls"
              onChange={handleFileChange}
              disabled={isUploading}
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={downloadTemplate}
            >
              Template
            </Button>
          </div>
        </div>
      </div>
      
      <div className="flex justify-end gap-2">
        <Button
          type="button"
          onClick={handleUpload}
          disabled={!file || isUploading}
        >
          {isUploading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Uploading...
            </>
          ) : (
            <>
              <UploadCloud className="mr-2 h-4 w-4" />
              Upload
            </>
          )}
        </Button>
      </div>
      
      {uploadResult && (
        <Alert variant={uploadResult.success ? "default" : "destructive"}>
          {uploadResult.success ? (
            <CheckCircle2 className="h-4 w-4" />
          ) : (
            <AlertCircle className="h-4 w-4" />
          )}
          <AlertTitle>
            {uploadResult.success ? 'Upload Successful' : 'Upload Failed'}
          </AlertTitle>
          <AlertDescription>
            <div className="mt-2">
              <p>{uploadResult.message}</p>
              
              {uploadResult.errors && uploadResult.errors.length > 0 && (
                <div className="mt-4 max-h-40 overflow-y-auto">
                  <h4 className="text-sm font-medium mb-2">Validation Errors:</h4>
                  <ul className="text-sm space-y-1">
                    {uploadResult.errors.slice(0, 10).map((error, idx) => (
                      <li key={idx}>
                        Row {error.row}, Column "{error.column}": {error.message}
                      </li>
                    ))}
                    {uploadResult.errors.length > 10 && (
                      <li>...and {uploadResult.errors.length - 10} more errors</li>
                    )}
                  </ul>
                </div>
              )}
            </div>
          </AlertDescription>
        </Alert>
      )}
      
      <div className="space-y-4">
        <h3 className="text-lg font-medium">Upload Instructions</h3>
        
        <div className="text-sm space-y-2">
          <p>
            <strong>Historical Prices:</strong> Upload daily price data for instruments. The file must 
            include a <code>Date</code> column in the first column, with additional columns for each 
            instrument code.
          </p>
          
          <p>
            <strong>Forward Prices:</strong> Upload monthly forward price data. The file must include a 
            <code>Forward Month</code> column in YYYY-MM format, with additional columns for each 
            instrument code.
          </p>
          
          <p>
            Download a template file to see the required format. The system will validate your data 
            before uploading and report any errors found.
          </p>
        </div>
      </div>
    </div>
  );
};

export default PriceUploader;
