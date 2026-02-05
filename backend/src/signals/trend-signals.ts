/**
 * Trend Signals
 * Signals requiring historical snapshot comparison
 */

import type { WalletSnapshot } from "../snapshots/types";
import type { Signal } from "./types";
import { SignalType, clamp } from "./types";

/**
 * 15. Health Factor Trend
 * Compare current vs ~10 minutes ago
 */
export function healthFactorTrend(
  current: WalletSnapshot,
  historical: WalletSnapshot | null
): Signal | null {
  if (!historical) return null;
  
  const hfDelta = current.healthFactor - historical.healthFactor;
  const threshold = -0.02; // Declining by 0.02
  
  if (hfDelta >= threshold) return null;
  
  const severity = clamp(Math.abs(hfDelta) / 0.1); // -0.1 = max severity
  
  return {
    type: SignalType.HEALTH_FACTOR_TREND,
    severity,
    metrics: {
      hfDelta: hfDelta,
      currentHF: current.healthFactor,
      historicalHF: historical.healthFactor,
      trend: "Declining",
    },
    timestamp: current.timestamp,
  };
}

/**
 * 16. Collateral Value Drift
 * Compare current vs previous snapshot
 */
export function collateralValueDrift(
  current: WalletSnapshot,
  previous: WalletSnapshot | null
): Signal | null {
  if (!previous) return null;
  
  const deltaCollateral = current.totalCollateralUSD - previous.totalCollateralUSD;
  const pctChange = previous.totalCollateralUSD > 0
    ? (deltaCollateral / previous.totalCollateralUSD) * 100
    : 0;
  
  const threshold = -3; // -3% drop
  
  if (pctChange >= threshold) return null;
  
  const severity = clamp(Math.abs(pctChange) / 10); // -10% = max severity
  
  return {
    type: SignalType.COLLATERAL_VALUE_DRIFT,
    severity,
    metrics: {
      deltaCollateralUSD: deltaCollateral,
      pctChange: pctChange,
      currentCollateral: current.totalCollateralUSD,
      previousCollateral: previous.totalCollateralUSD,
    },
    timestamp: current.timestamp,
  };
}

/**
 * 17. Debt Accretion
 * Compare current vs previous snapshot
 */
export function debtAccretion(
  current: WalletSnapshot,
  previous: WalletSnapshot | null
): Signal | null {
  if (!previous) return null;
  
  const deltaDebt = current.totalDebtUSD - previous.totalDebtUSD;
  const threshold = 2000; // $2,000 increase
  
  if (deltaDebt < threshold) return null;
  
  const severity = clamp(deltaDebt / 10000); // $10k = max severity
  
  return {
    type: SignalType.DEBT_ACCRETION,
    severity,
    metrics: {
      deltaDebtUSD: deltaDebt,
      currentDebt: current.totalDebtUSD,
      previousDebt: previous.totalDebtUSD,
    },
    timestamp: current.timestamp,
  };
}
