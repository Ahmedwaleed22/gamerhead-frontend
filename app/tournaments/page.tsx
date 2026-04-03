'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { Icon } from '@iconify/react'
import { useAuth } from '@/lib/auth-context'
import { tournamentsApi } from '@/lib/api'
import { HoverCard } from '@/components/HoverCard'


interface Tournament {
  id: string
  slug: string
  name: string
  game: string
  gameEmoji: string
  bannerUrl: string
  startDate: string
  startTime: string
  status: string
  isFeatured: boolean
  prizePool: number
  prizePoolType: string
  maxTeams: number
  registeredCount: number
  region: string
  platform: string
  bracketType: string
}

function mapTournament(t: any): Tournament {
  return {
    id:              t.slug ?? t.id ?? t._id ?? '',
    slug:            t.slug ?? '',
    name:            t.name ?? '',
    game:            t.game ?? '',
    gameEmoji:       t.gameEmoji ?? '🎮',
    bannerUrl:       t.bannerUrl ?? '',
    startDate:       t.startDate ?? '',
    startTime:       t.startTime ?? '',
    status:          t.status ?? '',
    isFeatured:      t.isFeatured ?? false,
    prizePool:       t.prizePool ?? 0,
    prizePoolType:   t.prizePoolType ?? '',
    maxTeams:        t.maxTeams ?? 0,
    registeredCount: t.registeredCount ?? t.teams ?? 0,
    region:          t.region ?? '',
    platform:        t.platform ?? '',
    bracketType:     t.bracketType ?? t.type ?? '',
  }
}

function formatDate(dateStr: string): string {
  if (!dateStr) return 'Date TBD'
  try {
    const d = new Date(`${dateStr}T00:00`)
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  } catch { return dateStr }
}

