import { Card, CardHeader, CardBody } from '@nextui-org/card';
import { ChatSection } from './ChatSection';

export function LiveStatusCard() {
  return (
    <Card className="bg-surface h-[600px] p-4">
      <CardHeader className="flex items-center justify-between">
        <span className="text-lg font-medium">Live Status</span>
      </CardHeader>
      <CardBody className="pt-4">
        <div className="h-[500px] overflow-y-auto hide-scrollbar">
          <div className="pr-2">
            <ChatSection />
          </div>
        </div>
      </CardBody>
    </Card>
  );
} 