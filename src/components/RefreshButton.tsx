'use client';

// RefreshButton - Client component for refreshing summaries
// Handles refresh action with loading state and error handling

import { useState, useTransition } from 'react';
import { refreshSummaries } from '@/lib/actions/summary-actions';
import { DailySummary } from '@/types/git';

interface RefreshButtonProps {
  author: string;
  since: Date;
  onSummariesRefreshed: (summaries: DailySummary[]) => void;
  onError: (error: string) => void;
  disabled?: boolean;
}

export default function RefreshButton({
  author,
  since,
  onSummariesRefreshed,
  onError,
  disabled = false
}: RefreshButtonProps) {
  const [isPending, startTransition] = useTransition();
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);

  const handleRefresh = () => {
    if (!author.trim()) {
      onError('Author name is required for refresh');
      return;
    }

    startTransition(async () => {
      try {
        const result = await refreshSummaries(author, since);

        if (result.success) {
          onSummariesRefreshed(result.data);
          setLastRefresh(new Date());
          onError(''); // Clear any previous errors
        } else {
          onError(`Refresh failed: ${result.error}`);
        }
      } catch (error) {
        onError(`Unexpected error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    });
  };

  const isDisabled = disabled || isPending || !author.trim();

  return (
    <div className="flex flex-col items-center space-y-2">
      <button
        onClick={handleRefresh}
        disabled={isDisabled}
        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        title={isDisabled ? 'Enter author name to enable refresh' : 'Refresh summaries with latest commits'}
      >
        {isPending ? (
          <>
            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Refreshing...
          </>
        ) : (
          <>
            <svg className="-ml-1 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Refresh Summaries
          </>
        )}
      </button>

      {lastRefresh && (
        <p className="text-xs text-gray-500 text-center">
          Last refreshed: {lastRefresh.toLocaleTimeString('th-TH', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
          })}
        </p>
      )}

      <div className="text-xs text-gray-400 text-center max-w-xs">
        <p>• Forces regeneration of all summaries</p>
        <p>• Updates cached data with latest commits</p>
        <p>• Use when you've made new commits</p>
      </div>
    </div>
  );
}
