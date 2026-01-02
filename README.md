# La Bobinerie

![Bobinerie Banner](banner.webp)

> 🧵 _La Bobinerie_ - Haberdashery of [Bobine](https://bobine.tech) modules: from useful, serious pieces to educational gems and esoteric oddities. Grab, deploy, fork at will.

[![Open since 2025](https://img.shields.io/badge/Open%20since-2025-cyan?style=for-the-badge)](https://img.shields.io/github/v/release/ccamel/bobinerie)
[![Version](https://img.shields.io/github/v/release/ccamel/bobinerie?style=for-the-badge)](https://github.com/ccamel/bobinerie/releases)
[![AssemblyScript](https://img.shields.io/badge/AssemblyScript-%23007ACC?style=for-the-badge&logo=assemblyscript&logoColor=white)](https://www.assemblyscript.org/)
[![Commit Convention: DAFT](https://img.shields.io/badge/Commit_Convention-Daft-orange?style=for-the-badge)](https://x.com/hazae41/status/2001986156834267231)
[![Build](https://img.shields.io/github/actions/workflow/status/ccamel/bobinerie/build.yml?style=for-the-badge)](https://github.com/ccamel/bobinerie/actions/workflows/build.yml)
[![Lint](https://img.shields.io/github/actions/workflow/status/ccamel/bobinerie/lint-code.yml?style=for-the-badge)](https://github.com/ccamel/bobinerie/actions/workflows/lint-code.yml)
[![Deploy](https://img.shields.io/github/actions/workflow/status/ccamel/bobinerie/deploy.yml?style=for-the-badge)](https://github.com/ccamel/bobinerie/actions/workflows/deploy.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=for-the-badge)](LICENSE)

## Le Comptoir

Available now:

<!-- CONTRACTS:START -->

- **[counter](contracts/counter/README.md)**
  > Per-account counter with Ed25519 session authentication.

- **[say-my-name](contracts/say-my-name/README.md)**
  > A simple name storage contract that remembers who you are.

- **[sigil](contracts/sigil/README.md)**
  > Account-bound on-chain sigil (SVG PFP): mint one per derived address, optional on-chain tag.

<!-- CONTRACTS:END -->

## Le Manuel de l’Artisan

### Project Structure

```txt
bobinerie/
├── contracts/           # All the smart contracts
│   └── say-my-name/    # Example: name storage
│       ├── src/
│       │   └── mod.ts
│       └── out/        # Compiled outputs (WASM + types)
├── run/                # Deployment & execution scripts
└── package.json        # Build scripts
```

### Setup

```bash
npm install
```

Configure your Bobine server in `.env.local` (optional):

```env
SERVER=http://localhost:8080
```

### Quick Start

Compile all contracts:

```bash
npm run prepack
```

Deploy a contract:

```bash
CONTRACT=say-my-name npm run produce
# Returns: { address: "3ca2c27f..." }
```

Execute a contract method:

```bash
npm run execute 3ca2c27f... sayMyName text:"Alice"
```

## Avis aux artisans

Got a useful contract? A intriguing experiment? Put it on the shelves.

1. Create your contract in `contracts/your-contract-name/`
2. Test it thoroughly
3. Add a brief description in the shop section
4. Submit a PR

All contributions welcome, from serious primitives to silly meme contracts.
