import React from 'react';
import { Button } from '@/components/ui/button';
import { ErrorMessageProps } from './types';

export const ErrorMessage: React.FC<ErrorMessageProps> = ({
  error,
  retryCount,
  isRetrying,
  onRetry
}) => {
  if (!error) return null;

  return (
    <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4 mb-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h3 className="font-medium text-destructive">Error Loading Products</h3>
          <p className="text-sm text-destructive/80 mt-1">{error}</p>
          {retryCount > 0 && (
            <p className="text-xs text-muted-foreground mt-1">
              Attempt {retryCount} of 3
            </p>
          )}
        </div>
        <Button
          variant="destructive"
          onClick={onRetry}
          disabled={isRetrying}
        >
          {isRetrying ? 'Retrying...' : 'Retry'}
        </Button>
      </div>
    </div>
  );
};