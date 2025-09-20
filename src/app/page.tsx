"use client";

// WFG Git Log Viewer - Main page integrating all components
// Provides a complete interface for viewing Git commits and daily summaries

import DailySummariesView from "@/components/DailySummariesView";
import GitCommitsList from "@/components/GitCommitsList";
import GitFilterForm from "@/components/GitFilterForm";
import RefreshButton from "@/components/RefreshButton";
import { EnhancedDailySummary } from "@/types/ai";
import { GitCommit } from "@/types/git";
import { subDays } from "date-fns";
import { useState } from "react";

export default function Home() {
  const [commits, setCommits] = useState<GitCommit[]>([]);
  const [summaries, setSummaries] = useState<EnhancedDailySummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [currentAuthor, setCurrentAuthor] = useState("");
  const [currentSince, setCurrentSince] = useState<Date>(new Date());

  const handleCommitsResult = (newCommits: GitCommit[]) => {
    setCommits(newCommits);
  };

  const handleSummariesResult = (newSummaries: EnhancedDailySummary[]) => {
    setSummaries(newSummaries);
  };

  const handleError = (errorMessage: string) => {
    setError(errorMessage);
  };

  const handleLoading = (isLoading: boolean) => {
    setLoading(isLoading);
  };

  const handleSummariesRefreshed = (
    refreshedSummaries: EnhancedDailySummary[]
  ) => {
    setSummaries(refreshedSummaries);
    setError(""); // Clear any previous errors
  };

  // Track current filter parameters for refresh functionality
  const updateFilterParams = (author: string, since: Date) => {
    setCurrentAuthor(author);
    setCurrentSince(since);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                WFG - Worklog From Git
              </h1>
              <p className="text-sm text-gray-600 mt-1">
                View Git commits and generate daily summaries with Thai date
                formatting
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <RefreshButton
                author={currentAuthor}
                since={currentSince}
                onSummariesRefreshed={handleSummariesRefreshed}
                onError={handleError}
                disabled={loading || !currentAuthor}
              />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Error Display */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-md p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg
                  className="h-5 w-5 text-red-400"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">Error</h3>
                <p className="text-sm text-red-700 mt-1">{error}</p>
              </div>
              <div className="ml-auto pl-3">
                <button
                  onClick={() => setError("")}
                  className="inline-flex text-red-400 hover:text-red-600"
                >
                  <span className="sr-only">Dismiss</span>
                  <svg
                    className="h-5 w-5"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                      clipRule="evenodd"
                    />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Filter Form */}
        <GitFilterForm
          onCommitsResult={(newCommits) => {
            handleCommitsResult(newCommits);
            // Extract author and since from the first commit for refresh functionality
            if (newCommits.length > 0) {
              const date = new Date(
                Math.min(...newCommits.map((c) => c.date.getTime()))
              );
              const dateSubtract1Day = subDays(date, 1);
              updateFilterParams(newCommits[0].author, dateSubtract1Day);
            }
          }}
          onSummariesResult={handleSummariesResult}
          onError={handleError}
          onLoading={handleLoading}
        />

        {/* Results Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Git Commits List */}
          <div className="lg:col-span-1">
            <GitCommitsList
              commits={commits}
              loading={loading}
              error={
                error && error.includes("Git Error")
                  ? error.replace("Git Error: ", "")
                  : ""
              }
            />
          </div>

          {/* Daily Summaries View */}
          <div className="lg:col-span-1">
            <DailySummariesView
              summaries={summaries}
              loading={loading}
              error={
                error && error.includes("Summary Error")
                  ? error.replace("Summary Error: ", "")
                  : ""
              }
            />
          </div>
        </div>

        {/* Instructions */}
        {commits.length === 0 &&
          summaries.length === 0 &&
          !loading &&
          !error && (
            <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg
                    className="h-5 w-5 text-blue-400"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-blue-800">
                    Getting Started
                  </h3>
                  <div className="mt-2 text-sm text-blue-700">
                    <ol className="list-decimal list-inside space-y-1">
                      <li>
                        Enter your Git author name (exactly as it appears in
                        commits)
                      </li>
                      <li>Select a date within the last 31 days</li>
                      <li>Click "Filter Commits" to view your Git activity</li>
                      <li>Daily summaries will be generated automatically</li>
                      <li>
                        Use "Refresh Summaries" to update with latest commits
                      </li>
                    </ol>
                  </div>
                </div>
              </div>
            </div>
          )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-500">
              WFG - Worklog From Git • Built with Next.js, TypeScript, and
              Tailwind CSS
            </p>
            <div className="flex items-center space-x-4 text-xs text-gray-400">
              <span>Thai Buddhist Calendar Support</span>
              <span>•</span>
              <span>SQLite Database</span>
              <span>•</span>
              <span>Server Actions</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
