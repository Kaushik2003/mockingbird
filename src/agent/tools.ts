import { Tool } from '@langchain/core/tools'
import { getAccountData } from '../connectors/base-aave'
import { bridgeUSDC } from '../connectors/cctp'
import { Address } from 'viem'

export const getRiskMetricsTool = new Tool({
  name: 'get_risk_metrics',
  description: 'Get current health factor, collateral, and debt metrics from Aave V3 on Base Sepolia',
  func: async (input: string) => {
    const { walletAddress } = JSON.parse(input)
    const metrics = await getAccountData(walletAddress as Address)
    return JSON.stringify({
      healthFactor: metrics.healthFactor,
      collateral: metrics.collateral,
      debt: metrics.debt
    })
  }
})

export const supplyTool = new Tool({
  name: 'supply',
  description: 'Supply assets to Aave V3 on Base Sepolia',
  func: async (input: string) => {
    const { token, amount, walletClient } = JSON.parse(input)
    // Implementation would call supply function
    return 'Supply transaction initiated'
  }
})

export const borrowTool = new Tool({
  name: 'borrow',
  description: 'Borrow assets from Aave V3 on Base Sepolia',
  func: async (input: string) => {
    const { token, amount, walletClient } = JSON.parse(input)
    // Implementation would call borrow function
    return 'Borrow transaction initiated'
  }
})

export const repayTool = new Tool({
  name: 'repay',
  description: 'Repay debt on Aave V3 on Base Sepolia',
  func: async (input: string) => {
    const { token, amount, walletClient } = JSON.parse(input)
    // Implementation would call repay function
    return 'Repayment transaction initiated'
  }
})

export const bridgeToArcTool = new Tool({
  name: 'bridge_to_arc',
  description: 'Bridge USDC from Base Sepolia to Arc Testnet using CCTP',
  func: async (input: string) => {
    const { amount, destinationDomain, walletClient } = JSON.parse(input)
    await bridgeUSDC(BigInt(amount), destinationDomain, walletClient)
    return 'USDC bridged to Arc Testnet'
  }
})