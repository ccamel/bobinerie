import { type ChildProcess, spawn } from "node:child_process"
import { once } from "node:events"
import { existsSync } from "node:fs"
import { mkdir } from "node:fs/promises"
import { resolve } from "node:path"
import { After, AfterAll, Before, BeforeAll, Status } from "@cucumber/cucumber"
import { BOBINE_PORT, BobineWorld } from "./world"

let bobineProcess: ChildProcess | undefined

const BOBINE_FOLDER = "./out/bobine_test_instance"
const BOBINE_ED25519_PRIVATE_KEY_HEX =
  "302e020100300506032b6570042204204a0992d1ed93923ba4886efa0a27c4ad3d4228c7c4a4dfcd6ffc42dc8fd34c6a"
const BOBINE_ED25519_PUBLIC_KEY_HEX =
  "5a7f02ea2f4369c0de9cc8e0f2f7dd08ffee5395bb75bc736b67e9f791bc11aa"
const BOBINE_URL = `http://localhost:${BOBINE_PORT}`
const BOBINE_ENTRY_PATH = resolve(
  process.cwd(),
  "node_modules",
  "@hazae41",
  "bobine",
  "out",
  "mod.js",
)

function resolveBobineCommand(): { command: string; args: string[] } {
  const baseArgs = ["serve", `--port=${BOBINE_PORT}`, "--dev"]
  const override = process.env.BOBINE_BIN
  if (override) {
    return { command: override, args: baseArgs }
  }
  if (existsSync(BOBINE_ENTRY_PATH)) {
    return {
      command: "deno",
      args: ["run", "-A", BOBINE_ENTRY_PATH, ...baseArgs],
    }
  }
  return { command: "bobine", args: baseArgs }
}

/**
 * Start Bobine instance before all tests
 */
BeforeAll({ timeout: 30000 }, async () => {
  console.log(`🚀 Starting Bobine instance on port ${BOBINE_PORT}...`)

  await mkdir(BOBINE_FOLDER, { recursive: true })
  await mkdir(`${BOBINE_FOLDER}/scripts`, { recursive: true })

  const { command, args } = resolveBobineCommand()

  bobineProcess = spawn(command, args, {
    stdio: "pipe",
    detached: true,
    env: {
      ...process.env,
      PORT: `${BOBINE_PORT}`,
      DATABASE_PATH: `${BOBINE_FOLDER}/bobine.db`,
      SCRIPTS_PATH: `${BOBINE_FOLDER}/scripts`,
      ED25519_PRIVATE_KEY_HEX: BOBINE_ED25519_PRIVATE_KEY_HEX,
      ED25519_PUBLIC_KEY_HEX: BOBINE_ED25519_PUBLIC_KEY_HEX,
    },
  })

  if (bobineProcess.stdout) {
    bobineProcess.stdout.on("data", (data) => {
      console.log(`[Bobine] ${data.toString().trim()}`)
    })
  }

  if (bobineProcess.stderr) {
    bobineProcess.stderr.on("data", (data) => {
      console.log(`[Bobine] ${data.toString().trim()}`)
    })
  }

  try {
    await waitForBobine(BOBINE_URL, 30000)
  } catch (err) {
    await stopBobineProcess()
    throw err
  }

  console.log(`✅ Bobine instance ready (pid: ${bobineProcess.pid})`)
})

/**
 * Stop Bobine instance after all tests
 */
AfterAll(async () => {
  console.log("🛑 Stopping Bobine instance...")

  await stopBobineProcess()

  console.log("✅ Bobine instance stopped")
})

/**
 * Reset world state before each scenario
 */
Before(function (this: BobineWorld, { pickle, gherkinDocument }) {
  this.reset()
  const featureName = gherkinDocument?.feature?.name ?? "Unknown feature"
  console.log(`📽️ Scenario starting: ${featureName} / ${pickle.name}`)
})

/**
 * Log scenario result after each scenario
 */
After(function (this: BobineWorld, { pickle, result }) {
  if (result?.status === Status.FAILED) {
    console.log(`❌ Scenario failed: ${pickle.name}`)
    if (this.lastExecutionResult?.error) {
      console.log(`   Error: ${this.lastExecutionResult.error}`)
    }
  } else if (result?.status === Status.PASSED) {
    console.log(`✅ Scenario passed: ${pickle.name}`)
  }
})

async function waitForBobine(url: string, timeoutMs: number): Promise<void> {
  const startTime = Date.now()
  const checkInterval = 500 // ms

  while (Date.now() - startTime < timeoutMs) {
    try {
      const response = await fetch(url, {
        method: "GET",
        signal: AbortSignal.timeout(1000),
      })

      if (response.ok || response.status === 404) {
        return
      }
    } catch (_error) {
      // ignore and retry
    }

    await new Promise((resolve) => setTimeout(resolve, checkInterval))
  }

  throw new Error(`Bobine instance did not start within ${timeoutMs}ms`)
}

async function stopBobineProcess(): Promise<void> {
  if (!bobineProcess) {
    return
  }

  if (bobineProcess.exitCode !== null) {
    cleanupBobineStreams()
    return
  }

  terminateBobineProcessGroup("SIGTERM")

  const killTimer = setTimeout(() => {
    if (bobineProcess && bobineProcess.exitCode === null) {
      terminateBobineProcessGroup("SIGKILL")
    }
  }, 5000)
  killTimer.unref()

  try {
    await Promise.race([
      Promise.race([once(bobineProcess, "exit"), once(bobineProcess, "close")]),
      new Promise((resolve) => setTimeout(resolve, 7000)),
    ])
  } finally {
    cleanupBobineStreams()
  }
}

function cleanupBobineStreams(): void {
  if (!bobineProcess) {
    return
  }
  bobineProcess.stdout?.removeAllListeners()
  bobineProcess.stderr?.removeAllListeners()
  bobineProcess.stdout?.destroy()
  bobineProcess.stderr?.destroy()
  bobineProcess = undefined
}

function terminateBobineProcessGroup(signal: NodeJS.Signals): void {
  if (!bobineProcess) {
    return
  }
  const { pid } = bobineProcess
  if (!pid) {
    return
  }
  try {
    process.kill(-pid, signal)
  } catch (error) {
    if (error instanceof Error && "code" in error && error.code === "ESRCH") {
      return
    }
    throw error
  }
}
