import { useState, useEffect, useRef, useCallback } from 'react';
import { Memory } from '@/lib/supabase/types';

export function useActivities() {
  const [activities, setActivities] = useState<Memory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const latestTimestampRef = useRef<string | null>(null);
  const activityIdsSet = useRef<Set<string>>(new Set());
  const activitiesRef = useRef<Memory[]>([]);

  // Keep activitiesRef in sync with the activities state
  useEffect(() => {
    activitiesRef.current = activities;
  }, [activities]);

  const fetchActivities = useCallback(async (isInitialFetch = false) => {
    try {
      setError(null);
      if (isInitialFetch) {
        setIsLoading(true);
        // Reset the activity IDs set and timestamp on initial fetch
        activityIdsSet.current = new Set();
        latestTimestampRef.current = null;
      }

      // Build URL with timestamp filter for subsequent fetches
      let url = '/api/memories';
      if (!isInitialFetch && latestTimestampRef.current) {
        url += `?since_timestamp=${encodeURIComponent(latestTimestampRef.current)}`;
      }

      const response = await fetch(url);

      if (!response.ok) {
        throw new Error('Failed to fetch memories');
      }

      const data = await response.json();
      const newActivities = data.data as Memory[];

      if (newActivities.length === 0) {
        return; // No new activities to add
      }

      // Filter out duplicates and add only new activities
      const uniqueNewActivities = newActivities.filter(
        (activity) => !activityIdsSet.current.has(activity.id),
      );

      if (uniqueNewActivities.length === 0) {
        return; // No unique new activities to add
      }

      // Update our tracking set with new activity IDs
      uniqueNewActivities.forEach((activity) => activityIdsSet.current.add(activity.id));

      // Find the latest timestamp from all activities
      const latestNewActivity = [...uniqueNewActivities].sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
      )[0];

      // Only update the timestamp if the new activity is more recent
      if (latestNewActivity) {
        const newTimestamp = latestNewActivity.created_at;
        const oldTimestamp = latestTimestampRef.current;

        // Compare timestamps if we have an existing one
        if (!oldTimestamp || new Date(newTimestamp) > new Date(oldTimestamp)) {
          latestTimestampRef.current = newTimestamp;
        }
      }

      // Update activities state - replace all for initial fetch, append for subsequent fetches
      setActivities((prevActivities) => {
        const updatedActivities = isInitialFetch
          ? uniqueNewActivities
          : [...prevActivities, ...uniqueNewActivities];
        console.log(
          `Added ${uniqueNewActivities.length} new activities. Total: ${updatedActivities.length}`,
        );
        return updatedActivities;
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      console.error('Error fetching activities:', err);
    } finally {
      if (isInitialFetch) {
        setIsLoading(false);
      }
    }
  }, []); // Empty dependency array to avoid re-creating the function on every render

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
    refresh: () => fetchActivities(false),
  };
}
