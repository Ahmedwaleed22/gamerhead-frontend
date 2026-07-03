'use client'

import React, { useEffect, useState, useCallback } from 'react'
import { adminApi } from '@/lib/api'
import DataTable, { Column } from '../components/DataTable'
import SearchFilter from '../components/SearchFilter'
import ActionBtn from '../components/ActionBtn'
import Modal from '../components/Modal'
import { Icon } from '@iconify/react'
import { Solar } from '@/lib/solar-duotone'

interface MatchRow {
  _id: string
  matchId: string
  game: string
  gameSlug: string
  matchType: string
  status: string
  wagerPerPlayer: number
  totalPot: number
  teamAName: string
  teamAEmoji: string
  teamALogoUrl?: string
  teamAWins?: number
  teamALosses?: number
  teamBName: string
  teamBEmoji: string
  teamBLogoUrl?: string
  teamBWins?: number
  teamBLosses?: number
  scoreA: number
  scoreB: number
  isDisputed: boolean
  disputeReason: string
  createdAt: string
}

const AVATAR_COLORS = ['#6366f1','#8b5cf6','#3b82f6','#06b6d4','#10b981','#f59e0b','#ef4444','#ec4899']
function nameToColor(name: string) {
  let h = 0; for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0
  return AVATAR_COLORS[h % AVATAR_COLORS.length]
}
function teamInitials(name: string) {
  const parts = name.trim().split(/\s+/)
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase()
  return name.slice(0, 2).toUpperCase()
}

function TeamChip({ name, logo, wins, losses }: { name: string; logo?: string; wins?: number; losses?: number }) {
  const accent = nameToColor(name)
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <div style={{
        width: 34, height: 34, borderRadius: 8, flexShrink: 0,
        background: logo ? `url(${logo}) center/cover no-repeat` : '#0d0d14',
        border: `1.5px solid ${accent}`,
        boxShadow: `0 0 8px ${accent}55`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 11, fontWeight: 900, color: accent, letterSpacing: 0.5,
      }}>
        {!logo && teamInitials(name)}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.25 }}>
        <span style={{ fontWeight: 700, fontSize: 12, color: '#DDE0EA' }}>{name}</span>
        {(wins !== undefined || losses !== undefined) && (
          <span style={{ fontSize: 10, color: '#4F5568' }}>{wins ?? 0}W · {losses ?? 0}L</span>
        )}
      </div>
    </div>
  )
}

const STATUS_COLORS: Record<string, string> = {
  open: '#3b82f6', pending: '#8890A4', accepted: '#8890A4', live: '#22c55e',
  completed: '#6b7280', disputed: '#e8000d', cancelled: '#4F5568', expired: '#4F5568',
}

const inputStyle: React.CSSProperties = {
  padding: '7px 12px', background: '#0d0d14', border: '1px solid rgba(255,255,255,.09)',
  borderRadius: 6, fontSize: 11, color: '#fff', outline: 'none', width: '100%',
}
const labelStyle: React.CSSProperties = {
  fontSize: 9, fontWeight: 700, color: '#4F5568',
  textTransform: 'uppercase', letterSpacing: .6, marginBottom: 4,
}

