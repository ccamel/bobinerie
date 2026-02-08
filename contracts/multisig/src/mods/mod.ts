import {
  bigintref,
  bigints,
  blobref,
  blobs,
  modules,
  packref,
  packs,
  sha256,
  storage,
  textref,
  texts,
} from "@hazae41/stdbob"

const DOMAIN = "bobine.multisig"

const version = (): bigintref => bigints.one()
const domainTag = (suffix: string): textref =>
  texts.fromString(`${DOMAIN}/${suffix}`)

const statusOpen = (): bigintref => bigints.zero()
const statusExecuted = (): bigintref => bigints.one()
const statusClosed = (): bigintref => bigints.two()

const updatePolicyMethod = (): textref => texts.fromString("update_policy")

function bigintFromI32(value: i32): bigintref {
  return bigints.fromInt64(value as i64)
}

function fail(message: string): void {
  throw new Error(message)
}

function samePack(left: packref, right: packref): bool {
  return blobs.equals(blobs.encode(left), blobs.encode(right))
}

function signerHex(signer: textref): string {
  return texts.toString(blobs.toBase16(texts.toUtf8(signer)))
}

function signerFromHex(hex: string): textref {
  return texts.fromUtf8(blobs.fromBase16(texts.fromString(hex)))
}

function sortStrings(values: string[]): void {
  for (let i = 0; i < values.length; i++) {
    let selected = i

    for (let j = i + 1; j < values.length; j++) {
      if (values[j] < values[selected]) {
        selected = j
      }
    }

    if (selected !== i) {
      const tmp = values[i]
      values[i] = values[selected]
      values[selected] = tmp
    }
  }
}

function uniqueSortedStrings(values: string[]): string[] {
  if (values.length < 1) return values

  const unique: string[] = []
  let previous = ""

  for (let i = 0; i < values.length; i++) {
    const value = values[i]

    if (i === 0 || value !== previous) {
      unique.push(value)
      previous = value
    }
  }

  return unique
}

function normalizeSignerHexes(signers: packref): string[] {
  if (!signers) fail("Invalid policy")

  const length = packs.length(signers)
  if (length < 1) fail("Invalid policy")

  const values = new Array<string>(length)

  for (let i = 0; i < length; i++) {
    values[i] = signerHex(packs.get<textref>(signers, i))
  }

  sortStrings(values)

  return uniqueSortedStrings(values)
}

function packChunkFromSignerHexes(
  signerHexes: string[],
  start: i32,
  count: i32,
): packref {
  switch (count) {
    case 1:
      return packs.create1(signerFromHex(signerHexes[start]))
    case 2:
      return packs.create2(
        signerFromHex(signerHexes[start]),
        signerFromHex(signerHexes[start + 1]),
      )
    case 3:
      return packs.create3(
        signerFromHex(signerHexes[start]),
        signerFromHex(signerHexes[start + 1]),
        signerFromHex(signerHexes[start + 2]),
      )
    case 4:
      return packs.create4(
        signerFromHex(signerHexes[start]),
        signerFromHex(signerHexes[start + 1]),
        signerFromHex(signerHexes[start + 2]),
        signerFromHex(signerHexes[start + 3]),
      )
    case 5:
      return packs.create5(
        signerFromHex(signerHexes[start]),
        signerFromHex(signerHexes[start + 1]),
        signerFromHex(signerHexes[start + 2]),
        signerFromHex(signerHexes[start + 3]),
        signerFromHex(signerHexes[start + 4]),
      )
    case 6:
      return packs.create6(
        signerFromHex(signerHexes[start]),
        signerFromHex(signerHexes[start + 1]),
        signerFromHex(signerHexes[start + 2]),
        signerFromHex(signerHexes[start + 3]),
        signerFromHex(signerHexes[start + 4]),
        signerFromHex(signerHexes[start + 5]),
      )
    case 7:
      return packs.create7(
        signerFromHex(signerHexes[start]),
        signerFromHex(signerHexes[start + 1]),
        signerFromHex(signerHexes[start + 2]),
        signerFromHex(signerHexes[start + 3]),
        signerFromHex(signerHexes[start + 4]),
        signerFromHex(signerHexes[start + 5]),
        signerFromHex(signerHexes[start + 6]),
      )
    case 8:
      return packs.create8(
        signerFromHex(signerHexes[start]),
        signerFromHex(signerHexes[start + 1]),
        signerFromHex(signerHexes[start + 2]),
        signerFromHex(signerHexes[start + 3]),
        signerFromHex(signerHexes[start + 4]),
        signerFromHex(signerHexes[start + 5]),
        signerFromHex(signerHexes[start + 6]),
        signerFromHex(signerHexes[start + 7]),
      )
    case 9:
      return packs.create9(
        signerFromHex(signerHexes[start]),
        signerFromHex(signerHexes[start + 1]),
        signerFromHex(signerHexes[start + 2]),
        signerFromHex(signerHexes[start + 3]),
        signerFromHex(signerHexes[start + 4]),
        signerFromHex(signerHexes[start + 5]),
        signerFromHex(signerHexes[start + 6]),
        signerFromHex(signerHexes[start + 7]),
        signerFromHex(signerHexes[start + 8]),
      )
    default:
      fail("Invalid signers")
      return null
  }
}

