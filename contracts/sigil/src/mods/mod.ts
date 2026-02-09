import {
  bigintref,
  bigints,
  blobref,
  blobs,
  env,
  modules,
  packref,
  packs,
  sha256,
  storage,
  textref,
  texts,
} from "@hazae41/stdbob"

const DOMAIN = "bobine.sigil"
const XMLNS_SIGIL = "https://bobine.tech#sigil"
const CPES_VERSION_U32: u32 = 1

const ZERO_TEXT = (): textref => texts.fromString("0")
const ONE_TEXT = (): textref => texts.fromString("1")
const EMPTY_TEXT = (): textref => texts.fromString("")
const VERSION = (): bigintref => bigints.inc(bigints.one())
const DOMAIN_TAG = (suffix: string): textref =>
  texts.fromString(`${DOMAIN}/${suffix}`)
const ZERO_SEPARATOR = (): blobref => {
  const bytes = new Uint8Array(1)
  bytes[0] = 0
  return blobs.save(bytes.buffer)
}
const VERSION_BYTES = (): blobref => {
  const buffer = new ArrayBuffer(4)
  const view = new DataView(buffer)
  view.setUint32(0, CPES_VERSION_U32, false)
  return blobs.save(buffer)
}

namespace session$ {
  const VERIFY_METHOD = (): textref => texts.fromString("verify")

  export function addressOf(session: packref): textref {
    return blobs.toBase16(sha256.digest(blobs.encode(session)))
  }

  export function assert(session: packref): textref {
    const module = packs.get<textref>(session, 0)
    const verified = packs.get<bool>(
      modules.call(module, VERIFY_METHOD(), packs.create1(session)),
      0,
    )

    if (!verified)
      return env.panic<textref>(texts.fromString("Invalid session"))

    return addressOf(session)
  }
}

function canonicalHash(typeName: string, payload: blobref): blobref {
  const domainBytes = texts.toUtf8(texts.fromString(DOMAIN))
  const typeBytes = texts.toUtf8(texts.fromString(typeName))
  const part0 = blobs.concat(domainBytes, ZERO_SEPARATOR())
  const part1 = blobs.concat(part0, typeBytes)
  const part2 = blobs.concat(part1, ZERO_SEPARATOR())
  const part3 = blobs.concat(part2, VERSION_BYTES())
  const part4 = blobs.concat(part3, ZERO_SEPARATOR())
  const frame = blobs.concat(part4, payload)
  return sha256.digest(frame)
}

namespace store$ {
  export function readText(key: textref): textref {
    const value = storage.get(key)
    if (!value) return null
    return changetype<textref>(value)
  }

  export function writeText(key: textref, value: textref): void {
    storage.set(key, value)
  }

  export function readBigint(key: textref): bigintref {
    const text = readText(key)
    if (!text) return bigints.zero()

    const s = texts.toString(text)
    if (s.length === 0) return bigints.zero()

    return bigints.fromBase10(text)
  }

  export function writeBigint(key: textref, value: bigintref): void {
    storage.set(key, bigints.toBase10(value))
  }

  export function readBool(key: textref): bool {
    const text = readText(key)
    if (!text) return false
    return texts.toString(text) === "1"
  }

  export function writeBool(key: textref, value: bool): void {
    storage.set(key, value ? ONE_TEXT() : ZERO_TEXT())
  }
}

namespace nonce$ {
  const key = (): textref => texts.fromString("nonce")

  export function read(): bigintref {
    return store$.readBigint(key())
  }

  export function write(value: bigintref): void {
    store$.writeBigint(key(), value)
  }

  export function next(): bigintref {
    const cur = read()
    write(bigints.inc(cur))
    return cur
  }
}

namespace burn$ {
  const prefix = (): textref => texts.fromString("burns:")

  function key(address: textref): textref {
    return texts.concat(prefix(), address)
  }

  export function read(address: textref): bigintref {
    return store$.readBigint(key(address))
  }

  function write(address: textref, value: bigintref): void {
    store$.writeBigint(key(address), value)
  }

  export function increment(address: textref): bigintref {
    const next = bigints.inc(read(address))
    write(address, next)
    return next
  }

  export function reset(address: textref): void {
    write(address, bigints.zero())
  }
}

namespace seed$ {
  const prefix = (): textref => texts.fromString("seed:")

