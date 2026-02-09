# Multisig ![governance](https://img.shields.io/badge/governance-FF6B35)

Threshold-based authorization contract for Bobine call execution.

<!-- DEPLOYMENTS:START -->

## Deployments

- **garage-hazae41-bob0**: `811c45e38f318f3a8adb7d56466c5b45c32587c8417e3c01efb5af71bdb47950`
- **garage-ccamel-bob0**: `83b60b6281355df532de9ebba332a4abd76456764fc1b8dd1cebf12bc872c347`

<!-- DEPLOYMENTS:END -->

## Usage Scenarios

<!-- FEATURES:START -->

As a user of the Bobine platform
I want threshold-based authorization over call execution
So that sensitive actions are executed only after enough signer approvals

These walkthroughs come from `contract.feature` scenarios tagged `@public-doc`.

### Shared Setup

This setup is applied before each published scenario.

Here are the steps:

- **Given** I deploy contract `"multisig"`; and I deploy contract `"ed25519"`; and I use auth module `"ed25519"`; and I have keys for `"Alice"`; and I have keys for `"Bob"`; and I have keys for `"Carol"`

### 1. Initialization canonicalizes signers (sort + dedupe)

This scenario demonstrates a practical interaction sequence for this contract.

Here are the steps of the scenario:

- **When** I call `"multisig"` method `"init"` with param `"pack:[text:bobine.multisig/policy,bigint:1,bigint:2,pack:[text:charlie,text:alice,text:alice,text:bob]]"`

- **Then** the execution should succeed

- **When** I call `"multisig"` method `"policy"`

- **Then** the execution should succeed; and the returned value should be `"pack:[text:bobine.multisig/policy,bigint:1,bigint:2,pack:[text:alice,text:bob,text:charlie]]"`

### 2. Threshold approvals are required, then execution is idempotent

This scenario demonstrates a practical interaction sequence for this contract.

Here are the steps of the scenario:

- **Given** I deploy contract `"say-my-name"`

- **When** I call `"multisig"` method `"init"` with param `"pack:[text:bobine.multisig/policy,bigint:1,bigint:2,pack:[address:Alice,address:Bob,address:Carol]]"`

- **Then** the execution should succeed

- **Given** I have keys for `"Alice"`

- **When** I invoke `"multisig"` method `"propose"` through auth with param `"pack:[text:bobine.multisig/call,bigint:1,$say-my-name,text:say_my_name,pack:[text:from-multisig]]"`

- **Then** the execution should succeed; and I remember last returned value as `"p1"`

- **When** I call `"multisig"` method `"proposal"` with param `"$p1"`

- **Then** the execution should succeed; and the returned value should be `"pack:[text:bobine.multisig/proposal_view,bigint:1,$p1,pack:[text:bobine.multisig/call,bigint:1,$say-my-name,text:say_my_name,pack:[text:from-multisig]],address:Alice,bigint:1,pack:[address:Alice],bigint:0]"`

- **When** I call `"multisig"` method `"execute"` with param `"$p1"`

- **Then** the execution should fail with `"Insufficient approvals"`

- **Given** I have keys for `"Bob"`

- **When** I invoke `"multisig"` method `"approve"` through auth with param `"$p1"`

- **Then** the execution should succeed; and the returned value should be `"bigint:2"`

- **When** I call `"multisig"` method `"execute"` with param `"$p1"`

- **Then** the execution should succeed; and the returned value should be `""`

- **When** I call `"multisig"` method `"execute"` with param `"$p1"`

- **Then** the execution should succeed; and the returned value should be `""`

- **When** I call `"say-my-name"` method `"say_my_name"` with param `"text:check"`

- **Then** the execution should succeed; and the returned value should be `"from-multisig"`

### 3. Policy update is only allowed through an executed multisig proposal

This scenario demonstrates a practical interaction sequence for this contract.

Here are the steps of the scenario:

- **Given** I deploy contract `"say-my-name"`

