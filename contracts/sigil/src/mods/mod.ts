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
    storage.set(k, texts.fromString(v ? "1" : "0"))
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

  const BG: string[] = [
    `<rect x="0" y="0" width="64" height="64" rx="12" fill="$C"/>`,
    `<circle cx="32" cy="32" r="30" fill="$C"/>`,
    `<path d="M32 2 L60 18 L60 46 L32 62 L4 46 L4 18 Z" fill="$C"/>`,
    `<rect x="0" y="0" width="64" height="64" fill="$C"/><path d="M0 12 H64 M0 28 H64 M0 44 H64" stroke="$C2" stroke-width="4" opacity="0.35"/>`,
    `<rect x="0" y="0" width="64" height="64" fill="$C"/><path d="M-8 64 L64 -8" stroke="$C2" stroke-width="10" opacity="0.25"/>`,
    `<rect x="0" y="0" width="64" height="64" fill="$C"/><circle cx="18" cy="18" r="10" fill="$C2" opacity="0.35"/><circle cx="46" cy="46" r="12" fill="$C2" opacity="0.25"/>`,
    `<rect x="0" y="0" width="64" height="64" fill="$C"/><path d="M0 52 Q32 36 64 52 V64 H0 Z" fill="$C2" opacity="0.35"/>`,
    `<rect x="0" y="0" width="64" height="64" fill="$C"/><path d="M0 0 H64 V64 H0 Z" fill="none" stroke="$C2" stroke-width="4" opacity="0.35"/>`,
  ]

  const FACE: string[] = [
    `<circle cx="32" cy="34" r="18" fill="$S"/>`,
    `<rect x="14" y="18" width="36" height="36" rx="16" fill="$S"/>`,
    `<path d="M32 16 C44 16 52 26 52 36 C52 48 44 56 32 56 C20 56 12 48 12 36 C12 26 20 16 32 16 Z" fill="$S"/>`,
    `<circle cx="32" cy="34" r="18" fill="$S"/><circle cx="24" cy="40" r="3" fill="#000" opacity="0.06"/><circle cx="40" cy="40" r="3" fill="#000" opacity="0.06"/>`,
    `<rect x="16" y="18" width="32" height="38" rx="14" fill="$S"/>`,
    `<circle cx="32" cy="35" r="19" fill="$S"/><path d="M18 28 Q32 18 46 28" fill="none" stroke="#000" opacity="0.06" stroke-width="6"/>`,
    `<circle cx="32" cy="34" r="18" fill="$S"/><path d="M20 50 Q32 46 44 50" fill="none" stroke="#000" opacity="0.08" stroke-width="4"/>`,
    `<rect x="14" y="18" width="36" height="36" rx="18" fill="$S"/><path d="M20 26 Q32 20 44 26" fill="none" stroke="#000" opacity="0.06" stroke-width="5"/>`,
  ]

  const EYES: string[] = [
    `<circle cx="25" cy="32" r="3" fill="#111"/><circle cx="39" cy="32" r="3" fill="#111"/>`,
    `<path d="M20 32 Q25 28 30 32" fill="none" stroke="#111" stroke-width="2.5"/><path d="M34 32 Q39 28 44 32" fill="none" stroke="#111" stroke-width="2.5"/>`,
    `<circle cx="25" cy="32" r="2" fill="#111"/><circle cx="39" cy="32" r="2" fill="#111"/><circle cx="25" cy="32" r="6" fill="none" stroke="#111" opacity="0.2" stroke-width="2"/>`,
    `<path d="M21 31 H29" stroke="#111" stroke-width="3" stroke-linecap="round"/><path d="M35 31 H43" stroke="#111" stroke-width="3" stroke-linecap="round"/>`,
    `<circle cx="25" cy="33" r="3" fill="#111"/><circle cx="39" cy="33" r="3" fill="#111"/><path d="M20 28 Q25 25 30 28" fill="none" stroke="#111" stroke-width="2"/>`,
    `<circle cx="25" cy="32" r="3" fill="#111"/><circle cx="39" cy="32" r="3" fill="#111"/><circle cx="23.7" cy="31" r="1" fill="#fff" opacity="0.8"/><circle cx="37.7" cy="31" r="1" fill="#fff" opacity="0.8"/>`,
    `<path d="M20 33 Q25 36 30 33" fill="none" stroke="#111" stroke-width="2.5"/><path d="M34 33 Q39 36 44 33" fill="none" stroke="#111" stroke-width="2.5"/>`,
    `<circle cx="25" cy="32" r="3" fill="#111"/><circle cx="39" cy="32" r="3" fill="#111"/><path d="M24 37 Q32 40 40 37" fill="none" stroke="#111" opacity="0.2" stroke-width="2"/>`,
  ]

  const MOUTH: string[] = [
    `<path d="M26 43 Q32 47 38 43" fill="none" stroke="#111" stroke-width="2.5" stroke-linecap="round"/>`,
    `<path d="M26 44 Q32 41 38 44" fill="none" stroke="#111" stroke-width="2.5" stroke-linecap="round"/>`,
    `<circle cx="32" cy="44" r="2" fill="#111" opacity="0.7"/>`,
    `<path d="M28 45 Q32 49 36 45" fill="none" stroke="#111" stroke-width="2.5"/><circle cx="30" cy="45" r="1" fill="#111"/><circle cx="34" cy="45" r="1" fill="#111"/>`,
    `<path d="M27 44 Q32 50 37 44" fill="#111" opacity="0.12"/>`,
    `<path d="M26 43 Q32 48 38 43" fill="none" stroke="#111" stroke-width="2.5"/><path d="M28 44 Q32 46 36 44" fill="none" stroke="#111" opacity="0.3" stroke-width="1.5"/>`,
    `<path d="M25 44 H39" stroke="#111" stroke-width="2.5" stroke-linecap="round"/>`,
    `<path d="M27 43 Q32 45 37 43" fill="none" stroke="#111" stroke-width="2.5"/><path d="M29 47 Q32 49 35 47" fill="none" stroke="#111" opacity="0.25" stroke-width="2"/>`,
  ]

  const TOP: string[] = [
    `<path d="M14 30 Q32 10 50 30 Q46 18 32 16 Q18 18 14 30Z" fill="$H"/>`,
    `<path d="M14 30 Q32 14 50 30 Q50 20 32 20 Q14 20 14 30Z" fill="$H"/><path d="M20 22 Q32 16 44 22" fill="none" stroke="#000" opacity="0.08" stroke-width="4"/>`,
    `<path d="M16 28 Q32 8 48 28 Q44 14 32 14 Q20 14 16 28Z" fill="$H"/><circle cx="32" cy="14" r="3" fill="#000" opacity="0.08"/>`,
    `<path d="M12 30 Q32 18 52 30" fill="none" stroke="$H" stroke-width="10" stroke-linecap="round"/>`,
    `<path d="M18 22 Q32 12 46 22 Q44 10 32 10 Q20 10 18 22Z" fill="$H"/><path d="M18 24 Q32 18 46 24" fill="none" stroke="#000" opacity="0.08" stroke-width="3"/>`,
    `<path d="M14 30 Q32 6 50 30" fill="none" stroke="$H" stroke-width="10" stroke-linecap="round"/><path d="M18 30 Q32 14 46 30" fill="none" stroke="$H" stroke-width="8" stroke-linecap="round" opacity="0.8"/>`,
    `<path d="M16 30 Q32 22 48 30 Q44 18 32 18 Q20 18 16 30Z" fill="$H"/><path d="M20 30 Q32 24 44 30" fill="none" stroke="#fff" opacity="0.18" stroke-width="2"/>`,
    `<path d="M10 30 Q32 12 54 30" fill="none" stroke="$H" stroke-width="12" stroke-linecap="round"/>`,
  ]

  const ACC: string[] = [
    ``,
    `<circle cx="25" cy="32" r="7" fill="none" stroke="#111" stroke-width="2"/><circle cx="39" cy="32" r="7" fill="none" stroke="#111" stroke-width="2"/><path d="M32 32 H32" stroke="#111" stroke-width="2"/>`,
    `<circle cx="25" cy="32" r="8" fill="none" stroke="#111" stroke-width="2"/><circle cx="39" cy="32" r="8" fill="none" stroke="#111" stroke-width="2"/><path d="M33 32 H31" stroke="#111" stroke-width="2"/><path d="M17 32 H14" stroke="#111" opacity="0.25" stroke-width="2"/><path d="M50 32 H47" stroke="#111" opacity="0.25" stroke-width="2"/>`,
    `<circle cx="43" cy="41" r="2" fill="#d4af37"/><circle cx="43" cy="46" r="2" fill="#d4af37"/>`,
    `<path d="M22 45 Q32 52 42 45" fill="none" stroke="#111" opacity="0.18" stroke-width="6" stroke-linecap="round"/>`,
    `<path d="M18 12 Q32 4 46 12" fill="none" stroke="#d4af37" stroke-width="4" stroke-linecap="round"/><circle cx="32" cy="6" r="3" fill="#d4af37"/>`,
    `<path d="M16 48 Q32 58 48 48" fill="none" stroke="#111" opacity="0.12" stroke-width="8" stroke-linecap="round"/>`,
    `<path d="M20 52 H44" stroke="#111" opacity="0.18" stroke-width="6" stroke-linecap="round"/>`,
  ]

  const PA_BG: string[] = [
    "#0b1020",
    "#101827",
    "#0f172a",
    "#111827",
    "#052e2b",
    "#1f2937",
    "#2a0b2e",
    "#2c1b0f",
  ]
  const PA_BG2: string[] = [
    "#60a5fa",
    "#34d399",
    "#f472b6",
    "#f59e0b",
    "#a78bfa",
    "#22c55e",
    "#fb7185",
    "#38bdf8",
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

    const pal = b6 & 7
    const env = b0 & 7
    const face = b1 & 7
    const eyes = b2 & 7
    const mouth = b3 & 7
    const top = b4 & 7
    let acc = b5 & 7

    if (b0 === 0 && b1 === 0) acc = 5

    const C = PA_BG[pal]
    const C2 = PA_BG2[pal]
    const S = PA_SKIN[b7 & 7]
    const H = PA_HAIR[(b7 >> 3) & 7]

    const bg = BG[env].replace("$C", C).replace("$C2", C2)
    const head = FACE[face].replace("$S", S)
    const eye = EYES[eyes]
    const mou = MOUTH[mouth]
    const hair = TOP[top].replace("$H", H)
    const accessory = ACC[acc]

    const bgLayer = `<g id="sigil-bg">${bg}</g>`

    const avatarLayer =
      `<g id="sigil-avatar">` +
      `<g id="sigil-face">` +
      head +
      `</g>` +
      `<g id="sigil-eyes">` +
      eye +
      `</g>` +
      `<g id="sigil-mouth">` +
      mou +
      `</g>` +
      `<g id="sigil-top">` +
      hair +
      `</g>` +
      `<g id="sigil-accessory">` +
      accessory +
      `</g>` +
      `</g>`
    const desc = `<desc>${esc(tag)}</desc>`
    const metadata =
      `<metadata>` +
      `<sigil:data xmlns:sigil="${XMLNS_SIGIL}">` +
      `<sigil:seed>${seed32hex}</sigil:seed>` +
      `<sigil:burns>${burnsText}</sigil:burns>` +
      `<sigil:bless_count>${blessCountText}</sigil:bless_count>` +
      `<sigil:traits env="${env}" face="${face}" eyes="${eyes}" mouth="${mouth}" top="${top}" acc="${acc}" pal="${pal}"/>` +
      `</sigil:data>` +
      `</metadata>`
    const blessedDefs = blessed
      ? `<defs>
      <linearGradient id="sigil_bless_beam" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#fef08a" stop-opacity="0.70"/>
        <stop offset="55%" stop-color="#fef08a" stop-opacity="0.22"/>
        <stop offset="100%" stop-color="#fef08a" stop-opacity="0"/>
      </linearGradient>

      <filter id="sigil_bless_glow" x="-30%" y="-30%" width="160%" height="160%">
        <feGaussianBlur stdDeviation="1.8"/>
      </filter>
    </defs>`
      : ""
    const blessedOverlay = blessed
      ? `<g opacity="0.75">
      <path d="M26 0
               Q32 0 38 0
               L54 22
               L10 22
               Z"
            fill="url(#sigil_bless_beam)"
            opacity="0.55"
            filter="url(#sigil_bless_glow)"/>
    </g>`
      : ""

    return (
      `<svg xmlns="http://www.w3.org/2000/svg" width="256" height="256" viewBox="0 0 64 64">` +
      blessedDefs +
      desc +
      metadata +
      bgLayer +
      avatarLayer +
      (blessed ? `<g id="sigil-bless">${blessedOverlay}</g>` : "") +
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
  if (!seed) return texts.fromString("")

  const seedText = texts.toString(seed)
  if (seedText.length === 0) return texts.fromString("")

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
  state.setSeed(address, texts.fromString(""))
  state.setTag(address, texts.fromString(""))
  state.setBlessCount(address, bigints.zero())
  state.setBlessMix(address, texts.fromString(""))
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
  const mixRef = mix ? mix : texts.fromString("")

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
  const blessedText = texts.fromString(blessed ? "1" : "0")

  const seed = state.getSeed(target)
  let k: i32 = 0

  if (seed) {
    const seedText = texts.toString(seed)
    if (seedText.length > 0) k = blessings.difficulty(seedText)
  }

  const kText = texts.fromString(k.toString())

  return packs.create3(countText, blessedText, kText)
}
