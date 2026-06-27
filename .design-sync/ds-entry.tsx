// Hand-written design-system barrel for /design-sync (synth-entry replacement).
//
// Why this file exists: the repo is a Next.js app, not a packaged library, so
// there is no `dist` entry. The converter's automatic synth-entry uses
// `export * from <file>`, which by ESM rules does NOT re-export `default`
// exports — and most of these components are `export default`. Re-exporting
// every component as a NAMED export here makes esbuild's IIFE assign each one
// onto `window.GamerHead.*`, which the preview cards and the design agent need.
//
// `componentSrcMap` in config.json decides which of these become cards; the
// extra named exports below (helpers, compound sub-parts, providers) stay in
// the bundle so the full API is available even without a dedicated card.

// Runs FIRST — defines `process` for the browser before any app module loads.
import './_ds-process-shim'

// ── UI primitives (shadcn-style) ──────────────────────────────────────────
export { Button, buttonVariants } from '@/components/ui/button'
export {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselPrevious,
  CarouselNext,
  useCarousel,
} from '@/components/ui/carousel'
export {
  Table,
  TableHeader,
  TableBody,
  TableFooter,
  TableHead,
  TableRow,
  TableCell,
  TableCaption,
} from '@/components/ui/table'

// ── Brand / display ───────────────────────────────────────────────────────
export { default as AchievementBadge } from '@/components/AchievementBadge'
export { default as Footer } from '@/components/Footer'
export { FriendsBadge } from '@/components/FriendsBadge'
export { GameCard, platformColor, platformLabel } from '@/components/GameCard'
export { default as Header } from '@/components/Header'
export { HoverCard } from '@/components/HoverCard'
export { default as Logo } from '@/components/Logo'
export { SimpleTrophyIcon, TrophyIcon } from '@/components/simple-trophy-icon'
export { ToastProvider, useToast } from '@/components/Toast'
export { default as Username } from '@/components/Username'

// ── Landing sections ──────────────────────────────────────────────────────
export { default as LandingPageGamesSection } from '@/components/LandingPageGamesSection'
export { default as LandingPageStats } from '@/components/LandingPageStats'
export { default as LandingPageStreamersSection } from '@/components/LandingPageStreamersSection'
export { default as LandingPageTournamentsSection } from '@/components/LandingPageTournamentsSection'

// ── App components (modals, sidebar, editor, tabs) ────────────────────────
export { AcceptMatchModal } from '@/app/components/AcceptMatchModal'
export { default as AuthModal } from '@/app/components/AuthModal'
export { default as DashSidebar } from '@/app/components/DashSidebar'
export { MatchesTab } from '@/app/components/GameMatchesTab'
export { default as PostMatchModal } from '@/app/components/PostMatchModal'
export { RichEditor, RichContent } from '@/app/components/RichEditor'

// ── Providers (used to wrap context-dependent previews) ───────────────────
export { AuthProvider } from '@/lib/auth-context'
