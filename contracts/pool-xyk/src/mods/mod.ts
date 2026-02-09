import {
  bigintref,
  bigints,
  blobs,
  env,
  modules,
  packref,
  packs,
  refs,
  sha256,
  storage,
  textref,
  texts,
} from "@hazae41/stdbob"

const DOMAIN = "bobine.pool-xyk"
const VERSION = (): bigintref => bigints.one()
const DOMAIN_TAG = (suffix: string): textref =>
  texts.fromString(`${DOMAIN}/${suffix}`)

namespace selfcheck$ {
  export function expected(creator: textref): textref {
    return blobs.toBase16(
      sha256.digest(
        blobs.encode(
          packs.create2(modules.load(modules.self()), packs.create1(creator)),
        ),
      ),
    )
  }

  export function assert(creator: textref): void {
    const module = expected(creator)

    if (!texts.equals(modules.self(), module)) {
      env.panic<void>(texts.fromString("Invalid module creator"))
      return
    }
  }
}

namespace session$ {
  const VERIFY_METHOD = (): textref => texts.fromString("verify")

  export function addressOf(session: packref): textref {
    return blobs.toBase16(sha256.digest(blobs.encode(session)))
  }

  export function assert(session: packref): textref {
    const module = packs.get<textref>(session, 0)
    const verified = packs.get<bool>(
      modules.call(module, VERIFY_METHOD(), packs.create1(session)),
      0,
    )

    if (!verified)
      return env.panic<textref>(texts.fromString("Invalid session"))

    return addressOf(session)
  }
}

namespace pool_session$ {
  const selfSession: packref = packs.create1(modules.self())
  const selfNumeric: u32 = refs.numerize(selfSession)

  export function get(): packref {
    return selfSession
  }

  export function verify(session: packref): bool {
    return refs.numerize(session) === selfNumeric
  }
}

namespace math$ {
  export function isqrt(n: bigintref): bigintref {
    if (bigints.lt(n, bigints.zero()))
      return env.panic<bigintref>(texts.fromString("Invalid sqrt"))

    if (bigints.eq(n, bigints.zero())) return bigints.zero()

    let x = n
    let y = bigints.div(
      bigints.add(x, bigints.one()),
      bigints.fromBase10(texts.fromString("2")),
    )

    while (bigints.lt(y, x)) {
      x = y
      y = bigints.div(
        bigints.add(x, bigints.div(n, x)),
        bigints.fromBase10(texts.fromString("2")),
      )
    }

    return x
  }
}

namespace pool$ {
  const prefix = (): textref => texts.fromString("pool:")

  const token0Key = (): textref => texts.fromString("token0")
  const token1Key = (): textref => texts.fromString("token1")
  const feeBpsKey = (): textref => texts.fromString("fee_bps")

  const maxFeeBps = (): bigintref =>
    bigints.fromBase10(texts.fromString("10000"))

  function key(field: textref): textref {
    return texts.concat(prefix(), field)
  }

  function compareTokens(token_a: textref, token_b: textref): i8 {
    if (texts.equals(token_a, token_b)) {
      return 0
    }
    const token_this = texts.toString(token_a)
    const token_that = texts.toString(token_b)

    if (token_this < token_that) {
      return -1
    } else {
      return 1
    }
  }

  function initialized(): bool {
    const found = storage.get(key(token0Key()))
    return !!found
  }

  function assertUninitialized(): void {
    if (initialized()) {
      env.panic<void>(texts.fromString("Already initialized"))
      return
    }
  }

  export function assertInitialized(): void {
    if (!initialized()) {
      env.panic<void>(texts.fromString("Pool is not initialized"))
      return
    }
  }

