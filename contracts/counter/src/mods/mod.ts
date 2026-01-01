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

namespace addresses {
  export function compute(session: packref): textref {
    return blobs.toBase16(sha256.digest(blobs.encode(session)))
  }

  export function verify(session: packref): textref {
    const module = packs.get<textref>(session, 0)

    if (
      !packs.get<bool>(
        modules.call(
          module,
          texts.fromString("verify"),
          packs.create1(session),
        ),
        0,
      )
    )
      throw new Error("Invalid session")

    return compute(session)
  }
}

function getStorageKey(prefix: string, address: textref): textref {
  const prefixText = texts.fromString(prefix)
  return texts.concat(prefixText, address)
}

function getCounter(address: textref): bigintref {
  const key = getStorageKey("counter:", address)
  const val = storage.get(key)

  if (!val) return bigints.zero()

  const text = packs.get<textref>(val, 0)
  return bigints.fromBase10(text)
}

function incrementCounter(address: textref, current: bigintref): bigintref {
  const key = getStorageKey("counter:", address)
  const next = bigints.inc(current)
  const text = bigints.toBase10(next)
  storage.set(key, text)
  return next
}

/**
 * Atomically increments the counter for the caller.
 *
 * @param session Session packref [ed25519_module_address, pubkey]
 * @returns Incremented counter value
 */
export function add(session: packref): bigintref {
  const caller = addresses.verify(session)
  const current = getCounter(caller)
  return incrementCounter(caller, current)
}
