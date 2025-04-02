
import { format, isWithinInterval } from 'date-fns';

export const isDateRangeInFuture = (startDate: Date, endDate: Date): boolean => {
  const now = new Date();
  return startDate > now && endDate > now;
};

export const formatDateForFutureMonth = (date: Date): string => {
  return format(date, 'MMM-yy');
};
