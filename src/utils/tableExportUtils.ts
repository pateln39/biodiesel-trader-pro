
import * as XLSX from 'xlsx';

/**
 * Exports table data to Excel with proper formatting
 * @param tableData Array of data objects
 * @param fileName Name of the file to be downloaded
 * @param title Title to be displayed at the top of the Excel sheet
 * @param excludeColumns Array of column keys to exclude from export
 */
export const exportTableToExcel = (
  tableData: Record<string, any>[],
  fileName: string,
  title: string,
  excludeColumns: string[] = ['actions']
) => {
  // Create workbook and worksheet
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.aoa_to_sheet([]);
  
  // Set column widths
  const wscols = Array(20).fill({ wch: 15 });
  ws['!cols'] = wscols;
  
  // Add title
  const titleRow = [[title]];
  XLSX.utils.sheet_add_aoa(ws, titleRow, { origin: "A1" });
  
  // Create a merged cell for the title
  if (!ws['!merges']) ws['!merges'] = [];
  
  // Get all column keys from the first data item, excluding any specified columns
  const allKeys = tableData.length > 0 
    ? Object.keys(tableData[0]).filter(key => !excludeColumns.includes(key.toLowerCase()))
    : [];
  
  // If we have data, merge the title cell across all columns
  if (allKeys.length > 0) {
    ws['!merges'].push({ 
      s: { r: 0, c: 0 }, 
      e: { r: 0, c: allKeys.length - 1 } 
    });
  }
  
  // Apply styling to title cell
  if (!ws['!cells']) ws['!cells'] = {};
  ws['!cells']["A1"] = { 
    t: "s", 
    v: title, 
    s: { 
      font: { bold: true, sz: 14 },
      alignment: { horizontal: "center" }
    } 
  };
  
  // Add header row (capitalizing each header)
  const headerRow = allKeys.map(key => {
    // Convert camelCase to proper spaced words and uppercase
    return key
      .replace(/([A-Z])/g, ' $1') // Add space before capital letters
      .replace(/^./, str => str.toUpperCase()) // Capitalize first letter
      .trim()
      .toUpperCase();
  });
  
  // Add an empty row after title for spacing
  XLSX.utils.sheet_add_aoa(ws, [[]], { origin: "A2" });
  
  // Add headers at row 3
  XLSX.utils.sheet_add_aoa(ws, [headerRow], { origin: "A3" });
  
  // Apply header styling
  headerRow.forEach((header, index) => {
    const cellRef = XLSX.utils.encode_cell({ r: 2, c: index });
    ws['!cells'][cellRef] = {
      t: "s",
      v: header,
      s: {
        font: { bold: true, color: { rgb: "FFFFFF" } },
        fill: { patternType: "solid", fgColor: { rgb: "4472C4" } },
        alignment: { horizontal: "center" },
        border: {
          top: { style: "thin", color: { rgb: "000000" } },
          bottom: { style: "thin", color: { rgb: "000000" } },
          left: { style: "thin", color: { rgb: "000000" } },
          right: { style: "thin", color: { rgb: "000000" } }
        }
      }
    };
  });
  
  // Create data rows
  const dataRows = tableData.map(item => {
    return allKeys.map(key => {
      // Convert any non-string values to strings for display
      const value = item[key];
      if (value === null || value === undefined) return '';
      if (typeof value === 'object' && value !== null) {
        try {
          return JSON.stringify(value);
        } catch (e) {
          return String(value);
        }
      }
      return String(value);
    });
  });
  
  // Add data rows starting at row 4
  XLSX.utils.sheet_add_aoa(ws, dataRows, { origin: "A4" });
  
  // Apply basic styling to all data cells
  dataRows.forEach((row, rowIndex) => {
    row.forEach((cell, colIndex) => {
      const cellRef = XLSX.utils.encode_cell({ r: rowIndex + 3, c: colIndex });
      ws['!cells'][cellRef] = {
        t: "s",
        v: cell,
        s: {
          border: {
            top: { style: "thin", color: { rgb: "000000" } },
            bottom: { style: "thin", color: { rgb: "000000" } },
            left: { style: "thin", color: { rgb: "000000" } },
            right: { style: "thin", color: { rgb: "000000" } }
          }
        }
      };
    });
  });
  
  // Add the worksheet to the workbook
  XLSX.utils.book_append_sheet(wb, ws, "Sheet1");
  
  // Write and download the file
  XLSX.writeFile(wb, fileName);
};

/**
 * Formats a date in the format YYYY-MM-DD for use in filenames
 */
export const getFormattedDate = (): string => {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};