export default function AdminMatchesPage() {
  const [matches, setMatches] = useState<MatchRow[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [pages, setPages] = useState(1)
  const [loading, setLoading] = useState(true)
  const [disputeCount, setDisputeCount] = useState(0)

  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('')
  const [type, setType] = useState('')

  // Modals
  const [resolveModal, setResolveModal] = useState<MatchRow | null>(null)
  const [resolveForm, setResolveForm] = useState({ winnerId: '', scoreA: '', scoreB: '', reason: '' })
  const [cancelModal, setCancelModal] = useState<MatchRow | null>(null)
  const [cancelForm, setCancelForm] = useState({ reason: '', refund: true })
  const [detailModal, setDetailModal] = useState<any>(null)
  const [editModal, setEditModal] = useState<MatchRow | null>(null)
  const [editForm, setEditForm] = useState({ winnerId: '', scoreA: '', scoreB: '', reason: '' })

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const params: any = { page, limit: 25 }
      if (search) params.q = search
      if (status) params.status = status
      if (type) params.type = type
      const res = await adminApi.getMatches(params)
      setMatches(res.matches)
      setTotal(res.total)
      setPages(res.pages)
      // Count disputes
      const dRes = await adminApi.getMatches({ status: 'disputed', limit: 1 })
      setDisputeCount(dRes.total)
    } catch (err) { console.error('[Admin Matches] load error:', err) }
    setLoading(false)
  }, [page, search, status, type])

  useEffect(() => { load() }, [load])

  const [searchInput, setSearchInput] = useState('')
  useEffect(() => {
    const t = setTimeout(() => { setSearch(searchInput); setPage(1) }, 400)
    return () => clearTimeout(t)
  }, [searchInput])

  const handleResolve = async () => {
    if (!resolveModal || !resolveForm.winnerId) return
    try {
      await adminApi.resolveDispute(resolveModal._id, {
        winnerId: resolveForm.winnerId,
        scoreA: Number(resolveForm.scoreA),
        scoreB: Number(resolveForm.scoreB),
        reason: resolveForm.reason,
      })
      setResolveModal(null)
      setResolveForm({ winnerId: '', scoreA: '', scoreB: '', reason: '' })
      load()
    } catch { }
  }

  const handleCancel = async () => {
    if (!cancelModal) return
    try {
      await adminApi.cancelMatch(cancelModal._id, { reason: cancelForm.reason, refund: cancelForm.refund })
      setCancelModal(null)
      setCancelForm({ reason: '', refund: true })
      load()
    } catch { }
  }

  const handleEditResult = async () => {
    if (!editModal) return
    try {
      await adminApi.adjustResult(editModal._id, {
        winnerId: editForm.winnerId,
        scoreA: Number(editForm.scoreA),
        scoreB: Number(editForm.scoreB),
        reason: editForm.reason,
      })
      setEditModal(null)
      setEditForm({ winnerId: '', scoreA: '', scoreB: '', reason: '' })
      load()
    } catch { }
  }

  const viewDetail = async (id: string) => {
    try {
      const res = await adminApi.getMatch(id)
      setDetailModal(res)
    } catch { }
  }

  const columns: Column<MatchRow>[] = [
    { key: 'matchId', label: 'Match ID', width: '90px',
      render: (row) => <span style={{ color: '#3b82f6', fontWeight: 700, cursor: 'pointer' }} onClick={() => viewDetail(row._id)}>{row.matchId}</span>,
    },
    { key: 'game', label: 'Game', width: '100px' },
    { key: 'teams', label: 'Teams', width: '2fr',
      render: (row) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <TeamChip name={row.teamAName} logo={row.teamALogoUrl} wins={row.teamAWins} losses={row.teamALosses} />
          <span style={{ color: '#4F5568', fontSize: 10, fontWeight: 700 }}>VS</span>
          <TeamChip name={row.teamBName || '—'} logo={row.teamBLogoUrl} wins={row.teamBWins} losses={row.teamBLosses} />
        </div>
      ),
    },
    { key: 'matchType', label: 'Type', width: '60px',
      render: (row) => <span style={{ color: row.matchType === 'cash' ? '#22c55e' : '#3b82f6', fontWeight: 700, fontSize: 9, textTransform: 'uppercase' }}>{row.matchType}</span>,
    },
    { key: 'totalPot', label: 'Reward', width: '80px',
      render: (row) => row.matchType === 'cash' ? `$${((row.totalPot || 0) / 100).toFixed(2)}` : `${row.wagerPerPlayer || 0} XP`,
    },
    { key: 'status', label: 'Status', width: '100px',
      render: (row) => (
        <span style={{ padding: '4px 10px', fontSize: 10, fontWeight: 800, border: `1px solid ${STATUS_COLORS[row.status] || '#4F5568'}55`, borderRadius: 5, color: STATUS_COLORS[row.status] || '#4F5568', textTransform: 'uppercase', letterSpacing: .6, background: (STATUS_COLORS[row.status] || '#4F5568') + '12' }}>
          {row.status}
        </span>
      ),
    },
    { key: 'createdAt', label: 'Created', width: '85px',
      render: (row) => new Date(row.createdAt).toLocaleDateString(),
    },
    { key: 'actions', label: 'Actions', width: '200px',
      render: (row) => (
        <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
          <ActionBtn label="VIEW" color="#3b82f6" size="md" onClick={() => viewDetail(row._id)} />
          {['completed', 'disputed'].includes(row.status) && <ActionBtn label="EDIT" color="#f59e0b" size="md" onClick={() => { setEditModal(row); setEditForm({ winnerId: '', scoreA: String(row.scoreA || 0), scoreB: String(row.scoreB || 0), reason: '' }) }} />}
          {row.status === 'disputed' && <ActionBtn label="RESOLVE" color="#22c55e" size="md" onClick={() => { setResolveModal(row); setResolveForm({ winnerId: '', scoreA: String(row.scoreA || 0), scoreB: String(row.scoreB || 0), reason: '' }) }} />}
          {!['completed', 'cancelled', 'expired'].includes(row.status) && <ActionBtn label="CANCEL" color="#e8000d" size="md" onClick={() => setCancelModal(row)} />}
        </div>
      ),
    },
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div>
        <h1 style={{ fontWeight: 900, fontSize: 28, color: '#fff', margin: 0, textTransform: 'uppercase' }}>
          Matches & Disputes
        </h1>
        <p style={{ fontSize: 12, color: '#4F5568', margin: '4px 0 0' }}>
          {total.toLocaleString()} matches total
        </p>
      </div>

      {/* Dispute Alert */}
      {disputeCount > 0 && (
        <div style={{
          background: 'rgba(232,0,13,.1)', border: '1px solid rgba(232,0,13,.3)', borderRadius: 8,
          padding: '10px 16px', display: 'flex', alignItems: 'center', gap: 16,
        }}>
          <Icon icon={Solar.warning} width={18} height={18} />
          <span style={{ fontWeight: 700, fontSize: 13, color: '#e8000d' }}>
            {disputeCount} disputed match{disputeCount !== 1 ? 'es' : ''} need{disputeCount === 1 ? 's' : ''} attention
          </span>
          <ActionBtn label="VIEW DISPUTES" color="#e8000d" onClick={() => { setStatus('disputed'); setPage(1) }} />
        </div>
      )}

      <SearchFilter
        search={searchInput}
        onSearch={setSearchInput}
        searchPlaceholder="Search by match ID or team name..."
        filters={[
          {
            value: status, onChange: v => { setStatus(v); setPage(1) }, placeholder: 'All Status',
            options: [
              { value: 'open', label: 'Open' }, { value: 'pending', label: 'Pending' },
              { value: 'live', label: 'Live' }, { value: 'completed', label: 'Completed' },
              { value: 'disputed', label: 'Disputed' }, { value: 'cancelled', label: 'Cancelled' },
            ],
          },
          {
            value: type, onChange: v => { setType(v); setPage(1) }, placeholder: 'All Types',
            options: [{ value: 'cash', label: 'Cash' }, { value: 'xp', label: 'XP' }],
          },
        ]}
      />

      {loading ? (
        <div style={{ fontSize: 13, color: '#4F5568', padding: 40, textAlign: 'center' }}>Loading matches...</div>
      ) : (
        <DataTable columns={columns} rows={matches} emptyText="No matches found" page={page} totalPages={pages} onPage={setPage} />
      )}

      {/* Resolve Dispute Modal */}
      {resolveModal && (
        <Modal title="Resolve Dispute" subtitle={`${resolveModal.matchId} — ${resolveModal.teamAName} vs ${resolveModal.teamBName}`} onClose={() => setResolveModal(null)} width={500}>
          {resolveModal.disputeReason && (
            <div style={{ background: 'rgba(232,0,13,.08)', border: '1px solid rgba(232,0,13,.2)', borderRadius: 6, padding: '8px 12px', marginBottom: 12, fontSize: 10, color: '#e8000d' }}>
              Dispute: {resolveModal.disputeReason}
            </div>
          )}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <div style={labelStyle}>Winner</div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={() => setResolveForm(p => ({ ...p, winnerId: 'teamA' }))} style={{
                  ...inputStyle, width: 'auto', flex: 1, textAlign: 'center', cursor: 'pointer',
                  background: resolveForm.winnerId === 'teamA' ? 'rgba(34,197,94,.15)' : '#0d0d14',
                  borderColor: resolveForm.winnerId === 'teamA' ? '#22c55e' : 'rgba(255,255,255,.09)',
                  color: resolveForm.winnerId === 'teamA' ? '#22c55e' : '#8890A4',
                }}>
                  {resolveModal.teamAEmoji} {resolveModal.teamAName}
                </button>
                <button onClick={() => setResolveForm(p => ({ ...p, winnerId: 'teamB' }))} style={{
                  ...inputStyle, width: 'auto', flex: 1, textAlign: 'center', cursor: 'pointer',
                  background: resolveForm.winnerId === 'teamB' ? 'rgba(34,197,94,.15)' : '#0d0d14',
                  borderColor: resolveForm.winnerId === 'teamB' ? '#22c55e' : 'rgba(255,255,255,.09)',
                  color: resolveForm.winnerId === 'teamB' ? '#22c55e' : '#8890A4',
                }}>
                  {resolveModal.teamBEmoji} {resolveModal.teamBName}
                </button>
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 8 }}>
              <div>
                <div style={labelStyle}>Score A</div>
                <input type="number" value={resolveForm.scoreA} onChange={e => setResolveForm(p => ({ ...p, scoreA: e.target.value }))} style={inputStyle} />
              </div>
              <div>
                <div style={labelStyle}>Score B</div>
                <input type="number" value={resolveForm.scoreB} onChange={e => setResolveForm(p => ({ ...p, scoreB: e.target.value }))} style={inputStyle} />
              </div>
            </div>
            <div>
              <div style={labelStyle}>Reason</div>
              <textarea value={resolveForm.reason} onChange={e => setResolveForm(p => ({ ...p, reason: e.target.value }))} style={{ ...inputStyle, minHeight: 60, resize: 'vertical' }} placeholder="Admin resolution reason..." />
            </div>
            <ActionBtn label="RESOLVE DISPUTE" color="#22c55e" onClick={handleResolve} />
          </div>
        </Modal>
      )}

      {/* Cancel Modal */}
      {cancelModal && (
        <Modal title="Cancel Match" subtitle={cancelModal.matchId} onClose={() => setCancelModal(null)}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <div style={labelStyle}>Reason</div>
              <textarea value={cancelForm.reason} onChange={e => setCancelForm(p => ({ ...p, reason: e.target.value }))} style={{ ...inputStyle, minHeight: 60, resize: 'vertical' }} placeholder="Cancellation reason..." />
            </div>
            {cancelModal.matchType === 'cash' && (
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 11, color: '#DDE0EA', cursor: 'pointer' }}>
                <input type="checkbox" checked={cancelForm.refund} onChange={e => setCancelForm(p => ({ ...p, refund: e.target.checked }))} />
                Refund prize entries to all players
              </label>
            )}
            <ActionBtn label="CANCEL MATCH" color="#e8000d" onClick={handleCancel} />
          </div>
        </Modal>
      )}

      {/* Edit Result Modal */}
      {editModal && (
        <Modal title="Edit Match Outcome" subtitle={`${editModal.matchId} — ${editModal.teamAName} vs ${editModal.teamBName}`} onClose={() => setEditModal(null)} width={500}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <div style={labelStyle}>Winner</div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={() => setEditForm(p => ({ ...p, winnerId: 'teamA' }))} style={{
                  ...inputStyle, width: 'auto', flex: 1, textAlign: 'center', cursor: 'pointer',
                  background: editForm.winnerId === 'teamA' ? 'rgba(34,197,94,.15)' : '#0d0d14',
                  borderColor: editForm.winnerId === 'teamA' ? '#22c55e' : 'rgba(255,255,255,.09)',
                  color: editForm.winnerId === 'teamA' ? '#22c55e' : '#8890A4',
                }}>
                  {editModal.teamAEmoji} {editModal.teamAName}
                </button>
                <button onClick={() => setEditForm(p => ({ ...p, winnerId: 'teamB' }))} style={{
                  ...inputStyle, width: 'auto', flex: 1, textAlign: 'center', cursor: 'pointer',
                  background: editForm.winnerId === 'teamB' ? 'rgba(34,197,94,.15)' : '#0d0d14',
                  borderColor: editForm.winnerId === 'teamB' ? '#22c55e' : 'rgba(255,255,255,.09)',
                  color: editForm.winnerId === 'teamB' ? '#22c55e' : '#8890A4',
                }}>
                  {editModal.teamBEmoji} {editModal.teamBName}
                </button>
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 8 }}>
              <div>
                <div style={labelStyle}>Score A</div>
                <input type="number" value={editForm.scoreA} onChange={e => setEditForm(p => ({ ...p, scoreA: e.target.value }))} style={inputStyle} />
              </div>
              <div>
                <div style={labelStyle}>Score B</div>
                <input type="number" value={editForm.scoreB} onChange={e => setEditForm(p => ({ ...p, scoreB: e.target.value }))} style={inputStyle} />
              </div>
            </div>
            <div>
              <div style={labelStyle}>Reason for Change</div>
              <textarea value={editForm.reason} onChange={e => setEditForm(p => ({ ...p, reason: e.target.value }))} style={{ ...inputStyle, minHeight: 60, resize: 'vertical' }} placeholder="Why is the outcome being changed..." />
            </div>
            <ActionBtn label="SAVE CHANGES" color="#f59e0b" onClick={handleEditResult} />
          </div>
        </Modal>
      )}

      {/* Detail Modal */}
      {detailModal && (
        <Modal title={`Match ${detailModal.matchId}`} onClose={() => setDetailModal(null)} width={680}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {/* Teams summary */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, background: '#0d0d14', borderRadius: 8, padding: '14px 18px', border: '1px solid rgba(255,255,255,.05)' }}>
              <TeamChip name={detailModal.teamAName} logo={detailModal.teamALogoUrl} wins={detailModal.teamAWins} losses={detailModal.teamALosses} />
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                <span style={{ fontSize: 10, fontWeight: 800, color: '#4F5568', letterSpacing: 1, textTransform: 'uppercase' }}>vs</span>
                {(detailModal.scoreA != null && detailModal.scoreB != null) && (
                  <span style={{ fontSize: 14, fontWeight: 900, color: '#DDE0EA' }}>{detailModal.scoreA} – {detailModal.scoreB}</span>
                )}
              </div>
              <TeamChip name={detailModal.teamBName || '—'} logo={detailModal.teamBLogoUrl} wins={detailModal.teamBWins} losses={detailModal.teamBLosses} />
              {detailModal.winnerName && <span style={{ marginLeft: 'auto', fontSize: 11, fontWeight: 700, color: '#22c55e', background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.25)', borderRadius: 5, padding: '4px 12px' }}>Winner: {detailModal.winnerName}</span>}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 8, fontSize: 12 }}>
              {[
                ['Status', detailModal.status], ['Game', detailModal.game], ['Type', detailModal.matchType],
                ['Format', detailModal.format], ['Mode', detailModal.gamemode || '—'], ['Map', detailModal.assignedMap || '—'],
                ['Reward', detailModal.matchType === 'cash' ? `$${((detailModal.totalPot || 0) / 100).toFixed(2)}` : `${detailModal.wagerPerPlayer || 0} XP`],
                ['Fee', detailModal.matchType === 'cash' ? `$${((detailModal.platformFee || 0) / 100).toFixed(2)}` : '—'],
                ['Winner Payout', detailModal.matchType === 'cash' ? `$${((detailModal.winnerPayout || 0) / 100).toFixed(2)}` : '—'],
                ['Score', `${detailModal.scoreA ?? '—'} - ${detailModal.scoreB ?? '—'}`],
                ['Created', new Date(detailModal.createdAt).toLocaleString()],
              ].map(([k, v]) => (
                <div key={k as string} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid rgba(255,255,255,.04)' }}>
                  <span style={{ color: '#6B7280', fontWeight: 600, fontSize: 12 }}>{k}</span>
                  <span style={{ color: '#DDE0EA', fontWeight: 700, fontSize: 12 }}>{String(v)}</span>
                </div>
              ))}
            </div>
            {detailModal.isDisputed && (
              <div style={{ background: 'rgba(232,0,13,.08)', border: '1px solid rgba(232,0,13,.2)', borderRadius: 8, padding: '10px 14px', color: '#e8000d', fontSize: 12 }}>
                <span style={{ fontWeight: 700 }}>Dispute Reason:</span> {detailModal.disputeReason}
              </div>
            )}
            {detailModal.chat?.length > 0 && (
              <div>
                <div style={{ fontWeight: 700, color: '#9CA3AF', marginBottom: 8, fontSize: 12, textTransform: 'uppercase', letterSpacing: .6 }}>Chat Log ({detailModal.chat.length} messages)</div>
                <div style={{ maxHeight: 320, overflowY: 'auto', background: '#0d0d14', borderRadius: 8, padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: 8, border: '1px solid rgba(255,255,255,.04)' }}>
                  {detailModal.chat.map((msg: any, i: number) => (
                    <div key={i} style={{ padding: '6px 0', borderBottom: i < detailModal.chat.length - 1 ? '1px solid rgba(255,255,255,.04)' : 'none' }}>
                      <span style={{ color: msg.type === 'system' ? '#f59e0b' : '#60A5FA', fontWeight: 700, fontSize: 12 }}>{msg.username}: </span>
                      <span style={{ color: '#DDE0EA', fontSize: 12, lineHeight: '1.5' }}>{msg.text}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </Modal>
      )}
    </div>
  )
}
