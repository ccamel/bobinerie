Feature: Forth Contract
  As a user of the Bobine platform
  I want to run a forth program on chain
  So that deterministic stack-based logic can execute in a contract

  @public-doc
  Scenario: Execute minimal arithmetic program
    Given I deploy contract "forth"
    When I call "forth" method "init" with params:
      | $forth_creator         |
      | text:: MAIN 2 3 + ;    |
    Then the execution should succeed
    When I call "forth" method "run" with param "pack:[]"
    Then the execution should succeed
    And the returned value should be "bigint:5"

  @public-doc
  Scenario: Execute user-defined word from MAIN
    Given I deploy contract "forth"
    When I call "forth" method "init" with params:
      | $forth_creator                        |
      | text:: SQUARE DUP * ; : MAIN SQUARE ; |
    Then the execution should succeed
    When I call "forth" method "run" with param "pack:[bigint:9]"
    Then the execution should succeed
    And the returned value should be "bigint:81"

  @public-doc
  Scenario: Execute case-insensitive program with parenthesized comment
    Given I deploy contract "forth"
    When I call "forth" method "init" with params:
      | $forth_creator                               |
      | text:: MAIN ( comment ) 7 DUP * ;           |
    Then the execution should succeed
    When I call "forth" method "run" with param "pack:[]"
    Then the execution should succeed
    And the returned value should be "bigint:49"

  @public-doc
  Scenario: Execute case-insensitive user-defined word
    Given I deploy contract "forth"
    When I call "forth" method "init" with params:
      | $forth_creator                              |
      | text:: SquAre DUP * ; : MAIN square ;      |
    Then the execution should succeed
    When I call "forth" method "run" with param "pack:[bigint:8]"
    Then the execution should succeed
    And the returned value should be "bigint:64"

  @public-doc
  Scenario: Execute normalized integer literals
    Given I deploy contract "forth"
    When I call "forth" method "init" with params:
      | $forth_creator                    |
      | text:: MAIN +001 -0 + +002 + ;   |
    Then the execution should succeed
    When I call "forth" method "run" with param "pack:[]"
    Then the execution should succeed
    And the returned value should be "bigint:3"

  @public-doc
  Scenario: Execute IF THEN conditional
    Given I deploy contract "forth"
    When I call "forth" method "init" with params:
      | $forth_creator                  |
      | text:: MAIN 0 IF 7 THEN 9 ;     |
    Then the execution should succeed
    When I call "forth" method "run" with param "pack:[]"
    Then the execution should succeed
    And the returned value should be "bigint:9"

  @public-doc
  Scenario: Execute IF ELSE THEN conditional
    Given I deploy contract "forth"
    When I call "forth" method "init" with params:
      | $forth_creator                       |
      | text:: MAIN 0 IF 7 ELSE 9 THEN ;    |
    Then the execution should succeed
    When I call "forth" method "run" with param "pack:[]"
    Then the execution should succeed
    And the returned value should be "bigint:9"

  @public-doc
  Scenario: Execute MAX program on two inputs
    Given I deploy contract "forth"
    When I call "forth" method "init" with params:
      | $forth_creator                                     |
      | text:: MAX 2DUP < IF SWAP THEN DROP ; : MAIN MAX ; |
    Then the execution should succeed
    When I call "forth" method "run" with param "pack:[bigint:7,bigint:9]"
    Then the execution should succeed
    And the returned value should be "bigint:9"

  @public-doc
  Scenario: Execute BEGIN UNTIL loop to sum integers
    Given I deploy contract "forth"
    When I call "forth" method "init" with params:
      | $forth_creator                                                                  |
      | text:: SUMDOWN 0 SWAP BEGIN SWAP OVER + SWAP 1 - DUP 0= UNTIL DROP ; : MAIN SUMDOWN ; |
    Then the execution should succeed
    When I call "forth" method "run" with param "pack:[bigint:4]"
    Then the execution should succeed
    And the returned value should be "bigint:10"

  Scenario: Running before initialization fails
    Given I deploy contract "forth"
    When I call "forth" method "run" with param "pack:[]"
    Then the execution should fail with "Program not initialized"

  Scenario: Initializing with an unknown word fails
    Given I deploy contract "forth"
    When I call "forth" method "init" with params:
      | $forth_creator            |
      | text:: MAIN MYSTERYWORD ; |
    Then the execution should fail with "Unknown word"

  Scenario: Initializing with an unexpected closing parenthesis fails
    Given I deploy contract "forth"
    When I call "forth" method "init" with params:
      | $forth_creator   |
      | text:: MAIN ) ;  |
    Then the execution should fail with "Unexpected )"

  Scenario: Initializing with an unclosed parenthesized comment fails
    Given I deploy contract "forth"
    When I call "forth" method "init" with params:
      | $forth_creator        |
      | text:: MAIN ( test ;  |
    Then the execution should fail with "Unclosed comment"

  Scenario: Initializing with duplicate MAIN definitions fails
    Given I deploy contract "forth"
    When I call "forth" method "init" with params:
      | $forth_creator               |
      | text:: MAIN 1 ; : MAIN 2 ;  |
    Then the execution should fail with "Duplicate MAIN"

  Scenario: Initializing with a reserved control word name fails
    Given I deploy contract "forth"
    When I call "forth" method "init" with params:
      | $forth_creator      |
      | text:: IF 1 ;       |
    Then the execution should fail with "Reserved definition name"

  Scenario: Initializing with a reserved primitive name fails
    Given I deploy contract "forth"
    When I call "forth" method "init" with params:
      | $forth_creator      |
      | text:: DUP 1 ;      |
    Then the execution should fail with "Reserved definition name"

  Scenario: Initializing with instructions outside a definition fails
    Given I deploy contract "forth"
    When I call "forth" method "init" with params:
      | $forth_creator |
      | text:1         |
    Then the execution should fail with "Instruction outside definition"

  Scenario: Initializing with an unexpected ELSE fails
    Given I deploy contract "forth"
    When I call "forth" method "init" with params:
      | $forth_creator       |
      | text:: MAIN ELSE ;   |
    Then the execution should fail with "Unexpected ELSE"

  Scenario: Initializing with an unexpected THEN fails
    Given I deploy contract "forth"
    When I call "forth" method "init" with params:
      | $forth_creator       |
      | text:: MAIN THEN ;   |
    Then the execution should fail with "Unexpected THEN"

  Scenario: Initializing with an unexpected UNTIL fails
    Given I deploy contract "forth"
    When I call "forth" method "init" with params:
      | $forth_creator        |
      | text:: MAIN UNTIL ;   |
    Then the execution should fail with "Unexpected UNTIL"

  Scenario: Initializing with an unclosed IF fails
    Given I deploy contract "forth"
    When I call "forth" method "init" with params:
      | $forth_creator        |
      | text:: MAIN 1 IF 2 ;  |
    Then the execution should fail with "Unclosed IF"

  Scenario: Initializing with an unclosed BEGIN fails
    Given I deploy contract "forth"
    When I call "forth" method "init" with params:
      | $forth_creator             |
      | text:: MAIN BEGIN 1 0= ;   |
    Then the execution should fail with "Unclosed BEGIN"

  Scenario: Running with stack underflow fails
    Given I deploy contract "forth"
    When I call "forth" method "init" with params:
      | $forth_creator     |
      | text:: MAIN DROP ; |
    Then the execution should succeed
    When I call "forth" method "run" with param "pack:[]"
    Then the execution should fail with "Stack underflow"

  Scenario: Running with division by zero fails
    Given I deploy contract "forth"
    When I call "forth" method "init" with params:
      | $forth_creator        |
      | text:: MAIN 7 0 / ;   |
    Then the execution should succeed
    When I call "forth" method "run" with param "pack:[]"
    Then the execution should fail with "Division by zero"

  Scenario: Running with modulo by zero fails
    Given I deploy contract "forth"
    When I call "forth" method "init" with params:
      | $forth_creator          |
      | text:: MAIN 7 0 MOD ;   |
    Then the execution should succeed
    When I call "forth" method "run" with param "pack:[]"
    Then the execution should fail with "Modulo by zero"

  @public-doc
  Scenario: Source and blob hashes are exposed after initialization
    Given I deploy contract "forth"
    When I call "forth" method "init" with params:
      | $forth_creator      |
      | text:: MAIN 4 5 + ; |
    Then the execution should succeed
    When I call "forth" method "source_hash"
    Then the execution should succeed
    And the returned value should be a "string"
    When I call "forth" method "blob_hash"
    Then the execution should succeed
    And the returned value should be a "string"
