import { useState, useEffect } from 'react';
import { Memory } from '@/lib/supabase/types';

type RunData = {
  thoughtProcess: Memory[];
  report: Memory | null;
  action: Memory | null;
};

export function useRun(id: string) {
  const [run, setRun] = useState<RunData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchRun = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const response = await fetch(`/api/runs/${id}`);
        if (!response.ok) {
          throw new Error('Failed to fetch run');
        }

        const data = await response.json();
        setRun(data.data as RunData);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
        console.error('Error fetching run:', err);
      } finally {
        setIsLoading(false);
      }
    };

    if (id) {
      fetchRun();
    }
  }, [id]);

  return {
    run,
    isLoading,
    error,
  };
} 