# SmartStore OS - AI Control Room

## Overview

SmartStore OS is an **AI-first Retail Business Operating System** designed for SME shop owners in Bangladesh. It features an integrated AI Copilot with voice AI capabilities, making it the first of its kind in the market.

### Key USPs

1. **AI Copilot** - Persistent AI drawer across all pages with Brief, Chat, and Actions tabs
2. **Voice AI** - Mic button always visible, supports Bangla and English voice commands
3. **Business Health Score** - 0-100 score with actionable improvement playbooks
4. **Credit Control** - Aging buckets, risk scoring, and collection management
5. **Command Palette** - Ctrl+K for instant navigation and actions

## Tech Stack

- **Framework**: Next.js 16 (App Router) + TypeScript
- **Styling**: Tailwind CSS + Custom Elite Design System
- **State**: Zustand with persistence
- **Data Fetching**: React Query
- **Charts**: Recharts
- **Animation**: Framer Motion
- **i18n**: Bangla-first with English fallback
- **Voice**: Web Speech API

## Design System

### Elite Palette (Dark Theme Default)

| Token | Color | Hex |
|-------|-------|-----|
| Background | Deep Midnight Navy | #0E1117 |
| Surface | Graphite Dark | #161B22 |
| Card | Elevated | #1C2128 |
| Primary | Emerald Intelligence | #00C896 |
| Secondary | Royal Indigo | #5B5FEE |
| Warning | Soft Amber | #F5A524 |
| Danger | Muted Crimson | #E5484D |

### Typography

- Primary: Inter / Noto Sans Bengali
- KPI Numbers: 40px bold
- Section Titles: 18px semibold
- Body: 14-15px

### Animation Choreography

- Page transition: Fade + lift (200ms)
- AI drawer: Smooth glide
- KPI count-up: 800ms smooth
- Voice waveform: Pulse animation
- No bounce/overshoot

## Getting Started

```bash
# Install dependencies
bun install

# Run development server
bun dev

# Build for production
bun run build
```

