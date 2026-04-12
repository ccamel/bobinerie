---
name: bobine-contract-caller
description: >
  Interact with Bobine smart contracts from an AI agent. Use when you need to
  call a deployed Bobine module, prepare typed Bobine params, or perform an
  Ed25519-signed call through an auth module.
---

# Bobine Contract Caller

Call deployed Bobine modules from a portable skill.

## Useful references

- Concept overview: <https://www.bobine.tech/>
- Bobine project: <https://github.com/hazae41/bobine>
- Standard libraries for Bobine WebAssembly VM: <https://github.com/hazae41/stdbob>

## Use this skill for

- Calling a Bobine module through `/api/execute`
- Preparing typed Bobine params for contract methods
- Generating Ed25519 keys for Bobine auth sessions
- Performing an authenticated `ed25519` call with nonce handling and signature

## Do not use this skill for

- Authoring or refactoring Bobine contracts
- Explaining the internals of a specific contract when the contract sources are available elsewhere
- Managing non-Ed25519 auth flows in v1

## Runtime requirements

- Node.js 20+
- Network access to a Bobine server

## Files in this skill

- `scripts/keygen.mjs` generates a JSON object with `sigkey` and `pubkey`
- `scripts/call_bobine.mjs` performs unsigned or signed Bobine calls from explicit arguments
- `references/params.md` documents the param grammar
- `references/runtime.md` documents env vars, outputs, and failure modes

## Quick workflow

1. Inspect `references/params.md` if the user gives nested or packed params.
2. Inspect `references/runtime.md` if env vars or outputs are unclear.
3. Generate keys if the call needs `ed25519` auth:

    ```bash
    node ./scripts/keygen.mjs
    ```

4. Call the target contract with explicit arguments:

    ```bash
    node ./scripts/call_bobine.mjs \
      --server http://localhost:8080 \
      --module <target-module> \
      --method <target-method> \
      --param text:Alice
    ```

## Inputs

- `call_bobine.mjs`
  - `--server`: Bobine server base URL
  - `--module`: target module address
  - `--method`: target method name
  - `--param`: repeat once per typed param
  - `--auth-module`: optional deployed `ed25519` auth module address
  - `--sigkey`: required when `--auth-module` is provided
  - `--pubkey`: required when `--auth-module` is provided
  - `--spark-hex`: optional one-off spark value for this exact call
  - `--spark-effort`: optional inline spark generation target

## Param rules

- Scalars:
  - `null`
  - `blob:<hex>`
  - `bigint:<value>`
  - `number:<value>`
  - `text:<value>`
- Arrays:
  - `pack:[...]`
  - `array:[...]`
- Nesting is allowed
- Quote the whole shell argument when it contains brackets, commas, or spaces
- Quote the `text:` payload itself when it contains `,` or `]`, for example `text:"a,b]"`

## Signed call behavior

1. Read `--server`, target module, target method, and typed params
2. Build the Bobine session payload `[auth_module, pubkey]`
3. Derive the session address from `sha256(pack(session))`
4. Query `<auth_module>.get_nonce(session_address)`
5. Sign `[domain, module, method, params, nonce]`
6. Call `<auth_module>.call(module, method, params, pubkey, signature)`
7. Print a JSON object with logs, returned value, spark hex, and reported sparks

## Output contract

- Scripts print a single JSON object on stdout on success
- Usage and failure diagnostics go to stderr
- Returned Bobine values are normalized into tagged JSON:
  - `{ "type": "text", "value": "hello" }`
  - `{ "type": "bigint", "value": "42" }`
  - `{ "type": "array", "value": [...] }`
- `keygen.mjs` prints `{ "sigkey": "...", "pubkey": "..." }`

## Safety

- Do not echo private keys back to the user unless they explicitly ask for them
- Treat `sigkey` as sensitive
- Prefer a fresh inline spark by default; use `--spark-hex` only when you deliberately want to supply a one-off spark
- Surface server errors and decoded logs instead of retrying blindly

## Troubleshooting

- `Missing required call arguments`: re-run with `--server`, `--module`, `--method`, and any required auth flags
- `Unknown value type`: read `references/params.md`
- `Failed Bobine execute request`: report the HTTP status and response body
- `Invalid session` or `Unauthorized`: the auth module, nonce, keys, or target contract assumptions are wrong
