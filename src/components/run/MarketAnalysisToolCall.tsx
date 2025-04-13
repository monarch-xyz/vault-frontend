import React from 'react';
import { Card, CardBody } from '@nextui-org/react';
import { TbZoomQuestion } from 'react-icons/tb';
import { ToolCall, MarketAnalysisArgs, ToolFunctionName } from '@/hooks/useRun';
import { safeJsonParse } from '@/utils/parsing'; // Import the utility
import { MarkdownText } from '@/components/MarkdownText'; // Import MarkdownText

interface MarketAnalysisToolCallProps {
  toolCall: ToolCall;
  content?: string | null; // Add optional content prop
}

export const MarketAnalysisToolCall: React.FC<MarketAnalysisToolCallProps> = ({ toolCall, content }) => {
  if (toolCall.function.name !== ToolFunctionName.MarketAnalysis) {
    return null; // Only render if it's the correct type
  }

  const args = safeJsonParse<MarketAnalysisArgs>(toolCall.function.arguments);

  return (
    <Card key={`tool-${toolCall.id}`} className="border p-0 font-zen bg-blue-50/50 dark:bg-blue-950/30 border-blue-100 dark:border-blue-900 mb-4">
      <div className="flex items-center gap-2 p-4">
        <TbZoomQuestion className="h-5 w-5 text-blue-600 dark:text-blue-400" />
        <span className="font-semibold">Market Analysis Request</span>
      </div>
      
      <CardBody className="border-t border-blue-100 dark:border-blue-900 p-4 space-y-3">
        {args ? (
          <div className="space-y-2 text-sm">
            {args.reasoning_prompt && (
              <div>
                <strong className="block text-gray-700 dark:text-gray-300 text-xs mb-1">Prompt:</strong>
                <p className="font-mono text-xs bg-gray-100 dark:bg-gray-800 p-2 rounded break-words">{args.reasoning_prompt}</p>
              </div>
            )}
            {args.market_or_vault_data && (
              <div>
                <strong className="block text-gray-700 dark:text-gray-300 text-xs mb-1">Data Provided:</strong>
                <p className="font-mono text-xs bg-gray-100 dark:bg-gray-800 p-2 rounded break-words">{args.market_or_vault_data}</p>
              </div>
            )}
          </div>
        ) : (
          <p className="text-xs text-red-500">Could not parse arguments for market analysis.</p>
        )}

        {content && (
          <div className="pt-3 border-t border-blue-100/50 dark:border-blue-900/50">
            <strong className="block text-gray-700 dark:text-gray-300 text-xs mb-1">Reasoning:</strong>
            <div className="text-sm">
              <MarkdownText text={content} />
            </div>
          </div>
        )}
      </CardBody>
    </Card>
  );
}; 