import React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent } from '@/components/ui/card';
import TableLoadingState from '@/components/trades/TableLoadingState';
import TableErrorState from '@/components/trades/TableErrorState';
import {
  formatExposureTableProduct,
  isPricingInstrument,
  shouldUseSpecialBackground,
  getExposureProductBackgroundClass
} from '@/utils/productMapping';
import { MonthlyExposure } from '@/types/exposure';

interface ExposureTableProps {
  monthData: MonthlyExposure;
  visibleCategories: string[];
  shouldShowProduct: (product: string) => boolean;
  groupProducts: (monthData: MonthlyExposure) => {
    pricingProducts: string[];
    biodieselProducts: string[];
    otherProducts: string[];
  };
  isLoading: boolean;
  error: Error | string | null;
}

const ExposureTable: React.FC<ExposureTableProps> = ({
  monthData,
  visibleCategories,
  shouldShowProduct,
  groupProducts,
  isLoading,
  error
}) => {
  if (isLoading) {
    return <TableLoadingState />;
  }

  if (error) {
    return (
      <TableErrorState
        error={error}
        onRetry={() => {}}
      />
    );
  }

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-0">
        <div className="bg-gray-50 p-4 border-b">
          <h3 className="text-lg font-medium">{monthData.month}</h3>
        </div>
        
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[200px]">Product</TableHead>
              {visibleCategories.includes('Physical') && (
                <TableHead>Physical</TableHead>
              )}
              {visibleCategories.includes('Pricing') && (
                <TableHead>Pricing</TableHead>
              )}
              {visibleCategories.includes('Paper') && (
                <TableHead>Paper</TableHead>
              )}
              {visibleCategories.includes('Exposure') && (
                <TableHead>Net Exposure</TableHead>
              )}
            </TableRow>
          </TableHeader>
          <TableBody>
            {Object.keys(monthData.products).length === 0 ? (
              <TableRow>
                <TableCell colSpan={visibleCategories.length + 1} className="text-center py-4">
                  No exposure data for this month
                </TableCell>
              </TableRow>
            ) : (
              <>
                {(() => {
                  const { pricingProducts, biodieselProducts, otherProducts } = groupProducts(monthData);
                  
                  return (
                    <>
                      {pricingProducts.length > 0 && pricingProducts.map(product => {
                        if (!shouldShowProduct(product)) return null;
                        const { physical, pricing, paper, netExposure } = monthData.products[product];
                        return (
                          <TableRow key={product} className={shouldUseSpecialBackground(product) ? getExposureProductBackgroundClass(product) : ""}>
                            <TableCell className="font-medium">
                              {formatExposureTableProduct(product)}
                              {isPricingInstrument(product) && <span className="ml-1 text-xs text-gray-500">(Instrument)</span>}
                            </TableCell>
                            {visibleCategories.includes('Physical') && (
                              <TableCell>{physical.toFixed(2)}</TableCell>
                            )}
                            {visibleCategories.includes('Pricing') && (
                              <TableCell>{pricing.toFixed(2)}</TableCell>
                            )}
                            {visibleCategories.includes('Paper') && (
                              <TableCell>{paper.toFixed(2)}</TableCell>
                            )}
                            {visibleCategories.includes('Exposure') && (
                              <TableCell className={netExposure > 0 ? "text-green-600" : netExposure < 0 ? "text-red-600" : ""}>
                                {netExposure.toFixed(2)}
                              </TableCell>
                            )}
                          </TableRow>
                        );
                      })}
                      
                      {biodieselProducts.length > 0 && biodieselProducts.map(product => {
                        if (!shouldShowProduct(product)) return null;
                        const { physical, pricing, paper, netExposure } = monthData.products[product];
                        return (
                          <TableRow key={product} className={shouldUseSpecialBackground(product) ? getExposureProductBackgroundClass(product) : ""}>
                            <TableCell className="font-medium">
                              {formatExposureTableProduct(product)}
                            </TableCell>
                            {visibleCategories.includes('Physical') && (
                              <TableCell>{physical.toFixed(2)}</TableCell>
                            )}
                            {visibleCategories.includes('Pricing') && (
                              <TableCell>{pricing.toFixed(2)}</TableCell>
                            )}
                            {visibleCategories.includes('Paper') && (
                              <TableCell>{paper.toFixed(2)}</TableCell>
                            )}
                            {visibleCategories.includes('Exposure') && (
                              <TableCell className={netExposure > 0 ? "text-green-600" : netExposure < 0 ? "text-red-600" : ""}>
                                {netExposure.toFixed(2)}
                              </TableCell>
                            )}
                          </TableRow>
                        );
                      })}
                      
                      {otherProducts.length > 0 && otherProducts.map(product => {
                        if (!shouldShowProduct(product)) return null;
                        const { physical, pricing, paper, netExposure } = monthData.products[product];
                        return (
                          <TableRow key={product}>
                            <TableCell className="font-medium">
                              {formatExposureTableProduct(product)}
                            </TableCell>
                            {visibleCategories.includes('Physical') && (
                              <TableCell>{physical.toFixed(2)}</TableCell>
                            )}
                            {visibleCategories.includes('Pricing') && (
                              <TableCell>{pricing.toFixed(2)}</TableCell>
                            )}
                            {visibleCategories.includes('Paper') && (
                              <TableCell>{paper.toFixed(2)}</TableCell>
                            )}
                            {visibleCategories.includes('Exposure') && (
                              <TableCell className={netExposure > 0 ? "text-green-600" : netExposure < 0 ? "text-red-600" : ""}>
                                {netExposure.toFixed(2)}
                              </TableCell>
                            )}
                          </TableRow>
                        );
                      })}
                      
                      <TableRow className="bg-gray-50 font-semibold">
                        <TableCell>TOTAL</TableCell>
                        {visibleCategories.includes('Physical') && (
                          <TableCell>{monthData.totals.physical.toFixed(2)}</TableCell>
                        )}
                        {visibleCategories.includes('Pricing') && (
                          <TableCell>{monthData.totals.pricing.toFixed(2)}</TableCell>
                        )}
                        {visibleCategories.includes('Paper') && (
                          <TableCell>{monthData.totals.paper.toFixed(2)}</TableCell>
                        )}
                        {visibleCategories.includes('Exposure') && (
                          <TableCell className={monthData.totals.netExposure > 0 ? "text-green-600" : monthData.totals.netExposure < 0 ? "text-red-600" : ""}>
                            {monthData.totals.netExposure.toFixed(2)}
                          </TableCell>
                        )}
                      </TableRow>
                    </>
                  );
                })()}
              </>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};

export default ExposureTable;
