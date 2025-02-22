import { useState, useEffect } from 'react'
import { Memory } from '@/lib/supabase/types'

export function useActivities() {
  const [activities, setActivities] = useState<Memory[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchActivities = async () => {
    try {
      setIsLoading(true)
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

  useEffect(() => {
    fetchActivities()
  }, [])

  // Provide a refresh function for manual refetching
  const refresh = () => {
    fetchActivities()
  }

  return {
    activities,
    isLoading,
    error,
    refresh
  }
} 