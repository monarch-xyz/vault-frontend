'use client';

import { Card, CardHeader, CardBody } from '@nextui-org/card';
import Image from 'next/image';
import { formatUnits } from 'viem';
import { Spinner } from '@/components/common/Spinner';
import Header from '@/components/layout/header/Header';
import { useVault } from '@/hooks/useVault';
import { useMarkets } from '@/contexts/MarketsContext';
import { MarketInfoBlockCompact } from '@/components/common/MarketInfoBlock';
import { formatBalance } from '@/utils/balance';
import { findToken } from '@/utils/tokens';

function VaultContent() {
  const { markets } = useMarkets();
  const {
    data: vault,
    isLoading: isVaultLoading,
    error: vaultError,
  } = useVault();

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
        <h1 className="mb-12 text-center text-2xl">Monarch Vault</h1>

        <div className="grid grid-cols-12 gap-6">
          {/* Left Column - Activity Feed */}
          <div className="col-span-3">
            <Card className="bg-surface h-[600px] p-4">
              <CardHeader className="text-lg">Activity Feed</CardHeader>
              <CardBody>
                <div className="text-sm text-gray-500">
                  Activity feed coming soon...
                </div>
              </CardBody>
            </Card>
          </div>

          {/* Middle Column - Vault Info */}
          <div className="col-span-6">
            <Card className="bg-surface mb-6 p-6">
              <CardHeader className="text-lg">Vault Overview</CardHeader>
              <CardBody>
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
                      {formatBalance(BigInt(vault.state.totalAssets), vault.asset.decimals)}{' '}
                      {vaultToken?.symbol}
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
              </CardBody>
            </Card>

            {markets && vault.state.allocation.length > 0 && (
              <Card className="bg-surface p-6">
                <CardHeader className="text-lg">Market Allocations</CardHeader>
                <CardBody>
                  <div className="space-y-3">
                    {vault.state.allocation.map((allocation) => {
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
                </CardBody>
              </Card>
            )}
          </div>

          {/* Right Column - Deposit Box */}
          <div className="col-span-3">
            <Card className="bg-surface h-[600px] p-4">
              <CardHeader className="text-lg">Deposit</CardHeader>
              <CardBody>
                <div className="text-sm text-gray-500">
                  Deposit form coming soon...
                </div>
              </CardBody>
            </Card>
          </div>
        </div>
      </div>
    </>
  );
}

export default VaultContent;
