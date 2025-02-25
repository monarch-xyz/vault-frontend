import { Card, CardHeader, CardBody } from '@nextui-org/card';
import { RiRobot2Fill } from 'react-icons/ri';
import { ChatSection } from './ChatSection';
import { AGENT_NAME } from '@/utils/constants';

function AgentStatusSection() {
  return (
    <div className="flex items-center justify-center gap-2 p-2 border-b border-gray-200 dark:border-gray-800 mb-4">
      <div className="flex items-center gap-2 rounded-lg bg-green-50/50 dark:bg-green-950/30 px-3 py-1">
        <div className="relative flex items-center gap-1.5">
          <RiRobot2Fill className="h-3.5 w-3.5 text-green-600 dark:text-green-400" />
          <div className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />
        </div>
        <span className="text-xs text-green-700 dark:text-green-300">
          {AGENT_NAME} Chilling
        </span>
      </div>
    </div>
  );
}

export function LiveStatusCard() {
  return (
    <Card className="bg-surface h-[600px] p-4 font-zen">
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