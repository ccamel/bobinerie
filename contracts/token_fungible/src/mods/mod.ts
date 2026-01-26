import {
  bigintref,
  bigints,
  blobs,
  modules,
  packref,
  packs,
  sha256,
  storage,
  textref,
  texts,
} from "@hazae41/stdbob"

namespace sessions {
  const verifyMethod = (): textref => texts.fromString("verify")

  export function addressOf(session: packref): textref {
    return blobs.toBase16(sha256.digest(blobs.encode(session)))
  }

  export function assert(session: packref): textref {
    const module = packs.get<textref>(session, 0)
    const verified = packs.get<bool>(
      modules.call(module, verifyMethod(), packs.create1(session)),
      0,
    )

    if (!verified) throw new Error("Invalid session")

    return addressOf(session)
  }
}

namespace owner {
  export function get(): textref {
    const found = storage.get(texts.fromString("owner"))

    if (!found)
      return texts.fromString("0000000000000000000000000000000000000000")

    return packs.get<textref>(found, 0)
  }

  export function set(address: textref): void {
    storage.set(texts.fromString("owner"), address)
  }
}

namespace balances {
  export function get(address: textref): bigintref {
    const found = storage.get(
      packs.create2(texts.fromString("balance"), address),
    )

    if (!found) return bigints.zero()

    return packs.get<bigintref>(found, 0)
  }

  export function set(address: textref, value: bigintref): void {
    storage.set(packs.create2(texts.fromString("balance"), address), value)
  }

  export function credit(address: textref, amount: bigintref): void {
    set(address, bigints.add(get(address), amount))
  }

  export function debit(address: textref, amount: bigintref): void {
    const current = get(address)

    if (bigints.lt(current, amount)) throw new Error("Insufficient balance")

    set(address, bigints.sub(current, amount))
  }
}

namespace allowances {
  export function get(owner: textref, spender: textref): bigintref {
    const found = storage.get(
      packs.create3(texts.fromString("allowance"), owner, spender),
    )

    if (!found) return bigints.zero()

    return packs.get<bigintref>(found, 0)
  }

  export function set(
    owner: textref,
    spender: textref,
    value: bigintref,
  ): void {
    storage.set(
      packs.create3(texts.fromString("allowance"), owner, spender),
      value,
    )
  }

  export function approve(
    owner: textref,
    spender: textref,
    amount: bigintref,
  ): void {
    const current = get(owner, spender)

    // Reset-to-zero rule (ERC-20 style safety)
    if (
      !bigints.eq(current, bigints.zero()) &&
      !bigints.eq(amount, bigints.zero())
    )
      throw new Error("Must reset allowance to 0 before changing")

    set(owner, spender, amount)
  }

  export function spend(
    owner: textref,
    spender: textref,
    amount: bigintref,
  ): void {
    const current = get(owner, spender)

    if (bigints.lt(current, amount)) throw new Error("Insufficient allowance")

    set(owner, spender, bigints.sub(current, amount))
  }
}

namespace supply {
  const key = (): textref => texts.fromString("total_supply")

  export function get(): bigintref {
    const found = storage.get(key())
    if (!found) return bigints.zero()
    return packs.get<bigintref>(found, 0)
  }

  function set(value: bigintref): void {
    storage.set(key(), value)
  }

  export function inc(delta: bigintref): void {
    set(bigints.add(get(), delta))
  }

  export function dec(delta: bigintref): void {
    const current = get()
    if (bigints.lt(current, delta)) throw new Error("Insufficient supply")
    set(bigints.sub(current, delta))
  }
}

/**
 * Clone this module (same code) and set `creator` as the new module creator.
 *
 * This returns the address/id of the newly created module.
 *
 * @param creator The address that will be stored as the owner when the cloned module is initialized.
 * @returns The new module address/id.
 */
export function clone(creator: textref): textref {
  return modules.create(modules.load(modules.self()), packs.create1(creator))
}

/**
 * Initialize the token instance.
 *
 * This function is intended to be called once, right after deployment.
 * It performs a deterministic self-check to ensure the module address matches
 * the code + creator tuple, then stores the owner.
 *
 * @param creator The address that becomes the token owner (allowed to mint).
 * @throws Error("Invalid") if the deterministic self-check fails.
 */
