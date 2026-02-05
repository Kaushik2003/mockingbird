# Markets Data

Learn how to discover available markets and access detailed market information in Aave.

## Market Structure

Aave market data provides comprehensive information about lending pools across different chains, including:

- Market identification (name, chain, address)
- The reserves in the market
- Efficiency mode (eMode) categories and configurations
- Market metrics (total size, available liquidity)

When you provide a user account address, the data also includes user-specific information such as net worth, health factor, and current positions.

The following TypeScript interfaces illustrate the core Market type and its related types:

### Market

```typescript
interface Market {
  name: string;
  chain: Chain;
  address: EvmAddress;
  icon: string;
  totalMarketSize: BigDecimal;
  totalAvailableLiquidity: BigDecimal;
  eModeCategories: EmodeMarketCategory[];
  userState?: MarketUserState;
  borrowReserves: Reserve[];
  supplyReserves: Reserve[];
}
```

### EmodeMarketCategory

```typescript
interface EmodeMarketCategory {
  id: number;
  label: string;
  maxLTV: PercentValue;
  liquidationThreshold: PercentValue;
  liquidationPenalty: PercentValue;
}
```

### MarketUserState

```typescript
interface MarketUserState {
  netWorth: BigDecimal;
  netAPY: PercentValue;
  healthFactor: BigDecimal;
  eModeEnabled: boolean;
  totalCollateralBase: BigDecimal;
  totalDebtBase: BigDecimal;
  availableBorrowsBase: BigDecimal;
  currentLiquidationThreshold: PercentValue;
  ltv: PercentValue;
  isInIsolationMode: boolean;
}
```

### EmodeReserveInfo

```typescript
interface EmodeReserveInfo {
  categoryId: number;
  label: string;
  maxLTV: PercentValue;
  liquidationThreshold: PercentValue;
  liquidationPenalty: PercentValue;
}
```

## Reserve Structure

Each reserve within an Aave market provides comprehensive lending and borrowing data for a specific asset, including:

- Token information (underlying, aToken, vToken addresses and metadata)
- Supply information (APY, liquidity, caps, collateral configuration)
- Borrow information (APY, available liquidity, utilization rates, caps)
- Reserve incentives (Merit programs, Aave governance rewards)
- Market mechanics (flash loans, permits, pause/freeze states)
- Efficiency mode (eMode) configurations for the asset
- Isolation mode settings (if applicable)
- User-specific state (balances, borrowable amounts, collateral usage)

When you provide a user account address, the reserve data also includes user-specific information such as current balances, borrowing capacity, and collateral status.

The following TypeScript interfaces illustrate the core Reserve type and its related types:

### Reserve

```typescript
interface Reserve {
  market: MarketInfo;
  underlyingToken: Currency;
  aToken: Currency;
  vToken: Currency;
  acceptsNative?: NativeCurrency;
  size: TokenAmount;
  usdExchangeRate: BigDecimal;
  usdOracleAddress: EvmAddress;
  isFrozen: boolean;
  isPaused: boolean;
  flashLoanEnabled: boolean;
  permitSupported: boolean;
  supplyInfo: ReserveSupplyInfo;
  borrowInfo?: ReserveBorrowInfo;
  isolationModeConfig?: ReserveIsolationModeConfig;
  eModeInfo: EmodeReserveInfo[];
  incentives: ReserveIncentive[];
  userState?: ReserveUserState;
}
```

### Borrow & Supply

```typescript
interface ReserveSupplyInfo {
  apy: PercentValue;
  total: DecimalValue;
  maxLTV: PercentValue;
  liquidationThreshold: PercentValue;
  liquidationBonus: PercentValue;
  canBeCollateral: boolean;
  supplyCap: TokenAmount;
  supplyCapReached: boolean;
}

interface ReserveBorrowInfo {
  apy: PercentValue;
  total: TokenAmount;
  borrowCap: TokenAmount;
  reserveFactor: PercentValue;
  availableLiquidity: TokenAmount;
  utilizationRate: PercentValue;
  variableRateSlope1: PercentValue;
  variableRateSlope2: PercentValue;
  optimalUsageRate: PercentValue;
  borrowingState: ReserveBorrowingState;
  borrowCapReached: boolean;
}
```

### Isolation Mode

```typescript
interface ReserveIsolationModeConfig {
  canBeCollateral: boolean;
  canBeBorrowed: boolean;
  debtCeiling: TokenAmount;
  debtCeilingDecimals: number;
  totalBorrows: TokenAmount;
}
```

### User State

```typescript
interface ReserveUserState {
  balance: TokenAmount;
  suppliable: TokenAmount;
  borrowable: TokenAmount;
  emode?: EmodeReserveInfo;
  canBeCollateral: boolean;
  canBeBorrowed: boolean;
  isInIsolationMode: boolean;
}
```

### Incentives

