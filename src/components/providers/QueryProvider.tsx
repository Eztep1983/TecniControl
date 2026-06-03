'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState, ReactNode } from 'react';

export default function QueryProvider({ children }: { children: ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // staleTime: 5 minutos
            staleTime: 5 * 60 * 1000,
            // gcTime (cacheTime): 30 minutos
            gcTime: 30 * 60 * 1000,
            // Reintentos automáticos en fallos de red
            retry: 2,
            // Desactivar refetch on window focus por defecto en móvil para ahorrar datos
            refetchOnWindowFocus: false,
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      {/* <ReactQueryDevtools initialIsOpen={false} /> */}
    </QueryClientProvider>
  );
}
