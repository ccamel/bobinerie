# Pool XYK ![defi](https://img.shields.io/badge/defi-6C63FF)

XYK (constant-product) AMM pool for two fungible tokens: add/remove liquidity, swap, fee in bps.

<!-- DEPLOYMENTS:START -->

## Deployments

- **garage-hazae41-bob0**: `360a1f069271b93fbd8eb62df02d245cdacf0330813ea7a7c7e123f42ce1f678`
- **garage-ccamel-bob0**: `360a1f069271b93fbd8eb62df02d245cdacf0330813ea7a7c7e123f42ce1f678`

<!-- DEPLOYMENTS:END -->

## Methods

<!-- METHODS:START -->

### `init(creator, token_a, token_b, fee_bps)`

Initialize a new XYK liquidity pool with two tokens and a fee.
Can only be called once. Tokens will be automatically sorted.

**Parameters:**

- `creator` - Address of the pool creator (must match the module creator)
- `token_a` - Address of the first token
- `token_b` - Address of the second token (must be different from token_a)
- `fee_bps` - Trading fee in basis points (0-10000, where 30 = 0.3%)

### `clone(creator)`

Clone this pool module to create a new independent pool instance.
The cloned module will have the same code but requires separate initialization.

**Parameters:**

- `creator` - Address that will be set as the creator of the cloned module

**Returns:**

Address/ID of the newly created pool module

### `tokens()`

Get the two tokens configured for this pool.
Tokens are always returned in sorted order (token0, token1).

**Returns:**

Pack containing [token0_address, token1_address]

### `fee_bps()`

Get the trading fee for this pool in basis points.

**Returns:**

Fee in basis points (e.g., 30 = 0.3% fee)

### `reserves()`

Get the current reserves of both tokens in the pool.
These values determine the exchange rate and available liquidity.

**Returns:**

Pack containing [reserve0, reserve1] corresponding to [token0, token1]

### `total_supply()`

Get the total supply of LP (liquidity provider) tokens.
LP tokens represent shares of ownership in the pool's liquidity.

**Returns:**

Total amount of LP tokens in circulation

### `balance_of(owner)`

Get the LP token balance of a specific address.

**Parameters:**

- `owner` - Address to check the balance for

**Returns:**

Amount of LP tokens owned by the address

### `quote_swap_exact_in(token_in, amount_in)`

Calculate the output amount for a swap without executing it.
Uses the constant product formula: `(x + Δx) * (y - Δy) = x * y`
Applies the pool's trading fee to the input amount.

**Parameters:**

- `token_in` - Address of the token to swap in (must be token0 or token1)
- `amount_in` - Amount of input token to swap

**Returns:**

Pack containing [token_out_address, amount_out]

### `add_liquidity(session, amount0_desired, amount1_desired, amount0_min, amount1_min, lp_min, to)`

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

### `remove_liquidity(session, liquidity, amount0_min, amount1_min, to)`

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

### `swap_exact_in(session, token_in, amount_in, min_out, to)`

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

### `verify(session)`

Verify a pool session capability.

<!-- METHODS:END -->
