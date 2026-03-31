Feature: Forth Contract
  As a user of the Bobine platform
  I want to run a forth program on chain
  So that deterministic stack-based logic can execute in a contract

  Scenario: Execute minimal arithmetic program
    Given I deploy contract "forth"
    When I call "forth" method "init" with params:
      | $forth_creator         |
      | text:: MAIN 2 3 + ;    |
    Then the execution should succeed
    When I call "forth" method "run" with param "pack:[]"
    Then the execution should succeed
    And the returned value should be "bigint:5"

  Scenario: Execute user-defined word from MAIN
    Given I deploy contract "forth"
    When I call "forth" method "init" with params:
      | $forth_creator                        |
      | text:: SQUARE DUP * ; : MAIN SQUARE ; |
    Then the execution should succeed
    When I call "forth" method "run" with param "pack:[bigint:9]"
    Then the execution should succeed
    And the returned value should be "bigint:81"