  export function init(
    token_a: textref,
    token_b: textref,
    fee_bps: bigintref,
  ): void {
    assertUninitialized()

    switch (compareTokens(token_a, token_b)) {
      case -1:
        break
      case 0:
        env.panic<void>(
          texts.fromString("Token A and Token B must be different"),
        )
        return
      case 1: {
        const temp = token_a
        token_a = token_b
        token_b = temp
        break
      }
    }

    if (bigints.lt(fee_bps, bigints.zero())) {
      env.panic<void>(texts.fromString("Invalid fee_bps"))
      return
    }

    if (bigints.gt(fee_bps, maxFeeBps())) {
      env.panic<void>(texts.fromString("Invalid fee_bps"))
      return
    }

    storage.set(key(token0Key()), token_a)
    storage.set(key(token1Key()), token_b)
    storage.set(key(feeBpsKey()), fee_bps)

    reserve$.reset()
    liquidity$.reset()
  }

  export function tokens(): packref {
    assertInitialized()

    const token0Stored = storage.get(key(token0Key()))
    const token1Stored = storage.get(key(token1Key()))

    const token0 = packs.get<textref>(token0Stored, 0)
    const token1 = packs.get<textref>(token1Stored, 0)

    return packs.create2(token0, token1)
  }

  export function feeBps(): bigintref {
    assertInitialized()

    const feeBpsStored = storage.get(key(feeBpsKey()))

    return packs.get<bigintref>(feeBpsStored, 0)
  }

  export function feeDenominator(): bigintref {
    return bigints.fromBase10(texts.fromString("10000"))
  }
}

namespace reserve$ {
  const prefix = (): textref => texts.fromString("pool:")

  const reserve0Key = (): textref => texts.fromString("reserve0")
  const reserve1Key = (): textref => texts.fromString("reserve1")

  function key(field: textref): textref {
    return texts.concat(prefix(), field)
  }

  export function get(): packref {
    pool$.assertInitialized()

    const reserve0Stored = storage.get(key(reserve0Key()))
    const reserve1Stored = storage.get(key(reserve1Key()))

    const reserve0 = reserve0Stored
      ? packs.get<bigintref>(reserve0Stored, 0)
      : bigints.zero()

    const reserve1 = reserve1Stored
      ? packs.get<bigintref>(reserve1Stored, 0)
      : bigints.zero()

    return packs.create2(reserve0, reserve1)
  }

  export function set(reserve0: bigintref, reserve1: bigintref): void {
    pool$.assertInitialized()

    storage.set(key(reserve0Key()), reserve0)
    storage.set(key(reserve1Key()), reserve1)
  }

  export function reset(): void {
    pool$.assertInitialized()

    storage.set(key(reserve0Key()), bigints.zero())
    storage.set(key(reserve1Key()), bigints.zero())
  }
}

namespace token$ {
  export function transfer(
    token: textref,
    session: packref,
    to: textref,
    amount: bigintref,
  ): void {
    const transferMethod = (): textref => texts.fromString("transfer")

    modules.call(token, transferMethod(), packs.create3(session, to, amount))
  }

  export function transfer_from(
    token: textref,
    session: packref,
    owner: textref,
    to: textref,
    amount: bigintref,
  ): void {
    const transferFromMethod = (): textref => texts.fromString("transfer_from")

    modules.call(
      token,
      transferFromMethod(),
      packs.create4(session, owner, to, amount),
    )
  }
}

namespace liquidity$ {
  const prefix = (): textref => texts.fromString("pool:")
  const totalSupplyKey = (): textref => texts.fromString("total_supply")
  const prefixOwned = (): textref => texts.fromString("liquidity:")

  function key(field: textref): textref {
    return texts.concat(prefix(), field)
  }

  function keyOwned(owner: textref): textref {
    return texts.concat(prefixOwned(), owner)
  }

  export function balanceOf(owner: textref): bigintref {
    pool$.assertInitialized()
    const found = storage.get(keyOwned(owner))
    if (!found) return bigints.zero()

    return packs.get<bigintref>(found, 0)
  }

  export function setBalanceOf(owner: textref, value: bigintref): void {
    pool$.assertInitialized()

    storage.set(keyOwned(owner), value)
  }

