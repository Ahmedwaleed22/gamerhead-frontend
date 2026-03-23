# GamerHead — Project Status & Developer Reference

> Last updated: 2026-03-03 (Session 10)

---

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [What's Done](#whats-done)
3. [What Still Needs Work](#what-still-needs-work)
4. [Backend Modules & API Routes](#backend-modules--api-routes)
5. [Database Schemas (Key Fields)](#database-schemas-key-fields)
6. [Frontend Pages](#frontend-pages)
7. [Frontend API Client (`lib/api.ts`)](#frontend-api-client)
8. [Auth System](#auth-system)
9. [WebSocket / Real-Time](#websocket--real-time)
10. [Design System](#design-system)
11. [Environment Variables](#environment-variables)

---

## Architecture Overview

| Layer | Stack |
|-------|-------|
| **Frontend** | Next.js 16 (App Router) + React 19 + Tailwind 4 |
| **Backend** | NestJS + MongoDB (Mongoose) + TypeScript |
| **Auth** | JWT + Passport (`ce_token` in localStorage) + OAuth scaffolding |
| **Payments** | Stripe (primary) + PayPal (redirect flow) |
| **WebSocket** | socket.io via `@nestjs/websockets` — notifications + presence + activity |
| **Email** | Resend — verification, password reset, opt-in notification emails |
| **Hosting** | Backend: `localhost:3001`, Frontend: `localhost:3000` (dev) |

### Key Business Rules

- **XP System:** Table-based leveling. Premium gives 1.25x multiplier, stacks with 2XP token (2x) for 2.5x max. Base XP per match: XP type 2,500 / Cash type 5,000. Tournament bonus: XP type 5,000 / Cash type 10,000. Both winners and losers receive Profile Level XP.
- **Reputation:** 1-100 scale (start 50), adjusts per match via 5-star opponent feedback
- **Match Disputes:** 15-min auto-resolve — first reporter wins if no counter-report
- **Teams:** Single game per team, up to 5 roster slots, roles: Leader / Captain / Member. Tournament teams derive `maxMembers` from format (Solo=1, Duo=2, else `maxTeamSize`). Team trophy display = sum of all members' per-game trophies.
- **User Roles:** Base `role` field (admin/member) + independent `isPremium` and `isCoach` boolean flags. Derived display role: admin > premium > coach > member. Users cannot self-assign roles — admin manages via Change Role modal
- **User Presence:** Online (connected + heartbeat 60s) → Idle (tab hidden 5min) → Offline (disconnected)
- **Tournament Lifecycle:** Open → auto-start at `startAt` (0 teams = cancel, else wait 2-3min → generate bracket → create round 1 matches → LIVE). Bracket is empty until tournament starts. Registration locks when status leaves OPEN. Match results advance winners. Final match → award trophies (Gold/Silver/Bronze to top 3) + distribute prizes. Top 3 get trophies on User profiles (global), User game stats (per-game), and Team documents.
- **Tournament Stats Isolation:** Tournament matches do NOT affect: team competitive XP (stays 500), team W/L record, per-game W/L or competitive XP, game rank, global rank, or profile W/L record. Tournament matches DO award: Profile Level XP (5K/10K bonus rate), match history (profile + team), bracket advancement, and trophies/prizes at tournament completion.
- **Tournament Prize Split:** Admin sets total, auto-splits 50%/30%/20% for 1st/2nd/3rd. Prize type: Cash (PrizeClaim records), Credits (direct wallet credit), Other (display only).
- **Per-Game Stats Isolation:** Team profile pages show game-specific stats only — roster player W/L/trophies come from `UserGameStats` for that game, not global user totals. A FIFA team with 0 FIFA matches shows 0-0 even if the player has CoD wins.
- **Cash Match Rake:** 12.5% standard, 10% when both teams are premium
- **Cash Match Flow:** Create listing → Accept (PENDING) → Both Ready Up (wagers held → LIVE) → Report Result → Complete (winners paid, all wager holds marked completed) or Cancel (all refunded). `payMatchWin` is awaited (not fire-and-forget). Stale pending holds auto-resolved on startup for completed/cancelled matches
- **Coaching Payment Flow:** Buyer hires coach (no money taken) → Coach accepts (buyer's funds held in escrow) → Coach delivers → Both parties confirm completion (`buyerConfirmed` + `coachConfirmed`) → Funds released to coach. Rejection/cancellation decrements `totalOrders`. Revision resets both confirmation flags
- **Earnings Tracking:** `totalWinnings` (USD) and `lifetimeEarnings` (cents) only increment for earning transaction types: `match_win`, `prize_claim`, `tournament_prize`, `coaching_payment`. Deposits, refunds, admin adjustments do NOT count. Startup repair aggregates from Transaction collection to fix any drift
- **Premium Pricing:** $9.99/mo, $24.99/3mo, $79.99/yr
- **Platform ID:** Every user gets a permanent `GH-XXXXXXXXXX` ID on registration (never changes, used for tracking)
- **Notification Types (8):** `matchAccepted`, `matchResult`, `disputeUpdate`, `tournamentUpdates`, `payoutReady`, `teamInvites`, `friendActivity`, `platformAnnouncements`
- **Notification Delivery:** In-app (WebSocket push) + Email (Resend, opt-in per type, verified email required)

---

## What's Done

| Feature | Status | Notes |
|---|---|---|
| Matches (Cash + XP) | 100% | Full lifecycle — create, accept, ready-up, wager hold/pay/refund, results, disputes, auto-resolve, XP/rep awards, pot calc with premium discount. Request Staff (cash/premium/tournament), Create a Ticket (XP non-premium). Ready-up timer stops on bothReady. Wager display on listing cards + accept modal. No hardcoded team data — empty fallbacks. BO rule text removed from all match pages. `totalWagered` incremented on wager hold, `totalWon` incremented on match payout |
| Teams | 100% | Full CRUD, roster management, stats tracking, disband (preserves completed matches + game stats, only cancels active matches, recalculates ladder positions for remaining teams) |
| Store/Shop | ~90% | Stripe + PayPal, credits/premium/apparel/bundles, cart, coupons |
| Wallet/Credits | 100% | Deposits, withdrawals, transaction ledger, holdWager/payMatchWin/refundWager, coaching escrow (hold/release/refund). `totalWinnings`/`lifetimeEarnings` only counts actual earnings (match_win, prize_claim, tournament_prize, coaching_payment) — not deposits. Stale wager holds auto-resolved on startup. Wallet/dashboard UI correctly converts cents→dollars. Ledger `referenceId` validates with `ObjectId.isValid()` before conversion (prevents BSONError on non-ObjectId strings) |
| Auth | 100% | Register, login, JWT, password reset, platform ID generation (OAuth linked accounts waiting on API keys) |
| Profiles | 100% | Stats, friends, reputation, presence status, activity text, admin badge, all profile tabs, per-game rank from UserGameStats, game image resolution by slug+name. Game Stats card seeded from UserGameStats (survives team deletion) with game icon from Game model. Verified badge only on coach profile page (not user profile) |
| XP/Leveling | 100% | Table-based progression, boost multipliers, crate rewards |
| Coaching | 100% | Packages, orders, reviews, coach dashboard, custom requests, multi-game support. **Corrected payment flow:** money held on coach accept (not order creation), dual-confirmation completion (buyer + coach must both confirm before funds released), revision resets both confirmations. Rejection/cancellation decrements `totalOrders`. Inline review UI on completed orders (star rating + text). Coach profile edit modal (bio, games, custom requests toggle). Coaches can't hire/message themselves. Browse page filters by `gameSlugs[]` array |
| Forum | 100% | Boards, threads, posts, admin moderation dashboard, admin link on forum page, board permissions (postRoles/viewRoles), thread status legend in sidebar, role badges on recent activity, lastPost recalculation on thread delete, locked thread admin reply |
| Leaderboards | 100% | Global rankings by region/game, per-game filtering via UserGameStats aggregation pipeline, gameSlug-based game links |
| Badges | 100% | Achievement system with seeding |
| Mailbox | 100% | Direct messages/conversations, 3-state presence in friends panel |
| Ladders | 100% | Full module — schema, standings, auto-join from matches, rank sync. Positions recalculate when teams are disbanded (remaining teams re-ranked, team model `ladderRank`/`currentRank` updated) |
| Friends | 100% | Send/accept/decline/remove, presence tracking (online/idle/offline + activity text) |
| Notifications | 100% | In-app + real-time WebSocket + email via Resend, per-type preferences UI in settings |
| Forum Moderation | 100% | Admin reports dashboard, thread management (pin/lock/move/delete) |
| User Presence | 100% | Online/idle/offline via WebSocket heartbeat, activity text per page, displayed in mailbox + profiles |
| Premium Features | ~98% | All perks wired — XP boost, name change, name color, 2XP auto-grant, reduced rake |
| Support Tickets | 100% | Create (General/Match Dispute/Payment Issue/Technical with department-specific validation), message, claim (admin), reply, close, reopen. Request Staff button creates LiveChatSession (queued) for admin live chat — used on cash/premium/tournament matches. Admin ticket center with chat-style detail view, status tracking (Awaiting Claim/Claimed/Awaiting Reply/Closed), displayName enrichment. User-facing live chat endpoints: `GET /support/live-chat/mine` (get active session), `POST /support/live-chat/:sessionId/message` (user sends message) |
| Live Support Widget | 100% | Floating bottom-right chat button on all pages (except match/admin). Creates LiveChatSession (not SupportTicket). Department options: Tournament Support, Technical Issue, General (maps to categories). Shows "Waiting for agent..." until staff claims, then real-time chat with 5s polling. On page load auto-opens if user has existing active/queued session. Chat ended state when admin closes |
| Player of the Week | 100% | Weekly candidate aggregation from Match model (not lifetime wins), admin review/select/skip workflow, 7-day premium + badge award on selection, consecutive-winner prevention, match review modal for verifying legitimacy. Displayed on game profile pages |
| Invites | 100% | Team invites with send/accept/decline/expire |
| Level Rewards | 100% | Crate system with tiered rewards per level |
| Games | 100% | Catalog with modes, maps, platforms, crossplay flag, rename cascade (auto-updates matches/ladders/teams/gameStats/favoriteGame), slug migration tool, admin recalculate ranks |
| Tournaments | 100% | Full lifecycle — admin create (game dropdown, image preview, prize pool type, auto-split prizes, platform including Console Only), auto-start scheduling, bracket generation (single/double elim), match creation, win/loss advancement, trophy awards (Gold/Silver/Bronze to top 3 — global user + per-game `UserGameStats` + team), prize distribution (cash/credits/other). Frontend bracket visualization with live data. Bracket empty until start. Registration locked when not OPEN. Tournament matches isolated from competitive stats (no team XP/W-L/game rank changes). **Entry fee (credits) deducted from team creator on registration.** Game banner images fixed (corrected seed data `.jpg`→`.png` paths). Tournament teams show game image (from `gameEmoji`). Auto-populates `gameEmoji` from game `bannerUrl` on create. Fuzzy game name resolution for banner display. Registration modal defaults team logo/banner to game image. **Credit refund:** incomplete roster teams excluded from bracket get credits back; all teams refunded if tournament cancelled (< 2 teams) |
| **Admin Dashboard** | **~95%** | **Full admin panel with edit modals — see details below** |

### Admin Dashboard — Completed

| Admin Page | Status | Notes |
|---|---|---|
| Foundation (guard, module, layout, sidebar, shared components) | Done | `AdminGuard`, `AdminModule`, sidebar nav with 18 sections, reusable `DataTable`, `ActionBtn` (sm/md/lg), `Modal`, `SearchFilter`, `StatCard`, `Pagination` |
| Dashboard Home (`/admin`) | Done | 8 stat cards, recent activity feed, quick actions |
| Users & Accounts (`/admin/users`) | Done | List with search/filters, detail page with tabs (Overview, Wallet, Matches, Teams, Badges). Overview: Identity (name, email, slug, platform ID, country, timezone, bio, admin/coach/premium yes/no), Stats, Gaming Platforms, Forum Stats. Actions: ban/unban, role change, wallet adjust, award badge, verify email, reset password, **Edit Profile** (username, display name, DOB, avatar URL, banner URL) |
| Matches & Disputes (`/admin/matches`) | Done | List with status/game/type filters, dispute alert banner, resolve dispute modal (side-by-side reports, winner selector, score inputs), cancel modal with refund toggle, adjust result for completed matches, **Edit Match Outcome** button for completed/disputed matches (change winner, scores, reason) |
| Teams (`/admin/teams`) | Done | List with search (by name or ID)/game/type (cash/xp)/tournament/disbanded filters, detail modal with populated roster, disband, transfer captain, remove member, **Edit Team** modal (name, emoji, profile pic URL, banner URL, game, game slug) |
| Coaching (`/admin/coaching`) | Done | 3 tabs: Coaches (verify/suspend/delete), Orders (status update), Reviews (delete with stat recalc) |
| Store & Products (`/admin/store`) | Done | 4 tabs: Items (CRUD, disable/delete with order protection, **Edit Product** modal), Orders (User display name column between Order ID and Items, status/refund), Coupons (CRUD), Revenue stats |
| Premium Plans (`/admin/premium`) | Done | 2 tabs: Members (grant/revoke, expiry tracking, displayName shown, **stats cards moved here**), Plans (CRUD with pricing/features/badges, **Edit Plan** modal) |
| Wallet & Transactions (`/admin/wallet`) | Done | 5 tabs: Overview (circulation stats), Transactions (all, filterable), Withdrawals (approve/deny), Deposits, Prize Claims |
| Live Chat (`/admin/live-chat`) | Done | Queue + active sessions panel, chat window, claim/close/transfer. Schema: `LiveChatSession`. Priority-sorted queue (tournament > wager > match > premium > technical > general), priority tags (HIGH/MED/LOW with color coding), category labels, time-waiting display, user ID in chat header. 'technical' category added to schema |
| Support Tickets (`/admin/support`) | Done | Stats banner, filters (status/department/urgent/claimed), ticket list, assign, claim, chat-style ticket detail view with reply input, displayName enrichment. Department-specific validation |
| Games CRUD (`/admin/games`) | Done | Card view, create modal (modes, maps, platforms), **Edit Game** button on each card (pre-fills all fields), disable/delete with match protection, **Migrate Old Slug** tool in edit modal (migrates matches/ladders/teams/gameStats/favoriteGame from old slug/name), **Recalculate Ranks** button (recalculates all game + global ranks) |
| Ladders & Seasons (`/admin/ladders`) | Done | List with game/status filters, create, **Edit Ladder** button (game, type, size, region, etc.), season reset, delete with match protection |
| Badges & Achievements (`/admin/badges`) | Done | Visual grid (color-coded by rarity), **split into Platform Badges and Forum Badges sections** with counts, create/edit with **trigger dropdown** (12 predefined triggers: first-win, win-streak, matches-played, cash-earned, level-reached, forum-posts, team-created, referral, tournament-win, premium-subscribe, profile-complete, manual), **Edit Badge** button, award to user, disable/delete with user protection |
| Announcements (`/admin/announcements`) | Done | Create (type/icon/expiry/pin), toggle active, delete, notification broadcast option |
| Player of the Week (`/admin/player-of-week`) | Done | **Full overhaul:** Candidate table ranked by weekly match wins (aggregated from Match model, not lifetime User.wins), REVIEW button (match review modal showing all weekly matches with scores/results), SELECT button (confirmation → creates POTW record + grants 7-day premium + awards "Player of the Week" badge + notification), SKIP button (removes from candidate list for session), consecutive-winner prevention (last week's winner flagged with "LAST WEEK" badge, SELECT hidden), enhanced history with Premium/Badge granted status columns, delete. `completedAt` fallback to `createdAt` for older matches |
| Analytics & Reports (`/admin/analytics`) | Done | Period selector, stat cards, revenue/user-growth/match-volume charts, top earners (shows displayName), top games. Safe array fallback for API responses |
| Audit Log (`/admin/audit-log`) | Done | Every admin action logged (ban, wallet adjust, dispute resolve, role change, etc.), filterable by action/admin/target type |
| Forum Board Management (`/admin/forum`) | Done | Shared components, board CRUD (create/edit/reorder/toggle active/delete) alongside existing report/thread moderation, **board permissions UI** (postRoles/viewRoles multi-select checkboxes for Admin/Premium/Coach/Member) |
| Tournaments (`/admin/tournaments`) | Done | List with status filters, create (game dropdown from DB, game image preview, prize pool type selector with auto-split 50/30/20, no slug field, no entry type field, Console Only platform option), status management, featured toggle, delete |
| API namespace (`adminApi`) | Done | Full `adminApi` object in `lib/api.ts` with all admin endpoints |

### Admin — Key Technical Details

- **Single AdminController** — All admin endpoints under `/admin/*` with class-level `@UseGuards(AdminGuard)`
- **AdminGuard** — Extends JWT guard, checks `role === 'admin'`
- **Audit trail** — Every admin mutation writes to `AuditLog` collection
- **Wallet adjustments** — Create real `Transaction` documents (type: `admin_adjustment`)
- **Delete protection** — Hard delete blocked if other records reference the entity (forces disable instead)
- **Platform ID backfill** — `onModuleInit` auto-generates `GH-XXXXXXXXXX` IDs for existing users missing one
- **Admin Dashboard link** — Added to profile dropdown for admin users (red colored)
- **Role management** — Admin "Change Role" modal uses base role (Member/Admin) + independent Premium/Coach checkboxes. Role toggles removed from user settings page (users can't self-assign roles)
- **Game rename cascade** — `updateGame()` auto-updates matches, ladders, teams, gameStats, and user favoriteGame when game name/slug changes. Separate `migrateGameSlug` endpoint for retroactive fixes
- **Rank recalculation** — `recalculateGameRank` filters by real user IDs to exclude orphaned gameStats. `POST /matches/recalculate-ranks` endpoint recalculates all game + global ranks
- **Forum board permissions** — `postRoles[]` restricts thread creation, `viewRoles[]` restricts board visibility. Empty = open to all. Enforced backend + frontend
- **Forum lastPost recalculation** — Deleting a thread recalculates the board's lastPost fields from remaining threads
- **Public page cleanup** — Removed "Create Tournament" button from `/tournaments`, removed "Moderation" button from `/forum` (admins use `/admin` now)
- **Admin edit pattern** — All edit modals follow: `editModal` state (selected item or null) → `editForm` state (pre-filled) → `handleEdit` calls API → closes modal → reloads. Shared `inputStyle`/`labelStyle` constants per page
- **New admin API endpoint** — `adminApi.getTicket(id)` added to `lib/api.ts` → `GET /admin/support/:id` (returns ticket with full message history)
- **Badge triggers** — 12 predefined triggers in `BADGE_TRIGGERS` constant: `first-win`, `win-streak`, `matches-played`, `cash-earned`, `level-reached`, `forum-posts`, `team-created`, `referral`, `tournament-win`, `premium-subscribe`, `profile-complete`, `manual`
- **POTW badge** — `player-of-week` badge (Legendary, trigger: `potw_awarded`) seeded in `badges.seed.ts`, awarded via `BadgesService.checkAndAward()` on POTW selection
- **POTW schema** — Compound unique index `{weekKey, gameSlug}` (supports multi-game), `premiumGranted`/`badgeGranted` fields track reward status
- **Revenue aggregation** — All revenue queries use `{ $sum: { $abs: '$amount' } }` because store/premium purchases store negative amounts (debits from user wallet)
- **Admin displayName** — All admin controller methods use `req.user.displayName || req.user.username` for audit logging (bulk-replaced ~60 occurrences)
- **Admin content sizing** — All shared components (DataTable, StatCard, ActionBtn, SearchFilter, Modal, Pagination, AdminSidebar) bumped for readability
- **Team disband** — No longer deletes completed matches; only cancels active matches (open/pending/accepted/live). Preserves match history + game stats
- **Profile game stats resilience** — Game Stats card seeded from `UserGameStats` records (survives team deletion), with game icon fetched from Game model `bannerUrl`
- **Live chat priority queue** — `getLiveChatQueue()` sorts by priority map: tournament(1) > wager(2) > match(3) > premium(4) > technical(5) > general(6), then FIFO within same priority
- **User-facing live chat** — Floating widget in `layout.tsx` creates LiveChatSession via `supportApi.requestStaff()` (not SupportTicket). Department mapping: Tournament Support→tournament, Technical Issue→technical, General→general. Auto-reopens existing session on page load
- **displayName consistency** — All admin pages showing usernames now prefer `displayName` with `username` fallback: Analytics top earners, Premium members, Store orders (populated via `.populate('userId', 'username displayName')`)
- **Admin teams filters** — Backend `getTeams` supports `type` (matchType), `hasTournament` filters, and search by MongoDB ObjectId. Frontend has game/type/tournament filter dropdowns
- **Dashboard teams page** — Shows Team ID (`ID-XXXXXXXX` format) on each team card
- **Coaching custom requests** — `hireCoach()` handles `packageId: '__custom__'` sentinel value; parses budget/timeline from structured message; validates `coach.allowCustomRequests` flag; creates custom order with escrow. Custom Request modal on coach profile page (budget, timeline, description)
- **Coach multi-game support** — `gameSlugs: string[]` array on CoachProfile. `getCoaches()` filters with `$or: [{gameSlug}, {gameSlugs: slug}]` using `$and` to avoid conflicts with search `$or`. Browse page checks both fields. Edit Profile modal shows clickable game tag buttons for multi-select
- **Coach profile self-view** — `isOwnProfile` flag hides "Hire Now" buttons on packages, "Send Message" button, and custom request CTA when coach views their own profile
- **Coach Edit Profile modal** — Dashboard modal with bio textarea, games multi-select (fetched from `gamesApi.getAll()`), and "Enable Custom Requests" toggle. Saves via `POST /coaching/dashboard/profile`
- **Mongoose `.lean()` for coaching** — `hireCoach()` uses `.lean()` to avoid Mongoose virtual `id` getter shadowing custom `id` fields on package subdocuments. Package lookup: `p.id === dto.packageId || p._id?.toString() === dto.packageId`
- **Wallet ledger safety** — `referenceId` validated with `Types.ObjectId.isValid()` before conversion; coaching wallet methods no longer pass string orderIds as referenceId (prevented BSONError crash). Order ID embedded in transaction `description` instead
- **Coaching payment flow overhaul** — Money no longer deducted at order creation. `hireCoach()` just creates the order. `acceptOrder()` validates buyer balance + calls `holdCoachingPayment()`. `rejectOrder()`/`cancelOrder()` decrement `totalOrders` (no refund needed since no money held for pending orders). Dual-confirmation: `buyerConfirmed` + `coachConfirmed` flags, `finalizeOrder()` releases escrow only when both true. `requestRevision()` resets both flags. New `confirmCompletion()` endpoint for coach-side confirmation
- **Coaching review UI** — Inline review form on completed orders page: 5-star interactive rating (hover + click), textarea (min 10 chars), submit via existing `coachingApi.leaveReview()`. Already-reviewed orders show filled stars + "Review submitted"
- **Tournament entry fee** — `registerTeam()` checks `t.entryCredits > 0`, validates user credits balance, calls `walletService.spendCredits()` before creating team
- **Tournament game image resolution** — `create()` auto-populates `gameEmoji` from game's `bannerUrl`. Frontend `resolveGameAssets()` does fuzzy substring matching for banner display. Registration modal defaults team logo/banner to `tournament.gameEmoji`
- **Ladder position recalculation on disband** — `disband()` reads affected ladders, filters out disbanded team, re-sorts by wins/losses, reassigns positions 1-N, updates each remaining team's `ladderRank`/`currentRank`
- **Admin team edit socials** — `updateTeam()` allowed fields now includes `twitchUrl`, `twitterUrl`, `youtubeUrl`, `discordUrl`. Edit Team modal has Socials section
- **Username/displayName sync** — Startup backfill syncs any users where `displayName ≠ username`. Name change flow already updates both together
- **CE- → GH- migration** — Store order IDs now generate as `GH-XXXXX`. Startup backfill migrates any legacy `CE-` platform IDs to `GH-`
- **Admin forum stats fix** — `getUser()` was querying `{ author: id }` but schema uses `authorId`. Fixed to `{ authorId: id }`
- **totalWagered/totalWon tracking** — `holdWager` now increments `totalWagered`, `payMatchWin` now increments `totalWon` on User model
- **Tournament credit refund** — Teams excluded from bracket (incomplete roster) and all teams on tournament cancellation (< 2 teams) get entry credits refunded via `walletService.awardCredits()`
- **Profile label** — "Overall Winnings" renamed to "Total Earnings"
- **API error message fix** — `lib/api.ts` now correctly joins array error messages before falling back to string check

---

## What Still Needs Work

### Tournaments (100%) — Done
- [x] Backend status lifecycle (Draft → Open → Check-In → Live → Completed/Cancelled)
- [x] Bracket types (Single Elim, Double Elim)
- [x] Registration system (slug-based, max teams, seed assignment)
- [x] Prize system (multiple placement tiers, credits bonus)
- [x] Frontend list + detail pages
- [x] Admin CRUD management (create/edit/delete/status from admin panel)
- [x] **Bracket generation logic** — `bracket.util.ts` generates seeded single & double elim brackets with bye handling
- [x] **Automatic match creation from brackets** — Round 1 matches auto-created as Match docs when bracket goes live
- [x] **Tournament auto-start** — `setTimeout` at `startAt`; 0 teams → auto-cancel; teams exist → bracket generates 2-3 min after start
- [x] **Match advancement** — `completeMatch` calls `advanceMatchWinner()` to move winners through bracket, auto-creates next round matches
- [x] **Trophy awards** — 1st/2nd/3rd get Gold/Silver/Bronze trophies on User (global), UserGameStats (per-game), and Team models
- [x] **Prize distribution** — Cash prizes create PrizeClaim records; Credits auto-credited to user wallets; "Other" type for non-monetary prizes
- [x] **Prize pool type** — Admin selects Cash/Credits/Other; total auto-splits 50%/30%/20% across 1st/2nd/3rd (editable)
- [x] **Admin create modal overhaul** — Removed slug (auto-gen), game is dropdown from DB with image preview, prize pool type selector, removed Entry Type (everyone creates a team), added Console Only platform option
- [x] **Live bracket on frontend** — Bracket tab reads `bracketJson` from backend; shows live/completed match status; team names link to profiles, VS links to match pages. Empty "Bracket Not Yet Generated" state shown before tournament starts
- [x] **OnModuleInit re-scheduling** — Server restart reschedules all pending tournament timers
- [x] **Bracket hidden until start** — Bracket tab shows placeholder until `bracketJson` exists; no client-side preview bracket from registered teams
- [x] **Registration lockdown** — "Enter Tournament" button and sidebar registration card hidden when status is not `open`; shows "Registration Closed" instead
- [x] **Tournament stats isolation** — Tournament matches skip: `incrementStats` (profile W/L), `recordMatchResult` (team W/L + XP), `upsertGameStats` (per-game W/L + competitive XP), `recalculateGameRank`/`recalculateGlobalRank`. Tournament matches still award: Profile Level XP (higher rate), match history, bracket advancement
- [x] **Per-game trophy tracking** — `completeTournament` now upserts `UserGameStats` with per-game trophy counts alongside global user trophies
- [x] **Tournament team sizing** — `maxMembers` derived from format: Solo/1v1 = 1, Duo/2v2 = 2, else `maxTeamSize`; ladder field strips parenthetical (e.g., "Solo" not "Solo (1v1)")
- [x] **Tournament page polish** — Removed redundant "+0 Credits" on prize rows (only shows credits bonus when prizePoolType=cash and bonus>0), removed auto-Recruiting tag from teams tab, slots % updates immediately after registration via `onRegistered` callback, team creation subtitle shows "Game · Tournament · Format"
- [x] **Tournament card slots fix** — `filled` percentage now reads `registeredCount` from API (was using undefined `teams` field)
- [x] **Teams tab player count** — Shows correct max per format (1/1 for solo) instead of always 1/4
- [x] **Entry fee deduction** — `registerTeam()` calls `walletService.spendCredits()` to deduct credits from team creator; validates sufficient balance
- [x] **Game banner image fix** — Corrected all 12 game seed `bannerUrl` entries (`.jpg`→`.png`, wrong directory paths), tournament `gameEmoji` auto-populated from game `bannerUrl` on create
- [x] **Tournament teams show game image** — Team rows display game image instead of emoji; registration modal defaults logo/banner to game image
- [x] **Fuzzy game name resolution** — `resolveGameAssets()` substring-matches game names (e.g., "Call of Duty Black Ops 7" → "Call of Duty")
- [x] **Credit refund** — Teams excluded from bracket (incomplete roster) get entry credits refunded automatically. All teams refunded if tournament is cancelled (< 2 teams)

### Admin Panel — Remaining (~5%)
- [x] Admin route structure (`/admin/*` — main dashboard landing)
- [x] Tournament CRUD management
- [x] User management (bans, wallet adjust, role change, badges, password reset, email verify)
- [x] Store/item management (items, orders, coupons, revenue)
- [x] Support ticket handling dashboard
- [x] Match dispute resolution dashboard
- [x] Team management (disband, transfer captain, remove member)
- [x] Coaching management (coaches, orders, reviews)
- [x] Premium management (members, plans, stats)
- [x] Wallet & transaction oversight (withdrawals approve/deny, deposits, prize claims)
- [x] Games CRUD
- [x] Ladders & season management
- [x] Badges CRUD & award system
- [x] Announcements
- [x] Player of the Week management
- [x] Analytics & reports
- [x] Audit log
- [x] Forum board management
- [x] Live chat queue system
- [x] **Edit Profile** modal on user detail (username, display name, DOB, avatar, banner)
- [x] **Edit Match Outcome** for completed/disputed matches (winner, scores, reason)
- [x] **Edit Team** modal (name, emoji, profile pic, banner, game)
- [x] **Ticket Detail View** — click any ticket (including closed) to see full message history
- [x] **Edit Game** button on game cards (pre-fills form, uses updateGame API)
- [x] **Edit Ladder** button in actions column (game, type, size, region, etc.)
- [x] **Edit Badge** with trigger dropdown (12 predefined triggers for badge automation)
- [x] **Edit Store Item** (name, category, price, credits granted, premium days, etc.)
- [x] **Edit Premium Plan** on plan cards (name, duration, price, features, badge)
- [x] **Premium Stats** moved from separate tab into Members tab (above table)
- [x] **Bug fixes:** Player of Week + Analytics pages crash on undefined API response data
- [ ] Live chat WebSocket integration (real-time message push, sidebar badge with queue count)
- [x] User-facing Request Staff button on match/tournament pages (creates LiveChatSession for admin queue)
- [x] User-facing live chat widget (floating button on all pages, creates LiveChatSession, department selection: Tournament Support/Technical Issue/General, real-time chat with 5s polling, auto-reconnects to existing session)
- [ ] Message moderation tab on user detail page (read user conversations, delete messages)
- [ ] Withdrawal payout integration (actual PayPal/Stripe payout trigger on approve)

### Store (~90%)
- [ ] PayPal checkout completion flow (currently redirects but doesn't confirm)
- [ ] Apparel items (physical goods) — shipping address collection, fulfillment tracking

### Deferred (Waiting on External Dependencies)
- [ ] OAuth linked accounts (PSN, Xbox, Steam, etc.) — waiting on API keys from each platform
- [ ] Ad system — no ads to show yet; no-ads premium perk has nothing to remove

### Priority Order
1. **Full QA pass** — Go through every feature end-to-end one more time
2. **Live Chat WebSocket** — Real-time message push (currently 5s polling) for both admin and user-facing live chat
3. **Store payments** — PayPal checkout completion, apparel fulfillment
4. **OAuth** — Linked accounts when API keys are available (very last)
5. **Ads** — When there are ads to show

---

## Backend Modules & API Routes

Backend root: `backend/src/`

### Auth (`auth/`)
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/auth/register` | — | Register new account (generates `GH-XXXXXXXXXX` platform ID) |
| POST | `/auth/login` | — | Login → JWT token |
| GET | `/auth/me` | JWT | Get current user |
| GET | `/auth/verify-email?token=X` | — | Verify email |
| POST | `/auth/forgot-password` | — | Request password reset |
| POST | `/auth/reset-password` | — | Complete password reset |
| POST | `/auth/change-password` | JWT | Change password |

### Linked Accounts (`auth/linked-accounts/`)
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/auth/link/:platform` | JWT | Initiate OAuth linking |
| GET | `/auth/callback/:platform` | — | OAuth callback |
| DELETE | `/auth/link/:platform` | JWT | Unlink platform |
| GET | `/auth/linked-platforms` | JWT | List linked platforms |

### Users (`users/`)
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/users/search?q=X` | — | Search users by username |
| PATCH | `/users/me/profile` | JWT | Update profile fields |
| GET | `/users/me/friends` | JWT | Get friends list (with presence) |
| GET | `/users/me/friend-requests` | JWT | Get pending friend requests |
| POST | `/users/me/friend-request/:targetId` | JWT | Send friend request |
| POST | `/users/me/accept-friend/:requesterId` | JWT | Accept friend request |
| POST | `/users/me/decline-friend/:requesterId` | JWT | Decline friend request |
| DELETE | `/users/me/friend/:friendId` | JWT | Remove friend |

### User Profile (`users-profile/`)
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/users/me` | JWT | Get own full profile |
| PATCH | `/users/me` | JWT | Update own profile |
| GET | `/users/me/check-name?name=X` | JWT | Check name availability |
| POST | `/users/me/name-change` | JWT | Change display name (5 credits, free for premium) |
| POST | `/users/me/name-color` | JWT | Change name color (1 credit) |
| POST | `/users/me/redeem-2xp` | JWT | Buy 2XP token (2 credits) |
| POST | `/users/me/toggle-role` | JWT | Toggle role (admin testing — UI removed from settings, admin-only) |
| GET | `/users/:slug` | — | Get public profile |

### Admin (`admin/`) — All endpoints require Admin role
| Method | Path | Description |
|--------|------|-------------|
| **Dashboard** | | |
| GET | `/admin/stats` | Aggregated platform metrics |
| **Audit Log** | | |
| GET | `/admin/audit-log` | Admin action history (?action, ?adminId, ?targetType, ?page) |
| **Users** | | |
| GET | `/admin/users` | Paginated user list (?q, ?role, ?isBanned, ?isPremium, ?sort, ?page) |
| GET | `/admin/users/:id` | Full user detail (profile, transactions, teams, matches, badges, forum stats) |
| PATCH | `/admin/users/:id` | Update user fields |
| POST | `/admin/users/:id/ban` | Ban user with reason |
| POST | `/admin/users/:id/unban` | Unban user |
| POST | `/admin/users/:id/wallet-adjust` | Adjust wallet (creates Transaction) |
| POST | `/admin/users/:id/award-badge` | Award badge to user |
| POST | `/admin/users/:id/reset-password` | Generate password reset |
| POST | `/admin/users/:id/verify-email` | Manually verify email |
| POST | `/admin/users/:id/set-role` | Change user role (base role + isPremium + isCoach) |
| GET | `/admin/users/:id/game-stats` | User's per-game stats |
| **Matches** | | |
| GET | `/admin/matches` | Paginated matches (?status, ?game, ?type, ?disputed, ?q, ?page) |
| GET | `/admin/matches/:id` | Full match detail |
| POST | `/admin/matches/:id/resolve` | Resolve dispute (set winner, scores, process payouts) |
| POST | `/admin/matches/:id/cancel` | Cancel match (optional refund) |
| POST | `/admin/matches/:id/adjust-result` | Adjust completed match result |
| **Teams** | | |
| GET | `/admin/teams` | Paginated teams (?q, ?game, ?isDisbanded, ?page) |
| GET | `/admin/teams/:id` | Full team with populated roster |
| PATCH | `/admin/teams/:id` | Update team fields |
| POST | `/admin/teams/:id/disband` | Disband team |
| DELETE | `/admin/teams/:id/members/:memberId` | Remove member from roster |
| POST | `/admin/teams/:id/transfer-captain` | Transfer leadership |
| **Coaching** | | |
| GET | `/admin/coaching/coaches` | Paginated coaches (?q, ?game, ?isActive, ?page) |
| GET | `/admin/coaching/coaches/:id` | Full coach profile |
| PATCH | `/admin/coaching/coaches/:id` | Update coach fields |
| POST | `/admin/coaching/coaches/:id/verify` | Verify coach |
| POST | `/admin/coaching/coaches/:id/suspend` | Suspend coach |
| DELETE | `/admin/coaching/coaches/:id` | Delete coach (forces suspend if has orders) |
| GET | `/admin/coaching/orders` | Coaching orders (?status, ?page) |
| PATCH | `/admin/coaching/orders/:id` | Update order status |
| GET | `/admin/coaching/reviews` | Coaching reviews (?rating, ?page) |
| DELETE | `/admin/coaching/reviews/:id` | Delete review (recalcs coach stats) |
| **Store** | | |
| GET | `/admin/store/items` | Store items (including inactive) |
| POST | `/admin/store/items` | Create item |
| PATCH | `/admin/store/items/:id` | Update item |
| POST | `/admin/store/items/:id/disable` | Disable item |
| DELETE | `/admin/store/items/:id` | Delete item (forces disable if has orders) |
| GET | `/admin/store/orders` | Store orders (?status, ?page) |
| PATCH | `/admin/store/orders/:id` | Update order status |
| GET | `/admin/store/coupons` | Coupons |
| POST | `/admin/store/coupons` | Create coupon |
| PATCH | `/admin/store/coupons/:id` | Update coupon |
| DELETE | `/admin/store/coupons/:id` | Delete coupon |
| GET | `/admin/store/revenue` | Revenue stats |
| **Premium** | | |
| GET | `/admin/premium/members` | Premium members (?q, ?expiringWithin, ?page) |
| POST | `/admin/premium/grant` | Grant premium (userId, durationDays, reason) |
| POST | `/admin/premium/revoke/:userId` | Revoke premium |
| GET | `/admin/premium/plans` | Premium plans |
| POST | `/admin/premium/plans` | Create plan |
| PATCH | `/admin/premium/plans/:id` | Update plan |
| DELETE | `/admin/premium/plans/:id` | Delete plan |
| GET | `/admin/premium/stats` | Premium stats |
| **Wallet** | | |
| GET | `/admin/wallet/transactions` | All transactions (?type, ?currency, ?status, ?userId, ?page) |
| GET | `/admin/wallet/withdrawals` | Withdrawals (?status, ?page) |
| POST | `/admin/wallet/withdrawals/:id/approve` | Approve withdrawal |
| POST | `/admin/wallet/withdrawals/:id/deny` | Deny withdrawal with reason |
| GET | `/admin/wallet/deposits` | Deposits (?page) |
| GET | `/admin/wallet/prize-claims` | Prize claims (?status, ?page) |
| GET | `/admin/wallet/summary` | Wallet circulation summary |
| **Support** | | |
| GET | `/admin/support` | Tickets (?status, ?department, ?urgent, ?claimedBy, ?page) |
| GET | `/admin/support/stats` | Ticket stats |
| POST | `/admin/support/:id/assign` | Assign ticket to admin |
| **Live Chat** | | |
| GET | `/admin/live-chat/queue` | Queued sessions |
| GET | `/admin/live-chat/active` | Active sessions |
| GET | `/admin/live-chat/history` | Closed sessions (?page, ?category) |
| GET | `/admin/live-chat/stats` | Live chat stats |
| POST | `/admin/live-chat/:sessionId/claim` | Claim session |
| POST | `/admin/live-chat/:sessionId/message` | Send message |
| POST | `/admin/live-chat/:sessionId/close` | Close session |
| POST | `/admin/live-chat/:sessionId/transfer` | Transfer to another admin |
| **Games** | | |
| GET | `/admin/games` | All games (including inactive) |
| POST | `/admin/games` | Create game |
| PATCH | `/admin/games/:id` | Update game |
| POST | `/admin/games/:id/disable` | Disable game |
| DELETE | `/admin/games/:id` | Delete game (forces disable if has matches) |
| POST | `/admin/games/:id/migrate-slug` | Migrate old slug/name to current game (updates matches, ladders, teams, gameStats, favoriteGame) |
| **Ladders** | | |
| GET | `/admin/ladders` | Ladders (?game, ?status, ?page) |
| POST | `/admin/ladders` | Create ladder |
| PATCH | `/admin/ladders/:id` | Update ladder |
| POST | `/admin/ladders/:id/disable` | Archive ladder |
| DELETE | `/admin/ladders/:id` | Delete ladder (forces archive if has matches) |
| POST | `/admin/ladders/:id/reset-season` | Reset season (archive standings, increment) |
| **Badges** | | |
| GET | `/admin/badges` | All badges (including inactive) |
| POST | `/admin/badges` | Create badge |
| PATCH | `/admin/badges/:id` | Update badge |
| POST | `/admin/badges/:id/disable` | Disable badge |
| DELETE | `/admin/badges/:id` | Delete badge (forces disable if users earned it) |
| POST | `/admin/badges/award` | Award badge to user |
| **Announcements** | | |
| GET | `/admin/announcements` | All announcements |
| POST | `/admin/announcements` | Create announcement (optional notification broadcast) |
| PATCH | `/admin/announcements/:id` | Update announcement |
| DELETE | `/admin/announcements/:id` | Delete announcement |
| **Player of the Week** | | |
| GET | `/admin/player-of-week/candidates` | Weekly candidates ranked by match wins (aggregated from Match model) |
| GET | `/admin/player-of-week/candidates/:userId/matches` | Review candidate's weekly matches |
| POST | `/admin/player-of-week/select` | Select POTW (grants 7-day premium + badge + notification) |
| GET | `/admin/player-of-week/history` | POTW history with premium/badge status |
| DELETE | `/admin/player-of-week/:id` | Remove POTW entry |
| **Tournaments** | | |
| GET | `/admin/tournaments` | Tournaments (?status, ?game, ?page) |
| GET | `/admin/tournaments/:id` | Full tournament detail |
| POST | `/admin/tournaments` | Create tournament |
| PATCH | `/admin/tournaments/:id` | Update tournament |
| DELETE | `/admin/tournaments/:id` | Delete tournament (blocked if live) |
| **Analytics** | | |
| GET | `/admin/analytics` | Summary stats (?period) |
| GET | `/admin/analytics/revenue` | Revenue time series |
| GET | `/admin/analytics/user-growth` | Registration time series |
| GET | `/admin/analytics/match-volume` | Match volume time series |
| GET | `/admin/analytics/top-earners` | Top 10 users by earnings |
| GET | `/admin/analytics/top-games` | Games ranked by match count |
| GET | `/admin/analytics/coaching-stats` | Coaching revenue/orders/ratings |
| **Forum Boards** | | |
| GET | `/admin/forum/boards` | All boards |
| POST | `/admin/forum/boards` | Create board |
| PATCH | `/admin/forum/boards/:id` | Update board |
| DELETE | `/admin/forum/boards/:id` | Delete board |
| **Messages** | | |
| GET | `/admin/messages/user/:userId` | User's conversations |
| GET | `/admin/messages/conversation/:id` | Full message history |
| DELETE | `/admin/messages/:msgId` | Delete message |

### Teams (`teams/`)
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/teams` | — | List all teams |
| GET | `/teams/mine` | JWT | Get my teams |
| GET | `/teams/:slug` | — | Get team by slug |
| POST | `/teams` | JWT | Create team |
| PATCH | `/teams/:id` | JWT | Update team |
| DELETE | `/teams/:id/members/:memberId` | JWT | Kick member |
| DELETE | `/teams/:id/leave` | JWT | Leave team |
| DELETE | `/teams/:id` | JWT | Disband team |

### Matches (`matches/`)
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/matches/open/:gameSlug` | — | Open listings for a game |
| GET | `/matches/open/team/:teamId` | JWT | Team's open listings |
| POST | `/matches/listing` | JWT | Post match listing |
| GET | `/matches/team/:teamId/live` | — | Get live match for team |
| GET | `/matches/team/:teamId` | — | Team's match history |
| GET | `/matches/:matchId` | — | Get single match |
| POST | `/matches` | JWT | Create match (system) |
| POST | `/matches/:matchId/accept` | JWT | Accept listing |
| POST | `/matches/:matchId/ready` | JWT | Ready up |
| POST | `/matches/:matchId/cancel` | JWT | Cancel listing |
| POST | `/matches/:matchId/cancel-request` | JWT | Request cancellation |
| POST | `/matches/:matchId/chat` | JWT | Send chat message |
| POST | `/matches/:matchId/result` | JWT | Submit result |
| POST | `/matches/:matchId/dispute` | JWT | Dispute result |
| POST | `/matches/:matchId/feedback` | JWT | Submit feedback (1-5 star) |
| POST | `/matches/recalculate-ranks` | JWT | Recalculate all game + global ranks (admin) |

### Tournaments (`tournaments/`)
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/tournaments` | — | List tournaments (filter: game, status, search) |
| GET | `/tournaments/:slug` | — | Get tournament by slug |
| POST | `/tournaments` | JWT | Create tournament (admin) |
| POST | `/tournaments/:id/register` | JWT | Register for tournament |

### Ladders (`ladders/`)
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/ladders` | — | List ladders (filter: game, type) |
| GET | `/ladders/game/:gameSlug` | — | Ladders for a game |
| GET | `/ladders/:slug` | — | Get ladder by slug |
| POST | `/ladders` | JWT | Create ladder (admin) |
| POST | `/ladders/:id/join` | JWT | Join ladder |

### Forum (`forum/`)
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/forum/boards` | — | All boards |
| GET | `/forum/boards/:slug` | — | Board by slug |
| GET | `/forum/boards/:slug/threads` | — | Threads in board (sort, search, page) |
| GET | `/forum/threads/:id` | — | Thread with posts (paginated) |
| GET | `/forum/threads/:id/related` | — | Related threads |
| GET | `/forum/hot` | — | Hot threads |
| GET | `/forum/stats` | — | Forum statistics |
| GET | `/forum/recent-activity` | — | Recent activity |
| GET | `/forum/top-posters` | — | Top posters |
| POST | `/forum/threads` | JWT | Create thread |
| POST | `/forum/threads/:id/posts` | JWT | Create post |
| POST | `/forum/threads/:id/subscribe` | JWT | Subscribe to thread |
| POST | `/forum/threads/:id/bookmark` | JWT | Bookmark thread |
| POST | `/forum/posts/:id/react` | JWT | React to post |
| PATCH | `/forum/threads/:id` | JWT | Update thread (pin/lock/move) |
| DELETE | `/forum/threads/:id` | Admin | Delete thread |
| POST | `/forum/posts/:id/report` | JWT | Report post |
| POST | `/forum/posts/:id/dismiss-report` | Admin | Dismiss report |
| PATCH | `/forum/posts/:id` | JWT | Edit post |
| DELETE | `/forum/posts/:id` | Admin | Delete post |
| GET | `/forum/admin/reports` | Admin | Reported posts |
| GET | `/forum/admin/threads` | Admin | Search/manage threads |

### Coaching (`coaching/`)
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/coaching/coaches` | — | Browse coaches (filter: game, type, price, online) |
| GET | `/coaching/coaches/:slug` | — | Coach profile |
| GET | `/coaching/coaches/:slug/reviews` | — | Coach reviews (paginated) |
| POST | `/coaching/hire` | JWT | Hire coach |
| GET | `/coaching/my-orders` | JWT | Buyer's orders |
| POST | `/coaching/review` | JWT | Submit review |
| GET | `/coaching/dashboard/profile` | JWT | Get coach's own profile |
| GET | `/coaching/dashboard/orders` | JWT | Coach's orders |
| POST | `/coaching/dashboard/profile` | JWT | Update coach profile (bio, allowCustomRequests, gameSlugs) |
| POST | `/coaching/dashboard/bio` | JWT | Update coach bio |
| POST | `/coaching/dashboard/custom-offer` | JWT | Create custom offer |
| POST | `/coaching/dashboard/packages` | JWT | Add package |
| POST | `/coaching/dashboard/packages/:id` | JWT | Update package |
| POST | `/coaching/orders/approve` | JWT | Buyer confirms completion (sets buyerConfirmed=true) |
| POST | `/coaching/orders/revision` | JWT | Buyer requests revision (resets both confirmations) |
| POST | `/coaching/orders/cancel` | JWT | Buyer cancels pending order |
| POST | `/coaching/dashboard/orders/accept` | JWT | Coach accepts order (holds buyer's funds in escrow) |
| POST | `/coaching/dashboard/orders/reject` | JWT | Coach rejects order (decrements totalOrders) |
| POST | `/coaching/dashboard/orders/deliver` | JWT | Coach delivers order |
| POST | `/coaching/dashboard/orders/confirm-completion` | JWT | Coach confirms completion (sets coachConfirmed=true) |

### Store (`store/`)
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/store/items` | — | List store items (filter: category) |
| GET | `/store/items/:slug` | — | Item by slug |
| GET | `/store/coupon/:code` | — | Validate coupon |
| POST | `/store/checkout` | JWT | Create order/checkout |
| GET | `/store/orders` | JWT | User's orders |
| GET | `/store/orders/stats` | JWT | Order statistics |
| POST | `/store/webhook/stripe` | — | Stripe webhook |

### Wallet (`wallet/`)
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/wallet/balance` | JWT | Get balance (credits + cash) |
| GET | `/wallet/transactions` | JWT | Transaction history (filter: currency, type, page) |
| POST | `/wallet/deposit` | JWT | Create deposit intent |
| POST | `/wallet/withdraw` | JWT | Request withdrawal |
| GET | `/wallet/prize-claims` | JWT | Tournament prize claims |
| POST | `/wallet/prize-claims/:id/claim` | JWT | Claim prize |

### Notifications (`notifications/`)
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/notifications` | JWT | Get all notifications |
| GET | `/notifications/unread-count` | JWT | Unread count |
| POST | `/notifications/mark-all-read` | JWT | Mark all read |
| PATCH | `/notifications/:id/read` | JWT | Mark one read |

### Mailbox (`mailbox/`)
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/mailbox` | JWT | Get conversations |
| GET | `/mailbox/unread` | JWT | Unread count |
| GET | `/mailbox/:id` | JWT | Get messages (paginated) |
| POST | `/mailbox` | JWT | Start conversation |
| POST | `/mailbox/:id/reply` | JWT | Reply |
| PATCH | `/mailbox/messages/:msgId` | JWT | Edit message |
| DELETE | `/mailbox/:id` | JWT | Delete conversation |

### Invites (`invites/`)
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/invites` | JWT | Pending invites |
| GET | `/invites/count` | JWT | Pending count |
| GET | `/invites/sent` | JWT | Sent invites |
| POST | `/invites` | JWT | Send invite |
| POST | `/invites/:id/respond` | JWT | Accept/decline |
| DELETE | `/invites/:id` | JWT | Cancel invite |

### Badges (`badges/`)
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/badges` | — | All available badges |
| GET | `/badges/my` | JWT | User's earned badges |
| GET | `/badges/my/recent` | JWT | Recently earned |

### Leaderboards (`leaderboards/`)
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/leaderboards` | — | Leaderboard (tab, region, game, page) |
| GET | `/leaderboards/filters` | — | Filter options |
| GET | `/leaderboards/top3` | — | Top 3 players |

### Games (`games/`)
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/games` | — | All games |
| GET | `/games/:slug` | — | Game by slug |
| GET | `/games/:slug/ladders` | — | Ladders for game |

### Level Rewards (`level-rewards/`)
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/level-rewards/me` | JWT | My level rewards |
| GET | `/level-rewards/crate-pool/:crateType` | JWT | Crate pool |
| POST | `/level-rewards/:id/claim` | JWT | Claim reward |

### Support (`support/`)
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/support` | JWT | Create ticket |
| GET | `/support/mine` | JWT | My tickets |
| GET | `/support/admin/open` | JWT | Open tickets (admin) |
| POST | `/support/admin/:ticketId/claim` | JWT | Claim ticket (admin) |
| GET | `/support/:ticketId` | JWT | Ticket details |
| POST | `/support/:ticketId/message` | JWT | Add message |
| POST | `/support/:ticketId/close` | JWT | Close ticket |
| POST | `/support/:ticketId/reopen` | JWT | Reopen ticket |
| POST | `/support/request-staff` | JWT | Request staff (creates LiveChatSession for admin live chat) |
| GET | `/support/live-chat/mine` | JWT | Get user's active/queued live chat session |
| POST | `/support/live-chat/:sessionId/message` | JWT | User sends message to their live chat session |

### Player of the Week (`player-of-week/`)
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/player-of-week/current` | — | Current player of week |
| GET | `/player-of-week/recent` | — | Recent picks |
| GET | `/player-of-week/:weekKey` | — | Player by week |
| POST | `/player-of-week/set` | JWT | Set player (admin) |

---

## Database Schemas (Key Fields)

### User
`backend/src/users/schemas/user.schema.ts`

| Category | Fields |
|----------|--------|
| **Identity** | `username`, `slug`, `email`, `passwordHash`, `displayName`, `firstName`, `lastName`, `platformId` (`GH-XXXXXXXXXX`, unique, auto-generated, never changes) |
| **Profile** | `bio`, `avatarUrl`, `bannerUrl`, `avatarEmoji`, `usernameColor` (#E74C3C default), `country`, `state`, `location`, `timezone`, `dob`, `phone` |
| **Roles** | `role` (admin/member — base role), `isPremium` (bool), `premiumExpiresAt`, `isCoach` (bool), `isVerified`, `isBanned`, `bannedReason` — display role derived: admin > premium > coach > member |
| **Presence** | `isOnline`, `presenceStatus` (online/idle/offline), `activityText`, `lastActiveAt`, `lastSeen` |
| **Finances** | `credits`, `cashBalance`, `lifetimeEarnings`, `heldBalance`, `pendingPayout`, `paypalEmail`, `stripeCustomerId` |
| **XP/Level** | `level`, `xp`, `xpToNextLevel`, `doubleXpTokens`, `xpBoostMultiplier`, `xpBoostExpiresAt` |
| **Stats** | `wins`, `losses`, `draws`, `winStreak`, `bestWinStreak`, `totalMatches`, `totalWagered`, `totalWon`, `totalWinnings`, `tournamentWins`, `disputesWon`, `reputation` (0-100), `globalRank`, `rankTrend` |
| **Social** | `friends[]`, `friendRequests[]`, `blockedUsers[]`, `teams[]`, `forumPosts`, `discordMsgs` |
| **Trophies** | `goldTrophies`, `silverTrophies`, `bronzeTrophies` |
| **Gamertags** | `psnId`, `xboxGamertag`, `steamId`, `epicId`, `activisionId`, `riotId`, `battlenetId`, `nintendoId`, `gamertags[]`, `socials[]` |
| **Favorites** | `favoriteBadges[]`, `favoriteFriends[]`, `favoriteTeams[]`, `featuredVods[]` |
| **Badges** | `badgesEarned[]`, `badgesEarnedAt[]` |
| **Prefs** | `notifications` (Record of `{type}_inApp` / `{type}_email` booleans), `privacy` ({profilePublic, showWinRate, showEarnings}), `allowCompete`, `allowEmails` |
| **OAuth** | `linkedPlatforms[]` |
| **Auth Tokens** | `verifyToken`, `verifyTokenExpiry`, `resetToken`, `resetTokenExpiry`, `emailVerified` |

**Virtuals:** `winRate`, `profileUrl`, `xpNext`, `rep`, `matchWins`

### Team
`backend/src/teams/schemas/team.schema.ts`

| Category | Fields |
|----------|--------|
| **Identity** | `name`, `slug`, `emoji`, `bio`, `bannerColor`, `bannerUrl`, `logoUrl` |
| **Game** | `game`, `gameSlug`, `gameEmoji`, `matchType` (cash/xp), `ladder` |
| **Roster** | `members[]` (User refs), `maxMembers` (5), `roster[]` (role/joinedAt), `captainId`, `isRecruiting` |
| **Stats** | `wins`, `losses`, `draws`, `xp`, `cashEarned`, `winStreak`, `bestWinStreak`, `ladderRank`, `currentRank` |
| **Trophies** | `trophiesGold`, `trophiesSilver`, `trophiesBronze` |
| **Socials** | `twitchUrl`, `twitterUrl`, `youtubeUrl`, `discordUrl` |
| **Meta** | `isPremiumTeam`, `isDisbanded`, `matchHistory[]`, `seasons[]` |

**Roster enrichment:** `findBySlug` enriches each roster member with per-game stats from `UserGameStats` (keyed by team's `gameSlug`). Roster `wins`/`losses`/`trophies` = game-specific (0 if no `UserGameStats` record exists for that game, NOT global fallback). Also includes `gameRank`, `gameXp`, `gameWins`, `gameLosses`.

**Team trophy display:** Frontend sums all roster members' per-game trophies (not team document's own trophies).

**Virtuals:** `winRate`, `record`, `cashDisplay`

### Match
`backend/src/matches/schemas/match.schema.ts`

| Category | Fields |
|----------|--------|
| **Identity** | `matchId` (unique), `matchType` (cash/xp), `format`, `bestOf`, `gamemode`, `assignedMap`, `assignedMaps[]`, `assignedGamemode` |
| **Teams** | `teamAId`, `teamAName`, `teamAEmoji`, `teamASlug`, `teamAPlayers[]` — same for teamB |
| **Game** | `game`, `gameSlug`, `ladder`, `ladderId`, `ladderName` |
| **Money** | `wagerPerPlayer`, `totalPot`, `platformFee`, `winnerPayout`, `isPremium` |
| **XP** | `xpWin`, `xpLoss` |
| **Status** | `status` (open/pending/accepted/live/completed/disputed/cancelled/expired) |
| **Result** | `winnerId`, `winnerName`, `result`, `scoreA`, `scoreB`, `maps[]`, `completedAt` |
| **Ready** | `readyStatus` ({teamAReady, teamBReady, readyDeadline}) |
| **Reports** | `teamAReport`, `teamBReport`, `resultReportDeadline` |
| **Feedback** | `feedbackFromA`, `feedbackFromB`, `teamARep`, `teamBRep` |
| **Dispute** | `isDisputed`, `disputeReason`, `disputeOpenedBy`, `resolvedAt` |
| **Chat** | `chat[]` (sender, text, timestamp) |
| **Cancel** | `cancelRequests[]`, `message` |
| **Tournament** | `tournamentId`, `tournamentRound`, `bracketSlug` — when `tournamentId` is set, `completeMatch` skips competitive stats (team XP/W-L, game stats, rank recalc, profile W-L) |
| **Schedule** | `scheduleType`, `scheduledAt` |

### Tournament
`backend/src/tournaments/schemas/tournament.schema.ts`

| Category | Fields |
|----------|--------|
| **Identity** | `name`, `slug`, `game`, `gameEmoji`, `bannerUrl`, `accentColor` |
| **Format** | `bracketType` (Single/Double Elim), `entryType` (solo/team/both — deprecated, always team flow), `format`, `series`, `minTeamSize`, `maxTeamSize` |
| **Registration** | `maxTeams`, `registeredCount`, `registeredEntries[]` (team/user + seed), `entryCredits` |
| **Prizes** | `prizePool`, `prizePoolType` (cash/credits/other), `prizePoolLabel`, `prizes[]` (placement + amount + label) |
| **Schedule** | `startDate`, `startTime`, `checkIn`, `startAt`, `schedule[]` |
| **Status** | `status` (draft/open/checkin/live/completed/cancelled) |
| **Bracket** | `bracketJson`, `matchIds[]` |
| **Meta** | `region`, `platform`, `rules[]`, `isFeatured`, `createdBy` |

**Virtuals:** `spotsLeft`, `fillPercent`, `prizeDisplay`

### Notification
`backend/src/notifications/schemas/notification.schema.ts`

Fields: `userId`, `type`, `icon` (emoji), `text`, `link`, `read` (bool)

### Admin Schemas

| Schema | File | Key Fields |
|--------|------|-----------|
| **AuditLog** | `admin/schemas/audit-log.schema.ts` | `adminId`, `adminName`, `action`, `targetType`, `targetId`, `details` (mixed), `ip`, `createdAt` |
| **Announcement** | `admin/schemas/announcement.schema.ts` | `title`, `message`, `type` (info/warning/maintenance/event), `icon`, `createdBy`, `isActive`, `expiresAt`, `pinned` |
| **LiveChatSession** | `admin/schemas/live-chat.schema.ts` | `sessionId`, `userId`, `username`, `adminId`, `adminName`, `status` (queued/active/closed), `category` (match/tournament/wager/premium/technical/general), `contextId`, `contextLabel`, `messages[]`, `rating`, `createdAt`, `claimedAt`, `closedAt` |
| **PremiumPlan** | `admin/schemas/premium-plan.schema.ts` | `name`, `slug`, `durationDays`, `price`, `priceDisplay`, `features[]`, `badge`, `isActive`, `sortOrder` |
| **Coupon** | `store/schemas/coupon.schema.ts` | `code` (unique, uppercase), `percent`, `maxUses`, `timesUsed`, `expiresAt`, `isActive` |

### Other Schemas (brief)

| Schema | File | Key Fields |
|--------|------|-----------|
| **Badge** | `badges/schemas/badge.schema.ts` | `slug`, `name`, `desc`, `img`, `rarity` (Common/Rare/Epic/Legendary), `category`, `trigger`, `threshold` |
| **Game** | `games/schemas/game.schema.ts` | `name`, `slug`, `bannerUrl`, `accentColor`, `platforms[]`, `modes[]`, `modeMapMatrix`, `genre`, `crossplay`, `gameIdLabel` |
| **Ladder** | `ladders/schemas/ladder.schema.ts` | `name`, `slug`, `game`, `type` (xp/cash), `teamSize`, `region`, `platform`, `currentSeason`, `prizePool`, `totalSlots`, `teamsJoined`, `standings[]`, `registeredTeams[]` |
| **Board** | `forum/schemas/board.schema.ts` | `slug`, `name`, `emoji`, `category`, `description`, `threadCount`, `postCount`, `sortOrder`, `postRoles[]` (roles allowed to create threads, empty=all), `viewRoles[]` (roles allowed to view board, empty=all) |
| **Thread** | `forum/schemas/thread.schema.ts` | `title`, `boardId`, `boardSlug`, `authorId`, `authorName`, `status` (open/locked), `isPinned`, `isHot`, `tags[]`, `replyCount`, `viewCount`, `subscribers[]`, `bookmarkedBy[]` |
| **Post** | `forum/schemas/post.schema.ts` | `threadId`, `boardId`, `authorId`, `content`, `postNumber`, `quote`, `reactions[]`, `isEdited`, `isReported`, `reports[]` |
| **Conversation** | `mailbox/schemas/conversation.schema.ts` | `participants[]`, `participantIds[]`, `lastMessage`, `unreadCounts`, `subject`, `isSystem` |
| **MailMessage** | `mailbox/schemas/mail-message.schema.ts` | `conversationId`, `senderId`, `senderName`, `body`, `readBy[]`, `editedAt` |
| **Invite** | `invites/schemas/invite.schema.ts` | `teamId`, `teamName`, `game`, `mode`, `type` (Wager/Tournament/XP), `leaderId`, `recipientId`, `status`, `expiresAt` |
| **CoachProfile** | `coaching/schemas/coach-profile.schema.ts` | `userId`, `slug`, `displayName`, `title`, `bio`, `gameSlug`, `gameSlugs[]`, `specialties[]`, `packages[]`, `ratingSum`, `reviewCount`, `totalOrders`, `totalEarned`, `allowCustomRequests`, `accentColor` |
| **CoachingOrder** | `coaching/schemas/coaching-order.schema.ts` | `orderId`, `coachId`, `buyerId`, `packageTitle`, `packageType`, `price`, `deliveryDays`, `status`, `buyerConfirmed`, `coachConfirmed`, `isReviewed` |
| **CoachReview** | `coaching/schemas/coach-review.schema.ts` | `coachId`, `buyerId`, `orderId`, `rating` (1-5), `text` |
| **StoreItem** | `store/schemas/store-item.schema.ts` | `name`, `slug`, `category` (Credits/Premium/Apparel/Bundles), `price`, `creditsGranted`, `premiumDays`, `image` |
| **Order** | `store/schemas/order.schema.ts` | `orderId`, `userId`, `items[]`, `subtotal`, `discount`, `total`, `couponCode`, `paymentMethod`, `stripePaymentIntentId`, `status` |
| **Transaction** | `wallet/schemas/transaction.schema.ts` | `user`, `type` (deposit/withdrawal/match_win/match_loss/wager_hold/match_refund/admin_adjustment/coaching_hold/coaching_payment/coaching_refund/etc.), `currency` (credits/cash), `amount`, `balanceBefore`, `balanceAfter`, `description`, `status` |
| **PrizeClaim** | `wallet/schemas/prize-claim.schema.ts` | `user`, `tournamentId`, `placement`, `prizeAmount`, `status` (ready/claimed/expired) |
| **SupportTicket** | `support/schemas/support-ticket.schema.ts` | `ticketId`, `userId`, `department`, `subject`, `urgent`, `status` (open/claimed/closed), `claimedBy`, `messages[]` |
| **LevelReward** | `level-rewards/schemas/level-reward.schema.ts` | `userId`, `level`, `track` (regular/premium), `rewardType`, `rewardLabel`, `status` (claimable/claimed), `crateResult` |
| **PlayerOfWeek** | `player-of-week/schemas/player-of-week.schema.ts` | `weekKey`, `userId`, `username`, `weeklyWins`, `weeklyLosses`, `rank`, `level`, `isManualPick`, `premiumGranted`, `badgeGranted`, `pickedBy`. Compound unique index `{weekKey, gameSlug}`. Helper fns: `getCurrentWeekKey()`, `getCurrentWeekBounds()` |
| **UserGameStats** | `users/schemas/user-game-stats.schema.ts` | `userId`, `gameSlug`, `gameName`, `competitiveXp`, `wins`, `losses`, `draws`, `winStreak`, `bestWinStreak`, `gameRank`, `goldTrophies`, `silverTrophies`, `bronzeTrophies` — unique per user+game |

---

## Frontend Pages

Frontend root: `frontend/app/`

| Route | Page | Description |
|-------|------|-------------|
| `/` | Homepage | Hero, stats counters, featured tournaments, games grid, leaderboards, streamers |
| `/about` | About | About GamerHead |
| `/careers` | Careers | Jobs page |
| `/rules` | Rules | Rules, FAQ, legal |
| `/premium` | Premium | Membership marketing with pricing tiers |
| `/auth/forgot-password` | Forgot Password | Email input → reset link |
| `/auth/reset-password` | Reset Password | Token-based password reset |
| `/auth/verify-email` | Verify Email | Email verification landing |
| `/dashboard` | Dashboard | Account hub — invites, teams, badges, credits, level rewards |
| `/settings` | Settings | Account info, features (premium perks), linked accounts, notifications prefs, security (role toggles removed — admin manages roles) |
| `/profile/[slug]` | Profile | Public profile — stats, badges, presence, activity, friends, teams |
| `/games` | Games | Game catalog with genre filters |
| `/games/[slug]` | Game Detail | Game page with ladders |
| `/teams` | Teams | Teams listing |
| `/teams/[slug]` | Team Detail | Team profile, roster, stats, match history |
| `/matches/cash/[matchId]` | Cash Match | Match detail — ready-up, chat, result reporting, dispute |
| `/matches/xp/[matchId]` | XP Match | Same as cash but no wager flow |
| `/tournaments` | Tournaments | Tournament catalog with filters |
| `/tournaments/[id]` | Tournament Detail | Bracket, registration, schedule, prizes |
| `/tournaments/[id]/matches/[matchId]` | Tournament Match | Match within a tournament |
| `/leaderboards` | Leaderboards | Rankings by region/game/stat (Wins/Cash/XP/Trophies), per-game filtering via UserGameStats aggregation |
| `/forum` | Forum | Boards, categories, hot threads, stats, thread status legend in right sidebar, role badges on recent activity, board permission filtering |
| `/forum/board/[slug]` | Board | Thread listing with sort/search |
| `/forum/board/[slug]/[threadId]` | Thread | Posts, reactions, quoting, reporting |
| `/coaching` | Coaching | Browse coaches with filters (game via `gameSlugs[]`, service type, price, online). Game filter checks both legacy `gameSlug` and new `gameSlugs` array |
| `/coaching/[coachSlug]` | Coach Profile | Coach details, packages, reviews, custom request modal. Own-profile hides hire/message buttons. No inline bio edit (uses dashboard modal) |
| `/coaching/dashboard` | Coach Dashboard | Coach's orders, packages, reviews, Edit Profile modal (bio, games multi-select, custom requests toggle) |
| `/store` | Store | Items, cart, checkout (Stripe/PayPal) |
| `/orders` | Orders | Purchase history |
| `/wallet` | Wallet | Balance, deposit, withdraw, prize claims, transactions |
| `/mailbox` | Mailbox | Conversations + friends panel (presence dots) |
| `/invites` | Invites | Team invites (sent + received) |
| `/support` | Support | Create/view support tickets + Live Support button (opens LiveChatSession with department selection + real-time chat view) |

### Admin Pages (`frontend/app/admin/`)

| Route | Page | Description |
|-------|------|-------------|
| `/admin` | Dashboard Home | 8 stat cards, recent activity, quick actions |
| `/admin/users` | Users List | Search/filter, role badges, ban/unban toggle |
| `/admin/users/[id]` | User Detail | Tabs: Overview (identity/stats/platforms/forum stats), Wallet, Matches, Teams, Badges. Change Role modal: base role (Member/Admin) + Premium/Coach checkboxes |
| `/admin/matches` | Matches | Status/game/type filters, dispute resolution, cancel, adjust result |
| `/admin/teams` | Teams | Search (by name or ID)/game/type (cash/xp)/tournament/disbanded filters, roster view, disband, transfer captain |
| `/admin/coaching` | Coaching | Tabs: Coaches (verify/suspend), Orders (status), Reviews (delete) |
| `/admin/store` | Store | Tabs: Items (CRUD), Orders, Coupons (CRUD), Revenue |
| `/admin/premium` | Premium | Tabs: Members (grant/revoke), Plans (CRUD), Stats |
| `/admin/wallet` | Wallet | Tabs: Overview, Transactions, Withdrawals, Deposits, Prize Claims |
| `/admin/live-chat` | Live Chat | Priority-sorted queue (tournament > wager > match > premium > technical > general), priority tags (HIGH/MED/LOW), category labels, time-waiting, active sessions, chat window, claim/close/transfer |
| `/admin/support` | Support | Stats, filters, ticket list, assign |
| `/admin/games` | Games | Card view, CRUD with modes/maps editor, migrate old slug tool, recalculate ranks button |
| `/admin/ladders` | Ladders | List, CRUD, season reset |
| `/admin/badges` | Badges | Visual grid by rarity, CRUD, award to user |
| `/admin/announcements` | Announcements | Create/edit/delete, toggle active, notification broadcast |
| `/admin/player-of-week` | POTW | Weekly candidates table (ranked by match wins), REVIEW modal (match details), SELECT (premium + badge + notification), SKIP, consecutive-winner prevention, enhanced history with premium/badge status |
| `/admin/analytics` | Analytics | Period stats, charts, top earners/games |
| `/admin/audit-log` | Audit Log | Filterable admin action history |
| `/admin/forum` | Forum | Board management + report/thread moderation, board permissions (postRoles/viewRoles) |
| `/admin/tournaments` | Tournaments | CRUD, status management, featured toggle |

### Admin Shared Components (`frontend/app/admin/components/`)
- `AdminSidebar.tsx` — Fixed sidebar with sections + active state
- `DataTable.tsx` — Reusable table with column defs, pagination
- `ActionBtn.tsx` — Button with color variants + sizes (sm/md/lg)
- `Modal.tsx` — Overlay modal for forms/confirmations
- `SearchFilter.tsx` — Search bar + filter dropdowns
- `StatCard.tsx` — Metric card with icon, label, value
- `Pagination.tsx` — Page/total display + prev/next

### Key Components (`frontend/app/components/`)
- `AuthModal.tsx` — Login/Register modal with email verification
- `DashSidebar.tsx` — Navigation sidebar for dashboard pages
- `AcceptMatchModal.tsx` — Accept match challenge (shows wager breakdown: per-player, total pot, winner payout for cash matches)
- `PostMatchModal.tsx` — Post-match result submission
- `GameMatchesTab.tsx` — Match listings for a game (shows wager amount on cash match cards)
- `CrateOpening.tsx` — Animated crate opening for level rewards

---

## Frontend API Client

**File:** `frontend/lib/api.ts`
**Base URL:** `NEXT_PUBLIC_API_URL` (default `http://localhost:3001`)

All authenticated calls attach `Authorization: Bearer {token}` from `localStorage.ce_token`.

| Client Object | Methods |
|----------------|---------|
| `authApi` | `register`, `login`, `me`, `verifyEmail`, `forgotPassword`, `resetPassword`, `changePassword` |
| `usersApi` | `getMe`, `updateMe`, `changeName`, `checkNameAvailability`, `changeNameColor`, `redeem2xp`, `sendFriendRequest`, `getFriendRequests`, `acceptFriend`, `declineFriend`, `removeFriend`, `getFriends`, `getBySlug`, `getProfile`, `toggleRole`, `search` |
| `gamesApi` | `getAll`, `getBySlug`, `getLadders` |
| `laddersApi` | `getAll`, `getByGame`, `getBySlug`, `create`, `join` |
| `teamsApi` | `getAll`, `getMine`, `getBySlug`, `create`, `update`, `leave`, `removeMember`, `delete` |
| `matchesApi` | `getById`, `getByTeam`, `getLive`, `create`, `sendChat`, `submitResult`, `dispute`, `submitFeedback`, `getOpenByGame`, `getOpenByTeam`, `createListing`, `accept`, `cancelListing`, `readyUp`, `requestCancel`, `recalculateRanks` |
| `tournamentsApi` | `getAll`, `getBySlug`, `create`, `register` |
| `walletApi` | `getBalance`, `getTransactions`, `deposit`, `withdraw`, `getPrizeClaims`, `claimPrize` |
| `storeApi` | `getItems`, `getItem`, `checkCoupon`, `checkout`, `getOrders`, `getOrderStats` |
| `forumApi` | `getBoards`, `getBoard`, `getThreads`, `getThread`, `getHot`, `getStats`, `getRecentActivity`, `getTopPosters`, `createThread`, `createPost`, `reactToPost`, `subscribeThread`, `bookmarkThread`, `getRelatedThreads`, `reportPost`, `dismissReport`, `getAdminReports`, `getAdminThreads`, `moveThread`, `updateThread`, `deleteThread`, `updatePost`, `deletePost` |
| `coachingApi` | `getCoaches`, `getCoach`, `getCoachReviews`, `getReviewDistribution`, `hire`, `getMyOrders`, `submitReview`, `getBuyerOrders`, `approveDelivery`, `requestRevision`, `cancelOrder`, `getDashboardProfile`, `getDashboardOrders`, `updateCoachProfile`, `sendCustomOffer`, `addPackage`, `updatePackage`, `acceptOrder`, `rejectOrder`, `deliverOrder` |
| `invitesApi` | `getMyInvites`, `getCount`, `getSent`, `send`, `respond`, `cancel` |
| `leaderboardsApi` | `get`, `getFilters`, `getTop3` |
| `mailboxApi` | `getThreads`, `getUnread`, `getMessages`, `send`, `reply`, `deleteThread`, `editMessage` |
| `notificationsApi` | `getAll`, `getUnreadCount`, `markAllRead`, `markRead` |
| `supportApi` | `create`, `getMine`, `getTicket`, `sendMessage`, `close`, `reopen`, `requestStaff`, `getMyLiveChat`, `sendLiveChatMessage` |
| `badgesApi` | `getAll`, `getMy`, `getMyRecent` |
| `levelRewardsApi` | `getMine`, `getCratePool`, `claim` |
| `linkedAccountsApi` | `getRedirectUrl`, `unlink`, `getLinked` |
| `powApi` | `getCurrent`, `getRecent`, `getByWeek` |
| `adminApi` | `getStats`, `getAuditLog`, `getUsers`, `getUser`, `updateUser`, `banUser`, `unbanUser`, `walletAdjust`, `awardBadge`, `resetPassword`, `verifyEmail`, `setRole` (accepts `{role, isPremium, isCoach}`), `getMatches`, `getMatch`, `resolveDispute`, `cancelMatch`, `adjustResult`, `getTeams`, `getTeam`, `updateTeam`, `disbandTeam`, `removeTeamMember`, `transferCaptain`, `getCoaches`, `getCoach`, `updateCoach`, `verifyCoach`, `suspendCoach`, `deleteCoach`, `getCoachingOrders`, `updateCoachingOrder`, `getCoachingReviews`, `deleteCoachingReview`, `getStoreItems`, `createStoreItem`, `updateStoreItem`, `disableStoreItem`, `deleteStoreItem`, `getStoreOrders`, `updateStoreOrder`, `getCoupons`, `createCoupon`, `updateCoupon`, `deleteCoupon`, `getStoreRevenue`, `getPremiumMembers`, `grantPremium`, `revokePremium`, `getPremiumPlans`, `createPremiumPlan`, `updatePremiumPlan`, `deletePremiumPlan`, `getPremiumStats`, `getTransactions`, `getWithdrawals`, `approveWithdrawal`, `denyWithdrawal`, `getDeposits`, `getPrizeClaims`, `getWalletSummary`, `getLiveChatQueue`, `getLiveChatActive`, `getLiveChatHistory`, `getLiveChatStats`, `claimLiveChat`, `transferLiveChat`, `sendLiveChatMessage`, `closeLiveChat`, `getAllTickets`, `getTicketStats`, `assignTicket`, `getGames`, `createGame`, `updateGame`, `disableGame`, `deleteGame`, `migrateGameSlug`, `getLadders`, `createLadder`, `updateLadder`, `disableLadder`, `deleteLadder`, `resetLadderSeason`, `getBadges`, `createBadge`, `updateBadge`, `disableBadge`, `deleteBadge`, `awardBadgeToUser`, `getForumBoards`, `createBoard`, `updateBoard`, `deleteBoard`, `getAnnouncements`, `createAnnouncement`, `updateAnnouncement`, `deleteAnnouncement`, `getPOTWCandidates`, `getPOTWHistory`, `deletePOTW`, `getAnalytics`, `getRevenueChart`, `getUserGrowth`, `getMatchVolume`, `getTopEarners`, `getTopGames`, `getCoachingStats`, `getUserMessages`, `getConversation`, `deleteMessage`, `getTournaments`, `getTournament`, `createTournament`, `updateTournament`, `deleteTournament`, `getNotifications`, `getNotificationStats`, `getInvites`, `getLevelRewards`, `getUserGameStats` |

---

## Auth System

**File:** `frontend/lib/auth-context.tsx`

### AuthUser (fields available from context)
```
id, slug, username, email, usernameColor, avatarUrl, bannerUrl,
level, xp, xpToNextLevel, reputation, credits, cashBalance,
isPremium, premiumExpiresAt, isCoach, isVerified, role,
friends[], friendRequests[], notifications{}, privacy{}
```

### Context Methods
- `login(identifier, password)` — POST `/auth/login`, stores token as `ce_token`
- `register(username, email, password)` — POST `/auth/register`
- `logout()` — Clears token + disconnects socket
- `refresh()` — Re-fetches `/auth/me`
- `clearError()` — Clears error state

### Flow
1. On app load: check `localStorage.ce_token` → call `/auth/me` → populate user
2. On login: receive JWT → store in localStorage → call `/auth/me` → connect socket
3. On logout: clear localStorage → disconnect socket → redirect

---

## WebSocket / Real-Time

**File:** `frontend/lib/socket.ts`
**Backend:** `backend/src/notifications/notifications.gateway.ts`

### Connection
- URL: `NEXT_PUBLIC_API_URL` with `auth.token` in handshake
- Server verifies JWT on connect, maps `userId → Socket[]`

### Events

| Direction | Event | Payload | Purpose |
|-----------|-------|---------|---------|
| Client → Server | `heartbeat` | `{ status: 'online'|'idle', activity?: string }` | Presence keepalive (every 60s) |
| Client → Server | `activity` | `{ text: string }` | Activity text update ("Browsing Forum", etc.) |
| Server → Client | `notification` | `{ _id, type, icon, text, link, read, createdAt }` | Real-time notification push |

### Presence Logic
- **Connect:** `isOnline=true`, `presenceStatus='online'`, `lastActiveAt=now`
- **Heartbeat:** Updates `lastActiveAt`, `presenceStatus`, optionally `activityText`
- **Disconnect (last socket):** `isOnline=false`, `presenceStatus='offline'`, `activityText=''`
- **Idle Detection (frontend):** `visibilitychange` → after 5min hidden → `sendHeartbeat('idle')`

### Activity Text Broadcasts
Pages call `sendActivity(text)` on mount:
- Forum: "Browsing Forum"
- Thread: "Reading Thread"
- Mailbox: "Messaging"
- Cash/XP Match: "In a Match"
- Profile: "Viewing Profile"
- Store: "Browsing Store"

---

## Design System

| Token | Value |
|-------|-------|
| **Background** | `#0B0B12` (page), `#13131E` (cards/panels) |
| **Accent Red** | `#e8000d` (buttons, brand) |
| **Accent Gold** | `#F0AA1A` (stats, highlights, idle dots) |
| **Text Primary** | `#e0e0e0` |
| **Text Muted** | `#888` / `#666` |
| **Border** | `rgba(255,255,255,0.06)` |
| **Fonts** | Barlow (body), Rajdhani (headings) |
| **Presence Dots** | Online `#4ade80`, Idle `#F0AA1A`, Offline `#4A5568` |
| **Styling** | Inline styles (no CSS modules), dark theme throughout |

### Admin Design Tokens
| Token | Value |
|-------|-------|
| **Card** | `#13131E` bg, `rgba(255,255,255,.06)` border, `12px` radius |
| **Section Headers** | Rajdhani 12px, 800 weight, `#8890A4`, uppercase, 1px letter-spacing |
| **Field Labels** | Rajdhani 11px, 700 weight, `#4F5568`, uppercase |
| **Field Values** | Rajdhani 13px, 700 weight, `#DDE0EA` |
| **Role Badge Colors** | Admin `#e8000d`, Premium `#f59e0b`, Coach `#a855f7`, Member `#8890A4` |
| **Badge Rarity Colors** | Common `#6b7280`, Rare `#3b82f6`, Epic `#a855f7`, Legendary `#f59e0b` |
| **Status Colors** | Active `#22c55e`, Banned `#e8000d`, Disputed `#e8000d`, Live `#22c55e`, Pending `#f59e0b` |
| **ActionBtn Sizes** | sm: 9px/3px 8px, md: 11px/6px 14px, lg: 13px/9px 20px |

---

## Environment Variables

### Backend (`backend/.env`)
| Variable | Description |
|----------|-------------|
| `MONGODB_URI` | MongoDB connection string |
| `JWT_SECRET` | JWT signing secret |
| `APP_URL` | Frontend URL (for email links) |
| `RESEND_API_KEY` | Resend email service API key |
| `MAIL_FROM` | Sender email address |
| `STRIPE_SECRET_KEY` | Stripe secret key |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook signing secret |
| `PAYPAL_CLIENT_ID` | PayPal client ID |
| `PAYPAL_CLIENT_SECRET` | PayPal secret |

### Frontend (`frontend/.env.local`)
| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_API_URL` | Backend API base URL (default `http://localhost:3001`) |
