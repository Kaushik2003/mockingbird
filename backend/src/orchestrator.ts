import { initializeDatabase, query } from "./db/connection";
import { Poller } from "./polling/poller";
import { SnapshotBuffer } from "./snapshots/buffer";
import { AAVE_V3_MARKETS, CHAIN_IDS } from "./aave/constants";
import { createAgentExecutor } from "./agent/executor";
import { EvmAddress } from "@aave/client";

// Map to track active pollers
const activePollers = new Map<string, Poller>();

// Sync interval (check for new agents)
const SYNC_INTERVAL = 10000;

async function startOrchestrator() {
  console.log("🚀 Starting Mockingbird Orchestrator...");

  await initializeDatabase();

  // Start sync loop
  setInterval(syncAgents, SYNC_INTERVAL);
  syncAgents(); // Initial sync
}

async function syncAgents() {
  try {
    const result = await query("SELECT * FROM agents WHERE status = 'active'");
    const activeAgents = result.rows;

    for (const agent of activeAgents) {
      const address = agent.wallet_address.toLowerCase();

      if (!activePollers.has(address)) {
        console.log(`🆕 Found new active agent: ${address}`);

        // Initialize Risk Engine for this agent
        const buffer = new SnapshotBuffer(10); // Keep last 10 snapshots

        const poller = new Poller({
          walletAddress: address,
          marketAddress: AAVE_V3_MARKETS.BASE_SEPOLIA as EvmAddress, // Use Base Sepolia
          chainId: CHAIN_IDS.BASE_SEPOLIA,
          intervalMs: 15000, // Poll every 15s
          buffer,
          onSnapshot: async (snapshot) => {
            await handleRiskSignal(agent, snapshot);
          }
        });

        poller.start();
        activePollers.set(address, poller);
      }
    }

    // Identify stopped agents (cleanup)
    const activeAddressSet = new Set(activeAgents.map(a => a.wallet_address.toLowerCase()));
    for (const [address, poller] of activePollers) {
      if (!activeAddressSet.has(address)) {
        console.log(`🛑 Stopping agent: ${address}`);
        poller.stop();
        activePollers.delete(address);
      }
    }

  } catch (error) {
    console.error("❌ Orchestrator sync failed:", error);
  }
}

async function handleRiskSignal(agent: any, snapshot: any) {
  const hf = Number(snapshot.healthFactor);
  console.log(`[RISK CHECK] Agent ${agent.wallet_address} | HF: ${hf.toFixed(2)}`);

  let shouldAct = false;
  let context = "";

  if (hf < 1.2 && hf > 0) {
    shouldAct = true;
    context = `ALERT: Health Factor is CRITICAL (${hf.toFixed(2)} < 1.2). You must REPAY debt immediately to avoid liquidation.`;
  } else if (hf > 2.0) {
    shouldAct = true;
    context = `OPPORTUNITY: Health Factor is HIGH (${hf.toFixed(2)} > 2.0). You can borrow more USDC to bridge for yield.`;
  }

  if (shouldAct) {
    console.log(`🤖 Triggering Agent Action for ${agent.wallet_address}...`);
    try {
      // Initialize Agent Executor
      const executor = await createAgentExecutor(agent.wallet_address, agent.private_key);

      // Execute
      const result = await executor.invoke({
        input: context
      });

      console.log(`✅ Agent Execution Result:`, result);
    } catch (error) {
      console.error(`❌ Agent Execution Failed:`, error);
    }
  }
}

// Start if run directly
if (import.meta.main) {
  startOrchestrator().catch(console.error);
}
