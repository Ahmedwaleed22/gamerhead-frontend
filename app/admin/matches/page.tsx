'use client'

import { useEffect, useState, useCallback } from 'react'
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
  teamBName: string
  teamBEmoji: string
  scoreA: number
  scoreB: number
  isDisputed: boolean
  disputeReason: string
  createdAt: string
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
        <span>
          <span style={{ fontWeight: 700 }}>{row.teamAEmoji} {row.teamAName}</span>
          <span style={{ color: '#4F5568', margin: '0 6px' }}>vs</span>
          <span style={{ fontWeight: 700 }}>{row.teamBEmoji || ''} {row.teamBName || '—'}</span>
        </span>
      ),
    },
    { key: 'matchType', label: 'Type', width: '60px',
      render: (row) => <span style={{ color: row.matchType === 'cash' ? '#22c55e' : '#3b82f6', fontWeight: 700, fontSize: 9, textTransform: 'uppercase' }}>{row.matchType}</span>,
    },
    { key: 'totalPot', label: 'Wager', width: '70px',
      render: (row) => row.matchType === 'cash' ? `$${((row.totalPot || 0) / 100).toFixed(2)}` : `${row.wagerPerPlayer || 0} XP`,
    },
    { key: 'status', label: 'Status', width: '85px',
      render: (row) => (
        <span style={{ padding: '2px 6px', fontSize: 8, fontWeight: 800, border: `1px solid ${STATUS_COLORS[row.status] || '#4F5568'}44`, borderRadius: 3, color: STATUS_COLORS[row.status] || '#4F5568', textTransform: 'uppercase', letterSpacing: .5 }}>
          {row.status}
        </span>
      ),
    },
    { key: 'createdAt', label: 'Created', width: '85px',
      render: (row) => new Date(row.createdAt).toLocaleDateString(),
    },
    { key: 'actions', label: 'Actions', width: '150px',
      render: (row) => (
        <div style={{ display: 'flex', gap: 4 }}>
          <ActionBtn label="VIEW" color="#3b82f6" onClick={() => viewDetail(row._id)} />
          {['completed', 'disputed'].includes(row.status) && <ActionBtn label="EDIT" color="#f59e0b" onClick={() => { setEditModal(row); setEditForm({ winnerId: '', scoreA: String(row.scoreA || 0), scoreB: String(row.scoreB || 0), reason: '' }) }} />}
          {row.status === 'disputed' && <ActionBtn label="RESOLVE" color="#22c55e" onClick={() => { setResolveModal(row); setResolveForm({ winnerId: '', scoreA: String(row.scoreA || 0), scoreB: String(row.scoreB || 0), reason: '' }) }} />}
          {!['completed', 'cancelled', 'expired'].includes(row.status) && <ActionBtn label="CANCEL" color="#e8000d" onClick={() => setCancelModal(row)} />}
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
                Refund wagers to all players
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
        <Modal title={`Match ${detailModal.matchId}`} onClose={() => setDetailModal(null)} width={600}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: 10 }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 8 }}>
              {[
                ['Status', detailModal.status], ['Game', detailModal.game], ['Type', detailModal.matchType],
                ['Format', detailModal.format], ['Mode', detailModal.gamemode || '—'], ['Map', detailModal.assignedMap || '—'],
                ['Pot', detailModal.matchType === 'cash' ? `$${((detailModal.totalPot || 0) / 100).toFixed(2)}` : `${detailModal.wagerPerPlayer || 0} XP`],
                ['Fee', detailModal.matchType === 'cash' ? `$${((detailModal.platformFee || 0) / 100).toFixed(2)}` : '—'],
                ['Payout', detailModal.matchType === 'cash' ? `$${((detailModal.winnerPayout || 0) / 100).toFixed(2)}` : '—'],
                ['Score', `${detailModal.scoreA ?? '—'} - ${detailModal.scoreB ?? '—'}`],
                ['Winner', detailModal.winnerName || '—'],
                ['Created', new Date(detailModal.createdAt).toLocaleString()],
              ].map(([k, v]) => (
                <div key={k as string} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', borderBottom: '1px solid rgba(255,255,255,.04)' }}>
                  <span style={{ color: '#4F5568', fontWeight: 700 }}>{k}</span>
                  <span style={{ color: '#DDE0EA', fontWeight: 700 }}>{String(v)}</span>
                </div>
              ))}
            </div>
            {detailModal.isDisputed && (
              <div style={{ background: 'rgba(232,0,13,.08)', border: '1px solid rgba(232,0,13,.2)', borderRadius: 6, padding: '8px 12px', color: '#e8000d' }}>
                Dispute: {detailModal.disputeReason}
              </div>
            )}
            {detailModal.chat?.length > 0 && (
              <div>
                <div style={{ fontWeight: 700, color: '#4F5568', marginBottom: 4, textTransform: 'uppercase', letterSpacing: .6 }}>Chat Log</div>
                <div style={{ maxHeight: 200, overflowY: 'auto', background: '#0d0d14', borderRadius: 6, padding: 8 }}>
                  {detailModal.chat.map((msg: any, i: number) => (
                    <div key={i} style={{ padding: '3px 0', borderBottom: '1px solid rgba(255,255,255,.03)' }}>
                      <span style={{ color: msg.type === 'system' ? '#f59e0b' : '#3b82f6', fontWeight: 700 }}>{msg.username}: </span>
                      <span style={{ color: '#DDE0EA' }}>{msg.text}</span>
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