  function key(address: textref): textref {
    return texts.concat(prefix(), address)
  }

  export function read(address: textref): textref {
    return store$.readText(key(address))
  }

  export function write(address: textref, value: textref): void {
    store$.writeText(key(address), value)
  }

  export function clear(address: textref): void {
    write(address, EMPTY_TEXT())
  }
}

namespace tag$ {
  const prefix = (): textref => texts.fromString("tag:")

  function key(address: textref): textref {
    return texts.concat(prefix(), address)
  }

  export function read(address: textref): textref {
    return store$.readText(key(address))
  }

  export function write(address: textref, value: textref): void {
    store$.writeText(key(address), value)
  }

  export function clear(address: textref): void {
    write(address, EMPTY_TEXT())
  }
}

namespace bless_count$ {
  const prefix = (): textref => texts.fromString("bless_count:")

  function key(address: textref): textref {
    return texts.concat(prefix(), address)
  }

  export function read(address: textref): bigintref {
    return store$.readBigint(key(address))
  }

  function write(address: textref, value: bigintref): void {
    store$.writeBigint(key(address), value)
  }

  export function increment(address: textref): bigintref {
    const next = bigints.inc(read(address))
    write(address, next)
    return next
  }

  export function reset(address: textref): void {
    write(address, bigints.zero())
  }
}

namespace bless_mix$ {
  const prefix = (): textref => texts.fromString("bless_mix:")

  function key(address: textref): textref {
    return texts.concat(prefix(), address)
  }

  export function read(address: textref): textref {
    return store$.readText(key(address))
  }

  export function write(address: textref, value: textref): void {
    store$.writeText(key(address), value)
  }

  export function clear(address: textref): void {
    write(address, EMPTY_TEXT())
  }
}

namespace bless_flag$ {
  const prefix = (): textref => texts.fromString("blessed:")

  function key(address: textref): textref {
    return texts.concat(prefix(), address)
  }

  export function read(address: textref): bool {
    return store$.readBool(key(address))
  }

  export function write(address: textref, value: bool): void {
    store$.writeBool(key(address), value)
  }

  export function clear(address: textref): void {
    write(address, false)
  }
}

namespace blessing$ {
  function hexNibble(code: i32): i32 {
    if (code >= 48 && code <= 57) return code - 48
    if (code >= 97 && code <= 102) return 10 + (code - 97)
    if (code >= 65 && code <= 70) return 10 + (code - 65)
    return 0
  }

  function byteAt(hex: string, i: i32): i32 {
    const a = hexNibble(hex.charCodeAt(i * 2))
    const b = hexNibble(hex.charCodeAt(i * 2 + 1))
    return (a << 4) | b
  }

  export function difficulty(seed32hex: string): i32 {
    return 4 + (byteAt(seed32hex, 0) % 3)
  }

  export function hit(digestHex: string, k: i32): bool {
    const first = byteAt(digestHex, 0)
    const threshold = 1 << (8 - k)
    return first < threshold
  }

  export function bless(target: textref): textref {
    const seed = seed$.read(target)
    if (!seed) return env.panic<textref>(texts.fromString("Sigil not minted"))
    const seedText = texts.toString(seed)
    if (seedText.length === 0)
      return env.panic<textref>(texts.fromString("Sigil not minted"))

    const already = bless_flag$.read(target)
    if (already) return texts.fromString("blessed")

    const next = bless_count$.increment(target)
    const nextRef = bigints.toBase10(next)

    const mix = bless_mix$.read(target)
    const mixRef = mix ? mix : EMPTY_TEXT()

    const payload = blobs.encode(packs.create3(seed, nextRef, mixRef))
    const digest = canonicalHash("bless_mix", payload)
    const digestHexRef = blobs.toBase16(digest)
    bless_mix$.write(target, digestHexRef)

    const digestHex = texts.toString(digestHexRef)
    const k = difficulty(seedText)
    const hitRoll = hit(digestHex, k)

    if (hitRoll) {
      bless_flag$.write(target, true)
      return texts.fromString("blessed")
    }

    return texts.fromString("ok")
  }

