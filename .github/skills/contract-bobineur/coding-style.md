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

## Namespaces and structure

Use a domain-driven namespace layout.

### Domains

- One `namespace` per domain.
- A domain namespace owns:
  - its storage keys and access
  - its boundary encodings/decodings when relevant
  - its domain helpers

Examples of domains:

- `addresses` (identity, sessions, verification)
- `balances`
- `owner`
- `allowances`
- `config`
- `metadata`

Rules:

- Contract API methods orchestrate domains.
  They must not implement storage details inline.
- Storage access (`storage.get/set`) lives inside domain namespaces.
- Keep domain namespaces focused.
  If a namespace starts to mix unrelated concerns, split it.

## Encoding rules

- All data crossing a contract boundary MUST follow the Bobine Canonical Pack Encoding Specification specified in `bobine-cpes.md`.
- Pack layouts are stable interfaces.
- Ordering, arity, and types are explicit and fixed.

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
