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

## URL State Synchronization
Instead of querying a backend, the entire application state is serialized and strictly maintained within the browser's URL. This creates a seamlessly reactive experience where the application re-renders instantly upon any state mutation.

For an in-depth look at how we compress this data to bypass URL character limits and how the store is safely hydrated, refer directly to our [State Management](STATE.md) documentation.
