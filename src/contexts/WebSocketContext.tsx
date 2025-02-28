import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useRef,
  useCallback,
  ReactNode,
} from 'react';

// Define the shape of our context
type WebSocketContextType = {
  logs: string[];
  error: string | null;
  connected: boolean;
  reconnecting: boolean;
  connect: () => void;
  disconnect: () => void;
};

// Create the context with default values
const WebSocketContext = createContext<WebSocketContextType>({
  logs: [],
  error: null,
  connected: false,
  reconnecting: false,
  connect: () => {},
  disconnect: () => {},
});

// Define the provider props
type WebSocketProviderProps = {
  children: ReactNode;
  maxReconnectAttempts?: number;
  initialBackoffDelay?: number;
  maxBackoffDelay?: number;
};

export function WebSocketProvider({
  children,
  maxReconnectAttempts = 10,
  initialBackoffDelay = 1000,
  maxBackoffDelay = 30000,
}: WebSocketProviderProps) {
  const [logs, setLogs] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [connected, setConnected] = useState(false);
  const [reconnecting, setReconnecting] = useState(false);

  // Use refs for values that shouldn't trigger re-renders
  const socketRef = useRef<WebSocket | null>(null);
  const reconnectAttemptRef = useRef(0);
  const backoffDelayRef = useRef(initialBackoffDelay);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Cleanup function for WebSocket
  const cleanupWebSocket = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.onopen = null;
      socketRef.current.onmessage = null;
      socketRef.current.onerror = null;
      socketRef.current.onclose = null;
      socketRef.current.close();
      socketRef.current = null;
    }

    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
  }, []);

  // Create WebSocket connection
  const connect = useCallback(() => {
    // Clean up any existing connection
    cleanupWebSocket();

    const WS_URL = process.env.NEXT_PUBLIC_WS_URL;

    if (!WS_URL) {
      setError('WebSocket URL is not defined');
      return;
    }

    try {
      const socket = new WebSocket(WS_URL);
      socketRef.current = socket;

      socket.onopen = () => {
        console.log('WebSocket connection established');
        setConnected(true);
        setError(null);
        setReconnecting(false);
        reconnectAttemptRef.current = 0;
        backoffDelayRef.current = initialBackoffDelay;
      };

      socket.onmessage = (event) => {
        const newLog = event.data;
        setLogs((prevLogs) => [...prevLogs, newLog]);
      };

      socket.onerror = (event) => {
        console.error('WebSocket error:', event);
        setError(`WebSocket error occurred`);
      };

      socket.onclose = (event) => {
        console.log(`WebSocket connection closed: ${event.code} ${event.reason}`);
        setConnected(false);

        // Don't try to reconnect if we've explicitly closed the connection (code 1000)
        if (event.code !== 1000 && reconnectAttemptRef.current < maxReconnectAttempts) {
          attemptReconnect();
        }
      };
    } catch (error) {
      console.error('Failed to create WebSocket:', error);
      setError(`Failed to create WebSocket: ${error}`);
      attemptReconnect();
    }
  }, [cleanupWebSocket, initialBackoffDelay, maxReconnectAttempts]);

  // Disconnect WebSocket
  const disconnect = useCallback(() => {
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      // Use code 1000 to indicate normal closure
      socketRef.current.close(1000, 'Closed by client');
    }
    cleanupWebSocket();
    setConnected(false);
    setReconnecting(false);
  }, [cleanupWebSocket]);

  // Attempt to reconnect with exponential backoff
  const attemptReconnect = useCallback(() => {
    if (reconnectAttemptRef.current >= maxReconnectAttempts) {
      console.log(`Maximum reconnect attempts (${maxReconnectAttempts}) reached`);
      setError(`Failed to reconnect after ${maxReconnectAttempts} attempts`);
      setReconnecting(false);
      return;
    }

    setReconnecting(true);
    reconnectAttemptRef.current += 1;

    // Calculate backoff delay with exponential increase and jitter
    const jitter = Math.random() * 0.3 + 0.85; // Random between 0.85 and 1.15
    const delay = Math.min(backoffDelayRef.current * jitter, maxBackoffDelay);

    console.log(
      `Attempting to reconnect (${
        reconnectAttemptRef.current
      }/${maxReconnectAttempts}) in ${Math.round(delay)}ms`,
    );

    reconnectTimeoutRef.current = setTimeout(() => {
      backoffDelayRef.current = Math.min(backoffDelayRef.current * 2, maxBackoffDelay);
      connect();
    }, delay);
  }, [connect, maxReconnectAttempts, maxBackoffDelay]);

  // Connect on component mount, disconnect on unmount
  useEffect(() => {
    connect();

    return () => {
      disconnect();
    };
  }, [connect, disconnect]);

  // Don't expose the full logs array to all consumers if it gets too large
  const lastLogs = logs.length > 100 ? logs.slice(-100) : logs;

  const value = {
    logs: lastLogs,
    error,
    connected,
    reconnecting,
    connect,
    disconnect,
  };

  return <WebSocketContext.Provider value={value}>{children}</WebSocketContext.Provider>;
}

// Hook to use the WebSocket context
export function useWebSocket() {
  const context = useContext(WebSocketContext);

  if (context === undefined) {
    throw new Error('useWebSocket must be used within a WebSocketProvider');
  }

  return context;
}
