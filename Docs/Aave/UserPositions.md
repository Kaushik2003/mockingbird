# User Positions

Monitor user positions and account health across Aave markets.

## User Positions

Track user supplied and borrowed assets across Aave markets.

Use the `userSupplies` and `userBorrows` actions to fetch user positions.

### userSupplies.ts

```typescript
import { userSupplies } from "@aave/client/actions";
import { evmAddress } from "@aave/client";
import { client } from "./client";
import { markets } from "./markets";

const user = evmAddress("0x742d35cc6e5c4ce3b69a2a8c7c8e5f7e9a0b1234");

const result = await userSupplies(client, {
  markets,
  user,
});

if (result.isErr()) {
  console.error("Supplies error:", result.error);
} else {
  // result.value: MarketUserReserveSupplyPosition[]
  console.log(result.value);
}
```

### userBorrows.ts

```typescript
import { userBorrows } from "@aave/client/actions";
import { evmAddress } from "@aave/client";
import { client } from "./client";
import { markets } from "./markets";

const user = evmAddress("0x742d35cc6e5c4ce3b69a2a8c7c8e5f7e9a0b1234");

const result = await userBorrows(client, {
  markets,
  user,
});

if (result.isErr()) {
  console.error("Borrows error:", result.error);
} else {
  // result.value: MarketUserReserveBorrowPosition[]
  console.log(result.value);
}
```

#### markets.ts

```typescript
import { evmAddress, chainId } from "@aave/client";

export const markets = [
  {
    address: evmAddress("0x87870bca3f3fd6335c3f4ce8392d69350b4fa4e2"),
    chainId: chainId(1),
  },
];
```

#### client.ts

```typescript
import { AaveClient } from "@aave/client";

export const client = AaveClient.create();
```

## Account Health

Monitor user account health and risk metrics across Aave positions.

The health factor is calculated only when a user has at least one active borrow position. If the user has no positions or only supply positions, the health factor will be null.

Use the `userMarketState` action to fetch user account health and market state.

### userMarketState

```typescript
import { evmAddress, chainId } from "@aave/client";
import { userMarketState } from "@aave/client/actions";

import { client } from "./client";

const result = await userMarketState(client, {
  market: evmAddress("0x87870bca3f3fd6335c3f4ce8392d69350b4fa4e2"),
  user: evmAddress("0x742d35cc6e5c4ce3b69a2a8c7c8e5f7e9a0b1234"),
  chainId: chainId(1),
});

if (result.isErr()) {
  console.error(result.error);
} else {
  // result.value: MarketUserState
  console.log("Health Factor:", result.value.healthFactor);
  console.log("Net Worth:", result.value.netWorth);
  console.log("eMode Enabled:", result.value.eModeEnabled);
}
```

#### client.ts

```typescript
import { AaveClient } from "@aave/client";

export const client = AaveClient.create();
```