  export function vibes(target: textref): packref {
    const count = bless_count$.read(target)
    const countText = bigints.toBase10(count)

    const blessed = bless_flag$.read(target)
    const blessedText = blessed ? ONE_TEXT() : ZERO_TEXT()

    const seed = seed$.read(target)
    let k: i32 = 0

    if (seed) {
      const seedText = texts.toString(seed)
      if (seedText.length > 0) k = difficulty(seedText)
    }

    const kText = texts.fromString(k.toString())

    return packs.create5(
      DOMAIN_TAG("vibes_view"),
      VERSION(),
      countText,
      blessedText,
      kText,
    )
  }
}

namespace render$ {
  function hexNibble(code: i32): i32 {
    if (code >= 48 && code <= 57) return code - 48
    if (code >= 97 && code <= 102) return 10 + (code - 97)
    if (code >= 65 && code <= 70) return 10 + (code - 65)
    return 0
  }

  function byteAt(hex: string, i: i32): i32 {
    const a = hexNibble(hex.charCodeAt(i * 2))
    const b = hexNibble(hex.charCodeAt(i * 2 + 1))
    return (a << 4) | b
  }

  function esc(s: string): string {
    let o = ""
    for (let i = 0; i < s.length; i++) {
      const c = s.charCodeAt(i)
      if (c === 38) o += "&amp;"
      else if (c === 60) o += "&lt;"
      else if (c === 62) o += "&gt;"
      else if (c === 34) o += "&quot;"
      else if (c === 39) o += "&apos;"
      else o += s.charAt(i)
    }
    return o
  }

  const PA_BG1: string[] = [
    "#0f172a", // eth-ish night
    "#111827", // slate
    "#0b1020", // void
    "#1f0a3a", // solana purple
    "#082f49", // blue
    "#2a0b2e", // degen purple
    "#1b0f0a", // btc dark
    "#052e2b", // green
  ]

  const PA_BG2: string[] = [
    "#2563eb", // eth blue
    "#06b6d4", // cyan
    "#a855f7", // purple
    "#ec4899", // pink
    "#22c55e", // green
    "#f59e0b", // orange
    "#f97316", // btc orange
    "#60a5fa", // light blue
  ]

  const PA_SKIN: string[] = [
    "#f2c9a0",
    "#e8b389",
    "#d9a075",
    "#c98a5e",
    "#b9794f",
    "#f0d5b8",
    "#e2bfa0",
    "#d1a47f",
  ]

  const PA_HAIR: string[] = [
    "#111827",
    "#1f2937",
    "#3f2d20",
    "#5b3a29",
    "#2d1b12",
    "#0f172a",
    "#2a2a2a",
    "#3b2f2f",
  ]

  const PA_CLOTH: string[] = [
    "#111827",
    "#0f172a",
    "#1f2937",
    "#1e293b",
    "#0b1020",
    "#2a0b2e",
    "#3b2f2f",
    "#052e2b",
  ]

  const BG: string[] = [
    `<rect x="0" y="0" width="64" height="64" rx="12" fill="url(#sigil_bg_grad)"/>`,
    `<rect x="0" y="0" width="64" height="64" rx="12" fill="url(#sigil_bg_grad)"/><path d="M0 14 H64 M0 30 H64 M0 46 H64" stroke="#fff" stroke-width="2" opacity="0.07"/>`,
    `<rect x="0" y="0" width="64" height="64" rx="12" fill="url(#sigil_bg_grad)"/><path d="M-10 66 L66 -10" stroke="#fff" stroke-width="10" opacity="0.05"/>`,
    `<rect x="0" y="0" width="64" height="64" rx="12" fill="url(#sigil_bg_grad)"/><circle cx="50" cy="18" r="10" fill="#fff" opacity="0.06"/>`,
    `<rect x="0" y="0" width="64" height="64" rx="12" fill="url(#sigil_bg_grad)"/><path d="M0 52 Q32 36 64 52 V64 H0 Z" fill="#000" opacity="0.10"/>`,
  ]

