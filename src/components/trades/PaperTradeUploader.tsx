
import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Upload, Download, FileSpreadsheet, AlertCircle, CheckCircle, Info, Clock, X } from 'lucide-react';
import { toast } from 'sonner';
import { 
  parseExcelPaperTrades, 
  generateExcelTemplate
} from '@/utils/excelPaperTradeUtils';
import { ScrollArea } from '@/components/ui/scroll-area';
import { supabase } from '@/integrations/supabase/client';
import { useUploadJob } from '@/hooks/useUploadJob';

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
  const [currentJobId, setCurrentJobId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Use the upload job monitoring hook
  const { job, isLoading: jobIsLoading, error: jobError, startPolling, stopPolling } = useUploadJob();

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
    setUploadStatus('');
    setCurrentJobId(null);
    stopPolling();
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
    setUploadStatus('Sending trades to backend for processing...');

    try {
      console.log('[FRONTEND_UPLOAD] Starting backend upload for', parsedTrades.length, 'trades');
      
      // Send parsed trades to backend
      const { data, error } = await supabase.functions.invoke('upload-paper-trades', {
        body: { parsedTrades }
      });

      if (error) {
        throw new Error(`Backend upload failed: ${error.message}`);
      }

      if (!data.success) {
        throw new Error(data.error || 'Unknown backend error');
      }

      const jobId = data.jobId;
      console.log('[FRONTEND_UPLOAD] Started backend job:', jobId);
      
      // Store job ID and start monitoring
      setCurrentJobId(jobId);
      setUploadStatus('Processing trades in background...');
      
      // Start polling the job status
      startPolling(jobId);
      
      toast.info('Upload started successfully!', {
        description: `Processing ${parsedTrades.length} trades in the background...`
      });

    } catch (error: any) {
      console.error('[FRONTEND_UPLOAD] Upload failed:', error);
      setUploadStatus('Upload failed');
      toast.error('Upload failed', {
        description: error.message || 'An unexpected error occurred'
      });
      setIsProcessing(false);
    }
  };

  // Monitor job completion and show notifications
  React.useEffect(() => {
    if (job && currentJobId) {
      const isCompleted = job.status === 'completed' || 
                         job.status === 'completed_with_errors' || 
                         job.status === 'failed';

      if (isCompleted) {
        setIsProcessing(false);
        
        if (job.status === 'completed') {
          toast.success('Upload completed successfully!', {
            description: `Successfully processed ${job.processed_items} trade groups.`
          });
        } else if (job.status === 'completed_with_errors') {
          toast.warning('Upload completed with some errors', {
            description: `Processed ${job.processed_items} successfully, ${job.failed_items} failed.`
          });
        } else if (job.status === 'failed') {
          toast.error('Upload failed', {
            description: job.error_message || 'An unexpected error occurred during processing.'
          });
        }

        // Close dialog after showing notification
        setTimeout(() => {
          handleCloseDialog();
        }, 2000);
      } else {
        // Update progress for ongoing job
        if (job.progress_percentage !== undefined) {
          setUploadProgress(job.progress_percentage);
        }
        
        if (job.metadata?.currentStatus) {
          setUploadStatus(job.metadata.currentStatus);
        }
      }
    }
  }, [job, currentJobId]);

  // Handle job monitoring errors
  React.useEffect(() => {
    if (jobError && currentJobId) {
      console.error('[JOB_MONITORING] Error:', jobError);
      setIsProcessing(false);
      setUploadStatus('Failed to monitor upload progress');
      toast.error('Upload monitoring failed', {
        description: 'Unable to track upload progress. Please refresh to check status.'
      });
    }
  }, [jobError, currentJobId]);

  const handleCloseDialog = () => {
    // Stop polling and reset state
    stopPolling();
    setIsOpen(false);
    setFile(null);
    setParsedTrades([]);
    setShowPreview(false);
    resetUploadState();
    setIsProcessing(false);
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

  // Determine if we should show job progress
  const showJobProgress = currentJobId && (isProcessing || jobIsLoading);

  return (
    <Dialog open={isOpen} onOpenChange={handleCloseDialog}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Upload className="mr-2 h-4 w-4" />
          Upload Excel
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle>Upload Paper Trades from Excel</DialogTitle>
            {showJobProgress && (
              <div className="flex items-center gap-2 text-sm text-blue-600">
                <Clock className="h-4 w-4 animate-spin" />
                Processing...
              </div>
            )}
          </div>
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

              {file && !showJobProgress && (
                <div className="mt-3 flex gap-2">
                  <Button onClick={parseFile} disabled={isProcessing} size="sm">
                    {isProcessing && !showPreview ? 'Parsing...' : 'Parse File'}
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

          {/* Progress Bar - Show for both parsing and job processing */}
          {(isProcessing || showJobProgress) && (
            <Card>
              <CardContent className="pt-4">
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span>{uploadStatus || 'Processing...'}</span>
                    <span>{Math.round(uploadProgress)}%</span>
                  </div>
                  <Progress value={uploadProgress} />
                  
                  {/* Show detailed job info if available */}
                  {job && currentJobId && (
                    <div className="text-xs text-gray-600 space-y-1">
                      <div>Status: {job.status}</div>
                      {job.processed_items > 0 && (
                        <div>Progress: {job.processed_items} / {job.total_items} trade groups</div>
                      )}
                      {job.failed_items > 0 && (
                        <div className="text-amber-600">Failed: {job.failed_items} items</div>
                      )}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Validation Errors */}
          {validationErrors.length > 0 && !showJobProgress && (
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
          {showPreview && parsedTrades.length > 0 && !showJobProgress && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  Ready to Upload
                </CardTitle>
                <CardDescription>
                  Found {parsedTrades.length} trade groups with {totalLegs} total legs
                  <div className="mt-2 text-xs text-blue-600 bg-blue-50 p-2 rounded">
                    <strong>Backend Processing:</strong> Your trades will be processed on our servers 
                    in batches to ensure reliability. You can monitor progress in real-time.
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
                    disabled={validationErrors.length > 0 || isProcessing}
                    size="sm"
                  >
                    Upload {parsedTrades.length} Trade Groups
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Job Completion Summary */}
          {job && currentJobId && (job.status === 'completed' || job.status === 'completed_with_errors' || job.status === 'failed') && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg">
                  {job.status === 'completed' ? (
                    <CheckCircle className="h-5 w-5 text-green-500" />
                  ) : job.status === 'completed_with_errors' ? (
                    <AlertCircle className="h-5 w-5 text-amber-500" />
                  ) : (
                    <X className="h-5 w-5 text-red-500" />
                  )}
                  Upload {job.status === 'completed' ? 'Completed' : job.status === 'completed_with_errors' ? 'Completed with Errors' : 'Failed'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <div>Total items: {job.total_items}</div>
                  <div>Successfully processed: {job.processed_items}</div>
                  {job.failed_items > 0 && (
                    <div>Failed: {job.failed_items}</div>
                  )}
                  {job.error_message && (
                    <div className="text-red-600">Error: {job.error_message}</div>
                  )}
                </div>
                <div className="mt-4">
                  <Button onClick={handleCloseDialog} size="sm">
                    Close
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
