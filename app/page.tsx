'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { Icon } from "@iconify/react";
import { motion } from "motion/react";
import LandingPageStats from '@/components/LandingPageStats'
import LandingPageGamesSection from '@/components/LandingPageGamesSection'
import LandingPageTournamentsSection from '@/components/LandingPageTournamentsSection'
import LandingPageStreamersSection from '@/components/LandingPageStreamersSection'
import { HoverCard } from '@/components/HoverCard'
import { useApi } from '@/lib/use-api'
import { leaderboardsApi } from '@/lib/api'
import FriendsBadge from '@/components/FriendsBadge';

type LeaderPlayer = {
  slug: string
  name: string
  level: number
  wins: number
  xp: number
  cash: string
  totalWinnings?: number
  profilePicture?: string | null
}

const LEADERBOARD_TABS = [
  {
    tab: 'trophies',
    title: 'Top Tournament Champions',
    subtitle: 'Globally Ranked',
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
        <path d="M7 2h10v2h3l-2 5h-1.5L18 4H6L7.5 9H6L4 4h3V2z" fill="currentColor"/>
        <path d="M8 4h8v6a4 4 0 01-8 0V4z" fill="currentColor"/>
        <rect x="10" y="14" width="4" height="4" fill="currentColor"/>
        <rect x="7" y="18" width="10" height="3" rx="1" fill="currentColor"/>
      </svg>
    ),
    statLabel: 'Victories',
    isMoney: false,
    getValue: (p: LeaderPlayer) => p.wins,
  },
  {
    tab: 'wins',
    title: 'Most Matches Won',
    subtitle: 'All Time',
    icon: <Icon icon="solar:gamepad-bold-duotone" width="28" height="28" />,
    statLabel: 'Matches',
    isMoney: false,
    getValue: (p: LeaderPlayer) => p.wins,
  },
  {
    tab: 'cash',
    title: 'Highest Earners',
    subtitle: 'All Time Legends',
    icon: <Icon icon="solar:wallet-money-bold-duotone" width="28" height="28" />,
    statLabel: 'Earned',
    isMoney: true,
    getValue: (p: LeaderPlayer) => p.cash,
  },
]

const heroSlides = [
  { title: 'The Future of', highlight: 'Competitive', sub: 'Gaming starts here.' },
  { title: 'Win Real', highlight: 'Cash Prizes', sub: 'in prize entry matches and tournaments.' },
  { title: 'Rise Up The', highlight: 'Ladder', sub: "and prove you're the best." },
  { title: 'Build Your', highlight: 'Dream Team', sub: 'and dominate together.' },
]

const SLIDE_INTERVAL = 4000

const HOW_STEPS = [
  { icon: 'solar:user-bold-duotone',          title: 'Create Your Account', desc: 'Sign up free in seconds — no buy-in, no catch. Verify and you’re ready to play.' },
  { icon: 'solar:gamepad-bold-duotone',       title: 'Pick Your Game',      desc: 'Choose from 30+ titles across PC, console and mobile. Your platform, your rules.' },
  { icon: 'solar:cup-star-bold-duotone',      title: 'Enter Matches',       desc: 'Jump into ladders, prize entry matches and cash tournaments the moment you’re in.' },
  { icon: 'solar:wallet-money-bold-duotone',  title: 'Win Real Cash',       desc: 'Climb the ranks, win your matches and cash out your winnings instantly.' },
]

const WHY_FEATURES = [
  { icon: 'solar:wallet-money-bold-duotone',        title: 'Instant Payouts',        desc: 'Cash out your winnings straight to your wallet — no waiting weeks to get paid.' },
  { icon: 'solar:shield-bold-duotone',              title: 'Anti-Cheat Protection',  desc: 'Verified results and active anti-cheat keep every single match fair and clean.' },
  { icon: 'solar:chart-2-bold-duotone',             title: 'Skill-Based Matchmaking',desc: 'Matched by rank and record, so every game you play actually counts for something.' },
  { icon: 'solar:chat-round-dots-bold-duotone',     title: '24/7 Live Support',      desc: 'Real people ready to help in any time zone, any day — never an automated wall.' },
  { icon: 'solar:gamepad-bold-duotone',             title: 'True Crossplay',         desc: 'Compete across PC, console and mobile on 30+ of the biggest competitive titles.' },
  { icon: 'solar:users-group-rounded-bold-duotone', title: 'Global Community',       desc: 'Join 50,000+ players competing for real cash around the world every single day.' },
]

