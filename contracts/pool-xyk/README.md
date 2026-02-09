# Pool XYK ![defi](https://img.shields.io/badge/defi-6C63FF)

XYK (constant-product) AMM pool for two fungible tokens: add/remove liquidity, swap, fee in bps.

<!-- DEPLOYMENTS:START -->

## Deployments

- **garage-hazae41-bob0**: `6f2c089f24279b09b1938b216da3fc2a4ce0523a896180c23ea4b9532b2b1a13`
- **garage-ccamel-bob0**: `d9a00d0342335b7b302460d2b174940202b9785abe3b43a61287202fbf141452`

<!-- DEPLOYMENTS:END -->

## Usage Scenarios

<!-- FEATURES:START -->

As a user of the Bobine platform
I want to initialize a constant-product pool safely
So that tokens and fees are validated and set only once

These walkthroughs come from `contract.feature` scenarios tagged `@public-doc`.

### Shared Setup

This setup is applied before each published scenario.

Here are the steps:

- **Given** I deploy contract `"pool-xyk"`; and I deploy contract `"ed25519"`; and I use auth module `"ed25519"`

### 1. Initialize with ordered tokens sets tokens and fee

This scenario demonstrates a practical interaction sequence for this contract.

Here are the steps of the scenario:

- **Given** I have keys for `"Alice"`

- **When** I call `"$pool-xyk"` method `"init"` with params:

  ```gherkin
  | $pool-xyk_creator |
  | text:TokenA |
  | text:TokenB |
  | bigint:30 |
  ```

- **Then** the execution should succeed

- **When** I call `"$pool-xyk"` method `"tokens"`

- **Then** the execution should succeed; and the returned value should be:

  ```gherkin
  | text:bobine.pool-xyk/tokens_view |
  | bigint:1 |
  | text:TokenA |
  | text:TokenB |
  ```

- **When** I call `"$pool-xyk"` method `"fee_bps"`

- **Then** the execution should succeed; and the returned value should be `"bigint:30"`

### 2. Add liquidity mints LP and updates reserves

This scenario demonstrates a practical interaction sequence for this contract.

Here are the steps of the scenario:

- **Given** I have keys for `"Alice"`; and I have keys for `"Bob"`; and I deploy contract `"token-fungible"`

- **When** I call `"token-fungible"` method `"clone"` with param `"address:Alice"`

- **Then** the execution should succeed; and the returned value should be a `"string"`; and I remember last returned value as `"token_a"`

- **When** I call `"$token_a"` method `"init"` with param `"address:Alice"`

- **Then** the execution should succeed

- **When** I call `"token-fungible"` method `"clone"` with param `"address:Bob"`

- **Then** the execution should succeed; and the returned value should be a `"string"`; and I remember last returned value as `"token_b"`

- **When** I call `"$token_b"` method `"init"` with param `"address:Bob"`

- **Then** the execution should succeed

- **Given** I have keys for `"Alice"`

- **When** I invoke `"$token_a"` method `"mint"` through auth with params:

  ```gherkin
  | address:Alice |
  | bigint:1000 |
  ```

- **Then** the execution should succeed

- **Given** I have keys for `"Bob"`

- **When** I invoke `"$token_b"` method `"mint"` through auth with params:

  ```gherkin
  | address:Alice |
  | bigint:1000 |
  ```

- **Then** the execution should succeed

- **When** I call `"$pool-xyk"` method `"init"` with params:

  ```gherkin
  | $pool-xyk_creator |
  | $token_a |
  | $token_b |
  | bigint:30 |
  ```

- **Then** the execution should succeed

- **When** I call `"$pool-xyk"` method `"tokens"`

- **Then** the execution should succeed

- **Given** I have keys for `"Alice"`

- **When** I invoke `"$pool-xyk"` method `"add_liquidity"` through auth with params:

  ```gherkin
  | bigint:100 |
  | bigint:100 |
  | bigint:100 |
  | bigint:100 |
  | bigint:100 |
  | address:Alice |
  ```

- **Then** the execution should succeed; and the returned value should be:

  ```gherkin
  | text:bobine.pool-xyk/add_liquidity_view |
  | bigint:1 |
  | bigint:100 |
  | bigint:100 |
  | bigint:100 |
  ```

- **When** I call `"$pool-xyk"` method `"reserves"`

- **Then** the execution should succeed; and the returned value should be:

  ```gherkin
  | text:bobine.pool-xyk/reserves_view |
  | bigint:1 |
  | bigint:100 |
  | bigint:100 |
  ```

- **When** I call `"$pool-xyk"` method `"total_supply"`

- **Then** the execution should succeed; and the returned value should be `"bigint:100"`

- **When** I call `"$pool-xyk"` method `"balance_of"` with param `"address:Alice"`

- **Then** the execution should succeed; and the returned value should be `"bigint:100"`

### 3. Remove liquidity burns LP and returns tokens

This scenario demonstrates a practical interaction sequence for this contract.

Here are the steps of the scenario:

