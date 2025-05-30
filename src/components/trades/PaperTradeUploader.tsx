
import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Upload, Download, FileSpreadsheet, AlertCircle, CheckCircle, Info, X } from 'lucide-react';
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
  const [isCancelled, setIsCancelled] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const completionHandledRef = useRef(false);
  
  // Use the upload job hook for backend processing
  const { job, isLoading: isJobLoading, error: jobError, startPolling, stopPolling } = useUploadJob();

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
    setIsCancelled(false);
    setUploadStatus('');
    completionHandledRef.current = false;
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
    setIsCancelled(false);
    setUploadProgress(0);
    setUploadStatus('Sending trades to backend for processing...');
    completionHandledRef.current = false;

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
      
      toast.info('Upload started in backend', {
        description: `Processing ${parsedTrades.length} trades. You can monitor progress below.`
      });

      setUploadStatus('Backend processing started. Monitoring progress...');
      
      // Start polling for job status
      startPolling(jobId);

    } catch (error: any) {
      console.error('[FRONTEND_UPLOAD] Upload failed:', error);
      setUploadStatus('Upload failed');
      toast.error('Upload failed', {
        description: error.message || 'An unexpected error occurred'
      });
      setIsProcessing(false);
    }
  };

  const handleCancel = () => {
    setIsCancelled(true);
    setIsProcessing(false);
    stopPolling();
    completionHandledRef.current = true;
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

  // Update progress and status from job polling
  React.useEffect(() => {
    if (job && !completionHandledRef.current) {
      setUploadProgress(job.progress_percentage || 0);
      
      const currentStatus = job.metadata?.currentStatus || '';
      if (currentStatus) {
        setUploadStatus(currentStatus);
      }

      // Handle job completion
      if (job.status === 'completed') {
        completionHandledRef.current = true;
        setIsProcessing(false);
        setUploadStatus('Upload completed successfully');
        toast.success(`Successfully uploaded ${job.processed_items} trade groups`);
        
        // Close dialog and reset after a short delay to show final state
        setTimeout(() => {
          setIsOpen(false);
          setFile(null);
          setParsedTrades([]);
          setShowPreview(false);
          resetUploadState();
        }, 1500);
        
      } else if (job.status === 'completed_with_errors') {
        completionHandledRef.current = true;
        setIsProcessing(false);
        setUploadStatus(`Upload completed with ${job.failed_items} errors`);
        toast.warning(`Upload completed: ${job.processed_items} successful, ${job.failed_items} failed`);
        
      } else if (job.status === 'failed') {
        completionHandledRef.current = true;
        setIsProcessing(false);
        setUploadStatus('Upload failed');
        toast.error('Upload failed', {
          description: job.error_message || 'Unknown error occurred'
        });
      }
    }
  }, [job]);

  // Handle job error
  React.useEffect(() => {
    if (jobError && !completionHandledRef.current) {
      completionHandledRef.current = true;
      setIsProcessing(false);
      setUploadStatus('Failed to monitor upload progress');
      toast.error('Upload monitoring failed', {
        description: jobError
      });
    }
  }, [jobError]);

  // Cleanup on unmount
  React.useEffect(() => {
    return () => {
      stopPolling();
    };
  }, [stopPolling]);

  const totalLegs = parsedTrades.reduce((acc, trade) => acc + (trade.legs?.length || 0), 0);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      setIsOpen(open);
      if (!open) {
        stopPolling();
        resetUploadState();
      }
    }}>
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
                    {isProcessing && !job ? 'Parsing...' : 'Parse File'}
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

          {/* Progress Bar with Backend Status */}
          {(isProcessing || isJobLoading) && (
            <Card>
              <CardContent className="pt-4">
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span>{uploadStatus}</span>
                    <span>{Math.round(uploadProgress)}%</span>
                  </div>
                  <Progress value={uploadProgress} />
                  
                  {job && (
                    <div className="flex justify-between items-center text-xs text-muted-foreground">
                      <span>Processed: {job.processed_items} / {job.total_items}</span>
                      {job.failed_items > 0 && (
                        <span className="text-red-500">Failed: {job.failed_items}</span>
                      )}
                    </div>
                  )}
                  
                  {/* Cancel Control */}
                  {(isProcessing || isJobLoading) && !completionHandledRef.current && (
                    <div className="flex gap-2 justify-center pt-2">
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
                  <div className="mt-2 text-xs text-blue-600 bg-blue-50 p-2 rounded">
                    <strong>Backend Processing:</strong> Your trades will be processed on our servers 
                    in batches to ensure reliability. Large uploads are handled efficiently without 
                    browser limitations.
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
                    disabled={validationErrors.length > 0 || isProcessing || isJobLoading}
                    size="sm"
                  >
                    Upload {parsedTrades.length} Trade Groups (Backend Processing)
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
