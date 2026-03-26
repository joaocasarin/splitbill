<div align="center">
  <!-- TODO: Replace with your actual logo URL -->
  <img src="https://via.placeholder.com/120/000000/FFFFFF/?text=Logo" alt="SplitBill Logo" width="120" />
  
  <h1>SplitBill</h1>
  <p><strong>Split the bill, not the friendship.</strong></p>
  <br />
  <p>A serverless, URL-driven application for conveniently dividing group expenses.</p>

  <!-- Badges -->
  <p>
    <a href="https://github.com/joaocasarin/splitbill/actions"><img src="https://img.shields.io/github/actions/workflow/status/joaocasarin/splitbill/ci.yml?style=flat-square&logo=github&label=CI/CD" alt="CI/CD Status" /></a>
    <a href="https://splitbill.casarin.dev"><img src="https://img.shields.io/badge/Deploy-Cloudflare_Pages-F38020?style=flat-square&logo=cloudflare" alt="Cloudflare Pages Deploy" /></a>
    <img src="https://img.shields.io/badge/Coverage-100%25-brightgreen.svg?style=flat-square" alt="Test Coverage" />
    <a href="./LICENSE"><img src="https://img.shields.io/badge/License-Apache_2.0-blue.svg?style=flat-square" alt="License" /></a>
    <a href="https://www.typescriptlang.org/"><img src="https://img.shields.io/badge/TypeScript-007ACC?style=flat-square&logo=typescript&logoColor=white" alt="TypeScript" /></a>
  </p>

  <br />

  <!-- TODO: Replace with your actual project screenshot URL -->
  <img src="https://via.placeholder.com/800x400/000000/FFFFFF/?text=SplitBill+Dashboard+Preview" alt="SplitBill Dashboard Preview" width="800" style="border-radius: 8px;" />
  
  <br />
</div>

<br />

## Overview
SplitBill completely removes the need for a backend or database. It stores the entire state of your group—members, expenses, and settlements—directly in the browser's URL.

## Concept
Any information entered into the application (like adding a member or recording a new expense) is instantly synchronized back to the URL. The data is efficiently compressed using `lz-string` (base64) to ensure it remains within standard URL length limits. This means sharing your group's exact state is as simple as copying and pasting the link to your friends.

## Features
- **Groups**: Create groups starting with just 2 people (and up to 20).
- **Members**: Add or remove participants according to specific group rules.
- **Expenses**: Create shared expenses that can be divided equally, by exact amounts, or by custom percentages. Interestingly, the person who paid the expense doesn't even have to be a participant in the split!
- **Settlements**: Quickly settle debts. Anyone can record a settlement from one person to another (as long as they aren't settling with themselves).
- **Transparency**: Every action (expense or settlement) is ordered chronologically by date and can be freely edited or removed.

## UI Layout
The user interface is designed to be minimal and responsive:
- **Home Screen**: A simple dashboard for users without an active group.
- **Group Screen**: The main interaction area where expenses, balances, and settlements for a specific group are managed.
- **Sidebar**: A navigation menu (accessible via a hamburger icon on mobile devices) that lists your groups and provides an option to create new ones.
- **Header & Footer**: The header displays the project title, while the footer contains copyright information and a link to the GitHub repository.
- **Error Screen**: A fallback UI displayed if the URL state becomes invalid or corrupted.

## Roadmap

### Implemented
- [x] Expense splitting — equal, fixed amount, or percentage ([#35](https://github.com/joaocasarin/splitbill/pull/35), [#36](https://github.com/joaocasarin/splitbill/pull/36))
- [x] Timestamps on all expenses and settlements ([#41](https://github.com/joaocasarin/splitbill/pull/41))
- [x] Per-group member management — add or remove members with balance and minimum-member guards ([#47](https://github.com/joaocasarin/splitbill/pull/47))
- [x] Free-form settlements — any member, any amount, no debt constraint required ([#48](https://github.com/joaocasarin/splitbill/pull/48))
- [x] Debt simplification — greedy algorithm to minimize settlement transactions, with a toggle to switch views per member card

### Upcoming
- [ ] Soft delete for members — preserve expense/settlement history when removing settled-out participants
- [ ] Multi-currency support with live exchange rate snapshots
- [ ] Receipt scanning (OCR, fully client-side)
- [ ] Data export & import (JSON, CSV, PDF)
- [ ] Backend integration (v2) — cross-device sync and authentication

## Documentation Reference
We have split the documentation into distinct parts so any new user or contributor can easily understand and extend the project:
- [Domain Logic](docs/DOMAIN.md)
- [State Management](docs/STATE.md)
- [Architecture & Infrastructure](docs/ARCHITECTURE.md)
- [Testing Practices](docs/TESTING.md)
- [Contributing](docs/CONTRIBUTING.md)
