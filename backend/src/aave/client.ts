/**
 * Aave Client Module
 * Central client instance for all Aave interactions.
 */

import { AaveClient } from "@aave/client";

// Create a singleton client instance
export const client = AaveClient.create();
