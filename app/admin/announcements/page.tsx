'use client'

import { useEffect, useState, useCallback } from 'react'
import { adminApi } from '@/lib/api'
import DataTable, { Column } from '../components/DataTable'
import ActionBtn from '../components/ActionBtn'
import Modal from '../components/Modal'

const TYPE_COLORS: Record<string, string> = { info: '#3b82f6', warning: '#f59e0b', maintenance: '#f97316', event: '#22c55e' }
const inputStyle: React.CSSProperties = {
  padding: '7px 12px', background: '#0d0d14', border: '1px solid rgba(255,255,255,.09)',
  borderRadius: 6, fontSize: 11, color: '#fff', fontFamily: 'Rajdhani, sans-serif', outline: 'none', width: '100%',
}
const labelStyle: React.CSSProperties = {
  fontSize: 9, fontWeight: 700, color: '#4F5568', fontFamily: 'Rajdhani, sans-serif',
  textTransform: 'uppercase', letterSpacing: .6, marginBottom: 4,
}

export default function AdminAnnouncementsPage() {
  const [announcements, setAnnouncements] = useState<any[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [pages, setPages] = useState(1)
  const [loading, setLoading] = useState(true)
  const [createModal, setCreateModal] = useState(false)
  const [form, setForm] = useState({ title: '', message: '', type: 'info', icon: '📢', expiresAt: '', pinned: false, isActive: true })

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await adminApi.getAnnouncements({ page, limit: 25 })
      setAnnouncements(res.announcements)
      setTotal(res.total)
      setPages(res.pages)
    } catch { }
    setLoading(false)
  }, [page])

  useEffect(() => { load() }, [load])

  const handleCreate = async () => {
    try {
      await adminApi.createAnnouncement({ ...form, expiresAt: form.expiresAt || null })
      setCreateModal(false)
      setForm({ title: '', message: '', type: 'info', icon: '📢', expiresAt: '', pinned: false, isActive: true })
      load()
    } catch { }
  }

  const handleToggle = async (id: string, isActive: boolean) => {
    try { await adminApi.updateAnnouncement(id, { isActive: !isActive }); load() } catch { }
  }

  const handleDelete = async (id: string) => {
    try { await adminApi.deleteAnnouncement(id); load() } catch { }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1 style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 900, fontSize: 28, color: '#fff', margin: 0, textTransform: 'uppercase' }}>Announcements</h1>
        <ActionBtn label="+ NEW ANNOUNCEMENT" color="#22c55e" onClick={() => setCreateModal(true)} />
      </div>

      {/* Active announcements as cards */}
      {announcements.filter(a => a.isActive).length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {announcements.filter(a => a.isActive).map(a => (
            <div key={a._id} style={{
              background: `${TYPE_COLORS[a.type] || '#3b82f6'}12`,
              border: `1px solid ${TYPE_COLORS[a.type] || '#3b82f6'}33`,
              borderRadius: 8, padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 12,
            }}>
              <span style={{ fontSize: 20 }}>{a.icon || '📢'}</span>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ fontWeight: 700, fontSize: 13, color: '#DDE0EA', fontFamily: 'Rajdhani, sans-serif' }}>{a.title}</span>
                  {a.pinned && <span style={{ fontSize: 8, color: '#f59e0b', fontWeight: 700, fontFamily: 'Rajdhani, sans-serif' }}>📌 PINNED</span>}
                  <span style={{ fontSize: 8, fontWeight: 700, padding: '1px 4px', borderRadius: 3, color: TYPE_COLORS[a.type] || '#3b82f6', border: `1px solid ${TYPE_COLORS[a.type] || '#3b82f6'}44` }}>{a.type}</span>
                </div>
                <div style={{ fontSize: 10, color: '#8890A4', fontFamily: 'Rajdhani, sans-serif', marginTop: 2 }}>{a.message}</div>
              </div>
              <div style={{ display: 'flex', gap: 4 }}>
                <ActionBtn label="DEACTIVATE" color="#f59e0b" onClick={() => handleToggle(a._id, a.isActive)} />
                <ActionBtn label="DELETE" color="#e8000d" onClick={() => handleDelete(a._id)} />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* All announcements table */}
      {loading ? <div style={{ fontFamily: 'Rajdhani, sans-serif', fontSize: 13, color: '#4F5568', padding: 40, textAlign: 'center' }}>Loading...</div> : (
        <DataTable
          columns={[
            { key: 'title', label: 'Title', width: '2fr', render: (r: any) => <span style={{ fontWeight: 700 }}>{r.icon} {r.title}</span> },
            { key: 'type', label: 'Type', width: '80px', render: (r: any) => <span style={{ fontSize: 9, fontWeight: 700, color: TYPE_COLORS[r.type] || '#4F5568' }}>{r.type}</span> },
            { key: 'isActive', label: 'Active', width: '60px', render: (r: any) => <span style={{ color: r.isActive ? '#22c55e' : '#4F5568', fontSize: 9, fontWeight: 700 }}>{r.isActive ? 'YES' : 'NO'}</span> },
            { key: 'pinned', label: 'Pinned', width: '60px', render: (r: any) => r.pinned ? '📌' : '—' },
            { key: 'createdAt', label: 'Created', width: '90px', render: (r: any) => new Date(r.createdAt).toLocaleDateString() },
            { key: 'actions', label: '', width: '100px', render: (r: any) => (
              <div style={{ display: 'flex', gap: 4 }}>
                <ActionBtn label={r.isActive ? 'OFF' : 'ON'} color={r.isActive ? '#f59e0b' : '#22c55e'} onClick={() => handleToggle(r._id, r.isActive)} />
                <ActionBtn label="DEL" color="#e8000d" onClick={() => handleDelete(r._id)} />
              </div>
            )},
          ]}
          rows={announcements}
          emptyText="No announcements"
          page={page} totalPages={pages} onPage={setPage}
        />
      )}

      {createModal && (
        <Modal title="New Announcement" onClose={() => setCreateModal(false)} width={460}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div><div style={labelStyle}>Title</div><input value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} style={inputStyle} /></div>
            <div><div style={labelStyle}>Message</div><textarea value={form.message} onChange={e => setForm(p => ({ ...p, message: e.target.value }))} style={{ ...inputStyle, minHeight: 80, resize: 'vertical' }} /></div>
            <div><div style={labelStyle}>Type</div>
              <select value={form.type} onChange={e => setForm(p => ({ ...p, type: e.target.value }))} style={inputStyle}>
                <option value="info">Info</option><option value="warning">Warning</option>
                <option value="maintenance">Maintenance</option><option value="event">Event</option>
              </select>
            </div>
            <div><div style={labelStyle}>Icon</div><input value={form.icon} onChange={e => setForm(p => ({ ...p, icon: e.target.value }))} style={inputStyle} placeholder="📢" /></div>
            <div><div style={labelStyle}>Expires At</div><input type="date" value={form.expiresAt} onChange={e => setForm(p => ({ ...p, expiresAt: e.target.value }))} style={inputStyle} /></div>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 11, color: '#DDE0EA', fontFamily: 'Rajdhani, sans-serif', cursor: 'pointer' }}>
              <input type="checkbox" checked={form.pinned} onChange={e => setForm(p => ({ ...p, pinned: e.target.checked }))} /> Pin to top
            </label>
            <ActionBtn label="PUBLISH ANNOUNCEMENT" color="#22c55e" onClick={handleCreate} />
          </div>
        </Modal>
      )}
    </div>
  )
}
