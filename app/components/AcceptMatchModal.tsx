'use client'

// FILE: app/components/AcceptMatchModal.tsx

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { matchesApi, teamsApi } from '@/lib/api'
import { useMutation } from '@/lib/use-api'
import { Icon } from '@iconify/react'
import { Solar } from '@/lib/solar-duotone'

const R: React.CSSProperties  = { fontFamily: 'Roboto, sans-serif' }
const BC: React.CSSProperties = { fontFamily: "'Barlow Condensed', sans-serif" }

interface AcceptMatchModalProps {
  match:   any
  onClose: () => void
  onAccepted: () => void
}

export function AcceptMatchModal({ match, onClose, onAccepted }: AcceptMatchModalProps) {
  const router = useRouter()
  const [myTeams,        setMyTeams]        = useState<any[]>([])
  const [selectedTeam,   setSelectedTeam]   = useState<any>(null)
  const [selectedPlayers,setSelectedPlayers]= useState<string[]>([])
  const [loadingTeams,   setLoadingTeams]   = useState(true)

  const isSolo    = match.format === 'Solo'
  const required  = match.teamAPlayers?.length || 1
  const isCash    = match.matchType === 'cash'
  const cfg       = isCash
    ? { accent: '#F0AA1A', dim: 'rgba(212,146,10,.15)', bdr: 'rgba(212,146,10,.3)' }
    : { accent: '#A78BFA', dim: 'rgba(124,58,237,.15)', bdr: 'rgba(124,58,237,.3)' }

  const { mutate: accept, loading, error } = useMutation((dto: any) =>
    matchesApi.accept(match.matchId, dto)
  )

  useEffect(() => {
    teamsApi.getMine().then((teams: any[]) => {
      // Must be same game + same matchType + same format (ladder) + not the posting team
      const eligible = (teams || []).filter((t: any) =>
        t.gameSlug   === match.gameSlug &&
        t.matchType  === match.matchType &&
        t.ladder     === match.format &&
        t._id        !== match.teamAId
      )
      setMyTeams(eligible)
      if (eligible.length === 1) setSelectedTeam(eligible[0])
      setLoadingTeams(false)
    }).catch(() => setLoadingTeams(false))
  }, [match])

  useEffect(() => {
    if (!selectedTeam) return
    if (isSolo) {
      const leader = selectedTeam.roster?.find((r: any) => r.role === 'Leader')
      if (leader) setSelectedPlayers([leader.userId?.toString()])
    } else {
      setSelectedPlayers([])
    }
  }, [selectedTeam, isSolo])

  function togglePlayer(uid: string) {
    setSelectedPlayers(prev =>
      prev.includes(uid) ? prev.filter(x => x !== uid) : [...prev, uid]
    )
  }

  const roster   = selectedTeam?.roster || []
  const canAccept = selectedTeam && (isSolo || selectedPlayers.length === required)

  async function handleAccept() {
    if (!canAccept || loading) return
    const players = isSolo
      ? [roster.find((r: any) => r.role === 'Leader')].filter(Boolean).map((r: any) => ({ userId: r.userId, username: r.username, initials: r.initials, color: r.color }))
      : roster.filter((r: any) => selectedPlayers.includes(r.userId?.toString())).map((r: any) => ({ userId: r.userId, username: r.username, initials: r.initials, color: r.color }))

    try {
      await accept({
        teamBId:      selectedTeam._id,
        teamBName:    selectedTeam.name,
        teamBEmoji:   selectedTeam.emoji || '',
        teamBSlug:    selectedTeam.slug,
        teamBPlayers: players,
      })
      onAccepted()
      onClose()
      // Redirect to match page
      const type = match.matchType === 'cash' ? 'cash' : 'xp'
      router.push(`/matches/${type}/${match.matchId}`)
    } catch { /* shown via error */ }
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.9)', zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }} onClick={onClose}>
      <div style={{ background: '#18181C', borderRadius: 16, width: 520, maxWidth: '100%', maxHeight: '90vh', overflow: 'auto', border: '1px solid #25252C' }} onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div style={{ padding: '20px 24px', borderBottom: '1px solid #25252C', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div style={{ ...BC, fontWeight: 900, fontSize: 22, color: '#fff' }}>Accept Match</div>
            <div style={{ ...R, fontSize: 12, color: '#6B7280', marginTop: 2 }}>{match.game} · {match.format} · {match.bestOf}</div>
          </div>
          <button onClick={onClose} style={{ background: '#25252C', border: 'none', borderRadius: 8, width: 32, height: 32, color: '#9CA3AF', cursor: 'pointer', fontSize: 15 }}>✕</button>
        </div>

        <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 18 }}>
          {error && <div style={{ background: 'rgba(231,76,60,0.1)', border: '1px solid rgba(231,76,60,0.3)', borderRadius: 8, padding: '10px 14px', ...R, fontSize: 12, color: '#E74C3C' }}>{error}</div>}

          {/* Match preview */}
          <div style={{ background: '#25252C', borderRadius: 10, padding: '14px 16px', border: '1px solid rgba(255,255,255,0.06)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
              <div style={{ ...BC, fontWeight: 900, fontSize: 16, color: '#fff' }}>
                {match.teamAEmoji} {match.teamAName}
              </div>
              <span style={{ background: cfg.dim, border: `1px solid ${cfg.bdr}`, borderRadius: 6, padding: '3px 10px', ...R, fontWeight: 700, fontSize: 11, color: cfg.accent }}>
                {isCash ? '$ Cash' : 'XP'}
              </span>
            </div>
            <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
              {[
                { label: 'Gamemode', val: match.gamemode === 'Random' ? 'Random' : match.gamemode },
                { label: 'Series',   val: match.bestOf },
                { label: 'Format',   val: match.format },
                { label: 'Map',      val: 'Revealed on accept' },
              ].map((s, i) => (
                <div key={i}>
                  <div style={{ ...R, fontSize: 10, color: '#6B7280', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 2 }}>{s.label}</div>
                  <div style={{ ...R, fontWeight: 700, fontSize: 13, color: '#fff' }}>{s.val}</div>
                </div>
              ))}
            </div>
            {isCash && match.wagerPerPlayer && (
              <div style={{ marginTop: 10, padding: '10px 12px', background: 'rgba(212,146,10,0.08)', border: '1px solid rgba(212,146,10,0.2)', borderRadius: 6 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                  <span style={{ ...R, fontSize: 11, color: '#9CA3AF' }}>Wager per player</span>
                  <span style={{ ...BC, fontWeight: 900, fontSize: 15, color: '#F0AA1A' }}>${(match.wagerPerPlayer / 100).toFixed(2)}</span>
                </div>
                {match.totalPot && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                    <span style={{ ...R, fontSize: 11, color: '#9CA3AF' }}>Total pot</span>
                    <span style={{ ...BC, fontWeight: 900, fontSize: 15, color: '#fff' }}>${(match.totalPot / 100).toFixed(2)}</span>
                  </div>
                )}
                {match.winnerPayout && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ ...R, fontSize: 11, color: '#9CA3AF' }}>Winner takes (~{match.platformFee || 7.5}% fee)</span>
                    <span style={{ ...BC, fontWeight: 900, fontSize: 15, color: '#4ade80' }}>~${(match.winnerPayout / 100).toFixed(2)}</span>
                  </div>
                )}
              </div>
            )}
            {match.message && (
              <div style={{ marginTop: 10, padding: '8px 10px', background: 'rgba(255,255,255,0.04)', borderRadius: 6, ...R, fontSize: 12, color: '#9CA3AF', fontStyle: 'italic' }}>
                "{match.message}"
              </div>
            )}
          </div>

          {/* Team selector */}
          <div>
            <label style={{ ...R, fontSize: 11, color: '#9CA3AF', display: 'block', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 }}>Your Team *</label>
            {loadingTeams ? (
              <div style={{ ...R, fontSize: 13, color: '#6B7280' }}>Loading teams...</div>
            ) : myTeams.length === 0 ? (
              <div style={{ background: 'rgba(231,76,60,0.08)', border: '1px solid rgba(231,76,60,0.2)', borderRadius: 8, padding: '12px 14px', ...R, fontSize: 13, color: '#E74C3C' }}>
                You need a <strong>{match.format}</strong> team for <strong>{match.game}</strong> to accept this match.{' '}
                <a href="/teams" style={{ color: '#E74C3C', fontWeight: 700 }}>Create one →</a>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {myTeams.map((t: any) => {
                  const isSel = selectedTeam?._id === t._id
                  return (
                    <button key={t._id} onClick={() => setSelectedTeam(t)} style={{ display: 'flex', alignItems: 'center', gap: 12, background: isSel ? '#1E1E28' : '#25252C', border: `1.5px solid ${isSel ? '#B22D2D' : 'rgba(255,255,255,0.06)'}`, borderRadius: 10, padding: '12px 16px', cursor: 'pointer', textAlign: 'left', transition: 'all .15s' }}>
                      <div style={{ width: 36, height: 36, background: '#18181C', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>{t.emoji || <Icon icon={Solar.gamepad} width={18} height={18} />}</div>
                      <div style={{ flex: 1 }}>
                        <div style={{ ...BC, fontWeight: 900, fontSize: 15, color: '#fff' }}>{t.name}</div>
                        <div style={{ ...R, fontSize: 11, color: '#9CA3AF', marginTop: 1 }}>{t.roster?.length || 1}/{t.maxMembers} members</div>
                      </div>
                    </button>
                  )
                })}
              </div>
            )}
          </div>

          {/* Player selector (non-Solo) */}
          {selectedTeam && !isSolo && (
            <div>
              <label style={{ ...R, fontSize: 11, color: '#9CA3AF', display: 'block', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                Select {required} Player{required > 1 ? 's' : ''} *
                <span style={{ color: selectedPlayers.length === required ? '#4ade80' : '#E74C3C', marginLeft: 8 }}>
                  {selectedPlayers.length}/{required}
                </span>
              </label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {roster.map((r: any) => {
                  const uid   = r.userId?.toString()
                  const isSel = selectedPlayers.includes(uid)
                  const rColor = r.color || '#E74C3C'
                  return (
                    <button key={uid} onClick={() => togglePlayer(uid)} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', borderRadius: 8, cursor: 'pointer', background: isSel ? '#1E1E28' : '#25252C', border: `1.5px solid ${isSel ? '#4ade80' : 'rgba(255,255,255,0.06)'}`, transition: 'all .15s', textAlign: 'left' }}>
                      <div style={{ width: 32, height: 32, background: rColor + '22', border: `1.5px solid ${rColor}55`, borderRadius: 7, display: 'flex', alignItems: 'center', justifyContent: 'center', ...R, fontWeight: 700, fontSize: 12, color: rColor }}>
                        {r.initials || r.username?.slice(0,2).toUpperCase()}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ ...R, fontWeight: 700, fontSize: 13, color: '#fff' }}>{r.username}</div>
                        <div style={{ ...R, fontSize: 10, color: '#6B7280' }}>{r.role}</div>
                      </div>
                      <div style={{ width: 20, height: 20, borderRadius: '50%', border: `2px solid ${isSel ? '#4ade80' : 'rgba(255,255,255,0.15)'}`, background: isSel ? '#4ade80' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all .15s' }}>
                        {isSel && <span style={{ fontSize: 10, color: '#000', fontWeight: 900 }}>✓</span>}
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          {selectedTeam && isSolo && (
            <div style={{ background: '#25252C', borderRadius: 8, padding: '10px 14px', ...R, fontSize: 12, color: '#9CA3AF' }}>
              <span style={{marginRight:6,verticalAlign:'middle',display:'inline-flex'}}><Icon icon={Solar.user} width={14} height={14} /></span>Solo match — you'll be entered as the player.
            </div>
          )}

          <button onClick={handleAccept} disabled={!canAccept || loading} style={{
            background: !canAccept ? '#1a1a20' : '#22C55E',
            border: `1px solid ${!canAccept ? 'rgba(255,255,255,0.04)' : 'rgba(34,197,94,0.4)'}`,
            borderRadius: 10, padding: '14px 0', width: '100%',
            ...BC, fontWeight: 900, fontSize: 17, letterSpacing: 0.5,
            color: !canAccept ? '#4A5568' : '#fff',
            cursor: !canAccept ? 'not-allowed' : 'pointer',
            boxShadow: !canAccept ? 'none' : '0 0 24px rgba(34,197,94,0.2)',
            transition: 'all .15s',
          }}>
            {loading ? 'Accepting...' : 'Accept Match'}
          </button>
        </div>
      </div>
    </div>
  )
}