/**
 * Simple Aave Test Script
 * Tests the basic API calls with proper output handling
 */

import { AaveClient, evmAddress, chainId } from "@aave/client";
import { userMarketState, userSupplies, userBorrows } from "@aave/client/actions";

const client = AaveClient.create();

const TEST_WALLET = "0x249d918Aa474DAc284d67BB7A3c02c0f3Fe86ce8";
const MARKET_ADDRESS = evmAddress("0x87870bca3f3fd6335c3f4ce8392d69350b4fa4e2");
const CHAIN_ID = chainId(1);

// Custom JSON serializer that handles BigInt and other special types
function safeStringify(obj: any, indent: number = 2): string {
  return JSON.stringify(obj, (key, value) => {
    if (typeof value === "bigint") {
      return value.toString() + "n";
    }
    return value;
  }, indent);
}

// Helper to print object with all keys
function printObject(obj: any, prefix: string = ""): void {
  if (obj === null || obj === undefined) {
    console.log(`${prefix}null`);
    return;
  }
  
  if (typeof obj !== "object") {
    console.log(`${prefix}${obj}`);
    return;
  }
  
  for (const [key, value] of Object.entries(obj)) {
    const fullKey = prefix ? `${prefix}.${key}` : key;
    
    if (value === null || value === undefined) {
      console.log(`  ${fullKey}: null`);
    } else if (typeof value === "object" && !Array.isArray(value)) {
      console.log(`  ${fullKey}: [Object]`);
      // Don't recurse too deep
    } else if (Array.isArray(value)) {
      console.log(`  ${fullKey}: [Array of ${value.length}]`);
    } else {
      console.log(`  ${fullKey}: ${value}`);
    }
  }
}

async function main() {
  console.log("========================================");
  console.log("       AAVE API TEST SCRIPT");
  console.log("========================================\n");
  
  console.log("Configuration:");
  console.log("  Wallet:", TEST_WALLET);
  console.log("  Market:", MARKET_ADDRESS);
  console.log("  Chain ID:", CHAIN_ID);
  console.log("");

  try {
    // =====================
    // Test 1: User Market State
    // =====================
    console.log("========================================");
    console.log("TEST 1: userMarketState");
    console.log("========================================");
    
    const stateResult = await userMarketState(client, {
      market: MARKET_ADDRESS,
      user: evmAddress(TEST_WALLET),
      chainId: CHAIN_ID,
    });

    if (stateResult.isErr()) {
      console.log("❌ Error:", stateResult.error);
    } else {
      console.log("✅ Success!");
      const state = stateResult.value;
      console.log("\n  Raw keys:", Object.keys(state).join(", "));
      console.log("\n  Values:");
      printObject(state);
      console.log("\n  Full JSON:");
      try {
        console.log(safeStringify(state));
      } catch (e) {
        console.log("  [Could not stringify - ", e, "]");
      }
    }

    // =====================
    // Test 2: User Supplies
    // =====================
    console.log("\n========================================");
    console.log("TEST 2: userSupplies");
    console.log("========================================");
    
    const suppliesResult = await userSupplies(client, {
      markets: [{ address: MARKET_ADDRESS, chainId: CHAIN_ID }],
      user: evmAddress(TEST_WALLET),
    });

    if (suppliesResult.isErr()) {
      console.log("❌ Error:", suppliesResult.error);
    } else {
      console.log("✅ Success!");
      const supplies = suppliesResult.value;
      console.log("  Count:", supplies.length);
      
      if (supplies.length > 0) {
        const first = supplies[0];
        console.log("\n  First Supply - Keys:", Object.keys(first).join(", "));
        console.log("\n  First Supply - Values:");
        printObject(first);
        console.log("\n  First Supply - Full JSON:");
        try {
          console.log(safeStringify(first));
        } catch (e) {
          console.log("  [Could not stringify - ", e, "]");
        }
      } else {
        console.log("  No supply positions found");
      }
    }

    // =====================
    // Test 3: User Borrows
    // =====================
    console.log("\n========================================");
    console.log("TEST 3: userBorrows");
    console.log("========================================");
    
    const borrowsResult = await userBorrows(client, {
      markets: [{ address: MARKET_ADDRESS, chainId: CHAIN_ID }],
      user: evmAddress(TEST_WALLET),
    });

    if (borrowsResult.isErr()) {
      console.log("❌ Error:", borrowsResult.error);
    } else {
      console.log("✅ Success!");
      const borrows = borrowsResult.value;
      console.log("  Count:", borrows.length);
      
      if (borrows.length > 0) {
        const first = borrows[0];
        console.log("\n  First Borrow - Keys:", Object.keys(first).join(", "));
        console.log("\n  First Borrow - Values:");
        printObject(first);
        console.log("\n  First Borrow - Full JSON:");
        try {
          console.log(safeStringify(first));
        } catch (e) {
          console.log("  [Could not stringify - ", e, "]");
        }
      } else {
        console.log("  No borrow positions found");
      }
    }

    console.log("\n========================================");
    console.log("       ALL TESTS COMPLETE");
    console.log("========================================\n");
    
  } catch (error) {
    console.error("\n❌ UNEXPECTED ERROR:", error);
    if (error instanceof Error) {
      console.error("  Stack:", error.stack);
    }
  }
}

// Run immediately
console.log("Script starting...\n");
main().then(() => {
  console.log("Script finished.");
}).catch((err) => {
  console.error("Script failed:", err);
  process.exit(1);
});
