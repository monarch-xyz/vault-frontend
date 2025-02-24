import { useState } from 'react';
import { Card, CardHeader, CardBody } from '@nextui-org/card';
import { BiBrain, BiTransfer } from 'react-icons/bi';
import { TbReportAnalytics } from 'react-icons/tb';
import { ActivityTypeButton } from './ActivityTypeButton';
import { ActivitiesSection } from './ActivitiesSection';

export const activityTypes = {
  report: {
    label: 'Reports',
    description: 'Formal summaries of actions and market conditions',
    icon: TbReportAnalytics,
    bgColor: 'bg-blue-50/50 dark:bg-blue-950/30',
    borderColor: 'border-blue-100 dark:border-blue-900',
    iconColor: 'text-blue-600 dark:text-blue-400',
  },
  think: {
    label: 'Thought',
    description: 'See detailed about how the agent reasons behind each decision',
    icon: BiBrain,
    bgColor: 'bg-purple-50/50 dark:bg-purple-950/30',
    borderColor: 'border-purple-100 dark:border-purple-900',
    iconColor: 'text-purple-600 dark:text-purple-400',
  },
  action: {
    label: 'Actions',
    description: 'The on-chain transactions, web searches, and other actions',
    icon: BiTransfer,
    bgColor: 'bg-green-50/50 dark:bg-green-950/30',
    borderColor: 'border-green-100 dark:border-green-900',
    iconColor: 'text-green-600 dark:text-green-400',
  },
} as const;

export function ActivityCard() {
  const [selectedType, setSelectedType] = useState('all');

  return (
    <Card className="bg-surface h-[600px] p-4">
      <CardHeader className="flex items-center justify-between">
        <span className="text-lg font-medium">Agent Activities</span>
      </CardHeader>

      <CardBody className="pt-4">
        <div className="flex flex-col h-full">
          {/* Activity Type Selector */}
          <div className="flex justify-center gap-2 p-2 border-b mb-4">
            <button
              onClick={() => setSelectedType('all')}
              className={`px-2.5 py-1 rounded-lg transition-all text-xs
                ${selectedType === 'all' 
                  ? 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300' 
                  : 'text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-900'
                }`}
            >
              All
            </button>
            {Object.entries(activityTypes).map(([type, config]) => (
              <ActivityTypeButton 
                key={type}
                type={type}
                config={config}
                isSelected={selectedType === type}
                onClick={() => setSelectedType(type)}
              />
            ))}
          </div>

          {/* Activity Feed */}
          <div className="flex-1 overflow-y-auto hide-scrollbar">
            <div className="pr-2">
              <ActivitiesSection selectedType={selectedType} />
            </div>
          </div>
        </div>
      </CardBody>
    </Card>
  );
} 