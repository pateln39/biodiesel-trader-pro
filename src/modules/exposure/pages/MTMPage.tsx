
import React, { useEffect, useState, useMemo } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Layout } from '@/core/components';
import { useMTMCalculation } from '../hooks/useMTMCalculation';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { DatePicker } from '@/components/ui/date-picker';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';

const MTMPage = () => {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedProduct, setSelectedProduct] = useState<string>('All');
  const { data, isLoading, error, refetch } = useMTMCalculation();

  useEffect(() => {
    refetch();
  }, [refetch]);

  const filteredData = useMemo(() => {
    if (!data) return [];

    return data.filter((item) => {
      // Filter by date
      const itemDate = new Date(item.calculationDate);
      const sameDay =
        itemDate.getDate() === selectedDate.getDate() &&
        itemDate.getMonth() === selectedDate.getMonth() &&
        itemDate.getFullYear() === selectedDate.getFullYear();

      // Filter by product
      const productMatch =
        selectedProduct === 'All' || item.product === selectedProduct;

      return sameDay && productMatch;
    });
  }, [data, selectedDate, selectedProduct]);

  const uniqueProducts = useMemo(() => {
    if (!data) return [];
    const products = new Set(data.map((item) => item.product));
    return ['All', ...Array.from(products)];
  }, [data]);

  // Calculate totals
  const totals = useMemo(() => {
    return filteredData.reduce(
      (acc, item) => {
        acc.mtmValue += item.mtmValue || 0;
        acc.pnlValue += item.pnlValue || 0;
        return acc;
      },
      { mtmValue: 0, pnlValue: 0 }
    );
  }, [filteredData]);

  // Format number for display
  const formatNumber = (num: number | null | undefined): string => {
    if (num === null || num === undefined) return '-';
    const rounded = Math.round(num * 100) / 100;
    return rounded.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
          <h1 className="text-2xl font-bold">MTM & PNL Report</h1>
          <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2 mt-2 md:mt-0">
            <DatePicker date={selectedDate} setDate={setSelectedDate} />
            <Select
              value={selectedProduct}
              onValueChange={setSelectedProduct}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Select product" />
              </SelectTrigger>
              <SelectContent>
                {uniqueProducts.map((product) => (
                  <SelectItem key={product} value={product}>
                    {product}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button onClick={() => refetch()}>Refresh</Button>
          </div>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Error loading MTM data: {error.message}
            </AlertDescription>
          </Alert>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Mark-to-Market Valuation</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="mb-4 flex justify-end space-x-4">
              <Badge variant={totals.pnlValue >= 0 ? "outline" : "destructive"} className="text-md py-1 px-3">
                PNL: {formatNumber(totals.pnlValue)} USD
              </Badge>
              <Badge variant={totals.mtmValue >= 0 ? "outline" : "destructive"} className="text-md py-1 px-3">
                MTM: {formatNumber(totals.mtmValue)} USD
              </Badge>
            </div>

            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Trade Reference</TableHead>
                    <TableHead>Product</TableHead>
                    <TableHead>Quantity</TableHead>
                    <TableHead>Trade Price</TableHead>
                    <TableHead>Market Price</TableHead>
                    <TableHead>MTM Value</TableHead>
                    <TableHead>PNL Value</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell
                        colSpan={7}
                        className="h-24 text-center"
                      >
                        Loading data...
                      </TableCell>
                    </TableRow>
                  ) : filteredData.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={7}
                        className="h-24 text-center"
                      >
                        No MTM data found for the selected date
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredData.map((item, index) => (
                      <TableRow key={index}>
                        <TableCell className="font-medium">
                          {item.tradeReference}
                        </TableCell>
                        <TableCell>{item.product}</TableCell>
                        <TableCell>
                          {formatNumber(item.quantity)} MT
                        </TableCell>
                        <TableCell>
                          {formatNumber(item.tradePrice)} USD
                        </TableCell>
                        <TableCell>
                          {formatNumber(item.marketPrice)} USD
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              (item.mtmValue || 0) >= 0
                                ? "outline"
                                : "destructive"
                            }
                          >
                            {formatNumber(item.mtmValue)} USD
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              (item.pnlValue || 0) >= 0
                                ? "outline"
                                : "destructive"
                            }
                          >
                            {formatNumber(item.pnlValue)} USD
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default MTMPage;
