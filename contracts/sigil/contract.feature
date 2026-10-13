Feature: Sigil Contract
  As a Bobine account holder
  I want to mint, inspect, reroll, burn, and bless a sigil
  So that account-bound sigils keep their lifecycle guarantees

  Background:
    Given I deploy contract "sigil"
    And I deploy contract "ed25519"
    And I use auth module "ed25519"
    And I have keys for "Alice"

  Scenario: Sigil lifecycle is account-bound
    When I invoke "sigil" method "address" through auth
    Then the execution should succeed
    And I remember last returned value as "alice_sigil"
    When I call "sigil" method "get" with param "$alice_sigil"
    Then the execution should succeed
    And the returned value should be ""
    When I invoke "sigil" method "mint" through auth with param "text:alice"
    Then the execution should succeed
    When I call "sigil" method "get" with param "$alice_sigil"
    Then the execution should succeed
    And I remember last returned value as "alice_minted_sigil"
    When I call "sigil" method "get" with param "$alice_sigil"
    Then the execution should succeed
    And the returned value should be "$alice_minted_sigil"
    When I invoke "sigil" method "reroll" through auth with param "text:alice-reborn"
    Then the execution should succeed
    When I call "sigil" method "get" with param "$alice_sigil"
    Then the execution should succeed
    And I remember last returned value as "alice_rerolled_sigil"
    When I call "sigil" method "get" with param "$alice_sigil"
    Then the execution should succeed
    And the returned value should be "$alice_rerolled_sigil"
    When I invoke "sigil" method "burn" through auth
    Then the execution should succeed
    And the returned value should be "bigint:2"
    When I call "sigil" method "get" with param "$alice_sigil"
    Then the execution should succeed
    And the returned value should be ""

  Scenario: Blessing rejects a missing sigil and resets on burn
    When I invoke "sigil" method "address" through auth
    Then the execution should succeed
    And I remember last returned value as "alice_sigil"
    When I call "sigil" method "vibes" with param "$alice_sigil"
    Then the execution should succeed
    And the returned value should be:
      | text:bobine.sigil/vibes_view |
      | bigint:2 |
      | text:0 |
      | text:0 |
      | text:0 |
    When I call "sigil" method "bless" with param "$alice_sigil"
    Then the execution should fail with "Sigil not minted"
    When I invoke "sigil" method "mint" through auth with param "text:alice"
    Then the execution should succeed
    When I call "sigil" method "bless" with param "$alice_sigil"
    Then the execution should succeed
    When I invoke "sigil" method "burn" through auth
    Then the execution should succeed
    And the returned value should be "bigint:1"
    When I call "sigil" method "vibes" with param "$alice_sigil"
    Then the execution should succeed
    And the returned value should be:
      | text:bobine.sigil/vibes_view |
      | bigint:2 |
      | text:0 |
      | text:0 |
      | text:0 |
