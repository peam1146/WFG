// Unit tests for Git validation schemas
// Tests Zod validation schemas for form inputs and data validation

import {
  FilterCriteriaSchema,
  GitFilterFormSchema,
  DailySummarySchema,
  SummaryGenerationFormSchema,
  GitCommitSchema
} from '@/lib/validations/git';
import { subDays } from 'date-fns';

describe('Git Validation Schemas', () => {
  describe('FilterCriteriaSchema', () => {
    it('should validate valid filter criteria', () => {
      const validData = {
        author: 'John Doe',
        since: new Date('2025-09-15')
      };

      const result = FilterCriteriaSchema.safeParse(validData);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.author).toBe('John Doe');
        expect(result.data.since).toBeInstanceOf(Date);
      }
    });

    it('should reject empty author name', () => {
      const invalidData = {
        author: '',
        since: new Date('2025-09-15')
      };

      const result = FilterCriteriaSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('Author name is required');
      }
    });

    it('should reject future dates', () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 1);

      const invalidData = {
        author: 'John Doe',
        since: futureDate
      };

      const result = FilterCriteriaSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('Date cannot be in the future');
      }
    });

    it('should reject dates older than 31 days', () => {
      const oldDate = subDays(new Date(), 32);

      const invalidData = {
        author: 'John Doe',
        since: oldDate
      };

      const result = FilterCriteriaSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('Date must be within last 31 days');
      }
    });

    it('should trim whitespace from author name', () => {
      const dataWithWhitespace = {
        author: '  John Doe  ',
        since: new Date('2025-09-15')
      };

      const result = FilterCriteriaSchema.safeParse(dataWithWhitespace);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.author).toBe('John Doe');
      }
    });

    it('should reject author names that are too long', () => {
      const longAuthorName = 'a'.repeat(256);
      const invalidData = {
        author: longAuthorName,
        since: new Date('2025-09-15')
      };

      const result = FilterCriteriaSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('Author name must be less than 255 characters');
      }
    });
  });

  describe('GitFilterFormSchema', () => {
    it('should validate and transform form data', () => {
      const formData = {
        author: 'John Doe',
        since: '2025-09-15'
      };

      const result = GitFilterFormSchema.safeParse(formData);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.author).toBe('John Doe');
        expect(result.data.since).toBeInstanceOf(Date);
        expect(result.data.since.getFullYear()).toBe(2025);
      }
    });

    it('should reject invalid date strings', () => {
      const invalidData = {
        author: 'John Doe',
        since: 'invalid-date'
      };

      const result = GitFilterFormSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('Invalid date format');
      }
    });

    it('should reject empty date string', () => {
      const invalidData = {
        author: 'John Doe',
        since: ''
      };

      const result = GitFilterFormSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('Since date is required');
      }
    });
  });

  describe('SummaryGenerationFormSchema', () => {
    it('should validate form data with refresh parameter', () => {
      const formData = {
        author: 'John Doe',
        since: '2025-09-15',
        refresh: 'true'
      };

      const result = SummaryGenerationFormSchema.safeParse(formData);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.author).toBe('John Doe');
        expect(result.data.since).toBeInstanceOf(Date);
        expect(result.data.refresh).toBe(true);
      }
    });

    it('should handle missing refresh parameter', () => {
      const formData = {
        author: 'John Doe',
        since: '2025-09-15'
      };

      const result = SummaryGenerationFormSchema.safeParse(formData);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.refresh).toBe(false);
      }
    });

    it('should handle null refresh parameter', () => {
      const formData = {
        author: 'John Doe',
        since: '2025-09-15',
        refresh: null
      };

      const result = SummaryGenerationFormSchema.safeParse(formData);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.refresh).toBe(false);
      }
    });

    it('should transform refresh string to boolean', () => {
      const trueCases = ['true', 'TRUE', 'True'];
      const falseCases = ['false', 'FALSE', 'False', '', 'anything-else'];

      trueCases.forEach(value => {
        const formData = {
          author: 'John Doe',
          since: '2025-09-15',
          refresh: value
        };

        const result = SummaryGenerationFormSchema.safeParse(formData);
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.refresh).toBe(value === 'true');
        }
      });
    });
  });

  describe('DailySummarySchema', () => {
    it('should validate valid daily summary data', () => {
      const validData = {
        authorName: 'John Doe',
        summaryDate: new Date('2025-09-20'),
        summaryText: '20 ก.ย. 2568\n- Added new feature\n- Fixed bug',
        repositoryUrl: 'https://github.com/user/repo'
      };

      const result = DailySummarySchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should reject empty summary text', () => {
      const invalidData = {
        authorName: 'John Doe',
        summaryDate: new Date('2025-09-20'),
        summaryText: '',
        repositoryUrl: 'https://github.com/user/repo'
      };

      const result = DailySummarySchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('Summary text is required');
      }
    });

    it('should reject invalid repository URL', () => {
      const invalidData = {
        authorName: 'John Doe',
        summaryDate: new Date('2025-09-20'),
        summaryText: 'Summary text',
        repositoryUrl: 'not-a-valid-url'
      };

      const result = DailySummarySchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('Invalid repository URL');
      }
    });
  });

  describe('GitCommitSchema', () => {
    it('should validate valid Git commit data', () => {
      const validData = {
        hash: 'abc123def456',
        author: 'John Doe',
        email: 'john@example.com',
        date: new Date('2025-09-20'),
        message: 'feat: Add new feature',
        isMerge: false
      };

      const result = GitCommitSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should reject empty commit hash', () => {
      const invalidData = {
        hash: '',
        author: 'John Doe',
        email: 'john@example.com',
        date: new Date('2025-09-20'),
        message: 'feat: Add new feature',
        isMerge: false
      };

      const result = GitCommitSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('Commit hash is required');
      }
    });

    it('should reject invalid email format', () => {
      const invalidData = {
        hash: 'abc123def456',
        author: 'John Doe',
        email: 'invalid-email',
        date: new Date('2025-09-20'),
        message: 'feat: Add new feature',
        isMerge: false
      };

      const result = GitCommitSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('Invalid email format');
      }
    });

    it('should reject empty commit message', () => {
      const invalidData = {
        hash: 'abc123def456',
        author: 'John Doe',
        email: 'john@example.com',
        date: new Date('2025-09-20'),
        message: '',
        isMerge: false
      };

      const result = GitCommitSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('Commit message is required');
      }
    });

    it('should validate merge commit flag', () => {
      const mergeCommitData = {
        hash: 'abc123def456',
        author: 'John Doe',
        email: 'john@example.com',
        date: new Date('2025-09-20'),
        message: 'Merge branch feature',
        isMerge: true
      };

      const result = GitCommitSchema.safeParse(mergeCommitData);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.isMerge).toBe(true);
      }
    });
  });
});
