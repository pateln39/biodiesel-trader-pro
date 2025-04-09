import * as XLSX from 'xlsx';
import { mapProductToCanonical } from './productMapping';
import { formatProductDisplay } from './tradeUtils';
import { PhysicalTrade, PaperTrade } from '@/types';

/**
 * Export exposure data organized by products to Excel
 */
export const exportExposureToExcel = async (
  exposureData,
  visibleCategories,
  filteredProducts,
  grandTotals,
  groupGrandTotals,
  biodieselProducts,
  pricingInstrumentProducts
) => {
  try {
    // Create a new workbook
    const wb = XLSX.utils.book_new();

    // Prepare the data for Excel
    const data = [];

    // Add headers
    const headers = ['Month'];
    visibleCategories.forEach(category => {
      filteredProducts.filter(product => {
        if (category === 'Physical' && (product === 'ICE GASOIL FUTURES (EFP)' || product === 'ICE GASOIL FUTURES' || product === 'EFP')) {
          return false;
        }
        if (category === 'Paper' && (product === 'ICE GASOIL FUTURES (EFP)' || product === 'EFP')) {
          return false;
        }
        return true;
      }).forEach(product => {
        headers.push(product);
      });
      if (category === 'Exposure') {
        headers.push('Biodiesel Total', 'Pricing Instrument Total', 'Total Row');
      }
    });
    data.push(headers);

    // Add month data
    Object.entries(exposureData).forEach(([month, monthData]) => {
      const row = [month];
      visibleCategories.forEach(category => {
        filteredProducts.filter(product => {
          if (category === 'Physical' && (product === 'ICE GASOIL FUTURES (EFP)' || product === 'ICE GASOIL FUTURES' || product === 'EFP')) {
            return false;
          }
          if (category === 'Paper' && (product === 'ICE GASOIL FUTURES (EFP)' || product === 'EFP')) {
            return false;
          }
          return true;
        }).forEach(product => {
          const productData = monthData.products[product] || { physical: 0, pricing: 0, paper: 0, netExposure: 0 };
          let value = 0;
          if (category === 'Physical') value = productData.physical;
          else if (category === 'Pricing') value = productData.pricing;
          else if (category === 'Paper') value = productData.paper;
          else if (category === 'Exposure') value = productData.netExposure;
          row.push(value);
        });
        if (category === 'Exposure') {
          const biodieselTotal = biodieselProducts.reduce((total, product) => {
            if (monthData.products[product]) {
              return total + monthData.products[product].netExposure;
            }
            return total;
          }, 0);
          const pricingInstrumentTotal = pricingInstrumentProducts.reduce((total, product) => {
            if (monthData.products[product]) {
              return total + monthData.products[product].netExposure;
            }
            return total;
          }, 0);
          row.push(biodieselTotal, pricingInstrumentTotal, biodieselTotal + pricingInstrumentTotal);
        }
      });
      data.push(row);
    });

    // Add total row
    const totalRow = ['Total'];
    visibleCategories.forEach(category => {
      filteredProducts.filter(product => {
        if (category === 'Physical' && (product === 'ICE GASOIL FUTURES (EFP)' || product === 'ICE GASOIL FUTURES' || product === 'EFP')) {
          return false;
        }
        if (category === 'Paper' && (product === 'ICE GASOIL FUTURES (EFP)' || product === 'EFP')) {
          return false;
        }
        return true;
      }).forEach(product => {
        let value = 0;
        if (grandTotals.productTotals[product]) {
          if (category === 'Physical') value = grandTotals.productTotals[product].physical;
          else if (category === 'Pricing') value = grandTotals.productTotals[product].pricing;
          else if (category === 'Paper') value = grandTotals.productTotals[product].paper;
          else if (category === 'Exposure') value = grandTotals.productTotals[product].netExposure;
        }
        totalRow.push(value);
      });
      if (category === 'Exposure') {
        totalRow.push(groupGrandTotals.biodieselTotal, groupGrandTotals.pricingInstrumentTotal, groupGrandTotals.totalRow);
      }
    });
    data.push(totalRow);

    // Create worksheet
    const ws = XLSX.utils.aoa_to_sheet(data);

    // Add worksheet to workbook
    XLSX.utils.book_append_sheet(wb, ws, 'Exposure Data');

    // Generate and save file
    const date = new Date();
    const dateString = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    const fileName = `Exposure_${dateString}.xlsx`;
    XLSX.writeFile(wb, fileName);

    return fileName;
  } catch (error) {
    console.error('Error exporting to Excel:', error);
    throw error;
  }
};

/**
 * Export exposure data organized by trades to Excel
 */
