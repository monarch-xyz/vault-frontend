import { useEffect, useState, useCallback, useRef } from 'react';

export type LogEntry = {
  category: 'event' | 'think' | 'conversation' | 'memory' | 'action' | 'error';
  topic: string;
  details: string;
  timestamp: string;
};

export function useLogStream(wsUrl: string = 'ws://localhost:8000/ws') {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const wsRef = useRef<WebSocket | null>(null);

  const connect = useCallback(() => {
    // Close existing connection if any
    if (wsRef.current) {
      wsRef.current.close();
    }

    const newWs = new WebSocket(wsUrl);

    newWs.onopen = () => {
      setIsConnected(true);
      setError(null);
    };

    newWs.onmessage = (event) => {
      try {
        const logEntry = JSON.parse(event.data) as LogEntry;
        setLogs((prevLogs) => [...prevLogs, logEntry].slice(-100));
      } catch (e) {
        console.error('Failed to parse log message:', e);
      }
    };

    newWs.onerror = (event) => {
      setError('WebSocket error occurred');
      setIsConnected(false);
    };

    newWs.onclose = () => {
      setIsConnected(false);
    };

    wsRef.current = newWs;
  }, [wsUrl]);

  useEffect(() => {
    connect();

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
    };
  }, [connect]);

  const getLogsByCategory = (category: LogEntry['category']) => {
    return logs.filter((log) => log.category === category);
  };

  return {
    logs,
    isConnected,
    error,
    getLogsByCategory,
    reconnect: connect,
  };
} 