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
- Can be removed from a group, subject to two constraints:
  - The member's **net balance must be zero** — they can neither owe nor be owed money.
  - The group must retain at least **2 active members** after the removal.

### 3. Expense
- Financial records mapped to specific participants.
- Supports multiple division strategies:
  - **Equal**: Split evenly among all selected participants.
  - **Fixed Value**: A specific, arbitrary amount assigned per participant.
  - **Percentage**: Divides the total cost across participants based on specified percentages.
- **Important Rule**: The person who paid the expense (the creator) does *not* necessarily need to be a participant in the expense division.

### 4. Settlement
- Represents a repayment to balance out the expenses.
- Any participant can record a settlement of any value for any other participant, with the strict rule that a participant cannot settle a debt with themselves.

### 5. Balances (Derived State)
- **Important Note**: User balances are **not** explicitly saved in the URL state. 
- The URL only stores the raw, source-of-truth actions: the group members, the expenses, and the settlements (which contain their respective creation and update dates).
- Every time a user loads the app or an action occurs, the individual balance for each participant is **computed dynamically** in the store by deriving the net differences between their involved expenses and settlements.

## Validation Strategy
Using Zod allows us to share types across the application statically and validate them at runtime dynamically. The integration of `.refine` and `.superRefine` ensures that complex cross-field validations (like verifying that the sum of percentages equals exactly 100%) are caught early before they mutate the application state.