export const exportExposureByTrade = async (openTrades = [], paperTrades = []) => {
  try {
    // Create workbook and worksheets
    const wb = XLSX.utils.book_new();
    const physicalSheet = XLSX.utils.aoa_to_sheet([]);
    const paperSheet = XLSX.utils.aoa_to_sheet([]);
    
    // Define physical trades sheet headers
    const physicalHeaders = [
      "REFERENCE", 
      "BUY/SELL", 
      "INCOTERM", 
      "QUANTITY", 
      "SUSTAINABILITY", 
      "PRODUCT", 
      "LOADING START", 
      "LOADING END", 
      "COUNTERPARTY", 
      "PRICING TYPE", 
      "FORMULA", 
      "COMMENTS",
      "CUSTOMS STATUS", 
      "CONTRACT STATUS",
      "EXPOSURE"
    ];
    
    // Define paper trades sheet headers
    const paperHeaders = [
      "TRADE REFERENCE",
      "BROKER",
      "PRODUCTS",
      "PERIOD",
      "QUANTITY",
      "PRICE",
      "EXPOSURE"
    ];
    
    // Format physical trades data
    const physicalData = [physicalHeaders];
    
    if (openTrades && openTrades.length > 0) {
      openTrades.forEach(trade => {
        // Format the formula display for regular and EFP trades
        let formulaDisplay = "No formula";
        
        if (trade.pricing_type === 'efp') {
          // For EFP trades
          const premium = trade.efp_premium || 0;
          if (trade.efp_agreed_status) {
            const fixedValue = trade.efp_fixed_value || 0;
            formulaDisplay = `ICE GASOIL FUTURES (EFP) ${fixedValue} + ${premium}`;
          } else {
            formulaDisplay = `ICE GASOIL FUTURES (EFP) + ${premium}`;
          }
        } 
        else if (trade.pricing_formula && trade.pricing_formula.tokens) {
          // For standard trades with formula tokens
          formulaDisplay = trade.pricing_formula.tokens
            .map(token => {
              if (token.type === 'instrument') return token.value;
              if (token.type === 'fixedValue') return token.value;
              if (token.type === 'operator') return token.value;
              return '';
            })
            .join(' ');
        }
        
        // Get exposure information
        let exposureInfo = "No exposure data";
        if (trade.pricing_formula) {
          // Create a flattened representation of the exposures, including monthlyDistribution
          const exposureParts = [];
          
          if (trade.pricing_formula.exposures) {
            exposureParts.push(JSON.stringify(trade.pricing_formula.exposures));
          }
          
          if (trade.pricing_formula.monthlyDistribution) {
            exposureParts.push(`Monthly Distribution: ${JSON.stringify(trade.pricing_formula.monthlyDistribution)}`);
          }
          
          exposureInfo = exposureParts.join(', ');
        }
        
        physicalData.push([
          trade.trade_reference || '',
          trade.buy_sell ? trade.buy_sell.toUpperCase() : '',
          trade.inco_term || '',
          trade.quantity || 0,
          trade.sustainability || '',
          mapProductToCanonical(trade.product) || '',
          trade.loading_period_start ? new Date(trade.loading_period_start).toLocaleDateString() : '',
          trade.loading_period_end ? new Date(trade.loading_period_end).toLocaleDateString() : '',
          trade.counterparty || '',
          trade.pricing_type || '',
          formulaDisplay,
          trade.comments || '',
          trade.customs_status || '',
          trade.contract_status || '',
          exposureInfo
        ]);
      });
    }
    
    // Format paper trades data
    const paperData = [paperHeaders];
    
    if (paperTrades && paperTrades.length > 0) {
      paperTrades.forEach(trade => {
        if (trade.legs && trade.legs.length > 0) {
          trade.legs.forEach(leg => {
            // Format product display based on relationship type
            const productDisplay = formatProductDisplay(
              leg.product,
              leg.relationshipType || 'FP',
              leg.rightSide?.product
            );
            
            // Calculate display price based on relationship type
            let displayPrice = leg.price || 0;
            if (leg.relationshipType === 'DIFF' || leg.relationshipType === 'SPREAD') {
              // For DIFF/SPREAD, we want to show the difference
              if (leg.rightSide && typeof leg.rightSide.price === 'number') {
                displayPrice = leg.price - leg.rightSide.price;
              }
            }
            
            // Extract exposure information
            let exposureInfo = "No exposure data";
            if (leg.exposures) {
              exposureInfo = JSON.stringify(leg.exposures);
            }
            
            paperData.push([
              leg.legReference || '',
              leg.broker || '',
              productDisplay,
              leg.period || '',
              leg.quantity || 0,
              displayPrice,
              exposureInfo
            ]);
          });
        }
      });
    }
    
    // Add data to worksheets
    XLSX.utils.sheet_add_aoa(physicalSheet, physicalData, { origin: "A1" });
    XLSX.utils.sheet_add_aoa(paperSheet, paperData, { origin: "A1" });
    
    // Add worksheets to workbook
    XLSX.utils.book_append_sheet(wb, physicalSheet, "Physical Trades");
    XLSX.utils.book_append_sheet(wb, paperSheet, "Paper Trades");
    
    // Apply column width formatting
    const setColumnWidths = (sheet) => {
      const range = XLSX.utils.decode_range(sheet['!ref'] || "A1:A1");
      const colCount = range.e.c - range.s.c + 1;
      
      // Set a default width of 20 characters for all columns
      const columnWidths = Array(colCount).fill({ wch: 20 });
      sheet['!cols'] = columnWidths;
    };
    
    setColumnWidths(physicalSheet);
    setColumnWidths(paperSheet);
    
    // Generate filename with current date
    const date = new Date();
    const dateString = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    const fileName = `Exposure_by_trade_${dateString}.xlsx`;
    
    // Write and save the file
    XLSX.writeFile(wb, fileName);
    
    return fileName;
  } catch (error) {
    console.error("Error exporting exposure by trade:", error);
    throw error;
  }
};
