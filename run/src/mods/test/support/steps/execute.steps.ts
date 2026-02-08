import { DataTable, When } from "@cucumber/cucumber"
import { Readable, Writable } from "@hazae41/binary"
import { type Packable, Packed } from "../../../../libs/packed/mod.ts"
import { parseValueWithCommon, resolveVariableToken } from "../parsing"
import { BobineWorld } from "../world"

const AUTH_DOMAIN_ID = "17fa1cb5-c5af-4cfd-9bea-1a36590b890d"

function parseParamValue(world: BobineWorld, token: string): Packable {
  const result = parseValueWithCommon(world, token, parseParamValue)
  if (result !== null) {
    return result as Packable
  }
  throw new Error(`Unknown value type: ${token}`)
}

function parseParams(world: BobineWorld, tokens: string[]): Packable[] {
  return tokens.map((token) => parseParamValue(world, token))
}

function parseParamsTable(world: BobineWorld, table: DataTable): Packable[] {
  const rows = table.raw()
  if (rows.length === 0) {
    return []
  }

  const tokens: string[] = []
  for (const row of rows) {
    if (row.length !== 1) {
      throw new Error("Param table must have exactly one column")
    }
    tokens.push(row[0])
  }

  return parseParams(world, tokens)
}

type ModuleExecution = {
  ok: boolean
  logs: string[]
  returned: Packable | null
  error?: string
}

function isNullResponse(bytes: Uint8Array): boolean {
  return (
    bytes.length === 4 &&
    bytes[0] === 110 &&
    bytes[1] === 117 &&
    bytes[2] === 108 &&
    bytes[3] === 108
  )
}

function extractErrorMessage(errorText: string): string {
  try {
    const parsed = JSON.parse(errorText)
    if (parsed.message) {
      return parsed.message
    }
  } catch {
    // Not JSON, return as-is
  }
  return errorText
}

function parsePackedResponse(bytes: Uint8Array): {
  logs: string[]
  returned: Packable | null
} {
  if (isNullResponse(bytes)) {
    return { logs: [], returned: null }
  }

  const result = Readable.readFromBytesOrThrow(Packed, bytes) as unknown[]
  const [_logs, _reads, _writes, _returned, _sparks] = result as [
    string[],
    unknown,
    unknown,
    Packable,
    unknown,
  ]

  return {
    logs: _logs,
    returned: _returned,
  }
}

async function parseExecutionResponse(
  response: Response,
): Promise<ModuleExecution> {
  const bytes = new Uint8Array(await response.arrayBuffer())
  const fallbackText = new TextDecoder().decode(bytes).trim()

  if (!response.ok) {
    const errorMsg = extractErrorMessage(
      fallbackText || `Status ${response.status}`,
    )
    try {
      const parsed = parsePackedResponse(bytes)
      return {
        ok: false,
        logs: parsed.logs,
        returned: parsed.returned,
        error: errorMsg,
      }
    } catch (_error) {
      return {
        ok: false,
        logs: [],
        returned: null,
        error: errorMsg,
      }
    }
  }

  try {
    const parsed = parsePackedResponse(bytes)
    return {
      ok: true,
      logs: parsed.logs,
      returned: parsed.returned,
    }
  } catch (error) {
    return {
      ok: false,
      logs: [],
      returned: null,
      error: extractErrorMessage(fallbackText || String(error)),
    }
  }
}

async function executeModule(
  world: BobineWorld,
  moduleAddress: string,
  method: string,
  params: Packable[],
): Promise<ModuleExecution> {
  try {
    const body = new FormData()
    body.append("module", moduleAddress)
    body.append("method", method)
    body.append(
      "params",
      new Blob([Writable.writeToBytesOrThrow(new Packed(params))]),
    )
    body.append("effort", new Blob([world.nextSpark()]))

    const response = await fetch(new URL("/api/execute", world.serverUrl), {
      method: "POST",
      headers: { Accept: "application/octet-stream" },
      body,
    })
    return await parseExecutionResponse(response)
  } catch (error) {
    return {
      ok: false,
      logs: [],
      returned: null,
      error: String(error),
    }
  }
}

async function callContract(
  world: BobineWorld,
  contractName: string,
  method: string,
  params: Packable[],
): Promise<void> {
  const trimmedName = contractName.trim()
  const resolved = resolveVariableToken(world, trimmedName)
  const moduleAddress = resolved.found
    ? resolved.value
    : world.getProducedModuleAddress(trimmedName)

  if (typeof moduleAddress !== "string") {
    throw new Error(
      `Contract reference ${contractName} did not resolve to an address`,
    )
  }

  try {
    const body = new FormData()
    body.append("module", moduleAddress)
    body.append("method", method)
    body.append(
      "params",
      new Blob([Writable.writeToBytesOrThrow(new Packed(params))]),
    )
    body.append("effort", new Blob([world.nextSpark()]))

    const response = await fetch(new URL("/api/execute", world.serverUrl), {
      method: "POST",
      headers: { Accept: "application/octet-stream" },
      body,
    })
    const parsed = await parseExecutionResponse(response)
    world.lastExecutionResult = {
      success: parsed.ok,
      logs: parsed.logs,
      returned: parsed.returned,
      error: parsed.error,
    }

    console.log(`✅ Executed ${method} on ${contractName}`)
    if (parsed.logs && Array.isArray(parsed.logs) && parsed.logs.length > 0) {
      console.log("   Logs:", parsed.logs.join(", "))
    }
  } catch (error) {
    world.lastExecutionResult = {
      success: false,
      logs: [],
      returned: null,
      error: String(error),
    }
    console.log(`❌ Execution failed: ${error}`)
  }
}

