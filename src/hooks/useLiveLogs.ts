import { useEffect, useState, useRef } from 'react';
import { useWebSocket } from '@/contexts/WebSocketContext';
import { AGENT_NAME, ActivityType } from '@/utils/constants';

// Log entry interface
export type LogEntry = {
  id: string;
  type: string;
  message: string;
  timestamp: number;
  data?: any;
  isAggregated?: boolean;
  isLoading?: boolean;
  reasoningId?: string;
  toolType?: 'data_tool';
  reasoningType?: 'thinking';
};

// Type for log handler functions
type LogHandler = (activityType: string, data: any) => void;

// Define the constant for aggregation window
const AGGREGATION_WINDOW_MINUTES = 10;
const AGGREGATION_WINDOW_MS = AGGREGATION_WINDOW_MINUTES * 60 * 1000;

export function useLiveLogs() {
  const { logs, connected } = useWebSocket();
  const [liveLogEntries, setLiveLogEntries] = useState<LogEntry[]>([]);

  // Refs for aggregation
  const aggregationTimer = useRef<NodeJS.Timeout | null>(null);

  // Process incoming logs
  useEffect(() => {
    if (!logs.length || !connected) return;

    try {
      // Process the latest log
      const latestLog = logs[logs.length - 1];
      const logData = JSON.parse(latestLog);

      // Only process activity logs
      if (logData.type === 'activity' && logData.data && logData.data.type) {
        const activityType = logData.data.type;

        // Get the appropriate handler for this activity type
        const handler = LOG_HANDLERS[activityType];

        // Only process if we have a defined handler
        if (handler) {
          handler(activityType, logData.data);
        }
      }
    } catch (error) {
      console.error('Failed to parse log message', error);
    }
  }, [logs, connected]);

  // Standard log handler for regular (non-aggregated) logs
  const addStandardLog = (activityType: string, data: any) => {
    const logEntry: LogEntry = {
      id: `log-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type: activityType,
      message: generateLogMessage(activityType, data),
      timestamp: data.timestamp ? data.timestamp * 1000 : Date.now(),
      data: data,
    };

    setLiveLogEntries((prev) => [logEntry, ...prev].slice(0, 100)); // Keep only the latest 100 logs
  };

  // Data tool log handler
  const addDataToolLog = (activityType: string, data: any) => {
    const logEntry: LogEntry = {
      id: `log-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type: activityType,
      message: generateDataFetchingMessage(activityType, data),
      timestamp: data.timestamp ? data.timestamp * 1000 : Date.now(),
      data: data,
      toolType: 'data_tool',
    };

    setLiveLogEntries((prev) => [logEntry, ...prev].slice(0, 100));
  };

  // Handler for reasoning_started events
  const handleReasoningStarted = (activityType: string, data: any) => {
    const reasoningId = generateReasoningId();
    const timestamp = data.timestamp ? data.timestamp * 1000 : Date.now();

    // Create a summary text that gives context
    const summaryText = `${AGENT_NAME} is thinking about...`;

    const logEntry: LogEntry = {
      id: `log-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type: ActivityType.REASONING_STARTED,
      message: data.prompt || '...', // Store the prompt as the message
      timestamp,
      data: {
        ...data,
        prompt: data.prompt || '',
        // Add a title field for the header text
        title: summaryText,
        summaryText: summaryText,
      },
      isLoading: true,
      reasoningId,
      reasoningType: 'thinking',
    };

    setLiveLogEntries((prev) => [logEntry, ...prev].slice(0, 100));
  };

  // Handler for reasoning_completed events
  const handleReasoningCompleted = (activityType: string, data: any) => {
    setLiveLogEntries((prevEntries) => {
      // Try to find the most recent reasoning_started log
      const startIndex = prevEntries.findIndex(
        (entry) => entry.type === ActivityType.REASONING_STARTED && entry.isLoading,
      );

      // Create a completion summary text
      const summaryText = `${AGENT_NAME} completed the reasoning`;

      if (startIndex === -1) {
        // If no matching start found, just add a standalone reasoning completion log
        const logEntry: LogEntry = {
          id: `log-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          type: ActivityType.REASONING_COMPLETED,
          message: data.prompt || 'Completed thinking', // Keep just the prompt
          timestamp: data.timestamp ? data.timestamp * 1000 : Date.now(),
          data: {
            ...data,
            title: summaryText,
            summaryText: summaryText,
          },
          reasoningType: 'thinking',
        };
        return [logEntry, ...prevEntries].slice(0, 100);
      }

      // Update the existing entry
      const updatedEntries = [...prevEntries];
      updatedEntries[startIndex] = {
        ...updatedEntries[startIndex],
        type: ActivityType.REASONING_COMPLETED,
        message: updatedEntries[startIndex].data.prompt || '', // Keep the prompt as the main message
        data: {
          ...updatedEntries[startIndex].data,
          ...data,
          title: summaryText,
          summaryText: summaryText,
          originalPrompt: updatedEntries[startIndex].data.prompt, // Keep record of the original prompt
        },
        isLoading: false,
      };

      return updatedEntries;
    });
  };

  // Handler for aggregatable events
  const handleAggregatedEvent = (eventType: string, data: any) => {
    const timestamp = data.timestamp ? data.timestamp * 1000 : Date.now();

    // Create a unique identifier for this event to prevent duplication
    const eventId = data.tx_hash
      ? data.tx_hash
      : `${eventType}-${data.market_id || ''}-${timestamp}-${data.amount || 0}`;

    setLiveLogEntries((prevEntries) => {
      // Look for an active aggregation with firstEventTimestamp + WINDOW > now
      const now = Date.now();
      const existingEntryIndex = prevEntries.findIndex(
        (entry) =>
          entry.isAggregated &&
          entry.data?.firstEventTimestamp &&
          entry.data.firstEventTimestamp + AGGREGATION_WINDOW_MS > now,
      );

      // If we found an existing entry, update it
      if (existingEntryIndex >= 0) {
        const updatedEntries = [...prevEntries]; // Create a new array reference
        const existingEntry = updatedEntries[existingEntryIndex];
        const aggregateData = { ...existingEntry.data }; // Create a new object reference

        // Initialize properties if they don't exist
        if (!aggregateData.events) aggregateData.events = [];
        if (!aggregateData.markets) aggregateData.markets = [];

        // Check if this event already exists in the aggregation
        const existingEventIndex = aggregateData.events.findIndex(
          (e: any) =>
            (e.tx_hash && e.tx_hash === data.tx_hash) || (e.eventId && e.eventId === eventId),
        );

        // If event doesn't exist, add it and update counts
        if (existingEventIndex === -1) {
          // Update data counters
          aggregateData.count = (aggregateData.count || 0) + 1;
          aggregateData.totalAmount = (aggregateData.totalAmount || 0) + (data.amount || 0);

          // Add market if it doesn't exist
          if (data.market_id && !aggregateData.markets.includes(data.market_id)) {
            aggregateData.markets = [...aggregateData.markets, data.market_id];
          }

          // Add the new event
          aggregateData.events = [
            ...aggregateData.events,
            {
              ...data,
              type: eventType,
              timestamp: timestamp,
              eventId: eventId,
            },
          ];
        }

        // Always update the timestamp (both for sorting and to trigger a state update)
        aggregateData.lastEventTimestamp = timestamp;

        // Create a completely new entry with updated message
        const updatedEntry = {
          ...existingEntry,
          timestamp: now, // Use current time for sorting
          message: generateAggregatedMessage(aggregateData),
          data: aggregateData,
        };

        // Replace the entry in our array
        updatedEntries[existingEntryIndex] = updatedEntry;

        console.log('Returning updated entries', updatedEntries);
        return updatedEntries;
      }

      // Create a new aggregated entry
      const newAggregateData = {
        eventType: 'morpho_events',
        count: 1,
        markets: data.market_id ? [data.market_id] : [],
        totalAmount: data.amount || 0,
        firstEventTimestamp: timestamp,
        lastEventTimestamp: timestamp,
        events: [
          {
            ...data,
            type: eventType,
            timestamp: timestamp,
            eventId: eventId,
          },
        ],
        isActive: true,
      };

      const newEntry: LogEntry = {
        id: `agg-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
        type: 'morpho_events',
        message: generateAggregatedMessage(newAggregateData),
        timestamp: now, // Use current time for sorting
        data: newAggregateData,
        isAggregated: true,
      };

      return [newEntry, ...prevEntries].slice(0, 100);
    });
  };

  // Mapping of activity types to their handlers
  const LOG_HANDLERS: Record<string, LogHandler> = {
    // Special handlers for reasoning events
    [ActivityType.REASONING_STARTED]: handleReasoningStarted,
    [ActivityType.REASONING_COMPLETED]: handleReasoningCompleted,

    // Data tool events
    [ActivityType.MARKET_DATA_FETCHED]: addDataToolLog,
    [ActivityType.VAULT_DATA_FETCHED]: addDataToolLog,

    // Aggregated transaction events
    [ActivityType.MB_DEPOSIT_DETECTED]: handleAggregatedEvent,
    [ActivityType.MB_WITHDRAWAL_DETECTED]: handleAggregatedEvent,
    [ActivityType.MB_BORROW_DETECTED]: handleAggregatedEvent,
    [ActivityType.MB_REPAY_DETECTED]: handleAggregatedEvent,
    [ActivityType.MV_DEPOSIT_DETECTED]: handleAggregatedEvent,
    [ActivityType.MV_WITHDRAWAL_DETECTED]: handleAggregatedEvent,

    // Standard system logs - these will use the default log generator
    [ActivityType.AGENT_STARTED]: addStandardLog,
    [ActivityType.AGENT_STOPPING]: addStandardLog,
    [ActivityType.PERIODIC_ANALYSIS_STARTED]: addStandardLog,
    [ActivityType.PERIODIC_ANALYSIS_COMPLETED]: addStandardLog,
    [ActivityType.TX_REALLOCATION]: addStandardLog,
    [ActivityType.TX_GET_ASSET_SHARE]: addStandardLog,

    // Add more handlers here as needed for new event types
    // Note: Events without handlers will be ignored
  };

  // Generate message for data fetching logs
  const generateDataFetchingMessage = (activityType: string, data: any): string => {
    switch (activityType) {
      case ActivityType.MARKET_DATA_FETCHED:
        return `${AGENT_NAME} used market data tool${
          data.market_id ? ` for ${data.market_id}` : ''
        }`;
      case ActivityType.VAULT_DATA_FETCHED:
        return `${AGENT_NAME} used vault data tool${
          data.vault_address ? ` for ${formatAddress(data.vault_address)}` : ''
        }`;
      default:
        return `${AGENT_NAME} used tool: ${activityType.replace(/_/g, ' ')}`;
    }
  };

  // Generate message for regular logs
  const generateLogMessage = (activityType: string, data: any): string => {
    switch (activityType) {
      case ActivityType.AGENT_STARTED:
        return `${AGENT_NAME} has started up and is ready`;
      case ActivityType.AGENT_STOPPING:
        return `${AGENT_NAME} is shutting down`;
      case ActivityType.PERIODIC_ANALYSIS_STARTED:
        return `${AGENT_NAME} is starting a periodic market analysis`;
      case ActivityType.PERIODIC_ANALYSIS_COMPLETED:
        return `${AGENT_NAME} has completed the market analysis`;
      case ActivityType.TX_REALLOCATION:
        return `${AGENT_NAME} is reallocating assets`;
      case ActivityType.TX_GET_ASSET_SHARE:
        return `${AGENT_NAME} is calculating asset shares`;
      default:
        return `${activityType.replace(/_/g, ' ').toLowerCase()}`;
    }
  };

  // Generate message for aggregated logs
  const generateAggregatedMessage = (agg: any): string => {
    const { count, totalAmount, markets, events } = agg;

    // Count events by type
    const eventTypes = events.reduce((acc: Record<string, number>, event: any) => {
      const type = event.type || 'unknown';
      acc[type] = (acc[type] || 0) + 1;
      return acc;
    }, {});

    console.log('agg', agg);

    // Build message
    if (count === 1) {
      // For single events
      const event = events[0];
      const eventTypeName = formatEventType(event.type);
      return `${eventTypeName} of ${formatAmount(event.amount)} USDC`;
    } else {
      // For multiple events
      const typeDescriptions = Object.entries(eventTypes)
        .map(([type, count]) => `${count} ${formatEventType(type)}${count !== 1 ? 's' : ''}`)
        .join(', ');

      const marketsCount = Array.isArray(markets) ? markets.length : 0;

      return `${count} transactions (${typeDescriptions}) totaling ${formatAmount(
        totalAmount,
      )} USDC across ${marketsCount} market${marketsCount !== 1 ? 's' : ''}`;
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (aggregationTimer.current) {
        clearTimeout(aggregationTimer.current);
      }
    };
  }, []);

  // Helper functions
  const formatEventType = (eventType: string): string => {
    switch (eventType) {
      case ActivityType.MB_DEPOSIT_DETECTED:
        return 'Deposit';
      case ActivityType.MB_WITHDRAWAL_DETECTED:
        return 'Withdrawal';
      case ActivityType.MB_BORROW_DETECTED:
        return 'Borrow';
      case ActivityType.MB_REPAY_DETECTED:
        return 'Repayment';
      case ActivityType.MV_DEPOSIT_DETECTED:
        return 'Vault Deposit';
      case ActivityType.MV_WITHDRAWAL_DETECTED:
        return 'Vault Withdrawal';
      default:
        return eventType.replace(/_/g, ' ').toLowerCase();
    }
  };

  const formatAmount = (amount: number): string => {
    return (
      amount?.toLocaleString(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }) || '0.00'
    );
  };

  const formatAddress = (address: string): string => {
    return address?.length > 10 ? `${address.slice(0, 6)}...${address.slice(-4)}` : address;
  };

  // Function to generate a unique reasoning ID
  const generateReasoningId = () =>
    `reason-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  return {
    logs: liveLogEntries,
    isLoading: false,
    error: null,
  };
}