  const HEAD: string[] = [
    `<circle cx="32" cy="34" r="18" fill="$S"/>`,
    `<path d="M32 16 C44 16 52 26 52 36 C52 50 42 56 32 56 C22 56 12 50 12 36 C12 26 20 16 32 16 Z" fill="$S"/>` +
      `<path d="M18 42 Q32 52 46 42" fill="#000" opacity="0.08"/>`,
    `<ellipse cx="32" cy="32" rx="18" ry="22" fill="$S"/>`,
    `<rect x="14" y="16" width="36" height="40" rx="10" fill="$S"/>` +
      `<path d="M20 28 L24 24 L28 28" fill="none" stroke="#000" opacity="0.08" stroke-width="3" stroke-linecap="round"/>`,
    `<path d="M18 56 V32 C18 22 25 16 32 16 C39 16 46 22 46 32 V56" fill="$S"/>` +
      `<path d="M18 56 Q22 52 26 56 Q30 52 34 56 Q38 52 42 56 Q44 54 46 56" fill="$S"/>`,
    `<ellipse cx="32" cy="36" rx="20" ry="18" fill="$S"/>` +
      `<path d="M16 38 Q32 28 48 38" fill="none" stroke="#000" opacity="0.06" stroke-width="6" stroke-linecap="round"/>`,
  ]

  const BODY: string[] = [
    `<path d="M10 64 V46 Q32 30 54 46 V64 Z" fill="$C"/>` +
      `<path d="M18 46 Q32 36 46 46" fill="none" stroke="#fff" opacity="0.10" stroke-width="3" stroke-linecap="round"/>` +
      `<path d="M26 46 V64" stroke="#000" opacity="0.10" stroke-width="3"/>` +
      `<path d="M38 46 V64" stroke="#000" opacity="0.10" stroke-width="3"/>`,
    `<path d="M12 64 V44 Q32 34 52 44 V64 Z" fill="$C"/>` +
      `<path d="M32 44 L26 64" stroke="#000" opacity="0.12" stroke-width="3"/>` +
      `<path d="M32 44 L38 64" stroke="#000" opacity="0.12" stroke-width="3"/>` +
      `<path d="M28 46 Q32 50 36 46" fill="#fff" opacity="0.10"/>`,
    `<path d="M12 64 V48 Q32 40 52 48 V64 Z" fill="$C"/>` +
      `<path d="M22 48 Q32 44 42 48" fill="none" stroke="#000" opacity="0.10" stroke-width="3" stroke-linecap="round"/>`,
    ``,
  ]

  const EYES: string[] = [
    `<circle cx="25" cy="32" r="3" fill="#111"/><circle cx="39" cy="32" r="3" fill="#111"/>`,
    `<path d="M21 31 H29" stroke="#111" stroke-width="3" stroke-linecap="round"/>` +
      `<path d="M35 31 H43" stroke="#111" stroke-width="3" stroke-linecap="round"/>`,
    `<circle cx="25" cy="32" r="3" fill="#111"/><circle cx="39" cy="32" r="3" fill="#111"/>` +
      `<path d="M24 35 Q23 40 25 44" fill="none" stroke="#60a5fa" stroke-width="2.5" stroke-linecap="round" opacity="0.8"/>`,
    `<circle cx="25" cy="32" r="8" fill="none" stroke="#111" stroke-width="2"/>` +
      `<circle cx="39" cy="32" r="8" fill="none" stroke="#111" stroke-width="2"/>` +
      `<path d="M33 32 H31" stroke="#111" stroke-width="2"/>`,
    `<circle cx="25" cy="32" r="3" fill="#111"/><circle cx="39" cy="32" r="3" fill="#111"/>` +
      `<path d="M25 32 L0 22" stroke="#ef4444" stroke-width="3" stroke-linecap="round" opacity="0.55" filter="url(#sigil_laser_glow)"/>` +
      `<path d="M39 32 L64 22" stroke="#ef4444" stroke-width="3" stroke-linecap="round" opacity="0.55" filter="url(#sigil_laser_glow)"/>` +
      `<path d="M25 33 L0 34" stroke="#fb7185" stroke-width="1.5" stroke-linecap="round" opacity="0.55"/>` +
      `<path d="M39 33 L64 34" stroke="#fb7185" stroke-width="1.5" stroke-linecap="round" opacity="0.55"/>`,
    `<path d="M22 30 L28 36" stroke="#111" stroke-width="3" stroke-linecap="round"/>` +
      `<path d="M28 30 L22 36" stroke="#111" stroke-width="3" stroke-linecap="round"/>` +
      `<path d="M36 30 L42 36" stroke="#111" stroke-width="3" stroke-linecap="round"/>` +
      `<path d="M42 30 L36 36" stroke="#111" stroke-width="3" stroke-linecap="round"/>`,
  ]

