'use client'

import { useEffect, useState, useCallback } from 'react'
import { adminApi } from '@/lib/api'
import DataTable, { Column } from '../components/DataTable'
import ActionBtn from '../components/ActionBtn'
import SearchFilter from '../components/SearchFilter'
import Modal from '../components/Modal'

const STATUS_COLORS: Record<string, string> = {
  draft: '#4F5568', open: '#3b82f6', checkin: '#f59e0b', live: '#22c55e', completed: '#8890A4', cancelled: '#e8000d',
}

const inputStyle: React.CSSProperties = {
  padding: '7px 12px', background: '#0d0d14', border: '1px solid rgba(255,255,255,.09)',
  borderRadius: 6, fontSize: 11, color: '#fff', fontFamily: 'Rajdhani, sans-serif', outline: 'none', width: '100%',
}
const labelStyle: React.CSSProperties = {
  fontSize: 9, fontWeight: 700, color: '#4F5568', fontFamily: 'Rajdhani, sans-serif',
  textTransform: 'uppercase', letterSpacing: .6, marginBottom: 4,
}

export default function AdminTournamentsPage() {
  const [tournaments, setTournaments] = useState<any[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [pages, setPages] = useState(1)
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('')
  const [createModal, setCreateModal] = useState(false)
  const [detailModal, setDetailModal] = useState<any>(null)
  const [form, setForm] = useState({
    name: '', slug: '', game: '', gameEmoji: '🎯', bracketType: 'Single Elimination', entryType: 'team',
    format: 'Squads (4v4)', series: 'Best of 3', maxTeams: '64', entryCredits: '0', prizePool: '0',
    startDate: '', startTime: '', region: 'North America', platform: 'Cross-Play', bannerUrl: '', accentColor: '#1A5C9E',
    isFeatured: false,
  })

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const params: any = { page, limit: 25 }
      if (statusFilter) params.status = statusFilter
      const res = await adminApi.getTournaments(params)
      setTournaments(res.tournaments)
      setTotal(res.total)
      setPages(res.pages)
    } catch (err) { console.error('[Admin Tournaments] load error:', err) }
    setLoading(false)
  }, [page, statusFilter])

  useEffect(() => { load() }, [load])

  const handleCreate = async () => {
    try {
      await adminApi.createTournament({
        ...form, maxTeams: Number(form.maxTeams), entryCredits: Number(form.entryCredits), prizePool: Number(form.prizePool),
      })
      setCreateModal(false)
      setForm({ name: '', slug: '', game: '', gameEmoji: '🎯', bracketType: 'Single Elimination', entryType: 'team', format: 'Squads (4v4)', series: 'Best of 3', maxTeams: '64', entryCredits: '0', prizePool: '0', startDate: '', startTime: '', region: 'North America', platform: 'Cross-Play', bannerUrl: '', accentColor: '#1A5C9E', isFeatured: false })
      load()
    } catch { }
  }

  const handleUpdateStatus = async (id: string, status: string) => {
    try { await adminApi.updateTournament(id, { status }); load() } catch { }
  }

  const handleToggleFeatured = async (id: string, current: boolean) => {
    try { await adminApi.updateTournament(id, { isFeatured: !current }); load() } catch { }
  }

  const handleDelete = async (id: string) => {
    try { await adminApi.deleteTournament(id); load() } catch { }
  }

  const handleViewDetail = async (id: string) => {
    try { const res = await adminApi.getTournament(id); setDetailModal(res) } catch { }
  }

  const columns: Column[] = [
    { key: 'name', label: 'Name', width: '2fr', render: (r: any) => (
      <div>
        <span style={{ fontWeight: 700, cursor: 'pointer', color: '#DDE0EA' }} onClick={() => handleViewDetail(r._id)}>{r.gameEmoji} {r.name}</span>
        {r.isFeatured && <span style={{ fontSize: 8, color: '#f59e0b', fontWeight: 700, marginLeft: 6 }}>FEATURED</span>}
      </div>
    )},
    { key: 'game', label: 'Game', width: '100px', render: (r: any) => <span style={{ color: '#4F5568' }}>{r.game}</span> },
    { key: 'bracketType', label: 'Bracket', width: '100px', render: (r: any) => <span style={{ fontSize: 9, color: '#8890A4' }}>{r.bracketType === 'Single Elimination' ? 'Single Elim' : 'Double Elim'}</span> },
    { key: 'registeredCount', label: 'Teams', width: '80px', render: (r: any) => <span style={{ color: '#8890A4' }}>{r.registeredCount}/{r.maxTeams}</span> },
    { key: 'prizePool', label: 'Prize Pool', width: '80px', render: (r: any) => <span style={{ fontWeight: 700, color: '#22c55e' }}>${((r.prizePool || 0) / 100).toFixed(0)}</span> },
    { key: 'status', label: 'Status', width: '80px', render: (r: any) => <span style={{ fontSize: 9, fontWeight: 700, color: STATUS_COLORS[r.status] || '#4F5568', textTransform: 'uppercase' }}>{r.status}</span> },
    { key: 'startDate', label: 'Start', width: '90px', render: (r: any) => <span style={{ color: '#4F5568', fontSize: 10 }}>{r.startDate || '—'}</span> },
    { key: 'actions', label: '', width: '140px', render: (r: any) => (
      <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
        <ActionBtn label="VIEW" color="#3b82f6" onClick={() => handleViewDetail(r._id)} />
        <ActionBtn label={r.isFeatured ? 'UNFEAT' : 'FEAT'} color="#f59e0b" onClick={() => handleToggleFeatured(r._id, r.isFeatured)} />
        {r.status === 'draft' && <ActionBtn label="OPEN" color="#22c55e" onClick={() => handleUpdateStatus(r._id, 'open')} />}
        {r.status === 'open' && <ActionBtn label="CANCEL" color="#e8000d" onClick={() => handleUpdateStatus(r._id, 'cancelled')} />}
        {['draft', 'cancelled', 'completed'].includes(r.status) && <ActionBtn label="DEL" color="#e8000d" onClick={() => handleDelete(r._id)} />}
      </div>
    )},
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 900, fontSize: 28, color: '#fff', margin: 0, textTransform: 'uppercase' }}>Tournaments</h1>
          <p style={{ fontFamily: 'Rajdhani, sans-serif', fontSize: 12, color: '#4F5568', margin: '4px 0 0' }}>
            {total} total tournaments
          </p>
        </div>
        <ActionBtn label="+ CREATE TOURNAMENT" color="#22c55e" onClick={() => setCreateModal(true)} />
      </div>

      <SearchFilter
        filters={[
          {
            value: statusFilter, onChange: v => { setStatusFilter(v); setPage(1) }, placeholder: 'All Status',
            options: [
              { value: 'draft', label: 'Draft' }, { value: 'open', label: 'Open' }, { value: 'checkin', label: 'Check-In' },
              { value: 'live', label: 'Live' }, { value: 'completed', label: 'Completed' }, { value: 'cancelled', label: 'Cancelled' },
            ],
          },
        ]}
      />

      {loading ? (
        <div style={{ fontFamily: 'Rajdhani, sans-serif', fontSize: 13, color: '#4F5568', padding: 40, textAlign: 'center' }}>Loading...</div>
      ) : (
        <DataTable columns={columns} rows={tournaments} emptyText="No tournaments" page={page} totalPages={pages} onPage={setPage} />
      )}

      {/* Detail Modal */}
      {detailModal && (
        <Modal title={`${detailModal.gameEmoji} ${detailModal.name}`} onClose={() => setDetailModal(null)} width={600}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, fontSize: 11, fontFamily: 'Rajdhani, sans-serif', color: '#DDE0EA' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <div><span style={{ color: '#4F5568' }}>Game:</span> {detailModal.game}</div>
              <div><span style={{ color: '#4F5568' }}>Status:</span> <span style={{ color: STATUS_COLORS[detailModal.status], fontWeight: 700, textTransform: 'uppercase' }}>{detailModal.status}</span></div>
              <div><span style={{ color: '#4F5568' }}>Bracket:</span> {detailModal.bracketType}</div>
              <div><span style={{ color: '#4F5568' }}>Format:</span> {detailModal.format}</div>
              <div><span style={{ color: '#4F5568' }}>Series:</span> {detailModal.series}</div>
              <div><span style={{ color: '#4F5568' }}>Entry:</span> {detailModal.entryType}</div>
              <div><span style={{ color: '#4F5568' }}>Teams:</span> {detailModal.registeredCount}/{detailModal.maxTeams}</div>
              <div><span style={{ color: '#4F5568' }}>Prize Pool:</span> <span style={{ color: '#22c55e', fontWeight: 700 }}>${((detailModal.prizePool || 0) / 100).toFixed(2)}</span></div>
              <div><span style={{ color: '#4F5568' }}>Entry Fee:</span> {detailModal.entryCredits} credits</div>
              <div><span style={{ color: '#4F5568' }}>Region:</span> {detailModal.region}</div>
              <div><span style={{ color: '#4F5568' }}>Platform:</span> {detailModal.platform}</div>
              <div><span style={{ color: '#4F5568' }}>Start:</span> {detailModal.startDate} {detailModal.startTime}</div>
            </div>

            {/* Prizes */}
            {detailModal.prizes?.length > 0 && (
              <div>
                <div style={labelStyle}>Prizes</div>
                {detailModal.prizes.map((p: any, i: number) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', borderBottom: '1px solid rgba(255,255,255,.04)' }}>
                    <span style={{ color: p.color || '#DDE0EA', fontWeight: 700 }}>{p.place}</span>
                    <span style={{ color: '#22c55e' }}>${(p.amount / 100).toFixed(2)}{p.creditsBonus ? ` + ${p.creditsBonus}cr` : ''}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Registered Entries */}
            {detailModal.registeredEntries?.length > 0 && (
              <div>
                <div style={labelStyle}>Registered ({detailModal.registeredEntries.length})</div>
                <div style={{ maxHeight: 200, overflowY: 'auto' }}>
                  {detailModal.registeredEntries.map((e: any, i: number) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '4px 0', borderBottom: '1px solid rgba(255,255,255,.04)' }}>
                      <span style={{ fontSize: 10, color: '#4F5568', width: 20 }}>#{e.seed || i + 1}</span>
                      <span style={{ fontWeight: 700 }}>{e.emoji || '🎮'} {e.name}</span>
                      <span style={{ marginLeft: 'auto', fontSize: 9, color: e.checkedIn ? '#22c55e' : '#4F5568' }}>{e.checkedIn ? 'CHECKED IN' : 'NOT CHECKED'}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Rules */}
            {detailModal.rules?.length > 0 && (
              <div>
                <div style={labelStyle}>Rules</div>
                <ul style={{ margin: 0, paddingLeft: 16, color: '#8890A4', fontSize: 10 }}>
                  {detailModal.rules.map((r: string, i: number) => <li key={i}>{r}</li>)}
                </ul>
              </div>
            )}
          </div>
        </Modal>
      )}

      {/* Create Modal */}
      {createModal && (
        <Modal title="Create Tournament" onClose={() => setCreateModal(false)} width={500}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[['Name', 'name'], ['Slug', 'slug'], ['Game', 'game'], ['Game Emoji', 'gameEmoji'], ['Format', 'format'], ['Series', 'series'], ['Max Teams', 'maxTeams'], ['Entry Credits', 'entryCredits'], ['Prize Pool (cents)', 'prizePool'], ['Start Date', 'startDate'], ['Start Time', 'startTime'], ['Banner URL', 'bannerUrl']].map(([l, k]) => (
              <div key={k as string}><div style={labelStyle}>{l}</div><input value={(form as any)[k as string]} onChange={e => setForm(p => ({ ...p, [k as string]: e.target.value }))} style={inputStyle} /></div>
            ))}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <div><div style={labelStyle}>Bracket Type</div>
                <select value={form.bracketType} onChange={e => setForm(p => ({ ...p, bracketType: e.target.value }))} style={inputStyle}>
                  <option value="Single Elimination">Single Elimination</option>
                  <option value="Double Elimination">Double Elimination</option>
                </select>
              </div>
              <div><div style={labelStyle}>Entry Type</div>
                <select value={form.entryType} onChange={e => setForm(p => ({ ...p, entryType: e.target.value }))} style={inputStyle}>
                  <option value="solo">Solo</option><option value="team">Team</option><option value="both">Both</option>
                </select>
              </div>
              <div><div style={labelStyle}>Region</div>
                <select value={form.region} onChange={e => setForm(p => ({ ...p, region: e.target.value }))} style={inputStyle}>
                  <option value="North America">North America</option><option value="Europe">Europe</option><option value="Asia">Asia</option><option value="Global">Global</option>
                </select>
              </div>
              <div><div style={labelStyle}>Platform</div>
                <select value={form.platform} onChange={e => setForm(p => ({ ...p, platform: e.target.value }))} style={inputStyle}>
                  <option value="Cross-Play">Cross-Play</option><option value="PlayStation">PlayStation</option><option value="Xbox">Xbox</option><option value="PC">PC</option>
                </select>
              </div>
            </div>
            <div><div style={labelStyle}>Accent Color</div><input type="color" value={form.accentColor} onChange={e => setForm(p => ({ ...p, accentColor: e.target.value }))} style={{ ...inputStyle, height: 36, padding: 2 }} /></div>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 11, color: '#DDE0EA', fontFamily: 'Rajdhani, sans-serif', cursor: 'pointer' }}>
              <input type="checkbox" checked={form.isFeatured} onChange={e => setForm(p => ({ ...p, isFeatured: e.target.checked }))} /> Featured Tournament
            </label>
            <ActionBtn label="CREATE TOURNAMENT" color="#22c55e" onClick={handleCreate} />
          </div>
        </Modal>
      )}
    </div>
  )
}
