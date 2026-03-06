'use client';
import { SessionProvider } from 'next-auth/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState } from 'react';

// Query key constants for consistent caching
export const QUERY_KEYS = {
  branches: ['branches'],
  dentists: ['dentists'],
  appointments: ['appointments'],
  patients: ['patients'],
} as const;

// Default stale times in milliseconds - OPTIMIZED for better caching
export const STALE_TIMES = {
  branches: 10 * 60 * 1000,    // 10 minutes - changes rarely
  dentists: 10 * 60 * 1000,    // 10 minutes - changes rarely
  appointments: 60 * 1000,     // 1 minute - changes often but allow some caching
  patients: 5 * 60 * 1000,      // 5 minutes
  users: 5 * 60 * 1000,        // 5 minutes
  stats: 2 * 60 * 1000,        // 2 minutes for dashboard stats
} as const;

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60 * 1000, // Default 1 minute for all queries
        gcTime: 5 * 60 * 1000, // Keep unused data in cache for 5 minutes (formerly cacheTime)
        retry: 1,
        refetchOnWindowFocus: false, // Reduce unnecessary refetches
      },
    },
  }));

  return (
    <SessionProvider basePath="/api/auth">
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    </SessionProvider>
  );
}
