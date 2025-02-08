import { useEffect, useState } from 'react';

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

  useEffect(() => {
    const ws = new WebSocket(wsUrl);

    ws.onopen = () => {
      setIsConnected(true);
      setError(null);
    };

    ws.onmessage = (event) => {
      try {
        const logEntry = JSON.parse(event.data) as LogEntry;
        setLogs((prevLogs) => [...prevLogs, logEntry].slice(-100)); // Keep last 100 logs
      } catch (e) {
        console.error('Failed to parse log message:', e);
      }
    };

    ws.onerror = (event) => {
      setError('WebSocket error occurred');
      setIsConnected(false);
    };

    ws.onclose = () => {
      setIsConnected(false);
    };

    return () => {
      ws.close();
    };
  }, [wsUrl]);

  const getLogsByCategory = (category: LogEntry['category']) => {
    return logs.filter((log) => log.category === category);
  };

  return {
    logs,
    isConnected,
    error,
    getLogsByCategory,
  };
} 