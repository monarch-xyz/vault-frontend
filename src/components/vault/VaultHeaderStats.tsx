import Image from 'next/image';
import { useState, useEffect } from 'react';
import { Modal, ModalContent, ModalHeader, ModalBody } from '@nextui-org/modal';
import { Tooltip } from '@nextui-org/tooltip';
import { BsQuestionCircle } from 'react-icons/bs';
import { IoMdRefresh } from 'react-icons/io';
import { RiRobot2Fill } from 'react-icons/ri';
import { Button } from '@/components/common/Button';
import { TooltipContent } from '@/components/TooltipContent';
import { useMarkets } from '@/contexts/MarketsContext';
import { useVault } from '@/hooks/useVault';
import { formatBalance, formatReadable } from '@/utils/balance';
import { AGENT_NAME } from '@/utils/constants';
import { VaultIntroShownKey } from '@/utils/storageKeys';
import { useTheme } from 'next-themes';
import { findToken } from '@/utils/tokens';
import { Market } from '@/utils/types';
import { DepositModal } from './DepositModal';

import PoweredByMorphoDark from '@/imgs/morpho/powered-by-morpho-dark.svg';
import PoweredByMorphoLight from '@/imgs/morpho/powered-by-morpho-light.svg';
import MorphoLogoLight from '@/imgs/morpho/morpho-logo-light.svg';
import MorphoLogoDark from '@/imgs/morpho/morpho-logo-dark.svg';

import MorphoToken from '@/imgs/tokens/morpho.svg';

const USDC = {
  symbol: 'USDC',
  img: require('../../../src/imgs/tokens/usdc.webp') as string,
  decimals: 6,
  address: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
};

// Either add this or use an existing one from your project
const BaseLogo = require('../../../src/imgs/chains/base.webp') as string; // You may need to add this file to your project

function AllocationDescription() {
  return (
    <div className="mb-6 rounded-lg bg-primary/5 p-4">
      <div className="mb-2 flex items-center gap-2 text-primary">
        <RiRobot2Fill className="h-4 w-4" />
        <span className="text-sm font-medium">{AGENT_NAME} - AI Allocator</span>
      </div>
      <p className="text-sm text-gray-600 dark:text-gray-400">
        {AGENT_NAME} manages your deposits by analyzing market conditions and automatically
        allocating funds to optimize returns while maintaining risk levels.
      </p>
    </div>
  );
}

function MarketAllocationRow({
  market,
  amount,
  totalAssets,
}: {
  market: Market;
  amount: bigint;
  totalAssets: bigint;
}) {
  const percentage = (Number(amount) / Number(totalAssets)) * 100;
  const token = findToken(market.collateralAsset.address, market.morphoBlue.chain.id);
  const totalSupplyAssets = BigInt(market.state.supplyAssets);
  const availableLiquidity = BigInt(market.state.liquidityAssets);

  const handleMarketClick = () => {
    window.open(`https://www.monarchlend.xyz/market/8453/${market.uniqueKey}`, '_blank');
  };

  return (
    <div
      className="bg-hovered cursor-pointer rounded-lg border border-divider p-4 transition-colors hover:bg-gray-100 dark:hover:bg-gray-800"
      onClick={handleMarketClick}
    >
      {/* Top section: Market info + APY */}
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          {token?.img && (
            <Image
              src={token.img}
              alt={market.collateralAsset.symbol}
              width={24}
              height={24}
              className="rounded-full"
            />
          )}
          <span className="text-sm font-medium">{market.collateralAsset.symbol}</span>
        </div>
        <div className="text-sm font-medium text-primary">
          {(market.state.supplyApy * 100).toFixed(1)}% APY
        </div>
      </div>

      {/* Middle section: Allocation + Progress bar */}
      <div className="mb-3 flex items-center gap-2">
        <div className="text-xs text-gray-500">
          {formatBalance(amount, 6)} USDC ({percentage.toFixed(1)}%)
        </div>
        <div className="h-1 flex-1 overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800">
          <div
            className="h-full rounded-full bg-primary transition-all"
            style={{ width: `${percentage}%` }}
          />
        </div>
      </div>

      {/* Bottom section: Market stats */}
      <div className="flex items-center justify-between text-xs text-gray-500">
        <div>Total Supply: {formatReadable(formatBalance(totalSupplyAssets, 6))} USDC</div>
        <div>Available: {formatReadable(formatBalance(availableLiquidity, 6))} USDC</div>
      </div>
    </div>
  );
}