```typescript
type ReserveIncentive =
  | MeritSupplyIncentive
  | MeritBorrowIncentive
  | MeritBorrowAndSupplyIncentiveCondition
  | AaveSupplyIncentive
  | AaveBorrowIncentive;

interface MeritSupplyIncentive {
  __typename: "MeritSupplyIncentive";
  extraSupplyApr: PercentValue;
  claimLink: string;
}

interface MeritBorrowIncentive {
  __typename: "MeritBorrowIncentive";
  borrowAprDiscount: PercentValue;
  claimLink: string;
}

interface MeritBorrowAndSupplyIncentiveCondition {
  __typename: "MeritBorrowAndSupplyIncentiveCondition";
  extraApr: PercentValue;
  supplyToken: Currency;
  borrowToken: Currency;
  claimLink: string;
}

interface AaveSupplyIncentive {
  __typename: "AaveSupplyIncentive";
  extraSupplyApr: PercentValue;
  rewardTokenAddress: EvmAddress;
  rewardTokenSymbol: string;
}

interface AaveBorrowIncentive {
  __typename: "AaveBorrowIncentive";
  borrowAprDiscount: PercentValue;
  rewardTokenAddress: EvmAddress;
  rewardTokenSymbol: string;
}
```

## Listing Available Markets

Discover all available Aave markets across supported blockchain networks.

### Ethereum Markets

```typescript
import { evmAddress, chainId } from "@aave/client";
import { markets } from "@aave/client/actions";

import { client } from "./client";

const result = markets(client, {
  chainIds: [chainId(1)],
});

if (result.isErr()) {
  console.error(result.error);
} else {
  // result.value: Market[]
  console.log(result.value);
}
```

#### client.ts

```typescript
import { AaveClient } from "@aave/client";

export const client = AaveClient.create();
```

### Use a User Address to Include Account-Level Data

With User State:

```typescript
import { markets } from "@aave/client/actions";
import { evmAddress, chainId } from "@aave/client";

import { client } from "./client";

const result = markets(client, {
  chainIds: [chainId(1)],
  user: evmAddress("0x742d35cc6e5c4ce3b69a2a8c7c8e5f7e9a0b1234"),
});
```

## Single Market

Retrieve detailed information about a specific market including reserves and user state.

Use the `market` action to fetch detailed information about a specific market.

### Ethereum Market

```typescript
import { market } from "@aave/client/actions";
import { evmAddress, chainId } from "@aave/client";

import { client } from "./client";

const result = await market(client, {
  address: evmAddress("0x87870bca3f3fd6335c3f4ce8392d69350b4fa4e2"),
  chainId: chainId(1),
  user: evmAddress("0x742d35cc6e5c4ce3b69a2a8c7c8e5f7e9a0b1234"),
});

if (result.isErr()) {
  console.error(result.error);
} else {
  // result.value: Market | null
  console.log(result.value);
}
```

#### client.ts

```typescript
import { AaveClient } from "@aave/client";

export const client = AaveClient.create();
```

### With User State

```typescript
import { market } from "@aave/client/actions";
import { evmAddress, chainId } from "@aave/client";

import { client } from "./client";

const result = await market(client, {
  address: evmAddress("0x87870bca3f3fd6335c3f4ce8392d69350b4fa4e2"),
  chainId: chainId(1),
  user: evmAddress("0x742d35cc6e5c4ce3b69a2a8c7c8e5f7e9a0b1234"),
});
```

## APY History

Retrieve historical APY data for reserves to analyze interest rate trends over time.

Use the `borrowAPYHistory` and `supplyAPYHistory` actions to fetch historical APY data.

### Borrow APY History

```typescript
import { borrowAPYHistory } from "@aave/client/actions";
import { evmAddress, chainId, TimeWindow } from "@aave/client";

import { client } from "./client";

const result = await borrowAPYHistory(client, {
  chainId: chainId(1),
  underlyingToken: evmAddress("0xa0b86a33e6441c8c5f0bb9b7e5e1f8bbf5b78b5c"), // USDC
  market: evmAddress("0x87870bca3f3fd6335c3f4ce8392d69350b4fa4e2"),
  window: TimeWindow.LastWeek,
});

if (result.isErr()) {
  console.error(result.error);
} else {
  // result.value: APYSample[] | null
  result.value?.forEach((sample) => {
    console.log(`Date: ${sample.date}, APY: ${sample.avgRate.value}%`);
  });
}
```

### Supply APY History

```typescript
import { supplyAPYHistory } from "@aave/client/actions";
import { evmAddress, chainId, TimeWindow } from "@aave/client";

import { client } from "./client";

const result = await supplyAPYHistory(client, {
  chainId: chainId(1),
  underlyingToken: evmAddress("0xa0b86a33e6441c8c5f0bb9b7e5e1f8bbf5b78b5c"), // USDC
  market: evmAddress("0x87870bca3f3fd6335c3f4ce8392d69350b4fa4e2"),
  window: TimeWindow.LastMonth,
});

if (result.isErr()) {
  console.error(result.error);
} else {
  // result.value: APYSample[] | null
}
```

#### client.ts

```typescript
import { AaveClient } from "@aave/client";

export const client = AaveClient.create();
```

### The Returned APYSample Contains:

- `avgRate`: Average APY for the time period
- `date`: Timestamp for the data point

### Available Time Windows Include:

- `TimeWindow.LastDay`
- `TimeWindow.LastWeek`
- `TimeWindow.LastMonth`
- `TimeWindow.LastSixMonths`
- `TimeWindow.LastYear`