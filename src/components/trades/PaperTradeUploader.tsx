
import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Upload, Download, FileSpreadsheet, AlertCircle, CheckCircle, Eye } from 'lucide-react';
import { toast } from 'sonner';
import { generateExcelTemplate } from '@/utils/excelPaperTradeUtils';
import { ScrollArea } from '@/components/ui/scroll-area';
import { supabase } from '@/integrations/supabase/client';
import * as XLSX from 'xlsx';

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

interface ParsedTradeData {
  tradeGroups: any[];
  totalTrades: number;
  totalLegs: number;
  validationErrors: ValidationError[];
}

interface PaperTradeUploaderProps {
  onUploadSuccess?: () => void;
  subscriptionControls?: {
    pauseSubscriptions: () => void;
    resumeSubscriptions: () => void;
  };
}

const PaperTradeUploader: React.FC<PaperTradeUploaderProps> = ({ 
  onUploadSuccess,
  subscriptionControls 
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [parsedData, setParsedData] = useState<ParsedTradeData | null>(null);
  const [isValidating, setIsValidating] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStatus, setUploadStatus] = useState<string>('');
  const [uploadComplete, setUploadComplete] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (selectedFile: File) => {
    if (!selectedFile.name.match(/\.(xlsx|xls)$/)) {
      toast.error('Please select an Excel file (.xlsx or .xls)');
      return;
    }

    setFile(selectedFile);
    setParsedData(null);
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

  const validateFile = async () => {
    if (!file) {
      toast.error('No file selected');
      return;
    }

    setIsValidating(true);
    
    try {
      // Parse the Excel file on the frontend for validation
      const fileBuffer = await file.arrayBuffer();
      const workbook = XLSX.read(fileBuffer, { type: 'array' });
      
      if (!workbook.SheetNames.length) {
        throw new Error('No sheets found in Excel file');
      }
      
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
      
      // Simple validation - check for basic structure
      const errors: ValidationError[] = [];
      const tradeGroups: any[] = [];
      let currentGroup: any[] = [];
      let groupIndex = 0;
      
      // Expected columns
      const expectedColumns = ['Broker', 'Buy/Sell', 'Product', 'Quantity', 'Period Start', 'Period End', 'Price', 'Relationship Type'];
      
      for (let i = 1; i < jsonData.length; i++) {
        const row = jsonData[i] as any[];
        
        // Check for group separator (empty row)
        const isGroupSeparator = row.length === 0 || row.every(cell => !cell);
        
        if (isGroupSeparator && currentGroup.length > 0) {
          tradeGroups.push({
            groupIndex,
            legs: currentGroup.length,
            firstRow: currentGroup[0]?.rowIndex || i
          });
          currentGroup = [];
          groupIndex++;
          continue;
        }
        
        if (row.length === 0 || row.every(cell => !cell)) {
          continue;
        }
        
        // Basic validation
        const legData = {
          broker: row[0] ? row[0].toString().trim() : '',
          buySell: row[1] ? row[1].toString().trim() : '',
          product: row[2] ? row[2].toString().trim() : '',
          quantity: row[3] ?? 0,
          rowIndex: i + 1
        };
        
        // Validate required fields
        if (!legData.broker) {
          errors.push({ row: i + 1, errors: ['Broker is required'] });
        }
        if (!legData.buySell || !['BUY', 'SELL'].includes(legData.buySell.toUpperCase())) {
          errors.push({ row: i + 1, errors: ['Buy/Sell must be BUY or SELL'] });
        }
        if (!legData.product) {
          errors.push({ row: i + 1, errors: ['Product is required'] });
        }
        if (isNaN(Number(legData.quantity))) {
          errors.push({ row: i + 1, errors: ['Quantity must be a valid number'] });
        }
        
        currentGroup.push(legData);
      }
      
      // Process the last group
      if (currentGroup.length > 0) {
        tradeGroups.push({
          groupIndex,
          legs: currentGroup.length,
          firstRow: currentGroup[0]?.rowIndex || jsonData.length
        });
      }
      
      const totalLegs = tradeGroups.reduce((acc, group) => acc + group.legs, 0);
      
      setParsedData({
        tradeGroups,
        totalTrades: tradeGroups.length,
        totalLegs,
        validationErrors: errors
      });
      
      if (errors.length === 0) {
        toast.success('File validated successfully!', {
          description: `Found ${tradeGroups.length} trade groups with ${totalLegs} legs`
        });
      } else {
        toast.error('Validation errors found', {
          description: `Found ${errors.length} errors that need to be fixed`
        });
      }
      
    } catch (error: any) {
      console.error('[VALIDATION] Validation failed:', error);
      toast.error('Validation failed', {
        description: error.message || 'An unexpected error occurred'
      });
    } finally {
      setIsValidating(false);
    }
  };

  const uploadTrades = async () => {
    if (!file || !parsedData || parsedData.validationErrors.length > 0) {
      toast.error('Please validate the file first and fix any errors');
      return;
    }

    setIsProcessing(true);
    setUploadProgress(0);
    setUploadStatus('Preparing upload...');

    try {
      console.log('[UPLOAD] Starting backend upload process');
      
      // Pause real-time subscriptions during upload if controls are available
      if (subscriptionControls) {
        subscriptionControls.pauseSubscriptions();
      }

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
        throw new Error(response.error || 'Upload failed');
      }

      // Successful upload
      setUploadProgress(100);
      setUploadStatus('Upload completed successfully');
      setUploadComplete(true);

      // Updated success toast with refresh instruction
      toast.success('Upload completed successfully!', {
        description: `Processed ${response.tradeCount} trade groups with ${response.totalLegs} legs. Please refresh the page to see the new trades.`,
        duration: 8000 // Longer duration so user has time to read the refresh instruction
      });

      // Reset form
      setFile(null);
      setParsedData(null);

      // Call the success callback if provided
      if (onUploadSuccess) {
        onUploadSuccess();
      }

    } catch (error: any) {
      console.error('[UPLOAD] Upload failed:', error);
      setUploadStatus('Upload failed');
      toast.error('Upload failed', {
        description: error.message || 'An unexpected error occurred'
      });
    } finally {
      // Reset processing state but do NOT resume subscriptions
      // User will refresh the page to see new data
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
    setParsedData(null);
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

              {file && !parsedData && (
                <div className="mt-3 flex gap-2">
                  <Button 
                    onClick={validateFile} 
                    disabled={isValidating} 
                    size="sm"
                  >
                    <Eye className="mr-2 h-4 w-4" />
                    {isValidating ? 'Validating...' : 'Validate File'}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={resetForm}
                    disabled={isValidating}
                  >
                    Clear
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Validation Results */}
          {parsedData && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg">
                  {parsedData.validationErrors.length === 0 ? (
                    <CheckCircle className="h-5 w-5 text-green-500" />
                  ) : (
                    <AlertCircle className="h-5 w-5 text-red-500" />
                  )}
                  Validation Results
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="text-sm">
                    <p><strong>Trade Groups:</strong> {parsedData.totalTrades}</p>
                    <p><strong>Total Legs:</strong> {parsedData.totalLegs}</p>
                    <p><strong>Validation Errors:</strong> {parsedData.validationErrors.length}</p>
                  </div>

                  {parsedData.validationErrors.length === 0 ? (
                    <div className="flex gap-2">
                      <Button 
                        onClick={uploadTrades} 
                        disabled={isProcessing} 
                        size="sm"
                      >
                        {isProcessing ? 'Uploading...' : 'Upload Trades'}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={resetForm}
                        disabled={isProcessing}
                      >
                        Start Over
                      </Button>
                    </div>
                  ) : (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={resetForm}
                    >
                      Fix Errors & Try Again
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

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
          {parsedData && parsedData.validationErrors.length > 0 && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Validation Errors Found</AlertTitle>
              <AlertDescription>
                <ScrollArea className="h-24 mt-2">
                  {parsedData.validationErrors.map((error, index) => (
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
