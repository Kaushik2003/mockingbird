/**
 * Aave Demo Script - Comprehensive Logging
 * Run this to test and console.log ALL user/market details.
 *
 * Usage: bun run src/aave/demo.ts [wallet_address]
 */

import {
  getUserFullPosition,
  getUserTransactionHistory,
  CHAIN_IDS,
  AAVE_V3_MARKETS,
} from "./index";

// Example wallet address
const TEST_WALLET = "0x249d918Aa474DAc284d67BB7A3c02c0f3Fe86ce8";

// Custom JSON serializer that handles BigInt
function safeStringify(obj: any, indent: number = 2): string {
  try {
    return JSON.stringify(obj, (key, value) => {
      if (typeof value === "bigint") {
        return value.toString() + "n";
      }
      return value;
    }, indent);
  } catch (e) {
    return `[Could not stringify: ${e}]`;
  }
}

// Helper to safely format any value
function formatValue(val: any): string {
  if (val === null || val === undefined) return "N/A";
  if (typeof val === "bigint") return val.toString();
  
  // Handle PercentValue objects (have .value and .formatted)
  if (typeof val === "object") {
    if ("formatted" in val) return val.formatted + "%";
    if ("value" in val) return String(val.value);
    if ("amount" in val) return String(val.amount);
  }
  
  return String(val);
}

// Safely access nested properties
function safeGet(obj: any, path: string, defaultVal: any = null): any {
  if (!obj) return defaultVal;
  const keys = path.split(".");
  let current = obj;
  for (const key of keys) {
    if (current === null || current === undefined) return defaultVal;
    current = current[key];
  }
  return current ?? defaultVal;
}

