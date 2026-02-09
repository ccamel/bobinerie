# Say My Name ![pedagogical](https://img.shields.io/badge/pedagogical-2EC4B6)

A simple name storage contract that remembers who you are.

<!-- DEPLOYMENTS:START -->

## Deployments

- **garage-hazae41-bob0**: `d9fb78a305f52edbb065318a7c5681358559c8a56b0031f4a97198267be6df89`
- **garage-ccamel-bob0**: `d9fb78a305f52edbb065318a7c5681358559c8a56b0031f4a97198267be6df89`

<!-- DEPLOYMENTS:END -->

## What it does

This contract stores a name in its persistent storage. Each time you call it:

- It greets you with "Hello, [your name]!"
- It returns the previous stored name (or null if none)
- It saves your new name for next time

## Usage Scenarios

<!-- FEATURES:START -->

As a user of the Bobine platform
I want to store and retrieve my name
So that the contract remembers who I am

These walkthroughs come from `contract.feature` scenarios tagged `@public-doc`.

### Shared Setup

This setup is applied before each published scenario.

Here are the steps:

- **Given** I deploy contract `"say-my-name"`

### 1. Set my name for the first time

This scenario demonstrates a practical interaction sequence for this contract.

Here are the steps of the scenario:

- **When** I call `"say-my-name"` method `"say_my_name"` with param `"text:Alice"`

- **Then** the execution should succeed; and the returned value should be `""`

### 2. Retrieve my name after setting it

This scenario demonstrates a practical interaction sequence for this contract.

Here are the steps of the scenario:

- **When** I call `"say-my-name"` method `"say_my_name"` with param `"text:Bob"`

- **Then** the execution should succeed; and the returned value should be `""`

- **When** I call `"say-my-name"` method `"say_my_name"` with param `"text:Charlie"`

- **Then** the execution should succeed; and the returned value should be `"Bob"`

### 3. Update my name

This scenario demonstrates a practical interaction sequence for this contract.

Here are the steps of the scenario:

- **When** I call `"say-my-name"` method `"say_my_name"` with param `"text:Charlie"`

- **Then** the execution should succeed; and the returned value should be `""`

- **When** I call `"say-my-name"` method `"say_my_name"` with param `"text:David"`

- **Then** the execution should succeed; and the returned value should be `"Charlie"`

- **When** I call `"say-my-name"` method `"say_my_name"` with param `"text:Eve"`

- **Then** the execution should succeed; and the returned value should be `"David"`

<!-- FEATURES:END -->

## Methods

<!-- METHODS:START -->

### 🔹 `say_my_name(name)`

Say your name and the contract will remember it.

**Parameters:**

- `name` - Your name as a text string

**Returns:**

The previously stored name, or `null` if this is the first call

<!-- METHODS:END -->

## Examples

```bash
# First call
npm run execute <address> sayMyName text:"Alice"
# Logs: "Hello, Alice!"
# Returns: null

# Second call
npm run execute <address> sayMyName text:"Bob"
# Logs: "Hello, Bob!"
# Returns: "Alice"
```

## Use cases

- Learning Bobine basics
- Testing persistent storage
- Template for simple state management
- Just saying your name and being remembered
