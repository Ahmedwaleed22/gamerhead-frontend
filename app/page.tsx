'use client'

import { useState } from 'react'
import Link from 'next/link'

const stats = [
  { icon: '🎮', value: '+50,000', label: 'Simultaneous Players' },
  { icon: '⚔️', value: '2,942,000', label: 'Matches Played' },
  { icon: '🚫', value: '+10,000', label: 'Banished Players' },
  { icon: '📣', value: '+100,000', label: 'On Our Social Networks' },
  { icon: '💰', value: '$912,312', label: 'Premium Paid' },
  { icon: '🏆', value: '+1,000', label: 'Active Tournaments' },
]

const tournaments = [
  { emoji: '🎯', time: 'Feb 27, 1:00 AM EST', name: 'Call of Duty CUP #03', region: 'North America', mode: '4v4', slots: 32, filled: 60, prize: '$5,000' },
  { emoji: '⚽', time: 'Feb 28, 3:00 PM EST', name: 'EA FC Championship #07', region: 'Cross-Platform', mode: '1v1', slots: 64, filled: 80, prize: '$2,500' },
  { emoji: '🔫', time: 'Mar 1, 6:00 PM EST', name: 'Fortnite Open #12', region: 'North America', mode: 'Solo', slots: 100, filled: 45, prize: '$10,000' },
  { emoji: '🎮', time: 'Mar 2, 8:00 PM EST', name: 'Warzone Invitational', region: 'Cross-Platform', mode: '3v3', slots: 24, filled: 90, prize: '$3,000' },
]

const games = [
  { emoji: '🔫', title: 'Call of Duty' },
  { emoji: '⚽', title: 'FIFA / EA FC' },
  { emoji: '🎯', title: 'Fortnite' },
  { emoji: '💣', title: 'Warzone' },
  { emoji: '🏎️', title: 'Rocket League' },
  { emoji: '🎮', title: 'More Games' },
]

const streamers = [
  { name: 'ProSniper99', title: 'COD WARZONE — WAGER MATCH LIVE', game: 'Call of Duty: Warzone', views: '24,871', tags: ['FPS', 'Shooter'] },
  { name: 'GoalKing07', title: 'FIFA 25 — RANKED TOURNAMENT', game: 'EA FC 25', views: '8,432', tags: ['Sports'] },
  { name: 'FortKing', title: 'FORTNITE — $500 WAGER MATCH', game: 'Fortnite', views: '15,209', tags: ['BR', 'Solo'] },
  { name: 'IceWarden', title: 'WARZONE — TEAM LADDER MATCH', game: 'Warzone', views: '6,711', tags: ['FPS', 'Team'] },
]

const leaderboards = [
  {
    title: 'Tournament Wins', subtitle: 'in any game',
    players: [
      { name: 'ProSniper99', level: 47, wins: 297, xp: 92 },
      { name: 'ShadowBlade', level: 38, wins: 241, xp: 83 },
      { name: 'GoalKing07', level: 35, wins: 198, xp: 81 },
      { name: 'FortKing', level: 29, wins: 172, xp: 78 },
      { name: 'IceWarden', level: 27, wins: 143, xp: 73 },
    ],
    statLabel: 'Wins', isMoney: false,
  },
  {
    title: 'Match Wins', subtitle: 'in any game',
    players: [
      { name: 'GhostRider', level: 52, wins: 891, xp: 87 },
      { name: 'NightHawk', level: 44, wins: 744, xp: 83 },
      { name: 'ProSniper99', level: 47, wins: 701, xp: 81 },
      { name: 'ZeroX', level: 40, wins: 633, xp: 79 },
      { name: 'Vortex', level: 33, wins: 512, xp: 75 },
    ],
    statLabel: 'Wins', isMoney: false,
  },
  {
    title: 'Highest Earnings', subtitle: 'all time',
    players: [
      { name: 'ProSniper99', level: 47, wins: 12400, xp: 95 },
      { name: 'GhostRider', level: 52, wins: 9800, xp: 88 },
      { name: 'ShadowBlade', level: 38, wins: 7200, xp: 72 },
      { name: 'FortKing', level: 29, wins: 5500, xp: 55 },
      { name: 'NightHawk', level: 44, wins: 4100, xp: 41 },
    ],
    statLabel: 'Earned', isMoney: true,
  },
]

const heroSlides = [
  { title: 'The Future of', highlight: 'Competitive', sub: 'Gaming starts here.' },
  { title: 'Win Real', highlight: 'Cash', sub: 'in wager matches and tournaments.' },
  { title: 'Rise Up The', highlight: 'Ladder', sub: "and prove you're the best." },
  { title: 'Build Your', highlight: 'Team', sub: 'and dominate together.' },
]

