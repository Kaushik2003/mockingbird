/**
 * Signal Engine
 * Orchestrates all signal computation
 */

import type { WalletSnapshot } from "../snapshots/types";
import type { SnapshotBuffer } from "../snapshots/buffer";
import type { Signal } from "./types";
import { SignalDeduplicator } from "./deduplicator";
import { calculateCompositeRisk, compositeRiskSignal } from "./composite";

// Import all instant signals
import {
  healthFactorRisk,
  distanceToLiquidation,
  collateralUtilization,
  ltvPressure,
  zeroBorrowBuffer,
  netAPYDrag,
  borrowCostPressure,
  singleAssetCollateral,
  collateralConcentration,
  highLeverage,
  debtRatio,
  collateralPriceSensitivity,
  usdDebtExposure,
  netWorthCompression,
  supplyYieldVsBorrowCost,
  liquidationThresholdProximity,
  emergencyRiskFlag,
} from "./instant-signals";

// Import trend signals
import {
  healthFactorTrend,
  collateralValueDrift,
  debtAccretion,
} from "./trend-signals";

export class SignalEngine {
  private deduplicator: SignalDeduplicator;

  constructor() {
    this.deduplicator = new SignalDeduplicator();
  }

  /**
   * Compute all signals for a snapshot
   */
  computeAllSignals(snapshot: WalletSnapshot, buffer: SnapshotBuffer): Signal[] {
    const allSignals: Signal[] = [];

    // Instant signals (from current snapshot only)
    const instantSignals = [
      healthFactorRisk(snapshot),
      distanceToLiquidation(snapshot),
      collateralUtilization(snapshot),
      ltvPressure(snapshot),
      zeroBorrowBuffer(snapshot),
      netAPYDrag(snapshot),
      borrowCostPressure(snapshot),
      singleAssetCollateral(snapshot),
      collateralConcentration(snapshot),
      highLeverage(snapshot),
      debtRatio(snapshot),
      collateralPriceSensitivity(snapshot),
      usdDebtExposure(snapshot),
      netWorthCompression(snapshot),
      supplyYieldVsBorrowCost(snapshot),
      liquidationThresholdProximity(snapshot),
      emergencyRiskFlag(snapshot),
    ];

    allSignals.push(...instantSignals.filter((s) => s !== null) as Signal[]);

    // Trend signals (require historical data)
    const previous = buffer.getPrevious();
    const tenMinAgo = buffer.getNMinutesAgo(10);

    const trendSignals = [
      healthFactorTrend(snapshot, tenMinAgo),
      collateralValueDrift(snapshot, previous),
      debtAccretion(snapshot, previous),
    ];

    allSignals.push(...trendSignals.filter((s) => s !== null) as Signal[]);

    // Calculate composite risk
    const compositeRisk = calculateCompositeRisk(allSignals);
    const compositeSignal = compositeRiskSignal(compositeRisk);
    
    if (compositeSignal) {
      allSignals.push(compositeSignal);
    }

    // Apply deduplication
    const signalsToEmit = allSignals.filter((signal) =>
      this.deduplicator.shouldEmit(signal)
    );

    return signalsToEmit;
  }

  /**
   * Clear deduplication state
   */
  clearState(): void {
    this.deduplicator.clear();
  }
}
