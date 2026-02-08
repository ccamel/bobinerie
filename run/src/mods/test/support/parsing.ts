import type { BobineWorld } from "./world"

function reconstructUint8Array(value: unknown): unknown {
  if (value === null || value === undefined) return value
  if (value instanceof Uint8Array) return value

  if (Array.isArray(value)) {
    if (
      value.length === 1 &&
      typeof value[0] === "object" &&
      value[0] !== null
    ) {
      const obj = value[0] as Record<string, unknown>
      const keys = Object.keys(obj)
      const isUint8ArrayLike = keys.every((k) => /^\d+$/.test(k))
      if (isUint8ArrayLike && keys.length > 0) {
        const maxIndex = Math.max(...keys.map(Number))
        const arr = new Uint8Array(maxIndex + 1)
        for (let i = 0; i <= maxIndex; i++) {
          arr[i] = (obj[i.toString()] as number) ?? 0
        }
        return arr
      }
    }
    return value.map(reconstructUint8Array)
  }

  if (typeof value === "object" && value !== null) {
    const keys = Object.keys(value)
    const isUint8ArrayLike = keys.every((k) => /^\d+$/.test(k))
    if (isUint8ArrayLike && keys.length > 0) {
      const obj = value as Record<string, number>
      const maxIndex = Math.max(...keys.map(Number))
      const arr = new Uint8Array(maxIndex + 1)
      for (let i = 0; i <= maxIndex; i++) {
        arr[i] = obj[i.toString()] ?? 0
      }
      return arr
    }
  }

  return value
}

export function parsePackLiteral(
  world: BobineWorld,
  content: string,
  parseValue: (world: BobineWorld, token: string) => unknown,
): unknown[] {
  if (!content.trim()) {
    return []
  }

  const items: string[] = []
  let current = ""
  let depth = 0

  for (let i = 0; i < content.length; i++) {
    const char = content[i]

    if (char === "[") {
      depth++
      current += char
    } else if (char === "]") {
      depth--
      current += char
    } else if (char === "," && depth === 0) {
      if (current.trim()) {
        items.push(current.trim())
      }
      current = ""
    } else {
      current += char
    }
  }

  if (current.trim()) {
    items.push(current.trim())
  }

  return items.map((item) => parseValue(world, item))
}

type VariableLookupResult = { found: false } | { found: true; value: unknown }

function parseVariableKey(trimmed: string): string | null {
  if (!trimmed.startsWith("$")) {
    return null
  }
  if (trimmed.startsWith("${") && trimmed.endsWith("}")) {
    const key = trimmed.slice(2, -1).trim()
    return key.length > 0 ? key : null
  }
  const key = trimmed.slice(1).trim()
  return key.length > 0 ? key : null
}

export function resolveVariableToken(
  world: BobineWorld,
  token: string,
): VariableLookupResult {
  const trimmed = token.trim()
  const key = parseVariableKey(trimmed)
  if (!key) {
    return { found: false }
  }

  if (world.savedValues.has(key)) {
    const value = world.savedValues.get(key)
    return { found: true, value: reconstructUint8Array(value) }
  }

  const contract = world.contractStates.get(key)
  if (contract?.produced && contract.moduleAddress) {
    return { found: true, value: contract.moduleAddress }
  }

  throw new Error(`No variable found for key: ${key}`)
}

export function parseValueWithCommon(
  world: BobineWorld,
  token: string,
  parseValue: (world: BobineWorld, token: string) => unknown,
): unknown {
  const trimmed = token.trim()
  if (!trimmed || trimmed === "null") {
    return null
  }

  const variable = resolveVariableToken(world, token)
  if (variable.found) {
    return variable.value
  }

  if (trimmed.startsWith("pack:[")) {
    if (!trimmed.endsWith("]")) {
      throw new Error(`Invalid pack syntax: ${trimmed}`)
    }
    const content = trimmed.slice("pack:[".length, -1)
    return parsePackLiteral(world, content, parseValue)
  }
  if (trimmed.startsWith("address:")) {
    const key = trimmed.slice("address:".length)
    const address = world.userAddresses.get(key)
    if (!address) {
      throw new Error(`Unknown address for ${key}`)
    }
    return address
  }
  if (trimmed.startsWith("blob:")) {
    return Uint8Array.fromHex(trimmed.slice("blob:".length))
  }
  if (trimmed.startsWith("bigint:")) {
    return BigInt(trimmed.slice("bigint:".length))
  }
  if (trimmed.startsWith("number:")) {
    return Number(trimmed.slice("number:".length))
  }
  if (trimmed.startsWith("text:")) {
    return trimmed.slice("text:".length)
  }
  return null
}
