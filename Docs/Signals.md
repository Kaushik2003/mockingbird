# Signals Documentation

Make sure we can compute all these types of signals.

## Personal Position / Aave Risk Signals

### Health Factor

- **Data:** `UiPoolDataProviderV3.getUserReservesData()` or `ProtocolDataProvider` → `user.totalCollateralBase`, `user.totalDebtBase`, `user.healthFactor` (scaled 1e18)
- **Frequency:** ~30–60s

### Distance to Liquidation (% drop needed)

- **Data:** Current healthFactor + per-asset price, ltv and liquidationThreshold from Aave pool/reserve configs
- **Calc:** Convert HF → percent price drop needed for HF = 1

### Collateral Value Change (X min window)

- **Data:** Historical collateral USD value at t0 and now (aggregate per-asset: aToken balance * oracle price)
- **Sources:** Aave balances + price oracles
- **Window:** Last 1h/24h

### Debt Value Change (X min window)

- **Data:** Total debt in USD at t0 and now (variable+stable debt balances * price)
- **Sources:** Aave user data + price oracles

### Leverage Increase / Sudden Borrow

- **Data:** Snapshots of borrowed amount; borrow events or change in `scaledVariableDebt` / `scaledATokenBalance`
- **Trigger:** Borrow delta > threshold (absolute USD or %)

### Health Factor Drift Rate

- **Data:** HF samples over time → slope (ΔHF / Δt)
- **Needed:** Timestamps + HF values

### Oracle Price Divergence for Collateral

- **Data:** Onchain oracle price (e.g., Chainlink feed) vs. centralized or DEX TWAP vs. other oracle
- **Metric:** `abs(diff)/median`

### Collateral Concentration

- **Data:** Per-asset share of total collateral (aToken balances * price)
- **Trigger:** Single-asset > X% of collateral

## Market / Asset Signals

### Collateral Price Drop (%)

- **Data:** Onchain price feed (Chainlink) for asset; compute % change over window (1m/5m/1h)

### Volatility Spike

- **Data:** Historical tick prices (DEX/exchanges) or oracle volatility estimate; compute realized vol

### Stablecoin Depeg

- **Data:** USDC price from multiple sources (Chainlink, DEX, offchain) and deviation from $1
- **Threshold:** `abs(price-1) > X%`

### DEX Liquidity Drain on Collateral

- **Data:** DEX pool reserves for collateral pairs (Uniswap pool reserves) → sudden reserve change

### Funding / Perp Rate Spike

- **Data:** Funding rates from major perp platforms; absolute or relative increase

## Whale / Fund Signals

### Large Transfer (Whale transfer)

- **Data:** ERC20 Transfer logs for USDC/asset filtered by amount > threshold (USD)
- **Required:** Token decimals, onchain transfer amount → USD via price

### Whale Borrow on Aave

- **Data:** Aave Borrow events where borrower ∈ monitored addresses and amount > threshold

### Whale Add/Remove Collateral

- **Data:** Aave Supply/Withdraw events for monitored addresses

### Exchange Inflow Spike (sell pressure)

- **Data:** Large transfers to known exchange addresses; need exchange address list + transfer logs

### VC / Known Fund Accumulation

- **Data:** Labeled wallet list + ERC20 balance snapshots → large % accumulation over window

## Protocol-Wide Signals

### Reserve Utilization Spike (per asset)

- **Data:** `Aave getReserveData()` → `totalLiquidity` / `availableLiquidity` / `totalBorrows` → `utilization = borrows / (borrows + liquidity)`

### TVL Drop / Surge

- **Data:** Sum of all reserves' `totalLiquidity` (Aave protocol metrics) or onchain TVL aggregator

### Borrow APR Spike

- **Data:** Reserve `liquidityRate` / `variableBorrowRate` over time for asset

### Reserve Liquidity Exhaustion (low available liquidity)

- **Data:** `availableLiquidity` from reserve data; absolute USD threshold

### Oracle Feed Staleness / Paused

