Feature: Token Fungible Contract
    As a user of the Bobine platform
    I want fungible tokens with balances and allowances
    So that I can mint, transfer, approve, and burn safely

  Background:
    Given I deploy contract "token-fungible"
    And I deploy contract "ed25519"
    And I use auth module "ed25519"
    And I have keys for "Alice"
    When I call "$token-fungible" method "clone" with param "address:Alice"
    Then the execution should succeed
    And the returned value should be a "string"
    And I remember last returned value as "token-fungible"
    When I call "$token-fungible" method "init" with param "address:Alice"
    Then the execution should succeed

  @public-doc
  Scenario: Initial state after initialization
    Given I have keys for "Bob"
    When I call "$token-fungible" method "total_supply"
    Then the execution should succeed
    And the returned value should be "bigint:0"
    When I call "$token-fungible" method "balance" with param "address:Alice"
    Then the execution should succeed
    And the returned value should be "bigint:0"
    When I call "$token-fungible" method "balance" with param "address:Bob"
    Then the execution should succeed
    And the returned value should be "bigint:0"
    When I call "$token-fungible" method "allowance" with params:
      | address:Alice |
      | address:Bob |
    Then the execution should succeed
    And the returned value should be "bigint:0"

  @public-doc
  Scenario: Owner can mint and supply tracks balances
    When I invoke "$token-fungible" method "mint" through auth with params:
      | address:Alice |
      | bigint:100 |
    Then the execution should succeed
    When I call "$token-fungible" method "balance" with param "address:Alice"
    Then the execution should succeed
    And the returned value should be "bigint:100"
    When I call "$token-fungible" method "total_supply"
    Then the execution should succeed
    And the returned value should be "bigint:100"

  Scenario: Non-owner cannot mint
    Given I have keys for "Bob"
    When I invoke "$token-fungible" method "mint" through auth with params:
      | address:Bob |
      | bigint:50 |
    Then the execution should fail with "Unauthorized"

  @public-doc
  Scenario: Transfer moves balances between users
    Given I have keys for "Bob"
    And I have keys for "Alice"
    When I invoke "$token-fungible" method "mint" through auth with params:
      | address:Alice |
      | bigint:100 |
    Then the execution should succeed
    When I invoke "$token-fungible" method "transfer" through auth with params:
      | address:Bob |
      | bigint:40 |
    Then the execution should succeed
    When I call "$token-fungible" method "balance" with param "address:Alice"
    Then the execution should succeed
    And the returned value should be "bigint:60"
    When I call "$token-fungible" method "balance" with param "address:Bob"
    Then the execution should succeed
    And the returned value should be "bigint:40"
    When I call "$token-fungible" method "total_supply"
    Then the execution should succeed
    And the returned value should be "bigint:100"

  Scenario: Transfer fails with insufficient balance
    Given I have keys for "Bob"
    And I have keys for "Alice"
    When I invoke "$token-fungible" method "mint" through auth with params:
      | address:Alice |
      | bigint:10 |
    Then the execution should succeed
    When I invoke "$token-fungible" method "transfer" through auth with params:
      | address:Bob |
      | bigint:25 |
    Then the execution should fail with "Insufficient balance"
    When I call "$token-fungible" method "balance" with param "address:Alice"
    Then the execution should succeed
    And the returned value should be "bigint:10"
    When I call "$token-fungible" method "balance" with param "address:Bob"
    Then the execution should succeed
    And the returned value should be "bigint:0"
    When I call "$token-fungible" method "total_supply"
    Then the execution should succeed
    And the returned value should be "bigint:10"

  @public-doc
  Scenario: Approve and transfer_from consume allowance
    Given I have keys for "Bob"
    And I have keys for "Charlie"
    And I have keys for "Alice"
    When I invoke "$token-fungible" method "mint" through auth with params:
      | address:Alice |
      | bigint:100 |
    Then the execution should succeed
    When I invoke "$token-fungible" method "approve" through auth with params:
      | address:Bob |
      | bigint:30 |
    Then the execution should succeed
    When I call "$token-fungible" method "allowance" with params:
      | address:Alice |
      | address:Bob |
    Then the execution should succeed
    And the returned value should be "bigint:30"
    Given I have keys for "Bob"
    When I invoke "$token-fungible" method "transfer_from" through auth with params:
      | address:Alice |
      | address:Charlie |
      | bigint:20 |
    Then the execution should succeed
    When I call "$token-fungible" method "allowance" with params:
      | address:Alice |
      | address:Bob |
    Then the execution should succeed
    And the returned value should be "bigint:10"
    When I call "$token-fungible" method "balance" with param "address:Alice"
    Then the execution should succeed
    And the returned value should be "bigint:80"
    When I call "$token-fungible" method "balance" with param "address:Charlie"
    Then the execution should succeed
    And the returned value should be "bigint:20"
    When I call "$token-fungible" method "total_supply"
    Then the execution should succeed
    And the returned value should be "bigint:100"

  Scenario: Approve requires reset-to-zero
    Given I have keys for "Bob"
    And I have keys for "Alice"
    When I invoke "$token-fungible" method "approve" through auth with params:
      | address:Bob |
      | bigint:5 |
    Then the execution should succeed
    When I invoke "$token-fungible" method "approve" through auth with params:
      | address:Bob |
      | bigint:7 |
    Then the execution should fail with "Must reset allowance to 0 before changing"
    When I invoke "$token-fungible" method "approve" through auth with params:
      | address:Bob |
      | bigint:0 |
    Then the execution should succeed
    When I invoke "$token-fungible" method "approve" through auth with params:
      | address:Bob |
      | bigint:7 |
    Then the execution should succeed
    When I call "$token-fungible" method "allowance" with params:
      | address:Alice |
      | address:Bob |
    Then the execution should succeed
    And the returned value should be "bigint:7"

  Scenario: transfer_from fails with insufficient allowance
    Given I have keys for "Bob"
    And I have keys for "Alice"
    When I invoke "$token-fungible" method "mint" through auth with params:
      | address:Alice |
      | bigint:50 |
    Then the execution should succeed
    When I invoke "$token-fungible" method "approve" through auth with params:
      | address:Bob |
      | bigint:10 |
    Then the execution should succeed
    Given I have keys for "Bob"
    When I invoke "$token-fungible" method "transfer_from" through auth with params:
      | address:Alice |
      | address:Bob |
      | bigint:15 |
    Then the execution should fail with "Insufficient allowance"
    When I call "$token-fungible" method "allowance" with params:
      | address:Alice |
      | address:Bob |
    Then the execution should succeed
    And the returned value should be "bigint:10"
    When I call "$token-fungible" method "balance" with param "address:Alice"
    Then the execution should succeed
    And the returned value should be "bigint:50"
    When I call "$token-fungible" method "balance" with param "address:Bob"
    Then the execution should succeed
    And the returned value should be "bigint:0"

  @public-doc
  Scenario: Burn reduces balance and total supply
    When I invoke "$token-fungible" method "mint" through auth with params:
      | address:Alice |
      | bigint:100 |
    Then the execution should succeed
    When I invoke "$token-fungible" method "burn" through auth with param "bigint:40"
    Then the execution should succeed
    When I call "$token-fungible" method "balance" with param "address:Alice"
    Then the execution should succeed
    And the returned value should be "bigint:60"
    When I call "$token-fungible" method "total_supply"
    Then the execution should succeed
    And the returned value should be "bigint:60"

  Scenario: Burn fails with insufficient balance
    When I invoke "$token-fungible" method "burn" through auth with param "bigint:1"
    Then the execution should fail with "Insufficient balance"
