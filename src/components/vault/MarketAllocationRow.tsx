import Image from 'next/image';
import { Tooltip } from '@nextui-org/tooltip';
import { findToken } from '@/utils/tokens';
import { formatBalance, formatReadable } from '@/utils/balance';
import { Market } from '@/utils/types';

// USDC token info - could be moved to constants or token utils
const USDC = {
  symbol: 'USDC',
  img: require('../../../src/imgs/tokens/usdc.webp') as string,
  decimals: 6,
  address: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
};

interface MarketAllocationRowProps {
  market: Market;
  amount: bigint;
  totalAssets: bigint;
}

export function MarketAllocationRow({ market, amount, totalAssets }: MarketAllocationRowProps) {
  const percentage = (Number(amount) / Number(totalAssets)) * 100;
  const collateral = findToken(market.collateralAsset.address, market.morphoBlue.chain.id);
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
          {/* Display both USDC and collateral tokens */}
          <div className="flex items-center">
            <Image src={USDC.img} alt="USDC" width={20} height={20} className="rounded-full" />
            <span className="mx-1 text-xs text-gray-500">/</span>
            <Tooltip
              content={`Borrowers in this market use ${market.collateralAsset.symbol} as collateral to borrow your USDC`}
              placement="bottom"
            >
              <div className="cursor-help">
                {collateral?.img && (
                  <Image
                    src={collateral.img}
                    alt={market.collateralAsset.symbol}
                    width={20}
                    height={20}
                    className="rounded-full"
                  />
                )}
              </div>
            </Tooltip>
          </div>
          <span className="text-sm font-medium"> {market.collateralAsset.symbol}</span>
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
