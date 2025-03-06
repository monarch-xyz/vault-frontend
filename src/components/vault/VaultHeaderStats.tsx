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
import { DepositModal } from './DepositModal';
import { useVaultPosition } from '@/hooks/useVaultPosition';
import { useAccount } from 'wagmi';
import { MarketAllocationModal } from './MarketAllocationModal';
import { WithdrawModal } from './WithdrawModal';

import PoweredByMorphoDark from '@/imgs/morpho/powered-by-morpho-dark.svg';
import PoweredByMorphoLight from '@/imgs/morpho/powered-by-morpho-light.svg';
import MorphoLogoLight from '@/imgs/morpho/morpho-logo-light.svg';
import MorphoLogoDark from '@/imgs/morpho/morpho-logo-dark.svg';

import MorphoToken from '@/imgs/tokens/morpho.svg';

import { USDC } from '@/utils/tokens';

export function VaultHeaderStats({ vaultAddress }: { vaultAddress: string }) {
  const { resolvedTheme } = useTheme();
  const { markets } = useMarkets();
  const { data: vault, refetch, isRefetching } = useVault();
  const { data: position } = useVaultPosition(vaultAddress);
  const { isConnected } = useAccount();
  const [isAllocationModalOpen, setIsAllocationModalOpen] = useState(false);
  const [isDepositModalOpen, setIsDepositModalOpen] = useState(false);
  const [isWithdrawModalOpen, setIsWithdrawModalOpen] = useState(false);
  const [isInfoModalOpen, setIsInfoModalOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  // This effect runs only on the client side after hydration
  useEffect(() => {
    setMounted(true);
  }, []);

  // Determine the actual theme to use for images
  const currentTheme = mounted ? resolvedTheme : 'light'; // Default to light if not mounted yet

  const totalAssets = vault ? BigInt(vault.state.totalAssets) : BigInt(0);

  // Format the user's assets for display if they exist
  const userAssetsFormatted = position?.assets
    ? formatReadable(formatBalance(BigInt(position.assets), 6))
    : '0';

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
      <div className="grid w-full grid-cols-1 gap-4 font-zen md:grid-cols-3 md:gap-6">
        {/* Box 1: Vault Info with TVL and APY */}
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

              <div className="flex items-center gap-2 font-zen text-xs text-secondary">
                Powered by
                <Image
                  src={currentTheme === 'light' ? MorphoLogoLight : MorphoLogoDark}
                  alt="Morpho"
                  width={16}
                  height={16}
                />
                Morpho
              </div>
            </div>

            {/* APY and TVL Section */}
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
                        detail={`Base APY: ${
                          vault?.state.apy ? (vault.state.apy * 100).toFixed(2) : '0.00'
                        }%${
                          vault?.state.netApy && vault.state.netApy > vault.state.apy
                            ? ` + Morpho Rewards: ${Math.max(
                                0,
                                (vault.state.netApy - vault.state.apy) * 100,
                              ).toFixed(2)}%`
                            : ''
                        }`}
                      />
                    }
                  >
                    <div className="flex cursor-help items-center gap-1 text-sm text-primary">
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
                                (vault.state.dailyNetApy - vault.state.dailyApy) * 100,
                              ).toFixed(2)}%`
                            : ''
                        }`}
                      />
                    }
                  >
                    <div className="flex cursor-help items-center gap-1 text-sm text-primary">
                      {vault?.state.dailyNetApy
                        ? (vault.state.dailyNetApy * 100).toFixed(2)
                        : '0.00'}
                      %
                    </div>
                  </Tooltip>
                </div>
              </div>
              <div>
                <div className="text-xs text-gray-500">TVL</div>
                <Tooltip
                  className="rounded-sm"
                  content={
                    <TooltipContent
                      icon={<Image src={USDC.img} alt={USDC.symbol} width={16} height={16} />}
                      title="Total Value Locked"
                      detail={`${formatBalance(totalAssets, 6)} USDC`}
                    />
                  }
                >
                  <div className="flex cursor-help items-center gap-1">
                    <Image src={USDC.img} alt={USDC.symbol} width={16} height={16} />
                    <div className="text-sm">
                      {formatReadable(formatBalance(totalAssets, 6))} USDC
                    </div>
                  </div>
                </Tooltip>
              </div>
            </div>
          </div>
        </div>

        {/* Box 2: Exposure */}
        <div className="bg-surface rounded p-4 shadow-sm md:p-6">
          <div className="flex h-full flex-col">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-sm text-gray-500">Collateral Exposure</h3>
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

        {/* Box 3: My Position */}
        <div className="bg-surface rounded p-4 shadow-sm md:p-6">
          <div className="flex h-full flex-col">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-sm text-gray-500">My Position</h3>
              <div className="flex gap-2">
                {position?.assets && BigInt(position.assets) > 0n && (
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => setIsWithdrawModalOpen(true)}
                  >
                    Withdraw
                  </Button>
                )}
                <Button variant="cta" size="sm" onClick={() => setIsDepositModalOpen(true)}>
                  Deposit
                </Button>
              </div>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {isConnected ? (
                <div className="w-full">
                  <div className="flex items-center gap-1">
                    <Image src={USDC.img} alt={USDC.symbol} width={16} height={16} />
                    <div className="text-base">{userAssetsFormatted} USDC</div>
                  </div>
                </div>
              ) : (
                <div className="text-sm text-gray-500">Connect wallet to view your position</div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Replace the old modal code with the new component */}
      <MarketAllocationModal
        isOpen={isAllocationModalOpen}
        onClose={() => setIsAllocationModalOpen(false)}
        markets={markets}
        vault={vault}
        totalAssets={totalAssets}
        refetch={refetch}
        isRefetching={isRefetching}
      />

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
                reallocating assets across a pre-approved set of Morpho lending markets to optimize
                returns.
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
                src={currentTheme === 'light' ? PoweredByMorphoLight : PoweredByMorphoDark}
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

      <WithdrawModal
        isOpen={isWithdrawModalOpen}
        onClose={() => setIsWithdrawModalOpen(false)}
        vaultAddress={vaultAddress}
      />
    </>
  );
}
