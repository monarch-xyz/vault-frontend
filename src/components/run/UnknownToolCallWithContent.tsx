import React from 'react';
import { Card, CardBody } from '@nextui-org/react';
import { TbRobot, TbCodeAsterisk } from 'react-icons/tb'; // Corrected icon name
import { ToolCall } from '@/hooks/useRun';
import { MarkdownText } from '@/components/MarkdownText';

interface UnknownToolCallWithContentProps {
  toolCalls: ToolCall[];
  content: string; 
  messageKey: string | number; // Pass index or ID for key
}

export const UnknownToolCallWithContent: React.FC<UnknownToolCallWithContentProps> = ({ toolCalls, content, messageKey }) => {

  // Basic rendering of tool call names and indication of arguments
  const renderToolCallSummary = (tc: ToolCall, index: number) => (
    <div key={`${messageKey}-tc-${index}`} className="text-xs font-mono bg-gray-100 dark:bg-gray-800 p-1 rounded mb-1">
      Tool Call: {tc.function.name} ({tc.function.arguments ? 'has args' : 'no args'})
    </div>
  );

  return (
    <Card key={`unknown-tool-${messageKey}`} className="border p-0 font-zen bg-cyan-50/50 dark:bg-cyan-950/30 border-cyan-100 dark:border-cyan-900 mb-4">
      {/* Header part */}
      <div className="flex items-center gap-2 p-4">
        <TbRobot className="h-5 w-5 text-cyan-600 dark:text-cyan-400" />
        <span className="font-semibold">AI Reasoning with Tool Calls</span>
      </div>
      
      {/* Body part for content and tool summary */} 
      <CardBody className="border-t border-cyan-100 dark:border-cyan-900 p-4 space-y-3">
        {/* Render content first */} 
        <div>
           <strong className="block text-gray-700 dark:text-gray-300 text-xs mb-1">Reasoning:</strong>
            <div className="text-sm">
              <MarkdownText text={content} />
            </div>
        </div>

        {/* Render summary of tool calls */} 
        {toolCalls && toolCalls.length > 0 && (
          <div className="pt-3 border-t border-cyan-100/50 dark:border-cyan-900/50">
            <strong className="block text-gray-700 dark:text-gray-300 text-xs mb-1">Tool Calls Made:</strong>
            {toolCalls.map(renderToolCallSummary)}
          </div>
        )}
      </CardBody>
    </Card>
  );
}; 