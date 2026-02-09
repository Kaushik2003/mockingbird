import { describe, expect, test, mock, beforeAll } from "bun:test";
import { MerkleTree } from "merkletreejs";
import keccak256 from "keccak256";

// Mock DB
const mockRows: any[] = [];
mock.module("../src/db/connection", () => ({
  initializeDatabase: () => {},
  runMigrations: () => {},
  query: async (text: string, params: any[]) => {
    if (text.includes("INSERT INTO users")) {
      return { rows: [{ id: 1 }] };
    }
    if (text.includes("SELECT id FROM users")) {
      return { rows: [] }; // Not found
    }
    if (text.includes("INSERT INTO agents")) {
      return { rows: [] };
    }
    if (text.includes("SELECT health_factor")) {
        return { rows: [{ health_factor: "1.5", collateral_usd: "1000", debt_usd: "500", ts: new Date() }] };
    }
    if (text.includes("SELECT status FROM agents")) {
        return { rows: [{ status: "active" }] };
    }
    return { rows: [] };
  }
}));

// Mock Viem
mock.module("viem/accounts", () => ({
  generatePrivateKey: () => "0x123",
  privateKeyToAccount: () => ({ address: "0xAgentAddress" })
}));

// Import API (it will auto-start, so we just test the endpoints)
// We can't easily import the server instance if it's not exported or if it starts on import.
// Ideally, we'd restructure api.ts to export `fetch` handler.
// But for now, let's just use `fetch` against the running server if we could start it.
// Since `api.ts` calls `init()` on load, it might fail if DB mocks aren't set up BEFORE import.
// Bun test runner loads mocks before imports if configured right, but here we are dynamic.

// Let's rewrite api.ts slightly to export the fetch handler to make it testable?
// Or just rely on the fact that I mocked `../src/db/connection` which is imported by `api.ts`.
// So importing `../src/api.ts` should trigger `init()` with mocked DB.

test("API Verification Flow", async () => {
  // Dynamic import to ensure mocks apply
  const { default: server } = await import("../src/api.ts");
  // Wait for init? Init is async and not awaited on top level.
  // But the server starts listening immediately.

  // Test /api/verify
  const res = await fetch("http://localhost:3000/api/verify", {
    method: "POST",
    body: JSON.stringify({ commitment: "0xCommitment" })
  });

  const data = await res.json();
  expect(res.status).toBe(200);
  expect(data.success).toBe(true);
  expect(data.userId).toBe(1);
});

test("API Create Agent", async () => {
    const res = await fetch("http://localhost:3000/api/create-agent", {
        method: "POST",
        body: JSON.stringify({ userId: 1 })
    });

    const data = await res.json();
    expect(res.status).toBe(200);
    expect(data.walletAddress).toBe("0xAgentAddress");
});
