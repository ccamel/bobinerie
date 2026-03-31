# Forth ![work-in-progress](https://img.shields.io/badge/status-wip-F4A261)

On-chain Forth interpreter contract for Bobine.

<!-- DEPLOYMENTS:START -->

<!-- DEPLOYMENTS:END -->

## Overview

This module implements a Forth interpreter that can be used to execute Forth programs on-chain. It includes the following features:

- deterministic module self-check at initialization
- clone entrypoint to instantiate creator-bound module instances
- linear Forth tokenizer/classifier (numbers vs dictionary words)

## Usage Scenarios

<!-- FEATURES:START -->

As a user of the Bobine platform
I want to run a forth program on chain
So that deterministic stack-based logic can execute in a contract

These walkthroughs come from `contract.feature` scenarios tagged `@public-doc`.

### 1. Execute minimal arithmetic program

This scenario demonstrates a practical interaction sequence for this contract.

Here are the steps of the scenario:

- **Given** I deploy contract `"forth"`

- **When** I call `"forth"` method `"init"` with params:

  ```gherkin
  | $forth_creator         |
  | text:: MAIN 2 3 + ;    |
  ```

- **Then** the execution should succeed

- **When** I call `"forth"` method `"run"` with param `"pack:[]"`

- **Then** the execution should succeed; and the returned value should be `"bigint:5"`

### 2. Execute user-defined word from MAIN

This scenario demonstrates a practical interaction sequence for this contract.

Here are the steps of the scenario:

- **Given** I deploy contract `"forth"`

- **When** I call `"forth"` method `"init"` with params:

  ```gherkin
  | $forth_creator                        |
  | text:: SQUARE DUP * ; : MAIN SQUARE ; |
  ```

- **Then** the execution should succeed

- **When** I call `"forth"` method `"run"` with param `"pack:[bigint:9]"`

- **Then** the execution should succeed; and the returned value should be `"bigint:81"`

### 3. Execute case-insensitive program with parenthesized comment

This scenario demonstrates a practical interaction sequence for this contract.

Here are the steps of the scenario:

- **Given** I deploy contract `"forth"`

- **When** I call `"forth"` method `"init"` with params:

  ```gherkin
  | $forth_creator                               |
  | text:: MAIN ( comment ) 7 DUP * ;           |
  ```

- **Then** the execution should succeed

- **When** I call `"forth"` method `"run"` with param `"pack:[]"`

- **Then** the execution should succeed; and the returned value should be `"bigint:49"`

### 4. Source and blob hashes are exposed after initialization

This scenario demonstrates a practical interaction sequence for this contract.

Here are the steps of the scenario:

- **Given** I deploy contract `"forth"`

- **When** I call `"forth"` method `"init"` with params:

  ```gherkin
  | $forth_creator      |
  | text:: MAIN 4 5 + ; |
  ```

- **Then** the execution should succeed

- **When** I call `"forth"` method `"source_hash"`

- **Then** the execution should succeed; and the returned value should be a `"string"`

- **When** I call `"forth"` method `"blob_hash"`

- **Then** the execution should succeed; and the returned value should be a `"string"`

<!-- FEATURES:END -->

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
