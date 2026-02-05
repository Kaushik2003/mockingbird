/**
 * Instant Signals
 * Signals computed from a single snapshot (no historical data required)
 */

import type { WalletSnapshot } from "../snapshots/types";
import type { Signal } from "./types";
import { SignalType, clamp } from "./types";

/**
 * 1. Health Factor Risk
 * Triggers when HF < 1.10
 */
export function healthFactorRisk(snapshot: WalletSnapshot): Signal | null {
  const hf = snapshot.healthFactor;
  
  if (hf >= 1.10) return null;
  
  // Severity: (1.1 - HF) / 0.2
  const severity = clamp((1.1 - hf) / 0.2);
  
  return {
    type: SignalType.HEALTH_FACTOR_RISK,
    severity,
    metrics: {
      healthFactor: hf,
      status: hf < 1.0 ? "LIQUIDATABLE" : hf < 1.05 ? "CRITICAL" : "HIGH",
    },
    timestamp: snapshot.timestamp,
  };
}

/**
 * 2. Distance to Liquidation
 * Triggers when distance < 8%
 */
export function distanceToLiquidation(snapshot: WalletSnapshot): Signal | null {
  const hf = snapshot.healthFactor;
  
  if (hf <= 0) return null;
  
  // distancePct = (HF - 1) / HF
  const distancePct = (hf - 1) / hf;
  
  if (distancePct >= 0.08) return null;
  
  // Severity: (0.08 - distance) / 0.08
  const severity = clamp((0.08 - distancePct) / 0.08);
  
  return {
    type: SignalType.DISTANCE_TO_LIQUIDATION,
    severity,
    metrics: {
      distancePct: distancePct * 100,
      totalCollateralUSD: snapshot.totalCollateralUSD,
      totalDebtUSD: snapshot.totalDebtUSD,
    },
    timestamp: snapshot.timestamp,
  };
}

/**
 * 3. Collateral Utilization
 * Informational metric
 */
export function collateralUtilization(snapshot: WalletSnapshot): Signal | null {
  if (snapshot.totalCollateralUSD === 0) return null;
  
  const utilization = snapshot.totalDebtUSD / snapshot.totalCollateralUSD;
  
  // Only emit if utilization is high (>70%)
  if (utilization < 0.7) return null;
  
  const severity = clamp((utilization - 0.7) / 0.3);
  
  return {
    type: SignalType.COLLATERAL_UTILIZATION,
    severity,
    metrics: {
      utilization: utilization * 100,
    },
    timestamp: snapshot.timestamp,
  };
}

/**
 * 4. LTV Pressure
 * currentLTV / liquidationThreshold (higher = worse)
 */
export function ltvPressure(snapshot: WalletSnapshot): Signal | null {
  if (snapshot.liquidationThreshold === 0) return null;
  
  const pressure = snapshot.currentLTV / snapshot.liquidationThreshold;
  
  // Trigger if pressure > 0.85
  if (pressure < 0.85) return null;
  
  const severity = clamp((pressure - 0.85) / 0.15);
  
  return {
    type: SignalType.LTV_PRESSURE,
    severity,
    metrics: {
      ltvPressure: pressure,
      currentLTV: snapshot.currentLTV,
      liquidationThreshold: snapshot.liquidationThreshold,
    },
    timestamp: snapshot.timestamp,
  };
}

/**
 * 5. Zero Borrow Buffer
 * Binary flag when availableBorrows = 0
 */
export function zeroBorrowBuffer(snapshot: WalletSnapshot): Signal | null {
  if (snapshot.availableBorrowsUSD !== 0) return null;
  
  // Only emit if user has debt
  if (snapshot.totalDebtUSD === 0) return null;
  
  return {
    type: SignalType.ZERO_BORROW_BUFFER,
    severity: 1.0,
    metrics: {
      availableBorrowsUSD: 0,
      hasDebt: true,
    },
    timestamp: snapshot.timestamp,
  };
}

/**
 * 6. Net APY Drag
 * Triggers when netAPY < 0
 */
export function netAPYDrag(snapshot: WalletSnapshot): Signal | null {
  if (snapshot.netAPY >= 0) return null;
  
  // Severity based on how negative
  const severity = clamp(Math.abs(snapshot.netAPY) / 10); // -10% = max severity
  
  return {
    type: SignalType.NET_APY_DRAG,
    severity,
    metrics: {
      netAPY: snapshot.netAPY,
    },
    timestamp: snapshot.timestamp,
  };
}

/**
 * 7. Borrow Cost Pressure
 * Triggers when any borrow APY > threshold (default 3%)
 */
