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
