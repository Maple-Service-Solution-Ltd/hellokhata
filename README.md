<div align="center">

# 🏪 HelloKhata — SmartStore OS

### AI-First Retail Business Operating System for Bangladeshi SMEs

[![Live Demo](https://img.shields.io/badge/Live%20Demo-hellokhata.vercel.app-00C896?style=for-the-badge&logo=vercel)](https://hellokhata.vercel.app)
[![Next.js](https://img.shields.io/badge/Next.js-16-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![Prisma](https://img.shields.io/badge/Prisma-6-2D3748?style=for-the-badge&logo=prisma)](https://www.prisma.io/)
[![License](https://img.shields.io/badge/License-Proprietary-red?style=for-the-badge)](LICENSE)

**The first AI-powered, voice-enabled ERP designed for shop owners in Bangladesh — Bangla-first, offline-capable, and built for the modern SME.**

[🚀 Live Demo](https://hellokhata.vercel.app) · [📋 Feature Report](FEATURE_ANALYSIS_REPORT.md) · [📝 Changelog](CHANGELOG.md) · [🐛 Report Bug](https://github.com/Maple-Service-Solution-Ltd/hellokhata/issues)

</div>

---

## 📋 Table of Contents

- [Overview](#-overview)
- [Key Features](#-key-features)
- [Tech Stack](#-tech-stack)
- [Design System](#-design-system)
- [Architecture](#-architecture)
- [Project Structure](#-project-structure)
- [Getting Started](#-getting-started)
- [Environment Variables](#-environment-variables)
- [Database Setup](#-database-setup)
- [Scripts Reference](#-scripts-reference)
- [Feature Modules](#-feature-modules)
- [AI Safety & Boundaries](#-ai-safety--boundaries)
- [Pricing Tiers](#-pricing-tiers)
- [Keyboard Shortcuts](#-keyboard-shortcuts)
- [Contributing](#-contributing)
- [Roadmap](#-roadmap)
- [License](#-license)

---

## 🌟 Overview

**HelloKhata** (হ্যালো খাতা) is an AI-first Retail Business Operating System purpose-built for SME shop owners in Bangladesh. It combines traditional accounting and inventory management with a persistent AI Copilot — including full **voice AI support in both Bangla and English**.

The system runs in **demo mode out of the box** (no login required), making it ideal for investor demos and quick evaluations. It ships with preloaded customers, inventory, and 90 days of transaction history.

### Why HelloKhata?

- 🇧🇩 **Bangla-first** — UI, voice commands, and AI responses support Bengali natively
- 🤖 **AI is not an afterthought** — The AI Copilot is a persistent first-class UI element, not a hidden settings page
- 📊 **Business Health Score** — Like a credit score, but for your entire business
- 📵 **Offline-capable** — Queued mutations sync when connectivity is restored
- 🌿 **Free tier available** — Accessible to early-stage shops with clear upgrade paths

---

## ✨ Key Features

### 🤖 AI Copilot (Persistent Drawer)
A collapsible AI panel always visible on the right side of every page.

- **Brief Tab** — AI-generated daily summary with 3 prioritized action items and impact tags
- **Chat Tab** — Ask natural language questions about your business: sales trends, stock alerts, customer balances
- **Actions Tab** — One-click playbooks and quick actions suggested by the AI
- Toggle with `Ctrl+\`

### 🎙️ Voice AI
- Click the **mic icon** (top right) or press `Ctrl+M`
- Supports **Bangla and English** voice commands via Web Speech API
- Live transcription with animated waveform
- AI response cards with data tables and suggested next actions
- Example: *"কম স্টক আইটেম দেখাও"* or *"Show me today's sales"*

### 📊 Business Health Score
- **0–100 score** with letter grade (A–F)
- Breakdown across: Profit, Credit Control, Stock Health, Cash Flow, Sales Growth
- Actionable improvement playbooks with step-by-step guidance
- Dedicated Health Center page for deep-dive analysis

### 💳 Credit Control
- Aging buckets: **0–30 / 31–60 / 61–90 / 90+ days**
- Risk scoring per customer: Low / Medium / High
- Credit limit usage bars with real-time warnings during sale creation
- Collection call list sorted by risk priority

### 📦 Inventory Management
- Multi-tier pricing: **Retail, Wholesale, VIP, Minimum price floors**
- Customer tier auto-routing (Wholesale customer → Wholesale price automatically)
- Dead Stock Detector — items unsold for 30/60/90+ days with capital-stuck estimation
- Bulk CSV import with duplicate SKU detection and opening stock ledger entries
- All stock movements logged to `StockLedger` with full audit trail

### 💼 Sales & Purchases
- Fast-entry POS-style sale creation with AI margin meter and stock warnings in the side panel
- Auto-generated invoice numbers: `INV-YYYYMMDD-XXXX`
- Quotation system with conversion tracking to sales
- Multi-account payment support: Cash, Bank, Mobile Wallet (bKash / Nagad)
- Party ledger entries created automatically on every credit transaction

### 🏢 Multi-Branch Support
- Branch types: Main, Warehouse, Retail, Wholesale
- Stock transfers between branches with ledger tracking
- Branch-scoped accounts, sales, and purchases
- Branch limits enforced by subscription plan

### ⌨️ Command Palette
- Press `Ctrl+K` to open
- Fuzzy search across pages, customers, items, and reports
- Navigate anywhere or trigger actions without touching the mouse

### 🌐 Internationalization
- Bangla-first with English fallback
- Powered by `i18next` + `next-intl`

---

## 🛠 Tech Stack

| Layer | Technology | Version |
|---|---|---|
| **Framework** | Next.js (App Router) | ^16.1.6 |
| **Language** | TypeScript | 5.9.3 |
| **Styling** | Tailwind CSS | ^4 |
| **UI Components** | shadcn/ui + Radix UI | latest |
| **State Management** | Zustand (with persistence) | ^5.0.6 |
| **Server State / Data Fetching** | TanStack React Query | ^5.82.0 |
| **Data Tables** | TanStack React Table | ^8.21.3 |
| **ORM** | Prisma | ^6.11.1 |
| **Database** | SQLite (dev) / PostgreSQL (prod) | — |
| **Auth** | NextAuth.js | ^4.24.11 |
| **Animation** | Framer Motion | ^12.23.2 |
| **Charts** | Recharts | ^2.15.4 |
| **Forms** | React Hook Form + Zod | ^7 / ^4 |
| **Voice** | Web Speech API | Native Browser |
| **AI SDK** | z-ai-web-dev-sdk | ^0.0.16 |
| **i18n** | i18next + next-intl | ^25 / ^4 |
| **Drag & Drop** | dnd-kit | ^6 |
| **Runtime** | Bun | ^1.3+ |
| **Reverse Proxy** | Caddy | Caddyfile included |

---

## 🎨 Design System

HelloKhata uses a custom **Elite Dark Design System** — a premium, Stripe-inspired dark theme built for long business sessions.

### Color Palette

| Token | Name | Hex |
|---|---|---|
| `--bg` | Deep Midnight Navy | `#0E1117` |
| `--surface` | Graphite Dark | `#161B22` |
| `--card` | Elevated Card | `#1C2128` |
| `--primary` | Emerald Intelligence | `#00C896` |
| `--secondary` | Royal Indigo | `#5B5FEE` |
| `--warning` | Soft Amber | `#F5A524` |
| `--danger` | Muted Crimson | `#E5484D` |

### Typography

- **Primary Font**: Inter / Noto Sans Bengali
- **KPI Numbers**: 40px Bold
- **Section Titles**: 18px Semibold
- **Body Text**: 14–15px Regular

### Animation Principles

- Page transitions: Fade + lift at 200ms — no bounce or overshoot
- AI drawer: Smooth glide open/close
- KPI values: Count-up animation (800ms)
- Voice waveform: Pulse animation during recording

---

## 🏗 Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                     Browser / Client                            │
│   Next.js 16 App Router  ·  TanStack Query  ·  Zustand         │
│                                                                 │
│  ┌──────────────┐  ┌────────────────┐  ┌─────────────────────┐ │
│  │  AI Drawer   │  │ Command Palette │  │   Voice Modal       │ │
│  │ (Persistent) │  │    (Ctrl+K)    │  │   (Web Speech API)  │ │
│  └──────────────┘  └────────────────┘  └─────────────────────┘ │
└─────────────────────────────┬───────────────────────────────────┘
                              │ Next.js API Routes (App Router)
┌─────────────────────────────▼───────────────────────────────────┐
│                   Next.js Server (API Layer)                    │
│                                                                 │
│  ┌──────────────┐  ┌────────────────────┐  ┌────────────────┐  │
│  │  Auth Guard  │  │    AI Safety Layer  │  │ Branch Context │  │
│  │  (NextAuth)  │  │  Rate Limiter       │  │  Middleware     │  │
│  └──────────────┘  │  Circuit Breaker    │  └────────────────┘  │
│                    │  Confirmation Guard │                      │
│                    └────────────────────┘                       │
└──────────────────────────┬──────────────────────────────────────┘
                           │ Prisma ORM
┌──────────────────────────▼──────────────────────────────────────┐
│                 SQLite (dev) / PostgreSQL (prod)                 │
│  Sales · Purchases · Parties · Items · Accounts · AuditLog     │
│  StockLedger · PartyLedger · Quotations · Branches             │
└─────────────────────────────────────────────────────────────────┘
```

### Key Architectural Decisions

- **App Router only** — No Pages Router; all routes and APIs use `app/`
- **TanStack Query** owns all async server state — no `useEffect` data fetching patterns
- **Zustand** with localStorage persistence handles UI state, offline mutation queue, and demo data
- **Prisma transactions** ensure atomicity for all multi-step writes (sale → ledger → stock → account balance)
- **Branch context middleware** automatically scopes every DB query to the active branch
- **AI safety guards** (rate limiter + confirmation guard + circuit breaker) wrap every AI-initiated write

---

## 📁 Project Structure

```
hellokhata/
│
├── src/
│   ├── app/                            # Next.js App Router
│   │   ├── page.tsx                    # Dashboard — the AI Control Room
│   │   ├── layout.tsx                  # Root layout
│   │   ├── api/                        # API Route Handlers
│   │   │   ├── sales/route.ts          # Sales CRUD + ledger entries
│   │   │   ├── purchases/route.ts      # Purchases + stock updates
│   │   │   ├── payments/route.ts       # Payment processing
│   │   │   ├── items/
│   │   │   │   └── import/route.ts     # CSV bulk import
│   │   │   ├── inventory/
│   │   │   │   ├── adjustment/         # Stock adjustments
│   │   │   │   └── transfer/           # Branch-to-branch transfers
│   │   │   ├── accounts/route.ts       # Cash / Bank / Wallet accounts
│   │   │   ├── quotations/route.ts     # Quotation management
│   │   │   └── ai/                     # AI endpoint handlers
│   │   │
│   │   ├── sales/                      # Sales pages
│   │   ├── purchases/                  # Purchase pages
│   │   ├── inventory/                  # Inventory pages
│   │   ├── customers/                  # Party/customer pages
│   │   ├── reports/
│   │   │   ├── credit-aging/           # Aging bucket report
│   │   │   ├── credit-control/         # Credit control report
│   │   │   └── ...
│   │   └── settings/                   # Settings pages
│   │
│   ├── components/
│   │   ├── ai/
│   │   │   ├── AIDrawer.tsx            # Persistent AI panel (Brief/Chat/Actions)
│   │   │   └── VoiceModal.tsx          # Voice AI with waveform animation
│   │   ├── common/
│   │   │   ├── CommandPalette.tsx      # Ctrl+K fuzzy search
│   │   │   └── CreditControl.tsx       # Credit aging + risk badges
│   │   ├── dashboard/
│   │   │   └── DashboardPage.tsx       # KPI cards, Health Score, Action Dock
│   │   ├── inventory/
│   │   │   └── ImportItemsModal.tsx    # CSV import UI
│   │   ├── layout/
│   │   │   ├── Sidebar.tsx             # Navigation sidebar
│   │   │   └── Header.tsx              # Top bar with mic CTA
│   │   ├── settings/
│   │   │   ├── BranchManagementPage.tsx
│   │   │   ├── InvoiceSettingsPage.tsx
│   │   │   └── DataSettingsPage.tsx
│   │   └── ui/                         # shadcn/ui base components
│   │
│   ├── stores/                         # Zustand state stores
│   │   ├── demoStore.tsx               # Demo data (50 customers, 120 items)
│   │   ├── offlineQueueStore.ts        # Offline mutation queue
│   │   └── auditStore.ts               # Audit log state
│   │
│   ├── hooks/
│   │   └── queries/index.ts            # TanStack Query hooks
│   │
│   ├── lib/
│   │   ├── branch-context.ts           # Branch-scoped query utilities
│   │   ├── pricing/
│   │   │   └── plans.ts                # Free/Starter/Growth/Intelligence config
│   │   └── ai/
│   │       ├── guards/
│   │       │   └── confirmationGuard.ts  # Draft + confirm/cancel flow
│   │       ├── security/
│   │       │   └── rateLimiter.ts        # Token bucket rate limiting
│   │       └── tools/
│   │           └── toolExecutor.ts       # Circuit breaker + retry logic
│   │
│   └── types/
│       ├── index.ts                    # All TypeScript interfaces & types
│       └── ai-control.ts               # AI feature-specific types
│
├── prisma/
│   ├── schema.prisma                   # Full database schema
│   ├── seed.ts                         # Demo data seeder
│   └── migrations/                     # Migration history
│
├── public/
│   └── locales/
│       ├── bn/translation.json         # Bangla translations
│       └── en/translation.json         # English translations
│
├── db/                                 # SQLite database files (dev only)
├── download/                           # File download staging
├── upload/                             # File upload staging
├── mini-services/                      # Micro-utilities and helpers
├── examples/
│   └── websocket/                      # WebSocket usage examples
├── .zscripts/                          # Internal dev scripts
│
├── next.config.ts                      # Next.js configuration
├── tailwind.config.ts                  # Tailwind configuration
├── components.json                     # shadcn/ui configuration
├── Caddyfile                           # Caddy reverse proxy config (production)
├── .dockerignore
├── bun.lock
├── tsconfig.json
└── FEATURE_ANALYSIS_REPORT.md          # Detailed feature implementation status
```

---

## 🚀 Getting Started

### Prerequisites

| Tool | Minimum Version |
|---|---|
| [Bun](https://bun.sh) | 1.3+ |
| Git | any |

> **Note:** Bun is the preferred runtime. All scripts are written for `bun`. Node.js 20+ works as a fallback.

### 1. Clone the Repository

```bash
git clone https://github.com/Maple-Service-Solution-Ltd/hellokhata.git
cd hellokhata
```

### 2. Install Dependencies

```bash
bun install
```

### 3. Configure Environment Variables

```bash
cp .env.example .env.local
# Then fill in your values (see Environment Variables section below)
```

### 4. Set Up the Database

```bash
# Push the Prisma schema to the database
bun run db:push

# Generate the Prisma client
bun run db:generate

# Seed with demo data (50 customers, 120 items, 90 days of transactions)
bun run db:seed
```

### 5. Start Development Server

```bash
bun dev
```

Open [http://localhost:3000](http://localhost:3000). The app runs in **demo mode by default** — no login required.

### 6. Production Build

```bash
bun run build
bun run start
```

---

## 🔐 Environment Variables

Create `.env.local` in the project root:

```env
# ── Application ──────────────────────────────────────────
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your_nextauth_secret_here

# ── Database ─────────────────────────────────────────────
# Development (SQLite — zero setup)
DATABASE_URL="file:./db/dev.db"

# Production (PostgreSQL)
# DATABASE_URL="postgresql://user:password@host:5432/hellokhata"

# ── AI / LLM ─────────────────────────────────────────────
OPENAI_API_KEY=sk-...
```

> The app works fully in demo mode without `OPENAI_API_KEY` — AI features will use pre-generated mock responses.

---

## 🗄 Database Setup

HelloKhata uses **Prisma ORM** with SQLite for local development and PostgreSQL for production.

### Key Database Models

| Model | Purpose |
|---|---|
| `Party` | Customers & suppliers with credit limit and balance tracking |
| `Item` | Products with 4-tier pricing (retail, wholesale, VIP, minimum) |
| `Sale` / `SaleItem` | Sales transactions with line items |
| `Purchase` / `PurchaseItem` | Purchase transactions with line items |
| `Payment` | Payment records linked to parties and accounts |
| `Account` | Cash / Bank / Mobile Wallet accounts |
| `PartyLedger` | Double-entry ledger for every customer/supplier movement |
| `StockLedger` | Full stock movement history (sales, purchases, adjustments, transfers) |
| `Quotation` | Quotations with quote-to-sale conversion tracking |
| `Branch` | Multi-branch with manager assignment and cash tracking |
| `AuditLog` | Action audit trail with IP, user agent, old/new values |

---

## 📜 Scripts Reference

```bash
bun dev              # Start dev server → http://localhost:3000
bun run build        # Production build (copies static + standalone)
bun run start        # Start production server
bun run lint         # ESLint check across the project
bun run db:push      # Push Prisma schema to DB (no migration file)
bun run db:generate  # Regenerate Prisma client after schema changes
bun run db:migrate   # Create and apply migration (dev)
bun run db:reset     # ⚠️ Reset DB completely and re-seed
```

---

## 🧩 Feature Modules

| Module | Status | Notes |
|---|---|---|
| Sales & POS | ✅ Stable | Multi-tier pricing, auto ledger entries |
| Purchases | ✅ Stable | Stock updates, supplier ledger |
| Inventory | ✅ Stable | Stock ledger, CSV import, adjustments |
| Party / CRM | ✅ Stable | Credit tracking, aging buckets |
| Accounts (Cash/Bank/Wallet) | ✅ Stable | Multi-account, balance tracking |
| Multi-Branch | ✅ Stable | Stock transfer, branch-scoped queries |
| Quotations | ✅ Stable | Quote-to-sale conversion |
| AI Copilot | ✅ Stable | Brief, Chat, Actions tabs |
| Voice AI | ✅ Stable | Bangla + English, Web Speech API |
| Business Health Score | ✅ Stable | 5-component score with playbooks |
| Credit Control | ✅ Stable | Aging, risk scoring, collection list |
| Command Palette | ✅ Stable | Fuzzy search, `Ctrl+K` |
| PDF Invoice Export | 🚧 Planned | Library not yet integrated |
| Sales / Purchase Returns | 🚧 Planned | Return models not built yet |
| Soft Delete / Undo | 🚧 Planned | Hard delete currently used |
| SMS / WhatsApp Reminders | 🚧 Planned | No SMS integration yet |
| Offline Service Worker | 🚧 Partial | Zustand queue ready, SW pending |

See [FEATURE_ANALYSIS_REPORT.md](FEATURE_ANALYSIS_REPORT.md) for the full implementation breakdown with severity ratings across 12 feature areas.

---

## 🛡 AI Safety & Boundaries

The AI layer is hardened with multiple safety mechanisms to prevent accidental writes and abuse.

### Confirmation Guard (`src/lib/ai/guards/confirmationGuard.ts`)
- Every AI write action generates a **draft hash** before execution
- The user must confirm with a recognized word (Bangla or English) before the action runs
- Drafts expire after **5 minutes** via TTL
- Cross-business security check prevents execution in the wrong business context

### Rate Limiter — Token Bucket (`src/lib/ai/security/rateLimiter.ts`)

| Operation | Limit |
|---|---|
| AI Chat | 20 requests / minute |
| Write Operations | 10 / minute |
| LLM Generation | 30 / minute |

### Circuit Breaker — Tool Executor (`src/lib/ai/tools/toolExecutor.ts`)
- Automatic retry with **exponential backoff**
- Per-tool timeout handling
- Circuit opens after repeated failures to prevent cascade failures
- Supports atomic Prisma transactions for grouped AI write operations

### Plan-Based AI Limits

| Plan | AI Chats / Day |
|---|---|
| Free | 3 |
| Starter | 15 |
| Growth | 50 |
| Intelligence | Unlimited |

---

## 💰 Pricing Tiers

| Feature | Free | Starter | Growth | Intelligence |
|---|---|---|---|---|
| Branches | 1 | 1 | 3 | Unlimited |
| AI Chats / Day | 3 | 15 | 50 | Unlimited |
| Users | 1 | 3 | 10 | Unlimited |
| Reports | Basic | Standard | Advanced | Full |
| Voice AI | ❌ | ✅ | ✅ | ✅ |
| Multi-Branch Stock | ❌ | ❌ | ✅ | ✅ |

---

## ⌨️ Keyboard Shortcuts

| Shortcut | Action |
|---|---|
| `Ctrl+K` | Open Command Palette |
| `Ctrl+M` | Open Voice AI |
| `Ctrl+\` | Toggle AI Drawer |
| `Esc` | Close modals / palette |
| `↑` / `↓` | Navigate Command Palette items |
| `Enter` | Select in Command Palette |

---

## 🤝 Contributing

We welcome contributions! Please follow these guidelines to keep the codebase consistent.

### Branch Naming

| Type | Pattern | Example |
|---|---|---|
| Feature | `feat/short-description` | `feat/pdf-invoice-export` |
| Bug Fix | `fix/short-description` | `fix/credit-aging-calc` |
| Docs | `docs/short-description` | `docs/update-env-reference` |
| Refactor | `refactor/short-description` | `refactor/ai-drawer-state` |

### Workflow

1. Fork the repo and create your branch from `main`
2. Write your code following the conventions below
3. Run `bun run lint` and fix all warnings
4. Open a Pull Request with a clear title and description linking the related issue

### Code Conventions

- All code is **TypeScript** — avoid `any` without an inline comment explaining why
- Use **TanStack Query** for all data fetching — no raw `useEffect + fetch` patterns
- All client state lives in **Zustand stores** — not `useState` for server-derived data
- Every write that touches multiple Prisma models must use a **Prisma transaction**
- All AI write operations must pass through `confirmationGuard` and `rateLimiter`
- New Bangla UI strings must have matching entries in `public/locales/bn/translation.json`

### Commit Message Format

Follow [Conventional Commits](https://www.conventionalcommits.org/):

```
feat: add PDF invoice generation with Bangla support
fix: correct credit aging bucket 90+ day calculation
docs: add environment variable reference to README
refactor: extract voice modal into standalone component
chore: update Prisma to 6.12.0
```

### Pull Request Checklist

- [ ] No TypeScript errors (`tsc --noEmit`)
- [ ] Linting passes (`bun run lint`)
- [ ] Prisma transactions used for all multi-step writes
- [ ] New Bangla strings added to `bn/translation.json`
- [ ] PR description explains **what** changed and **why**
- [ ] Related issue linked in the PR body

---

## 🗺 Roadmap

### In Progress
- [ ] PDF invoice generation (A4 / A5, Bengali + English templates)
- [ ] Sales Return & Purchase Return models with reversal logic
- [ ] Service Worker for true offline-first background sync

### Planned
- [ ] Soft delete + Undo across all models (add `deletedAt` to schema)
- [ ] RBAC middleware — permission enforcement on all API routes
- [ ] SMS / WhatsApp payment reminders (bKash-integrated)
- [ ] Unit conversion system (box → pieces, kg → grams)
- [ ] Batch / expiry date tracking for pharmacies & food shops
- [ ] Cash drawer open/close session tracking
- [ ] In-app support chat / help center
- [ ] Excel (XLSX) import support alongside CSV
- [ ] Account transfer between Cash / Bank / Wallet with reconciliation

---

## 📄 License

Proprietary — © Maple Service Solution Ltd. All rights reserved.

---

<div align="center">

Built with ❤️ in Bangladesh by [Maple Service Solution Ltd.](https://github.com/Maple-Service-Solution-Ltd)

**হ্যালো খাতা** — আপনার ব্যবসার AI সঙ্গী

</div>
