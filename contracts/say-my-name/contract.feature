Feature: Say My Name Contract
  As a user of the Bobine platform
  I want to store and retrieve my name
  So that the contract remembers who I am

  Background:
    Given I deploy contract "say-my-name"

  Scenario: Set my name for the first time
    When I call "say-my-name" method "sayMyName" with param "text:Alice"
    Then the execution should succeed
    And the returned value should be "null"

  Scenario: Retrieve my name after setting it
    When I call "say-my-name" method "sayMyName" with param "text:Bob"
    Then the execution should succeed
    And the returned value should be "null"
    When I call "say-my-name" method "sayMyName" with param "text:Charlie"
    Then the execution should succeed
    And the returned value should be "Bob"

  Scenario: Update my name
    When I call "say-my-name" method "sayMyName" with param "text:Charlie"
    Then the execution should succeed
    And the returned value should be "null"
    When I call "say-my-name" method "sayMyName" with param "text:David"
    Then the execution should succeed
    And the returned value should be "Charlie"
    When I call "say-my-name" method "sayMyName" with param "text:Eve"
    Then the execution should succeed
    And the returned value should be "David"

  Scenario: Empty name handling
    When I call "say-my-name" method "sayMyName" with param "text:"
    Then the execution should succeed
    And the returned value should be "null"
    When I call "say-my-name" method "sayMyName" with param "text:Zed"
    Then the execution should succeed
    And the returned value should be ""
