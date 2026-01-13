# Bobine Canonical Pack Encoding Specification (CPES)

This document defines a **canonical** and **opiniated** way to encode `packref` values in Bobine smart contracts. It is designed to keep encoding **deterministic**, **versioned**, and **hash-friendly** across all contracts.

Normative keywords: **MUST**, **SHOULD**, **MAY**.

---

## Scope

CPES applies to every structured value encoded as a `packref` that is:

- passed across a module boundary (as input or output),
- exposed as part of a public interface (return values, events, docs),
- or used to derive a stable identifier that other modules or clients must reproduce (hashes, addresses, content IDs).

Internal storage is out of scope unless it becomes observable through one of the cases above.

---

## 2. Definitions

- **Pack tuple**: a positional list encoded with `packs.createN(...)`.
- **tag**: a string identifying the tuple type.
- **domain**: a stable namespace for a contract.
- **version**: a positive integer defining the tuple schema version.

---

## 3. Domains and type tags

### 3.1 Contract domain

Each contract MUST define a stable domain string:

- `DOMAIN = "bobine.<contract_name>"`

Examples:

- `bobine.multisig`
- `bobine.token`
- `bobine.lexarium`

`<contract_name>` MUST be stable, lowercase ASCII, using a single naming convention project-wide:

- either `snake_case` or `kebab-case`

### 3.2 Type tags

Every Pack tuple MUST start with a tag derived from the domain:

- `tag = "<DOMAIN>/<type_name>"`

Examples:

- `bobine.multisig/policy`
- `bobine.multisig/intent`
- `bobine.token/transfer`

`<type_name>` MUST be stable, lowercase ASCII, and follow the same naming convention.

---

## 4. Tuple header

Every structured Pack tuple MUST use this header:

- index `0`: `tag: textref`
- index `1`: `version: bigintref` (positive integer, starting at `1`)

Decoders MUST reject tuples with:

- an unknown `tag`,
- `version < 1`.

Decoders SHOULD support:

- the exact version they implement,
- and MAY support an explicit range of versions if documented.

---

## 5. Field ordering and evolution

Field order is part of the ABI.

- Fields MUST be read by fixed index.
- Fields MUST NOT be reordered within a version.

Backward-compatible changes MUST:

- append new fields at the end of the tuple,
- keep all existing field indices unchanged.

Decoders MUST ignore unknown trailing fields.

Breaking changes MUST increment the `version` (new tuple schema).

Removing fields is NOT allowed within the same version.

- Use a new version instead.

---

## 6. Canonical representation rules

### 6.1 No optional holes

Tuples MUST NOT contain missing indices.

Optional values MUST be represented with canonical sentinels:

- For numeric fields, `0` SHOULD mean “none/not set”, unless `0` is a meaningful non-empty value.
- If `0` cannot be used as a sentinel, you MUST encode an explicit discriminant field (enum) to distinguish cases.

### 6.2 Deterministic lists

If a list represents an **unordered set**, it MUST be normalized before encoding:

- duplicates removed,
- items sorted deterministically.

Sorting rules:

- `textref`: lexicographic by UTF-8 bytes
- `blobref`: lexicographic by raw bytes

If a list is **order-sensitive**, it MUST preserve order exactly and MUST NOT be sorted.

### 6.3 Canonical strings

Identifiers encoded as `textref` MUST be normalized if they are defined as case-insensitive or format-sensitive (example: lowercase, no whitespace).  
If you do not want normalization, declare the field as opaque and use `blobref` instead.

### 6.4 Numeric values

`bigintref` is allowed for contract fields.  
However, if numeric values are used in any hash preimage (ids, signatures), they MUST be encoded in a fixed-width canonical form inside the hash preimage (see section 7).

---

## 7. Canonical hashing and identifiers

Any hash used as:

- object id,
- intent id,
- proposal id,
- digest for signatures,

MUST be domain separated.

Canonical hash format:

`sha256( DOMAIN || 0x00 || TYPE || 0x00 || VERSION || 0x00 || PAYLOAD )`

Where:

- `DOMAIN` is the contract domain string (UTF-8)
- `TYPE` is a short identifier (UTF-8), e.g. `proposal_id`, `intent_hash`
- `VERSION` is a fixed-width integer (RECOMMEND: `u32` big-endian)
- `PAYLOAD` is an unambiguous deterministic byte sequence

### 7.1 PAYLOAD construction strategies

#### Strategy A (recommended): hash subcomponents

- Hash any pack-encoded structure first
- Concatenate fixed-size hashes with fixed-width integers

Example:

- `call_hash = sha256(pack.encode(CallV1))`
- `id = sha256( DOMAIN.. || u64be(seq) || call_hash || actor_id_hash )`

#### Strategy B: length-delimited concatenation

If concatenating variable-length parts directly:

- prefix each part with `u32be(length)`.

If `pack.encode(...)` bytes are included in a hash:

- the pack MUST comply with this CPES spec (tag+version included).

---

## 8. Recommended common tuple patterns

### 8.1 Intent tuple

Use an intent tuple for executable actions/messages:

`IntentV1 = pack[`

- `0: "<DOMAIN>/intent"`
- `1: 1`
- `2: target` (textref)
- `3: method` (textref)
- `4: args` (packref)
- `5: nonce` (bigintref, optional but recommended)
`]`

### 8.2 View tuples

For read models returned by queries:

- `<DOMAIN>/thing_view`
- include id, status, and UI-relevant fields
- avoid embedding large payloads unless required

---

## 9. Status and enums

Enums MUST be encoded as integers (`bigintref`) with a documented mapping.

- `0` SHOULD be the neutral/default v
