/**
 * Integration test for ErrorBoundary with shadcn/ui components
 * This test MUST FAIL initially and pass after component migration
 */

import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ErrorBoundary, withErrorBoundary } from '@/components/ErrorBoundary';

// Mock logger
jest.mock('@/lib/utils/logger', () => ({
  logger: {
    error: jest.fn()
  }
}));

// Test component that throws an error
function ThrowError({ shouldThrow = false }: { shouldThrow?: boolean }) {
  if (shouldThrow) {
    throw new Error('Test error');
  }
  return <div>No error</div>;
}

describe('ErrorBoundary with shadcn/ui Integration', () => {
  // Suppress console.error for these tests
  const originalError = console.error;
  beforeAll(() => {
    console.error = jest.fn();
  });
  afterAll(() => {
    console.error = originalError;
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render children when no error occurs', () => {
    render(
      <ErrorBoundary>
        <div>Test content</div>
      </ErrorBoundary>
    );

    expect(screen.getByText('Test content')).toBeInTheDocument();
  });

  it('should render with shadcn/ui Alert component when error occurs', () => {
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    // Should show error message
    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    
    // This will fail until ErrorBoundary uses shadcn/ui Alert
    // shadcn/ui Alert should have these specific classes
    const alertElement = screen.getByRole('alert') || screen.getByText('Something went wrong').closest('[role="alert"]');
    
    if (!alertElement) {
      // If no alert role, check for Alert component classes on the container
      const errorContainer = screen.getByText('Something went wrong').closest('div');
      expect(errorContainer).toHaveClass('relative', 'w-full', 'rounded-lg', 'border');
      expect(errorContainer).toHaveClass('p-4');
      // Alert destructive variant classes
      expect(errorContainer).toHaveClass('border-destructive/50', 'text-destructive');
      expect(errorContainer).toHaveClass('dark:border-destructive');
    } else {
      expect(alertElement).toHaveClass('relative', 'w-full', 'rounded-lg', 'border', 'p-4');
    }
  });

  it('should display error state with shadcn/ui Alert styling', () => {
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    // Should show error title and description
    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    expect(screen.getByText(/An unexpected error occurred/)).toBeInTheDocument();

    // This will fail until using shadcn/ui Alert with proper destructive variant
    const errorContainer = screen.getByText('Something went wrong').closest('div');
    expect(errorContainer).toHaveClass('border-destructive/50');
    expect(errorContainer).toHaveClass('text-destructive');
    expect(errorContainer).toHaveClass('dark:border-destructive');
  });

  it('should maintain error recovery functionality with shadcn/ui Button', () => {
    // Mock window.location.reload
    const mockReload = jest.fn();
    Object.defineProperty(window, 'location', {
      value: { reload: mockReload },
      writable: true
    });

    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    const refreshButton = screen.getByRole('button', { name: /refresh page/i });
    expect(refreshButton).toBeInTheDocument();

    // This will fail until using shadcn/ui Button
    // shadcn/ui Button should have these classes
    expect(refreshButton).toHaveClass('inline-flex', 'items-center', 'justify-center');
    expect(refreshButton).toHaveClass('whitespace-nowrap', 'rounded-md', 'text-sm', 'font-medium');
    expect(refreshButton).toHaveClass('ring-offset-background', 'transition-colors');
    expect(refreshButton).toHaveClass('focus-visible:outline-none', 'focus-visible:ring-2');
    
    // Should use destructive variant
    expect(refreshButton).toHaveClass('bg-destructive', 'text-destructive-foreground');
    expect(refreshButton).toHaveClass('hover:bg-destructive/90');

    fireEvent.click(refreshButton);
    expect(mockReload).toHaveBeenCalled();
  });

  it('should maintain accessibility features with shadcn/ui Alert', () => {
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    // Should have proper ARIA attributes
    const alertElement = screen.getByRole('alert') || screen.getByText('Something went wrong').closest('[role="alert"]');
    
    if (!alertElement) {
      // If no alert role found, the container should have alert semantics
      const errorContainer = screen.getByText('Something went wrong').closest('div');
      expect(errorContainer).toBeInTheDocument();
      
      // This will fail until proper Alert component is used
      expect(errorContainer).toHaveAttribute('role', 'alert');
    } else {
      expect(alertElement).toHaveAttribute('role', 'alert');
    }

    // Should maintain keyboard accessibility for the button
    const refreshButton = screen.getByRole('button', { name: /refresh page/i });
    expect(refreshButton).toHaveClass('focus-visible:outline-none');
    expect(refreshButton).toHaveClass('focus-visible:ring-2');
  });

  it('should support custom fallback with shadcn/ui components', () => {
    const customFallback = (
      <div role="alert" className="custom-error">
        Custom error message
      </div>
    );

    render(
      <ErrorBoundary fallback={customFallback}>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(screen.getByText('Custom error message')).toBeInTheDocument();
    expect(screen.getByRole('alert')).toHaveClass('custom-error');
  });

  it('should call onError callback when error occurs', () => {
    const mockOnError = jest.fn();

    render(
      <ErrorBoundary onError={mockOnError}>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(mockOnError).toHaveBeenCalledWith(
      expect.any(Error),
      expect.objectContaining({
        componentStack: expect.any(String)
      })
    );
  });

  it('should show error details with proper shadcn/ui styling', () => {
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    // Should have error details section
    const detailsElement = screen.getByText('Show Error Details');
    expect(detailsElement).toBeInTheDocument();

    // Click to expand details
    fireEvent.click(detailsElement);

    // Should show error message
    expect(screen.getByText('Test error')).toBeInTheDocument();
  });

  describe('withErrorBoundary HOC', () => {
    it('should wrap component with ErrorBoundary using shadcn/ui Alert', () => {
      const TestComponent = () => <div>Test Component</div>;
      const WrappedComponent = withErrorBoundary(TestComponent);

      render(<WrappedComponent />);

      expect(screen.getByText('Test Component')).toBeInTheDocument();
    });

    it('should handle errors in wrapped component with shadcn/ui Alert', () => {
      const WrappedThrowError = withErrorBoundary(ThrowError);

      render(<WrappedThrowError shouldThrow={true} />);

      expect(screen.getByText('Something went wrong')).toBeInTheDocument();
      
      // This will fail until using shadcn/ui Alert
      const errorContainer = screen.getByText('Something went wrong').closest('div');
      expect(errorContainer).toHaveClass('border-destructive/50');
      expect(errorContainer).toHaveClass('text-destructive');
    });
  });
});