- **Data:** Oracle `latestRound` timestamp or oracle contract health check (`staleDuration`)

## Agent / Treasury Signals

### Agent Failed Tx / Gas Failures

- **Data:** Agent-submitted tx receipts (status failed / revert logs)
- **Additional:** Nonce/stuck threshold

### Agent Auto-Repay / Auto-Borrow Actions

- **Data:** Agent action logs + resulting position delta

### Treasury Cash Buffer Below Threshold

- **Data:** USDC balance of treasury address (ERC20 `balanceOf`) in USD vs. configured min

### Strategy PnL Drop

- **Data:** Strategy NAV snapshots (asset balances * prices) vs. baseline

## Composite / AI-Friendly Signals

### Combined Risk Score

- **Data:** Inputs = normalized metrics from signals (HF, utilization, whale activity, price drop); weights and timestamped values
- **Output:** Scalar 0–1

### Distance-to-Liquidation (time-based)

- **Data:** Current HF, price volatility estimate → compute expected time-to-liquidation under simulated price path (Monte Carlo or simple deterministic % per hour)

### Correlation Alert (your collateral correlated with whale action)

- **Data:** Whale trades affecting the exact collateral asset + your collateral exposure share

### Funding / Liquidity Squeeze Forecast

- **Data:** Borrow growth rate, utilization trend, DEX liquidity trend → forecast short-term liquidity shortage probability

## UX / Meta Signals (useful for user-facing alerts)

### Alert Fatigue / Noise Filter

- **Data:** Count of alerts per user per timeframe; suppression logic

### Confidence Score for a Signal

- **Data:** Provenance count (number of independent sources agreeing), freshness, oracle health → normalize to 0–1

## For Each Signal — Minimal Data Sources Summary

- **Aave onchain:** `UiPoolDataProviderV3`, `Pool`, `getUserReservesData`, `getReserveData`, Aave events (Supply/Borrow/Repay/Withdraw)
- **ERC20 logs:** Transfer events, `balanceOf()`
- **Price oracles:** Onchain feeds (e.g., Chainlink) and optional DEX TWAPs
- **DEX data:** Pool reserves, swap events (for liquidity and price ticks)
- **Wallet labeling:** Known exchange / whale / VC addresses list
- **Agent logs:** Your backend action logs + tx receipts
- **External sources (optional):** CEX orderbook events, perp funding endpoints, offchain analytics APIs
- **Time series store:** Snapshots over time (collateral USD, debt USD, HF, prices) for deltas and slopes

## Implementation Specification

Below is a single, developer-ready spec that guarantees you can compute every signal listed reliably, cheaply, and locally (hackathon / laptop-ready).

### 1 — Architecture (optimized for these signals, local/hackathon)

Keep it simple: Docker Compose with services:

- **smart-router** (decides source & batching)
- **pollers** (Aave poller, price poller, transfer watcher)
- **timeseries DB + Postgres** (single Postgres with `user_schema` & `global_schema`)
- **Redis** (hot TTL, locks, pub/sub)
- **signal-engine** (deterministic rules + scoring)
- **llm-worker** (optional: generate explanations for high-sev signals)
- **ws-server & api-server** (WebSocket wallet channels + REST)

**Dataflow:** Pollers → smart-router → Postgres + Redis → signal-engine → persist signals → publish via Redis pub/sub to WS → LLM for explanations (if severity high) → notify.

Run locally with one `docker compose up --build`.

### 2 — Time-series & Core Schema (Postgres)

Use a small set of tables (partition `wallet_snapshots` by month if many wallets):

