# Forth ![vm](https://img.shields.io/badge/vm-3A86FF)

On-chain Forth interpreter contract for Bobine.

<!-- DEPLOYMENTS:START -->

## Deployments

- **garage-hazae41-bob0**: `eb0a408de3a9e762b7078321cee64510a2e0f53ae9b91ce0b821d2e364f8895f`
- **garage-ccamel-bob0**: `eb0a408de3a9e762b7078321cee64510a2e0f53ae9b91ce0b821d2e364f8895f`

<!-- DEPLOYMENTS:END -->

## Overview

This module implements a compact on-chain Forth compiler and VM for Bobine. It includes the following features:

- deterministic module self-check at initialization
- clone entrypoint to instantiate creator-bound module instances
- linear Forth tokenizer and compiler
- canonical compiled program blob persisted in storage
- source and blob hashes exposed for auditability
- stack-based VM with arithmetic, comparisons, booleans, calls, and control flow

## Usage Scenarios

<!-- FEATURES:START -->

As a user of the Bobine platform
I want to run a forth program on chain
So that deterministic stack-based logic can execute in a contract

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

### 4. Execute case-insensitive user-defined word

This scenario demonstrates a practical interaction sequence for this contract.

Here are the steps of the scenario:

- **Given** I deploy contract `"forth"`

- **When** I call `"forth"` method `"init"` with params:

  ```gherkin
  | $forth_creator                              |
  | text:: SquAre DUP * ; : MAIN square ;      |
  ```

- **Then** the execution should succeed

- **When** I call `"forth"` method `"run"` with param `"pack:[bigint:8]"`

- **Then** the execution should succeed; and the returned value should be `"bigint:64"`

### 5. Execute normalized integer literals

This scenario demonstrates a practical interaction sequence for this contract.

Here are the steps of the scenario:

- **Given** I deploy contract `"forth"`

- **When** I call `"forth"` method `"init"` with params:

  ```gherkin
  | $forth_creator                    |
  | text:: MAIN +001 -0 + +002 + ;   |
  ```

- **Then** the execution should succeed

- **When** I call `"forth"` method `"run"` with param `"pack:[]"`

- **Then** the execution should succeed; and the returned value should be `"bigint:3"`

### 6. Execute IF THEN conditional

This scenario demonstrates a practical interaction sequence for this contract.

Here are the steps of the scenario:

- **Given** I deploy contract `"forth"`

- **When** I call `"forth"` method `"init"` with params:

  ```gherkin
  | $forth_creator                  |
  | text:: MAIN 0 IF 7 THEN 9 ;     |
  ```

- **Then** the execution should succeed

- **When** I call `"forth"` method `"run"` with param `"pack:[]"`

- **Then** the execution should succeed; and the returned value should be `"bigint:9"`

### 7. Execute IF ELSE THEN conditional

This scenario demonstrates a practical interaction sequence for this contract.

Here are the steps of the scenario:

- **Given** I deploy contract `"forth"`

- **When** I call `"forth"` method `"init"` with params:

  ```gherkin
  | $forth_creator                       |
  | text:: MAIN 0 IF 7 ELSE 9 THEN ;    |
  ```

- **Then** the execution should succeed

- **When** I call `"forth"` method `"run"` with param `"pack:[]"`

- **Then** the execution should succeed; and the returned value should be `"bigint:9"`

### 8. Execute MAX program on two inputs

This scenario demonstrates a practical interaction sequence for this contract.

Here are the steps of the scenario:

- **Given** I deploy contract `"forth"`

- **When** I call `"forth"` method `"init"` with params:

  ```gherkin
  | $forth_creator                                     |
  | text:: MAX 2DUP < IF SWAP THEN DROP ; : MAIN MAX ; |
  ```

- **Then** the execution should succeed

- **When** I call `"forth"` method `"run"` with param `"pack:[bigint:7,bigint:9]"`

- **Then** the execution should succeed; and the returned value should be `"bigint:9"`

### 9. Execute BEGIN UNTIL loop to sum integers

This scenario demonstrates a practical interaction sequence for this contract.

Here are the steps of the scenario:

- **Given** I deploy contract `"forth"`

- **When** I call `"forth"` method `"init"` with params:

  ```gherkin
  | $forth_creator                                                                  |
  | text:: SUMDOWN 0 SWAP BEGIN SWAP OVER + SWAP 1 - DUP 0= UNTIL DROP ; : MAIN SUMDOWN ; |
  ```

- **Then** the execution should succeed

- **When** I call `"forth"` method `"run"` with param `"pack:[bigint:4]"`

- **Then** the execution should succeed; and the returned value should be `"bigint:10"`

### 10. Execute BEGIN WHILE REPEAT loop to sum integers

This scenario demonstrates a practical interaction sequence for this contract.

Here are the steps of the scenario:

- **Given** I deploy contract `"forth"`

- **When** I call `"forth"` method `"init"` with params:

  ```gherkin
  | $forth_creator                                                                  |
  | text:: SUMPOS 0 SWAP BEGIN DUP 0 SWAP < WHILE SWAP OVER + SWAP 1 - REPEAT DROP ; : MAIN SUMPOS ; |
  ```

- **Then** the execution should succeed

- **When** I call `"forth"` method `"run"` with param `"pack:[bigint:4]"`

- **Then** the execution should succeed; and the returned value should be `"bigint:10"`

### 11. Execute extended comparison operators

This scenario demonstrates a practical interaction sequence for this contract.

Here are the steps of the scenario:

- **Given** I deploy contract `"forth"`

- **When** I call `"forth"` method `"init"` with params:

  ```gherkin
  | $forth_creator                                   |
  | text:: MAIN 5 3 > 5 5 >= + 3 5 <= + 4 5 <> + ;   |
  ```

- **Then** the execution should succeed

- **When** I call `"forth"` method `"run"` with param `"pack:[]"`

- **Then** the execution should succeed; and the returned value should be `"bigint:4"`

### 12. Execute boolean operators on truthy values

This scenario demonstrates a practical interaction sequence for this contract.

Here are the steps of the scenario:

- **Given** I deploy contract `"forth"`

- **When** I call `"forth"` method `"init"` with params:

  ```gherkin
  | $forth_creator                                       |
  | text:: MAIN 0 NOT 7 NOT + 2 3 AND + 0 5 OR + ;       |
  ```

- **Then** the execution should succeed

- **When** I call `"forth"` method `"run"` with param `"pack:[]"`

- **Then** the execution should succeed; and the returned value should be `"bigint:3"`

### 13. Execute swap policy guard

This scenario demonstrates a practical interaction sequence for this contract.

Here are the steps of the scenario:

- **Given** I deploy contract `"forth"`

- **When** I call `"forth"` method `"init"` with params:

  ```gherkin
  | $forth_creator                                                                        |
  | text:: SLIPPAGE-OK >= ; : FEE-OK <= ; : MAIN SLIPPAGE-OK -ROT FEE-OK AND ;           |
  ```

- **Then** the execution should succeed

- **When** I call `"forth"` method `"run"` with param `"pack:[bigint:30,bigint:50,bigint:1000,bigint:980]"`

- **Then** the execution should succeed; and the returned value should be `"bigint:1"`

- **When** I call `"forth"` method `"run"` with param `"pack:[bigint:60,bigint:50,bigint:1000,bigint:980]"`

- **Then** the execution should succeed; and the returned value should be `"bigint:0"`

### 14. Source and blob hashes are exposed after initialization

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
