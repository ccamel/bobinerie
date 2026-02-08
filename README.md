# La Bobinerie

![Bobinerie Banner](banner.webp)

> 🧵 _La Bobinerie_ - Haberdashery of [Bobine](https://bobine.tech) modules: serious primitives, educational gems, and esoteric oddities. Grab, deploy, fork at will.

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

<p align="center">⸟</p>

<p align="center">
  <a href="https://github.com/ccamel/bobinerie/actions/workflows/build.yml"><img src="https://img.shields.io/github/actions/workflow/status/ccamel/bobinerie/build.yml?label=build" alt="Build"></a>
  <a href="https://github.com/ccamel/bobinerie/actions/workflows/lint-code.yml"><img src="https://img.shields.io/github/actions/workflow/status/ccamel/bobinerie/lint-code.yml?label=lint" alt="Lint"></a>
  <a href="https://github.com/ccamel/bobinerie/actions/workflows/deploy.yml"><img src="https://img.shields.io/github/actions/workflow/status/ccamel/bobinerie/deploy.yml?label=deploy" alt="Deploy"></a>
  <a href="https://github.com/ccamel/bobinerie/actions/workflows/e2e.yml"><img src="https://img.shields.io/github/actions/workflow/status/ccamel/bobinerie/e2e.yml?label=e2e%20tests" alt="E2E Tests"></a>
  <a href="https://codecov.io/gh/ccamel/bobinerie" ><img src="https://codecov.io/gh/ccamel/bobinerie/graph/badge.svg?token=IV25dGbvWg" alt="Codecov"/></a>
</p>

## Le Comptoir

Available now:

<!-- CONTRACTS:START -->

<table>
<tr>
<td width="50%" valign="top">
<h3><a href="contracts/counter/README.md">Counter</a></h3>
<p><strong>Per-account counter with Ed25519 session authentication.</strong></p>
<p><img alt="pedagogical" src="https://img.shields.io/badge/pedagogical-2EC4B6" /></p>
<p>》<a href="contracts/counter/README.md">open doc</a></p>
</td>
<td width="50%" valign="top">
<h3><a href="contracts/multisig/README.md">Multisig</a></h3>
<p><strong>Threshold-based authorization contract for Bobine call execution.</strong></p>
<p><img alt="governance" src="https://img.shields.io/badge/governance-FF6B35" /></p>
<p>》<a href="contracts/multisig/README.md">open doc</a></p>
</td>
</tr>
<tr>
<td width="50%" valign="top">
<h3><a href="contracts/pool-xyk/README.md">Pool XYK</a></h3>
<p><strong>XYK (constant-product) AMM pool for two fungible tokens: add/remove liquidity, swap, fee in bps.</strong></p>
<p><img alt="defi" src="https://img.shields.io/badge/defi-6C63FF" /></p>
<p>》<a href="contracts/pool-xyk/README.md">open doc</a></p>
</td>
<td width="50%" valign="top">
<h3><a href="contracts/say-my-name/README.md">Say My Name</a></h3>
<p><strong>A simple name storage contract that remembers who you are.</strong></p>
<p><img alt="pedagogical" src="https://img.shields.io/badge/pedagogical-2EC4B6" /></p>
<p>》<a href="contracts/say-my-name/README.md">open doc</a></p>
</td>
</tr>
<tr>
<td width="50%" valign="top">
<h3><a href="contracts/sigil/README.md">Sigil</a></h3>
<p><strong>Account-bound on-chain sigil (SVG PFP): mint one per derived address, optional on-chain tag.</strong></p>
<p><img alt="creative" src="https://img.shields.io/badge/creative-FF9F1C" /></p>
<p>》<a href="contracts/sigil/README.md">open doc</a></p>
</td>
<td width="50%" valign="top">
<h3><a href="contracts/token_fungible/README.md">Token Fungible</a></h3>
<p><strong>A minimal fungible token module for Bobine, designed to be a boring, reliable building block for DeFi modules (pools, routers, etc.).</strong></p>
<p><img alt="defi" src="https://img.shields.io/badge/defi-6C63FF" /></p>
<p>》<a href="contracts/token_fungible/README.md">open doc</a></p>
</td>
</tr>
</table>

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
- Run tests: `npm run test`
- Run tests with coverage: `npm run test:coverage` (measures test infrastructure, not WASM contract code)

Execute a contract method:

```bash
npm run execute 3ca2c27f... sayMyName text:"Alice"
```

## Avis aux artisans

Got a useful contract? An intriguing experiment? Put it on the shelves.

1. Create your contract in `contracts/your-contract-name/`
2. Write comprehensive [cucumber BDD](https://cucumber.io/) tests in `contracts/your-contract-name/contract.feature`
3. Add [JSDoc](https://jsdoc.app/) documentation to all public API functions
4. Run `npm run docs` to generate the READMEs
5. Submit a PR

All contributions welcome, from serious primitives to silly meme contracts.
