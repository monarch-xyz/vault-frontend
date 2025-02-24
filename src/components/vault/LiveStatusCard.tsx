import { Card, CardHeader, CardBody } from '@nextui-org/card';
import { ChatSection } from './ChatSection';

export function LiveStatusCard() {
  return (
    <Card className="bg-surface h-full p-4">
      <CardHeader className="flex items-center justify-between">
        <span className="text-lg font-medium">Live Status</span>
      </CardHeader>
      <CardBody className="pt-4">
        <ChatSection />
      </CardBody>
    </Card>
  );
} 