function formatTime(timeStr: string): string {
  if (!timeStr) return ''
  try {
    const [h, m] = timeStr.split(':').map(Number)
    const period = h >= 12 ? 'PM' : 'AM'
    const hour = h % 12 || 12
    return `${hour}:${String(m).padStart(2, '0')} ${period}`
  } catch { return timeStr }
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
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 32, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={labelStyle}>Game</span>
          <select
            value={gameFilter}
            onChange={e => setGameFilter(e.target.value)}
            style={{ padding: '8px 32px 8px 12px', background: 'var(--bg-3)', border: '1px solid var(--border)', borderRadius: 8, color: '#fff', fontFamily: "'Barlow', sans-serif", fontWeight: 600, fontSize: 13, outline: 'none', cursor: 'pointer', appearance: 'none' as const, WebkitAppearance: 'none' as const, backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'12\' height=\'12\' viewBox=\'0 0 24 24\'%3E%3Cpath fill=\'%23999\' d=\'M7 10l5 5 5-5z\'/%3E%3C/svg%3E")', backgroundRepeat: 'no-repeat', backgroundPosition: 'right 10px center' }}
          >
            {GAME_FILTERS.map(f => <option key={f} value={f} style={{ background: 'var(--bg-1)', color: '#fff' }}>{f}</option>)}
          </select>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={labelStyle}>Platform</span>
          <select
            value={platformFilter}
            onChange={e => setPlatformFilter(e.target.value)}
            style={{ padding: '8px 32px 8px 12px', background: 'var(--bg-3)', border: '1px solid var(--border)', borderRadius: 8, color: '#fff', fontFamily: "'Barlow', sans-serif", fontWeight: 600, fontSize: 13, outline: 'none', cursor: 'pointer', appearance: 'none' as const, WebkitAppearance: 'none' as const, backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'12\' height=\'12\' viewBox=\'0 0 24 24\'%3E%3Cpath fill=\'%23999\' d=\'M7 10l5 5 5-5z\'/%3E%3C/svg%3E")', backgroundRepeat: 'no-repeat', backgroundPosition: 'right 10px center' }}
          >
            {PLATFORM_FILTERS.map(f => <option key={f} value={f} style={{ background: 'var(--bg-1)', color: '#fff' }}>{f}</option>)}
          </select>
        </div>
        <span style={{ marginLeft: 'auto', fontFamily: "'Barlow Condensed', sans-serif", fontSize: 14, fontWeight: 700, color: 'var(--text-muted)', flexShrink: 0 }}>
          <span style={{ color: '#fff' }}>{filtered.length}</span>&nbsp;result{filtered.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* ── GRID ─────────────────────────────────────── */}
      <div className="tournaments-grid">
        {visible.map((t, i) => (
          <HoverCard className="tournament-card" key={t.slug || t.id || i} delay={i * 0.05}>
            <div className="tournament-card-header">
              {t.bannerUrl ? (
                <img src={t.bannerUrl} alt={t.game} className="tournament-card-header-img" />
              ) : (
                <div
                  style={{
                    width: '100%',
                    height: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 64,
                    background: 'var(--bg-3)',
                  }}
                >
                  {t.gameEmoji || '🎮'}
                </div>
              )}
              {t.isFeatured && <div className="tournament-featured-badge">Featured</div>}
              {t.status === 'live' && (
                <div style={{
                  position: 'absolute', top: 10, left: 10, zIndex: 10,
                  display: 'flex', alignItems: 'center', gap: 5,
                  background: 'rgba(22, 163, 74, 0.92)',
                  backdropFilter: 'blur(4px)',
                  color: '#fff',
                  fontFamily: "'Barlow Condensed', sans-serif",
                  fontWeight: 800, fontSize: 11,
                  letterSpacing: '0.12em', textTransform: 'uppercase',
                  padding: '4px 10px', borderRadius: 4,
                  border: '1px solid rgba(74, 222, 128, 0.4)',
                }}>
                  <span style={{
                    width: 6, height: 6, borderRadius: '50%',
                    background: '#4ade80',
                    boxShadow: '0 0 6px #4ade80',
                    display: 'inline-block',
                    flexShrink: 0,
                  }} />
                  LIVE
                </div>
              )}
            </div>
            <div className="tournament-card-body">
              <div className="tournament-game-tag">{t.game}</div>
              <div className="tournament-name">{t.name}</div>
              {t.prizePool > 0 && (
                <div style={{ fontSize: 12, color: '#F0AA1A', fontWeight: 700, marginBottom: 8 }}>
                  <Icon icon="solar:wallet-money-bold-duotone" width="14" style={{ display: 'inline', marginRight: 4 }} />
                  ${(t.prizePool / 100).toLocaleString()} Prize Pool
                </div>
              )}

              {/* Date & Time */}
              <div className="tournament-date-row">
                <Icon icon="mdi:calendar-blank-outline" width="15" />
                {formatDate(t.startDate)}
                {t.startTime && (
                  <span style={{ color: 'var(--text-muted)', marginLeft: 4 }}>
                    · {formatTime(t.startTime)}
                  </span>
                )}
              </div>

              {/* Meta row: Platform · Bracket · Region */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px 10px', marginBottom: 8 }}>
                {t.platform && (
                  <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    <Icon icon="mdi:controller-classic-outline" width="13" />
                    {t.platform}
                  </span>
                )}
                {t.bracketType && (
                  <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    <Icon icon="mdi:tournament" width="13" />
                    {t.bracketType}
                  </span>
                )}
                {t.region && (
                  <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    <Icon icon="mdi:earth" width="13" />
                    {t.region}
                  </span>
                )}
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--text-muted)', marginBottom: 4 }}>
                <Icon icon="mdi:account-group-outline" width="16" />
                {t.registeredCount}/{t.maxTeams} Teams
              </div>
              <div className="tournament-organizer-row">
                <span>Tournament By</span>
                <div className="tournament-organizer-logo">
                  <Icon icon="mdi:shield-cross" width="18" /> GamerHead
                </div>
              </div>
              <Link
                href={`/tournaments/${t.slug || t.id}`}
                className="tournament-action-btn"
              >
                {t.status === 'open' ? 'Registration Open' : t.status === 'live' ? 'Watch Live' : 'View Tournament'}
              </Link>
            </div>
          </HoverCard>
        ))}
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

const labelStyle: React.CSSProperties = {
  fontFamily: "'Rajdhani', sans-serif",
  fontWeight: 700, fontSize: 11,
  letterSpacing: '0.1em', textTransform: 'uppercase',
  color: 'var(--text-dim)', flexShrink: 0,
}