'use client';

import { ReactNode } from 'react';
import { MarketsProvider } from '@/contexts/MarketsContext';

type ClientProvidersProps = {
  children: ReactNode;
};

export function ClientProviders({ children }: ClientProvidersProps) {
  return <MarketsProvider>{children}</MarketsProvider>;
}
