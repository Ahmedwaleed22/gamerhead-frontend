# Gamerhead — Frontend

> Competitive gaming platform frontend built with Next.js 16 and React 19. Players compete in wager matches, climb ranked ladders, join tournaments, and connect with coaches — all in real time.

---

## Table of Contents

- [Overview](#overview)
- [Tech Stack](#tech-stack)
- [Features](#features)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [Architecture](#architecture)
- [Real-Time Integration](#real-time-integration)
- [Payment Integration](#payment-integration)
- [Authentication](#authentication)
- [Admin Dashboard](#admin-dashboard)
- [Scripts](#scripts)

---

## Overview

Gamerhead's frontend is a full-featured Next.js SPA that communicates with a Laravel REST API over HTTP and WebSocket (Laravel Reverb). It supports competitive cash and XP wagering, tournament brackets, seasonal ranked ladders, a coaching marketplace, a community forum, in-game store purchases, and a real-time support chat system.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | [Next.js 16](https://nextjs.org/) (App Router) |
| UI Library | [React 19](https://react.dev/) |
| Language | [TypeScript 5.9](https://www.typescriptlang.org/) |
| Styling | [Tailwind CSS 4](https://tailwindcss.com/) |
| Component System | [shadcn/ui](https://ui.shadcn.com/) (Base UI primitives) |
| Icons | [Iconify](https://iconify.design/) · Solar Duotone set |
| Animation | [Motion (Framer Motion) 12](https://motion.dev/) |
| Real-time | [Laravel Echo](https://laravel.com/docs/broadcasting) · [Reverb](https://reverb.laravel.com/) · [Socket.io](https://socket.io/) |
| Payments | [Stripe](https://stripe.com/) · [PayPal](https://developer.paypal.com/) |
| Carousel | [Embla Carousel](https://www.embla-carousel.com/) |
| Analytics | Google Analytics (gtag) |
| Utilities | clsx · tailwind-merge · class-variance-authority |

---

## Features

### Player Features
- **Competitive Matches** — Create and accept cash (wager) or XP matches with configurable team sizes, best-of formats, and game modes. Includes result reporting, dispute flow, and automated payouts.
- **Tournaments** — Browse and register for bracket-based tournaments. Auto-start, auto-advancement, and prize distribution (cash or XP).
- **Ranked Ladders** — Seasonal ELO-based climbing per game. Match outcomes directly affect ladder standings.
- **Player Profiles** — Public profile pages with stats, badges, match history, reputation, and linked gaming platforms (PSN, Xbox, Steam, Epic, Riot, Battle.net, Nintendo).
- **Teams** — Create or join teams, manage rosters, and invite members.

### Economy & Store
- **Wallet** — Deposit via Stripe or PayPal, track balances, claim prize payouts, and request withdrawals.
- **In-Game Store** — Purchase cosmetics and battle passes with Stripe or PayPal checkout.
- **Coupon System** — Apply discount codes at checkout.

### Community
- **Forum** — Multi-board discussion system with pinned threads, reactions, moderation, and reporting.
- **Coaching Marketplace** — Browse verified coaches, place coaching orders, track delivery, and leave reviews. Dedicated coach dashboard for managing orders and availability.
- **Leaderboards** — Global rankings by trophies, wins, and lifetime cash earnings.
- **Player of the Week** — Admin-curated spotlight on top performers.

### Communication
- **Mailbox** — Private messaging between users with real-time delivery via Reverb.
- **Notifications** — Real-time and polled system notifications with unread count badge.
- **Live Support Chat** — Real-time support widget: queued → agent connected → resolved flow.

### Authentication & Onboarding
- Email/password registration with email verification
- Google and Steam OAuth with onboarding flow for first-time social sign-ins
- JWT token management via `localStorage`

### Admin Dashboard (`/admin`)
A comprehensive internal control panel covering:
- User management and bans
- Match oversight and dispute resolution
- Tournament management
- Ladder and game catalog management
- Store and order management
- Coaching verification
- Wallet and payout approvals
- Forum moderation
- Support ticket queue and live chat assignment
- Badge and reward configuration
- Audit log
- Analytics overview
- Player of the Week management
- Announcements and premium access

---

## Project Structure

```
frontend/
├── app/                        # Next.js App Router
│   ├── (public pages)          # home, about, rules, careers, etc.
│   ├── admin/                  # Admin dashboard (26+ pages)
│   ├── auth/                   # Login, register, OAuth, onboarding
│   ├── coaching/               # Coaching marketplace + coach dashboard
│   ├── dashboard/              # Authenticated user dashboard
│   ├── forum/                  # Boards, threads, posts
│   ├── games/                  # Game catalog and detail pages
│   ├── leaderboards/           # Global rankings
│   ├── matches/                # Match detail and result pages
│   ├── mailbox/                # Private messaging
│   ├── orders/                 # Order history
│   ├── premium/                # Premium membership
│   ├── profile/[slug]/         # Public player profiles
│   ├── store/                  # In-game store
│   ├── support/                # Support tickets
│   ├── teams/                  # Team management
│   ├── tournaments/            # Tournament listing and detail
│   ├── wallet/                 # Wallet and transactions
│   ├── layout.tsx              # Root layout (auth, notifications, heartbeat, live chat)
│   └── globals.css
├── components/                 # Shared React components
│   ├── ui/                     # Base UI component library
│   ├── Header.tsx              # Navigation with user menu and notifications
│   ├── Footer.tsx
│   ├── AuthModal.tsx           # Login / register modal
│   ├── DashSidebar.tsx         # Dashboard navigation
│   ├── PostMatchModal.tsx      # Result submission flow
│   ├── AcceptMatchModal.tsx    # Match acceptance and roster selection
│   ├── RichEditor.tsx          # Rich text for forum / mailbox
│   └── LandingPage*.tsx        # Homepage section components
├── lib/
│   ├── api.ts                  # Centralized, type-safe API client
│   ├── auth-context.tsx        # Global auth state (React Context)
│   ├── use-api.ts              # Data-fetching hook with loading/error state
│   ├── echo.ts                 # Laravel Echo + Reverb listener setup
│   ├── socket.ts               # Socket.io heartbeat and presence utilities
│   ├── gtag.ts                 # Google Analytics event helpers
│   ├── reputation.ts           # Reputation score calculation
│   └── utils.ts                # Shared helpers (cn, formatting, etc.)
├── types/                      # Global TypeScript type definitions
├── public/                     # Static assets (images, videos, icons)
├── package.json
├── tsconfig.json
├── tailwind.config.js
└── components.json             # shadcn/ui configuration
```

---

## Getting Started

### Prerequisites

- Node.js 20+
- npm 10+ (or pnpm / yarn)
- The [new-backend](../new-backend/README.md) running on `http://localhost:8000`

### Installation

```bash
cd frontend
npm install
```

### Development

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Production Build

```bash
npm run build
npm run start
```

---

## Environment Variables

Create a `.env.local` file in the `frontend/` directory:

```env
# API
NEXT_PUBLIC_API_URL=http://localhost:8000/api

# Stripe (publishable key — safe to expose to browser)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...

# PayPal
NEXT_PUBLIC_PAYPAL_CLIENT_ID=...

# Laravel Reverb (WebSocket)
NEXT_PUBLIC_REVERB_APP_KEY=...
NEXT_PUBLIC_REVERB_HOST=127.0.0.1
NEXT_PUBLIC_REVERB_PORT=8082
NEXT_PUBLIC_REVERB_SCHEME=http
```

> In production, set `NEXT_PUBLIC_REVERB_SCHEME=https` and point all `NEXT_PUBLIC_*` URLs to your production domains.

---

## Architecture

### API Client (`lib/api.ts`)

All backend communication is centralized in `lib/api.ts`. It:

- Reads the JWT token from `localStorage` (`ce_token`) and injects it as `Authorization: Bearer <token>` on every authenticated request.
- Exposes typed endpoint groups: `authApi`, `usersApi`, `matchesApi`, `tournamentsApi`, `forumApi`, `walletApi`, `storeApi`, `coachingApi`, `adminApi`, and more.
- Normalizes 4xx/5xx errors into a consistent error shape for the `useApi` hook to surface.

### Auth Context (`lib/auth-context.tsx`)

`AuthProvider` wraps the entire app and:

- Hydrates user state from `localStorage` on initial load.
- Exposes `useAuth()` for any component to read the current user or call `login()` / `logout()`.
- Clears state and token on receiving a `401` from the API.

### Root Layout Responsibilities (`app/layout.tsx`)

The root layout mounts several global behaviors:

| Concern | Mechanism |
|---|---|
| Auth state hydration | `AuthProvider` context |
| Toast notifications | `ToastProvider` context |
| System notifications | 30-second polling + unread badge |
| Heartbeat / presence | 60-second ping + `visibilitychange` listener |
| Onboarding guard | Redirects incomplete OAuth users to `/auth/onboarding` |
| Live support chat | Floating widget with queue → active → closed state machine |
| Analytics consent | Conditionally loads `gtag` based on age/consent |

### Data Fetching

Pages and components use the `useApi` hook, which wraps `lib/api.ts` calls with:
- `loading` boolean
- `error` string | null
- Automatic re-fetch on dependency changes

Server-rendered pages (where SEO matters) use Next.js `fetch` directly in server components.

---

## Real-Time Integration

Real-time features are powered by **Laravel Reverb** (WebSocket) accessed through **Laravel Echo**.

### Setup (`lib/echo.ts`)

Echo is initialized with the Reverb connection details from `NEXT_PUBLIC_REVERB_*` env vars and authenticates private channels using the user's `ce_token`.

### Channels

| Channel | Event | Used By |
|---|---|---|
| `match.{matchId}` | `.chat.message` | Match live chat |
| `conversation.{id}` | `.message.sent` | Mailbox real-time messages |
| `support.chat.{sessionId}` | `.message.sent` | Live support chat |

### Fallback

Notifications and match status fall back to **30-second polling** (`setInterval`) if the WebSocket connection is unavailable or the channel subscription fails.

---

## Payment Integration

### Stripe

- Checkout is initiated on the backend; the frontend receives a `paymentIntentId` or `sessionUrl`.
- The `@stripe/stripe-js` SDK is loaded client-side using `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`.
- Used for wallet deposits and store purchases.

### PayPal

- The `@paypal/react-paypal-js` SDK renders the PayPal button using `NEXT_PUBLIC_PAYPAL_CLIENT_ID`.
- Order creation and capture are proxied through the backend.
- Used for wallet deposits and store purchases.

---

## Authentication

### Email / Password

1. User registers → backend sends verification email.
2. User verifies email → can log in.
3. Login returns a Sanctum personal access token.
4. Token stored in `localStorage` as `ce_token`.

### OAuth (Google / Steam)

1. User clicks provider button → redirected to `/auth/oauth/{provider}` on the backend.
2. Backend completes OAuth handshake and redirects to `/auth/oauth-complete?token=...` on the frontend.
3. If the account is new, user is redirected to `/auth/onboarding` to complete their profile.
4. On completion, token is written to `localStorage` and user is sent to `/dashboard`.

### Route Protection

- Pages check `useAuth()` and redirect unauthenticated users to `/auth/login`.
- Admin pages additionally verify the `role === 'admin'` flag on the user object.

---

## Admin Dashboard

Located at `/admin`, the admin dashboard is accessible only to users with `role: 'admin'`. It is built entirely with standard Next.js App Router pages and communicates with the backend via `adminApi` endpoints.

Key sections:

| Section | Path |
|---|---|
| Analytics | `/admin/analytics` |
| Users | `/admin/users` |
| Matches | `/admin/matches` |
| Tournaments | `/admin/tournaments` |
| Ladders | `/admin/ladders` |
| Games | `/admin/games` |
| Store & Orders | `/admin/store` |
| Wallet & Payouts | `/admin/wallet` |
| Coaching | `/admin/coaching` |
| Forum Moderation | `/admin/forum` |
| Support Tickets | `/admin/support` |
| Live Chat | `/admin/live-chat` |
| Badges | `/admin/badges` |
| Premium | `/admin/premium` |
| Audit Log | `/admin/audit-log` |
| Player of the Week | `/admin/players-of-week` |

---

## Scripts

```bash
npm run dev       # Start development server (hot reload)
npm run build     # Production build
npm run start     # Start production server
npm run lint      # Run ESLint
```
