import Link from 'next/link'
import { useApi } from '@/lib/use-api'
import { gamesApi } from '@/lib/api'
import { GameCard } from './GameCard'
import { HoverCard } from './HoverCard'

function LandingPageGamesSection() {
  const { data: games, loading, error } = useApi(() => gamesApi.getAll())
  const visible = (games || []).slice(0, 5)

  return (
    <section className="games-showcase">
      <div className="section-header" style={{ textAlign: 'center', marginBottom: 44 }}>
        <h2 className="section-title">Start Playing <span>Today</span></h2>
        <p className="section-subtitle">Pick your title and jump into cash ladders, prize entry matches and tournaments across every platform.</p>
      </div>

      {loading && (
        <div className="games-showcase-grid">
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              style={{
                aspectRatio: '3/4',
                borderRadius: 12,
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
        <>
          <div className="games-showcase-grid">
            {visible.map((g: any, i: number) => (
              <HoverCard key={g.slug} delay={i * 0.08}>
                <GameCard game={g} featured={i === 0} />
              </HoverCard>
            ))}
            {visible.length === 0 && (
              <div style={{ gridColumn: '1/-1', padding: '30px 0 10px', fontSize: 12, color: 'var(--text-muted)', textAlign: 'center' }}>
                No games available yet. Check back soon.
              </div>
            )}
          </div>

          {visible.length > 0 && (
            <div style={{ textAlign: 'center', marginTop: 36 }}>
              <Link href="/games" className="btn-primary">View All Games →</Link>
            </div>
          )}
        </>
      )}
    </section>
  )
}

export default LandingPageGamesSection