- **Given** I have keys for `"Alice"`; and I have keys for `"Bob"`; and I deploy contract `"token-fungible"`

- **When** I call `"token-fungible"` method `"clone"` with param `"address:Alice"`

- **Then** the execution should succeed; and the returned value should be a `"string"`; and I remember last returned value as `"token_a"`

- **When** I call `"$token_a"` method `"init"` with param `"address:Alice"`

- **Then** the execution should succeed

- **When** I call `"token-fungible"` method `"clone"` with param `"address:Bob"`

- **Then** the execution should succeed; and the returned value should be a `"string"`; and I remember last returned value as `"token_b"`

- **When** I call `"$token_b"` method `"init"` with param `"address:Bob"`

- **Then** the execution should succeed

- **Given** I have keys for `"Alice"`

- **When** I invoke `"$token_a"` method `"mint"` through auth with params:

  ```gherkin
  | address:Alice |
  | bigint:1000 |
  ```

- **Then** the execution should succeed

- **Given** I have keys for `"Bob"`

- **When** I invoke `"$token_b"` method `"mint"` through auth with params:

  ```gherkin
  | address:Alice |
  | bigint:1000 |
  ```

- **Then** the execution should succeed

- **When** I call `"$pool-xyk"` method `"init"` with params:

  ```gherkin
  | $pool-xyk_creator |
  | $token_a |
  | $token_b |
  | bigint:30 |
  ```

- **Then** the execution should succeed

- **Given** I have keys for `"Alice"`

- **When** I invoke `"$pool-xyk"` method `"add_liquidity"` through auth with params:

  ```gherkin
  | bigint:100 |
  | bigint:100 |
  | bigint:100 |
  | bigint:100 |
  | bigint:100 |
  | address:Alice |
  ```

- **Then** the execution should succeed

- **When** I invoke `"$pool-xyk"` method `"remove_liquidity"` through auth with params:

  ```gherkin
  | bigint:40 |
  | bigint:40 |
  | bigint:40 |
  | address:Alice |
  ```

- **Then** the execution should succeed; and the returned value should be:

  ```gherkin
  | text:bobine.pool-xyk/remove_liquidity_view |
  | bigint:1 |
  | bigint:40 |
  | bigint:40 |
  ```

- **When** I call `"$pool-xyk"` method `"reserves"`

- **Then** the execution should succeed; and the returned value should be:

  ```gherkin
  | text:bobine.pool-xyk/reserves_view |
  | bigint:1 |
  | bigint:60 |
  | bigint:60 |
  ```

- **When** I call `"$pool-xyk"` method `"total_supply"`

- **Then** the execution should succeed; and the returned value should be `"bigint:60"`

- **When** I call `"$pool-xyk"` method `"balance_of"` with param `"address:Alice"`

- **Then** the execution should succeed; and the returned value should be `"bigint:60"`

### 4. Swap exact in updates reserves and returns output

This scenario demonstrates a practical interaction sequence for this contract.

Here are the steps of the scenario:

- **Given** I have keys for `"Alice"`; and I have keys for `"Bob"`; and I deploy contract `"token-fungible"`

- **When** I call `"token-fungible"` method `"clone"` with param `"address:Alice"`

- **Then** the execution should succeed; and the returned value should be a `"string"`; and I remember last returned value as `"token_a"`

- **When** I call `"$token_a"` method `"init"` with param `"address:Alice"`

- **Then** the execution should succeed

- **When** I call `"token-fungible"` method `"clone"` with param `"address:Bob"`

- **Then** the execution should succeed; and the returned value should be a `"string"`; and I remember last returned value as `"token_b"`

- **When** I call `"$token_b"` method `"init"` with param `"address:Bob"`

- **Then** the execution should succeed

- **Given** I have keys for `"Alice"`

- **When** I invoke `"$token_a"` method `"mint"` through auth with params:

  ```gherkin
  | address:Alice |
  | bigint:1000 |
  ```

- **Then** the execution should succeed

- **Given** I have keys for `"Bob"`

- **When** I invoke `"$token_b"` method `"mint"` through auth with params:

  ```gherkin
  | address:Alice |
  | bigint:1000 |
  ```

- **Then** the execution should succeed

- **When** I call `"$pool-xyk"` method `"init"` with params:

  ```gherkin
  | $pool-xyk_creator |
  | $token_a |
  | $token_b |
  | bigint:30 |
  ```

- **Then** the execution should succeed

- **Given** I have keys for `"Alice"`

- **When** I invoke `"$pool-xyk"` method `"add_liquidity"` through auth with params:

  ```gherkin
  | bigint:100 |
  | bigint:100 |
  | bigint:100 |
  | bigint:100 |
  | bigint:100 |
  | address:Alice |
  ```

- **Then** the execution should succeed

- **When** I invoke `"$pool-xyk"` method `"swap_exact_in"` through auth with params:

  ```gherkin
  | $token_a |
  | bigint:10 |
  | bigint:9 |
  | address:Alice |
  ```

