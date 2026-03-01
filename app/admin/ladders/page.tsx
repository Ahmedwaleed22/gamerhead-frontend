'use client'

import { useEffect, useState, useCallback } from 'react'
import { adminApi } from '@/lib/api'
import DataTable, { Column } from '../components/DataTable'
import SearchFilter from '../components/SearchFilter'
import ActionBtn from '../components/ActionBtn'
import Modal from '../components/Modal'

const inputStyle: React.CSSProperties = {
  padding: '7px 12px', background: '#0d0d14', border: '1px solid rgba(255,255,255,.09)',
  borderRadius: 6, fontSize: 11, color: '#fff', fontFamily: 'Rajdhani, sans-serif', outline: 'none', width: '100%',
}
const labelStyle: React.CSSProperties = {
  fontSize: 9, fontWeight: 700, color: '#4F5568', fontFamily: 'Rajdhani, sans-serif',
  textTransform: 'uppercase', letterSpacing: .6, marginBottom: 4,
}
const STATUS_COLORS: Record<string, string> = { active: '#22c55e', offseason: '#f59e0b', completed: '#8890A4', archived: '#4F5568' }

export default function AdminLaddersPage() {
  const [ladders, setLadders] = useState<any[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [pages, setPages] = useState(1)
  const [loading, setLoading] = useState(true)
  const [status, setStatus] = useState('')
  const [createModal, setCreateModal] = useState(false)
  const [editModal, setEditModal] = useState<any>(null)
  const [form, setForm] = useState({ name: '', slug: '', game: '', gameSlug: '', type: 'cash', teamSize: 'Squad', region: '', platform: '', currentSeason: 'S1', prize: '', prizePool: '', totalSlots: '0', isActive: true, isFeatured: false })

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const params: any = { page, limit: 25 }
      if (status) params.status = status
      const res = await adminApi.getLadders(params)
      setLadders(res.ladders)
      setTotal(res.total)
      setPages(res.pages)
    } catch (err) { console.error('[Admin Ladders] load error:', err) }
    setLoading(false)
  }, [page, status])

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
      type: ladder.type || 'cash',
      teamSize: ladder.teamSize || 'Squad',
      region: ladder.region || '',
      platform: ladder.platform || '',
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
        <h1 style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 900, fontSize: 28, color: '#fff', margin: 0, textTransform: 'uppercase' }}>Ladders</h1>
        <ActionBtn label="+ CREATE LADDER" color="#22c55e" onClick={() => setCreateModal(true)} />
      </div>

      <SearchFilter filters={[{
        value: status, onChange: v => { setStatus(v); setPage(1) }, placeholder: 'All Status',
        options: [{ value: 'active', label: 'Active' }, { value: 'offseason', label: 'Offseason' }, { value: 'completed', label: 'Completed' }, { value: 'archived', label: 'Archived' }],
      }]} />

      {loading ? <div style={{ fontFamily: 'Rajdhani, sans-serif', fontSize: 13, color: '#4F5568', padding: 40, textAlign: 'center' }}>Loading...</div> : (
        <DataTable columns={columns} rows={ladders} emptyText="No ladders" page={page} totalPages={pages} onPage={setPage} />
      )}

      {createModal && (
        <Modal title="Create Ladder" onClose={() => setCreateModal(false)} width={460}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[['Name', 'name'], ['Slug', 'slug'], ['Game', 'game'], ['Game Slug', 'gameSlug'], ['Region', 'region'], ['Platform', 'platform'], ['Prize', 'prize'], ['Prize Pool (cents)', 'prizePool'], ['Total Slots', 'totalSlots']].map(([l, k]) => (
              <div key={k as string}><div style={labelStyle}>{l}</div><input value={(form as any)[k as string]} onChange={e => setForm(p => ({ ...p, [k as string]: e.target.value }))} style={inputStyle} /></div>
            ))}
            <div><div style={labelStyle}>Type</div>
              <select value={form.type} onChange={e => setForm(p => ({ ...p, type: e.target.value }))} style={inputStyle}>
                <option value="cash">Cash</option><option value="xp">XP</option>
              </select>
            </div>
            <div><div style={labelStyle}>Team Size</div>
              <select value={form.teamSize} onChange={e => setForm(p => ({ ...p, teamSize: e.target.value }))} style={inputStyle}>
                <option value="Solo">Solo</option><option value="Duo">Duo</option><option value="Trio">Trio</option><option value="Squad">Squad</option>
              </select>
            </div>
            <ActionBtn label="CREATE LADDER" color="#22c55e" onClick={handleCreate} />
          </div>
        </Modal>
      )}

      {editModal && (
        <Modal title="Edit Ladder" subtitle={editModal.name} onClose={() => setEditModal(null)} width={460}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[['Name', 'name'], ['Slug', 'slug'], ['Game', 'game'], ['Game Slug', 'gameSlug'], ['Region', 'region'], ['Platform', 'platform'], ['Prize', 'prize'], ['Prize Pool (cents)', 'prizePool'], ['Total Slots', 'totalSlots']].map(([l, k]) => (
              <div key={k as string}><div style={labelStyle}>{l}</div><input value={(form as any)[k as string]} onChange={e => setForm(p => ({ ...p, [k as string]: e.target.value }))} style={inputStyle} /></div>
            ))}
            <div><div style={labelStyle}>Type</div>
              <select value={form.type} onChange={e => setForm(p => ({ ...p, type: e.target.value }))} style={inputStyle}>
                <option value="cash">Cash</option><option value="xp">XP</option>
              </select>
            </div>
            <div><div style={labelStyle}>Team Size</div>
              <select value={form.teamSize} onChange={e => setForm(p => ({ ...p, teamSize: e.target.value }))} style={inputStyle}>
                <option value="Solo">Solo</option><option value="Duo">Duo</option><option value="Trio">Trio</option><option value="Squad">Squad</option>
              </select>
            </div>
            <ActionBtn label="SAVE CHANGES" color="#22c55e" onClick={handleEdit} />
          </div>
        </Modal>
      )}
    </div>
  )
}
