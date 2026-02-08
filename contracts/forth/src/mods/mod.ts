import {
  bigints,
  blobs,
  modules,
  packs,
  sha256,
  textref,
  texts,
} from "@hazae41/stdbob"

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

namespace dictionary$ {
  export enum Opcode {
    DROP = 1,
    DUP = 2,
    SWAP = 3,
    OVER = 4,
    ADD = 5,
    SUB = 6,
    MUL = 7,
    DIV = 8,
  }

  export function lookup(word: string): Opcode {
    if (word === "drop") return Opcode.DROP
    if (word === "dup") return Opcode.DUP
    if (word === "swap") return Opcode.SWAP
    if (word === "over") return Opcode.OVER
    if (word === "+") return Opcode.ADD
    if (word === "-") return Opcode.SUB
    if (word === "*") return Opcode.MUL
    if (word === "/") return Opcode.DIV

    throw new Error("Unknown word")
  }
}

namespace tokenizer$ {
  const TAB: i32 = 9
  const LF: i32 = 10
  const CR: i32 = 13
  const SPACE: i32 = 32

  const LEFT_PAREN: i32 = 40
  const RIGHT_PAREN: i32 = 41
  const PLUS: i32 = 43
  const MINUS: i32 = 45
  const DIGIT_0: i32 = 48
  const DIGIT_9: i32 = 57
  const BACKSLASH: i32 = 92

  function isSeparator(code: i32): bool {
    return code === SPACE || code === TAB || code === LF || code === CR
  }

  function isDigit(code: i32): bool {
    return code >= DIGIT_0 && code <= DIGIT_9
  }

  function isIntegerToken(token: string): bool {
    const length = token.length

    if (length < 1) return false

    let index = 0
    const first = token.charCodeAt(0)

    if (first === PLUS || first === MINUS) {
      if (length === 1) return false
      index = 1
    }

    while (index < length) {
      if (!isDigit(token.charCodeAt(index))) return false
      index += 1
    }

    return true
  }

  function skipLineComment(source: string, index: i32): i32 {
    const length = source.length

    while (index < length) {
      const code = source.charCodeAt(index)

      if (code === LF || code === CR) break

      index += 1
    }

    return index
  }

  function skipParenComment(source: string, index: i32): i32 {
    const length = source.length

    while (index < length) {
      if (source.charCodeAt(index) === RIGHT_PAREN) return index + 1
      index += 1
    }

    throw new Error("Unclosed comment")
  }

  function skipIgnored(source: string, index: i32): i32 {
    const length = source.length

    while (index < length) {
      const code = source.charCodeAt(index)

      if (isSeparator(code)) {
        index += 1
        continue
      }

      if (code === BACKSLASH) {
        index = skipLineComment(source, index + 1)
        continue
      }

      if (code === LEFT_PAREN) {
        index = skipParenComment(source, index + 1)
        continue
      }

      break
    }

    return index
  }

  function consumeToken(token: string): void {
    if (isIntegerToken(token)) {
      bigints.fromBase10(texts.fromString(token))
      return
    }

    dictionary$.lookup(token.toLowerCase())
  }

  export function scan(program: textref): i64 {
    const source = texts.toString(program)
    const length = source.length

    let index: i32 = 0
    let tokens: i64 = 0

    while (index < length) {
      index = skipIgnored(source, index)
      if (index >= length) break

      if (source.charCodeAt(index) === RIGHT_PAREN)
        throw new Error("Unexpected )")

      const start = index

      while (index < length) {
        const code = source.charCodeAt(index)

        if (isSeparator(code)) break
        if (code === BACKSLASH || code === LEFT_PAREN) break
        if (code === RIGHT_PAREN) throw new Error("Unexpected )")

        index += 1
      }

      consumeToken(source.substring(start, index))
      tokens += 1
    }

    return tokens
  }
}

namespace forth$ {
  export function init(creator: textref, program: textref): void {
    selfcheck$.assert(creator)
    tokenizer$.scan(program)
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
 * Initialize the forth module instance by checking creator-derived self address
 * and validating/tokenizing the provided Forth program.
 *
 * @param creator Creator address.
 * @param program Forth source code.
 * @throws Error("Invalid module creator") if the deterministic self-check fails.
 * @throws Error("Unexpected )") if the source contains an unmatched closing parenthesis.
 * @throws Error("Unclosed comment") if a `( ... )` comment is not closed.
 * @throws Error("Unknown word") if a non-integer token is not found in the dictionary.
 */
export function init(creator: textref, program: textref): void {
  forth$.init(creator, program)
}
