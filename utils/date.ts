/**
 * `YYYY-MM-DD` from a date picker to the ISO instant the API expects.
 *
 * Anchored to the local day, the same zone `formatDate` below renders in, so a range
 * covers the days the cards actually show. Built from the parts rather than parsing the
 * string: `new Date('2025-10-15')` is read as UTC midnight and lands on the 14th here.
 */
export const startOfDayISO = (date: string | null | undefined): string | undefined => {
  if (!date) return undefined;

  const [year, month, day] = date.split('-').map(Number);
  return new Date(year, month - 1, day).toISOString();
};

/** Closing instant of the day — the end of a range is inclusive. */
export const endOfDayISO = (date: string | null | undefined): string | undefined => {
  if (!date) return undefined;

  const [year, month, day] = date.split('-').map(Number);
  return new Date(year, month - 1, day, 23, 59, 59, 999).toISOString();
};

export const formatDate = (dateString: string, locale: string = 'en', format: 'short' | 'long' = 'short'): string => {
  if (!dateString) return '';
  
  try {
    const date = new Date(dateString);
    
    const options: Intl.DateTimeFormatOptions = {
      year: 'numeric',
      month: format === 'short' ? 'short' : 'long',
      day: 'numeric'
    };
    
    return date.toLocaleDateString(locale, options);
  } catch (error) {
    console.error('Error formatting date:', error);
    return dateString;
  }
};