/**
 * Aave Response Normalizer
 * Converts Aave SDK responses into normalized WalletSnapshot
 * This is the ONLY place where Aave responses are converted to snapshots
 */

import type { WalletSnapshot, SupplyPosition, BorrowPosition } from "./types";

/**
 * Helper to safely extract numeric value from Aave response
 */
function safeNumber(val: any, defaultVal: number = 0): number {
  if (val === null || val === undefined) return defaultVal;
  if (typeof val === "number") return val;
  if (typeof val === "bigint") return Number(val);
  if (typeof val === "string") return parseFloat(val) || defaultVal;
  
  // Handle objects with .value or .formatted properties
  if (typeof val === "object") {
    if ("value" in val) return safeNumber(val.value, defaultVal);
    if ("formatted" in val) return parseFloat(val.formatted) || defaultVal;
  }
  
  return defaultVal;
}

/**
 * Helper to safely extract string value
 */
function safeString(val: any, defaultVal: string = ""): string {
  if (val === null || val === undefined) return defaultVal;
  return String(val);
}

/**
 * Normalize Aave getUserFullPosition response into WalletSnapshot
 */
export function normalizeAaveResponse(
  walletAddress: string,
  aaveResponse: any
): WalletSnapshot {
  const { supplies, borrows, state } = aaveResponse;
  
  // Extract core metrics from state
  const healthFactor = safeNumber(state?.healthFactor, 0);
  const totalCollateralUSD = safeNumber(state?.totalCollateralBase, 0);
  const totalDebtUSD = safeNumber(state?.totalDebtBase, 0);
  const netWorthUSD = safeNumber(state?.netWorth, 0);
  const ltv = safeNumber(state?.ltv, 0);
  const liquidationThreshold = safeNumber(state?.currentLiquidationThreshold, 0);
  const currentLTV = safeNumber(state?.currentLtv, 0);
  const availableBorrowsUSD = safeNumber(state?.availableBorrowsBase, 0);
  const netAPY = safeNumber(state?.netAPY, 0);

  // Normalize supply positions
  const supplyPositions: SupplyPosition[] = (supplies || []).map((supply: any) => ({
    symbol: safeString(supply?.currency?.symbol, "UNKNOWN"),
    name: safeString(supply?.currency?.name, ""),
    tokenAddress: safeString(supply?.currency?.address, ""),
    decimals: safeNumber(supply?.currency?.decimals, 18),
    balance: safeNumber(supply?.balance?.amount?.value, 0),
    balanceUSD: safeNumber(supply?.balance?.usd, 0),
    priceUSD: safeNumber(supply?.balance?.usdPerToken, 0),
    supplyAPY: safeNumber(supply?.apy, 0),
    isCollateral: supply?.isCollateral ?? false,
    canBeCollateral: supply?.canBeCollateral ?? false,
    marketName: safeString(supply?.market?.name, ""),
    chainName: safeString(supply?.market?.chain?.name, ""),
  }));

  // Normalize borrow positions
  const borrowPositions: BorrowPosition[] = (borrows || []).map((borrow: any) => ({
    symbol: safeString(borrow?.currency?.symbol, "UNKNOWN"),
    name: safeString(borrow?.currency?.name, ""),
    tokenAddress: safeString(borrow?.currency?.address, ""),
    decimals: safeNumber(borrow?.currency?.decimals, 18),
    debt: safeNumber(borrow?.debt?.amount?.value, 0),
    debtUSD: safeNumber(borrow?.debt?.usd, 0),
    priceUSD: safeNumber(borrow?.debt?.usdPerToken, 0),
    borrowAPY: safeNumber(borrow?.apy, 0),
    marketName: safeString(borrow?.market?.name, ""),
    chainName: safeString(borrow?.market?.chain?.name, ""),
  }));

  return {
    timestamp: new Date(),
    walletAddress: walletAddress.toLowerCase(),
    healthFactor,
    totalCollateralUSD,
    totalDebtUSD,
    netWorthUSD,
    ltv,
    liquidationThreshold,
    currentLTV,
    availableBorrowsUSD,
    netAPY,
    supplyPositions,
    borrowPositions,
    marketStateRaw: state,
  };
}
