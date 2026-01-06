import {
  bigintref,
  bigints,
  blobs,
  modules,
  packref,
  packs,
  sha256,
  storage,
  textref,
  texts,
} from "@hazae41/stdbob"

const XMLNS_SIGIL = "https://bobine.tech#sigil"

function zeroText(): textref {
  return texts.fromString("0")
}

function oneText(): textref {
  return texts.fromString("1")
}

function emptyText(): textref {
  return texts.fromString("")
}

namespace addresses {
  export function compute(session: packref): textref {
    return blobs.toBase16(sha256.digest(blobs.encode(session)))
  }

  export function verify(session: packref): textref {
    const module = packs.get<textref>(session, 0)

    if (
      !packs.get<bool>(
        modules.call(
          module,
          texts.fromString("verify"),
          packs.create1(session),
        ),
        0,
      )
    )
      throw new Error("Invalid session")

    return compute(session)
  }
}

namespace state {
  function key(prefix: string, address: textref): textref {
    return texts.concat(texts.fromString(prefix), address)
  }

  function getText(k: textref): textref {
    const v = storage.get(k)
    if (!v) return null
    return packs.get<textref>(v, 0)
  }

  function getBigint(k: textref): bigintref {
    const t = getText(k)
    if (!t) return bigints.zero()

    const s = texts.toString(t)
    if (s.length === 0) return bigints.zero()

    return bigints.fromBase10(t)
  }

  function setBigint(k: textref, v: bigintref): void {
    storage.set(k, bigints.toBase10(v))
  }

  function getBool(k: textref): bool {
    const t = getText(k)
    if (!t) return false
    return texts.toString(t) === "1"
  }

  function setBool(k: textref, v: bool): void {
    storage.set(k, v ? oneText() : zeroText())
  }

  export function getNonce(): bigintref {
    return getBigint(texts.fromString("nonce"))
  }

  export function bumpNonce(): bigintref {
    const k = texts.fromString("nonce")
    const cur = getBigint(k)
    const next = bigints.inc(cur)
    setBigint(k, next)
    return cur
  }

  export function getBurns(address: textref): bigintref {
    return getBigint(key("burns:", address))
  }

  export function setBurns(address: textref, burns: bigintref): void {
    setBigint(key("burns:", address), burns)
  }

  export function getSeed(address: textref): textref {
    return getText(key("seed:", address))
  }

  export function setSeed(address: textref, seed: textref): void {
    storage.set(key("seed:", address), seed)
  }

  export function getTag(address: textref): textref {
    return getText(key("tag:", address))
  }

  export function setTag(address: textref, tag: textref): void {
    storage.set(key("tag:", address), tag)
  }

  export function getBlessCount(address: textref): bigintref {
    return getBigint(key("bless_count:", address))
  }

  export function setBlessCount(address: textref, count: bigintref): void {
    setBigint(key("bless_count:", address), count)
  }

  export function getBlessMix(address: textref): textref {
    return getText(key("bless_mix:", address))
  }

  export function setBlessMix(address: textref, mix: textref): void {
    storage.set(key("bless_mix:", address), mix)
  }

  export function getBlessed(address: textref): bool {
    return getBool(key("blessed:", address))
  }

  export function setBlessed(address: textref, blessed: bool): void {
    setBool(key("blessed:", address), blessed)
  }
}

namespace blessings {
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
}

