# Advanced Features

Implement advanced Aave features for sophisticated DeFi applications.

## User Transaction History

Track user transaction history across Aave markets with detailed transaction information.

Use the `userTransactionHistory` action to fetch paginated transaction history for a user.

### User Transaction History

```typescript
import {
  userTransactionHistory,
  evmAddress,
  chainId,
  PageSize,
  OrderDirection,
} from "@aave/client/actions";

import { client } from "./client";

const result = await userTransactionHistory(client, {
  market: evmAddress("0x87870bca3f3fd6335c3f4ce8392d69350b4fa4e2"),
  user: evmAddress("0x742d35cc6e5c4ce3b69a2a8c7c8e5f7e9a0b1234"),
  chainId: chainId(1),
  orderBy: { date: OrderDirection.DESC },
  pageSize: PageSize.FIFTY,
});

if (result.isErr()) {
  console.error("User transaction history error:", result.error);
} else {
  // result.value.items: UserTransactionItem[]
  // result.value.pageInfo.next: Cursor | null
  // result.value.pageInfo.prev: Cursor | null
  console.log(result.value);
}
```

### Filtered Transaction History

```typescript
import {
  userTransactionHistory,
  evmAddress,
  chainId,
  PageSize,
  OrderDirection,
  UserTransactionType,
} from "@aave/client/actions";

import { client } from "./client";

const result = await userTransactionHistory(client, {
  market: evmAddress("0x87870bca3f3fd6335c3f4ce8392d69350b4fa4e2"),
  user: evmAddress("0x742d35cc6e5c4ce3b69a2a8c7c8e5f7e9a0b1234"),
  chainId: chainId(1),
  filter: [UserTransactionType.SUPPLY, UserTransactionType.BORROW],
  orderBy: { date: OrderDirection.DESC },
  pageSize: PageSize.TEN,
});
```

#### client.ts

```typescript
import { AaveClient } from "@aave/client";

export const client = AaveClient.create();
```

### Transaction Types

The user transaction history includes the following transaction types with their specific data:

- **SUPPLY** - Asset supply transactions with amount and reserve information
- **WITHDRAW** - Asset withdrawal transactions with amount and reserve information
- **BORROW** - Asset borrowing transactions with amount and reserve information
- **REPAY** - Debt repayment transactions with amount and reserve information
- **USAGE_AS_COLLATERAL** - Collateral enable/disable transactions with enabled flag
- **LIQUIDATION_CALL** - Liquidation transactions with collateral and debt repaid details

### Filtering Options

Use the `filter` parameter to narrow down transaction results by transaction types:

```typescript
filter: [UserTransactionType.SUPPLY, UserTransactionType.WITHDRAW];
```

Available filter values: `SUPPLY`, `WITHDRAW`, `BORROW`, `REPAY`, `USAGE_AS_COLLATERAL`, `LIQUIDATION_CALL`

### Ordering Options

Order transactions using the `orderBy` parameter:

- **date** - Order by transaction date (ASC or DESC)