import { useEffect, useState, useRef } from 'react';
import { useWebSocket } from '@/contexts/WebSocketContext';
import { AGENT_NAME, ActivityType } from '@/utils/constants';

// Types of logs we want to aggregate - only transaction events
const AGGREGATABLE_EVENTS = [
  ActivityType.MB_DEPOSIT_DETECTED,
  ActivityType.MB_WITHDRAWAL_DETECTED,
  ActivityType.MB_BORROW_DETECTED,
  ActivityType.MB_REPAY_DETECTED,
  ActivityType.MV_DEPOSIT_DETECTED,
  ActivityType.MV_WITHDRAWAL_DETECTED,
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
  markets: string[];
  totalAmount: number;
  firstTimestamp: number;
  lastTimestamp: number;
  events: any[];
}

// Interface for log generators
interface LogGenerator {
  generateLog: (activityType: string, data: any) => LogEntry | null;
  updateExisting?: (existingEntries: LogEntry[], data: any) => LogEntry[] | null;
}

export function useLiveLogs() {
  const { logs, connected } = useWebSocket();
  const [liveLogEntries, setLiveLogEntries] = useState<LogEntry[]>([]);

  // Refs for aggregation
  const aggregationTimer = useRef<NodeJS.Timeout | null>(null);

  console.log('liveLogEntries', liveLogEntries)
  
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
  
  // Generate a unique ID
  const generateId = (prefix: string = 'log') => 
    `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  
  // Function to generate a unique reasoning ID
  const generateReasoningId = () => generateId('reason');
  
  // Generate message for aggregated logs
  const generateAggregatedMessage = (agg: AggregateData): string => {
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
      
      const marketsCount = markets.length;
      
      return `${count} transactions (${typeDescriptions}) totaling ${formatAmount(totalAmount)} USDC across ${marketsCount} market${marketsCount !== 1 ? 's' : ''}`;
    }
  };
  
  // Define log generators for each activity type we want to include
  const logGenerators: Record<string, LogGenerator> = {
    // System events
    [ActivityType.AGENT_STARTED]: {
      generateLog: (activityType, data) => ({
        id: generateId(),
        type: activityType,
        message: `${AGENT_NAME} has started up and is ready`,
        timestamp: (data.timestamp ? data.timestamp * 1000 : Date.now()),
        data: data
      })
    },
    
    [ActivityType.AGENT_STOPPING]: {
      generateLog: (activityType, data) => ({
        id: generateId(),
        type: activityType,
        message: `${AGENT_NAME} is shutting down`,
        timestamp: (data.timestamp ? data.timestamp * 1000 : Date.now()),
        data: data
      })
    },
    
    // Analysis events
    [ActivityType.PERIODIC_ANALYSIS_STARTED]: {
      generateLog: (activityType, data) => ({
        id: generateId(),
        type: activityType,
        message: `${AGENT_NAME} is starting a periodic market analysis`,
        timestamp: (data.timestamp ? data.timestamp * 1000 : Date.now()),
        data: data
      })
    },
    
    [ActivityType.PERIODIC_ANALYSIS_COMPLETED]: {
      generateLog: (activityType, data) => ({
        id: generateId(),
        type: activityType,
        message: `${AGENT_NAME} has completed the market analysis`,
        timestamp: (data.timestamp ? data.timestamp * 1000 : Date.now()),
        data: data
      })
    },
    
    // Transaction events
    [ActivityType.TX_REALLOCATION]: {
      generateLog: (activityType, data) => ({
        id: generateId(),
        type: activityType,
        message: `${AGENT_NAME} is reallocating assets`,
        timestamp: (data.timestamp ? data.timestamp * 1000 : Date.now()),
        data: data
      })
    },
    
    [ActivityType.TX_GET_ASSET_SHARE]: {
      generateLog: (activityType, data) => ({
        id: generateId(),
        type: activityType,
        message: `${AGENT_NAME} is calculating asset shares`,
        timestamp: (data.timestamp ? data.timestamp * 1000 : Date.now()),
        data: data
      })
    },
    
    // Data tool events
    [ActivityType.MARKET_DATA_FETCHED]: {
      generateLog: (activityType, data) => ({
        id: generateId(),
        type: activityType,
        message: `${AGENT_NAME} used market data tool${data.market_id ? ` for ${data.market_id}` : ''}`,
        timestamp: (data.timestamp ? data.timestamp * 1000 : Date.now()),
        data: data,
        toolType: 'data_tool'
      })
    },
    
    [ActivityType.VAULT_DATA_FETCHED]: {
      generateLog: (activityType, data) => ({
        id: generateId(),
        type: activityType,
        message: `${AGENT_NAME} used vault data tool${data.vault_address ? ` for ${formatAddress(data.vault_address)}` : ''}`,
        timestamp: (data.timestamp ? data.timestamp * 1000 : Date.now()),
        data: data,
        toolType: 'data_tool'
      })
    },
    
    // Reasoning events - special handling
    [ActivityType.REASONING_STARTED]: {
      generateLog: (activityType, data) => {
        const reasoningId = generateReasoningId();
        const timestamp = data.timestamp ? data.timestamp * 1000 : Date.now();
        
        return {
          id: generateId(),
          type: ActivityType.REASONING_STARTED,
          message: data.prompt || '...',
          timestamp,
          data: {
            ...data,
            prompt: data.prompt || '',
            title: `${AGENT_NAME} is thinking about...`
          },
          isLoading: true,
          reasoningId,
          reasoningType: 'thinking'
        };
      }
    },
    
    [ActivityType.REASONING_COMPLETED]: {
      generateLog: () => null, // No standalone log
      updateExisting: (prevEntries, data) => {
        // Try to find the most recent reasoning_started log
        const startIndex = prevEntries.findIndex(
          entry => entry.type === ActivityType.REASONING_STARTED && entry.isLoading
        );
        
        if (startIndex === -1) {
          // If no matching start found, just add a standalone reasoning completion log
          const logEntry: LogEntry = {
            id: generateId(),
            type: ActivityType.REASONING_COMPLETED,
            message: data.prompt || 'Completed thinking',
            timestamp: (data.timestamp ? data.timestamp * 1000 : Date.now()),
            data: {
              ...data,
              title: `${AGENT_NAME} completed thinking`
            },
            reasoningType: 'thinking'
          };
          return [logEntry, ...prevEntries];
        }
        
        // Update the existing entry
        const updatedEntries = [...prevEntries];
        updatedEntries[startIndex] = {
          ...updatedEntries[startIndex],
          type: ActivityType.REASONING_COMPLETED,
          message: updatedEntries[startIndex].data.prompt || '',
          data: {
            ...updatedEntries[startIndex].data,
            ...data,
            title: `${AGENT_NAME} completed thinking`,
            originalPrompt: updatedEntries[startIndex].data.prompt
          },
          isLoading: false
        };
        
        return updatedEntries;
      }
    }
  };
  
  // Special handler for aggregatable events
  AGGREGATABLE_EVENTS.forEach(eventType => {
    logGenerators[eventType] = {
      generateLog: () => null, // We handle these in a special way via updateAggregatedLog
    };
  });
  
  // Function to update aggregated logs
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
        const aggregateData: AggregateData = existingEntry.data || {
          eventType: 'morpho_events',
          count: 0,
          markets: [],
          totalAmount: 0,
          firstTimestamp: timestamp,
          lastTimestamp: timestamp,
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
        
        return updatedEntries;
      }
      
      // Create a new aggregated entry
      const newAggregateData: AggregateData = {
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
        id: generateId('agg'),
        type: 'morpho_events',
        message: generateAggregatedMessage(newAggregateData),
        timestamp,
        data: newAggregateData,
        isAggregated: true
      };
      
      return [newEntry, ...prevEntries];
    });
  };
  
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
        
        // Check if we have a generator for this activity type
        const generator = logGenerators[activityType];
        
        if (generator) {
          // Check if this event updates an existing entry
          if (generator.updateExisting) {
            const updatedEntries = generator.updateExisting(liveLogEntries, logData.data);
            if (updatedEntries) {
              setLiveLogEntries(updatedEntries.slice(0, 100)); // Keep the latest 100 logs
            }
          }
          
          // Generate a new log if needed
          const logEntry = generator.generateLog(activityType, logData.data);
          if (logEntry) {
            setLiveLogEntries(prev => [logEntry, ...prev].slice(0, 100));
          }
        }
        
        // Special handling for aggregatable events
        if (AGGREGATABLE_EVENTS.includes(activityType)) {
          updateAggregatedLog(activityType, logData.data);
        }
      }
    } catch (error) {
      console.error("Failed to parse log message", error);
    }
  }, [logs, connected]);
  
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (aggregationTimer.current) {
        clearTimeout(aggregationTimer.current);
      }
    };
  }, []);
  
  return {
    logs: liveLogEntries,
    isLoading: false,
    error: null,
  };
} 