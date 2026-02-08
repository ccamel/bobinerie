# Multisig ![governance](https://img.shields.io/badge/governance-FF6B35)

Threshold-based authorization contract for Bobine call execution.

<!-- DEPLOYMENTS:START -->

## Deployments

- **garage-hazae41-bob0**: `83b60b6281355df532de9ebba332a4abd76456764fc1b8dd1cebf12bc872c347`
- **garage-ccamel-bob0**: `a424686ac5d7a3f5afafa0746070d3373470a85250ae2697c28fa889d222631e`

<!-- DEPLOYMENTS:END -->

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
