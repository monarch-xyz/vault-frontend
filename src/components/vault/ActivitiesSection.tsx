import { useState } from 'react';
import { Modal, ModalContent, ModalBody } from '@nextui-org/modal';
import { format } from 'date-fns';
import moment from 'moment';
import { BiBrain, BiTransfer, BiChevronRight } from 'react-icons/bi';
import { TbReportAnalytics } from 'react-icons/tb';
import { Badge } from '@/components/common/Badge';
import { Spinner } from '@/components/common/Spinner';
import { MarkdownText } from '@/components/MarkdownText';
import { useActivities } from '@/hooks/useActivities';
import { useVaultReallocations } from '@/hooks/useVaultReallocations';
import { ReallocationActivity } from '@/components/vault/ReallocationActivity';

const activityTypes = {
  action: {
    label: 'Action',
    order: 1,
    description: 'On-chain reallocation transactions',
    icon: BiTransfer,
    bgColor: 'bg-green-50/50 dark:bg-green-950/30',
    borderColor: 'border-green-100 dark:border-green-900',
    iconColor: 'text-green-600 dark:text-green-400',
    badgeColor: 'bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300',
    subTypes: {
      reallocation: 'Reallocation',
    },
  },
  report: {
    label: 'Report',
    order: 2,
    description: 'Periodic summaries and market updates',
    icon: TbReportAnalytics,
    bgColor: 'bg-blue-50/50 dark:bg-blue-950/30',
    borderColor: 'border-blue-100 dark:border-blue-900',
    iconColor: 'text-blue-600 dark:text-blue-400',
    badgeColor: 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300',
    subTypes: {
      daily: 'Daily Summary',
      market: 'Market Update',
      hourly: 'Hourly Update',
    },
  },
  think: {
    label: 'Thought',
    order: 3,
    description: 'Agent reasoning and analysis process',
    icon: BiBrain,
    bgColor: 'bg-purple-50/50 dark:bg-purple-950/30',
    borderColor: 'border-purple-100 dark:border-purple-900',
    iconColor: 'text-purple-600 dark:text-purple-400',
    badgeColor: 'bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-300',
    subTypes: {
      analysis: 'Analysis',
      strategy: 'Strategy',
    },
  },
} as const;

type ActivityEntry = {
  text: string;
  type: string;
  sub_type: string;
  timestamp: string;
  metadata?: Record<string, any>;
};

