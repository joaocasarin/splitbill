# Domain Modeling

The business logic in SplitBill is entirely defined and safeguarded by **Zod**. Every entity in the application is strictly typed and validated before it can be updated or submitted to the state.

## Entities
The domain is broken down into several core entities, primarily located in `src/domain/`.

### 1. Group
- Requires a minimum of 2 members and supports a maximum of 20 members safely (due to URL size constraints and UI limits).
- Custom rules are applied using Zod's `.refine()` and `.superRefine()` methods.

### 2. Member
- Participants of a group.
- Can be added to a group at any time by name.
- Can be **soft-deleted** from a group, subject to two constraints:
  - The member's **net balance must be zero** — they can neither owe nor be owed money.
  - The group must retain at least **2 active members** after the removal.
- Soft deletion stamps a `deletedAt` timestamp on the member record instead of removing it from the array, preserving historical expense and settlement data integrity.
- Soft-deleted members are hidden from all active UI (member list, expense payer/split selects, settlement from/to selects). Expenses and settlements that involve a deleted member are shown in read-only mode with a banner explaining the restriction.

### 3. Expense
- Financial records mapped to specific participants.
- Supports multiple division strategies:
  - **Equal**: Split evenly among all selected participants.
  - **Fixed Value**: A specific, arbitrary amount assigned per participant.
  - **Percentage**: Divides the total cost across participants based on specified percentages.
- **Important Rule**: The person who paid the expense (the creator) does *not* necessarily need to be a participant in the expense division.
- **Remainder distribution**: All monetary values are stored as integer cents. When a total cannot be divided evenly, the indivisible remainder cents are distributed one-at-a-time — the payer receives the first extra cent (if they are a participant), and the remaining extras are distributed to other participants in order. This applies to both Equal and Percentage splits and is handled by `computeEqualShares` and `computePercentageShares` in `src/domain/balance/compute-shares.ts`.

### 4. Settlement
- Represents a repayment to balance out the expenses.
- Any participant can record a settlement of any value for any other participant, with the strict rule that a participant cannot settle a debt with themselves.

### 5. Balances (Derived State)
- **Important Note**: User balances are **not** explicitly saved in the URL state.
- The URL only stores the raw, source-of-truth actions: the group members, the expenses, and the settlements (which contain their respective creation and update dates).
- Every time a user loads the app or an action occurs, the individual balance for each participant is **computed dynamically** in the store by deriving the net differences between their involved expenses and settlements.

#### Debt computation pipeline

Three functions derive debt state from the raw group data, in order:

| Function | Input | Output | Description |
|---|---|---|---|
| `computeBalances` | `Group` | `MemberBalance[]` | Net balance per member (positive = to receive, negative = to pay). Invariant: sum is always 0. |
| `computeDirectDebts` | `Group` | `DirectDebt[]` | Actual per-expense debts between pairs, with cross-pair netting applied. Settlements are normalized as reverse credits across the expense graph. |
| `simplifyDebts` | `MemberBalance[]` | `SimplifiedDebt[]` | Greedy two-pointer algorithm that minimizes the number of transactions needed to fully settle the group. |

Both `computeBalances` and `computeDirectDebts` share the same low-level share-computation helpers defined in `src/domain/balance/compute-shares.ts`:

| Helper | Description |
|---|---|
| `computeEqualShares` | Divides a total evenly across members; distributes remainder cents one-at-a-time (payer first). |
| `computePercentageShares` | Divides a total by basis-point weights; distributes any rounding remainder one-at-a-time (payer first). |

`SimplifiedDebt` is defined in `balance.schema.ts` and has the same shape as `DirectDebt` (`fromMemberId`, `toMemberId`, `amount`).

Both `DirectDebt[]` and `SimplifiedDebt[]` arrays are memoized on the `Group` object in `useGroupScreen` — they are recomputed only when an expense or settlement action mutates the group, never on UI interactions such as toggling the simplified view.

## Validation Strategy
Using Zod allows us to share types across the application statically and validate them at runtime dynamically. The integration of `.refine` and `.superRefine` ensures that complex cross-field validations (like verifying that the sum of percentages equals exactly 100%) are caught early before they mutate the application state.
