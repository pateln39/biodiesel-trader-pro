
import React from 'react';
import { TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatExposureTableProduct } from '@/utils/productMapping';
import { getExposureProductBackgroundClass, getCategoryColorClass, shouldShowProductInCategory } from '@/utils/exposureTableUtils';

interface ExposureTableHeaderProps {
  orderedVisibleCategories: string[];
  filteredProducts: string[];
  shouldShowBiodieselTotal: boolean;
  shouldShowPricingInstrumentTotal: boolean;
  shouldShowTotalRow: boolean;
}

const ExposureTableHeader: React.FC<ExposureTableHeaderProps> = ({
  orderedVisibleCategories,
  filteredProducts,
  shouldShowBiodieselTotal,
  shouldShowPricingInstrumentTotal,
  shouldShowTotalRow
}) => {
  return (
    <TableHeader>
      <TableRow className="bg-muted/50 border-b-[1px] border-black">
        <TableHead 
          rowSpan={2} 
          className="border-r-[1px] border-b-[1px] border-black text-left p-1 font-bold text-white text-xs bg-brand-navy sticky left-0 z-10"
        >
          Month
        </TableHead>
        {orderedVisibleCategories.map((category, catIndex) => {
          let colSpan = filteredProducts.filter(product => shouldShowProductInCategory(product, category)).length;
          if (category === 'Exposure') {
            if (shouldShowPricingInstrumentTotal) colSpan += 1;
            if (shouldShowTotalRow) colSpan += 1;
          }
          return (
            <TableHead 
              key={category} 
              colSpan={colSpan} 
              className={`text-center p-1 font-bold text-white text-xs border-b-[1px] ${catIndex < orderedVisibleCategories.length - 1 ? 'border-r-[1px]' : ''} border-black`}
            >
              {category}
            </TableHead>
          );
        })}
      </TableRow>
      
      <TableRow className="bg-muted/30 border-b-[1px] border-black">
        {orderedVisibleCategories.flatMap((category, catIndex) => {
          const categoryProducts = filteredProducts.filter(product => shouldShowProductInCategory(product, category));
          if (category === 'Exposure') {
            const ucomeIndex = categoryProducts.findIndex(p => p === 'Argus UCOME');
            const headers = [];
            categoryProducts.forEach((product, index) => {
              headers.push(
                <TableHead 
                  key={`${category}-${product}`} 
                  className={`text-right p-1 text-xs whitespace-nowrap border-t-0 border-r-[1px] border-black ${getExposureProductBackgroundClass(product)} text-white font-bold`}
                >
                  {formatExposureTableProduct(product)}
                </TableHead>
              );
              if (index === ucomeIndex && shouldShowBiodieselTotal) {
                headers.push(
                  <TableHead 
                    key={`${category}-biodiesel-total`} 
                    className={`text-right p-1 text-xs whitespace-nowrap border-t-0 border-r-[1px] border-black ${getCategoryColorClass(category)} text-white font-bold`}
                  >
                    Total Biodiesel
                  </TableHead>
                );
              }
            });
            if (shouldShowPricingInstrumentTotal) {
              headers.push(
                <TableHead 
                  key={`${category}-pricing-instrument-total`} 
                  className={`text-right p-1 text-xs whitespace-nowrap border-t-0 border-r-[1px] border-black ${getExposureProductBackgroundClass('', false, true)} text-white font-bold`}
                >
                  Total Pricing Instrument
                </TableHead>
              );
            }
            if (shouldShowTotalRow) {
              headers.push(
                <TableHead 
                  key={`${category}-total-row`} 
                  className={`text-right p-1 text-xs whitespace-nowrap border-t-0 ${getExposureProductBackgroundClass('', true)} ${catIndex < orderedVisibleCategories.length - 1 ? 'border-r-[1px] border-black' : ''} text-white font-bold`}
                >
                  Total Row
                </TableHead>
              );
            }
            return headers;
          } else {
            return categoryProducts.map((product, index) => (
              <TableHead 
                key={`${category}-${product}`} 
                className={`text-right p-1 text-xs whitespace-nowrap border-t-0 ${getCategoryColorClass(category)} ${index === categoryProducts.length - 1 && catIndex < orderedVisibleCategories.length - 1 ? 'border-r-[1px] border-black' : ''} ${index > 0 ? 'border-l-[0px]' : ''} text-white font-bold`}
              >
                {formatExposureTableProduct(product)}
              </TableHead>
            ));
          }
        })}
      </TableRow>
    </TableHeader>
  );
};

export default ExposureTableHeader;
