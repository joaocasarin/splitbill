# Domain Specification – Expense Sharing App

> **Scope:** Domain layer only — schemas, business rules, modeling decisions, and validation architecture.  
> **Last updated:** 2026-02-23  
> **Status:** Draft

---

## Table of Contents

1. [Domain Entities](#1-domain-entities)
   - 1.1 [Global State](#11-global-state)
   - 1.2 [User](#12-user)
   - 1.3 [Group](#13-group)
   - 1.4 [Expense](#14-expense)
   - 1.5 [Settlement](#15-settlement)
   - 1.6 [Balance (derived)](#16-balance-derived)
2. [Money Representation](#2-money-representation)
3. [Split Modes](#3-split-modes)
4. [Validation Architecture](#4-validation-architecture)
5. [Key Design Decisions](#5-key-design-decisions)
6. [Terminology Glossary](#6-terminology-glossary)
7. [File Structure](#7-file-structure)

---

## 1. Domain Entities

### 1.1 Global State

**File:** `src/domain/global/global.schema.ts`

The root entity. Contains all users and all groups.

```
GlobalSchema
├── version: int (positive)
├── users: User[]
└── groups: Group[]
```

**Rules enforced at this level (cross-entity integrity):**
- User IDs must be unique across all users.
- Group IDs must be unique across all groups.
- Every `memberId` referenced inside any group must exist as a `userId` in `users[]`.

> **Why here and not in GroupSchema?** `GroupSchema` has no access to the global `users[]` array. The referential integrity check — "does this member actually exist as a global user?" — can only happen at the `GlobalSchema` level, where both `users` and `groups` are visible.

---

### 1.2 User

**File:** `src/domain/user/user.schema.ts`

Represents a person in the application. Users are **global** — they exist independently of any group.

```
UserSchema
├── id: EntityId
└── name: string (min 3, max 25)
```

**Conceptual note:** A `User` in the global context becomes a `Member` when referenced inside a group. The same real person has two different roles depending on the context they appear in. This is intentional — see [Terminology Glossary](#6-terminology-glossary).

**Pending:** Soft delete (`deletedAt`) is planned but not yet implemented. See [APP_SPEC.md](./APP_SPEC.md).

---

### 1.3 Group

**File:** `src/domain/group/group.schema.ts`

Represents a collection of members sharing expenses.

```
GroupSchema
├── id: EntityId
├── name: string (min 4, max 20)
├── memberIds: EntityId[] (min 2, no duplicates)
├── expenses: Expense[]
└── settlements: Settlement[]
```

**Rules:**
- Must have at least **2 members** — a group with 1 person has no one to split with.
- `memberIds` must not contain duplicates.
- Expense IDs must be unique within the group.
- Settlement IDs must be unique within the group.
- Every `payerId` in an expense must be in `memberIds`.
- Every participant in an expense split must be in `memberIds`.
- Every `fromMemberId` and `toMemberId` in a settlement must be in `memberIds`.

**Note:** Groups do not store balances. Balances are derived — see [Balance](#16-balance-derived).

---

### 1.4 Expense

**File:** `src/domain/expense/expense.schema.ts`

Represents a cost paid by one member and split among participants.

```
BaseExpenseFields
├── id: EntityId
├── title: string (min 3, max 50)
├── total: ExpenseTotal (positive int, cents)
└── payerId: EntityId
```

The expense is a **discriminated union** on `splitMode`:

#### Equal split
```
EqualExpenseSchema (extends Base)
├── splitMode: "equal"
└── memberIds: EntityId[] (min 2, no duplicates)
```
The division algorithm is handled in the calculation layer, not the schema. Remainder cents (when `total % memberIds.length !== 0`) are distributed algorithmically.

> **Why not validate divisibility in the schema?** Because `R$10.00 ÷ 3 people` is a completely valid real-world case. Rejecting it at schema level would be overly restrictive. The schema validates structure and integrity; the calculation function handles the math.

#### Fixed split
```
FixedExpenseSchema (extends Base)
├── splitMode: "fixed"
└── shares: MoneyShare[] (min 1, no duplicate memberIds)
    ├── memberId: EntityId
    └── value: ShareAmount (positive int, cents)
```
**Cross-field rule:** `sum(shares[].value)` must equal `total`. Enforced via `superRefine`.

#### Percentage split
```
PercentageExpenseSchema (extends Base)
├── splitMode: "percentage"
└── shares: PercentageShare[] (min 1, no duplicate memberIds)
    ├── memberId: EntityId
    └── value: PercentageBasePoint (int, 1–10000)
```
**Rules:**
- `sum(shares[].value)` must equal `10000` (= 100%).
- Values are in **basis points** (bps): `10000 = 100%`, `5000 = 50%`, `1 = 0.01%`.

> **Why basis points?** To avoid floating point. `50%` stored as `5000` allows `Math.round(total * bps / 10000)` — a pure integer calculation with no floats.

---

### 1.5 Settlement

**File:** `src/domain/settlement/settlement.schema.ts`

Represents a manual payment between two members — a confirmed debt repayment.

```
SettlementSchema
├── id: EntityId
├── fromMemberId: EntityId (who pays)
├── toMemberId: EntityId (who receives)
└── amount: ShareAmount (positive int, cents)
```

**Rules:**
- `fromMemberId ≠ toMemberId`.
- Amount must be positive.

**Conceptual distinction between `SimplifiedDebt` and `Settlement`:**

| | `SimplifiedDebt` | `Settlement` |
|---|---|---|
| **What it is** | A suggested future payment | A confirmed past payment |
| **Origin** | Output of `simplify-debts` algorithm | Created by user action |
| **Stored?** | Never | Always (in group) |
| **Has ID?** | No | Yes |
| **Affects balance?** | No | Yes |

---

### 1.6 Balance (derived)

**File:** `src/domain/balance/balance.schema.ts`

Balance types are **never stored**. They are the output types of calculation functions.

```
MemberBalanceSchema
├── memberId: EntityId
└── amount: BalanceAmount (int, negative or positive)
    // negative = liability (owes money)
    // positive = receivable (is owed money)
```

```
SimplifiedDebtSchema
├── fromMemberId: EntityId (who owes)
├── toMemberId: EntityId (who receives)
└── amount: ShareAmount (always positive)
```

**Invariant:** The sum of all `MemberBalance.amount` values in a group must always equal `0`.

> **Note:** `SimplifiedDebt` is mapped but not part of the initial scope. See [APP_SPEC.md](./APP_SPEC.md).

---

## 2. Money Representation

All monetary values are stored as **integers in cents (BRL)**. No floats anywhere in the system.

| Value | Stored as |
|---|---|
| R$ 0.01 | `1` |
| R$ 1.00 | `100` |
| R$ 10.00 | `1000` |
| R$ 100.00 | `10000` |

### Schema types

| Schema | Range | Used for |
|---|---|---|
| `ExpenseTotalSchema` | `int, > 0` | Expense total |
| `ShareAmountSchema` | `int, > 0` | Fixed share value, settlement amount, debt edge amount |
| `BalanceAmountSchema` | `int, any` | Member balance (can be negative) |
| `PercentageBasePointSchema` | `int, 1–10000` | Percentage split values |

---

## 3. Split Modes

| Mode | Data stored | Schema-level validation | Calc-level logic |
|---|---|---|---|
| `equal` | `memberIds[]` | No duplicates, min 2 | Divide total; remainder absorbed by the first participant in the list |
| `fixed` | `shares[]{memberId, value}` | No duplicates; sum = total | Direct use |
| `percentage` | `shares[]{memberId, value}` | No duplicates; sum = 10000 bps | `Math.round(total * bps / 10000)` per member; remainder from rounding absorbed by the first participant in the list |

---

## 4. Validation Architecture

Validation is layered — each schema only validates what it can see.

```
GlobalSchema.superRefine
└── user IDs unique
└── group IDs unique
└── group.memberIds exist in users[]

    GroupSchema.superRefine
    └── expense IDs unique
    └── settlement IDs unique
    └── expense.payerId in group.memberIds
    └── expense participants in group.memberIds
    └── settlement members in group.memberIds

        FixedExpenseSchema.superRefine
        └── sum(shares) === total

        PercentageExpenseSchema (array refines)
        └── no duplicate memberIds
        └── sum(shares) === 10000
```

### `error` vs `message` in Zod v4

| Context | Key |
|---|---|
| `.min()`, `.max()`, `.int()`, `.positive()` | `error` |
| `.refine()` | `error` |
| `ctx.addIssue()` | `message` |

### `refine` vs `superRefine`

- **`refine`**: single boolean condition on a single field or object. Preferred when only one issue is possible.
- **`superRefine`**: used when multiple issues may need to be emitted independently (e.g., iterating a collection and emitting one error per invalid item).

### Cross-field validation placement

- Validations depending only on a single field's own data → `.refine()` on that field.
- Validations crossing two or more fields in the same object → `.superRefine()` on the object.
- Validations crossing two or more entities → `.superRefine()` on the parent schema that contains both.

---

## 5. Key Design Decisions

### `User` vs `Member` terminology
The same person is called a `User` in the global context and a `Member` inside a group. This is not an inconsistency — it is an intentional domain modeling decision. `User` is an application-level entity; `Member` is the role that user plays within a group's context. This pattern is common in domain-driven design.

### Balance is always derived
Storing balance would create a second source of truth that could diverge from the transaction history. All balances are computed fresh from `expenses` and `settlements` every time they are needed.

### No floating point
Enforced at every level. All division uses `Math.floor` or `Math.round` on integer arithmetic. Remainders are handled algorithmically in the calculation layer, never stored.

### Divisibility not validated in schema
`equal` split does not require `total % memberIds.length === 0`. Rejecting non-divisible amounts would block valid real-world cases (e.g., R$10 between 3 people). The remainder is handled in the calculation function.

### `superRefine` for fixed sum validation
The rule `sum(shares) === total` in `FixedExpenseSchema` is a cross-field validation (it involves both `shares` and `total`), so it lives in `superRefine` at the object level, not in a `refine` on the array alone.

### Array order is domain-significant

The order of arrays in the domain is not arbitrary — it has financial consequences:

- **`group.memberIds[]`** — the first member absorbs remainder cents in equal splits
- **`expense.memberIds[]`** (equal split) — the first member absorbs remainder cents
- **`expense.shares[]`** (percentage split) — the first share absorbs rounding remainder

**Consequences:**
- Reordering these arrays changes the financial outcome
- The UI must preserve insertion order — no arbitrary sorting
- Once expenses exist in a group, member and share order should be treated as immutable

**`group.expenses[]` and `group.settlements[]`** — order defines the chronological application sequence. `computeBalances` iterates them in array order. Reordering would not change the final balance (addition is commutative), but it would change the semantic meaning of the history.

---

## 6. Terminology Glossary

| Term | Meaning |
|---|---|
| `User` | A person in the global application state |
| `Member` | A `User` referenced within the context of a group |
| `Expense` | A cost paid by one member, split among participants |
| `Settlement` | A confirmed payment between two members that reduces debt |
| `SimplifiedDebt` | A suggested (not yet confirmed) payment, output of the simplification algorithm |
| `MemberBalance` | The net financial position of a member in a group (derived, never stored) |
| `Share` | A member's portion of an expense (in cents or basis points depending on split mode) |
| `Basis point (bps)` | 1/100 of 1%. Used for percentage storage. `10000 bps = 100%` |
| `EntityId` | Positive integer ID, up to `Number.MAX_SAFE_INTEGER` |

---

## 7. File Structure

```
src/domain/
├── balance/
│   ├── balance.schema.ts        # MemberBalanceSchema, SimplifiedDebtSchema
│   └── compute-balances.ts      # computeBalances()
├── common/
│   ├── constants.ts             # BPS_TOTAL, BPS_MIN...
│   ├── create-id.ts             # createIdGenerator()
│   └── entity-id.schema.ts      # EntityIdSchema
├── expense/
│   ├── expense-share.schema.ts  # MoneyShareSchema, PercentageShareSchema
│   └── expense.schema.ts        # EqualExpense, FixedExpense, PercentageExpense, Expense
├── global/
│   └── global.schema.ts         # GlobalSchema (root of all state)
├── group/
│   └── group.schema.ts          # GroupSchema
├── money/
│   ├── money.schema.ts          # ExpenseTotal, ShareAmount, BalanceAmount
│   └── percentage.schema.ts     # PercentageBasePointSchema
├── settlement/
│   └── settlement.schema.ts     # SettlementSchema
└── user/
    └── user.schema.ts           # UserSchema
```
