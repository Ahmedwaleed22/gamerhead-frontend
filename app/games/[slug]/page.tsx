'use client'

// FILE: app/games/[slug]/page.tsx

import { useState } from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { useApi, useMutation } from '@/lib/use-api'
import { gamesApi, powApi, teamsApi, matchesApi, supportApi } from '@/lib/api'
import { useAuth } from '@/lib/auth-context'
import { MatchesTab } from '@/app/components/GameMatchesTab'
import { Icon } from '@iconify/react'
import { Solar } from '@/lib/solar-duotone'

const NAV_ITEMS = [
  { label: 'Overview',     tab: 'overview' },
  { label: 'Matches',      tab: 'matches'  },
  { label: 'Game Rules',   tab: 'rules'    },
  { label: 'Live Support', tab: 'support'  },
]

// ─── SUPPORT TAB ──────────────────────────────────────────────────────────────
function SupportTab({ gameName }: { gameName: string }) {
  const router = useRouter()
  const [subject, setSubject] = useState('')
  const [category, setCategory] = useState('Match Dispute')
  const [message, setMessage] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  const submit = async () => {
    if (!subject.trim()) return setError('Subject is required')
    setSubmitting(true)
    setError('')
    try {
      await supportApi.create({ game: gameName, department: category, subject: subject.trim(), description: message.trim() })
      setSuccess(true)
      setSubject('')
      setCategory('Match Dispute')
      setMessage('')
    } catch (e: any) {
      setError(e?.message || 'Failed to submit ticket')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="gp-create-match">
      <div className="section-header">
        <h2 className="section-title">Contact <span>Live Support</span></h2>
      </div>
      {success ? (
        <div style={{ marginTop: 20, textAlign: 'center', padding: '40px 20px' }}>
          <div style={{ marginBottom: 12, display: 'flex', justifyContent: 'center' }}>
            <Icon icon={Solar.check} width={44} height={44} style={{ color: '#22c55e' }} />
          </div>
          <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 900, fontSize: 20, color: '#fff', marginBottom: 8 }}>Ticket Submitted!</div>
          <div style={{ fontFamily: 'Roboto, sans-serif', fontSize: 13, color: '#9CA3AF', marginBottom: 20 }}>Your support ticket has been created. You can track it in the Support Center.</div>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
            <button className="btn-primary" style={{ padding: '10px 28px' }} onClick={() => router.push('/support')}>View My Tickets</button>
            <button className="btn-primary" style={{ padding: '10px 28px', background: 'var(--card-bg)', border: '1px solid rgba(255,255,255,0.1)', color: '#9CA3AF' }} onClick={() => setSuccess(false)}>Submit Another</button>
          </div>
        </div>
      ) : (
        <div className="gp-create-form" style={{ marginTop: 20 }}>
          <div className="gp-form-row">
            <div className="gp-form-group" style={{ flex: 2 }}>
              <label className="gp-form-label">Subject</label>
              <input type="text" className="modal-input" style={{ height: 40, fontSize: 13 }} placeholder="e.g. Match dispute #1234" value={subject} onChange={e => setSubject(e.target.value)} />
            </div>
            <div className="gp-form-group">
              <label className="gp-form-label">Category</label>
              <select className="modal-input" style={{ height: 40, fontSize: 13 }} value={category} onChange={e => setCategory(e.target.value)}>
                <option>Match Dispute</option>
                <option>Payment Issue</option>
                <option>Technical Problem</option>
                <option>General</option>
              </select>
            </div>
          </div>
          <div className="gp-form-group" style={{ width: '100%' }}>
            <label className="gp-form-label">Message</label>
            <textarea className="modal-input" style={{ height: 100, fontSize: 13, paddingTop: 10, resize: 'vertical' }} placeholder="Describe your issue..." value={message} onChange={e => setMessage(e.target.value)} />
          </div>
          {error && <div style={{ fontFamily: 'Roboto, sans-serif', fontSize: 12, color: 'var(--red)', marginTop: 4 }}>{error}</div>}
          <button className="btn-primary" style={{ marginTop: 8, padding: '12px 32px', opacity: submitting ? 0.6 : 1 }} onClick={submit} disabled={submitting}>
            {submitting ? 'Submitting...' : 'Submit Ticket'}
          </button>
        </div>
      )}
    </div>
  )
}

