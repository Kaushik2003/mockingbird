import { createPublicClient, http, defineChain } from 'viem'

export const baseSepolia = {
  id: 84532,
  name: 'Base Sepolia',
  network: 'base-sepolia',
  nativeCurrency: { name: 'ETH', symbol: 'ETH', decimals: 18 },
  rpcUrls: { default: { http: [process.env.BASE_SEPOLIA_RPC || ''] } }
}

export const arcTestnet = defineChain({
  id: 8888,
  name: 'Arc Testnet',
  network: 'arc-testnet',
  nativeCurrency: { name: 'ARC', symbol: 'ARC', decimals: 18 },
  rpcUrls: { default: { http: [process.env.ARC_TESTNET_RPC || ''] } }
})

export const baseSepoliaClient = createPublicClient({
  chain: baseSepolia,
  transport: http(process.env.BASE_SEPOLIA_RPC)
})

export const arcTestnetClient = createPublicClient({
  chain: arcTestnet,
  transport: http(process.env.ARC_TESTNET_RPC)
})