  const BROWS: string[] = [
    ``,
    `<path d="M20 27 Q25 24 30 27" fill="none" stroke="#111" stroke-width="2" stroke-linecap="round" opacity="0.35"/>` +
      `<path d="M34 27 Q39 24 44 27" fill="none" stroke="#111" stroke-width="2" stroke-linecap="round" opacity="0.35"/>`,
    `<path d="M20 27 Q25 22 30 27" fill="none" stroke="#111" stroke-width="2.5" stroke-linecap="round" opacity="0.40"/>` +
      `<path d="M34 27 Q39 22 44 27" fill="none" stroke="#111" stroke-width="2.5" stroke-linecap="round" opacity="0.40"/>`,
    `<path d="M20 26 Q25 29 30 26" fill="none" stroke="#111" stroke-width="2" stroke-linecap="round" opacity="0.35"/>` +
      `<path d="M34 26 Q39 29 44 26" fill="none" stroke="#111" stroke-width="2" stroke-linecap="round" opacity="0.35"/>`,
  ]

  const MOUTH: string[] = [
    `<path d="M26 43 Q32 47 38 43" fill="none" stroke="#111" stroke-width="2.5" stroke-linecap="round"/>`,
    `<path d="M26 44 Q32 41 38 44" fill="none" stroke="#111" stroke-width="2.5" stroke-linecap="round"/>`,
    `<path d="M25 44 H39" stroke="#111" stroke-width="2.5" stroke-linecap="round"/>`,
    `<path d="M26 44 H38" stroke="#111" stroke-width="2.5" stroke-linecap="round"/>` +
      `<path d="M38 44 H46" stroke="#e5e7eb" stroke-width="3" stroke-linecap="round"/>` +
      `<path d="M47 43 Q50 41 49 38" fill="none" stroke="#9ca3af" stroke-width="2" opacity="0.55" stroke-linecap="round"/>`,
    `<path d="M26 44 Q32 48 38 44" fill="none" stroke="#111" stroke-width="2.5" stroke-linecap="round"/>` +
      `<path d="M40 44 Q45 46 46 42" fill="none" stroke="#111" opacity="0.65" stroke-width="3" stroke-linecap="round"/>`,
  ]

  const HAT: string[] = [
    ``,
    `<path d="M16 28 Q32 16 48 28 Q44 18 32 18 Q20 18 16 28Z" fill="$H"/>` +
      `<path d="M22 26 Q32 22 42 26" fill="none" stroke="#000" opacity="0.10" stroke-width="4" stroke-linecap="round"/>`,
    `<path d="M16 30 Q32 14 48 30 Q48 22 32 22 Q16 22 16 30Z" fill="$H"/>`,
    `<path d="M18 22 L24 14 L32 22 L40 14 L46 22" fill="none" stroke="#f59e0b" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>` +
      `<circle cx="24" cy="14" r="2" fill="#fef08a" opacity="0.9"/>` +
      `<circle cx="40" cy="14" r="2" fill="#fef08a" opacity="0.9"/>`,
    `<rect x="22" y="10" width="20" height="14" rx="2" fill="$H"/>` +
      `<path d="M18 24 H46" stroke="$H" stroke-width="6" stroke-linecap="round"/>`,
    `<path d="M20 26 Q24 14 32 18 Q40 14 44 26" fill="none" stroke="#fb7185" stroke-width="4" opacity="0.55" stroke-linecap="round"/>`,
  ]

  const FX: string[] = [
    ``,
    `<path d="M12 18 L14 22 L18 24 L14 26 L12 30 L10 26 L6 24 L10 22 Z" fill="#fff" opacity="0.12"/>` +
      `<path d="M52 40 L54 44 L58 46 L54 48 L52 52 L50 48 L46 46 L50 44 Z" fill="#fff" opacity="0.10"/>`,
    `<circle cx="14" cy="50" r="5" fill="#f59e0b" opacity="0.22"/>` +
      `<circle cx="52" cy="18" r="4" fill="#f59e0b" opacity="0.18"/>`,
    `<circle cx="16" cy="20" r="2" fill="#111" opacity="0.14"/>` +
      `<circle cx="20" cy="18" r="1.5" fill="#111" opacity="0.12"/>` +
      `<circle cx="48" cy="44" r="2" fill="#111" opacity="0.14"/>`,
  ]

