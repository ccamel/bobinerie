# Say My Name

A simple name storage contract that remembers who you are.

## What it does

This contract stores a name in its persistent storage. Each time you call it:

- It greets you with "Hello, [your name]!"
- It returns the previous stored name (or null if none)
- It saves your new name for next time

## Methods

### `sayMyName(name: string) -> string | null`

Say your name and the contract will remember it.

**Parameters:**

- `name` - Your name as a text string

**Returns:**

- The previously stored name, or `null` if this is the first call

**Example:**

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
