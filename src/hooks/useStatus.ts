import { useEffect, useState, useRef } from 'react';
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
  
  // Data fetching activities
  MARKET_DATA_FETCHED = "market_data_fetched",
  VAULT_DATA_FETCHED = "vault_data_fetched",
  
  // Reasoning activities
  REASONING_STARTED = "reasoning_started",
  REASONING_COMPLETED = "reasoning_completed",
  
  // Transaction activities
  TX_REALLOCATION = "tx_reallocation",
  TX_GET_ASSET_SHARE = "tx_get_asset_share",
  
  // Default state when no logs are available
  UNKNOWN = "unknown"
}

// Define status categories to group related activities
enum StatusCategory {
  IDLE = 'idle',
  TRANSACTION = 'transaction',
  ANALYSIS = 'analysis',
  MESSAGE = 'message',
  READING_EVENT_LOG = 'reading_event_log',
  REPORT = 'report',
  DATA_FETCHING = 'data_fetching',
}

// Map activities to categories. Each "category" is a status that is displayed in the status bar.
const ACTIVITY_TO_CATEGORY: Record<ActivityType, StatusCategory> = {
  [ActivityType.IDLE]: StatusCategory.IDLE,
  [ActivityType.UNKNOWN]: StatusCategory.IDLE,
  [ActivityType.AGENT_STARTED]: StatusCategory.IDLE,
  [ActivityType.AGENT_STOPPING]: StatusCategory.IDLE,
  
  [ActivityType.MESSAGE_RECEIVED]: StatusCategory.MESSAGE,
  [ActivityType.MESSAGE_RESPONDING]: StatusCategory.MESSAGE,
  
  [ActivityType.PERIODIC_ANALYSIS_STARTED]: StatusCategory.REPORT,
  [ActivityType.PERIODIC_ANALYSIS_COMPLETED]: StatusCategory.REPORT,
  
  [ActivityType.TX_REALLOCATION]: StatusCategory.TRANSACTION,
  [ActivityType.TX_GET_ASSET_SHARE]: StatusCategory.TRANSACTION,
  
  // Data fetching activities
  [ActivityType.MARKET_DATA_FETCHED]: StatusCategory.DATA_FETCHING,
  [ActivityType.VAULT_DATA_FETCHED]: StatusCategory.DATA_FETCHING,
  
  // Reasoning activities
  [ActivityType.REASONING_STARTED]: StatusCategory.ANALYSIS,
  [ActivityType.REASONING_COMPLETED]: StatusCategory.ANALYSIS,
  
  // All chain events map to the same category
  [ActivityType.MB_DEPOSIT_DETECTED]: StatusCategory.READING_EVENT_LOG,
  [ActivityType.MB_WITHDRAWAL_DETECTED]: StatusCategory.READING_EVENT_LOG,
  [ActivityType.MB_BORROW_DETECTED]: StatusCategory.READING_EVENT_LOG,
  [ActivityType.MB_REPAY_DETECTED]: StatusCategory.READING_EVENT_LOG,
  [ActivityType.MV_DEPOSIT_DETECTED]: StatusCategory.READING_EVENT_LOG,
  [ActivityType.MV_WITHDRAWAL_DETECTED]: StatusCategory.READING_EVENT_LOG,
};

// Simplified category configuration with emoji and text per category
const CATEGORY_CONFIG: Record<StatusCategory, {
  priority: number;
  displayDuration: number;
  emoji: string;
  text: string;
  color: string;
  severity: 'info' | 'success' | 'warning' | 'error';
}> = {
  [StatusCategory.IDLE]: {
    priority: 5,
    displayDuration: 0, // Forever
    emoji: '😎',
    text: `${AGENT_NAME} is chilling`,
    color: 'bg-green-500',
    severity: 'info'
  },
  [StatusCategory.TRANSACTION]: {
    priority: 1, // Highest
    displayDuration: 3000, // 3 second
    emoji: '⚙️',
    text: `${AGENT_NAME} is processing transactions`,
    color: 'bg-purple-500',
    severity: 'warning'
  },
  [StatusCategory.ANALYSIS]: {
    priority: 1,
    displayDuration: 5000, // 5 seconds
    emoji: '🧠',
    text: `${AGENT_NAME} is thinking`,
    color: 'bg-yellow-500',
    severity: 'info'
  },
  [StatusCategory.REPORT]: {
    priority: 1,
    displayDuration: 5000, // 5 seconds
    emoji: '📊',
    text: `${AGENT_NAME} is working on the hourly report`,
    color: 'bg-blue-500',
    severity: 'info'
  },
  [StatusCategory.MESSAGE]: {
    priority: 2,
    displayDuration: 3000, // 3 seconds
    emoji: '💬',
    text: `${AGENT_NAME} is handling messages`,
    color: 'bg-blue-500',
    severity: 'info'
  },
  [StatusCategory.READING_EVENT_LOG]: {
    priority: 4,
    displayDuration: 5000, // 5 seconds
    emoji: '👀',
    text: `${AGENT_NAME} is reading onchain events`,
    color: 'bg-purple-500',
    severity: 'info'
  },
  [StatusCategory.DATA_FETCHING]: {
    priority: 3,
    displayDuration: 3000, // 3 seconds
    emoji: '📡',
    text: `${AGENT_NAME} is fetching live data`,
    color: 'bg-blue-400',
    severity: 'info'
  }
};

