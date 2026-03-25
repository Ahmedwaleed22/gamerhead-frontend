'use client'

import { useEffect, useState, useCallback } from 'react'
import { adminApi } from '@/lib/api'
import DataTable, { Column } from '../components/DataTable'
import SearchFilter from '../components/SearchFilter'
import ActionBtn from '../components/ActionBtn'
import Modal from '../components/Modal'

const inputStyle: React.CSSProperties = {
  padding: '7px 12px', background: '#0d0d14', border: '1px solid rgba(255,255,255,.09)',
  borderRadius: 6, fontSize: 11, color: '#fff', outline: 'none', width: '100%',
}
const labelStyle: React.CSSProperties = {
  fontSize: 9, fontWeight: 700, color: '#4F5568',
  textTransform: 'uppercase', letterSpacing: .6, marginBottom: 4,
}
const STATUS_COLORS: Record<string, string> = { active: '#22c55e', offseason: '#f59e0b', completed: '#8890A4', archived: '#4F5568' }

const REGIONS = ['North America', 'Europe', 'Asia', 'Oceania', 'South America', 'Middle East', 'Africa', 'Global']

export default function AdminLaddersPage() {
  const [ladders, setLadders] = useState<any[]>([])
  const [games, setGames] = useState<any[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [pages, setPages] = useState(1)
  const [loading, setLoading] = useState(true)
  const [status, setStatus] = useState('')
  const [gameFilter, setGameFilter] = useState('')
  const [createModal, setCreateModal] = useState(false)
  const [editModal, setEditModal] = useState<any>(null)
  const [form, setForm] = useState({ name: '', slug: '', game: '', gameSlug: '', type: 'xp', teamSize: 'Squad', region: 'North America', platform: 'crossplay', currentSeason: 'S1', prize: '', prizePool: '', totalSlots: '0', isActive: true, isFeatured: false })

  // Load games list for dropdowns
  useEffect(() => {
    adminApi.getGames({ limit: 50 }).then((res: any) => setGames(res.games || [])).catch(() => {})
  }, [])

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const params: any = { page, limit: 25 }
      if (status) params.status = status
      if (gameFilter) params.game = gameFilter
      const res = await adminApi.getLadders(params)
      setLadders(res.ladders)
      setTotal(res.total)
      setPages(res.pages)
    } catch (err) { console.error('[Admin Ladders] load error:', err) }
    setLoading(false)
  }, [page, status, gameFilter])

  useEffect(() => { load() }, [load])

  const handleCreate = async () => {
    try {
      await adminApi.createLadder({ ...form, prizePool: Number(form.prizePool) || 0, totalSlots: Number(form.totalSlots) || 0 })
      setCreateModal(false)
      load()
    } catch { }
  }

  const openEditModal = (ladder: any) => {
    setForm({
      name: ladder.name || '',
      slug: ladder.slug || '',
      game: ladder.game || '',
      gameSlug: ladder.gameSlug || '',
      type: ladder.type || 'xp',
      teamSize: ladder.teamSize || 'Squad',
      region: ladder.region || 'North America',
      platform: ladder.platform || 'crossplay',
      currentSeason: ladder.currentSeason || 'S1',
      prize: ladder.prize || '',
      prizePool: String(ladder.prizePool || ''),
      totalSlots: String(ladder.totalSlots || '0'),
      isActive: ladder.isActive ?? true,
      isFeatured: ladder.isFeatured ?? false,
    })
    setEditModal(ladder)
  }

  const handleEdit = async () => {
    if (!editModal) return
    try {
      await adminApi.updateLadder(editModal._id, { ...form, prizePool: Number(form.prizePool) || 0, totalSlots: Number(form.totalSlots) || 0 })
      setEditModal(null)
      load()
    } catch { }
  }

  const handleResetSeason = async (id: string) => {
    if (!confirm('Reset this ladder season? This will archive current standings.')) return
    try { await adminApi.resetLadderSeason(id); load() } catch { }
  }

  const handleDelete = async (id: string) => {
    try { await adminApi.deleteLadder(id); load() } catch { }
  }

  const handleGameSelect = (slug: string) => {
    const g = games.find((g: any) => g.slug === slug)
    if (g) setForm(p => ({ ...p, game: g.name, gameSlug: g.slug }))
    else setForm(p => ({ ...p, game: '', gameSlug: '' }))
  }

  const ladderForm = (onSubmit: () => void, submitLabel: string) => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Game */}
      <div><div style={labelStyle}>Game</div>
        <select value={form.gameSlug} onChange={e => handleGameSelect(e.target.value)} style={{ ...inputStyle, cursor: 'pointer' }}>
          <option value="">Select game...</option>
          {games.map((g: any) => <option key={g._id} value={g.slug}>{g.name}</option>)}
        </select>
      </div>

      {/* Name / Slug */}
      {[['Name', 'name'], ['Slug', 'slug']].map(([l, k]) => (
        <div key={k as string}><div style={labelStyle}>{l}</div><input value={(form as any)[k as string]} onChange={e => setForm(p => ({ ...p, [k as string]: e.target.value }))} style={inputStyle} /></div>
      ))}

      {/* Type */}
      <div><div style={labelStyle}>Type</div>
        <select value={form.type} onChange={e => setForm(p => ({ ...p, type: e.target.value }))} style={{ ...inputStyle, cursor: 'pointer' }}>
          <option value="xp">XP</option>
          <option value="cash">Cash</option>
        </select>
      </div>

      {/* Team Size — filtered by selected game's teamSizes config */}
      <div><div style={labelStyle}>Team Size</div>
        {(() => {
          const selectedGame = games.find((g: any) => g.slug === form.gameSlug)
          const gameSizes = selectedGame?.teamSizes && typeof selectedGame.teamSizes === 'object' ? selectedGame.teamSizes : null
          const sizeOptions = gameSizes ? Object.entries(gameSizes).map(([k, v]) => {
            // v can be number[] (new) or number (old)
            const arr = Array.isArray(v) ? v : [v]
            const label = k === 'Squad' ? `Squad (${arr.map((n: number) => `${n}v${n}`).join(' / ')})` : `${k} (${arr[0]}v${arr[0]})`
            return { value: k, label }
          }) : [
            { value: 'Solo', label: 'Solo (1v1)' },
            { value: 'Duo', label: 'Duo (2v2)' },
            { value: 'Squad', label: 'Squad' },
          ]
          return (
            <select value={form.teamSize} onChange={e => setForm(p => ({ ...p, teamSize: e.target.value }))} style={{ ...inputStyle, cursor: 'pointer' }}>
              {!form.gameSlug && <option value="">Select a game first...</option>}
              {sizeOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          )
        })()}
      </div>

      {/* Region */}
      <div><div style={labelStyle}>Region</div>
        <select value={form.region} onChange={e => setForm(p => ({ ...p, region: e.target.value }))} style={{ ...inputStyle, cursor: 'pointer' }}>
          <option value="">Select region...</option>
          {REGIONS.map(r => <option key={r} value={r}>{r}</option>)}
        </select>
      </div>

      {/* Platform */}
      <div><div style={labelStyle}>Platform</div>
        <select value={form.platform} onChange={e => setForm(p => ({ ...p, platform: e.target.value }))} style={{ ...inputStyle, cursor: 'pointer' }}>
          <option value="crossplay">Crossplay (PC / Xbox / PS)</option>
          <option value="console">Console Only (Xbox / PS)</option>
          <option value="pc">PC Only</option>
        </select>
      </div>

      {/* Season */}
      <div><div style={labelStyle}>Current Season</div>
        <input value={form.currentSeason} onChange={e => setForm(p => ({ ...p, currentSeason: e.target.value }))} style={inputStyle} placeholder="S1" />
      </div>

      {/* Prize / Prize Pool / Slots */}
      <div><div style={labelStyle}>Prize Description</div>
        <input value={form.prize} onChange={e => setForm(p => ({ ...p, prize: e.target.value }))} style={inputStyle} placeholder="e.g. $500 Prize Pool" />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 8 }}>
        <div><div style={labelStyle}>Prize Pool (cents)</div>
          <input type="number" value={form.prizePool} onChange={e => setForm(p => ({ ...p, prizePool: e.target.value }))} style={inputStyle} placeholder="0" />
        </div>
        <div><div style={labelStyle}>Total Slots</div>
          <input type="number" value={form.totalSlots} onChange={e => setForm(p => ({ ...p, totalSlots: e.target.value }))} style={inputStyle} placeholder="0 = unlimited" />
        </div>
      </div>

      <ActionBtn label={submitLabel} color="#22c55e" onClick={onSubmit} />
    </div>
  )

  const columns: Column[] = [
    { key: 'name', label: 'Ladder', width: '2fr', render: (r: any) => <span style={{ fontWeight: 700 }}>{r.name}</span> },
    { key: 'game', label: 'Game', width: '100px' },
    { key: 'type', label: 'Type', width: '60px', render: (r: any) => <span style={{ color: r.type === 'cash' ? '#22c55e' : '#3b82f6', fontSize: 9, fontWeight: 700 }}>{r.type?.toUpperCase()}</span> },
    { key: 'teamSize', label: 'Size', width: '60px' },
    { key: 'currentSeason', label: 'Season', width: '60px' },
    { key: 'status', label: 'Status', width: '80px',
      render: (r: any) => <span style={{ fontSize: 9, fontWeight: 700, color: STATUS_COLORS[r.status] || '#4F5568' }}>{r.status?.toUpperCase()}</span>,
    },
    { key: 'teamsJoined', label: 'Teams', width: '60px', render: (r: any) => `${r.teamsJoined || 0}/${r.totalSlots || '∞'}` },
    { key: 'actions', label: 'Actions', width: '180px',
      render: (r: any) => (
        <div style={{ display: 'flex', gap: 4 }}>
          <ActionBtn label="EDIT" color="#3b82f6" onClick={() => openEditModal(r)} />
          <ActionBtn label="RESET SEASON" color="#f59e0b" onClick={() => handleResetSeason(r._id)} />
          <ActionBtn label="DELETE" color="#e8000d" onClick={() => handleDelete(r._id)} />
        </div>
      ),
    },
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1 style={{ fontWeight: 900, fontSize: 28, color: '#fff', margin: 0, textTransform: 'uppercase' }}>Ladders</h1>
        <ActionBtn label="+ CREATE LADDER" color="#22c55e" onClick={() => setCreateModal(true)} />
      </div>

      <SearchFilter filters={[
        {
          value: gameFilter, onChange: v => { setGameFilter(v); setPage(1) }, placeholder: 'All Games',
          options: games.map((g: any) => ({ value: g.slug, label: g.name })),
        },
        {
          value: status, onChange: v => { setStatus(v); setPage(1) }, placeholder: 'All Status',
          options: [{ value: 'active', label: 'Active' }, { value: 'offseason', label: 'Offseason' }, { value: 'completed', label: 'Completed' }, { value: 'archived', label: 'Archived' }],
        },
      ]} />

      {loading ? <div style={{ fontSize: 13, color: '#4F5568', padding: 40, textAlign: 'center' }}>Loading...</div> : (
        <DataTable columns={columns} rows={ladders} emptyText="No ladders" page={page} totalPages={pages} onPage={setPage} />
      )}

      {createModal && (
        <Modal title="Create Ladder" onClose={() => setCreateModal(false)} width={460}>
          {ladderForm(handleCreate, 'CREATE LADDER')}
        </Modal>
      )}

      {editModal && (
        <Modal title="Edit Ladder" subtitle={editModal.name} onClose={() => setEditModal(null)} width={460}>
          {ladderForm(handleEdit, 'SAVE CHANGES')}
        </Modal>
      )}
    </div>
  )
}
