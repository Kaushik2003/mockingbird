/**
 * Signal Deduplicator
 * Prevents spam by suppressing duplicate signals
 */

import type { Signal } from "./types";

interface DeduplicationState {
  lastSeverity: number;
  lastEmitTime: Date;
}

export class SignalDeduplicator {
  private state: Map<string, DeduplicationState> = new Map();
  private suppressionWindowMs: number;
  private severityThreshold: number;

  constructor(
    suppressionWindowMs: number = 5 * 60 * 1000, // 5 minutes
    severityThreshold: number = 0.10 // 10% increase
  ) {
    this.suppressionWindowMs = suppressionWindowMs;
    this.severityThreshold = severityThreshold;
  }

  /**
   * Check if a signal should be emitted
   */
  shouldEmit(signal: Signal): boolean {
    const state = this.state.get(signal.type);
    
    // First time seeing this signal type - emit
    if (!state) {
      this.state.set(signal.type, {
        lastSeverity: signal.severity,
        lastEmitTime: signal.timestamp,
      });
      return true;
    }
    
    // Check if severity increased by threshold
    const severityIncrease = signal.severity - state.lastSeverity;
    if (severityIncrease >= this.severityThreshold) {
      this.state.set(signal.type, {
        lastSeverity: signal.severity,
        lastEmitTime: signal.timestamp,
      });
      return true;
    }
    
    // Check if suppression window has expired
    const timeSinceLastEmit = signal.timestamp.getTime() - state.lastEmitTime.getTime();
    if (timeSinceLastEmit >= this.suppressionWindowMs) {
      this.state.set(signal.type, {
        lastSeverity: signal.severity,
        lastEmitTime: signal.timestamp,
      });
      return true;
    }
    
    // Suppress
    return false;
  }

  /**
   * Clear deduplication state
   */
  clear(): void {
    this.state.clear();
  }

  /**
   * Get current state (for debugging)
   */
  getState(): Map<string, DeduplicationState> {
    return new Map(this.state);
  }
}
