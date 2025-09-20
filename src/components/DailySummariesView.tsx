// DailySummariesView - Server Component for displaying daily summaries
// Shows generated summaries with Thai date formatting and AI enhancement support

import { DailySummary } from '@/types/git';
import { EnhancedDailySummary } from '@/types/ai';
import { formatThaiDate } from '@/lib/utils/date-formatter';

interface DailySummariesViewProps {
  summaries: DailySummary[] | EnhancedDailySummary[];
  loading?: boolean;
  error?: string;
  aiEnabled?: boolean;
}

export default function DailySummariesView({ 
  summaries, 
  loading = false, 
  error,
  aiEnabled = false
}: DailySummariesViewProps) {
  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">
          Daily Summaries
        </h3>
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
          <div className="ml-3">
            <span className="text-gray-600 block">
              {aiEnabled ? 'Generating AI-enhanced summaries...' : 'Generating summaries...'}
            </span>
            {aiEnabled && (
              <span className="text-xs text-gray-500 mt-1 block">
                This may take a moment while we process your commits with AI
              </span>
            )}
          </div>
        </div>
        
        {aiEnabled && (
          <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
            <div className="flex items-center">
              <svg className="h-4 w-4 text-blue-400 animate-pulse" viewBox="0 0 20 20" fill="currentColor">
                <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3z" />
              </svg>
              <div className="ml-2">
                <p className="text-xs text-blue-700">
                  AI is analyzing your commits to create intelligent, contextual summaries.
                  This process typically takes 10-30 seconds depending on the number of commits.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">
          Daily Summaries
        </h3>
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h4 className="text-sm font-medium text-red-800">Error generating summaries</h4>
              <p className="text-sm text-red-700 mt-1">{error}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (summaries.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">
          Daily Summaries
        </h3>
        <div className="text-center py-8">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <h4 className="mt-4 text-lg font-medium text-gray-900">No summaries available</h4>
          <p className="mt-2 text-sm text-gray-500">
            Summaries will be generated automatically when commits are found.
          </p>
        </div>
      </div>
    );
  }

  // Sort summaries by date descending (newest first)
  const sortedSummaries = [...summaries].sort((a, b) => 
    b.summaryDate.getTime() - a.summaryDate.getTime()
  );

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-800">
          Daily Summaries
        </h3>
        <span className="text-sm text-gray-500">
          {summaries.length} day{summaries.length !== 1 ? 's' : ''} summarized
        </span>
      </div>

      <div className="space-y-4">
        {sortedSummaries.map((summary) => {
          // Type guard to check if summary has AI enhancement
          const isEnhanced = 'hasAISummary' in summary;
          const enhancedSummary = isEnhanced ? summary as EnhancedDailySummary : null;
          
          // Determine which text to display (AI or basic)
          const displayText = enhancedSummary?.hasAISummary && enhancedSummary.aiSummaryText 
            ? enhancedSummary.aiSummaryText 
            : summary.summaryText;
          
          // Parse the summary text to extract Thai date and bullet points
          const lines = displayText.split('\n');
          const thaiDateLine = lines[0];
          const bulletPoints = lines.slice(1).filter(line => line.trim().startsWith('-'));

          return (
            <div key={summary.id} className={`border rounded-lg p-4 hover:shadow-md transition-shadow ${
              enhancedSummary?.hasAISummary ? 'border-blue-200 bg-blue-50/30' : 'border-gray-200'
            }`}>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-2">
                  <h4 className="text-md font-semibold text-gray-900">
                    {thaiDateLine}
                  </h4>
                  {enhancedSummary?.hasAISummary && (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      AI Enhanced
                    </span>
                  )}
                </div>
                <div className="flex items-center text-xs text-gray-500">
                  <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                  </svg>
                  {summary.updatedAt.toLocaleDateString('th-TH')}
                </div>
              </div>

              {bulletPoints.length > 0 ? (
                <ul className="space-y-2">
                  {bulletPoints.map((point, index) => (
                    <li key={index} className="flex items-start">
                      <span className="flex-shrink-0 w-2 h-2 bg-green-500 rounded-full mt-2 mr-3"></span>
                      <span className="text-sm text-gray-700 leading-relaxed">
                        {point.replace(/^-\s*/, '')}
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-gray-600 italic">
                  No activities recorded for this day.
                </p>
              )}

              <div className="mt-3 pt-3 border-t border-gray-100">
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span className="flex items-center">
                    <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                    </svg>
                    {summary.authorName}
                  </span>
                  <div className="flex items-center space-x-3">
                    <span className="flex items-center">
                      <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z" />
                      </svg>
                      {bulletPoints.length} commit{bulletPoints.length !== 1 ? 's' : ''}
                    </span>
                    {enhancedSummary?.hasAISummary && enhancedSummary.aiModelUsed && (
                      <span className="flex items-center text-blue-600">
                        <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3z" />
                        </svg>
                        {enhancedSummary.aiModelUsed.split('/')[1] || enhancedSummary.aiModelUsed}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-md">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-4 w-4 text-green-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-2">
            <p className="text-xs text-green-700">
              Summaries are automatically cached and updated when you refresh. 
              {aiEnabled && ' AI-enhanced summaries provide intelligent, contextual insights.'}
              {' '}Dates are shown in Thai Buddhist calendar format.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
