'use client';

import { useState } from 'react';
import { Modal, ModalContent, ModalHeader, ModalBody } from '@nextui-org/modal';
import Image from 'next/image';
import { BiBrain } from 'react-icons/bi';
import { Button } from '@/components/common/Button';
import Input from '@/components/Input/Input';
import { useDepositVault } from '@/hooks/useDepositVault';
import { formatBalance } from '@/utils/balance';
import { AGENT_NAME } from '@/utils/constants';
import { useAccount, useBalance, useSwitchChain } from 'wagmi';
import { SupportedNetworks } from '@/utils/networks';
import { USDC } from '@/utils/tokens';

const BASE_ICON = require('../../../src/imgs/chains/base.webp') as string;

type DepositModalProps = {
  isOpen: boolean;
  onClose: () => void;
  vaultAddress: string;
};

export function DepositModal({ isOpen, onClose, vaultAddress }: DepositModalProps) {
  const { address, chainId } = useAccount();
  const { switchChainAsync } = useSwitchChain();

  const { data: usdcBalance } = useBalance({
    address: address,
    token: USDC.address as `0x${string}`,
    chainId: SupportedNetworks.Base,
  });

  const [depositAmount, setDepositAmount] = useState<bigint>(0n);
  const [message, setMessage] = useState<string>('');
  const [inputError, setInputError] = useState<string | null>(null);

  const { deposit, isDepositing } = useDepositVault(
    USDC.address as `0x${string}`,
    vaultAddress as `0x${string}`,
    depositAmount,
    message,
  );

  const isCorrectNetwork = chainId === SupportedNetworks.Base;

  const handleDeposit = async () => {
    await deposit();
    onClose();
  };

  const handleSwitchNetwork = async () => {
    await switchChainAsync({ chainId: SupportedNetworks.Base });
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      classNames={{
        base: 'bg-surface rounded-lg',
        header: 'border-b border-divider',
        body: 'p-8',
      }}
    >
      <ModalContent>
        <ModalHeader className="flex items-center gap-2 p-6 font-zen">
          <Image src={USDC.img} alt={USDC.symbol} width={24} height={24} />
          <span className="font-zen text-xl font-medium">Deposit USDC</span>
        </ModalHeader>
        <ModalBody>
          <div className="space-y-6 font-zen">
            {/* AI Vault Description */}
            <div className="flex flex-col gap-2 space-y-2 rounded-lg bg-primary/5 p-4">
              <div className="flex items-center gap-2 text-primary">
                <BiBrain className="h-5 w-5" />
                <span className="font-medium">AI-Managed Vault</span>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Your funds will be managed by M1, an AI agent that optimizes yield across Morpho
                markets.
              </p>
              <div className="mt-6 text-xs text-gray-500">💡 Deposit $10+ to interact with M1.</div>
            </div>

            <div className="space-y-2">
              <label className="text-sm text-gray-500">Amount to Deposit</label>
              <Input
                decimals={USDC.decimals}
                max={usdcBalance?.value || 0n}
                setValue={setDepositAmount}
                setError={setInputError}
                exceedMaxErrMessage="Insufficient Balance on Base"
              />
              <div className="flex items-center justify-end gap-1">
                <span className="text-xs text-gray-500">
                  Available: {formatBalance(usdcBalance?.value || 0n, USDC.decimals)} {USDC.symbol}
                </span>
                {(!usdcBalance?.value || usdcBalance.value === 0n) && (
                  <span className="flex items-center gap-1 text-xs text-gray-500">on Base</span>
                )}
              </div>
              {inputError && <p className="text-xs text-red-500">{inputError}</p>}
            </div>

            <div className="space-y-2">
              <label className="text-sm text-gray-500">Message (optional)</label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder={`Say hello to ${AGENT_NAME}!`}
                rows={4}
                className="bg-hovered w-full resize-none rounded-sm p-3 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>

            <div className="flex gap-3 pt-2">
              <Button variant="secondary" className="flex-1" onClick={onClose}>
                Cancel
              </Button>
              {isCorrectNetwork ? (
                <Button
                  variant="cta"
                  className="flex-1"
                  disabled={isDepositing || depositAmount === 0n || !!inputError}
                  onClick={handleDeposit}
                >
                  {isDepositing ? 'Depositing...' : 'Deposit'}
                </Button>
              ) : (
                <Button
                  variant="interactive"
                  className="flex flex-1 items-center justify-center gap-2"
                  onClick={handleSwitchNetwork}
                >
                  <span>Switch to Base</span>
                  <Image src={BASE_ICON} alt="Base Network" width={18} height={18} />
                </Button>
              )}
            </div>
          </div>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
}