function packFromSignerHexes(signerHexes: string[]): packref {
  if (signerHexes.length < 1) fail("Invalid signers")

  let result: packref = null
  let offset = 0

  while (offset < signerHexes.length) {
    const remaining = signerHexes.length - offset
    const count = remaining > 9 ? 9 : remaining
    const chunk = packChunkFromSignerHexes(signerHexes, offset, count)

    result = result ? packs.concat(result, chunk) : chunk
    offset += count
  }

  return result
}

function isSigner(signers: packref, address: textref): bool {
  const length = packs.length(signers)

  for (let i = 0; i < length; i++) {
    if (texts.equals(packs.get<textref>(signers, i), address)) return true
  }

  return false
}

function assertSigner(signers: packref, address: textref): void {
  if (!isSigner(signers, address)) fail("Unauthorized")
}

namespace sessions {
  const verifyMethod = (): textref => texts.fromString("verify")

  export function addressOf(session: packref): textref {
    return blobs.toBase16(sha256.digest(blobs.encode(session)))
  }

  export function assert(session: packref): textref {
    const module = packs.get<textref>(session, 0)
    const verified = packs.get<bool>(
      modules.call(module, verifyMethod(), packs.create1(session)),
      0,
    )

    if (!verified) fail("Invalid session")

    return addressOf(session)
  }
}

namespace keys$ {
  const policyKey = (): textref => texts.fromString(`${DOMAIN}/state/policy`)
  const nonceKey = (): textref => texts.fromString(`${DOMAIN}/state/nonce`)

  const proposalPrefix = (): textref =>
    texts.fromString(`${DOMAIN}/state/proposal/`)
  const approvalPrefix = (): textref =>
    texts.fromString(`${DOMAIN}/state/approval/`)
  const executionResultPrefix = (): textref =>
    texts.fromString(`${DOMAIN}/state/execution_result/`)

  const activeProposalKey = (): textref =>
    texts.fromString(`${DOMAIN}/state/execution_context/active_proposal`)

  function fromBlob(prefix: textref, id: blobref): textref {
    return texts.concat(prefix, blobs.toBase16(id))
  }

  export function policy(): textref {
    return policyKey()
  }

  export function nonce(): textref {
    return nonceKey()
  }

  export function proposal(proposalId: blobref): textref {
    return fromBlob(proposalPrefix(), proposalId)
  }

  export function approval(approvalId: blobref): textref {
    return fromBlob(approvalPrefix(), approvalId)
  }

  export function executionResult(executionResultId: blobref): textref {
    return fromBlob(executionResultPrefix(), executionResultId)
  }

