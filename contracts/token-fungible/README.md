# Token Fungible ![defi](https://img.shields.io/badge/defi-6C63FF)

A minimal fungible token module for Bobine, designed to be a boring, reliable building block for DeFi modules (pools, routers, etc.).

<!-- DEPLOYMENTS:START -->

## Deployments

- **garage-hazae41-bob0**: `7fbd3265a35bc2192d4e2b9114ef1ee9596d04218bc58995453c03a4c464b255`
- **garage-ccamel-bob0**: `826e6897c9fcabfa3b14bede3edec60e6d950dff0df3ceaf3ea52e0cb44ac264`

<!-- DEPLOYMENTS:END -->

## What you get

- **Balances**: hold tokens and transfer them.
- **Allowances**: approve a contract to spend on your behalf (DeFi pull model).
- **Total supply**: track minted minus burned.
- **Owner minting**: one address can mint (useful for testnets, faucets, and controlled supplies).

## Usage Scenarios

<!-- FEATURES:START -->

As a user of the Bobine platform
I want fungible tokens with balances and allowances
So that I can mint, transfer, approve, and burn safely

These walkthroughs come from `contract.feature` scenarios tagged `@public-doc`.

### Shared Setup

This setup is applied before each published scenario.

Here are the steps:

- **Given** I deploy contract `"token-fungible"`; and I deploy contract `"ed25519"`; and I use auth module `"ed25519"`; and I have keys for `"Alice"`

- **When** I call `"$token-fungible"` method `"clone"` with param `"address:Alice"`

- **Then** the execution should succeed; and the returned value should be a `"string"`; and I remember last returned value as `"token-fungible"`

- **When** I call `"$token-fungible"` method `"init"` with param `"address:Alice"`

- **Then** the execution should succeed

### 1. Initial state after initialization

This scenario demonstrates a practical interaction sequence for this contract.

Here are the steps of the scenario:

- **Given** I have keys for `"Bob"`

- **When** I call `"$token-fungible"` method `"total_supply"`

- **Then** the execution should succeed; and the returned value should be `"bigint:0"`

- **When** I call `"$token-fungible"` method `"balance"` with param `"address:Alice"`

- **Then** the execution should succeed; and the returned value should be `"bigint:0"`

- **When** I call `"$token-fungible"` method `"balance"` with param `"address:Bob"`

- **Then** the execution should succeed; and the returned value should be `"bigint:0"`

- **When** I call `"$token-fungible"` method `"allowance"` with params:

  ```gherkin
  | address:Alice |
  | address:Bob |
  ```

- **Then** the execution should succeed; and the returned value should be `"bigint:0"`

### 2. Owner can mint and supply tracks balances

This scenario demonstrates a practical interaction sequence for this contract.

Here are the steps of the scenario:

- **When** I invoke `"$token-fungible"` method `"mint"` through auth with params:

  ```gherkin
  | address:Alice |
  | bigint:100 |
  ```

- **Then** the execution should succeed

- **When** I call `"$token-fungible"` method `"balance"` with param `"address:Alice"`

- **Then** the execution should succeed; and the returned value should be `"bigint:100"`

- **When** I call `"$token-fungible"` method `"total_supply"`

- **Then** the execution should succeed; and the returned value should be `"bigint:100"`

### 3. Transfer moves balances between users

This scenario demonstrates a practical interaction sequence for this contract.

Here are the steps of the scenario:

- **Given** I have keys for `"Bob"`; and I have keys for `"Alice"`

- **When** I invoke `"$token-fungible"` method `"mint"` through auth with params:

  ```gherkin
  | address:Alice |
  | bigint:100 |
  ```

- **Then** the execution should succeed

- **When** I invoke `"$token-fungible"` method `"transfer"` through auth with params:

  ```gherkin
  | address:Bob |
  | bigint:40 |
  ```

- **Then** the execution should succeed

- **When** I call `"$token-fungible"` method `"balance"` with param `"address:Alice"`

- **Then** the execution should succeed; and the returned value should be `"bigint:60"`

- **When** I call `"$token-fungible"` method `"balance"` with param `"address:Bob"`

- **Then** the execution should succeed; and the returned value should be `"bigint:40"`

- **When** I call `"$token-fungible"` method `"total_supply"`

- **Then** the execution should succeed; and the returned value should be `"bigint:100"`

### 4. Approve and transfer_from consume allowance

This scenario demonstrates a practical interaction sequence for this contract.

Here are the steps of the scenario:

- **Given** I have keys for `"Bob"`; and I have keys for `"Charlie"`; and I have keys for `"Alice"`

- **When** I invoke `"$token-fungible"` method `"mint"` through auth with params:

  ```gherkin
  | address:Alice |
  | bigint:100 |
  ```

- **Then** the execution should succeed

- **When** I invoke `"$token-fungible"` method `"approve"` through auth with params:

  ```gherkin
  | address:Bob |
  | bigint:30 |
  ```

