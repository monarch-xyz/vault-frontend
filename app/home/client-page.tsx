'use client';

import dynamic from 'next/dynamic';
import { Spinner } from '@/components/common/Spinner';

// Dynamically import VaultContent with no SSR
const VaultContent = dynamic(() => import('./content'), {
  ssr: false,
  loading: () => (
    <div className="flex h-screen items-center justify-center">
      <Spinner size={24} />
    </div>
  ),
});

export default function HomeClient() {
  return <VaultContent />;
}
