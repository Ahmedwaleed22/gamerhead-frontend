'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useAuth } from '@/lib/auth-context'
import { tournamentsApi } from '@/lib/api'

/* ── Game banner images + accent colors ─────────────────── */
const GAME_ASSETS: Record<string, { banner: string; accent: string }> = {
  'Call of Duty':    { banner: '/games/call-of-duty.png',  accent: '#4A9EFF' },
  'FIFA / EA FC':    { banner: '/games/fc26.png',          accent: '#3DD68C' },
  'Fortnite':        { banner: '/games/fortnite.png',      accent: '#C84FFF' },
  'Warzone':         { banner: '/games/warzone.png',       accent: '#E8A020' },
  'Rocket League':   { banner: '/games/rocketleague.png',  accent: '#FF4D6D' },
  'Apex Legends':    { banner: '/games/apex-legends.png',  accent: '#DA3C21' },
  'Valorant':        { banner: '/games/valorant.png',      accent: '#FF4655' },
  'Madden NFL':      { banner: '/games/madden26.png',      accent: '#00A859' },
  'NBA 2K':          { banner: '/games/nba26.png',         accent: '#F97316' },
  'UFC / EA Sports': { banner: '/games/ufc.png',           accent: '#DC2626' },
}

// Fuzzy match: "Call of Duty Black Ops 7" → "Call of Duty"
function resolveGameAssets(gameName: string): { banner: string; accent: string } {
  if (GAME_ASSETS[gameName]) return GAME_ASSETS[gameName]
  const lower = gameName.toLowerCase()
  for (const [key, val] of Object.entries(GAME_ASSETS)) {
    if (lower.includes(key.toLowerCase()) || key.toLowerCase().includes(lower)) return val
  }
  return { banner: '', accent: FALLBACK_ACCENT }
}

const FALLBACK_ACCENT = '#E8000D'

function fmtDateTime(dateStr: string, timeStr: string): string {
  if (!dateStr) return ''
  try {
    const d = new Date(`${dateStr}T${timeStr || '00:00'}`)
    if (isNaN(d.getTime())) return `${dateStr} · ${timeStr || ''}`
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) +
      ' · ' + d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })
  } catch { return `${dateStr} · ${timeStr || ''}` }
}

interface Tournament {
  id: string
  time: string
  name: string
  region: string
  mode: string
  slots: number
  filled: number
  prize: string
  game: string
  platform: string
  type: string
}

function mapTournament(t: any): Tournament {
  return {
    id:       t.slug ?? t.id ?? t._id ?? '',
    time:     t.time ?? (t.startDate ? fmtDateTime(t.startDate, t.startTime ?? '') : ''),
    name:     t.name ?? '',
    region:   t.region ?? '',
    mode:     t.mode ?? t.format ?? '',
    slots:    t.slots ?? t.maxTeams ?? 0,
    filled:   t.filled ?? (t.maxTeams && (t.registeredCount || t.teams) ? Math.round(((t.registeredCount || t.teams) / t.maxTeams) * 100) : 0),
    prize:    t.prize ?? (t.prizePool != null ? `$${Number(t.prizePool).toLocaleString()}` : '$0'),
    game:     t.game ?? '',
    platform: t.platform ?? '',
    type:     t.type ?? t.bracketType ?? '',
  }
}

const GAME_FILTERS     = ['All Games', 'Call of Duty', 'Fortnite', 'FIFA / EA FC', 'Warzone', 'Rocket League', 'Apex Legends', 'Valorant', 'Madden NFL']
const PLATFORM_FILTERS = ['All Platforms', 'Cross-Play', 'Console Only', 'PC Only']

