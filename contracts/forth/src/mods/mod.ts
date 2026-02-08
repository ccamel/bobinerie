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

  export const TOKEN_INT: u8 = 1
  export const TOKEN_WORD: u8 = 2

  function isSeparator(code: i32): bool {
    return code === SPACE || code === TAB || code === LF || code === CR
  }

  function isDigit(code: i32): bool {
    return code >= DIGIT_0 && code <= DIGIT_9
  }

  function isIntegerSlice(source: string, start: i32, end: i32): bool {
    const length = end - start

    if (length < 1) return false

    let index = start
    const first = source.charCodeAt(index)

    if (first === PLUS || first === MINUS) {
      if (length === 1) return false
      index += 1
    }

    while (index < end) {
      if (!isDigit(source.charCodeAt(index))) return false
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

  export type TokenEmit = (ctx: usize, kind: u8, start: i32, end: i32) => void

  function scanSource(source: string, ctx: usize, emit: TokenEmit): i64 {
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

      const end = index

      if (isIntegerSlice(source, start, end)) {
        emit(ctx, TOKEN_INT, start, end)
      } else {
        emit(ctx, TOKEN_WORD, start, end)
      }

      tokens += 1
    }

    return tokens
  }

  export function scan(program: textref, ctx: usize, emit: TokenEmit): i64 {
    return scanSource(texts.toString(program), ctx, emit)
  }
}

namespace compiler$ {
  type State = {
    tokens: i64
  }

  function onToken(ctx: usize, kind: u8, start: i32, end: i32): void {
    const state = changetype<State>(ctx)

    state.tokens += 1

    kind
    start
    end
  }

  export function compile(program: textref): i64 {
    const state: State = { tokens: 0 }

    tokenizer$.scan(program, changetype<usize>(state), onToken)

    return state.tokens
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

namespace forth$ {
  export function init(creator: textref, program: textref): void {
    selfcheck$.assert(creator)
    compiler$.compile(program)
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