  export function get(): bigintref {
    pool$.assertInitialized()
    const found = storage.get(key(totalSupplyKey()))
    if (!found) return bigints.zero()

    return packs.get<bigintref>(found, 0)
  }

  export function set(value: bigintref): void {
    pool$.assertInitialized()
    storage.set(key(totalSupplyKey()), value)
  }

  export function reset(): void {
    pool$.assertInitialized()
    storage.set(key(totalSupplyKey()), bigints.zero())
  }

  export function add_liquidity(
    session: packref,
    amount0_desired: bigintref,
    amount1_desired: bigintref,
    amount0_min: bigintref,
    amount1_min: bigintref,
    lp_min: bigintref,
    to: textref,
  ): packref {
    pool$.assertInitialized()

    if (bigints.eq(amount0_desired, bigints.zero()))
      return env.panic<packref>(texts.fromString("Invalid amount0_desired"))

    if (bigints.eq(amount1_desired, bigints.zero()))
      return env.panic<packref>(texts.fromString("Invalid amount1_desired"))

    const tokens = pool$.tokens()
    const token0 = packs.get<textref>(tokens, 0)
    const token1 = packs.get<textref>(tokens, 1)

    const reserves = reserve$.get()
    const reserve0 = packs.get<bigintref>(reserves, 0)
    const reserve1 = packs.get<bigintref>(reserves, 1)

    let amount0: bigintref
    let amount1: bigintref

    if (
      bigints.eq(reserve0, bigints.zero()) &&
      bigints.eq(reserve1, bigints.zero())
    ) {
      amount0 = amount0_desired
      amount1 = amount1_desired
    } else {
      const amount1_optimal = bigints.div(
        bigints.mul(amount0_desired, reserve1),
        reserve0,
      )
      if (bigints.lte(amount1_optimal, amount1_desired)) {
        amount0 = amount0_desired
        amount1 = amount1_optimal
      } else {
        const amount0_optimal = bigints.div(
          bigints.mul(amount1_desired, reserve0),
          reserve1,
        )
        amount0 = amount0_optimal
        amount1 = amount1_desired
      }
    }

    if (bigints.lt(amount0, amount0_min))
      return env.panic<packref>(texts.fromString("Insufficient amount0"))
    if (bigints.lt(amount1, amount1_min))
      return env.panic<packref>(texts.fromString("Insufficient amount1"))

    const totalSupply = liquidity$.get()
    let liquidity: bigintref
    if (bigints.eq(totalSupply, bigints.zero())) {
      liquidity = math$.isqrt(bigints.mul(amount0, amount1))
    } else {
      const liquidity0 = bigints.div(
        bigints.mul(amount0, totalSupply),
        reserve0,
      )
      const liquidity1 = bigints.div(
        bigints.mul(amount1, totalSupply),
        reserve1,
      )
      liquidity = bigints.lt(liquidity0, liquidity1) ? liquidity0 : liquidity1
    }

    if (bigints.eq(liquidity, bigints.zero()))
      return env.panic<packref>(texts.fromString("Zero liquidity"))

    if (bigints.lt(liquidity, lp_min))
      return env.panic<packref>(
        texts.fromString("Insufficient liquidity minted"),
      )

    const poolSession = pool_session$.get()
    const poolAddress = session$.addressOf(poolSession)
    token$.transfer(token0, session, poolAddress, amount0)
    token$.transfer(token1, session, poolAddress, amount1)

    const newReserve0 = bigints.add(reserve0, amount0)
    const newReserve1 = bigints.add(reserve1, amount1)
    reserve$.set(newReserve0, newReserve1)

    const newTotalSupply = bigints.add(totalSupply, liquidity)
    liquidity$.set(newTotalSupply)

    const previousBalance = liquidity$.balanceOf(to)
    const newBalance = bigints.add(previousBalance, liquidity)
    liquidity$.setBalanceOf(to, newBalance)

    return packs.create3(amount0, amount1, liquidity)
  }

