import { execSync } from "node:child_process"
import { readFileSync } from "node:fs"
import { Given } from "@cucumber/cucumber"
import { Writable } from "@hazae41/binary"
import { generate } from "../../../run/src/libs/effort/mod.ts"
import { type Packable, Packed } from "../../../run/src/libs/packed/mod.ts"
import { BobineWorld } from "../world"

type ProduceOptions = {
  successSuffix?: string
  errorSuffix?: string
  alreadyProducedLabel?: string
  producedLabel?: string
}

async function produceWasmModule(
  world: BobineWorld,
  name: string,
  wasmPath: string,
  salt: Packable[],
  options: ProduceOptions = {},
): Promise<void> {
  const contract = world.getContract(name)

  if (contract.produced && contract.moduleAddress) {
    const label = options.alreadyProducedLabel ?? "Contract"
    console.log(
      `ℹ️  ${label} ${name} already produced at ${contract.moduleAddress}`,
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
    body.append("effort", new Blob([await generate(10n ** 6n)]))

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

    const label = options.producedLabel ?? "contract"
    const suffix = options.successSuffix ? ` ${options.successSuffix}` : ""
    console.log(`✅ Produced ${label}: ${name} at ${moduleAddress}${suffix}`)
  } catch (error) {
    const suffix = options.errorSuffix ? ` ${options.errorSuffix}` : ""
    throw new Error(`Failed to produce ${name}${suffix}: ${error}`)
  }
}

async function produceContractWithSalt(
  world: BobineWorld,
  contractName: string,
  salt: Packable[],
  options: ProduceOptions = {},
): Promise<void> {
  const wasmPath = `./contracts/${contractName}/out/mod.wasm`
  await produceWasmModule(world, contractName, wasmPath, salt, options)
}

Given(
  "a prepackaged contract {string}",
  async function (this: BobineWorld, contractName: string) {
    try {
      execSync(`CONTRACT=${contractName} npm run prepack:contract`, {
        cwd: process.cwd(),
        stdio: "pipe",
        encoding: "utf-8",
      })

      this.getContract(contractName)

      console.log(`✅ Prepackaged contract: ${contractName}`)
    } catch (error) {
      throw new Error(`Failed to prepack contract ${contractName}: ${error}`)
    }
  },
)

Given(
  "a produced contract {string}",
  { timeout: 60 * 1000 },
  async function (this: BobineWorld, contractName: string) {
    await produceContractWithSalt(this, contractName, [])
  },
)

Given(
  "a produced contract {string} with random salt",
  { timeout: 60 * 1000 },
  async function (this: BobineWorld, contractName: string) {
    const salt = `${Date.now()}-${Math.random()}`
    await produceContractWithSalt(this, contractName, [salt], {
      successSuffix: "with random salt",
      errorSuffix: "with random salt",
    })
  },
)

Given(
  "a produced fixture contract {string}",
  { timeout: 60 * 1000 },
  async function (this: BobineWorld, fixtureName: string) {
    const wasmPath = `./features/support/fixtures/${fixtureName}.wasm`
    await produceWasmModule(this, fixtureName, wasmPath, [], {
      alreadyProducedLabel: "Fixture contract",
      producedLabel: "fixture contract",
      errorSuffix: "(fixture contract)",
    })
  },
)
