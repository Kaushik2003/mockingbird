# Aave Risk Signal Engine

Real-time DeFi risk monitoring system for Aave V3 positions.

## Overview

This service continuously monitors an Aave wallet and emits deterministic risk signals based on:

- Health factor and liquidation risk
- Collateral concentration and utilization
- Debt levels and borrowing costs
- Historical trends and drift

**Key Features:**

- 20 deterministic risk signals
- Composite risk scoring
- PostgreSQL snapshot storage
- In-memory ring buffer for real-time analysis
- Console-based alerts with color coding
- Automatic signal deduplication

## Prerequisites

- **Bun** (JavaScript runtime) - for local development
- **Docker & Docker Compose** - for containerized deployment
- **Aave V3** wallet to monitor

## Quick Start with Docker (Recommended)

The easiest way to run the service is using Docker Compose, which automatically sets up PostgreSQL and the signal engine.

### 1. Configure Environment

```bash
cp .env.example .env
```

Edit `.env` to set your wallet address:

```env
WALLET_ADDRESS=0xYourWalletAddressHere
```

### 2. Start Services

```bash
docker-compose up -d
```

This will:

- Pull PostgreSQL 16 Alpine image
- Build the signal engine container
- Create a network for the services
- Start both containers with health checks

### 3. View Logs

```bash
# Follow all logs
docker-compose logs -f

# Follow only signal engine logs
docker-compose logs -f signal-engine

# View last 100 lines
docker-compose logs --tail=100 signal-engine
```

### 4. Stop Services

```bash
# Stop containers (keeps data)
docker-compose stop

# Stop and remove containers (keeps data)
docker-compose down

# Stop, remove containers AND delete data
docker-compose down -v
```

### 5. Rebuild After Code Changes

```bash
docker-compose up -d --build
```

---

## Local Development Setup

### 1. Install Dependencies

```bash
bun install
```

### 2. Configure PostgreSQL

Create a database:

```bash
createdb mockingbird
```

Or use an existing PostgreSQL instance.

### 3. Configure Environment

Copy the example environment file:

```bash
cp .env.example .env
```

Edit `.env` with your configuration:

```env
DATABASE_URL=postgresql://user:password@localhost:5432/mockingbird
WALLET_ADDRESS=0x249d918Aa474DAc284d67BB7A3c02c0f3Fe86ce8
POLL_INTERVAL_MS=5000
BUFFER_SIZE=120
RETENTION_DAYS=7
```

**Configuration Options:**

- `DATABASE_URL` - PostgreSQL connection string (required)
- `WALLET_ADDRESS` - Ethereum wallet to monitor (required)
- `POLL_INTERVAL_MS` - Polling interval in milliseconds (default: 5000)
- `BUFFER_SIZE` - Number of snapshots to keep in memory (default: 120)
- `RETENTION_DAYS` - Days to retain snapshots in database (default: 7)

## Running the Service

Start the service:

```bash
bun run index.ts
```

You should see:

```
🚀 Aave Risk Signal Engine
============================================================
Started at: 2026-02-06T03:00:00.000Z
============================================================

📋 Configuration:
   Wallet: 0x249d918Aa474DAc284d67BB7A3c02c0f3Fe86ce8
   Market: 0x87870bca3f3fd6335c3f4ce8392d69350b4fa4e2
   Chain ID: 1
   Poll Interval: 5000ms
   Buffer Size: 120 snapshots
   Retention: 7 days

✅ Database connection pool initialized
✅ Database schema migrations completed
✅ Snapshot buffer initialized (size: 120)
✅ Signal engine initialized
✅ Poller started (interval: 5000ms)
   Wallet: 0x249d918Aa474DAc284d67BB7A3c02c0f3Fe86ce8
✅ Service started successfully

Press Ctrl+C to stop
```

## Signal Output

Every 5 seconds (or configured interval), the service will:

1. Poll Aave for wallet state
2. Create a normalized snapshot
3. Compute all 20 risk signals
4. Emit alerts to console

Example output:

