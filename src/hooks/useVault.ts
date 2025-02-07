import { useQuery } from '@tanstack/react-query';
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
  allTimeApy: number;
  apy: number;
  totalAssets: number;
  totalAssetsUsd: number;
  allocation: VaultAllocation[];
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

// Updated vault query
const vaultQuery = `
  query getVault {
    vaultByAddress(address: "${vaultAddress}", chainId: 8453) {
      state {
        allTimeApy
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
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query, variables }),
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

export const useVault = (vaultAddress: string) => {
  return useQuery<VaultData>({
    queryKey: ['vault'],
    queryFn: async () => {
      const response = await graphqlFetcher(vaultQuery, {});
      return response.data.vaultByAddress;
    },
  });
};
