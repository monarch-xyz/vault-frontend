'use client';

import {
  createContext,
  useContext,
  ReactNode,
  useCallback,
  useEffect,
  useState,
  useMemo,
  useRef,
} from 'react';
import { marketsQuery } from '@/graphql/queries';
import { isSupportedChain } from '@/utils/networks';
import { Market } from '@/utils/types';
import { getMarketWarningsWithDetail } from '@/utils/warnings';

type MarketsContextType = {
  markets: Market[];
  loading: boolean;
  isRefetching: boolean;
  error: unknown | null;
  refetch: (onSuccess?: () => void) => void;
  refresh: () => Promise<void>;
};

const MarketsContext = createContext<MarketsContextType | undefined>(undefined);

type MarketsProviderProps = {
  children: ReactNode;
};

type MarketResponse = {
  data: {
    markets: {
      items: Market[];
    };
  };
};

const POLLING_INTERVAL = 30000; // 30 seconds

export function MarketsProvider({ children }: MarketsProviderProps) {
  const [loading, setLoading] = useState(true);
  const [isRefetching, setIsRefetching] = useState(false);
  const [markets, setMarkets] = useState<Market[]>([]);
  const [error, setError] = useState<unknown | null>(null);
  const pollingTimerRef = useRef<NodeJS.Timeout>();

  const fetchMarkets = useCallback(
    async (isRefetch = false) => {
      try {
        if (isRefetch) {
          setIsRefetching(true);
        } else {
          setLoading(true);
        }

        const marketsResponse = await fetch('https://blue-api.morpho.org/graphql', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            query: marketsQuery,
            variables: { first: 1000, where: { whitelisted: true } },
          }),
        });

        const marketsResult = (await marketsResponse.json()) as MarketResponse;
        const rawMarkets = marketsResult.data.markets.items;

        const filtered = rawMarkets
          .filter((market) => market.collateralAsset != undefined)
          .filter(
            (market) => market.warnings.find((w) => w.type === 'not_whitelisted') === undefined,
          )
          .filter((market) => isSupportedChain(market.morphoBlue.chain.id));

        const processedMarkets = filtered.map((market) => {
          const warningsWithDetail = getMarketWarningsWithDetail(market);

          return {
            ...market,
            warningsWithDetail,
          };
        });

        setMarkets(processedMarkets);
      } catch (_error) {
        setError(_error);
        console.error('Error fetching markets:', _error);
      } finally {
        if (isRefetch) {
          setIsRefetching(false);
        } else {
          setLoading(false);
        }
      }
    },
    [],
  );

  // Set up polling
  useEffect(() => {
    // Initial fetch
    if (markets.length === 0) {
      fetchMarkets().catch(console.error);
    }

    // Set up periodic polling
    pollingTimerRef.current = setInterval(() => {
      if (!loading) {
        fetchMarkets(true).catch(console.error);
      }
    }, POLLING_INTERVAL);

    // Cleanup
    return () => {
      if (pollingTimerRef.current) {
        clearInterval(pollingTimerRef.current);
      }
    };
  }, [loading, fetchMarkets]);

  const refetch = useCallback(
    (onSuccess?: () => void) => {
      fetchMarkets(true).then(onSuccess).catch(console.error);
    },
    [fetchMarkets],
  );

  const refresh = useCallback(async () => {
    // Clear existing polling
    if (pollingTimerRef.current) {
      clearInterval(pollingTimerRef.current);
    }

    setLoading(true);
    setMarkets([]);
    try {
      await fetchMarkets();

      // Restart polling after manual refresh
      pollingTimerRef.current = setInterval(() => {
        fetchMarkets(true).catch(console.error);
      }, POLLING_INTERVAL);
    } catch (_error) {
      console.error('Failed to refresh markets:', _error);
    }
  }, [fetchMarkets]);

  const isLoading = loading;
  const combinedError = error;

  const contextValue = useMemo(
    () => ({
      markets,
      loading: isLoading,
      isRefetching,
      error: combinedError,
      refetch,
      refresh,
    }),
    [markets, isLoading, isRefetching, combinedError, refetch, refresh],
  );

  return <MarketsContext.Provider value={contextValue}>{children}</MarketsContext.Provider>;
}

export function useMarkets() {
  const context = useContext(MarketsContext);
  if (context === undefined) {
    throw new Error('useMarkets must be used within a MarketsProvider');
  }
  return context;
}