Open [http://localhost:3000](http://localhost:3000) to see the app.

## Features

### 1. Demo Workspace
- No login required
- 50 preloaded customers
- 120 items with stock data
- 90 days of transactions
- AI insights enabled
- "Reset Demo" button to restart

### 2. Persistent AI Drawer
- Always visible on right side (collapsible with Ctrl+\)
- **Brief Tab**: Daily AI summary with 3 prioritized items
- **Chat Tab**: Ask anything about your business
- **Actions Tab**: Quick actions and playbooks

### 3. Voice AI
- Click the mic icon (top right) or press Ctrl+M
- Supports Bangla and English
- Live transcription with waveform animation
- AI responses with data tables and suggested actions

### 4. Business Health Score
- 0-100 score with grade (A-F)
- Component breakdown: Profit, Credit, Stock, Cash Flow, Sales Growth
- Actionable suggestions for improvement
- Health Center page with playbooks

### 5. Credit Control
- Aging buckets (0-30, 31-60, 61-90, 90+ days)
- Risk scoring (High/Medium/Low)
- Credit limit usage bars
- Collection call list

### 6. Dead Stock Detector
- Items unsold for 30/60/90+ days
- Capital stuck estimation
- Suggested markdown actions

### 7. Command Palette
- Press Ctrl+K or click search bar
- Navigate pages, perform actions
- Search customers, items, reports
- Fuzzy search support

### 8. Feature Gating
- Free, Business, Pro, AI tiers
- Blurred locked cards
- Upgrade CTAs

## Information Architecture

### Sidebar
- Overview
- Sales
- Customers
- Inventory
- Reports
- AI Copilot
- Branches (Pro)
- Settings

### Top Bar
- Branch selector
- Global search (Ctrl+K)
- Health score badge
- Voice mic (primary CTA)
- Notifications
- Profile

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| Ctrl+K | Open Command Palette |
| Ctrl+M | Open Voice AI |
| Ctrl+\ | Toggle AI Drawer |
| Esc | Close modals |
| ↑↓ | Navigate in palette |
| Enter | Select in palette |

---

## Investor Demo Script (5-Minute Flow)

### Opening (30 seconds)
> "Let me show you SmartStore OS - the first AI-powered retail OS for Bangladeshi SMEs. Notice the dark premium design - we're targeting the modern business owner who wants Stripe-level quality."

**Action**: Show dashboard with AI drawer open

### AI Copilot Demo (90 seconds)
> "The AI Copilot is always present - on the right side. Let's start with the Daily Brief."

**Action**: Point to Brief tab
- Show 3 prioritized items with Impact tags
- Click "Explain" on one item to show AI transparency

> "Now let's ask the AI a question."

**Action**: Switch to Chat tab
- Type: "What's my profit trend this week?"
- Show AI response with data table

> "Or just use your voice."

**Action**: Click mic icon
- Say: "Show me low stock items"
- Show voice modal with waveform animation
- Show AI response

### Business Health Score (60 seconds)
> "Every business gets a Health Score - like a credit score for your business."

**Action**: Point to health score on dashboard
- Show the circular progress ring
- Expand to show component scores
- Click "Improve Score" to show playbooks page

> "We tell them exactly what to do to improve."

### Sales Flow (60 seconds)
> "Let me show you how fast a sale is."

**Action**: Click "New Sale" in Action Dock
- Show minimal, focused UI
- Point out AI panel on right (margin meter, stock warnings)
- Simulate adding items

> "Notice how the AI warns about credit limits in real-time."

### Credit Control (45 seconds)
> "Speaking of credit - here's our Credit Control center."

**Action**: Navigate to Credit Control page
- Show aging buckets
- Show risk badges
- Show credit usage bars

> "We help them collect money faster, reducing bad debt."

### Voice AI Deep Dive (30 seconds)
> "The Voice AI is our USP. Let me show you again."

**Action**: Open Voice Modal
- Show waveform animation
- Demonstrate Bangla voice command
- Show result card with action buttons

### Closing (45 seconds)
> "To summarize:
> 1. AI is first-class, not an afterthought
> 2. Voice AI for mass-market adoption
> 3. Health Score for business intelligence
> 4. Credit Control for cash flow
> 5. Command Palette for power users
>
> This is what modern SME software looks like in 2025."

**Action**: Show Command Palette (Ctrl+K)
- Type "profit" to show fuzzy search
- Navigate to reports
- Show AI summary on report page

---

## Development Notes

### File Structure
```
src/
├── app/                    # Next.js App Router pages
│   ├── page.tsx           # Dashboard (AI Control Room)
│   ├── reports/           # Report pages
│   └── ...
├── components/
│   ├── ai/               # AI components (Drawer, Voice Modal)
│   ├── common/           # Shared components (Command Palette)
│   ├── dashboard/        # Dashboard components
│   ├── layout/           # App layout, Sidebar, Header
│   └── ui/               # Base UI components (premium.tsx)
├── stores/               # Zustand stores
│   ├── demoStore.tsx     # Demo data management
│   └── ...
├── types/                # TypeScript definitions
│   └── ai-control.ts     # AI feature types
└── hooks/                # React hooks
```

### Key Components

1. **AIDrawer** (`src/components/ai/AIDrawer.tsx`)
   - Persistent right-side panel
   - Tabs: Brief, Chat, Actions
   - Collapsible

2. **VoiceModal** (`src/components/ai/VoiceModal.tsx`)
   - Web Speech API integration
   - Waveform animation
   - Result cards

3. **CommandPalette** (`src/components/common/CommandPalette.tsx`)
   - Ctrl+K activation
   - Fuzzy search
   - Navigation + Actions

4. **Dashboard** (`src/components/dashboard/DashboardPage.tsx`)
   - KPI cards with count-up
   - AI Daily Brief
   - Health Score ring
   - Action Dock

### Demo Mode

The app runs in demo mode by default:
- Preloaded customers, items, transactions
- AI insights generated
- Health score calculated
- Reset button to restore fresh state

---

## License

Proprietary - SmartStore OS Team
