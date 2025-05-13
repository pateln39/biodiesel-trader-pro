
import React from 'react';
import { TableBody, TableCell, TableRow } from "@/components/ui/table";
import { MonthlyExposure, GroupTotals } from '@/types/exposure';
import { shouldShowProductInCategory } from '@/utils/exposureTableUtils';
import { getValueColorClass, formatValue, calculateProductGroupTotal } from '@/utils/exposureCalculationUtils';

interface ExposureTableBodyProps {
  exposureData: MonthlyExposure[];
  orderedVisibleCategories: string[];
  filteredProducts: string[];
  BIODIESEL_PRODUCTS: string[];
  shouldShowBiodieselTotal: boolean;
  shouldShowPricingInstrumentTotal: boolean;
  shouldShowTotalRow: boolean;
  dateRangeEnabled?: boolean;
}

const ExposureTableBody: React.FC<ExposureTableBodyProps> = ({
  exposureData,
  orderedVisibleCategories,
  filteredProducts,
  BIODIESEL_PRODUCTS,
  shouldShowBiodieselTotal,
  shouldShowPricingInstrumentTotal,
  shouldShowTotalRow,
  dateRangeEnabled
}) => {
  return (
    <TableBody>
      {exposureData.map(monthData => (
        <TableRow key={monthData.month} className="bg-brand-navy">
          <TableCell className="font-medium border-r-[1px] border-black text-xs sticky left-0 z-10 bg-brand-navy text-white">
            {monthData.month}
          </TableCell>
          
          {orderedVisibleCategories.map((category, catIndex) => {
            const categoryProducts = filteredProducts.filter(product => shouldShowProductInCategory(product, category));
            const cells = [];
            if (category === 'Physical') {
              categoryProducts.forEach((product, index) => {
                const productData = monthData.products[product] || {
                  physical: 0,
                  pricing: 0,
                  paper: 0,
                  netExposure: 0
                };
                cells.push(
                  <TableCell 
                    key={`${monthData.month}-physical-${product}`} 
                    className={`text-right text-xs p-1 text-white font-bold bg-brand-navy ${getValueColorClass(productData.physical)} ${index === categoryProducts.length - 1 && catIndex < orderedVisibleCategories.length - 1 ? 'border-r-[1px] border-black' : ''}`}
                  >
                    {formatValue(productData.physical)}
                  </TableCell>
                );
              });
            } else if (category === 'Pricing') {
              categoryProducts.forEach((product, index) => {
                const productData = monthData.products[product] || {
                  physical: 0,
                  pricing: 0,
                  paper: 0,
                  netExposure: 0
                };
                cells.push(
                  <TableCell 
                    key={`${monthData.month}-pricing-${product}`} 
                    className={`text-right text-xs p-1 text-white font-bold bg-brand-navy ${getValueColorClass(productData.pricing)} ${index === categoryProducts.length - 1 && catIndex < orderedVisibleCategories.length - 1 ? 'border-r-[1px] border-black' : ''}`}
                  >
                    {formatValue(productData.pricing)}
                  </TableCell>
                );
              });
            } else if (category === 'Paper') {
              categoryProducts.forEach((product, index) => {
                const productData = monthData.products[product] || {
                  physical: 0,
                  pricing: 0,
                  paper: 0,
                  netExposure: 0
                };
                cells.push(
                  <TableCell 
                    key={`${monthData.month}-paper-${product}`} 
                    className={`text-right text-xs p-1 text-white font-bold bg-brand-navy ${getValueColorClass(productData.paper)} ${index === categoryProducts.length - 1 && catIndex < orderedVisibleCategories.length - 1 ? 'border-r-[1px] border-black' : ''}`}
                  >
                    {formatValue(productData.paper)}
                  </TableCell>
                );
              });
            } else if (category === 'Exposure') {
              const ucomeIndex = categoryProducts.findIndex(p => p === 'Argus UCOME');
              categoryProducts.forEach((product, index) => {
                const productData = monthData.products[product] || {
                  physical: 0,
                  pricing: 0,
                  paper: 0,
                  netExposure: 0
                };
                cells.push(
                  <TableCell 
                    key={`${monthData.month}-net-${product}`} 
                    className={`text-right text-xs p-1 font-medium border-r-[1px] border-black ${getValueColorClass(productData.netExposure)} bg-brand-navy`}
                  >
                    {formatValue(productData.netExposure)}
                  </TableCell>
                );
                if (index === ucomeIndex && shouldShowBiodieselTotal) {
                  const biodieselTotal = calculateProductGroupTotal(monthData.products, BIODIESEL_PRODUCTS);
                  cells.push(
                    <TableCell 
                      key={`${monthData.month}-biodiesel-total`} 
                      className={`text-right text-xs p-1 font-medium border-r-[1px] border-black ${getValueColorClass(biodieselTotal)} bg-brand-navy`}
                    >
                      {formatValue(biodieselTotal)}
                    </TableCell>
                  );
                }
              });
              if (shouldShowPricingInstrumentTotal) {
                const pricingInstrumentTotal = calculateProductGroupTotal(monthData.products, 
                  filteredProducts.filter(p => !BIODIESEL_PRODUCTS.includes(p))
                );
                cells.push(
                  <TableCell 
                    key={`${monthData.month}-pricing-instrument-total`} 
                    className={`text-right text-xs p-1 font-medium border-r-[1px] border-black ${getValueColorClass(pricingInstrumentTotal)} bg-brand-navy`}
                  >
                    {formatValue(pricingInstrumentTotal)}
                  </TableCell>
                );
              }
              if (shouldShowTotalRow) {
                const biodieselTotal = calculateProductGroupTotal(monthData.products, BIODIESEL_PRODUCTS);
                const pricingInstrumentTotal = calculateProductGroupTotal(monthData.products, 
                  filteredProducts.filter(p => !BIODIESEL_PRODUCTS.includes(p))
                );
                const totalRow = biodieselTotal + pricingInstrumentTotal;
                cells.push(
                  <TableCell 
                    key={`${monthData.month}-total-row`} 
                    className={`text-right text-xs p-1 font-medium ${getValueColorClass(totalRow)} bg-brand-navy ${catIndex < orderedVisibleCategories.length - 1 ? 'border-r-[1px] border-black' : ''}`}
                  >
                    {formatValue(totalRow)}
                  </TableCell>
                );
              }
            }
            return cells;
          })}
        </TableRow>
      ))}
    </TableBody>
  );
};

export default ExposureTableBody;
