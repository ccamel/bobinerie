import {
  bigintref,
  bigints,
  blobref,
  blobs,
  env,
  modules,
  packref,
  packs,
  refs,
  sha256,
  storage,
  textref,
  texts,
} from "@hazae41/stdbob"

const DOMAIN = "bobine.forth"

function panic<T>(message: string): T {
  return env.panic<T>(texts.fromString(message))
}

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
      panic<void>("Invalid module creator")
  }
}

namespace hash$ {
  export function source(program: textref): textref {
    return blobs.toBase16(sha256.digest(blobs.encode(program)))
  }

  export function blob(blob: blobref): textref {
    return blobs.toBase16(sha256.digest(blobs.encode(blob)))
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

    return panic<i32>("Unclosed comment")
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
        return panic<i64>("Unexpected )")

      const start = index

      while (index < length) {
        const code = source.charCodeAt(index)

        if (isSeparator(code)) break
        if (code === BACKSLASH || code === LEFT_PAREN) break
        if (code === RIGHT_PAREN) return panic<i64>("Unexpected )")

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
    if (op === 0) return panic<Opcode>("Unknown word")
    return op
  }
}

namespace compiler$ {
  const ASCII_PLUS: i32 = 43
  const ASCII_MINUS: i32 = 45
  const ASCII_ZERO: i32 = 48
  const ASCII_COLON: i32 = 58
  const ASCII_SEMICOLON: i32 = 59

  const SOURCE_INDEX: i32 = 0
  const CONSTANTS_INDEX: i32 = 1
  const CONSTANT_INDEXES_INDEX: i32 = 2
  const CODE_INDEX: i32 = 3
  const AWAITING_DEFINITION_NAME_INDEX: i32 = 4
  const IN_DEFINITION_INDEX: i32 = 5
  const MAIN_SEEN_INDEX: i32 = 6
  const MAIN_ADDRESS_INDEX: i32 = 7
  const WORD_ADDRESSES_INDEX: i32 = 8
  const PENDING_CALLS_INDEX: i32 = 9

  function sourceOf(state: Array<usize>): string {
    return changetype<string>(state[SOURCE_INDEX])
  }

  function constantsOf(state: Array<usize>): Array<string> {
    return changetype<Array<string>>(state[CONSTANTS_INDEX])
  }

  function constantIndexesOf(state: Array<usize>): Map<string, i32> {
    return changetype<Map<string, i32>>(state[CONSTANT_INDEXES_INDEX])
  }

  function codeOf(state: Array<usize>): Array<u8> {
    return changetype<Array<u8>>(state[CODE_INDEX])
  }

  function awaitingDefinitionNameOf(state: Array<usize>): bool {
    return state[AWAITING_DEFINITION_NAME_INDEX] !== 0
  }

  function setAwaitingDefinitionName(state: Array<usize>, value: bool): void {
    state[AWAITING_DEFINITION_NAME_INDEX] = value ? 1 : 0
  }

  function inDefinitionOf(state: Array<usize>): bool {
    return state[IN_DEFINITION_INDEX] !== 0
  }

  function setInDefinition(state: Array<usize>, value: bool): void {
    state[IN_DEFINITION_INDEX] = value ? 1 : 0
  }

  function mainSeenOf(state: Array<usize>): i32 {
    return <i32>state[MAIN_SEEN_INDEX]
  }

  function setMainSeen(state: Array<usize>, value: i32): void {
    state[MAIN_SEEN_INDEX] = <usize>value
  }

  function mainAddressOf(state: Array<usize>): i32 {
    return <i32>state[MAIN_ADDRESS_INDEX]
  }

  function setMainAddress(state: Array<usize>, value: i32): void {
    state[MAIN_ADDRESS_INDEX] = <usize>value
  }

  function wordAddressesOf(state: Array<usize>): Map<string, i32> {
    return changetype<Map<string, i32>>(state[WORD_ADDRESSES_INDEX])
  }

  function pendingCallsOf(state: Array<usize>): Map<string, Array<i32>> {
    return changetype<Map<string, Array<i32>>>(state[PENDING_CALLS_INDEX])
  }

