# Say My Name ![pedagogical](https://img.shields.io/badge/pedagogical-2EC4B6)

A simple name storage contract that remembers who you are.

<!-- DEPLOYMENTS:START -->

## Deployments

- **garage-hazae41-bob0**: `d9fb78a305f52edbb065318a7c5681358559c8a56b0031f4a97198267be6df89`
- **garage-ccamel-bob0**: `49ce664357bd4a3c90ac47ae63441ceff70e22d3c3e530f593b8f32770fcdbc6`

<!-- DEPLOYMENTS:END -->

## What it does

This contract stores a name in its persistent storage. Each time you call it:

- It greets you with "Hello, [your name]!"
- It returns the previous stored name (or null if none)
- It saves your new name for next time

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
