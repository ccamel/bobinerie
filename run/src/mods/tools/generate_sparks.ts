import { Buffer } from "node:buffer"
import { generate } from "../../libs/effort/mod.ts"

type SparkPool = {
  effortTarget: string
  count: number
  sparks: string[]
}

function usage(): never {
  console.error(`Precompute PoW efforts ("sparks") for tests.

Usage:
  npm run sparks:generate -- <count> <effort> <output>

Example:
  npm run sparks:generate -- 100 100000 ./run/sparks.json

Notes:
  - Test-only helper.
  - CPU-intensive: generating many sparks may take a while.
  - Safe to reuse since the server only checks the work/effort threshold (no per-request uniqueness).
`)
  Deno.exit(1)
}

const [countRaw, effortRaw, outputPath] = Deno.args
if (!countRaw || !effortRaw || !outputPath) {
  usage()
}

const count = Number(countRaw)
if (!Number.isFinite(count) || count <= 0 || !Number.isInteger(count)) {
  console.error(`Invalid count: ${countRaw}`)
  usage()
}

let effortTarget: bigint
try {
  effortTarget = BigInt(effortRaw)
} catch {
  console.error(`Invalid effort: ${effortRaw}`)
  usage()
}
if (effortTarget <= 0n) {
  console.error(`Effort must be > 0: ${effortRaw}`)
  usage()
}

const start = Date.now()

const sparks: string[] = []
for (let i = 0; i < count; i++) {
  const done = i
  const percent = ((done / count) * 100).toFixed(1)
  const elapsed = (Date.now() - start) / 1000
  const rate = done / Math.max(elapsed, 0.001)
  const remaining = (count - done) / rate
  const line = `⛏️  ${done}/${count} (${percent}%) | ${rate.toFixed(2)} sparks/s | ETA ${remaining.toFixed(1)}s`
  await Deno.stdout.write(new TextEncoder().encode(`\r${line}`))

  const effort = await generate(effortTarget)
  sparks.push(Buffer.from(effort).toString("hex"))
}

console.log()

const payload: SparkPool = {
  effortTarget: effortTarget.toString(),
  count,
  sparks,
}

await Deno.writeTextFile(outputPath, JSON.stringify(payload, null, 2))
console.log(`✅ Wrote ${count} sparks to ${outputPath}`)
