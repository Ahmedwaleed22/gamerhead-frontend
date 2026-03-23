import React from 'react'
import Link from 'next/link'
import { Icon } from "@iconify/react"
import { HoverCard } from './HoverCard'

const tournaments = [
  { image: '/games/warzone.png', tag: 'Warzone', name: 'Call of Duty Warzone Open Series', date: 'Registration Starts 27th Feb 2026', organizer: 'GamerHead' },
  { image: '/games/rocketleague.png', tag: 'Rocket League', name: 'Rocket League 3v3 Weekly Cup', date: 'Registration Starts 2nd Mar 2026', organizer: 'GamerHead' },
  { image: '/games/fc26.png', tag: 'EA FC 26', name: 'EA FC Championship #07', date: 'Registration Starts 28th Feb 2026', organizer: 'GamerHead' },
]

export default function LandingPageTournamentsSection() {
  return (
    <section className="tournaments-section">
      <div className="section-header">
        <h2 className="section-title">Featured <span>Tournaments</span></h2>
        <p className="section-subtitle">Compete for real cash prizes — pick your game, platform, and enter today.</p>
      </div>
      <div className="tournaments-grid">
        {tournaments.map((t, i) => (
          <HoverCard className="tournament-card" key={i} delay={i * 0.1}>
            <div className="tournament-card-header">
              <img src={t.image} alt={t.tag} className="tournament-card-header-img" />
              <div className="tournament-featured-badge">Featured</div>
            </div>
            <div className="tournament-card-body">
              <div className="tournament-game-tag">{t.tag}</div>
              <div className="tournament-name">{t.name}</div>
              <div className="tournament-date-row">
                <Icon icon="mdi:calendar-blank-outline" width="18" />
                {t.date}
              </div>
              <div className="tournament-organizer-row">
                <span>Tournament By</span>
                <div className="tournament-organizer-logo">
                   <Icon icon="mdi:shield-cross" width="18" /> {t.organizer}
                </div>
              </div>
              <Link href={`/tournaments/${i}`} className="tournament-action-btn">
                Registration Open
              </Link>
            </div>
          </HoverCard>
        ))}
      </div>
    </section>
  )
}
