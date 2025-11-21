"use client";

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState } from 'react';

export function ReactQueryProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // Disable automatic refetching on window focus and mount
            refetchOnWindowFocus: false,
            refetchOnMount: false,
            // Set shorter stale time for more responsive UI updates (1 minute)
            staleTime: 1 * 60 * 1000,
            // Set garbage collection time (10 minutes)
            gcTime: 10 * 60 * 1000,
            // Retry failed queries 2 times
            retry: 2,
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
}