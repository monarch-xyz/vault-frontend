import { Card, CardHeader, CardBody } from '@nextui-org/card';
import { RiRobot2Fill } from 'react-icons/ri';
import { useStatus } from '@/hooks/useStatus';
import { AGENT_NAME, ActivityType } from '@/utils/constants';
import { LiveLogSection } from './LiveLogSection';

function AgentStatusSection() {
  const { getStatusMessage, getStatusEmoji, isConnected, isReconnecting, status } = useStatus();

  // Get appropriate status text based on connection state
  const getDisplayMessage = () => {
    if (!isConnected) {
      return isReconnecting ? `${AGENT_NAME} is reconnecting...` : `${AGENT_NAME} is offline`;
    }

    if (status.activity === ActivityType.AGENT_STARTED) {
      return `${AGENT_NAME} is now online!`;
    }

    return getStatusMessage();
  };

  // Get appropriate emoji based on connection state
  const getDisplayEmoji = () => {
    if (!isConnected) {
      return isReconnecting ? '🔄' : '😴';
    }

    if (status.activity === ActivityType.AGENT_STARTED) {
      return '🚀';
    }

    return getStatusEmoji();
  };

  // Get connection status indicator color
  const getConnectionColor = () => {
    if (!isConnected) {
      return 'bg-yellow-500'; // Yellow for disconnected or reconnecting
    }
    return 'bg-green-500'; // Green for connected
  };

  return (
    <div className="mb-2 flex items-center justify-between border-b border-gray-200 pb-[12px] dark:border-gray-800">
      {/* Agent profile and status */}
      <div className="flex items-center gap-2">
        {/* Agent avatar with status indicator */}
        <div className="relative">
          {/* Agent avatar/profile picture */}
          <div className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-full bg-blue-100 dark:bg-blue-900">
            <RiRobot2Fill className="h-5 w-5 text-blue-600 dark:text-blue-400" />
          </div>

          {/* Connection status indicator in bottom right corner */}
          <div className="absolute -bottom-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full border-2 border-white bg-white dark:border-gray-800 dark:bg-gray-800">
            <div className={`h-2 w-2 rounded-full ${getConnectionColor()}`} />
          </div>
        </div>

        {/* Agent name, status emoji and message with simple transition */}
        <div className="flex flex-col">
          <div className="flex items-center gap-1">
            <span className="text-sm font-medium">{AGENT_NAME}</span>
            <span
              className="text-sm transition-all duration-300 ease-in-out"
              title={isConnected ? status.category : isReconnecting ? 'reconnecting' : 'offline'}
            >
              {getDisplayEmoji()}
            </span>
          </div>

          {/* Status message with simple transition */}
          <div className="transition-all duration-300 ease-in-out">
            <span className="text-xs text-gray-500 dark:text-gray-400">{getDisplayMessage()}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export function LiveStatusCard() {
  return (
    <Card className="bg-surface h-[600px] rounded-md px-4 pt-4 font-zen shadow-md">
      <CardHeader className="flex items-center justify-between px-3 py-2">
        <span className="text-lg">Live Status</span>
      </CardHeader>

      <CardBody className="px-4 pb-4 pt-2">
        <div className="flex h-full flex-col">
          {/* Status Section */}
          <AgentStatusSection />

          {/* Chat Section */}
          <div className="hide-scrollbar flex-1 overflow-y-auto">
            <div className="pt-1">
              <LiveLogSection />
            </div>
          </div>
        </div>
      </CardBody>
    </Card>
  );
}
