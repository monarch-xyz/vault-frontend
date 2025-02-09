'use client';

import { useState } from 'react';
import { Card, CardHeader, CardBody } from '@nextui-org/card';
import { Tooltip } from '@nextui-org/tooltip';
import { format } from 'date-fns';
import Image from 'next/image';
import { AiOutlineDatabase } from 'react-icons/ai';
import { BiBrain } from 'react-icons/bi';
import { BsChatDots } from 'react-icons/bs';
import { FaRobot } from 'react-icons/fa';
import { Hex } from 'viem';
import { Badge } from '@/components/common/Badge';
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
import { TooltipContent } from '@/components/TooltipContent';
import { IoMdRefresh } from 'react-icons/io';

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

const categoryConfig = {
  conversation: {
    icon: BsChatDots,
    label: 'Chat',
    summary: 'Public chat',
    description:
      'Public chat to engage with Wowo, shared with public, with access to admin messages with Wowo!',
    emptyMessage: 'Deposit to attach a message to Wowo!',
    bgColor: 'bg-green-50/50 dark:bg-green-950/30',
    borderColor: 'border-green-100 dark:border-green-900',
    iconColor: 'text-green-600 dark:text-green-400',
  },
  think: {
    icon: BiBrain,
    label: 'Thinking',
    summary: 'Real-time thoughts',
    description:
      'See what Wowo is thinking behind the scene, including market analysis and decision-making process',
    emptyMessage: 'Wowo is waiting for activities to analyze...',
    bgColor: 'bg-purple-50/50 dark:bg-purple-950/30',
    borderColor: 'border-purple-100 dark:border-purple-900',
    iconColor: 'text-purple-600 dark:text-purple-400',
  },
  memory: {
    icon: AiOutlineDatabase,
    label: 'Memory',
    summary: 'Knowledge base',
    description: 'See what Wowo has learned about the market, users, and historical patterns',
    emptyMessage: 'Wowo is waiting for admin command or activities to memorize...',
    bgColor: 'bg-blue-50/50 dark:bg-blue-950/30',
    borderColor: 'border-blue-100 dark:border-blue-900',
    iconColor: 'text-blue-600 dark:text-blue-400',
  },
} as const;

type MessageDetails = {
  from: 'admin' | 'agent' | 'user';
  text: string;
  tx?: Hex;
  sender?: string;
};

type ThinkingDetails = {
  type: string;
  thought: string;
  data: Record<string, string>;
};

type MemoryDetails = {
  type: string;
  summary: string;
};

function ChatMessage({ log, isLast }: { log: LogEntry; isLast: boolean }) {
  const details = log.details as unknown as MessageDetails;
  const isAgent = details.from === 'agent';
  const isAdmin = details.from === 'admin';

  return (
    <div className="rounded-lg border border-green-200 bg-green-50/30 p-3 dark:border-green-800/50 dark:bg-green-900/10">
      <div className="mb-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          {isAgent ? (
            <Badge
              variant="default"
              size="sm"
              className="bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400"
            >
              <div className="flex items-center gap-1">
                <FaRobot className="h-3 w-3" />
                <span className="text-[10px]">Wowo</span>
              </div>
            </Badge>
          ) : isAdmin ? (
            <Badge variant="success" size="sm">
              ADMIN
            </Badge>
          ) : (
            <Badge
              variant="default"
              size="sm"
              className="bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400"
            >
              USER
            </Badge>
          )}
        </div>
        <span className="text-[10px] text-gray-500">
          {format(new Date(log.timestamp), 'HH:mm:ss')}
        </span>
      </div>

      <p className="whitespace-pre-wrap text-sm text-green-800 dark:text-green-200">
        {details.text}
      </p>
    </div>
  );
}

function ThinkingMessage({ log }: { log: LogEntry }) {
  let details: ThinkingDetails;
  if (typeof log.details === 'string') {
    details = JSON.parse(log.details) as ThinkingDetails;
  } else {
    details = log.details as ThinkingDetails;
  }

  return (
    <div className="rounded-lg border border-purple-200 bg-purple-50/30 p-3 dark:border-purple-800/50 dark:bg-purple-900/10">
      {/* Thinking Type Badge */}
      <div className="mb-2 flex items-center gap-2">
        <Badge
          variant="default"
          size="sm"
          className="bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-300"
        >
          {details.type}
        </Badge>
        <span className="text-[10px] text-gray-500">
          {format(new Date(log.timestamp), 'HH:mm:ss')}
        </span>
      </div>

      {/* Main Thought */}
      <div className="mb-3">
        <p className="text-sm text-purple-800 dark:text-purple-200">{details.thought}</p>
      </div>
    </div>
  );
}

