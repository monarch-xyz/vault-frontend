import React from 'react';
import Image from 'next/image';
import { findToken } from '@/utils/tokens';
import { Market } from '@/utils/types';

// Default chain ID (mainnet)
const DEFAULT_CHAIN_ID = 1;

interface MarketSpanProps {
  marketId: string;
  market?: Market
  className?: string;
}

export function MarketSpan({ 
  marketId, 
  market,
  className = ''
}: MarketSpanProps) {
  // Format marketId to show first 6 and last 4 characters
  const formattedId = marketId?.length > 10 
    ? `${marketId.slice(0, 6)}` 
    : marketId;
  
  // Get token info using findToken if we have the market address
  const token = market?.collateralAsset ? findToken(market.collateralAsset.address, market.morphoBlue.chain.id) : null;
  
  return (
    <span 
      className={`inline-flex items-center rounded-md bg-gray-100 px-2 py-1 text-xs font-medium text-gray-600 dark:bg-gray-800 dark:text-gray-300 ${className}`}
      title={`Market ID: ${marketId}`}
    >
      {token?.img ? (
        <Image 
          src={token.img} 
          alt={token.symbol || 'Token'} 
          width={14} 
          height={14}
          className="mr-1"
        />
      ) : (
        <div className="mr-1 h-3.5 w-3.5 rounded-full bg-gray-300 dark:bg-gray-700 flex items-center justify-center text-[8px]">?</div>
      )}
      <span>{formattedId}</span>
    </span>
  );
} 