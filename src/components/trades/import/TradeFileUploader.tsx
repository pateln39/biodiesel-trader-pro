
import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { FileSpreadsheet, Upload, AlertCircle, Check } from 'lucide-react';
import { processBulkTradeImport } from '@/utils/importExportUtils';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

interface TradeFileUploaderProps {
  importType: 'physical' | 'paper';
}

interface ImportError {
  sheet: string;
  row: number;
  message: string;
}

const TradeFileUploader: React.FC<TradeFileUploaderProps> = ({ importType }) => {
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [fileName, setFileName] = useState('');
  const [errors, setErrors] = useState<ImportError[]>([]);
  const [success, setSuccess] = useState(false);
  const [importStats, setImportStats] = useState({ total: 0, imported: 0 });
  const fileInputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setFileName(file.name);
    setUploading(true);
    setUploadProgress(10);
    setErrors([]);
    setSuccess(false);
    
    try {
      // Process the file in steps to show progress
      setUploadProgress(30);
      
      const result = await processBulkTradeImport(file, importType);
      
      setUploadProgress(90);
      
      if (result.success) {
        setSuccess(true);
        setImportStats({
          total: result.total || 0,
          imported: result.imported || 0
        });
        
        // Invalidate queries to refresh the trades list
        queryClient.invalidateQueries({ queryKey: ['trades'] });
        queryClient.invalidateQueries({ queryKey: ['paper-trades'] });
        
        toast.success(`Successfully imported ${result.imported} trades`, {
          description: `Out of ${result.total} trades in the file`
        });
      } else {
        setErrors(result.errors || []);
        toast.error('Import failed', {
          description: 'Please check the error details below'
        });
      }
    } catch (error: any) {
      console.error('Import error:', error);
      setErrors([{ sheet: 'General', row: 0, message: error.message || 'Unknown error occurred' }]);
      toast.error('Import failed', {
        description: error.message || 'Unknown error occurred'
      });
    } finally {
      setUploading(false);
      setUploadProgress(100);
      
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="space-y-6">
      <Card className="border-dashed border-2 p-6 flex flex-col items-center justify-center bg-muted/10 cursor-pointer hover:bg-muted/20 transition-colors" onClick={handleUploadClick}>
        <input 
          type="file" 
          ref={fileInputRef}
          accept=".xlsx,.xls" 
          className="hidden" 
          onChange={handleFileChange}
          disabled={uploading}
        />
        
        <div className="flex flex-col items-center justify-center py-4">
          <FileSpreadsheet className="h-10 w-10 mb-2 text-muted-foreground" />
          
          {!fileName ? (
            <>
              <p className="font-medium mb-1">Click to select file or drag and drop</p>
              <p className="text-sm text-muted-foreground">Excel files (.xlsx, .xls)</p>
            </>
          ) : (
            <>
              <p className="font-medium mb-1">{fileName}</p>
              {uploading ? (
                <p className="text-sm text-muted-foreground">Processing file...</p>
              ) : success ? (
                <p className="text-sm text-green-600 flex items-center gap-1">
                  <Check className="h-4 w-4" /> Import successful
                </p>
              ) : errors.length > 0 ? (
                <p className="text-sm text-red-600 flex items-center gap-1">
                  <AlertCircle className="h-4 w-4" /> Import failed
                </p>
              ) : (
                <p className="text-sm text-muted-foreground">Click to select another file</p>
              )}
            </>
          )}
          
          <Button 
            type="button" 
            className="mt-4" 
            disabled={uploading}
            onClick={(e) => {
              e.stopPropagation();
              handleUploadClick();
            }}
          >
            <Upload className="h-4 w-4 mr-2" />
            {uploading ? 'Uploading...' : 'Upload File'}
          </Button>
        </div>
      </Card>
      
      {uploading && (
        <div className="space-y-2">
          <Progress value={uploadProgress} className="h-2" />
          <p className="text-sm text-center text-muted-foreground">
            Processing file... {uploadProgress}%
          </p>
        </div>
      )}
      
      {success && (
        <Alert className="bg-green-50 border-green-200">
          <Check className="h-4 w-4 text-green-600" />
          <AlertTitle>Import successful</AlertTitle>
          <AlertDescription>
            Successfully imported {importStats.imported} out of {importStats.total} trades.
          </AlertDescription>
        </Alert>
      )}
      
      {errors.length > 0 && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Import failed</AlertTitle>
          <AlertDescription>
            <div className="mt-2 max-h-60 overflow-auto">
              <ul className="list-disc pl-5 space-y-1">
                {errors.map((error, index) => (
                  <li key={index} className="text-sm">
                    {error.sheet} - Row {error.row > 0 ? error.row : 'N/A'}: {error.message}
                  </li>
                ))}
              </ul>
            </div>
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
};

export default TradeFileUploader;