namespace render {
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
    // Human
    `<circle cx="32" cy="34" r="18" fill="$S"/>`,
    // Ape jaw
    `<path d="M32 16 C44 16 52 26 52 36 C52 50 42 56 32 56 C22 56 12 50 12 36 C12 26 20 16 32 16 Z" fill="$S"/>` +
      `<path d="M18 42 Q32 52 46 42" fill="#000" opacity="0.08"/>`,
    // Alien
    `<ellipse cx="32" cy="32" rx="18" ry="22" fill="$S"/>`,
    // Zombie (boxy)
    `<rect x="14" y="16" width="36" height="40" rx="10" fill="$S"/>` +
      `<path d="M20 28 L24 24 L28 28" fill="none" stroke="#000" opacity="0.08" stroke-width="3" stroke-linecap="round"/>`,
    // Ghost
    `<path d="M18 56 V32 C18 22 25 16 32 16 C39 16 46 22 46 32 V56" fill="$S"/>` +
      `<path d="M18 56 Q22 52 26 56 Q30 52 34 56 Q38 52 42 56 Q44 54 46 56" fill="$S"/>`,
    // Pepe-ish (wide)
    `<ellipse cx="32" cy="36" rx="20" ry="18" fill="$S"/>` +
      `<path d="M16 38 Q32 28 48 38" fill="none" stroke="#000" opacity="0.06" stroke-width="6" stroke-linecap="round"/>`,
  ]

  const BODY: string[] = [
    // Hoodie
    `<path d="M10 64 V46 Q32 30 54 46 V64 Z" fill="$C"/>` +
      `<path d="M18 46 Q32 36 46 46" fill="none" stroke="#fff" opacity="0.10" stroke-width="3" stroke-linecap="round"/>` +
      `<path d="M26 46 V64" stroke="#000" opacity="0.10" stroke-width="3"/>` +
      `<path d="M38 46 V64" stroke="#000" opacity="0.10" stroke-width="3"/>`,
    // Suit
    `<path d="M12 64 V44 Q32 34 52 44 V64 Z" fill="$C"/>` +
      `<path d="M32 44 L26 64" stroke="#000" opacity="0.12" stroke-width="3"/>` +
      `<path d="M32 44 L38 64" stroke="#000" opacity="0.12" stroke-width="3"/>` +
      `<path d="M28 46 Q32 50 36 46" fill="#fff" opacity="0.10"/>`,
    // Tee
    `<path d="M12 64 V48 Q32 40 52 48 V64 Z" fill="$C"/>` +
      `<path d="M22 48 Q32 44 42 48" fill="none" stroke="#000" opacity="0.10" stroke-width="3" stroke-linecap="round"/>`,
    // Naked
    ``,
  ]

  const EYES: string[] = [
    // Normal
    `<circle cx="25" cy="32" r="3" fill="#111"/><circle cx="39" cy="32" r="3" fill="#111"/>`,
    // Bored
    `<path d="M21 31 H29" stroke="#111" stroke-width="3" stroke-linecap="round"/>` +
      `<path d="M35 31 H43" stroke="#111" stroke-width="3" stroke-linecap="round"/>`,
    // Crying
    `<circle cx="25" cy="32" r="3" fill="#111"/><circle cx="39" cy="32" r="3" fill="#111"/>` +
      `<path d="M24 35 Q23 40 25 44" fill="none" stroke="#60a5fa" stroke-width="2.5" stroke-linecap="round" opacity="0.8"/>`,
    // Noggles
    `<circle cx="25" cy="32" r="8" fill="none" stroke="#111" stroke-width="2"/>` +
      `<circle cx="39" cy="32" r="8" fill="none" stroke="#111" stroke-width="2"/>` +
      `<path d="M33 32 H31" stroke="#111" stroke-width="2"/>`,
    // Laser eyes (meme, not ultra-rare)
    `<circle cx="25" cy="32" r="3" fill="#111"/><circle cx="39" cy="32" r="3" fill="#111"/>` +
      `<path d="M25 32 L0 22" stroke="#ef4444" stroke-width="3" stroke-linecap="round" opacity="0.55" filter="url(#sigil_laser_glow)"/>` +
      `<path d="M39 32 L64 22" stroke="#ef4444" stroke-width="3" stroke-linecap="round" opacity="0.55" filter="url(#sigil_laser_glow)"/>` +
      `<path d="M25 33 L0 34" stroke="#fb7185" stroke-width="1.5" stroke-linecap="round" opacity="0.55"/>` +
      `<path d="M39 33 L64 34" stroke="#fb7185" stroke-width="1.5" stroke-linecap="round" opacity="0.55"/>`,
    // Dead
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
    // Cigarette
    `<path d="M26 44 H38" stroke="#111" stroke-width="2.5" stroke-linecap="round"/>` +
      `<path d="M38 44 H46" stroke="#e5e7eb" stroke-width="3" stroke-linecap="round"/>` +
      `<path d="M47 43 Q50 41 49 38" fill="none" stroke="#9ca3af" stroke-width="2" opacity="0.55" stroke-linecap="round"/>`,
    // Pipe
    `<path d="M26 44 Q32 48 38 44" fill="none" stroke="#111" stroke-width="2.5" stroke-linecap="round"/>` +
      `<path d="M40 44 Q45 46 46 42" fill="none" stroke="#111" opacity="0.65" stroke-width="3" stroke-linecap="round"/>`,
  ]

  const HAT: string[] = [
    // Nothing
    ``,
    // Cap
    `<path d="M16 28 Q32 16 48 28 Q44 18 32 18 Q20 18 16 28Z" fill="$H"/>` +
      `<path d="M22 26 Q32 22 42 26" fill="none" stroke="#000" opacity="0.10" stroke-width="4" stroke-linecap="round"/>`,
    // Beanie
    `<path d="M16 30 Q32 14 48 30 Q48 22 32 22 Q16 22 16 30Z" fill="$H"/>`,
    // Crown
    `<path d="M18 22 L24 14 L32 22 L40 14 L46 22" fill="none" stroke="#f59e0b" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>` +
      `<circle cx="24" cy="14" r="2" fill="#fef08a" opacity="0.9"/>` +
      `<circle cx="40" cy="14" r="2" fill="#fef08a" opacity="0.9"/>`,
    // Top hat
    `<rect x="22" y="10" width="20" height="14" rx="2" fill="$H"/>` +
      `<path d="M18 24 H46" stroke="$H" stroke-width="6" stroke-linecap="round"/>`,
    // Brain
    `<path d="M20 26 Q24 14 32 18 Q40 14 44 26" fill="none" stroke="#fb7185" stroke-width="4" opacity="0.55" stroke-linecap="round"/>`,
  ]

  const FX: string[] = [
    // Nothing
    ``,
    // Sparkles
    `<path d="M12 18 L14 22 L18 24 L14 26 L12 30 L10 26 L6 24 L10 22 Z" fill="#fff" opacity="0.12"/>` +
      `<path d="M52 40 L54 44 L58 46 L54 48 L52 52 L50 48 L46 46 L50 44 Z" fill="#fff" opacity="0.10"/>`,
    // Coins
    `<circle cx="14" cy="50" r="5" fill="#f59e0b" opacity="0.22"/>` +
      `<circle cx="52" cy="18" r="4" fill="#f59e0b" opacity="0.18"/>`,
    // Flies (rot)
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
    // seed32hex is 32 hex chars = 16 bytes
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

namespace avatars {
  export function generateSeed(address: textref): textref {
    const burns = state.getBurns(address)
    const nonce = state.bumpNonce()

    const burnsText = bigints.toBase10(burns)
    const nonceText = bigints.toBase10(nonce)

    const seedPack = packs.create4(
      texts.fromString("avatar:v1"),
      address,
      burnsText,
      nonceText,
    )
    const digest = sha256.digest(blobs.encode(seedPack))
    const hex = texts.toString(blobs.toBase16(digest))
    return texts.fromString(hex.slice(0, 32))
  }

  export function retrieve(address: textref): textref {
    const stored = state.getSeed(address)

    if (stored) {
      const storedStr = texts.toString(stored)
      if (storedStr.length > 0) return stored
    }

    const seed = generateSeed(address)
    state.setSeed(address, seed)
    return seed
  }
}

/**
 * Derive the address for a given session capability.
 *
 * @param session Session packref [ed25519_module_address, pubkey]
 * @returns Derived address as textref
 */
export function address(session: packref): textref {
  return addresses.verify(session)
}

/**
 * Get the avatar SVG for a given address.
 *
 * @param address The address to get the avatar for
 * @returns SVG string as textref
 */
export function get(address: textref): textref {
  const seed = state.getSeed(address)
  if (!seed) return emptyText()

  const seedText = texts.toString(seed)
  if (seedText.length === 0) return emptyText()

  const tag = state.getTag(address)
  const tagText = tag ? texts.toString(tag) : ""

  const burns = state.getBurns(address)
  const burnsText = texts.toString(bigints.toBase10(burns))
  const blessCount = state.getBlessCount(address)
  const blessCountText = texts.toString(bigints.toBase10(blessCount))
  const blessed = state.getBlessed(address)
  return texts.fromString(
    render.svg(seedText, tagText, burnsText, blessCountText, blessed),
  )
}

/**
 * Mint an avatar for the authenticated session with a custom tag.
 *
 * @param session Session packref [ed25519_module_address, pubkey]
 * @param tag Custom tag/label to store with the avatar
 * @returns SVG string as textref
 */
export function mint(session: packref, tag: textref): textref {
  const address = addresses.verify(session)
  avatars.retrieve(address)
  state.setTag(address, tag)
  return get(address)
}

/**
 * Burn the caller's sigil and increment the burn counter.
 *
 * @param session Session packref [ed25519_module_address, pubkey]
 * @returns Updated burn count
 */
export function burn(session: packref): bigintref {
  const address = addresses.verify(session)
  const burns = state.getBurns(address)
  const next = bigints.inc(burns)
  state.setBurns(address, next)
  state.setSeed(address, emptyText())
  state.setTag(address, emptyText())
  state.setBlessCount(address, bigints.zero())
  state.setBlessMix(address, emptyText())
  state.setBlessed(address, false)
  return next
}

/**
 * Burn then mint a fresh sigil (increments the burn counter once).
 *
 * @param session Session packref [ed25519_module_address, pubkey]
 * @param tag Custom tag/label to store with the avatar
 * @returns SVG string as textref
 */
export function reroll(session: packref, tag: textref): textref {
  burn(session)
  return mint(session, tag)
}

/**
 * Bless a target sigil (increments count and updates rolling mix).
 *
 * @param target The address to bless
 * @returns "blessed" if the roll hits, otherwise "ok"
 */
export function bless(target: textref): textref {
  const seed = state.getSeed(target)
  if (!seed) throw new Error("Sigil not minted")
  const seedText = texts.toString(seed)
  if (seedText.length === 0) throw new Error("Sigil not minted")

  const already = state.getBlessed(target)
  if (already) return texts.fromString("blessed")

  const count = state.getBlessCount(target)
  const next = bigints.inc(count)
  state.setBlessCount(target, next)

  const nextRef = bigints.toBase10(next)

  const mix = state.getBlessMix(target)
  const mixRef = mix ? mix : emptyText()

  const mixPack = packs.create4(
    texts.fromString("bless:v1"),
    seed,
    nextRef,
    mixRef,
  )

  const digest = sha256.digest(blobs.encode(mixPack))
  const digestHexRef = blobs.toBase16(digest) // textref
  state.setBlessMix(target, digestHexRef)

  const digestHex = texts.toString(digestHexRef)
  const k = blessings.difficulty(seedText)
  const hit = blessings.hit(digestHex, k)

  if (hit) {
    state.setBlessed(target, true)
    return texts.fromString("blessed")
  }

  return texts.fromString("ok")
}

/**
 * Read the collective blessing progress for a target sigil.
 *
 * @param target The address to inspect
 * @returns [count_base10, blessed_flag ("1"|"0"), difficulty_bits_base10]
 */
export function vibes(target: textref): packref {
  const count = state.getBlessCount(target)
  const countText = bigints.toBase10(count)

  const blessed = state.getBlessed(target)
  const blessedText = blessed ? oneText() : zeroText()

  const seed = state.getSeed(target)
  let k: i32 = 0

  if (seed) {
    const seedText = texts.toString(seed)
    if (seedText.length > 0) k = blessings.difficulty(seedText)
  }

  const kText = texts.fromString(k.toString())

  return packs.create3(countText, blessedText, kText)
}
