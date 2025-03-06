import { Modal, ModalContent, ModalHeader, ModalBody } from '@nextui-org/modal';
import { IoMdRefresh } from 'react-icons/io';
import { RiRobot2Fill } from 'react-icons/ri';
import { MarketAllocationRow } from './MarketAllocationRow';
import { AGENT_NAME } from '@/utils/constants';
import { VaultData } from '@/hooks/useVault';
import { Market } from '@/utils/types';

// Description component used within the modal
function AllocationDescription() {
  return (
    <div className="mb-6 rounded-lg bg-primary/5 p-4">
      <div className="mb-2 flex items-center gap-2 text-primary">
        <RiRobot2Fill className="h-4 w-4" />
        <span className="text-sm font-medium">{AGENT_NAME} - AI Allocator</span>
      </div>
      <p className="text-sm text-gray-600 dark:text-gray-400">
        {AGENT_NAME} manages the vaults by allocating USDC into different lending markets backed by
        different collateral assets.
        <br />
        The following table shows the current allocation
      </p>
    </div>
  );
}

interface MarketAllocationModalProps {
  isOpen: boolean;
  onClose: () => void;
  markets: Market[];
  vault: VaultData | undefined;
  totalAssets: bigint;
  refetch: () => Promise<any>;
  isRefetching: boolean;
}

export function MarketAllocationModal({
  isOpen,
  onClose,
  markets,
  vault,
  totalAssets,
  refetch,
  isRefetching,
}: MarketAllocationModalProps) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      classNames={{
        base: 'bg-surface rounded-lg font-zen',
        header: 'border-b border-divider',
        body: 'p-8',
        backdrop: 'backdrop-blur-sm',
      }}
      scrollBehavior="inside"
      size="xl"
    >
      <ModalContent>
        <ModalHeader className="p-6">
          <div className="flex w-full items-center justify-between">
            <div className="flex items-center gap-3">
              <h3 className="font-zen text-lg font-medium">Market Allocations</h3>
              <button
                onClick={async () => refetch()}
                className={`rounded-full p-1 text-gray-400 transition-all hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-800
                  ${isRefetching ? 'animate-spin' : ''}`}
                disabled={isRefetching}
                title="Refresh allocation data"
              >
                <IoMdRefresh className="h-4 w-4" />
              </button>
            </div>
          </div>
        </ModalHeader>
        <ModalBody className="flex flex-col gap-4">
          {/* Fixed description section - always visible */}
          <AllocationDescription />

          {/* Scrollable allocation list section */}
          <div className="max-h-[60vh] overflow-y-auto pr-2">
            <div className="space-y-2">
              {markets &&
                vault?.state.allocation
                  .sort((a, b) => Number(b.supplyAssets) - Number(a.supplyAssets))
                  .map((allocation: any) => {
                    const market = markets.find((m) => m.uniqueKey === allocation.market.uniqueKey);
                    if (!market) return null;

                    return (
                      <MarketAllocationRow
                        key={allocation.market.uniqueKey}
                        market={market}
                        amount={BigInt(allocation.supplyAssets)}
                        totalAssets={totalAssets}
                      />
                    );
                  })}
            </div>
          </div>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
}
