# Contributing to SplitBill

We appreciate all contributions! Whether you're a new developer looking to understand the project or an experienced coder looking to tackle our upcoming features, this guide will help you get started.

## Tech Stack
The project is built with a modern, fast, and strict toolchain:
- **Framework**: React via Vite (TypeScript)
- **Styling**: Tailwind CSS + `shadcn/ui` (for reusable, accessible components)
- **Icons**: `lucide-react` for standard UI icons and `simple-icons` for brand logos.
- **Toast Notifications**: `sonner` — all user-facing feedback toasts (errors, successes) are issued via `src/lib/toast.ts`.
- **Linting & Formatting**: Biome JS

## Local Setup
1. Clone the repository and navigate to the project directory.
2. Install the necessary dependencies (we recommend the package manager you feel most comfortable with, e.g., `npm install`).
3. Start the development server:
   ```bash
   npm run dev
   ```

## Code Quality Requirements
SplitBill uses **Biome** to enforce formatting and linting rules.
- To check for linting errors locally, run: `npm run lint`
- To format your code automatically, run: `npm run format`

*(Note: The CI pipeline will automatically run `biome ci .` to block any unformatted or incorrectly linted code from being merged).*

## Roadmap and Upcoming Features
SplitBill is built to be simple to use, yet scalable inside the browser. If you are looking for something impactful to build, here is a list of features we plan to implement in the future.

### 1. Multi-Currency Support
- Allow configuring a "Base Currency" for the entire group.
- Allow an individual expense or settlement to be recorded in a different currency.
- Whenever an expense is generated with a different currency, the app will ping an external exchange-rate API, store its current conversion rate as a frozen state of that expense, and process balance calculations normally.
- **Tech Goal**: Implement external data fetching using [TanStack Query (React Query)](https://tanstack.com/query/latest) to properly manage caching and API calls.

### 2. Receipt Scanning (OCR Client-Side)
- When registering an expense, allow the user to photograph or upload an image of a receipt.
- Use a browser-compatible library (such as [tesseract.js](https://tesseract.projectnaptha.com/)) to visually parse the receipt.
- Automatically identify total values or even participants without ever saving the physical image to a backend server (keeping the URL clean). The image stays safely embedded entirely inside the user's browser runtime.

### 3. Data Export & Import (Backups) ✅ Partially Implemented

- Although the URL mechanism works great, users may reach an arbitrary character limit or simply want to back up their data.
- ✅ **JSON Export**: Download a full state snapshot as a dated `.json` file via the **Export JSON** button in the sidebar (`ExportSection`).
- ✅ **JSON Import**: Restore state from a `.json` file via the drag-and-drop / file-picker zone on the home screen (`ImportDropZone`). Import is only permitted when the store is empty (no groups). The snapshot is validated against the current schema version before being applied.
- [ ] **CSV Export**: Download a per-group expense summary in CSV format.
- [ ] **PDF Export**: Generate a clean, readable PDF report of total aggregate group expenses.

### 4. Additional Enhancements
- **Copy Share Link**: A dedicated button in the UI with a visual success effect to instantly copy the current URL to the clipboard.
- **QR Code Link Sharing**: Generate a quick QR Code corresponding to the current URL state.
- **Categorization**: Provide standard tags/categories for expenses (e.g., Food, Travel).
- **Search & Filtering**: Filter list components by specific users, keywords, or tags.
- **Dark Mode**: Integrate a dark theme across all UI components.
- **Stateful Forms**: Expand the current architecture by integrating `React Hook Form` robustly across any new complex inputs dynamically introduced to the app.

### 5. Debt Simplification ✅ Implemented
- A greedy two-pointer algorithm (`simplifyDebts` in `src/domain/balance/simplify-debts.ts`) that minimizes the number of transactions needed to settle a group.
- Exposed in the UI via a **Simplify** toggle on the Members section — switching it replaces direct debts with simplified ones in each member card, with no recalculation (both arrays are pre-computed and memoized).

### 6. Soft Delete for Members ✅ Implemented
- Member removal now stamps a `deletedAt` timestamp on the member record instead of filtering them out of the array (soft delete).
- Soft-deleted members are hidden from all active UI (member list, expense payer/split selects, settlement from/to selects) while remaining visible in historical expense and settlement records, preserving data integrity.
- Expenses and settlements that involve a deleted member are displayed in **read-only mode** — a banner is shown and the Save button is disabled. Delete still works.

### 7. Backend Integration (V2 / V3)
While SplitBill is currently fully serverless via the URL, a major future milestone is to introduce an optional backend architecture for registered users. This will allow for cross-device syncing without relying solely on large URLs, while offering user authentication and permanent friend lists.
- **Cloudflare Ecosystem Focus**: We aim to strictly use Cloudflare's ecosystem to maintain our high performance and edge delivery.
- **Components**:
  - **Cloudflare Pages Functions / Workers**: To handle API interactions securely at the edge.
  - **Cloudflare D1**: SQL database (SQLite-based) for persistent relational data (users, groups, durable relationships).
  - **Cloudflare KV**: Key-value storage for rapid caching and session states.
  - **Fallback External Systems**: The absolute main priority is to build 100% within the Cloudflare ecosystem. However, if Cloudflare's internal tools prove insufficient for any reason (e.g., missing features, memory limits, or complex relational needs), we are completely open to utilizing external ecosystems and providers as fallbacks.
  - **ORM Setup**: We plan to use modern, type-safe ORMs like **Prisma** or **Drizzle** to connect to these databases efficiently.
- **Authentication**: Native auth integration to let users securely load up their saved dashboards from any device.
