/**
 * Composite Risk Score
 * Weighted combination of signal severities
 */

import type { Signal, CompositeRiskScore } from "./types";
import { SignalType, clamp } from "./types";

/**
 * Calculate composite risk score from all signals
 */
export function calculateCompositeRisk(signals: Signal[]): CompositeRiskScore {
  // Extract severities for key signals
  const hfSeverity = signals.find(s => s.type === SignalType.HEALTH_FACTOR_RISK)?.severity || 0;
  const liqSeverity = signals.find(s => s.type === SignalType.DISTANCE_TO_LIQUIDATION)?.severity || 0;
  const debtRatioSeverity = signals.find(s => s.type === SignalType.DEBT_RATIO)?.severity || 0;
  const leverageSeverity = signals.find(s => s.type === SignalType.HIGH_LEVERAGE)?.severity || 0;
  const concentrationSeverity = signals.find(s => s.type === SignalType.COLLATERAL_CONCENTRATION)?.severity || 0;
  
  // Weighted combination
  const weights = {
    healthFactor: 0.35,
    liquidation: 0.30,
    debtRatio: 0.15,
    leverage: 0.10,
    concentration: 0.10,
  };
  
  const score = clamp(
    weights.healthFactor * hfSeverity +
    weights.liquidation * liqSeverity +
    weights.debtRatio * debtRatioSeverity +
    weights.leverage * leverageSeverity +
    weights.concentration * concentrationSeverity
  );
  
  return {
    score,
    contributors: {
      healthFactor: hfSeverity,
      liquidation: liqSeverity,
      debtRatio: debtRatioSeverity,
      leverage: leverageSeverity,
      concentration: concentrationSeverity,
    },
    timestamp: new Date(),
  };
}

/**
 * Create composite risk signal if score > threshold
 */
export function compositeRiskSignal(compositeRisk: CompositeRiskScore): Signal | null {
  const threshold = 0.6;
  
  if (compositeRisk.score < threshold) return null;
  
  return {
    type: SignalType.COMPOSITE_RISK,
    severity: compositeRisk.score,
    metrics: {
      score: compositeRisk.score,
      ...compositeRisk.contributors,
    },
    timestamp: compositeRisk.timestamp,
  };
}
