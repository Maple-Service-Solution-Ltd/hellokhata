<div align="center">

# 🏪 HelloKhata — SmartStore OS

### AI-First Retail Business Operating System for Bangladeshi SMEs

[![Live Demo](https://img.shields.io/badge/Live%20Demo-hellokhata.vercel.app-00C896?style=for-the-badge&logo=vercel)](https://hellokhata.vercel.app)
[![Next.js](https://img.shields.io/badge/Next.js-16-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
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
- [Data Fetching Layer](#-data-fetching-layer)
- [Getting Started](#-getting-started)
- [Environment Variables](#-environment-variables)
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

> **Frontend-only architecture:** This Next.js application is a pure frontend client. All business logic, data persistence, and authentication are handled by a **separate backend server**. The frontend communicates with the backend exclusively via HTTP API calls managed through TanStack Query.

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
- Bulk CSV import with duplicate SKU detection
- All stock movements tracked via the backend with full audit trail

### 💼 Sales & Purchases
- Fast-entry POS-style sale creation with AI margin meter and stock warnings in the side panel
- Auto-generated invoice numbers: `INV-YYYYMMDD-XXXX`
- Quotation system with conversion tracking to sales
- Multi-account payment support: Cash, Bank, Mobile Wallet (bKash / Nagad)
- Party ledger entries created on the backend automatically on every credit transaction

### 🏢 Multi-Branch Support
- Branch types: Main, Warehouse, Retail, Wholesale
- Stock transfers between branches with backend ledger tracking
- Branch-scoped data fetched from the backend per active branch
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
| **Auth** | NextAuth.js | ^4.24.11 |
| **Animation** | Framer Motion | ^12.23.2 |
| **Charts** | Recharts | ^2.15.4 |
| **Forms** | React Hook Form + Zod | ^7 / ^4 |
| **Voice** | Web Speech API | Native Browser |
| **AI SDK** | z-ai-web-dev-sdk | ^0.0.16 |
| **i18n** | i18next + next-intl | ^25 / ^4 |
| **Drag & Drop** | dnd-kit | ^6 |
| **Package Manager** | npm | ^10+ |
| **Runtime** | Node.js | 20+ |
| **Reverse Proxy** | Caddy | Caddyfile included |

> **Backend:** All server-side business logic, database operations, authentication, and ledger management are handled by a **separate backend server** (not part of this repository). Configure the backend URL via the `NEXT_PUBLIC_API_URL` environment variable.

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

This is a **frontend-only Next.js application**. It does not contain any backend logic, database connections, or server-side data processing. All data is fetched from and sent to a remote backend server via REST API.

```
┌─────────────────────────────────────────────────────────────────┐
│                     Browser / Client                            │
│   Next.js 16 App Router  ·  TanStack Query  ·  Zustand         │
│                                                                 │
│  ┌──────────────┐  ┌────────────────┐  ┌─────────────────────┐ │
│  │  AI Drawer   │  │ Command Palette │  │   Voice Modal       │ │
│  │ (Persistent) │  │    (Ctrl+K)    │  │   (Web Speech API)  │ │
│  └──────────────┘  └────────────────┘  └─────────────────────┘ │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │             Data Fetching Layer                         │    │
│  │  /services      — raw API query functions (axios)       │    │
│  │  /hooks/api     — TanStack Query hooks (useQuery,       │    │
│  │                   useMutation) wrapping /services       │    │
│  └──────────────────────────┬──────────────────────────────┘    │
└─────────────────────────────┼───────────────────────────────────┘
                              │ HTTP REST (NEXT_PUBLIC_API_URL)
┌─────────────────────────────▼───────────────────────────────────┐
│                  External Backend Server                        │
│          (Separate repository / deployment)                     │
│                                                                 │
│  Business Logic · Database · Auth · Ledger · AI Processing     │
│  Sales · Purchases · Inventory · Parties · Reports · Branches  │
└─────────────────────────────────────────────────────────────────┘
```

### Key Architectural Decisions

- **Frontend-only** — No backend code lives in this repo; all API calls go to `NEXT_PUBLIC_API_URL`
- **App Router only** — All pages use `app/` directory; no Pages Router
- **`/services`** holds all raw async functions that call the backend API (using axios)
- **`/hooks/api`** wraps those service functions in TanStack Query hooks (`useQuery`, `useMutation`, `useInfiniteQuery`)
- **TanStack Query** owns all server state — caching, background refetch, optimistic updates, and error handling
- **Zustand** with localStorage persistence handles UI state, offline mutation queue, and demo data
- **AI safety guards** (rate limiter + confirmation guard + circuit breaker) run client-side before any AI-triggered API call

---

## 📁 Project Structure

```
hellokhata/
│
├── src/
│   ├── app/                            # Next.js App Router (pages only)
│   │   ├── page.tsx                    # Dashboard — the AI Control Room
│   │   ├── layout.tsx                  # Root layout
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
│   ├── services/                       # ⭐ API Query Functions
│   │   │                               # Raw async functions that call the
│   │   │                               # backend REST API (via axios).
│   │   │                               # No TanStack Query logic here —
│   │   │                               # only plain async data fetchers.
│   │   ├── sales.service.ts            # getSales(), createSale(), etc.
│   │   ├── purchases.service.ts        # getPurchases(), createPurchase(), etc.
│   │   ├── inventory.service.ts        # getItems(), adjustStock(), etc.
│   │   ├── parties.service.ts          # getParties(), getPartyLedger(), etc.
│   │   ├── payments.service.ts         # getPayments(), createPayment(), etc.
│   │   ├── accounts.service.ts         # getAccounts(), createAccount(), etc.
│   │   ├── quotations.service.ts       # getQuotations(), convertToSale(), etc.
│   │   ├── branches.service.ts         # getBranches(), transferStock(), etc.
│   │   ├── reports.service.ts          # getCreditAging(), getHealthScore(), etc.
│   │   └── ai.service.ts               # sendAIChat(), triggerAIAction(), etc.
│   │
│   ├── hooks/
│   │   └── api/                        # ⭐ TanStack Query Hooks
│   │       │                           # Wraps /services functions with
│   │       │                           # useQuery / useMutation / useInfiniteQuery.
│   │       │                           # Components import ONLY from here —
│   │       │                           # never from /services directly.
│   │       ├── useSales.ts             # useSalesQuery(), useCreateSaleMutation()
│   │       ├── usePurchases.ts         # usePurchasesQuery(), useCreatePurchaseMutation()
│   │       ├── useInventory.ts         # useItemsQuery(), useStockAdjustMutation()
│   │       ├── useParties.ts           # usePartiesQuery(), usePartyLedgerQuery()
│   │       ├── usePayments.ts          # usePaymentsQuery(), useCreatePaymentMutation()
│   │       ├── useAccounts.ts          # useAccountsQuery(), useCreateAccountMutation()
│   │       ├── useQuotations.ts        # useQuotationsQuery(), useConvertToSaleMutation()
│   │       ├── useBranches.ts          # useBranchesQuery(), useStockTransferMutation()
│   │       ├── useReports.ts           # useCreditAgingQuery(), useHealthScoreQuery()
│   │       └── useAI.ts               # useAIChatMutation(), useAIActionsQuery()
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
│   ├── lib/
│   │   ├── axios.ts                    # Axios instance with base URL + auth headers
│   │   ├── branch-context.ts           # Active branch context utilities
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
├── public/
│   └── locales/
│       ├── bn/translation.json         # Bangla translations
│       └── en/translation.json         # English translations
│
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
├── package.json
├── tsconfig.json
└── FEATURE_ANALYSIS_REPORT.md          # Detailed feature implementation status
```

---

## 🔌 Data Fetching Layer

This project uses a **two-layer data fetching architecture** to keep API logic, caching, and component code cleanly separated.

### Layer 1 — `/services` (Raw Query Functions)

The `src/services/` directory contains plain async functions that talk directly to the backend REST API using **axios**. These functions have no awareness of React or TanStack Query — they are simple, testable, typed async functions.

```ts
// src/services/sales.service.ts
import { apiClient } from '@/lib/axios';
import type { Sale, CreateSalePayload, PaginatedResponse } from '@/types';

export const getSales = async (params?: {
  page?: number;
  branchId?: string;
  dateFrom?: string;
  dateTo?: string;
}): Promise<PaginatedResponse<Sale>> => {
  const { data } = await apiClient.get('/sales', { params });
  return data;
};

export const createSale = async (payload: CreateSalePayload): Promise<Sale> => {
  const { data } = await apiClient.post('/sales', payload);
  return data;
};

export const getSaleById = async (id: string): Promise<Sale> => {
  const { data } = await apiClient.get(`/sales/${id}`);
  return data;
};
```

```ts
// src/lib/axios.ts
import axios from 'axios';

export const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
});

// Attach auth token on every request
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('auth_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});
```

### Layer 2 — `/hooks/api` (TanStack Query Hooks)

The `src/hooks/api/` directory wraps service functions with **TanStack Query** (`useQuery`, `useMutation`, `useInfiniteQuery`). This is the only layer components interact with — they never import from `/services` directly.

```ts
// src/hooks/api/useSales.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getSales, createSale, getSaleById } from '@/services/sales.service';
import type { CreateSalePayload } from '@/types';

// Query keys — centralized for consistent cache invalidation
export const salesKeys = {
  all: ['sales'] as const,
  list: (params?: object) => [...salesKeys.all, 'list', params] as const,
  detail: (id: string) => [...salesKeys.all, 'detail', id] as const,
};

// Fetch paginated sales list
export const useSalesQuery = (params?: {
  page?: number;
  branchId?: string;
  dateFrom?: string;
  dateTo?: string;
}) => {
  return useQuery({
    queryKey: salesKeys.list(params),
    queryFn: () => getSales(params),
  });
};

// Fetch single sale by ID
export const useSaleDetailQuery = (id: string) => {
  return useQuery({
    queryKey: salesKeys.detail(id),
    queryFn: () => getSaleById(id),
    enabled: !!id,
  });
};

// Create a new sale — invalidates the sales list cache on success
export const useCreateSaleMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateSalePayload) => createSale(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: salesKeys.all });
    },
  });
};
```

**Using the hook in a component:**

```tsx
// src/components/sales/SalesList.tsx
import { useSalesQuery } from '@/hooks/api/useSales';

export function SalesList() {
  const { data, isLoading, isError } = useSalesQuery({ page: 1 });

  if (isLoading) return <Spinner />;
  if (isError) return <ErrorMessage />;

  return (
    <ul>
      {data?.items.map((sale) => (
        <li key={sale.id}>{sale.invoiceNumber}</li>
      ))}
    </ul>
  );
}
```

### Convention Rules

- ✅ Components import **only** from `src/hooks/api/`
- ✅ `src/hooks/api/` imports **only** from `src/services/`
- ✅ `src/services/` imports **only** from `src/lib/axios` and `src/types/`
- ❌ Components must **never** import directly from `src/services/`
- ❌ `src/services/` must **never** contain `useQuery`, `useMutation`, or any React hooks

---

## 🚀 Getting Started

### Prerequisites

| Tool | Minimum Version |
|---|---|
| [Node.js](https://nodejs.org) | 20.x |
| [npm](https://npmjs.com) | 10+ |
| Git | any |

### 1. Clone the Repository

```bash
git clone https://github.com/Maple-Service-Solution-Ltd/hellokhata.git
cd hellokhata
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Environment Variables

```bash
cp .env.example .env.local
# Fill in your values — see Environment Variables section below
```

### 4. Start Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). The app runs in **demo mode by default** — no login required, no backend needed for the UI shell.

### 5. Production Build

```bash
npm run build
npm run start
```

---

## 🔐 Environment Variables

Create `.env.local` in the project root:

```env
# ── Application ──────────────────────────────────────────
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your_nextauth_secret_here

# ── Backend API ───────────────────────────────────────────
# URL of the external backend server — all data fetching points here
NEXT_PUBLIC_API_URL=https://your-backend-server.com/api

# ── AI / LLM ─────────────────────────────────────────────
# Required for AI Copilot features
OPENAI_API_KEY=sk-...
```

> All business data (sales, inventory, customers, reports) is served by the backend at `NEXT_PUBLIC_API_URL`. The app works in demo mode without a live backend — AI features require `OPENAI_API_KEY`.

---

## 📜 Scripts Reference

```bash
npm run dev        # Start dev server → http://localhost:3000
npm run build      # Production build
npm run start      # Start production server
npm run lint       # ESLint check across the project
```

---

## 🧩 Feature Modules

| Module | Status | Notes |
|---|---|---|
| Sales & POS | ✅ Stable | Multi-tier pricing, backend ledger entries |
| Purchases | ✅ Stable | Stock updates via backend |
| Inventory | ✅ Stable | CSV import, stock adjustments |
| Party / CRM | ✅ Stable | Credit tracking, aging buckets |
| Accounts (Cash/Bank/Wallet) | ✅ Stable | Multi-account, balance from backend |
| Multi-Branch | ✅ Stable | Stock transfer, branch-scoped API calls |
| Quotations | ✅ Stable | Quote-to-sale conversion |
| AI Copilot | ✅ Stable | Brief, Chat, Actions tabs |
| Voice AI | ✅ Stable | Bangla + English, Web Speech API |
| Business Health Score | ✅ Stable | 5-component score with playbooks |
| Credit Control | ✅ Stable | Aging, risk scoring, collection list |
| Command Palette | ✅ Stable | Fuzzy search, `Ctrl+K` |
| PDF Invoice Export | 🚧 Planned | Not yet implemented |
| Sales / Purchase Returns | 🚧 Planned | Pending backend support |
| Soft Delete / Undo | 🚧 Planned | Pending backend support |
| SMS / WhatsApp Reminders | 🚧 Planned | No integration yet |
| Offline Service Worker | 🚧 Partial | Zustand queue ready, SW pending |

See [FEATURE_ANALYSIS_REPORT.md](FEATURE_ANALYSIS_REPORT.md) for the full implementation breakdown with severity ratings across 12 feature areas.

---

## 🛡 AI Safety & Boundaries

The AI layer is hardened with multiple client-side safety mechanisms before any request is sent to the backend.

### Confirmation Guard (`src/lib/ai/guards/confirmationGuard.ts`)
- Every AI write action generates a **draft hash** before execution
- The user must confirm with a recognized word (Bangla or English) before the action fires
- Drafts expire after **5 minutes** via TTL
- Cross-business security check prevents execution in the wrong context

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
3. Run `npm run lint` and fix all warnings
4. Open a Pull Request with a clear title and description linking the related issue

### Code Conventions

- All code is **TypeScript** — avoid `any` without an inline comment explaining why
- **Always add new query functions to `/services`** and wrap them in a hook inside `/hooks/api` — never fetch directly inside components
- Components must **never** import from `src/services/` directly — always use `src/hooks/api/`
- Use **TanStack Query** for all server state — no `useEffect + fetch` patterns anywhere
- All client state lives in **Zustand stores** — not `useState` for server-derived data
- All AI write operations must pass through `confirmationGuard` and `rateLimiter` before hitting the API
- New Bangla UI strings must have matching entries in `public/locales/bn/translation.json`

### Commit Message Format

Follow [Conventional Commits](https://www.conventionalcommits.org/):

```
feat: add PDF invoice generation with Bangla support
fix: correct credit aging bucket 90+ day calculation
docs: add data fetching layer explanation to README
refactor: extract voice modal into standalone component
chore: update TanStack Query to 5.83
```

### Pull Request Checklist

- [ ] No TypeScript errors (`tsc --noEmit`)
- [ ] Linting passes (`npm run lint`)
- [ ] New API calls added to `/services`, wrapped in `/hooks/api`
- [ ] Components only import from `hooks/api`, not from `services` directly
- [ ] New Bangla strings added to `bn/translation.json`
- [ ] PR description explains **what** changed and **why**
- [ ] Related issue linked in the PR body

---

## 🗺 Roadmap

### In Progress
- [ ] PDF invoice generation (A4 / A5, Bengali + English templates)
- [ ] Sales Return & Purchase Return UI (pending backend endpoints)
- [ ] Service Worker for true offline-first background sync

### Planned
- [ ] Soft delete + Undo (pending backend support)
- [ ] SMS / WhatsApp payment reminders (bKash-integrated)
- [ ] Unit conversion system (box → pieces, kg → grams)
- [ ] Batch / expiry date tracking for pharmacies & food shops
- [ ] Cash drawer open/close session tracking
- [ ] In-app support chat / help center
- [ ] Excel (XLSX) import support alongside CSV
- [ ] Account transfer UI between Cash / Bank / Wallet

---

## 📄 License

Proprietary — © Maple Service Solution Ltd. All rights reserved.

---

<div align="center">

Built with ❤️ in Bangladesh by [Maple Service Solution Ltd.](https://github.com/Maple-Service-Solution-Ltd)

**হ্যালো খাতা** — আপনার ব্যবসার AI সঙ্গী

</div>