  export function remove_liquidity(
    session: packref,
    liquidity: bigintref,
    amount0_min: bigintref,
    amount1_min: bigintref,
    to: textref,
  ): packref {
    pool$.assertInitialized()

    if (bigints.eq(liquidity, bigints.zero()))
      return env.panic<packref>(texts.fromString("Invalid liquidity"))

    const caller = session$.assert(session)

    const tokens = pool$.tokens()
    const token0 = packs.get<textref>(tokens, 0)
    const token1 = packs.get<textref>(tokens, 1)

    const reserves = reserve$.get()
    const reserve0 = packs.get<bigintref>(reserves, 0)
    const reserve1 = packs.get<bigintref>(reserves, 1)

    const totalSupply = liquidity$.get()
    if (bigints.eq(totalSupply, bigints.zero()))
      return env.panic<packref>(texts.fromString("No liquidity"))

    const balance = liquidity$.balanceOf(caller)
    if (bigints.lt(balance, liquidity))
      return env.panic<packref>(
        texts.fromString("Insufficient liquidity balance"),
      )

    const amount0 = bigints.div(bigints.mul(liquidity, reserve0), totalSupply)
    const amount1 = bigints.div(bigints.mul(liquidity, reserve1), totalSupply)

    if (bigints.lt(amount0, amount0_min))
      return env.panic<packref>(texts.fromString("Insufficient amount0"))
    if (bigints.lt(amount1, amount1_min))
      return env.panic<packref>(texts.fromString("Insufficient amount1"))

    const poolSession = pool_session$.get()
    token$.transfer(token0, poolSession, to, amount0)
    token$.transfer(token1, poolSession, to, amount1)

    reserve$.set(bigints.sub(reserve0, amount0), bigints.sub(reserve1, amount1))

    liquidity$.setBalanceOf(caller, bigints.sub(balance, liquidity))
    liquidity$.set(bigints.sub(totalSupply, liquidity))

    return packs.create2(amount0, amount1)
  }
}

namespace swap$ {
  function computeAmountOut(
    amount_in: bigintref,
    reserve_in: bigintref,
    reserve_out: bigintref,
    fee_numerator: bigintref,
    fee_denominator: bigintref,
  ): bigintref {
    const amount_in_with_fee = bigints.mul(amount_in, fee_numerator)
    const numerator = bigints.mul(amount_in_with_fee, reserve_out)
    const denominator = bigints.add(
      bigints.mul(reserve_in, fee_denominator),
      amount_in_with_fee,
    )
    return bigints.div(numerator, denominator)
  }

  export function quoteExactIn(
    token_in: textref,
    amount_in: bigintref,
  ): packref {
    pool$.assertInitialized()

    const tokens = pool$.tokens()
    const token0 = packs.get<textref>(tokens, 0)
    const token1 = packs.get<textref>(tokens, 1)

    const reserves = reserve$.get()
    const reserve0 = packs.get<bigintref>(reserves, 0)
    const reserve1 = packs.get<bigintref>(reserves, 1)

    const fee_bps = pool$.feeBps()
    const fee_denominator = pool$.feeDenominator()
    const fee_numerator = bigints.sub(fee_denominator, fee_bps)

    let amount_out: bigintref
    let token_out: textref

    if (texts.equals(token_in, token0)) {
      token_out = token1
      amount_out = computeAmountOut(
        amount_in,
        reserve0,
        reserve1,
        fee_numerator,
        fee_denominator,
      )
    } else if (texts.equals(token_in, token1)) {
      token_out = token0
      amount_out = computeAmountOut(
        amount_in,
        reserve1,
        reserve0,
        fee_numerator,
        fee_denominator,
      )
    } else {
      return env.panic<packref>(texts.fromString("Invalid token_in"))
    }

    return packs.create2(token_out, amount_out)
  }

