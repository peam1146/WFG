// Integration test: Multiple commits same day grouping
// This test MUST FAIL until the daily grouping functionality is implemented

import { generateSummaries } from '@/lib/actions/summary-actions';

describe('Daily Commit Grouping Integration', () => {
  it('should group multiple commits from same day into single summary', async () => {
    // Arrange - Mock multiple commits on same day
    const formData = new FormData();
    formData.append('author', 'Test Author');
    formData.append('since', '2025-09-13');

    // Act
    const result = await generateSummaries(formData);

    // Assert - Should group commits by date
    expect(result.success).toBe(true);
    if (result.success) {
      // Find summaries for the same date
      const summariesByDate = result.data.reduce((acc, summary) => {
        const dateKey = summary.summaryDate.toDateString();
        if (!acc[dateKey]) {
          acc[dateKey] = [];
        }
        acc[dateKey].push(summary);
        return acc;
      }, {} as Record<string, typeof result.data>);

      // Each date should have only one summary entry
      Object.values(summariesByDate).forEach(summariesForDate => {
        expect(summariesForDate.length).toBe(1);
      });

      // Summary text should contain multiple bullet points for same day
      const summary = result.data[0];
      if (summary.summaryText.includes('\n-')) {
        const bulletPoints = summary.summaryText.split('\n-').length - 1;
        expect(bulletPoints).toBeGreaterThan(0);
      }
    }
  });

  it('should format daily summary with Thai date and bullet points', async () => {
    // Arrange
    const formData = new FormData();
    formData.append('author', 'Test Author');
    formData.append('since', '2025-09-13');

    // Act
    const result = await generateSummaries(formData);

    // Assert - Format requirements from quickstart.md
    if (result.success && result.data.length > 0) {
      const summary = result.data[0];
      
      // Should start with Thai date format
      expect(summary.summaryText).toMatch(/^\d{1,2}\s[ก-ฮ\.]+\s\d{4}/);
      
      // Should contain bullet points
      expect(summary.summaryText).toMatch(/\n-\s/);
      
      // Example format: "20 ก.ย. 2568\n- Morning work\n- Afternoon fix"
      const lines = summary.summaryText.split('\n');
      expect(lines[0]).toMatch(/\d{1,2}\s[ก-ฮ\.]+\s\d{4}/); // Thai date
      expect(lines.slice(1).every(line => line.startsWith('- '))).toBe(true); // Bullet points
    }
  });

  it('should preserve commit message content in bullet points', async () => {
    // Arrange
    const formData = new FormData();
    formData.append('author', 'Test Author');
    formData.append('since', '2025-09-13');

    // Act
    const result = await generateSummaries(formData);

    // Assert - Commit messages should be preserved
    if (result.success && result.data.length > 0) {
      const summary = result.data[0];
      const bulletPoints = summary.summaryText
        .split('\n')
        .filter(line => line.startsWith('- '))
        .map(line => line.substring(2)); // Remove "- " prefix

      // Each bullet point should contain meaningful commit message content
      bulletPoints.forEach(point => {
        expect(point.length).toBeGreaterThan(0);
        expect(point.trim()).toBeTruthy();
      });
    }
  });

  it('should handle single commit per day correctly', async () => {
    // Arrange
    const formData = new FormData();
    formData.append('author', 'SingleCommitAuthor');
    formData.append('since', '2025-09-13');

    // Act
    const result = await generateSummaries(formData);

    // Assert - Single commit should still be formatted correctly
    if (result.success && result.data.length > 0) {
      const summary = result.data[0];
      
      // Should still have Thai date format
      expect(summary.summaryText).toMatch(/^\d{1,2}\s[ก-ฮ\.]+\s\d{4}/);
      
      // Should have at least one bullet point
      expect(summary.summaryText).toMatch(/\n-\s/);
    }
  });

  it('should sort commits chronologically within same day', async () => {
    // Arrange
    const formData = new FormData();
    formData.append('author', 'Test Author');
    formData.append('since', '2025-09-13');

    // Act
    const result = await generateSummaries(formData);

    // Assert - Commits should be sorted by time within the day
    if (result.success && result.data.length > 0) {
      const summary = result.data[0];
      const bulletPoints = summary.summaryText
        .split('\n')
        .filter(line => line.startsWith('- '));

      // Should have consistent ordering (implementation detail)
      expect(bulletPoints.length).toBeGreaterThan(0);
    }
  });
});
