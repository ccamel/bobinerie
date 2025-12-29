import { console, packref, storage, textref, texts } from "@hazae41/stdbob"

export function sayMyName(name: textref): packref {
  const previous = storage.get(texts.fromString("name"))

  console.log(texts.fromString("Hello, " + texts.toString(name) + "!"))

  storage.set(texts.fromString("name"), name)

  return previous
}