import { useQuery } from '@tanstack/react-query';
import { useAccount } from 'wagmi';
import { URLS } from '@/utils/urls';

// Types for the vault position data
type DataPoint = {
  x: number; // timestamp
  y: number | string; // value can be number (for assets) or string (for shares)
};

type HistoricalState = {
  assets: Array<{ x: number; y: number }>;  // assets are numbers
  shares: Array<{ x: number; y: string }>;  // shares are strings
};

type VaultPosition = {
  shares: string;       // shares is a string (big number)
  assets: number;       // assets is a number
  historicalState: HistoricalState;
};

type VaultPositionResponse = {
  data: {
    vaultPosition: VaultPosition | null;
  };
  errors?: { message: string }[];
};

// GraphQL query for vault position
const vaultPositionQuery = `
  query getVaultPosition($userAddress: String!, $vaultAddress: String!) {
    vaultPosition(userAddress: $userAddress, vaultAddress: $vaultAddress, chainId: 8453) {
      shares
      assets
      historicalState {
        assets {
          x
          y
        }
        shares {
          x
          y
        }
      }
    }
  }
`;

// Fetch function for GraphQL API
const graphqlFetcher = async (
  query: string,
  variables: Record<string, unknown>
): Promise<VaultPositionResponse> => {
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

  const result = await response.json() as VaultPositionResponse;

  if (result.errors) {
    throw new Error(result.errors[0].message);
  }

  return result;
};

const POLLING_INTERVAL = 20000; // 20 seconds to match useVault

export const useVaultPosition = (vaultAddress: string) => {
  // Get connected wallet address
  const { address: userAddress, isConnected } = useAccount();
  
  return useQuery<VaultPosition | null>({
    queryKey: ['vaultPosition', vaultAddress, userAddress],
    queryFn: async () => {
      if (!userAddress || !isConnected) {
        return null;
      }
      
      const response = await graphqlFetcher(vaultPositionQuery, {
        userAddress,
        vaultAddress,
      });
      
      return response.data.vaultPosition;
    },
    // Don't fetch if user is not connected
    enabled: !!userAddress && isConnected,
    refetchInterval: POLLING_INTERVAL,
    refetchIntervalInBackground: true,
    staleTime: 0,
    retry: 2,
    retryDelay: 1000,
  });
}; 