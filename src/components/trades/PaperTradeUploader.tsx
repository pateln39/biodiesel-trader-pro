
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
import { parseExcelPaperTrades, generateExcelTemplate } from '@/utils/excelPaperTradeUtils';
import { usePaperTrades } from '@/hooks/usePaperTrades';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';

interface ParsedTrade {
  groupIndex: number;
  broker: string;
  legs: any[];
  errors: string[];
}

interface ValidationError {
  row: number;
  errors: string[];
}

const PaperTradeUploader: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [parsedTrades, setParsedTrades] = useState<ParsedTrade[]>([]);
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [showPreview, setShowPreview] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { createPaperTrade } = usePaperTrades();

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

    setIsProcessing(true);
    setUploadProgress(0);

    try {
      let successCount = 0;
      
      for (let i = 0; i < parsedTrades.length; i++) {
        const trade = parsedTrades[i];
        
        await new Promise((resolve) => {
          createPaperTrade(trade, {
            onSuccess: () => {
              successCount++;
              setUploadProgress(((i + 1) / parsedTrades.length) * 100);
              resolve(true);
            },
            onError: (error: any) => {
              console.error(`Failed to create trade group ${i + 1}:`, error);
              toast.error(`Failed to create trade group ${i + 1}`, {
                description: error.message
              });
              resolve(false);
            }
          });
        });
      }

      toast.success(`Successfully uploaded ${successCount} trade groups`);
      setIsOpen(false);
      setFile(null);
      setParsedTrades([]);
      setShowPreview(false);
    } catch (error: any) {
      toast.error('Upload failed', {
        description: error.message
      });
    } finally {
      setIsProcessing(false);
      setUploadProgress(0);
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

  const totalLegs = parsedTrades.reduce((acc, trade) => acc + trade.legs.length, 0);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Upload className="mr-2 h-4 w-4" />
          Upload Excel
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle>Upload Paper Trades from Excel</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Template Download */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileSpreadsheet className="h-5 w-5" />
                Excel Template
              </CardTitle>
              <CardDescription>
                Download the Excel template to see the required format and example data
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={downloadTemplate} variant="outline">
                <Download className="mr-2 h-4 w-4" />
                Download Template
              </Button>
            </CardContent>
          </Card>

          {/* File Upload */}
          <Card>
            <CardHeader>
              <CardTitle>Upload Excel File</CardTitle>
              <CardDescription>
                Select or drag and drop your Excel file containing paper trades
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div
                className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors cursor-pointer"
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="mx-auto h-12 w-12 text-gray-400" />
                <div className="mt-4">
                  <Label className="text-lg font-medium">
                    {file ? file.name : 'Choose file or drag and drop'}
                  </Label>
                  <p className="text-sm text-gray-500 mt-2">
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
                <div className="mt-4 flex gap-2">
                  <Button onClick={parseFile} disabled={isProcessing}>
                    {isProcessing ? 'Parsing...' : 'Parse File'}
                  </Button>
                  <Button
                    variant="outline"
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
              <CardContent className="pt-6">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Processing...</span>
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
                <ScrollArea className="h-32 mt-2">
                  {validationErrors.map((error, index) => (
                    <div key={index} className="text-sm">
                      <strong>Row {error.row}:</strong> {error.errors.join(', ')}
                    </div>
                  ))}
                </ScrollArea>
              </AlertDescription>
            </Alert>
          )}

          {/* Preview */}
          {showPreview && parsedTrades.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  Preview Parsed Trades
                </CardTitle>
                <CardDescription>
                  Found {parsedTrades.length} trade groups with {totalLegs} total legs
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-64">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Group</TableHead>
                        <TableHead>Broker</TableHead>
                        <TableHead>Legs</TableHead>
                        <TableHead>Products</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {parsedTrades.map((trade, index) => (
                        <TableRow key={index}>
                          <TableCell>{index + 1}</TableCell>
                          <TableCell>{trade.broker}</TableCell>
                          <TableCell>{trade.legs.length}</TableCell>
                          <TableCell>
                            {trade.legs.map(leg => leg.product).join(', ')}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </ScrollArea>

                <div className="mt-4 flex justify-end gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setShowPreview(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={uploadTrades}
                    disabled={validationErrors.length > 0 || isProcessing}
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
