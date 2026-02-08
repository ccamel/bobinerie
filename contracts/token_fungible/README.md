# Token Fungible ![defi](https://img.shields.io/badge/defi-6C63FF)

A minimal fungible token module for Bobine, designed to be a boring, reliable building block for DeFi modules (pools, routers, etc.).

<!-- DEPLOYMENTS:START -->

## Deployments

- **garage-hazae41-bob0**: `94048a29b26533637eda8fa9f53c6e1a66950b5f029c705adde9d1254da697eb`
- **garage-ccamel-bob0**: `94048a29b26533637eda8fa9f53c6e1a66950b5f029c705adde9d1254da697eb`

<!-- DEPLOYMENTS:END -->

## What you get

- **Balances**: hold tokens and transfer them.
- **Allowances**: approve a contract to spend on your behalf (DeFi pull model).
- **Total supply**: track minted minus burned.
- **Owner minting**: one address can mint (useful for testnets, faucets, and controlled supplies).

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
