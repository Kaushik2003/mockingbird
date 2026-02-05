/**
 * Console Alert Formatter
 * Pretty-prints signals to console with colors
 */

import type { Signal } from "../signals/types";
import { SignalType } from "../signals/types";

/**
 * Get severity level text
 */
function getSeverityLevel(severity: number): string {
  if (severity >= 0.8) return "CRITICAL";
  if (severity >= 0.6) return "HIGH";
  if (severity >= 0.4) return "MEDIUM";
  if (severity >= 0.2) return "LOW";
  return "INFO";
}

/**
 * Get severity color code (ANSI)
 */
function getSeverityColor(severity: number): string {
  if (severity >= 0.8) return "\x1b[91m"; // Bright red
  if (severity >= 0.6) return "\x1b[31m"; // Red
  if (severity >= 0.4) return "\x1b[33m"; // Yellow
  if (severity >= 0.2) return "\x1b[93m"; // Bright yellow
  return "\x1b[36m"; // Cyan
}

const RESET = "\x1b[0m";
const BOLD = "\x1b[1m";
const DIM = "\x1b[2m";

/**
 * Format a single signal for console output
 */
export function formatSignal(signal: Signal): string {
  const color = getSeverityColor(signal.severity);
  const level = getSeverityLevel(signal.severity);
  
  let output = `\n${color}${BOLD}🚨 SIGNAL: ${signal.type}${RESET}\n`;
  output += `   ${color}Severity: ${signal.severity.toFixed(2)} (${level})${RESET}\n`;
  
  // Format metrics
  for (const [key, value] of Object.entries(signal.metrics)) {
    const formattedValue = typeof value === "number" 
      ? value.toFixed(2) 
      : String(value);
    output += `   ${key}: ${formattedValue}\n`;
  }
  
  return output;
}

/**
 * Format composite risk score
 */
export function formatCompositeRisk(signal: Signal): string {
  const color = getSeverityColor(signal.severity);
  const level = getSeverityLevel(signal.severity);
  
  let output = `\n${color}${BOLD}⚠️  COMPOSITE RISK SCORE: ${signal.severity.toFixed(2)} (${level})${RESET}\n`;
  output += `   ${DIM}Contributors:${RESET}\n`;
  
  for (const [key, value] of Object.entries(signal.metrics)) {
    if (key === "score") continue;
    const formattedValue = typeof value === "number" 
      ? value.toFixed(2) 
      : String(value);
    output += `   ${key}=${formattedValue} `;
  }
  output += "\n";
  
  return output;
}

/**
 * Emit signals to console
 */
export function emitSignals(signals: Signal[]): void {
  if (signals.length === 0) {
    return;
  }
  
  console.log("\n" + "=".repeat(60));
  
  // Separate composite risk from other signals
  const compositeSignal = signals.find(s => s.type === SignalType.COMPOSITE_RISK);
  const otherSignals = signals.filter(s => s.type !== SignalType.COMPOSITE_RISK);
  
  // Print other signals first
  for (const signal of otherSignals) {
    console.log(formatSignal(signal));
  }
  
  // Print composite risk last (most important)
  if (compositeSignal) {
    console.log(formatCompositeRisk(compositeSignal));
  }
  
  console.log("=".repeat(60) + "\n");
}

/**
 * Log snapshot saved confirmation
 */
export function logSnapshotSaved(): void {
  console.log(`${DIM}💾 Snapshot saved to database${RESET}\n`);
}
