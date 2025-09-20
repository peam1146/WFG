'use client';

// GitFilterForm - Client component for filtering Git commits
// Handles form state and submission to Server Actions

import { useState, useTransition } from 'react';
import { fetchGitCommits } from '@/lib/actions/git-actions';
import { generateSummaries } from '@/lib/actions/summary-actions';
import { formatDateForInput, getDaysAgo } from '@/lib/utils/date-formatter';
import { GitCommit, DailySummary } from '@/types/git';

interface GitFilterFormProps {
  onCommitsResult: (commits: GitCommit[]) => void;
  onSummariesResult: (summaries: DailySummary[]) => void;
  onError: (error: string) => void;
  onLoading: (loading: boolean) => void;
}

export default function GitFilterForm({
  onCommitsResult,
  onSummariesResult,
  onError,
  onLoading
}: GitFilterFormProps) {
  const [isPending, startTransition] = useTransition();
  const [formData, setFormData] = useState({
    author: '',
    since: formatDateForInput(getDaysAgo(7)) // Default to 7 days ago
  });

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    
    if (!formData.author.trim()) {
      onError('Author name is required');
      return;
    }

    startTransition(async () => {
      onLoading(true);
      onError(''); // Clear previous errors

      try {
        const formDataObj = new FormData();
        formDataObj.append('author', formData.author);
        formDataObj.append('since', formData.since);

        // Fetch commits and summaries in parallel
        const [commitsResult, summariesResult] = await Promise.all([
          fetchGitCommits(formDataObj),
          generateSummaries(formDataObj)
        ]);

        if (commitsResult.success) {
          onCommitsResult(commitsResult.data);
        } else {
          onError(`Git Error: ${commitsResult.error}`);
        }

        if (summariesResult.success) {
          onSummariesResult(summariesResult.data);
        } else {
          onError(`Summary Error: ${summariesResult.error}`);
        }

      } catch (error) {
        onError(`Unexpected error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      } finally {
        onLoading(false);
      }
    });
  };

  const handleInputChange = (field: keyof typeof formData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-6">
      <h2 className="text-xl font-semibold text-gray-800 mb-4">
        Git Log Filter
      </h2>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label 
            htmlFor="author" 
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Author Name
          </label>
          <input
            type="text"
            id="author"
            value={formData.author}
            onChange={(e) => handleInputChange('author', e.target.value)}
            placeholder="Enter Git author name"
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            disabled={isPending}
            required
          />
        </div>

        <div>
          <label 
            htmlFor="since" 
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Since Date (within last 31 days)
          </label>
          <input
            type="date"
            id="since"
            value={formData.since}
            onChange={(e) => handleInputChange('since', e.target.value)}
            min={formatDateForInput(getDaysAgo(31))}
            max={formatDateForInput(new Date())}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            disabled={isPending}
            required
          />
        </div>

        <div className="flex gap-3">
          <button
            type="submit"
            disabled={isPending}
            className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isPending ? 'Loading...' : 'Filter Commits'}
          </button>
          
          <button
            type="button"
            onClick={() => {
              setFormData({
                author: '',
                since: formatDateForInput(getDaysAgo(7))
              });
            }}
            disabled={isPending}
            className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Reset
          </button>
        </div>
      </form>

      <div className="mt-4 text-xs text-gray-500">
        <p>• Enter the exact Git author name as it appears in commits</p>
        <p>• Date range is limited to the last 31 days for performance</p>
        <p>• Merge commits are automatically excluded</p>
      </div>
    </div>
  );
}
