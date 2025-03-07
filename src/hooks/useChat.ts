import { useState, useEffect, useRef, useCallback } from 'react';

export type ChatMessage = {
  id: string;
  created_at: string;
  // admin, agent or [user address]
  sender: string;
  tx?: string;
  text: string;
};

export function useChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const latestTimestampRef = useRef<string | null>(null);
  const messageIdsSet = useRef<Set<string>>(new Set());
  const messagesRef = useRef<ChatMessage[]>([]);

  // Keep messagesRef in sync with the messages state
  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  const fetchMessages = useCallback(async (isInitialFetch = false) => {
    try {
      setError(null);
      if (isInitialFetch) {
        setIsLoading(true);
        // Reset the message IDs set and timestamp on initial fetch
        messageIdsSet.current = new Set();
        latestTimestampRef.current = null;
      }

      // Build URL with timestamp filter for subsequent fetches
      let url = '/api/messages';
      if (!isInitialFetch && latestTimestampRef.current) {
        url += `?since_timestamp=${encodeURIComponent(latestTimestampRef.current)}`;
      }

      const response = await fetch(url);

      if (!response.ok) {
        throw new Error('Failed to fetch messages');
      }

      const data = await response.json();
      const newMessages = data.data as ChatMessage[];

      if (newMessages.length === 0) {
        return; // No new messages to add
      }

      // Filter out duplicates and add only new messages
      const uniqueNewMessages = newMessages.filter((msg) => !messageIdsSet.current.has(msg.id));

      if (uniqueNewMessages.length === 0) {
        return; // No unique new messages to add
      }

      // Update our tracking set with new message IDs
      uniqueNewMessages.forEach((msg) => messageIdsSet.current.add(msg.id));

      // Find the latest timestamp from all messages
      const latestNewMessage = [...uniqueNewMessages].sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
      )[0];

      // Only update the timestamp if the new message is more recent
      if (latestNewMessage) {
        const newTimestamp = latestNewMessage.created_at;
        const oldTimestamp = latestTimestampRef.current;

        // Compare timestamps if we have an existing one
        if (!oldTimestamp || new Date(newTimestamp) > new Date(oldTimestamp)) {
          latestTimestampRef.current = newTimestamp;
        }
      }

      // Update messages state - replace all for initial fetch, append for subsequent fetches
      setMessages((prevMessages) => {
        const updatedMessages = isInitialFetch
          ? uniqueNewMessages
          : [...prevMessages, ...uniqueNewMessages];
        console.log(
          `Added ${uniqueNewMessages.length} new messages. Total: ${updatedMessages.length}`,
        );
        return updatedMessages;
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      console.error('Error fetching chat messages:', err);
    } finally {
      if (isInitialFetch) {
        setIsLoading(false);
      }
    }
  }, []); // Empty dependency array to avoid re-creating the function on every render

  // Initial fetch
  useEffect(() => {
    fetchMessages(true);
  }, [fetchMessages]);

  // Set up periodic refresh (every 10 seconds)
  useEffect(() => {
    const interval = setInterval(() => {
      fetchMessages(false);
    }, 10000);

    return () => clearInterval(interval);
  }, [fetchMessages]);

  return {
    messages,
    isLoading,
    error,
    refresh: () => fetchMessages(false),
  };
}