  /**
   * Swap an exact amount of input token for output token.
   * @param session Session for caller authentication
   * @param token_in Address of the input token
   * @param amount_in Exact amount of input token to swap
   * @param min_out Minimum amount of output token to receive (slippage protection)
   * @param to Recipient address for the output tokens
   * @returns Pack containing (token_out, amount_out)
   */
  export function swapExactIn(
    session: packref,
    token_in: textref,
    amount_in: bigintref,
    min_out: bigintref,
    to: textref,
  ): packref {
    pool$.assertInitialized()

    if (bigints.eq(amount_in, bigints.zero()))
      return env.panic<packref>(texts.fromString("Invalid amount_in"))

    const tokens = pool$.tokens()
    const token0 = packs.get<textref>(tokens, 0)
    const token1 = packs.get<textref>(tokens, 1)

    const reserves = reserve$.get()
    const reserve0 = packs.get<bigintref>(reserves, 0)
    const reserve1 = packs.get<bigintref>(reserves, 1)

    const fee_bps = pool$.feeBps()
    const fee_denominator = pool$.feeDenominator()
    const fee_numerator = bigints.sub(fee_denominator, fee_bps)

    let token_out: textref
    let amount_out: bigintref

    if (texts.equals(token_in, token0)) {
      token_out = token1
      if (
        bigints.eq(reserve0, bigints.zero()) ||
        bigints.eq(reserve1, bigints.zero())
      )
        return env.panic<packref>(texts.fromString("Empty reserves"))

      amount_out = computeAmountOut(
        amount_in,
        reserve0,
        reserve1,
        fee_numerator,
        fee_denominator,
      )

      if (bigints.lt(amount_out, min_out))
        return env.panic<packref>(texts.fromString("Insufficient output"))

      const poolSession = pool_session$.get()
      const poolAddress = session$.addressOf(poolSession)

      token$.transfer(token0, session, poolAddress, amount_in)

      token$.transfer(token1, poolSession, to, amount_out)

      reserve$.set(
        bigints.add(reserve0, amount_in),
        bigints.sub(reserve1, amount_out),
      )
    } else if (texts.equals(token_in, token1)) {
      token_out = token0
      if (
        bigints.eq(reserve0, bigints.zero()) ||
        bigints.eq(reserve1, bigints.zero())
      )
        return env.panic<packref>(texts.fromString("Empty reserves"))

      amount_out = computeAmountOut(
        amount_in,
        reserve1,
        reserve0,
        fee_numerator,
        fee_denominator,
      )

      if (bigints.lt(amount_out, min_out))
        return env.panic<packref>(texts.fromString("Insufficient output"))

      const poolSession = pool_session$.get()
      const poolAddress = session$.addressOf(poolSession)

      token$.transfer(token1, session, poolAddress, amount_in)
      token$.transfer(token0, poolSession, to, amount_out)

      reserve$.set(
        bigints.sub(reserve0, amount_out),
        bigints.add(reserve1, amount_in),
      )
    } else {
      return env.panic<packref>(texts.fromString("Invalid token_in"))
    }

    return packs.create2(token_out, amount_out)
  }
}

/**
 * Initialize a new XYK liquidity pool with two tokens and a fee.
 * Can only be called once. Tokens will be automatically sorted.
 *
 * @param creator Address of the pool creator (must match the module creator)
 * @param token_a Address of the first token
 * @param token_b Address of the second token (must be different from token_a)
 * @param fee_bps Trading fee in basis points (0-10000, where 30 = 0.3%)
 * @throws "Invalid module creator" if creator doesn't match
 * @throws "Already initialized" if pool is already initialized
 * @throws "Token A and Token B must be different" if tokens are the same
 * @throws "Invalid fee_bps" if fee is negative or > 10000
 */
export function init(
  creator: textref,
  token_a: textref,
  token_b: textref,
  fee_bps: bigintref,
): void {
  selfcheck$.assert(creator)

  pool$.init(token_a, token_b, fee_bps)
}

