'use client';

import { useState } from 'react';
import { Card, CardHeader, CardBody } from '@nextui-org/card';
import { Tooltip } from '@nextui-org/tooltip';
import { format } from 'date-fns';
import Image from 'next/image';
import { BiBrain, BiTransfer, BiInfoCircle } from 'react-icons/bi';
import { Button } from '@/components/common/Button';
import { MarketInfoBlockCompact } from '@/components/common/MarketInfoBlock';
import { Spinner } from '@/components/common/Spinner';
import Header from '@/components/layout/header/Header';
import { useMarkets } from '@/contexts/MarketsContext';
import { useVault } from '@/hooks/useVault';
import { formatBalance } from '@/utils/balance';
import { useUserBalances } from '@/hooks/useUserBalances';
import Input from '@/components/Input/Input';
import { useDepositVault } from '@/hooks/useDepositVault';
import { useLogStream, LogEntry } from '@/hooks/useLogStream';
import { IoMdRefresh } from 'react-icons/io';
import { ChatSection } from '@/components/vault/ChatSection';
import { RiSwitchLine } from 'react-icons/ri';
import { ActivitiesSection } from '@/components/vault/ActivitiesSection';
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

  return (
    <Card className="bg-surface h-[600px] p-4">
      <CardHeader className="flex items-center justify-between">
        <span className="text-base font-medium">Vault Overview</span>
        <div className="flex items-center gap-2">
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
          <div className="flex items-center justify-between">
            <span className="text-gray-500">All-time APY:</span>
            <span>{(vault.state.allTimeApy * 100).toFixed(2)}%</span>
          </div>
        </div>

        {markets && vault.state.allocation.length > 0 && (
          <div className="space-y-3">
            <h3 className="text-sm font-medium">Current Allocations</h3>
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
    </Card>
  );
}

function ActivityCard() {
  const { isConnected, reconnect } = useLogStream();
  const [selectedType, setSelectedType] = useState('all');
  const [showChat, setShowChat] = useState(false);

  const activityTypes = {
    action: {
      label: 'Actions',
      description: 'On-chain transactions and their status',
      icon: BiTransfer,
      bgColor: 'bg-green-50/50 dark:bg-green-950/30',
      borderColor: 'border-green-100 dark:border-green-900',
      iconColor: 'text-green-600 dark:text-green-400',
    },
    think: {
      label: 'Thought',
      description: 'See detailed about how the agent reasons behind each decision',
      icon: BiBrain,
      bgColor: 'bg-purple-50/50 dark:bg-purple-950/30',
      borderColor: 'border-purple-100 dark:border-purple-900',
      iconColor: 'text-purple-600 dark:text-purple-400',
    },
    report: {
      label: 'Reports',
      description: 'Formal summaries of actions and market conditions',
      icon: BiInfoCircle,
      bgColor: 'bg-blue-50/50 dark:bg-blue-950/30',
      borderColor: 'border-blue-100 dark:border-blue-900',
      iconColor: 'text-blue-600 dark:text-blue-400',
    },
  } as const;

  return (
    <Card className="bg-surface h-[600px] p-4">
      <CardHeader className="flex items-center justify-between">
        <span className="text-base font-medium">
          {showChat ? 'Public Chat' : 'Agent Activity'}
        </span>
        <div className="flex items-center gap-4">
          {/* Connection Status */}
          <div className="flex items-center gap-2">
            <div
              className={`h-2 w-2 rounded-full ${
                isConnected ? 'bg-green-500' : 'bg-red-500'
              }`}
            />
            <span className="text-xs text-gray-500">
              {isConnected ? 'Connected' : 'Disconnected'}
            </span>
            {!isConnected && (
              <button
                onClick={reconnect}
                className="ml-2 rounded-lg bg-primary/10 px-2 py-1 text-xs text-primary transition-colors hover:bg-primary/20"
              >
                Reconnect
              </button>
            )}
          </div>

          {/* Switch Button */}
          <Tooltip content={showChat ? 'Show Activities' : 'Show Chat'}>
            <button
              onClick={() => setShowChat(!showChat)}
              className="rounded-full p-1.5 text-gray-400 transition-all hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-800"
            >
              <RiSwitchLine className="h-5 w-5" />
            </button>
          </Tooltip>
        </div>
      </CardHeader>

      <CardBody className="pt-4">
        {showChat ? (
          <ChatSection />
        ) : (
          <div className="flex flex-col h-full">
            {/* Activity Type Selector */}
            <div className="flex gap-2 p-2 border-b mb-4">
              <button
                onClick={() => setSelectedType('all')}
                className={`px-3 py-1.5 rounded-lg transition-all text-sm
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
                        flex items-center gap-2 px-3 py-1.5 rounded-lg transition-all
                        ${isSelected 
                          ? `${config.bgColor} ${config.iconColor}` 
                          : 'text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-900'
                        }
                      `}
                    >
                      <Icon className="w-4 h-4" />
                      <span className="text-sm">{config.label}</span>
                    </button>
                  </Tooltip>
                );
              })}
            </div>

            {/* Activity Feed */}
            <div className="flex-1 overflow-y-auto space-y-4">
              <ActivitiesSection selectedType={selectedType} />
            </div>
          </div>
        )}
      </CardBody>
    </Card>
  );
}

function DepositCard() {
  const { balances } = useUserBalances();
  const usdcBalance = BigInt(
    balances.find((b) => b.address.toLowerCase() === USDC.address.toLowerCase())?.balance || 0n,
  );

  const [depositAmount, setDepositAmount] = useState<bigint>(0n);
  const [message, setMessage] = useState<string>('');
  const [inputError, setInputError] = useState<string | null>(null);

  const { deposit, isDepositing } = useDepositVault(
    USDC.address as `0x${string}`,
    vaultAddress as `0x${string}`,
    depositAmount,
    message,
  );

  return (
    <Card className="bg-surface h-[600px] p-4">
      <CardHeader className="text-lg">Deposit</CardHeader>
      <CardBody>
        <div className="space-y-6">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-500">Balance:</span>
            <span>
              {usdcBalance ? formatBalance(usdcBalance, USDC.decimals) : '0'} {USDC.symbol}
            </span>
          </div>

          <div className="space-y-2">
            <label className="text-sm text-gray-500">Amount</label>
            <Input
              decimals={USDC.decimals}
              max={usdcBalance || 0n}
              setValue={setDepositAmount}
              setError={setInputError}
              exceedMaxErrMessage="Insufficient Balance"
            />
            {inputError && <p className="text-xs text-red-500">{inputError}</p>}
          </div>

          <div className="space-y-2">
            <label className="text-sm text-gray-500">Message (optional)</label>
            <input
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Enter a message"
              className="bg-hovered h-10 w-full rounded p-2 text-sm focus:border-primary focus:outline-none"
            />
          </div>

          <Button
            variant="cta"
            className="w-full"
            disabled={isDepositing || depositAmount === 0n || !!inputError}
            onClick={deposit}
          >
            {isDepositing ? 'Depositing...' : 'Deposit'}
          </Button>
        </div>
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
        <h1 className="mb-12 text-center text-2xl">M1 Smart Vault</h1>

        <div className="grid grid-cols-12 gap-6">
          {/* Left Column - Vault Info */}
          <div className="col-span-3">
            <VaultInfoCard vault={vault} />
          </div>

          {/* Middle Column - Activity/Chat Card */}
          <div className="col-span-6">
            <ActivityCard />
          </div>

          {/* Right Column - Deposit Box */}
          <div className="col-span-3">
            <DepositCard />
          </div>
        </div>
      </div>
    </>
  );
}

export default VaultContent;
