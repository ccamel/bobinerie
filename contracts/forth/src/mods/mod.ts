import {
  bigints,
  blobref,
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

  export function scanSource(source: string, ctx: usize, emit: TokenEmit): i64 {
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

namespace dictionary$ {
  export enum Opcode {
    DROP = 1,
    DUP = 2,
    SWAP = 3,
    OVER = 4,
    ROT = 5,
    NROT = 6,
    TWODUP = 7,
    TWODROP = 8,

    ADD = 16,
    SUB = 17,
    MUL = 18,
    DIV = 19,
    MOD = 20,
    EQ = 21,
    LT = 22,
    ISZERO = 23,

    LIT_CONST = 32,

    JZ = 48,
    JMP = 49,
    CALL = 50,
    RET = 51,
    HALT = 52,
  }

  function toLowerAscii(code: i32): i32 {
    if (code >= 65 && code <= 90) return code + 32
    return code
  }

  export function tokenEquals(
    source: string,
    start: i32,
    end: i32,
    literal: string,
  ): bool {
    const length = end - start

    if (literal.length !== length) return false

    for (let i = 0; i < length; i++) {
      if (
        toLowerAscii(source.charCodeAt(start + i)) !==
        toLowerAscii(literal.charCodeAt(i))
      ) {
        return false
      }
    }

    return true
  }

  export function tryLookupSlice(source: string, start: i32, end: i32): Opcode {
    if (tokenEquals(source, start, end, "drop")) return Opcode.DROP
    if (tokenEquals(source, start, end, "dup")) return Opcode.DUP
    if (tokenEquals(source, start, end, "swap")) return Opcode.SWAP
    if (tokenEquals(source, start, end, "over")) return Opcode.OVER
    if (tokenEquals(source, start, end, "rot")) return Opcode.ROT
    if (tokenEquals(source, start, end, "-rot")) return Opcode.NROT
    if (tokenEquals(source, start, end, "2dup")) return Opcode.TWODUP
    if (tokenEquals(source, start, end, "2drop")) return Opcode.TWODROP

    if (tokenEquals(source, start, end, "+")) return Opcode.ADD
    if (tokenEquals(source, start, end, "-")) return Opcode.SUB
    if (tokenEquals(source, start, end, "*")) return Opcode.MUL
    if (tokenEquals(source, start, end, "/")) return Opcode.DIV
    if (tokenEquals(source, start, end, "mod")) return Opcode.MOD
    if (tokenEquals(source, start, end, "=")) return Opcode.EQ
    if (tokenEquals(source, start, end, "<")) return Opcode.LT
    if (tokenEquals(source, start, end, "0=")) return Opcode.ISZERO

    return 0 as Opcode
  }

  export function lookupSlice(source: string, start: i32, end: i32): Opcode {
    const op = tryLookupSlice(source, start, end)
    if (op === 0) throw new Error("Unknown word")
    return op
  }
}

namespace compiler$ {
  const ASCII_PLUS: i32 = 43
  const ASCII_MINUS: i32 = 45
  const ASCII_ZERO: i32 = 48
  const ASCII_COLON: i32 = 58
  const ASCII_SEMICOLON: i32 = 59

  class State {
    source: string
    constants: Array<string>
    constantIndexes: Map<string, i32>
    code: Array<u8>
    awaitingDefinitionName: bool
    inDefinition: bool
    mainSeen: i32
    mainAddress: i32
    wordAddresses: Map<string, i32>
    pendingCalls: Map<string, Array<i32>>

    constructor(source: string) {
      this.source = source
      this.constants = new Array<string>()
      this.constantIndexes = new Map<string, i32>()
      this.code = new Array<u8>()
      this.awaitingDefinitionName = false
      this.inDefinition = false
      this.mainSeen = 0
      this.mainAddress = 0
      this.wordAddresses = new Map<string, i32>()
      this.pendingCalls = new Map<string, Array<i32>>()
      // Emit mandatory prologue: CALL <main_addr>; HALT
      this.code.push(<u8>dictionary$.Opcode.CALL)
      pushU32LE(this.code, 0)
      this.code.push(<u8>dictionary$.Opcode.HALT)
    }
  }

  function pushU32LE(bytes: Array<u8>, value: u32): void {
    bytes.push(<u8>(value & 0xff))
    bytes.push(<u8>((value >> 8) & 0xff))
    bytes.push(<u8>((value >> 16) & 0xff))
    bytes.push(<u8>((value >> 24) & 0xff))
  }

  function setU32LE(bytes: Array<u8>, offset: i32, value: u32): void {
    bytes[offset] = <u8>(value & 0xff)
    bytes[offset + 1] = <u8>((value >> 8) & 0xff)
    bytes[offset + 2] = <u8>((value >> 16) & 0xff)
    bytes[offset + 3] = <u8>((value >> 24) & 0xff)
  }

  function bytesToBlob(bytes: Array<u8>): blobref {
    const view = new Uint8Array(bytes.length)

    for (let i = 0; i < bytes.length; i++) {
      view[i] = bytes[i]
    }

    return blobs.save(view.buffer)
  }

  function canonicalIntSlice(source: string, start: i32, end: i32): string {
    let index = start
    let negative = false

    const first = source.charCodeAt(index)

    if (first === ASCII_PLUS) {
      index += 1
    } else if (first === ASCII_MINUS) {
      negative = true
      index += 1
    }

    while (index < end - 1 && source.charCodeAt(index) === ASCII_ZERO) {
      index += 1
    }

    const digits = source.substring(index, end)

    if (digits === "0") return "0"

    return negative ? `-${digits}` : digits
  }

  function constantIndexOf(state: State, value: string): i32 {
    if (state.constantIndexes.has(value))
      return state.constantIndexes.get(value)

    const index = state.constants.length
    state.constants.push(value)
    state.constantIndexes.set(value, index)

    return index
  }

  function emitLiteralSlice(state: State, start: i32, end: i32): void {
    const canonical = canonicalIntSlice(state.source, start, end)

    const parsed = bigints.fromBase10(texts.fromString(canonical))
    const normalized = texts.toString(bigints.toBase10(parsed))

    const index = constantIndexOf(state, normalized)

    state.code.push(<u8>dictionary$.Opcode.LIT_CONST)
    pushU32LE(state.code, <u32>index)
  }

  function emitWordSlice(state: State, start: i32, end: i32): bool {
    const opcode = dictionary$.tryLookupSlice(state.source, start, end)
    if (opcode === 0) return false

    state.code.push(<u8>opcode)
    return true
  }

  function isSingleCharToken(
    source: string,
    start: i32,
    end: i32,
    code: i32,
  ): bool {
    return end - start === 1 && source.charCodeAt(start) === code
  }

  function sliceToLowerString(source: string, start: i32, end: i32): string {
    const length = end - start
    let out = ""

    for (let i = 0; i < length; i++) {
      const code = source.charCodeAt(start + i)
      const lower = code >= 65 && code <= 90 ? code + 32 : code
      out += String.fromCharCode(lower)
    }

    return out
  }

  function patchPendingCalls(state: State, name: string, addr: i32): void {
    if (!state.pendingCalls.has(name)) return

    const sites = state.pendingCalls.get(name)
    for (let i = 0; i < sites.length; i++) {
      setU32LE(state.code, sites[i], <u32>addr)
    }

    state.pendingCalls.delete(name)
  }

  function recordPendingCall(
    state: State,
    name: string,
    patchOffset: i32,
  ): void {
    if (!state.pendingCalls.has(name))
      state.pendingCalls.set(name, new Array<i32>())
    state.pendingCalls.get(name).push(patchOffset)
  }

  function emitCallByName(state: State, start: i32, end: i32): void {
    const name = sliceToLowerString(state.source, start, end)

    state.code.push(<u8>dictionary$.Opcode.CALL)
    const patchOffset = state.code.length
    pushU32LE(state.code, 0)

    if (state.wordAddresses.has(name)) {
      setU32LE(state.code, patchOffset, <u32>state.wordAddresses.get(name))
      return
    }

    recordPendingCall(state, name, patchOffset)
  }

  function onWordToken(state: State, start: i32, end: i32): void {
    if (isSingleCharToken(state.source, start, end, ASCII_COLON)) {
      if (state.awaitingDefinitionName || state.inDefinition)
        throw new Error("Unexpected :")

      state.awaitingDefinitionName = true
      return
    }

    if (state.awaitingDefinitionName) {
      if (
        isSingleCharToken(state.source, start, end, ASCII_COLON) ||
        isSingleCharToken(state.source, start, end, ASCII_SEMICOLON)
      )
        throw new Error("Invalid definition name")

      state.awaitingDefinitionName = false
      state.inDefinition = true

      const name = sliceToLowerString(state.source, start, end)
      if (state.wordAddresses.has(name)) throw new Error("Duplicate definition")

      const addr = state.code.length
      state.wordAddresses.set(name, addr)
      patchPendingCalls(state, name, addr)

      if (name === "main") {
        if (state.mainSeen > 0) throw new Error("Duplicate MAIN")

        state.mainSeen = 1
        state.mainAddress = addr
      }

      return
    }

    if (isSingleCharToken(state.source, start, end, ASCII_SEMICOLON)) {
      if (!state.inDefinition) throw new Error("Unexpected ;")

      state.code.push(<u8>dictionary$.Opcode.RET)
      state.inDefinition = false
      return
    }

    if (!state.inDefinition) throw new Error("Instruction outside definition")

    if (emitWordSlice(state, start, end)) return

    emitCallByName(state, start, end)
    return
  }

  function onToken(ctx: usize, kind: u8, start: i32, end: i32): void {
    const state = changetype<State>(ctx)

    if (kind === tokenizer$.TOKEN_WORD) {
      onWordToken(state, start, end)
      return
    }

    if (state.awaitingDefinitionName) throw new Error("Invalid definition name")
    if (!state.inDefinition) throw new Error("Instruction outside definition")

    if (kind === tokenizer$.TOKEN_INT) {
      emitLiteralSlice(state, start, end)
      return
    }

    throw new Error("Invalid token kind")
  }

  function finalize(state: State): void {
    if (state.awaitingDefinitionName) throw new Error("Missing definition name")
    if (state.inDefinition) throw new Error("Unclosed definition")
    if (state.mainSeen !== 1) throw new Error("Missing MAIN")
    if (state.pendingCalls.size > 0) throw new Error("Unknown word")

    setU32LE(state.code, 1, <u32>state.mainAddress)
  }

  function buildConstantPool(constants: Array<string>): Array<u8> {
    const bytes: u8[] = []

    for (let i = 0; i < constants.length; i++) {
      const utf8 = Uint8Array.wrap(String.UTF8.encode(constants[i]))

      pushU32LE(bytes, <u32>utf8.length)

      for (let j = 0; j < utf8.length; j++) {
        bytes.push(utf8[j])
      }
    }

    return bytes
  }

  function buildHeader(
    constCount: u32,
    constBytesLen: u32,
    codeBytesLen: u32,
  ): blobref {
    const header = new ArrayBuffer(20)
    const view = new DataView(header)

    view.setUint8(0, 0x46)
    view.setUint8(1, 0x54)
    view.setUint8(2, 0x48)
    view.setUint8(3, 0x31)

    view.setUint8(4, 1)
    view.setUint8(5, 0)
    view.setUint16(6, 0, true)

    view.setUint32(8, constCount, true)
    view.setUint32(12, constBytesLen, true)
    view.setUint32(16, codeBytesLen, true)

    return blobs.save(header)
  }

  export function compile(program: textref): blobref {
    const state = new State(texts.toString(program))

    tokenizer$.scanSource(state.source, changetype<usize>(state), onToken)
    finalize(state)

    const constBytes = buildConstantPool(state.constants)

    const headerBlob = buildHeader(
      <u32>state.constants.length,
      <u32>constBytes.length,
      <u32>state.code.length,
    )
    const constBlob = bytesToBlob(constBytes)
    const codeBlob = bytesToBlob(state.code)

    return blobs.concat(blobs.concat(headerBlob, constBlob), codeBlob)
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
 * and compiling the provided Forth program.
 *
 * @param creator Creator address.
 * @param program Forth source code.
 * @throws Error("Invalid module creator") if the deterministic self-check fails.
 * @throws Error("Unexpected )") if the source contains an unmatched closing parenthesis.
 * @throws Error("Unclosed comment") if a `( ... )` comment is not closed.
 * @throws Error("Unexpected :") if `:` appears while already parsing a definition.
 * @throws Error("Unexpected ;") if `;` appears outside a definition.
 * @throws Error("Invalid definition name") if `:` is not followed by a valid word.
 * @throws Error("Missing definition name") if source ends right after `:`.
 * @throws Error("Instruction outside definition") if code appears outside any `: ... ;`.
 * @throws Error("Unclosed definition") if a definition does not end with `;`.
 * @throws Error("Missing MAIN") if no `: MAIN ... ;` definition is present.
 * @throws Error("Duplicate MAIN") if `MAIN` is defined more than once.
 * @throws Error("Unknown word") if a non-integer token is not found in the dictionary.
 */
export function init(creator: textref, program: textref): void {
  forth$.init(creator, program)
}
