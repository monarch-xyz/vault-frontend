import { useEffect, useState, useRef } from 'react';
import { useWebSocket } from '@/contexts/WebSocketContext';
import { ActivityType } from './useStatus';
import { AGENT_NAME } from '@/utils/constants';

// Types of logs we want to aggregate - only transaction events
const AGGREGATABLE_EVENTS = [
  ActivityType.MB_DEPOSIT_DETECTED,
  ActivityType.MB_WITHDRAWAL_DETECTED,
  ActivityType.MB_BORROW_DETECTED,
  ActivityType.MB_REPAY_DETECTED,
  ActivityType.MV_DEPOSIT_DETECTED,
  ActivityType.MV_WITHDRAWAL_DETECTED,
];

// Special log pairs that we want to handle together - reasoning and analysis
const PAIRED_LOGS = {
  'reasoning_started': 'reasoning_completed',
  'analysis_started': 'analysis_completed',
};

// Events to exclude from live logs - status updates that should be in useStatus
const EXCLUDE_EVENTS = [
  // Agent lifecycle & basic status
  'log_idle',
  'idle',
  'agent_started',
  'agent_stopping',
  
  // Monitoring status
  'watching_markets',
  'watching_vault',
  'status_update',
  'heartbeat',
  
  // Message handling - already in chat
  ActivityType.MESSAGE_RECEIVED,
  ActivityType.MESSAGE_RESPONDING,
];

// Log entry interface
export interface LogEntry {
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
}

// Aggregate data interface
interface AggregateData {
  eventType: string;
  count: number;
  markets: Set<string>;
  totalAmount: number;
  firstTimestamp: number;
  lastTimestamp: number;
  events: any[];
}