const HOME_TESTIMONIALS = [
  { initial: 'R', color: '#e8000d', name: 'Ravyn', rank: 'Warzone · $4.2k won',       quote: 'Cashed out my first $200 the same night I won it. Payouts here are actually instant — no games.' },
  { initial: 'K', color: '#1f6feb', name: 'Kahlo', rank: 'EA FC · Diamond',           quote: 'Matchmaking finally feels fair. Every match is a real fight, not a one-sided stomp.' },
  { initial: 'M', color: '#8957e5', name: 'Mira',  rank: 'Fortnite · Team captain',   quote: 'Been on the other platforms — GamerHead’s payouts and support blow every one of them away.' },
]

export default function HomePage() {
  const [activeSlide, setActiveSlide] = useState(0)
  const [animating, setAnimating] = useState(false)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const { data: trophiesData } = useApi(() => leaderboardsApi.get({ tab: 'trophies', limit: 5 }))
  const { data: winsData }     = useApi(() => leaderboardsApi.get({ tab: 'wins',     limit: 5 }))
  const { data: cashData }     = useApi(() => leaderboardsApi.get({ tab: 'cash',     limit: 5 }))

  const leaderboardData = [
    (trophiesData as any)?.players ?? [],
    (winsData as any)?.players     ?? [],
    (cashData as any)?.players     ?? [],
  ]

  const startTimer = () => {
    if (timerRef.current) clearInterval(timerRef.current)
    timerRef.current = setInterval(() => {
      setAnimating(true)
      setTimeout(() => {
        setActiveSlide(prev => (prev + 1) % heroSlides.length)
        setAnimating(false)
      }, 300)
    }, SLIDE_INTERVAL)
  }

  const goToSlide = (index: number) => {
    if (animating || index === activeSlide) return
    setAnimating(true)
    setTimeout(() => {
      setActiveSlide(index)
      setAnimating(false)
    }, 300)
    startTimer()
  }

  useEffect(() => {
    startTimer()
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [])

  return (
    <>
      {/* ── HERO ── */}
      <div className="hero-section">
        <div className="hero-bg-pattern" />
        <div className="hero-glow" />
        <div className="container flex! flex-col! justify-center! items-center! relative!" style={{ width: '100%' }}>
          <motion.div
            className="hero-content max-w-5xl! w-full text-center"
            initial="hidden"
            animate="visible"
            variants={{
              hidden: { opacity: 0 },
              visible: { opacity: 1, transition: { staggerChildren: 0.15 } }
            }}
          >
            <motion.div
              className="hero-badge"
              variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }}
            >
              <span className="live-dot" style={{ background: 'var(--red)', boxShadow: '0 0 8px var(--red)' }} /> Live Tournaments Running Now
            </motion.div>
            <motion.div
              className="hero-text-area flex flex-col gap-2 items-center"
              variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }}
            >
              <h1
                className={`hero-title md:text-8xl! text-6xl! hero-slide-text${animating ? ' hero-slide-out' : ' hero-slide-in'}`}
              >
                {heroSlides[activeSlide].title}{' '}
                <span>{heroSlides[activeSlide].highlight}</span>
              </h1>
              <p
                className={`hero-subtext text-lg! hero-slide-text${animating ? ' hero-slide-out' : ' hero-slide-in'}`}
              >
                {heroSlides[activeSlide].sub}<br />
                Join thousands of players competing for real cash prizes across
                Call of Duty, Fortnite, FIFA and more.
              </p>
            </motion.div>
            <motion.div
              className="hero-buttons justify-center"
              variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }}
            >
              <Link href="/register" className="btn-primary">Register for Free</Link>
              <Link href="/tournaments" className="btn-secondary">Our Championships</Link>
            </motion.div>
            <motion.div
              className="carousel-dots justify-center"
              variants={{ hidden: { opacity: 0, scale: 0.8 }, visible: { opacity: 1, scale: 1 } }}
            >
              {heroSlides.map((_, i) => (
                <button
                  key={i}
                  className={`carousel-dot${activeSlide === i ? ' active' : ''}`}
                  onClick={() => goToSlide(i)}
                />
              ))}
            </motion.div>
          </motion.div>
        </div>
      </div>

      <div className="container">

        {/* ── STATS ── */}
        <LandingPageStats />

        {/* ── HOW IT WORKS ── */}
        <section className="how-section">
          <div className="section-header" style={{ textAlign: 'center', marginBottom: 44 }}>
            <h2 className="section-title">How It <span>Works</span></h2>
            <p className="section-subtitle">From sign-up to payout in four steps. No buy-in, real cash on the line.</p>
          </div>
          <div className="how-grid">
            {HOW_STEPS.map((s, i) => (
              <div className="how-step" key={i}>
                <span className="how-step-num">{i + 1}</span>
                <div className="how-step-icon"><Icon icon={s.icon} width={26} height={26} /></div>
                <h3 className="how-step-title">{s.title}</h3>
                <p className="how-step-desc">{s.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── FEATURED TOURNAMENTS ── */}
        <LandingPageTournamentsSection />

        {/* ── GAMES ── */}
        <LandingPageGamesSection />

        {/* ── WHY GAMERHEAD ── */}
        <section className="why-section">
          <div className="section-header" style={{ textAlign: 'center', marginBottom: 44 }}>
            <h2 className="section-title">Why <span>GamerHead</span></h2>
            <p className="section-subtitle">Built for competitors — fair, fast, and made to actually pay out.</p>
          </div>
          <div className="why-grid">
            {WHY_FEATURES.map((f, i) => (
              <div className="why-card" key={i}>
                <div className="why-icon"><Icon icon={f.icon} width={26} height={26} /></div>
                <div>
                  <h3 className="why-title">{f.title}</h3>
                  <p className="why-desc">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── CTA BANNER ── */}
        <HoverCard className="cta-section">
          <div className="cta-glow" />
          <div className="hero-badge max-w-42! flex! justify-center! mx-auto! mb-0!" style={{ marginBottom: 20 }}>
            <span className="live-dot" style={{ background: 'var(--red)', boxShadow: '0 0 8px var(--red)' }} /> Ready to Compete
          </div>
          <h2 className="cta-title mb-0!">The Future of <span>Competitive</span></h2>
          <p className="cta-subtitle">
            Join thousands of players already competing for real money —
            register free and start climbing the ranks today.
          </p>
          <div className="cta-buttons">
            <Link href="/register" className="btn-primary">Register for Free</Link>
            <Link href="/tournaments" className="btn-secondary">Our Championships</Link>
          </div>
          <div className="premium-hero-trust" style={{ justifyContent: 'center', marginTop: 24 }}>
            <Icon icon="solar:shield-bold-duotone" width={15} height={15} />
            50,000+ players · Free to join · Instant payouts
          </div>
        </HoverCard>

        {/* ── STREAMERS ── */}
        <LandingPageStreamersSection />

        {/* ── TESTIMONIALS ── */}
        <section style={{ padding: '64px 0' }}>
          <div className="section-header" style={{ textAlign: 'center', marginBottom: 44 }}>
            <h2 className="section-title">Trusted by <span>Players</span></h2>
            <p className="section-subtitle">Real competitors. Real payouts. Real stories.</p>
          </div>
          <div className="premium-testimonials">
            {HOME_TESTIMONIALS.map((t, i) => (
              <div className="premium-testimonial" key={i}>
                <div className="premium-testimonial-stars">
                  {Array.from({ length: 5 }).map((_, s) => (
                    <Icon key={s} icon="solar:star-bold-duotone" width={16} height={16} />
                  ))}
                </div>
                <p className="premium-testimonial-quote">&ldquo;{t.quote}&rdquo;</p>
                <div className="premium-testimonial-author">
                  <span className="premium-testimonial-avatar" style={{ background: t.color }}>{t.initial}</span>
                  <div>
                    <div className="premium-testimonial-name">{t.name}</div>
                    <div className="premium-testimonial-rank">{t.rank}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── LEADERBOARD ── */}
        <section className="leaderboard-section">
          <div className="section-header">
            <h2 className="section-title">Hall of <span>Fame</span></h2>
            <p className="section-subtitle">The most elite players dominating the leaderboards</p>
          </div>
          <div className="leaderboard-grid">
            {LEADERBOARD_TABS.map((board, bi) => {
              const players: LeaderPlayer[] = leaderboardData[bi] ?? []
              return (
                <HoverCard className="leaderboard-card" key={bi} delay={bi * 0.1}>
                  <div className="leaderboard-card-header">
                    <div className="leaderboard-icon-wrapper">
                      {board.icon}
                    </div>
                    <div>
                      <div className="leaderboard-card-title">{board.title}</div>
                      <div className="leaderboard-card-subtitle">{board.subtitle}</div>
                    </div>
                  </div>
                  {players.length === 0 && (
                    <div style={{ padding: '20px 0', color: 'var(--text-muted)', fontSize: 12, textAlign: 'center' }}>
                      No data yet. Be the first!
                    </div>
                  )}
                  {(() => {
                  const numericVal = (pl: LeaderPlayer) =>
                    board.isMoney
                      ? (pl.totalWinnings ?? (parseFloat(String(pl.cash).replace(/[^0-9.]/g, '')) || 0))
                      : pl.wins
                  const maxVal = Math.max(1, ...players.map(numericVal))
                  return players.map((p, pi) => {
                    const barPct = Math.round((numericVal(p) / maxVal) * 100)
                    const statVal = board.isMoney ? p.cash : p.wins
                    return (
                      <Link href={`/profile/${p.slug}`} key={pi} style={{ textDecoration: 'none' }}>
                        <div className="leaderboard-row">
                          <div className={`leaderboard-rank${pi === 0 ? ' top1' : pi === 1 ? ' top2' : pi === 2 ? ' top3' : ''}`}>
                            {pi === 0 ? (
                              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0 }}>
                                <path d="M7 2h10v2h3l-2 5h-1.5L18 4H6L7.5 9H6L4 4h3V2z" fill="#F0C040"/>
                                <path d="M8 4h8v6a4 4 0 01-8 0V4z" fill="#F0C040"/>
                                <rect x="10" y="14" width="4" height="4" fill="#F0C040"/>
                                <rect x="7" y="18" width="10" height="3" rx="1" fill="#F0C040"/>
                              </svg>
                            ) : pi + 1}
                          </div>
                          <div className="player-avatar-wrapper">
                            <div className="player-avatar" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', overflow: 'hidden' }}>
                              {p.profilePicture
                                ? <img src={p.profilePicture} alt={p.name} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />
                                : <Icon icon="solar:user-bold-duotone" width="24" height="24" />
                              }
                            </div>
                            <span className="player-level">{p.level}</span>
                          </div>
                          <div className="player-info">
                            <div className="player-name">{p.name}</div>
                            <div className="xp-bar-wrapper">
                              <div className="xp-bar-fill" style={{ width: `${barPct}%` }} />
                            </div>
                          </div>
                          <div className="player-stat">
                            <div className="player-stat-value">
                              {board.isMoney ? statVal : (statVal as number).toLocaleString()}
                            </div>
                            <div className="player-stat-label">{board.statLabel}</div>
                          </div>
                        </div>
                      </Link>
                    )
                  })
                  })()}
                </HoverCard>
              )
            })}
          </div>
        </section>

      </div>

      {/* ── FINAL CTA BAND ── */}
      <section className="premium-cta-band">
        <div className="container premium-cta-inner">
          <div className="premium-cta-glow" />
          <div className="hero-badge" style={{ marginBottom: 18 }}>
            <span className="live-dot" style={{ background: 'var(--red)', boxShadow: '0 0 8px var(--red)' }} /> Free to join
          </div>
          <h2 className="premium-cta-title">Your next match could <span>pay out</span></h2>
          <p className="premium-cta-sub">Join GamerHead free and start competing for real cash across your favorite titles today.</p>
          <div className="premium-cta-actions">
            <Link href="/register" className="btn-primary">Register for Free</Link>
            <Link href="/tournaments" className="btn-secondary">Browse Tournaments</Link>
          </div>
          <div className="premium-hero-trust" style={{ justifyContent: 'center', marginTop: 20 }}>
            <Icon icon="solar:shield-bold-duotone" width={15} height={15} />
            50,000+ players · Instant payouts · Secure &amp; verified
          </div>
        </div>
      </section>
    </>
  )
}
