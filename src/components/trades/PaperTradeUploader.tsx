
import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Upload, Download, FileSpreadsheet, AlertCircle, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';
import { generateExcelTemplate } from '@/utils/excelPaperTradeUtils';
import { usePaperTrades } from '@/hooks/usePaperTrades';
import { ScrollArea } from '@/components/ui/scroll-area';
import { pausePaperSubscriptions, resumePaperSubscriptions } from '@/utils/paperTradeSubscriptionUtils';
import { supabase } from '@/integrations/supabase/client';

interface ValidationError {
  row: number;
  errors: string[];
}

interface UploadResponse {
  success: boolean;
  message?: string;
  tradeCount?: number;
  totalLegs?: number;
  errors?: ValidationError[];
  error?: string;
}

const PaperTradeUploader: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStatus, setUploadStatus] = useState<string>('');
  const [uploadComplete, setUploadComplete] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const { realtimeChannelsRef, isProcessingRef } = usePaperTrades();

  const handleFileSelect = (selectedFile: File) => {
    if (!selectedFile.name.match(/\.(xlsx|xls)$/)) {
      toast.error('Please select an Excel file (.xlsx or .xls)');
      return;
    }

    setFile(selectedFile);
    setValidationErrors([]);
    setUploadComplete(false);
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

  const uploadTrades = async () => {
    if (!file) {
      toast.error('No file selected');
      return;
    }

    setIsProcessing(true);
    setUploadProgress(0);
    setUploadStatus('Preparing upload...');
    setValidationErrors([]);

    try {
      console.log('[UPLOAD] Starting backend upload process');
      
      // Pause real-time subscriptions
      pausePaperSubscriptions(realtimeChannelsRef.current);
      isProcessingRef.current = true;

      // Convert file to base64
      setUploadStatus('Reading file...');
      setUploadProgress(10);
      
      const fileBuffer = await file.arrayBuffer();
      const base64Data = btoa(String.fromCharCode(...new Uint8Array(fileBuffer)));

      setUploadStatus('Sending to server...');
      setUploadProgress(25);

      // Call the Edge Function
      const { data, error } = await supabase.functions.invoke('upload-paper-trades', {
        body: { fileData: base64Data }
      });

      if (error) {
        throw new Error(error.message || 'Upload failed');
      }

      const response = data as UploadResponse;

      if (!response.success) {
        if (response.errors && response.errors.length > 0) {
          setValidationErrors(response.errors);
          setUploadProgress(100);
          setUploadStatus('Validation errors found');
          toast.error('Validation errors found', {
            description: 'Please review and fix the errors before uploading'
          });
          return;
        } else {
          throw new Error(response.error || 'Upload failed');
        }
      }

      // Successful upload started
      setUploadProgress(100);
      setUploadStatus('Upload completed successfully');
      setUploadComplete(true);

      toast.success('Upload completed successfully!', {
        description: `Processing ${response.tradeCount} trade groups with ${response.totalLegs} legs. Please refresh the page to see the new trades.`
      });

      // Reset form
      setFile(null);
      setValidationErrors([]);

    } catch (error: any) {
      console.error('[UPLOAD] Upload failed:', error);
      setUploadStatus('Upload failed');
      toast.error('Upload failed', {
        description: error.message || 'An unexpected error occurred'
      });
    } finally {
      // Always resume subscriptions and reset processing state
      resumePaperSubscriptions(realtimeChannelsRef.current);
      isProcessingRef.current = false;
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

  const resetForm = () => {
    setFile(null);
    setValidationErrors([]);
    setUploadComplete(false);
    setUploadProgress(0);
    setUploadStatus('');
  };

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

              {file && !uploadComplete && (
                <div className="mt-3 flex gap-2">
                  <Button 
                    onClick={uploadTrades} 
                    disabled={isProcessing} 
                    size="sm"
                  >
                    {isProcessing ? 'Processing...' : 'Upload Trades'}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={resetForm}
                    disabled={isProcessing}
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

          {/* Success Message */}
          {uploadComplete && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  Upload Completed
                </CardTitle>
                <CardDescription>
                  Your trades have been processed successfully. Please refresh the page to see the new trades.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex justify-end gap-2">
                  <Button
                    variant="outline"
                    onClick={resetForm}
                    size="sm"
                  >
                    Upload Another File
                  </Button>
                  <Button
                    onClick={() => setIsOpen(false)}
                    size="sm"
                  >
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
