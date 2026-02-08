# Bobine Coding Style

This document defines the mandatory coding style and local workflow rules for Bobine smart contracts.

## Principles

- Minimal surface area.
- Clarity over cleverness.
- Explicit over implicit.
- Prefer deletion over addition.

## Language

- AssemblyScript only.

## Comments

- No comments inside functions.
- No explanatory comments for obvious code.
- If code needs explanation, change the code.

## Names and functions

- Names carry intent.
- Keep functions small and single-purpose.
- Avoid boolean flags when separate functions express intent better.
- Avoid abstractions unless reused at least twice.

### Casing

Rules are strict. Do not mix conventions.

- Exported contract functions: `lower_snake_case`
  - Examples: `init`, `update_policy`, `proposal`, `approve`, `execute`
  - Do not use `get_` prefixes. Prefer direct names (example: `threshold()`).

- Domain namespaces: `lower_snake_case` using a **singular noun** ending with `$` as the plural marker
  - Examples: `address$`, `balance$`, `approval$`, `proposal$`, `session$`, `math$`

- Local variables and private helpers: `lowerCamelCase` (AssemblyScript idiom)

- Constants: `UPPER_SNAKE_CASE`
  - Examples: `DOMAIN`, `POLICY_TAG`

## Namespaces and structure

Use a domain-driven namespace layout.

### Domains

- One `namespace` per domain.
- A domain namespace owns:
  - its storage keys and access
  - its boundary encodings/decodings when relevant
  - its domain helpers

Examples of domains:

- `address$` (identity, sessions, verification)
- `balance$`
- `owner$`
- `allowance$`
- `config$`
- `metadata$`

Rules:

- Contract API methods orchestrate domains.
  They must not implement storage details inline.
- Contract API methods are thin controllers.
  They must not implement business decisions, state transition logic, or multi-step mutation flows inline.
- Storage access (`storage.get/set`) lives inside domain namespaces.
- Keep domain namespaces focused.
  If a namespace starts to mix unrelated concerns, split it.

Controller contract:

- Exported methods may only:
  - validate legitimacy (session/auth/context)
  - adapt boundary inputs/outputs
  - call domain operations
- Exported methods must not:
  - perform business branching beyond simple legitimacy gates
  - coordinate storage-level mutation sequences directly
  - encode domain workflows inline when a domain operation can own them

Domain operation naming:

- Use behavioral names for business operations (`update`, `execute`, `transfer`, `mint`, `burn`, `approve`).
- Reserve storage verbs (`get`, `set`, `read`, `write`) for pure persistence helpers inside domains.

## Encoding rules

- All data crossing a contract boundary MUST follow the Bobine Canonical Pack Encoding Specification specified in `bobine-cpes.md`.
- Pack layouts are stable interfaces.
- Ordering, arity, and types are explicit and fixed.
- Tags use `bobine.<module>/<type>` where `<type>` is `lower_snake_case`.

## Public API

- Treat exported functions and data formats as stable interfaces.
- No "just in case" exports.
- Breaking changes are deliberate design decisions.

## Required commands

Run these commands before considering work done:

- Format:
  - `npm run fmt`

- Lint:
  - `npm run lint:code`

- Contract docs (README Methods section):
  - `CONTRACT=contract-name npm run docs:contract`

## Posture

- Avoid defensive verbosity.
- Avoid speculative extensibility.
- Prefer straightforward control flow.
