# La Bobinerie

![Bobinerie Banner](banner.webp)

> 🧵 _La Bobinerie_ - Haberdashery of [Bobine](https://bobine.tech) modules: from useful, serious pieces to educational gems and esoteric oddities. Grab, deploy, fork at will.

<p align="center">
  <a href="https://img.shields.io/github/v/release/ccamel/bobinerie"><img src="https://img.shields.io/badge/Open%20since-2025-cyan?style=for-the-badge" alt="Open since 2025"></a>
  <a href="https://github.com/hazae41/awesome-bobine"><img src="https://img.shields.io/badge/AWESOME-BOBINE-7B3FE4?style=for-the-badge&logo=awesomelists&logoColor=white" alt="Awesome"></a>
  <a href="https://github.com/ccamel/bobinerie/releases"><img src="https://img.shields.io/github/v/release/ccamel/bobinerie?style=for-the-badge" alt="Version"></a>
</p>

<p align="center">
  <a href="https://www.assemblyscript.org/"><img src="https://img.shields.io/badge/Pure-AssemblyScript-007ACC?style=for-the-badge&logo=assemblyscript&logoColor=white" alt="AssemblyScript"></a>
  <a href="https://x.com/hazae41/status/2001986156834267231"><img src="https://img.shields.io/badge/Commit_Convention-Daft-orange?style=for-the-badge" alt="Commit Convention: DAFT"></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/License-MIT-yellow.svg?style=for-the-badge" alt="License: MIT"></a>
</p>

<p align="center">
  <a href="https://github.com/ccamel/bobinerie/actions/workflows/build.yml"><img src="https://img.shields.io/github/actions/workflow/status/ccamel/bobinerie/build.yml?style=for-the-badge&label=build" alt="Build"></a>
  <a href="https://github.com/ccamel/bobinerie/actions/workflows/lint-code.yml"><img src="https://img.shields.io/github/actions/workflow/status/ccamel/bobinerie/lint-code.yml?style=for-the-badge&label=lint" alt="Lint"></a>
  <a href="https://github.com/ccamel/bobinerie/actions/workflows/deploy.yml"><img src="https://img.shields.io/github/actions/workflow/status/ccamel/bobinerie/deploy.yml?style=for-the-badge&label=deploy" alt="Deploy"></a>
  <a href="https://github.com/ccamel/bobinerie/actions/workflows/e2e.yml"><img src="https://img.shields.io/github/actions/workflow/status/ccamel/bobinerie/e2e.yml?style=for-the-badge&label=e2e%20tests" alt="E2E Tests"></a>
</p>

## Le Comptoir

Available now:

<!-- CONTRACTS:START -->

- **[counter](contracts/counter/README.md)** ![pedagogical](https://img.shields.io/badge/pedagogical-2EC4B6)
  > Per-account counter with Ed25519 session authentication.

- **[pool-xyk](contracts/pool-xyk/README.md)** ![defi](https://img.shields.io/badge/defi-6C63FF)
  > XYK (constant-product) AMM pool for two fungible tokens: add/remove liquidity, swap, fee in bps.

- **[say-my-name](contracts/say-my-name/README.md)** ![pedagogical](https://img.shields.io/badge/pedagogical-2EC4B6)
  > A simple name storage contract that remembers who you are.

- **[sigil](contracts/sigil/README.md)** ![creative](https://img.shields.io/badge/creative-FF9F1C)
  > Account-bound on-chain sigil (SVG PFP): mint one per derived address, optional on-chain tag.

- **[token_fungible](contracts/token_fungible/README.md)** ![defi](https://img.shields.io/badge/defi-6C63FF)
  > A minimal fungible token module for Bobine, designed to be a boring, reliable building block for DeFi modules (pools, routers, etc.).

<!-- CONTRACTS:END -->

## Le Manuel de l’Artisan

### Project Structure

```txt
bobinerie/
├── contracts/               # All the smart contracts
│   └── say-my-name/         # A single contract
│       ├── contract.feature # BDD tests (specifications)
│       ├── out/             # Compiled outputs (WASM + types)
│       ├── README.md        # Contract documentation
│       ├── src
│       │   ├── mod.ts
│       │   └── mods
│       │       └── mod.ts
│       └── tsconfig.json
├── run/                     # Deployment & execution scripts
└── package.json             # Build scripts
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
CONTRACT=say-my-name npm run contract:produce
# Returns: { address: "3ca2c27f..." }
```

Other common tasks:

- Build a single contract: `CONTRACT=say-my-name npm run contract:build`
- Produce all contracts: `npm run produce`
- Generate docs: `npm run docs`

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
