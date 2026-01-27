import type { ChildProcess } from "node:child_process"
import { setWorldConstructor, World } from "@cucumber/cucumber"

export const BOBINE_PORT = 8888

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