export function init(creator: textref): void {
  const module = blobs.toBase16(
    sha256.digest(
      blobs.encode(
        packs.create2(modules.load(modules.self()), packs.create1(creator)),
      ),
    ),
  )

  if (!texts.equals(modules.self(), module)) throw new Error("Invalid")

  owner.set(creator)
}

/**
 * Read the token balance of an address.
 *
 * @param target Address to query.
 * @returns Current balance (0 if absent).
 */
export function get_balance(target: textref): bigintref {
  return balances.get(target)
}

/**
 * Mint tokens to an address.
 *
 * Only the token owner can mint. The caller is derived from the provided session.
 * This increases both the recipient balance and the total supply.
 *
 * @param session A valid session whose verified identity is the caller.
 * @param target Recipient address.
 * @param amount Amount to mint.
 * @throws Error("Invalid session") if the session is not verified.
 * @throws Error("Unauthorized") if the caller is not the owner.
 */
export function mint(
  session: packref,
  target: textref,
  amount: bigintref,
): void {
  const caller = sessions.assert(session)

  if (!texts.equals(caller, owner.get())) throw new Error("Unauthorized")

  balances.credit(target, amount)
  supply.inc(amount)
}

/**
 * Read the total token supply.
 *
 * @returns Total supply (0 if absent).
 */
export function get_total_supply(): bigintref {
  return supply.get()
}

/**
 * Read the remaining allowance from an owner to a spender.
 *
 * @param owner Address that granted the allowance.
 * @param spender Address allowed to spend.
 * @returns Remaining allowance (0 if absent).
 */
export function get_allowance(owner: textref, spender: textref): bigintref {
  return allowances.get(owner, spender)
}

/**
 * Set the allowance for a spender.
 *
 * The caller (derived from the session) becomes the allowance owner.
 * This uses a reset-to-zero safety rule: changing a non-zero allowance to another
 * non-zero value is rejected. Set it to 0 first, then set the new value.
 *
 * @param session A valid session whose verified identity is the caller (owner).
 * @param spender Address allowed to spend.
 * @param amount New allowance amount.
 * @throws Error("Invalid session") if the session is not verified.
 * @throws Error("Must reset allowance to 0 before changing") if the safety rule is violated.
 */
export function approve(
  session: packref,
  spender: textref,
  amount: bigintref,
): void {
  const caller = sessions.assert(session)

  allowances.approve(caller, spender, amount)
}

/**
 * Transfer tokens on behalf of an owner, consuming allowance.
 *
 * The caller (derived from the session) is the spender.
 * This decreases the allowance (owner -> spender) and moves balance from owner to target.
 *
 * @param session A valid session whose verified identity is the spender.
 * @param owner Address whose funds are moved.
 * @param target Recipient address.
 * @param amount Amount to transfer.
 * @throws Error("Invalid session") if the session is not verified.
 * @throws Error("Insufficient allowance") if allowance is smaller than amount.
 * @throws Error("Insufficient balance") if owner's balance is smaller than amount.
 */
export function transfer_from(
  session: packref,
  owner: textref,
  target: textref,
  amount: bigintref,
): void {
  const spender = sessions.assert(session)

  allowances.spend(owner, spender, amount)
  balances.debit(owner, amount)
  balances.credit(target, amount)
}

/**
 * Burn tokens from the caller.
 *
 * The caller is derived from the provided session.
 * This decreases both the caller balance and the total supply.
 *
 * @param session A valid session whose verified identity is the caller.
 * @param amount Amount to burn.
 * @throws Error("Invalid session") if the session is not verified.
 * @throws Error("Insufficient balance") if balance is smaller than amount.
 */
export function burn(session: packref, amount: bigintref): void {
  const caller = sessions.assert(session)

  balances.debit(caller, amount)
  supply.dec(amount)
}

/**
 * Transfer tokens from the caller to a target.
 *
 * The caller is derived from the provided session.
 * This moves balance from caller to target.
 *
 * @param session A valid session whose verified identity is the caller.
 * @param target Recipient address.
 * @param amount Amount to transfer.
 * @throws Error("Invalid session") if the session is not verified.
 * @throws Error("Insufficient balance") if caller balance is smaller than amount.
 */
export function transfer(
  session: packref,
  target: textref,
  amount: bigintref,
): void {
  const caller = sessions.assert(session)

  balances.debit(caller, amount)
  balances.credit(target, amount)
}
