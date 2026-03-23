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

const leaderboards = [
  {
    title: 'Top Tournament Champions', subtitle: 'Globally Ranked',
    icon: 'solar:cup-star-bold-duotone',
    players: [
      { name: 'Astroyx', level: 94, wins: 412, xp: 88 },
      { name: 'KylianR', level: 89, wins: 384, xp: 65 },
      { name: 'Zenithi', level: 85, wins: 341, xp: 42 },
      { name: 'JukaZ', level: 81, wins: 298, xp: 76 },
      { name: 'M3rcy', level: 78, wins: 275, xp: 12 },
    ],
    statLabel: 'Victories', isMoney: false,
  },
  {
    title: 'Most Matches Won', subtitle: 'This Week',
    icon: 'solar:gamepad-bold-duotone',
    players: [
      { name: 'Slyxx', level: 76, wins: 124, xp: 92 },
      { name: 'Vortex', level: 72, wins: 118, xp: 45 },
      { name: 'Kraken', level: 68, wins: 105, xp: 33 },
      { name: 'Nimble', level: 64, wins: 92, xp: 87 },
      { name: 'Rin', level: 61, wins: 84, xp: 55 },
    ],
    statLabel: 'Matches', isMoney: false,
  },
  {
    title: 'Highest Earners', subtitle: 'All Time Legends',
    icon: 'solar:wallet-money-bold-duotone',
    players: [
      { name: 'Astroyx', level: 94, wins: 28500, xp: 88 },
      { name: 'JukaZ', level: 81, wins: 24200, xp: 76 },
      { name: 'KylianR', level: 89, wins: 19800, xp: 65 },
      { name: 'Zenithi', level: 85, wins: 15400, xp: 42 },
      { name: 'Slyxx', level: 76, wins: 11200, xp: 92 },
    ],
    statLabel: 'Earned', isMoney: true,
  },
]

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
            {leaderboards.map((board, bi) => (
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
                {board.players.map((p, pi) => (
                  <div className="leaderboard-row" key={pi}>
                    <div className={`leaderboard-rank${pi === 0 ? ' top1' : pi === 1 ? ' top2' : pi === 2 ? ' top3' : ''}`}>
                      {pi === 0 ? <Icon icon="solar:crown-bold-duotone" width="24" height="24" className="crown-icon" /> : pi + 1}
                    </div>
                    <div className="player-avatar-wrapper">
                      <div className="player-avatar" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
                        <Icon icon="solar:user-bold-duotone" width="24" height="24" />
                      </div>
                      <span className="player-level">{p.level}</span>
                    </div>
                    <div className="player-info">
                      <div className="player-name">{p.name}</div>
                      <div className="xp-bar-wrapper">
                        <div className="xp-bar-fill" style={{ width: `${p.xp}%` }} />
                      </div>
                    </div>
                    <div className="player-stat">
                      <div className="player-stat-value">
                        {board.isMoney ? `$${p.wins.toLocaleString()}` : p.wins}
                      </div>
                      <div className="player-stat-label">{board.statLabel}</div>
                    </div>
                  </div>
                ))}
              </HoverCard>
            ))}
          </div>
        </section>

      </div>
    </>
  )
}
