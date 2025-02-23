import { useState, useEffect } from 'react'

export type ChatMessage = {
  id: string
  created_at: string
  // admin, agent or [user address]
  sender: string
  tx?: string
  text: string
}

export function useChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchMessages = async () => {
    try {
      setError(null)
      const response = await fetch('/api/messages')
      if (!response.ok) {
        throw new Error('Failed to fetch messages')
      }
      
      const data = await response.json()
      setMessages(data.data) // Assuming the API returns { data: ChatMessage[] }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
      console.error('Error fetching chat messages:', err)
    } finally {
      setIsLoading(false)
    }
  }

  // Initial fetch
  useEffect(() => {
    fetchMessages()
  }, [])

  // Set up periodic refresh (every 10 seconds)
  useEffect(() => {
    const interval = setInterval(() => {
      fetchMessages()
    }, 10000)

    return () => clearInterval(interval)
  }, [])

  return {
    messages,
    isLoading,
    error,
    refresh: fetchMessages
  }
} 