function ActivityMessage({ entry }: { entry: ActivityEntry }) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { type, sub_type, text, timestamp, metadata } = entry;
  const activityType = activityTypes[type as keyof typeof activityTypes];

  if (!activityType) return null;

  return (
    <>
      <div
        className={`
          cursor-pointer rounded-lg border p-3 transition-all
          ${activityType.bgColor} ${activityType.borderColor}
          group overflow-hidden hover:scale-[1.01]
          hover:bg-opacity-75
        `}
        onClick={() => setIsModalOpen(true)}
      >
        <div className="mb-2 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <activityType.icon className={`h-4 w-4 ${activityType.iconColor}`} />
            <Badge variant="default" size="sm" className={activityType.badgeColor}>
              {activityType.subTypes[sub_type as keyof typeof activityType.subTypes] || sub_type}
            </Badge>
            {metadata?.protocol && (
              <span className="text-xs text-gray-500">
                {metadata.protocol}
                {metadata.apy && ` (${metadata.apy}% APY)`}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-gray-500">{moment(timestamp).fromNow()}</span>
            <BiChevronRight className="h-4 w-4 text-gray-400 transition-transform group-hover:translate-x-0.5" />
          </div>
        </div>
        {/* Preview text without markdown */}
        <div className="line-clamp-2 overflow-hidden text-sm">{text}</div>
      </div>

      {/* Detail Modal - Updated styling */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        classNames={{
          base: 'bg-surface rounded-lg font-zen border shadow-lg', // Solid background
          body: 'p-0', // Remove default padding
          backdrop: 'bg-black/50', // Darker backdrop
        }}
        size="2xl"
      >
        <ModalContent>
          <ModalBody>
            <div className="hide-scrollbar max-h-[80vh] overflow-y-auto">
              <div className="p-8">
                {/* Header */}
                <div className="mb-4 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <activityType.icon className={`h-4 w-4 ${activityType.iconColor}`} />
                    <Badge variant="default" size="sm" className={activityType.badgeColor}>
                      {activityType.subTypes[sub_type as keyof typeof activityType.subTypes] ||
                        sub_type}
                    </Badge>
                    {metadata?.protocol && (
                      <span className="text-xs text-gray-500">
                        {metadata.protocol}
                        {metadata.apy && ` (${metadata.apy}% APY)`}
                      </span>
                    )}
                  </div>
                  <span className="text-xs text-gray-500">
                    {format(new Date(timestamp), 'MMM d, yyyy HH:mm:ss')}
                  </span>
                </div>

                {/* Content with markdown */}
                <div className={`text-sm ${activityType.bgColor} rounded-lg p-4`}>
                  <MarkdownText text={text} />
                </div>

                {/* Transaction hash if exists */}
                {metadata?.txHash && (
                  <div className="mt-4 text-xs text-gray-500">
                    TX: {metadata.txHash.slice(0, 6)}...{metadata.txHash.slice(-4)}
                  </div>
                )}
              </div>
            </div>
          </ModalBody>
        </ModalContent>
      </Modal>
    </>
  );
}

export function ActivitiesSection({ selectedType = 'all' }: { selectedType?: string }) {
  const { activities, isLoading: activitiesLoading, error: activitiesError } = useActivities();
  const { reallocations, isLoading: reallocationsLoading, error: reallocationsError } = useVaultReallocations();

  const isLoading = activitiesLoading || reallocationsLoading;
  const error = activitiesError || reallocationsError;

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

  // Format regular activities
  const regularEntries = activities.map((memory) => ({
    text: memory.text,
    type: memory.type,
    sub_type: memory.sub_type || '',
    timestamp: memory.created_at,
    metadata: {},
  }));

  // Combine regular activities and reallocation activities based on selectedType
  let allEntries = [];
  
  if (selectedType === 'all' || selectedType === 'action') {
    // Include reallocations when showing 'all' or 'action' types
    allEntries = [
      ...regularEntries,
      ...reallocations.map(reallocation => ({
        type: 'reallocation',
        reallocation,
        timestamp: new Date(reallocation.timestamp * 1000).toISOString(),
      })),
    ];
  } else {
    // Only include regular activities for other types
    allEntries = regularEntries;
  }
  
  // Sort all entries by timestamp
  allEntries.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  // Filter entries based on selectedType
  const filteredEntries =
    selectedType === 'all'
      ? allEntries
      : allEntries.filter(entry => {
          if ('reallocation' in entry) {
            return selectedType === 'action';
          }
          return entry.type.toLowerCase() === selectedType;
        });

  // Get the appropriate icon for empty state
  const EmptyIcon =
    selectedType === 'all'
      ? BiBrain
      : activityTypes[selectedType as keyof typeof activityTypes]?.icon;

  const emptyIconColor =
    selectedType === 'all'
      ? 'text-gray-400'
      : activityTypes[selectedType as keyof typeof activityTypes]?.iconColor;

  return (
    <div className="hide-scrollbar h-full overflow-y-auto">
      {filteredEntries.length === 0 ? (
        <div className="flex h-full flex-col items-center justify-center space-y-2 py-8 text-center">
          <EmptyIcon className={`h-8 w-8 ${emptyIconColor} opacity-40`} />
          <div className="text-sm text-gray-500">
            {selectedType === 'all'
              ? 'No activities yet...'
              : `No ${activityTypes[
                  selectedType as keyof typeof activityTypes
                ]?.label.toLowerCase()} activities yet...`}
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          {filteredEntries.map((entry, index) => {
            // Render reallocation activity
            if ('reallocation' in entry) {
              return <ReallocationActivity key={`reallocation-${index}`} reallocation={entry.reallocation} />;
            }
            
            // Render standard activity
            return <ActivityMessage key={`activity-${entry.timestamp}-${index}`} entry={entry as ActivityEntry} />;
          })}
        </div>
      )}
    </div>
  );
}
