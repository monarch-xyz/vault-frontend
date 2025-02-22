import { useActivities } from '@/hooks/useActivities'
import { format } from 'date-fns'
import { Badge } from '@/components/common/Badge'
import { BiBrain, BiTransfer } from 'react-icons/bi'
import { TbReportAnalytics } from 'react-icons/tb'
import { Spinner } from '@/components/common/Spinner'

const activityTypes = {
  report: {
    label: 'Report',
    description: 'Periodic summaries and market updates',
    icon: TbReportAnalytics,
    bgColor: 'bg-blue-50/50 dark:bg-blue-950/30',
    borderColor: 'border-blue-100 dark:border-blue-900',
    iconColor: 'text-blue-600 dark:text-blue-400',
    badgeColor: 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300',
    subTypes: {
      daily: 'Daily Summary',
      market: 'Market Update',
      hourly: 'Hourly Update'
    }
  },
  think: {
    label: 'Thought',
    description: 'Agent reasoning and analysis process',
    icon: BiBrain,
    bgColor: 'bg-purple-50/50 dark:bg-purple-950/30',
    borderColor: 'border-purple-100 dark:border-purple-900',
    iconColor: 'text-purple-600 dark:text-purple-400',
    badgeColor: 'bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-300',
    subTypes: {
      analysis: 'Analysis',
      strategy: 'Strategy'
    }
  },
  action: {
    label: 'Action',
    description: 'On-chain reallocation transactions',
    icon: BiTransfer,
    bgColor: 'bg-green-50/50 dark:bg-green-950/30',
    borderColor: 'border-green-100 dark:border-green-900',
    iconColor: 'text-green-600 dark:text-green-400',
    badgeColor: 'bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300',
    subTypes: {
      reallocation: 'Reallocation'
    }
  }
} as const;

type ActivityEntry = {
  text: string;
  type: string;
  sub_type: string;
  timestamp: string;
  metadata?: Record<string, any>;
};

function ActivityMessage({ entry }: { entry: ActivityEntry }) {
  const { type, sub_type, text, timestamp, metadata } = entry;

  const activityType = activityTypes[type as keyof typeof activityTypes];

  if (!activityType) {
    console.log(entry);
    return null;
  }

  console.log(entry, activityType);
  
  return (
    <div className={`rounded-lg border p-3 ${activityType.bgColor} ${activityType.borderColor}`}>
      <div className="mb-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <activityType.icon className={`h-4 w-4 ${activityType.iconColor}`} />
          <Badge
            variant="default"
            size="sm"
            className={activityType.badgeColor}
          >
            {activityType.subTypes[sub_type as keyof typeof activityType.subTypes] || sub_type}
          </Badge>
          {metadata?.protocol && (
            <span className="text-xs text-gray-500">
              {metadata.protocol}
              {metadata.apy && ` (${metadata.apy}% APY)`}
            </span>
          )}
        </div>
        <span className="text-[10px] text-gray-500">
          {format(new Date(timestamp), 'HH:mm:ss')}
        </span>
      </div>
      <div className="mb-3">
        <p className="text-sm whitespace-pre-wrap">
          {text}
        </p>
        {metadata?.txHash && (
          <div className="mt-2 text-xs text-gray-500">
            TX: {metadata.txHash.slice(0, 6)}...{metadata.txHash.slice(-4)}
          </div>
        )}
      </div>
    </div>
  );
}

export function ActivitiesSection({ selectedType = 'all' }: { selectedType?: string }) {
  const { activities, isLoading, error } = useActivities();
  
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
        <p>Failed to load activities</p>
        <p className="text-sm">{error}</p>
      </div>
    );
  }

  // Combine and format entries
  const allEntries = [
    ...activities.map(memory => ({
      text: memory.text,
      type: memory.type,
      sub_type: memory.sub_type || '',
      timestamp: memory.created_at,
      metadata: {}
    })),
  ].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  // Filter entries based on selectedType
  const filteredEntries = selectedType === 'all'
    ? allEntries
    : allEntries.filter(entry => entry.type.toLowerCase() === selectedType);

  // Get the appropriate icon for empty state
  const EmptyIcon = selectedType === 'all' 
    ? BiBrain 
    : activityTypes[selectedType as keyof typeof activityTypes]?.icon;

  const emptyIconColor = selectedType === 'all'
    ? 'text-gray-400'
    : activityTypes[selectedType as keyof typeof activityTypes]?.iconColor;

  return (
    <div className="space-y-4">
      {filteredEntries.length === 0 ? (
        <div className="flex h-full flex-col items-center justify-center space-y-2 text-center">
          <EmptyIcon className={`h-8 w-8 ${emptyIconColor} opacity-40`} />
          <div className="text-sm text-gray-500">
            {selectedType === 'all' 
              ? 'No activities yet...'
              : `No ${activityTypes[selectedType as keyof typeof activityTypes]?.label.toLowerCase()} activities yet...`
            }
          </div>
        </div>
      ) : (
        filteredEntries.map((entry, index) => (
          <ActivityMessage 
            key={entry.timestamp + index}
            entry={entry}
          />
        ))
      )}
    </div>
  );
} 