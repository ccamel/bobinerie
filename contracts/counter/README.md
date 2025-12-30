# Counter

A simple counter contract that increments on each call.

## What it does

This contract maintains a persistent counter. Each time you call it:

- It increments the counter by 1
- It returns the new counter value
- It stores the updated value for the next call

## Methods

<!-- METHODS:START -->

### `add()`

Increment and return the counter value.

**Returns:**

The new counter value after incrementing

<!-- METHODS:END -->

## Examples

```bash
# First call
npm run execute <address> add
# Returns: 1

# Second call
npm run execute <address> add
# Returns: 2

# Third call
npm run execute <address> add
# Returns: 3
```

## Use cases

- Learning [Bobine](https://bobine.tech) basics
- Testing persistent storage
- Tracking invocation counts
- Simple state management example
