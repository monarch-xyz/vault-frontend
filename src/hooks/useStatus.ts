import { useEffect, useState } from 'react';
import { useWebSocket } from '@/contexts/WebSocketContext';
import { AGENT_NAME } from '@/utils/constants';

// Define all possible activity types
export enum ActivityType {
  // Agent lifecycle
  AGENT_STARTED = "agent_started",
  IDLE = "idle",
  AGENT_STOPPING = "agent_stopping",
  
  // Message handling
  MESSAGE_RECEIVED = "message_received",
  MESSAGE_RESPONDING = "message_responding",
  
  // Morpho Blue activities
  MB_DEPOSIT_DETECTED = "morpho_blue_deposit_detected",
  MB_WITHDRAWAL_DETECTED = "morpho_blue_withdrawal_detected",
  MB_BORROW_DETECTED = "morpho_blue_borrow_detected",
  MB_REPAY_DETECTED = "morpho_blue_repay_detected",
  
  // Morpho Vault activities
  MV_DEPOSIT_DETECTED = "morpho_vault_deposit_detected",
  MV_WITHDRAWAL_DETECTED = "morpho_vault_withdrawal_detected",
  
  // Periodic activities
  PERIODIC_ANALYSIS_STARTED = "periodic_analysis_started",
  PERIODIC_ANALYSIS_COMPLETED = "periodic_analysis_completed",
  
  // Transaction activities
  TX_REALLOCATION = "tx_reallocation",
  TX_GET_ASSET_SHARE = "tx_get_asset_share",
  
  // Default state when no logs are available
  UNKNOWN = "unknown",
  
  // Connection status (not an actual activity)
  DISCONNECTED = "disconnected",
  
  // New state for reconnecting
  RECONNECTING = "reconnecting"
}

// Configuration for activity statuses
type StatusConfig = {
  [key in ActivityType]: {
    statusText: string;
    emoji: string;
    severity?: 'info' | 'success' | 'warning' | 'error';
    color?: string;
  }
};

// Centralized configuration for all activity statuses
const STATUS_CONFIG: StatusConfig = {
  [ActivityType.IDLE]: {
    statusText: `${AGENT_NAME} is chilling`,
    emoji: '😎',
    severity: 'info',
    color: 'bg-green-500'
  },
  [ActivityType.AGENT_STARTED]: {
    statusText: `${AGENT_NAME} is now online and ready!`,
    emoji: '🚀',
    severity: 'success',
    color: 'bg-blue-500'
  },
  [ActivityType.AGENT_STOPPING]: {
    statusText: `${AGENT_NAME} is going to sleep...`,
    emoji: '💤',
    severity: 'warning',
    color: 'bg-orange-500'
  },
  [ActivityType.MESSAGE_RECEIVED]: {
    statusText: `${AGENT_NAME} just got a new message`,
    emoji: '📩',
    severity: 'info',
    color: 'bg-blue-500'
  },
  [ActivityType.MESSAGE_RESPONDING]: {
    statusText: `${AGENT_NAME} is cooking up a response...`,
    emoji: '👨‍🍳',
    severity: 'info',
    color: 'bg-blue-500'
  },
  [ActivityType.PERIODIC_ANALYSIS_STARTED]: {
    statusText: `${AGENT_NAME} is working on the hourly report`,
    emoji: '📊',
    severity: 'info',
    color: 'bg-yellow-500'
  },
  [ActivityType.PERIODIC_ANALYSIS_COMPLETED]: {
    statusText: `${AGENT_NAME} just completed the analysis`,
    emoji: '🎯',
    severity: 'success',
    color: 'bg-green-500'
  },
  [ActivityType.MB_DEPOSIT_DETECTED]: {
    statusText: `${AGENT_NAME} found a new deposit on Morpho Blue!`,
    emoji: '💰',
    severity: 'success',
    color: 'bg-purple-500'
  },
  [ActivityType.MB_WITHDRAWAL_DETECTED]: {
    statusText: `${AGENT_NAME} spotted a withdrawal on Morpho Blue`,
    emoji: '💸',
    severity: 'info',
    color: 'bg-purple-500'
  },
  [ActivityType.MB_BORROW_DETECTED]: {
    statusText: `${AGENT_NAME} noticed someone borrowed on Morpho Blue`,
    emoji: '🏦',
    severity: 'info',
    color: 'bg-purple-500'
  },
  [ActivityType.MB_REPAY_DETECTED]: {
    statusText: `${AGENT_NAME} saw a loan repayment on Morpho Blue`,
    emoji: '✅',
    severity: 'success',
    color: 'bg-purple-500'
  },
  [ActivityType.MV_DEPOSIT_DETECTED]: {
    statusText: `${AGENT_NAME} found a new deposit on Morpho Vault!`,
    emoji: '💎',
    severity: 'success',
    color: 'bg-purple-500'
  },
  [ActivityType.MV_WITHDRAWAL_DETECTED]: {
    statusText: `${AGENT_NAME} spotted a withdrawal on Morpho Vault`,
    emoji: '📤',
    severity: 'info',
    color: 'bg-purple-500'
  },
  [ActivityType.TX_REALLOCATION]: {
    statusText: `${AGENT_NAME} is submitting a reallocation tx...`,
    emoji: '⚙️',
    severity: 'warning',
    color: 'bg-purple-500'
  },
  [ActivityType.TX_GET_ASSET_SHARE]: {
    statusText: `${AGENT_NAME} is checking asset shares...`,
    emoji: '🔍',
    severity: 'info',
    color: 'bg-purple-500'
  },
  [ActivityType.UNKNOWN]: {
    statusText: `${AGENT_NAME} is watching the markets...`,
    emoji: '👀',
    severity: 'info',
    color: 'bg-gray-500'
  },
  [ActivityType.DISCONNECTED]: {
    statusText: `${AGENT_NAME} is offline`,
    emoji: '😴',
    severity: 'error',
    color: 'bg-red-500'
  },
  [ActivityType.RECONNECTING]: {
    statusText: `${AGENT_NAME} is reconnecting...`,
    emoji: '🔄',
    severity: 'info',
    color: 'bg-yellow-500'
  }
};

