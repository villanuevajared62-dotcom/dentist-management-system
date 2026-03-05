'use client';

import { useEffect } from 'react';

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    if (process.env.NODE_ENV === 'development') {
      console.error('Dashboard error:', error);
    }
  }, [error]);

  return (
    <div className="min-h-[400px] flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8 text-center">
        {/* Error Icon */}
        <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-red-100 flex items-center justify-center">
          <svg
            className="w-8 h-8 text-red-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
        </div>

        {/* Error Title */}
        <h2 className="text-xl font-semibold text-slate-800 mb-2">
          Something went wrong
        </h2>

        {/* Error Message */}
        <p className="text-slate-600 mb-6">
          An unexpected error occurred while loading this page.
        </p>

        {/* Development Mode Error Details */}
        {process.env.NODE_ENV === 'development' && error.message && (
          <div className="mb-6 p-3 bg-slate-100 rounded-lg text-left overflow-auto max-h-32">
            <p className="text-xs font-mono text-red-600 break-words">
              {error.message}
            </p>
          </div>
        )}

        {/* Action Button */}
        <button
          onClick={() => reset()}
          className="px-6 py-2.5 bg-slate-800 text-white rounded-lg font-medium hover:bg-slate-700 transition-colors"
        >
          Try Again
        </button>
      </div>
    </div>
  );
}

