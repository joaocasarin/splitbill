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
