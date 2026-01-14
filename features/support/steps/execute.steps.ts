import { DataTable, When } from "@cucumber/cucumber"
import { Readable, Writable } from "@hazae41/binary"
import { generate } from "../../../run/src/libs/effort/mod.ts"
import { type Packable, Packed } from "../../../run/src/libs/packed/mod.ts"
import { BobineWorld } from "../world"

const AUTH_DOMAIN_ID = "17fa1cb5-c5af-4cfd-9bea-1a36590b890d"

function parseParamValue(token: string): Packable {
  const trimmed = token.trim()
  if (!trimmed || trimmed === "null") {
    return null
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
  throw new Error(`Unknown value type: ${trimmed}`)
}

function parseParams(tokens: string[]): Packable[] {
  return tokens.map(parseParamValue)
}

function parseParamsTable(table: DataTable): Packable[] {
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

  return parseParams(tokens)
}

type ModuleExecution = {
  ok: boolean
  logs: string[]
  returned: Packable | null
  error?: string
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
    body.append("effort", new Blob([await generate(10n ** 6n)]))

    const response = await fetch(new URL("/api/execute", world.serverUrl), {
      method: "POST",
      headers: { Accept: "application/octet-stream" },
      body,
    })

    const bytes = new Uint8Array(await response.arrayBuffer())

    let logs: string[] = []
    let returned: Packable | null = null

    const isNull =
      bytes.length === 4 &&
      bytes[0] === 110 &&
      bytes[1] === 117 &&
      bytes[2] === 108 &&
      bytes[3] === 108

    if (!isNull) {
      const result = Readable.readFromBytesOrThrow(Packed, bytes) as unknown[]
      const [_logs, _reads, _writes, _returned, _sparks] = result as [
        string[],
        unknown,
        unknown,
        Packable,
        unknown,
      ]
      logs = _logs
      returned = _returned
    }

    return {
      ok: response.ok,
      logs,
      returned,
      error: response.ok ? undefined : `Status ${response.status}`,
    }
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
  const contract = world.getContract(contractName)

  if (!contract.produced || !contract.moduleAddress) {
    throw new Error(`Contract ${contractName} has not been produced yet`)
  }

  try {
    const body = new FormData()
    body.append("module", contract.moduleAddress)
    body.append("method", method)
    body.append(
      "params",
      new Blob([Writable.writeToBytesOrThrow(new Packed(params))]),
    )
    body.append("effort", new Blob([await generate(10n ** 6n)]))

    const response = await fetch(new URL("/api/execute", world.serverUrl), {
      method: "POST",
      headers: { Accept: "application/octet-stream" },
      body,
    })

    const bytes = new Uint8Array(await response.arrayBuffer())

    let logs: string[] = []
    let returned: Packable | undefined

    const isNull =
      bytes.length === 4 &&
      bytes[0] === 110 &&
      bytes[1] === 117 &&
      bytes[2] === 108 &&
      bytes[3] === 108

    if (isNull) {
      logs = []
      returned = null
    } else {
      const result = Readable.readFromBytesOrThrow(Packed, bytes) as unknown[]
      const [_logs, _reads, _writes, _returned, _sparks] = result as [
        string[],
        unknown,
        unknown,
        Packable,
        unknown,
      ]
      logs = _logs
      returned = _returned
    }

    world.lastExecutionResult = {
      success: response.ok,
      logs,
      returned,
      error: response.ok ? undefined : `Status ${response.status}`,
    }

    console.log(`✅ Executed ${method} on ${contractName}`)
    if (logs && Array.isArray(logs) && logs.length > 0) {
      console.log("   Logs:", logs.join(", "))
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
    if (!this.sessionKeys) {
      throw new Error("No session keys found")
    }

    const authModuleName = this.sessionKeys.authModuleName
    const authModuleAddress = this.getProducedModuleAddress(authModuleName)
    const contractAddress = this.getProducedModuleAddress(contractName)

    try {
      const sessionBytes = Writable.writeToBytesOrThrow(
        new Packed([authModuleAddress, this.sessionKeys.publicKey]),
      )
      const addressBytes = new Uint8Array(
        await crypto.subtle.digest("SHA-256", sessionBytes),
      )
      const address = addressBytes.toHex()

      const nonceResult = await executeModule(
        this,
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
          [],
          nonceResult.returned,
        ]),
      )

      const signature = new Uint8Array(
        await crypto.subtle.sign(
          "Ed25519",
          this.sessionKeys.privateKey,
          message,
        ),
      )

      const callResult = await executeModule(this, authModuleAddress, "call", [
        contractAddress,
        method,
        [],
        this.sessionKeys.publicKey,
        signature,
      ])

      this.lastExecutionResult = {
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
      this.lastExecutionResult = {
        success: false,
        logs: [],
        returned: null,
        error: String(error),
      }
      console.log(`❌ Authenticated invocation failed: ${error}`)
    }
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
    const params = !trimmed || trimmed === "[]" ? [] : parseParams([trimmed])
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
    const params = parseParamsTable(table)
    await callContract(this, contractName, method, params)
  },
)
