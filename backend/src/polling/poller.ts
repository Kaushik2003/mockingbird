/**
 * Polling Service
 * Continuously polls Aave for wallet state and creates snapshots
 */

import { getUserFullPosition } from "../aave/user";
import { normalizeAaveResponse } from "../snapshots/normalizer";
import { insertSnapshot } from "../db/snapshots";
import type { SnapshotBuffer } from "../snapshots/buffer";
import type { EvmAddress, ChainId } from "@aave/client";

export interface PollerConfig {
  walletAddress: string;
  marketAddress: EvmAddress;
  chainId: ChainId;
  intervalMs: number;
  buffer: SnapshotBuffer;
  onSnapshot?: (snapshot: any) => void; // Callback for signal engine
}

export class Poller {
  private config: PollerConfig;
  private isRunning: boolean = false;
  private pollCount: number = 0;
  private errorCount: number = 0;
  private timeoutId: NodeJS.Timeout | null = null;

  constructor(config: PollerConfig) {
    this.config = config;
  }

  /**
   * Start polling
   */
  start(): void {
    if (this.isRunning) {
      console.warn("⚠️  Poller already running");
      return;
    }

    this.isRunning = true;
    console.log(`✅ Poller started (interval: ${this.config.intervalMs}ms)`);
    console.log(`   Wallet: ${this.config.walletAddress}`);
    
    // Start first poll immediately
    this.schedulePoll();
  }

  /**
   * Stop polling
   */
  stop(): void {
    if (!this.isRunning) {
      return;
    }

    this.isRunning = false;
    
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
      this.timeoutId = null;
    }

    console.log(`✅ Poller stopped (${this.pollCount} polls, ${this.errorCount} errors)`);
  }

  /**
   * Schedule next poll
   */
  private schedulePoll(): void {
    if (!this.isRunning) return;

    this.timeoutId = setTimeout(() => {
      this.executePoll();
    }, this.config.intervalMs);
  }

  /**
   * Execute a single poll cycle
   */
  private async executePoll(): Promise<void> {
    const startTime = Date.now();
    this.pollCount++;

    try {
      // Fetch Aave data
      const aaveResponse = await getUserFullPosition(
        this.config.walletAddress,
        this.config.marketAddress,
        this.config.chainId
      );

      // Normalize to snapshot
      const snapshot = normalizeAaveResponse(
        this.config.walletAddress,
        aaveResponse
      );

      // Push to in-memory buffer
      this.config.buffer.push(snapshot);

      // Persist to database
      try {
        await insertSnapshot(snapshot);
      } catch (dbError) {
        console.error("❌ Database insert failed:", dbError);
        // Continue even if DB fails
      }

      // Trigger signal engine callback
      if (this.config.onSnapshot) {
        try {
          this.config.onSnapshot(snapshot);
        } catch (callbackError) {
          console.error("❌ Signal engine callback failed:", callbackError);
        }
      }

      const duration = ((Date.now() - startTime) / 1000).toFixed(2);
      console.log(`[${new Date().toISOString()}] 📊 Poll #${this.pollCount} completed (${duration}s)`);
      console.log(`   HF: ${snapshot.healthFactor.toFixed(4)} | Collateral: $${snapshot.totalCollateralUSD.toFixed(2)} | Debt: $${snapshot.totalDebtUSD.toFixed(2)}`);

    } catch (error) {
      this.errorCount++;
      console.error(`❌ Poll #${this.pollCount} failed:`, error);
      // Continue polling despite errors
    }

    // Schedule next poll
    this.schedulePoll();
  }

  /**
   * Get polling statistics
   */
  getStats() {
    return {
      isRunning: this.isRunning,
      pollCount: this.pollCount,
      errorCount: this.errorCount,
      bufferSize: this.config.buffer.size(),
    };
  }
}
