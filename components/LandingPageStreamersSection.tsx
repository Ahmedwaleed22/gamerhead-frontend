import React from 'react'
import { Icon } from "@iconify/react"
import Image from 'next/image'
import { HoverCard } from './HoverCard'

const streamers = [
  { name: 'PROSNIPER99', title: 'COD WARZONE — WAGER MATCH LIVE', game: 'Call of Duty: Warzone', views: '24,871', tags: ['FPS', 'SHOOTER'], image: '/games/warzone.png' },
  { name: 'GOALKING07', title: 'FIFA 25 — RANKED TOURNAMENT', game: 'EA FC 25', views: '8,432', tags: ['SPORTS'], image: '/games/fc26.png' },
  { name: 'FORTKING', title: 'FORTNITE — $500 WAGER MATCH', game: 'Fortnite', views: '15,209', tags: ['BR', 'SOLO'], image: '/games/fortnite.png' },
  { name: 'ICEWARDEN', title: 'WARZONE — TEAM LADDER MATCH', game: 'Warzone', views: '6,711', tags: ['FPS', 'TEAM'], image: '/games/warzone.png' },
]

export default function LandingPageStreamersSection() {
  return (
    <section className="streamers-section">
      <div className="section-header">
        <h2 className="section-title">Our <span>Streamers</span></h2>
        <p className="section-subtitle">Watch live and receive prizes</p>
      </div>
      <div className="streamers-grid">
        {streamers.map((s, i) => (
          <HoverCard className="streamer-card" key={i} delay={i * 0.1}>
            <div className="streamer-card-header h-46!">
              <div className="live-badge">
                <span className="live-dot" /> LIVE
              </div>
              <Image width={500} height={500} src={s.image} alt={s.game} className="streamer-card-bg" />
              <div className="streamer-play-btn bg-black/50 rounded-full w-10 h-10 flex items-center justify-center absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
                 <Icon icon="mdi:play" width="32" />
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
          </HoverCard>
        ))}
      </div>
    </section>
  )
}
