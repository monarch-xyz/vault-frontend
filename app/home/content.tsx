'use client';

import { useState } from 'react';
import { Card, CardHeader, CardBody } from '@nextui-org/card';
import { Tooltip } from '@nextui-org/tooltip';
import { format } from 'date-fns';
import Image from 'next/image';
import { BiBrain, BiTransfer } from 'react-icons/bi';
import { TbLogs } from "react-icons/tb";
import { BsChatDots } from 'react-icons/bs';
import { TbReportAnalytics } from 'react-icons/tb';
import { Button } from '@/components/common/Button';
import { MarketInfoBlockCompact } from '@/components/common/MarketInfoBlock';
import { Spinner } from '@/components/common/Spinner';
import Header from '@/components/layout/header/Header';
import { useMarkets } from '@/contexts/MarketsContext';
import { useVault } from '@/hooks/useVault';
import { formatBalance } from '@/utils/balance';
import { IoMdRefresh } from 'react-icons/io';
import { ChatSection } from '@/components/vault/ChatSection';
import { ActivitiesSection } from '@/components/vault/ActivitiesSection';
import { DepositModal } from '@/components/vault/DepositModal';

const USDC = {
  symbol: 'USDC',
  img: require('../../src/imgs/tokens/usdc.webp') as string,
  decimals: 6,
  address: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
};

const vaultAddress = '0x346aac1e83239db6a6cb760e95e13258ad3d1a6d';

function VaultInfoCard({ vault }: { vault: any }) {
  const { markets } = useMarkets();
  const { dataUpdatedAt, refetch, isRefetching } = useVault(vaultAddress);
  const [isDepositModalOpen, setIsDepositModalOpen] = useState(false);

  return (
    <Card className="bg-surface h-[600px] p-4">
      <CardHeader className="flex items-center justify-between">
        <span className="text-lg font-medium">Vault Overview</span>
        <div className="flex items-center gap-2">
          <Button
            variant="cta"
            size="sm"
            onClick={() => setIsDepositModalOpen(true)}
          >
            Deposit
          </Button>
          <button
            onClick={async () => refetch()}
            className={`rounded-full p-1 text-gray-400 transition-all hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-800
              ${isRefetching ? 'animate-spin' : ''}`}
            disabled={isRefetching}
            title="Refresh vault data"
          >
            <IoMdRefresh className="h-3.5 w-3.5" />
          </button>
          <span className="text-[10px] text-gray-400">
            Updated {format(new Date(dataUpdatedAt), 'HH:mm:ss')}
          </span>
        </div>
      </CardHeader>
      <CardBody className="space-y-6">
        <div className="space-y-4 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-gray-500">Asset:</span>
            <div className="flex items-center">
              <Image src={USDC.img} alt={USDC.symbol} width={20} height={20} className="mr-2" />

              <span>USDC</span>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-gray-500">Total Deposits:</span>
            <span>
              {formatBalance(BigInt(vault.state.totalAssets), vault.asset.decimals)} USDC
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-gray-500">Current APY:</span>
            <span>{(vault.state.apy * 100).toFixed(2)}%</span>
          </div>
        </div>

        {markets && vault.state.allocation.length > 0 && (
          <div className="space-y-3">
            <h3 className="text-base font-medium">Current Allocations</h3>
            {vault.state.allocation.map((allocation: any) => {
              const market = markets.find((m) => m.uniqueKey === allocation.market.uniqueKey);
              if (!market || allocation.supplyAssets === 0) return null;

              return (
                <MarketInfoBlockCompact
                  key={allocation.market.uniqueKey}
                  market={market}
                  amount={BigInt(allocation.supplyAssets)}
                />
              );
            })}
          </div>
        )}
      </CardBody>

      <DepositModal 
        isOpen={isDepositModalOpen}
        onClose={() => setIsDepositModalOpen(false)}
        vaultAddress={vaultAddress}
      />
    </Card>
  );
}

function ActivityCard() {
  const [selectedType, setSelectedType] = useState('all');
  const [showChat, setShowChat] = useState(false);

  const activityTypes = {
    report: {
      label: 'Reports',
      description: 'Formal summaries of actions and market conditions',
      icon: TbReportAnalytics,
      bgColor: 'bg-blue-50/50 dark:bg-blue-950/30',
      borderColor: 'border-blue-100 dark:border-blue-900',
      iconColor: 'text-blue-600 dark:text-blue-400',
    },
    think: {
      label: 'Thought',
      description: 'See detailed about how the agent reasons behind each decision',
      icon: BiBrain,
      bgColor: 'bg-purple-50/50 dark:bg-purple-950/30',
      borderColor: 'border-purple-100 dark:border-purple-900',
      iconColor: 'text-purple-600 dark:text-purple-400',
    },
    action: {
      label: 'Actions',
      description: 'On-chain transactions and their status',
      icon: BiTransfer,
      bgColor: 'bg-green-50/50 dark:bg-green-950/30',
      borderColor: 'border-green-100 dark:border-green-900',
      iconColor: 'text-green-600 dark:text-green-400',
    },
  } as const;

  return (
    <Card className="bg-surface h-[600px] p-4">
      <CardHeader className="flex items-center justify-between">
        <span className="text-lg font-medium">
          {showChat ? 'Public Chat' : 'Agent Activity'}
        </span>
        <Tooltip content={showChat ? 'Show Activities' : 'Show Chat'}>
          <button
            onClick={() => setShowChat(!showChat)}
            className="rounded-full p-1.5 text-gray-400 transition-all hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-800"
          >
            {showChat ? <TbLogs className="h-5 w-5" /> : <BsChatDots className="h-5 w-5" />}
          </button>
        </Tooltip>
      </CardHeader>

      <CardBody className="pt-4">
        {showChat ? (
          <ChatSection />
        ) : (
          <div className="flex flex-col h-full">
            {/* Activity Type Selector */}
            <div className="flex justify-center gap-2 p-2 border-b mb-4">
              <button
                onClick={() => setSelectedType('all')}
                className={`px-2.5 py-1 rounded-lg transition-all text-xs
                  ${selectedType === 'all' 
                    ? 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300' 
                    : 'text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-900'
                  }`}
              >
                All
              </button>
              {Object.entries(activityTypes).map(([type, config]) => {
                const Icon = config.icon;
                const isSelected = selectedType === type;
                
                return (
                  <Tooltip 
                    key={type}
                    content={config.description}
                    delay={0}
                    closeDelay={0}
                  >
                    <button
                      onClick={() => setSelectedType(type)}
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
              })}
            </div>

            {/* Activity Feed with custom scrollbar */}
            <div className="flex-1 pr-2 overflow-y-auto custom-scrollbar">
              <ActivitiesSection selectedType={selectedType} />
            </div>
          </div>
        )}
      </CardBody>
    </Card>
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
        <h1 className="mb-10 text-2xl">Monarch Smart Vault</h1>
        
        <div className="grid grid-cols-12 gap-6">
          <div className="col-span-4">
            <VaultInfoCard vault={vault} />
          </div>
          <div className="col-span-8">
            <ActivityCard />
          </div>
        </div>
      </div>
    </>
  );
}

export default VaultContent;
