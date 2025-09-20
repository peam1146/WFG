/**
 * Integration test for GitFilterForm with shadcn/ui components
 * This test MUST FAIL initially and pass after component migration
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import GitFilterForm from '@/components/GitFilterForm';
import { GitCommit, DailySummary } from '@/types/git';

// Mock the actions
jest.mock('@/lib/actions/git-actions', () => ({
  fetchGitCommits: jest.fn()
}));

jest.mock('@/lib/actions/summary-actions', () => ({
  generateSummaries: jest.fn()
}));

jest.mock('@/lib/utils/date-formatter', () => ({
  formatDateForInput: jest.fn((date) => date.toISOString().split('T')[0]),
  getDaysAgo: jest.fn((days) => new Date(Date.now() - days * 24 * 60 * 60 * 1000))
}));

describe('GitFilterForm with shadcn/ui Integration', () => {
  const mockProps = {
    onCommitsResult: jest.fn(),
    onSummariesResult: jest.fn(),
    onError: jest.fn(),
    onLoading: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render with shadcn/ui form components', () => {
    render(<GitFilterForm {...mockProps} />);

    // Should have form title
    expect(screen.getByText('Git Log Filter')).toBeInTheDocument();

    // This will fail until using shadcn/ui Card for container
    const formContainer = screen.getByText('Git Log Filter').closest('div');
    expect(formContainer).toHaveClass('rounded-lg', 'border', 'bg-card');
    expect(formContainer).toHaveClass('text-card-foreground', 'shadow-sm');
  });

  it('should use shadcn/ui Input components for form fields', () => {
    render(<GitFilterForm {...mockProps} />);

    const authorInput = screen.getByLabelText(/author name/i);
    const dateInput = screen.getByLabelText(/since date/i);

    // This will fail until using shadcn/ui Input components
    // shadcn/ui Input should have these classes
    expect(authorInput).toHaveClass('flex', 'h-10', 'w-full', 'rounded-md', 'border');
    expect(authorInput).toHaveClass('border-input', 'bg-background', 'px-3', 'py-2');
    expect(authorInput).toHaveClass('text-sm', 'ring-offset-background');
    expect(authorInput).toHaveClass('file:border-0', 'file:bg-transparent', 'file:text-sm', 'file:font-medium');
    expect(authorInput).toHaveClass('placeholder:text-muted-foreground');
    expect(authorInput).toHaveClass('focus-visible:outline-none', 'focus-visible:ring-2');
    expect(authorInput).toHaveClass('focus-visible:ring-ring', 'focus-visible:ring-offset-2');
    expect(authorInput).toHaveClass('disabled:cursor-not-allowed', 'disabled:opacity-50');

    expect(dateInput).toHaveClass('flex', 'h-10', 'w-full', 'rounded-md', 'border');
    expect(dateInput).toHaveClass('border-input', 'bg-background', 'px-3', 'py-2');
  });

  it('should use shadcn/ui Label components for form labels', () => {
    render(<GitFilterForm {...mockProps} />);

    const authorLabel = screen.getByText('Author Name');
    const dateLabel = screen.getByText(/since date/i);

    // This will fail until using shadcn/ui Label components
    expect(authorLabel).toHaveClass('text-sm', 'font-medium', 'leading-none');
    expect(authorLabel).toHaveClass('peer-disabled:cursor-not-allowed', 'peer-disabled:opacity-70');

    expect(dateLabel).toHaveClass('text-sm', 'font-medium', 'leading-none');
    expect(dateLabel).toHaveClass('peer-disabled:cursor-not-allowed', 'peer-disabled:opacity-70');
  });

  it('should use shadcn/ui Button components for form actions', () => {
    render(<GitFilterForm {...mockProps} />);

    const submitButton = screen.getByRole('button', { name: /filter commits/i });
    const resetButton = screen.getByRole('button', { name: /reset/i });

    // This will fail until using shadcn/ui Button components
    // Submit button should use primary variant
    expect(submitButton).toHaveClass('inline-flex', 'items-center', 'justify-center');
    expect(submitButton).toHaveClass('whitespace-nowrap', 'rounded-md', 'text-sm', 'font-medium');
    expect(submitButton).toHaveClass('ring-offset-background', 'transition-colors');
    expect(submitButton).toHaveClass('focus-visible:outline-none', 'focus-visible:ring-2');
    expect(submitButton).toHaveClass('focus-visible:ring-ring', 'focus-visible:ring-offset-2');
    expect(submitButton).toHaveClass('disabled:pointer-events-none', 'disabled:opacity-50');
    expect(submitButton).toHaveClass('bg-primary', 'text-primary-foreground', 'hover:bg-primary/90');
    expect(submitButton).toHaveClass('h-10', 'px-4', 'py-2');

    // Reset button should use outline variant
    expect(resetButton).toHaveClass('inline-flex', 'items-center', 'justify-center');
    expect(resetButton).toHaveClass('border', 'border-input', 'bg-background');
    expect(resetButton).toHaveClass('hover:bg-accent', 'hover:text-accent-foreground');
  });

  it('should maintain form submission functionality with shadcn/ui components', async () => {
    const { fetchGitCommits } = require('@/lib/actions/git-actions');
    const { generateSummaries } = require('@/lib/actions/summary-actions');
    
    const mockCommits: GitCommit[] = [
      {
        hash: 'abc123',
        author: 'test-author',
        date: new Date(),
        message: 'Test commit',
        repository: 'test-repo'
      }
    ];

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

    fetchGitCommits.mockResolvedValue({ success: true, data: mockCommits });
    generateSummaries.mockResolvedValue({ success: true, data: mockSummaries });

    render(<GitFilterForm {...mockProps} />);

    // Fill in the form
    const authorInput = screen.getByLabelText(/author name/i);
    const submitButton = screen.getByRole('button', { name: /filter commits/i });

    fireEvent.change(authorInput, { target: { value: 'test-author' } });
    fireEvent.click(submitButton);

    // Should call loading callback
    expect(mockProps.onLoading).toHaveBeenCalledWith(true);

    await waitFor(() => {
      expect(mockProps.onCommitsResult).toHaveBeenCalledWith(mockCommits);
      expect(mockProps.onSummariesResult).toHaveBeenCalledWith(mockSummaries);
      expect(mockProps.onLoading).toHaveBeenCalledWith(false);
    });
  });

  it('should handle form validation with shadcn/ui components', async () => {
    render(<GitFilterForm {...mockProps} />);

    const submitButton = screen.getByRole('button', { name: /filter commits/i });
    
    // Try to submit without author
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockProps.onError).toHaveBeenCalledWith('Author name is required');
    });
  });

  it('should maintain accessibility with shadcn/ui components', () => {
    render(<GitFilterForm {...mockProps} />);

    const authorInput = screen.getByLabelText(/author name/i);
    const dateInput = screen.getByLabelText(/since date/i);
    const submitButton = screen.getByRole('button', { name: /filter commits/i });
    const resetButton = screen.getByRole('button', { name: /reset/i });

    // Should have proper form associations
    expect(authorInput).toHaveAttribute('id', 'author');
    expect(dateInput).toHaveAttribute('id', 'since');

    // Should have required attributes
    expect(authorInput).toBeRequired();
    expect(dateInput).toBeRequired();

    // This will fail until using shadcn/ui components with proper focus management
    expect(authorInput).toHaveClass('focus-visible:outline-none', 'focus-visible:ring-2');
    expect(dateInput).toHaveClass('focus-visible:outline-none', 'focus-visible:ring-2');
    expect(submitButton).toHaveClass('focus-visible:outline-none', 'focus-visible:ring-2');
    expect(resetButton).toHaveClass('focus-visible:outline-none', 'focus-visible:ring-2');
  });

  it('should handle loading states with shadcn/ui Button disabled styling', async () => {
    const { fetchGitCommits } = require('@/lib/actions/git-actions');
    const { generateSummaries } = require('@/lib/actions/summary-actions');
    
    // Mock slow response
    fetchGitCommits.mockImplementation(() => new Promise(resolve => 
      setTimeout(() => resolve({ success: true, data: [] }), 100)
    ));
    generateSummaries.mockResolvedValue({ success: true, data: [] });

    render(<GitFilterForm {...mockProps} />);

    const authorInput = screen.getByLabelText(/author name/i);
    const submitButton = screen.getByRole('button', { name: /filter commits/i });
    const resetButton = screen.getByRole('button', { name: /reset/i });

    fireEvent.change(authorInput, { target: { value: 'test-author' } });
    fireEvent.click(submitButton);

    // Should show loading state
    expect(screen.getByText('Loading...')).toBeInTheDocument();

    // Buttons should be disabled with proper shadcn/ui styling
    expect(submitButton).toBeDisabled();
    expect(resetButton).toBeDisabled();
    expect(authorInput).toBeDisabled();

    // This will fail until using shadcn/ui components with proper disabled styling
    expect(submitButton).toHaveClass('disabled:pointer-events-none', 'disabled:opacity-50');
    expect(resetButton).toHaveClass('disabled:pointer-events-none', 'disabled:opacity-50');
    expect(authorInput).toHaveClass('disabled:cursor-not-allowed', 'disabled:opacity-50');

    await waitFor(() => {
      expect(screen.getByText('Filter Commits')).toBeInTheDocument();
    });
  });

  it('should handle reset functionality with shadcn/ui components', () => {
    render(<GitFilterForm {...mockProps} />);

    const authorInput = screen.getByLabelText(/author name/i) as HTMLInputElement;
    const resetButton = screen.getByRole('button', { name: /reset/i });

    // Fill in some data
    fireEvent.change(authorInput, { target: { value: 'test-author' } });
    expect(authorInput.value).toBe('test-author');

    // Reset the form
    fireEvent.click(resetButton);

    // Should clear the form
    expect(authorInput.value).toBe('');
  });

  it('should preserve existing form structure after shadcn/ui migration', () => {
    render(<GitFilterForm {...mockProps} />);

    // Should maintain form structure
    expect(screen.getByRole('form')).toBeInTheDocument();
    expect(screen.getByText('Git Log Filter')).toBeInTheDocument();
    
    // Should maintain help text
    expect(screen.getByText(/Enter the exact Git author name/)).toBeInTheDocument();
    expect(screen.getByText(/Date range is limited to the last 31 days/)).toBeInTheDocument();
    expect(screen.getByText(/Merge commits are automatically excluded/)).toBeInTheDocument();

    // Should maintain input constraints
    const dateInput = screen.getByLabelText(/since date/i);
    expect(dateInput).toHaveAttribute('min');
    expect(dateInput).toHaveAttribute('max');
  });
});