```sql
-- user_schema.wallet_snapshots (heavy write)
wallet_address TEXT,
block_number BIGINT,
ts timestamptz,
health_factor numeric,
collateral_usd numeric,
debt_usd numeric,
positions jsonb, -- [{reserve, token, aTokenBalance, variableDebt, stableDebt, usdRate}]
price_sources jsonb, -- {chainlink: {price, ts}, dex: {...}, coinstats: {...}}
raw jsonb
PRIMARY KEY (wallet_address, ts);

-- user_schema.wallet_signals
id uuid, wallet_address, signal_type, severity numeric, confidence numeric, metrics jsonb, description text, detected_at timestamptz, raw jsonb;

-- global_schema.reserve_snapshots
protocol text, market_address text, asset text, ts timestamptz, totalLiquidity numeric, totalBorrows numeric, availableLiquidity numeric, liquidityRate numeric, variableBorrowRate numeric, oracle_price jsonb, raw jsonb;

-- global_schema.transfer_events
tx_hash text, block_number bigint, ts timestamptz, from text, to text, token text, amount numeric, usd_value numeric, raw jsonb;

-- global_schema.provider_usage
provider text, endpoint text, cost_estimate numeric, ts timestamptz;
```

**Indexes:** `(wallet_address, ts DESC)` and `(protocol, asset, ts DESC)` for fast recent lookups.

Store recent N days in Postgres (90d default) and older aggregated samples (hourly/daily) kept if needed — but for hackathon just keep 30–90d.

### 3 — Smart Router: Source Priority & Caching Rules

General rule: return the cheapest source that satisfies freshness requirement.

For each data item, order of preference:

1. Redis cache (hot)
2. `user_schema.wallet_snapshots` (most recent snapshot)
3. `global_schema.reserve_snapshots` (for reserve metrics)
4. Aave client GraphQL (`markets`, `userMarketState`, `userSupplies`) — preferred for HF/positions (batched)
5. Chainlink onchain feed for prices (use when available)
6. Uniswap TWAP / pool reserves for DEX price & liquidity
7. CoinStats (cheap centralized) as a fallback for price conversions
8. Nansen for labels / netflows (cached heavily)
9. Etherscan for tx history / holder lists (backfill / on-demand)
10. Dune for heavy aggregated queries / backfills

**Cache TTL recommendations (local hackathon):**

- HF / positions: active TTL 15s; idle TTL 300s
- Reserve metrics: TTL 30s
- Chainlink price: TTL 15s
- DEX TWAP: compute locally from pool events; TTL 15s
- Nansen labels: TTL 12h (or manual refresh)
- Etherscan holders / tx history: TTL 1h–24h (on-demand)

**Batching:** Coalesce identical requests for 100–300ms; group many users into a single markets or `userMarketState` GraphQL call where possible.

**Quota accounting:** Log provider usage to `global_schema.provider_usage` and stop heavy calls when thresholds reached (increase TTLs instead).

### 4 — Signals: Data, Formula, Frequency, Confidence, Thresholds, SQL/Pseudocode

I'll list each signal exactly as you requested with compute details.

#### PERSONAL POSITION / AAVE RISK SIGNALS

**1) Health Factor (HF)**

- **Data:** `UiPoolDataProviderV3.getUserReservesData()` / `userMarketState` → `user.healthFactor` (Ray 1e18), `totalCollateralBase`, `totalDebtBase`
- **Preferred source:** Aave GraphQL / UiPoolDataProvider (batched)
- **Frequency:** 15–60s for active wallets, 5–15m idle
- **Compute:** `HF = healthFactorRay / 1e18`
- **Store:** Insert snapshot record `health_factor`
- **Signal rule:** If HF < `hf_threshold` (e.g., 1.25) create `POSITION_RISK` signal

SQL example (read latest):

```sql
SELECT health_factor FROM user_schema.wallet_snapshots
WHERE wallet_address = $1
ORDER BY ts DESC LIMIT 1;
```

**Confidence:** 0.95 (onchain AAVE client). Lower if oracle price missing or stale.

**2) Distance to Liquidation (% price drop needed)**

- **Data:** HF, per-asset price, per-asset `liquidationThreshold` and `ltv` from Aave reserve configs, positions per-asset
- **Concept:** The % uniform adverse price move across collateral that would push HF to 1

Formula (approx):

```
HF ≈ (CollateralValue * weightedLiquidationThreshold) / DebtValue
```

