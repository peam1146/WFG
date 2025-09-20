// Unit tests for AI prompt generation
// Tests the prompt template system and generation logic

import { 
  generateCommitSummaryPrompt,
  generateFeatureSummaryPrompt,
  generateTimeBasedSummaryPrompt,
  generateConciseSummaryPrompt,
  getOptimalPromptTemplate,
  PROMPT_TEMPLATES,
  DEFAULT_SYSTEM_PROMPT
} from '@/lib/prompts/summary-prompts';
import { GitCommit } from '@/types/git';

// Mock commit data for testing
const mockCommits: GitCommit[] = [
  {
    hash: 'abc123',
    author: 'John Doe',
    email: 'john@example.com',
    date: new Date('2025-09-20T10:00:00Z'),
    message: 'feat: Add user authentication system',
    isMerge: false
  },
  {
    hash: 'def456',
    author: 'John Doe',
    email: 'john@example.com',
    date: new Date('2025-09-20T14:30:00Z'),
    message: 'fix: Resolve login validation issues',
    isMerge: false
  },
  {
    hash: 'ghi789',
    author: 'John Doe',
    email: 'john@example.com',
    date: new Date('2025-09-20T16:45:00Z'),
    message: 'refactor: Update user service for better performance',
    isMerge: false
  }
];

const mockContext = {
  commits: mockCommits,
  author: 'John Doe',
  date: new Date('2025-09-20'),
  thaiDate: '20 ก.ย. 2568',
  repositoryUrl: 'file:///test/repo'
};