export default function TournamentsPage() {
  const { user } = useAuth()
  const [gameFilter,     setGameFilter]     = useState('All Games')
  const [platformFilter, setPlatformFilter] = useState('All Platforms')
  const [showAll,        setShowAll]        = useState(false)
  const [tournaments,    setTournaments]    = useState<Tournament[]>([])
  const [loading,        setLoading]        = useState(true)

  useEffect(() => {
    let cancelled = false
    tournamentsApi.getAll().then((data: any) => {
      if (cancelled) return
      const list = Array.isArray(data) ? data : (data.tournaments ?? data.data ?? [])
      setTournaments(list.map(mapTournament))
    }).catch(() => {}).finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [])

  const filtered = tournaments.filter(t => {
    const okGame     = gameFilter     === 'All Games'     || t.game     === gameFilter
    const okPlatform = platformFilter === 'All Platforms' || t.platform === platformFilter
    return okGame && okPlatform
  })

  const visible = showAll ? filtered : filtered.slice(0, 8)

  return (
    <div className="container" style={{ paddingBottom: 80 }}>

      {/* ── PAGE HEADER ──────────────────────────────── */}
      <div style={{
        padding: '40px 0 24px',
        borderBottom: '1px solid var(--border)',
        marginBottom: 24,
        display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between',
      }}>
        <div>
          <h1 style={{
            fontFamily: "'Barlow Condensed', sans-serif",
            fontSize: 40, fontWeight: 900,
            textTransform: 'uppercase', letterSpacing: '0.02em',
            color: '#fff', marginBottom: 6,
          }}>
            All <span style={{ color: 'var(--red)' }}>Tournaments</span>
          </h1>
          <p style={{ fontSize: 14, color: 'var(--text-muted)', margin: 0 }}>
            Compete for real cash prizes across all games and platforms
          </p>
        </div>
      </div>

      {/* ── FILTERS ──────────────────────────────────── */}
      <div style={{ marginBottom: 32 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8, flexWrap: 'wrap' }}>
          <span style={labelStyle}>Game</span>
          <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', alignItems: 'center' }}>
            {GAME_FILTERS.map(f => (
              <FilterPill key={f} active={gameFilter === f} onClick={() => setGameFilter(f)}>{f}</FilterPill>
            ))}
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <span style={labelStyle}>Platform</span>
          <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', alignItems: 'center' }}>
            {PLATFORM_FILTERS.map(f => (
              <FilterPill key={f} active={platformFilter === f} onClick={() => setPlatformFilter(f)}>{f}</FilterPill>
            ))}
          </div>
          <span style={{ marginLeft: 'auto', fontFamily: "'Barlow Condensed', sans-serif", fontSize: 14, fontWeight: 700, color: 'var(--text-muted)', flexShrink: 0 }}>
            <span style={{ color: '#fff' }}>{filtered.length}</span>&nbsp;result{filtered.length !== 1 ? 's' : ''}
          </span>
        </div>
      </div>

      {/* ── GRID ─────────────────────────────────────── */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        gap: 14,
      }}>
        {visible.map(t => {
          const { banner, accent } = resolveGameAssets(t.game)
          const pct = Math.min(t.filled, 100)
          const barColor = pct >= 90 ? '#E8000D' : pct >= 65 ? '#F0AA1A' : accent

          return (
            <Link key={t.id} href={`/tournaments/${t.id}`} style={{ textDecoration: 'none', display: 'block' }}>
              <div
                style={{
                  background: 'var(--bg-2)',
                  border: '1px solid var(--border)',
                  borderRadius: 10, overflow: 'hidden',
                  display: 'flex', flexDirection: 'column',
                  height: '100%', transition: 'all 0.2s', cursor: 'pointer',
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.borderColor = accent + '55'
                  e.currentTarget.style.transform   = 'translateY(-3px)'
                  e.currentTarget.style.boxShadow   = '0 14px 36px rgba(0,0,0,0.45)'
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.borderColor = 'var(--border)'
                  e.currentTarget.style.transform   = 'translateY(0)'
                  e.currentTarget.style.boxShadow   = 'none'
                }}
              >
                {/* ── Banner ── */}
                <div style={{
                  position: 'relative', height: 116,
                  background: `linear-gradient(135deg, ${accent}28 0%, #0d0d12 100%)`,
                  flexShrink: 0, overflow: 'hidden',
                }}>
                  {/* Accent left stripe */}
                  <div style={{
                    position: 'absolute', left: 0, top: 0, bottom: 0,
                    width: 3, background: accent, zIndex: 2,
                  }} />

                  {/* Game image */}
                  <img
                    src={banner}
                    alt={t.game}
                    style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.5 }}
                    onError={e => { (e.target as HTMLImageElement).style.display = 'none' }}
                  />

                  {/* Bottom fade */}
                  <div style={{
                    position: 'absolute', inset: 0,
                    background: 'linear-gradient(to bottom, transparent 30%, rgba(8,8,12,0.88) 100%)',
                  }} />

                  {/* Prize — top right chip */}
                  <div style={{
                    position: 'absolute', top: 9, right: 10, zIndex: 3,
                    background: 'rgba(0,0,0,0.75)',
                    border: `1px solid ${accent}45`,
                    borderRadius: 4, padding: '3px 8px',
                    fontFamily: "'Barlow Condensed', sans-serif",
                    fontWeight: 900, fontSize: 13, color: '#F0C040',
                  }}>{t.prize}</div>

                  {/* Game + Tournament name */}
                  <div style={{
                    position: 'absolute', bottom: 9, left: 12, right: 12, zIndex: 3,
                  }}>
                    <div style={{
                      fontFamily: "'Rajdhani', sans-serif",
                      fontWeight: 700, fontSize: 9,
                      letterSpacing: '0.12em', textTransform: 'uppercase',
                      color: accent, marginBottom: 2,
                    }}>{t.game}</div>
                    <div style={{
                      fontFamily: "'Barlow Condensed', sans-serif",
                      fontWeight: 800, fontSize: 15,
                      textTransform: 'uppercase', color: '#fff', lineHeight: 1.15,
                    }}>{t.name}</div>
                  </div>
                </div>

                {/* ── Body ── */}
                <div style={{
                  padding: '11px 13px 13px',
                  display: 'flex', flexDirection: 'column', gap: 9, flex: 1,
                }}>
                  {/* Slots bar */}
                  <div>
                    <div style={{
                      display: 'flex', justifyContent: 'space-between',
                      alignItems: 'center', marginBottom: 4,
                    }}>
                      <span style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                        Slots
                      </span>
                      <span style={{ fontSize: 10, fontWeight: 700, color: barColor }}>
                        {pct >= 100 ? 'FULL' : `${pct}% filled`}
                      </span>
                    </div>
                    <div style={{ height: 3, background: 'var(--bg-4)', borderRadius: 2, overflow: 'hidden' }}>
                      <div style={{
                        height: '100%', borderRadius: 2,
                        width: `${pct}%`,
                        background: `linear-gradient(90deg, ${barColor}99, ${barColor})`,
                        transition: 'width 0.4s',
                      }} />
                    </div>
                  </div>

                  {/* Start time */}
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: 6,
                    fontSize: 11, color: 'var(--text-muted)', fontWeight: 600,
                  }}>
                    <span style={{ color: accent, fontSize: 10 }}>▶</span>
                    {t.time}
                  </div>

                  {/* Info grid — all 5 fields */}
                  <div style={{
                    background: 'var(--bg-3)',
                    border: '1px solid var(--border)',
                    borderRadius: 6, padding: '8px 10px',
                    display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px 10px',
                  }}>
                    <InfoCell label="Region"   value={t.region} />
                    <InfoCell label="Team Size" value={t.mode} />
                    <InfoCell label="Slots"     value={`${t.slots} slots`} />
                    <InfoCell label="Type"      value={t.type} />
                    <InfoCell label="Platform"  value={t.platform} fullWidth />
                  </div>

                  {/* Enter button */}
                  <div style={{ marginTop: 'auto' }}>
                    <div style={{
                      width: '100%', padding: '9px 0',
                      background: accent, color: '#000',
                      fontFamily: "'Barlow Condensed', sans-serif",
                      fontWeight: 800, fontSize: 13,
                      letterSpacing: '0.07em', textTransform: 'uppercase',
                      textAlign: 'center', borderRadius: 6,
                    }}>
                      Enter Tournament
                    </div>
                  </div>
                </div>
              </div>
            </Link>
          )
        })}
      </div>

      {/* ── SEE ALL / COLLAPSE ───────────────────────── */}
      {filtered.length > 8 && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 24, marginTop: 44 }}>
          <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
          <button
            className="btn-primary"
            style={{ padding: '12px 40px', flexShrink: 0 }}
            onClick={() => setShowAll(v => !v)}
          >
            {showAll ? 'Show Less' : `See All ${filtered.length} Tournaments`}
          </button>
          <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
        </div>
      )}
    </div>
  )
}

