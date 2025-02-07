import { useCallback } from 'react';
import { Address, encodeFunctionData, Hex } from 'viem';
import { useAccount, useSwitchChain } from 'wagmi';
import { useTransactionWithToast } from '@/hooks/useTransactionWithToast';
import { formatBalance } from '@/utils/balance';
import { useERC20Approval } from './useERC20Approval';
import { vaultAbi } from '@/abis/vault';
import { SupportedNetworks } from '@/utils/networks';
import { toast } from 'react-toastify';

export function useDepositVault(
  tokenAddress: Address | undefined,
  vaultAddress: Address | undefined,
  amount: bigint,
  message: string,
  onSuccess?: () => void,
) {
  const { address: account, chainId } = useAccount();
  const { switchChainAsync } = useSwitchChain();

  // Handle ERC20 approval
  const { isApproved, approve } = useERC20Approval({
    token: tokenAddress as Address,
    spender: vaultAddress as Address,
    amount,
    tokenSymbol: 'USDC',
  });

  // Handle deposit transaction
  const { isConfirming: isDepositing, sendTransactionAsync } = useTransactionWithToast({
    toastId: 'vault-deposit',
    pendingText: `Depositing ${formatBalance(amount, 6)} USDC`,
    successText: `Successfully deposited USDC`,
    errorText: 'Failed to deposit',
    onSuccess,
  });

  const deposit = useCallback(async () => {
    if (!account || !vaultAddress || !tokenAddress) {
      throw new Error('Missing required parameters');
    }

    // encode mesage to hex
    const messageHex = utf8ToHex(message);

    // append it at the end of the data
    await sendTransactionAsync({
      to: vaultAddress,
      data: encodeFunctionData({
        abi: vaultAbi,
        functionName: 'deposit',
        args: [amount, account],
      }) + messageHex as Hex,
    });
  }, [account, vaultAddress, tokenAddress, amount, sendTransactionAsync, message]);

  const depositWithApproval = useCallback(async () => {
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

      if (!isApproved) {
        try {
          await approve();
        } catch (error) {
          if (error instanceof Error) {
            if (error.message.includes('User rejected')) {
              toast.error('Approval rejected by user');
            } else {
              toast.error('Failed to approve USDC');
            }
          } else {
            toast.error('An unexpected error occurred during approval');
          }
          return;
        }
      }

      await deposit();
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
  }, [account, chainId, switchChainAsync, isApproved, approve, deposit]);

  return {
    deposit: depositWithApproval,
    isApproved,
    isDepositing,
  };
}

function utf8ToHex(str: string): string {
  return Array.from(new TextEncoder().encode(str))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}
