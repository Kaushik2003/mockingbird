/**
 * Aave Markets Module
 * Functions for fetching market data and reserve information.
 */

import { markets, market } from "@aave/client/actions";
import { evmAddress, chainId, type EvmAddress, type ChainId } from "@aave/client";
import { client } from "./client";
import { CHAIN_IDS, AAVE_V3_MARKETS, type MarketConfig } from "./constants";

/**
 * Fetch all markets for given chain IDs
 */
export async function getMarkets(chainIds: ChainId[] = [CHAIN_IDS.ETHEREUM]) {
  const result = await markets(client, { chainIds });

  if (result.isErr()) {
    throw new Error(`Failed to fetch markets: ${result.error}`);
  }

  return result.value;
}

/**
 * Fetch all markets with user-specific data
 */
export async function getMarketsForUser(
  userAddress: string,
  chainIds: ChainId[] = [CHAIN_IDS.ETHEREUM]
) {
  const result = await markets(client, {
    chainIds,
    user: evmAddress(userAddress),
  });

  if (result.isErr()) {
    throw new Error(`Failed to fetch markets for user: ${result.error}`);
  }

  return result.value;
}

/**
 * Fetch a single market by address
 */
export async function getMarket(
  marketAddress: EvmAddress,
  marketChainId: ChainId,
  userAddress?: string
) {
  const result = await market(client, {
    address: marketAddress,
    chainId: marketChainId,
    ...(userAddress && { user: evmAddress(userAddress) }),
  });

  if (result.isErr()) {
    throw new Error(`Failed to fetch market: ${result.error}`);
  }

  return result.value;
}

/**
 * Get reserves for a specific market
 */
export async function getMarketReserves(
  marketAddress: EvmAddress = AAVE_V3_MARKETS.ETHEREUM_CORE,
  marketChainId: ChainId = CHAIN_IDS.ETHEREUM
) {
  const marketData = await getMarket(marketAddress, marketChainId);

  if (!marketData) {
    throw new Error("Market not found");
  }

  return {
    supplyReserves: marketData.supplyReserves,
    borrowReserves: marketData.borrowReserves,
    totalMarketSize: marketData.totalMarketSize,
    totalAvailableLiquidity: marketData.totalAvailableLiquidity,
    eModeCategories: marketData.eModeCategories,
  };
}

/**
 * Get reserve data for a specific asset in a market
 */
export async function getReserveBySymbol(
  symbol: string,
  marketAddress: EvmAddress = AAVE_V3_MARKETS.ETHEREUM_CORE,
  marketChainId: ChainId = CHAIN_IDS.ETHEREUM
) {
  const marketData = await getMarket(marketAddress, marketChainId);

  if (!marketData) {
    throw new Error("Market not found");
  }

  // Search in both supply and borrow reserves
  const supplyReserve = marketData.supplyReserves.find(
    (r) => r.underlyingToken.symbol.toUpperCase() === symbol.toUpperCase()
  );

  const borrowReserve = marketData.borrowReserves.find(
    (r) => r.underlyingToken.symbol.toUpperCase() === symbol.toUpperCase()
  );

  return {
    supply: supplyReserve || null,
    borrow: borrowReserve || null,
  };
}
