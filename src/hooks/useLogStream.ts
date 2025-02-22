'use client'

import { useEffect, useState, useCallback, useRef } from 'react';

export type LogEntry = {
  category: 'actions' | 'think' | 'report' | 'conversation';
  type: string;
  details: {
    text: string;
    metadata?: {
      txHash?: string;
      amount?: string;
      sender?: string;
    };
  };
  timestamp: string;
};

// Use environment variable with fallback
const wsUrl = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:8000/ws';

export function useLogStream() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const wsRef = useRef<WebSocket | null>(null);

  // Add isMounted ref to prevent memory leaks
  const isMounted = useRef(false);

  const connect = useCallback(() => {
    // Guard against server-side execution
    if (typeof window === 'undefined') return;

    // Close existing connection
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }

    try {
      const newWs = new WebSocket(wsUrl);

      // Add connection timeout
      const connectionTimeout = setTimeout(() => {
        if (newWs.readyState !== WebSocket.OPEN) {
          newWs.close();
          if (isMounted.current) {
            setError('Connection timeout');
            setIsConnected(false);
          }
        }
      }, 5000); // 5 second timeout

      newWs.onopen = () => {
        clearTimeout(connectionTimeout);
        if (isMounted.current) {
          setIsConnected(true);
          setError(null);
        }
      };

      newWs.onmessage = (event) => {
        if (!isMounted.current) return;
        
        try {
          const logEntry = JSON.parse(event.data) as LogEntry;
          setLogs((prevLogs) => [...prevLogs, logEntry].slice(-100));
        } catch (e) {
          console.error('Failed to parse log message:', e);
        }
      };

      newWs.onerror = () => {
        if (isMounted.current) {
          setError('WebSocket error occurred');
          setIsConnected(false);
        }
      };

      newWs.onclose = () => {
        if (isMounted.current) {
          setIsConnected(false);
        }
      };

      wsRef.current = newWs;
    } catch (error) {
      console.error('Failed to create WebSocket:', error);
      if (isMounted.current) {
        setError('Failed to create WebSocket connection');
        setIsConnected(false);
      }
    }
  }, []);

  useEffect(() => {
    // Set mounted flag
    isMounted.current = true;

    // Only connect if we're in the browser
    if (typeof window !== 'undefined') {
      connect();
    }

    return () => {
      isMounted.current = false;
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
    };
  }, [connect]);

  const getLogsByType = (category: LogEntry['category'], type?: string) => {
    return logs.filter((log) => {
      if (type) {
        return log.category === category && log.type.startsWith(type);
      }
      return log.category === category;
    });
  };

  return {
    logs,
    isConnected,
    error,
    getLogsByType,
    reconnect: connect,
  };
}
