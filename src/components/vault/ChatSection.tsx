import { format, formatDistanceToNow } from 'date-fns'
import { Badge } from '@/components/common/Badge'
import { FaRobot } from 'react-icons/fa'
import { BsChatDots } from 'react-icons/bs'
import { useChat, ChatMessage } from '@/hooks/useChat'
import { Spinner } from '@/components/common/Spinner'
import { isAddress } from 'viem'
import { MarkdownText } from '@/components/MarkdownText'

function ChatBubble({ message }: { message: ChatMessage }) {
  const isAgent = message.sender === 'agent'
  const isAdmin = message.sender === 'admin'

  // Get bubble style based on sender type
  const bubbleStyle = isAgent
    ? "rounded-lg border border-green-200 bg-green-50/30 p-3 dark:border-green-800/50 dark:bg-green-900/10"
    : isAdmin
    ? "rounded-lg border border-blue-200 bg-blue-50/30 p-3 dark:border-blue-800/50 dark:bg-blue-900/10"
    : "rounded-lg border border-gray-200 bg-gray-50/30 p-3 dark:border-gray-800/50 dark:bg-gray-900/10"

  // Get text style based on sender type
  const textStyle = isAgent
    ? "text-sm text-green-800 dark:text-green-200"
    : isAdmin
    ? "text-sm text-blue-800 dark:text-blue-200"
    : "text-sm text-gray-800 dark:text-gray-200"

  return (
    <div className={bubbleStyle}>
      <div className="mb-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          {isAgent ? (
            <Badge
              variant="default"
              size="sm"
              className="bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400"
            >
              <div className="flex items-center gap-1">
                <FaRobot className="h-3 w-3" />
                <span className="text-[10px]"> agent </span>
              </div>
            </Badge>
          ) : isAdmin ? (
            <Badge variant="default" size="sm">
              ADMIN
            </Badge>
          ) : (
            <Badge
              variant="default"
              size="sm"
              className="bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400"
            >
              USER
            </Badge>
          )}
          {isAddress(message.sender) && (
            <span className="text-xs text-gray-500">
              {message.sender.slice(0, 6)}...{message.sender.slice(-4)}
            </span>
          )}
        </div>
        <span className="text-[10px] text-gray-500" title={format(new Date(message.created_at), 'HH:mm:ss')}>
          {formatDistanceToNow(new Date(message.created_at), { addSuffix: true })}
        </span>
      </div>
      <p className={textStyle}>
        <MarkdownText 
            text={message.text} 
            className={textStyle}
          />
      </p>
      {message.tx && (
        <div className="mt-2 text-xs text-gray-500">
          TX: {message.tx.slice(0, 6)}...{message.tx.slice(-4)}
        </div>
      )}
    </div>
  );
}

export function ChatSection() {
  const { messages, isLoading, error } = useChat();

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
        <p>Failed to load chat messages</p>
        <p className="text-sm">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {messages.length === 0 ? (
        <div className="flex h-full flex-col items-center justify-center space-y-2 text-center">
          <BsChatDots className="h-8 w-8 text-green-600 dark:text-green-400 opacity-40" />
          <div className="text-sm text-gray-500">Deposit to attach a message to the agent!</div>
        </div>
      ) : (
        messages.map((message) => (
          <ChatBubble
            key={message.id}
            message={message}
          />
        ))
      )}
    </div>
  );
} 