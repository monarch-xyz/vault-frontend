'use client';

import { Tooltip } from '@nextui-org/tooltip';
import { Spinner } from '@/components/common/Spinner';
import Header from '@/components/layout/header/Header';
import { useMarkets } from '@/contexts/MarketsContext';
import { useVault } from '@/hooks/useVault';
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

function ActivityTypeButton({ 
  type, 
  config, 
  isSelected, 
  onClick 
}: { 
  type: string;
  config: {
    label: string;
    description: string;
    icon: React.ComponentType<{ className?: string }>;
    bgColor: string;
    iconColor: string;
  };
  isSelected: boolean;
  onClick: () => void;
}) {
  const Icon = config.icon;
  
  return (
    <Tooltip 
      content={config.description}
      delay={0}
      closeDelay={0}
    >
      <button
        onClick={onClick}
        className={`
          flex items-center gap-1.5 px-2.5 py-1 rounded-lg transition-all text-xs
          ${isSelected 
            ? `${config.bgColor} ${config.iconColor}` 
            : 'text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-900'
          }
        `}
      >
        <Icon className="w-3.5 h-3.5" />
        <span>{config.label}</span>
      </button>
    </Tooltip>
  );
}

function VaultContent() {
  const { data: vault, isLoading: isVaultLoading, error: vaultError } = useVault(vaultAddress);

  if (isVaultLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Spinner size={24} />
      </div>
    );
  }

  if (vaultError) {
    return <div className="text-center text-red-500">Error: {(vaultError as Error).message}</div>;
  }

  if (!vault) {
    return <div className="text-center">Vault data not available</div>;
  }

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
              <VaultInfoCard vault={vault} vaultAddress={vaultAddress} />
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