- **Then** the execution should succeed

- **When** I call `"$token-fungible"` method `"allowance"` with params:

  ```gherkin
  | address:Alice |
  | address:Bob |
  ```

- **Then** the execution should succeed; and the returned value should be `"bigint:30"`

- **Given** I have keys for `"Bob"`

- **When** I invoke `"$token-fungible"` method `"transfer_from"` through auth with params:

  ```gherkin
  | address:Alice |
  | address:Charlie |
  | bigint:20 |
  ```

- **Then** the execution should succeed

- **When** I call `"$token-fungible"` method `"allowance"` with params:

  ```gherkin
  | address:Alice |
  | address:Bob |
  ```

- **Then** the execution should succeed; and the returned value should be `"bigint:10"`

- **When** I call `"$token-fungible"` method `"balance"` with param `"address:Alice"`

- **Then** the execution should succeed; and the returned value should be `"bigint:80"`

- **When** I call `"$token-fungible"` method `"balance"` with param `"address:Charlie"`

- **Then** the execution should succeed; and the returned value should be `"bigint:20"`

- **When** I call `"$token-fungible"` method `"total_supply"`

- **Then** the execution should succeed; and the returned value should be `"bigint:100"`

### 5. Burn reduces balance and total supply

This scenario demonstrates a practical interaction sequence for this contract.

Here are the steps of the scenario:

- **When** I invoke `"$token-fungible"` method `"mint"` through auth with params:

  ```gherkin
  | address:Alice |
  | bigint:100 |
  ```

- **Then** the execution should succeed

- **When** I invoke `"$token-fungible"` method `"burn"` through auth with param `"bigint:40"`

- **Then** the execution should succeed

- **When** I call `"$token-fungible"` method `"balance"` with param `"address:Alice"`

- **Then** the execution should succeed; and the returned value should be `"bigint:60"`

- **When** I call `"$token-fungible"` method `"total_supply"`

- **Then** the execution should succeed; and the returned value should be `"bigint:60"`

<!-- FEATURES:END -->

## Methods

<!-- METHODS:START -->

### 🔹 `allowance(owner, spender)`

Read the remaining allowance from an owner to a spender.

**Parameters:**

- `owner` - Address that granted the allowance.
- `spender` - Address allowed to spend.

**Returns:**

Remaining allowance (0 if absent).

### 🔹 `approve(session, spender, amount)`

Set the allowance for a spender.

The caller (derived from the session) becomes the allowance owner.
This uses a reset-to-zero safety rule: changing a non-zero allowance to another
non-zero value is rejected. Set it to 0 first, then set the new value.

**Parameters:**

- `session` - A valid session whose verified identity is the caller (owner).
- `spender` - Address allowed to spend.
- `amount` - New allowance amount.

### 🔹 `balance(target)`

Read the token balance of an address.

**Parameters:**

- `target` - Address to query.

**Returns:**

Current balance (0 if absent).

### 🔹 `burn(session, amount)`

Burn tokens from the caller.

The caller is derived from the provided session.
This decreases both the caller balance and the total supply.

**Parameters:**

- `session` - A valid session whose verified identity is the caller.
- `amount` - Amount to burn.

### 🔹 `clone(creator)`

Clone this module (same code) and set `creator` as the new module creator.

This returns the address/id of the newly created module.

**Parameters:**

- `creator` - The address that will be stored as the owner when the cloned module is initialized.

**Returns:**

The new module address/id.

### 🔹 `init(creator)`

Initialize the token instance.

This function is intended to be called once, right after deployment.
It performs a deterministic self-check to ensure the module address matches
the code + creator tuple, then stores the owner.

**Parameters:**

- `creator` - The address that becomes the token owner (allowed to mint).

### 🔹 `mint(session, target, amount)`

Mint tokens to an address.

Only the token owner can mint. The caller is derived from the provided session.
This increases both the recipient balance and the total supply.

**Parameters:**

- `session` - A valid session whose verified identity is the caller.
- `target` - Recipient address.
- `amount` - Amount to mint.

### 🔹 `total_supply()`

Read the total token supply.

**Returns:**

Total supply (0 if absent).

### 🔹 `transfer(session, target, amount)`

Transfer tokens from the caller to a target.

The caller is derived from the provided session.
This moves balance from caller to target.

**Parameters:**

- `session` - A valid session whose verified identity is the caller.
- `target` - Recipient address.
- `amount` - Amount to transfer.

### 🔹 `transfer_from(session, owner, target, amount)`

Transfer tokens on behalf of an owner, consuming allowance.

The caller (derived from the session) is the spender.
This decreases the allowance (owner -> spender) and moves balance from owner to target.

**Parameters:**

- `session` - A valid session whose verified identity is the spender.
- `owner` - Address whose funds are moved.
- `target` - Recipient address.
- `amount` - Amount to transfer.

<!-- METHODS:END -->
