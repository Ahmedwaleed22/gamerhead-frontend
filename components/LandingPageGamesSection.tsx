import React from 'react'
import Link from 'next/link'
import { Icon } from "@iconify/react"
import { useApi } from '@/lib/use-api'
import { gamesApi } from '@/lib/api'
import { GameCard } from './GameCard'
import { HoverCard } from './HoverCard'

function LandingPageGamesSection() {
  const { data: games, loading, error } = useApi(() => gamesApi.getAll())
  const visible = (games || []).slice(0, 6)

  return (
    <section className="games-section" style={{ padding: '20px 0' }}>
      <div className="section-header section-header-row">
        <div>
          <h2 className="section-title">Browse <span>Games</span></h2>
          <p className="section-subtitle">Compete across the biggest titles in esports with cash ladders, tournaments and more.</p>
        </div>
        <Link href="/games" className="section-view-all">
          View All Games <Icon icon="ri:arrow-right-line" />
        </Link>
      </div>

      {loading && (
        <div className="games-grid">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              style={{
                aspectRatio: '3/4',
                borderRadius: 8,
                background: 'var(--bg-2)',
                border: '1px solid var(--border)',
                animation: 'pulse 1.5s ease-in-out infinite',
              }}
            />
          ))}
        </div>
      )}

      {error && !loading && (
        <div style={{ padding: '30px 0 10px', fontSize: 12, color: 'var(--text-muted)', textAlign: 'center' }}>
          Unable to load games right now. Please try again later.
        </div>
      )}

      {!loading && !error && (
        <div className="games-grid">
          {visible.map((g: any, i: number) => (
            <HoverCard key={g.slug} delay={i * 0.1}>
              <GameCard game={g} />
            </HoverCard>
          ))}
          {visible.length === 0 && (
            <div style={{ gridColumn: '1/-1', padding: '30px 0 10px', fontSize: 12, color: 'var(--text-muted)', textAlign: 'center' }}>
              No games available yet. Check back soon.
            </div>
          )}
        </div>
      )}
    </section>
  )
}

export default LandingPageGamesSection