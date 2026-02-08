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

export function say_my_name(name: textref): textref {
  const previous = name$.read()
  console.log(texts.fromString(`Hello, ${texts.toString(name)}!`))
  name$.write(name)
  return previous
}
