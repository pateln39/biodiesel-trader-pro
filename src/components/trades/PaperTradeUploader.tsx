import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Upload, Download, FileSpreadsheet, AlertCircle, CheckCircle, Info, Pause, Play, X } from 'lucide-react';
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

// Configuration for conservative batch processing to prevent database overwhelm
const BATCH_CONFIG = {
  CHUNK_SIZE: 2, // Process only 2 trades at a time to minimize database load
  CHUNK_DELAY: 3000, // 3 second delay between chunks to give database time to recover
  INDIVIDUAL_TIMEOUT: 30000, // 30 second timeout per trade for slower processing
  MAX_RETRIES: 3, // Increased retries for failed trades
  PROGRESS_THROTTLE: 500 // Update progress every 500ms to prevent render loops
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
  const [isPaused, setIsPaused] = useState(false);
  const [isCancelled, setIsCancelled] = useState(false);
  const [estimatedTimeRemaining, setEstimatedTimeRemaining] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const lastProgressUpdateRef = useRef<number>(0);
  const uploadStartTimeRef = useRef<number>(0);
  
  // Use the hook to get the mutation (single declaration)
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
    resetUploadState();
  };

  const resetUploadState = () => {
    setUploadProgress(0);
    setCurrentBatch(0);
    setTotalBatches(0);
    setIsPaused(false);
    setIsCancelled(false);
    setEstimatedTimeRemaining('');
    setUploadStatus('');
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

  // Throttled progress update to prevent render loops
  const updateProgressThrottled = (progress: number, status: string, batch: number = 0, timeRemaining: string = '') => {
    const now = Date.now();
    if (now - lastProgressUpdateRef.current >= BATCH_CONFIG.PROGRESS_THROTTLE) {
      setUploadProgress(progress);
      setUploadStatus(status);
      setCurrentBatch(batch);
      setEstimatedTimeRemaining(timeRemaining);
      lastProgressUpdateRef.current = now;
    }
  };

  // Calculate estimated time remaining
  const calculateTimeRemaining = (batchesCompleted: number, totalBatches: number, startTime: number): string => {
    if (batchesCompleted === 0) return '';
    
    const elapsed = Date.now() - startTime;
    const avgTimePerBatch = elapsed / batchesCompleted;
    const remainingBatches = totalBatches - batchesCompleted;
    const estimatedMs = remainingBatches * avgTimePerBatch;
    
    const seconds = Math.ceil(estimatedMs / 1000);
    if (seconds < 60) {
      return `~${seconds}s remaining`;
    } else {
      const minutes = Math.floor(seconds / 60);
      const remainingSeconds = seconds % 60;
      return `~${minutes}m ${remainingSeconds}s remaining`;
    }
  };

  // Helper function to create a timeout wrapper for individual trade creation
  const createTradeWithTimeout = (trade: any, timeoutMs: number): Promise<any> => {
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        reject(new Error('Trade creation timeout - database may be under load'));
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

  // Helper function to wait for a specified duration with cancellation support
  const cancellableDelay = (ms: number): Promise<void> => {
    return new Promise((resolve, reject) => {
      const timer = setTimeout(resolve, ms);
      
      // Check for cancellation periodically
      const checkCancellation = () => {
        if (isCancelled) {
          clearTimeout(timer);
          reject(new Error('Upload cancelled by user'));
          return;
        }
        if (!isPaused) {
          setTimeout(checkCancellation, 100);
        }
      };
      
      checkCancellation();
    });
  };

  // Helper function to process a single chunk of trades SEQUENTIALLY
  const processTradeChunk = async (chunk: any[], chunkIndex: number): Promise<{ successes: number; failures: any[] }> => {
    console.log(`[CONSERVATIVE_UPLOAD] Processing chunk ${chunkIndex + 1} with ${chunk.length} trades sequentially`);
    
    let successes = 0;
    const failures: any[] = [];

    // Process trades sequentially within the chunk to avoid overwhelming the database
    for (let i = 0; i < chunk.length; i++) {
      // Check for cancellation
      if (isCancelled) {
        throw new Error('Upload cancelled by user');
      }

      // Wait if paused
      while (isPaused && !isCancelled) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      const trade = chunk[i];
      const tradeRef = trade.tradeReference || `Group ${trade.groupIndex + 1}`;
      
      console.log(`[CONSERVATIVE_UPLOAD] Processing trade ${i + 1}/${chunk.length} in chunk ${chunkIndex + 1}: ${tradeRef}`);
      
      try {
        const result = await createTradeWithTimeout(trade, BATCH_CONFIG.INDIVIDUAL_TIMEOUT);
        console.log(`[CONSERVATIVE_UPLOAD] Successfully created trade: ${tradeRef}`);
        successes++;
        
        // Small delay between individual trades within chunk
        if (i < chunk.length - 1) {
          await cancellableDelay(500);
        }
      } catch (error: any) {
        console.error(`[CONSERVATIVE_UPLOAD] Failed to create trade: ${tradeRef}`, error);
        failures.push({
          success: false,
          trade: tradeRef,
          error: error.message || 'Unknown error',
          originalTrade: trade
        });
      }
    }

    return { successes, failures };
  };

  // Enhanced upload function with conservative batch processing
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
    setIsCancelled(false);
    setIsPaused(false);
    setUploadProgress(0);
    setUploadStatus('Validating brokers...');
    uploadStartTimeRef.current = Date.now();

    try {
      // Step 1: Validate and create brokers
      console.log('[CONSERVATIVE_UPLOAD] Starting broker validation for', parsedTrades.length, 'trades');
      const brokerErrors = await validateAndCreateBrokers(parsedTrades);
      
      if (brokerErrors.length > 0) {
        console.error('[CONSERVATIVE_UPLOAD] Broker validation failed:', brokerErrors);
        setUploadStatus('Broker validation failed');
        brokerErrors.forEach(error => {
          toast.error('Broker validation failed', { description: error });
        });
        return;
      }

      setUploadProgress(5);
      setUploadStatus('Brokers validated. Preparing for slow, reliable upload...');

      // Step 2: Split trades into smaller chunks
      const chunks: any[][] = [];
      for (let i = 0; i < parsedTrades.length; i += BATCH_CONFIG.CHUNK_SIZE) {
        chunks.push(parsedTrades.slice(i, i + BATCH_CONFIG.CHUNK_SIZE));
      }

      setTotalBatches(chunks.length);
      console.log(`[CONSERVATIVE_UPLOAD] Split ${parsedTrades.length} trades into ${chunks.length} chunks of max ${BATCH_CONFIG.CHUNK_SIZE} trades each`);

      // Calculate estimated total time
      const estimatedTotalTime = chunks.length * (BATCH_CONFIG.CHUNK_DELAY / 1000) + (parsedTrades.length * 2); // rough estimate
      console.log(`[CONSERVATIVE_UPLOAD] Estimated upload time: ~${Math.ceil(estimatedTotalTime / 60)} minutes`);

      toast.info(`Starting conservative upload process`, {
        description: `${chunks.length} batches, estimated time: ~${Math.ceil(estimatedTotalTime / 60)} minutes`
      });

      // Step 3: Process chunks sequentially with long delays
      let totalSuccesses = 0;
      let totalFailures = 0;
      const allFailures: any[] = [];

      for (let chunkIndex = 0; chunkIndex < chunks.length; chunkIndex++) {
        // Check for cancellation
        if (isCancelled) {
          setUploadStatus('Upload cancelled');
          break;
        }

        // Wait if paused
        while (isPaused && !isCancelled) {
          setUploadStatus('Upload paused...');
          await new Promise(resolve => setTimeout(resolve, 100));
        }

        if (isCancelled) break;

        const chunk = chunks[chunkIndex];
        
        // Calculate progress: 5% for broker validation, 95% for uploads
        const baseProgress = 5;
        const uploadProgress = (chunkIndex / chunks.length) * 95;
        const currentProgress = baseProgress + uploadProgress;
        
        const timeRemaining = calculateTimeRemaining(chunkIndex, chunks.length, uploadStartTimeRef.current);
        
        updateProgressThrottled(
          currentProgress, 
          `Processing batch ${chunkIndex + 1} of ${chunks.length} (${chunk.length} trades)...`,
          chunkIndex + 1,
          timeRemaining
        );

        try {
          const { successes, failures } = await processTradeChunk(chunk, chunkIndex);
          
          totalSuccesses += successes;
          totalFailures += failures.length;
          allFailures.push(...failures);

          console.log(`[CONSERVATIVE_UPLOAD] Chunk ${chunkIndex + 1} completed: ${successes} successes, ${failures.length} failures`);

          // Add long delay between chunks to prevent database overwhelm (except for last chunk)
          if (chunkIndex < chunks.length - 1 && !isCancelled) {
            const delayStart = Date.now();
            setUploadStatus(`Waiting ${BATCH_CONFIG.CHUNK_DELAY / 1000}s before next batch to prevent database overload...`);
            
            await cancellableDelay(BATCH_CONFIG.CHUNK_DELAY);
            
            console.log(`[CONSERVATIVE_UPLOAD] Completed ${BATCH_CONFIG.CHUNK_DELAY}ms delay before next chunk`);
          }

        } catch (error: any) {
          if (error.message === 'Upload cancelled by user') {
            console.log('[CONSERVATIVE_UPLOAD] Upload cancelled by user');
            break;
          }
          
          console.error(`[CONSERVATIVE_UPLOAD] Chunk ${chunkIndex + 1} processing failed:`, error);
          // Add all trades in this chunk as failures
          chunk.forEach(trade => {
            allFailures.push({
              trade: trade.tradeReference || `Group ${trade.groupIndex + 1}`,
              error: 'Chunk processing failed: ' + error.message,
              originalTrade: trade
            });
          });
          totalFailures += chunk.length;
        }
      }

      if (!isCancelled) {
        setUploadProgress(100);
        setUploadStatus('Upload complete');

        // Step 4: Show results and summary
        console.log(`[CONSERVATIVE_UPLOAD] Final results: ${totalSuccesses} successes, ${totalFailures} failures`);

        if (totalSuccesses > 0) {
          toast.success(`Successfully uploaded ${totalSuccesses} trade groups`, {
            description: totalFailures > 0 ? `${totalFailures} trades failed` : 'All trades uploaded successfully!'
          });
        }
        
        if (totalFailures > 0) {
          const failureMessages = allFailures.slice(0, 3).map(f => `${f.trade}: ${f.error}`);
          toast.warning(`${totalFailures} trades failed to upload`, {
            description: failureMessages.join('; ') + (allFailures.length > 3 ? '...' : '')
          });
          
          // Log all failed trades for debugging
          console.error('[CONSERVATIVE_UPLOAD] All failed trades:', allFailures);
        }

        // Close dialog if all succeeded
        if (totalFailures === 0) {
          setIsOpen(false);
          setFile(null);
          setParsedTrades([]);
          setShowPreview(false);
          resetUploadState();
        }
      }

    } catch (error: any) {
      console.error('[CONSERVATIVE_UPLOAD] Upload process failed:', error);
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

  const handlePauseResume = () => {
    setIsPaused(!isPaused);
    if (!isPaused) {
      toast.info('Upload paused');
    } else {
      toast.info('Upload resumed');
    }
  };

  const handleCancel = () => {
    setIsCancelled(true);
    setIsProcessing(false);
    toast.warning('Upload cancelled');
    resetUploadState();
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
                      resetUploadState();
                    }}
                  >
                    Clear
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Progress Bar with Enhanced Controls */}
          {isProcessing && (
            <Card>
              <CardContent className="pt-4">
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span>{uploadStatus}</span>
                    <span>{Math.round(uploadProgress)}%</span>
                  </div>
                  <Progress value={uploadProgress} />
                  
                  {totalBatches > 0 && (
                    <div className="flex justify-between items-center text-xs text-muted-foreground">
                      <span>Batch {currentBatch} of {totalBatches}</span>
                      <span>{estimatedTimeRemaining}</span>
                    </div>
                  )}
                  
                  {/* Upload Controls */}
                  {isProcessing && totalBatches > 0 && (
                    <div className="flex gap-2 justify-center pt-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handlePauseResume}
                        disabled={isCancelled}
                      >
                        {isPaused ? (
                          <>
                            <Play className="mr-1 h-3 w-3" />
                            Resume
                          </>
                        ) : (
                          <>
                            <Pause className="mr-1 h-3 w-3" />
                            Pause
                          </>
                        )}
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={handleCancel}
                        disabled={isCancelled}
                      >
                        <X className="mr-1 h-3 w-3" />
                        Cancel
                      </Button>
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
                  <div className="mt-2 text-xs text-amber-600 bg-amber-50 p-2 rounded">
                    <strong>Conservative Upload Mode:</strong> Uploads will be processed slowly in batches of {BATCH_CONFIG.CHUNK_SIZE} trades 
                    with {BATCH_CONFIG.CHUNK_DELAY / 1000}s delays to prevent database overload. 
                    Estimated time: ~{Math.ceil((parsedTrades.length / BATCH_CONFIG.CHUNK_SIZE) * (BATCH_CONFIG.CHUNK_DELAY / 1000) / 60)} minutes.
                  </div>
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
                    Upload {parsedTrades.length} Trade Groups (Conservative Mode)
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
