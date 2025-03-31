
import React, { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Layout from '@/components/Layout';
import TradeFileUploader from '@/components/trades/import/TradeFileUploader';
import { Button } from '@/components/ui/button';
import { FileSpreadsheet, Download } from 'lucide-react';
import { downloadPhysicalTradeTemplate, downloadPaperTradeTemplate } from '@/utils/importExportUtils';
import { toast, Toaster } from 'sonner';

const BulkImportPage = () => {
  const [importType, setImportType] = useState<'physical' | 'paper'>('physical');

  const handleDownloadTemplate = () => {
    if (importType === 'physical') {
      downloadPhysicalTradeTemplate();
      toast.success('Physical trade template downloaded');
    } else {
      downloadPaperTradeTemplate();
      toast.success('Paper trade template downloaded');
    }
  };

  return (
    <Layout>
      <Helmet>
        <title>Bulk Trade Import</title>
      </Helmet>
      
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Bulk Trade Import</h1>
          <p className="text-muted-foreground">
            Import multiple trades from Excel files
          </p>
        </div>

        <Separator />

        <Card>
          <CardHeader>
            <CardTitle>Import Trades</CardTitle>
            <CardDescription>
              Download a template, fill it with your trade data, and upload it to import multiple trades at once.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs 
              defaultValue="physical" 
              value={importType}
              onValueChange={(value) => setImportType(value as 'physical' | 'paper')}
              className="w-full"
            >
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="physical">Physical Trades</TabsTrigger>
                <TabsTrigger value="paper">Paper Trades</TabsTrigger>
              </TabsList>
              
              <TabsContent value="physical" className="space-y-6">
                <div className="flex flex-col space-y-2">
                  <p className="text-sm text-muted-foreground">
                    The physical trade template contains separate sheets for parent trades and trade legs.
                    All required fields must be completed for successful import.
                  </p>
                  <div>
                    <Button 
                      variant="outline" 
                      onClick={handleDownloadTemplate}
                      className="flex items-center gap-2"
                    >
                      <Download className="h-4 w-4" />
                      Download Physical Trade Template
                    </Button>
                  </div>
                </div>
                
                <TradeFileUploader importType="physical" />
              </TabsContent>
              
              <TabsContent value="paper" className="space-y-6">
                <div className="flex flex-col space-y-2">
                  <p className="text-sm text-muted-foreground">
                    The paper trade template contains separate sheets for broker details and trade legs.
                    All required fields must be completed for successful import.
                  </p>
                  <div>
                    <Button 
                      variant="outline" 
                      onClick={handleDownloadTemplate}
                      className="flex items-center gap-2"
                    >
                      <Download className="h-4 w-4" />
                      Download Paper Trade Template
                    </Button>
                  </div>
                </div>
                
                <TradeFileUploader importType="paper" />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
      
      <Toaster />
    </Layout>
  );
};

export default BulkImportPage;
