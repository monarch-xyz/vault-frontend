import { useState } from 'react';
import { format, formatDistanceToNow } from 'date-fns';
import { Badge } from '@/components/common/Badge';
import { FaExchangeAlt, FaChevronDown, FaChevronUp } from 'react-icons/fa';
import { MarketSpan } from '@/components/common/MarketSpan';
import { LogEntry } from '@/hooks/useLiveLogs';
import { ActivityType } from '@/utils/constants';

interface EventTransaction {
  type: string;
  amount: number;
  market_id: string;
  tx_hash: string;
  timestamp: number;
  sender?: string;
}

interface AggregatedEventBubbleProps {
  log: LogEntry;
}

export function AggregatedEventBubble({ log }: AggregatedEventBubbleProps) {
const [expanded, setExpanded] = useState(false);
  
  // Format the aggregate data from the log
  const {
    events = [],
    markets = [],
  } = log.data || {};
  
  // Group events by type
  const eventsByType: Record<string, EventTransaction[]> = {};
  events.forEach((event: EventTransaction) => {
    const type = event.type || 'unknown';
    if (!eventsByType[type]) {
      eventsByType[type] = [];
    }
    eventsByType[type].push(event);
  });
  
  // Format amount to 2 decimal places
  const formatAmount = (amount: number) => {
    return amount.toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  };
  
  // Format address
  const formatAddress = (address: string) => {
    return address?.length > 10 ? `${address.slice(0, 6)}...${address.slice(-4)}` : address;
  };
  
  // Get event type name 
  const getEventTypeName = (type: string) => {
    switch (type) {
      case ActivityType.MB_DEPOSIT_DETECTED:
        return 'Deposit';
      case ActivityType.MB_WITHDRAWAL_DETECTED:
        return 'Withdrawal';
      case ActivityType.MB_BORROW_DETECTED:
        return 'Borrow';
      case ActivityType.MB_REPAY_DETECTED:
        return 'Repay';
      case ActivityType.MV_DEPOSIT_DETECTED:
        return 'Vault Deposit';
      case ActivityType.MV_WITHDRAWAL_DETECTED:
        return 'Vault Withdrawal';
      default:
        return type.replace(/_/g, ' ').toLowerCase();
    }
  };
  
  // Get color based on event type
  const getEventTypeColor = (type: string) => {
    if (type.includes('DEPOSIT')) return 'text-green-600 dark:text-green-400';
    if (type.includes('WITHDRAWAL')) return 'text-red-600 dark:text-red-400';
    if (type.includes('BORROW')) return 'text-yellow-600 dark:text-yellow-400';
    if (type.includes('REPAY')) return 'text-blue-600 dark:text-blue-400';
    return 'text-gray-600 dark:text-gray-400';
  };
  
  return (
    <div className="rounded-lg border border-gray-200 bg-gray-50/30 p-3 dark:border-gray-800/50 dark:bg-gray-900/10">
      <div className="mb-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Badge
            variant="default"
            size="sm"
            className="bg-gray-100 text-gray-600 dark:bg-gray-800/50 dark:text-gray-300"
          >
            <div className="flex items-center gap-1">
              <FaExchangeAlt className="h-3 w-3" />
              <span className="text-[10px]">EVENTS</span>
            </div>
          </Badge>
        </div>
        <span className="text-[10px] text-gray-500" title={format(new Date(log.timestamp), 'HH:mm:ss')}>
          {formatDistanceToNow(new Date(log.timestamp), { addSuffix: true })}
        </span>
      </div>
      
      <div className="flex flex-col gap-2">
        <div className="text-sm text-gray-800 dark:text-gray-200">
          <p className="font-medium">{log.message}</p>
          <div className="mt-1 flex flex-wrap gap-1">
            {Array.isArray(markets) && markets.map((marketId: string, index: number) => (
              <MarketSpan 
                key={`${marketId}-${index}`} 
                marketId={marketId}
              />
            ))}
          </div>
        </div>
        
        <button 
          className="mt-1 flex w-full items-center justify-center gap-1 rounded border border-gray-200 bg-white/50 py-1 text-xs text-gray-500 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800/50 dark:hover:bg-gray-700/50"
          onClick={() => setExpanded(!expanded)}
        >
          {expanded ? (
            <>Show less <FaChevronUp className="h-3 w-3" /></>
          ) : (
            <>Show details <FaChevronDown className="h-3 w-3" /></>
          )}
        </button>
        
        {expanded && (
          <div className="mt-2 rounded-md border border-gray-200 bg-white/80 p-2 dark:border-gray-700 dark:bg-gray-800/50">
            <div className="overflow-auto max-h-80">
              <div className="space-y-3 text-xs">
                {Object.entries(eventsByType).map(([type, eventList]) => (
                  <div key={type} className="space-y-1">
                    <h4 className={`font-medium ${getEventTypeColor(type)}`}>
                      {getEventTypeName(type)} ({eventList.length})
                    </h4>
                    <div className="pl-2 space-y-2">
                      {eventList.map((event, idx) => (
                        <div key={`${event.tx_hash}-${idx}`} className="flex justify-between items-center gap-2 border-b pb-1 last:border-0 last:pb-0 border-gray-100 dark:border-gray-700">
                          <div>
                            <div className="flex items-center gap-1">
                              <span className="font-medium">
                                {formatAmount(event.amount)} USDC
                              </span>
                              {event.sender && (
                                <span className="text-gray-500">
                                  from {formatAddress(event.sender)}
                                </span>
                              )}
                            </div>
                            <div className="text-gray-500">
                              {event.market_id && (
                                <MarketSpan 
                                  marketId={event.market_id}
                                  className="text-[10px] px-1 py-0.5"
                                />
                              )}
                            </div>
                          </div>
                          {event.tx_hash && (
                            <a
                              href={`https://basescan.org/tx/0x${event.tx_hash}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="no-underline text-secondary hover:underline font-monospace text-xs"
                            >
                              Tx: {formatAddress(event.tx_hash)}
                            </a>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 