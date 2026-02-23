# Application Specification – Expense Sharing App

> **Scope:** Application-level concerns — tech stack, architecture, state persistence, roadmap, and pending decisions.  
> **Last updated:** 2026-02-23 2:28am UTC-3  
> **Status:** Draft

---

## Table of Contents

1. [Summary](#1-summary)
2. [Tech Stack](#2-tech-stack)
3. [Architecture Overview](#3-architecture-overview)
4. [State Persistence Strategy](#4-state-persistence-strategy)
5. [ID Generation Strategy](#5-id-generation-strategy)
6. [Initial Load Behavior](#6-initial-load-behavior)
7. [Roadmap & Pending Decisions](#7-roadmap--pending-decisions)

---

## 1. Summary

A **100% client-side** expense sharing web app (Splitwise-style) with no backend and no database. The entire application state lives in the URL — compressed and encoded. Anyone with the URL can read and modify the state. There is no authentication or access control by design.

---

## 2. Tech Stack

| Concern | Decision |
|---|---|
| Framework | React + Vite |
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

IDs are **positive integers** (`int`, up to `Number.MAX_SAFE_INTEGER`). They are generated in memory by a centralized `createId()` utility that maintains a counter.

**Why integers instead of strings (uuid/nanoid)?**  
Integer IDs produce a smaller URL payload and are simpler to generate without a library. Since there is no backend or multi-device sync, collision risk is zero within a single session.

> **Future consideration:** If multi-device sync or collaborative editing is ever needed, IDs should migrate to strings (nanoid or uuid) to avoid collisions across independent sessions.

---

## 6. Initial Load Behavior

```
URL has ?state= param
    └── valid → hydrate app
    └── invalid → show error screen

URL has no ?state= param
    └── start with empty state
        └── user must create at least one User
            └── only then can a Group be created
```

---

## 7. Roadmap & Pending Decisions

### 7.1 Calculation functions (immediate next step)

Two pure functions to implement in `src/domain/balance/`:

**`compute-balances.ts`**
- Input: `Group` + `User[]` (for name resolution, optional)
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

### 7.2 Timestamps (deferred)

Timestamps are intentionally omitted from the current version to keep schemas and URL payloads lean while the core logic is being built.

**Why `number` (unix ms) and not `z.iso.datetime()` (string)?**  
Integer timestamps are smaller in the URL payload, require no parsing, and are directly comparable for sorting. ISO strings are more human-readable but add unnecessary overhead in a URL-encoded state context.

| Field | Type | Entity |
|---|---|---|
| `createdAt` | `number` (unix ms) | User, Group, Expense, Settlement |
| `updatedAt` | `number` (unix ms) | Expense only |
| `deletedAt` | `number` (unix ms), optional | User only |

---

### 7.3 Soft delete for Users (deferred)

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

---

### 7.4 Multi-currency (not in scope)

Current version is BRL only. If added in the future, `Expense` would gain a `currency` field and balance computation would need exchange rate handling. Not planned.
