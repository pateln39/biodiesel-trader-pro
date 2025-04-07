
// Get an array of the next N months formatted for select components
export const getNextMonths = (numberOfMonths: number): string[] => {
  const months = [];
  const currentDate = new Date();
  const currentMonth = currentDate.getMonth();
  const currentYear = currentDate.getFullYear();
  
  for (let i = 0; i < numberOfMonths; i++) {
    const targetMonth = (currentMonth + i) % 12;
    const targetYear = currentYear + Math.floor((currentMonth + i) / 12);
    
    const date = new Date(targetYear, targetMonth, 1);
    const formattedMonth = date.toLocaleDateString('en-US', { 
      month: 'short', 
      year: 'numeric'
    });
    
    months.push(formattedMonth);
  }
  
  return months;
};

// Format a date as a month code (e.g., "May-23")
export const formatMonthCode = (date: Date): string => {
  const month = date.toLocaleString('en-US', { month: 'short' });
  const year = date.getFullYear().toString().slice(-2);
  return `${month}-${year}`;
};

// Format a date in a standard way for display (e.g., "Apr 8, 2025")
export const formatDate = (date: Date | string): string => {
  if (!date) return '';
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return dateObj.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
};

// Format a date for storage in the database (ISO format without timezone)
export const formatDateForStorage = (date: Date): string => {
  return date.toISOString().split('T')[0];
};

// Helper function to calculate business days between two dates
export const getBusinessDaysByMonth = (startDate: Date, endDate: Date): { month: string, businessDays: number }[] => {
  const result: { month: string, businessDays: number }[] = [];
  const current = new Date(startDate);
  
  // Initialize the months in the date range
  while (current <= endDate) {
    const monthCode = formatMonthCode(current);
    if (!result.find(item => item.month === monthCode)) {
      result.push({ month: monthCode, businessDays: 0 });
    }
    
    // Move to the next day
    current.setDate(current.getDate() + 1);
    
    // Skip weekends
    const dayOfWeek = current.getDay();
    if (dayOfWeek !== 0 && dayOfWeek !== 6) { // Not Sunday (0) or Saturday (6)
      const currentMonthCode = formatMonthCode(current);
      const monthEntry = result.find(item => item.month === currentMonthCode);
      if (monthEntry && current <= endDate) {
        monthEntry.businessDays++;
      }
    }
  }
  
  return result;
};

// Distribute a value across months according to business days
export const distributeValueByBusinessDays = (
  totalValue: number, 
  businessDaysByMonth: { month: string, businessDays: number }[]
): { [month: string]: number } => {
  const result: { [month: string]: number } = {};
  const totalBusinessDays = businessDaysByMonth.reduce((sum, item) => sum + item.businessDays, 0);
  
  if (totalBusinessDays === 0) return result;
  
  businessDaysByMonth.forEach(monthData => {
    const proportion = monthData.businessDays / totalBusinessDays;
    result[monthData.month] = totalValue * proportion;
  });
  
  return result;
};
