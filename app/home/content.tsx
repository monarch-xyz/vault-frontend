'use client';

import { Card, CardHeader, CardBody } from '@nextui-org/card';
import Image from 'next/image';
import { MarketInfoBlockCompact } from '@/components/common/MarketInfoBlock';
import { Spinner } from '@/components/common/Spinner';
import Header from '@/components/layout/header/Header';
import { useMarkets } from '@/contexts/MarketsContext';
import { useVault } from '@/hooks/useVault';
import { formatBalance } from '@/utils/balance';
import { findToken } from '@/utils/tokens';
import { useUserBalances } from '@/hooks/useUserBalances';
import Input from '@/components/Input/Input';
import { Button } from '@/components/common/Button';
import { useState } from 'react';
import { useDepositVault } from '@/hooks/useDepositVault';
import { useLogStream, LogEntry } from '@/hooks/useLogStream';
import { format } from 'date-fns';
import { BiBrain } from 'react-icons/bi';
import { BsChatDots } from 'react-icons/bs';
import { AiOutlineDatabase } from 'react-icons/ai';
import { Tooltip } from '@nextui-org/tooltip';
import { Badge } from '@/components/common/Badge';
import { FaRobot } from 'react-icons/fa';

const USDC = {
  symbol: 'USDC',
  img: require('../../src/imgs/tokens/usdc.webp') as string,
  decimals: 6,
  address: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913'
};

const vaultAddress = '0x346aac1e83239db6a6cb760e95e13258ad3d1a6d';