- **Then** the execution should succeed; and the returned value should be:

  ```gherkin
  | text:bobine.pool-xyk/swap_exact_in_view |
  | bigint:1 |
  | $token_b |
  | bigint:9 |
  ```

- **When** I call `"$pool-xyk"` method `"reserves"`

- **Then** the execution should succeed; and the returned values should be in any order:

  ```gherkin
  | bigint:91 |
  | bigint:110 |
  ```

- **When** I call `"$pool-xyk"` method `"total_supply"`

- **Then** the execution should succeed; and the returned value should be `"bigint:100"`

- **When** I call `"$pool-xyk"` method `"balance_of"` with param `"address:Alice"`

- **Then** the execution should succeed; and the returned value should be `"bigint:100"`

<!-- FEATURES:END -->

## Methods

<!-- METHODS:START -->

### 🔹 `add_liquidity(session, amount0_desired, amount1_desired, amount0_min, amount1_min, lp_min, to)`

Add liquidity to the pool and receive LP tokens.
Tokens are transferred from the caller and LP tokens are minted to the recipient.
The actual amounts may differ from desired amounts to maintain the pool's ratio.

**Parameters:**

- `session` - Authenticated session of the liquidity provider
- `amount0_desired` - Desired amount of token0 to add
- `amount1_desired` - Desired amount of token1 to add
- `amount0_min` - Minimum amount of token0 (slippage protection)
- `amount1_min` - Minimum amount of token1 (slippage protection)
- `lp_min` - Minimum LP tokens to receive (slippage protection)
- `to` - Address to receive the LP tokens

**Returns:**

Pack containing [amount0_added, amount1_added, liquidity_minted]

### 🔹 `balance_of(owner)`

Get the LP token balance of a specific address.

**Parameters:**

- `owner` - Address to check the balance for

**Returns:**

Amount of LP tokens owned by the address

### 🔹 `clone(creator)`

Clone this pool module to create a new independent pool instance.
The cloned module will have the same code but requires separate initialization.

**Parameters:**

- `creator` - Address that will be set as the creator of the cloned module

**Returns:**

Address/ID of the newly created pool module

### 🔹 `fee_bps()`

Get the trading fee for this pool in basis points.

**Returns:**

Fee in basis points (e.g., 30 = 0.3% fee)

### 🔹 `init(creator, token_a, token_b, fee_bps)`

Initialize a new XYK liquidity pool with two tokens and a fee.
Can only be called once. Tokens will be automatically sorted.

**Parameters:**

- `creator` - Address of the pool creator (must match the module creator)
- `token_a` - Address of the first token
- `token_b` - Address of the second token (must be different from token_a)
- `fee_bps` - Trading fee in basis points (0-10000, where 30 = 0.3%)

### 🔹 `quote_swap_exact_in(token_in, amount_in)`

Calculate the output amount for a swap without executing it.
Uses the constant product formula: `(x + Δx) * (y - Δy) = x * y`
Applies the pool's trading fee to the input amount.

**Parameters:**

- `token_in` - Address of the token to swap in (must be token0 or token1)
- `amount_in` - Amount of input token to swap

**Returns:**

Pack containing [token_out_address, amount_out]

### 🔹 `remove_liquidity(session, liquidity, amount0_min, amount1_min, to)`

Remove liquidity from the pool by burning LP tokens.
LP tokens are burned and both underlying tokens are returned proportionally.

**Parameters:**

- `session` - Authenticated session of the liquidity provider
- `liquidity` - Amount of LP tokens to burn
- `amount0_min` - Minimum amount of token0 to receive (slippage protection)
- `amount1_min` - Minimum amount of token1 to receive (slippage protection)
- `to` - Address to receive the tokens

**Returns:**

Pack containing [amount0_received, amount1_received]

### 🔹 `reserves()`

Get the current reserves of both tokens in the pool.
These values determine the exchange rate and available liquidity.

**Returns:**

Pack containing [reserve0, reserve1] corresponding to [token0, token1]

### 🔹 `swap_exact_in(session, token_in, amount_in, min_out, to)`

Swap an exact amount of input token for output token.
Uses the constant product AMM formula with trading fees applied.
Input tokens are transferred from caller, output tokens sent to recipient.

**Parameters:**

- `session` - Authenticated session of the trader
- `token_in` - Address of the token to swap in (must be token0 or token1)
- `amount_in` - Exact amount of input token to swap
- `min_out` - Minimum amount of output token to receive (slippage protection)
- `to` - Address to receive the output tokens

**Returns:**

Pack containing [token_out_address, amount_out]

### 🔹 `tokens()`

Get the two tokens configured for this pool.
Tokens are always returned in sorted order (token0, token1).

**Returns:**

Pack containing [token0_address, token1_address]

### 🔹 `total_supply()`

Get the total supply of LP (liquidity provider) tokens.
LP tokens represent shares of ownership in the pool's liquidity.

**Returns:**

Total amount of LP tokens in circulation

### 🔹 `verify(session)`

Verify a pool session capability.

<!-- METHODS:END -->
