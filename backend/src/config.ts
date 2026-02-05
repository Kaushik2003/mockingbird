/**
 * Configuration Module
 * Loads and validates environment variables
 */

import { evmAddress, chainId, type EvmAddress, type ChainId } from "@aave/client";
import { AAVE_V3_MARKETS, CHAIN_IDS } from "./aave/constants";

export interface Config {
  // Database
  databaseUrl: string;

  // Wallet to monitor
  walletAddress: string;

  // Aave market
  marketAddress: EvmAddress;
  chainId: ChainId;

  // Polling
  pollIntervalMs: number;

  // Buffer
  bufferSize: number;

  // Retention
  retentionDays: number;
}

/**
 * Load configuration from environment variables
 */
export function loadConfig(): Config {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error("DATABASE_URL environment variable is required");
  }

  const walletAddress = process.env.WALLET_ADDRESS;
  if (!walletAddress) {
    throw new Error("WALLET_ADDRESS environment variable is required");
  }

  // Optional: market address (default to Ethereum Core)
  const marketAddressStr = process.env.MARKET_ADDRESS || AAVE_V3_MARKETS.ETHEREUM_CORE;
  const marketAddress = evmAddress(marketAddressStr);

  // Optional: chain ID (default to Ethereum mainnet)
  const chainIdNum = process.env.CHAIN_ID ? parseInt(process.env.CHAIN_ID) : 1;
  const chainIdValue = chainId(chainIdNum);

  // Optional: poll interval (default 5 seconds)
  const pollIntervalMs = process.env.POLL_INTERVAL_MS
    ? parseInt(process.env.POLL_INTERVAL_MS)
    : 5000;

  // Optional: buffer size (default 120 snapshots = 10 min at 5s interval)
  const bufferSize = process.env.BUFFER_SIZE
    ? parseInt(process.env.BUFFER_SIZE)
    : 120;

  // Optional: retention days (default 7 days)
  const retentionDays = process.env.RETENTION_DAYS
    ? parseInt(process.env.RETENTION_DAYS)
    : 7;

  return {
    databaseUrl,
    walletAddress,
    marketAddress,
    chainId: chainIdValue,
    pollIntervalMs,
    bufferSize,
    retentionDays,
  };
}

/**
 * Print configuration (for startup logging)
 */
export function printConfig(config: Config): void {
  console.log("\n📋 Configuration:");
  console.log(`   Wallet: ${config.walletAddress}`);
  console.log(`   Market: ${config.marketAddress}`);
  console.log(`   Chain ID: ${config.chainId}`);
  console.log(`   Poll Interval: ${config.pollIntervalMs}ms`);
  console.log(`   Buffer Size: ${config.bufferSize} snapshots`);
  console.log(`   Retention: ${config.retentionDays} days`);
  console.log("");
}
