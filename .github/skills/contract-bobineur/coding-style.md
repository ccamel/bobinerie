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

## Structure

- Organize by intent.
- Separate concerns explicitly.
- Keep boundaries obvious.

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
