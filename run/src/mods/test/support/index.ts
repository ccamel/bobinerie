/**
 * Polyfills for Uint8Array methods (Node 20 lacks these)
 */
if (!Uint8Array.prototype.toHex) {
  Uint8Array.prototype.toHex = function () {
    return Buffer.from(this).toString("hex")
  }
}

if (!Uint8Array.fromHex) {
  Uint8Array.fromHex = (hex: string) => new Uint8Array(Buffer.from(hex, "hex"))
}

if (!Uint8Array.prototype.toBase64) {
  Uint8Array.prototype.toBase64 = function () {
    return Buffer.from(this).toString("base64")
  }
}

if (!Uint8Array.fromBase64) {
  Uint8Array.fromBase64 = (base64: string) =>
    new Uint8Array(Buffer.from(base64, "base64"))
}

import "./world.ts"
import "./hooks.ts"
import "./steps/setup.steps.ts"
import "./steps/execute.steps.ts"
import "./steps/assertions.steps.ts"
