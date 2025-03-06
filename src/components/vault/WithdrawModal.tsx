'use client';

import { useState } from 'react';
import { Modal, ModalContent, ModalHeader, ModalBody } from '@nextui-org/modal';
import Image from 'next/image';
import { Button } from '@/components/common/Button';
import Input from '@/components/Input/Input';
import { formatBalance } from '@/utils/balance';
import { useAccount, useSwitchChain } from 'wagmi';
import { SupportedNetworks } from '@/utils/networks';
import { USDC } from '@/utils/tokens';
import { useWithdrawVault } from '@/hooks/useWithdrawVault';
import { useVaultPosition } from '@/hooks/useVaultPosition';

const BASE_ICON = require('../../../src/imgs/chains/base.webp') as string;

type WithdrawModalProps = {
  isOpen: boolean;
  onClose: () => void;
  vaultAddress: string;
};

export function WithdrawModal({ isOpen, onClose, vaultAddress }: WithdrawModalProps) {
  const { chainId } = useAccount();
  const { switchChainAsync } = useSwitchChain();

  const { data: vaultPosition } = useVaultPosition(vaultAddress as `0x${string}`);

  // max amount => simply use the assets reported by indexor
  const maxAmount = BigInt(vaultPosition?.assets || '0') || 0n;

  const [withdrawAmount, setWithdrawAmount] = useState<bigint>(0n);
  const [inputError, setInputError] = useState<string | null>(null);

  const { withdraw, isWithdrawing } = useWithdrawVault(
    vaultAddress as `0x${string}`,
    withdrawAmount,
  );

  const isCorrectNetwork = chainId === SupportedNetworks.Base;

  const handleWithdraw = async () => {
    await withdraw();
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
          <span className="font-zen text-xl font-medium">Withdraw USDC</span>
        </ModalHeader>
        <ModalBody>
          <div className="space-y-6 font-zen">
            <div className="space-y-2">
              <label className="text-sm text-gray-500">Amount to Withdraw</label>
              <Input
                decimals={USDC.decimals}
                max={maxAmount}
                setValue={setWithdrawAmount}
                setError={setInputError}
                exceedMaxErrMessage="Insufficient Balance in Vault"
              />
              <div className="flex items-center justify-end gap-1">
                <span className="text-xs text-gray-500">
                  Available: {formatBalance(maxAmount, USDC.decimals)} {USDC.symbol}
                </span>
              </div>
              {inputError && <p className="text-xs text-red-500">{inputError}</p>}
            </div>

            <div className="flex gap-3 pt-2">
              <Button variant="secondary" className="flex-1" onClick={onClose}>
                Cancel
              </Button>
              {isCorrectNetwork ? (
                <Button
                  variant="cta"
                  className="flex-1"
                  disabled={isWithdrawing || withdrawAmount === 0n || !!inputError}
                  onClick={handleWithdraw}
                >
                  {isWithdrawing ? 'Withdrawing...' : 'Withdraw'}
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