Solve for x where `HF_after = 1` after price drops by `(1 - x)`. For uniform drop d:

```
HF_after = HF * (1 - d)
=> d_needed = 1 - (1 / HF)
```

But more precise when collateral mix and thresholds vary:

Let:
- `C_i` = collateral USD of asset i
- `LT_i` = `liquidationThreshold_i` (0..1)
- `D` = debt USD

```
HF = ( Σ C_i * LT_i ) / D
Solve for d where Σ (C_i*(1-d_i) * LT_i) / D = 1
For uniform d: d = 1 - (D / Σ (C_i * LT_i))
```

- **Compute:** Use per-asset weights for accuracy
- **Frequency:** Same as HF
- **Trigger:** If `d_needed < threshold_pct` (e.g., < 0.05 => 5% drop triggers alert)
- **Confidence:** Reduced if price sources disagree

**3) Collateral Value Change (X min window)**

- **Data:** Snapshots `collateral_usd` at t0 and now (sum of aTokenBalance * oracle price per reserve)
- **Window:** 1h / 24h / custom
- **Compute:** `pct_drop = (collateral_t0 - collateral_now) / collateral_t0`

SQL snippet:

```sql
WITH t0 AS (
  SELECT collateral_usd FROM user_schema.wallet_snapshots
  WHERE wallet_address=$1 AND ts <= now() - interval '1 hour' ORDER BY ts DESC LIMIT 1
), tn AS (
  SELECT collateral_usd FROM user_schema.wallet_snapshots
  WHERE wallet_address=$1 ORDER BY ts DESC LIMIT 1
)
SELECT (t0.collateral_usd - tn.collateral_usd)/t0.collateral_usd AS pct_drop FROM t0, tn;
```

- **Trigger:** `pct_drop > X%` (e.g., 5% in 1h)
- **Confidence:** Depends on price oracle freshness

**4) Debt Value Change (X min window)**

- **Data:** `debt_usd` snapshots
- **Compute:** Same as collateral change but on debt
- **Trigger:** Large borrow (absolute USD or %), e.g., > $10k or > 20% increase
- **Frequency:** 30–60s

**5) Leverage Increase / Sudden Borrow**

- **Data:** Scaled `variableDebt` balances or Borrow events from Aave for the user
- **Compute:** Detect `deltaDebtUSD` over short window. If `deltaDebtUSD > borrow_threshold` emit `POSITION_RISK` or `AGENT_ACTION` if agent initiated
- **Bonus:** Tie events to txs (tx hash) to get context

**6) Health Factor Drift Rate**

- **Data:** HF time series (timestamps + HF)
- **Compute:** Linear regression slope `s = ΔHF / Δt` over last N samples (e.g., last 10 samples over 10min)
- **Trigger:** `s < negative_slope_threshold` (dropping fast)
- **Implementation (simple):** Compute `(HF_now - HF_10minAgo) / 10min`

**7) Oracle Price Divergence for Collateral**

- **Data:** Chainlink price, DEX TWAP (Uniswap), CoinStats price (optional)
- **Metric:** `div_pct = abs(chainlink - median([dex, coinstats])) / median(...)`
- **Trigger:** `div_pct > X%` (e.g., 1–2%)
- **Confidence:** Lower if sources stale

**8) Collateral Concentration**

- **Data:** Per-asset collateral USD values
- **Compute:** `share_i = C_i / Σ C`
- **Trigger:** `share_i > concentration_threshold` (e.g., 40%)
- **Action:** Recommend diversification

#### MARKET / ASSET SIGNALS

**9) Collateral Price Drop (%)**

- **Data:** Chainlink / TWAP price series for asset
- **Compute:** % change = `(p_t0 - p_now) / p_t0` over window (1m/5m/1h)
- **Trigger:** E.g., > 3% in 10m or > 10% in 1h
- **Confidence:** High with multiple oracle agreement

**10) Volatility Spike**

