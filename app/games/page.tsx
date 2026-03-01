'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useApi } from '@/lib/use-api'
import { gamesApi } from '@/lib/api'

const FILTERS = ['All Games', 'FPS', 'Sports', 'Battle Royale', 'Fighting', 'Racing', 'Other']

function platformColor(platforms: string[]) {
  if (platforms.length === 1 && platforms[0] === 'PC') return '#60A5FA'
  if (!platforms.includes('PC')) return '#4ADE80'
  return '#F0AA1A'
}

function platformLabel(platforms: string[]) {
  const p = platforms.map(s => s.toLowerCase())
  const hasPC = p.includes('pc')
  const hasConsole = p.some(s => ['ps5', 'ps4', 'playstation', 'xbox'].includes(s))
  if (hasPC && hasConsole) return 'Cross-Play'
  if (hasConsole && !hasPC) return 'Console Only'
  if (hasPC && !hasConsole) return 'PC Only'
  return platforms.join(' / ')
}

export default function GamesPage() {
  const [active, setActive] = useState('All Games')
  const { data: games, loading, error } = useApi(() => gamesApi.getAll())

  const filtered = (games || []).filter((g: any) =>
    active === 'All Games' || g.genre === active
  )

  return (
    <div className="container" style={{ paddingBottom: 80 }}>

      {/* ── PAGE HEADER ─────────────────────────────── */}
      <div style={{
        padding: '40px 0 24px',
        borderBottom: '1px solid var(--border)',
        marginBottom: 28,
        display: 'flex', justifyContent: 'space-between',
        alignItems: 'flex-end', flexWrap: 'wrap', gap: 16,
      }}>
        <div>
          <h1 style={{
            fontFamily: "'Barlow Condensed', sans-serif",
            fontSize: 40, fontWeight: 900,
            textTransform: 'uppercase', letterSpacing: '0.02em',
            color: '#fff', marginBottom: 6,
          }}>
            Games <span style={{ color: 'var(--red)' }}>Page</span>
          </h1>
          <p style={{ fontSize: 14, color: 'var(--text-muted)', margin: 0 }}>
            Choose your game and start competing for real cash prizes
          </p>
        </div>

        <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', alignItems: 'center' }}>
          {FILTERS.map(f => (
            <button
              key={f}
              onClick={() => setActive(f)}
              style={{
                padding: '5px 12px',
                background: active === f ? 'var(--red)' : 'var(--bg-3)',
                border: `1px solid ${active === f ? 'var(--red)' : 'var(--border)'}`,
                borderRadius: 20,
                color: active === f ? '#fff' : 'var(--text-muted)',
                fontSize: 11, fontWeight: 600,
                fontFamily: "'Barlow', sans-serif",
                letterSpacing: '0.04em', textTransform: 'uppercase',
                cursor: 'pointer', transition: 'all 0.15s', whiteSpace: 'nowrap',
              }}
            >{f}</button>
          ))}
        </div>
      </div>

      {/* ── STATES ──────────────────────────────────── */}
      {loading && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14 }}>
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} style={{
              aspectRatio: '3/4', borderRadius: 10,
              background: 'var(--bg-2)', border: '1px solid var(--border)',
              animation: 'pulse 1.5s ease-in-out infinite',
            }} />
          ))}
        </div>
      )}

      {error && (
        <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-muted)' }}>
          <div style={{ fontSize: 32, marginBottom: 12 }}>⚠️</div>
          <div>Failed to load games. Make sure the backend is running.</div>
        </div>
      )}

      {/* ── GAMES GRID ──────────────────────────────── */}
      {!loading && !error && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: 14,
        }}>
          {filtered.map((g: any) => (
            <GameCard key={g.slug} game={g} />
          ))}
          {filtered.length === 0 && (
            <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '60px 0', color: 'var(--text-muted)' }}>
              No games found for this filter.
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function GameCard({ game }: { game: any }) {
  const [hovered, setHovered] = useState(false)
  const pc      = platformColor(game.platforms || [])
  const plLabel = platformLabel(game.platforms || [])

  return (
    <Link href={`/games/${game.slug}`} style={{ textDecoration: 'none', display: 'block' }}>
      <div
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        style={{
          position: 'relative', borderRadius: 10, overflow: 'hidden',
          aspectRatio: '3/4', background: '#0d0d12',
          border: `1px solid ${hovered ? pc + '55' : 'var(--border)'}`,
          transition: 'all 0.22s',
          transform: hovered ? 'translateY(-4px)' : 'translateY(0)',
          boxShadow: hovered ? `0 16px 40px rgba(0,0,0,0.55)` : 'none',
          cursor: 'pointer',
        }}
      >
        <img
          src={game.bannerUrl}
          alt={game.name}
          style={{
            position: 'absolute', inset: 0, width: '100%', height: '100%',
            objectFit: 'cover', transition: 'transform 0.3s, opacity 0.3s',
            transform: hovered ? 'scale(1.06)' : 'scale(1)',
            opacity: hovered ? 0.45 : 0.65,
          }}
          onError={e => { (e.target as HTMLImageElement).style.display = 'none' }}
        />

        <div style={{
          position: 'absolute', inset: 0,
          background: hovered
            ? 'linear-gradient(to bottom, rgba(0,0,0,0.3) 0%, rgba(0,0,0,0.85) 100%)'
            : 'linear-gradient(to bottom, transparent 35%, rgba(6,6,10,0.92) 100%)',
          transition: 'background 0.22s',
        }} />

        {/* Default state */}
        <div style={{
          position: 'absolute', bottom: 0, left: 0, right: 0,
          padding: '14px 14px 14px',
          opacity: hovered ? 0 : 1, transition: 'opacity 0.18s', pointerEvents: 'none',
        }}>
          <div style={{
            fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 900, fontSize: 17,
            textTransform: 'uppercase', color: '#fff', letterSpacing: '0.03em',
            marginBottom: 6, lineHeight: 1.1,
          }}>{game.name}</div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <MetaPill>{game.activeLadders ?? 6} Ladders</MetaPill>
            <MetaPill accent>{game.genre}</MetaPill>
          </div>
        </div>

        {/* Hover state */}
        <div style={{
          position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center', padding: '20px 16px',
          opacity: hovered ? 1 : 0, transition: 'opacity 0.2s',
          pointerEvents: 'none', textAlign: 'center',
        }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            background: pc + '20', border: `1px solid ${pc}55`,
            borderRadius: 20, padding: '5px 14px', marginBottom: 14,
          }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: pc, boxShadow: `0 0 6px ${pc}`, flexShrink: 0 }} />
            <span style={{
              fontFamily: "'Rajdhani', sans-serif", fontWeight: 700, fontSize: 11,
              letterSpacing: '0.1em', textTransform: 'uppercase', color: pc,
            }}>{plLabel}</span>
          </div>

          <div style={{
            fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 900, fontSize: 22,
            textTransform: 'uppercase', color: '#fff', letterSpacing: '0.03em',
            marginBottom: 12, lineHeight: 1.1,
          }}>{game.name}</div>

          <div style={{ display: 'flex', gap: 16, justifyContent: 'center', marginBottom: 18 }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 900, fontSize: 20, color: '#fff', lineHeight: 1 }}>
                {game.activeLadders ?? 6}
              </div>
              <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '0.08em', marginTop: 2 }}>Ladders</div>
            </div>
            <div style={{ width: 1, background: 'rgba(255,255,255,0.12)' }} />
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 900, fontSize: 20, color: pc, lineHeight: 1 }}>
                {game.genre}
              </div>
              <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '0.08em', marginTop: 2 }}>Genre</div>
            </div>
          </div>

          <div style={{
            padding: '8px 22px', background: 'var(--red)', color: '#fff',
            fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 800, fontSize: 12,
            letterSpacing: '0.08em', textTransform: 'uppercase', borderRadius: 6,
          }}>View Game →</div>
        </div>
      </div>
    </Link>
  )
}

function MetaPill({ children, accent }: { children: React.ReactNode; accent?: boolean }) {
  return (
    <span style={{
      fontFamily: "'Rajdhani', sans-serif", fontWeight: 700, fontSize: 10,
      letterSpacing: '0.07em', textTransform: 'uppercase',
      color: accent ? 'var(--red)' : 'rgba(255,255,255,0.55)',
      background: accent ? 'rgba(232,0,13,0.12)' : 'rgba(255,255,255,0.07)',
      border: `1px solid ${accent ? 'rgba(232,0,13,0.25)' : 'rgba(255,255,255,0.1)'}`,
      borderRadius: 3, padding: '2px 7px', whiteSpace: 'nowrap',
    }}>{children}</span>
  )
}