describe('AI Prompt Generation', () => {
  describe('generateCommitSummaryPrompt', () => {
    it('should generate a basic commit summary prompt', () => {
      const prompt = generateCommitSummaryPrompt(mockContext);
      
      expect(prompt).toContain('Transform these Git commits into a coherent daily work summary');
      expect(prompt).toContain('20 ก.ย. 2568');
      expect(prompt).toContain('John Doe');
      expect(prompt).toContain('feat: Add user authentication system');
      expect(prompt).toContain('fix: Resolve login validation issues');
      expect(prompt).toContain('refactor: Update user service for better performance');
      expect(prompt).toContain('Total commits: 3');
    });

    it('should include commit hashes and timestamps', () => {
      const prompt = generateCommitSummaryPrompt(mockContext);
      
      expect(prompt).toContain('abc123');
      expect(prompt).toContain('def456');
      expect(prompt).toContain('ghi789');
      expect(prompt).toContain('at 10:00');
      expect(prompt).toContain('at 14:30');
      expect(prompt).toContain('at 16:45');
    });

    it('should include formatting requirements', () => {
      const prompt = generateCommitSummaryPrompt(mockContext);
      
      expect(prompt).toContain('Group related commits into logical work items');
      expect(prompt).toContain('Explain technical changes in business terms');
      expect(prompt).toContain('Format date as Thai Buddhist calendar');
      expect(prompt).toContain('Keep summary concise but informative');
    });
  });

  describe('generateFeatureSummaryPrompt', () => {
    it('should categorize commits by type', () => {
      const prompt = generateFeatureSummaryPrompt(mockContext);
      
      expect(prompt).toContain('feature-focused work summary');
      expect(prompt).toContain('Features: 1 commits');
      expect(prompt).toContain('Bug fixes: 1 commits');
      expect(prompt).toContain('Refactoring: 1 commits');
      expect(prompt).toContain('Other: 0 commits');
    });

    it('should organize output by work type', () => {
      const prompt = generateFeatureSummaryPrompt(mockContext);
      
      expect(prompt).toContain('[Major feature work]');
      expect(prompt).toContain('[Bug fixes and stability improvements]');
      expect(prompt).toContain('[Code quality and performance enhancements]');
      expect(prompt).toContain('[Other contributions]');
    });
  });

  describe('generateTimeBasedSummaryPrompt', () => {
    it('should group commits by time periods', () => {
      const prompt = generateTimeBasedSummaryPrompt(mockContext);
      
      expect(prompt).toContain('time-based work summary');
      expect(prompt).toContain('Morning (00:00-11:59)');
      expect(prompt).toContain('Afternoon (12:00-17:59)');
      expect(prompt).toContain('Evening (18:00-23:59)');
    });

    it('should show work progression throughout the day', () => {
      const prompt = generateTimeBasedSummaryPrompt(mockContext);
      
      expect(prompt).toContain('[Morning work focus and achievements]');
      expect(prompt).toContain('[Afternoon development and progress]');
      expect(prompt).toContain('[Evening completion and wrap-up]');
      expect(prompt).toContain('[Overall daily accomplishments]');
    });
  });

  describe('generateConciseSummaryPrompt', () => {
    it('should limit output to maximum 3 bullet points', () => {
      const prompt = generateConciseSummaryPrompt(mockContext);
      
      expect(prompt).toContain('maximum 3 bullet points');
      expect(prompt).toContain('[Major accomplishment 1]');
      expect(prompt).toContain('[Major accomplishment 2]');
      expect(prompt).toContain('[Major accomplishment 3 (if applicable)]');
    });

    it('should extract action words from commit messages', () => {
      const prompt = generateConciseSummaryPrompt(mockContext);
      
      expect(prompt).toContain('Added: feat: Add user authentication system');
      expect(prompt).toContain('Fixed: fix: Resolve login validation issues');
      expect(prompt).toContain('Improved: refactor: Update user service');
    });
  });

  describe('getOptimalPromptTemplate', () => {
    it('should use concise template for few commits', () => {
      const fewCommits = mockCommits.slice(0, 2);
      const context = { ...mockContext, commits: fewCommits };
      
      const prompt = getOptimalPromptTemplate(context);
      
      expect(prompt).toContain('maximum 3 bullet points');
    });

    it('should use time-based template for many commits', () => {
      const manyCommits = Array(12).fill(null).map((_, i) => ({
        ...mockCommits[0],
        hash: `commit${i}`,
        message: `commit: Task ${i + 1}`,
        date: new Date(`2025-09-20T${8 + i}:00:00Z`)
      }));
      const context = { ...mockContext, commits: manyCommits };
      
      const prompt = getOptimalPromptTemplate(context);
      
      expect(prompt).toContain('time-based work summary');
    });

    it('should use feature template for feature-heavy work', () => {
      const featureCommits = [
        { ...mockCommits[0], message: 'feat: Add login system' },
        { ...mockCommits[1], message: 'feat: Add user dashboard' },
        { ...mockCommits[2], message: 'feat: Add profile management' }
      ];
      const context = { ...mockContext, commits: featureCommits };
      
      const prompt = getOptimalPromptTemplate(context);
      
      expect(prompt).toContain('feature-focused work summary');
    });

    it('should use default template for balanced work', () => {
      const prompt = getOptimalPromptTemplate(mockContext);
      
      expect(prompt).toContain('Transform these Git commits into a coherent daily work summary');
    });
  });

  describe('PROMPT_TEMPLATES', () => {
    it('should have all required template types', () => {
      expect(PROMPT_TEMPLATES).toHaveProperty('default');
      expect(PROMPT_TEMPLATES).toHaveProperty('feature');
      expect(PROMPT_TEMPLATES).toHaveProperty('timeBased');
      expect(PROMPT_TEMPLATES).toHaveProperty('concise');
      expect(PROMPT_TEMPLATES).toHaveProperty('optimal');
    });

    it('should have consistent system prompt across templates', () => {
      Object.values(PROMPT_TEMPLATES).forEach(template => {
        expect(template.system).toBe(DEFAULT_SYSTEM_PROMPT);
      });
    });

    it('should have generator functions for each template', () => {
      Object.values(PROMPT_TEMPLATES).forEach(template => {
        expect(typeof template.generator).toBe('function');
      });
    });
  });

  describe('DEFAULT_SYSTEM_PROMPT', () => {
    it('should define the AI role and guidelines', () => {
      expect(DEFAULT_SYSTEM_PROMPT).toContain('technical writer');
      expect(DEFAULT_SYSTEM_PROMPT).toContain('Transform technical Git commits');
      expect(DEFAULT_SYSTEM_PROMPT).toContain('Group related changes');
      expect(DEFAULT_SYSTEM_PROMPT).toContain('business-friendly terms');
      expect(DEFAULT_SYSTEM_PROMPT).toContain('Thai Buddhist calendar');
    });

    it('should include formatting guidelines', () => {
      expect(DEFAULT_SYSTEM_PROMPT).toContain('Be concise but informative');
      expect(DEFAULT_SYSTEM_PROMPT).toContain('Focus on what was accomplished');
      expect(DEFAULT_SYSTEM_PROMPT).toContain('Use clear, professional language');
      expect(DEFAULT_SYSTEM_PROMPT).toContain('Preserve the Thai date format');
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty commit list', () => {
      const emptyContext = { ...mockContext, commits: [] };
      
      expect(() => generateCommitSummaryPrompt(emptyContext)).not.toThrow();
      expect(() => generateFeatureSummaryPrompt(emptyContext)).not.toThrow();
      expect(() => generateTimeBasedSummaryPrompt(emptyContext)).not.toThrow();
      expect(() => generateConciseSummaryPrompt(emptyContext)).not.toThrow();
    });

    it('should handle single commit', () => {
      const singleContext = { ...mockContext, commits: [mockCommits[0]] };
      
      const prompt = generateCommitSummaryPrompt(singleContext);
      expect(prompt).toContain('Total commits: 1');
      expect(prompt).toContain('feat: Add user authentication system');
    });

    it('should handle commits with special characters', () => {
      const specialCommits = [{
        ...mockCommits[0],
        message: 'feat: Add "special" characters & symbols (test)'
      }];
      const specialContext = { ...mockContext, commits: specialCommits };
      
      const prompt = generateCommitSummaryPrompt(specialContext);
      expect(prompt).toContain('Add "special" characters & symbols (test)');
    });

    it('should handle very long commit messages', () => {
      const longMessage = 'feat: ' + 'A'.repeat(200);
      const longCommits = [{ ...mockCommits[0], message: longMessage }];
      const longContext = { ...mockContext, commits: longCommits };
      
      const prompt = generateCommitSummaryPrompt(longContext);
      expect(prompt).toContain(longMessage);
    });

    it('should handle commits spanning multiple days', () => {
      const multiDayCommits = [
        { ...mockCommits[0], date: new Date('2025-09-19T23:00:00Z') },
        { ...mockCommits[1], date: new Date('2025-09-20T01:00:00Z') },
        { ...mockCommits[2], date: new Date('2025-09-20T23:00:00Z') }
      ];
      const multiDayContext = { ...mockContext, commits: multiDayCommits };
      
      const prompt = generateTimeBasedSummaryPrompt(multiDayContext);
      expect(prompt).toContain('Evening (18:00-23:59)');
      expect(prompt).toContain('Morning (00:00-11:59)');
    });
  });

  describe('Prompt Quality', () => {
    it('should generate prompts with reasonable length', () => {
      const prompt = generateCommitSummaryPrompt(mockContext);
      
      expect(prompt.length).toBeGreaterThan(100);
      expect(prompt.length).toBeLessThan(2000);
    });

    it('should include all required context information', () => {
      const prompt = generateCommitSummaryPrompt(mockContext);
      
      expect(prompt).toContain(mockContext.thaiDate);
      expect(prompt).toContain(mockContext.author);
      expect(prompt).toContain(mockContext.commits.length.toString());
    });

    it('should maintain consistent formatting across templates', () => {
      const prompts = [
        generateCommitSummaryPrompt(mockContext),
        generateFeatureSummaryPrompt(mockContext),
        generateTimeBasedSummaryPrompt(mockContext),
        generateConciseSummaryPrompt(mockContext)
      ];

      prompts.forEach(prompt => {
        expect(prompt).toContain('20 ก.ย. 2568');
        expect(prompt).toContain('John Doe');
        expect(prompt).toMatch(/Output format:/);
      });
    });
  });
});