- **Data:** Price ticks; compute realized vol (stddev of returns) over rolling window
- **Compute:** Annualized or per-window stddev; detect % increase vs baseline
- **Trigger:** `vol_now / vol_baseline > factor` (e.g., 2x)

**11) Stablecoin Depeg**

- **Data:** USDC price across Chainlink, DEX mid-price
- **Trigger:** `abs(price_usdc - 1.0) > 0.01` (1%) or >0.005 for high sensitivity
- **Action:** Alert `STABLECOIN_EVENT`

**12) DEX Liquidity Drain on Collateral**

- **Data:** Uniswap pool reserves for token/USDC pair; sudden reserve reduction → slippage increase
- **Compute:** `pct_reserve_drop = (reserves_t0 - reserves_now)/reserves_t0` or sudden reduction in pool liquidity
- **Trigger:** > X% drop within Y minutes

**13) Funding / Perp Rate Spike**

- **Data:** Funding rates from perp venue APIs (external). Local forecast: last-minute change > threshold
- **Trigger:** `funding_rate` delta > threshold

#### WHALE / FUND SIGNALS

**14) Large Transfer (Whale transfer)**

- **Data:** ERC20 Transfer logs (USDC + collateral tokens) → amount * price ⇒ USD
- **Compute:** If `usd_value > whale_threshold` (e.g., $100k), emit `WHALE_ACTIVITY`
- **Sources:** Etherscan logs or WebSocket provider (alchemy/infura) listening to Transfer events
- **Confidence:** High if confirmed in block

**15) Whale Borrow on Aave**

- **Data:** Aave Borrow events with borrower in watchlist or any borrow > threshold
- **Trigger:** Large borrow or new large borrow by smart-money

**16) Whale Add/Remove Collateral**

- **Data:** Supply / Withdraw events for addresses; monitor change in collateral position
- **Trigger:** Large collateral withdrawals → potential sell pressure

**17) Exchange Inflow Spike**

- **Data:** Transfer events into known exchange addresses (maintain exchange address list)
- **Compute:** Sum inflow USD over rolling window; if > threshold, signal potential sell pressure

**18) VC / Known Fund Accumulation**

- **Data:** Nansen labels + transfer/balance snapshots
- **Compute:** Percent accumulation over period, `pct_gain = (balance_now - balance_t0)/balance_t0`
- **Trigger:** Large accumulation > X% or > $Y

#### PROTOCOL-WIDE SIGNALS

**19) Reserve Utilization Spike (per asset)**

- **Data:** `getReserveData()` or `global_schema.reserve_snapshots` → `utilization = totalBorrows / (totalBorrows + availableLiquidity)`
- **Trigger:** Utilization increased by > delta% within window (e.g., +15% in 30m)
- **Action:** Raise `PROTOCOL_FLOW` alert

**20) TVL Drop / Surge**

- **Data:** Sum of `totalLiquidity` across reserves
- **Trigger:** % change > threshold

**21) Borrow APR Spike**

- **Data:** `liquidityRate` / `variableBorrowRate` series per reserve
- **Trigger:** Large delta > threshold (e.g., +200bp)

**22) Reserve Liquidity Exhaustion (low available liquidity)**

- **Data:** `availableLiquidity` in USD; absolute threshold or % of typical size
- **Trigger:** `availableLiquidity < min_liquidity_usd` or `remaining_pct < X%`

**23) Oracle Feed Staleness / Paused**

- **Data:** Chainlink `latestRound` timestamps or oracle heartbeat metric
- **Trigger:** `now - oracle_ts > staleness_threshold` (e.g., > 2x expected heartbeat) → emergency

#### AGENT / TREASURY SIGNALS

**24) Agent Failed Tx / Gas Failures**

- **Data:** Tx receipts for agent-submitted txs (status = 0)
- **Trigger:** Failure / nonce-stuck counts > N → signal `AGENT_ACTION` failed

**25) Agent Auto-Repay / Auto-Borrow Actions**

- **Data:** Internal agent logs + onchain position changes
- **Emit:** `AGENT_ACTION` success/failure with metrics `gasUsed`, `txHash`

