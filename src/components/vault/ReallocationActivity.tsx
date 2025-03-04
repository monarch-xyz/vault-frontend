import { useState } from 'react';
import { Modal, ModalContent, ModalBody } from '@nextui-org/modal';
import { format } from 'date-fns';
import moment from 'moment';
import { BiChevronRight, BiTransfer, BiLinkExternal } from 'react-icons/bi';
import { Badge } from '@/components/common/Badge';
import { MarketSpan } from '@/components/common/MarketSpan';
import { formatUnits } from 'viem';
import { useMarkets } from '@/hooks/useMarkets';
import Link from 'next/link';
import { getExplorerTxURL } from '@/utils/external';
import { SupportedNetworks } from '@/utils/networks';
// Activity type definition for the reallocation component
const activityType = {
  label: 'Action',
  icon: BiTransfer,
  bgColor: 'bg-green-50/50 dark:bg-green-950/30',
  borderColor: 'border-green-100 dark:border-green-900',
  iconColor: 'text-green-600 dark:text-green-400',
  badgeColor: 'bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300',
  subTypes: {
    reallocation: 'Reallocation',
  },
};

type ReallocationAction = {
  marketId: string;
  assets: number;
  type: 'ReallocateSupply' | 'ReallocateWithdraw';
};

type Reallocation = {
  hash: string;
  timestamp: number;
  caller: string;
  actions: ReallocationAction[];
};

interface ReallocationActivityProps {
  reallocation: Reallocation;
}

export function ReallocationActivity({ reallocation }: ReallocationActivityProps) {
  const { markets } = useMarkets();

  const [isModalOpen, setIsModalOpen] = useState(false);

  // Format the timestamp as string for compatibility with other activities
  const timestamp = new Date(reallocation.timestamp * 1000).toISOString();

  // Get withdraw and supply actions
  const withdrawActions = reallocation.actions.filter((a) => a.type === 'ReallocateWithdraw');
  const supplyActions = reallocation.actions.filter((a) => a.type === 'ReallocateSupply');

  // Calculate total amount (should be the same for withdrawals and supplies)
  const totalAmount = withdrawActions.reduce((sum, action) => sum + action.assets, 0);

  // Format the amount as USDC with proper decimal places
  const formattedAmount = formatUnits(BigInt(totalAmount), 6);

  // Create a summary of the markets involved
  const fromMarkets = withdrawActions.map((a) => a.marketId);
  const toMarkets = supplyActions.map((a) => a.marketId);

  return (
    <>
      <div
        className={`
          cursor-pointer rounded-lg border p-3 transition-all
          ${activityType.bgColor} ${activityType.borderColor}
          group overflow-hidden font-zen
          hover:scale-[1.01] hover:bg-opacity-75
        `}
        onClick={() => setIsModalOpen(true)}
      >
        <div className="mb-2 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <activityType.icon className={`h-4 w-4 ${activityType.iconColor}`} />
            <Badge variant="default" size="sm" className={activityType.badgeColor}>
              {activityType.subTypes.reallocation}
            </Badge>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-gray-500">{moment(timestamp).fromNow()}</span>
            <BiChevronRight className="h-4 w-4 text-gray-400 transition-transform group-hover:translate-x-0.5" />
          </div>
        </div>
        <div className="line-clamp-2 overflow-hidden text-sm">
          Reallocate {formattedAmount} USDC from{' '}
          <span className="inline-flex flex-wrap gap-1">
            {fromMarkets.map((m, i) => (
              <MarketSpan
                key={`preview-from-${i}`}
                marketId={m}
                market={markets.find((market) => market.uniqueKey === m)}
                className="text-xs"
              />
            ))}
          </span>{' '}
          market{fromMarkets.length !== 1 ? 's' : ''} to{' '}
          <span className="inline-flex flex-wrap gap-1">
            {toMarkets.map((m, i) => (
              <MarketSpan
                key={`preview-to-${i}`}
                marketId={m}
                market={markets.find((market) => market.uniqueKey === m)}
                className="text-xs"
              />
            ))}
          </span>{' '}
          market{toMarkets.length !== 1 ? 's' : ''}
        </div>
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        classNames={{
          base: 'bg-surface rounded-lg font-zen border shadow-lg',
          body: 'p-0',
          backdrop: 'bg-black/50',
        }}
        size="2xl"
      >
        <ModalContent>
          <ModalBody>
            <div className="hide-scrollbar max-h-[80vh] overflow-y-auto">
              <div className="p-8">
                {/* Header */}
                <div className="mb-4 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <activityType.icon className={`h-4 w-4 ${activityType.iconColor}`} />
                    <Badge variant="default" size="sm" className={activityType.badgeColor}>
                      {activityType.subTypes.reallocation}
                    </Badge>
                  </div>
                  <span className="text-xs text-gray-500">
                    {format(new Date(timestamp), 'MMM d, yyyy HH:mm:ss')}
                  </span>
                </div>

                {/* Content with reallocation details */}
                <div className={`text-sm ${activityType.bgColor} rounded-lg p-4 font-zen`}>
                  <h4 className="mb-3">Reallocation: {formattedAmount} USDC</h4>

                  {/* From markets section */}
                  <div className="mb-4">
                    <h5 className="mb-2 text-xs uppercase text-gray-500">From Markets</h5>
                    <div className="space-y-2">
                      {withdrawActions.map((action, i) => (
                        <div
                          key={`from-${i}`}
                          className="flex items-center justify-between rounded bg-red-50/30 p-2 dark:bg-red-950/20"
                        >
                          <MarketSpan
                            marketId={action.marketId}
                            market={markets.find((market) => market.uniqueKey === action.marketId)}
                          />
                          <span className="font-medium text-red-600 dark:text-red-400">
                            -{formatUnits(BigInt(action.assets), 6)} USDC
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* To markets section */}
                  <div>
                    <h5 className="mb-2 text-xs uppercase text-gray-500">To Markets</h5>
                    <div className="space-y-2">
                      {supplyActions.map((action, i) => (
                        <div
                          key={`to-${i}`}
                          className="flex items-center justify-between rounded bg-green-50/30 p-2 dark:bg-green-950/20"
                        >
                          <MarketSpan
                            marketId={action.marketId}
                            market={markets.find((market) => market.uniqueKey === action.marketId)}
                          />
                          <span className="font-medium text-green-600 dark:text-green-400">
                            +{formatUnits(BigInt(action.assets), 6)} USDC
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Transaction hash - moved to bottom right */}
                <div className="mt-4 flex justify-end">
                  <Link
                    href={getExplorerTxURL(reallocation.hash, SupportedNetworks.Base)}
                    target="_blank"
                    className="flex items-center gap-1 text-xs text-gray-500 no-underline transition-colors hover:text-gray-700 hover:underline dark:hover:text-gray-300"
                  >
                    <span>
                      TX: {reallocation.hash.slice(0, 6)}...{reallocation.hash.slice(-4)}
                    </span>
                    <BiLinkExternal className="h-3 w-3" />
                  </Link>
                </div>
              </div>
            </div>
          </ModalBody>
        </ModalContent>
      </Modal>
    </>
  );
}
