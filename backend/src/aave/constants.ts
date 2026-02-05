/**
 * Aave Constants Module
 * Defines known market addresses and chain IDs for Aave V3.
 */

import { evmAddress, chainId, type EvmAddress, type ChainId } from "@aave/client";

// Known Aave V3 Market Addresses
export const AAVE_V3_MARKETS = {
  // Ethereum Mainnet
  ETHEREUM_CORE: evmAddress("0x87870bca3f3fd6335c3f4ce8392d69350b4fa4e2"),
  // Arbitrum
  ARBITRUM_CORE: evmAddress("0x794a61358d6845594f94dc1db02a252b5b4814ad"),
  // Optimism
  OPTIMISM_CORE: evmAddress("0x794a61358d6845594f94dc1db02a252b5b4814ad"),
  // Polygon
  POLYGON_CORE: evmAddress("0x794a61358d6845594f94dc1db02a252b5b4814ad"),
  // Base
  BASE_CORE: evmAddress("0xa238dd80c259a72e81d7e4664a9801593f98d1c5"),
} as const;

// Chain IDs
export const CHAIN_IDS = {
  ETHEREUM: chainId(1),
  ARBITRUM: chainId(42161),
  OPTIMISM: chainId(10),
  POLYGON: chainId(137),
  BASE: chainId(8453),
} as const;

// Default market configuration
export interface MarketConfig {
  address: EvmAddress;
  chainId: ChainId;
  name: string;
}

export const DEFAULT_MARKETS: MarketConfig[] = [
  {
    address: AAVE_V3_MARKETS.ETHEREUM_CORE,
    chainId: CHAIN_IDS.ETHEREUM,
    name: "Ethereum Core",
  },
  {
    address: AAVE_V3_MARKETS.ARBITRUM_CORE,
    chainId: CHAIN_IDS.ARBITRUM,
    name: "Arbitrum Core",
  },
  {
    address: AAVE_V3_MARKETS.BASE_CORE,
    chainId: CHAIN_IDS.BASE,
    name: "Base Core",
  },
];