function MemoryMessage({ log }: { log: LogEntry }) {
  let details: MemoryDetails;
  if (typeof log.details === 'string') {
    details = JSON.parse(log.details) as MemoryDetails;
  } else {
    details = log.details as MemoryDetails;
  }

  return (
    <div className="rounded-lg border border-blue-200 bg-blue-50/30 p-3 dark:border-blue-800/50 dark:bg-blue-900/10">
      <div className="mb-2 flex items-center justify-between">
        <Badge
          variant="default"
          size="sm"
          className="bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300"
        >
          {details.type}
        </Badge>
        <span className="text-[10px] text-gray-500">
          {format(new Date(log.timestamp), 'HH:mm:ss')}
        </span>
      </div>

      <p className="text-sm text-blue-800 dark:text-blue-200">{details.summary}</p>
    </div>
  );
}

function ActivityFeed() {
  const { logs, isConnected, error, reconnect } = useLogStream();
  const [selectedCategory, setSelectedCategory] =
    useState<keyof typeof categoryConfig>('conversation');

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
                      ${
                        isSelected
                          ? `${config.bgColor} ${config.iconColor}`
                          : 'text-secondary hover:bg-gray-100 dark:hover:bg-gray-800'
                      }`}
                    title={config.description}
                  >
                    <Icon className="h-4 w-4" />
                    <span className="ml-1 hidden sm:inline">{config.label}</span>
                  </button>
                );
              })}
            </div>
            <div className="flex items-center gap-2">
              <div
                className={`h-2 w-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}
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
          </div>
        </div>
      </CardHeader>

      <CardBody className="custom-scrollbar overflow-y-auto p-0 pr-[22px]">
        {error ? (
          <div className="p-4 text-sm text-red-500">{error}</div>
        ) : (
          <div className="h-full px-4">
            <CategorySection
              key={selectedCategory}
              category={selectedCategory}
              logs={logs}
              isExpanded
              onToggle={() => {}}
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
  const filteredLogs = logs.filter((log) => log.category === category);

  return (
    <div
      className={`h-full rounded-lg border transition-all duration-300 ${config.bgColor} ${config.borderColor}`}
    >
      <Tooltip
        content={
          <TooltipContent
            title={config.label}
            detail={config.description}
            icon={<config.icon className={`h-8 w-8 ${config.iconColor} opacity-40`} />}
          />
        }
        placement="bottom"
        delay={0}
        closeDelay={0}
      >
        <div className="border-b px-3 py-2 text-secondary">
          <span className="text-xs">{config.summary}</span>
        </div>
      </Tooltip>

      <div className="h-[calc(100%-36px)] overflow-hidden">
        <div className="custom-scrollbar h-full overflow-y-auto pr-[22px]">
          <div className="px-3">
            <div className="py-3">
              {filteredLogs.length === 0 ? (
                <div className="flex h-full flex-col items-center justify-center space-y-2 text-center">
                  <config.icon className={`h-8 w-8 ${config.iconColor} opacity-40`} />
                  <div className="text-sm text-gray-500">{config.emptyMessage}</div>
                </div>
              ) : (
                <div className="space-y-3">
                  {category === 'conversation'
                    ? // Chat-style layout for conversation
                      filteredLogs
                        .slice()
                        .reverse()
                        .map((log, index, array) => (
                          <ChatMessage
                            key={log.timestamp + index}
                            log={log}
                            isLast={index === array.length - 1}
                          />
                        ))
                    : category === 'think'
                    ? // Thinking layout
                      filteredLogs
                        .slice()
                        .reverse()
                        .map((log, index) => (
                          <ThinkingMessage key={log.timestamp + index} log={log} />
                        ))
                    : // Memory layout
                      filteredLogs
                        .slice()
                        .reverse()
                        .map((log, index) => (
                          <MemoryMessage key={log.timestamp + index} log={log} />
                        ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
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
        <h1 className="mb-12 text-center text-2xl">Wowo Smart Vault</h1>

        <div className="grid grid-cols-12 gap-6">
          {/* Left Column - Vault Info */}
          <div className="col-span-3">
            <VaultInfoCard vault={vault} />
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
