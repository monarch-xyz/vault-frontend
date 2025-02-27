import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { usePublicClient } from 'wagmi';
import morphoABI from '@/abis/morpho';
import { MORPHO } from '@/utils/morpho';
import { URLS } from '@/utils/urls';

const vaultAddress = '0x346aac1e83239db6a6cb760e95e13258ad3d1a6d';

// New types to match the API response
type VaultAllocation = {
  market: {
    id: string;
    uniqueKey: string;
  };
  supplyAssets: number;
};

type VaultAsset = {
  id: string;
  decimals: number;
};

type VaultState = {
  dailyApy: number;
  apy: number;
  totalAssets: number;
  totalAssetsUsd: number;
  allocation: VaultAllocation[];
  lastUpdate: number;
};

type VaultData = {
  state: VaultState;
  asset: VaultAsset;
};

type VaultResponse = {
  data: {
    vaultByAddress: VaultData;
  };
  errors?: { message: string }[];
};

type MarketState = {
  totalSupplyAssets: bigint;
  totalSupplyShares: bigint;
};

// Updated vault query with timestamp
const vaultQuery = `
  query getVault {
    vaultByAddress(address: "${vaultAddress}", chainId: 8453) {
      state {
        dailyApy
        apy
        totalAssets
        totalAssetsUsd
        allocation {
          market {
            id
            uniqueKey
          }
          supplyAssets
        }
      }
      asset {
        id
        decimals
      }
    }
  }
`;

const graphqlFetcher = async (
  query: string,
  variables: Record<string, unknown>,
): Promise<VaultResponse> => {
  const response = await fetch(URLS.MORPHO_BLUE_API, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      // Add cache control headers
      'Cache-Control': 'no-cache',
      Pragma: 'no-cache',
    },
    body: JSON.stringify({
      query,
      variables,
    }),
  });

  if (!response.ok) {
    throw new Error('Network response was not ok');
  }

  const result = (await response.json()) as VaultResponse;

  if (result.errors) {
    throw new Error(result.errors[0].message);
  }

  return result;
};

const POLLING_INTERVAL = 20000; // 30 seconds

export const useVault = () => {
  const publicClient = usePublicClient();
  const [enrichedData, setEnrichedData] = useState<VaultData | undefined>(undefined);

  const queryResponse = useQuery<VaultData>({
    queryKey: ['vault'],
    queryFn: async () => {
      const response = await graphqlFetcher(vaultQuery, {});
      return response.data.vaultByAddress;
    },
    refetchInterval: POLLING_INTERVAL,
    refetchIntervalInBackground: true,
    staleTime: 0,
    retry: 2,
    retryDelay: 1000,
  });

  // Update data with on-chain positions
  useEffect(() => {
    const fetchOnChainData = async () => {
      if (!queryResponse.data?.state.allocation || !publicClient) {
        setEnrichedData(queryResponse.data);
        return;
      }

      try {
        // Get all market positions and states from chain
        const marketDataPromises = queryResponse.data.state.allocation.map(async (allocation) => {
          const [position, marketStateArray] = await Promise.all([
            publicClient.readContract({
              address: MORPHO,
              abi: morphoABI,
              functionName: 'position',
              args: [allocation.market.uniqueKey as `0x${string}`, vaultAddress as `0x${string}`],
            }),
            publicClient.readContract({
              address: MORPHO,
              abi: morphoABI,
              functionName: 'market',
              args: [allocation.market.uniqueKey as `0x${string}`],
            }),
          ]);

          // Parse market state array - we only need totalSupplyAssets and totalSupplyShares
          const [totalSupplyAssets, totalSupplyShares] = marketStateArray as [
            bigint,
            bigint,
            bigint,
            bigint,
            bigint,
            bigint,
          ];

          return {
            marketId: allocation.market.uniqueKey,
            supplyShares: position[0], // [supplyShares, borrowShares, collateral]
            marketState: {
              totalSupplyAssets,
              totalSupplyShares,
            },
          };
        });

        const marketsData = await Promise.all(marketDataPromises);

        // Calculate actual assets from shares
        const updatedAllocation = queryResponse.data.state.allocation.map((allocation) => {
          const marketData = marketsData.find((m) => m.marketId === allocation.market.uniqueKey);
          if (!marketData) return allocation;

          // Calculate assets from shares using the formula:
          // assets = (shares * totalAssets) / totalShares
          const assets =
            marketData.marketState.totalSupplyShares > 0n
              ? (marketData.supplyShares * marketData.marketState.totalSupplyAssets) /
                marketData.marketState.totalSupplyShares
              : 0n;

          return {
            ...allocation,
            supplyAssets: assets.toString(),
          };
        });

        setEnrichedData({
          ...queryResponse.data,
          state: {
            ...queryResponse.data.state,
            allocation: updatedAllocation as VaultAllocation[],
          },
        });
      } catch (error) {
        console.error('Error fetching on-chain data:', error);
        setEnrichedData(queryResponse.data);
      }
    };

    fetchOnChainData();
  }, [queryResponse.data, publicClient]);

  return {
    ...queryResponse,
    data: enrichedData,
  };
};
