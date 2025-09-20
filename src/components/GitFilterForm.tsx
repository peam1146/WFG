'use client';

// GitFilterForm - Client component for filtering Git commits
// Handles form state and submission to Server Actions

import { useState, useTransition } from 'react';
import { fetchGitCommits } from '@/lib/actions/git-actions';
import { generateSummaries } from '@/lib/actions/summary-actions';
import { formatDateForInput, getDaysAgo } from '@/lib/utils/date-formatter';
import { GitCommit } from '@/types/git';
import { EnhancedDailySummary } from '@/types/ai';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

interface GitFilterFormProps {
  onCommitsResult: (commits: GitCommit[]) => void;
  onSummariesResult: (summaries: EnhancedDailySummary[]) => void;
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
    <Card className="mb-6">
      <CardHeader>
        <CardTitle>Git Log Filter</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="author">Author Name</Label>
            <Input
              type="text"
              id="author"
              value={formData.author}
              onChange={(e) => handleInputChange('author', e.target.value)}
              placeholder="Enter Git author name"
              disabled={isPending}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="since">Since Date (within last 31 days)</Label>
            <Input
              type="date"
              id="since"
              value={formData.since}
              onChange={(e) => handleInputChange('since', e.target.value)}
              min={formatDateForInput(getDaysAgo(31))}
              max={formatDateForInput(new Date())}
              disabled={isPending}
              required
            />
          </div>

          <div className="flex gap-3">
            <Button
              type="submit"
              disabled={isPending}
              className="flex-1"
              size="lg"
            >
              {isPending ? 'Loading...' : 'Filter Commits'}
            </Button>
            
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setFormData({
                  author: '',
                  since: formatDateForInput(getDaysAgo(7))
                });
              }}
              disabled={isPending}
              size="lg"
            >
              Reset
            </Button>
          </div>
        </form>

        <div className="mt-4 text-xs text-muted-foreground">
          <p>• Enter the exact Git author name as it appears in commits</p>
          <p>• Date range is limited to the last 31 days for performance</p>
          <p>• Merge commits are automatically excluded</p>
        </div>
      </CardContent>
    </Card>
  );
}
