// Date formatting utilities with Thai locale support
// Formats dates in Thai Buddhist calendar format as required

import { format } from 'date-fns';
import { th } from 'date-fns/locale';

/**
 * Format date in Thai format: "20 ก.ย. 2568"
 * Converts Gregorian year to Buddhist Era (BE) by adding 543 years
 * @param date - Date to format
 * @returns Formatted Thai date string
 */
export function formatThaiDate(date: Date): string {
  // Format day and month in Thai
  const dayMonth = format(date, 'd MMM', { locale: th });
  
  // Convert Gregorian year to Buddhist Era
  const gregorianYear = date.getFullYear();
  const buddhistYear = gregorianYear + 543;
  
  return `${dayMonth} ${buddhistYear}`;
}

/**
 * Format date for display in summaries with proper Thai formatting
 * @param date - Date to format
 * @returns Formatted date string for summary display
 */
export function formatSummaryDate(date: Date): string {
  return formatThaiDate(date);
}

/**
 * Format date for HTML date input (YYYY-MM-DD format)
 * @param date - Date to format
 * @returns Date string in YYYY-MM-DD format
 */
export function formatDateForInput(date: Date): string {
  return format(date, 'yyyy-MM-dd');
}

/**
 * Parse date from HTML date input
 * @param dateString - Date string in YYYY-MM-DD format
 * @returns Parsed Date object
 */
export function parseDateFromInput(dateString: string): Date {
  return new Date(dateString);
}

/**
 * Get date N days ago from today
 * @param days - Number of days to subtract
 * @returns Date object N days ago
 */
export function getDaysAgo(days: number): Date {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date;
}

/**
 * Format date range for display
 * @param since - Start date
 * @param until - End date (optional, defaults to today)
 * @returns Formatted date range string
 */
export function formatDateRange(since: Date, until?: Date): string {
  const endDate = until || new Date();
  const sinceFormatted = formatThaiDate(since);
  const untilFormatted = formatThaiDate(endDate);
  
  if (sinceFormatted === untilFormatted) {
    return sinceFormatted;
  }
  
  return `${sinceFormatted} - ${untilFormatted}`;
}

/**
 * Check if two dates are on the same day
 * @param date1 - First date
 * @param date2 - Second date
 * @returns True if dates are on the same day
 */
export function isSameDay(date1: Date, date2: Date): boolean {
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate()
  );
}

/**
 * Group dates by day, returning a map of date strings to dates
 * @param dates - Array of dates to group
 * @returns Map of date strings (YYYY-MM-DD) to arrays of dates
 */
export function groupDatesByDay(dates: Date[]): Map<string, Date[]> {
  const groups = new Map<string, Date[]>();
  
  dates.forEach(date => {
    const dayKey = formatDateForInput(date);
    if (!groups.has(dayKey)) {
      groups.set(dayKey, []);
    }
    groups.get(dayKey)!.push(date);
  });
  
  return groups;
}
