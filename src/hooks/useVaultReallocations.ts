import { useQuery } from '@tanstack/react-query';
import { URLS } from '@/utils/urls';

const vaultAddress = '0x346aac1e83239db6a6cb760e95e13258ad3d1a6d';

type ReallocateItem = {
  id: string;
  timestamp: number;
  market: {
    uniqueKey: string;
  };
  assets: number;
  caller: string;
  type: 'ReallocateSupply' | 'ReallocateWithdraw';
  hash: string;
};

type ReallocationsResponse = {
  data: {
    vaultReallocates: {
      items: ReallocateItem[];
    };
  };
  errors?: { message: string }[];
};

type GroupedReallocation = {
  hash: string;
  timestamp: number;
  caller: string;
  actions: {
    marketId: string;
    assets: number;
    type: 'ReallocateSupply' | 'ReallocateWithdraw';
  }[];
};

const reallocationsQuery = `
  query getVaultAllocations($vaultId: String!) {
    vaultReallocates(where: {
      vaultAddress_in: [$vaultId]
    }) {
      items {
        id
        timestamp
        market {
          uniqueKey
        }
        assets
        caller
        type
        hash
      }
    }
  }
`;

const graphqlFetcher = async (query: string, variables: Record<string, unknown>) => {
  const response = await fetch(URLS.MORPHO_BLUE_API, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
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

  const result = (await response.json()) as ReallocationsResponse;

  if (result.errors) {
    throw new Error(result.errors[0].message);
  }

  return result;
};

export function useVaultReallocations() {
  const { data, isLoading, error, refetch } = useQuery<GroupedReallocation[]>({
    queryKey: ['vaultReallocations'],
    queryFn: async () => {
      const response = await graphqlFetcher(reallocationsQuery, {
        vaultId: vaultAddress,
      });
      
      const items = response.data.vaultReallocates.items;
      
      // Group by hash as each hash represents one logical reallocation
      const hashGroups: Record<string, ReallocateItem[]> = {};
      
      items.forEach(item => {
        if (!hashGroups[item.hash]) {
          hashGroups[item.hash] = [];
        }
        hashGroups[item.hash].push(item);
      });
      
      // Convert groups to our desired format
      return Object.entries(hashGroups).map(([hash, items]) => {
        // All items in a group have the same timestamp and caller
        const { timestamp, caller } = items[0];
        
        return {
          hash,
          timestamp,
          caller,
          actions: items.map(item => ({
            marketId: item.market.uniqueKey,
            assets: item.assets,
            type: item.type,
          })),
        };
      }).sort((a, b) => b.timestamp - a.timestamp); // Sort by timestamp descending
    },
    refetchInterval: 60000, // Refresh every minute
    staleTime: 30000,
  });

  return {
    reallocations: data || [],
    isLoading,
    error: error instanceof Error ? error.message : null,
    refresh: refetch,
  };
} 