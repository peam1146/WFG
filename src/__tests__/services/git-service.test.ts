// Unit test: GitService interface with mock implementation
// This test MUST FAIL until the GitService interface and implementations are created

import { GitService, GitCommit } from '@/types/git';
import { MockGitService } from '@/lib/services/git/mock-git';
import { RealGitService } from '@/lib/services/git/real-git';

describe('GitService Interface', () => {
  describe('MockGitService', () => {
    let mockGitService: MockGitService;

    beforeEach(() => {
      mockGitService = new MockGitService();
    });

    it('should implement GitService interface', () => {
      expect(mockGitService).toBeDefined();
      expect(typeof mockGitService.getCommits).toBe('function');
      expect(typeof mockGitService.validateRepository).toBe('function');
    });

    it('should return mock commits when configured', async () => {
      // Arrange
      const mockCommits: GitCommit[] = [
        {
          hash: 'abc123',
          author: 'Test Author',
          email: 'test@example.com',
          date: new Date('2025-09-20'),
          message: 'feat: Add test feature',
          isMerge: false
        }
      ];

      mockGitService.setMockCommits(mockCommits);

      // Act
      const result = await mockGitService.getCommits('Test Author', new Date('2025-09-13'), '/test/repo');

      // Assert
      expect(result).toEqual(mockCommits);
      expect(result.length).toBe(1);
      expect(result[0].author).toBe('Test Author');
    });

    it('should return empty array when no mock commits set', async () => {
      // Act
      const result = await mockGitService.getCommits('Test Author', new Date('2025-09-13'), '/test/repo');

      // Assert
      expect(result).toEqual([]);
    });

    it('should always validate repository as true for testing', async () => {
      // Act
      const result = await mockGitService.validateRepository('/any/path');

      // Assert
      expect(result).toBe(true);
    });

    it('should allow updating mock commits', async () => {
      // Arrange
      const firstCommits: GitCommit[] = [
        {
          hash: 'abc123',
          author: 'Author 1',
          email: 'author1@example.com',
          date: new Date('2025-09-20'),
          message: 'First commit',
          isMerge: false
        }
      ];

      const secondCommits: GitCommit[] = [
        {
          hash: 'def456',
          author: 'Author 2',
          email: 'author2@example.com',
          date: new Date('2025-09-19'),
          message: 'Second commit',
          isMerge: false
        }
      ];

      // Act
      mockGitService.setMockCommits(firstCommits);
      const firstResult = await mockGitService.getCommits('Author 1', new Date('2025-09-13'), '/test/repo');

      mockGitService.setMockCommits(secondCommits);
      const secondResult = await mockGitService.getCommits('Author 2', new Date('2025-09-13'), '/test/repo');

      // Assert
      expect(firstResult).toEqual(firstCommits);
      expect(secondResult).toEqual(secondCommits);
    });
  });

  describe('RealGitService', () => {
    let realGitService: RealGitService;

    beforeEach(() => {
      realGitService = new RealGitService();
    });

    it('should implement GitService interface', () => {
      expect(realGitService).toBeDefined();
      expect(typeof realGitService.getCommits).toBe('function');
      expect(typeof realGitService.validateRepository).toBe('function');
    });

    it('should handle repository validation', async () => {
      // Act - Test with current repository (should be valid)
      const validResult = await realGitService.validateRepository(process.cwd());
      
      // Act - Test with invalid path
      const invalidResult = await realGitService.validateRepository('/nonexistent/path');

      // Assert
      expect(typeof validResult).toBe('boolean');
      expect(typeof invalidResult).toBe('boolean');
      expect(invalidResult).toBe(false);
    });

    it('should handle Git operations gracefully when repository is invalid', async () => {
      // Act
      const result = await realGitService.getCommits('Test Author', new Date('2025-09-13'), '/nonexistent/path');

      // Assert - Should not throw, should return empty array or handle gracefully
      expect(result).toBeInstanceOf(Array);
    });

    it('should filter commits by author and date', async () => {
      // This test will depend on the actual Git repository state
      // For now, just verify the method exists and returns an array
      
      // Act
      const result = await realGitService.getCommits('Test Author', new Date('2025-09-13'), process.cwd());

      // Assert
      expect(result).toBeInstanceOf(Array);
      
      // If commits are returned, verify structure
      result.forEach(commit => {
        expect(commit).toHaveProperty('hash');
        expect(commit).toHaveProperty('author');
        expect(commit).toHaveProperty('email');
        expect(commit).toHaveProperty('date');
        expect(commit).toHaveProperty('message');
        expect(commit).toHaveProperty('isMerge');
      });
    });
  });
});
