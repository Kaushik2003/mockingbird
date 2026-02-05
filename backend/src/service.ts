/**
 * Main Service Orchestrator
 * Wires together all components and manages lifecycle
 */

import { loadConfig, printConfig } from "./config";
import { initializeDatabase, runMigrations, closeDatabase } from "./db/connection";
import { deleteOldSnapshots } from "./db/snapshots";
import { SnapshotBuffer } from "./snapshots/buffer";
import { Poller } from "./polling/poller";
import { SignalEngine } from "./signals/engine";
import { emitSignals, logSnapshotSaved } from "./alerts/console";

let poller: Poller | null = null;
let cleanupInterval: NodeJS.Timeout | null = null;

/**
 * Start the service
 */
export async function startService(): Promise<void> {
  console.log("\n🚀 Aave Risk Signal Engine");
  console.log("=" .repeat(60));
  console.log(`Started at: ${new Date().toISOString()}`);
  console.log("=" .repeat(60) + "\n");

  try {
    // 1. Load configuration
    const config = loadConfig();
    printConfig(config);

    // 2. Initialize database
    initializeDatabase(config.databaseUrl);
    await runMigrations();

    // 3. Initialize snapshot buffer
    const buffer = new SnapshotBuffer(config.bufferSize);
    console.log(`✅ Snapshot buffer initialized (size: ${config.bufferSize})\n`);

    // 4. Initialize signal engine
    const signalEngine = new SignalEngine();
    console.log("✅ Signal engine initialized\n");

    // 5. Create poller with signal callback
    poller = new Poller({
      walletAddress: config.walletAddress,
      marketAddress: config.marketAddress,
      chainId: config.chainId,
      intervalMs: config.pollIntervalMs,
      buffer,
      onSnapshot: (snapshot) => {
        // Compute signals
        const signals = signalEngine.computeAllSignals(snapshot, buffer);
        
        // Emit to console
        if (signals.length > 0) {
          emitSignals(signals);
        }
        
        // Log snapshot saved
        logSnapshotSaved();
      },
    });

    // 6. Start poller
    poller.start();

    // 7. Schedule retention cleanup (daily)
    cleanupInterval = setInterval(async () => {
      try {
        const deleted = await deleteOldSnapshots(config.retentionDays);
        if (deleted > 0) {
          console.log(`🗑️  Deleted ${deleted} old snapshots (retention: ${config.retentionDays} days)`);
        }
      } catch (error) {
        console.error("❌ Retention cleanup failed:", error);
      }
    }, 24 * 60 * 60 * 1000); // Once per day

    console.log("✅ Service started successfully\n");
    console.log("Press Ctrl+C to stop\n");

  } catch (error) {
    console.error("❌ Service startup failed:", error);
    process.exit(1);
  }
}

/**
 * Stop the service gracefully
 */
export async function stopService(): Promise<void> {
  console.log("\n🛑 Shutting down gracefully...");

  // Stop poller
  if (poller) {
    poller.stop();
    poller = null;
  }

  // Stop cleanup interval
  if (cleanupInterval) {
    clearInterval(cleanupInterval);
    cleanupInterval = null;
  }

  // Close database
  await closeDatabase();

  console.log("✅ Service stopped\n");
}

/**
 * Handle shutdown signals
 */
process.on("SIGINT", async () => {
  await stopService();
  process.exit(0);
});

process.on("SIGTERM", async () => {
  await stopService();
  process.exit(0);
});
