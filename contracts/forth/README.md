# Forth ![work-in-progress](https://img.shields.io/badge/status-wip-F4A261)

On-chain Forth interpreter contract for Bobine.

<!-- DEPLOYMENTS:START -->

<!-- DEPLOYMENTS:END -->

## Overview

This module implements a Forth interpreter that can be used to execute Forth programs on-chain. It includes the following features:

- deterministic module self-check at initialization
- clone entrypoint to instantiate creator-bound module instances
- linear Forth tokenizer/classifier (numbers vs dictionary words)

## Methods

<!-- METHODS:START -->

### 🔹 `blob_hash()`

Get the hash of the canonical compiled blob.

**Returns:**

Hex-encoded blob hash, or `null` if not initialized.

### 🔹 `clone(creator)`

Clone this module (same code) and set `creator` as the new module creator.

**Parameters:**

- `creator` - The creator address for the cloned module.

**Returns:**

The new module address/id.

### 🔹 `init(creator, program)`

Initialize the forth module instance by checking creator-derived self address
and compiling the provided Forth program.

**Parameters:**

- `creator` - Creator address.
- `program` - Forth source code.

### 🔹 `run(input_stack)`

Execute the stored compiled program with an input stack.

**Parameters:**

- `input_stack` - Input stack values as pack of BigInt references.

**Returns:**

Output stack values as pack of BigInt references.

### 🔹 `source_hash()`

Get the hash of the source program exactly as provided to `init`.

**Returns:**

Hex-encoded source hash, or `null` if not initialized.

<!-- METHODS:END -->
