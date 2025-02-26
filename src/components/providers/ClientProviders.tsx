'use client';

import { ReactNode } from 'react';
import { MarketsProvider } from '@/contexts/MarketsContext';
import { WebSocketProvider } from '@/contexts/WebSocketContext';

type ClientProvidersProps = {
  children: ReactNode;
};

export function ClientProviders({ children }: ClientProvidersProps) {
  return (
    <WebSocketProvider>
      <MarketsProvider>{children}</MarketsProvider>
    </WebSocketProvider>
  );
}
