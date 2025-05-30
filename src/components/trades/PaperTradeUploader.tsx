import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Upload, Download, FileSpreadsheet, AlertCircle, CheckCircle, Info } from 'lucide-react';
import { toast } from 'sonner';
import { 
  parseExcelPaperTrades, 
  generateExcelTemplate, 
  transformParsedTradeForDatabase,
  validateAndCreateBrokers
} from '@/utils/excelPaperTradeUtils';
import { usePaperTrades } from '@/hooks/usePaperTrades';
import { ScrollArea } from '@/components/ui/scroll-area';

// Use the ParsedTrade interface from the utils file
interface ValidationError {
  row: number;
  errors: string[];
}

const PaperTradeUploader: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [parsedTrades, setParsedTrades] = useState<any[]>([]);
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [showPreview, setShowPreview] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Use the hook to get the mutation
  const { createPaperTrade, isCreating } = usePaperTrades();

  const handleFileSelect = (selectedFile: File) => {
    if (!selectedFile.name.match(/\.(xlsx|xls)$/)) {
      toast.error('Please select an Excel file (.xlsx or .xls)');
      return;
    }

    setFile(selectedFile);
    setShowPreview(false);
    setParsedTrades([]);
    setValidationErrors([]);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) {
      handleFileSelect(droppedFile);
    }
  };

  const parseFile = async () => {
    if (!file) return;

    setIsProcessing(true);
    setUploadProgress(0);

    try {
      const result = await parseExcelPaperTrades(file, (progress) => {
        setUploadProgress(progress);
      });

      setParsedTrades(result.trades);
      setValidationErrors(result.errors);
      setShowPreview(true);

      if (result.errors.length > 0) {
        toast.warning(`Found ${result.errors.length} validation errors. Please review before uploading.`);
      } else {
        toast.success(`Successfully parsed ${result.trades.length} trade groups.`);
      }
    } catch (error: any) {
      toast.error('Failed to parse Excel file', {
        description: error.message
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const uploadTrades = async () => {
    if (validationErrors.length > 0) {
      toast.error('Please fix validation errors before uploading');
      return;
    }

    if (parsedTrades.length === 0) {
      toast.error('No trades to upload');
      return;
    }

    setIsProcessing(true);
    setUploadProgress(0);
    setUploadStatus('Validating brokers...');

    try {
      // Step 1: Validate and create brokers
      console.log('[UPLOAD] Starting broker validation for', parsedTrades.length, 'trades');
      const brokerErrors = await validateAndCreateBrokers(parsedTrades);
      
      if (brokerErrors.length > 0) {
        console.error('[UPLOAD] Broker validation failed:', brokerErrors);
        setUploadStatus('Broker validation failed');
        brokerErrors.forEach(error => {
          toast.error('Broker validation failed', { description: error });
        });
        return;
      }

      setUploadProgress(20);
      setUploadStatus('Brokers validated. Creating trades...');

      // Step 2: Transform and upload trades sequentially
      let successCount = 0;
      let failureCount = 0;
      const failedTrades: string[] = [];
      
      for (let i = 0; i < parsedTrades.length; i++) {
        const trade = parsedTrades[i];
        const progress = 20 + ((i / parsedTrades.length) * 80);
        setUploadProgress(progress);
        setUploadStatus(`Creating trade ${i + 1} of ${parsedTrades.length}...`);

        try {
          console.log('[UPLOAD] Transforming trade:', trade.tradeReference || `Group ${trade.groupIndex + 1}`);
          const transformedTrade = transformParsedTradeForDatabase(trade);
          
          console.log('[UPLOAD] Creating trade in database:', transformedTrade);
          
          // Use the mutation properly with a Promise wrapper
          await new Promise((resolve, reject) => {
            createPaperTrade(transformedTrade, {
              onSuccess: (createdTrade) => {
                successCount++;
                console.log('[UPLOAD] Successfully created trade:', trade.tradeReference || `Group ${trade.groupIndex + 1}`);
                resolve(createdTrade);
              },
              onError: (error: any) => {
                failureCount++;
                const errorMsg = error?.message || 'Unknown error';
                const tradeRef = trade.tradeReference || `Group ${trade.groupIndex + 1}`;
                console.error('[UPLOAD] Failed to create trade:', tradeRef, errorMsg);
                failedTrades.push(`${tradeRef}: ${errorMsg}`);
                reject(error);
              }
            });
          });

        } catch (error: any) {
          failureCount++;
          const tradeRef = trade.tradeReference || `Group ${trade.groupIndex + 1}`;
          console.error('[UPLOAD] Trade creation failed:', tradeRef, error);
          failedTrades.push(`${tradeRef}: ${error.message || 'Unknown error'}`);
          // Continue with next trade instead of stopping
        }
      }

      setUploadProgress(100);
      setUploadStatus('Upload complete');

      // Show results
      if (successCount > 0) {
        toast.success(`Successfully uploaded ${successCount} trade groups`);
      }
      
      if (failureCount > 0) {
        toast.warning(`${failureCount} trades failed to upload`, {
          description: failedTrades.length > 0 ? failedTrades[0] : 'Check console for details'
        });
        
        // Log all failed trades for debugging
        console.error('[UPLOAD] Failed trades:', failedTrades);
      }

      // Close dialog if all succeeded or if user wants to close after partial success
      if (failureCount === 0) {
        setIsOpen(false);
        setFile(null);
        setParsedTrades([]);
        setShowPreview(false);
      }

    } catch (error: any) {
      console.error('[UPLOAD] Upload process failed:', error);
      setUploadStatus('Upload failed');
      toast.error('Upload failed', {
        description: error.message || 'An unexpected error occurred'
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const downloadTemplate = () => {
    try {
      generateExcelTemplate();
      toast.success('Template downloaded successfully');
    } catch (error: any) {
      toast.error('Failed to generate template', {
        description: error.message
      });
    }
  };

  const totalLegs = parsedTrades.reduce((acc, trade) => acc + (trade.legs?.length || 0), 0);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Upload className="mr-2 h-4 w-4" />
          Upload Excel
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Upload Paper Trades from Excel</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Template Download */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <FileSpreadsheet className="h-5 w-5" />
                Excel Template
              </CardTitle>
              <CardDescription>
                Download the Excel template to see the required format and example data
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={downloadTemplate} variant="outline" size="sm">
                <Download className="mr-2 h-4 w-4" />
                Download Template
              </Button>
            </CardContent>
          </Card>

          {/* Important Usage Instructions */}
          <Alert>
            <Info className="h-4 w-4" />
            <AlertTitle>Template Usage Instructions</AlertTitle>
            <AlertDescription>
              <div className="mt-2 text-sm">
                <p className="mb-2">
                  <strong>Important:</strong> Use the downloaded template as a formatting reference only.
                </p>
                <p>
                  When ready to upload your actual trade data, copy your trades into a <strong>new Excel file</strong> 
                  following the same format. The template file itself cannot be uploaded directly with your data.
                </p>
              </div>
            </AlertDescription>
          </Alert>

          {/* File Upload */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Upload Excel File</CardTitle>
              <CardDescription>
                Select or drag and drop your Excel file containing paper trades
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div
                className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-gray-400 transition-colors cursor-pointer"
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="mx-auto h-8 w-8 text-gray-400" />
                <div className="mt-2">
                  <Label className="text-sm font-medium">
                    {file ? file.name : 'Choose file or drag and drop'}
                  </Label>
                  <p className="text-xs text-gray-500 mt-1">
                    Excel files (.xlsx, .xls) only
                  </p>
                </div>
                <Input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx,.xls"
                  onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
                  className="hidden"
                />
              </div>

              {file && (
                <div className="mt-3 flex gap-2">
                  <Button onClick={parseFile} disabled={isProcessing} size="sm">
                    {isProcessing ? 'Parsing...' : 'Parse File'}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setFile(null);
                      setShowPreview(false);
                      setParsedTrades([]);
                      setValidationErrors([]);
                    }}
                  >
                    Clear
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Progress Bar */}
          {isProcessing && (
            <Card>
              <CardContent className="pt-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>{uploadStatus}</span>
                    <span>{Math.round(uploadProgress)}%</span>
                  </div>
                  <Progress value={uploadProgress} />
                </div>
              </CardContent>
            </Card>
          )}

          {/* Validation Errors */}
          {validationErrors.length > 0 && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Validation Errors Found</AlertTitle>
              <AlertDescription>
                <ScrollArea className="h-24 mt-2">
                  {validationErrors.map((error, index) => (
                    <div key={index} className="text-sm">
                      <strong>Row {error.row}:</strong> {error.errors.join(', ')}
                    </div>
                  ))}
                </ScrollArea>
              </AlertDescription>
            </Alert>
          )}

          {/* Summary and Upload */}
          {showPreview && parsedTrades.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  Ready to Upload
                </CardTitle>
                <CardDescription>
                  Found {parsedTrades.length} trade groups with {totalLegs} total legs
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex justify-end gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setShowPreview(false)}
                    size="sm"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={uploadTrades}
                    disabled={validationErrors.length > 0 || isProcessing || isCreating}
                    size="sm"
                  >
                    Upload {parsedTrades.length} Trade Groups
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PaperTradeUploader;
