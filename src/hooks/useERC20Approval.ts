import { useCallback, useMemo } from 'react';
import { Address, encodeFunctionData, erc20Abi } from 'viem';
import { useAccount, useReadContract } from 'wagmi';
import { useTransactionWithToast } from './useTransactionWithToast';
import { SupportedNetworks } from '@/utils/networks';
import { waitForTransactionReceipt } from 'viem/actions';
import { usePublicClient } from 'wagmi';

export function useERC20Approval({
  token,
  spender,
  amount,
  tokenSymbol,
}: {
  token: Address;
  spender: Address;
  amount: bigint;
  tokenSymbol: string;
}) {
  const { address: account } = useAccount();
  const publicClient = usePublicClient({ chainId: SupportedNetworks.Base });
  const { data: allowance, refetch: refetchAllowance } = useReadContract({
    address: token,
    abi: erc20Abi,
    functionName: 'allowance',
    args: [account as Address, spender],
    query: {
      refetchInterval: 10000,
    },
    chainId: SupportedNetworks.Base,
  });

  const isApproved = useMemo(() => {
    if (!allowance || !amount) return false;
    return allowance >= amount;
  }, [allowance, amount]);

  const { isConfirming: isApproving, sendTransactionAsync } = useTransactionWithToast({
    toastId: 'approve',
    pendingText: `Approving ${tokenSymbol}`,
    successText: `${tokenSymbol} Approved`,
    errorText: 'Failed to approve',
    chainId: SupportedNetworks.Base,
    pendingDescription: `Approving ${tokenSymbol} for spender ${spender.slice(2, 8)}...`,
    successDescription: `Successfully approved ${tokenSymbol} for spender ${spender.slice(2, 8)}`,
  });

  const approve = useCallback(async () => {
    if (!account || !amount || !publicClient) return;

    const tx = await sendTransactionAsync({
      account,
      to: token,
      data: encodeFunctionData({
        abi: erc20Abi,
        functionName: 'approve',
        args: [spender, amount],
      }),
    });

    // make sure it's confirmed on-chain
    await publicClient.waitForTransactionReceipt({hash: tx });
  }, [account, amount, sendTransactionAsync, token, spender, refetchAllowance]);

  return {
    isApproved,
    approve,
    isApproving,
  };
}
