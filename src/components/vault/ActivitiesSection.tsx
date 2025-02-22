import { useActivities } from '@/hooks/useActivities'
import { useLogStream } from '@/hooks/useLogStream'
import { format } from 'date-fns'
import { Badge } from '@/components/common/Badge'
import { BiBrain, BiTransfer, BiInfoCircle } from 'react-icons/bi'

const activityTypes = {
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
  report: {
    label: 'Report',
    description: 'Periodic summaries and market updates',
    icon: BiInfoCircle,
    bgColor: 'bg-blue-50/50 dark:bg-blue-950/30',
    borderColor: 'border-blue-100 dark:border-blue-900',
    iconColor: 'text-blue-600 dark:text-blue-400',
    badgeColor: 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300',
    subTypes: {
      daily: 'Daily Summary',
      market: 'Market Update',
      hourly: 'Hourly Update'
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
  const { logs } = useLogStream();
  const { activities } = useActivities();
  
  // Combine and format entries
  const allEntries = [
    ...activities.map(memory => ({
      text: memory.text,
      type: memory.type,
      sub_type: memory.sub_type || '',
      timestamp: memory.created_at,
      metadata: {}
    })),
    ...logs.map(log => ({
      text: log.details.text,
      type: log.type.split(':')[0],
      sub_type: log.type.split(':')[1],
      timestamp: log.timestamp,
      metadata: log.details.metadata
    }))
  ].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  // Filter entries based on selectedType
  const filteredEntries = selectedType === 'all'
    ? allEntries
    : allEntries.filter(entry => entry.type.toLowerCase() === selectedType);

  return (
    <div className="space-y-4">
      {filteredEntries.length === 0 ? (
        <div className="flex h-full flex-col items-center justify-center space-y-2 text-center">
          <BiBrain className="h-8 w-8 text-purple-600 dark:text-purple-400 opacity-40" />
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