'use client'

import { useEffect, useState, useCallback } from 'react'
import { adminApi } from '@/lib/api'
import DataTable, { Column } from '../components/DataTable'
import ActionBtn from '../components/ActionBtn'
import Modal from '../components/Modal'
import StatCard from '../components/StatCard'

type Tab = 'Members' | 'Plans'

const inputStyle: React.CSSProperties = {
  padding: '7px 12px', background: '#0d0d14', border: '1px solid rgba(255,255,255,.09)',
  borderRadius: 6, fontSize: 11, color: '#fff', fontFamily: 'Rajdhani, sans-serif', outline: 'none', width: '100%',
}
const labelStyle: React.CSSProperties = {
  fontSize: 9, fontWeight: 700, color: '#4F5568', fontFamily: 'Rajdhani, sans-serif',
  textTransform: 'uppercase', letterSpacing: .6, marginBottom: 4,
}

export default function AdminPremiumPage() {
  const [tab, setTab] = useState<Tab>('Members')

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div>
        <h1 style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 900, fontSize: 28, color: '#fff', margin: 0, textTransform: 'uppercase' }}>
          Premium Plans
        </h1>
      </div>
      <div style={{ display: 'flex', gap: 0, borderBottom: '1px solid rgba(255,255,255,.06)' }}>
        {(['Members', 'Plans'] as Tab[]).map(t => (
          <button key={t} onClick={() => setTab(t)} style={{
            padding: '8px 16px', fontSize: 11, fontWeight: 700, fontFamily: 'Rajdhani, sans-serif',
            background: 'transparent', border: 'none', cursor: 'pointer',
            color: tab === t ? '#fff' : '#4F5568', borderBottom: tab === t ? '2px solid #e8000d' : '2px solid transparent',
          }}>{t}</button>
        ))}
      </div>
      {tab === 'Members' && <MembersTab />}
      {tab === 'Plans' && <PlansTab />}
    </div>
  )
}

function MembersTab() {
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
    { key: 'username', label: 'User', width: '2fr', render: (r: any) => <span style={{ fontWeight: 700 }}>{r.username}</span> },
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
    <div>
      {/* Stats Cards */}
      {stats && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14, marginBottom: 16 }}>
          <StatCard icon="⭐" label="Total Premium Members" value={stats.totalMembers} color="#f59e0b" />
          <StatCard icon="⚠️" label="Expiring This Week" value={stats.expiringThisWeek} color={stats.expiringThisWeek > 0 ? '#e8000d' : '#22c55e'} />
          <StatCard icon="🆕" label="New This Month" value={stats.newThisMonth} color="#3b82f6" />
        </div>
      )}

      <div style={{ marginBottom: 12 }}>
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

