# Forth ![work-in-progress](https://img.shields.io/badge/status-wip-F4A261)

On-chain Forth interpreter contract for Bobine.

<!-- DEPLOYMENTS:START -->

<!-- DEPLOYMENTS:END -->

## Overview

This contract is being implemented incrementally.

Current scope:

- deterministic module self-check at initialization
- clone entrypoint to instantiate creator-bound module instances

## Methods

<!-- METHODS:START -->

### 🔹 `clone(creator)`

Clone this module (same code) and set `creator` as the new module creator.

**Parameters:**

- `creator` - The creator address for the cloned module.

**Returns:**

The new module address/id.

### 🔹 `init(creator)`

Initialize the forth module instance by checking creator-derived self address.

**Parameters:**

- `creator` - Creator address.

<!-- METHODS:END -->