**26) Treasury Cash Buffer Below Threshold**

- **Data:** USDC balance `balanceOf(treasury) * USD` price
- **Trigger:** `balance_usd < runway_target` or `pct_idle_cash < min`

**27) Strategy PnL Drop**

- **Data:** Strategy NAV snapshots (assets * oracle price) vs baseline
- **Trigger:** Drop > X% in Y time; emit `TREASURY` or `AGENT_ACTION` suggestion

#### COMPOSITE / AI-FRIENDLY SIGNALS

**28) Combined Risk Score**

- **Input:** Normalized metrics: `HF_norm`, `utilization_norm`, `price_drop_norm`, `whale_activity_norm`, `reserve_liquidity_norm`

Computation (MVP):

```
s_i = severity_i * confidence_i for each base signal
Weighted combine: score = w_hf * s_hf + w_util * s_util + w_price * s_price + w_whale * s_whale + w_liq * s_liq
Normalize to 0..1
```

- **Weights:** Configurable; default `w_hf=0.45`, `w_util=0.15`, `w_price=0.2`, `w_whale=0.1`, `w_liq=0.1`
- **Emit:** `AI_COMPOSITE` with `combinedScore`, `topContributors`

**29) Distance-to-Liquidation (time-based forecast)**

- **Data:** HF, volatility estimate σ (e.g., 1h), current price
- **Simple deterministic forecast:** `expected_time = (d_needed / expected_pct_move_per_hour)`, where `expected_pct_move_per_hour` derived from σ (e.g., `σ_hour = σ_daily / sqrt(24)`)
- **Monte Carlo (optional):** Simulate geometric Brownian motion (GBM) paths S_t with drift 0 and volatility σ; find first passage time where collateral value decline leads HF≤1; compute median time across simulations
- **Frequency:** Run on HF-change or volatility-spike events

**30) Correlation Alert (collateral correlated with whale action)**

- **Input:** Event: whale sells X asset and user collateral heavily concentrated in X → if whale in last 30m moved > threshold and `collateral_concentration_in_X > threshold` → emit `CORRELATION` alert

**31) Funding / Liquidity Squeeze Forecast**

- **Input:** Utilization growth trend + DEX liquidity trend + borrow rate spikes
- **Compute:** Short-term probability heuristics (logistic regression) or rule-based: if `Δutilization > X` and `Δdex_liquidity < Y` → high prob squeeze

### 5 — Algorithms, SQL & Pseudocode for Core Computations

#### Health Factor → Distance to Liquidation (precise per-asset formula)

**Pseudocode:**

```typescript
// Inputs: positions = [{token, collateralUsd_i, LT_i}], debtUsd = D
let numerator = sum( positions.map(p => p.collateralUsd * p.LT) );
let HF = numerator / D; // current HF
// solve for d uniform drop across collateral
let d_needed = Math.max(0, 1 - (D / numerator)); // fraction (0..1)
```

**SQL (simplified):**

```sql
WITH pos AS (
  SELECT jsonb_array_elements(positions) AS p
  FROM user_schema.wallet_snapshots
  WHERE wallet_address = $1
  ORDER BY ts DESC LIMIT 1
)
SELECT
  SUM( (p->>'collateralUsd')::numeric * (p->>'liquidationThreshold')::numeric ) AS numerator,
  (SUM( (p->>'collateralUsd')::numeric * (p->>'liquidationThreshold')::numeric ) / debt_usd) AS hf,
  (1 - (debt_usd / SUM( (p->>'collateralUsd')::numeric * (p->>'liquidationThreshold')::numeric ))) AS d_needed
FROM pos, user_schema.wallet_snapshots ws;
```

#### Volatility (realized) over window

Compute log-returns over tick series in prices table, then stddev:

