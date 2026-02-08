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
const CPES_VERSION_U32: u32 = 1

const VERSION = (): bigintref => bigints.one()
const DOMAIN_TAG = (suffix: string): textref =>
  texts.fromString(`${DOMAIN}/${suffix}`)

const STATUS_OPEN = (): bigintref => bigints.zero()
const STATUS_EXECUTED = (): bigintref => bigints.one()
const STATUS_CLOSED = (): bigintref => bigints.two()

const UPDATE_POLICY_METHOD = (): textref => texts.fromString("update_policy")
const ZERO_SEPARATOR = (): blobref => {
  const bytes = new Uint8Array(1)
  bytes[0] = 0
  return blobs.save(bytes.buffer)
}
const VERSION_BYTES = (): blobref => {
  const buffer = new ArrayBuffer(4)
  const view = new DataView(buffer)
  view.setUint32(0, CPES_VERSION_U32, false)
  return blobs.save(buffer)
}

function bigintFromI32(value: i32): bigintref {
  return bigints.fromInt64(value as i64)
}

function fail(message: string): void {
  throw new Error(message)
}

function samePack(left: packref, right: packref): bool {
  return blobs.equals(blobs.encode(left), blobs.encode(right))
}

function canonicalHash(typeName: string, payload: blobref): blobref {
  const domainBytes = texts.toUtf8(texts.fromString(DOMAIN))
  const typeBytes = texts.toUtf8(texts.fromString(typeName))
  const part0 = blobs.concat(domainBytes, ZERO_SEPARATOR())
  const part1 = blobs.concat(part0, typeBytes)
  const part2 = blobs.concat(part1, ZERO_SEPARATOR())
  const part3 = blobs.concat(part2, VERSION_BYTES())
  const part4 = blobs.concat(part3, ZERO_SEPARATOR())
  const frame = blobs.concat(part4, payload)
  return sha256.digest(frame)
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

namespace session$ {
  const VERIFY_METHOD = (): textref => texts.fromString("verify")

  export function addressOf(session: packref): textref {
    return blobs.toBase16(sha256.digest(blobs.encode(session)))
  }

  export function assert(session: packref): textref {
    const module = packs.get<textref>(session, 0)
    const verified = packs.get<bool>(
      modules.call(module, VERIFY_METHOD(), packs.create1(session)),
      0,
    )

    if (!verified) fail("Invalid session")

    return addressOf(session)
  }
}

namespace key$ {
  const POLICY_KEY = (): textref => texts.fromString(`${DOMAIN}/state/policy`)
  const NONCE_KEY = (): textref => texts.fromString(`${DOMAIN}/state/nonce`)

  const PROPOSAL_PREFIX = (): textref =>
    texts.fromString(`${DOMAIN}/state/proposal/`)
  const APPROVAL_PREFIX = (): textref =>
    texts.fromString(`${DOMAIN}/state/approval/`)
  const EXECUTION_RESULT_PREFIX = (): textref =>
    texts.fromString(`${DOMAIN}/state/execution_result/`)

  const ACTIVE_PROPOSAL_KEY = (): textref =>
    texts.fromString(`${DOMAIN}/state/execution_context/active_proposal`)

  function fromBlob(prefix: textref, id: blobref): textref {
    return texts.concat(prefix, blobs.toBase16(id))
  }

  export function policy(): textref {
    return POLICY_KEY()
  }

  export function nonce(): textref {
    return NONCE_KEY()
  }

  export function proposal(proposalId: blobref): textref {
    return fromBlob(PROPOSAL_PREFIX(), proposalId)
  }

  export function approval(approvalId: blobref): textref {
    return fromBlob(APPROVAL_PREFIX(), approvalId)
  }

  export function executionResult(executionResultId: blobref): textref {
    return fromBlob(EXECUTION_RESULT_PREFIX(), executionResultId)
  }

  export function activeProposal(): textref {
    return ACTIVE_PROPOSAL_KEY()
  }
}

namespace id$ {
  export function nextProposalNonce(): bigintref {
    const found = storage.get(key$.nonce())
    const current = found ? packs.get<bigintref>(found, 0) : bigints.zero()

    storage.set(key$.nonce(), bigints.inc(current))

    return current
  }

  export function proposal(
    proposer: textref,
    call: packref,
    nonce: bigintref,
  ): blobref {
    const callHash = sha256.digest(blobs.encode(call))
    const payload = blobs.encode(
      packs.create4(modules.self(), nonce, proposer, callHash),
    )
    return canonicalHash("proposal_id", payload)
  }

  export function approval(proposalId: blobref, signer: textref): blobref {
    const payload = blobs.encode(
      packs.create3(modules.self(), proposalId, signer),
    )
    return canonicalHash("approval_id", payload)
  }

  export function executionResult(proposalId: blobref): blobref {
    const payload = blobs.encode(packs.create2(modules.self(), proposalId))
    return canonicalHash("execution_result_id", payload)
  }
}

namespace policy$ {
  const TAG = (): textref => DOMAIN_TAG("policy")

  export function assertUninitialized(): void {
    if (storage.get(key$.policy())) fail("Already initialized")
  }

  export function getTuple(): packref {
    const found = storage.get(key$.policy())

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
    if (packs.length(input) < 4) fail("Invalid policy")

    const foundTag = packs.get<textref>(input, 0)
    const foundVersion = packs.get<bigintref>(input, 1)

    if (!texts.equals(foundTag, TAG())) fail("Invalid policy")
    if (!bigints.eq(foundVersion, VERSION())) fail("Invalid policy")

    const foundThreshold = packs.get<bigintref>(input, 2)
    const foundSigners = packs.get<packref>(input, 3)

    const signerHexes = normalizeSignerHexes(foundSigners)

    if (signerHexes.length < 1) fail("Invalid policy")
    if (bigints.lt(foundThreshold, bigints.one())) fail("Invalid policy")

    const signerCount = bigintFromI32(signerHexes.length)

    if (bigints.gt(foundThreshold, signerCount)) fail("Invalid policy")

    const normalizedSigners = packFromSignerHexes(signerHexes)

    return packs.create4(TAG(), VERSION(), foundThreshold, normalizedSigners)
  }

  export function set(canonical: packref): void {
    storage.set(key$.policy(), canonical)
  }

  export function init(input: packref): void {
    assertUninitialized()
    set(canonicalize(input))
  }

  export function update(input: packref): void {
    execution_context$.assertCanUpdatePolicy(input)
    set(canonicalize(input))
  }
}

namespace call$ {
  const TAG = (): textref => DOMAIN_TAG("call")

  export function assertCanonical(call: packref): void {
    if (!call) fail("Invalid call")
    if (packs.length(call) < 5) fail("Invalid call")

    const foundTag = packs.get<textref>(call, 0)
    const foundVersion = packs.get<bigintref>(call, 1)

    if (!texts.equals(foundTag, TAG())) fail("Invalid call")
    if (!bigints.eq(foundVersion, VERSION())) fail("Invalid call")

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

namespace proposal$ {
  const TAG = (): textref => DOMAIN_TAG("proposal")

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
      TAG(),
      VERSION(),
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
    if (packs.length(tuple) < 9) fail("Invalid proposal")

    const foundTag = packs.get<textref>(tuple, 0)
    const foundVersion = packs.get<bigintref>(tuple, 1)

    if (!texts.equals(foundTag, TAG())) fail("Invalid proposal")
    if (!bigints.eq(foundVersion, VERSION())) fail("Invalid proposal")
  }

  export function has(proposalId: blobref): bool {
    return !!storage.get(key$.proposal(proposalId))
  }

  export function get(proposalId: blobref): packref {
    const found = storage.get(key$.proposal(proposalId))

    if (!found) fail("Proposal not found")

    const tuple = packs.get<packref>(found, 0)

    assertCanonical(tuple)

    return tuple
  }

  export function set(proposalId: blobref, tuple: packref): void {
    assertCanonical(tuple)
    storage.set(key$.proposal(proposalId), tuple)
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

  function rewrite(
    proposalId: blobref,
    tuple: packref,
    nextApprovalsCount: bigintref,
    nextStatus: bigintref,
  ): void {
    set(
      proposalId,
      create(
        proposalId,
        call(tuple),
        proposer(tuple),
        nextApprovalsCount,
        nextStatus,
        threshold(tuple),
        signers(tuple),
      ),
    )
  }

  export function propose(signer: textref, callInput: packref): blobref {
    const currentPolicy = policy$.getTuple()

    assertSigner(policy$.signers(currentPolicy), signer)
    call$.assertCanonical(callInput)

    const nonce = id$.nextProposalNonce()
    const proposalId = id$.proposal(signer, callInput, nonce)

    if (has(proposalId)) fail("Proposal already exists")

    set(
      proposalId,
      create(
        proposalId,
        callInput,
        signer,
        bigints.one(),
        STATUS_OPEN(),
        policy$.threshold(currentPolicy),
        policy$.signers(currentPolicy),
      ),
    )
    approval$.set(proposalId, signer, true)

    return proposalId
  }

  export function approve(proposalId: blobref, signer: textref): bigintref {
    const tuple = get(proposalId)

    if (!bigints.eq(status(tuple), STATUS_OPEN())) fail("Proposal is not open")

    assertSigner(signers(tuple), signer)

    if (approval$.has(proposalId, signer)) return approvalsCount(tuple)

    approval$.set(proposalId, signer, true)

    const updatedApprovalCount = bigints.inc(approvalsCount(tuple))

    rewrite(proposalId, tuple, updatedApprovalCount, status(tuple))

    return updatedApprovalCount
  }

  export function execute(proposalId: blobref): packref {
    const tuple = get(proposalId)
    const currentStatus = status(tuple)

    if (bigints.eq(currentStatus, STATUS_EXECUTED()))
      return execution_result$.get(proposalId)
    if (bigints.eq(currentStatus, STATUS_CLOSED())) fail("Proposal is closed")

    if (bigints.lt(approvalsCount(tuple), threshold(tuple)))
      fail("Insufficient approvals")

    const callInput = call(tuple)

    call$.assertCanonical(callInput)

    execution_context$.setActive(proposalId)

    const result = modules.call(
      call$.module(callInput),
      call$.method(callInput),
      call$.params(callInput),
    )

    execution_context$.clearActive()

    rewrite(proposalId, tuple, approvalsCount(tuple), STATUS_EXECUTED())
    execution_result$.set(proposalId, result)

    return result
  }

  export function close(proposalId: blobref, signer: textref): void {
    const tuple = get(proposalId)

    assertSigner(signers(tuple), signer)

    if (!bigints.eq(status(tuple), STATUS_OPEN())) fail("Proposal is not open")

    rewrite(proposalId, tuple, approvalsCount(tuple), STATUS_CLOSED())
  }

  export function view(proposalKey: blobref): packref {
    const tuple = get(proposalKey)

    return packs.create8(
      DOMAIN_TAG("proposal_view"),
      VERSION(),
      proposalId(tuple),
      call(tuple),
      proposer(tuple),
      approvalsCount(tuple),
      approval$.listFromProposal(tuple),
      status(tuple),
    )
  }
}

namespace approval$ {
  function key(proposalId: blobref, signer: textref): textref {
    return key$.approval(id$.approval(proposalId, signer))
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
    const signers = proposal$.signers(proposal)
    const signersLength = packs.length(signers)

    const approvedSignerHexes: string[] = []

    for (let i = 0; i < signersLength; i++) {
      const signer = packs.get<textref>(signers, i)

      if (has(proposal$.proposalId(proposal), signer)) {
        approvedSignerHexes.push(signerHex(signer))
      }
    }

    if (approvedSignerHexes.length < 1) fail("Invalid proposal approvals")

    return packFromSignerHexes(approvedSignerHexes)
  }
}

namespace execution_context$ {
  const EMPTY_BLOB = (): blobref => blobs.save(new ArrayBuffer(0))

  export function setActive(proposalId: blobref): void {
    storage.set(key$.activeProposal(), proposalId)
  }

  export function clearActive(): void {
    storage.set(key$.activeProposal(), EMPTY_BLOB())
  }

  function getActive(): blobref {
    const found = storage.get(key$.activeProposal())

    if (!found) return null

    const current = packs.get<blobref>(found, 0)

    if (blobs.length(current) === 0) return null

    return current
  }

  export function assertCanUpdatePolicy(policyInput: packref): void {
    const activeProposalId = getActive()

    if (!activeProposalId) fail("Unauthorized")

    const proposal = proposal$.get(activeProposalId)
    const call = proposal$.call(proposal)

    call$.assertCanonical(call)

    if (!texts.equals(call$.module(call), modules.self())) fail("Unauthorized")

    if (!texts.equals(call$.method(call), UPDATE_POLICY_METHOD()))
      fail("Unauthorized")

    const params = call$.params(call)

    if (packs.length(params) !== 1) fail("Unauthorized")

    const expectedPolicy = packs.get<packref>(params, 0)

    if (!samePack(expectedPolicy, policyInput)) fail("Unauthorized")
  }
}

namespace execution_result$ {
  const TAG = (): textref => DOMAIN_TAG("execution_result")

  export function set(proposalId: blobref, result: packref): void {
    storage.set(
      key$.executionResult(id$.executionResult(proposalId)),
      packs.create3(TAG(), VERSION(), result),
    )
  }

  export function get(proposalId: blobref): packref {
    const found = storage.get(
      key$.executionResult(id$.executionResult(proposalId)),
    )

    if (!found) fail("Missing execution result")

    const tuple = packs.get<packref>(found, 0)

    if (!tuple) fail("Missing execution result")
    if (packs.length(tuple) < 3) fail("Missing execution result")

    const foundTag = packs.get<textref>(tuple, 0)
    const foundVersion = packs.get<bigintref>(tuple, 1)

    if (!texts.equals(foundTag, TAG())) fail("Missing execution result")
    if (!bigints.eq(foundVersion, VERSION())) fail("Missing execution result")

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
  policy$.init(policyInput)
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
 *
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
  const caller = session$.assert(session)
  return proposal$.propose(caller, call)
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
  const caller = session$.assert(session)
  return proposal$.approve(proposalId, caller)
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
  return proposal$.execute(proposalId)
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
  const caller = session$.assert(session)
  proposal$.close(proposalId, caller)
}

/**
 * Read the current proposal view.
 *
 * ProposalView tuple:
 *
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
  return proposal$.view(proposalId)
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
  policy$.update(policyInput)
}