  export function activeProposal(): textref {
    return activeProposalKey()
  }
}

namespace ids$ {
  export function nextProposalNonce(): bigintref {
    const found = storage.get(keys$.nonce())
    const current = found ? packs.get<bigintref>(found, 0) : bigints.zero()

    storage.set(keys$.nonce(), bigints.inc(current))

    return current
  }

  export function proposal(
    proposer: textref,
    call: packref,
    nonce: bigintref,
  ): blobref {
    return sha256.digest(
      blobs.encode(
        packs.create6(
          domainTag("proposal_id"),
          version(),
          modules.self(),
          nonce,
          proposer,
          call,
        ),
      ),
    )
  }

  export function approval(proposalId: blobref, signer: textref): blobref {
    return sha256.digest(
      blobs.encode(
        packs.create5(
          domainTag("approval_id"),
          version(),
          modules.self(),
          proposalId,
          signer,
        ),
      ),
    )
  }

  export function executionResult(proposalId: blobref): blobref {
    return sha256.digest(
      blobs.encode(
        packs.create4(
          domainTag("execution_result_id"),
          version(),
          modules.self(),
          proposalId,
        ),
      ),
    )
  }
}

namespace policy$ {
  const tag = (): textref => domainTag("policy")

  export function assertUninitialized(): void {
    if (storage.get(keys$.policy())) fail("Already initialized")
  }

  export function getTuple(): packref {
    const found = storage.get(keys$.policy())

    if (!found) fail("Not initialized")

    const tuple = packs.get<packref>(found, 0)

    if (!tuple) fail("Not initialized")

    return tuple
  }

  export function threshold(tuple: packref): bigintref {
    return packs.get<bigintref>(tuple, 2)
  }

  export function signers(tuple: packref): packref {
    return packs.get<packref>(tuple, 3)
  }

  export function canonicalize(input: packref): packref {
    if (!input) fail("Invalid policy")
    if (packs.length(input) !== 4) fail("Invalid policy")

    const foundTag = packs.get<textref>(input, 0)
    const foundVersion = packs.get<bigintref>(input, 1)

    if (!texts.equals(foundTag, tag())) fail("Invalid policy")
    if (!bigints.eq(foundVersion, version())) fail("Invalid policy")

    const foundThreshold = packs.get<bigintref>(input, 2)
    const foundSigners = packs.get<packref>(input, 3)

    const signerHexes = normalizeSignerHexes(foundSigners)

    if (signerHexes.length < 1) fail("Invalid policy")
    if (bigints.lt(foundThreshold, bigints.one())) fail("Invalid policy")

    const signerCount = bigintFromI32(signerHexes.length)

    if (bigints.gt(foundThreshold, signerCount)) fail("Invalid policy")

    const normalizedSigners = packFromSignerHexes(signerHexes)

    return packs.create4(tag(), version(), foundThreshold, normalizedSigners)
  }

  export function set(canonical: packref): void {
    storage.set(keys$.policy(), canonical)
  }
}

namespace calls$ {
  const tag = (): textref => domainTag("call")

  export function assertCanonical(call: packref): void {
    if (!call) fail("Invalid call")
    if (packs.length(call) !== 5) fail("Invalid call")

    const foundTag = packs.get<textref>(call, 0)
    const foundVersion = packs.get<bigintref>(call, 1)

    if (!texts.equals(foundTag, tag())) fail("Invalid call")
    if (!bigints.eq(foundVersion, version())) fail("Invalid call")

    const params = packs.get<packref>(call, 4)

    if (!params) fail("Invalid call")
  }

  export function module(call: packref): textref {
    return packs.get<textref>(call, 2)
  }

  export function method(call: packref): textref {
    return packs.get<textref>(call, 3)
  }

  export function params(call: packref): packref {
    return packs.get<packref>(call, 4)
  }
}

namespace proposals$ {
  const tag = (): textref => domainTag("proposal")

