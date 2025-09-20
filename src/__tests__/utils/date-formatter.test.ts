// Unit tests for date formatting utilities
// Tests Thai Buddhist calendar formatting and date manipulation functions

import {
  formatThaiDate,
  formatSummaryDate,
  formatDateForInput,
  parseDateFromInput,
  getDaysAgo,
  formatDateRange,
  isSameDay,
  groupDatesByDay
} from '@/lib/utils/date-formatter';

describe('Date Formatter Utilities', () => {
  describe('formatThaiDate', () => {
    it('should format date in Thai Buddhist calendar format', () => {
      const date = new Date('2025-09-20');
      const result = formatThaiDate(date);
      
      // Should be in format "20 ก.ย. 2568" (Gregorian + 543 years)
      expect(result).toMatch(/^\d{1,2}\s[ก-ฮ\.]+\s\d{4}$/);
      expect(result).toContain('2568'); // 2025 + 543
    });

    it('should handle different months correctly', () => {
      const januaryDate = new Date('2025-01-15');
      const decemberDate = new Date('2025-12-25');
      
      const januaryResult = formatThaiDate(januaryDate);
      const decemberResult = formatThaiDate(decemberDate);
      
      expect(januaryResult).toContain('15');
      expect(januaryResult).toContain('2568');
      expect(decemberResult).toContain('25');
      expect(decemberResult).toContain('2568');
    });

    it('should handle leap years correctly', () => {
      const leapYearDate = new Date('2024-02-29');
      const result = formatThaiDate(leapYearDate);
      
      expect(result).toContain('29');
      expect(result).toContain('2567'); // 2024 + 543
    });
  });

  describe('formatSummaryDate', () => {
    it('should format date for summary display', () => {
      const date = new Date('2025-09-20');
      const result = formatSummaryDate(date);
      
      // Should use same format as formatThaiDate
      expect(result).toBe(formatThaiDate(date));
    });
  });

  describe('formatDateForInput', () => {
    it('should format date for HTML date input (YYYY-MM-DD)', () => {
      const date = new Date('2025-09-20');
      const result = formatDateForInput(date);
      
      expect(result).toBe('2025-09-20');
    });

    it('should handle single digit months and days', () => {
      const date = new Date('2025-01-05');
      const result = formatDateForInput(date);
      
      expect(result).toBe('2025-01-05');
    });
  });

  describe('parseDateFromInput', () => {
    it('should parse date from HTML date input format', () => {
      const dateString = '2025-09-20';
      const result = parseDateFromInput(dateString);
      
      expect(result).toBeInstanceOf(Date);
      expect(result.getFullYear()).toBe(2025);
      expect(result.getMonth()).toBe(8); // September (0-indexed)
      expect(result.getDate()).toBe(20);
    });

    it('should handle invalid date strings', () => {
      const invalidDateString = 'invalid-date';
      const result = parseDateFromInput(invalidDateString);
      
      expect(result).toBeInstanceOf(Date);
      expect(isNaN(result.getTime())).toBe(true);
    });
  });

  describe('getDaysAgo', () => {
    it('should return date N days ago', () => {
      const today = new Date();
      const sevenDaysAgo = getDaysAgo(7);
      
      const diffInMs = today.getTime() - sevenDaysAgo.getTime();
      const diffInDays = Math.round(diffInMs / (1000 * 60 * 60 * 24));
      
      expect(diffInDays).toBe(7);
    });

    it('should handle zero days', () => {
      const today = new Date();
      const result = getDaysAgo(0);
      
      // Should be same day (allowing for small time differences)
      expect(Math.abs(today.getTime() - result.getTime())).toBeLessThan(1000);
    });

    it('should handle large numbers of days', () => {
      const result = getDaysAgo(365);
      const today = new Date();
      
      const diffInMs = today.getTime() - result.getTime();
      const diffInDays = Math.round(diffInMs / (1000 * 60 * 60 * 24));
      
      expect(diffInDays).toBe(365);
    });
  });

  describe('formatDateRange', () => {
    it('should format date range with different dates', () => {
      const startDate = new Date('2025-09-15');
      const endDate = new Date('2025-09-20');
      const result = formatDateRange(startDate, endDate);
      
      expect(result).toContain(' - ');
      expect(result).toContain('2568'); // Both dates should have Buddhist year
    });

    it('should format single date when dates are the same', () => {
      const date = new Date('2025-09-20');
      const result = formatDateRange(date, date);
      
      expect(result).not.toContain(' - ');
      expect(result).toBe(formatThaiDate(date));
    });

    it('should use today as default end date', () => {
      const startDate = new Date('2025-09-15');
      const result = formatDateRange(startDate);
      
      // Should contain start date and current date
      expect(result).toContain('2568');
    });
  });

  describe('isSameDay', () => {
    it('should return true for same day', () => {
      const date1 = new Date('2025-09-20T10:00:00');
      const date2 = new Date('2025-09-20T15:30:00');
      
      expect(isSameDay(date1, date2)).toBe(true);
    });

    it('should return false for different days', () => {
      const date1 = new Date('2025-09-20');
      const date2 = new Date('2025-09-21');
      
      expect(isSameDay(date1, date2)).toBe(false);
    });

    it('should return false for different months', () => {
      const date1 = new Date('2025-09-20');
      const date2 = new Date('2025-10-20');
      
      expect(isSameDay(date1, date2)).toBe(false);
    });

    it('should return false for different years', () => {
      const date1 = new Date('2025-09-20');
      const date2 = new Date('2024-09-20');
      
      expect(isSameDay(date1, date2)).toBe(false);
    });
  });

  describe('groupDatesByDay', () => {
    it('should group dates by day', () => {
      const dates = [
        new Date('2025-09-20T10:00:00'),
        new Date('2025-09-20T15:00:00'),
        new Date('2025-09-21T09:00:00'),
        new Date('2025-09-21T14:00:00'),
        new Date('2025-09-22T11:00:00')
      ];

      const result = groupDatesByDay(dates);

      expect(result.size).toBe(3);
      expect(result.get('2025-09-20')).toHaveLength(2);
      expect(result.get('2025-09-21')).toHaveLength(2);
      expect(result.get('2025-09-22')).toHaveLength(1);
    });

    it('should handle empty array', () => {
      const result = groupDatesByDay([]);
      
      expect(result.size).toBe(0);
    });

    it('should handle single date', () => {
      const dates = [new Date('2025-09-20')];
      const result = groupDatesByDay(dates);

      expect(result.size).toBe(1);
      expect(result.get('2025-09-20')).toHaveLength(1);
    });

    it('should preserve original date objects', () => {
      const originalDate = new Date('2025-09-20T10:30:00');
      const dates = [originalDate];
      const result = groupDatesByDay(dates);

      const groupedDates = result.get('2025-09-20');
      expect(groupedDates?.[0]).toBe(originalDate);
      expect(groupedDates?.[0].getHours()).toBe(10);
      expect(groupedDates?.[0].getMinutes()).toBe(30);
    });
  });
});
