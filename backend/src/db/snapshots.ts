/**
 * Snapshot Database Operations
 * All database queries for wallet snapshots
 */

import { query } from "./connection";
import type { WalletSnapshot } from "../snapshots/types";

/**
 * Insert a new snapshot (append-only)
 */
export async function insertSnapshot(snapshot: WalletSnapshot): Promise<void> {
  const sql = `
    INSERT INTO wallet_snapshots (
      wallet_address,
      ts,
      health_factor,
      collateral_usd,
      debt_usd,
      net_worth_usd,
      ltv,
      liquidation_threshold,
      current_ltv,
      available_borrows_usd,
      net_apy,
      supplies_json,
      borrows_json,
      market_state_json
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
    ON CONFLICT (wallet_address, ts) DO NOTHING
  `;

  const params = [
    snapshot.walletAddress.toLowerCase(),
    snapshot.timestamp,
    snapshot.healthFactor,
    snapshot.totalCollateralUSD,
    snapshot.totalDebtUSD,
    snapshot.netWorthUSD,
    snapshot.ltv,
    snapshot.liquidationThreshold,
    snapshot.currentLTV,
    snapshot.availableBorrowsUSD,
    snapshot.netAPY,
    JSON.stringify(snapshot.supplyPositions),
    JSON.stringify(snapshot.borrowPositions),
    JSON.stringify(snapshot.marketStateRaw),
  ];

  await query(sql, params);
}

/**
 * Get the most recent snapshot for a wallet
 */
export async function getLatestSnapshot(
  walletAddress: string
): Promise<WalletSnapshot | null> {
  const sql = `
    SELECT * FROM wallet_snapshots
    WHERE wallet_address = $1
    ORDER BY ts DESC
    LIMIT 1
  `;

  const result = await query(sql, [walletAddress.toLowerCase()]);
  
  if (result.rows.length === 0) {
    return null;
  }

  return rowToSnapshot(result.rows[0]);
}

/**
 * Get the snapshot immediately before a given timestamp
 */
export async function getPreviousSnapshot(
  walletAddress: string,
  beforeTimestamp: Date
): Promise<WalletSnapshot | null> {
  const sql = `
    SELECT * FROM wallet_snapshots
    WHERE wallet_address = $1 AND ts < $2
    ORDER BY ts DESC
    LIMIT 1
  `;

  const result = await query(sql, [walletAddress.toLowerCase(), beforeTimestamp]);
  
  if (result.rows.length === 0) {
    return null;
  }

  return rowToSnapshot(result.rows[0]);
}

/**
 * Get snapshot from N minutes ago (approximate)
 */
export async function getSnapshotNMinutesAgo(
  walletAddress: string,
  minutes: number
): Promise<WalletSnapshot | null> {
  const sql = `
    SELECT * FROM wallet_snapshots
    WHERE wallet_address = $1 
      AND ts <= NOW() - INTERVAL '${minutes} minutes'
    ORDER BY ts DESC
    LIMIT 1
  `;

  const result = await query(sql, [walletAddress.toLowerCase()]);
  
  if (result.rows.length === 0) {
    return null;
  }

  return rowToSnapshot(result.rows[0]);
}

/**
 * Get snapshots within a time range
 */
export async function getSnapshotsInRange(
  walletAddress: string,
  startTime: Date,
  endTime: Date
): Promise<WalletSnapshot[]> {
  const sql = `
    SELECT * FROM wallet_snapshots
    WHERE wallet_address = $1 
      AND ts >= $2 
      AND ts <= $3
    ORDER BY ts ASC
  `;

  const result = await query(sql, [
    walletAddress.toLowerCase(),
    startTime,
    endTime,
  ]);

  return result.rows.map(rowToSnapshot);
}

/**
 * Delete snapshots older than N days
 */
export async function deleteOldSnapshots(daysToKeep: number): Promise<number> {
  const sql = `
    DELETE FROM wallet_snapshots
    WHERE ts < NOW() - INTERVAL '${daysToKeep} days'
  `;

  const result = await query(sql);
  return result.rowCount || 0;
}

/**
 * Get snapshot count for a wallet
 */
export async function getSnapshotCount(walletAddress: string): Promise<number> {
  const sql = `
    SELECT COUNT(*) as count FROM wallet_snapshots
    WHERE wallet_address = $1
  `;

  const result = await query(sql, [walletAddress.toLowerCase()]);
  return parseInt(result.rows[0].count, 10);
}

/**
 * Convert database row to WalletSnapshot
 */
function rowToSnapshot(row: any): WalletSnapshot {
  return {
    timestamp: new Date(row.ts),
    walletAddress: row.wallet_address,
    healthFactor: parseFloat(row.health_factor),
    totalCollateralUSD: parseFloat(row.collateral_usd),
    totalDebtUSD: parseFloat(row.debt_usd),
    netWorthUSD: parseFloat(row.net_worth_usd),
    ltv: parseFloat(row.ltv),
    liquidationThreshold: parseFloat(row.liquidation_threshold),
    currentLTV: parseFloat(row.current_ltv),
    availableBorrowsUSD: parseFloat(row.available_borrows_usd),
    netAPY: parseFloat(row.net_apy),
    supplyPositions: row.supplies_json,
    borrowPositions: row.borrows_json,
    marketStateRaw: row.market_state_json,
  };
}
