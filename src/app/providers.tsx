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

// Default stale times in milliseconds
export const STALE_TIMES = {
  branches: 5 * 60 * 1000,    // 5 minutes - changes rarely
  dentists: 5 * 60 * 1000,   // 5 minutes - changes rarely
  appointments: 30 * 1000,   // 30 seconds - changes often
  patients: 60 * 1000,        // 1 minute
} as const;

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: STALE_TIMES.appointments, // Default to 30s for appointments
        retry: 1,
      },
    },
  }));

  return (
    <SessionProvider>
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    </SessionProvider>
  );
}
