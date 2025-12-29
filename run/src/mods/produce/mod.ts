/// <reference types="../../libs/bytes/lib.d.ts"/>

import { Writable } from "@hazae41/binary";
import { readFileSync } from "node:fs";
import process from "node:process";
import { generate } from "../../libs/effort/mod.ts";
import { Packable, Packed } from "../../libs/packed/mod.ts";

process.loadEnvFile(".env.local")
process.loadEnvFile(".env")

function parse(texts: string[]): Array<Packable> {
  const values = new Array<Packable>()

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

const [file, ...params] = process.argv.slice(2)

const body = new FormData()

const codeAsBytes = readFileSync(file)
const saltAsBytes = Writable.writeToBytesOrThrow(new Packed(parse(params)))

body.append("code", new Blob([codeAsBytes]))
body.append("salt", new Blob([saltAsBytes]))

const effortAsBytes = await generate(codeAsBytes.length + saltAsBytes.length)

body.append("effort", new Blob([effortAsBytes]))

const response = await fetch(new URL("/api/create", process.env.SERVER), { method: "POST", body });

if (!response.ok)
  throw new Error("Failed", { cause: response })

console.log(await response.json())