export function useLiveLogs() {
  const { logs, connected } = useWebSocket();
  const [liveLogEntries, setLiveLogEntries] = useState<LogEntry[]>([]);

  // Refs for aggregation
  const aggregationTimer = useRef<NodeJS.Timeout | null>(null);

  console.log('liveLogEntries', liveLogEntries)
  
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
        
        // Skip excluded events
        if (EXCLUDE_EVENTS.some(event => activityType.includes(event))) {
          return;
        }
        
        // Check if this is an aggregatable event
        if (AGGREGATABLE_EVENTS.includes(activityType)) {
          // Add to aggregation
          updateAggregatedLog(activityType, logData.data);
        }
        // Handle reasoning started event
        else if (activityType === ActivityType.REASONING_STARTED) {
          handleReasoningStarted(logData.data);
        }
        // Handle reasoning completed event
        else if (activityType === ActivityType.REASONING_COMPLETED) {
          handleReasoningCompleted(logData.data);
        }
        // Handle data fetching events
        else if (activityType === ActivityType.MARKET_DATA_FETCHED || 
                 activityType === ActivityType.VAULT_DATA_FETCHED) {
          addDataFetchingLog(activityType, logData.data);
        }
        else {
          // Add regular log
          addRegularLog(activityType, logData.data);
        }
      }
    } catch (error) {
      console.error("Failed to parse log message", error);
    }
  }, [logs, connected]);
  
  // Function to add regular (non-aggregated) logs
  const addRegularLog = (activityType: string, data: any) => {
    const logEntry: LogEntry = {
      id: `log-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type: activityType,
      message: generateLogMessage(activityType, data),
      timestamp: (data.timestamp ? data.timestamp * 1000 : Date.now()),
      data: data
    };
    
    setLiveLogEntries(prev => [logEntry, ...prev].slice(0, 100)); // Keep only the latest 100 logs
  };
  
  // Simplified handler for reasoning_started events
  const handleReasoningStarted = (data: any) => {
    const reasoningId = generateReasoningId();
    const timestamp = data.timestamp ? data.timestamp * 1000 : Date.now();
    
    const logEntry: LogEntry = {
      id: `log-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type: ActivityType.REASONING_STARTED,
      message: data.prompt || '...',  // Just store the prompt as the message
      timestamp,
      data: {
        ...data,
        prompt: data.prompt || '',
        // Add a title field for the header text
        title: `${AGENT_NAME} is thinking about...`
      },
      isLoading: true,
      reasoningId,
      reasoningType: 'thinking'
    };
    
    setLiveLogEntries(prev => [logEntry, ...prev].slice(0, 100));
  };
  
  // Simplified handler for reasoning_completed events
  const handleReasoningCompleted = (data: any) => {
    setLiveLogEntries(prevEntries => {
      // Try to find the most recent reasoning_started log
      const startIndex = prevEntries.findIndex(
        entry => entry.type === ActivityType.REASONING_STARTED && entry.isLoading
      );
      
      if (startIndex === -1) {
        // If no matching start found, just add a standalone reasoning completion log
        const logEntry: LogEntry = {
          id: `log-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          type: ActivityType.REASONING_COMPLETED,
          message: data.prompt || 'Completed thinking', // Keep just the prompt
          timestamp: (data.timestamp ? data.timestamp * 1000 : Date.now()),
          data: {
            ...data,
            title: `${AGENT_NAME} completed thinking`
          },
          reasoningType: 'thinking'
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
          title: `${AGENT_NAME} completed thinking`,
          originalPrompt: updatedEntries[startIndex].data.prompt // Keep record of the original prompt
        },
        isLoading: false
      };
      
      return updatedEntries;
    });
  };
  
  // Add data fetching logs as regular logs
  const addDataFetchingLog = (activityType: string, data: any) => {
    const logEntry: LogEntry = {
      id: `log-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type: activityType,
      message: generateDataFetchingMessage(activityType, data),
      timestamp: (data.timestamp ? data.timestamp * 1000 : Date.now()),
      data: data,
      toolType: 'data_tool'
    };
    
    setLiveLogEntries(prev => [logEntry, ...prev].slice(0, 100));
  };
  
  // Generate message for data fetching logs
  const generateDataFetchingMessage = (activityType: string, data: any): string => {
    switch (activityType) {
      case ActivityType.MARKET_DATA_FETCHED:
        return `${AGENT_NAME} used market data tool${data.market_id ? ` for ${data.market_id}` : ''}`;
      case ActivityType.VAULT_DATA_FETCHED:
        return `${AGENT_NAME} used vault data tool${data.vault_address ? ` for ${formatAddress(data.vault_address)}` : ''}`;
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
      case ActivityType.MESSAGE_RECEIVED:
        return `${data.sender ? `Message received from ${formatAddress(data.sender)}` : 'New message received'}`;
      case ActivityType.MESSAGE_RESPONDING:
        return `${AGENT_NAME} is responding to a message`;
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
      
      return `${count} transactions (${typeDescriptions}) totaling ${formatAmount(totalAmount)} USDC across ${marketsCount} market${marketsCount !== 1 ? 's' : ''}`;
    }
  };
  
  // Add or update aggregated logs immediately
  const updateAggregatedLog = (eventType: string, data: any) => {
    const timestamp = data.timestamp ? data.timestamp * 1000 : Date.now();
    
    setLiveLogEntries(prevEntries => {
      // Look for an existing aggregated entry within the last 5 minutes
      const fiveMinutesAgo = Date.now() - 5 * 60 * 1000;
      const existingEntryIndex = prevEntries.findIndex(
        entry => entry.isAggregated && entry.timestamp > fiveMinutesAgo
      );
      
      // If we found an existing entry, update it
      if (existingEntryIndex >= 0) {
        const updatedEntries = [...prevEntries];
        const existingEntry = updatedEntries[existingEntryIndex];
        const aggregateData = existingEntry.data || {
          eventType: 'morpho_events',
          count: 0,
          markets: [],
          totalAmount: 0,
          events: []
        };
        
        // Update the aggregate data
        aggregateData.count = (aggregateData.count || 0) + 1;
        
        // Ensure markets is an array
        if (!Array.isArray(aggregateData.markets)) {
          aggregateData.markets = [];
        }
        
        // Add market if it doesn't exist
        if (data.market_id && !aggregateData.markets.includes(data.market_id)) {
          aggregateData.markets.push(data.market_id);
        }
        
        // Update amount
        aggregateData.totalAmount = (aggregateData.totalAmount || 0) + (data.amount || 0);
        
        // Add this event to the events array
        if (!Array.isArray(aggregateData.events)) {
          aggregateData.events = [];
        }
        
        // Store the original event type in the event data
        aggregateData.events.push({
          ...data,
          type: eventType
        });
        
        // Update the timestamp to the latest event
        updatedEntries[existingEntryIndex] = {
          ...existingEntry,
          timestamp: Math.max(existingEntry.timestamp, timestamp),
          message: generateAggregatedMessage(aggregateData),
          data: aggregateData
        };
        
        console.log('Updated aggregated entry:', updatedEntries[existingEntryIndex]);
        return updatedEntries;
      }
      
      // Create a new aggregated entry
      const newAggregateData = {
        eventType: 'morpho_events',
        count: 1,
        markets: data.market_id ? [data.market_id] : [],
        totalAmount: data.amount || 0,
        firstTimestamp: timestamp,
        lastTimestamp: timestamp,
        events: [{
          ...data,
          type: eventType
        }]
      };
      
      const newEntry: LogEntry = {
        id: `agg-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
        type: 'morpho_events',
        message: generateAggregatedMessage(newAggregateData),
        timestamp,
        data: newAggregateData,
        isAggregated: true
      };
      
      console.log('Created new aggregated entry:', newEntry);
      return [newEntry, ...prevEntries].slice(0, 100); // Keep only the latest 100 entries
    });
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
    return amount?.toLocaleString(undefined, { 
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }) || '0.00';
  };
  
  const formatAddress = (address: string): string => {
    return address?.length > 10 ? `${address.slice(0, 6)}...${address.slice(-4)}` : address;
  };
  
  // Function to determine if an event is significant enough to log
  const isSignificantEvent = (eventType: string): boolean => {
    // List of significant events to include
    const significantEvents = [
      ActivityType.AGENT_STARTED,
      ActivityType.AGENT_STOPPING,
      ActivityType.PERIODIC_ANALYSIS_STARTED,
      ActivityType.PERIODIC_ANALYSIS_COMPLETED,
      ActivityType.TX_REALLOCATION,
      ActivityType.TX_GET_ASSET_SHARE,
      ActivityType.MESSAGE_RECEIVED,
      ActivityType.MESSAGE_RESPONDING,
      'transaction_submitted',
      'transaction_confirmed',
      'transaction_failed',
    ];
    
    return significantEvents.some(event => eventType.includes(event));
  };
  
  // Function to generate a unique reasoning ID
  const generateReasoningId = () => `reason-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  
  return {
    logs: liveLogEntries,
    isLoading: false,
    error: null,
  };
} 