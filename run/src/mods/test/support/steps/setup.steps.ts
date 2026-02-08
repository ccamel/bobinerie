import { execSync } from "node:child_process"
import { existsSync, readFileSync } from "node:fs"
import { Given } from "@cucumber/cucumber"
import { Writable } from "@hazae41/binary"
import { type Packable, Packed } from "../../../../libs/packed/mod.ts"
import { BobineWorld } from "../world"

function getProjectContractSourcePath(contractName: string): string {
  return `./contracts/${contractName}/src/mod.ts`
}

function getProjectContractWasmPath(contractName: string): string {
  return `./contracts/${contractName}/out/mod.wasm`
}

function getFixtureWasmPath(contractName: string): string {
  return `./run/src/mods/test/support/fixtures/${contractName}.wasm`
}

async function produceWasmModule(
  world: BobineWorld,
  name: string,
  wasmPath: string,
  salt: Packable[],
): Promise<void> {
  const contract = world.getContract(name)

  if (contract.produced && contract.moduleAddress) {
    console.log(
      `ℹ️ Contract ${name} already produced at ${contract.moduleAddress}`,
    )
    return
  }

  try {
    const wasmBytes = readFileSync(wasmPath)

    const body = new FormData()
    body.append("code", new Blob([wasmBytes]))
    body.append(
      "salt",
      new Blob([Writable.writeToBytesOrThrow(new Packed(salt))]),
    )
    body.append("effort", new Blob([world.nextSpark()]))

    const response = await fetch(new URL("/api/create", world.serverUrl), {
      method: "POST",
      body,
    })

    if (!response.ok) {
      throw new Error(`Produce failed with status ${response.status}`)
    }

    const result = await response.json()
    const moduleAddress =
      typeof result === "string" ? result : result.address || result.module

    world.markProduced(name, moduleAddress)

    console.log(`✅ Produced contract: ${name} at ${moduleAddress}`)
  } catch (error) {
    throw new Error(`Failed to produce ${name}: ${error}`)
  }
}

Given(
  "I deploy contract {string}",
  { timeout: 60 * 1000 },
  async function (this: BobineWorld, contractName: string) {
    const sourcePath = getProjectContractSourcePath(contractName)
    const fixtureWasmPath = getFixtureWasmPath(contractName)
    const hasProjectContract = existsSync(sourcePath)
    const hasFixtureContract = existsSync(fixtureWasmPath)

    if (!hasProjectContract && !hasFixtureContract) {
      throw new Error(
        `Unknown contract ${contractName}. Expected ${sourcePath} or ${fixtureWasmPath}`,
      )
    }

    if (hasProjectContract) {
      try {
        execSync(`CONTRACT=${contractName} npm run contract:build`, {
          cwd: process.cwd(),
          stdio: "pipe",
          encoding: "utf-8",
        })
      } catch (error) {
        throw new Error(`Failed to build contract ${contractName}: ${error}`)
      }
    }

    const deployCreator = this.nextDeploySalt().toString()
    this.savedValues.set(`${contractName}_creator`, deployCreator)

    const wasmPath = hasProjectContract
      ? getProjectContractWasmPath(contractName)
      : fixtureWasmPath
    await produceWasmModule(this, contractName, wasmPath, [deployCreator])
  },
)

Given(
  "I use auth module {string}",
  function (this: BobineWorld, authModuleName: string) {
    this.getProducedModuleAddress(authModuleName)
    this.authModuleName = authModuleName

    if (this.sessionKeys) {
      this.sessionKeys.authModuleName = authModuleName
    }

    console.log(`🔐 Using auth module: ${authModuleName}`)
  },
)

Given(
  "I have keys for {string}",
  async function (this: BobineWorld, userName: string) {
    if (!this.authModuleName) {
      throw new Error("Auth module is not configured")
    }

    let keyPair = this.userKeys.get(userName)

    if (!keyPair) {
      const generated = (await crypto.subtle.generateKey("Ed25519", true, [
        "sign",
        "verify",
      ])) as CryptoKeyPair

      const publicKey = new Uint8Array(
        await crypto.subtle.exportKey("spki", generated.publicKey),
      )

      keyPair = {
        publicKey,
        privateKey: generated.privateKey,
      }

      this.userKeys.set(userName, keyPair)
    }

    this.sessionKeys = {
      publicKey: keyPair.publicKey,
      privateKey: keyPair.privateKey,
      authModuleName: this.authModuleName,
    }

    const authModuleAddress = this.getProducedModuleAddress(this.authModuleName)
    const sessionBytes = Writable.writeToBytesOrThrow(
      new Packed([authModuleAddress, keyPair.publicKey]),
    )
    const addressBytes = new Uint8Array(
      await crypto.subtle.digest("SHA-256", sessionBytes),
    )
    this.userAddresses.set(userName, addressBytes.toHex())

    console.log(`🔐 Using keys for ${userName}`)
  },
)

function rememberLastReturnedValue(world: BobineWorld, key: string): void {
  if (!world.lastExecutionResult) {
    throw new Error("No execution result found")
  }

  const value = world.lastExecutionResult.returned
  console.log(
    `🧷 Saving value: ${JSON.stringify(value)} (type: ${typeof value}, isUint8Array: ${value instanceof Uint8Array}, isArray: ${Array.isArray(value)})`,
  )
  world.savedValues.set(key, value)
  console.log(`🧷 Saved last returned value as ${key}`)
}

Given(
  "I remember last returned value as {string}",
  function (this: BobineWorld, key: string) {
    rememberLastReturnedValue(this, key)
  },
)
