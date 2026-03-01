'use client'

// FILE: app/components/PostMatchModal.tsx
// Used by: TeamProfilePage (pre-loads team), GameProfilePage (user picks team first)

import { useState, useEffect } from 'react'
import { matchesApi, teamsApi, gamesApi } from '@/lib/api'
import { useMutation } from '@/lib/use-api'
import { useAuth } from '@/lib/auth-context'

const R: React.CSSProperties  = { fontFamily: 'Roboto, sans-serif' }
const BC: React.CSSProperties = { fontFamily: "'Barlow Condensed', sans-serif" }

// 5-min interval times
function genTimes() {
  const times: string[] = []
  for (let h = 0; h < 24; h++) {
    for (let m = 0; m < 60; m += 5) {
      const ampm = h < 12 ? 'AM' : 'PM'
      const hh   = h === 0 ? 12 : h > 12 ? h - 12 : h
      const mm   = String(m).padStart(2, '0')
      times.push(`${hh}:${mm} ${ampm}`)
    }
  }
  return times
}
const TIMES = genTimes()
const today = () => new Date().toISOString().split('T')[0]

interface PostMatchModalProps {
  onClose:   () => void
  onPosted:  () => void
  // If coming from Team page — all pre-loaded
  preTeam?:  {
    _id:        string
    name:       string
    emoji:      string
    slug:       string
    game:       string
    gameSlug:   string
    matchType:  'cash' | 'xp'
    ladder:     string
    format:     'Solo' | 'Duo' | 'Squad'
    maxMembers: number
    roster:     any[]
    modes:      string[]    // game modes
  }
  // If coming from Game page — user picks their team
  gameSlug?: string
  gameName?: string
  gameModes?: string[]
}

