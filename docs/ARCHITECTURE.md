# Architecture Overview

SplitBill embraces a purely serverless, front-end-only architecture. By persisting all user data strictly within the URL, the application avoids the complexity, latency, and costs associated with traditional databases and backends.

## Application Structure
- **Vite & React**: The core building blocks for rendering the UI and bundling the application.
- **Components**: UI elements are mostly derived from `shadcn/ui` to guarantee accessibility and consistency. They are designed to be as reusable as possible.
- **Infrastructure**:
  - Hosted on **GitHub** (public repository).
  - Continuous Integration (CI) and Deployment (CD) are handled via **GitHub Actions**.
  - Any pull request merged into the deployment branch triggers an automatic build and deployment to **Cloudflare Pages**.
  - We use `wrangler` (installed as a dev dependency) to manage Cloudflare integrations.

## Screens and Components

- **AppLogo**: Reusable SVG logo component (`src/components/AppLogo.tsx`). Accepts `size` (number, default 32), `background` (`"primary" | "secondary" | "none"`), `foreground` (`"primary" | "secondary" | "none"`), and an optional `label` string. When `label` is provided, the SVG and text are wrapped in a flex container; the text inherits color from its parent and uses `font-semibold text-base tracking-tight`. Used in the `AppLayout` header with `label="splitbill"`; can be reused anywhere a scaled or recoloured logo is needed. The same shape is served as a static `public/favicon.svg` for the browser tab icon.
- **HomeScreen**: Shown when `view === "home"`. Renders `ImportDropZone` when the store is empty (no groups), or a prompt to select a group from the sidebar when groups exist.
- **GroupScreen**: The main interaction area for a specific group — expenses, members, settlements.
- **ErrorScreen**: Rendered when the store status is `"error"` (invalid or incompatible URL state). Displays a message and a **Back to home** button to recover.
- **Sidebar**: Navigation listing all groups. Includes `ExportSection` at the bottom, which provides a JSON download button when groups exist.
- **ImportDropZone**: A drag-and-drop / click-to-browse zone on the home screen for restoring state from a `.json` file.
- **ExportSection**: A sidebar footer section with a **Export JSON** button; delegates the download trigger to the UI layer, keeping domain and store logic pure.
- **Toaster** (`src/components/ui/sonner.tsx`): Thin wrapper around the `sonner` Toaster, pre-configured with design-system icons (`lucide-react`) and CSS variable–based styling tokens. Mounted once at the root of the app (`App.tsx`) with `position="top-right"` and `closeButton` enabled.

## Toast Notifications

All user-facing feedback is issued through `src/lib/toast.ts`, which wraps `sonner`'s `toast.error` and `toast.success` with shared design-system class names and centrally configured durations.

```
src/lib/toast.ts
├── errorClassNames   — Tailwind classes for error toasts (red palette)
├── successClassNames — Tailwind classes for success toasts (green palette)
└── showToast
    ├── .error(message, options?)   — 30 s auto-dismiss
    └── .success(message, options?) — 10 s auto-dismiss
```

Durations and the default position are defined as named constants in `src/common/constants.ts`:

| Constant | Value |
|---|---|
| `TOAST_POSITION` | `"top-right"` |
| `ERROR_TOAST_DURATION_SECONDS` | `30 000 ms` |
| `SUCCESS_TOAST_DURATION_SECONDS` | `10 000 ms` |

Current call sites:
- **`ImportDropZone`** — calls `showToast.error(...)` when the imported file contains invalid JSON or fails schema validation.
- **`importGlobal` (store action)** — calls `showToast.success(...)` after a snapshot is successfully imported.

## URL State Synchronization
Instead of querying a backend, the entire application state is serialized and strictly maintained within the browser's URL. This creates a seamlessly reactive experience where the application re-renders instantly upon any state mutation.

For an in-depth look at how we compress this data to bypass URL character limits and how the store is safely hydrated, refer directly to our [State Management](STATE.md) documentation.