export function borrowCostPressure(snapshot: WalletSnapshot): Signal | null {
  const threshold = 3.0; // 3%
  
  const highCostBorrows = snapshot.borrowPositions.filter(
    (b) => b.borrowAPY > threshold
  );
  
  if (highCostBorrows.length === 0) return null;
  
  const maxAPY = Math.max(...highCostBorrows.map((b) => b.borrowAPY));
  const severity = clamp((maxAPY - threshold) / 10); // 13% = max severity
  
  return {
    type: SignalType.BORROW_COST_PRESSURE,
    severity,
    metrics: {
      maxBorrowAPY: maxAPY,
      highCostAssets: highCostBorrows.map((b) => b.symbol).join(", "),
    },
    timestamp: snapshot.timestamp,
  };
}

/**
 * 8. Single-Asset Collateral Risk
 * Binary flag when only one supply asset
 */
export function singleAssetCollateral(snapshot: WalletSnapshot): Signal | null {
  const collateralAssets = snapshot.supplyPositions.filter((s) => s.isCollateral);
  
  if (collateralAssets.length !== 1) return null;
  
  const asset = collateralAssets[0];
  if (!asset) return null;
  
  return {
    type: SignalType.SINGLE_ASSET_COLLATERAL,
    severity: 0.8,
    metrics: {
      supplyAssetCount: 1,
      asset: asset.symbol,
    },
    timestamp: snapshot.timestamp,
  };
}

/**
 * 9. Collateral Concentration
 * Triggers when any single asset > 40% of collateral
 */
export function collateralConcentration(snapshot: WalletSnapshot): Signal | null {
  if (snapshot.totalCollateralUSD === 0) return null;
  
  const threshold = 0.4; // 40%
  
  let largestShare = 0;
  let largestAsset = "";
  
  for (const supply of snapshot.supplyPositions) {
    if (!supply.isCollateral) continue;
    
    const share = supply.balanceUSD / snapshot.totalCollateralUSD;
    if (share > largestShare) {
      largestShare = share;
      largestAsset = supply.symbol;
    }
  }
  
  if (largestShare < threshold) return null;
  
  const severity = clamp((largestShare - threshold) / (1 - threshold));
  
  return {
    type: SignalType.COLLATERAL_CONCENTRATION,
    severity,
    metrics: {
      largestSharePct: largestShare * 100,
      asset: largestAsset,
    },
    timestamp: snapshot.timestamp,
  };
}

/**
 * 10. High Leverage
 * leverage = totalCollateral / netWorth
 */
export function highLeverage(snapshot: WalletSnapshot): Signal | null {
  if (snapshot.netWorthUSD <= 0) return null;
  
  const leverage = snapshot.totalCollateralUSD / snapshot.netWorthUSD;
  const threshold = 3.0; // 3x leverage
  
  if (leverage < threshold) return null;
  
  const severity = clamp((leverage - threshold) / 7); // 10x = max severity
  
  return {
    type: SignalType.HIGH_LEVERAGE,
    severity,
    metrics: {
      leverage: leverage,
    },
    timestamp: snapshot.timestamp,
  };
}

/**
 * 11. Debt Ratio
 * debtRatio = totalDebt / totalCollateral
 */
export function debtRatio(snapshot: WalletSnapshot): Signal | null {
  if (snapshot.totalCollateralUSD === 0) return null;
  
  const ratio = snapshot.totalDebtUSD / snapshot.totalCollateralUSD;
  const threshold = 0.7; // 70%
  
  if (ratio < threshold) return null;
  
  const severity = clamp((ratio - threshold) / (1 - threshold));
  
  return {
    type: SignalType.DEBT_RATIO,
    severity,
    metrics: {
      debtRatio: ratio * 100,
    },
    timestamp: snapshot.timestamp,
  };
}

/**
 * 12. Collateral Price Sensitivity
 * Uses distance-to-liquidation as proxy
 */
export function collateralPriceSensitivity(snapshot: WalletSnapshot): Signal | null {
  const hf = snapshot.healthFactor;
  
  if (hf <= 0) return null;
  
  const distancePct = (hf - 1) / hf;
  const threshold = 0.15; // 15%
  
  if (distancePct >= threshold) return null;
  
  const severity = clamp((threshold - distancePct) / threshold);
  
  return {
    type: SignalType.COLLATERAL_PRICE_SENSITIVITY,
    severity,
    metrics: {
      distancePct: distancePct * 100,
    },
    timestamp: snapshot.timestamp,
  };
}

/**
 * 13. USD-Denominated Debt Exposure
 * Binary flag if borrowed asset is stablecoin
 */
