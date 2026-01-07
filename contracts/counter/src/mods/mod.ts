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

const verifyMethod = (): textref => texts.fromString("verify")
const counterPrefix = (): textref => texts.fromString("counter:")

namespace sessions {
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

namespace counters {
  function key(address: textref): textref {
    return texts.concat(counterPrefix(), address)
  }

  function read(address: textref): bigintref {
    const value = storage.get(key(address))
    if (!value) return bigints.zero()

    const text = changetype<textref>(value)
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
}

/**
 * Atomically increments the counter for the caller.
 *
 * @param session Session packref [ed25519_module_address, pubkey]
 * @returns Incremented counter value
 */
export function add(session: packref): bigintref {
  const caller = sessions.assert(session)
  return counters.increment(caller)
}
