// GitCommitsList - Server Component for displaying Git commits
// Shows filtered commits with proper formatting and grouping

import { GitCommit } from '@/types/git';
import { formatThaiDate, isSameDay } from '@/lib/utils/date-formatter';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';

interface GitCommitsListProps {
  commits: GitCommit[];
  loading?: boolean;
  error?: string;
}

export default function GitCommitsList({ 
  commits, 
  loading = false, 
  error 
}: GitCommitsListProps) {
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Git Commits</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Skeleton className="h-8 w-8 rounded-full" />
            <span className="ml-3 text-muted-foreground">Loading commits...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Git Commits</CardTitle>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            <AlertTitle>Error loading commits</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  if (commits.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Git Commits</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <svg className="mx-auto h-12 w-12 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <h4 className="mt-4 text-lg font-medium">No commits found</h4>
            <p className="mt-2 text-sm text-muted-foreground">
              Try adjusting your filter criteria or check if the author name is correct.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Group commits by day
  const commitsByDay = commits.reduce((groups, commit) => {
    const dayKey = commit.date.toDateString();
    if (!groups[dayKey]) {
      groups[dayKey] = [];
    }
    groups[dayKey].push(commit);
    return groups;
  }, {} as Record<string, GitCommit[]>);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Git Commits</CardTitle>
          <Badge variant="secondary">
            {commits.length} commit{commits.length !== 1 ? 's' : ''} found
          </Badge>
        </div>
      </CardHeader>
      <CardContent>

      <div className="space-y-6">
        {Object.entries(commitsByDay)
          .sort(([a], [b]) => new Date(b).getTime() - new Date(a).getTime()) // Sort by date descending
          .map(([dayKey, dayCommits]) => {
            const date = new Date(dayKey);
            const sortedCommits = dayCommits.sort((a, b) => b.date.getTime() - a.date.getTime());

            return (
              <div key={dayKey} className="border-l-4 border-blue-200 pl-4">
                <div className="flex items-center mb-3">
                  <h4 className="text-md font-medium text-gray-900">
                    {formatThaiDate(date)}
                  </h4>
                  <Badge variant="outline" className="ml-2 text-xs">
                    {dayCommits.length} commit{dayCommits.length !== 1 ? 's' : ''}
                  </Badge>
                </div>

                <div className="space-y-3">
                  {sortedCommits.map((commit) => (
                    <div key={commit.hash} className="bg-gray-50 rounded-md p-3">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-900 mb-1">
                            {commit.message}
                          </p>
                          <div className="flex items-center text-xs text-gray-500 space-x-4">
                            <span className="flex items-center">
                              <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                              </svg>
                              {commit.author}
                            </span>
                            <span className="flex items-center">
                              <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                              </svg>
                              {commit.date.toLocaleTimeString('th-TH', { 
                                hour: '2-digit', 
                                minute: '2-digit' 
                              })}
                            </span>
                            <span className="flex items-center font-mono">
                              <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z" />
                              </svg>
                              {commit.hash.substring(0, 7)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
