/**
 * Integration test for AIStatusIndicator with shadcn/ui components
 * This test MUST FAIL initially and pass after component migration
 */

import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import AIStatusIndicator, { AIStatusBadge, AIStatusPanel } from '@/components/AIStatusIndicator';
import { AIModelStatus } from '@/types/ai-config';

// Mock the AI status action
jest.mock('@/lib/actions/ai-status-actions', () => ({
  getAIModelStatus: jest.fn()
}));

const mockAIStatus: AIModelStatus = {
  isAIEnabled: true,
  currentModel: 'openrouter/anthropic/claude-3-haiku',
  todayUsage: {
    requests: 25,
    tokens: 15000,
    errors: 0
  },
  lastError: null
};

const mockAIStatusWithError: AIModelStatus = {
  isAIEnabled: true,
  currentModel: 'openrouter/anthropic/claude-3-haiku',
  todayUsage: {
    requests: 10,
    tokens: 5000,
    errors: 8
  },
  lastError: 'Rate limit exceeded'
};

describe('AIStatusIndicator with shadcn/ui Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render with shadcn/ui Badge and Alert components', async () => {
    const { getAIModelStatus } = require('@/lib/actions/ai-status-actions');
    getAIModelStatus.mockResolvedValue({ success: true, data: mockAIStatus });

    render(<AIStatusIndicator />);

    await waitFor(() => {
      expect(screen.getByText('AI Active')).toBeInTheDocument();
    });

    // This will fail until AIStatusIndicator uses shadcn/ui Badge
    const statusElement = screen.getByText('AI Active').closest('div');
    
    // Should use shadcn/ui Badge classes
    expect(statusElement).toHaveClass('inline-flex', 'items-center', 'rounded-full');
    expect(statusElement).toHaveClass('border', 'px-2.5', 'py-0.5', 'text-xs', 'font-semibold');
    expect(statusElement).toHaveClass('transition-colors', 'focus:outline-none', 'focus:ring-2');
    expect(statusElement).toHaveClass('focus:ring-ring', 'focus:ring-offset-2');
  });

  it('should display different status states with shadcn/ui Badge variants', async () => {
    const { getAIModelStatus } = require('@/lib/actions/ai-status-actions');
    
    // Test active status
    getAIModelStatus.mockResolvedValue({ success: true, data: mockAIStatus });
    const { rerender } = render(<AIStatusIndicator />);

    await waitFor(() => {
      expect(screen.getByText('AI Active')).toBeInTheDocument();
    });

    // This will fail until using shadcn/ui Badge with success variant
    let statusElement = screen.getByText('AI Active').closest('div');
    expect(statusElement).toHaveClass('bg-green-100', 'text-green-800');
    expect(statusElement).toHaveClass('hover:bg-green-100/80');

    // Test degraded status
    getAIModelStatus.mockResolvedValue({ success: true, data: mockAIStatusWithError });
    rerender(<AIStatusIndicator />);

    await waitFor(() => {
      expect(screen.getByText('AI Degraded')).toBeInTheDocument();
    });

    // This will fail until using shadcn/ui Badge with warning variant
    statusElement = screen.getByText('AI Degraded').closest('div');
    expect(statusElement).toHaveClass('bg-yellow-100', 'text-yellow-800');
    expect(statusElement).toHaveClass('hover:bg-yellow-100/80');
  });

  it('should show error state with shadcn/ui Alert component', async () => {
    const { getAIModelStatus } = require('@/lib/actions/ai-status-actions');
    getAIModelStatus.mockResolvedValue({ success: false, error: 'API connection failed' });

    render(<AIStatusIndicator showDetails={true} />);

    await waitFor(() => {
      expect(screen.getByText('AI Status Unknown')).toBeInTheDocument();
    });

    // This will fail until using shadcn/ui Alert for error states
    const errorElement = screen.getByText('AI Status Unknown').closest('div');
    
    // Should use shadcn/ui Alert destructive variant
    expect(errorElement).toHaveClass('relative', 'w-full', 'rounded-lg', 'border');
    expect(errorElement).toHaveClass('p-4');
    expect(errorElement).toHaveClass('border-destructive/50', 'text-destructive');
    expect(errorElement).toHaveClass('dark:border-destructive');

    // Should show error details
    expect(screen.getByText('(API connection failed)')).toBeInTheDocument();
  });

  it('should maintain accessibility compliance with shadcn/ui components', async () => {
    const { getAIModelStatus } = require('@/lib/actions/ai-status-actions');
    getAIModelStatus.mockResolvedValue({ success: true, data: mockAIStatus });

    render(<AIStatusIndicator showDetails={true} />);

    await waitFor(() => {
      expect(screen.getByText('AI Active')).toBeInTheDocument();
    });

    // Should have proper ARIA attributes
    const statusElement = screen.getByText('AI Active').closest('div');
    expect(statusElement).toHaveAttribute('role', 'status');
    
    // This will fail until using shadcn/ui components with proper focus management
    expect(statusElement).toHaveClass('focus:outline-none', 'focus:ring-2');
    expect(statusElement).toHaveClass('focus:ring-ring', 'focus:ring-offset-2');
  });

  it('should show loading state with shadcn/ui Skeleton', () => {
    const { getAIModelStatus } = require('@/lib/actions/ai-status-actions');
    getAIModelStatus.mockImplementation(() => new Promise(() => {})); // Never resolves

    render(<AIStatusIndicator />);

    expect(screen.getByText('Checking AI status...')).toBeInTheDocument();

    // This will fail until using shadcn/ui Skeleton for loading
    const loadingElement = screen.getByText('Checking AI status...').previousElementSibling;
    expect(loadingElement).toHaveClass('animate-pulse');
    expect(loadingElement).toHaveClass('rounded-md', 'bg-muted');
  });

  describe('AIStatusBadge Component', () => {
    it('should render as shadcn/ui Badge component', async () => {
      const { getAIModelStatus } = require('@/lib/actions/ai-status-actions');
      getAIModelStatus.mockResolvedValue({ success: true, data: mockAIStatus });

      render(<AIStatusBadge />);

      await waitFor(() => {
        const badgeElement = screen.getByText('AI').closest('div');
        
        // This will fail until using shadcn/ui Badge
        expect(badgeElement).toHaveClass('inline-flex', 'items-center', 'rounded-full');
        expect(badgeElement).toHaveClass('border', 'px-2.5', 'py-0.5', 'text-xs', 'font-semibold');
        expect(badgeElement).toHaveClass('transition-colors');
      });
    });

    it('should show different badge variants based on status', async () => {
      const { getAIModelStatus } = require('@/lib/actions/ai-status-actions');
      
      // Test success variant
      getAIModelStatus.mockResolvedValue({ success: true, data: mockAIStatus });
      const { rerender } = render(<AIStatusBadge />);

      await waitFor(() => {
        const badgeElement = screen.getByText('AI').closest('div');
        expect(badgeElement).toHaveClass('bg-green-100', 'text-green-800');
      });

      // Test warning variant
      getAIModelStatus.mockResolvedValue({ success: true, data: mockAIStatusWithError });
      rerender(<AIStatusBadge />);

      await waitFor(() => {
        const badgeElement = screen.getByText('AI').closest('div');
        expect(badgeElement).toHaveClass('bg-yellow-100', 'text-yellow-800');
      });
    });
  });

  describe('AIStatusPanel Component', () => {
    it('should render with shadcn/ui Card component', async () => {
      const { getAIModelStatus } = require('@/lib/actions/ai-status-actions');
      getAIModelStatus.mockResolvedValue({ success: true, data: mockAIStatus });

      render(<AIStatusPanel />);

      await waitFor(() => {
        expect(screen.getByText('AI Service Status')).toBeInTheDocument();
      });

      // This will fail until using shadcn/ui Card
      const panelElement = screen.getByText('AI Service Status').closest('div');
      expect(panelElement).toHaveClass('rounded-lg', 'border', 'bg-card');
      expect(panelElement).toHaveClass('text-card-foreground', 'shadow-sm');
    });

    it('should show error state with shadcn/ui Alert in panel', async () => {
      const { getAIModelStatus } = require('@/lib/actions/ai-status-actions');
      getAIModelStatus.mockResolvedValue({ success: false, error: 'Service unavailable' });

      render(<AIStatusPanel />);

      await waitFor(() => {
        expect(screen.getByText('AI Service Error')).toBeInTheDocument();
      });

      // This will fail until using shadcn/ui Alert for error state
      const errorElement = screen.getByText('AI Service Error').closest('div');
      expect(errorElement).toHaveClass('relative', 'w-full', 'rounded-lg', 'border');
      expect(errorElement).toHaveClass('border-destructive/50', 'text-destructive');
    });

    it('should display detailed status information with proper styling', async () => {
      const { getAIModelStatus } = require('@/lib/actions/ai-status-actions');
      getAIModelStatus.mockResolvedValue({ success: true, data: mockAIStatus });

      render(<AIStatusPanel />);

      await waitFor(() => {
        expect(screen.getByText('Active')).toBeInTheDocument();
        expect(screen.getByText('claude-3-haiku')).toBeInTheDocument();
        expect(screen.getByText('25')).toBeInTheDocument(); // requests
        expect(screen.getByText('15,000')).toBeInTheDocument(); // tokens
      });
    });
  });

  it('should preserve existing functionality after shadcn/ui migration', async () => {
    const { getAIModelStatus } = require('@/lib/actions/ai-status-actions');
    getAIModelStatus.mockResolvedValue({ success: true, data: mockAIStatus });

    render(<AIStatusIndicator showDetails={true} />);

    await waitFor(() => {
      expect(screen.getByText('AI Active')).toBeInTheDocument();
      expect(screen.getByText('claude-3-haiku')).toBeInTheDocument();
      expect(screen.getByText('25 requests today')).toBeInTheDocument();
    });

    // Should maintain all existing functionality
    expect(screen.getByText('•')).toBeInTheDocument(); // separator
  });
});
