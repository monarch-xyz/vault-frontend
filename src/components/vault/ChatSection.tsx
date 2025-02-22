import { useLogStream, LogEntry } from '@/hooks/useLogStream'
import { format } from 'date-fns'
import { Badge } from '@/components/common/Badge'
import { FaRobot } from 'react-icons/fa'
import { BsChatDots } from 'react-icons/bs'

type MessageDetails = {
  from: 'admin' | 'agent' | 'user';
  text: string;
  tx?: string;
  sender?: string;
}

function ChatMessage({ log, isLast }: { log: LogEntry; isLast: boolean }) {
  const details = log.details as unknown as MessageDetails;
  const isAgent = details.from === 'agent';
  const isAdmin = details.from === 'admin';

  return (
    <div className="rounded-lg border border-green-200 bg-green-50/30 p-3 dark:border-green-800/50 dark:bg-green-900/10">
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
                <span className="text-[10px]">Wowo</span>
              </div>
            </Badge>
          ) : isAdmin ? (
            <Badge variant="success" size="sm">
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
        </div>
        <span className="text-[10px] text-gray-500">
          {format(new Date(log.timestamp), 'HH:mm:ss')}
        </span>
      </div>
      <p className="whitespace-pre-wrap text-sm text-green-800 dark:text-green-200">
        {details.text}
      </p>
    </div>
  );
}

export function ChatSection() {
  const { logs } = useLogStream();
  const chatLogs = logs.filter(log => log.category === 'conversation');

  return (
    <div className="space-y-3">
      {chatLogs.length === 0 ? (
        <div className="flex h-full flex-col items-center justify-center space-y-2 text-center">
          <BsChatDots className="h-8 w-8 text-green-600 dark:text-green-400 opacity-40" />
          <div className="text-sm text-gray-500">Deposit to attach a message to Wowo!</div>
        </div>
      ) : (
        chatLogs
          .slice()
          .reverse()
          .map((log, index, array) => (
            <ChatMessage
              key={log.timestamp + index}
              log={log}
              isLast={index === array.length - 1}
            />
          ))
      )}
    </div>
  );
} 