  export function create(
    proposalId: blobref,
    call: packref,
    proposer: textref,
    approvalsCount: bigintref,
    status: bigintref,
    threshold: bigintref,
    signers: packref,
  ): packref {
    return packs.create9(
      tag(),
      version(),
      proposalId,
      call,
      proposer,
      approvalsCount,
      status,
      threshold,
      signers,
    )
  }

  export function assertCanonical(tuple: packref): void {
    if (!tuple) fail("Invalid proposal")
    if (packs.length(tuple) !== 9) fail("Invalid proposal")

    const foundTag = packs.get<textref>(tuple, 0)
    const foundVersion = packs.get<bigintref>(tuple, 1)

    if (!texts.equals(foundTag, tag())) fail("Invalid proposal")
    if (!bigints.eq(foundVersion, version())) fail("Invalid proposal")
  }

  export function has(proposalId: blobref): bool {
    return !!storage.get(keys$.proposal(proposalId))
  }

  export function get(proposalId: blobref): packref {
    const found = storage.get(keys$.proposal(proposalId))

    if (!found) fail("Proposal not found")

    const tuple = packs.get<packref>(found, 0)

    assertCanonical(tuple)

    return tuple
  }

  export function set(proposalId: blobref, tuple: packref): void {
    assertCanonical(tuple)
    storage.set(keys$.proposal(proposalId), tuple)
  }

  export function proposalId(tuple: packref): blobref {
    return packs.get<blobref>(tuple, 2)
  }

  export function call(tuple: packref): packref {
    return packs.get<packref>(tuple, 3)
  }

  export function proposer(tuple: packref): textref {
    return packs.get<textref>(tuple, 4)
  }

  export function approvalsCount(tuple: packref): bigintref {
    return packs.get<bigintref>(tuple, 5)
  }

  export function status(tuple: packref): bigintref {
    return packs.get<bigintref>(tuple, 6)
  }

  export function threshold(tuple: packref): bigintref {
    return packs.get<bigintref>(tuple, 7)
  }

  export function signers(tuple: packref): packref {
    return packs.get<packref>(tuple, 8)
  }
}

namespace approvals$ {
  function key(proposalId: blobref, signer: textref): textref {
    return keys$.approval(ids$.approval(proposalId, signer))
  }

  export function has(proposalId: blobref, signer: textref): bool {
    const found = storage.get(key(proposalId, signer))
    if (!found) return false

    const value = packs.get<bigintref>(found, 0)

    return bigints.eq(value, bigints.one())
  }

  export function set(
    proposalId: blobref,
    signer: textref,
    approved: bool,
  ): void {
    storage.set(
      key(proposalId, signer),
      approved ? bigints.one() : bigints.zero(),
    )
  }

  export function listFromProposal(proposal: packref): packref {
    const signers = proposals$.signers(proposal)
    const signersLength = packs.length(signers)

    const approvedSignerHexes: string[] = []

    for (let i = 0; i < signersLength; i++) {
      const signer = packs.get<textref>(signers, i)

      if (has(proposals$.proposalId(proposal), signer)) {
        approvedSignerHexes.push(signerHex(signer))
      }
    }

    if (approvedSignerHexes.length < 1) fail("Invalid proposal approvals")

    return packFromSignerHexes(approvedSignerHexes)
  }
}

namespace executionContext$ {
  const emptyBlob = (): blobref => blobs.save(new ArrayBuffer(0))

  export function setActive(proposalId: blobref): void {
    storage.set(keys$.activeProposal(), proposalId)
  }

  export function clearActive(): void {
    storage.set(keys$.activeProposal(), emptyBlob())
  }

  function getActive(): blobref {
    const found = storage.get(keys$.activeProposal())

    if (!found) return null

    const current = packs.get<blobref>(found, 0)

    if (blobs.length(current) === 0) return null

    return current
  }

