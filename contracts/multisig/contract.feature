Feature: Multisig Contract
    As a user of the Bobine platform
    I want threshold-based authorization over call execution
    So that sensitive actions are executed only after enough signer approvals

  Background:
    Given I deploy contract "multisig"
    And I deploy contract "ed25519"
    And I use auth module "ed25519"
    And I have keys for "Alice"
    And I have keys for "Bob"
    And I have keys for "Carol"

  @public-doc
  Scenario: Initialization canonicalizes signers (sort + dedupe)
    When I call "multisig" method "init" with param "pack:[text:bobine.multisig/policy,bigint:1,bigint:2,pack:[text:charlie,text:alice,text:alice,text:bob]]"
    Then the execution should succeed

    When I call "multisig" method "policy"
    Then the execution should succeed
    And the returned value should be "pack:[text:bobine.multisig/policy,bigint:1,bigint:2,pack:[text:alice,text:bob,text:charlie]]"

  Scenario: Contract can only be initialized once
    When I call "multisig" method "init" with param "pack:[text:bobine.multisig/policy,bigint:1,bigint:1,pack:[text:alice]]"
    Then the execution should succeed

    When I call "multisig" method "init" with param "pack:[text:bobine.multisig/policy,bigint:1,bigint:1,pack:[text:bob]]"
    Then the execution should fail with "Already initialized"

  @public-doc
  Scenario: Threshold approvals are required, then execution is idempotent
    Given I deploy contract "say-my-name"

    When I call "multisig" method "init" with param "pack:[text:bobine.multisig/policy,bigint:1,bigint:2,pack:[address:Alice,address:Bob,address:Carol]]"
    Then the execution should succeed

    Given I have keys for "Alice"
    When I invoke "multisig" method "propose" through auth with param "pack:[text:bobine.multisig/call,bigint:1,$say-my-name,text:say_my_name,pack:[text:from-multisig]]"
    Then the execution should succeed
    And I remember last returned value as "p1"

    When I call "multisig" method "proposal" with param "$p1"
    Then the execution should succeed
    And the returned value should be "pack:[text:bobine.multisig/proposal_view,bigint:1,$p1,pack:[text:bobine.multisig/call,bigint:1,$say-my-name,text:say_my_name,pack:[text:from-multisig]],address:Alice,bigint:1,pack:[address:Alice],bigint:0]"

    When I call "multisig" method "execute" with param "$p1"
    Then the execution should fail with "Insufficient approvals"

    Given I have keys for "Bob"
    When I invoke "multisig" method "approve" through auth with param "$p1"
    Then the execution should succeed
    And the returned value should be "bigint:2"

    When I call "multisig" method "execute" with param "$p1"
    Then the execution should succeed
    And the returned value should be ""

    When I call "multisig" method "execute" with param "$p1"
    Then the execution should succeed
    And the returned value should be ""

    When I call "say-my-name" method "say_my_name" with param "text:check"
    Then the execution should succeed
    And the returned value should be "from-multisig"

  Scenario: Approve is idempotent for the same signer
    Given I deploy contract "say-my-name"

    When I call "multisig" method "init" with param "pack:[text:bobine.multisig/policy,bigint:1,bigint:2,pack:[address:Alice,address:Bob]]"
    Then the execution should succeed

    Given I have keys for "Alice"
    When I invoke "multisig" method "propose" through auth with param "pack:[text:bobine.multisig/call,bigint:1,$say-my-name,text:say_my_name,pack:[text:idempotent-approve]]"
    Then the execution should succeed
    And I remember last returned value as "p-idem"

    Given I have keys for "Bob"
    When I invoke "multisig" method "approve" through auth with param "$p-idem"
    Then the execution should succeed
    And the returned value should be "bigint:2"

    When I invoke "multisig" method "approve" through auth with param "$p-idem"
    Then the execution should succeed
    And the returned value should be "bigint:2"

  Scenario: Non-signer cannot propose or approve
    Given I deploy contract "say-my-name"

    When I call "multisig" method "init" with param "pack:[text:bobine.multisig/policy,bigint:1,bigint:2,pack:[address:Alice,address:Bob]]"
    Then the execution should succeed

    Given I have keys for "Carol"
    When I invoke "multisig" method "propose" through auth with param "pack:[text:bobine.multisig/call,bigint:1,$say-my-name,text:say_my_name,pack:[text:unauthorized]]"
    Then the execution should fail with "Unauthorized"

    Given I have keys for "Alice"
    When I invoke "multisig" method "propose" through auth with param "pack:[text:bobine.multisig/call,bigint:1,$say-my-name,text:say_my_name,pack:[text:authorized]]"
    Then the execution should succeed
    And I remember last returned value as "p2"

    Given I have keys for "Carol"
    When I invoke "multisig" method "approve" through auth with param "$p2"
    Then the execution should fail with "Unauthorized"

  Scenario: Closed proposal is not executable
    Given I deploy contract "say-my-name"

    When I call "multisig" method "init" with param "pack:[text:bobine.multisig/policy,bigint:1,bigint:2,pack:[address:Alice,address:Bob]]"
    Then the execution should succeed

    Given I have keys for "Alice"
    When I invoke "multisig" method "propose" through auth with param "pack:[text:bobine.multisig/call,bigint:1,$say-my-name,text:say_my_name,pack:[text:should-not-run]]"
    Then the execution should succeed
    And I remember last returned value as "p3"

    Given I have keys for "Bob"
    When I invoke "multisig" method "close" through auth with param "$p3"
    Then the execution should succeed

    When I call "multisig" method "proposal" with param "$p3"
    Then the execution should succeed
    And the returned value should be "pack:[text:bobine.multisig/proposal_view,bigint:1,$p3,pack:[text:bobine.multisig/call,bigint:1,$say-my-name,text:say_my_name,pack:[text:should-not-run]],address:Alice,bigint:1,pack:[address:Alice],bigint:2]"

    When I call "multisig" method "execute" with param "$p3"
    Then the execution should fail with "Proposal is closed"

  @public-doc
  Scenario: Policy update is only allowed through an executed multisig proposal
    Given I deploy contract "say-my-name"

    When I call "multisig" method "init" with param "pack:[text:bobine.multisig/policy,bigint:1,bigint:2,pack:[address:Alice,address:Bob,address:Carol]]"
    Then the execution should succeed

    When I call "multisig" method "update_policy" with param "pack:[text:bobine.multisig/policy,bigint:1,bigint:1,pack:[text:z,text:a,text:a]]"
    Then the execution should fail with "Unauthorized"

    Given I have keys for "Alice"
    When I invoke "multisig" method "propose" through auth with param "pack:[text:bobine.multisig/call,bigint:1,$multisig,text:update_policy,pack:[pack:[text:bobine.multisig/policy,bigint:1,bigint:1,pack:[text:z,text:a,text:a]]]]"
    Then the execution should succeed
    And I remember last returned value as "p4"

    Given I have keys for "Bob"
    When I invoke "multisig" method "approve" through auth with param "$p4"
    Then the execution should succeed
    And the returned value should be "bigint:2"

    When I call "multisig" method "execute" with param "$p4"
    Then the execution should succeed
    And the returned value should be "null"

    When I call "multisig" method "policy"
    Then the execution should succeed
    And the returned value should be "pack:[text:bobine.multisig/policy,bigint:1,bigint:1,pack:[text:a,text:z]]"

    Given I have keys for "Alice"
    When I invoke "multisig" method "propose" through auth with param "pack:[text:bobine.multisig/call,bigint:1,$say-my-name,text:say_my_name,pack:[text:no-longer-signer]]"
    Then the execution should fail with "Unauthorized"

  Scenario: Initialization rejects invalid thresholds
    When I call "multisig" method "init" with param "pack:[text:bobine.multisig/policy,bigint:1,bigint:0,pack:[text:alice]]"
    Then the execution should fail with "Invalid policy"

    When I call "multisig" method "init" with param "pack:[text:bobine.multisig/policy,bigint:1,bigint:2,pack:[text:alice]]"
    Then the execution should fail with "Invalid policy"
