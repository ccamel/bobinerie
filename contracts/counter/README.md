# Counter ![pedagogical](https://img.shields.io/badge/pedagogical-2EC4B6)

Per-account counter with Ed25519 session authentication.

<!-- DEPLOYMENTS:START -->

## Deployments

- **garage-hazae41-bob0**: `378407ab5ff8fba8b0b2fc5c3912c20d3e431ab16805967cdf26358a8f0cf61e`
- **garage-ccamel-bob0**: `c6f1f6552341086e02553424d60534568b90353a766ed924712d4d8576577f7e`

<!-- DEPLOYMENTS:END -->

## Overview

Maintains isolated counters keyed by account address. Requires an Ed25519 session module for authentication and nonce management.

## Methods

<!-- METHODS:START -->

### 🔹 `add(session)`

Atomically increments the counter for the caller.

**Parameters:**

- `session` - Session packref [ed25519_module_address, pubkey]

**Returns:**

Incremented counter value

### 🔹 `reset(session)`

Reset the caller counter to zero.

**Parameters:**

- `session` - Session packref [ed25519_module_address, pubkey]

**Returns:**

Reset counter value

### 🔹 `value(session)`

Read the caller counter value.

**Parameters:**

- `session` - Session packref [ed25519_module_address, pubkey]

**Returns:**

Counter value

<!-- METHODS:END -->

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
SERVER=http://localhost:8080 # address of your Bobine node in your garage
```

The private key (`SIGKEY`) signs transactions. The public key (`PUBKEY`) identifies your account. The keypair enables cryptographic authentication without relying on external wallet infrastructure.

### Usage

```bash
# First call
npm run execute:sign <ed25519_module_address> <counter_module_address> add
# → 1

# Second call
npm run execute:sign <ed25519_module_address> <counter_module_address> add
# → 2

# Get current value
npm run execute:sign <ed25519_module_address> <counter_module_address> value
# → 2
```

## Use cases

- Session-based authentication with Ed25519
- Per-account state management
- Composable authentication modules