  export function assertCanUpdatePolicy(policyInput: packref): void {
    const activeProposalId = getActive()

    if (!activeProposalId) fail("Unauthorized")

    const proposal = proposals$.get(activeProposalId)
    const call = proposals$.call(proposal)

    calls$.assertCanonical(call)

    if (!texts.equals(calls$.module(call), modules.self())) fail("Unauthorized")

    if (!texts.equals(calls$.method(call), updatePolicyMethod()))
      fail("Unauthorized")

    const params = calls$.params(call)

    if (packs.length(params) !== 1) fail("Unauthorized")

    const expectedPolicy = packs.get<packref>(params, 0)

    if (!samePack(expectedPolicy, policyInput)) fail("Unauthorized")
  }
}

namespace executionResult$ {
  const tag = (): textref => domainTag("execution_result")

  export function set(proposalId: blobref, result: packref): void {
    storage.set(
      keys$.executionResult(ids$.executionResult(proposalId)),
      packs.create3(tag(), version(), result),
    )
  }

  export function get(proposalId: blobref): packref {
    const found = storage.get(
      keys$.executionResult(ids$.executionResult(proposalId)),
    )

    if (!found) fail("Missing execution result")

    const tuple = packs.get<packref>(found, 0)

    if (!tuple) fail("Missing execution result")
    if (packs.length(tuple) !== 3) fail("Missing execution result")

    const foundTag = packs.get<textref>(tuple, 0)
    const foundVersion = packs.get<bigintref>(tuple, 1)

    if (!texts.equals(foundTag, tag())) fail("Missing execution result")
    if (!bigints.eq(foundVersion, version())) fail("Missing execution result")

    return packs.get<packref>(tuple, 2)
  }
}

/**
 * Initialize the multisig policy.
 *
 * @param policyInput Canonical policy tuple:
 * - [0] "bobine.multisig/policy"
 * - [1] 1
 * - [2] threshold
 * - [3] signers (pack list of textref)
 */
export function init(policyInput: packref): void {
  policy$.assertUninitialized()

  const canonicalPolicy = policy$.canonicalize(policyInput)

  policy$.set(canonicalPolicy)
}

/**
 * Read the stored canonical policy tuple.
 *
 * @returns Canonical policy tuple.
 */
export function policy(): packref {
  return policy$.getTuple()
}

/**
 * Propose a canonical call intent.
 *
 * Call tuple format:
 * - [0] "bobine.multisig/call"
 * - [1] 1
 * - [2] target module address (textref)
 * - [3] method name (textref)
 * - [4] params (packref)
 *
 * The proposer is auto-approved.
 *
 * @param session Caller session.
 * @param call Canonical call tuple.
 * @returns Deterministic proposal id (blobref).
 */
export function propose(session: packref, call: packref): blobref {
  const caller = sessions.assert(session)
  const currentPolicy = policy$.getTuple()

  assertSigner(policy$.signers(currentPolicy), caller)

  calls$.assertCanonical(call)

  const nonce = ids$.nextProposalNonce()
  const proposalId = ids$.proposal(caller, call, nonce)

  if (proposals$.has(proposalId)) fail("Proposal already exists")

  const proposal = proposals$.create(
    proposalId,
    call,
    caller,
    bigints.one(),
    statusOpen(),
    policy$.threshold(currentPolicy),
    policy$.signers(currentPolicy),
  )

  proposals$.set(proposalId, proposal)
  approvals$.set(proposalId, caller, true)

  return proposalId
}

/**
 * Approve an open proposal.
 *
 * Approval is idempotent for a given signer.
 *
 * @param session Caller session.
 * @param proposalId Proposal id.
 * @returns Updated approval count.
 */
