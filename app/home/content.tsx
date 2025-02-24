'use client';

import { Tooltip } from '@nextui-org/tooltip';
import Header from '@/components/layout/header/Header';
import { VaultInfoCard } from '@/components/vault/VaultInfoCard';
import { LiveStatusCard } from '@/components/vault/LiveStatusCard';
import { ActivityCard } from '@/components/vault/ActivityCard';
import { VaultHeaderStats } from '@/components/vault/VaultHeaderStats';

const USDC = {
  symbol: 'USDC',
  img: require('../../src/imgs/tokens/usdc.webp') as string,
  decimals: 6,
  address: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
};

const vaultAddress = '0x346aac1e83239db6a6cb760e95e13258ad3d1a6d';


function VaultContent() {
  return (
    <>
      <Header />
      <div className="container mx-auto px-6 py-8 font-zen">
        {/* Top Header Section */}
        <div className="mb-8">
          <VaultHeaderStats vaultAddress={vaultAddress} />
        </div>

        {/* Main Content Section */}
        <div className="grid grid-cols-12 gap-6">
          <div className="col-span-4">
            <ActivityCard />
          </div>
          <div className="col-span-8">
            <LiveStatusCard />
          </div>
        </div>
      </div>
    </>
  );
}

export default VaultContent;
