// AI Status Indicator Component
// Shows the current status of AI services with visual indicators

'use client';

import { useState, useEffect } from 'react';
import { getAIModelStatus } from '@/lib/actions/ai-status-actions';
import { AIModelStatus } from '@/types/ai-config';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';

interface AIStatusIndicatorProps {
  className?: string;
  showDetails?: boolean;
}

export default function AIStatusIndicator({ 
  className = '', 
  showDetails = false 
}: AIStatusIndicatorProps) {
  const [status, setStatus] = useState<AIModelStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        setLoading(true);
        const result = await getAIModelStatus();
        
        if (result.success) {
          setStatus(result.data);
          setError(null);
        } else {
          setError(result.error);
          setStatus(null);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch AI status');
        setStatus(null);
      } finally {
        setLoading(false);
      }
    };

    fetchStatus();
    
    // Refresh status every 5 minutes
    const interval = setInterval(fetchStatus, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className={`flex items-center space-x-2 ${className}`}>
        <Skeleton className="w-2 h-2 rounded-full" />
        <span className="text-xs text-muted-foreground">Checking AI status...</span>
      </div>
    );
  }

  if (error || !status) {
    return (
      <div className={className}>
        <Alert variant="destructive">
          <div className="w-2 h-2 bg-destructive rounded-full"></div>
          <AlertTitle className="text-xs">AI Status Unknown</AlertTitle>
          {showDetails && error && (
            <AlertDescription className="text-xs">
              {error}
            </AlertDescription>
          )}
        </Alert>
      </div>
    );
  }

  const getStatusColor = () => {
    if (!status.isAIEnabled) return 'bg-gray-400';
    if (status.todayUsage.errors > 5) return 'bg-yellow-500';
    if (status.lastError) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const getStatusText = () => {
    if (!status.isAIEnabled) return 'AI Disabled';
    if (status.todayUsage.errors > 5) return 'AI Degraded';
    if (status.lastError) return 'AI Warning';
    return 'AI Active';
  };

  const getStatusDescription = () => {
    if (!status.isAIEnabled) return 'AI functionality is disabled';
    if (status.todayUsage.errors > 5) return `${status.todayUsage.errors} errors today`;
    if (status.lastError) return status.lastError;
    return `${status.todayUsage.requests} requests today`;
  };

  const getBadgeVariant = () => {
    if (!status.isAIEnabled) return 'secondary';
    if (status.todayUsage.errors > 5) return 'destructive';
    if (status.lastError) return 'outline';
    return 'default';
  };

  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      <Badge variant={getBadgeVariant()} className="gap-1">
        <div className={`w-2 h-2 rounded-full ${getStatusColor()}`}></div>
        {getStatusText()}
      </Badge>
      
      {showDetails && (
        <div className="flex items-center space-x-3 text-xs text-muted-foreground">
          <span>•</span>
          <span>{status.currentModel.split('/')[1] || status.currentModel}</span>
          <span>•</span>
          <span>{getStatusDescription()}</span>
        </div>
      )}
    </div>
  );
}

// Compact version for headers/toolbars
export function AIStatusBadge({ className = '' }: { className?: string }) {
  const [status, setStatus] = useState<AIModelStatus | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const result = await getAIModelStatus();
        if (result.success) {
          setStatus(result.data);
        }
      } catch (err) {
        // Silently fail for badge
      } finally {
        setLoading(false);
      }
    };

    fetchStatus();
  }, []);

  if (loading) {
    return (
      <Badge variant="secondary" className={`gap-1 ${className}`}>
        <Skeleton className="w-1.5 h-1.5 rounded-full" />
        AI
      </Badge>
    );
  }

  if (!status) {
    return (
      <Badge variant="destructive" className={`gap-1 ${className}`}>
        <div className="w-1.5 h-1.5 bg-white rounded-full"></div>
        AI
      </Badge>
    );
  }

  const getBadgeVariant = () => {
    if (!status.isAIEnabled) return 'secondary';
    if (status.todayUsage.errors > 5) return 'destructive';
    if (status.lastError) return 'outline';
    return 'default';
  };

  const getBadgeColor = () => {
    if (!status.isAIEnabled) return 'bg-muted-foreground';
    if (status.todayUsage.errors > 5) return 'bg-destructive';
    if (status.lastError) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  return (
    <Badge variant={getBadgeVariant()} className={`gap-1 ${className}`}>
      <div className={`w-1.5 h-1.5 rounded-full ${getBadgeColor()}`}></div>
      AI
    </Badge>
  );
}

// Detailed status panel for settings/admin
export function AIStatusPanel({ className = '' }: { className?: string }) {
  const [status, setStatus] = useState<AIModelStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        setLoading(true);
        const result = await getAIModelStatus();
        
        if (result.success) {
          setStatus(result.data);
          setError(null);
        } else {
          setError(result.error);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch AI status');
      } finally {
        setLoading(false);
      }
    };

    fetchStatus();
  }, []);

  if (loading) {
    return (
      <div className={`bg-white rounded-lg border border-gray-200 p-4 ${className}`}>
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-3"></div>
          <div className="space-y-2">
            <div className="h-3 bg-gray-200 rounded w-1/2"></div>
            <div className="h-3 bg-gray-200 rounded w-1/3"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !status) {
    return (
      <div className={`bg-white rounded-lg border border-red-200 p-4 ${className}`}>
        <div className="flex items-center space-x-2 mb-2">
          <div className="w-3 h-3 bg-red-500 rounded-full"></div>
          <h3 className="text-sm font-medium text-red-800">AI Service Error</h3>
        </div>
        <p className="text-sm text-red-600">{error || 'Unable to fetch AI status'}</p>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-lg border border-gray-200 p-4 ${className}`}>
      <div className="flex items-center space-x-2 mb-3">
        <div className={`w-3 h-3 rounded-full ${
          status.isAIEnabled ? 'bg-green-500' : 'bg-gray-400'
        }`}></div>
        <h3 className="text-sm font-medium text-gray-900">
          AI Service Status
        </h3>
      </div>

      <div className="space-y-3">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-gray-500">Status:</span>
            <span className={`ml-2 font-medium ${
              status.isAIEnabled ? 'text-green-600' : 'text-gray-600'
            }`}>
              {status.isAIEnabled ? 'Active' : 'Disabled'}
            </span>
          </div>
          <div>
            <span className="text-gray-500">Model:</span>
            <span className="ml-2 font-medium text-gray-900">
              {status.currentModel.split('/')[1] || status.currentModel}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4 text-sm">
          <div>
            <span className="text-gray-500">Requests:</span>
            <span className="ml-2 font-medium text-gray-900">
              {status.todayUsage.requests}
            </span>
          </div>
          <div>
            <span className="text-gray-500">Tokens:</span>
            <span className="ml-2 font-medium text-gray-900">
              {status.todayUsage.tokens.toLocaleString()}
            </span>
          </div>
          <div>
            <span className="text-gray-500">Errors:</span>
            <span className={`ml-2 font-medium ${
              status.todayUsage.errors > 0 ? 'text-red-600' : 'text-green-600'
            }`}>
              {status.todayUsage.errors}
            </span>
          </div>
        </div>

        {status.lastError && (
          <div className="mt-3 p-2 bg-yellow-50 border border-yellow-200 rounded">
            <p className="text-xs text-yellow-700">
              <strong>Last Error:</strong> {status.lastError}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
