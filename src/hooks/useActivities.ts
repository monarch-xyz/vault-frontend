import { useState, useEffect } from 'react'
import { Memory } from '@/lib/supabase/types'

export function useActivities() {
  const [activities, setActivities] = useState<Memory[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchActivities = async () => {
    try {
      setError(null)
      
      const response = await fetch('/api/memories')
      if (!response.ok) {
        throw new Error('Failed to fetch memories')
      }
      
      const data = await response.json()
      setActivities(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
      console.error('Error fetching activities:', err)
    } finally {
      setIsLoading(false)
    }
  }

  // Initial fetch
  useEffect(() => {
    fetchActivities()
  }, [])

  // Set up periodic refresh every minute (60000ms)
  useEffect(() => {
    const interval = setInterval(() => {
      fetchActivities()
    }, 60000)

    return () => clearInterval(interval)
  }, [])

  return {
    activities,
    isLoading,
    error,
    refresh: fetchActivities // Manual refresh function
  }
} 