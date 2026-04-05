# State Management

Because SplitBill operates without a backend database, its state management approach is vital to its success. We utilize **Zustand** for a lightweight, flexible global state.

## The Store
The primary state of the application is maintained in `src/store/app.store.ts` (and relevant domain subsets if applicable).

## Hydration and Compression
1. **Serialization**: Whenever an action occurs (e.g., adding an expense, settling a debt, editing a member), the store serializes the new state.
2. **Compression**: The serialized string is passed through `lz-string` to compress it into a base64 string.
3. **URL Update**: The compressed string is appended to the browser's URL. This provides a "save as you go" feature without network requests.
4. **Hydration**: When the application mounts, it reads the URL, decompresses the base64 string back into JSON, and utilizes the Zod schemas from the Domain layer to safely validate and hydrate the Zustand store. If the URL is tampered with or invalid, the validation fails gracefully, preventing application crashes.

This mechanism completely decouples the application from server dependencies while retaining state durability and shareability.

## Store Actions

The Zustand store (`src/store/app.store.ts`) exposes the following actions:

| Action | Description |
|---|---|
| `hydrateFromUrl()` | Reads and decompresses the URL hash, validates via `parseGlobal`, sets state to `loaded` or `error` |
| `initEmpty()` | Resets state to empty (no groups) |
| `syncToUrl()` | Serializes and compresses current state back to the URL |
| `addGroupWithMembers(...)` | Creates a new group with an initial member list |
| `addMemberByName(...)` | Adds a member by name to an existing group |
| `removeMemberFromGroup(...)` | Soft-deletes a member (stamps `deletedAt`), subject to balance and minimum-member guards |
| `addExpense(...)` | Records a new expense in a group |
| `updateExpense(...)` | Replaces an existing expense |
| `deleteExpense(...)` | Removes an expense |
| `addSettlement(...)` | Records a new settlement in a group |
| `updateSettlement(...)` | Replaces an existing settlement |
| `deleteSettlement(...)` | Removes a settlement |
| `importGlobal(raw)` | Imports state from a raw JSON string (see below) |

## JSON File Import

`importGlobal(raw: string)` provides a second hydration path for restoring a previously exported snapshot:

1. **Guard** — returns `{ success: false }` immediately if the store already contains groups (import is only allowed into a clean/empty state).
2. **JSON parse** — attempts `JSON.parse(raw)`; returns `{ success: false, error: "Invalid JSON" }` on failure.
3. **Schema validation** — delegates to `parseGlobal` from `src/domain/global/`; returns its error on failure.
4. **Version check** — rejects snapshots whose `version` field does not match the current `SCHEMA_VERSION` constant.
5. **State replacement** — calls `set(...)` with the imported data, rebuilds the ID generator, and calls `syncToUrl()`.

Returns `{ success: true }` or `{ success: false; error: string }`.

On success, `importGlobal` also fires `showToast.success(...)` so the user receives a visual confirmation that the snapshot was applied. On failure the caller (e.g. `ImportDropZone`) is responsible for surfacing the error — typically via `showToast.error(...)`.

## Error State

If `hydrateFromUrl` fails validation (tampered or incompatible URL), the store sets `status: "error"`. The `App` component renders `ErrorScreen` in this case, which displays a message and a **Back to home** button that calls `initEmpty()` to recover to a clean state.