```sql
WITH ticks AS (
  SELECT price, ts FROM prices WHERE asset=$1 AND ts BETWEEN now() - interval '1h' AND now() ORDER BY ts
),
returns AS (
  SELECT ln(price / lag(price) OVER (ORDER BY ts)) AS r FROM ticks WHERE lag(price) OVER (ORDER BY ts) IS NOT NULL
)
SELECT sqrt( sum(r*r) / (count(*) - 1) ) * sqrt(24*365) AS annualized_vol FROM returns;
```

(For hackathon, compute simple rolling stddev over chosen interval.)

#### HF Slope

```sql
SELECT
  (hf_now - hf_prev) / EXTRACT(EPOCH FROM (ts_now - ts_prev)) as slope
FROM
  (SELECT health_factor as hf_now, ts as ts_now FROM ... ORDER BY ts DESC LIMIT 1) now,
  (SELECT health_factor as hf_prev, ts as ts_prev FROM ... WHERE ts <= now() - interval '10 minutes' ORDER BY ts DESC LIMIT 1) prev;
```

### 6 — Signal Object & Example WebSocket Payload

Use canonical Signal shape:

```json
{
  "id": "uuid",
  "type": "POSITION_RISK",
  "title": "HF below threshold for 0xAbc…",
  "subjectWallet": "0xAbc…",
  "protocol": "aave",
  "asset": "ETH, USDC",
  "severity": 0.82,
  "confidence": 0.93,
  "metrics": {
     "healthFactor": 1.18,
     "collateralUsd": 12100,
     "debtUsd": 10200,
     "liquidationDistancePct": 0.032
  },
  "description": "HF dropped 1.45 → 1.18 after ETH -4.6% in 10m. ~3.2% uniform drop would liquidate.",
  "detectedAt": 1670000000000,
  "blockNumber": 17998800,
  "tags": ["healthFactor", "aave", "urgent"],
  "source": {"aave": "markets(user)", "prices": ["chainlink", "dex"]}
}
```

Publish this via Redis pub/sub channel `signals:wallet:0xabc` and fan out over WS.

### 7 — Confidence Scoring & Provenance

```typescript
confidence = f(provenance_count, freshness_score, provider_reliability)
```

- **provenance_count:** Number of independent sources agreeing (chainlink + dex + coinstats → count)
- **freshness_score:** `1 - min(1, age_seconds / freshness_threshold)`
- **provider_reliability:** Weight (Aave client = 1.0, Chainlink = 0.98, CoinStats = 0.6, Etherscan = 0.9)

Example:

```typescript
confidence = clamp(0.1, 1.0,
  0.5 * (provenance_count / maxSources) + 0.3 * freshness_score + 0.2 * provider_reliability
);
```

### 8 — Alert Suppression, De-dup, and Fatigue Control

Each signal has `dedup_key` (e.g., `wallet:HF_low`) and `dedup_window` (e.g., 10m). If same `dedup_key` fires within window, suppress or escalate only if severity increases by > 10%.

Rate-limit notifications per user: e.g., at most 3 high-sev alerts / 10 low-sev per hour.

Aggregation: if 3 related signals fire within 2 min (HF drop + whale inflow + reserve utilization spike), emit a composite `AI_COMPOSITE` instead of 3 separate alerts.

### 9 — Smart Router Mapping to Each Signal to Minimize Paid Calls

For each signal, choose sources and fallbacks:

- **HF & Positions:** Primary Aave client (GraphQL). Do not call Etherscan. Batch many users per market
- **Reserve metrics:** Primary Aave `getReserveData/market` endpoints. Cache 30s
- **Prices:** Primary Chainlink (onchain). If Chainlink missing, DEX TWAP (compute locally) → fallback CoinStats. Cache 15s
- **Transfer events:** Use WebSocket provider (Alchemy/Infura) to stream Transfer logs (cheap per connection). For history/backfill use Etherscan
- **Labels / Smart Money:** Nansen only on-demand or per-day. Cache heavily
- **Heavy analytics:** Dune nightly; store results in `global_schema`

**Batching example:** When 20 active wallets are monitored, group by market and call `markets(client, { chainIds, user: [wallet1,...] })` to fetch user states for all those wallets in one GraphQL request.

