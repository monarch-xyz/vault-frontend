import { Card, CardHeader, CardBody } from '@nextui-org/card';
import { RiRobot2Fill } from 'react-icons/ri';
import { ChatSection } from './ChatSection';
import { AGENT_NAME } from '@/utils/constants';
import { useStatus, ActivityType } from '@/hooks/useStatus';
import Image from 'next/image';

function AgentStatusSection() {
  const { 
    getStatusMessage, 
    getStatusColor, 
    getStatusEmoji, 
    isConnected, 
    status 
  } = useStatus();
  
  return (
    <div className="flex items-center justify-between p-2 border-b border-gray-200 dark:border-gray-800 mb-4">
      {/* Agent profile and status */}
      <div className="flex items-center gap-3">
        {/* Agent avatar with status indicator */}
        <div className="relative">
          {/* Agent avatar/profile picture */}
          <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center overflow-hidden">
            <RiRobot2Fill className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            {/* Alternatively, use an image if you have one */}
            {/* <Image 
              src="/images/agent-avatar.png" 
              alt={AGENT_NAME} 
              width={40} 
              height={40} 
              className="rounded-full"
            /> */}
          </div>
          
          {/* Status indicator in bottom right corner */}
          <div className={`absolute -bottom-1 -right-1 flex items-center justify-center w-5 h-5 rounded-full bg-white dark:bg-gray-800 border-2 border-white dark:border-gray-800`}>
            <div className={`w-3 h-3 rounded-full ${getStatusColor()}`}></div>
          </div>
        </div>
        
        {/* Agent name, status emoji and message */}
        <div className="flex flex-col">
          <div className="flex items-center gap-1.5">
            <span className="font-medium text-sm">{AGENT_NAME}</span>
            <span className="text-sm" title={status.activity}>{getStatusEmoji()}</span>
          </div>
          <span className="text-xs text-gray-500 dark:text-gray-400">
            {getStatusMessage()}
          </span>
        </div>
      </div>
    </div>
  );
}

export function LiveStatusCard() {
  return (
    <Card className="bg-surface h-[600px] p-4 font-zen shadow-md rounded-md">
      <CardHeader className="flex items-center justify-between">
        <span className="text-lg">Live Status</span>
      </CardHeader>

      <CardBody className="pt-4">
        <div className="flex flex-col h-full">
          {/* Status Section */}
          <AgentStatusSection />

          {/* Chat Section */}
          <div className="flex-1 overflow-y-auto hide-scrollbar">
            <div className="pr-2">
              <ChatSection />
            </div>
          </div>
        </div>
      </CardBody>
    </Card>
  );
} 