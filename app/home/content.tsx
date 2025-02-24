'use client';

import { Tooltip } from '@nextui-org/tooltip';
import Header from '@/components/layout/header/Header';
import { VaultInfoCard } from '@/components/vault/VaultInfoCard';
import { LiveStatusCard } from '@/components/vault/LiveStatusCard';
import { ActivityCard } from '@/components/vault/ActivityCard';

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
        <div className="grid grid-cols-12 gap-6">
          <div className="col-span-5">
            <ActivityCard />
          </div>

          <div className="col-span-7 space-y-6">
            <div className="h-[280px]">
              <VaultInfoCard vaultAddress={vaultAddress} />
            </div>
            
            <div className="h-[400px]">
              <LiveStatusCard />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default VaultContent;
