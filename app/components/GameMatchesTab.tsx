'use client'

// FILE: app/components/GameMatchesTab.tsx

import { useState } from 'react'

import Link from 'next/link'
import { useApi, useMutation } from '@/lib/use-api'
import { matchesApi, teamsApi } from '@/lib/api'
import { useAuth } from '@/lib/auth-context'
import PostMatchModal   from '@/app/components/PostMatchModal'
import { AcceptMatchModal } from '@/app/components/AcceptMatchModal'
import { Icon } from '@iconify/react'
import { Solar } from '@/lib/solar-duotone'

// Format label: Solo→1v1, Duo→2v2, Trio→3v3, Squad→4v4, otherwise as-is
function formatLabel(fmt: string) {
  if (!fmt) return '—'
  if (fmt === 'Solo')  return '1v1'
  if (fmt === 'Duo')   return '2v2'
  if (fmt === 'Trio')  return '3v3'
  if (fmt === 'Squad') return '4v4'
  // Handle "5v5" style strings already
  if (/^\d+v\d+$/.test(fmt)) return fmt
  return fmt
}

// Placeholder rep bar — replaced when user profile is wired
function RepBarPlaceholder({ value = 75 }: { value?: number }) {
  const color = value >= 80 ? '#4ade80' : value >= 50 ? '#f0c040' : '#e8000d'
  return (
    <div className="rep-bar-wrap" style={{ minWidth: 80 }}>
      <div className="rep-bar-track">
        <div className="rep-bar-fill" style={{ width: `${value}%`, background: color }} />
      </div>
      <span className="rep-bar-label" style={{ color, fontSize: 10 }}>{value}</span>
    </div>
  )
}

