import { format, formatDistanceToNow } from 'date-fns';
import { BsChatDots } from 'react-icons/bs';
import { isAddress } from 'viem';
import { Badge } from '@/components/common/Badge';
import { MarkdownText } from '@/components/MarkdownText';
import { ChatMessage } from '@/hooks/useChat';
import { AGENT_NAME } from '@/utils/constants';

type EnhancedChatBubbleProps = {
  message: ChatMessage;
};

export function EnhancedChatBubble({ message }: EnhancedChatBubbleProps) {
  const isAgent = message.sender === 'agent';
  const isAdmin = message.sender === 'admin';

  // Get heading text
  const getHeadingText = () => {
    if (isAgent) {
      return `${AGENT_NAME} responded`;
    } else if (isAdmin) {
      return 'Admin sent a message';
    } else if (isAddress(message.sender)) {
      return `Message from ${message.sender.slice(0, 6)}...${message.sender.slice(-4)}`;
    } else {
      return 'User sent a message';
    }
  };

  // Get bubble style based on sender type
  const bubbleStyle = isAgent
    ? 'rounded-lg border border-green-200 bg-green-50/30 p-3 dark:border-green-800/50 dark:bg-green-900/10'
    : isAdmin
    ? 'rounded-lg border border-blue-200 bg-blue-50/30 p-3 dark:border-blue-800/50 dark:bg-blue-900/10'
    : 'rounded-lg border border-gray-200 bg-gray-50/30 p-3 dark:border-gray-800/50 dark:bg-gray-900/10';

  // Get text style based on sender type
  const textStyle = isAgent
    ? 'text-sm text-green-800 dark:text-green-200'
    : isAdmin
    ? 'text-sm text-blue-800 dark:text-blue-200'
    : 'text-sm text-gray-800 dark:text-gray-200';

  // Get badge style based on sender type
  const getBadgeStyle = () => {
    if (isAgent) {
      return 'bg-green-100 text-green-600 dark:bg-green-800/50 dark:text-green-300';
    } else if (isAdmin) {
      return 'bg-blue-100 text-blue-600 dark:bg-blue-800/50 dark:text-blue-300';
    } else {
      return 'bg-gray-100 text-gray-600 dark:bg-gray-800/50 dark:text-gray-300';
    }
  };

  return (
    <div className={bubbleStyle}>
      <div className="mb-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Badge variant="default" size="sm" className={getBadgeStyle()}>
            <div className="flex items-center gap-1">
              <BsChatDots className="h-3 w-3" />
              <span className="text-[10px]">MSG</span>
            </div>
          </Badge>
          <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
            {getHeadingText()}
          </span>
        </div>
        <span
          className="text-[10px] text-gray-500"
          title={format(new Date(message.created_at), 'HH:mm:ss')}
        >
          {formatDistanceToNow(new Date(message.created_at), { addSuffix: true })}
        </span>
      </div>

      <div className={textStyle}>
        <MarkdownText text={message.text} className={textStyle} />
      </div>

      {message.tx && (
        <div className="mt-2 text-xs text-gray-500">
          <a
            href={`https://basescan.org/tx/0x${message.tx}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-500 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
          >
            TX: 0x{message.tx.slice(0, 6)}...{message.tx.slice(-4)}
          </a>
        </div>
      )}
    </div>
  );
}
