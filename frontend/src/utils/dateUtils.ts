// Utility functions for handling dates with Indonesian timezone (UTC+7)

/**
 * Converts a date to Indonesian timezone (UTC+7) and formats it for datetime-local input
 * @param date - Date string, Date object, or null/undefined
 * @returns Formatted date string in YYYY-MM-DDTHH:MM format for datetime-local input
 */
export const formatDateForInput = (date: string | Date | null | undefined): string => {
  if (!date) {
    // Return current time in Indonesian timezone
    return formatDateForInput(new Date());
  }
  
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  // Convert to Indonesian timezone (UTC+7)
  const indonesianTime = new Date(dateObj.getTime() + (7 * 60 * 60 * 1000));
  
  // Format for datetime-local input (YYYY-MM-DDTHH:MM)
  return indonesianTime.toISOString().slice(0, 16);
};

/**
 * Gets current date and time in Indonesian timezone for datetime-local input
 * @returns Current date/time formatted for datetime-local input
 */
export const getCurrentIndonesianDateTime = (): string => {
  const now = new Date();
  // Add 7 hours for Indonesian timezone (UTC+7)
  const indonesianTime = new Date(now.getTime() + (7 * 60 * 60 * 1000));
  return indonesianTime.toISOString().slice(0, 16);
};

/**
 * Converts datetime-local input value to ISO string for backend
 * @param datetimeLocal - Value from datetime-local input
 * @returns ISO string for backend
 */
export const convertInputToISO = (datetimeLocal: string): string => {
  if (!datetimeLocal) return new Date().toISOString();
  
  // datetime-local gives us local time, just convert to ISO
  const localDate = new Date(datetimeLocal);
  return localDate.toISOString();
};

/**
 * Formats date for display in Indonesian locale
 * @param date - Date string, Date object, or null/undefined
 * @returns Formatted date string for display
 */
export const formatDateForDisplay = (date: string | Date | null | undefined): string => {
  if (!date) return '-';
  
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  return dateObj.toLocaleDateString('id-ID', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Asia/Jakarta'
  });
};