// ─── MATCH CARD ───────────────────────────────────────────────────────────────
function MatchListingCard({
  match,
  myTeamIds,
  onAccept,
  onCancel,
}: {
  match:     any
  myTeamIds: string[]
  onAccept:  (m: any) => void
  onCancel:  (m: any) => void
}) {
  const isMyMatch   = myTeamIds.includes(match.teamAId?.toString())
  const isCash      = match.matchType === 'cash'
  const isScheduled = match.scheduleType === 'scheduled' && match.scheduledAt
  const isPremium   = match.isPremium || false
  const supportType = isPremium ? 'live' : 'dispute'
  const avgRep      = match.teamARep || 0

  const postedAgo = match.createdAt ? (() => {
    const diff = Date.now() - new Date(match.createdAt).getTime()
    const m = Math.floor(diff / 60000)
    if (m < 1)  return 'just now'
    if (m < 60) return `${m}m ago`
    const h = Math.floor(m / 60)
    if (h < 24) return `${h}h ago`
    return `${Math.floor(h / 24)}d ago`
  })() : ''

  return (
    <div className="match-item">

      {/* ── LEFT: ladder type + availability ── */}
      <div className="match-item-left">
        <div className="match-ladder-badge">
          <span className={`ladder-type-badge ${isCash ? 'cash' : 'xp'}`}>
            {isCash ? 'CASH' : 'XP'}
          </span>
          <span className="match-ladder-name">{match.ladder || match.format}</span>
        </div>

        <div style={{ marginTop: 8 }}>
          {!isScheduled
            ? <span className="match-time-live">● Available Now</span>
            : <span className="match-time-sched">
                {new Date(match.scheduledAt).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
              </span>
          }
        </div>

      </div>

      {/* ── CENTER: match details grid ── */}
      <div className="match-details-grid">
        <div className="match-detail">
          <span className="match-detail-label">Gamemode</span>
          <span className="match-detail-value">
            {match.gamemode || '—'}
          </span>
        </div>
        <div className="match-detail">
          <span className="match-detail-label">Best Of</span>
          <span className="match-detail-value">{match.bestOf}</span>
        </div>
        <div className="match-detail">
          <span className="match-detail-label">Format</span>
          <span className="match-detail-value">{formatLabel(match.format)}</span>
        </div>
        <div className="match-detail">
          <span className="match-detail-label">Map</span>
          <span className="match-detail-value" style={{ color: 'var(--text-dim)', fontStyle: 'italic' }}>
            Assigned on accept
          </span>
        </div>
        <div className="match-detail">
          <span className="match-detail-label">Premium</span>
          <span className={`match-detail-value ${isPremium ? 'yes' : ''}`}>
            {isPremium ? 'Yes' : 'No'}
          </span>
        </div>
        <div className="match-detail">
          <span className="match-detail-label">Support</span>
          <span className={`match-support-badge ${supportType}`}>
            {supportType === 'live' ? 'Live' : 'Dispute'}
          </span>
        </div>
        <div className="match-detail">
          <span className="match-detail-label">Rep</span>
          <RepBarPlaceholder value={avgRep} />
        </div>
      </div>

      {/* ── RIGHT: wager + action ── */}
      <div className="match-item-right">
        {isCash && match.wagerPerPlayer ? (
          <div className="match-wager">${(match.wagerPerPlayer / 100).toFixed(2)}</div>
        ) : null}
        {isMyMatch ? (
          <button
            className="match-listing-cancel-btn"
            style={{ marginTop: 4 }}
            onClick={() => onCancel(match)}
          >
            Cancel
          </button>
        ) : (
          <button
            className="btn-primary"
            style={{ padding: '9px 20px', fontSize: 12, marginTop: 4 }}
            onClick={() => onAccept(match)}
          >
            Accept Match
          </button>
        )}
      </div>
    </div>
  )
}

// ─── MATCHES TAB ──────────────────────────────────────────────────────────────
export function MatchesTab({ game, xpLadders, cashLadders }: { game: any; xpLadders: any[]; cashLadders: any[] }) {
  const { user } = useAuth()
  const [refreshKey, setRefreshKey] = useState(0)
  const refresh = () => setRefreshKey(k => k + 1)

  const [typeFilter,   setTypeFilter]   = useState<'all' | 'xp' | 'cash'>('all')
  const [formatFilter, setFormatFilter] = useState<'all' | 'Solo' | 'Duo' | 'Squad'>('all')
  const [showPost,     setShowPost]     = useState(false)
  const [acceptMatch,  setAcceptMatch]  = useState<any>(null)
  const [cancelMatch,  setCancelMatch]  = useState<any>(null)
  const { data: listings, loading } = useApi(
    () => matchesApi.getOpenByGame(game.slug),
    [game.slug, refreshKey]
  )
  const { data: myTeamsRaw } = useApi(
    () => user ? teamsApi.getMine() : Promise.resolve([]),
    [user?.id]
  )

  const myTeams:   any[]    = myTeamsRaw || []
  const myTeamIds: string[] = myTeams.map((t: any) => t._id?.toString())
  const myGameTeams          = myTeams.filter((t: any) => t.gameSlug === game.slug)

  const open: any[]      = listings || []
  const myOpenListing    = open.find((m: any) => myTeamIds.includes(m.teamAId?.toString()))
  const canPost          = user && myGameTeams.length > 0 && !myOpenListing

  const filtered = open.filter((m: any) => {
    if (typeFilter   !== 'all' && m.matchType !== typeFilter)   return false
    if (formatFilter !== 'all' && m.format    !== formatFilter) return false
    return true
  })

  const { mutate: doCancel } = useMutation(
    (m: any) => matchesApi.cancelListing(m.matchId, m.teamAId?.toString())
  )

  async function handleCancel(m: any) {
    setCancelMatch(m)
  }

  async function confirmCancel() {
    if (!cancelMatch) return
    await doCancel(cancelMatch)
    setCancelMatch(null)
    refresh()
  }

  return (
    <div>
      {/* Already have open listing — only show after data has loaded */}
      {!loading && myOpenListing && (
        <div className="no-team-alert" style={{ borderColor: 'rgba(240,170,26,0.3)', background: 'rgba(240,170,26,0.05)' }}>
          <span className="no-team-alert-icon">--</span>
          <div className="no-team-alert-text">
            <strong style={{ color: '#F0AA1A' }}>You already have an open listing.</strong>
            <span> Cancel it or wait for it to be accepted before posting another.</span>
          </div>
        </div>
      )}

      {/* Header — filters + post button, same as original */}
      <div className="matches-header-row">
        <div className="matches-filter-pills">
          <button className={`filter-pill${typeFilter === 'all' ? ' active' : ''}`} onClick={() => setTypeFilter('all')}>All</button>
          <button className={`filter-pill${typeFilter === 'xp'  ? ' active' : ''}`} onClick={() => setTypeFilter('xp')}>
            <span className="ladder-type-badge xp"  style={{ fontSize: 9, padding: '1px 6px' }}>XP</span>
          </button>
          <button className={`filter-pill${typeFilter === 'cash' ? ' active' : ''}`} onClick={() => setTypeFilter('cash')}>
            <span className="ladder-type-badge cash" style={{ fontSize: 9, padding: '1px 6px' }}>$</span>
          </button>
          <div style={{ width: 1, background: 'rgba(255,255,255,0.08)', margin: '0 4px' }} />
          {(['all', 'Solo', 'Duo', 'Squad'] as const).map(f => (
            <button key={f} className={`filter-pill${formatFilter === f ? ' active' : ''}`} onClick={() => setFormatFilter(f)}>
              {f === 'all' ? 'All Formats' : f}
            </button>
          ))}
        </div>

        <div className="post-match-btn-wrap">
          <button
            className="btn-primary post-match-btn"
            onClick={() => canPost && setShowPost(true)}
            disabled={!canPost}
            style={{ opacity: myOpenListing ? 0.4 : !user ? 0.5 : 1, cursor: !canPost ? 'not-allowed' : 'pointer' }}
            title={myOpenListing ? 'Cancel your existing listing first' : ''}
          >
            Post a Match
          </button>
        </div>
      </div>

      {/* Match list — same .match-list + .match-item structure as original */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '32px 0', color: 'var(--text-muted)', fontSize: 13 }}>
          Loading matches...
        </div>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '48px 0', color: 'var(--text-muted)' }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 12 }}>
            <Icon icon={Solar.gamepad} width={32} height={32} style={{ color: '#4A5568' }} />
          </div>
          <div style={{ fontWeight: 600, color: '#fff', marginBottom: 6 }}>No active matches</div>
          <div style={{ fontSize: 13 }}>Be the first to post a match challenge for this game.</div>
        </div>
      ) : (
        <div className="match-list">
          {filtered.map((m: any) => (
            <MatchListingCard
              key={m._id || m.matchId}
              match={m}
              myTeamIds={myTeamIds}
              onAccept={setAcceptMatch}
              onCancel={handleCancel}
            />
          ))}
        </div>
      )}

      {showPost && (
        <PostMatchModal
          gameSlug={game.slug}
          gameName={game.name}
          gameModes={game.modes || []}
          onClose={() => setShowPost(false)}
          onPosted={() => { setShowPost(false); refresh() }}
        />
      )}

      {acceptMatch && (
        <AcceptMatchModal
          match={acceptMatch}
          onClose={() => setAcceptMatch(null)}
          onAccepted={() => { setAcceptMatch(null); refresh() }}
        />
      )}

      {/* Cancel Confirmation Modal */}
      {cancelMatch && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }} onClick={() => setCancelMatch(null)}>
          <div style={{ background: '#18181C', borderRadius: 16, width: 420, maxWidth: '100%', border: '1px solid #25252C', overflow: 'hidden' }} onClick={e => e.stopPropagation()}>
            <div style={{ padding: '24px 24px 0', textAlign: 'center' }}>
              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 12 }}>
                <Icon icon={Solar.warning} width={40} height={40} style={{ color: '#F0AA1A' }} />
              </div>
              <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 900, fontSize: 22, color: '#fff', marginBottom: 8 }}>Cancel Match Listing?</div>
              <p style={{ fontFamily: 'Roboto, sans-serif', fontSize: 13, color: '#9CA3AF', lineHeight: 1.6, margin: 0 }}>
                This will remove your <strong style={{ color: '#fff' }}>{cancelMatch.gamemode}</strong> {cancelMatch.format || cancelMatch.ladder} listing.
                The match will be marked as cancelled and will not affect any records or standings.
              </p>
            </div>
            <div style={{ padding: '20px 24px 24px', display: 'flex', gap: 10, marginTop: 16 }}>
              <button
                onClick={() => setCancelMatch(null)}
                style={{ flex: 1, padding: '12px 0', borderRadius: 10, border: '1px solid rgba(255,255,255,0.1)', background: '#25252C', color: '#9CA3AF', fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, fontSize: 15, cursor: 'pointer' }}
              >
                Keep Listing
              </button>
              <button
                onClick={confirmCancel}
                style={{ flex: 1, padding: '12px 0', borderRadius: 10, border: '1px solid rgba(231,76,60,0.4)', background: 'rgba(231,76,60,0.15)', color: '#E74C3C', fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, fontSize: 15, cursor: 'pointer' }}
              >
                Cancel Match
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}