function PlansTab() {
  const [plans, setPlans] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [createModal, setCreateModal] = useState(false)
  const [editModal, setEditModal] = useState<any>(null)
  const [form, setForm] = useState({ name: '', slug: '', durationDays: '30', price: '', priceDisplay: '', features: '', badge: '', isActive: true, sortOrder: '0' })

  const load = async () => {
    setLoading(true)
    try { const res = await adminApi.getPremiumPlans(); setPlans(Array.isArray(res) ? res : res.plans || []) } catch { }
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const handleCreate = async () => {
    try {
      await adminApi.createPremiumPlan({
        ...form, durationDays: Number(form.durationDays), price: Number(form.price),
        features: form.features.split('\n').filter(Boolean), sortOrder: Number(form.sortOrder),
      })
      setCreateModal(false)
      load()
    } catch { }
  }

  const openEditModal = (plan: any) => {
    setForm({
      name: plan.name || '',
      slug: plan.slug || '',
      durationDays: String(plan.durationDays || '30'),
      price: String(plan.price || ''),
      priceDisplay: plan.priceDisplay || '',
      features: (plan.features || []).join('\n'),
      badge: plan.badge || '',
      isActive: plan.isActive ?? true,
      sortOrder: String(plan.sortOrder || '0'),
    })
    setEditModal(plan)
  }

  const handleEdit = async () => {
    if (!editModal) return
    try {
      await adminApi.updatePremiumPlan(editModal._id, {
        ...form, durationDays: Number(form.durationDays), price: Number(form.price),
        features: form.features.split('\n').filter(Boolean), sortOrder: Number(form.sortOrder),
      })
      setEditModal(null)
      setForm({ name: '', slug: '', durationDays: '30', price: '', priceDisplay: '', features: '', badge: '', isActive: true, sortOrder: '0' })
      load()
    } catch { }
  }

  const handleDelete = async (id: string) => {
    try { await adminApi.deletePremiumPlan(id); load() } catch { }
  }

  return (
    <div>
      <div style={{ marginBottom: 12 }}><ActionBtn label="+ ADD PLAN" color="#22c55e" onClick={() => setCreateModal(true)} /></div>
      {loading ? <div style={{ fontFamily: 'Rajdhani, sans-serif', fontSize: 13, color: '#4F5568', padding: 40, textAlign: 'center' }}>Loading...</div> : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 14 }}>
          {plans.map((plan: any) => (
            <div key={plan._id} style={{ background: '#13131E', border: '1px solid rgba(255,255,255,.06)', borderRadius: 10, padding: 18 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <span style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 900, fontSize: 18, color: '#fff' }}>{plan.name}</span>
                {plan.badge && <span style={{ fontSize: 8, fontWeight: 800, fontFamily: 'Rajdhani, sans-serif', background: 'rgba(245,158,11,.15)', border: '1px solid rgba(245,158,11,.3)', borderRadius: 3, padding: '2px 6px', color: '#f59e0b' }}>{plan.badge}</span>}
              </div>
              <div style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 900, fontSize: 28, color: '#f59e0b', marginBottom: 4 }}>{plan.priceDisplay || `$${((plan.price || 0) / 100).toFixed(2)}`}</div>
              <div style={{ fontSize: 10, color: '#4F5568', fontFamily: 'Rajdhani, sans-serif', marginBottom: 10 }}>{plan.durationDays} days · {plan.isActive ? 'Active' : 'Inactive'}</div>
              {plan.features?.map((f: string, i: number) => (
                <div key={i} style={{ fontSize: 10, color: '#8890A4', fontFamily: 'Rajdhani, sans-serif', padding: '2px 0' }}>✓ {f}</div>
              ))}
              <div style={{ display: 'flex', gap: 6, marginTop: 12 }}>
                <ActionBtn label="EDIT" color="#3b82f6" onClick={() => openEditModal(plan)} />
                <ActionBtn label="DELETE" color="#e8000d" onClick={() => handleDelete(plan._id)} />
              </div>
            </div>
          ))}
        </div>
      )}
      {createModal && (
        <Modal title="Create Premium Plan" onClose={() => setCreateModal(false)} width={460}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div><div style={labelStyle}>Name</div><input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} style={inputStyle} /></div>
            <div><div style={labelStyle}>Slug</div><input value={form.slug} onChange={e => setForm(p => ({ ...p, slug: e.target.value }))} style={inputStyle} /></div>
            <div><div style={labelStyle}>Duration Days</div><input type="number" value={form.durationDays} onChange={e => setForm(p => ({ ...p, durationDays: e.target.value }))} style={inputStyle} /></div>
            <div><div style={labelStyle}>Price (cents)</div><input type="number" value={form.price} onChange={e => setForm(p => ({ ...p, price: e.target.value }))} style={inputStyle} /></div>
            <div><div style={labelStyle}>Price Display</div><input value={form.priceDisplay} onChange={e => setForm(p => ({ ...p, priceDisplay: e.target.value }))} style={inputStyle} placeholder="$9.99" /></div>
            <div><div style={labelStyle}>Features (one per line)</div><textarea value={form.features} onChange={e => setForm(p => ({ ...p, features: e.target.value }))} style={{ ...inputStyle, minHeight: 80, resize: 'vertical' }} /></div>
            <div><div style={labelStyle}>Badge Text</div><input value={form.badge} onChange={e => setForm(p => ({ ...p, badge: e.target.value }))} style={inputStyle} placeholder="BEST VALUE" /></div>
            <ActionBtn label="CREATE PLAN" color="#22c55e" onClick={handleCreate} />
          </div>
        </Modal>
      )}
      {editModal && (
        <Modal title="Edit Plan" subtitle={editModal.name} onClose={() => setEditModal(null)} width={460}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div><div style={labelStyle}>Name</div><input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} style={inputStyle} /></div>
            <div><div style={labelStyle}>Slug</div><input value={form.slug} onChange={e => setForm(p => ({ ...p, slug: e.target.value }))} style={inputStyle} /></div>
            <div><div style={labelStyle}>Duration Days</div><input type="number" value={form.durationDays} onChange={e => setForm(p => ({ ...p, durationDays: e.target.value }))} style={inputStyle} /></div>
            <div><div style={labelStyle}>Price (cents)</div><input type="number" value={form.price} onChange={e => setForm(p => ({ ...p, price: e.target.value }))} style={inputStyle} /></div>
            <div><div style={labelStyle}>Price Display</div><input value={form.priceDisplay} onChange={e => setForm(p => ({ ...p, priceDisplay: e.target.value }))} style={inputStyle} placeholder="$9.99" /></div>
            <div><div style={labelStyle}>Features (one per line)</div><textarea value={form.features} onChange={e => setForm(p => ({ ...p, features: e.target.value }))} style={{ ...inputStyle, minHeight: 80, resize: 'vertical' }} /></div>
            <div><div style={labelStyle}>Badge Text</div><input value={form.badge} onChange={e => setForm(p => ({ ...p, badge: e.target.value }))} style={inputStyle} placeholder="BEST VALUE" /></div>
            <ActionBtn label="SAVE CHANGES" color="#22c55e" onClick={handleEdit} />
          </div>
        </Modal>
      )}
    </div>
  )
}
