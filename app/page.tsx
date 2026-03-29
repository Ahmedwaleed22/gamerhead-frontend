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
    icon: 'solar:cup-star-bold-duotone',
    statLabel: 'Victories',
    isMoney: false,
    getValue: (p: LeaderPlayer) => p.wins,
  },
  {
    tab: 'wins',
    title: 'Most Matches Won',
    subtitle: 'All Time',
    icon: 'solar:gamepad-bold-duotone',
    statLabel: 'Matches',
    isMoney: false,
    getValue: (p: LeaderPlayer) => p.wins,
  },
  {
    tab: 'cash',
    title: 'Highest Earners',
    subtitle: 'All Time Legends',
    icon: 'solar:wallet-money-bold-duotone',
    statLabel: 'Earned',
    isMoney: true,
    getValue: (p: LeaderPlayer) => p.cash,
  },
] as const

const heroSlides = [
  { title: 'The Future of', highlight: 'Competitive', sub: 'Gaming starts here.' },
  { title: 'Win Real', highlight: 'Cash Prizes', sub: 'in wager matches and tournaments.' },
  { title: 'Rise Up The', highlight: 'Ladder', sub: "and prove you're the best." },
  { title: 'Build Your', highlight: 'Dream Team', sub: 'and dominate together.' },
]

const SLIDE_INTERVAL = 4000

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
        <div className="container" style={{ width: '100%' }}>
          <motion.div 
            className="hero-content"
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
              <Icon icon="fluent:live-24-filled" width="20" height="20" /> Live Tournaments Running Now
            </motion.div>
            <motion.div 
              className="hero-text-area"
              variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }}
            >
              <h1
                className={`hero-title md:text-8xl! text-6xl! hero-slide-text${animating ? ' hero-slide-out' : ' hero-slide-in'}`}
              >
                {heroSlides[activeSlide].title}{' '}
                <span>{heroSlides[activeSlide].highlight}</span>
              </h1>
              <p
                className={`hero-subtext hero-slide-text${animating ? ' hero-slide-out' : ' hero-slide-in'}`}
              >
                {heroSlides[activeSlide].sub}<br />
                Join thousands of players competing for real cash prizes across
                Call of Duty, Fortnite, FIFA and more.
              </p>
            </motion.div>
            <motion.div 
              className="hero-buttons"
              variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }}
            >
              <Link href="/register" className="btn-primary">Register for Free</Link>
              <Link href="/tournaments" className="btn-secondary">Our Championships</Link>
            </motion.div>
            <motion.div 
              className="carousel-dots"
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

        {/* ── FEATURED TOURNAMENTS ── */}
        <LandingPageTournamentsSection />

        {/* ── GAMES ── */}
        <LandingPageGamesSection />

        {/* ── CTA BANNER ── */}
        <HoverCard className="cta-section">
          <div className="cta-glow" />
          <h2 className="cta-title">The Future of <span>Competitive</span></h2>
          <p className="cta-subtitle">
            Join thousands of players already competing for real money.
            Register for free and start climbing the ranks today.
          </p>
          <div className="cta-buttons">
            <Link href="/register" className="btn-primary">Register for Free</Link>
            <Link href="/tournaments" className="btn-secondary">Our Championships</Link>
          </div>
        </HoverCard>

        {/* ── STREAMERS ── */}
        <LandingPageStreamersSection />

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
                      <Icon icon={board.icon} width="28" height="28" />
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
                  {players.map((p, pi) => {
                    const xpPct = Math.min(100, Math.round((p.xp / Math.max(1, (p.xp + 5000))) * 100))
                    const statVal = board.isMoney ? p.cash : p.wins
                    return (
                      <Link href={`/profile/${p.slug}`} key={pi} style={{ textDecoration: 'none' }}>
                        <div className="leaderboard-row">
                          <div className={`leaderboard-rank${pi === 0 ? ' top1' : pi === 1 ? ' top2' : pi === 2 ? ' top3' : ''}`}>
                            {pi === 0 ? <Icon icon="solar:crown-bold-duotone" width="24" height="24" className="crown-icon" /> : pi + 1}
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
                              <div className="xp-bar-fill" style={{ width: `${xpPct}%` }} />
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
                  })}
                </HoverCard>
              )
            })}
          </div>
        </section>

      </div>
    </>
  )
}
