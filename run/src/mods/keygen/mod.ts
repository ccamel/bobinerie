/// <reference types="../../libs/bytes/lib.d.ts"/>

const keypair = (await crypto.subtle.generateKey("Ed25519", true, [
  "sign",
  "verify",
])) as CryptoKeyPair

const sigkey = new Uint8Array(
  await crypto.subtle.exportKey("pkcs8", keypair.privateKey),
)
const pubkey = new Uint8Array(
  await crypto.subtle.exportKey("spki", keypair.publicKey),
)

console.log(`SIGKEY=${sigkey.toHex()}`)
console.log(`PUBKEY=${pubkey.toHex()}`)
