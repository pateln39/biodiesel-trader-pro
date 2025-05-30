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

// Configuration for batch processing
const BATCH_CONFIG = {
  CHUNK_SIZE: 5, // Process 5 trades at a time
  CHUNK_DELAY: 500, // 500ms delay between chunks
  INDIVIDUAL_TIMEOUT: 10000, // 10 second timeout per trade
  MAX_RETRIES: 2 // Maximum retries for failed trades
};

const PaperTradeUploader: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [parsedTrades, setParsedTrades] = useState<any[]>([]);
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [showPreview, setShowPreview] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<string>('');
  const [currentBatch, setCurrentBatch] = useState(0);
  const [totalBatches, setTotalBatches] = useState(0);
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

  // Helper function to create a timeout wrapper for individual trade creation
  const createTradeWithTimeout = (trade: any, timeoutMs: number): Promise<any> => {
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        reject(new Error('Trade creation timeout'));
      }, timeoutMs);

      createPaperTrade(transformParsedTradeForDatabase(trade), {
        onSuccess: (result) => {
          clearTimeout(timer);
          resolve(result);
        },
        onError: (error) => {
          clearTimeout(timer);
          reject(error);
        }
      });
    });
  };

  // Helper function to process a single chunk of trades
  const processTradeChunk = async (chunk: any[], chunkIndex: number): Promise<{ successes: number; failures: any[] }> => {
    console.log(`[BATCH_UPLOAD] Processing chunk ${chunkIndex + 1} with ${chunk.length} trades`);
    
    // Use Promise.allSettled to process all trades in chunk simultaneously
    const results = await Promise.allSettled(
      chunk.map(async (trade, index) => {
        const tradeRef = trade.tradeReference || `Group ${trade.groupIndex + 1}`;
        console.log(`[BATCH_UPLOAD] Processing trade ${tradeRef} in chunk ${chunkIndex + 1}`);
        
        try {
          const result = await createTradeWithTimeout(trade, BATCH_CONFIG.INDIVIDUAL_TIMEOUT);
          console.log(`[BATCH_UPLOAD] Successfully created trade: ${tradeRef}`);
          return { success: true, trade: tradeRef, result };
        } catch (error: any) {
          console.error(`[BATCH_UPLOAD] Failed to create trade: ${tradeRef}`, error);
          return { 
            success: false, 
            trade: tradeRef, 
            error: error.message || 'Unknown error',
            originalTrade: trade
          };
        }
      })
    );

    // Process results
    let successes = 0;
    const failures: any[] = [];

    results.forEach((result, index) => {
      if (result.status === 'fulfilled' && result.value.success) {
        successes++;
      } else {
        const failureInfo = result.status === 'fulfilled' 
          ? result.value 
          : { 
              success: false, 
              trade: chunk[index].tradeReference || `Group ${chunk[index].groupIndex + 1}`,
              error: 'Promise rejected',
              originalTrade: chunk[index]
            };
        failures.push(failureInfo);
      }
    });

    return { successes, failures };
  };

  // Enhanced upload function with batch processing
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
      console.log('[BATCH_UPLOAD] Starting broker validation for', parsedTrades.length, 'trades');
      const brokerErrors = await validateAndCreateBrokers(parsedTrades);
      
      if (brokerErrors.length > 0) {
        console.error('[BATCH_UPLOAD] Broker validation failed:', brokerErrors);
        setUploadStatus('Broker validation failed');
        brokerErrors.forEach(error => {
          toast.error('Broker validation failed', { description: error });
        });
        return;
      }

      setUploadProgress(10);
      setUploadStatus('Brokers validated. Starting batch upload...');

      // Step 2: Split trades into chunks
      const chunks: any[][] = [];
      for (let i = 0; i < parsedTrades.length; i += BATCH_CONFIG.CHUNK_SIZE) {
        chunks.push(parsedTrades.slice(i, i + BATCH_CONFIG.CHUNK_SIZE));
      }

      setTotalBatches(chunks.length);
      console.log(`[BATCH_UPLOAD] Split ${parsedTrades.length} trades into ${chunks.length} chunks`);

      // Step 3: Process chunks sequentially with parallel processing within each chunk
      let totalSuccesses = 0;
      let totalFailures = 0;
      const allFailures: any[] = [];

      for (let chunkIndex = 0; chunkIndex < chunks.length; chunkIndex++) {
        const chunk = chunks[chunkIndex];
        setCurrentBatch(chunkIndex + 1);
        
        // Calculate progress: 10% for broker validation, 90% for uploads
        const baseProgress = 10;
        const uploadProgress = (chunkIndex / chunks.length) * 90;
        setUploadProgress(baseProgress + uploadProgress);
        setUploadStatus(`Processing batch ${chunkIndex + 1} of ${chunks.length} (${chunk.length} trades)...`);

        try {
          const { successes, failures } = await processTradeChunk(chunk, chunkIndex);
          
          totalSuccesses += successes;
          totalFailures += failures.length;
          allFailures.push(...failures);

          console.log(`[BATCH_UPLOAD] Chunk ${chunkIndex + 1} completed: ${successes} successes, ${failures.length} failures`);

          // Add delay between chunks to prevent overwhelming the system
          if (chunkIndex < chunks.length - 1) {
            console.log(`[BATCH_UPLOAD] Waiting ${BATCH_CONFIG.CHUNK_DELAY}ms before next chunk...`);
            await new Promise(resolve => setTimeout(resolve, BATCH_CONFIG.CHUNK_DELAY));
          }

        } catch (error: any) {
          console.error(`[BATCH_UPLOAD] Chunk ${chunkIndex + 1} processing failed:`, error);
          // Add all trades in this chunk as failures
          chunk.forEach(trade => {
            allFailures.push({
              trade: trade.tradeReference || `Group ${trade.groupIndex + 1}`,
              error: 'Chunk processing failed',
              originalTrade: trade
            });
          });
          totalFailures += chunk.length;
        }
      }

      setUploadProgress(100);
      setUploadStatus('Upload complete');

      // Step 4: Show results and summary
      console.log(`[BATCH_UPLOAD] Final results: ${totalSuccesses} successes, ${totalFailures} failures`);

      if (totalSuccesses > 0) {
        toast.success(`Successfully uploaded ${totalSuccesses} trade groups`, {
          description: totalFailures > 0 ? `${totalFailures} trades failed` : undefined
        });
      }
      
      if (totalFailures > 0) {
        const failureMessages = allFailures.slice(0, 3).map(f => `${f.trade}: ${f.error}`);
        toast.warning(`${totalFailures} trades failed to upload`, {
          description: failureMessages.join('; ') + (allFailures.length > 3 ? '...' : '')
        });
        
        // Log all failed trades for debugging
        console.error('[BATCH_UPLOAD] All failed trades:', allFailures);
      }

      // Close dialog if all succeeded or if user wants to close after partial success
      if (totalFailures === 0) {
        setIsOpen(false);
        setFile(null);
        setParsedTrades([]);
        setShowPreview(false);
      }

    } catch (error: any) {
      console.error('[BATCH_UPLOAD] Upload process failed:', error);
      setUploadStatus('Upload failed');
      toast.error('Upload failed', {
        description: error.message || 'An unexpected error occurred'
      });
    } finally {
      setIsProcessing(false);
      setCurrentBatch(0);
      setTotalBatches(0);
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
                  {totalBatches > 0 && (
                    <div className="text-xs text-muted-foreground text-center">
                      Batch {currentBatch} of {totalBatches}
                    </div>
                  )}
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
                  {parsedTrades.length > 10 && (
                    <div className="mt-1 text-xs text-muted-foreground">
                      Large upload will be processed in batches of {BATCH_CONFIG.CHUNK_SIZE} trades
                    </div>
                  )}
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