/**
 * Clone this pool module to create a new independent pool instance.
 * The cloned module will have the same code but requires separate initialization.
 *
 * @param creator Address that will be set as the creator of the cloned module
 * @returns Address/ID of the newly created pool module
 */
export function clone(creator: textref): textref {
  return modules.create(modules.load(modules.self()), packs.create1(creator))
}

/**
 * Get the two tokens configured for this pool.
 * Tokens are always returned in sorted order (token0, token1).
 *
 * @returns Pack containing [token0_address, token1_address]
 * @throws "Pool is not initialized" if pool hasn't been initialized yet
 */
export function tokens(): packref {
  const value = pool$.tokens()
  return packs.create4(
    DOMAIN_TAG("tokens_view"),
    VERSION(),
    packs.get<textref>(value, 0),
    packs.get<textref>(value, 1),
  )
}

/**
 * Get the trading fee for this pool in basis points.
 *
 * @returns Fee in basis points (e.g., 30 = 0.3% fee)
 * @throws "Pool is not initialized" if pool hasn't been initialized yet
 */
export function fee_bps(): bigintref {
  return pool$.feeBps()
}

/**
 * Get the current reserves of both tokens in the pool.
 * These values determine the exchange rate and available liquidity.
 *
 * @returns Pack containing [reserve0, reserve1] corresponding to [token0, token1]
 * @throws "Pool is not initialized" if pool hasn't been initialized yet
 */
export function reserves(): packref {
  const value = reserve$.get()
  return packs.create4(
    DOMAIN_TAG("reserves_view"),
    VERSION(),
    packs.get<bigintref>(value, 0),
    packs.get<bigintref>(value, 1),
  )
}

/**
 * Get the total supply of LP (liquidity provider) tokens.
 * LP tokens represent shares of ownership in the pool's liquidity.
 *
 * @returns Total amount of LP tokens in circulation
 * @throws "Pool is not initialized" if pool hasn't been initialized yet
 */
export function total_supply(): bigintref {
  return liquidity$.get()
}

/**
 * Get the LP token balance of a specific address.
 *
 * @param owner Address to check the balance for
 * @returns Amount of LP tokens owned by the address
 * @throws "Pool is not initialized" if pool hasn't been initialized yet
 */
export function balance_of(owner: textref): bigintref {
  return liquidity$.balanceOf(owner)
}

/**
 * Calculate the output amount for a swap without executing it.
 * Uses the constant product formula: `(x + Δx) * (y - Δy) = x * y`
 * Applies the pool's trading fee to the input amount.
 *
 * @param token_in Address of the token to swap in (must be token0 or token1)
 * @param amount_in Amount of input token to swap
 * @returns Pack containing [token_out_address, amount_out]
 * @throws "Pool is not initialized" if pool hasn't been initialized yet
 * @throws "Invalid token_in" if token_in is not one of the pool's tokens
 */
export function quote_swap_exact_in(
  token_in: textref,
  amount_in: bigintref,
): packref {
  const value = swap$.quoteExactIn(token_in, amount_in)
  return packs.create4(
    DOMAIN_TAG("quote_swap_exact_in_view"),
    VERSION(),
    packs.get<textref>(value, 0),
    packs.get<bigintref>(value, 1),
  )
}

/**
 * Add liquidity to the pool and receive LP tokens.
 * Tokens are transferred from the caller and LP tokens are minted to the recipient.
 * The actual amounts may differ from desired amounts to maintain the pool's ratio.
 *
 * @param session Authenticated session of the liquidity provider
 * @param amount0_desired Desired amount of token0 to add
 * @param amount1_desired Desired amount of token1 to add
 * @param amount0_min Minimum amount of token0 (slippage protection)
 * @param amount1_min Minimum amount of token1 (slippage protection)
 * @param lp_min Minimum LP tokens to receive (slippage protection)
 * @param to Address to receive the LP tokens
 * @returns Pack containing [amount0_added, amount1_added, liquidity_minted]
 * @throws "Pool is not initialized" if pool hasn't been initialized yet
 * @throws "Invalid amount0_desired" or "Invalid amount1_desired" if amounts are zero
 * @throws "Insufficient amount0" or "Insufficient amount1" if slippage is too high
 * @throws "Insufficient liquidity minted" if LP tokens < lp_min
 * @throws "Zero liquidity" if calculated liquidity is zero
 */
