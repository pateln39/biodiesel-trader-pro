
import React from 'react';
import { Helmet } from 'react-helmet-async';
import { Layout } from '@/core/components';
import { useMTMCalculation } from '../hooks/useMTMCalculation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';

const MTMPage = () => {
  const { data: mtmCalculations, isLoading, error } = useMTMCalculation();
  
  // Calculate total MTM
  const totalMTM = mtmCalculations?.reduce((sum, calc) => sum + calc.mtmValue, 0) || 0;
  
  return (
    <Layout>
      <Helmet>
        <title>Mark to Market</title>
      </Helmet>
      
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Mark to Market</h1>
            <p className="text-muted-foreground">
              View current valuations for your positions
            </p>
          </div>
          
          <Card className="w-64">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Total MTM Position</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {isLoading ? (
                  <Skeleton className="h-8 w-28" />
                ) : (
                  <span className={totalMTM >= 0 ? "text-green-600" : "text-red-600"}>
                    {totalMTM.toLocaleString('en-US', {
                      style: 'currency',
                      currency: 'USD',
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </span>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle>MTM Calculations</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                <Skeleton className="h-6 w-full" />
                <Skeleton className="h-6 w-full" />
                <Skeleton className="h-6 w-full" />
                <Skeleton className="h-6 w-full" />
              </div>
            ) : error ? (
              <div className="p-4 rounded-md bg-red-50 text-red-700">
                Error loading MTM data: {error instanceof Error ? error.message : 'Unknown error'}
              </div>
            ) : mtmCalculations && mtmCalculations.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Trade Reference</TableHead>
                    <TableHead>Counterparty</TableHead>
                    <TableHead>Product</TableHead>
                    <TableHead className="text-right">Quantity</TableHead>
                    <TableHead className="text-right">Contract Price</TableHead>
                    <TableHead className="text-right">Market Price</TableHead>
                    <TableHead className="text-right">MTM Value</TableHead>
                    <TableHead>Position</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mtmCalculations.map((calculation) => (
                    <TableRow key={calculation.tradeLegId}>
                      <TableCell className="font-medium">{calculation.tradeReference}</TableCell>
                      <TableCell>{calculation.counterparty}</TableCell>
                      <TableCell>{calculation.product}</TableCell>
                      <TableCell className="text-right">{calculation.quantity.toLocaleString()}</TableCell>
                      <TableCell className="text-right">
                        ${calculation.contractPrice.toFixed(2)}
                      </TableCell>
                      <TableCell className="text-right">
                        ${calculation.marketPrice.toFixed(2)}
                      </TableCell>
                      <TableCell className={`text-right font-bold ${calculation.mtmValue >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {calculation.mtmValue.toLocaleString('en-US', {
                          style: 'currency',
                          currency: 'USD',
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </TableCell>
                      <TableCell>
                        <Badge variant={calculation.mtmValue >= 0 ? 'success' : 'destructive'}>
                          {calculation.mtmValue >= 0 ? 'Profit' : 'Loss'}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="text-center p-6 text-muted-foreground">
                No MTM calculations available. Check if trades have pricing formulas defined.
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default MTMPage;