export function usdDebtExposure(snapshot: WalletSnapshot): Signal | null {
  const stablecoins = ["USDC", "USDT", "DAI", "FRAX", "LUSD"];
  
  const hasStableDebt = snapshot.borrowPositions.some((b) =>
    stablecoins.includes(b.symbol)
  );
  
  if (!hasStableDebt) return null;
  
  return {
    type: SignalType.USD_DEBT_EXPOSURE,
    severity: 0.3, // Informational
    metrics: {
      borrowAssets: snapshot.borrowPositions.map((b) => b.symbol).join(", "),
    },
    timestamp: snapshot.timestamp,
  };
}

/**
 * 14. Net Worth Compression
 * compression = netWorth / totalCollateral (lower = worse)
 */
export function netWorthCompression(snapshot: WalletSnapshot): Signal | null {
  if (snapshot.totalCollateralUSD === 0) return null;
  
  const compression = snapshot.netWorthUSD / snapshot.totalCollateralUSD;
  const threshold = 0.3; // 30%
  
  if (compression >= threshold) return null;
  
  const severity = clamp((threshold - compression) / threshold);
  
  return {
    type: SignalType.NET_WORTH_COMPRESSION,
    severity,
    metrics: {
      compression: compression * 100,
    },
    timestamp: snapshot.timestamp,
  };
}

/**
 * 18. Supply Yield vs Borrow Cost
 * carry = supplyAPY - borrowAPY (negative = bad)
 */
export function supplyYieldVsBorrowCost(snapshot: WalletSnapshot): Signal | null {
  if (snapshot.supplyPositions.length === 0 || snapshot.borrowPositions.length === 0) {
    return null;
  }
  
  // Calculate weighted average APYs
  let totalSupplyAPY = 0;
  let totalSupplyUSD = 0;
  
  for (const supply of snapshot.supplyPositions) {
    totalSupplyAPY += supply.supplyAPY * supply.balanceUSD;
    totalSupplyUSD += supply.balanceUSD;
  }
  
  let totalBorrowAPY = 0;
  let totalBorrowUSD = 0;
  
  for (const borrow of snapshot.borrowPositions) {
    totalBorrowAPY += borrow.borrowAPY * borrow.debtUSD;
    totalBorrowUSD += borrow.debtUSD;
  }
  
  const avgSupplyAPY = totalSupplyUSD > 0 ? totalSupplyAPY / totalSupplyUSD : 0;
  const avgBorrowAPY = totalBorrowUSD > 0 ? totalBorrowAPY / totalBorrowUSD : 0;
  
  const carry = avgSupplyAPY - avgBorrowAPY;
  
  if (carry >= 0) return null;
  
  const severity = clamp(Math.abs(carry) / 10); // -10% = max severity
  
  return {
    type: SignalType.SUPPLY_YIELD_VS_BORROW_COST,
    severity,
    metrics: {
      carry: carry,
      avgSupplyAPY: avgSupplyAPY,
      avgBorrowAPY: avgBorrowAPY,
    },
    timestamp: snapshot.timestamp,
  };
}

/**
 * 19. Liquidation Threshold Proximity
 * liquidationGap = liquidationThreshold - currentLTV
 */
export function liquidationThresholdProximity(snapshot: WalletSnapshot): Signal | null {
  const gap = snapshot.liquidationThreshold - snapshot.currentLTV;
  const threshold = 0.05; // 5%
  
  if (gap >= threshold) return null;
  
  const severity = clamp((threshold - gap) / threshold);
  
  return {
    type: SignalType.LIQUIDATION_THRESHOLD_PROXIMITY,
    severity,
    metrics: {
      liquidationGap: gap * 100,
    },
    timestamp: snapshot.timestamp,
  };
}

/**
 * 20. Emergency Risk Flag
 * All conditions must be true:
 * - HF < 1.1
 * - availableBorrows = 0
 * - debtRatio > 0.7
 */
export function emergencyRiskFlag(snapshot: WalletSnapshot): Signal | null {
  const hf = snapshot.healthFactor;
  const availableBorrows = snapshot.availableBorrowsUSD;
  const debtRatio = snapshot.totalCollateralUSD > 0 
    ? snapshot.totalDebtUSD / snapshot.totalCollateralUSD 
    : 0;
  
  const isEmergency = hf < 1.1 && availableBorrows === 0 && debtRatio > 0.7;
  
  if (!isEmergency) return null;
  
  return {
    type: SignalType.EMERGENCY_RISK_FLAG,
    severity: 1.0,
    metrics: {
      healthFactor: hf,
      availableBorrowsUSD: availableBorrows,
      debtRatio: debtRatio * 100,
    },
    timestamp: snapshot.timestamp,
  };
}
