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

- **HomeScreen**: Shown when `view === "home"`. Renders `ImportDropZone` when the store is empty (no groups), or a prompt to select a group from the sidebar when groups exist.
- **GroupScreen**: The main interaction area for a specific group — expenses, members, settlements.
- **ErrorScreen**: Rendered when the store status is `"error"` (invalid or incompatible URL state). Displays a message and a **Back to home** button to recover.
- **Sidebar**: Navigation listing all groups. Includes `ExportSection` at the bottom, which provides a JSON download button when groups exist.
- **ImportDropZone**: A drag-and-drop / click-to-browse zone on the home screen for restoring state from a `.json` file.
- **ExportSection**: A sidebar footer section with a **Export JSON** button; delegates the download trigger to the UI layer, keeping domain and store logic pure.

## URL State Synchronization
Instead of querying a backend, the entire application state is serialized and strictly maintained within the browser's URL. This creates a seamlessly reactive experience where the application re-renders instantly upon any state mutation.

For an in-depth look at how we compress this data to bypass URL character limits and how the store is safely hydrated, refer directly to our [State Management](STATE.md) documentation.