export function add_liquidity(
  session: packref,
  amount0_desired: bigintref,
  amount1_desired: bigintref,
  amount0_min: bigintref,
  amount1_min: bigintref,
  lp_min: bigintref,
  to: textref,
): packref {
  const value = liquidity$.add_liquidity(
    session,
    amount0_desired,
    amount1_desired,
    amount0_min,
    amount1_min,
    lp_min,
    to,
  )
  return packs.create5(
    DOMAIN_TAG("add_liquidity_view"),
    VERSION(),
    packs.get<bigintref>(value, 0),
    packs.get<bigintref>(value, 1),
    packs.get<bigintref>(value, 2),
  )
}

/**
 * Remove liquidity from the pool by burning LP tokens.
 * LP tokens are burned and both underlying tokens are returned proportionally.
 *
 * @param session Authenticated session of the liquidity provider
 * @param liquidity Amount of LP tokens to burn
 * @param amount0_min Minimum amount of token0 to receive (slippage protection)
 * @param amount1_min Minimum amount of token1 to receive (slippage protection)
 * @param to Address to receive the tokens
 * @returns Pack containing [amount0_received, amount1_received]
 * @throws "Pool is not initialized" if pool hasn't been initialized yet
 * @throws "Invalid liquidity" if liquidity amount is zero
 * @throws "No liquidity" if pool has no liquidity
 * @throws "Insufficient liquidity balance" if caller doesn't have enough LP tokens
 * @throws "Insufficient amount0" or "Insufficient amount1" if slippage is too high
 */
export function remove_liquidity(
  session: packref,
  liquidity: bigintref,
  amount0_min: bigintref,
  amount1_min: bigintref,
  to: textref,
): packref {
  const value = liquidity$.remove_liquidity(
    session,
    liquidity,
    amount0_min,
    amount1_min,
    to,
  )
  return packs.create4(
    DOMAIN_TAG("remove_liquidity_view"),
    VERSION(),
    packs.get<bigintref>(value, 0),
    packs.get<bigintref>(value, 1),
  )
}

/**
 * Swap an exact amount of input token for output token.
 * Uses the constant product AMM formula with trading fees applied.
 * Input tokens are transferred from caller, output tokens sent to recipient.
 *
 * @param session Authenticated session of the trader
 * @param token_in Address of the token to swap in (must be token0 or token1)
 * @param amount_in Exact amount of input token to swap
 * @param min_out Minimum amount of output token to receive (slippage protection)
 * @param to Address to receive the output tokens
 * @returns Pack containing [token_out_address, amount_out]
 * @throws "Pool is not initialized" if pool hasn't been initialized yet
 * @throws "Invalid amount_in" if amount is zero
 * @throws "Invalid token_in" if token_in is not one of the pool's tokens
 * @throws "Empty reserves" if pool has no liquidity
 * @throws "Insufficient output" if output amount < min_out (slippage too high)
 */
export function swap_exact_in(
  session: packref,
  token_in: textref,
  amount_in: bigintref,
  min_out: bigintref,
  to: textref,
): packref {
  const value = swap$.swapExactIn(session, token_in, amount_in, min_out, to)
  return packs.create4(
    DOMAIN_TAG("swap_exact_in_view"),
    VERSION(),
    packs.get<textref>(value, 0),
    packs.get<bigintref>(value, 1),
  )
}

/**
 * Verify a pool session capability.
 */
export function verify(session: packref): bool {
  return pool_session$.verify(session)
}
