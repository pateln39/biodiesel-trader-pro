
import React from 'react';
import { TableCell, TableRow } from "@/components/ui/table";
import { GrandTotals, GroupTotals } from '@/types/exposure';
import { getValueColorClass, formatValue } from '@/utils/exposureCalculationUtils';
import { shouldShowProductInCategory } from '@/utils/exposureTableUtils';

interface ExposureTableFooterProps {
  grandTotals: GrandTotals;
  groupGrandTotals: GroupTotals;
  orderedVisibleCategories: string[];
  filteredProducts: string[];
  shouldShowBiodieselTotal: boolean;
  shouldShowPricingInstrumentTotal: boolean;
  shouldShowTotalRow: boolean;
}

const ExposureTableFooter: React.FC<ExposureTableFooterProps> = ({
  grandTotals,
  groupGrandTotals,
  orderedVisibleCategories,
  filteredProducts,
  shouldShowBiodieselTotal,
  shouldShowPricingInstrumentTotal,
  shouldShowTotalRow,
}) => {
  return (
    <TableRow className="bg-gray-700 text-white font-bold border-t-[1px] border-black">
      <TableCell className="border-r-[1px] border-black text-xs p-1 sticky left-0 bg-gray-700 z-10 text-white">
        Total
      </TableCell>
      
      {orderedVisibleCategories.map((category, catIndex) => {
        const categoryProducts = filteredProducts.filter(product => shouldShowProductInCategory(product, category));
        const cells = [];
        if (category === 'Physical') {
          categoryProducts.forEach((product, index) => {
            cells.push(
              <TableCell 
                key={`total-physical-${product}`} 
                className={`text-right text-xs p-1 ${grandTotals.productTotals[product]?.physical > 0 ? 'text-green-300' : grandTotals.productTotals[product]?.physical < 0 ? 'text-red-300' : 'text-gray-300'} font-bold ${index === categoryProducts.length - 1 && catIndex < orderedVisibleCategories.length - 1 ? 'border-r-[1px] border-black' : ''}`}
              >
                {formatValue(grandTotals.productTotals[product]?.physical || 0)}
              </TableCell>
            );
          });
        } else if (category === 'Pricing') {
          categoryProducts.forEach((product, index) => {
            cells.push(
              <TableCell 
                key={`total-pricing-${product}`} 
                className={`text-right text-xs p-1 ${grandTotals.productTotals[product]?.pricing > 0 ? 'text-green-300' : grandTotals.productTotals[product]?.pricing < 0 ? 'text-red-300' : 'text-gray-300'} font-bold ${index === categoryProducts.length - 1 && catIndex < orderedVisibleCategories.length - 1 ? 'border-r-[1px] border-black' : ''}`}
              >
                {formatValue(grandTotals.productTotals[product]?.pricing || 0)}
              </TableCell>
            );
          });
        } else if (category === 'Paper') {
          categoryProducts.forEach((product, index) => {
            cells.push(
              <TableCell 
                key={`total-paper-${product}`} 
                className={`text-right text-xs p-1 ${grandTotals.productTotals[product]?.paper > 0 ? 'text-green-300' : grandTotals.productTotals[product]?.paper < 0 ? 'text-red-300' : 'text-gray-300'} font-bold ${index === categoryProducts.length - 1 && catIndex < orderedVisibleCategories.length - 1 ? 'border-r-[1px] border-black' : ''}`}
              >
                {formatValue(grandTotals.productTotals[product]?.paper || 0)}
              </TableCell>
            );
          });
        } else if (category === 'Exposure') {
          const ucomeIndex = categoryProducts.findIndex(p => p === 'Argus UCOME');
          categoryProducts.forEach((product, index) => {
            cells.push(
              <TableCell 
                key={`total-net-${product}`} 
                className={`text-right text-xs p-1 border-r-[1px] border-black ${grandTotals.productTotals[product]?.netExposure > 0 ? 'text-green-300' : grandTotals.productTotals[product]?.netExposure < 0 ? 'text-red-300' : 'text-gray-300'} font-bold`}
              >
                {formatValue(grandTotals.productTotals[product]?.netExposure || 0)}
              </TableCell>
            );
            if (index === ucomeIndex && shouldShowBiodieselTotal) {
              cells.push(
                <TableCell 
                  key={`total-biodiesel-total`} 
                  className={`text-right text-xs p-1 border-r-[1px] border-black ${groupGrandTotals.biodieselTotal > 0 ? 'text-green-300' : groupGrandTotals.biodieselTotal < 0 ? 'text-red-300' : 'text-gray-300'} font-bold bg-green-900`}
                >
                  {formatValue(groupGrandTotals.biodieselTotal)}
                </TableCell>
              );
            }
          });
          if (shouldShowPricingInstrumentTotal) {
            cells.push(
              <TableCell 
                key={`total-pricing-instrument-total`} 
                className={`text-right text-xs p-1 border-r-[1px] border-black ${groupGrandTotals.pricingInstrumentTotal > 0 ? 'text-green-300' : groupGrandTotals.pricingInstrumentTotal < 0 ? 'text-red-300' : 'text-gray-300'} font-bold bg-blue-900`}
              >
                {formatValue(groupGrandTotals.pricingInstrumentTotal)}
              </TableCell>
            );
          }
          if (shouldShowTotalRow) {
            cells.push(
              <TableCell 
                key={`total-total-row`} 
                className={`text-right text-xs p-1 ${groupGrandTotals.totalRow > 0 ? 'text-green-300' : groupGrandTotals.totalRow < 0 ? 'text-red-300' : 'text-gray-300'} font-bold bg-gray-800 ${catIndex < orderedVisibleCategories.length - 1 ? 'border-r-[1px] border-black' : ''}`}
              >
                {formatValue(groupGrandTotals.totalRow)}
              </TableCell>
            );
          }
        }
        return cells;
      })}
    </TableRow>
  );
};

export default ExposureTableFooter;