function VaultInfoCard({ vault, vaultToken }: { vault: any; vaultToken: any }) {
  const { markets } = useMarkets();

  return (
    <Card className="bg-surface h-[600px] p-4">
      <CardHeader className="text-lg">Vault Overview</CardHeader>
      <CardBody className="space-y-6">
        <div className="space-y-4 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-gray-500">Asset:</span>
            <div className="flex items-center">
              {vaultToken?.img && (
                <Image
                  src={vaultToken.img}
                  alt={vaultToken.symbol}
                  width={20}
                  height={20}
                  className="mr-2"
                />
              )}
              <span>{vaultToken?.symbol}</span>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-gray-500">Total Deposits:</span>
            <span>
              {formatBalance(BigInt(vault.state.totalAssets), vault.asset.decimals)} {vaultToken?.symbol}
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

const categoryConfig = {
  conversation: {
    icon: BsChatDots,
    label: 'Chat',
    description: 'Agent\'s responses',
    bgColor: 'bg-green-50/50 dark:bg-green-950/30',
    borderColor: 'border-green-100 dark:border-green-900',
    iconColor: 'text-green-600 dark:text-green-400',
  },
  think: {
    icon: BiBrain,
    label: 'Thinking',
    description: 'Agent\'s thought process',
    bgColor: 'bg-purple-50/50 dark:bg-purple-950/30',
    borderColor: 'border-purple-100 dark:border-purple-900',
    iconColor: 'text-purple-600 dark:text-purple-400',
  },
  memory: {
    icon: AiOutlineDatabase,
    label: 'Memory',
    description: 'Knowledge base',
    bgColor: 'bg-blue-50/50 dark:bg-blue-950/30',
    borderColor: 'border-blue-100 dark:border-blue-900',
    iconColor: 'text-blue-600 dark:text-blue-400',
  },
} as const;

type MessageDetails = {
  from: 'admin' | 'agent' | 'user';
  text: string;
};

function ChatMessage({ 
  log,
  isLast 
}: { 
  log: LogEntry;
  isLast: boolean;
}) {
  const details = log.details as unknown as MessageDetails;
  const isAgent = details.from === 'agent';
  const isAdmin = details.from === 'admin';

  return (
    <div className={`flex flex-col ${isAgent ? 'items-end' : 'items-start'} ${!isLast ? 'mb-3' : ''}`}>
      <div className="relative max-w-[85%]">
        {/* Admin Badge */}
        {isAdmin && (
          <div className="absolute -top-2 right-0 z-10">
            <Badge
              variant="success"
              size="sm"
            >
              ADMIN
            </Badge>
          </div>
        )}

        {/* Agent Badge */}
        {isAgent && (
          <div className="absolute -top-2 right-0 z-10">
            <Badge
              variant="default"
              size="sm"
              className="bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400"
            >
              <FaRobot className="h-3 w-3" />
            </Badge>
          </div>
        )}

        {/* Message Bubble */}
        <div
          className={`rounded-lg border p-3 
            ${isAgent 
              ? 'border-green-200 bg-green-50/50 dark:border-green-800 dark:bg-green-950/30' 
              : 'border-gray-200 text-secondary dark:border-gray-700'
            }`}
        >
          <div className="space-y-1">
            <p className="text-sm whitespace-pre-wrap">{details.text}</p>
            <div className="flex items-center justify-between gap-2">
              <span className="text-[10px] text-gray-500">
                {format(new Date(log.timestamp), 'HH:mm:ss')}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ActivityFeed() {
  const { logs, isConnected, error } = useLogStream();
  const [selectedCategory, setSelectedCategory] = useState<keyof typeof categoryConfig>('conversation');

  const categories = ['conversation', 'think', 'memory'] as const;

  return (
    <Card className="bg-surface h-[600px] p-4">
      <CardHeader className="flex flex-col gap-2 pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex gap-2">
              {categories.map((category) => {
                const config = categoryConfig[category];
                const Icon = config.icon;
                const isSelected = selectedCategory === category;
                return (
                  <button
                    key={category}
                    onClick={() => setSelectedCategory(category)}
                    className={`flex items-center gap-1 rounded-lg px-3 py-2 text-sm transition-all
                      ${isSelected 
                        ? `${config.bgColor} ${config.iconColor}` 
                        : 'text-secondary hover:bg-gray-100 dark:hover:bg-gray-800'
                      }`}
                    title={config.description}
                  >
                    <Icon className="h-4 w-4" />
                    <span className="hidden sm:inline ml-1">{config.label}</span>
                  </button>
                );
              })}
            </div>
            <div className="flex items-center gap-2">
              <div
                className={`h-2 w-2 rounded-full ${
                  isConnected ? 'bg-green-500' : 'bg-red-500'
                }`}
              />
              <span className="text-xs text-gray-500">
                {isConnected ? 'Connected' : 'Disconnected'}
              </span>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardBody className="p-0">
        {error ? (
          <div className="p-4 text-sm text-red-500">{error}</div>
        ) : (
          <div className="h-full px-4">
            <CategorySection
              key={selectedCategory}
              category={selectedCategory}
              logs={logs}
              isExpanded={true}
              onToggle={() => {}} // No longer needed
            />
          </div>
        )}
      </CardBody>
    </Card>
  );
}

function CategorySection({ 
  category,
  logs,
  isExpanded,
}: { 
  category: keyof typeof categoryConfig;
  logs: LogEntry[];
  isExpanded: boolean;
  onToggle?: () => void;
}) {
  const config = categoryConfig[category];
  const filteredLogs = logs.filter(log => log.category === category);

  return (
    <div 
      className={`h-full rounded-lg border transition-all duration-300 ${config.bgColor} ${config.borderColor}`}
    >
      <div className="custom-scrollbar h-full overflow-y-auto p-3">
        {filteredLogs.length === 0 ? (
          <div className="text-center text-sm text-gray-500">
            No {config.label.toLowerCase()} activities yet
          </div>
        ) : (
          <div className="space-y-2">
            {category === 'conversation' ? (
              // Chat-style layout for conversation
              <div className="flex flex-col justify-end h-full">
                <div className="space-y-2">
                  {filteredLogs
                    .map((log, index, array) => (
                      <ChatMessage 
                        key={log.timestamp + index} 
                        log={log}
                        isLast={index === array.length - 1}
                      />
                    ))}
                </div>
              </div>
            ) : (
              // Regular layout for other categories
              filteredLogs
                .slice()
                .reverse()
                .map((log, index) => (
                  <div 
                    key={log.timestamp + index}
                    className="rounded border border-white/50 bg-white/25 p-2 dark:border-black/10 dark:bg-black/10"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-500">
                        {format(new Date(log.timestamp), 'HH:mm:ss')}
                      </span>
                    </div>
                    <div className="mt-0.5">
                      <span className="text-xs font-medium">{log.topic}</span>
                      <p className="text-xs text-gray-600 dark:text-gray-400 whitespace-pre-wrap">
                        {(() => {
                          try {
                            const parsed = JSON.parse(log.details);
                            return typeof parsed === 'object' ? JSON.stringify(parsed, null, 2) : parsed;
                          } catch (e) {
                            return log.details;
                          }
                        })()}
                      </p>
                    </div>
                  </div>
                ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function DepositCard() {
  const { balances } = useUserBalances();
  const usdcBalance = BigInt(
    balances.find((b) => b.address.toLowerCase() === USDC.address.toLowerCase())?.balance || 0n
  );

  const [depositAmount, setDepositAmount] = useState<bigint>(0n);
  const [message, setMessage] = useState<string>('');
  const [inputError, setInputError] = useState<string | null>(null);

  const { deposit, isDepositing } = useDepositVault(
    USDC.address as `0x${string}`,
    vaultAddress as `0x${string}`,
    depositAmount,
    message
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

  const vaultToken = findToken(vault.asset.id, 8453);

  return (
    <>
      <Header />
      <div className="container mx-auto px-6 py-8 font-zen">
        <h1 className="mb-12 text-center text-2xl">WoWo Vault</h1>

        <div className="grid grid-cols-12 gap-6">
          {/* Left Column - Vault Info */}
          <div className="col-span-3">
            <VaultInfoCard vault={vault} vaultToken={vaultToken} />
          </div>

          {/* Middle Column - Activity Feed */}
          <div className="col-span-6">
            <ActivityFeed />
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
