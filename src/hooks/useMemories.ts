import { useState, useEffect } from 'react'
import { Memory } from '@/lib/supabase/types'

export function useMemories() {
  const [memories, setMemories] = useState<Memory[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchMemories = async () => {
    try {
      setIsLoading(true)
      setError(null)
      
      const response = await fetch('/api/memories')
      if (!response.ok) {
        throw new Error('Failed to fetch memories')
      }
      
      const data = await response.json()
      setMemories(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
      console.error('Error fetching memories:', err)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchMemories()
  }, [])

  // Provide a refresh function for manual refetching
  const refresh = () => {
    fetchMemories()
  }

  return {
    memories,
    isLoading,
    error,
    refresh
  }
} 