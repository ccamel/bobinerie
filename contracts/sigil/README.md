# Sigil

Account-bound on-chain sigil (SVG PFP): mint one per derived address, optional on-chain tag.

## Overview

Mint a deterministic on-chain SVG PFP (a "sigil") for a derived account address.

- One sigil per derived address
- Optional on-chain `tag` stored alongside the sigil
- Pure on-chain SVG, no external assets, no backend
- Layered traits: bg, archetype, body, brows, eyes, mouth, hat, fx, palettes
- Ultra-rare drop: the Anomaly glitch (chromatic split), flagged in SVG metadata

## Methods

<!-- METHODS:START -->

### `address(session)`

Derive the address for a given session capability.

**Parameters:**

- `session` - Session packref [ed25519_module_address, pubkey]

**Returns:**

Derived address as textref

### `get(address)`

Get the avatar SVG for a given address.

**Parameters:**

- `address` - The address to get the avatar for

**Returns:**

SVG string as textref

### `mint(session, tag)`

Mint an avatar for the authenticated session with a custom tag.

**Parameters:**

- `session` - Session packref [ed25519_module_address, pubkey]
- `tag` - Custom tag/label to store with the avatar

**Returns:**

SVG string as textref

### `burn(session)`

Burn the caller's sigil and increment the burn counter.

**Parameters:**

- `session` - Session packref [ed25519_module_address, pubkey]

**Returns:**

Updated burn count

### `reroll(session, tag)`

Burn then mint a fresh sigil (increments the burn counter once).

**Parameters:**

- `session` - Session packref [ed25519_module_address, pubkey]
- `tag` - Custom tag/label to store with the avatar

**Returns:**

SVG string as textref

### `bless(target)`

Bless a target sigil (increments count and updates rolling mix).

**Parameters:**

- `target` - The address to bless

**Returns:**

"blessed" if the roll hits, otherwise "ok"

### `vibes(target)`

Read the collective blessing progress for a target sigil.

**Parameters:**

- `target` - The address to inspect

**Returns:**

[count_base10, blessed_flag ("1"|"0"), difficulty_bits_base10]

<!-- METHODS:END -->

## Sample sigils

<!-- SIGIL_EXAMPLES:START -->
<div align="center">
  <img src="./examples/sigil-1.svg" width="128" height="128" alt="sigil-1.svg"/> <img src="./examples/sigil-2.svg" width="128" height="128" alt="sigil-2.svg"/><br/>
  <img src="./examples/sigil-3.svg" width="128" height="128" alt="sigil-3.svg"/> <img src="./examples/sigil-4.svg" width="128" height="128" alt="sigil-4.svg"/>
</div>
<!-- SIGIL_EXAMPLES:END -->

## Examples

### Setup

Deploy an Ed25519 authentication module:

```bash
git clone https://github.com/hazae41/bobine-ed25519.git && cd bobine-ed25519
npm install
npm run prepack && npm run produce
# Note the deployed module address
```

Generate Ed25519 keypair:

```bash
npm run keygen
```

Store the keypair in `.env.local`:

```env
SIGKEY=302e020100300506032b657004220420...
PUBKEY=302a300506032b65700321003307db3f...
SERVER=http://localhost:8080
```

### Usage

```bash
# gm anon, time to mint your on-chain sigil
npm -s run execute:sign -- <ed25519_module_address> <sigil_module_address> mint text:"I love prolog btw" \
  | jq -r '.value[0].value' > my-sigil.svg

# view someone else's sigil
npm run execute <sigil_module_address> get text:"<address>"
```

### Sigil features

- Deterministic PFPs: one derived address, one sigil. Always the same.
- Pure on-chain: no assets, no backend, no oracles.
- Meme3 trait stack: bg, archetype, body, brows, eyes, mouth, hat, fx plus palettes.
- Laser eyes exist, but they are just an eye style, not a special flag.
- Ultra-rare: **the Anomaly**. A whole-avatar glitch look (chromatic split + scanline vibes), exposed in metadata.
- Taggable: stash a short label on-chain next to your sigil.
- Permissionless blessing: anyone can spend gas to push a sigil toward a blessed state.
- Vibes check: public progress tuple [count, blessed, difficulty_bits].

Blessing is a tiny on-chain ritual. Each `bless(address)` costs gas, increments a counter, and rolls a deterministic lottery (difficulty in bits). When it hits, the sigil flips to **blessed** and gets the light-beam overlay plus metadata. The chain remembers the vibe.

## Use cases

- On-chain PFPs that actually live on-chain (wild concept, I know)
- Generative art competitions where reproducibility matters
