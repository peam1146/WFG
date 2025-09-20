// LoadingSpinner - Reusable loading component with different sizes and styles
// Provides consistent loading states across the application

import { Skeleton } from '@/components/ui/skeleton';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  text?: string;
  className?: string;
}

const sizeClasses = {
  sm: 'h-4 w-4',
  md: 'h-6 w-6',
  lg: 'h-8 w-8',
  xl: 'h-12 w-12'
};

const textSizeClasses = {
  sm: 'text-xs',
  md: 'text-sm',
  lg: 'text-base',
  xl: 'text-lg'
};

export default function LoadingSpinner({ 
  size = 'md', 
  text,
  className = ''
}: LoadingSpinnerProps) {
  return (
    <div className={`flex items-center justify-center ${className}`}>
      <div className="flex flex-col items-center space-y-2">
        <Skeleton 
          className={`${sizeClasses[size]} rounded-md`}
          role="status"
          aria-label="Loading"
        >
          <span className="sr-only">Loading...</span>
        </Skeleton>
        {text && (
          <span className={`text-muted-foreground ${textSizeClasses[size]}`}>
            {text}
          </span>
        )}
      </div>
    </div>
  );
}

// Specialized loading components for common use cases
export function PageLoadingSpinner({ text = 'Loading page...' }: { text?: string }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <LoadingSpinner size="xl" text={text} />
    </div>
  );
}

export function ComponentLoadingSpinner({ text = 'Loading...' }: { text?: string }) {
  return (
    <div className="min-h-[200px] flex items-center justify-center">
      <LoadingSpinner size="lg" text={text} />
    </div>
  );
}

export function InlineLoadingSpinner({ text }: { text?: string }) {
  return (
    <div className="flex items-center space-x-2">
      <LoadingSpinner size="sm" />
      {text && <span className="text-sm text-gray-600">{text}</span>}
    </div>
  );
}

export function ButtonLoadingSpinner() {
  return <LoadingSpinner size="sm" className="mr-2" />;
}
