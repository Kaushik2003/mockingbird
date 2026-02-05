/**
 * Signal Type Definitions
 */

export interface Signal {
  type: string;
  severity: number; // 0-1 scale
  metrics: Record<string, number | string | boolean>;
  timestamp: Date;
}

export interface CompositeRiskScore {
  score: number; // 0-1 scale
  contributors: Record<string, number>;
  timestamp: Date;
}

/**
 * Signal type constants
 */
export const SignalType = {
  HEALTH_FACTOR_RISK: "HEALTH_FACTOR_RISK",
  DISTANCE_TO_LIQUIDATION: "DISTANCE_TO_LIQUIDATION",
  COLLATERAL_UTILIZATION: "COLLATERAL_UTILIZATION",
  LTV_PRESSURE: "LTV_PRESSURE",
  ZERO_BORROW_BUFFER: "ZERO_BORROW_BUFFER",
  NET_APY_DRAG: "NET_APY_DRAG",
  BORROW_COST_PRESSURE: "BORROW_COST_PRESSURE",
  SINGLE_ASSET_COLLATERAL: "SINGLE_ASSET_COLLATERAL",
  COLLATERAL_CONCENTRATION: "COLLATERAL_CONCENTRATION",
  HIGH_LEVERAGE: "HIGH_LEVERAGE",
  DEBT_RATIO: "DEBT_RATIO",
  COLLATERAL_PRICE_SENSITIVITY: "COLLATERAL_PRICE_SENSITIVITY",
  USD_DEBT_EXPOSURE: "USD_DEBT_EXPOSURE",
  NET_WORTH_COMPRESSION: "NET_WORTH_COMPRESSION",
  HEALTH_FACTOR_TREND: "HEALTH_FACTOR_TREND",
  COLLATERAL_VALUE_DRIFT: "COLLATERAL_VALUE_DRIFT",
  DEBT_ACCRETION: "DEBT_ACCRETION",
  SUPPLY_YIELD_VS_BORROW_COST: "SUPPLY_YIELD_VS_BORROW_COST",
  LIQUIDATION_THRESHOLD_PROXIMITY: "LIQUIDATION_THRESHOLD_PROXIMITY",
  EMERGENCY_RISK_FLAG: "EMERGENCY_RISK_FLAG",
  COMPOSITE_RISK: "COMPOSITE_RISK",
} as const;

/**
 * Helper to clamp value between 0 and 1
 */
export function clamp(value: number, min: number = 0, max: number = 1): number {
  return Math.max(min, Math.min(max, value));
}