```
[2026-02-06T03:00:45.123Z] 📊 Poll #1 completed (1.2s)
   HF: 1.0531 | Collateral: $78936.62 | Debt: $58465.73

============================================================

🚨 SIGNAL: HEALTH_FACTOR_RISK
   Severity: 0.24 (MEDIUM)
   healthFactor: 1.05
   status: HIGH

🚨 SIGNAL: DISTANCE_TO_LIQUIDATION
   Severity: 0.37 (MEDIUM)
   distancePct: 5.04
   totalCollateralUSD: 78936.62
   totalDebtUSD: 58465.73

🚨 SIGNAL: COLLATERAL_CONCENTRATION
   Severity: 1.00 (CRITICAL)
   largestSharePct: 100.00
   asset: WBTC

⚠️  COMPOSITE RISK SCORE: 0.68 (HIGH)
   Contributors:
   healthFactor=0.24 liquidation=0.37 debtRatio=0.00 leverage=0.00 concentration=1.00

============================================================

💾 Snapshot saved to database
```

## Signals

The system computes 20 deterministic signals:

**Instant Signals** (from current snapshot):

1. Health Factor Risk
2. Distance to Liquidation
3. Collateral Utilization
4. LTV Pressure
5. Zero Borrow Buffer
6. Net APY Drag
7. Borrow Cost Pressure
8. Single-Asset Collateral Risk
9. Collateral Concentration
10. High Leverage
11. Debt Ratio
12. Collateral Price Sensitivity
13. USD-Denominated Debt Exposure
14. Net Worth Compression
15. Supply Yield vs Borrow Cost
16. Liquidation Threshold Proximity
17. Emergency Risk Flag

**Trend Signals** (require history): 18. Health Factor Trend 19. Collateral Value Drift 20. Debt Accretion

**Composite Signal:**

- Weighted combination of all signals
- Emits when score > 0.6

## Database

Snapshots are stored in the `wallet_snapshots` table:

```sql
-- View latest snapshot
SELECT * FROM wallet_snapshots
ORDER BY ts DESC
LIMIT 1;

-- Count snapshots
SELECT COUNT(*) FROM wallet_snapshots;

-- View snapshots from last hour
SELECT ts, health_factor, collateral_usd, debt_usd
FROM wallet_snapshots
WHERE ts > NOW() - INTERVAL '1 hour'
ORDER BY ts DESC;
```

## Signal Deduplication

Signals are automatically deduplicated to prevent spam:

- Same signal type is suppressed for 5 minutes
- Re-emits if severity increases by ≥10%
- Prevents alert fatigue

## Graceful Shutdown

Press `Ctrl+C` to stop the service:

```
🛑 Shutting down gracefully...
✅ Poller stopped (24 polls, 0 errors)
✅ Database connections closed
✅ Service stopped
```

## Architecture

```
Aave API
   ↓
Poller (every 5s)
   ↓
Normalizer
   ↓
Snapshot
   ↓
├─→ In-Memory Buffer (120 snapshots)
│      ↓
│   Signal Engine (20 signals)
│      ↓
│   Deduplicator
│      ↓
│   Console Alerts
│
└─→ PostgreSQL Database
       (historical storage)
```

## Troubleshooting

### Docker Issues

**Containers won't start:**

```bash
# Check container status
docker-compose ps

# View logs
docker-compose logs

# Restart services
docker-compose restart
```

**Database connection failed:**

```bash
# Check if PostgreSQL is healthy
docker-compose ps postgres

# Should show "healthy" status
# If not, check logs:
docker-compose logs postgres
```

**Port conflicts:**

```bash
# If port 5432 is already in use, edit docker-compose.yml:
# Change "5432:5432" to "5433:5432" (or any other port)
```

**Rebuild after code changes:**

```bash
docker-compose up -d --build
```

### Local Development Issues

**Database connection failed:**

- Verify PostgreSQL is running
- Check `DATABASE_URL` in `.env`
- Ensure database exists

**No signals emitting:**

- Check wallet has Aave positions
- Verify wallet address is correct
- Check console for errors

**Signals spam:**

- Deduplication is working correctly
- Signals re-emit every 5 minutes if conditions persist
- Increase `POLL_INTERVAL_MS` if needed

## Development

Run the demo script to test Aave integration:

```bash
bun run src/aave/demo.ts
```

View database schema:

```bash
cat src/db/schema.sql
```
