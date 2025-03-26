import { useState, useEffect } from 'react';
import { Memory } from '@/lib/supabase/types';

export function useActivity(id: string) {
  const [activities, setActivities] = useState<Memory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchActivities = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const response = await fetch(`/api/memories?activity_id=${id}`);
        if (!response.ok) {
          throw new Error('Failed to fetch activities');
        }

        const data = await response.json();
        setActivities(data.data as Memory[]);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
        console.error('Error fetching activities:', err);
      } finally {
        setIsLoading(false);
      }
    };

    if (id) {
      fetchActivities();
    }
  }, [id]);

  return {
    activities,
    isLoading,
    error,
  };
} 