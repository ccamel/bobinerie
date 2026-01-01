// deno-lint-ignore-file no-unused-vars

/// <reference types="../../../libs/bytes/lib.d.ts"/>

import process from "node:process"
import { Readable, Writable } from "@hazae41/binary"
import { generate } from "../../../libs/effort/mod.ts"
import { Packable, Packed } from "../../../libs/packed/mod.ts"

process.loadEnvFile(".env.local")
process.loadEnvFile(".env")

type Proof = [
  Array<string>,
  Array<[string, Uint8Array, Uint8Array]>,
  Array<[string, Uint8Array, Uint8Array]>,
  Packable,
  bigint,
]

async function execute<T extends Packable = Packable>(
  module: string,
  method: string,
  params: Array<Packable>,
) {
  const body = new FormData()

  body.append("module", module)
  body.append("method", method)
  body.append(
    "params",
    new Blob([Writable.writeToBytesOrThrow(new Packed(params))]),
  )
  body.append("effort", new Blob([await generate(2n ** 19n)]))

  const response = await fetch(new URL("/api/execute", process.env.SERVER), {
    method: "POST",
    body,
  })

  if (!response.ok) throw new Error("Failed", { cause: response })

  const [logs, _reads, _writes, returned, _sparks] =
    Readable.readFromBytesOrThrow(Packed, await response.bytes()) as Proof

  for (const log of logs) console.log(log)

  return returned as T
}

function parse(texts: string[]): Array<Packable> {
  const values: Packable[] = []

  for (const text of texts) {
    if (text === "null") {
      values.push(null)
      continue
    }

    if (text.startsWith("blob:")) {
      values.push(Uint8Array.fromHex(text.slice("blob:".length)))
      continue
    }

    if (text.startsWith("bigint:")) {
      values.push(BigInt(text.slice("bigint:".length)))
      continue
    }

    if (text.startsWith("number:")) {
      values.push(Number(text.slice("number:".length)))
      continue
    }

    if (text.startsWith("text:")) {
      values.push(text.slice("text:".length))
      continue
    }

    throw new Error("Unknown value type")
  }

  return values
}

function jsonify(value: Packable): unknown {
  if (value == null) return { type: "null" }

  if (value instanceof Uint8Array) return { type: "blob", value: value.toHex() }

  if (typeof value === "bigint")
    return { type: "bigint", value: value.toString() }

  if (typeof value === "number")
    return { type: "number", value: value.toString() }

  if (typeof value === "string") return { type: "text", value }

  if (Array.isArray(value)) {
    const entries: unknown[] = []

    for (const subvalue of value) entries.push(jsonify(subvalue))

    return { type: "array", value: entries }
  }

  throw new Error("Unknown value type")
}

const [ed25519, module, method, ...params] = process.argv.slice(2)

const sigkeyAsBytes = Uint8Array.fromHex(process.env.SIGKEY)
const pubkeyAsBytes = Uint8Array.fromHex(process.env.PUBKEY)

const sigkey = await crypto.subtle.importKey(
  "pkcs8",
  sigkeyAsBytes,
  "Ed25519",
  true,
  ["sign"],
)

const encoded = Writable.writeToBytesOrThrow(
  new Packed([ed25519, pubkeyAsBytes]),
)
const address = new Uint8Array(
  await crypto.subtle.digest("SHA-256", encoded),
).toHex()

const nonce = await execute<bigint>(ed25519, "get_nonce", [address])

const message = Writable.writeToBytesOrThrow(
  new Packed([
    "17fa1cb5-c5af-4cfd-9bea-1a36590b890d",
    module,
    method,
    parse(params),
    nonce,
  ]),
)

const signature = new Uint8Array(
  await crypto.subtle.sign("Ed25519", sigkey, message),
)

console.log(
  jsonify(
    await execute(ed25519, "call", [
      module,
      method,
      parse(params),
      pubkeyAsBytes,
      signature,
    ]),
  ),
)
