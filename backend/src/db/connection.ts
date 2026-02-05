/**
 * Database Connection Module
 * PostgreSQL connection pool management with health checks and graceful shutdown
 */

import { Pool, PoolClient, QueryResult } from "pg";

let pool: Pool | null = null;

/**
 * Initialize database connection pool with retry logic
 */
export function initializeDatabase(connectionString?: string): Pool {
  if (pool) {
    return pool;
  }

  const dbUrl = connectionString || process.env.DATABASE_URL;
  
  if (!dbUrl) {
    throw new Error("DATABASE_URL environment variable is required");
  }

  pool = new Pool({
    connectionString: dbUrl,
    max: 10, // Maximum number of connections
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 10000, // Increased timeout for Docker
  });

  // Handle pool errors
  pool.on("error", (err) => {
    console.error("Unexpected database pool error:", err);
  });

  console.log("✅ Database connection pool initialized");
  return pool;
}

/**
 * Get the active database pool
 */
export function getPool(): Pool {
  if (!pool) {
    throw new Error("Database not initialized. Call initializeDatabase() first.");
  }
  return pool;
}

/**
 * Execute a query
 */
export async function query<T = any>(
  text: string,
  params?: any[]
): Promise<QueryResult<T>> {
  const client = getPool();
  return client.query<T>(text, params);
}

/**
 * Get a client from the pool for transactions
 */
export async function getClient(): Promise<PoolClient> {
  return getPool().connect();
}

/**
 * Health check - verify database connectivity
 */
export async function healthCheck(): Promise<boolean> {
  try {
    const result = await query("SELECT NOW()");
    return result.rows.length > 0;
  } catch (error) {
    console.error("Database health check failed:", error);
    return false;
  }
}

/**
 * Close all database connections
 */
export async function closeDatabase(): Promise<void> {
  if (pool) {
    await pool.end();
    pool = null;
    console.log("✅ Database connections closed");
  }
}

/**
 * Run schema migrations (idempotent) with retry logic
 */
export async function runMigrations(maxRetries: number = 5): Promise<void> {
  const schemaSQL = `
    CREATE TABLE IF NOT EXISTS wallet_snapshots (
      wallet_address TEXT NOT NULL,
      ts TIMESTAMPTZ NOT NULL,
      health_factor NUMERIC(30, 18),
      collateral_usd NUMERIC(30, 8),
      debt_usd NUMERIC(30, 8),
      net_worth_usd NUMERIC(30, 8),
      ltv NUMERIC(10, 6),
      liquidation_threshold NUMERIC(10, 6),
      current_ltv NUMERIC(10, 6),
      available_borrows_usd NUMERIC(30, 8),
      net_apy NUMERIC(10, 6),
      supplies_json JSONB,
      borrows_json JSONB,
      market_state_json JSONB,
      PRIMARY KEY (wallet_address, ts)
    );

    CREATE INDEX IF NOT EXISTS idx_wallet_snapshots_ts_desc 
      ON wallet_snapshots (wallet_address, ts DESC);

    CREATE INDEX IF NOT EXISTS idx_wallet_snapshots_ts_asc 
      ON wallet_snapshots (wallet_address, ts);

    CREATE INDEX IF NOT EXISTS idx_wallet_snapshots_ts_only 
      ON wallet_snapshots (ts);
  `;

  let lastError: Error | null = null;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      await query(schemaSQL);
      console.log("✅ Database schema migrations completed");
      return;
    } catch (error) {
      lastError = error as Error;
      console.warn(`⚠️  Schema migration attempt ${attempt}/${maxRetries} failed:`, error);
      
      if (attempt < maxRetries) {
        const delay = Math.min(1000 * Math.pow(2, attempt - 1), 10000); // Exponential backoff, max 10s
        console.log(`   Retrying in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  
  console.error("❌ Schema migration failed after all retries");
  throw lastError;
}
