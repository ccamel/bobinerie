import {
  console,
  type packref,
  storage,
  type textref,
  texts,
} from "@hazae41/stdbob"

/**
 * Say your name and the contract will remember it.
 *
 * @param name Your name as a text string
 * @returns The previously stored name, or `null` if this is the first call
 */
export function sayMyName(name: textref): packref {
  const previous = storage.get(texts.fromString("name"))

  console.log(texts.fromString(`Hello, ${texts.toString(name)}!`))

  storage.set(texts.fromString("name"), name)

  return previous
}
