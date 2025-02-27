import { useEffect, useState, useRef } from 'react';
import { useWebSocket } from '@/contexts/WebSocketContext';
import { AGENT_NAME, ActivityType } from '@/utils/constants';


// Define status categories to group related activities
enum StatusCategory {
  NONE = 'none', // no effect on status
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
  [ActivityType.AGENT_STARTED]: StatusCategory.IDLE,
  [ActivityType.AGENT_STOPPING]: StatusCategory.IDLE,
  [ActivityType.UNKNOWN]: StatusCategory.NONE,
  
  [ActivityType.MESSAGE_RECEIVED]: StatusCategory.MESSAGE,
  [ActivityType.MESSAGE_RESPONDING]: StatusCategory.MESSAGE,
  
  [ActivityType.PERIODIC_ANALYSIS_STARTED]: StatusCategory.REPORT,
  [ActivityType.PERIODIC_ANALYSIS_COMPLETED]: StatusCategory.REPORT,
  
  [ActivityType.TX_REALLOCATION]: StatusCategory.TRANSACTION,
  [ActivityType.TX_GET_ASSET_SHARE]: StatusCategory.TRANSACTION,
  
  // Data fetching activities
  [ActivityType.MARKET_DATA_FETCHED]: StatusCategory.DATA_FETCHING,
  [ActivityType.DATA_FETCHING_STARTED]: StatusCategory.NONE,
  [ActivityType.VAULT_DATA_FETCHED]: StatusCategory.NONE,
  
  // Data Fetched => Show analysing
  
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

// Simplified category configuration without color and severity
const CATEGORY_CONFIG: Record<StatusCategory, {
  priority: number;
  displayDuration: number;
  emoji: string;
  text: string;
}> = {
  [StatusCategory.IDLE]: {
    priority: 5,
    displayDuration: 0, // Forever
    emoji: '😎',
    text: `${AGENT_NAME} is chilling`
  },
  [StatusCategory.TRANSACTION]: {
    priority: 1, // Highest
    displayDuration: 3000, // 3 second
    emoji: '⚙️',
    text: `${AGENT_NAME} is processing transactions`
  },
  [StatusCategory.ANALYSIS]: {
    priority: 1,
    displayDuration: 8000, // 8 seconds
    emoji: '🧠',
    text: `${AGENT_NAME} is thinking`
  },
  [StatusCategory.REPORT]: {
    priority: 1,
    displayDuration: 5000, // 5 seconds
    emoji: '📊',
    text: `${AGENT_NAME} is working on the hourly report`
  },
  [StatusCategory.MESSAGE]: {
    priority: 2,
    displayDuration: 5000, // 5 seconds
    emoji: '💬',
    text: `${AGENT_NAME} is handling messages`
  },
  [StatusCategory.READING_EVENT_LOG]: {
    priority: 4,
    displayDuration: 5000, // 5 seconds
    emoji: '👀',
    text: `${AGENT_NAME} is reading onchain events`
  },
  [StatusCategory.DATA_FETCHING]: {
    priority: 2,
    displayDuration: 5000, // 5 seconds
    emoji: '📡',
    text: `${AGENT_NAME} is fetching live data`
  },
  [StatusCategory.NONE]: {
    priority: 0,
    displayDuration: 0,
    emoji: '',
    text: ''
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
    // Skip updating for NONE category
    if (category === StatusCategory.NONE) return;
    
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
  
  const getStatusSeverity = () => {
    if (status.activity === ActivityType.AGENT_STARTED) {
      return 'success';
    }
    
    return 'info'; // Default severity
  };
  
  const isActivity = (checkActivity: ActivityType) => {
    return status.activity === checkActivity;
  };

  return {
    status,
    isActivity,
    getStatusMessage,
    getStatusEmoji,
    getStatusSeverity,
    isConnected: connected,
    isReconnecting: reconnecting
  };
} 