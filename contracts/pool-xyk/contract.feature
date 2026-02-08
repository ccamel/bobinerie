Feature: Pool XYK Contract
  As a user of the Bobine platform
  I want to initialize a constant-product pool safely
  So that tokens and fees are validated and set only once

  Background:
    Given I deploy contract "pool-xyk"
    And I deploy contract "ed25519"
    And I use auth module "ed25519"

  Scenario: Reading tokens and fee before init fails
    Given I have keys for "Alice"
    When I call "$pool-xyk" method "tokens"
    Then the execution should fail
    When I call "$pool-xyk" method "fee_bps"
    Then the execution should fail

  Scenario: Initialize with ordered tokens sets tokens and fee
    Given I have keys for "Alice"
    When I call "$pool-xyk" method "init" with params:
      | $pool-xyk_creator |
      | text:TokenA |
      | text:TokenB |
      | bigint:30 |
    Then the execution should succeed
    When I call "$pool-xyk" method "tokens"
    Then the execution should succeed
    And the returned value should be:
      | text:bobine.pool-xyk/tokens_view |
      | bigint:1 |
      | text:TokenA |
      | text:TokenB |
    When I call "$pool-xyk" method "fee_bps"
    Then the execution should succeed
    And the returned value should be "bigint:30"

  Scenario: Initialize with reversed tokens stores sorted order
    Given I have keys for "Alice"
    When I call "$pool-xyk" method "init" with params:
      | $pool-xyk_creator |
      | text:TokenZ |
      | text:TokenA |
      | bigint:100 |
    Then the execution should succeed
    When I call "$pool-xyk" method "tokens"
    Then the execution should succeed
    And the returned value should be:
      | text:bobine.pool-xyk/tokens_view |
      | bigint:1 |
      | text:TokenA |
      | text:TokenZ |
    When I call "$pool-xyk" method "fee_bps"
    Then the execution should succeed
    And the returned value should be "bigint:100"

  Scenario: Initialization cannot be called twice
    Given I have keys for "Alice"
    When I call "$pool-xyk" method "init" with params:
      | $pool-xyk_creator |
      | text:TokenA |
      | text:TokenB |
      | bigint:25 |
    Then the execution should succeed
    When I call "$pool-xyk" method "init" with params:
      | $pool-xyk_creator |
      | text:TokenA |
      | text:TokenB |
      | bigint:25 |
    Then the execution should fail

  Scenario: Creator mismatch fails self-check
    Given I have keys for "Alice"
    And I have keys for "Bob"
    When I call "$pool-xyk" method "init" with params:
      | address:Bob |
      | text:TokenA |
      | text:TokenB |
      | bigint:25 |
    Then the execution should fail

  Scenario: Token addresses must be different
    Given I have keys for "Alice"
    When I call "$pool-xyk" method "init" with params:
      | $pool-xyk_creator |
      | text:TokenA |
      | text:TokenA |
      | bigint:25 |
    Then the execution should fail

  Scenario: Fee must not be negative
    Given I have keys for "Alice"
    When I call "$pool-xyk" method "init" with params:
      | $pool-xyk_creator |
      | text:TokenA |
      | text:TokenB |
      | bigint:-1 |
    Then the execution should fail

  Scenario: Fee must not exceed 10000 bps
    Given I have keys for "Alice"
    When I call "$pool-xyk" method "init" with params:
      | $pool-xyk_creator |
      | text:TokenA |
      | text:TokenB |
      | bigint:10001 |
    Then the execution should fail

  Scenario: Fee at 0 bps is accepted
    Given I have keys for "Alice"
    When I call "$pool-xyk" method "init" with params:
      | $pool-xyk_creator |
      | text:TokenA |
      | text:TokenB |
      | bigint:0 |
    Then the execution should succeed
    When I call "$pool-xyk" method "fee_bps"
    Then the execution should succeed
    And the returned value should be "bigint:0"

  Scenario: Fee at 10000 bps is accepted
    Given I have keys for "Alice"
    When I call "$pool-xyk" method "init" with params:
      | $pool-xyk_creator |
      | text:TokenA |
      | text:TokenB |
      | bigint:10000 |
    Then the execution should succeed
    When I call "$pool-xyk" method "fee_bps"
    Then the execution should succeed
    And the returned value should be "bigint:10000"

  Scenario: Add liquidity mints LP and updates reserves
    Given I have keys for "Alice"
    And I have keys for "Bob"
    And I deploy contract "token-fungible"
    When I call "token-fungible" method "clone" with param "address:Alice"
    Then the execution should succeed
    And the returned value should be a "string"
    And I remember last returned value as "token_a"
    When I call "$token_a" method "init" with param "address:Alice"
    Then the execution should succeed
    When I call "token-fungible" method "clone" with param "address:Bob"
    Then the execution should succeed
    And the returned value should be a "string"
    And I remember last returned value as "token_b"
    When I call "$token_b" method "init" with param "address:Bob"
    Then the execution should succeed
    Given I have keys for "Alice"
    When I invoke "$token_a" method "mint" through auth with params:
      | address:Alice |
      | bigint:1000 |
    Then the execution should succeed
    Given I have keys for "Bob"
    When I invoke "$token_b" method "mint" through auth with params:
      | address:Alice |
      | bigint:1000 |
    Then the execution should succeed

    When I call "$pool-xyk" method "init" with params:
      | $pool-xyk_creator |
      | $token_a |
      | $token_b |
      | bigint:30 |
    Then the execution should succeed
    When I call "$pool-xyk" method "tokens"
    Then the execution should succeed

    Given I have keys for "Alice"
    When I invoke "$pool-xyk" method "add_liquidity" through auth with params:
      | bigint:100 |
      | bigint:100 |
      | bigint:100 |
      | bigint:100 |
      | bigint:100 |
      | address:Alice |
    Then the execution should succeed
    And the returned value should be:
      | text:bobine.pool-xyk/add_liquidity_view |
      | bigint:1 |
      | bigint:100 |
      | bigint:100 |
      | bigint:100 |
    When I call "$pool-xyk" method "reserves"
    Then the execution should succeed
    And the returned value should be:
      | text:bobine.pool-xyk/reserves_view |
      | bigint:1 |
      | bigint:100 |
      | bigint:100 |
    When I call "$pool-xyk" method "total_supply"
    Then the execution should succeed
    And the returned value should be "bigint:100"
    When I call "$pool-xyk" method "balance_of" with param "address:Alice"
    Then the execution should succeed
    And the returned value should be "bigint:100"

  Scenario: Remove liquidity burns LP and returns tokens
    Given I have keys for "Alice"
    And I have keys for "Bob"
    And I deploy contract "token-fungible"
    When I call "token-fungible" method "clone" with param "address:Alice"
    Then the execution should succeed
    And the returned value should be a "string"
    And I remember last returned value as "token_a"
    When I call "$token_a" method "init" with param "address:Alice"
    Then the execution should succeed
    When I call "token-fungible" method "clone" with param "address:Bob"
    Then the execution should succeed
    And the returned value should be a "string"
    And I remember last returned value as "token_b"
    When I call "$token_b" method "init" with param "address:Bob"
    Then the execution should succeed
    Given I have keys for "Alice"
    When I invoke "$token_a" method "mint" through auth with params:
      | address:Alice |
      | bigint:1000 |
    Then the execution should succeed
    Given I have keys for "Bob"
    When I invoke "$token_b" method "mint" through auth with params:
      | address:Alice |
      | bigint:1000 |
    Then the execution should succeed

    When I call "$pool-xyk" method "init" with params:
      | $pool-xyk_creator |
      | $token_a |
      | $token_b |
      | bigint:30 |
    Then the execution should succeed

    Given I have keys for "Alice"
    When I invoke "$pool-xyk" method "add_liquidity" through auth with params:
      | bigint:100 |
      | bigint:100 |
      | bigint:100 |
      | bigint:100 |
      | bigint:100 |
      | address:Alice |
    Then the execution should succeed

    When I invoke "$pool-xyk" method "remove_liquidity" through auth with params:
      | bigint:40 |
      | bigint:40 |
      | bigint:40 |
      | address:Alice |
    Then the execution should succeed
    And the returned value should be:
      | text:bobine.pool-xyk/remove_liquidity_view |
      | bigint:1 |
      | bigint:40 |
      | bigint:40 |
    When I call "$pool-xyk" method "reserves"
    Then the execution should succeed
    And the returned value should be:
      | text:bobine.pool-xyk/reserves_view |
      | bigint:1 |
      | bigint:60 |
      | bigint:60 |
    When I call "$pool-xyk" method "total_supply"
    Then the execution should succeed
    And the returned value should be "bigint:60"
    When I call "$pool-xyk" method "balance_of" with param "address:Alice"
    Then the execution should succeed
    And the returned value should be "bigint:60"

  Scenario: Swap exact in updates reserves and returns output
    Given I have keys for "Alice"
    And I have keys for "Bob"
    And I deploy contract "token-fungible"
    When I call "token-fungible" method "clone" with param "address:Alice"
    Then the execution should succeed
    And the returned value should be a "string"
    And I remember last returned value as "token_a"
    When I call "$token_a" method "init" with param "address:Alice"
    Then the execution should succeed
    When I call "token-fungible" method "clone" with param "address:Bob"
    Then the execution should succeed
    And the returned value should be a "string"
    And I remember last returned value as "token_b"
    When I call "$token_b" method "init" with param "address:Bob"
    Then the execution should succeed
    Given I have keys for "Alice"
    When I invoke "$token_a" method "mint" through auth with params:
      | address:Alice |
      | bigint:1000 |
    Then the execution should succeed
    Given I have keys for "Bob"
    When I invoke "$token_b" method "mint" through auth with params:
      | address:Alice |
      | bigint:1000 |
    Then the execution should succeed

    When I call "$pool-xyk" method "init" with params:
      | $pool-xyk_creator |
      | $token_a |
      | $token_b |
      | bigint:30 |
    Then the execution should succeed

    Given I have keys for "Alice"
    When I invoke "$pool-xyk" method "add_liquidity" through auth with params:
      | bigint:100 |
      | bigint:100 |
      | bigint:100 |
      | bigint:100 |
      | bigint:100 |
      | address:Alice |
    Then the execution should succeed

    When I invoke "$pool-xyk" method "swap_exact_in" through auth with params:
      | $token_a |
      | bigint:10 |
      | bigint:9 |
      | address:Alice |
    Then the execution should succeed
    And the returned value should be:
      | text:bobine.pool-xyk/swap_exact_in_view |
      | bigint:1 |
      | $token_b |
      | bigint:9 |
    When I call "$pool-xyk" method "reserves"
    Then the execution should succeed
    And the returned values should be in any order:
      | bigint:91 |
      | bigint:110 |
    When I call "$pool-xyk" method "total_supply"
    Then the execution should succeed
    And the returned value should be "bigint:100"
    When I call "$pool-xyk" method "balance_of" with param "address:Alice"
    Then the execution should succeed
    And the returned value should be "bigint:100"

  Scenario: Swap exact in fails when min_out is too high
    Given I have keys for "Alice"
    And I have keys for "Bob"
    And I deploy contract "token-fungible"
    When I call "token-fungible" method "clone" with param "address:Alice"
    Then the execution should succeed
    And the returned value should be a "string"
    And I remember last returned value as "token_a"
    When I call "$token_a" method "init" with param "address:Alice"
    Then the execution should succeed
    When I call "token-fungible" method "clone" with param "address:Bob"
    Then the execution should succeed
    And the returned value should be a "string"
    And I remember last returned value as "token_b"
    When I call "$token_b" method "init" with param "address:Bob"
    Then the execution should succeed
    Given I have keys for "Alice"
    When I invoke "$token_a" method "mint" through auth with params:
      | address:Alice |
      | bigint:1000 |
    Then the execution should succeed
    Given I have keys for "Bob"
    When I invoke "$token_b" method "mint" through auth with params:
      | address:Alice |
      | bigint:1000 |
    Then the execution should succeed

    When I call "$pool-xyk" method "init" with params:
      | $pool-xyk_creator |
      | $token_a |
      | $token_b |
      | bigint:30 |
    Then the execution should succeed

    Given I have keys for "Alice"
    When I invoke "$pool-xyk" method "add_liquidity" through auth with params:
      | bigint:100 |
      | bigint:100 |
      | bigint:100 |
      | bigint:100 |
      | bigint:100 |
      | address:Alice |
    Then the execution should succeed

    When I invoke "$pool-xyk" method "swap_exact_in" through auth with params:
      | $token_a |
      | bigint:10 |
      | bigint:10 |
      | address:Alice |
    Then the execution should fail