// ─── REP BAR ──────────────────────────────────────────────────────────────────
function RepBar({ value }: { value: number }) {
  const color = value >= 80 ? '#4ade80' : value >= 50 ? '#f0c040' : '#e8000d'
  return (
    <div className="rep-bar-wrap">
      <div className="rep-bar-track">
        <div className="rep-bar-fill" style={{ width: `${value}%`, background: color }} />
      </div>
      <span className="rep-bar-label" style={{ color }}>{value}</span>
    </div>
  )
}

// ─── CREATE TEAM MODAL ─────────────────────────────────────────────────────────
function Modal({ onClose, children }: { onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-box" onClick={e => e.stopPropagation()}>
        <button type="button" className="modal-close-btn" onClick={onClose} aria-label="Close"><Icon icon={Solar.close} width={18} height={18} /></button>
        <div className="modal-inner">{children}</div>
      </div>
    </div>
  )
}

function CreateTeamModal({ game, ladder, onClose }: { game: any; ladder: any; onClose: () => void }) {
  const { user } = useAuth()
  const router = useRouter()
  const [teamName, setTeamName] = useState('')
  const [agreed, setAgreed] = useState(false)
  const [logoPreview, setLogoPreview] = useState<string | null>(game.bannerUrl || null)
  const [bannerPreview, setBannerPreview] = useState<string | null>(game.bannerUrl || null)
  const { mutate: createTeam, loading, error } = useMutation((dto: any) => teamsApi.create(dto))

  // Use game's teamSizes config for player count, with sensible fallbacks
  // teamSizes can be Record<string, number[]> (new) or Record<string, number> (old)
  const gameTeamSizes = game.teamSizes && typeof game.teamSizes === 'object' ? game.teamSizes : {}
  const rawVal = gameTeamSizes[ladder.teamSize]
  const fallbackMap: Record<string, number> = { Solo: 1, Duo: 2, Trio: 3, Squad: 4 }
  // If array, use max value; if number, use directly; else fallback
  const playersPerMatch = Array.isArray(rawVal) ? Math.max(...rawVal) : (rawVal || fallbackMap[ladder.teamSize] || 4)
  // Allow extra roster members: Solo=1, Duo=up to 4, Squad=up to 12
  const rosterMap: Record<string, number> = { Solo: 1, Duo: 4, Squad: 12 }
  const maxMembers = rosterMap[ladder.teamSize] || playersPerMatch
  const disabled = !teamName.trim() || !agreed || loading

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>, type: 'logo' | 'banner') {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) return
    if (file.size > 2 * 1024 * 1024) { alert('File must be under 2MB'); return }
    const reader = new FileReader()
    reader.onload = ev => {
      const dataUrl = ev.target?.result as string
      if (type === 'logo') setLogoPreview(dataUrl)
      else setBannerPreview(dataUrl)
    }
    reader.readAsDataURL(file)
    e.target.value = ''
  }

  async function handleSubmit() {
    if (disabled) return
    try {
      const result = await createTeam({
        name: teamName.trim(),
        game: game.name,
        gameSlug: game.slug,
        gameEmoji: game.emoji || '🎮',
        matchType: ladder.type || 'xp',
        ladder: ladder.teamSize,
        maxMembers,
        captainUsername: user?.username || 'Unknown',
        ...(logoPreview ? { logoUrl: logoPreview } : {}),
        ...(bannerPreview ? { bannerUrl: bannerPreview } : {}),
      })
      onClose()
      if (result?.slug) router.push(`/teams/${result.slug}`)
    } catch { /* error shown in modal */ }
  }

  return (
    <Modal onClose={onClose}>
      <div className="popup-game-header">
        <div className="popup-game-icon" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Icon icon={Solar.gamepad} width={28} height={28} style={{ display: 'block' }} />
        </div>
        <div>
          <div className="popup-game-name">{game.name}</div>
          <div className="popup-game-sub">Format: {(game.platforms || []).join(' & ')}</div>
        </div>
        <button type="button" className="popup-close-x" onClick={onClose} aria-label="Close"><Icon icon={Solar.close} width={18} height={18} /></button>
      </div>
      <div className="popup-divider" />
      <div className="popup-section-label">Joining: <span style={{ color: 'var(--red)' }}>{ladder.name}</span></div>
      {error && <p style={{ color: '#E74C3C', fontSize: 12, margin: '8px 0' }}>{error}</p>}
      <div className="popup-field">
        <label className="popup-label">Team Name</label>
        <input className="popup-input" placeholder="Enter team name..." value={teamName} onChange={e => setTeamName(e.target.value)} />
      </div>

      {/* Team PFP */}
      <div style={{ marginTop: 14 }}>
        <label className="popup-label">Team Profile Picture</label>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 6 }}>
          <div style={{
            width: 52, height: 52, background: '#25252C', borderRadius: 10,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            border: '1px solid rgba(255,255,255,0.08)', flexShrink: 0, overflow: 'hidden',
          }}>
            {logoPreview
              ? <img src={logoPreview} alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              : <span style={{ fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 900, fontSize: 20, color: '#4A5568' }}>{teamName?.charAt(0)?.toUpperCase() || 'T'}</span>}
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <label style={{
              background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: 6, padding: '7px 14px',
              fontFamily: 'Roboto, sans-serif', fontWeight: 600, fontSize: 11,
              color: '#9CA3AF', cursor: 'pointer',
            }}>
              Upload
              <input type="file" accept="image/*" onChange={e => handleFileSelect(e, 'logo')} style={{ display: 'none' }} />
            </label>
            {logoPreview && logoPreview !== (game.bannerUrl || '') && (
              <button onClick={() => setLogoPreview(game.bannerUrl || null)} style={{
                background: 'rgba(231,76,60,0.08)', border: '1px solid rgba(231,76,60,0.2)',
                borderRadius: 6, padding: '7px 12px',
                fontFamily: 'Roboto, sans-serif', fontWeight: 600, fontSize: 11,
                color: '#E74C3C', cursor: 'pointer',
              }}>Reset</button>
            )}
          </div>
        </div>
        <div style={{ fontFamily: 'Roboto, sans-serif', fontSize: 10, color: '#4A5568', marginTop: 4 }}>JPG or PNG, max 2MB</div>
      </div>

      {/* Team Banner */}
      <div style={{ marginTop: 14 }}>
        <label className="popup-label">Team Banner</label>
        <div style={{
          height: 64, marginTop: 6,
          background: bannerPreview ? 'none' : 'linear-gradient(135deg, #1a1a2a, #25252C)',
          borderRadius: 8, border: '1px dashed rgba(255,255,255,0.08)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          overflow: 'hidden',
        }}>
          {bannerPreview
            ? <img src={bannerPreview} alt="Banner" style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={e => { (e.target as HTMLImageElement).style.display = 'none' }} />
            : <span style={{ fontFamily: 'Roboto, sans-serif', fontSize: 11, color: '#4A5568' }}>No banner</span>}
        </div>
        <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
          <label style={{
            background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: 6, padding: '7px 14px',
            fontFamily: 'Roboto, sans-serif', fontWeight: 600, fontSize: 11,
            color: '#9CA3AF', cursor: 'pointer',
          }}>
            Upload Banner
            <input type="file" accept="image/*" onChange={e => handleFileSelect(e, 'banner')} style={{ display: 'none' }} />
          </label>
          {bannerPreview && bannerPreview !== (game.bannerUrl || '') && (
            <button onClick={() => setBannerPreview(game.bannerUrl || null)} style={{
              background: 'rgba(231,76,60,0.08)', border: '1px solid rgba(231,76,60,0.2)',
              borderRadius: 6, padding: '7px 12px',
              fontFamily: 'Roboto, sans-serif', fontWeight: 600, fontSize: 11,
              color: '#E74C3C', cursor: 'pointer',
            }}>Reset</button>
          )}
        </div>
        <div style={{ fontFamily: 'Roboto, sans-serif', fontSize: 10, color: '#4A5568', marginTop: 4 }}>1200x300px recommended, max 2MB</div>
      </div>

      <p className="popup-disclaimer">
        By creating a team you agree to compete under the platform rules. All team members must have verified accounts. Team name cannot be changed once registered for a season.
      </p>
      <label className="popup-checkbox-row">
        <input type="checkbox" checked={agreed} onChange={e => setAgreed(e.target.checked)} />
        <span>By checking this box, you accept the Ladder Rule & Prizing</span>
      </label>
      <button className="popup-submit-btn" disabled={disabled} onClick={handleSubmit}>
        {loading ? 'CREATING...' : 'CREATE A TEAM'}
      </button>
    </Modal>
  )
}