export function approve(session: packref, proposalId: blobref): bigintref {
  const caller = sessions.assert(session)
  const proposal = proposals$.get(proposalId)

  if (!bigints.eq(proposals$.status(proposal), statusOpen()))
    fail("Proposal is not open")

  assertSigner(proposals$.signers(proposal), caller)

  if (approvals$.has(proposalId, caller))
    return proposals$.approvalsCount(proposal)

  approvals$.set(proposalId, caller, true)

  const updatedApprovalCount = bigints.inc(proposals$.approvalsCount(proposal))

  proposals$.set(
    proposalId,
    proposals$.create(
      proposalId,
      proposals$.call(proposal),
      proposals$.proposer(proposal),
      updatedApprovalCount,
      proposals$.status(proposal),
      proposals$.threshold(proposal),
      proposals$.signers(proposal),
    ),
  )

  return updatedApprovalCount
}

/**
 * Execute an open proposal once threshold is met.
 *
 * Execution is idempotent: once executed, repeated calls return
 * the stored execution result without re-running the call.
 *
 * @param proposalId Proposal id.
 * @returns Result of the executed call.
 */
export function execute(proposalId: blobref): packref {
  const proposal = proposals$.get(proposalId)
  const status = proposals$.status(proposal)

  if (bigints.eq(status, statusExecuted()))
    return executionResult$.get(proposalId)
  if (bigints.eq(status, statusClosed())) fail("Proposal is closed")

  if (
    bigints.lt(
      proposals$.approvalsCount(proposal),
      proposals$.threshold(proposal),
    )
  )
    fail("Insufficient approvals")

  const call = proposals$.call(proposal)

  calls$.assertCanonical(call)

  executionContext$.setActive(proposalId)

  const result = modules.call(
    calls$.module(call),
    calls$.method(call),
    calls$.params(call),
  )

  executionContext$.clearActive()

  proposals$.set(
    proposalId,
    proposals$.create(
      proposalId,
      call,
      proposals$.proposer(proposal),
      proposals$.approvalsCount(proposal),
      statusExecuted(),
      proposals$.threshold(proposal),
      proposals$.signers(proposal),
    ),
  )

  executionResult$.set(proposalId, result)

  return result
}

/**
 * Close an open proposal without execution.
 *
 * Authorization rule: any signer from the proposal policy snapshot can close.
 *
 * @param session Caller session.
 * @param proposalId Proposal id.
 */
export function close(session: packref, proposalId: blobref): void {
  const caller = sessions.assert(session)
  const proposal = proposals$.get(proposalId)

  assertSigner(proposals$.signers(proposal), caller)

  if (!bigints.eq(proposals$.status(proposal), statusOpen()))
    fail("Proposal is not open")

  proposals$.set(
    proposalId,
    proposals$.create(
      proposalId,
      proposals$.call(proposal),
      proposals$.proposer(proposal),
      proposals$.approvalsCount(proposal),
      statusClosed(),
      proposals$.threshold(proposal),
      proposals$.signers(proposal),
    ),
  )
}

/**
 * Read the current proposal view.
 *
 * ProposalView tuple:
 * - [0] "bobine.multisig/proposal_view"
 * - [1] 1
 * - [2] proposal_id
 * - [3] call
 * - [4] proposer
 * - [5] approvals_count
 * - [6] approvals
 * - [7] status (0=open, 1=executed, 2=closed)
 *
 * @param proposalId Proposal id.
 * @returns Canonical proposal view tuple.
 */
export function proposal(proposalId: blobref): packref {
  const record = proposals$.get(proposalId)

  return packs.create8(
    domainTag("proposal_view"),
    version(),
    proposals$.proposalId(record),
    proposals$.call(record),
    proposals$.proposer(record),
    proposals$.approvalsCount(record),
    approvals$.listFromProposal(record),
    proposals$.status(record),
  )
}

/**
 * Update the multisig policy.
 *
 * This method is intentionally restricted and can only be called while a
 * proposal is executing, when that proposal explicitly targets:
 * [self, "update_policy", [policyInput]]
 *
 * @param policyInput New policy tuple.
 */
export function update_policy(policyInput: packref): void {
  executionContext$.assertCanUpdatePolicy(policyInput)

  const canonical = policy$.canonicalize(policyInput)

  policy$.set(canonical)
}
