import { Tool } from '@langchain/core/tools'
import { getUserFullPosition } from '../aave/user'
import { createWalletClient, http, parseEther } from 'viem'
import { privateKeyToAccount } from 'viem/accounts'
import { baseSepolia } from 'viem/chains'

// Simple mock for actions
async function mockAction(action: string, params: any) {
  console.log(`[AGENT EXECUTION] ${action}:`, params);
  await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate delay
  return `Executed ${action} successfully. TxHash: 0xMockedHash`;
}

export function createTools(walletAddress: string, privateKey: string) {
  const account = privateKeyToAccount(privateKey as `0x${string}`);
  const client = createWalletClient({
    account,
    chain: baseSepolia,
    transport: http()
  });

  return [
    new Tool({
      name: 'get_risk_metrics',
      description: 'Get current health factor, collateral, and debt metrics from Aave V3 on Base Sepolia',
      func: async () => {
        try {
          const data = await getUserFullPosition(walletAddress);
          return JSON.stringify({
            healthFactor: data.summary.healthFactor || 0,
            collateral: data.summary.totalCollateral || 0,
            debt: data.summary.totalDebt || 0
          });
        } catch (e) {
          return JSON.stringify({ error: String(e) });
        }
      }
    }),
    new Tool({
      name: 'supply',
      description: 'Supply assets to Aave V3. Input: {"token": "USDC", "amount": "100"}',
      func: async (input: string) => {
        const params = JSON.parse(input);
        return mockAction('SUPPLY', params);
      }
    }),
    new Tool({
      name: 'borrow',
      description: 'Borrow assets from Aave V3. Input: {"token": "USDC", "amount": "50"}',
      func: async (input: string) => {
        const params = JSON.parse(input);
        return mockAction('BORROW', params);
      }
    }),
    new Tool({
      name: 'repay',
      description: 'Repay debt on Aave V3. Input: {"token": "USDC", "amount": "50"}',
      func: async (input: string) => {
        const params = JSON.parse(input);
        return mockAction('REPAY', params);
      }
    }),
    new Tool({
      name: 'bridge_to_arc',
      description: 'Bridge USDC to Arc Testnet. Input: {"amount": "100"}',
      func: async (input: string) => {
        const params = JSON.parse(input);
        return mockAction('BRIDGE_TO_ARC', params);
      }
    })
  ];
}
