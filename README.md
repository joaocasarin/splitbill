# Splitbill

A fully client-side deterministic expense splitting application built with React and Vite.

No backend.  
No authentication.  
Fully shareable via URL.

---

## Table of Contents

1. [Overview](#1-overview)
2. [Features](#2-features)
3. [Architecture](#3-architecture)
4. [State Management](#4-state-management)
5. [Money Handling](#5-money-handling)
6. [URL Sharing](#6-url-sharing)
7. [Financial Invariants](#7-financial-invariants)
8. [Future Roadmap](#8-future-roadmap)
9. [Documentation](#9-documentation)

---

## 1. Overview

This application allows users to:

- Create users
- Create groups
- Add expenses
- Register settlements
- View dynamic balances
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
- Sidebar navigation with mobile drawer support

---

## 3. Architecture

The application state is structured as:

```
Global
├── version
├── users[]
└── groups[]
```

Users are global.  
Groups reference users by ID.  
Balances are computed dynamically — never stored.

---

## 4. State Management

No backend is used.

The entire state is:

```
JSON → compressed → URI encoded → stored in URL
```

Opening the link restores the exact application state.

---

## 5. Money Handling

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

## 6. URL Sharing

State is serialized using:

1. `JSON.stringify`
2. LZ-based compression
3. `encodeURIComponent`

Stored as `?state=...`

If invalid or missing state is detected on load, an error screen is shown.

---

## 7. Financial Invariants

The system guarantees:

- Sum of all member balances in a group = `0`
- No money is created or destroyed
- All balances are derived state — never stored

---

## 8. Future Roadmap

- Timestamps (`createdAt`, `updatedAt`) on all entities
- Soft delete for users (`deletedAt`)
- Debt simplification algorithm
- Editing expenses and settlements
- Migration system for version upgrades
- Free payments (settlement between any two members without debt constraint)
- Simplified debts toggle (suggested optimized payment paths)

## 9. Documentation

| File | Scope |
|---|---|
| [`APP_SPEC.md`](./APP_SPEC.md) | Tech stack, architecture, persistence strategy, roadmap |
| [`DOMAIN_SPEC.md`](./DOMAIN_SPEC.md) | Schemas, business rules, validation architecture, design decisions |
| [`TEST_SPEC.md`](./TEST_SPEC.md) | Testing conventions, mock strategies, coverage configuration |
