import { strict as assert } from "node:assert"
import { Then } from "@cucumber/cucumber"
import { BobineWorld } from "../world"

Then("the execution should succeed", function (this: BobineWorld) {
  if (!this.lastExecutionResult) {
    throw new Error("No execution result found")
  }

  assert.strictEqual(
    this.lastExecutionResult.success,
    true,
    `Execution failed: ${this.lastExecutionResult.error || "Unknown error"}`,
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

    let expected: unknown
    if (expectedValue === "null") {
      expected = null
    } else if (expectedValue === "true") {
      expected = true
    } else if (expectedValue === "false") {
      expected = false
    } else if (expectedValue.startsWith("bigint:")) {
      expected = BigInt(expectedValue.slice(7))
    } else if (expectedValue.startsWith("number:")) {
      expected = Number(expectedValue.slice(7))
    } else if (expectedValue === "") {
      expected = ""
    } else if (!Number.isNaN(Number(expectedValue))) {
      expected = Number(expectedValue)
    } else {
      expected = expectedValue
    }

    const normalizedReturned =
      Array.isArray(returned) &&
      returned.length === 1 &&
      !Array.isArray(expected)
        ? returned[0]
        : returned

    assert.deepStrictEqual(
      normalizedReturned,
      expected,
      `Expected returned value to be ${JSON.stringify(expected)}, but got ${JSON.stringify(normalizedReturned)}`,
    )

    console.log(`✅ Returned value matches: ${JSON.stringify(expected)}`)
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
