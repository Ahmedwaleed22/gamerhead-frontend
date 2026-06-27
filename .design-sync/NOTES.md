# design-sync notes — GamerHead (frontend)

This repo is a **Next.js 16 application**, not a packaged design-system library.
There is no `dist`, no `package.json` exports, and no `.d.ts` tree. The sync is
adapted to that:

## Setup quirks
- **Hand-written barrel entry**: `.design-sync/ds-entry.tsx` re-exports every
  component as a NAMED export. The converter's automatic synth-entry uses
  `export * from`, which drops `default` exports — and most components here are
  `export default`. Build is run with `--entry .design-sync/ds-entry.tsx`.
- **Build tsconfig**: `.design-sync/tsconfig.build.json` adds `baseUrl: ".."`
  so esbuild resolves the `@/* → ./*` alias (the repo tsconfig omits baseUrl).
- **CSS is compiled, not raw**: components use Tailwind v4 utilities + custom
  tokens + ~3800 lines of semantic classes in `app/globals.css`. Raw globals.css
  has `@import "tailwindcss"` which won't resolve in the design runtime. So we
  compile it first (regenerate on every re-sync):
  ```
  node .ds-sync/node_modules/@tailwindcss/cli/dist/index.mjs \
    -i app/globals.css -o .design-sync/compiled.css
  ```
  `cfg.cssEntry` points at that compiled file. (`.design-sync/compiled.css` is
  gitignored — regenerate it before each build.)
- **Fonts**: Barlow / Barlow Condensed / Rajdhani load via a remote Google Fonts
  `@import` in globals.css (`[FONT_REMOTE]` — loads at runtime, nothing to ship).
- **Provider**: `cfg.provider` = `AuthProvider > ToastProvider` so components
  reading auth/toast context render instead of throwing.

## Component coupling (affects which render vs. floor-card)
- Cleanly renderable: Button, Carousel, Table, Footer, FriendsBadge, GameCard,
  HoverCard, Logo, AchievementBadge, SimpleTrophyIcon, ToastProvider,
  LandingPageStreamersSection.
- `useApi`-backed (render loading/empty state, no backend in preview):
  LandingPageStats (has fallbacks), LandingPageGamesSection, LandingPageTournamentsSection.
- Auth-context-backed (rescued by provider): Username, AuthModal, DashSidebar,
  MatchesTab, PostMatchModal.
- `next/navigation` (useRouter/usePathname — cannot be satisfied by a provider,
  likely floor-card): Header, and the router-using modals (AcceptMatchModal,
  PostMatchModal).

## Findings from the first sync
- **shadcn theme gap (action item for the repo)**: `components/ui/*` (Button,
  Table, Carousel) reference shadcn color tokens (`--primary`, `--muted`,
  `--border`, `--background`, …) that ARE defined in `:root` but are NEVER
  exposed to Tailwind v4 — there is no `@theme inline { --color-primary: var(--primary); … }`
  block in `globals.css`. So `bg-primary` / `text-muted-foreground` resolve to
  nothing and these components render unstyled / low-contrast. The user chose to
  **ship as-is** (match the current app). To fix later, add the `@theme inline`
  bridge to `globals.css` (themes the components everywhere) or only to the DS
  stylesheet. Until then: **Button is dropped to a floor card** (near-invisible);
  Table/Carousel kept as readable structural cards.
- **HoverCard can't be statically captured**: it hard-codes `initial opacity:0`
  + motion `whileInView`, and `package-capture` freezes the clock
  (`setFixedTime`), so the entrance animation never advances → blank card.
  Dropped to a floor card. (It DOES render inside larger trees, e.g. the
  Streamers section, where the validate render-check doesn't freeze the clock.)
- **Brand assets shipped**: `public/logo.png` + `public/images/` are copied into
  `ds-bundle/` AFTER each build (the build wipes the out dir) so preview cards
  show the real logo / sponsor logos. The heavy `public/store` (13M) and
  `public/games` (4.5M) are NOT shipped. GameCard previews omit `bannerUrl` to
  avoid depending on game art.
- **Authored previews (6, all graded good)**: GameCard, FriendsBadge,
  SimpleTrophyIcon, Username, Carousel, Table. The rest ship functional with
  floor cards or auto-renders (Footer/Header/DashSidebar/RichEditor and the
  Landing* sections render real content from a single mount).

## Known render warns
- `[RENDER_BLANK]` on Button / HoverCard floor cards is expected (see above) —
  they are unauthored floor cards by choice, not failures.

## Re-sync risks
- `.design-sync/compiled.css` is a build artifact — MUST be regenerated (command
  above) before each build, or CSS goes stale vs. the current globals.css.
- The barrel `ds-entry.tsx` must be kept in step with component renames/adds.
- `next/*` internals are bundled into the IIFE; a Next major bump can change what
  esbuild pulls in. Re-verify renders after a Next upgrade.
