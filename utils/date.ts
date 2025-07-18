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