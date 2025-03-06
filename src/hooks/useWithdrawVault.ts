import { useCallback } from 'react';
import { toast } from 'react-toastify';
import { Address, encodeFunctionData } from 'viem';
import { useAccount, useSwitchChain } from 'wagmi';
import { vaultAbi } from '@/abis/vault';
import { useTransactionWithToast } from '@/hooks/useTransactionWithToast';
import { formatBalance } from '@/utils/balance';
import { SupportedNetworks } from '@/utils/networks';

export function useWithdrawVault(
  vaultAddress: Address | undefined,
  amount: bigint,
  onSuccess?: () => void,
) {
  const { address: account, chainId } = useAccount();
  const { switchChainAsync } = useSwitchChain();

  // Handle withdraw transaction
  const { isConfirming: isWithdrawing, sendTransactionAsync } = useTransactionWithToast({
    toastId: 'vault-withdraw',
    pendingText: `Withdrawing ${formatBalance(amount, 6)} USDC`,
    successText: `Successfully withdrew USDC`,
    errorText: 'Failed to withdraw',
    onSuccess,
  });

  const withdraw = useCallback(async () => {
    if (!account || !vaultAddress) {
      throw new Error('Missing required parameters');
    }

    await sendTransactionAsync({
      to: vaultAddress,
      data: encodeFunctionData({
        abi: vaultAbi,
        functionName: 'withdraw',
        args: [amount, account, account], // asset, receiver, owner
      }),
    });
  }, [account, vaultAddress, amount, sendTransactionAsync]);

  const withdrawWithNetworkCheck = useCallback(async () => {
    try {
      if (!account) {
        toast.error('Please connect your wallet');
        return;
      }

      if (chainId !== SupportedNetworks.Base) {
        try {
          await switchChainAsync({ chainId: SupportedNetworks.Base });
        } catch (error) {
          toast.error('Failed to switch network to Base');
          return;
        }
      }

      await withdraw();
    } catch (error) {
      if (error instanceof Error) {
        if (error.message.includes('User rejected')) {
          toast.error('Transaction rejected by user');
        } else {
          toast.error(`Transaction failed: ${error.message}`);
        }
      } else {
        toast.error('An unexpected error occurred');
      }
    }
  }, [account, chainId, switchChainAsync, withdraw]);

  return {
    withdraw: withdrawWithNetworkCheck,
    isWithdrawing,
  };
}
