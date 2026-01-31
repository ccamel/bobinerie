type Uint8Array = {
  toHex(): string
}

type Uint8ArrayConstructor = {
  fromHex(hex: string): Uint8Array<ArrayBuffer>
}
