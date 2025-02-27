'use client';

import { useState } from 'react';
import { Modal, ModalContent, ModalHeader, ModalBody } from '@nextui-org/modal';
import Image from 'next/image';
import { BiBrain } from 'react-icons/bi';
import { Button } from '@/components/common/Button';
import Input from '@/components/Input/Input';
import { useDepositVault } from '@/hooks/useDepositVault';
import { useUserBalances } from '@/hooks/useUserBalances';
import { formatBalance } from '@/utils/balance';
import { AGENT_NAME } from '@/utils/constants';

const USDC = {
  symbol: 'USDC',
  img: require('../../../src/imgs/tokens/usdc.webp') as string,
  decimals: 6,
  address: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
};

type DepositModalProps = {
  isOpen: boolean;
  onClose: () => void;
  vaultAddress: string;
}

export function DepositModal({ isOpen, onClose, vaultAddress }: DepositModalProps) {
  const { balances } = useUserBalances();
  const usdcBalance = BigInt(
    balances.find((b) => b.address.toLowerCase() === USDC.address.toLowerCase())?.balance || 0n,
  );

  const [depositAmount, setDepositAmount] = useState<bigint>(0n);
  const [message, setMessage] = useState<string>('');
  const [inputError, setInputError] = useState<string | null>(null);

  const { deposit, isDepositing } = useDepositVault(
    USDC.address as `0x${string}`,
    vaultAddress as `0x${string}`,
    depositAmount,
    message,
  );

  const handleDeposit = async () => {
    await deposit();
    onClose();
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
                Your funds will be managed by WoWo, an AI agent that optimizes yield across Morpho
                markets.
              </p>
              <div className="mt-6 text-xs text-gray-500">
                💡 Deposit $10+ to interact with WoWo.
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm text-gray-500">Amount to Deposit</label>
              <Input
                decimals={USDC.decimals}
                max={usdcBalance || 0n}
                setValue={setDepositAmount}
                setError={setInputError}
                exceedMaxErrMessage="Insufficient Balance"
              />
              <div className="flex justify-end">
                <span className="text-xs text-gray-500">
                  Available: {formatBalance(usdcBalance, USDC.decimals)} {USDC.symbol}
                </span>
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
              <Button
                variant="cta"
                className="flex-1"
                disabled={isDepositing || depositAmount === 0n || !!inputError}
                onClick={handleDeposit}
              >
                {isDepositing ? 'Depositing...' : 'Deposit'}
              </Button>
            </div>
          </div>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
}
