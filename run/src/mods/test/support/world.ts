import type { ChildProcess } from "node:child_process"
import { Buffer } from "node:buffer"
import { readFileSync } from "node:fs"
import { resolve } from "node:path"
import { setWorldConstructor, World } from "@cucumber/cucumber"

export const BOBINE_PORT = 8888
const SPARKS_PATH = resolve(
  process.cwd(),
  "run",
  "src",
  "mods",
  "test",
  "support",
  "fixtures",
  "sparks.json",
)

type SparkPoolFile = {
  effortTarget: string
  count: number
  sparks: string[]
}

function loadSparkPool(): string[] {
  const raw = readFileSync(SPARKS_PATH, "utf-8")
  const parsed = JSON.parse(raw) as SparkPoolFile
  if (!parsed.sparks || !Array.isArray(parsed.sparks)) {
    throw new Error(`Invalid sparks file: ${SPARKS_PATH}`)
  }
  if (parsed.count !== parsed.sparks.length) {
    throw new Error(
      `Sparks count mismatch in ${SPARKS_PATH} (count=${parsed.count}, sparks=${parsed.sparks.length})`,
    )
  }
  if (parsed.sparks.length === 0) {
    throw new Error(`No sparks found in ${SPARKS_PATH}`)
  }
  return parsed.sparks
}

const SPARK_POOL = loadSparkPool()
let sparkIndex = 0
export function getSparkUsage(): { used: number; total: number } {
  return { used: sparkIndex, total: SPARK_POOL.length }
}

function takeSpark(): Uint8Array {
  if (sparkIndex >= SPARK_POOL.length) {
    throw new Error(
      `Spark pool exhausted at index ${sparkIndex}. Generate more in ${SPARKS_PATH}.`,
    )
  }
  const hex = SPARK_POOL[sparkIndex]
  sparkIndex += 1
  return Buffer.from(hex, "hex")
}

export interface ContractState {
  name: string
  produced: boolean
  moduleAddress?: string
}

export interface ExecutionResult {
  success: boolean
  logs: string[]
  returned: unknown
  error?: string
}

export interface SessionKeys {
  publicKey: Uint8Array
  privateKey: CryptoKey
  authModuleName: string
}

export interface UserKeyPair {
  publicKey: Uint8Array
  privateKey: CryptoKey
}

export class BobineWorld extends World {
  public serverUrl: string = `http://127.0.0.1:${BOBINE_PORT}`
  public bobineProcess?: ChildProcess
  public contractStates: Map<string, ContractState> = new Map()
  public lastExecutionResult?: ExecutionResult
  public sessionKeys?: SessionKeys
  public authModuleName?: string
  public userKeys: Map<string, UserKeyPair> = new Map()
  public userAddresses: Map<string, string> = new Map()

  reset(): void {
    this.contractStates.clear()
    this.lastExecutionResult = undefined
    this.sessionKeys = undefined
    this.authModuleName = undefined
    this.userKeys.clear()
    this.userAddresses.clear()
  }

  nextSpark(): Uint8Array {
    return takeSpark()
  }

  getContract(name: string): ContractState {
    if (!this.contractStates.has(name)) {
      this.contractStates.set(name, { name, produced: false })
    }
    return this.contractStates.get(name)
  }

  getProducedModuleAddress(name: string): string {
    const contract = this.getContract(name)
    if (!contract.produced || !contract.moduleAddress) {
      throw new Error(`Contract ${name} has not been produced yet`)
    }
    return contract.moduleAddress
  }

  markProduced(name: string, moduleAddress: string): void {
    const contract = this.getContract(name)
    contract.produced = true
    contract.moduleAddress = moduleAddress
  }
}

setWorldConstructor(BobineWorld)
