import { bigintref, bigints, packs, storage, texts } from "@hazae41/stdbob"

/**
 * Increment and return the counter value.
 *
 * @returns The new counter value after incrementing
 */
export function add(): bigintref {
  const key = texts.fromString("counter")

  const val = storage.get(key)

  if (!val) {
    const fresh = bigints.one()

    storage.set(key, fresh)

    return fresh
  }

  const stale = packs.get<bigintref>(val, 0)

  const fresh = bigints.inc(stale)

  storage.set(key, fresh)

  return fresh
}
