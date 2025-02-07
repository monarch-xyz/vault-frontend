import { useCallback } from 'react';
import { Address, encodeFunctionData, Hex } from 'viem';
import { useAccount, useSwitchChain } from 'wagmi';
import { useTransactionWithToast } from '@/hooks/useTransactionWithToast';
import { formatBalance } from '@/utils/balance';
import { useERC20Approval } from './useERC20Approval';
import { vaultAbi } from '@/abis/vault';
import { SupportedNetworks } from '@/utils/networks';
export function useDepositVault(
  tokenAddress: Address | undefined,
  vaultAddress: Address | undefined,
  amount: bigint,
  message: string,
  onSuccess?: () => void,
) {
  const { address: account, chainId } = useAccount();

  const { switchChainAsync } = useSwitchChain()

  // Handle ERC20 approval
  const { isApproved, approve } = useERC20Approval({
    token: tokenAddress as Address,
    spender: vaultAddress as Address,
    amount,
    tokenSymbol: 'USDC',
  });

  console.log('chainId', chainId)

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
  }, [account, vaultAddress, tokenAddress, amount, sendTransactionAsync]);

  const depositWithApproval = useCallback(async () => {

    if (chainId !== SupportedNetworks.Base) {
      await switchChainAsync({ chainId: SupportedNetworks.Base });
      console.log('switched to base')
    }


    if (!isApproved) {
      await approve();
    }
    await deposit();
  }, [isApproved, approve, deposit]);

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
