'use client';

import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Card, CardBody, CardHeader, CardFooter } from '@nextui-org/react';
import { Spinner } from '@/components/common/Spinner';
import { TbReportAnalytics, TbUser, TbRobot, TbTool, TbAlertCircle } from 'react-icons/tb';
import { BiBrain, BiTransfer, BiLinkExternal as BiLinkExternalSmall } from 'react-icons/bi';
import { HiArrowLeft, HiOutlineExternalLink } from 'react-icons/hi';
import { format } from 'date-fns';
import { MarkdownText } from '@/components/MarkdownText';
import { useRun, Message, ToolCall, ToolFunctionName } from '@/hooks/useRun';
import { Badge } from '@/components/common/Badge';
import React, { Fragment } from 'react';
import { MarketAnalysisToolCall } from '@/components/run/MarketAnalysisToolCall';
import { UnknownToolCallWithContent } from '@/components/run/UnknownToolCallWithContent';
import { getExplorerTxURL } from '@/utils/external';
import { SupportedNetworks } from '@/utils/networks';

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

// --- Helper Function to check for Tx Hash ---
const isTxHash = (str: string): boolean => {
  return typeof str === 'string' && /^0x[a-fA-F0-9]{64}$/.test(str);
};

export default function RunPage() {
  const params = useParams();
  const id = params?.id as string;
  const { activity, isLoading, error } = useRun(id);

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

  if (error || !activity) {
    return (
      <div className="flex h-full flex-col items-center justify-center text-red-500">
        <p>Failed to load run details</p>
        <p className="text-sm">{error || 'Activity data not found.'}</p>
      </div>
    );
  }

  const timestamp = activity.createdAt;
  const triggerDisplay = activity.trigger === 'PERIODIC_CHECK' ? 'Periodic Check' : activity.trigger;

  // --- Function to render individual messages ---
  const renderMessage = (message: Message, index: number) => {
    switch (message.type) {
      case 'HumanMessage':
        return (
          <Card key={index} className="border p-0 font-zen bg-yellow-50/50 dark:bg-yellow-950/30 border-yellow-100 dark:border-yellow-900">
            <details>
              <summary className="flex cursor-pointer items-center gap-2 p-4">
                <TbUser className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
                <span className="font-semibold">Initial Input (Expand)</span>
              </summary>
              <CardBody className="border-t border-yellow-100 dark:border-yellow-900 p-4">
                <div className="text-sm">
                  <MarkdownText text={message.content || '(No content)'} />
                </div>
              </CardBody>
            </details>
          </Card>
        );

      case 'AIMessage':
        const toolCalls = message.additional_kwargs?.tool_calls;
        const hasContent = !!message.content;
        const content = Array.isArray(message.content) ? message.content[0].text : message.content;

        console.log('AI Message message', message);

        if (toolCalls && toolCalls.length > 0) {
          const hasOnlyKnownTools = toolCalls.every(tc => 
            tc.function.name === ToolFunctionName.MarketAnalysis
          );

          if (hasOnlyKnownTools) {
            return (
              <Fragment key={index}>
                {toolCalls.map((toolCall) => {
                  switch (toolCall.function.name) {
                    case ToolFunctionName.MarketAnalysis:
                      return <MarketAnalysisToolCall key={`tool-${toolCall.id}`} toolCall={toolCall} content={content} />;
                    default:
                      return null;
                  }
                })}
              </Fragment>
            );
          } else if (hasContent) {
            return <UnknownToolCallWithContent key={index} toolCalls={toolCalls} content={content!} messageKey={index} />;
          } else {
            return null;
          }
        } else if (hasContent) {
          return (
            <Card key={`${index}-content`} className="border p-4 font-zen bg-purple-50/50 dark:bg-purple-950/30 border-purple-100 dark:border-purple-900">
              <div className="flex items-center gap-2 mb-2">
                <TbRobot className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                <span className="font-semibold">M1 Thought Process</span>
              </div>
              <div className="text-sm">
                <MarkdownText text={content || '(No content)'} />
              </div>
            </Card>
          );
        } else {
          return null;
        }

      case 'ToolMessage':
        const contentStr = typeof message.content === 'string' ? message.content : '';
        const isTx = isTxHash(contentStr);
        const isError = contentStr.toLowerCase().includes('error');
        
        let cardBg, cardBorder, icon, iconColor, label;
        if (isTx) {
          cardBg = 'bg-green-50/50 dark:bg-green-950/30';
          cardBorder = 'border-green-100 dark:border-green-900';
          icon = TbTool;
          iconColor = 'text-green-600 dark:text-green-400';
          label = 'Transaction Triggered';
        } else if (isError) {
          cardBg = 'bg-red-50/50 dark:bg-red-950/30';
          cardBorder = 'border-red-100 dark:border-red-900';
          icon = TbAlertCircle;
          iconColor = 'text-red-600 dark:text-red-400';
          label = 'Tool Error';
        } else {
          cardBg = 'bg-gray-50/50 dark:bg-gray-950/30';
          cardBorder = 'border-gray-100 dark:border-gray-900';
          icon = TbTool;
          iconColor = 'text-gray-600 dark:text-gray-400';
          label = 'Tool Result';
        }

        const IconComponent = icon;

        return (
          <Card key={index} className={`border font-zen ${cardBg} ${cardBorder} ${isTx ? 'p-0' : 'p-4'}`}>
            <div className={`flex items-center gap-2 ${isTx ? 'p-4 pb-0' : 'mb-2'}`}>
              <IconComponent className={`h-5 w-5 ${iconColor}`} />
              <span className="font-semibold">{label}</span>
            </div>
            
            {!isTx && (
                <div className="text-sm pt-2"> 
                  <MarkdownText text={contentStr || '(No content)'} />
                </div>
            )}

            {isTx && (
              <CardFooter className="flex justify-end pt-2 pb-3 px-4 border-t border-green-100/50 dark:border-green-900/50">
                 <Link
                    href={getExplorerTxURL(contentStr, SupportedNetworks.Base)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-xs text-gray-500 no-underline transition-colors hover:text-gray-700 hover:underline dark:hover:text-gray-300 font-mono"
                  >
                    <span>TX: {contentStr.substring(0, 6)}...{contentStr.substring(contentStr.length - 4)}</span>
                    <BiLinkExternalSmall className="h-3 w-3" /> 
                  </Link>
              </CardFooter>
            )}
          </Card>
        );

      default:
        return (
          <Card key={index} className="border p-4 font-zen bg-gray-50 dark:bg-gray-800">
            <pre className="text-xs text-gray-500">Unknown message type: {JSON.stringify(message)}</pre>
          </Card>
        );
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 pt-20">
      <div className="mb-8">
        <Link href="/runs" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 no-underline">
          <HiArrowLeft />
          Back to Runs
        </Link>
        <h1 className="text-2xl font-bold font-zen">Run Details</h1>
        {timestamp && (
          <p className="text-gray-500 font-zen">
            {format(new Date(timestamp), 'MMM d, yyyy HH:mm')}
          </p>
        )}
        <p className="text-sm text-gray-600 dark:text-gray-400 font-zen">
          Trigger: <span className="font-semibold">{triggerDisplay}</span>
        </p>
      </div>

      {/* Render the parsed fullHistory */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold font-zen">Run History</h2>
        {activity.fullHistory && activity.fullHistory.length > 0 ? (
          activity.fullHistory.map(renderMessage)
        ) : (
          <div className="flex h-full flex-col items-center justify-center space-y-2 py-8 text-center">
            <div className="text-sm text-gray-500">No history content available for this run</div>
          </div>
        )}
      </div>
    </div>
  );
} 