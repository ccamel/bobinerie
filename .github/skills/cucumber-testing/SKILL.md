---
name: cucumber-testing
description: >
  Guide for writing, debugging, and maintaining BDD tests using Cucumber for Bobine
  smart contracts. Use this skill when adding new test scenarios, fixing broken tests,
  or interpreting test failures.
---

# Cucumber Testing for Bobine

You maintain the BDD test suite ensuring contract correctness and integration.

## Context

- **Test Files**: located in `contracts/<contract_name>/contract.feature`.
- **Syntax**: Gherkin (Feature, Scenario, Given, When, Then).
- **Execution**: Run `npm run test` to execute the full suite.

## Step Definitions

All step definitions are centralized in `run/src/mods/test/support/steps/`. **Do not create new step files unless absolutely necessary.**

- **Assertions**: `assertions.steps.ts` - Check return values, success/failure.
- **Execution**: `execute.steps.ts` - Invoking contract methods.
- **Setup**: `setup.steps.ts` - Contract deployment, auth setup, key generation.

## Common Steps & Patterns

Reuse these existing steps to maintain consistency:

### Assertions

- `Then the execution should succeed`
- `Then the execution should fail`
- `Then the returned value should be {string}`
  - Supports type prefixes: `bigint:123`, `address:alice`, `text:hello`.
  - Use `bigint:` for numbers to avoid precision loss.

### Interactions

- `When I invoke {string} method {string} through auth`
- `Given I deploy contract {string}`
- `Given I have keys for {string}`
- `Given I remember last returned value as {string}`

## Best Practices

- **Reuse Steps**: Always check `assertions.steps.ts` before writing a new step.
- **Data Formats**:
  - Use `bigint:` prefix for all numeric values in feature files.
  - Use `address:` prefix when referring to user addresses created in the `Given` steps.
  - Use `$name` or `${name}` to reference remembered values or produced contract addresses.
- **Isolation**: Each scenario should stand alone; rely on the `Background` or `setup` steps to establish the environment.
