/**
 * Aave User Module
 * Functions for fetching user positions, account health, and transaction history.
 */

import {
  userSupplies,
  userBorrows,
  userMarketState,
  userTransactionHistory,
} from "@aave/client/actions";
import {
  evmAddress,
  type EvmAddress,
  type ChainId,
  PageSize,
  OrderDirection,
} from "@aave/client";
import { client } from "./client";
import { CHAIN_IDS, AAVE_V3_MARKETS, type MarketConfig, DEFAULT_MARKETS } from "./constants";

/**
 * Market input for userSupplies/userBorrows
 */
interface MarketInput {
  address: EvmAddress;
  chainId: ChainId;
}

/**
 * Get user's supply positions across markets
 * Returns: MarketUserReserveSupplyPosition[]
 */
export async function getUserSupplies(userAddress: string, marketsConfig: MarketConfig[] = DEFAULT_MARKETS) {
  // Convert to the format expected by the API
  const markets: MarketInput[] = marketsConfig.map((m) => ({
    address: m.address,
    chainId: m.chainId,
  }));

  const result = await userSupplies(client, {
    markets,
    user: evmAddress(userAddress),
  });

  if (result.isErr()) {
    throw new Error(`Failed to fetch user supplies: ${result.error}`);
  }

  return result.value;
}

/**
 * Get user's borrow positions across markets
 * Returns: MarketUserReserveBorrowPosition[]
 */
export async function getUserBorrows(userAddress: string, marketsConfig: MarketConfig[] = DEFAULT_MARKETS) {
  const markets: MarketInput[] = marketsConfig.map((m) => ({
    address: m.address,
    chainId: m.chainId,
  }));

  const result = await userBorrows(client, {
    markets,
    user: evmAddress(userAddress),
  });

  if (result.isErr()) {
    throw new Error(`Failed to fetch user borrows: ${result.error}`);
  }

  return result.value;
}

/**
 * Get user's market state (health factor, net worth, etc.)
 * Returns: MarketUserState
 */
export async function getUserMarketState(
  userAddress: string,
  marketAddress: EvmAddress = AAVE_V3_MARKETS.ETHEREUM_CORE,
  marketChainId: ChainId = CHAIN_IDS.ETHEREUM
) {
  const result = await userMarketState(client, {
    market: marketAddress,
    user: evmAddress(userAddress),
    chainId: marketChainId,
  });

  if (result.isErr()) {
    throw new Error(`Failed to fetch user market state: ${result.error}`);
  }

  return result.value;
}

/**
 * Get comprehensive user position data (supplies, borrows, and health)
 */
export async function getUserFullPosition(
  userAddress: string,
  marketAddress: EvmAddress = AAVE_V3_MARKETS.ETHEREUM_CORE,
  marketChainId: ChainId = CHAIN_IDS.ETHEREUM
) {
  const marketConfig: MarketConfig[] = [
    { address: marketAddress, chainId: marketChainId, name: "Target Market" },
  ];

  // Fetch all data in parallel
  const [suppliesResult, borrowsResult, stateResult] = await Promise.allSettled([
    getUserSupplies(userAddress, marketConfig),
    getUserBorrows(userAddress, marketConfig),
    getUserMarketState(userAddress, marketAddress, marketChainId),
  ]);

  // Extract values (with error handling)
  const supplies = suppliesResult.status === "fulfilled" ? suppliesResult.value : [];
  const borrows = borrowsResult.status === "fulfilled" ? borrowsResult.value : [];
  const state = stateResult.status === "fulfilled" ? stateResult.value : null;

  // Log any errors
  if (suppliesResult.status === "rejected") {
    console.warn("Warning: Failed to fetch supplies:", suppliesResult.reason);
  }
  if (borrowsResult.status === "rejected") {
    console.warn("Warning: Failed to fetch borrows:", borrowsResult.reason);
  }
  if (stateResult.status === "rejected") {
    console.warn("Warning: Failed to fetch market state:", stateResult.reason);
  }

  return {
    supplies,
    borrows,
    state,
    summary: {
      healthFactor: state?.healthFactor ?? null,
      netWorth: state?.netWorth ?? null,
      netAPY: state?.netAPY ?? null,
      totalCollateral: state?.totalCollateralBase ?? null,
      totalDebt: state?.totalDebtBase ?? null,
      availableBorrows: state?.availableBorrowsBase ?? null,
      ltv: state?.ltv ?? null,
      liquidationThreshold: state?.currentLiquidationThreshold ?? null,
      eModeEnabled: state?.eModeEnabled ?? false,
      isInIsolationMode: state?.isInIsolationMode ?? false,
    },
  };
}

/**
 * Get user's transaction history
 */
export async function getUserTransactionHistory(
  userAddress: string,
  marketAddress: EvmAddress = AAVE_V3_MARKETS.ETHEREUM_CORE,
  marketChainId: ChainId = CHAIN_IDS.ETHEREUM,
  pageSize: typeof PageSize[keyof typeof PageSize] = PageSize.FIFTY
) {
  const result = await userTransactionHistory(client, {
    market: marketAddress,
    user: evmAddress(userAddress),
    chainId: marketChainId,
    orderBy: { date: OrderDirection.DESC },
    pageSize,
  });

  if (result.isErr()) {
    throw new Error(`Failed to fetch user transaction history: ${result.error}`);
  }

  return result.value;
}

/**
 * Get user positions across all default markets
 */
export async function getUserPositionsAllMarkets(userAddress: string) {
  const results = await Promise.allSettled(
    DEFAULT_MARKETS.map(async (marketConfig) => {
      const position = await getUserFullPosition(
        userAddress,
        marketConfig.address,
        marketConfig.chainId
      );
      return {
        market: marketConfig.name,
        chainId: marketConfig.chainId,
        ...position,
      };
    })
  );

  return results.map((r, i) => ({
    market: DEFAULT_MARKETS[i].name,
    status: r.status,
    data: r.status === "fulfilled" ? r.value : null,
    error: r.status === "rejected" ? String(r.reason) : null,
  }));
}