// Status info interface
interface StatusInfo {
  activity: ActivityType;        // The specific activity
  category: StatusCategory;      // The category this activity belongs to
  timestamp: number;             // When this status was set
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
    category: StatusCategory.IDLE,
    timestamp: Date.now()
  });
  
  // Single timer reference for the current status
  const statusTimer = useRef<NodeJS.Timeout | null>(null);
  
  // Process incoming log messages
  useEffect(() => {
    if (!logs.length || !connected) return;
    
    try {
      // Parse the latest log
      const latestLog = logs[logs.length - 1];
      const logData = JSON.parse(latestLog) as LogMessage;
      
      // Check if it's an activity message
      if (logData.type === 'activity' && logData.data && logData.data.type) {
        const activity = logData.data.type as ActivityType;
        
        // Check if this activity type is in our enum
        if (Object.values(ActivityType).includes(activity)) {
          const category = ACTIVITY_TO_CATEGORY[activity] || StatusCategory.IDLE;
          updateStatus(activity, category, logData.data.timestamp);
        }
      }
    } catch (error) {
      console.error("Failed to parse log message", error);
    }
  }, [logs, connected]);
  
  // Handle agent startup case
  useEffect(() => {
    if (connected && logs.length === 0) {
      // When first connected but no logs yet, set to IDLE
      updateStatus(ActivityType.IDLE, StatusCategory.IDLE, Date.now());
    }
  }, [connected, logs.length]);
  
  // Update the status and manage the timer
  const updateStatus = (activity: ActivityType, category: StatusCategory, timestamp: number = Date.now()) => {
    const now = Date.now();
    const categoryConfig = CATEGORY_CONFIG[category];
    const currentPriority = CATEGORY_CONFIG[status.category].priority;
    const newPriority = categoryConfig.priority;
    
    // Only update status if the new one has higher or equal priority
    if (newPriority <= currentPriority) {
      // Update status
      setStatus({
        activity,
        category,
        timestamp: timestamp || now
      });
      
      // Clear any existing timer
      if (statusTimer.current) {
        clearTimeout(statusTimer.current);
        statusTimer.current = null;
      }
      
      // Set a new timer if this category has a display duration
      if (categoryConfig.displayDuration > 0) {
        statusTimer.current = setTimeout(() => {
          // After duration, revert to IDLE
          setStatus({
            activity: ActivityType.IDLE,
            category: StatusCategory.IDLE,
            timestamp: Date.now()
          });
          statusTimer.current = null;
        }, categoryConfig.displayDuration);
      }
    }
  };
  
  // Clean up timer on unmount
  useEffect(() => {
    return () => {
      if (statusTimer.current) {
        clearTimeout(statusTimer.current);
      }
    };
  }, []);
  
  // Rest of your utility functions
  const getStatusMessage = () => {
    // Special case for agent started
    if (status.activity === ActivityType.AGENT_STARTED) {
      return `${AGENT_NAME} is now online!`;
    }
    
    // For all other categories, use the category text
    return CATEGORY_CONFIG[status.category].text;
  };
  
  const getStatusEmoji = () => {
    // Special case for agent started
    if (status.activity === ActivityType.AGENT_STARTED) {
      return '🚀';
    }
    
    // For all other categories, use the category emoji
    return CATEGORY_CONFIG[status.category].emoji;
  };
  
  const getStatusColor = () => {
    return CATEGORY_CONFIG[status.category].color;
  };
  
  const getStatusSeverity = () => {
    if (status.activity === ActivityType.AGENT_STARTED) {
      return 'success';
    }
    
    return CATEGORY_CONFIG[status.category].severity;
  };
  
  const isActivity = (checkActivity: ActivityType) => {
    return status.activity === checkActivity;
  };

  return {
    status,
    isActivity,
    getStatusMessage,
    getStatusEmoji,
    getStatusColor,
    getStatusSeverity,
    isConnected: connected,
    isReconnecting: reconnecting
  };
} 