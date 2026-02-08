import { console, packs, storage, textref, texts } from "@hazae41/stdbob"

const DOMAIN = "bobine.say-my-name"
const EMPTY_TEXT = (): textref => texts.fromString("")

namespace name$ {
  const NAME_KEY = (): textref => texts.fromString(`${DOMAIN}/state/name`)

  export function read(): textref {
    const found = storage.get(NAME_KEY())
    if (!found) return EMPTY_TEXT()
    return packs.get<textref>(found, 0)
  }

  export function write(name: textref): void {
    storage.set(NAME_KEY(), name)
  }
}

namespace greeting$ {
  export function say(name: textref): textref {
    const previous = name$.read()
    console.log(texts.fromString(`Hello, ${texts.toString(name)}!`))
    name$.write(name)
    return previous
  }
}

/**
 * Say your name and the contract will remember it.
 *
 * @param name Your name as a text string
 * @returns The previously stored name, or `null` if this is the first call
 */
export function say_my_name(name: textref): textref {
  return greeting$.say(name)
}