// ─── OVERVIEW TAB ─────────────────────────────────────────────────────────────
function OverviewTab({ game, xpLadders }: { game: any; xpLadders: any[] }) {
  const { user } = useAuth()
  const [selectedLadder, setSelectedLadder] = useState<any>(null)
  const [showCreateTeam, setShowCreateTeam] = useState(false)

  // Fetch user's teams to check if they already have one for this ladder
  const { data: myTeams } = useApi(
    () => user ? teamsApi.getMine() : Promise.resolve([]),
    [(user as any)?._id || user?.id],
  )
  const myGameTeams = (Array.isArray(myTeams) ? myTeams : []).filter((t: any) => t.game === game.name && !t.isDisbanded)

  // Find user's existing team for the selected ladder
  const existingTeam = selectedLadder ? myGameTeams.find((t: any) =>
    t.matchType === selectedLadder.type && t.ladder === selectedLadder.teamSize
  ) : null

  function teamSizeLabel(ts: string) {
    if (ts === 'Solo') return '1v1'
    if (ts === 'Duo')  return '2v2'
    if (ts === 'Trio') return '3v3'
    return '4v4'
  }

  function renderLadderCard(l: any, color: string) {
    const isXp       = l.type === 'xp'
    const isSelected = selectedLadder?._id === l._id
    return (
      <div key={l._id} className={`ladder-card${isSelected ? ' selected' : ''}`} onClick={() => setSelectedLadder(isSelected ? null : l)}>
        <div className="ladder-card-top">
          <div className="ladder-card-name">{l.name}</div>
          <span className={`ladder-type-badge ${isXp ? 'xp' : 'cash'}`}>{isXp ? 'XP' : 'CASH'}</span>
        </div>
        <div className="ladder-card-meta">
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
            <Icon icon={Solar.globe} width={14} height={14} style={{ flexShrink: 0, opacity: 0.9 }} /> {l.region}
          </span>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
            <Icon icon={l.teamSize === 'Solo' ? Solar.user : Solar.users} width={14} height={14} style={{ flexShrink: 0, opacity: 0.9 }} /> {teamSizeLabel(l.teamSize)}
          </span>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
            <Icon icon={Solar.target} width={14} height={14} style={{ flexShrink: 0, opacity: 0.9 }} /> {l.teamsJoined}/{l.totalSlots} teams
          </span>
        </div>
        <div className="ladder-join-bar">
          <div className="ladder-join-fill" style={{ width: `${(l.teamsJoined / l.totalSlots) * 100}%`, background: color }} />
        </div>
      </div>
    )
  }

  return (
    <div>
      {selectedLadder && (
        <div className="ladder-expand-panel" style={{ marginBottom: 24 }}>
          <div className="ladder-expand-header">
            <div>
              <div className="ladder-expand-name">{selectedLadder.name}</div>
              <div className="ladder-expand-sub">Season ends {selectedLadder.seasonEndDisplay}</div>
            </div>
            {existingTeam ? (
              <Link href={`/teams/${existingTeam.slug}`} className="btn-primary" style={{ padding: '9px 20px', fontSize: 13, textDecoration: 'none' }}>
                View Team
              </Link>
            ) : (
              <button className="btn-primary" style={{ padding: '9px 20px', fontSize: 13 }} onClick={() => setShowCreateTeam(true)}>
                + Create Team
              </button>
            )}
          </div>
          <div className="ladder-details-grid">
            {[
              { label: 'Prize',        value: selectedLadder.prize },
              { label: 'Region',       value: selectedLadder.region },
              { label: 'Platform',     value: selectedLadder.platform },
              { label: 'Team Size',    value: selectedLadder.teamSize },
              { label: 'Total Slots',  value: selectedLadder.totalSlots },
              { label: 'Teams Joined', value: selectedLadder.teamsJoined },
              { label: 'Season End',   value: selectedLadder.seasonEndDisplay },
            ].map((d, i) => (
              <div key={i} className="ladder-detail-item">
                <div className="ladder-detail-label">{d.label}</div>
                <div className="ladder-detail-value">{d.value}</div>
              </div>
            ))}
          </div>
          <div className="ladder-expand-lb-title">Leaderboard</div>
          {selectedLadder.standings?.length > 0 ? (
            <table className="gp-table">
              <thead>
                <tr>
                  <th>#</th><th>Team</th><th>W</th><th>L</th><th>Streak</th>
                  {selectedLadder.type === 'cash' && <th>Cash Earned</th>}
                </tr>
              </thead>
              <tbody>
                {selectedLadder.standings.map((row: any, i: number) => (
                  <tr key={i}>
                    <td style={{ color: i===0?'#f0c040':i===1?'#c0c0c0':i===2?'#cd7f32':'var(--text-muted)', fontWeight: 700, width: 40 }}>
                      {i === 0 ? <Icon icon={Solar.crown} width={16} height={16} style={{ display: 'inline-block', verticalAlign: 'middle', color: '#f0c040' }} /> : row.position}
                    </td>
                    <td style={{ color: '#fff', fontWeight: 600 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span className={`trend-arrow trend-${row.trend}`}>{row.trend === 'up' ? '▲' : row.trend === 'down' ? '▼' : '—'}</span>
                        <Link href={`/teams/${row.slug}`} style={{ color: '#fff', textDecoration: 'none' }}>{row.name}</Link>
                      </div>
                    </td>
                    <td style={{ color: '#4ade80', fontWeight: 700 }}>{row.wins}</td>
                    <td style={{ color: 'var(--red)', fontWeight: 700 }}>{row.losses}</td>
                    <td>{row.winStreak > 0 ? <span className="streak-badge" style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}><Icon icon={Solar.fire} width={13} height={13} /> {row.winStreak}</span> : <span style={{ color: 'var(--text-dim)', fontSize: 12 }}>—</span>}</td>
                    {selectedLadder.type === 'cash' && <td style={{ color: '#f0c040', fontWeight: 700 }}>${(row.cashEarned / 100).toFixed(2)}</td>}
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div style={{ color: 'var(--text-muted)', fontSize: 13, padding: '16px 0' }}>No standings yet — be the first to compete!</div>
          )}
        </div>
      )}

      <div className="ladder-section">
        <div className="ladder-section-title">
          <span className="ladder-type-badge xp">XP</span> XP Ladders
        </div>
        <div className="ladder-cards">
          {xpLadders.length === 0
            ? <div style={{ color: 'var(--text-muted)', fontSize: 13 }}>No XP ladders active.</div>
            : xpLadders.map(l => renderLadderCard(l, '#7b68ee'))}
        </div>
      </div>



      {showCreateTeam && selectedLadder && (
        <CreateTeamModal game={game} ladder={selectedLadder} onClose={() => setShowCreateTeam(false)} />
      )}
    </div>
  )
}

// ─── SIDEBAR: TOP LADDER STANDINGS ────────────────────────────────────────────
function TopLadderStandings({ xpLadders, cashLadders }: { xpLadders: any[]; cashLadders: any[] }) {
  const allLadders = [...xpLadders, ...cashLadders]
  const [activeLadderId, setActiveLadderId] = useState<string>(allLadders[0]?._id || '')
  const activeLadder = allLadders.find(l => l._id === activeLadderId)
  const standings    = activeLadder?.standings || []
  if (allLadders.length === 0) return null
  return (
    <div className="gp-sidebar-card">
      <div className="gp-sidebar-card-header">
        <Icon icon={Solar.trophy} width={22} height={22} style={{ color: '#f0c040', flexShrink: 0 }} />
        <div className="gp-sidebar-title">Top Ladder Standings</div>
      </div>
      <div className="gp-sidebar-divider" />
      <select value={activeLadderId} onChange={e => setActiveLadderId(e.target.value)}
        style={{ width: '100%', background: 'var(--bg-3)', border: '1px solid var(--border)', borderRadius: 6, color: activeLadder?.type === 'xp' ? '#7b68ee' : '#f0c040', fontSize: 11, fontWeight: 700, fontFamily: "'Barlow', sans-serif", letterSpacing: '0.04em', padding: '6px 10px', cursor: 'pointer', marginBottom: 12, outline: 'none' }}>
        {allLadders.map(l => (
          <option key={l._id} value={l._id} style={{ color: '#fff', background: '#1a1a24' }}>
            {l.type === 'xp' ? 'XP' : 'CASH'} — {l.name.split('—')[1]?.trim()}
          </option>
        ))}
      </select>
      {standings.length > 0 ? (
        <table className="gp-sidebar-stats-table">
          <thead><tr><th>#</th><th>Team</th><th>W</th><th>L</th><th style={{ whiteSpace: 'nowrap' }}><Icon icon={Solar.fire} width={12} height={12} style={{ verticalAlign: 'middle' }} /></th></tr></thead>
          <tbody>
            {standings.slice(0, 7).map((row: any, i: number) => (
              <tr key={i}>
                <td style={{ color: i===0?'#f0c040':i===1?'#c0c0c0':i===2?'#cd7f32':'var(--text-muted)', fontWeight: 700 }}>
                  {i === 0 ? <Icon icon={Solar.crown} width={14} height={14} style={{ display: 'inline-block', verticalAlign: 'middle', color: '#f0c040' }} /> : row.position}
                </td>
                <td style={{ fontSize: 11 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <span className={`trend-arrow trend-${row.trend}`} style={{ fontSize: 9 }}>{row.trend === 'up' ? '▲' : row.trend === 'down' ? '▼' : '—'}</span>
                    <Link href={`/teams/${row.slug}`} style={{ color: '#fff', textDecoration: 'none' }}>{row.name}</Link>
                  </div>
                </td>
                <td style={{ color: '#4ade80', fontWeight: 700 }}>{row.wins}</td>
                <td style={{ color: 'var(--red)', fontWeight: 700 }}>{row.losses}</td>
                <td>{row.winStreak > 0 ? <span style={{ color: '#ff9500', fontSize: 11, fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: 3 }}><Icon icon={Solar.fire} width={12} height={12} />{row.winStreak}</span> : <span style={{ color: 'var(--text-dim)', fontSize: 11 }}>—</span>}</td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <div style={{ color: 'var(--text-muted)', fontSize: 12, textAlign: 'center', padding: '12px 0' }}>No standings yet this season.</div>
      )}
    </div>
  )
}

// ─── MAIN PAGE ─────────────────────────────────────────────────────────────────
export default function GameProfilePage() {
  const params  = useParams()
  const slug    = (params?.slug as string) || ''
  const [activeTab, setActiveTab] = useState('overview')

  const { data: ladderData, loading, error } = useApi(() => gamesApi.getLadders(slug), [slug])
  const { data: powData }                    = useApi(() => powApi.getCurrent())
  const { data: openMatches }                = useApi(() => matchesApi.getOpenByGame(slug), [slug])
  const { data: gameTeams }                  = useApi(() => teamsApi.getAll({ gameSlug: slug }), [slug])

  const game        = ladderData?.game       || null
  const xpLadders   = ladderData?.xpLadders  || []
  const cashLadders = ladderData?.cashLadders || []
  const pow         = powData?.playerOfWeek  || null
  const activeMatchCount = Array.isArray(openMatches) ? openMatches.length : 0
  const teamsCount       = Array.isArray(gameTeams) ? gameTeams.length : 0

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
      <div style={{ color: 'var(--text-muted)', fontSize: 14 }}>Loading game...</div>
    </div>
  )

  if (error || !game) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', flexDirection: 'column', gap: 12 }}>
      <Icon icon={Solar.warning} width={36} height={36} style={{ color: '#f59e0b' }} />
      <div style={{ color: 'var(--text-muted)' }}>Game not found.</div>
      <Link href="/games" style={{ color: 'var(--red)', fontSize: 13 }}>← Back to Games</Link>
    </div>
  )

  return (
    <div style={{ paddingBottom: 60 }}>

      {/* ── BANNER ── */}
      <div className="game-banner" style={{ background: 'linear-gradient(135deg, #0d1520, #0a0a0c)', position: 'relative', overflow: 'hidden' }}>
        <div className="container">
          <div className="game-banner-inner">
            <div className="game-banner-cover">
              <div className="game-cover-card" style={{ borderColor: (game.accentColor || '#e8000d') + '55', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0d1520' }}>
                {game.bannerUrl
                  ? <img src={game.bannerUrl} alt={game.name} style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.85 }} onError={e => { (e.target as HTMLImageElement).style.display = 'none' }} />
                  : <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Icon icon={Solar.gamepad} width={56} height={56} style={{ opacity: 0.45 }} /></div>}
              </div>
            </div>
            <div className="game-banner-info">
              <h1 className="game-banner-title">{game.name}</h1>
              <div className="game-banner-meta">
                <div className="game-platform-tags">
                  {(game.platformType === 'pc' ? ['PC'] : game.platformType === 'console' ? ['Xbox', 'PS'] : (game.platforms || ['PC', 'Xbox', 'PS'])).map((p: string, i: number) => <span key={i} className="game-platform-tag" style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}><Icon icon={p === 'PC' ? 'solar:monitor-bold-duotone' : p === 'Xbox' ? 'mdi:microsoft-xbox' : 'mdi:sony-playstation'} width={14} height={14} />{p}</span>)}
                  {game.platformType === 'crossplay' || game.crossplay ? <span className="game-platform-tag" style={{ background: 'rgba(74,222,128,0.12)', color: '#4ade80', borderColor: 'rgba(74,222,128,0.25)', display: 'inline-flex', alignItems: 'center', gap: 4 }}><Icon icon='solar:link-bold-duotone' width={14} height={14} />Cross-play</span> : null}
                </div>
              </div>
              <div className="game-banner-stats">
                <div className="game-banner-stat">
                  <span className="game-banner-stat-value">{xpLadders.length + cashLadders.length}</span>
                  <span className="game-banner-stat-label">Active Ladders</span>
                </div>
                <div className="game-banner-stat">
                  <span className="game-banner-stat-value">{activeMatchCount}</span>
                  <span className="game-banner-stat-label">Active Matches</span>
                </div>
                <div className="game-banner-stat">
                  <span className="game-banner-stat-value">{teamsCount}</span>
                  <span className="game-banner-stat-label">Teams Competing</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── SUB-NAV ── */}
      <div className="game-subnav">
        <div className="container">
          <div className="game-subnav-inner">
            <div className="game-subnav-tabs">
              {NAV_ITEMS.map(item => (
                <button key={item.tab} className={`game-subnav-tab${activeTab === item.tab ? ' active' : ''}`} onClick={() => setActiveTab(item.tab)}>
                  {item.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── CONTENT ── */}
      <div className="container" style={{ marginTop: 32 }}>
        <div className="game-profile-layout">

          <div className="game-profile-main">
            {activeTab === 'overview' && <OverviewTab game={game} xpLadders={xpLadders} />}

            {/* Matches tab — uses the same PostMatchModal as Teams page */}
            {activeTab === 'matches' && <MatchesTab game={game} xpLadders={xpLadders} cashLadders={cashLadders} />}

            {activeTab === 'rules' && (
              <div>
                <div className="section-header">
                  <h2 className="section-title"><span>{game.name}</span> — Game Rules</h2>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 16 }}>
                  {game.rules?.length > 0 ? game.rules.map((rule: string, i: number) => (
                    <div key={i} className="accordion-item-custom open">
                      <div className="accordion-header-custom" style={{ cursor: 'default', color: 'var(--red)' }}><span>Rule {i + 1}</span></div>
                      <div className="accordion-body-custom">{rule}</div>
                    </div>
                  )) : (
                    <div style={{ fontFamily: "'Barlow',sans-serif", fontSize: 13, color: '#4A5568', textAlign: 'center', padding: '40px 0' }}>No rules have been set for this game yet.</div>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'support' && (
              <SupportTab gameName={game?.name || slug} />
            )}
          </div>

          <div className="game-profile-sidebar">
            <div className="gp-sidebar-card">
              <div className="gp-sidebar-card-header">
                <Icon icon={Solar.crown} width={22} height={22} style={{ color: '#f0c040', flexShrink: 0 }} />
                <div>
                  <div className="gp-sidebar-update">Updates weekly</div>
                  <div className="gp-sidebar-title">Player of the Week</div>
                </div>
              </div>
              <div className="gp-sidebar-divider" />
              {pow ? (
                <>
                  <div className="gp-player-of-week">
                    <div className="gp-potw-avatar" style={{ position: 'relative' }}>
                      {pow.avatarUrl ? <img src={pow.avatarUrl} alt={pow.username} style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} /> : <Icon icon={Solar.user} width={28} height={28} style={{ opacity: 0.5 }} />}
                      <span className="potw-level-badge">Lv.{pow.level}</span>
                    </div>
                    <Link href={`/profile/${pow.slug}`} className="gp-potw-name" style={{ color: '#fff', textDecoration: 'none' }}
                      onMouseEnter={e => (e.currentTarget.style.color = 'var(--red)')}
                      onMouseLeave={e => (e.currentTarget.style.color = '#fff')}>
                      {pow.username}
                    </Link>
                    <div className="gp-potw-location">{pow.location || 'Unknown'}</div>
                    <div style={{ width: '80%', marginTop: 4 }}>
                      <div style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: 4 }}>Reputation</div>
                      <RepBar value={pow.reputation || 50} />
                    </div>
                  </div>
                  <table className="gp-sidebar-stats-table">
                    <thead><tr><th>Weekly Wins</th><th>Rank</th></tr></thead>
                    <tbody><tr><td style={{ color: '#4ade80', fontWeight: 700 }}>{pow.weeklyWins || 0}</td><td style={{ color: '#f0c040', fontWeight: 700 }}>1st</td></tr></tbody>
                  </table>
                </>
              ) : (
                <div style={{ color: 'var(--text-muted)', fontSize: 13, textAlign: 'center', padding: '16px 0' }}>No player of the week set yet.</div>
              )}
            </div>
            <TopLadderStandings xpLadders={xpLadders} cashLadders={cashLadders} />
          </div>
        </div>
      </div>
    </div>
  )
}