  export function svg(
    seed32hex: string,
    tag: string,
    burnsText: string,
    blessCountText: string,
    blessed: bool,
  ): string {
    const b0 = byteAt(seed32hex, 0)
    const b1 = byteAt(seed32hex, 1)
    const b2 = byteAt(seed32hex, 2)
    const b3 = byteAt(seed32hex, 3)
    const b4 = byteAt(seed32hex, 4)
    const b5 = byteAt(seed32hex, 5)
    const b6 = byteAt(seed32hex, 6)
    const b7 = byteAt(seed32hex, 7)
    const b14 = byteAt(seed32hex, 14)
    const b15 = byteAt(seed32hex, 15)

    const pal = b6 % PA_BG1.length
    const bg = b0 % BG.length
    const arche = b1 % HEAD.length
    const body = b2 % BODY.length
    const eyes = b3 % EYES.length
    const mouth = b4 % MOUTH.length
    const hat = b5 % HAT.length
    const fx = b7 % FX.length
    const brow = (b6 >> 1) & 3

    const anomaly = b15 === 0
    const anomalyKind = b14 % 3

    const BG1 = PA_BG1[pal]
    const BG2 = PA_BG2[pal]
    const S = PA_SKIN[b7 & 7]
    const H = PA_HAIR[(b7 >> 3) & 7]
    const C = PA_CLOTH[(pal + (b2 & 3)) % PA_CLOTH.length]

    const bgSvg = BG[bg]
    const bodySvg = BODY[body].replace("$C", C)
    const headSvg = HEAD[arche].replace("$S", S)
    const browSvg = BROWS[brow]
    const eyesSvg = EYES[eyes]
    const mouthSvg = MOUTH[mouth]
    const hatSvg = HAT[hat].replace("$H", H)
    const fxSvg = FX[fx]

    const faceFx =
      `<path d="M20 26 Q32 18 44 26" fill="none" stroke="#fff" opacity="0.08" stroke-width="4" stroke-linecap="round"/>` +
      `<path d="M20 50 Q32 56 44 50" fill="none" stroke="#000" opacity="0.07" stroke-width="6" stroke-linecap="round"/>` +
      `<circle cx="22" cy="42" r="5" fill="#fff" opacity="0.030"/>` +
      `<circle cx="42" cy="42" r="5" fill="#fff" opacity="0.022"/>`

    const baseDefs =
      `<defs>` +
      `<linearGradient id="sigil_bg_grad" x1="0" y1="0" x2="1" y2="1">` +
      `<stop offset="0%" stop-color="${BG1}"/>` +
      `<stop offset="100%" stop-color="${BG2}"/>` +
      `</linearGradient>` +
      `<filter id="sigil_soft_shadow" x="-20%" y="-20%" width="140%" height="140%">` +
      `<feDropShadow dx="0" dy="1.2" stdDeviation="1.1" flood-color="#000" flood-opacity="0.28"/>` +
      `</filter>` +
      `<radialGradient id="sigil_vignette" cx="50%" cy="45%" r="70%">` +
      `<stop offset="0%" stop-color="#000" stop-opacity="0"/>` +
      `<stop offset="75%" stop-color="#000" stop-opacity="0"/>` +
      `<stop offset="100%" stop-color="#000" stop-opacity="0.22"/>` +
      `</radialGradient>` +
      `<clipPath id="sigil_clip">` +
      `<rect x="0" y="0" width="64" height="64" rx="12"/>` +
      `</clipPath>` +
      `<filter id="sigil_frame_shadow" x="-20%" y="-20%" width="140%" height="140%">` +
      `<feDropShadow dx="0" dy="1" stdDeviation="1.2" flood-color="#000" flood-opacity="0.22"/>` +
      `</filter>` +
      `<filter id="sigil_laser_glow" x="-40%" y="-40%" width="180%" height="180%">` +
      `<feGaussianBlur stdDeviation="0.7"/>` +
      `</filter>` +
      `<filter id="sigil_tint_r">` +
      `<feColorMatrix type="matrix" values="1 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 1 0"/>` +
      `</filter>` +
      `<filter id="sigil_tint_c">` +
      `<feColorMatrix type="matrix" values="0 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 1 0"/>` +
      `</filter>` +
      `</defs>`

    const bgLayer =
      `<g id="sigil-bg">` +
      bgSvg +
      `<rect x="0" y="0" width="64" height="64" rx="12" fill="url(#sigil_vignette)"/>` +
      `</g>`

    const avatarCore =
      `<g id="sigil-body">` +
      bodySvg +
      `</g>` +
      `<g id="sigil-head">` +
      headSvg +
      faceFx +
      `</g>` +
      `<g id="sigil-brows">` +
      browSvg +
      `</g>` +
      `<g id="sigil-eyes">` +
      eyesSvg +
      `</g>` +
      `<g id="sigil-mouth">` +
      mouthSvg +
      `</g>` +
      `<g id="sigil-hat">` +
      hatSvg +
      `</g>` +
      `<g id="sigil-fx">` +
      fxSvg +
      `</g>`

    const avatarLayer =
      `<g id="sigil-avatar" filter="url(#sigil_soft_shadow)">` +
      avatarCore +
      `</g>`

    const anomalyOverlay = anomaly
      ? `<g id="sigil-anomaly">` +
        `<g opacity="0.55" transform="translate(-0.8,0)" filter="url(#sigil_tint_r)">` +
        avatarLayer +
        `</g>` +
        `<g opacity="0.55" transform="translate(0.8,0)" filter="url(#sigil_tint_c)">` +
        avatarLayer +
        `</g>` +
        `<g opacity="1">` +
        avatarLayer +
        `</g>` +
        (anomalyKind === 0
          ? `<path d="M0 12 H64 M0 20 H64 M0 28 H64 M0 36 H64 M0 44 H64 M0 52 H64" stroke="#fff" stroke-width="1" opacity="0.06"/>`
          : anomalyKind === 1
            ? `<path d="M0 10 H64 M0 18 H64 M0 26 H64 M0 34 H64 M0 42 H64 M0 50 H64" stroke="#000" stroke-width="1" opacity="0.08"/>`
            : `<path d="M-8 64 L64 -8" stroke="#fff" stroke-width="8" opacity="0.05"/>`) +
        `</g>`
      : ""

    const normalOverlay = anomaly ? "" : avatarLayer

    const frameLayer =
      `<g id="sigil-frame" filter="url(#sigil_frame_shadow)">` +
      `<rect x="1.5" y="1.5" width="61" height="61" rx="12" fill="none" stroke="#fff" stroke-width="3" opacity="0.10"/>` +
      `<rect x="3" y="3" width="58" height="58" rx="11" fill="none" stroke="#000" stroke-width="2" opacity="0.10"/>` +
      `</g>`

    const desc = `<desc>${esc(tag)}</desc>`

    const metadata =
      `<metadata>` +
      `<sigil:data xmlns:sigil="${XMLNS_SIGIL}">` +
      `<sigil:seed>${seed32hex}</sigil:seed>` +
      `<sigil:burns>${burnsText}</sigil:burns>` +
      `<sigil:bless_count>${blessCountText}</sigil:bless_count>` +
      `<sigil:traits bg="${bg}" arche="${arche}" body="${body}" brow="${brow}" eyes="${eyes}" mouth="${mouth}" hat="${hat}" fx="${fx}" pal="${pal}" anomaly="${anomaly ? 1 : 0}" anomaly_kind="${anomalyKind}"/>` +
      `</sigil:data>` +
      `</metadata>`

    const blessedDefs = blessed
      ? `<defs>` +
        `<linearGradient id="sigil_bless_beam" x1="0" y1="0" x2="0" y2="1">` +
        `<stop offset="0%" stop-color="#fef08a" stop-opacity="0.70"/>` +
        `<stop offset="55%" stop-color="#fef08a" stop-opacity="0.22"/>` +
        `<stop offset="100%" stop-color="#fef08a" stop-opacity="0"/>` +
        `</linearGradient>` +
        `<filter id="sigil_bless_glow" x="-30%" y="-30%" width="160%" height="160%">` +
        `<feGaussianBlur stdDeviation="1.8"/>` +
        `</filter>` +
        `</defs>`
      : ""

    const blessedOverlay = blessed
      ? `<g opacity="0.75">` +
        `<path d="M24 0 Q32 0 40 0 L56 22 L8 22 Z" fill="url(#sigil_bless_beam)" opacity="0.55" filter="url(#sigil_bless_glow)"/>` +
        `</g>`
      : ""

    return (
      `<svg xmlns="http://www.w3.org/2000/svg" width="256" height="256" viewBox="0 0 64 64">` +
      baseDefs +
      blessedDefs +
      desc +
      metadata +
      `<g id="sigil-scene" clip-path="url(#sigil_clip)">` +
      bgLayer +
      (anomaly ? anomalyOverlay : normalOverlay) +
      (blessed ? `<g id="sigil-bless">${blessedOverlay}</g>` : "") +
      `</g>` +
      frameLayer +
      `</svg>`
    )
  }
}