### 10 — Monte Carlo / Time-to-Liquidation (Simple Implementation)

For hackathon you can implement a quick Monte Carlo:

Inputs: current collateral USD per asset, debt USD, per-asset `σ_per_hour` (realized vol), correlation ignored (independent).

For N=1000 simulations, for each simulate hourly returns `r ~ Normal( -0.01*drift, σ_hour )` (drift 0 or small), update collateral values and compute HF each hour until HF <= 1 or Tmax hours. Record distribution of times to liquidation.

Use median / 90th percentile as signal.

This runs in a few seconds for small N; run only on high severity signals.

### 11 — Implementation Priorities (Hackathon Roadmap)

**Day 0 (MVP):**

1. Aave poller (batched via Aave client) → HF + positions snapshots
2. Price poller: Chainlink adapter + simple DEX TWAP fallback
3. Basic signal engine: HF threshold, distance-to-liquidation, collateral/debt deltas, large transfer detection (USDC)
4. Redis pub/sub + WS server to stream signals

**Day 1:**

5. Add volatility & simple HF drift slope
6. Add transfer event listener (Alchemy/Infura) for whale transfers and exchange inflows
7. Add Nansen label enrichment as an optional call (cache labels 12h)
8. Implement confidence scoring and alert suppression

**Day 2:**

9. Add Monte Carlo forecast for time-to-liquidation (on-demand for severe signals)
10. Add LLM explanations for top signals (cached)
11. Add REST refresh endpoints and admin toggle for provider keys

### 12 — Example: Minimal Code Snippets / Pseudocode

**HF poller (concept):**

```typescript
async function pollActiveWallets(wallets) {
  // group wallets per market to use markets(client, {user: evmAddresses}) batching
  const grouped = groupByMarket(wallets);
  for (const market of Object.keys(grouped)) {
    const users = grouped[market].map(evmAddress);
    const res = await markets(client, { chainIds: [chainId(1)], user: users, address: evmAddress(market) });
    // iterate result.value to extract per-user userMarketState.healthFactor
    // store snapshots and compute signals
  }
}
```

**Distance-to-liquidation:**

```typescript
function computeDistance(collateralPositions, debtUsd) {
  const numerator = collateralPositions.reduce((s,p) => s + p.usd * p.liquidationThreshold, 0);
  if (numerator <= 0 || debtUsd <= 0) return Infinity;
  const HF = numerator / debtUsd;
  const d = Math.max(0, 1 - debtUsd / numerator);
  return { HF, d };
}
```

### 13 — Example Thresholds (Starter Config You Can Tune)

- HF alert if HF < 1.25 (serious), <1.0 (critical)
- Liquidation distance alert if `d_needed < 0.05` (5%)
- Collateral drop 1h > 5% alert; 24h > 15% alert
- Whale transfer > $100k high, > $1M critical
- Reserve utilization increase > 15% in 30m alert
- Oracle divergence > 2% alert

Expose these as config so you can tweak during demo.

### 14 — Output / API Example Endpoints

- `GET /api/wallets/:addr/snapshots?limit=10`
- `GET /api/wallets/:addr/signals?since=...`
- `POST /api/wallets/:addr/refresh?priority=high` (forces paid refresh — consumes quota)
- **WS channel:** `ws://host:port/ws` subscribe `{ type: 'subscribe', wallet: '0x...' }`

### 15 — Final Notes & Tradeoffs

- Use the Aave client GraphQL as canonical for HF & positions — it lets you batch and reduces RPC pressure
- Prefer Chainlink onchain feeds for price; fallback to DEX TWAP computed locally and only call CoinStats if onchain price unavailable
- Stream Transfer logs via your RPC WebSocket provider to avoid Etherscan for live detection; use Etherscan only for backfill/history queries
- Cache Nansen labels and Dune heavy results to avoid running expensive queries on demo day
- Keep Monte Carlo and LLM runs on-demand or throttled to avoid latency and costs