export default function HomePage() {
  const [activeSlide, setActiveSlide] = useState(0)

  return (
    <>
      {/* ── HERO ── */}
      <div className="hero-section">
        <div className="hero-bg-pattern" />
        <div className="hero-glow" />
        <div className="container" style={{ width: '100%' }}>
          <div className="hero-content">
            <div className="hero-badge">
              <span>🔴</span> Live Tournaments Running Now
            </div>
            <h1 className="hero-title">
              {heroSlides[activeSlide].title}{' '}
              <span>{heroSlides[activeSlide].highlight}</span>
            </h1>
            <p className="hero-subtext">
              {heroSlides[activeSlide].sub}<br />
              Join thousands of players competing for real cash prizes across
              Call of Duty, Fortnite, FIFA and more.
            </p>
            <div className="hero-buttons">
              <Link href="/register" className="btn-primary">Register for Free</Link>
              <Link href="/tournaments" className="btn-secondary">Our Championships</Link>
            </div>
            <div className="carousel-dots">
              {heroSlides.map((_, i) => (
                <button
                  key={i}
                  className={`carousel-dot${activeSlide === i ? ' active' : ''}`}
                  onClick={() => setActiveSlide(i)}
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="container">

        {/* ── STATS ── */}
        <section className="stats-section">
          <div className="stats-grid">
            {stats.map((s, i) => (
              <div className="stat-card" key={i}>
                <div style={{ fontSize: 28, marginBottom: 8 }}>{s.icon}</div>
                <div className="stat-value">{s.value}</div>
                <div className="stat-label">{s.label}</div>
              </div>
            ))}
          </div>
        </section>

        {/* ── FEATURED TOURNAMENTS ── */}
        <section className="tournaments-section">
          <div className="section-header">
            <h2 className="section-title">Featured <span>Tournaments</span></h2>
            <p className="section-subtitle">Compete for real cash prizes — pick your game, platform, and enter today.</p>
          </div>
          <div className="tournaments-grid">
            {tournaments.map((t, i) => (
              <div className="tournament-card" key={i}>
                <div className="tournament-card-header">
                  <div className="tournament-card-header-placeholder">{t.emoji}</div>
                </div>
                <div className="tournament-card-body">
                  <div className="tournament-meta-row">
                    <div className="tournament-game-icon">{t.emoji}</div>
                    <div>
                      <div className="tournament-time">{t.time}</div>
                      <div className="tournament-name">{t.name}</div>
                    </div>
                  </div>
                  <div className="progress-bar-wrapper">
                    <div className="progress-bar-fill" style={{ width: `${t.filled}%` }} />
                  </div>
                  <div className="tournament-footer">
                    <div className="tournament-footer-info">
                      {t.region} · {t.mode} · {t.slots} slots
                    </div>
                    <div className="tournament-prize">{t.prize}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── GAMES ── */}
        <section className="games-section">
          <div className="section-header">
            <h2 className="section-title">Search <span>Games</span></h2>
            <p className="section-subtitle">Compete across the biggest titles in esports</p>
          </div>
          <div className="games-grid">
            {games.map((g, i) => (
              <div className="game-card" key={i}>
                <div className="game-card-image">{g.emoji}</div>
                <div className="game-card-overlay">
                  <div className="game-card-title">{g.title}</div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── CTA BANNER ── */}
        <div className="cta-section">
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
        </div>

        {/* ── STREAMERS ── */}
        <section className="streamers-section">
          <div className="section-header">
            <h2 className="section-title">Our <span>Streamers</span></h2>
            <p className="section-subtitle">Watch live and receive prizes</p>
          </div>
          <div className="streamers-grid">
            {streamers.map((s, i) => (
              <div className="streamer-card" key={i}>
                <div className="streamer-card-header">
                  <div style={{ fontSize: 40 }}>📺</div>
                  <div className="live-badge">
                    <span className="live-dot" /> Live
                  </div>
                </div>
                <div className="streamer-card-body">
                  <div className="streamer-name">{s.name}</div>
                  <div className="streamer-title">{s.title}</div>
                  <div className="streamer-game">Game: {s.game}</div>
                  <div className="streamer-footer">
                    <span className="streamer-views">{s.views} viewers</span>
                    <div className="streamer-tags">
                      {s.tags.map((tag, j) => (
                        <span className="streamer-tag" key={j}>{tag}</span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── LEADERBOARD ── */}
        <section className="leaderboard-section">
          <div className="section-header">
            <h2 className="section-title">Player of the <span>Week</span></h2>
            <p className="section-subtitle">Top players across all games this week</p>
          </div>
          <div className="leaderboard-grid">
            {leaderboards.map((board, bi) => (
              <div className="leaderboard-card" key={bi}>
                <div className="leaderboard-card-header">
                  <span style={{ fontSize: 24 }}>🥇</span>
                  <div>
                    <div className="leaderboard-card-title">{board.title}</div>
                    <div className="leaderboard-card-subtitle">{board.subtitle}</div>
                  </div>
                </div>
                {board.players.map((p, pi) => (
                  <div className="leaderboard-row" key={pi}>
                    <div className={`leaderboard-rank${pi === 0 ? ' top1' : pi === 1 ? ' top2' : pi === 2 ? ' top3' : ''}`}>
                      {pi + 1}
                    </div>
                    <div className="player-avatar-wrapper">
                      <div className="player-avatar" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>
                        👤
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
              </div>
            ))}
          </div>
        </section>

      </div>
    </>
  )
}
