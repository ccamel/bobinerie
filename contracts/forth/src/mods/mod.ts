import { blobs, modules, packs, sha256, textref, texts } from "@hazae41/stdbob"

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

    if (!texts.equals(modules.self(), module))
      throw new Error("Invalid module creator")
  }
}

namespace forth$ {
  export function init(creator: textref): void {
    selfcheck$.assert(creator)
  }
}

/**
 * Clone this module (same code) and set `creator` as the new module creator.
 *
 * @param creator The creator address for the cloned module.
 * @returns The new module address/id.
 */
export function clone(creator: textref): textref {
  return modules.create(modules.load(modules.self()), packs.create1(creator))
}

/**
 * Initialize the forth module instance by checking creator-derived self address.
 *
 * @param creator Creator address.
 * @throws Error("Invalid module creator") if the deterministic self-check fails.
 */
export function init(creator: textref): void {
  forth$.init(creator)
}