// Add this style to your component to prevent layout shift
const preventLayoutShift = {
  paddingRight: 'var(--removed-body-scroll-bar-size, 0px)',
};

export function VaultHeaderStats({ vaultAddress }: { vaultAddress: string }) {
  const { resolvedTheme } = useTheme();
  const { markets } = useMarkets();
  const { data: vault, refetch, isRefetching } = useVault();
  const [isAllocationModalOpen, setIsAllocationModalOpen] = useState(false);
  const [isDepositModalOpen, setIsDepositModalOpen] = useState(false);
  const [isInfoModalOpen, setIsInfoModalOpen] = useState(false);

  const totalAssets = vault ? BigInt(vault.state.totalAssets) : BigInt(0);

  // Check if user has seen the intro before
  useEffect(() => {
    const hasSeenIntro = localStorage.getItem(VaultIntroShownKey) === 'true';
    if (!hasSeenIntro) {
      setIsInfoModalOpen(true);
    }
  }, []);

  // Handle closing the intro modal
  const handleCloseInfoModal = () => {
    setIsInfoModalOpen(false);
    localStorage.setItem(VaultIntroShownKey, 'true');
  };

  // Get tokens with allocations
  const tokensWithAllocations =
    markets &&
    vault?.state.allocation
      .reduce((acc: any[], allocation: any) => {
        const market = markets.find((m) => m.uniqueKey === allocation.market.uniqueKey);
        if (!market) return acc;

        const token = findToken(market.collateralAsset.address, market.morphoBlue.chain.id);
        if (!token) return acc;

        // Find existing token entry or create new one
        const existingToken = acc.find((t) =>
          token.networks.map((n) => n.address).includes(t.token.networks[0].address),
        );
        if (existingToken) {
          existingToken.allocation += Number(allocation.supplyAssets);
        } else {
          acc.push({
            token,
            allocation: Number(allocation.supplyAssets),
          });
        }
        return acc;
      }, [])
      .sort((a, b) => b.allocation - a.allocation); // Sort by allocation

  return (
    <>
      <div
        className="grid w-full grid-cols-1 gap-4 font-zen md:grid-cols-3 md:gap-6"
        style={preventLayoutShift}
      >
        {/* Box 1: Vault Info */}
        <div className="bg-surface rounded p-4 shadow-sm md:p-6">
          <div className="flex h-full flex-col">
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <h3 className="text-sm text-gray-500">M1 Smart Vault</h3>
                <button
                  onClick={() => setIsInfoModalOpen(true)}
                  className="cursor-pointer transition-colors hover:text-primary"
                >
                  <BsQuestionCircle className="h-3.5 w-3.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300" />
                </button>
              </div>

              <div className="flex gap-2 font-zen items-center text-xs text-secondary">
                Powered by 
                <Image
                  src={resolvedTheme === 'light' ? MorphoLogoLight : MorphoLogoDark}
                  alt="Morpho"
                  width={16}
                  height={16}
                />
                Morpho                
              </div>
            </div>
            <div className="flex flex-wrap gap-8">
              <div>
                <div className="text-xs text-gray-500">Current APY</div>
                <div className="flex items-center gap-1">
                  <Tooltip
                    className="rounded-sm"
                    content={
                      <TooltipContent
                        icon={<Image src={MorphoToken} alt="Morpho" width={16} height={16} />}
                        title="APY Breakdown"
                        detail={`Base APY: ${vault?.state.apy ? (vault.state.apy * 100).toFixed(2) : '0.00'}%${
                          vault?.state.netApy && vault.state.netApy > vault.state.apy
                            ? ` + Morpho Rewards: ${Math.max(
                                0,
                                (vault.state.netApy - vault.state.apy) * 100
                              ).toFixed(2)}%`
                            : ''
                        }`}
                      />
                    }
                  >
                    <div className="text-sm text-primary flex items-center gap-1 cursor-help">
                      {vault?.state.netApy ? (vault.state.netApy * 100).toFixed(2) : '0.00'}%
                    </div>
                  </Tooltip>
                </div>
              </div>
              <div>
                <div className="text-xs text-gray-500">Daily APY</div>
                <div className="flex items-center gap-1">
                  <Tooltip
                    className="rounded-sm"
                    content={
                      <TooltipContent
                        icon={<Image src={MorphoToken} alt="Morpho" width={16} height={16} />}
                        title="Daily APY Breakdown"
                        detail={`Base Daily APY: ${
                          vault?.state.dailyApy ? (vault.state.dailyApy * 100).toFixed(2) : '0.00'
                        }%${
                          vault?.state.dailyNetApy && vault.state.dailyNetApy > vault.state.dailyApy
                            ? ` + Morpho Rewards: ${Math.max(
                                0,
                                (vault.state.dailyNetApy - vault.state.dailyApy) * 100
                              ).toFixed(2)}%`
                            : ''
                        }`}
                      />
                    }
                  >
                    <div className="text-sm text-primary flex items-center gap-1 cursor-help">
                      {vault?.state.dailyNetApy ? (vault.state.dailyNetApy * 100).toFixed(2) : '0.00'}%
                    </div>
                  </Tooltip>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Box 2: Exposure */}
        <div className="bg-surface rounded p-4 shadow-sm md:p-6">
          <div className="flex h-full flex-col">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-sm text-gray-500">Market Exposure</h3>
              <Button variant="secondary" size="sm" onClick={() => setIsAllocationModalOpen(true)}>
                View Details
              </Button>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {tokensWithAllocations?.map(({ token, allocation }) => (
                <Tooltip key={token.address} content={token.symbol} placement="bottom">
                  <div className={`transition-opacity ${allocation === 0 ? 'opacity-50' : ''}`}>
                    <Image
                      src={token.img}
                      alt={token.symbol}
                      width={16}
                      height={16}
                      className="rounded-full"
                    />
                  </div>
                </Tooltip>
              ))}
            </div>
          </div>
        </div>

        {/* Box 3: TVL with Base Chain Logo */}
        <div className="bg-surface rounded p-4 shadow-sm md:p-6">
          <div className="flex h-full flex-col">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-sm text-gray-500">Total Value Locked</h3>
              <Button variant="cta" size="sm" onClick={() => setIsDepositModalOpen(true)}>
                Deposit
              </Button>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Image src={USDC.img} alt={USDC.symbol} width={20} height={20} />
                <span className="text-base md:text-lg">
                  {formatReadable(formatBalance(totalAssets, 6))} USDC
                </span>
              </div>
              <div className="flex items-center">
                <Tooltip content="Deployed on Base Chain">
                  <div className="flex items-center text-xs text-gray-500">
                    <span className="mr-1.5"> on</span>
                    <Image
                      src={BaseLogo}
                      alt="Base Chain"
                      width={18}
                      height={18}
                      className="rounded-full"
                    />
                  </div>
                </Tooltip>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modal - Updated with refresh */}
      <Modal
        isOpen={isAllocationModalOpen}
        onClose={() => setIsAllocationModalOpen(false)}
        classNames={{
          base: 'bg-surface rounded-lg font-zen',
          header: 'border-b border-divider',
          body: 'p-8',
          backdrop: 'backdrop-blur-sm',
        }}
        scrollBehavior="outside"
        size="xl"
      >
        <ModalContent>
          <ModalHeader className="p-6">
            <div className="flex w-full items-center justify-between">
              <div className="flex items-center gap-3">
                <h3 className="font-zen text-lg font-medium">Market Allocations</h3>
                <button
                  onClick={async () => refetch()}
                  className={`rounded-full p-1 text-gray-400 transition-all hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-800
                    ${isRefetching ? 'animate-spin' : ''}`}
                  disabled={isRefetching}
                  title="Refresh allocation data"
                >
                  <IoMdRefresh className="h-4 w-4" />
                </button>
              </div>
            </div>
          </ModalHeader>
          <ModalBody>
            <AllocationDescription />
            <div className="space-y-2">
              {markets &&
                vault?.state.allocation
                  .sort((a, b) => Number(b.supplyAssets) - Number(a.supplyAssets))
                  .map((allocation: any) => {
                    const market = markets.find((m) => m.uniqueKey === allocation.market.uniqueKey);
                    if (!market) return null;

                    return (
                      <MarketAllocationRow
                        key={allocation.market.uniqueKey}
                        market={market}
                        amount={BigInt(allocation.supplyAssets)}
                        totalAssets={totalAssets}
                      />
                    );
                  })}
            </div>
          </ModalBody>
        </ModalContent>
      </Modal>

      {/* M1 Info Modal with improved configuration and Morpho logo */}
      <Modal
        isOpen={isInfoModalOpen}
        onClose={handleCloseInfoModal}
        classNames={{
          base: 'bg-surface rounded-lg font-zen',
          header: 'border-b border-divider',
          body: 'p-8',
          backdrop: 'backdrop-blur-sm',
        }}
        scrollBehavior="outside"
        size="lg"
      >
        <ModalContent>
          <ModalHeader className="p-6">
            <div className="flex w-full items-center justify-between">
              <div className="flex items-center gap-3">
                <h3 className="font-zen text-lg font-medium">M1 Smart Vault</h3>
              </div>
            </div>
          </ModalHeader>
          <ModalBody>
            <div className="mb-6 rounded-lg bg-primary/5 p-4">
              <div className="mb-4 flex items-center gap-2">
                <RiRobot2Fill className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium text-primary">
                  {AGENT_NAME} - AI Allocator
                </span>
              </div>

              <p className="mb-4 text-sm text-gray-600 dark:text-gray-400">
                Monarch Vault is an AI-powered Morpho vault where the M1 agent manages funds by
                reallocating assets across a pre-approved set of markets to optimize returns.
              </p>
              <p className="mb-4 text-sm text-gray-600 dark:text-gray-400">
                The agent can only move assets between approved markets and cannot withdraw funds
                from the vault. This creates essential safety boundaries.
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                This interface provides full transparency into how the agent operates - you can view
                all market reallocations and live performance metrics.
              </p>
            </div>

            {/* Add the centered Morpho logo */}
            <div className="mb-6 flex justify-center">
              <Image
                src={resolvedTheme === 'light' ? PoweredByMorphoLight : PoweredByMorphoDark}
                alt="Powered by Morpho"
                height={30}
                width={150}
                className="object-contain"
              />
            </div>

            <div className="flex justify-end">
              <Button
                variant="secondary"
                size="sm"
                onClick={() =>
                  window.open(
                    `https://app.morpho.org/base/vault/${vaultAddress}/monarch-m1/`,
                    '_blank',
                  )
                }
                className="flex items-center gap-1"
              >
                View on Morpho
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  className="ml-1"
                >
                  <path
                    d="M10 6H6C4.89543 6 4 6.89543 4 8V18C4 19.1046 4.89543 20 6 20H16C17.1046 20 18 19.1046 18 18V14M14 4H20M20 4V10M20 4L10 14"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </Button>
            </div>
          </ModalBody>
        </ModalContent>
      </Modal>

      <DepositModal
        isOpen={isDepositModalOpen}
        onClose={() => setIsDepositModalOpen(false)}
        vaultAddress={vaultAddress}
      />
    </>
  );
}
