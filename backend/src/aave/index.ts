/**
 * Aave Integration Module
 * Main entry point - exports all Aave-related functions.
 */

// Re-export client
export { client } from "./client";

// Re-export constants
export {
  AAVE_V3_MARKETS,
  CHAIN_IDS,
  DEFAULT_MARKETS,
  type MarketConfig,
} from "./constants";

// Re-export market functions
export {
  getMarkets,
  getMarketsForUser,
  getMarket,
  getMarketReserves,
  getReserveBySymbol,
} from "./markets";

// Re-export user functions
export {
  getUserSupplies,
  getUserBorrows,
  getUserMarketState,
  getUserFullPosition,
  getUserTransactionHistory,
  getUserPositionsAllMarkets,
} from "./user";
