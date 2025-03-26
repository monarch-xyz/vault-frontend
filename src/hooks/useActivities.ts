import { useState, useEffect, useCallback } from 'react';
import { Memory } from '@/lib/supabase/types';

export function useActivities(type?: string) {
  const [activities, setActivities] = useState<Memory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const PAGE_SIZE = 20;

  const fetchActivities = useCallback(async (showLoading = false) => {
    try {
      setError(null);
      if (showLoading) {
        setIsLoading(true);
      }

      // Build URL with filters
      let url = '/api/memories?';
      const params = new URLSearchParams();
      
      // When type is 'all', we don't filter by type in the API
      if (type && type !== 'all') {
        params.append('type', type);
      }
      
      url += params.toString();
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error('Failed to fetch memories');
      }

      const data = await response.json();
      const newActivities = data.data as Memory[];

      setActivities(newActivities);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      console.error('Error fetching activities:', err);
    } finally {
      if (showLoading) {
        setIsLoading(false);
      }
    }
  }, [type]);

  // Initial fetch
  useEffect(() => {
    fetchActivities(true);
  }, [fetchActivities]);

  // Set up periodic refresh (every 10 seconds)
  useEffect(() => {
    const interval = setInterval(() => {
      fetchActivities(false);
    }, 10000);

    return () => clearInterval(interval);
  }, [fetchActivities]);

  return {
    activities,
    isLoading,
    error,
    refresh: () => fetchActivities(true),
  };
}