/* ── Shared sub-components ────────────────────────────── */
const labelStyle: React.CSSProperties = {
  fontFamily: "'Rajdhani', sans-serif",
  fontWeight: 700, fontSize: 11,
  letterSpacing: '0.1em', textTransform: 'uppercase',
  color: 'var(--text-dim)', flexShrink: 0,
}

function FilterPill({
  active, onClick, children,
}: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: '4px 10px',
        background: active ? 'var(--red)' : 'var(--bg-3)',
        border: `1px solid ${active ? 'var(--red)' : 'var(--border)'}`,
        borderRadius: 20,
        color: active ? '#fff' : 'var(--text-muted)',
        fontSize: 11, fontWeight: 600,
        fontFamily: "'Barlow', sans-serif",
        letterSpacing: '0.04em', textTransform: 'uppercase',
        cursor: 'pointer', transition: 'all 0.15s', whiteSpace: 'nowrap',
      }}
      onMouseEnter={e => {
        if (!active) {
          e.currentTarget.style.borderColor = 'rgba(232,0,13,0.4)'
          e.currentTarget.style.color = '#fff'
        }
      }}
      onMouseLeave={e => {
        if (!active) {
          e.currentTarget.style.borderColor = 'var(--border)'
          e.currentTarget.style.color = 'var(--text-muted)'
        }
      }}
    >
      {children}
    </button>
  )
}

function InfoCell({ label, value, gold, fullWidth }: { label: string; value: string; gold?: boolean; fullWidth?: boolean }) {
  return (
    <div style={fullWidth ? { gridColumn: '1 / -1' } : {}}>
      <div style={{
        fontSize: 9, fontWeight: 700, textTransform: 'uppercase',
        letterSpacing: '0.08em', color: 'var(--text-dim)', marginBottom: 1,
      }}>{label}</div>
      <div style={{
        fontFamily: "'Barlow Condensed', sans-serif",
        fontWeight: 700, fontSize: 12,
        color: gold ? '#F0C040' : '#e0e0e8',
      }}>{value}</div>
    </div>
  )
}