/**
 * In-Memory Snapshot Ring Buffer
 * Stores recent snapshots for real-time signal computation
 */

import type { WalletSnapshot } from "./types";

export class SnapshotBuffer {
  private buffer: WalletSnapshot[] = [];
  private maxSize: number;

  constructor(maxSize: number = 120) {
    this.maxSize = maxSize;
  }

  /**
   * Add a new snapshot (FIFO eviction when full)
   */
  push(snapshot: WalletSnapshot): void {
    this.buffer.push(snapshot);
    
    // Evict oldest if over capacity
    if (this.buffer.length > this.maxSize) {
      this.buffer.shift();
    }
  }

  /**
   * Get the most recent snapshot
   */
  getLatest(): WalletSnapshot | null {
    if (this.buffer.length === 0) return null;
    return this.buffer[this.buffer.length - 1];
  }

  /**
   * Get the second-most recent snapshot
   */
  getPrevious(): WalletSnapshot | null {
    if (this.buffer.length < 2) return null;
    return this.buffer[this.buffer.length - 2];
  }

  /**
   * Get snapshot from approximately N minutes ago
   */
  getNMinutesAgo(minutes: number): WalletSnapshot | null {
    if (this.buffer.length === 0) return null;
    
    const now = new Date();
    const targetTime = new Date(now.getTime() - minutes * 60 * 1000);
    
    // Find closest snapshot before target time
    let closest: WalletSnapshot | null = null;
    let closestDiff = Infinity;
    
    for (const snapshot of this.buffer) {
      const diff = Math.abs(snapshot.timestamp.getTime() - targetTime.getTime());
      if (snapshot.timestamp <= targetTime && diff < closestDiff) {
        closest = snapshot;
        closestDiff = diff;
      }
    }
    
    return closest;
  }

  /**
   * Get all snapshots (for debugging)
   */
  getAll(): WalletSnapshot[] {
    return [...this.buffer];
  }

  /**
   * Get buffer size
   */
  size(): number {
    return this.buffer.length;
  }

  /**
   * Clear the buffer
   */
  clear(): void {
    this.buffer = [];
  }
}