async function demoUserPosition(walletAddress: string) {
  console.log("\n" + "=".repeat(60));
  console.log("                    USER POSITION");
  console.log("=".repeat(60) + "\n");
  
  console.log(`👤 Wallet: ${walletAddress}\n`);

  try {
    const position = await getUserFullPosition(
      walletAddress,
      AAVE_V3_MARKETS.ETHEREUM_CORE,
      CHAIN_IDS.ETHEREUM
    );

    // === ACCOUNT STATE ===
    console.log("─".repeat(50));
    console.log("📊 ACCOUNT STATE (MarketUserState)");
    console.log("─".repeat(50));
    
    if (position.state) {
      const state = position.state;
      console.log(`  Health Factor: ${formatValue(state.healthFactor)}`);
      console.log(`  Net Worth (USD): $${formatValue(state.netWorth)}`);
      console.log(`  Net APY: ${formatValue(state.netAPY)}`);
      console.log(`  Total Collateral (USD): $${formatValue(state.totalCollateralBase)}`);
      console.log(`  Total Debt (USD): $${formatValue(state.totalDebtBase)}`);
      console.log(`  Available Borrows (USD): $${formatValue(state.availableBorrowsBase)}`);
      console.log(`  Liquidation Threshold: ${formatValue(state.currentLiquidationThreshold)}`);
      console.log(`  LTV: ${formatValue(state.ltv)}`);
      console.log(`  eMode Enabled: ${state.eModeEnabled}`);
      console.log(`  In Isolation Mode: ${state.isInIsolationMode}`);
    } else {
      console.log("  No state data available (user may have no positions)");
    }

    // === SUPPLY POSITIONS ===
    console.log(`\n${"─".repeat(50)}`);
    console.log(`📥 SUPPLY POSITIONS (${position.supplies?.length ?? 0})`);
    console.log(`${"─".repeat(50)}`);
    
    if (!position.supplies || position.supplies.length === 0) {
      console.log("  No supply positions");
    } else {
      for (const supply of position.supplies) {
        // Based on actual API: currency.symbol, balance.amount.value, balance.usd
        const symbol = safeGet(supply, "currency.symbol") ?? "Unknown";
        const name = safeGet(supply, "currency.name") ?? "";
        const tokenAddress = safeGet(supply, "currency.address") ?? "";
        const decimals = safeGet(supply, "currency.decimals") ?? 18;
        
        // Balance info
        const balanceValue = safeGet(supply, "balance.amount.value") ?? "0";
        const balanceUsd = safeGet(supply, "balance.usd") ?? "0";
        const usdPerToken = safeGet(supply, "balance.usdPerToken") ?? "0";
        
        // APY
        const apy = supply.apy;
        const apyFormatted = safeGet(apy, "formatted") ?? safeGet(apy, "value") ?? "0";
        
        // Collateral info
        const isCollateral = supply.isCollateral ?? false;
        const canBeCollateral = supply.canBeCollateral ?? false;
        
        // Market info
        const marketName = safeGet(supply, "market.name") ?? "";
        const chainName = safeGet(supply, "market.chain.name") ?? "";
        
        console.log(`\n  ▸ ${symbol} (${name})`);
        console.log(`    Market: ${marketName} on ${chainName}`);
        console.log(`    Token Address: ${tokenAddress}`);
        console.log(`    Decimals: ${decimals}`);
        console.log(`    ─────────────────────────────`);
        console.log(`    Balance: ${balanceValue} ${symbol}`);
        console.log(`    Balance (USD): $${balanceUsd}`);
        console.log(`    Price: $${usdPerToken} per ${symbol}`);
        console.log(`    Supply APY: ${apyFormatted}%`);
        console.log(`    ─────────────────────────────`);
        console.log(`    Is Collateral: ${isCollateral ? "✅ Yes" : "❌ No"}`);
        console.log(`    Can Be Collateral: ${canBeCollateral ? "✅ Yes" : "❌ No"}`);
      }
    }

    // === BORROW POSITIONS ===
    console.log(`\n${"─".repeat(50)}`);
    console.log(`📤 BORROW POSITIONS (${position.borrows?.length ?? 0})`);
    console.log(`${"─".repeat(50)}`);
    
    if (!position.borrows || position.borrows.length === 0) {
      console.log("  No borrow positions");
    } else {
      for (const borrow of position.borrows) {
        // Based on actual API: currency.symbol, debt.amount.value, debt.usd
        const symbol = safeGet(borrow, "currency.symbol") ?? "Unknown";
        const name = safeGet(borrow, "currency.name") ?? "";
        const tokenAddress = safeGet(borrow, "currency.address") ?? "";
        const decimals = safeGet(borrow, "currency.decimals") ?? 18;
        
        // Debt info
        const debtValue = safeGet(borrow, "debt.amount.value") ?? "0";
        const debtUsd = safeGet(borrow, "debt.usd") ?? "0";
        const usdPerToken = safeGet(borrow, "debt.usdPerToken") ?? "0";
        
        // APY
        const apy = borrow.apy;
        const apyFormatted = safeGet(apy, "formatted") ?? safeGet(apy, "value") ?? "0";
        
        // Market info
        const marketName = safeGet(borrow, "market.name") ?? "";
        const chainName = safeGet(borrow, "market.chain.name") ?? "";
        
        console.log(`\n  ▸ ${symbol} (${name})`);
        console.log(`    Market: ${marketName} on ${chainName}`);
        console.log(`    Token Address: ${tokenAddress}`);
        console.log(`    Decimals: ${decimals}`);
        console.log(`    ─────────────────────────────`);
        console.log(`    Debt: ${debtValue} ${symbol}`);
        console.log(`    Debt (USD): $${debtUsd}`);
        console.log(`    Price: $${usdPerToken} per ${symbol}`);
        console.log(`    Borrow APY: ${apyFormatted}%`);
      }
    }

    // === RISK METRICS SUMMARY ===
    console.log(`\n${"─".repeat(50)}`);
    console.log("⚠️  RISK METRICS SUMMARY");
    console.log(`${"─".repeat(50)}`);
    
    if (position.state) {
      const state = position.state;
      const hf = parseFloat(String(state.healthFactor));
      const collateral = parseFloat(String(state.totalCollateralBase));
      const debt = parseFloat(String(state.totalDebtBase));
      
      console.log(`  Health Factor: ${state.healthFactor}`);
      console.log(`  Total Collateral: $${collateral.toLocaleString()}`);
      console.log(`  Total Debt: $${debt.toLocaleString()}`);
      console.log(`  Net Worth: $${parseFloat(String(state.netWorth)).toLocaleString()}`);
      console.log(`  LTV: ${formatValue(state.ltv)}`);
      console.log(`  Liquidation Threshold: ${formatValue(state.currentLiquidationThreshold)}`);
      
      // Risk assessment
      if (!isNaN(hf) && hf > 0) {
        const distanceToLiq = ((hf - 1) / hf) * 100;
        console.log(`\n  📉 Distance to Liquidation: ~${distanceToLiq.toFixed(2)}% price drop`);
        
        if (hf < 1.0) {
          console.log(`  ⛔ CRITICAL: Below liquidation threshold!`);
        } else if (hf < 1.1) {
          console.log(`  🔴 HIGH RISK: Very close to liquidation (HF < 1.1)!`);
        } else if (hf < 1.25) {
          console.log(`  🟠 MEDIUM RISK: Monitor closely (HF < 1.25)!`);
        } else if (hf < 1.5) {
          console.log(`  🟡 LOW-MEDIUM RISK: Consider adding collateral (HF < 1.5)`);
        } else {
          console.log(`  🟢 LOW RISK: Position is healthy (HF >= 1.5)`);
        }
        
        // Calculate how much price can drop before liquidation
        console.log(`\n  💡 Analysis:`);
        console.log(`     Current HF = ${hf.toFixed(4)}`);
        console.log(`     Collateral can drop ~${distanceToLiq.toFixed(2)}% before liquidation`);
        
        if (debt > 0) {
          const utilizationRate = (debt / collateral) * 100;
          console.log(`     Utilization: ${utilizationRate.toFixed(2)}% of collateral`);
        }
      }
    } else {
      console.log("  No state data available");
    }

  } catch (error) {
    console.error("Error fetching user position:", error);
    if (error instanceof Error) {
      console.error("Stack:", error.stack);
    }
  }
}

