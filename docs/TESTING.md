# Testing Strategy

Reliability is crucial for SplitBill, especially regarding its complex expense division algorithms and URL serialization procedures.

## Tools
- **Runner**: [Vitest](https://vitest.dev/) (`vitest run`).
- **DOM Simulation**: Unlike traditional setups that rely on `jsdom`, we utilize **Happy-DOM** (`happy-dom`). Happy-DOM provides a lighter, faster alternative to simulate a browser environment for testing React components.
- **Scripts**: 
  - Standard tests: `npm run test`
  - Coverage reporting: `npm run test:cov`

## What We Test
1. **State & Core Logic**: The primary focus of our tests lies in ensuring that actions correctly mutate the global Zustand state, and that the URL hydration/decompression pipeline perfectly recovers the application payload.
2. **Domain Operations**: While we define strict domain rules using Zod in our `.schema.ts` files, the raw schemas themselves are currently excluded from unit coverage (`vitest.config.ts`) in favor of testing the store and application methods that ultimately utilize them. Pure domain utilities such as `parseGlobal` (`src/domain/global/parse-global.test.ts`) are tested directly where their logic warrants it.
3. **Component Interaction**: Key components are tested to confirm they render correctly in the simulated Happy-DOM environment and respond properly to user interactions (clicks, inputs, edge cases).

## How to Extend
When contributing new features or domains, ensure you create corresponding `.test.ts` or `.test.tsx` files alongside your new code blocks. This localized testing structure helps maintain context and organization.