// Interface for status information
interface StatusInfo {
  activity: ActivityType;
  timestamp: number;
  metadata?: any; // Optional additional data from the log
}

// Interface for the log message format
interface LogMessage {
  type: string;
  data: {
    type: string;
    timestamp: number;
    sender?: string;
    [key: string]: any; // Other potential fields
  }
}

export function useStatus() {
  const { logs, connected, reconnecting } = useWebSocket();
  const [status, setStatus] = useState<StatusInfo>({
    activity: ActivityType.UNKNOWN,
    timestamp: Date.now()
  });

  useEffect(() => {
    // If there are no logs or not connected, don't update
    if (!logs.length || !connected) return;
    
    try {
      // Parse the latest log
      const latestLog = logs[logs.length - 1];
      const logData = JSON.parse(latestLog) as LogMessage;
      
      // Check if it's an activity message
      if (logData.type === 'activity' && logData.data && logData.data.type) {
        const activityType = logData.data.type;
        
        // Check if this activity type is in our enum
        if (Object.values(ActivityType).includes(activityType as ActivityType)) {
          setStatus({
            activity: activityType as ActivityType,
            timestamp: logData.data.timestamp || Date.now(),
            metadata: { ...logData.data }
          });
        }
      }
    } catch (error) {
      console.error("Failed to parse log message", error);
    }
  }, [logs, connected]);

  // For debugging
  console.log('Logs:', logs);
  console.log('Current status:', status);

  // Get the current status config
  const getCurrentStatusConfig = () => {
    if (!connected) {
      return reconnecting 
        ? STATUS_CONFIG[ActivityType.RECONNECTING]
        : STATUS_CONFIG[ActivityType.DISCONNECTED];
    }
    return STATUS_CONFIG[status.activity] || STATUS_CONFIG[ActivityType.UNKNOWN];
  };

  // Utility function to check if the current activity matches
  const isActivity = (activity: ActivityType): boolean => {
    return status.activity === activity;
  };

  // Utility function to get a human-readable status message
  const getStatusMessage = (): string => {
    return getCurrentStatusConfig().statusText;
  };

  // Get the status emoji
  const getStatusEmoji = (): string => {
    return getCurrentStatusConfig().emoji;
  };

  // Get the status color for UI elements
  const getStatusColor = (): string => {
    const config = getCurrentStatusConfig();
    return `${config.color} ${status.activity !== ActivityType.UNKNOWN ? 'animate-pulse' : ''}`;
  };

  // Get the severity level (for potential alert/notification styling)
  const getStatusSeverity = (): 'info' | 'success' | 'warning' | 'error' => {
    return getCurrentStatusConfig().severity || 'info';
  };

  return {
    status,
    isActivity,
    getStatusMessage,
    getStatusEmoji,
    getStatusColor,
    getStatusSeverity,
    isConnected: connected,
    statusConfig: getCurrentStatusConfig(),
    isReconnecting: reconnecting
  };
} 