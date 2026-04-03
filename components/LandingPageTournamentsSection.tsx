'use client'

import React from 'react'
import Link from 'next/link'
import { Icon } from "@iconify/react"
import { HoverCard } from './HoverCard'
import { useApi } from '@/lib/use-api'
import { tournamentsApi } from '@/lib/api'

type Tournament = {
  _id: string
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

function formatDate(dateStr: string): string {
  if (!dateStr) return 'Date TBD'
  try {
    const d = new Date(`${dateStr}T00:00`)
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  } catch {
    return dateStr
  }
}

function formatTime(timeStr: string): string {
  if (!timeStr) return ''
  try {
    const [h, m] = timeStr.split(':').map(Number)
    const period = h >= 12 ? 'PM' : 'AM'
    const hour = h % 12 || 12
    return `${hour}:${String(m).padStart(2, '0')} ${period}`
  } catch {
    return timeStr
  }
}

function TournamentCardSkeleton() {
  return (
    <div style={{
      borderRadius: 12,
      background: 'var(--bg-2)',
      border: '1px solid var(--border)',
      overflow: 'hidden',
      animation: 'pulse 1.5s ease-in-out infinite',
    }}>
      <div style={{ height: 180, background: 'var(--bg-3)' }} />
      <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 10 }}>
        <div style={{ height: 12, width: '40%', background: 'var(--bg-3)', borderRadius: 4 }} />
        <div style={{ height: 18, width: '80%', background: 'var(--bg-3)', borderRadius: 4 }} />
        <div style={{ height: 12, width: '60%', background: 'var(--bg-3)', borderRadius: 4 }} />
        <div style={{ height: 40, background: 'var(--bg-3)', borderRadius: 8, marginTop: 8 }} />
      </div>
    </div>
  )
}

export default function LandingPageTournamentsSection() {
  const { data, loading, error } = useApi<{ tournaments: Tournament[] }>(() =>
    tournamentsApi.getAll()
  )

  const tournaments = React.useMemo(() => {
    if (!data) return []
    const all: Tournament[] = Array.isArray(data) ? data : (data as any).tournaments ?? []
    const featured = all.filter((t) => t.isFeatured && t.status !== 'completed' && t.status !== 'cancelled')
    const open = all.filter((t) => !t.isFeatured && (t.status === 'open' || t.status === 'live'))
    return [...featured, ...open].slice(0, 3)
  }, [data])

  return (
    <section className="tournaments-section">
      <div className="section-header">
        <h2 className="section-title">Featured <span>Tournaments</span></h2>
        <p className="section-subtitle">Compete for real cash prizes — pick your game, platform, and enter today.</p>
      </div>

      {loading && (
        <div className="tournaments-grid">
          {[0, 1, 2].map((i) => <TournamentCardSkeleton key={i} />)}
        </div>
      )}

      {error && !loading && (
        <p style={{ color: 'var(--text-muted)', fontSize: 13, textAlign: 'center', padding: '30px 0' }}>
          Unable to load tournaments right now.
        </p>
      )}

      {!loading && !error && tournaments.length === 0 && (
        <p style={{ color: 'var(--text-muted)', fontSize: 13, textAlign: 'center', padding: '30px 0' }}>
          No upcoming tournaments right now. Check back soon.
        </p>
      )}

      {!loading && !error && tournaments.length > 0 && (
        <div className="tournaments-grid">
          {tournaments.map((t, i) => (
            <HoverCard className="tournament-card" key={t._id || i} delay={i * 0.1}>
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
                  href={`/tournaments/${t.slug}`}
                  className="tournament-action-btn"
                >
                  {t.status === 'open' ? 'Registration Open' : t.status === 'live' ? 'Watch Live' : 'View Tournament'}
                </Link>
              </div>
            </HoverCard>
          ))}
        </div>
      )}
    </section>
  )
}
