import { strict as assert } from "node:assert"
import { DataTable, Then } from "@cucumber/cucumber"
import { parseValueWithCommon } from "../parsing"
import { BobineWorld } from "../world"

function formatValue(value: unknown): string {
  return JSON.stringify(value, (_key, val) =>
    typeof val === "bigint" ? `bigint:${val.toString()}` : val,
  )
}

function parseExpectedValue(world: BobineWorld, token: string): unknown {
  const trimmed = token.trim()
  if (trimmed === "true") {
    return true
  }
  if (trimmed === "false") {
    return false
  }
  const result = parseValueWithCommon(world, token, parseExpectedValue)
  if (result !== null) {
    return result
  }
  if (trimmed === "null" || !trimmed) {
    return null
  }
  return trimmed
}

function parseExpectedTable(world: BobineWorld, table: DataTable): unknown[] {
  const rows = table.raw()
  if (rows.length === 0) {
    return []
  }

  const tokens: string[] = []
  for (const row of rows) {
    if (row.length !== 1) {
      throw new Error("Expected table must have exactly one column")
    }
    tokens.push(row[0])
  }

  return tokens.map((token) => parseExpectedValue(world, token))
}

Then("the execution should succeed", function (this: BobineWorld) {
  if (!this.lastExecutionResult) {
    throw new Error("No execution result found")
  }

  assert.strictEqual(
    this.lastExecutionResult.success,
    true,
    `Execution failed: ${this.lastExecutionResult.error || "Unknown error"}${
      this.lastExecutionResult.logs.length > 0
        ? ` (logs: ${this.lastExecutionResult.logs.join(", ")})`
        : ""
    }`,
  )

  console.log("✅ Execution succeeded")
})

Then("the execution should fail", function (this: BobineWorld) {
  if (!this.lastExecutionResult) {
    throw new Error("No execution result found")
  }

  assert.strictEqual(
    this.lastExecutionResult.success,
    false,
    "Expected execution to fail, but it succeeded",
  )

  console.log("✅ Execution failed as expected")
})

Then(
  "the execution should fail with {string}",
  function (this: BobineWorld, expectedError: string) {
    if (!this.lastExecutionResult) {
      throw new Error("No execution result found")
    }

    assert.strictEqual(
      this.lastExecutionResult.success,
      false,
      "Expected execution to fail, but it succeeded",
    )

    assert.ok(
      this.lastExecutionResult.error?.includes(expectedError),
      `Expected error to contain "${expectedError}", but got: ${this.lastExecutionResult.error}`,
    )

    console.log(`✅ Execution failed with expected error: ${expectedError}`)
  },
)

Then(
  "the returned value should be {string}",
  function (this: BobineWorld, expectedValue: string) {
    if (!this.lastExecutionResult) {
      throw new Error("No execution result found")
    }

    const returned = this.lastExecutionResult.returned

    const expected =
      expectedValue === "" ? "" : parseExpectedValue(this, expectedValue)

    let normalizedReturned = returned

    if (
      Array.isArray(returned) &&
      returned.length === 1 &&
      !Array.isArray(expected)
    ) {
      normalizedReturned = returned[0]
    } else if (
      Array.isArray(returned) &&
      typeof expected === "string" &&
      returned.every((c) => typeof c === "string" && c.length === 1)
    ) {
      normalizedReturned = returned.join("")
      console.log(`Debug: joined character array, now=${normalizedReturned}`)
    }

    if (expected === null && normalizedReturned === null) {
      console.log(`✅ Returned value matches: ${formatValue(expected)}`)
      return
    }

    assert.deepStrictEqual(
      normalizedReturned,
      expected,
      `Expected returned value to be ${formatValue(expected)}, but got ${formatValue(normalizedReturned)}`,
    )

    console.log(`✅ Returned value matches: ${formatValue(expected)}`)
  },
)

Then(
  "the returned value should be:",
  function (this: BobineWorld, table: DataTable) {
    if (!this.lastExecutionResult) {
      throw new Error("No execution result found")
    }

    const expected = parseExpectedTable(this, table)
    const returned = this.lastExecutionResult.returned
    const normalizedReturned =
      Array.isArray(returned) &&
      returned.every((entry) => Array.isArray(entry) && entry.length === 1) &&
      expected.every((entry) => !Array.isArray(entry))
        ? returned.map((entry) => (entry as unknown[])[0])
        : Array.isArray(returned) &&
            returned.length === 1 &&
            Array.isArray(returned[0]) &&
            expected.every((entry) => !Array.isArray(entry))
          ? (returned[0] as unknown[])
          : returned

    assert.deepStrictEqual(
      normalizedReturned,
      expected,
      `Expected returned value to be ${formatValue(expected)}, but got ${formatValue(normalizedReturned)}`,
    )

    console.log(`✅ Returned value matches: ${formatValue(expected)}`)
  },
)

Then(
  "the returned values should be in any order:",
  function (this: BobineWorld, table: DataTable) {
    if (!this.lastExecutionResult) {
      throw new Error("No execution result found")
    }

    const expected = parseExpectedTable(this, table)
    const returned = this.lastExecutionResult.returned
    const normalizedReturned =
      Array.isArray(returned) &&
      returned.length === 1 &&
      Array.isArray(returned[0]) &&
      expected.every((entry) => !Array.isArray(entry))
        ? (returned[0] as unknown[])
        : returned

    if (!Array.isArray(normalizedReturned)) {
      assert.fail(
        `Expected returned value to be an array, but got ${formatValue(normalizedReturned)}`,
      )
    }

    const returnedValues =
      normalizedReturned.length === expected.length + 2 &&
      typeof normalizedReturned[0] === "string" &&
      (normalizedReturned[0] as string).startsWith("bobine.") &&
      typeof normalizedReturned[1] === "bigint"
        ? normalizedReturned.slice(2)
        : normalizedReturned

    const serialize = (value: unknown) =>
      typeof value === "bigint"
        ? `bigint:${value.toString()}`
        : JSON.stringify(value)

    const expectedSorted = expected.map(serialize).sort()
    const returnedSorted = returnedValues.map(serialize).sort()

    assert.deepStrictEqual(
      returnedSorted,
      expectedSorted,
      `Expected returned values (any order) to be ${JSON.stringify(expectedSorted)}, but got ${JSON.stringify(returnedSorted)}`,
    )

    console.log(
      `✅ Returned values match (any order): ${JSON.stringify(expectedSorted)}`,
    )
  },
)

Then(
  "the returned value should be a {string}",
  function (this: BobineWorld, expectedType: string) {
    if (!this.lastExecutionResult) {
      throw new Error("No execution result found")
    }

    const returned = this.lastExecutionResult.returned
    const actualType = typeof returned

    assert.strictEqual(
      actualType,
      expectedType,
      `Expected returned value type to be ${expectedType}, but got ${actualType}`,
    )

    console.log(`✅ Returned value is of type: ${expectedType}`)
  },
)
