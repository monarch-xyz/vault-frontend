'use client';

import { useParams } from 'next/navigation';
import { Card } from '@nextui-org/react';
import { Spinner } from '@/components/common/Spinner';
import { TbReportAnalytics } from 'react-icons/tb';
import { BiBrain, BiTransfer } from 'react-icons/bi';
import { format } from 'date-fns';
import { MarkdownText } from '@/components/MarkdownText';
import { useRun } from '@/hooks/useRun';
import { Badge } from '@/components/common/Badge';

const activityTypes = {
  action: {
    label: 'Action',
    icon: BiTransfer,
    bgColor: 'bg-green-50/50 dark:bg-green-950/30',
    borderColor: 'border-green-100 dark:border-green-900',
    iconColor: 'text-green-600 dark:text-green-400',
    badgeColor: 'bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300',
  },
  report: {
    label: 'Report',
    icon: TbReportAnalytics,
    bgColor: 'bg-blue-50/50 dark:bg-blue-950/30',
    borderColor: 'border-blue-100 dark:border-blue-900',
    iconColor: 'text-blue-600 dark:text-blue-400',
    badgeColor: 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300',
  },
  think: {
    label: 'Thought',
    icon: BiBrain,
    bgColor: 'bg-purple-50/50 dark:bg-purple-950/30',
    borderColor: 'border-purple-100 dark:border-purple-900',
    iconColor: 'text-purple-600 dark:text-purple-400',
    badgeColor: 'bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-300',
  },
} as const;

export default function RunPage() {
  const params = useParams();
  const id = params?.id as string;
  const { run, isLoading, error } = useRun(id);

  if (!id) {
    return (
      <div className="flex h-full flex-col items-center justify-center text-red-500">
        <p>Invalid run ID</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Spinner size={24} />
      </div>
    );
  }

  if (error || !run) {
    return (
      <div className="flex h-full flex-col items-center justify-center text-red-500">
        <p>Failed to load run details</p>
        <p className="text-sm">{error}</p>
      </div>
    );
  }

  const timestamp = run.thoughtProcess[0]?.created_at || run.report?.created_at || run.action?.created_at;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold font-zen">Run Details</h1>
        {timestamp && (
          <p className="text-gray-500 font-zen">
            {format(new Date(timestamp), 'MMM d, yyyy HH:mm')}
          </p>
        )}
      </div>

      <div className="grid gap-6">
        {/* Thought Process Section */}
        {run.thoughtProcess.length > 0 ? (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold font-zen">Thought Process</h2>
            {run.thoughtProcess.map((activity, index) => {
              const type = activity.type as keyof typeof activityTypes;
              const activityType = activityTypes[type];
              return (
                <Card 
                  key={index} 
                  className={`${activityType.bgColor} ${activityType.borderColor} border p-6 font-zen`}
                >
                  <div className="flex flex-col gap-4">
                    <div className="flex items-center gap-2">
                      <activityType.icon className={`h-4 w-4 ${activityType.iconColor}`} />
                      <Badge variant="default" size="sm" className={activityType.badgeColor}>
                        {activityType.label}
                      </Badge>
                    </div>
                    <div className={`text-sm ${activityType.bgColor} rounded-lg p-4`}>
                      <MarkdownText text={activity.text} />
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        ) : null}

        {/* Report Section */}
        {run.report && (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold font-zen">Report</h2>
            <Card 
              className={`${activityTypes.report.bgColor} ${activityTypes.report.borderColor} border p-6 font-zen`}
            >
              <div className="flex flex-col gap-4">
                <div className="flex items-center gap-2">
                  <activityTypes.report.icon className={`h-4 w-4 ${activityTypes.report.iconColor}`} />
                  <Badge variant="default" size="sm" className={activityTypes.report.badgeColor}>
                    {activityTypes.report.label}
                  </Badge>
                </div>
                <div className={`text-sm ${activityTypes.report.bgColor} rounded-lg p-4`}>
                  <MarkdownText text={run.report.text} />
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* Action Section */}
        {run.action && (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold font-zen">Action</h2>
            <Card 
              className={`${activityTypes.action.bgColor} ${activityTypes.action.borderColor} border p-6 font-zen`}
            >
              <div className="flex flex-col gap-4">
                <div className="flex items-center gap-2">
                  <activityTypes.action.icon className={`h-4 w-4 ${activityTypes.action.iconColor}`} />
                  <Badge variant="default" size="sm" className={activityTypes.action.badgeColor}>
                    {activityTypes.action.label}
                  </Badge>
                </div>
                <div className={`text-sm ${activityTypes.action.bgColor} rounded-lg p-4`}>
                  <MarkdownText text={run.action.text} />
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* No Content Message */}
        {!run.thoughtProcess.length && !run.report && !run.action && (
          <div className="flex h-full flex-col items-center justify-center space-y-2 py-8 text-center">
            <div className="text-sm text-gray-500">No content available for this run</div>
          </div>
        )}
      </div>
    </div>
  );
} 