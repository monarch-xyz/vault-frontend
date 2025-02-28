'use client';

import Header from '@/components/layout/header/Header';
import { ActivityCard } from '@/components/vault/ActivityCard';
import { LiveStatusCard } from '@/components/vault/LiveStatusCard';
import { VaultHeaderStats } from '@/components/vault/VaultHeaderStats';

const USDC = {
  symbol: 'USDC',
  img: require('../../src/imgs/tokens/usdc.webp') as string,
  decimals: 6,
  address: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
};

const vaultAddress = '0x346aac1e83239db6a6cb760e95e13258ad3d1a6d';

export default function HomeContent() {
  return (
    <>
      <Header />
      <div className="container mx-auto space-y-6 py-4">
        {/* Vault Header Stats - Full width */}
        <VaultHeaderStats vaultAddress={vaultAddress} />

        {/* Activity and Live Status Cards - Reordered and resized */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          {/* Activity Card - 1/3 width on desktop */}
          <div className="order-2 lg:order-1 lg:col-span-4">
            <ActivityCard />
          </div>
          {/* Live Status - 2/3 width on desktop */}
          <div className="order-1 lg:order-2 lg:col-span-8">
            <LiveStatusCard />
          </div>
        </div>
      </div>
    </>
  );
}
