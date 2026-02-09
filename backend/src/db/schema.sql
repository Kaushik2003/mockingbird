-- Aave Wallet Snapshots Schema
-- Stores complete wallet state snapshots for historical analysis and signal computation

CREATE TABLE IF NOT EXISTS wallet_snapshots (
  -- Primary identifiers
  wallet_address TEXT NOT NULL,
  ts TIMESTAMPTZ NOT NULL,
  
  -- Core metrics (from MarketUserState)
  health_factor NUMERIC(30, 18),
  collateral_usd NUMERIC(30, 8),
  debt_usd NUMERIC(30, 8),
  net_worth_usd NUMERIC(30, 8),
  
  -- Risk parameters
  ltv NUMERIC(10, 6),
  liquidation_threshold NUMERIC(10, 6),
  current_ltv NUMERIC(10, 6),
  available_borrows_usd NUMERIC(30, 8),
  net_apy NUMERIC(10, 6),
  
  -- Position details (stored as JSON)
  supplies_json JSONB,
  borrows_json JSONB,
  
  -- Full market state for debugging/analysis
  market_state_json JSONB,
  
  -- Constraints
  PRIMARY KEY (wallet_address, ts)
);

-- Index for time-range queries (most recent first)
CREATE INDEX IF NOT EXISTS idx_wallet_snapshots_ts_desc 
  ON wallet_snapshots (wallet_address, ts DESC);

-- Index for time-range queries (ascending)
CREATE INDEX IF NOT EXISTS idx_wallet_snapshots_ts_asc 
  ON wallet_snapshots (wallet_address, ts);

-- Index for timestamp-only queries (cleanup jobs)
CREATE INDEX IF NOT EXISTS idx_wallet_snapshots_ts_only 
  ON wallet_snapshots (ts);

-- Comments for documentation
COMMENT ON TABLE wallet_snapshots IS 'Append-only storage of Aave wallet state snapshots';
COMMENT ON COLUMN wallet_snapshots.wallet_address IS 'Ethereum wallet address (lowercase)';
COMMENT ON COLUMN wallet_snapshots.ts IS 'Snapshot timestamp';
COMMENT ON COLUMN wallet_snapshots.health_factor IS 'Aave health factor (liquidation at 1.0)';
COMMENT ON COLUMN wallet_snapshots.supplies_json IS 'Array of supply positions with full details';
COMMENT ON COLUMN wallet_snapshots.borrows_json IS 'Array of borrow positions with full details';
COMMENT ON COLUMN wallet_snapshots.market_state_json IS 'Complete MarketUserState object for debugging';

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  identity_commitment TEXT UNIQUE NOT NULL, -- Merkle Tree leaf/Identity Hash
  created_at TIMESTAMPTZ DEFAULT NOW(),
  metadata JSONB -- Optional: Store anon-aadhaar proof details if needed for demo
);

-- Agents table
CREATE TABLE IF NOT EXISTS agents (
  id SERIAL PRIMARY KEY,
  user_id INT REFERENCES users(id),
  wallet_address TEXT UNIQUE NOT NULL,
  private_key TEXT NOT NULL, -- Encrypted or plain for local demo
  status TEXT DEFAULT 'active', -- active, paused, stopped
  risk_config JSONB DEFAULT '{}', -- Custom risk parameters per agent
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for quick lookups
CREATE INDEX IF NOT EXISTS idx_agents_wallet_address ON agents(wallet_address);
