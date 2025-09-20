/**
 * Integration test for RefreshButton with shadcn/ui components
 * This test MUST FAIL initially and pass after component migration
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import RefreshButton from '@/components/RefreshButton';
import { DailySummary } from '@/types/git';

// Mock the refresh action
jest.mock('@/lib/actions/summary-actions', () => ({
  refreshSummaries: jest.fn()
}));

describe('RefreshButton with shadcn/ui Integration', () => {
  const mockProps = {
    author: 'test-author',
    since: new Date('2024-01-01'),
    onSummariesRefreshed: jest.fn(),
    onError: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render with shadcn/ui Button component', () => {
    render(<RefreshButton {...mockProps} />);
    
    const button = screen.getByRole('button', { name: /refresh summaries/i });
    expect(button).toBeInTheDocument();
    
    // This will fail until RefreshButton uses shadcn/ui Button
    // shadcn/ui Button should have these specific classes
    expect(button).toHaveClass('inline-flex', 'items-center', 'justify-center');
    expect(button).toHaveClass('whitespace-nowrap', 'rounded-md', 'text-sm', 'font-medium');
    expect(button).toHaveClass('ring-offset-background', 'transition-colors');
    expect(button).toHaveClass('focus-visible:outline-none', 'focus-visible:ring-2');
    expect(button).toHaveClass('focus-visible:ring-ring', 'focus-visible:ring-offset-2');
    expect(button).toHaveClass('disabled:pointer-events-none', 'disabled:opacity-50');
  });

  it('should maintain loading state functionality with shadcn/ui Button', async () => {
    const { refreshSummaries } = require('@/lib/actions/summary-actions');
    refreshSummaries.mockResolvedValue({ success: true, data: [] });

    render(<RefreshButton {...mockProps} />);
    
    const button = screen.getByRole('button', { name: /refresh summaries/i });
    
    fireEvent.click(button);
    
    // Should show loading state
    await waitFor(() => {
      expect(screen.getByText(/refreshing/i)).toBeInTheDocument();
    });
    
    // Button should be disabled during loading
    expect(button).toBeDisabled();
    
    // This will fail until using shadcn/ui Button with proper disabled styling
    expect(button).toHaveClass('disabled:pointer-events-none', 'disabled:opacity-50');
  });

  it('should preserve click handler functionality', () => {
    render(<RefreshButton {...mockProps} />);
    
    const button = screen.getByRole('button', { name: /refresh summaries/i });
    
    fireEvent.click(button);
    
    // Verify the refresh action is called
    const { refreshSummaries } = require('@/lib/actions/summary-actions');
    expect(refreshSummaries).toHaveBeenCalledWith(mockProps.author, mockProps.since);
  });

  it('should maintain accessibility attributes with shadcn/ui Button', () => {
    render(<RefreshButton {...mockProps} />);
    
    const button = screen.getByRole('button', { name: /refresh summaries/i });
    
    // Should maintain existing accessibility features
    expect(button).toHaveAttribute('title');
    expect(button).toBeEnabled();
    
    // This will fail until using shadcn/ui Button with proper focus management
    expect(button).toHaveClass('focus-visible:outline-none');
    expect(button).toHaveClass('focus-visible:ring-2');
    expect(button).toHaveClass('focus-visible:ring-ring');
    expect(button).toHaveClass('focus-visible:ring-offset-2');
  });

  it('should handle disabled state with shadcn/ui Button styling', () => {
    render(<RefreshButton {...mockProps} disabled={true} />);
    
    const button = screen.getByRole('button', { name: /refresh summaries/i });
    
    expect(button).toBeDisabled();
    
    // This will fail until using shadcn/ui Button disabled classes
    expect(button).toHaveClass('disabled:pointer-events-none');
    expect(button).toHaveClass('disabled:opacity-50');
  });

  it('should maintain button variants and sizing from shadcn/ui', () => {
    render(<RefreshButton {...mockProps} />);
    
    const button = screen.getByRole('button', { name: /refresh summaries/i });
    
    // This will fail until using shadcn/ui Button with proper variant classes
    // Should use default variant styling
    expect(button).toHaveClass('bg-primary', 'text-primary-foreground');
    expect(button).toHaveClass('hover:bg-primary/90');
    
    // Should use default size styling
    expect(button).toHaveClass('h-10', 'px-4', 'py-2');
  });

  it('should preserve existing functionality after shadcn/ui migration', async () => {
    const mockSummaries: DailySummary[] = [
      {
        id: '1',
        authorName: 'test-author',
        summaryDate: new Date(),
        summaryText: 'Test summary',
        repositoryUrl: 'test-repo',
        createdAt: new Date(),
        updatedAt: new Date(),
        hasAISummary: false
      }
    ];

    const { refreshSummaries } = require('@/lib/actions/summary-actions');
    refreshSummaries.mockResolvedValue({ success: true, data: mockSummaries });

    render(<RefreshButton {...mockProps} />);
    
    const button = screen.getByRole('button', { name: /refresh summaries/i });
    fireEvent.click(button);

    await waitFor(() => {
      expect(mockProps.onSummariesRefreshed).toHaveBeenCalledWith(mockSummaries);
    });

    // Should show last refresh time
    expect(screen.getByText(/last refreshed/i)).toBeInTheDocument();
  });
});