- **When** I call `"multisig"` method `"init"` with param `"pack:[text:bobine.multisig/policy,bigint:1,bigint:2,pack:[address:Alice,address:Bob,address:Carol]]"`

- **Then** the execution should succeed

- **When** I call `"multisig"` method `"update_policy"` with param `"pack:[text:bobine.multisig/policy,bigint:1,bigint:1,pack:[text:z,text:a,text:a]]"`

- **Then** the execution should fail with `"Unauthorized"`

- **Given** I have keys for `"Alice"`

- **When** I invoke `"multisig"` method `"propose"` through auth with param `"pack:[text:bobine.multisig/call,bigint:1,$multisig,text:update_policy,pack:[pack:[text:bobine.multisig/policy,bigint:1,bigint:1,pack:[text:z,text:a,text:a]]]]"`

- **Then** the execution should succeed; and I remember last returned value as `"p4"`

- **Given** I have keys for `"Bob"`

- **When** I invoke `"multisig"` method `"approve"` through auth with param `"$p4"`

- **Then** the execution should succeed; and the returned value should be `"bigint:2"`

- **When** I call `"multisig"` method `"execute"` with param `"$p4"`

- **Then** the execution should succeed; and the returned value should be `"null"`

- **When** I call `"multisig"` method `"policy"`

- **Then** the execution should succeed; and the returned value should be `"pack:[text:bobine.multisig/policy,bigint:1,bigint:1,pack:[text:a,text:z]]"`

- **Given** I have keys for `"Alice"`

- **When** I invoke `"multisig"` method `"propose"` through auth with param `"pack:[text:bobine.multisig/call,bigint:1,$say-my-name,text:say_my_name,pack:[text:no-longer-signer]]"`

- **Then** the execution should fail with `"Unauthorized"`

<!-- FEATURES:END -->

## Methods

<!-- METHODS:START -->

### 🔹 `approve(session, proposalId)`

Approve an open proposal.

Approval is idempotent for a given signer.

**Parameters:**

- `session` - Caller session.
- `proposalId` - Proposal id.

**Returns:**

Updated approval count.

### 🔹 `close(session, proposalId)`

Close an open proposal without execution.

Authorization rule: any signer from the proposal policy snapshot can close.

**Parameters:**

- `session` - Caller session.
- `proposalId` - Proposal id.

### 🔹 `execute(proposalId)`

Execute an open proposal once threshold is met.

Execution is idempotent: once executed, repeated calls return
the stored execution result without re-running the call.

**Parameters:**

- `proposalId` - Proposal id.

**Returns:**

Result of the executed call.

### 🔹 `init(policyInput)`

Initialize the multisig policy.

**Parameters:**

- `policyInput` - Canonical policy tuple:
- [0] "bobine.multisig/policy"
- [1] 1
- [2] threshold
- [3] signers (pack list of textref)

### 🔹 `policy()`

Read the stored canonical policy tuple.

**Returns:**

Canonical policy tuple.

### 🔹 `proposal(proposalId)`

Read the current proposal view.

ProposalView tuple:

- [0] "bobine.multisig/proposal_view"
- [1] 1
- [2] proposal_id
- [3] call
- [4] proposer
- [5] approvals_count
- [6] approvals
- [7] status (0=open, 1=executed, 2=closed)

**Parameters:**

- `proposalId` - Proposal id.

**Returns:**

Canonical proposal view tuple.

### 🔹 `propose(session, call)`

Propose a canonical call intent.

Call tuple format:

- [0] "bobine.multisig/call"
- [1] 1
- [2] target module address (textref)
- [3] method name (textref)
- [4] params (packref)

The proposer is auto-approved.

**Parameters:**

- `session` - Caller session.
- `call` - Canonical call tuple.

**Returns:**

Deterministic proposal id (blobref).

### 🔹 `update_policy(policyInput)`

Update the multisig policy.

This method is intentionally restricted and can only be called while a
proposal is executing, when that proposal explicitly targets:
[self, "update_policy", [policyInput]]

**Parameters:**

- `policyInput` - New policy tuple.

<!-- METHODS:END -->