namespace avatar$ {
  export function generateSeed(address: textref): textref {
    const burnCount = burn$.read(address)
    const nonceValue = nonce$.next()

    const burnsText = bigints.toBase10(burnCount)
    const nonceText = bigints.toBase10(nonceValue)

    const payload = blobs.encode(packs.create3(address, burnsText, nonceText))
    const digest = canonicalHash("avatar_seed", payload)
    const hex = texts.toString(blobs.toBase16(digest))
    return texts.fromString(hex.slice(0, 32))
  }

  export function retrieve(address: textref): textref {
    const stored = seed$.read(address)

    if (stored) {
      const storedStr = texts.toString(stored)
      if (storedStr.length > 0) return stored
    }

    const seed = generateSeed(address)
    seed$.write(address, seed)
    return seed
  }

  export function render(address: textref): textref {
    const seed = seed$.read(address)
    if (!seed) return EMPTY_TEXT()

    const seedText = texts.toString(seed)
    if (seedText.length === 0) return EMPTY_TEXT()

    const tag = tag$.read(address)
    const tagText = tag ? texts.toString(tag) : ""

    const burnCount = burn$.read(address)
    const burnsText = texts.toString(bigints.toBase10(burnCount))
    const blessCount = bless_count$.read(address)
    const blessCountText = texts.toString(bigints.toBase10(blessCount))
    const blessed = bless_flag$.read(address)

    return texts.fromString(
      render$.svg(seedText, tagText, burnsText, blessCountText, blessed),
    )
  }