  function createState(source: string): Array<usize> {
    const code = [] as u8[]
    const state = new Array<usize>(10)

    code.push(<u8>dictionary$.Opcode.CALL)
    pushU32LE(code, 0)
    code.push(<u8>dictionary$.Opcode.HALT)

    state[SOURCE_INDEX] = changetype<usize>(source)
    state[CONSTANTS_INDEX] = changetype<usize>([] as string[])
    state[CONSTANT_INDEXES_INDEX] = changetype<usize>(new Map<string, i32>())
    state[CODE_INDEX] = changetype<usize>(code)
    state[AWAITING_DEFINITION_NAME_INDEX] = 0
    state[IN_DEFINITION_INDEX] = 0
    state[MAIN_SEEN_INDEX] = 0
    state[MAIN_ADDRESS_INDEX] = 0
    state[WORD_ADDRESSES_INDEX] = changetype<usize>(new Map<string, i32>())
    state[PENDING_CALLS_INDEX] = changetype<usize>(
      new Map<string, Array<i32>>(),
    )

    return state
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

  function constantIndexOf(state: Array<usize>, value: string): i32 {
    const constantIndexes = constantIndexesOf(state)

    if (constantIndexes.has(value)) return constantIndexes.get(value)

    const constants = constantsOf(state)
    const index = constants.length

    constants.push(value)
    constantIndexes.set(value, index)

    return index
  }

  function emitLiteralSlice(state: Array<usize>, start: i32, end: i32): void {
    const canonical = canonicalIntSlice(sourceOf(state), start, end)

    const parsed = bigints.fromBase10(texts.fromString(canonical))
    const normalized = texts.toString(bigints.toBase10(parsed))

    const index = constantIndexOf(state, normalized)

    const code = codeOf(state)

    code.push(<u8>dictionary$.Opcode.LIT_CONST)
    pushU32LE(code, <u32>index)
  }

  function emitWordSlice(state: Array<usize>, start: i32, end: i32): bool {
    const opcode = dictionary$.tryLookupSlice(sourceOf(state), start, end)
    if (opcode === 0) return false

    codeOf(state).push(<u8>opcode)
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

  function patchPendingCalls(
    state: Array<usize>,
    name: string,
    addr: i32,
  ): void {
    const pendingCalls = pendingCallsOf(state)

    if (!pendingCalls.has(name)) return

    const sites = pendingCalls.get(name)
    const code = codeOf(state)

    for (let i = 0; i < sites.length; i++) {
      setU32LE(code, sites[i], <u32>addr)
    }

    pendingCalls.delete(name)
  }

  function recordPendingCall(
    state: Array<usize>,
    name: string,
    patchOffset: i32,
  ): void {
    const pendingCalls = pendingCallsOf(state)

    if (!pendingCalls.has(name)) pendingCalls.set(name, [] as i32[])
    pendingCalls.get(name).push(patchOffset)
  }

  function emitCallByName(state: Array<usize>, start: i32, end: i32): void {
    const name = sliceToLowerString(sourceOf(state), start, end)
    const code = codeOf(state)
    const wordAddresses = wordAddressesOf(state)

    code.push(<u8>dictionary$.Opcode.CALL)
    const patchOffset = code.length
    pushU32LE(code, 0)

    if (wordAddresses.has(name)) {
      setU32LE(code, patchOffset, <u32>wordAddresses.get(name))
      return
    }

    recordPendingCall(state, name, patchOffset)
  }

  function onWordToken(state: Array<usize>, start: i32, end: i32): void {
    const source = sourceOf(state)

    if (isSingleCharToken(source, start, end, ASCII_COLON)) {
      if (awaitingDefinitionNameOf(state) || inDefinitionOf(state))
        panic<void>("Unexpected :")

      setAwaitingDefinitionName(state, true)
      return
    }

    if (awaitingDefinitionNameOf(state)) {
      if (
        isSingleCharToken(source, start, end, ASCII_COLON) ||
        isSingleCharToken(source, start, end, ASCII_SEMICOLON)
      )
        panic<void>("Invalid definition name")

      setAwaitingDefinitionName(state, false)
      setInDefinition(state, true)

      const name = sliceToLowerString(source, start, end)
      const wordAddresses = wordAddressesOf(state)

      if (name === "main" && mainSeenOf(state) > 0)
        panic<void>("Duplicate MAIN")
      if (wordAddresses.has(name)) panic<void>("Duplicate definition")

      const addr = codeOf(state).length

      wordAddresses.set(name, addr)
      patchPendingCalls(state, name, addr)

      if (name === "main") {
        setMainSeen(state, 1)
        setMainAddress(state, addr)
      }

      return
    }

    if (isSingleCharToken(source, start, end, ASCII_SEMICOLON)) {
      if (!inDefinitionOf(state)) panic<void>("Unexpected ;")

      codeOf(state).push(<u8>dictionary$.Opcode.RET)
      setInDefinition(state, false)
      return
    }

    if (!inDefinitionOf(state)) panic<void>("Instruction outside definition")

    if (emitWordSlice(state, start, end)) return

    emitCallByName(state, start, end)
    return
  }

  function onToken(ctx: usize, kind: u8, start: i32, end: i32): void {
    const state = changetype<Array<usize>>(ctx)

    if (kind === tokenizer$.TOKEN_WORD) {
      onWordToken(state, start, end)
      return
    }

    if (awaitingDefinitionNameOf(state)) panic<void>("Invalid definition name")
    if (!inDefinitionOf(state)) panic<void>("Instruction outside definition")

    if (kind === tokenizer$.TOKEN_INT) {
      emitLiteralSlice(state, start, end)
      return
    }

    panic<void>("Invalid token kind")
  }

  function finalize(state: Array<usize>): void {
    if (awaitingDefinitionNameOf(state)) panic<void>("Missing definition name")
    if (inDefinitionOf(state)) panic<void>("Unclosed definition")
    if (mainSeenOf(state) !== 1) panic<void>("Missing MAIN")
    if (pendingCallsOf(state).size > 0) panic<void>("Unknown word")

    setU32LE(codeOf(state), 1, <u32>mainAddressOf(state))
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
    const state = createState(texts.toString(program))

    tokenizer$.scanSource(sourceOf(state), changetype<usize>(state), onToken)
    finalize(state)

    const constants = constantsOf(state)
    const code = codeOf(state)
    const constBytes = buildConstantPool(constants)

    const headerBlob = buildHeader(
      <u32>constants.length,
      <u32>constBytes.length,
      <u32>code.length,
    )
    const constBlob = bytesToBlob(constBytes)
    const codeBlob = bytesToBlob(code)

    return blobs.concat(blobs.concat(headerBlob, constBlob), codeBlob)
  }
}

namespace format$ {
  const HEADER_SIZE: i32 = 20

  function readU32LE(bytes: Uint8Array, offset: i32): u32 {
    return (
      <u32>bytes[offset] |
      ((<u32>bytes[offset + 1]) << 8) |
      ((<u32>bytes[offset + 2]) << 16) |
      ((<u32>bytes[offset + 3]) << 24)
    )
  }

  function utf8SliceToText(
    bytes: Uint8Array,
    start: i32,
    length: i32,
  ): textref {
    const copy = new Uint8Array(length)

    for (let i = 0; i < length; i++) {
      copy[i] = bytes[start + i]
    }

    return texts.fromUtf8(blobs.save(copy.buffer))
  }

  export function load(program: blobref): Uint8Array {
    return Uint8Array.wrap(blobs.load(program))
  }

  export function constPoolOffset(): i32 {
    return HEADER_SIZE
  }

  export function constCount(bytes: Uint8Array): i32 {
    return <i32>readU32LE(bytes, 8)
  }

  export function constPoolLen(bytes: Uint8Array): i32 {
    return <i32>readU32LE(bytes, 12)
  }

  export function codeOffset(bytes: Uint8Array): i32 {
    return HEADER_SIZE + constPoolLen(bytes)
  }

  export function codeLen(bytes: Uint8Array): i32 {
    return <i32>readU32LE(bytes, 16)
  }

  export function constOffsets(bytes: Uint8Array): Array<i32> {
    const count = constCount(bytes)
    const offsets = new Array<i32>(count)
    let cursor = HEADER_SIZE

    for (let i = 0; i < count; i++) {
      offsets[i] = cursor
      const length = <i32>readU32LE(bytes, cursor)
      cursor += 4 + length
    }

    return offsets
  }

  export function readConstAt(
    bytes: Uint8Array,
    offsets: Array<i32>,
    index: i32,
  ): textref {
    const cursor = offsets[index]
    const length = <i32>readU32LE(bytes, cursor)

    return utf8SliceToText(bytes, cursor + 4, length)
  }

  export function readOpcodeAt(bytes: Uint8Array, offset: i32, ip: i32): u8 {
    return bytes[offset + ip]
  }

  export function readU32At(bytes: Uint8Array, offset: i32, ip: i32): u32 {
    return readU32LE(bytes, offset + ip)
  }
}

namespace vm$ {
  function toBigint(value: i32): bigintref {
    return changetype<bigintref>(refs.denumerize(value))
  }

  function toRef(value: bigintref): i32 {
    return refs.numerize(value)
  }

  function assertStackSize(stack: Array<i32>, size: i32): void {
    if (stack.length < size) panic<void>("Stack underflow")
  }

  function pop(stack: Array<i32>): i32 {
    assertStackSize(stack, 1)
    return stack.pop()
  }

  function assertJumpAddress(address: i32, codeLen: i32): void {
    if (address < 0 || address >= codeLen) panic<void>("Invalid jump address")
  }

  function readInputStack(inputStack: packref): Array<i32> {
    if (!inputStack) return [] as i32[]

    const length = packs.length(inputStack)
    const values = new Array<i32>(length)

    for (let i = 0; i < length; i++) {
      values[i] = toRef(packs.get<bigintref>(inputStack, i))
    }

    return values
  }

  function chunk(values: Array<i32>, start: i32, count: i32): packref {
    switch (count) {
      case 1:
        return packs.create1(toBigint(values[start]))
      case 2:
        return packs.create2(
          toBigint(values[start]),
          toBigint(values[start + 1]),
        )
      case 3:
        return packs.create3(
          toBigint(values[start]),
          toBigint(values[start + 1]),
          toBigint(values[start + 2]),
        )
      case 4:
        return packs.create4(
          toBigint(values[start]),
          toBigint(values[start + 1]),
          toBigint(values[start + 2]),
          toBigint(values[start + 3]),
        )
      case 5:
        return packs.create5(
          toBigint(values[start]),
          toBigint(values[start + 1]),
          toBigint(values[start + 2]),
          toBigint(values[start + 3]),
          toBigint(values[start + 4]),
        )
      case 6:
        return packs.create6(
          toBigint(values[start]),
          toBigint(values[start + 1]),
          toBigint(values[start + 2]),
          toBigint(values[start + 3]),
          toBigint(values[start + 4]),
          toBigint(values[start + 5]),
        )
      case 7:
        return packs.create7(
          toBigint(values[start]),
          toBigint(values[start + 1]),
          toBigint(values[start + 2]),
          toBigint(values[start + 3]),
          toBigint(values[start + 4]),
          toBigint(values[start + 5]),
          toBigint(values[start + 6]),
        )
      case 8:
        return packs.create8(
          toBigint(values[start]),
          toBigint(values[start + 1]),
          toBigint(values[start + 2]),
          toBigint(values[start + 3]),
          toBigint(values[start + 4]),
          toBigint(values[start + 5]),
          toBigint(values[start + 6]),
          toBigint(values[start + 7]),
        )
      case 9:
        return packs.create9(
          toBigint(values[start]),
          toBigint(values[start + 1]),
          toBigint(values[start + 2]),
          toBigint(values[start + 3]),
          toBigint(values[start + 4]),
          toBigint(values[start + 5]),
          toBigint(values[start + 6]),
          toBigint(values[start + 7]),
          toBigint(values[start + 8]),
        )
      default:
        return panic<packref>("Invalid output stack")
    }
  }

  function writeOutputStack(values: Array<i32>): packref {
    if (values.length < 1) return null

    return buildPack(values, 0, values.length)
  }

  function buildPack(values: Array<i32>, start: i32, end: i32): packref {
    const len = end - start

    if (len <= 0) return null
    if (len <= 9) return chunk(values, start, len)

    const mid = start + (len >> 1)

    const left = buildPack(values, start, mid)
    const right = buildPack(values, mid, end)

    if (!left) return right
    if (!right) return left

    return packs.concat(left, right)
  }

  function readConstant(
    bytes: Uint8Array,
    offsets: Array<i32>,
    cache: Array<i32>,
    loaded: Array<bool>,
    index: i32,
  ): i32 {
    if (index < 0 || index >= offsets.length)
      return panic<i32>("Invalid constant index")

    if (!loaded[index]) {
      cache[index] = toRef(
        bigints.fromBase10(format$.readConstAt(bytes, offsets, index)),
      )
      loaded[index] = true
    }

    return cache[index]
  }

  export function run(program: blobref, inputStack: packref): packref {
    const bytes = format$.load(program)
    const codeOffset = format$.codeOffset(bytes)
    const codeLen = format$.codeLen(bytes)
    const constOffsets = format$.constOffsets(bytes)
    const constCount = constOffsets.length

    const constants = new Array<i32>(constCount)
    const loaded = new Array<bool>(constCount)
    const stack = readInputStack(inputStack)
    const calls: i32[] = []

    const zeroBigint = bigints.zero()
    const zero = toRef(zeroBigint)
    const one = toRef(bigints.one())

    let ip: i32 = 0

    while (true) {
      if (ip < 0 || ip >= codeLen)
        return panic<packref>("Invalid instruction pointer")

      const opcode = format$.readOpcodeAt(bytes, codeOffset, ip)

      switch (<i32>opcode) {
        case dictionary$.Opcode.DROP: {
          pop(stack)
          ip += 1
          break
        }
        case dictionary$.Opcode.DUP: {
          assertStackSize(stack, 1)
          stack.push(stack[stack.length - 1])
          ip += 1
          break
        }
        case dictionary$.Opcode.SWAP: {
          assertStackSize(stack, 2)
          const b = pop(stack)
          const a = pop(stack)
          stack.push(b)
          stack.push(a)
          ip += 1
          break
        }
        case dictionary$.Opcode.OVER: {
          assertStackSize(stack, 2)
          stack.push(stack[stack.length - 2])
          ip += 1
          break
        }
        case dictionary$.Opcode.ROT: {
          assertStackSize(stack, 3)
          const c = pop(stack)
          const b = pop(stack)
          const a = pop(stack)
          stack.push(b)
          stack.push(c)
          stack.push(a)
          ip += 1
          break
        }
        case dictionary$.Opcode.NROT: {
          assertStackSize(stack, 3)
          const c = pop(stack)
          const b = pop(stack)
          const a = pop(stack)
          stack.push(c)
          stack.push(a)
          stack.push(b)
          ip += 1
          break
        }
        case dictionary$.Opcode.TWODUP: {
          assertStackSize(stack, 2)
          const a = stack[stack.length - 2]
          const b = stack[stack.length - 1]
          stack.push(a)
          stack.push(b)
          ip += 1
          break
        }
        case dictionary$.Opcode.TWODROP: {
          assertStackSize(stack, 2)
          pop(stack)
          pop(stack)
          ip += 1
          break
        }
        case dictionary$.Opcode.ADD: {
          assertStackSize(stack, 2)
          const b = toBigint(pop(stack))
          const a = toBigint(pop(stack))
          stack.push(toRef(bigints.add(a, b)))
          ip += 1
          break
        }
        case dictionary$.Opcode.SUB: {
          assertStackSize(stack, 2)
          const b = toBigint(pop(stack))
          const a = toBigint(pop(stack))
          stack.push(toRef(bigints.sub(a, b)))
          ip += 1
          break
        }
        case dictionary$.Opcode.MUL: {
          assertStackSize(stack, 2)
          const b = toBigint(pop(stack))
          const a = toBigint(pop(stack))
          stack.push(toRef(bigints.mul(a, b)))
          ip += 1
          break
        }
        case dictionary$.Opcode.DIV: {
          assertStackSize(stack, 2)
          const b = toBigint(pop(stack))
          const a = toBigint(pop(stack))
          stack.push(toRef(bigints.div(a, b)))
          ip += 1
          break
        }
        case dictionary$.Opcode.MOD: {
          assertStackSize(stack, 2)
          const b = toBigint(pop(stack))
          const a = toBigint(pop(stack))
          stack.push(toRef(bigints.mod(a, b)))
          ip += 1
          break
        }
        case dictionary$.Opcode.EQ: {
          assertStackSize(stack, 2)
          const b = toBigint(pop(stack))
          const a = toBigint(pop(stack))
          stack.push(bigints.eq(a, b) ? one : zero)
          ip += 1
          break
        }
        case dictionary$.Opcode.LT: {
          assertStackSize(stack, 2)
          const b = toBigint(pop(stack))
          const a = toBigint(pop(stack))
          stack.push(bigints.lt(a, b) ? one : zero)
          ip += 1
          break
        }
        case dictionary$.Opcode.ISZERO: {
          assertStackSize(stack, 1)
          const x = toBigint(pop(stack))
          stack.push(bigints.eq(x, zeroBigint) ? one : zero)
          ip += 1
          break
        }
        case dictionary$.Opcode.LIT_CONST: {
          const index = <i32>format$.readU32At(bytes, codeOffset, ip + 1)
          stack.push(
            readConstant(bytes, constOffsets, constants, loaded, index),
          )
          ip += 5
          break
        }
        case dictionary$.Opcode.JZ: {
          const address = <i32>format$.readU32At(bytes, codeOffset, ip + 1)
          assertJumpAddress(address, codeLen)
          const flag = toBigint(pop(stack))
          ip = bigints.eq(flag, zeroBigint) ? address : ip + 5
          break
        }
        case dictionary$.Opcode.JMP: {
          const address = <i32>format$.readU32At(bytes, codeOffset, ip + 1)
          assertJumpAddress(address, codeLen)
          ip = address
          break
        }
        case dictionary$.Opcode.CALL: {
          const address = <i32>format$.readU32At(bytes, codeOffset, ip + 1)
          assertJumpAddress(address, codeLen)
          calls.push(ip + 5)
          ip = address
          break
        }
        case dictionary$.Opcode.RET: {
          if (calls.length < 1) return panic<packref>("Empty return stack")
          ip = calls.pop()
          break
        }
        case dictionary$.Opcode.HALT:
          return writeOutputStack(stack)
        default:
          return panic<packref>("Invalid opcode")
      }
    }
  }
}

namespace program$ {
  const PROGRAM_BLOB_KEY = (): textref =>
    texts.fromString(`${DOMAIN}/state/program_blob`)
  const SOURCE_HASH_KEY = (): textref =>
    texts.fromString(`${DOMAIN}/state/source_hash`)
  const BLOB_HASH_KEY = (): textref =>
    texts.fromString(`${DOMAIN}/state/blob_hash`)

  export function writeBlob(blob: blobref): void {
    storage.set(PROGRAM_BLOB_KEY(), blob)
  }

  export function writeSourceHash(hash: textref): void {
    storage.set(SOURCE_HASH_KEY(), hash)
  }

  export function writeBlobHash(hash: textref): void {
    storage.set(BLOB_HASH_KEY(), hash)
  }

  export function readSourceHash(): textref {
    const found = storage.get(SOURCE_HASH_KEY())
    if (!found) return null
    return packs.get<textref>(found, 0)
  }

  export function readBlobHash(): textref {
    const found = storage.get(BLOB_HASH_KEY())
    if (!found) return null
    return packs.get<textref>(found, 0)
  }

  export function assertInitialized(): void {
    if (!storage.get(PROGRAM_BLOB_KEY())) panic<void>("Program not initialized")
  }

  export function readBlob(): blobref {
    const found = storage.get(PROGRAM_BLOB_KEY())
    if (!found) return panic<blobref>("Program not initialized")
    return packs.get<blobref>(found, 0)
  }
}

namespace forth$ {
  export function init(creator: textref, program: textref): void {
    selfcheck$.assert(creator)

    const blob = compiler$.compile(program)
    const sourceHash = hash$.source(program)
    const blobHash = hash$.blob(blob)

    program$.writeBlob(blob)
    program$.writeSourceHash(sourceHash)
    program$.writeBlobHash(blobHash)
  }

  export function sourceHash(): textref {
    return program$.readSourceHash()
  }

  export function blobHash(): textref {
    return program$.readBlobHash()
  }

  export function run(inputStack: packref): packref {
    program$.assertInitialized()
    const program = program$.readBlob()
    return vm$.run(program, inputStack)
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

/**
 * Get the hash of the source program exactly as provided to `init`.
 *
 * @returns Hex-encoded source hash, or `null` if not initialized.
 */
export function source_hash(): textref {
  return forth$.sourceHash()
}

/**
 * Get the hash of the canonical compiled blob.
 *
 * @returns Hex-encoded blob hash, or `null` if not initialized.
 */
export function blob_hash(): textref {
  return forth$.blobHash()
}

/**
 * Execute the stored compiled program with an input stack.
 *
 * @param input_stack Input stack values as pack of BigInt references.
 * @returns Output stack values as pack of BigInt references.
 * @throws Error("Program not initialized") if no compiled program is stored.
 */
export function run(input_stack: packref): packref {
  return forth$.run(input_stack)
}
