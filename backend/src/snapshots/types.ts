/**
 * Snapshot Type Definitions
 * Normalized wallet state structure matching SampleData.md
 */

/**
 * Individual supply position
 */
export interface SupplyPosition {
  symbol: string;
  name: string;
  tokenAddress: string;
  decimals: number;
  balance: number;
  balanceUSD: number;
  priceUSD: number;
  supplyAPY: number;
  isCollateral: boolean;
  canBeCollateral: boolean;
  marketName: string;
  chainName: string;
}

/**
 * Individual borrow position
 */
export interface BorrowPosition {
  symbol: string;
  name: string;
  tokenAddress: string;
  decimals: number;
  debt: number;
  debtUSD: number;
  priceUSD: number;
  borrowAPY: number;
  marketName: string;
  chainName: string;
}

/**
 * Complete wallet snapshot
 * This is the normalized, immutable state at a point in time
 */
export interface WalletSnapshot {
  // Metadata
  timestamp: Date;
  walletAddress: string;

  // Core metrics
  healthFactor: number;
  totalCollateralUSD: number;
  totalDebtUSD: number;
  netWorthUSD: number;

  // Risk parameters
  ltv: number; // Loan-to-Value ratio
  liquidationThreshold: number;
  currentLTV: number;
  availableBorrowsUSD: number;
  netAPY: number;

  // Positions
  supplyPositions: SupplyPosition[];
  borrowPositions: BorrowPosition[];

  // Raw state (for debugging/analysis)
  marketStateRaw: any;
}
