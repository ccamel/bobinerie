#!/usr/bin/env -S deno run --allow-read --allow-write

import { copyFileSync, existsSync, mkdirSync, readdirSync } from "node:fs"
import { join } from "node:path"

const contractsDir = "contracts"
const releaseDir = "out"

if (existsSync(releaseDir)) {
  Deno.removeSync(releaseDir, { recursive: true })
}
mkdirSync(releaseDir)

const contracts = readdirSync(contractsDir)

for (const contract of contracts) {
  const outDir = join(contractsDir, contract, "out")
  if (!existsSync(outDir)) continue

  const wasmFile = join(outDir, "mod.wasm")
  const dtsFile = join(outDir, "mod.d.ts")

  if (existsSync(wasmFile)) {
    copyFileSync(wasmFile, join(releaseDir, `${contract}.wasm`))
    console.log(`✅ ${contract}.wasm`)
  }

  if (existsSync(dtsFile)) {
    copyFileSync(dtsFile, join(releaseDir, `${contract}.d.ts`))
    console.log(`✅ ${contract}.d.ts`)
  }
}
