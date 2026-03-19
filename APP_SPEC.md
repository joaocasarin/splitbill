# Application Specification – Expense Sharing App

> **Scope:** Application-level concerns — tech stack, architecture, state persistence, roadmap, and pending decisions.  
> **Last updated:** 2026-03-18
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
10. [Store](#10-store)

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
| State persistence | URL (JSON → LZString compression → URI encode) |
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
                └── groups[]
                    ├── members[]            ← inline group members
                    ├── expenses[]
                    └── settlements[]
```

### Why arrays and not Sets or Maps?

`Set` and `Map` are **not JSON-serializable**. `JSON.stringify(new Set([1,2,3]))` produces `{}` — all data is silently lost. Arrays survive the full cycle: `JSON.stringify → compress → encode → decode → JSON.parse`.

When lookup performance is needed (e.g., inside calculation functions), arrays are converted to `Set` or `Map` locally and transiently, never stored back.

### Derived vs. stored state

**Balances are never stored.** They are always computed on demand from expenses and settlements. This keeps the URL payload minimal and prevents stored balance from ever diverging from the actual transaction history.

### Migration path to backend

The domain layer (`src/domain/`) is framework-agnostic by design. If a backend is added in the future:

| Responsibility | Today | With backend |
|---|---|---|
| Schemas and types | `src/domain/` | unchanged |
| Structural validation | Zod (domain layer) | unchanged |
| Business rules | `src/domain/*.rules.ts` | move to backend `services/` |
| Persistence | URL | database |
| Client state | Zustand + URL | Zustand + API calls |

Business rules are isolated in pure `*.rules.ts` functions today precisely to make this migration a file move, not a refactor.

### UI Layout
```
src/
├── App.tsx              # root — owns view state and isSidebarOpen state
├── AppLayout.tsx        # shell — header, desktop aside, mobile drawer overlay
├── components/
│   ├── Sidebar.tsx      # navigation — groups list, modals
│   ├── GroupsSection.tsx# group list with member counts + "Add group" button
│   ├── CurrencyInput.tsx# cents-based currency input (R$, keyboard-driven)
│   └── ConfirmDeleteDialog.tsx # reusable delete confirmation dialog
└── screens/
    ├── HomeScreen/      # empty state — "Select a group from the sidebar"
    │   └── AddGroupModal.tsx   # group creation with inline member name inputs
    ├── GroupScreen/      # main group view — members, expenses, settlements
    │   ├── useGroupScreen.ts   # hook: group data, balances, modal state
    │   ├── members/
    │   │   ├── MembersSection.tsx  # member list with balances + remove buttons
    │   │   └── AddMemberModal.tsx  # add new member by name to group
    │   ├── expenses/
    │   │   ├── ExpensesSection.tsx        # expense list with edit/delete actions
    │   │   ├── ExpenseModal.tsx           # dual-purpose add/edit expense modal
    │   │   ├── useExpenseForm.ts          # hook: expense form state and validation
    │   │   ├── computeCanSubmit.ts        # pure function: form submit eligibility
    │   │   ├── getInitialExpenseState.ts  # pure function: initial form state from expense
    │   │   ├── SplitModeToggle.tsx        # toggle between equal/fixed/percentage
    │   │   ├── EqualSplitSection.tsx      # participant checkboxes
    │   │   ├── FixedSplitSection.tsx      # currency input per member
    │   │   └── PercentageSplitSection.tsx # percentage input per member
    │   └── settlements/
    │       ├── SettlementsSection.tsx  # settlement list with edit/delete actions
    │       ├── SettlementModal.tsx     # dual-purpose add/edit settlement modal
    │       └── useSettlementForm.ts    # hook: settlement form state and validation
    └── ErrorScreen/     # invalid/corrupted state display
```

**Desktop:** sidebar always visible via `hidden md:block` on the `<aside>`.
**Mobile:** sidebar hidden by default. Burger button in the header toggles a drawer overlay. Backdrop is a `<button>` (not `<div>`) for keyboard and screen reader accessibility.
**State:** `isSidebarOpen` lives in `App` and is passed to `AppLayout` (`isSidebarOpen`, `onToggleSidebar`, `onCloseSidebar`) and to `Sidebar` (`onClose`). `onClose` is optional — `Sidebar` works standalone on desktop without it.

---

## 4. State Persistence Strategy

The entire `Global` state is serialized and stored in the URL as a query parameter.

**On save:**
1. `JSON.stringify(globalState)`
2. `LZString.compressToEncodedURIComponent` (compress + URI-safe encode in one step)
3. Written to `?state=...` in the URL via `window.history.replaceState`

**On load:**
1. Read `?state=...` from URL
2. `LZString.decompressFromEncodedURIComponent` — returns `null` on failure
3. If `null` → throw (caught as invalid state)
4. `JSON.parse`
5. `GlobalSchema.parse(data)` — Zod validates the full state
6. Hydrate application

**On invalid state:**
Display an error screen. Do not attempt partial hydration.

---

## 5. ID Generation Strategy

IDs are **positive integers** (`int`, up to `Number.MAX_SAFE_INTEGER`). They are generated via `createIdGenerator(global)` — a closure that maintains independent counters per entity type: `member`, `group`, `expense`, and `settlement`.

In practice, URL size limits (see [§6](#6-initial-load-behavior)) will be reached long before integer overflow becomes a concern.

**Why per-type counters?**
Each domain enforces ID uniqueness within its own scope — member IDs within a group, group IDs among groups, expense IDs within a group. Cross-domain ID uniqueness is never required, so a shared counter would only inflate IDs unnecessarily.

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
        └── user creates a Group directly (with inline member names)
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

**Current version:** `3`

**Purpose:**
- Allows future migrations when the schema changes in a breaking way
- On load, the app can detect outdated state and either migrate or reject it

**Current behavior:**
State from an older version fails `GlobalSchema.parse()` and renders the error screen. No migration logic exists — old URLs are intentionally invalidated.

**Future behavior (when migrations are needed):**
1. Read `version` from the parsed state
2. If `version < currentVersion` → run migration chain
3. If `version > currentVersion` → show error (state is from a newer version of the app)
4. If `version === currentVersion` → hydrate normally

**Version history:**
- `1` — initial schema (no timestamps)
- `2` — added `createdAt` (required) to User, Group, Expense, Settlement; added `updatedAt` (optional) to Expense and Settlement
- `3` — removed global `users[]` array; groups now carry inline `members[]`; removed `memberIds[]` references

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
  - Equal split: `Math.floor(total / n)` per member, remainder absorbed by the payer (or first participant if payer is not in the list)
  - Percentage split: `Math.round(total * bps / 10000)` per member, remainder from rounding absorbed by the payer (or first participant if payer is not in shares)

**`compute-direct-debts.ts`** ✅ _Implemented_
- Input: `Group`
- Output: `DirectDebt[]`
- Logic:
  1. For each expense: accumulate how much each non-payer owes the payer directly, using `Math.floor` (equal) or `Math.round` (percentage) per member. Remainder absorption follows the same rule as `compute-balances`: payer absorbs remainder (or first participant if payer is not in the list/shares).
  2. For each settlement: reduce the corresponding debt edge by `settlement.amount` (adds a negative delta to `from → to`).
  3. **Cross-pair netting:** after building the full debt map, iterate all pairs and cancel reverse debts against each other. If A→B = 10 and B→A = 6, the result is A→B = 4 and B→A = 0.
  4. Filter out all edges with `amount <= 0`.

**`simplify-debts.ts`** — _Status: Mapped, not in initial scope_
- Input: `MemberBalance[]`
- Output: `SimplifiedDebt[]`
- Algorithm: two-heap approach (max-heap for creditors, min-heap for debtors). Pair the largest debtor with the largest creditor, settle the minimum of the two, repeat until all balances are zero. Minimizes the number of transactions.

---

### 8.2 Timestamps

All entities carry timestamps. The UI displays them on expense and settlement list items and sorts by most recently touched.

**Why `number` (unix ms) and not `z.iso.datetime()` (string)?**
Integer timestamps are smaller in the URL payload, require no parsing, and are directly comparable for sorting. ISO strings are more human-readable but add unnecessary overhead in a URL-encoded state context.

| Field | Type | Entity | Notes |
|---|---|---|---|
| `createdAt` | `number` (unix ms), required | Member, Group, Expense, Settlement | Set by store on creation |
| `updatedAt` | `number` (unix ms), optional | Expense, Settlement | Set by store on edit only |

**Display format:** `hh:mm dd/mm/yy` (24-hour, local time) via `formatTimestamp()` in `src/lib/format.ts`.

**Sort order:** expenses and settlements are sorted by `updatedAt ?? createdAt` descending (most recently touched first).

---

### 8.3 Member removal ✅ Implemented

**Removing a member from a group** is validated before it takes effect:

| Rule | Detail |
|---|---|
| Minimum members | Group must still have at least 2 members after removal |
| Balance | Member's balance in the group must be 0 before removal |
| History | Member's past expenses and settlements remain in the group unchanged |

**Implementation:** `removeMemberFromGroup(groupId, memberId)` in the store. Returns `ValidationResult`.

---

### 8.4 Multi-currency (not in scope)

Current version is BRL only. If added in the future, `Expense` would gain a `currency` field and balance computation would need exchange rate handling. Not planned.

## 9. Business Rules

Business rules are enforced at the UI and store layer — not at the schema layer. The schema validates structural correctness only.

### 9.1 Settlement creation

Any member can create a settlement to any other member in any positive amount — there is no debt constraint. Validation is structural only: `fromMemberId ≠ toMemberId` and `amount > 0`, enforced by `SettlementSchema`.

The `SettlementModal` allows selecting any member as payer (From) and any other member as recipient (To). No debt calculation is required at creation time.

> **Why no debt constraint?** Real-world payments don't always match the computed debt exactly — people may overpay, pay in installments, or settle debts outside the app. Restricting settlements to computed debts would make the tool less useful in practice.

### 9.2 Debt display

`computeDirectDebts(group)` is still computed and displayed per member in `MembersSection` (the `owes` and `receives` fields on each `MemberRow`). This gives users a live view of who owes whom based on expenses and settlements, without restricting what payments can be recorded.

### 9.3 Future — simplified debts

A UI toggle will suggest optimized payment paths via `simplify-debts`. This does not affect settlement creation — it only changes what suggestions are shown to the user. Settlements remain free-form user-initiated records.

## 10. Store

The application state is managed by a single Zustand store located at `src/store/app.store.ts`.

### State shape

| Field | Type | Description |
|---|---|---|
| `status` | `"empty" \| "loaded" \| "error"` | Current application status |
| `global` | `Global` | The full domain state |
| `createId` | `ReturnType<typeof createIdGenerator>` | ID generator initialized from current state |

### Actions

| Action | Description |
|---|---|
| `hydrateFromUrl()` | Reads `?state=` from URL, parses and validates, sets `status` accordingly |
| `initEmpty()` | Resets store to empty state |
| `syncToUrl()` | Serializes `global` and writes to `?state=` in URL |
| `addGroupWithMembers(name, memberNames)` | Creates a new group with inline members (by name) and syncs to URL |
| `addMemberByName(groupId, name)` | Creates a new member in the group by name and syncs to URL |
| `addExpense(groupId, expense)` | Adds an expense to the specified group and syncs to URL |
| `updateExpense(groupId, expense)` | Updates the expense in the specified group and syncs to URL |
| `deleteExpense(groupId, expenseId)` | Deletes the expense from the specified group and syncs to URL |
| `addSettlement(groupId, settlement)` | Adds a settlement between any two members in any amount and syncs to URL |
| `updateSettlement(groupId, settlement)` | Updates the settlement in the specified group and syncs to URL |
| `deleteSettlement(groupId, settlementId)` | Deletes the settlement from the group and syncs to URL |
| `removeMemberFromGroup(groupId, memberId)` | Validates balance, minimum members, and membership, then removes. Returns `ValidationResult`. |

### Notes
- `syncToUrl` is called automatically at the end of every mutating action
- `createId` is re-initialized from the loaded state on `hydrateFromUrl` to prevent ID collisions
- `syncToUrl` uses `lzstring.compressToEncodedURIComponent(JSON.stringify(global))` for compression and encoding
