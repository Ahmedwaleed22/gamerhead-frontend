'use client'

import { useEffect, useState, useCallback } from 'react'
import { adminApi } from '@/lib/api'
import DataTable, { Column } from '../components/DataTable'
import ActionBtn from '../components/ActionBtn'
import Modal from '../components/Modal'
import StatCard from '../components/StatCard'
import { Solar } from '@/lib/solar-duotone'

const inputStyle: React.CSSProperties = {
  padding: '7px 12px', background: '#0d0d14', border: '1px solid rgba(255,255,255,.09)',
  borderRadius: 6, fontSize: 11, color: '#fff', fontFamily: 'Rajdhani, sans-serif', outline: 'none', width: '100%',
}
const labelStyle: React.CSSProperties = {
  fontSize: 9, fontWeight: 700, color: '#4F5568', fontFamily: 'Rajdhani, sans-serif',
  textTransform: 'uppercase', letterSpacing: .6, marginBottom: 4,
}

export default function AdminPremiumPage() {
  const [members, setMembers] = useState<any[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [pages, setPages] = useState(1)
  const [loading, setLoading] = useState(true)
  const [grantModal, setGrantModal] = useState(false)
  const [grantForm, setGrantForm] = useState({ userId: '', durationDays: '30', reason: '' })
  const [stats, setStats] = useState<any>(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [res, statsRes] = await Promise.all([
        adminApi.getPremiumMembers({ page, limit: 25 }),
        adminApi.getPremiumStats(),
      ])
      setMembers(res.members)
      setTotal(res.total)
      setPages(res.pages)
      setStats(statsRes)
    } catch { }
    setLoading(false)
  }, [page])

  useEffect(() => { load() }, [load])

  const handleGrant = async () => {
    if (!grantForm.userId) return
    try {
      await adminApi.grantPremium({ userId: grantForm.userId, durationDays: Number(grantForm.durationDays), reason: grantForm.reason })
      setGrantModal(false)
      setGrantForm({ userId: '', durationDays: '30', reason: '' })
      load()
    } catch { }
  }

  const handleRevoke = async (userId: string) => {
    try { await adminApi.revokePremium(userId); load() } catch { }
  }

  const columns: Column[] = [
    { key: 'username', label: 'User', width: '2fr', render: (r: any) => <span style={{ fontWeight: 700 }}>{r.displayName || r.username}</span> },
    { key: 'email', label: 'Email', width: '2fr', render: (r: any) => <span style={{ color: '#8890A4' }}>{r.email}</span> },
    { key: 'premiumExpiresAt', label: 'Expires', width: '120px',
      render: (r: any) => {
        if (!r.premiumExpiresAt) return '—'
        const exp = new Date(r.premiumExpiresAt)
        const daysLeft = Math.ceil((exp.getTime() - Date.now()) / 86400000)
        return <span style={{ color: daysLeft <= 7 ? '#e8000d' : '#22c55e' }}>{exp.toLocaleDateString()} ({daysLeft}d)</span>
      },
    },
    { key: 'actions', label: '', width: '80px',
      render: (r: any) => <ActionBtn label="REVOKE" color="#e8000d" onClick={() => handleRevoke(r._id)} />,
    },
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div>
        <h1 style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 900, fontSize: 28, color: '#fff', margin: 0, textTransform: 'uppercase' }}>
          Premium Members
        </h1>
      </div>

      {stats && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14 }}>
          <StatCard icon={Solar.star} label="Total Premium Members" value={stats.totalMembers} color="#f59e0b" />
          <StatCard icon={Solar.warning} label="Expiring This Week" value={stats.expiringThisWeek} color={stats.expiringThisWeek > 0 ? '#e8000d' : '#22c55e'} />
          <StatCard icon={Solar.sparkles} label="New This Month" value={stats.newThisMonth} color="#3b82f6" />
        </div>
      )}

      <div>
        <ActionBtn label="+ GRANT PREMIUM" color="#f59e0b" onClick={() => setGrantModal(true)} />
      </div>
      {loading ? <div style={{ fontFamily: 'Rajdhani, sans-serif', fontSize: 13, color: '#4F5568', padding: 40, textAlign: 'center' }}>Loading...</div> : (
        <DataTable columns={columns} rows={members} emptyText="No premium members" page={page} totalPages={pages} onPage={setPage} />
      )}
      {grantModal && (
        <Modal title="Grant Premium" onClose={() => setGrantModal(false)}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div><div style={labelStyle}>User ID</div><input value={grantForm.userId} onChange={e => setGrantForm(p => ({ ...p, userId: e.target.value }))} style={inputStyle} placeholder="Paste user ID..." /></div>
            <div>
              <div style={labelStyle}>Duration</div>
              <select value={grantForm.durationDays} onChange={e => setGrantForm(p => ({ ...p, durationDays: e.target.value }))} style={inputStyle}>
                <option value="7">7 Days</option><option value="30">30 Days</option>
                <option value="90">90 Days</option><option value="365">1 Year</option>
              </select>
            </div>
            <div><div style={labelStyle}>Reason</div><input value={grantForm.reason} onChange={e => setGrantForm(p => ({ ...p, reason: e.target.value }))} style={inputStyle} placeholder="Optional reason..." /></div>
            <ActionBtn label="GRANT PREMIUM" color="#f59e0b" onClick={handleGrant} />
          </div>
        </Modal>
      )}
    </div>
  )
}
