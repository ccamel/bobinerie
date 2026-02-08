Feature: Counter Contract
    As a user of the Bobine platform
    I want to maintain a per-account counter
    So that I can increment, read, and reset my own counter value
    And I can only do so through an authenticated call (capability) for my abstract account

  Background:
    Given I deploy contract "counter"
    And I deploy contract "ed25519"
    And I use auth module "ed25519"

  Scenario: Counter lifecycle for one user
    Given I have keys for "Alice"

    When I invoke "counter" method "value" through auth
    Then the execution should succeed
    And the returned value should be "bigint:0"

    When I invoke "counter" method "add" through auth
    Then the execution should succeed
    And the returned value should be "bigint:1"

    When I invoke "counter" method "add" through auth
    Then the execution should succeed
    And the returned value should be "bigint:2"

    When I invoke "counter" method "value" through auth
    Then the execution should succeed
    And the returned value should be "bigint:2"

    When I invoke "counter" method "reset" through auth
    Then the execution should succeed
    And the returned value should be "bigint:0"

  Scenario: Counter isolation between two users
    Given I have keys for "Alice"

    When I invoke "counter" method "add" through auth
    Then the execution should succeed
    And the returned value should be "bigint:1"
    Given I have keys for "Bob"

    When I invoke "counter" method "value" through auth
    Then the execution should succeed
    And the returned value should be "bigint:0"

    When I invoke "counter" method "add" through auth
    Then the execution should succeed
    And the returned value should be "bigint:1"
    Given I have keys for "Alice"

    When I invoke "counter" method "value" through auth
    Then the execution should succeed
    And the returned value should be "bigint:1"

  Scenario: Reset only affects the current user
    Given I have keys for "Alice"

    When I invoke "counter" method "add" through auth
    Then the execution should succeed
    And the returned value should be "bigint:1"

    When I invoke "counter" method "add" through auth
    Then the execution should succeed
    And the returned value should be "bigint:2"
    Given I have keys for "Bob"

    When I invoke "counter" method "add" through auth
    Then the execution should succeed
    And the returned value should be "bigint:1"

    When I invoke "counter" method "reset" through auth
    Then the execution should succeed
    And the returned value should be "bigint:0"
    Given I have keys for "Alice"

    When I invoke "counter" method "value" through auth
    Then the execution should succeed
    And the returned value should be "bigint:2"