  export function mint(address: textref, tag: textref): textref {
    retrieve(address)
    tag$.write(address, tag)
    return render(address)
  }

  export function burn(address: textref): bigintref {
    const next = burn$.increment(address)
    seed$.clear(address)
    tag$.clear(address)
    bless_count$.reset(address)
    bless_mix$.clear(address)
    bless_flag$.clear(address)
    return next
  }

  export function reroll(address: textref, tag: textref): textref {
    burn(address)
    return mint(address, tag)
  }
}

/**
 * Derive the address for a given session capability.
 *
 * @param session Session packref [ed25519_module_address, pubkey]
 * @returns Derived address as textref
 */
export function address(session: packref): textref {
  return session$.assert(session)
}

/**
 * Get the avatar SVG for a given address.
 *
 * @param address The address to get the avatar for
 * @returns SVG string as textref
 */
export function get(address: textref): textref {
  return avatar$.render(address)
}

/**
 * Mint an avatar for the authenticated session with a custom tag.
 *
 * @param session Session packref [ed25519_module_address, pubkey]
 * @param tag Custom tag/label to store with the avatar
 * @returns SVG string as textref
 */
export function mint(session: packref, tag: textref): textref {
  const address = session$.assert(session)
  return avatar$.mint(address, tag)
}

/**
 * Burn the caller's sigil and increment the burn counter.
 *
 * @param session Session packref [ed25519_module_address, pubkey]
 * @returns Updated burn count
 */
export function burn(session: packref): bigintref {
  const address = session$.assert(session)
  return avatar$.burn(address)
}

/**
 * Burn then mint a fresh sigil (increments the burn counter once).
 *
 * @param session Session packref [ed25519_module_address, pubkey]
 * @param tag Custom tag/label to store with the avatar
 * @returns SVG string as textref
 */
export function reroll(session: packref, tag: textref): textref {
  const address = session$.assert(session)
  return avatar$.reroll(address, tag)
}

/**
 * Bless a target sigil (increments count and updates rolling mix).
 *
 * @param target The address to bless
 * @returns "blessed" if the roll hits, otherwise "ok"
 */
export function bless(target: textref): textref {
  return blessing$.bless(target)
}

/**
 * Read the collective blessing progress for a target sigil.
 *
 * @param target The address to inspect
 * @returns ["bobine.sigil/vibes_view", 1, count_base10, blessed_flag ("1"|"0"), difficulty_bits_base10]
 */
export function vibes(target: textref): packref {
  return blessing$.vibes(target)
}