export default function PostMatchModal({ onClose, onPosted, preTeam, gameSlug, gameName, gameModes }: PostMatchModalProps) {
  const { user } = useAuth()

  // If no preTeam, user picks from their teams for this game
  const [myTeams,    setMyTeams]    = useState<any[]>([])
  const [selectedTeam, setSelectedTeam] = useState<any>(preTeam || null)
  const [loadingTeams, setLoadingTeams] = useState(!preTeam)

  // Form state

  // Form state
  const [gamemode,      setGamemode]      = useState('')
  const [bestOf,        setBestOf]        = useState<'BO1'|'BO3'|'BO5'>('BO1')
  const [scheduleType,  setScheduleType]  = useState<'now'|'scheduled'>('now')
  const [schedDate,     setSchedDate]     = useState(today())
  const [schedTime,     setSchedTime]     = useState('12:00 PM')
  const [selectedPlayers, setSelectedPlayers] = useState<string[]>([])


  const { mutate: post, loading, error } = useMutation((dto: any) => matchesApi.createListing(dto))

  // Game modes — for Games page, load from game when team selected
  const [loadedModes, setLoadedModes] = useState<string[]>(gameModes || [])

  // Load user's teams for the game if no preTeam
  useEffect(() => {
    if (preTeam) return
    setLoadingTeams(true)
    teamsApi.getMine().then((teams: any[]) => {
      const filtered = (teams || []).filter((t: any) => !gameSlug || t.gameSlug === gameSlug)
      setMyTeams(filtered)
      if (filtered.length === 1) setSelectedTeam(filtered[0])
      setLoadingTeams(false)
    }).catch(() => setLoadingTeams(false))
  }, [preTeam, gameSlug])

  // Always fetch modes from the game (teams don't store modes)
  useEffect(() => {
    const slug = preTeam?.gameSlug || selectedTeam?.gameSlug
    if (!slug) return
    gamesApi.getBySlug(slug).then((g: any) => {
      setLoadedModes(g?.modes || [])
    }).catch(() => {})
  }, [preTeam?.gameSlug, selectedTeam?.gameSlug])

  // Auto-select solo leader
  useEffect(() => {
    if (!selectedTeam) return
    if (selectedTeam.format === 'Solo' || selectedTeam.ladder === 'Solo') {
      const leader = selectedTeam.roster?.find((r: any) => r.role === 'Leader')
      if (leader) setSelectedPlayers([leader.userId?.toString() || leader._id])
    } else {
      setSelectedPlayers([])
    }
    setGamemode('')
  }, [selectedTeam])

  const isSolo     = selectedTeam?.format === 'Solo' || selectedTeam?.ladder === 'Solo'
  const isCash     = selectedTeam?.matchType === 'cash'
  const modes      = loadedModes
  const roster     = selectedTeam?.roster || []
  const required   = selectedTeam?.maxMembers || 1
  const cfg        = isCash
    ? { accent: '#F0AA1A', dim: 'rgba(212,146,10,.15)', bdr: 'rgba(212,146,10,.3)', badge: '$ CASH' }
    : { accent: '#A78BFA', dim: 'rgba(124,58,237,.15)', bdr: 'rgba(124,58,237,.3)', badge: 'XP' }

  function togglePlayer(uid: string) {
    setSelectedPlayers(prev =>
      prev.includes(uid) ? prev.filter(x => x !== uid) : [...prev, uid]
    )
  }

  const canSubmit = selectedTeam && gamemode &&
    (isSolo || selectedPlayers.length === required) &&
    (scheduleType === 'now' || (schedDate && schedTime))

  async function handleSubmit() {
    if (!canSubmit || loading) return
    const players = isSolo
      ? [roster.find((r: any) => r.role === 'Leader')].filter(Boolean).map((r: any) => ({ userId: r.userId, username: r.username, initials: r.initials, color: r.color }))
      : roster.filter((r: any) => selectedPlayers.includes(r.userId?.toString())).map((r: any) => ({ userId: r.userId, username: r.username, initials: r.initials, color: r.color }))

    let scheduledAt: string | undefined
    if (scheduleType === 'scheduled') {
      const [time, ampm] = schedTime.split(' ')
      let [hh, mm]       = time.split(':').map(Number)
      if (ampm === 'PM' && hh !== 12) hh += 12
      if (ampm === 'AM' && hh === 12) hh = 0
      scheduledAt = new Date(`${schedDate}T${String(hh).padStart(2,'0')}:${String(mm).padStart(2,'0')}:00`).toISOString()
    }

    try {
      await post({
        teamAId:       selectedTeam._id,
        teamAName:     selectedTeam.name,
        teamAEmoji:    selectedTeam.emoji || '🎮',
        teamASlug:     selectedTeam.slug,
        teamAPlayers:  players,
        game:          selectedTeam.game,
        gameSlug:      selectedTeam.gameSlug,
        matchType:     selectedTeam.matchType,
        format:        selectedTeam.format || selectedTeam.ladder,
        ladder:        selectedTeam.ladder,
        gamemode,
        bestOf,
        scheduleType,
        scheduledAt,
      })
      onPosted()
      onClose()
    } catch { /* shown via error */ }
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.9)', zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }} onClick={onClose}>
      <div style={{ background: '#18181C', borderRadius: 16, width: 560, maxWidth: '100%', maxHeight: '90vh', overflow: 'auto', border: '1px solid #25252C' }} onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div style={{ padding: '20px 24px', borderBottom: '1px solid #25252C', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
          <div>
            <div style={{ ...BC, fontWeight: 900, fontSize: 22, color: '#fff' }}>Post a Match</div>
            <div style={{ ...R, fontSize: 12, color: '#6B7280', marginTop: 2 }}>
              {preTeam ? `${preTeam.game} · ${preTeam.ladder}` : gameName || 'Select your team to continue'}
            </div>
          </div>
          <button onClick={onClose} style={{ background: '#25252C', border: 'none', borderRadius: 8, width: 32, height: 32, color: '#9CA3AF', cursor: 'pointer', flexShrink: 0, fontSize: 15 }}>✕</button>
        </div>

        <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 20 }}>
          {error && (
            <div style={{ background: 'rgba(231,76,60,0.1)', border: '1px solid rgba(231,76,60,0.3)', borderRadius: 8, padding: '10px 14px', ...R, fontSize: 12, color: '#E74C3C' }}>{error}</div>
          )}

          {/* ── TEAM SELECTOR (Games page only) ── */}
          {!preTeam && (
            <div>
              <label style={{ ...R, fontSize: 11, color: '#9CA3AF', display: 'block', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 }}>Your Team *</label>
              {loadingTeams ? (
                <div style={{ ...R, fontSize: 13, color: '#6B7280', padding: '12px 0' }}>Loading teams...</div>
              ) : myTeams.length === 0 ? (
                <div style={{ background: 'rgba(231,76,60,0.08)', border: '1px solid rgba(231,76,60,0.2)', borderRadius: 8, padding: '12px 14px', ...R, fontSize: 13, color: '#E74C3C' }}>
                  You don't have a team for this game yet. <a href="/teams" style={{ color: '#E74C3C', fontWeight: 700 }}>Create one →</a>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {myTeams.map((t: any) => {
                    const isSel = selectedTeam?._id === t._id
                    const tCash = t.matchType === 'cash'
                    return (
                      <button key={t._id} onClick={() => setSelectedTeam(t)} style={{ display: 'flex', alignItems: 'center', gap: 14, background: isSel ? '#1E1E28' : '#25252C', border: `1.5px solid ${isSel ? '#B22D2D' : 'rgba(255,255,255,0.06)'}`, borderRadius: 10, padding: '12px 16px', cursor: 'pointer', textAlign: 'left', transition: 'all .15s' }}>
                        <div style={{ width: 40, height: 40, background: '#18181C', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>{t.emoji || '🎮'}</div>
                        <div style={{ flex: 1 }}>
                          <div style={{ ...BC, fontWeight: 900, fontSize: 16, color: '#fff' }}>{t.name}</div>
                          <div style={{ ...R, fontSize: 11, color: '#9CA3AF', marginTop: 2 }}>{t.ladder} · {t.roster?.length || 1}/{t.maxMembers} members</div>
                        </div>
                        <span style={{ background: tCash ? 'rgba(212,146,10,0.12)' : 'rgba(124,58,237,0.12)', border: `1px solid ${tCash ? 'rgba(212,146,10,0.3)' : 'rgba(124,58,237,0.3)'}`, borderRadius: 6, padding: '3px 9px', ...R, fontWeight: 700, fontSize: 11, color: tCash ? '#F0AA1A' : '#A78BFA' }}>
                          {tCash ? '$ Cash' : 'XP'}
                        </span>
                      </button>
                    )
                  })}
                </div>
              )}
            </div>
          )}

          {/* ── TEAM PREVIEW (Team page pre-load) ── */}
          {preTeam && selectedTeam && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, background: '#25252C', borderRadius: 10, padding: '14px 16px', border: '1px solid rgba(255,255,255,0.06)' }}>
              <div style={{ width: 48, height: 48, background: '#18181C', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26 }}>{selectedTeam.emoji || '🎮'}</div>
              <div style={{ flex: 1 }}>
                <div style={{ ...BC, fontWeight: 900, fontSize: 18, color: '#fff' }}>{selectedTeam.name}</div>
                <div style={{ ...R, fontSize: 11, color: '#9CA3AF', marginTop: 2 }}>{selectedTeam.game} · {selectedTeam.ladder} · {selectedTeam.roster?.length || 1}/{selectedTeam.maxMembers}</div>
              </div>
              <span style={{ background: cfg.dim, border: `1px solid ${cfg.bdr}`, borderRadius: 6, padding: '4px 10px', ...R, fontWeight: 700, fontSize: 11, color: cfg.accent }}>{cfg.badge}</span>
            </div>
          )}

          {/* Only show rest of form once team is selected */}
          {selectedTeam && (
            <>
              {/* ── SCHEDULE ── */}
              <div>
                <label style={{ ...R, fontSize: 11, color: '#9CA3AF', display: 'block', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 }}>Availability *</label>
                <div style={{ display: 'flex', gap: 8, marginBottom: scheduleType === 'scheduled' ? 12 : 0 }}>
                  {(['now', 'scheduled'] as const).map(s => (
                    <button key={s} onClick={() => setScheduleType(s)} style={{ flex: 1, padding: '11px 0', borderRadius: 8, cursor: 'pointer', background: scheduleType === s ? 'rgba(178,45,45,0.15)' : '#25252C', border: `1.5px solid ${scheduleType === s ? 'rgba(178,45,45,0.45)' : 'rgba(255,255,255,0.07)'}`, ...R, fontWeight: 700, fontSize: 13, color: scheduleType === s ? '#fff' : '#6B7280', transition: 'all .15s' }}>
                      {s === 'now' ? <><svg width="12" height="12" viewBox="0 0 24 24" fill="none" style={{marginRight:5,verticalAlign:'middle'}}><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" fill="currentColor"/></svg>Available Now</> : <><svg width="12" height="12" viewBox="0 0 24 24" fill="none" style={{marginRight:5,verticalAlign:'middle'}}><rect x="3" y="4" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="2"/><path d="M16 2v4M8 2v4M3 10h18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>Schedule Match</>}
                    </button>
                  ))}
                </div>
                {scheduleType === 'scheduled' && (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                    <div>
                      <div style={{ ...R, fontSize: 10, color: '#6B7280', marginBottom: 4 }}>DATE</div>
                      <input type="date" value={schedDate} min={today()} onChange={e => setSchedDate(e.target.value)}
                        style={{ width: '100%', background: '#25252C', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, padding: '9px 12px', color: '#fff', ...R, fontSize: 13, outline: 'none', boxSizing: 'border-box' }} />
                    </div>
                    <div>
                      <div style={{ ...R, fontSize: 10, color: '#6B7280', marginBottom: 4 }}>TIME</div>
                      <select value={schedTime} onChange={e => setSchedTime(e.target.value)}
                        style={{ width: '100%', background: '#25252C', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, padding: '9px 12px', color: '#fff', ...R, fontSize: 13, outline: 'none', boxSizing: 'border-box' }}>
                        {TIMES.map(t => <option key={t}>{t}</option>)}
                      </select>
                    </div>
                  </div>
                )}
              </div>

              {/* ── BEST OF ── */}
              <div>
                <label style={{ ...R, fontSize: 11, color: '#9CA3AF', display: 'block', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 }}>Series *</label>
                <div style={{ display: 'flex', gap: 8 }}>
                  {(['BO1', 'BO3', 'BO5'] as const).map(b => (
                    <button key={b} onClick={() => setBestOf(b)} style={{ flex: 1, padding: '12px 0', borderRadius: 8, cursor: 'pointer', background: bestOf === b ? 'rgba(178,45,45,0.15)' : '#25252C', border: `1.5px solid ${bestOf === b ? 'rgba(178,45,45,0.45)' : 'rgba(255,255,255,0.07)'}`, ...BC, fontWeight: 900, fontSize: 20, color: bestOf === b ? '#fff' : '#6B7280', transition: 'all .15s' }}>
                      {b}
                      <div style={{ ...R, fontSize: 10, fontWeight: 400, opacity: 0.5, marginTop: 2 }}>Best of {b.replace('BO', '')}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* ── GAMEMODE ── */}
              <div>
                <label style={{ ...R, fontSize: 11, color: '#9CA3AF', display: 'block', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 }}>Gamemode *</label>
                {modes.length === 0 ? (
                  <div style={{ ...R, fontSize: 12, color: '#6B7280', padding: '8px 0' }}>No gamemodes configured for this game.</div>
                ) : (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 8 }}>
                    {[...modes, 'Random'].map(m => (
                      <button key={m} onClick={() => setGamemode(m)} style={{ padding: '10px 12px', borderRadius: 8, cursor: 'pointer', background: gamemode === m ? 'rgba(178,45,45,0.15)' : '#25252C', border: `1.5px solid ${gamemode === m ? 'rgba(178,45,45,0.45)' : 'rgba(255,255,255,0.07)'}`, ...R, fontWeight: 700, fontSize: 12, color: gamemode === m ? '#fff' : '#9CA3AF', textAlign: 'left', transition: 'all .15s' }}>
                        {m === 'Random' ? <><svg width="12" height="12" viewBox="0 0 24 24" fill="none" style={{marginRight:4,verticalAlign:'middle'}}><rect x="2" y="2" width="20" height="20" rx="3" stroke="currentColor" strokeWidth="2"/><circle cx="8" cy="8" r="1.5" fill="currentColor"/><circle cx="12" cy="12" r="1.5" fill="currentColor"/><circle cx="16" cy="16" r="1.5" fill="currentColor"/></svg>Random</> : m}
                        {m === 'Random' && <div style={{ fontSize: 10, fontWeight: 400, color: '#6B7280', marginTop: 2 }}>System picks mode + map</div>}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* ── MAP NOTE ── */}
              {gamemode && (
                <div style={{ background: 'rgba(167,139,250,0.08)', border: '1px solid rgba(167,139,250,0.2)', borderRadius: 8, padding: '10px 14px', display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" style={{flexShrink:0}}><path d="M1 6v16l7-4 8 4 7-4V2l-7 4-8-4-7 4z" stroke="#A78BFA" strokeWidth="2" strokeLinejoin="round"/><path d="M8 2v16M16 6v16" stroke="#A78BFA" strokeWidth="2" strokeLinecap="round"/></svg>
                  <div style={{ ...R, fontSize: 12, color: '#cbd5e1', lineHeight: 1.5 }}>
                    <strong style={{ color: '#A78BFA' }}>Map assigned on accept.</strong>{' '}
                    {gamemode === 'Random'
                      ? 'A random gamemode and its valid map will be revealed when your opponent accepts.'
                      : `A valid ${gamemode} map will be randomly assigned when your opponent accepts.`}
                  </div>
                </div>
              )}

              {/* ── TEAMMATE SELECTION (non-Solo only) ── */}
              {!isSolo && (
                <div>
                  <label style={{ ...R, fontSize: 11, color: '#9CA3AF', display: 'block', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                    Select Players for This Match *
                    <span style={{ color: selectedPlayers.length === required ? '#4ade80' : '#E74C3C', marginLeft: 8 }}>
                      {selectedPlayers.length}/{required} selected
                    </span>
                  </label>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {roster.map((r: any) => {
                      const uid    = r.userId?.toString()
                      const isSel  = selectedPlayers.includes(uid)
                      const rColor = r.color || '#E74C3C'
                      return (
                        <button key={uid} onClick={() => togglePlayer(uid)} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', borderRadius: 8, cursor: 'pointer', background: isSel ? '#1E1E28' : '#25252C', border: `1.5px solid ${isSel ? '#4ade80' : 'rgba(255,255,255,0.06)'}`, transition: 'all .15s', textAlign: 'left' }}>
                          <div style={{ width: 32, height: 32, background: rColor + '22', border: `1.5px solid ${rColor}55`, borderRadius: 7, display: 'flex', alignItems: 'center', justifyContent: 'center', ...R, fontWeight: 700, fontSize: 12, color: rColor, flexShrink: 0 }}>
                            {r.initials || r.username?.slice(0,2).toUpperCase()}
                          </div>
                          <div style={{ flex: 1 }}>
                            <div style={{ ...R, fontWeight: 700, fontSize: 13, color: '#fff' }}>{r.username}</div>
                            <div style={{ ...R, fontSize: 10, color: '#6B7280' }}>{r.role}</div>
                          </div>
                          <div style={{ width: 20, height: 20, borderRadius: '50%', border: `2px solid ${isSel ? '#4ade80' : 'rgba(255,255,255,0.15)'}`, background: isSel ? '#4ade80' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'all .15s' }}>
                            {isSel && <span style={{ fontSize: 10, color: '#000', fontWeight: 900 }}>✓</span>}
                          </div>
                        </button>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* Solo auto-fill note */}
              {isSolo && (
                <div style={{ background: '#25252C', borderRadius: 8, padding: '10px 14px', ...R, fontSize: 12, color: '#9CA3AF' }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" style={{marginRight:6,verticalAlign:'middle'}}><path d="M6 11h4M8 9v4M15 12h.01M18 10h.01" stroke="#9CA3AF" strokeWidth="2" strokeLinecap="round"/><path d="M17.32 5H6.68a4 4 0 00-3.978 3.59l-.95 7.6A2 2 0 003.737 18.5h1.526a2 2 0 001.94-1.515L7.88 14h8.24l.677 2.985A2 2 0 0018.737 18.5h1.526a2 2 0 001.985-2.31l-.95-7.6A4 4 0 0017.32 5z" stroke="#9CA3AF" strokeWidth="2"/></svg>Solo match — you'll be auto-entered as the player.
                </div>
              )}

              {/* ── SUBMIT ── */}
              <button onClick={handleSubmit} disabled={!canSubmit || loading} style={{
                background: !canSubmit ? '#1a1a20' : '#B22D2D',
                border: `1px solid ${!canSubmit ? 'rgba(255,255,255,0.04)' : 'rgba(178,45,45,0.5)'}`,
                borderRadius: 10, padding: '14px 0', width: '100%',
                ...BC, fontWeight: 900, fontSize: 17, letterSpacing: 0.5,
                color: !canSubmit ? '#4A5568' : '#fff',
                cursor: !canSubmit ? 'not-allowed' : 'pointer',
                boxShadow: !canSubmit ? 'none' : '0 0 24px rgba(178,45,45,0.25)',
                transition: 'all .15s',
              }}>
                {loading ? 'Posting...' : 'Post Match Listing'}
              </button>

              <div style={{ ...R, fontSize: 11, color: '#4A5568', textAlign: 'center', lineHeight: 1.5 }}>
                Your match will appear on the <strong style={{ color: '#9CA3AF' }}>{selectedTeam.game}</strong> game page.
                Opponent teams can accept — map is revealed on acceptance.
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}