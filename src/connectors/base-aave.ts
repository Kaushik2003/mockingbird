import { createWalletClient, http, Address, PublicClient } from 'viem'
import { baseSepolia, baseSepoliaClient } from '../config'
import { privateKeyToAccount } from 'viem/accounts'

// Aave V3 Lending Pool address on Base Sepolia
const LENDING_POOL_ADDRESS = '0x078f358208685046a39283C3b28f6E39C6f3eA1f' as Address

export const getAccountData = async (walletAddress: Address, publicClient: PublicClient = baseSepoliaClient) => {
  const [healthFactor, totalCollateral, totalDebt] = await publicClient.multicall({
    contracts: [
      {
        address: LENDING_POOL_ADDRESS,
        abi: [{ name: 'getUserAccountData', type: 'function', inputs: [{ name: 'user', type: 'address' }], outputs: [{ name: 'healthFactor', type: 'uint256' }, { name: 'totalCollateralBase', type: 'uint256' }, { name: 'totalDebtBase', type: 'uint256' }] }],
        functionName: 'getUserAccountData',
        args: [walletAddress]
      }
    ]
  })

  return {
    healthFactor: Number(healthFactor.result[0]) / 1e18,
    collateral: Number(totalCollateral.result[0]) / 1e18,
    debt: Number(totalDebt.result[0]) / 1e18
  }
}

export const supply = async (token: Address, amount: bigint, walletClient: ReturnType<typeof createWalletClient>) => {
  // Implementation for supplying assets
  return walletClient.writeContract({
    address: LENDING_POOL_ADDRESS,
    abi: [], // Add Aave V3 ABI here
    functionName: 'supply',
    args: [token, amount, walletClient.account.address, 0]
  })
}

export const borrow = async (token: Address, amount: bigint, walletClient: ReturnType<typeof createWalletClient>) => {
  // Implementation for borrowing assets
  return walletClient.writeContract({
    address: LENDING_POOL_ADDRESS,
    abi: [], // Add Aave V3 ABI here
    functionName: 'borrow',
    args: [token, amount, 2, 0, walletClient.account.address]
  })
}

export const repay = async (token: Address, amount: bigint, walletClient: ReturnType<typeof createWalletClient>) => {
  // Implementation for repaying debt
  return walletClient.writeContract({
    address: LENDING_POOL_ADDRESS,
    abi: [], // Add Aave V3 ABI here
    functionName: 'repay',
    args: [token, amount, 2, walletClient.account.address]
  })
}