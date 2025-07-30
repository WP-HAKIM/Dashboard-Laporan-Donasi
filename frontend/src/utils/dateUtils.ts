// Utility functions for handling dates with Indonesian timezone (UTC+7)

/**
 * Converts a date to Indonesian timezone and formats it for datetime-local input
 * @param date - Date string, Date object, or null/undefined
 * @returns Formatted date string in YYYY-MM-DDTHH:MM format for datetime-local input
 */
export const formatDateForInput = (date: string | Date | null | undefined): string => {
  if (!date) {
    // Return current time in local timezone
    return formatDateForInput(new Date());
  }
  
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  // Convert to Indonesian timezone (UTC+7) for consistent display
  // Use local time methods to get the actual local time representation
  const year = dateObj.getFullYear();
  const month = String(dateObj.getMonth() + 1).padStart(2, '0');
  const day = String(dateObj.getDate()).padStart(2, '0');
  const hours = String(dateObj.getHours()).padStart(2, '0');
  const minutes = String(dateObj.getMinutes()).padStart(2, '0');
  
  // Format for datetime-local input (YYYY-MM-DDTHH:MM)
  return `${year}-${month}-${day}T${hours}:${minutes}`;
};

/**
 * Gets current date and time in local timezone for datetime-local input
 * @returns Current date/time formatted for datetime-local input
 */
export const getCurrentIndonesianDateTime = (): string => {
  return formatDateForInput(new Date());
};

/**
 * Converts datetime-local input value to ISO string for backend
 * @param datetimeLocal - Value from datetime-local input
 * @returns ISO string for backend
 */
export const convertInputToISO = (datetimeLocal: string): string => {
  if (!datetimeLocal) return new Date().toISOString();
  
  // datetime-local gives us time without timezone info
  // We treat it as UTC time directly since we're not doing timezone conversion
  const utcTime = new Date(datetimeLocal + 'Z');
  
  return utcTime.toISOString();
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
    minute: '2-digit'
  });
};