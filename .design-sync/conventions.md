# GamerHead — building with this design system

GamerHead is a dark, competitive-gaming/esports UI. The design language lives in
**CSS custom properties + a vocabulary of semantic global classes**, applied via
`className` strings — NOT through styling props. Most branded components also use
inline `style` for layout. Read `styles.css` (and its `@import "./_ds_bundle.css"`
closure) before styling anything; per-component API is in each
`components/<group>/<Name>/<Name>.d.ts` and usage in `<Name>.prompt.md`.

## Tokens (CSS variables — use `var(--…)`)
- Brand red: `--red` (#e8000d), `--red-dark`, `--red-glow`. The single accent color.
- Surfaces (dark, layered): `--bg` (#0D121B, page), `--bg-2`, `--bg-3`, `--bg-4`
  (cards / hovers / insets, progressively lighter).
- Text: `--text` (#f0f0f0), `--text-muted` (#888), `--text-dim`.
- Lines: `--border` (rgba(255,255,255,0.08)).

## Fonts
- `'Barlow Condensed'` — all display/headings. Use **uppercase**, weight 800–900,
  tight letter-spacing. This is the signature look.
- `'Barlow'` — body/UI text.
- `'Rajdhani'` — small labels, stat numbers, pills.
(Loaded via a remote Google Fonts `@import` already in the stylesheet.)

## Semantic classes (apply via className — these carry the design)
- Buttons: `.btn-primary` (solid red CTA), `.btn-secondary` (outline).
- Section heads: `.section-title` (+ `<span>` inside goes red), `.section-subtitle`.
- Cards: `.tournament-card`, `.game-card`, `.leaderboard-card`, `.stat-card` —
  dark `--bg-2` cards with `--border`, red-tinted hover lift.
- Hero: `.hero-title`, `.hero-badge`, `.hero-buttons`.
- Misc: `.live-badge` (pulsing red LIVE chip), `.container` (max-width 1400 wrapper).
Compose layout with these plus a few utility classes; do NOT invent new class names
— if a piece needs new styling, write inline `style` like the components do.

## Tailwind note
Tailwind v4 utilities work, but the shadcn color tokens (`bg-primary`,
`text-muted-foreground`, …) are NOT wired into `@theme`, so they render unstyled.
Style with the `var(--…)` tokens and semantic classes above instead.

## Providers
Components that read auth/toast context (`Username`, `AuthModal`, `DashSidebar`,
`MatchesTab`, `PostMatchModal`) must be wrapped once near the root in
`<AuthProvider>` (and `<ToastProvider>` for toasts). Leaf/display components
(`GameCard`, `FriendsBadge`, `Logo`, `Footer`, `Header`, `SimpleTrophyIcon`,
the `LandingPage*` sections) need no wrapper.

## Idiomatic snippet
```tsx
import { GameCard, FriendsBadge } from 'frontend'

export function Showcase() {
  return (
    <section className="container" style={{ background: 'var(--bg)', padding: '40px 0' }}>
      <h2 className="section-title">Featured <span>Games</span></h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginTop: 20 }}>
        <GameCard game={{ slug: 'warzone', name: 'Call of Duty: Warzone', genre: 'FPS', activeLadders: 12, platformType: 'crossplay' }} />
      </div>
      <a className="btn-primary" href="#" style={{ marginTop: 24 }}>Register for Free</a>
    </section>
  )
}
```