async function demoUserTransactions(walletAddress: string) {
  console.log("\n" + "=".repeat(60));
  console.log("                    USER TRANSACTIONS");
  console.log("=".repeat(60) + "\n");
  
  console.log(`📜 Wallet: ${walletAddress}\n`);

  try {
    const history = await getUserTransactionHistory(
      walletAddress,
      AAVE_V3_MARKETS.ETHEREUM_CORE,
      CHAIN_IDS.ETHEREUM
    );

    if (!history?.items || history.items.length === 0) {
      console.log("  No transactions found for this wallet.");
      return;
    }

    console.log(`Found ${history.items.length} transaction(s)\n`);
    console.log("─".repeat(50));

    for (const tx of history.items.slice(0, 10)) {
      console.log(`\n▸ Type: ${tx.__typename}`);
      console.log(`  Date: ${tx.date}`);
      console.log(`  Block: ${tx.block}`);
      console.log(`  TX Hash: ${tx.txHash}`);
    }

    if (history.items.length > 10) {
      console.log(`\n  ... and ${history.items.length - 10} more transactions`);
    }

  } catch (error) {
    console.error("Error fetching transactions:", error);
  }
}

async function demoRawData(walletAddress: string) {
  console.log("\n" + "=".repeat(60));
  console.log("                    RAW DATA DUMP");
  console.log("=".repeat(60) + "\n");

  try {
    const position = await getUserFullPosition(
      walletAddress,
      AAVE_V3_MARKETS.ETHEREUM_CORE,
      CHAIN_IDS.ETHEREUM
    );

    console.log("─".repeat(50));
    console.log("RAW STATE:");
    console.log("─".repeat(50));
    console.log(safeStringify(position.state));

    if (position.supplies && position.supplies.length > 0) {
      console.log("\n" + "─".repeat(50));
      console.log("RAW FIRST SUPPLY:");
      console.log("─".repeat(50));
      console.log(safeStringify(position.supplies[0]));
    }

    if (position.borrows && position.borrows.length > 0) {
      console.log("\n" + "─".repeat(50));
      console.log("RAW FIRST BORROW:");
      console.log("─".repeat(50));
      console.log(safeStringify(position.borrows[0]));
    }

  } catch (error) {
    console.error("Error fetching raw data:", error);
  }
}

// Main execution
async function main() {
  console.log("🚀 AAVE INTEGRATION - COMPREHENSIVE DEMO\n");
  console.log("=".repeat(60));
  console.log("  Started at: " + new Date().toISOString());
  console.log("=".repeat(60));

  const wallet = process.argv[2] || TEST_WALLET;
  console.log(`\n  Target Wallet: ${wallet}`);
  console.log(`  Network: Ethereum Mainnet`);
  console.log(`  Market: Aave V3 Core`);

  try {
    await demoUserPosition(wallet);
    await demoUserTransactions(wallet);
    await demoRawData(wallet);

    console.log("\n" + "=".repeat(60));
    console.log("✅ DEMO COMPLETED!");
    console.log("=".repeat(60) + "\n");
    
  } catch (error) {
    console.error("\n❌ Demo failed:", error);
    process.exit(1);
  }
}

// Run with proper Promise handling
console.log("Script starting...\n");
main().then(() => {
  console.log("Script finished.");
}).catch((err) => {
  console.error("Script failed:", err);
  process.exit(1);
});
