# Splitbill

A fully client-side deterministic expense splitting application built with React and Vite.

No backend.
No authentication.
Fully shareable via URL.

---

## Table of Contents

1. [Overview](#1-overview)
2. [Features](#2-features)
3. [Tech Stack](#3-tech-stack)
4. [Getting Started](#4-getting-started)
5. [Architecture](#5-architecture)
6. [State Management](#6-state-management)
7. [Money Handling](#7-money-handling)
8. [URL Sharing](#8-url-sharing)
9. [Financial Invariants](#9-financial-invariants)
10. [Future Roadmap](#10-future-roadmap)
11. [Documentation](#11-documentation)

---

## 1. Overview

This application allows users to:

- Create groups with inline members
- Add expenses with equal, fixed, or percentage splits
- View member balances per group
- Register settlements between members
- Add or remove members from groups
- Share full application state via URL

The system is designed with strong domain consistency and financial determinism.

---

## 2. Features

- Integer-based money system (cents only)
- Equal, fixed, and percentage split modes
- Partial settlements supported
- Deterministic balance computation
- Full state sharing via compressed URL
- Direct-debt validation on settlement creation
- Edit and delete expenses and settlements with confirmation dialogs
- Member removal with balance and minimum/maximum-member validation (min 2, max 20)
- Responsive layout with sidebar navigation and mobile drawer support

---

## 3. Tech Stack

| Concern | Tool |
|---|---|
| Framework | React 19 + Vite |
| Language | TypeScript |
| State management | Zustand |
| Schema & validation | Zod v4 |
| Styling | Tailwind CSS |
| UI primitives | Base UI React |
| Testing | Vitest + Testing Library |
| Linting & formatting | Biome |
| State persistence | URL (JSON → lz-string compression → URI encode) |
| Currency | BRL only (integer cents) |

---

## 4. Getting Started

```bash
npm install
npm run dev       # start dev server
npm run test      # run tests
npm run test:cov  # run tests with coverage
npm run build     # type-check + production build
npm run lint      # lint with auto-fix
npm run format    # format with Biome
```

---

## 5. Architecture

The application state is structured as:

```
Global
├── version
└── groups[]
    ├── members[]
    ├── expenses[]
    └── settlements[]
```

Members are group-scoped — there is no global user registry.
Balances are computed dynamically — never stored.

---

## 6. State Management

No backend is used.

The entire state is:

```
JSON → compressed → URI encoded → stored in URL
```

Opening the link restores the exact application state.

---

## 7. Money Handling

All monetary values use integer cents.

Examples:
- `1` = R$ 0.01
- `100` = R$ 1.00

No floating point arithmetic is used anywhere in the system.

Percentages use basis points:
- `10000` = 100%
- `5000` = 50%
- `1` = 0.01%

---

## 8. URL Sharing

State is serialized using:

1. `JSON.stringify`
2. LZ-based compression
3. `encodeURIComponent`

Stored as `?state=...`

If invalid or missing state is detected on load, an error screen is shown.

---

## 9. Financial Invariants

The system guarantees:

- Sum of all member balances in a group = `0`
- No money is created or destroyed
- All balances are derived state — never stored

---

## 10. Future Roadmap

- Free payments (settlement between any two members without debt constraint)
- Debt simplification algorithm (suggested optimized payment paths)
- Soft delete for users (`deletedAt`)
- Migration system for version upgrades

---

## 11. Documentation

| File | Scope |
|---|---|
| [`APP_SPEC.md`](./APP_SPEC.md) | Tech stack, architecture, persistence strategy, roadmap |
| [`DOMAIN_SPEC.md`](./DOMAIN_SPEC.md) | Schemas, business rules, validation architecture, design decisions |
| [`TEST_SPEC.md`](./TEST_SPEC.md) | Testing conventions, mock strategies, coverage configuration |
