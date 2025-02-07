'use client';

import { useState, useCallback } from 'react';
import { Card, CardHeader, CardBody } from '@nextui-org/card';
import { ExternalLinkIcon, ChevronLeftIcon } from '@radix-ui/react-icons';
import Image from 'next/image';
import Link from 'next/link';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { formatUnits } from 'viem';
import { Button } from '@/components/common';
import { Spinner } from '@/components/common/Spinner';
import { OracleFeedInfo } from '@/components/FeedInfo/OracleFeedInfo';
import Header from '@/components/layout/header/Header';
import OracleVendorBadge from '@/components/OracleVendorBadge';
import { useMarket, useMarketHistoricalData } from '@/hooks/useMarket';
import { getExplorerURL, getMarketURL } from '@/utils/external';
import { getIRMTitle } from '@/utils/morpho';
import { getNetworkImg, getNetworkName, SupportedNetworks } from '@/utils/networks';
import { findToken } from '@/utils/tokens';

function VaultContent() {
  const { marketid, chainId } = useParams();

  const network = Number(chainId as string) as SupportedNetworks;
  const networkImg = getNetworkImg(network);

  const router = useRouter();
  
  const {
    data: market,
    isLoading: isMarketLoading,
    error: marketError,
  } = useMarket(marketid as string, network);
  

  if (isMarketLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Spinner size={24} />
      </div>
    );
  }

  if (marketError) {
    return <div className="text-center text-red-500">Error: {(marketError as Error).message}</div>;
  }

  if (!market) {
    return <div className="text-center">Market data not available</div>;
  }

  const loanImg = findToken(market.loanAsset.address, market.morphoBlue.chain.id)?.img;
  
  const cardStyle = 'bg-surface rounded-md shadow-sm p-4';

  const averageLTV =
    !market.state.collateralAssetsUsd ||
    !market.state.borrowAssetsUsd ||
    market.state.collateralAssetsUsd <= 0
      ? 0
      : (parseFloat(market.state.borrowAssetsUsd) / market.state.collateralAssetsUsd) * 100;

  return (
    <>
      <Header />
      <div className="container mx-auto px-4 py-8 pb-4 font-zen">
        <h1 className="mb-8 text-center text-3xl">
          Monarch Vault
        </h1>

        <div className="mb-8 grid grid-cols-1 gap-8 md:grid-cols-3">
          <Card className={cardStyle}>
            <CardHeader className="text-xl">Basic Info</CardHeader>
            <CardBody>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span>Network:</span>
                  <div className="flex items-center">
                    {networkImg && (
                      <Image
                        src={networkImg}
                        alt={network.toString()}
                        width={20}
                        height={20}
                        className="mr-2"
                      />
                    )}
                    {getNetworkName(network)}
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span>Loan Asset:</span>
                  <div className="flex items-center">
                    {loanImg && (
                      <Image
                        src={loanImg}
                        alt={market.loanAsset.symbol}
                        width={20}
                        height={20}
                        className="mr-2"
                      />
                    )}
                    <Link
                      href={getExplorerURL(market.loanAsset.address, market.morphoBlue.chain.id)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center hover:underline"
                    >
                      {market.loanAsset.symbol} <ExternalLinkIcon className="ml-1" />
                    </Link>
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <span>IRM:</span>
                  <Link
                    href={getExplorerURL(market.irmAddress, market.morphoBlue.chain.id)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center hover:underline"
                  >
                    {getIRMTitle(market.irmAddress)} <ExternalLinkIcon className="ml-1" />
                  </Link>
                </div>
              </div>
            </CardBody>
          </Card>

          <Card className={cardStyle}>
            <CardHeader className="text-xl">LLTV Info</CardHeader>
            <CardBody>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span>LLTV:</span>
                  <span>{formatUnits(BigInt(market.lltv), 16)}%</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Average LTV:</span>
                  <span>{averageLTV.toFixed(2)}%</span>
                </div>
              </div>
            </CardBody>
          </Card>

          <Card className={cardStyle}>
            <CardHeader className="text-xl">Oracle Info</CardHeader>
            <CardBody>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span>Vendor:</span>
                  {market.oracle.data && (
                    <Link
                      href={getExplorerURL(market.oracleAddress, market.morphoBlue.chain.id)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center hover:underline"
                    >
                      <OracleVendorBadge oracleData={market.oracle.data} showText />{' '}
                      <ExternalLinkIcon className="ml-1" />
                    </Link>
                  )}
                </div>
                <div>
                  <h4 className="mb-1 text-sm font-semibold">Feed Routes:</h4>
                  {market.oracle.data && (
                    <div>
                      {' '}
                      <OracleFeedInfo
                        feed={market.oracle.data.baseFeedOne}
                        chainId={market.morphoBlue.chain.id}
                      />
                      <OracleFeedInfo
                        feed={market.oracle.data.baseFeedTwo}
                        chainId={market.morphoBlue.chain.id}
                      />
                      <OracleFeedInfo
                        feed={market.oracle.data.quoteFeedOne}
                        chainId={market.morphoBlue.chain.id}
                      />
                      <OracleFeedInfo
                        feed={market.oracle.data.quoteFeedTwo}
                        chainId={market.morphoBlue.chain.id}
                      />{' '}
                    </div>
                  )}
                </div>
              </div>
            </CardBody>
          </Card>
        </div>
      </div>
    </>
  );
}

export default VaultContent;
