import { MerkleTree } from "merkletreejs";
import keccak256 from "keccak256";
import { generatePrivateKey, privateKeyToAccount } from "viem/accounts";
import { query, runMigrations, initializeDatabase } from "./db/connection";

const PORT = 3000;

// Initialize Merkle Tree (in-memory for demo, seeded from DB)
let merkleTree: MerkleTree;

async function init() {
  await initializeDatabase();
  await runMigrations();

  // Load existing commitments
  const result = await query("SELECT identity_commitment FROM users ORDER BY created_at ASC");
  const leaves = result.rows.map(row => Buffer.from(row.identity_commitment, 'hex'));
  merkleTree = new MerkleTree(leaves, keccak256, { sortPairs: true });

  console.log(`✅ Server initialized. Merkle Tree size: ${leaves.length}`);
}

const server = Bun.serve({
  port: PORT,
  async fetch(req) {
    const url = new URL(req.url);

    // CORS headers
    const headers = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    };

    if (req.method === "OPTIONS") {
      return new Response(null, { headers });
    }

    try {
      // 1. Verify User (Add to Merkle Tree)
      if (url.pathname === "/api/verify" && req.method === "POST") {
        const body = await req.json();
        const { commitment } = body;

        if (!commitment) return new Response("Missing commitment", { status: 400, headers });

        // Check if already exists
        const exists = await query("SELECT id FROM users WHERE identity_commitment = $1", [commitment]);
        if (exists.rows.length > 0) {
          return new Response(JSON.stringify({
            success: true,
            message: "User already verified",
            userId: exists.rows[0].id
          }), { headers: { ...headers, "Content-Type": "application/json" } });
        }

        // Add to DB
        const insertRes = await query(
          "INSERT INTO users (identity_commitment) VALUES ($1) RETURNING id",
          [commitment]
        );
        const userId = insertRes.rows[0].id;

        // Add to Merkle Tree
        merkleTree.addLeaf(Buffer.from(commitment, 'hex'));

        return new Response(JSON.stringify({
          success: true,
          userId,
          root: merkleTree.getHexRoot(),
          message: "User verified and added to Merkle Tree"
        }), { headers: { ...headers, "Content-Type": "application/json" } });
      }

      // 2. Create Agent Wallet
      if (url.pathname === "/api/create-agent" && req.method === "POST") {
        const body = await req.json();
        const { userId } = body;

        if (!userId) return new Response("Missing userId", { status: 400, headers });

        // Generate Wallet
        const privateKey = generatePrivateKey();
        const account = privateKeyToAccount(privateKey);
        const walletAddress = account.address;

        // Store in DB
        // Check if user already has an agent? For demo, maybe allow multiple or restrict.
        // Let's assume one for now, or just create new.
        await query(
          "INSERT INTO agents (user_id, wallet_address, private_key) VALUES ($1, $2, $3)",
          [userId, walletAddress, privateKey]
        );

        return new Response(JSON.stringify({
          success: true,
          walletAddress,
          message: "Agent wallet created successfully"
        }), { headers: { ...headers, "Content-Type": "application/json" } });
      }

      // 3. Get Agent Status
      if (url.pathname.startsWith("/api/agent/") && req.method === "GET") {
        const address = url.pathname.split("/").pop(); // Extract address

        if (!address) return new Response("Invalid address", { status: 400, headers });

        // Get latest snapshot
        const snapshotRes = await query(
          "SELECT health_factor, collateral_usd, debt_usd, ts FROM wallet_snapshots WHERE wallet_address = $1 ORDER BY ts DESC LIMIT 1",
          [address.toLowerCase()] // Ensure lowercase for DB lookup
        );

        const agentRes = await query("SELECT status FROM agents WHERE wallet_address = $1", [address]);

        if (agentRes.rows.length === 0) {
           return new Response(JSON.stringify({ message: "Agent not found" }), { status: 404, headers: { ...headers, "Content-Type": "application/json" } });
        }

        return new Response(JSON.stringify({
          address,
          status: agentRes.rows[0].status,
          metrics: snapshotRes.rows[0] || null
        }), { headers: { ...headers, "Content-Type": "application/json" } });
      }

      return new Response("Not Found", { status: 404, headers });
    } catch (error) {
      console.error("API Error:", error);
      return new Response(JSON.stringify({ error: String(error) }), { status: 500, headers: { ...headers, "Content-Type": "application/json" } });
    }
  },
});

init().catch(console.error);

console.log(`🚀 API Server running at http://localhost:${PORT}`);
