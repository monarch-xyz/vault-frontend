import { useState } from 'react';
import { Card, CardHeader, CardBody } from '@nextui-org/card';
import Image from 'next/image';
import { format } from 'date-fns';
import { IoMdRefresh } from 'react-icons/io';
import { BiChevronDown, BiChevronUp } from 'react-icons/bi';
import { Button } from '@/components/common/Button';
import { useVault } from '@/hooks/useVault';
import { useMarkets } from '@/contexts/MarketsContext';
import { formatBalance, formatReadable } from '@/utils/balance';
import { DepositModal } from './DepositModal';
import { findToken } from '@/utils/tokens';

const USDC = {
  symbol: 'USDC',
  img: require('../../../src/imgs/tokens/usdc.webp') as string,
  decimals: 6,
  address: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
};

export function VaultInfoCard({ vaultAddress }: { vaultAddress: string }) {
  const { markets } = useMarkets();
  const { dataUpdatedAt, refetch, isLoading, isRefetching, data: vault } = useVault(vaultAddress);
  const [isDepositModalOpen, setIsDepositModalOpen] = useState(false);
  const [showAllMarkets, setShowAllMarkets] = useState(false);

  const totalAssets = vault ? BigInt(vault.state.totalAssets) : BigInt(0);

  // Sort allocations by amount
  const sortedAllocations = (markets && vault) ? [...vault.state.allocation]
    .sort((a, b) => Number(b.supplyAssets) - Number(a.supplyAssets)) : [];

  const displayedAllocations = showAllMarkets 
    ? sortedAllocations 
    : sortedAllocations.slice(0, 4);

  return (
    <Card className="bg-surface h-full p-4">
      <CardHeader className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Image src={USDC.img} alt={USDC.symbol} width={24} height={24} />
          <span className="text-lg font-medium">USDC Vault</span>
        </div>
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
        </div>
      </CardHeader>

      <CardBody className="space-y-4">
        {/* Stats Row */}
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-lg bg-gray-50 px-3 py-2 dark:bg-gray-800">
            <div className="text-xs text-gray-500">TVL</div>
            <div className="text-base font-medium">
              {formatReadable(formatBalance(totalAssets, 6))} USDC
            </div>
          </div>
          <div className="rounded-lg bg-gray-50 px-3 py-2 dark:bg-gray-800">
            <div className="text-xs text-gray-500">Current APY</div>
            <div className="text-base font-medium text-primary">
              {vault?.state.apy ? (vault.state.apy * 100).toFixed(2) : '0.00'}%
            </div>
          </div>
        </div>

        {/* Market Allocations */}
        {markets && (
          <div>
            <div className="mb-2 flex items-center justify-between">
              <h3 className="text-sm font-medium text-gray-500">Market Allocations</h3>
              <span className="text-[10px] text-gray-400">
                Updated {format(new Date(dataUpdatedAt), 'HH:mm:ss')}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {displayedAllocations.map((allocation: any) => {
                const market = markets.find((m) => m.uniqueKey === allocation.market.uniqueKey);

                console.log('allocation + found market', allocation, market);
                if (!market) return null;
                
                const amount = BigInt(allocation.supplyAssets);
                const percentage = (Number(allocation.supplyAssets) / Number(totalAssets)) * 100;
                const token = findToken(market.collateralAsset.address, market.morphoBlue.chain.id);
                
                return (
                  <div 
                    key={allocation.market.uniqueKey}
                    className="flex items-center justify-between rounded-lg border border-gray-100 px-3 py-2 dark:border-gray-800"
                  >
                    <div className="flex items-center gap-2">
                      {token?.img ? (
                        <Image 
                          src={token.img} 
                          alt={market.collateralAsset.symbol} 
                          width={20} 
                          height={20} 
                          className="rounded-full"
                        />
                      ) : (
                        <div className="h-5 w-5 rounded-full bg-gray-200" />
                      )}
                      <div>
                        <div className="text-sm">{market.collateralAsset.symbol}</div>
                        <div className="text-xs text-gray-500">
                          {formatBalance(amount, 6)} USDC
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-gray-500">{percentage.toFixed(1)}%</div>
                      <div className="text-xs text-primary">
                        {(market.state.supplyApy * 100).toFixed(1)}% APY
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {sortedAllocations.length > 4 && (
              <button
                onClick={() => setShowAllMarkets(!showAllMarkets)}
                className="mt-2 flex w-full items-center justify-center gap-1 rounded-lg border border-gray-100 py-1 text-xs text-gray-500 transition-colors hover:bg-gray-50 dark:border-gray-800 dark:hover:bg-gray-800"
              >
                {showAllMarkets ? (
                  <>
                    Show Less <BiChevronUp className="h-4 w-4" />
                  </>
                ) : (
                  <>
                    Show All ({sortedAllocations.length}) <BiChevronDown className="h-4 w-4" />
                  </>
                )}
              </button>
            )}
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