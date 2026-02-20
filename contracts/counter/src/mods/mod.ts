import {
  bigintref,
  bigints,
  blobs,
  env,
  modules,
  packref,
  packs,
  sha256,
  storage,
  textref,
  texts,
} from "@hazae41/stdbob"

const DOMAIN = "bobine.counter"

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

namespace counter$ {
  const KEY_PREFIX = (): textref => texts.fromString(`${DOMAIN}/state/counter/`)

  function key(address: textref): textref {
    return texts.concat(KEY_PREFIX(), address)
  }

  export function read(address: textref): bigintref {
    const value = storage.get(key(address))
    if (!value) return bigints.zero()

    const text = packs.get<textref>(value, 0)
    return bigints.fromBase10(text)
  }

  function write(address: textref, value: bigintref): void {
    storage.set(key(address), bigints.toBase10(value))
  }

  export function increment(address: textref): bigintref {
    const next = bigints.inc(read(address))
    write(address, next)
    return next
  }

  export function reset(address: textref): bigintref {
    const zero = bigints.zero()
    write(address, zero)
    return zero
  }
}

/**
 * Atomically increments the counter for the caller.
 *
 * @param session Session packref [ed25519_module_address, pubkey]
 * @returns Incremented counter value
 */
export function add(session: packref): bigintref {
  const caller = session$.assert(session)
  return counter$.increment(caller)
}

/**
 * Read the caller counter value.
 *
 * @param session Session packref [ed25519_module_address, pubkey]
 * @returns Counter value
 */
export function value(session: packref): bigintref {
  const caller = session$.assert(session)
  return counter$.read(caller)
}

/**
 * Reset the caller counter to zero.
 *
 * @param session Session packref [ed25519_module_address, pubkey]
 * @returns Reset counter value
 */
export function reset(session: packref): bigintref {
  const caller = session$.assert(session)
  return counter$.reset(caller)
}
