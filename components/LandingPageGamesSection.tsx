import React from 'react'
import Link from 'next/link'
import { useApi } from '@/lib/use-api'
import { gamesApi } from '@/lib/api'
import { GameCard } from './GameCard'
import { HoverCard } from './HoverCard'

function LandingPageGamesSection() {
  const { data: games, loading, error } = useApi(() => gamesApi.getAll())
  const visible = (games || []).slice(0, 6)

  return (
    <section className="my-16!">
      <div className="container px-0!">
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-end',
            gap: 16,
            marginBottom: 20,
          }}
        >
          <div>
            <div
              style={{
                fontFamily: "'Barlow Condensed', sans-serif",
                fontSize: 32,
                fontWeight: 900,
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
                color: '#fff',
              }}
            >
              Search <span style={{ color: 'var(--red)' }}>Games</span>
            </div>
            <p
              style={{
                marginTop: 6,
                fontSize: 13,
                color: 'var(--text-muted)',
                maxWidth: 420,
              }}
            >
              Compete across the biggest titles in esports with cash ladders, tournaments, and more.
            </p>
          </div>

          <Link
            href="/games"
            style={{
              fontFamily: "'Barlow Condensed', sans-serif",
              fontWeight: 800,
              fontSize: 12,
              textTransform: 'uppercase',
              letterSpacing: '0.12em',
              padding: '8px 18px',
              borderRadius: 999,
              border: '1px solid var(--border)',
              color: '#fff',
              textDecoration: 'none',
              background: 'linear-gradient(90deg, rgba(255,255,255,0.04), rgba(232,0,13,0.16))',
            }}
          >
            View all games →
          </Link>
        </div>

        {loading && (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(6, minmax(0, 1fr))',
              gap: 12,
            }}
          >
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                style={{
                  aspectRatio: '3/4',
                  borderRadius: 10,
                  background: 'var(--bg-2)',
                  border: '1px solid var(--border)',
                  animation: 'pulse 1.5s ease-in-out infinite',
                }}
              />
            ))}
          </div>
        )}

        {error && !loading && (
          <div
            style={{
              padding: '30px 0 10px',
              fontSize: 12,
              color: 'var(--text-muted)',
            }}
          >
            Unable to load games right now. Please try again later.
          </div>
        )}

        {!loading && !error && (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(6, minmax(0, 1fr))',
              gap: 12,
            }}
          >
            {visible.map((g: any, i: number) => (
              <HoverCard key={g.slug} delay={i * 0.1}>
                <GameCard game={g} />
              </HoverCard>
            ))}
            {visible.length === 0 && (
              <div
                style={{
                  gridColumn: '1/-1',
                  padding: '30px 0 10px',
                  fontSize: 12,
                  color: 'var(--text-muted)',
                  textAlign: 'center',
                }}
              >
                No games available yet. Check back soon.
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  )
}

export default LandingPageGamesSection