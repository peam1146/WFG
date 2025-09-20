/**
 * Integration test for LoadingSpinner with shadcn/ui components
 * This test MUST FAIL initially and pass after component migration
 */

import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import LoadingSpinner, { 
  PageLoadingSpinner, 
  ComponentLoadingSpinner, 
  InlineLoadingSpinner, 
  ButtonLoadingSpinner 
} from '@/components/LoadingSpinner';

describe('LoadingSpinner with shadcn/ui Integration', () => {
  it('should render with shadcn/ui Skeleton component', () => {
    render(<LoadingSpinner />);
    
    const loadingElement = screen.getByRole('status');
    expect(loadingElement).toBeInTheDocument();
    
    // This will fail until LoadingSpinner uses shadcn/ui Skeleton
    // shadcn/ui Skeleton should have these specific classes
    expect(loadingElement).toHaveClass('animate-pulse');
    expect(loadingElement).toHaveClass('rounded-md');
    expect(loadingElement).toHaveClass('bg-muted');
  });

  it('should support different size variants with shadcn/ui Skeleton', () => {
    const { rerender } = render(<LoadingSpinner size="sm" />);
    
    let loadingElement = screen.getByRole('status');
    
    // This will fail until using shadcn/ui Skeleton with proper size classes
    expect(loadingElement).toHaveClass('h-4', 'w-4');
    
    rerender(<LoadingSpinner size="md" />);
    loadingElement = screen.getByRole('status');
    expect(loadingElement).toHaveClass('h-6', 'w-6');
    
    rerender(<LoadingSpinner size="lg" />);
    loadingElement = screen.getByRole('status');
    expect(loadingElement).toHaveClass('h-8', 'w-8');
    
    rerender(<LoadingSpinner size="xl" />);
    loadingElement = screen.getByRole('status');
    expect(loadingElement).toHaveClass('h-12', 'w-12');
  });

  it('should maintain accessibility compliance with shadcn/ui Skeleton', () => {
    render(<LoadingSpinner text="Loading data..." />);
    
    const loadingElement = screen.getByRole('status');
    expect(loadingElement).toBeInTheDocument();
    
    // Should maintain accessibility attributes
    expect(loadingElement).toHaveAttribute('aria-label', 'Loading');
    
    // Should have screen reader text
    expect(screen.getByText('Loading...')).toBeInTheDocument();
    
    // Should display custom text
    expect(screen.getByText('Loading data...')).toBeInTheDocument();
  });

  it('should render with proper shadcn/ui Skeleton animation', () => {
    render(<LoadingSpinner />);
    
    const loadingElement = screen.getByRole('status');
    
    // This will fail until using shadcn/ui Skeleton animation
    expect(loadingElement).toHaveClass('animate-pulse');
    
    // Should not have the old spinning animation classes
    expect(loadingElement).not.toHaveClass('animate-spin');
    expect(loadingElement).not.toHaveClass('rounded-full');
    expect(loadingElement).not.toHaveClass('border-b-2');
  });

  it('should support custom className with shadcn/ui Skeleton', () => {
    render(<LoadingSpinner className="custom-class" />);
    
    const container = screen.getByRole('status').parentElement;
    expect(container).toHaveClass('custom-class');
  });

  describe('Specialized Loading Components', () => {
    it('should render PageLoadingSpinner with shadcn/ui Skeleton', () => {
      render(<PageLoadingSpinner />);
      
      const loadingElement = screen.getByRole('status');
      
      // This will fail until using shadcn/ui Skeleton
      expect(loadingElement).toHaveClass('animate-pulse');
      expect(loadingElement).toHaveClass('h-12', 'w-12'); // xl size
      expect(screen.getByText('Loading page...')).toBeInTheDocument();
    });

    it('should render ComponentLoadingSpinner with shadcn/ui Skeleton', () => {
      render(<ComponentLoadingSpinner />);
      
      const loadingElement = screen.getByRole('status');
      
      // This will fail until using shadcn/ui Skeleton
      expect(loadingElement).toHaveClass('animate-pulse');
      expect(loadingElement).toHaveClass('h-8', 'w-8'); // lg size
      expect(screen.getByText('Loading...')).toBeInTheDocument();
    });

    it('should render InlineLoadingSpinner with shadcn/ui Skeleton', () => {
      render(<InlineLoadingSpinner text="Processing..." />);
      
      const loadingElement = screen.getByRole('status');
      
      // This will fail until using shadcn/ui Skeleton
      expect(loadingElement).toHaveClass('animate-pulse');
      expect(loadingElement).toHaveClass('h-4', 'w-4'); // sm size
      expect(screen.getByText('Processing...')).toBeInTheDocument();
    });

    it('should render ButtonLoadingSpinner with shadcn/ui Skeleton', () => {
      render(<ButtonLoadingSpinner />);
      
      const loadingElement = screen.getByRole('status');
      
      // This will fail until using shadcn/ui Skeleton
      expect(loadingElement).toHaveClass('animate-pulse');
      expect(loadingElement).toHaveClass('h-4', 'w-4'); // sm size
    });
  });

  it('should maintain existing props interface after migration', () => {
    // Test that all existing props still work
    render(
      <LoadingSpinner 
        size="lg" 
        color="green" 
        text="Custom loading text" 
        className="mt-4" 
      />
    );
    
    const loadingElement = screen.getByRole('status');
    expect(loadingElement).toBeInTheDocument();
    expect(screen.getByText('Custom loading text')).toBeInTheDocument();
    
    // Container should have custom class
    const container = loadingElement.parentElement;
    expect(container).toHaveClass('mt-4');
  });

  it('should use shadcn/ui Skeleton instead of custom spinner', () => {
    render(<LoadingSpinner />);
    
    const loadingElement = screen.getByRole('status');
    
    // This will fail until migration - should use Skeleton classes
    expect(loadingElement).toHaveClass('animate-pulse');
    expect(loadingElement).toHaveClass('bg-muted');
    expect(loadingElement).toHaveClass('rounded-md');
    
    // Should NOT have old spinner classes
    expect(loadingElement).not.toHaveClass('animate-spin');
    expect(loadingElement).not.toHaveClass('border-blue-600');
    expect(loadingElement).not.toHaveClass('rounded-full');
  });
});
