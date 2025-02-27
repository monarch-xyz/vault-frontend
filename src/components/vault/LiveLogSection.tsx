import { format, formatDistanceToNow } from 'date-fns'
import { Badge } from '@/components/common/Badge'
import { FaChartLine, FaExchangeAlt, FaInfoCircle } from 'react-icons/fa'
import { BsChatDots, BsClockHistory } from 'react-icons/bs'
import { useChat, ChatMessage } from '@/hooks/useChat'
import { useLiveLogs, LogEntry } from '@/hooks/useLiveLogs'
import { Spinner } from '@/components/common/Spinner'
import { MarkdownText } from '@/components/MarkdownText'
import { ActivityType } from '@/hooks/useStatus'
import { EnhancedChatBubble } from './EnhancedChatBubble'
import { AggregatedEventBubble } from './AggregatedEventBubble'
import { TbTool } from 'react-icons/tb'

// Component for system logs
function SystemLogBubble({ log }: { log: LogEntry }) {
  // Get appropriate icon based on log type
  const getLogIcon = () => {
    if (log.type.includes('ANALYSIS') || log.type.includes('analysis') || log.type.includes('report')) {
      return <FaChartLine className="h-3 w-3" />;
    } else if (log.type.includes('TX_')) {
      return <FaExchangeAlt className="h-3 w-3" />;
    } else if (log.type.includes('MESSAGE') || log.type.includes('reasoning')) {
      return <BsChatDots className="h-3 w-3" />;
    } else if (log.type === ActivityType.MARKET_DATA_FETCHED || log.type === ActivityType.VAULT_DATA_FETCHED) {
      return <TbTool className="h-3 w-3" />;
    } else {
      return <FaInfoCircle className="h-3 w-3" />;
    }
  };
  
  // Get label based on log type
  const getLogLabel = () => {
    if (log.type.includes('reasoning')) {
      return 'REASONING';
    } else if (log.type.includes('MESSAGE')) {
      return 'MSG';
    } else if (log.type.includes('TX_')) {
      return 'TX';
    } else if (log.type.includes('ANALYSIS') || log.type.includes('analysis')) {
      return 'ANALYSIS';
    } else if (log.type === ActivityType.MARKET_DATA_FETCHED || log.type === ActivityType.VAULT_DATA_FETCHED) {
      return 'TOOL USE';
    } else {
      return 'SYSTEM';
    }
  };
  
  // Get bubble style based on log type
  const getBubbleStyle = () => {
    if (log.type.includes('reasoning')) {
      return "rounded-lg border border-purple-200 bg-purple-50/30 p-3 dark:border-purple-800/50 dark:bg-purple-900/10";
    } else if (log.type.includes('MESSAGE')) {
      return "rounded-lg border border-blue-200 bg-blue-50/30 p-3 dark:border-blue-800/50 dark:bg-blue-900/10";
    } else if (log.type.includes('TX_')) {
      return "rounded-lg border border-yellow-200 bg-yellow-50/30 p-3 dark:border-yellow-800/50 dark:bg-yellow-900/10";
    } else if (log.type === ActivityType.AGENT_STARTED || log.type === ActivityType.AGENT_STOPPING) {
      return "rounded-lg border border-green-200 bg-green-50/30 p-3 dark:border-green-800/50 dark:bg-green-900/10";
    } else {
      return "rounded-lg border border-gray-200 bg-gray-50/30 p-3 dark:border-gray-800/50 dark:bg-gray-900/10";
    }
  };
  
  // Get text style based on log type
  const getTextStyle = () => {
    if (log.type.includes('reasoning')) {
      return "text-sm text-purple-800 dark:text-purple-200";
    } else if (log.type.includes('MESSAGE')) {
      return "text-sm text-blue-800 dark:text-blue-200";
    } else if (log.type.includes('TX_')) {
      return "text-sm text-yellow-800 dark:text-yellow-200";
    } else if (log.type === ActivityType.AGENT_STARTED || log.type === ActivityType.AGENT_STOPPING) {
      return "text-sm text-green-800 dark:text-green-200";
    } else {
      return "text-sm text-gray-800 dark:text-gray-200";
    }
  };
  
  return (
    <div className={getBubbleStyle()}>
      <div className="mb-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Badge
            variant="default"
            size="sm"
            className="bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400"
          >
            <div className="flex items-center gap-1">
              {getLogIcon()}
              <span className="text-[10px]">{getLogLabel()}</span>
            </div>
          </Badge>
          {log.isLoading && (
            <span className="flex items-center text-xs text-gray-500">
              <Spinner size={12}/> Processing...
            </span>
          )}
        </div>
        <span className="text-[10px] text-gray-500" title={format(new Date(log.timestamp), 'HH:mm:ss')}>
          {formatDistanceToNow(new Date(log.timestamp), { addSuffix: true })}
        </span>
      </div>
      <div className={getTextStyle()}>
        {log.type.includes('reasoning') ? (
          <MarkdownText text={log.message} className={getTextStyle()} />
        ) : (
          <p>{log.message}</p>
        )}
      </div>
      {log.data?.tx_hash && (
        <div className="mt-2 text-xs text-gray-500">
          <a
            href={`https://basescan.org/tx/${log.data.tx_hash}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-500 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 font-monospace"
          >
            TX: {log.data.tx_hash.slice(0, 6)}...{log.data.tx_hash.slice(-4)}
          </a>
        </div>
      )}
    </div>
  );
}

// Combined chat and logs section
export function LiveLogSection() {
  const { messages, isLoading: chatLoading, error: chatError } = useChat();
  const { logs, isLoading: logsLoading, error: logsError } = useLiveLogs();
  
  const isLoading = chatLoading || logsLoading;
  const error = chatError || logsError;

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Spinner size={24} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-full flex-col items-center justify-center text-red-500">
        <p>Failed to load data</p>
        <p className="text-sm">{error}</p>
      </div>
    );
  }

  // Function to render the appropriate log bubble based on type
  const renderLogItem = (item: { type: string; data: any; timestamp: number }) => {
    if (item.type === 'message') {
      return <EnhancedChatBubble message={item.data as ChatMessage} />;
    } else {
      const log = item.data as LogEntry;
      // If it's an aggregated log, use AggregatedEventBubble
      if (log.isAggregated) {
        return <AggregatedEventBubble log={log} />;
      } else {
        // Otherwise use SystemLogBubble
        return <SystemLogBubble log={log} />;
      }
    }
  };

  // Combine all activity in a single view
  return (
    <div className="space-y-3">
      {messages.length === 0 && logs.length === 0 ? (
        <div className="flex h-full flex-col items-center justify-center space-y-2 text-center">
          <BsClockHistory className="h-8 w-8 text-gray-600 dark:text-gray-400 opacity-40" />
          <div className="text-sm text-gray-500">No activity yet</div>
        </div>
      ) : (
        // Combine and sort messages and logs by timestamp
        [...messages.map(msg => ({ 
          type: 'message', 
          data: msg, 
          timestamp: new Date(msg.created_at).getTime() 
        })), 
        ...logs.map(log => ({ 
          type: 'log', 
          data: log, 
          timestamp: log.timestamp 
        }))]
        .sort((a, b) => b.timestamp - a.timestamp)
        .map((item) => (
          <div key={item.type === 'message' ? `msg-${item.data.id}` : `log-${item.data.id}`}>
            {renderLogItem(item)}
          </div>
        ))
      )}
    </div>
  );
} 