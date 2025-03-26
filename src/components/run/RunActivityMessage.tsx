import { useState } from 'react';
import { Modal, ModalContent, ModalBody } from '@nextui-org/modal';
import { format } from 'date-fns';
import moment from 'moment';
import { BiBrain, BiTransfer, BiChevronRight, BiTime, BiLinkExternal } from 'react-icons/bi';
import { TbReportAnalytics } from 'react-icons/tb';
import { Badge } from '@/components/common/Badge';
import { MarkdownText } from '@/components/MarkdownText';
import { Memory } from '@/lib/supabase/types';

// Extend Memory type to include metadata
type ExtendedMemory = Memory & {
  metadata?: Record<string, any>;
};

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

type RunActivityMessageProps = {
  activity: ExtendedMemory;
  showTimestamp?: boolean;
};

export function RunActivityMessage({ activity, showTimestamp = true }: RunActivityMessageProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { type, sub_type, text, created_at, metadata } = activity;
  const activityType = activityTypes[type as keyof typeof activityTypes];

  if (!activityType) return null;

  return (
    <>
      <div
        className={`
          cursor-pointer rounded-lg border p-4 transition-all font-zen
          ${activityType.bgColor} ${activityType.borderColor}
          group overflow-hidden hover:scale-[1.01]
          hover:bg-opacity-75
        `}
        onClick={() => setIsModalOpen(true)}
      >
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <activityType.icon className={`h-5 w-5 ${activityType.iconColor}`} />
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
          <div className="flex items-center gap-3">
            {showTimestamp && (
              <div className="flex items-center gap-1 text-xs text-gray-500">
                <BiTime className="h-3.5 w-3.5" />
                <span>{moment(created_at).fromNow()}</span>
              </div>
            )}
            <BiChevronRight className="h-4 w-4 text-gray-400 transition-transform group-hover:translate-x-0.5" />
          </div>
        </div>
        {/* Preview text without markdown */}
        <div className="line-clamp-2 overflow-hidden text-sm font-zen">{text}</div>
      </div>

      {/* Detail Modal - Enhanced styling */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        classNames={{
          base: 'bg-surface rounded-lg font-zen border shadow-lg',
          body: 'p-0',
          backdrop: 'bg-black/50',
        }}
        size="2xl"
      >
        <ModalContent>
          <ModalBody>
            <div className="hide-scrollbar max-h-[80vh] overflow-y-auto">
              <div className="p-8">
                {/* Header */}
                <div className="mb-6 flex items-center justify-between border-b border-gray-200 pb-4 dark:border-gray-800">
                  <div className="flex items-center gap-3">
                    <activityType.icon className={`h-5 w-5 ${activityType.iconColor}`} />
                    <div>
                      <Badge variant="default" size="sm" className={activityType.badgeColor}>
                        {activityType.subTypes[sub_type as keyof typeof activityType.subTypes] ||
                          sub_type}
                      </Badge>
                      <div className="mt-1 text-sm text-gray-500">
                        {activityType.description}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <BiTime className="h-3.5 w-3.5" />
                    <span>{format(new Date(created_at), 'MMM d, yyyy HH:mm:ss')}</span>
                  </div>
                </div>

                {/* Content with markdown */}
                <div className={`text-sm font-zen ${activityType.bgColor} rounded-lg p-6`}>
                  <MarkdownText text={text} />
                </div>

                {/* Metadata Section */}
                {metadata && Object.keys(metadata).length > 0 && (
                  <div className="mt-6 space-y-4">
                    <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Additional Details
                    </h3>
                    <div className="grid gap-3 rounded-lg border border-gray-200 p-4 dark:border-gray-800">
                      {Object.entries(metadata).map(([key, value]) => (
                        <div key={key} className="flex items-center justify-between">
                          <span className="text-xs text-gray-500 capitalize">
                            {key.replace(/_/g, ' ')}
                          </span>
                          <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                            {typeof value === 'string' ? value : JSON.stringify(value)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Transaction hash if exists */}
                {metadata?.txHash && (
                  <div className="mt-6 flex items-center justify-between rounded-lg border border-gray-200 p-4 dark:border-gray-800">
                    <span className="text-xs text-gray-500">Transaction Hash</span>
                    <a
                      href={`https://etherscan.io/tx/${metadata.txHash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-xs text-blue-500 hover:text-blue-600"
                    >
                      {metadata.txHash.slice(0, 6)}...{metadata.txHash.slice(-4)}
                      <BiLinkExternal className="h-3 w-3" />
                    </a>
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