async function invokeContractThroughAuth(
  world: BobineWorld,
  contractName: string,
  method: string,
  params: Packable[],
): Promise<void> {
  if (!world.sessionKeys) {
    throw new Error("No session keys found")
  }

  const authModuleName = world.sessionKeys.authModuleName
  const authModuleAddress = world.getProducedModuleAddress(authModuleName)
  const trimmedName = contractName.trim()
  const resolved = resolveVariableToken(world, trimmedName)
  const contractAddress = resolved.found
    ? resolved.value
    : world.getProducedModuleAddress(trimmedName)

  if (typeof contractAddress !== "string") {
    throw new Error(
      `Contract reference ${contractName} did not resolve to an address`,
    )
  }

  try {
    const sessionBytes = Writable.writeToBytesOrThrow(
      new Packed([authModuleAddress, world.sessionKeys.publicKey]),
    )
    const addressBytes = new Uint8Array(
      await crypto.subtle.digest("SHA-256", sessionBytes),
    )
    const address = addressBytes.toHex()

    const nonceResult = await executeModule(
      world,
      authModuleAddress,
      "get_nonce",
      [address],
    )

    if (!nonceResult.ok || typeof nonceResult.returned !== "bigint") {
      throw new Error(nonceResult.error || "Failed to fetch nonce")
    }

    const message = Writable.writeToBytesOrThrow(
      new Packed([
        AUTH_DOMAIN_ID,
        contractAddress,
        method,
        params,
        nonceResult.returned,
      ]),
    )

    const signature = new Uint8Array(
      await crypto.subtle.sign(
        "Ed25519",
        world.sessionKeys.privateKey,
        message,
      ),
    )

    const callResult = await executeModule(world, authModuleAddress, "call", [
      contractAddress,
      method,
      params,
      world.sessionKeys.publicKey,
      signature,
    ])

    world.lastExecutionResult = {
      success: callResult.ok,
      logs: callResult.logs,
      returned: callResult.returned,
      error: callResult.ok ? undefined : callResult.error,
    }

    console.log(`✅ Invoked ${method} on ${contractName} through auth`)
    if (callResult.logs.length > 0) {
      console.log("   Logs:", callResult.logs.join(", "))
    }
  } catch (error) {
    world.lastExecutionResult = {
      success: false,
      logs: [],
      returned: null,
      error: String(error),
    }
    console.log(`❌ Authenticated invocation failed: ${error}`)
  }
}

When(
  "I call {string} method {string}",
  async function (this: BobineWorld, contractName: string, method: string) {
    await callContract(this, contractName, method, [])
  },
)

When(
  "I invoke {string} method {string} through auth",
  { timeout: 60 * 1000 },
  async function (this: BobineWorld, contractName: string, method: string) {
    await invokeContractThroughAuth(this, contractName, method, [])
  },
)

When(
  "I invoke {string} method {string} through auth with param {string}",
  { timeout: 60 * 1000 },
  async function (
    this: BobineWorld,
    contractName: string,
    method: string,
    paramStr: string,
  ) {
    const trimmed = paramStr.trim()
    const params =
      !trimmed || trimmed === "[]" ? [] : parseParams(this, [trimmed])
    await invokeContractThroughAuth(this, contractName, method, params)
  },
)

When(
  "I invoke {string} method {string} through auth with params:",
  { timeout: 60 * 1000 },
  async function (
    this: BobineWorld,
    contractName: string,
    method: string,
    table: DataTable,
  ) {
    const params = parseParamsTable(this, table)
    await invokeContractThroughAuth(this, contractName, method, params)
  },
)

When(
  "I call {string} method {string} with param {string}",
  async function (
    this: BobineWorld,
    contractName: string,
    method: string,
    paramStr: string,
  ) {
    const trimmed = paramStr.trim()
    const params =
      !trimmed || trimmed === "[]" ? [] : parseParams(this, [trimmed])
    await callContract(this, contractName, method, params)
  },
)

When(
  "I call {string} method {string} with params:",
  async function (
    this: BobineWorld,
    contractName: string,
    method: string,
    table: DataTable,
  ) {
    const params = parseParamsTable(this, table)
    await callContract(this, contractName, method, params)
  },
)
