# Application Specification – Expense Sharing App

> **Scope:** Application-level concerns — tech stack, architecture, state persistence, roadmap, and pending decisions.  
> **Last updated:** 2026-02-24  
> **Status:** Draft

---

## Table of Contents

1. [Summary](#1-summary)
2. [Tech Stack](#2-tech-stack)
3. [Architecture Overview](#3-architecture-overview)
4. [State Persistence Strategy](#4-state-persistence-strategy)
5. [ID Generation Strategy](#5-id-generation-strategy)
6. [Initial Load Behavior](#6-initial-load-behavior)
7. [Schema Version](#7-schema-version)
8. [Roadmap & Pending Decisions](#8-roadmap--pending-decisions)
9. [Business Rules](#9-business-rules)

---

## 1. Summary

A **100% client-side** expense sharing web app (Splitwise-style) with no backend and no database. The entire application state lives in the URL — compressed and encoded. Anyone with the URL can read and modify the state. There is no authentication or access control by design.

---

## 2. Tech Stack

| Concern | Decision |
|---|---|
| Framework | React + Vite |
| Testing | Vitest |
| Schema & Validation | Zod v4 |
| State persistence | URL (JSON → LZ compression → URI encode) |
| Backend | None |
| Database | None |
| Currency | BRL only (single currency) |
| Floating point | Forbidden — all money stored as integer cents |

---

## 3. Architecture Overview

```
URL (?state=...)
    └── decode + decompress
        └── JSON.parse
            └── GlobalSchema.parse(data)     ← Zod validates entire state
                ├── users[]                  ← global entities
                └── groups[]
                    ├── memberIds[]          ← references to user IDs
                    ├── expenses[]
                    └── settlements[]
```

### Why arrays and not Sets or Maps?

`Set` and `Map` are **not JSON-serializable**. `JSON.stringify(new Set([1,2,3]))` produces `{}` — all data is silently lost. Arrays survive the full cycle: `JSON.stringify → compress → encode → decode → JSON.parse`.

When lookup performance is needed (e.g., inside calculation functions), arrays are converted to `Set` or `Map` locally and transiently, never stored back.

### Derived vs. stored state

**Balances are never stored.** They are always computed on demand from expenses and settlements. This keeps the URL payload minimal and prevents stored balance from ever diverging from the actual transaction history.

---

## 4. State Persistence Strategy

The entire `Global` state is serialized and stored in the URL as a query parameter.

**On save:**
1. `JSON.stringify(globalState)`
2. LZ-based compression
3. URI-safe encoding
4. Written to `?state=...` in the URL

**On load:**
1. Read `?state=...` from URL
2. URI decode
3. LZ decompress
4. `JSON.parse`
5. `GlobalSchema.parse(data)` — Zod validates the full state
6. Hydrate application

**On invalid state:**
Display an error screen. Do not attempt partial hydration.

---

## 5. ID Generation Strategy

IDs are **positive integers** (`int`, up to `Number.MAX_SAFE_INTEGER`). They are generated via `createIdGenerator(global)` — a closure that maintains independent counters per entity type: `user`, `group`, `expense`, and `settlement`.

In practice, URL size limits (see [§6](#6-initial-load-behavior)) will be reached long before integer overflow becomes a concern.

**Why per-type counters?**
Each domain enforces ID uniqueness within its own scope — user IDs among users, group IDs among groups, expense IDs within a group. Cross-domain ID uniqueness is never required, so a shared counter would only inflate IDs unnecessarily.

**Counter initialization:**
When loading state from URL, `createIdGenerator` is called with the loaded `Global` — it scans all existing IDs and initializes each counter to `max(existingIds)` for that type. When starting from empty state, all counters start at `0` and the first generated ID of each type is `1`.

> **Future consideration:** If multi-device sync or collaborative editing is ever needed, IDs should migrate to strings (nanoid or uuid) to avoid collisions across independent sessions.

---

## 6. Initial Load Behavior
```
URL has ?state= param
    └── valid
        └── URI decode
        └── LZ decompress
        └── JSON.parse
        └── GlobalSchema.parse(data)     ← Zod validates full state
        └── createIdGenerator(global)    ← initializes ID counters
        └── hydrate app
    └── invalid → show error screen

URL has no ?state= param
    └── start with empty state
        └── user must create at least one User
            └── only then can a Group be created
```

### URL size considerations

The entire state is stored in the URL. Browser and platform limits apply:

| Context | Practical limit |
|---|---|
| Modern browsers | ~64KB |
| Sharing platforms (WhatsApp, Twitter, etc.) | often much lower |

The LZ compression reduces payload significantly, but large states (many groups, expenses, or settlements) may approach these limits. No hard cap is enforced by the application — it is the user's responsibility to be aware of this constraint.

**If the URL becomes too long:**
- Browsers may silently truncate it
- Sharing platforms may reject or truncate it
- The app will show an error screen on load (invalid state)

There is no planned mitigation. This is an accepted architectural tradeoff of the URL-based persistence model.

---

## 7. Schema Version

The `Global` state includes a `version` field — a positive integer that identifies the schema version used to serialize the state.

**Current version:** `1`

**Purpose:**
- Allows future migrations when the schema changes in a breaking way
- On load, the app can detect outdated state and either migrate or reject it

**Current behavior:**
The version field is validated as a positive integer but not checked against any expected value. No migration logic exists yet.

**Future behavior (when migrations are needed):**
1. Read `version` from the parsed state
2. If `version < currentVersion` → run migration chain
3. If `version > currentVersion` → show error (state is from a newer version of the app)
4. If `version === currentVersion` → hydrate normally

## 8. Roadmap & Pending Decisions

### 8.1 Calculation functions (immediate next step)

Two pure functions to implement in `src/domain/balance/`:

**`compute-balances.ts`** ✅ _Implemented_
- Input: `Group`
- Output: `MemberBalance[]`
- Logic:
  - For each expense: `payer.balance += total`, each participant `balance -= share`
  - For each settlement: `from.balance += amount`, `to.balance -= amount`
  - Handle all three split modes including bps → cents conversion for percentage
  - Equal split: `Math.floor(total / n)` per member, remainder absorbed by the first participant in the list
  - Percentage split: `Math.round(total * bps / 10000)` per member, remainder from rounding absorbed by the first participant in the list

**`simplify-debts.ts`** — _Status: Mapped, not in initial scope_
- Input: `MemberBalance[]`
- Output: `SimplifiedDebt[]`
- Algorithm: two-heap approach (max-heap for creditors, min-heap for debtors). Pair the largest debtor with the largest creditor, settle the minimum of the two, repeat until all balances are zero. Minimizes the number of transactions.

---

### 8.2 Timestamps (deferred)

Timestamps are intentionally omitted from the current version to keep schemas and URL payloads lean while the core logic is being built.

**Why `number` (unix ms) and not `z.iso.datetime()` (string)?**  
Integer timestamps are smaller in the URL payload, require no parsing, and are directly comparable for sorting. ISO strings are more human-readable but add unnecessary overhead in a URL-encoded state context.

| Field | Type | Entity |
|---|---|---|
| `createdAt` | `number` (unix ms) | User, Group, Expense, Settlement |
| `updatedAt` | `number` (unix ms) | Expense only |
| `deletedAt` | `number` (unix ms), optional | User only |

---

### 8.3 Soft delete for Users (deferred)

Users are never permanently removed. Instead, `deletedAt` is set on the `User` entity.

**Rules when implemented:**
- `deletedAt` can only be set if the user's balance is `0` in **all groups**.
- A deleted user cannot participate in new expenses or settlements.
- A deleted user remains visible in all historical records.

**Two distinct operations — not to be confused:**

| Operation | What it means | Where it happens |
|---|---|---|
| Remove from group | Remove `memberId` from `group.memberIds` | Group level |
| Delete from app | Set `deletedAt` on `User` | Global level |

Removing a user from a group does not delete them from the app, and vice versa. Each has its own set of rules.

**Removing a member from a group** follows separate rules from soft deleting a user:

| Rule | Detail |
|---|---|
| Minimum members | Group must still have at least 2 members after removal |
| Balance | Member's balance in the group must be 0 before removal |
| History | Member's past expenses and settlements remain in the group unchanged |

### Referential integrity conflict

The current schema enforces that all expense and settlement references must exist in `group.memberIds`. This is intentionally strict for the current version.

When member removal and soft delete are implemented, the referential integrity model must be revised. Two approaches are being considered:

**Option A — Historical roster:** `memberIds` becomes the full historical roster. A separate `activeMemberIds` field tracks current active members. Validation splits: structural references check against `memberIds`, new expense/settlement creation checks against `activeMemberIds`.

**Option B — Relaxed validation:** References in historical expenses and settlements are no longer validated against `memberIds`. Only new expenses and settlements validate against active members.

This decision is deferred until soft delete and member removal are implemented.

---

### 8.4 Multi-currency (not in scope)

Current version is BRL only. If added in the future, `Expense` would gain a `currency` field and balance computation would need exchange rate handling. Not planned.

## 9. Business Rules

Business rules are enforced at the UI and store layer — not at the schema layer. The schema validates structural correctness only.

### 9.1 Settlement creation

A settlement can only be created between two members with an active debt:

- `fromMemberId` must have a negative balance in the group (owes money)
- `toMemberId` must have a positive balance in the group (is owed money)
- The amount must not exceed the outstanding balance of `fromMemberId`

These rules are enforced by computing `computeBalances(group)` before presenting settlement options to the user. Only eligible members are shown in the UI.

> **Why not in the schema?** Balance is derived state — it requires running `computeBalances`, which the schema has no access to. Schema validation is pure structure; business rule validation happens at action time.
