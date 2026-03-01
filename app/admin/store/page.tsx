'use client'

import { useEffect, useState, useCallback } from 'react'
import { adminApi } from '@/lib/api'
import DataTable, { Column } from '../components/DataTable'
import ActionBtn from '../components/ActionBtn'
import Modal from '../components/Modal'
import StatCard from '../components/StatCard'

type Tab = 'Items' | 'Orders' | 'Coupons' | 'Revenue'

const inputStyle: React.CSSProperties = {
  padding: '7px 12px', background: '#0d0d14', border: '1px solid rgba(255,255,255,.09)',
  borderRadius: 6, fontSize: 11, color: '#fff', fontFamily: 'Rajdhani, sans-serif', outline: 'none', width: '100%',
}
const labelStyle: React.CSSProperties = {
  fontSize: 9, fontWeight: 700, color: '#4F5568', fontFamily: 'Rajdhani, sans-serif',
  textTransform: 'uppercase', letterSpacing: .6, marginBottom: 4,
}

export default function AdminStorePage() {
  const [tab, setTab] = useState<Tab>('Items')

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div>
        <h1 style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 900, fontSize: 28, color: '#fff', margin: 0, textTransform: 'uppercase' }}>
          Store & Products
        </h1>
      </div>
      <div style={{ display: 'flex', gap: 0, borderBottom: '1px solid rgba(255,255,255,.06)' }}>
        {(['Items', 'Orders', 'Coupons', 'Revenue'] as Tab[]).map(t => (
          <button key={t} onClick={() => setTab(t)} style={{
            padding: '8px 16px', fontSize: 11, fontWeight: 700, fontFamily: 'Rajdhani, sans-serif',
            background: 'transparent', border: 'none', cursor: 'pointer',
            color: tab === t ? '#fff' : '#4F5568', borderBottom: tab === t ? '2px solid #e8000d' : '2px solid transparent',
          }}>{t}</button>
        ))}
      </div>
      {tab === 'Items' && <ItemsTab />}
      {tab === 'Orders' && <OrdersTab />}
      {tab === 'Coupons' && <CouponsTab />}
      {tab === 'Revenue' && <RevenueTab />}
    </div>
  )
}

function ItemsTab() {
  const [items, setItems] = useState<any[]>([])
  const [page, setPage] = useState(1)
  const [pages, setPages] = useState(1)
  const [loading, setLoading] = useState(true)
  const [createModal, setCreateModal] = useState(false)
  const [editModal, setEditModal] = useState<any>(null)
  const [form, setForm] = useState({ name: '', slug: '', category: 'credits', price: '', description: '', creditsGranted: '', premiumDays: '', isActive: true, sortOrder: '0' })

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await adminApi.getStoreItems({ page, limit: 25 })
      setItems(res.items)
      setPages(res.pages)
    } catch (err) { console.error('[Admin Store Items] load error:', err) }
    setLoading(false)
  }, [page])

  useEffect(() => { load() }, [load])

  const handleCreate = async () => {
    try {
      await adminApi.createStoreItem({
        ...form, price: Number(form.price), creditsGranted: Number(form.creditsGranted) || 0,
        premiumDays: Number(form.premiumDays) || 0, sortOrder: Number(form.sortOrder) || 0,
      })
      setCreateModal(false)
      setForm({ name: '', slug: '', category: 'credits', price: '', description: '', creditsGranted: '', premiumDays: '', isActive: true, sortOrder: '0' })
      load()
    } catch { }
  }

  const openEditModal = (item: any) => {
    setForm({
      name: item.name || '',
      slug: item.slug || '',
      category: item.category || 'credits',
      price: String(item.price || ''),
      description: item.description || '',
      creditsGranted: String(item.creditsGranted || ''),
      premiumDays: String(item.premiumDays || ''),
      isActive: item.isActive ?? true,
      sortOrder: String(item.sortOrder || '0'),
    })
    setEditModal(item)
  }

  const handleEdit = async () => {
    if (!editModal) return
    try {
      await adminApi.updateStoreItem(editModal._id, {
        ...form, price: Number(form.price), creditsGranted: Number(form.creditsGranted) || 0,
        premiumDays: Number(form.premiumDays) || 0, sortOrder: Number(form.sortOrder) || 0,
      })
      setEditModal(null)
      setForm({ name: '', slug: '', category: 'credits', price: '', description: '', creditsGranted: '', premiumDays: '', isActive: true, sortOrder: '0' })
      load()
    } catch { }
  }

  const handleDelete = async (id: string) => {
    try { await adminApi.deleteStoreItem(id); load() } catch { }
  }

  const handleToggle = async (id: string, isActive: boolean) => {
    try {
      if (isActive) { await adminApi.disableStoreItem(id) }
      else { await adminApi.updateStoreItem(id, { isActive: true }) }
      load()
    } catch { }
  }

  const columns: Column[] = [
    { key: 'name', label: 'Item', width: '2fr', render: (r: any) => <span style={{ fontWeight: 700 }}>{r.name}</span> },
    { key: 'category', label: 'Category', width: '90px' },
    { key: 'price', label: 'Price', width: '70px', render: (r: any) => `$${((r.price || 0) / 100).toFixed(2)}` },
    { key: 'creditsGranted', label: 'Credits', width: '70px' },
    { key: 'premiumDays', label: 'Prem Days', width: '70px' },
    { key: 'isActive', label: 'Active', width: '60px',
      render: (r: any) => <span style={{ color: r.isActive ? '#22c55e' : '#e8000d', fontWeight: 700, fontSize: 9 }}>{r.isActive ? 'YES' : 'NO'}</span>,
    },
    { key: 'actions', label: 'Actions', width: '140px',
      render: (r: any) => (
        <div style={{ display: 'flex', gap: 4 }}>
          <ActionBtn label="EDIT" color="#3b82f6" onClick={() => openEditModal(r)} />
          <ActionBtn label={r.isActive ? 'DISABLE' : 'ENABLE'} color={r.isActive ? '#f59e0b' : '#22c55e'} onClick={() => handleToggle(r._id, r.isActive)} />
          <ActionBtn label="DELETE" color="#e8000d" onClick={() => handleDelete(r._id)} />
        </div>
      ),
    },
  ]

  return (
    <div>
      <div style={{ marginBottom: 12 }}>
        <ActionBtn label="+ ADD ITEM" color="#22c55e" onClick={() => setCreateModal(true)} />
      </div>
      {loading ? <div style={{ fontFamily: 'Rajdhani, sans-serif', fontSize: 13, color: '#4F5568', padding: 40, textAlign: 'center' }}>Loading...</div> : (
        <DataTable columns={columns} rows={items} emptyText="No store items" page={page} totalPages={pages} onPage={setPage} />
      )}
      {createModal && (
        <Modal title="Add Store Item" onClose={() => setCreateModal(false)} width={460}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[
              ['Name', 'name', 'text'], ['Slug', 'slug', 'text'], ['Price (cents)', 'price', 'number'],
              ['Description', 'description', 'text'], ['Credits Granted', 'creditsGranted', 'number'],
              ['Premium Days', 'premiumDays', 'number'], ['Sort Order', 'sortOrder', 'number'],
            ].map(([label, key, type]) => (
              <div key={key as string}>
                <div style={labelStyle}>{label}</div>
                <input type={type as string} value={(form as any)[key as string]} onChange={e => setForm(p => ({ ...p, [key as string]: e.target.value }))} style={inputStyle} />
              </div>
            ))}
            <div>
              <div style={labelStyle}>Category</div>
              <select value={form.category} onChange={e => setForm(p => ({ ...p, category: e.target.value }))} style={inputStyle}>
                <option value="credits">Credits</option><option value="premium">Premium</option>
                <option value="apparel">Apparel</option><option value="bundle">Bundle</option>
              </select>
            </div>
            <ActionBtn label="CREATE ITEM" color="#22c55e" onClick={handleCreate} />
          </div>
        </Modal>
      )}
      {editModal && (
        <Modal title="Edit Store Item" subtitle={editModal.name} onClose={() => setEditModal(null)} width={460}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[
              ['Name', 'name', 'text'], ['Slug', 'slug', 'text'], ['Price (cents)', 'price', 'number'],
              ['Description', 'description', 'text'], ['Credits Granted', 'creditsGranted', 'number'],
              ['Premium Days', 'premiumDays', 'number'], ['Sort Order', 'sortOrder', 'number'],
            ].map(([label, key, type]) => (
              <div key={key as string}>
                <div style={labelStyle}>{label}</div>
                <input type={type as string} value={(form as any)[key as string]} onChange={e => setForm(p => ({ ...p, [key as string]: e.target.value }))} style={inputStyle} />
              </div>
            ))}
            <div>
              <div style={labelStyle}>Category</div>
              <select value={form.category} onChange={e => setForm(p => ({ ...p, category: e.target.value }))} style={inputStyle}>
                <option value="credits">Credits</option><option value="premium">Premium</option>
                <option value="apparel">Apparel</option><option value="bundle">Bundle</option>
              </select>
            </div>
            <ActionBtn label="SAVE CHANGES" color="#22c55e" onClick={handleEdit} />
          </div>
        </Modal>
      )}
    </div>
  )
}

function OrdersTab() {
  const [orders, setOrders] = useState<any[]>([])
  const [page, setPage] = useState(1)
  const [pages, setPages] = useState(1)
  const [loading, setLoading] = useState(true)
  const [status, setStatus] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const params: any = { page, limit: 25 }
      if (status) params.status = status
      const res = await adminApi.getStoreOrders(params)
      setOrders(res.orders)
      setPages(res.pages)
    } catch { }
    setLoading(false)
  }, [page, status])

  useEffect(() => { load() }, [load])

  const columns: Column[] = [
    { key: '_id', label: 'Order ID', width: '120px', render: (r: any) => <span style={{ fontWeight: 700, color: '#3b82f6', fontSize: 9 }}>{r._id?.slice(-8)}</span> },
    { key: 'total', label: 'Total', width: '70px', render: (r: any) => `$${((r.total || 0) / 100).toFixed(2)}` },
    { key: 'status', label: 'Status', width: '80px', render: (r: any) => <span style={{ fontSize: 9, fontWeight: 700, color: r.status === 'paid' || r.status === 'fulfilled' ? '#22c55e' : r.status === 'refunded' ? '#e8000d' : '#f59e0b' }}>{r.status?.toUpperCase()}</span> },
    { key: 'createdAt', label: 'Date', width: '100px', render: (r: any) => new Date(r.createdAt).toLocaleDateString() },
  ]

  return (
    <div>
      <select value={status} onChange={e => { setStatus(e.target.value); setPage(1) }} style={{ ...inputStyle, width: 'auto', marginBottom: 12 }}>
        <option value="">All Status</option>
        <option value="pending">Pending</option><option value="paid">Paid</option>
        <option value="fulfilled">Fulfilled</option><option value="refunded">Refunded</option>
      </select>
      {loading ? <div style={{ fontFamily: 'Rajdhani, sans-serif', fontSize: 13, color: '#4F5568', padding: 40, textAlign: 'center' }}>Loading...</div> : (
        <DataTable columns={columns} rows={orders} emptyText="No orders" page={page} totalPages={pages} onPage={setPage} />
      )}
    </div>
  )
}

function CouponsTab() {
  const [coupons, setCoupons] = useState<any[]>([])
  const [page, setPage] = useState(1)
  const [pages, setPages] = useState(1)
  const [loading, setLoading] = useState(true)
  const [createModal, setCreateModal] = useState(false)
  const [form, setForm] = useState({ code: '', percent: '', maxUses: '', expiresAt: '' })

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await adminApi.getCoupons({ page, limit: 25 })
      setCoupons(res.coupons)
      setPages(res.pages)
    } catch { }
    setLoading(false)
  }, [page])

  useEffect(() => { load() }, [load])

  const handleCreate = async () => {
    try {
      await adminApi.createCoupon({
        code: form.code, percent: Number(form.percent), maxUses: Number(form.maxUses) || 0,
        expiresAt: form.expiresAt || null, isActive: true,
      })
      setCreateModal(false)
      setForm({ code: '', percent: '', maxUses: '', expiresAt: '' })
      load()
    } catch { }
  }

  const handleDelete = async (id: string) => {
    try { await adminApi.deleteCoupon(id); load() } catch { }
  }

  const columns: Column[] = [
    { key: 'code', label: 'Code', width: '1fr', render: (r: any) => <span style={{ fontWeight: 700, color: '#f59e0b', letterSpacing: 1 }}>{r.code}</span> },
    { key: 'percent', label: 'Discount', width: '80px', render: (r: any) => `${r.percent}%` },
    { key: 'maxUses', label: 'Max Uses', width: '70px' },
    { key: 'timesUsed', label: 'Used', width: '60px' },
    { key: 'expiresAt', label: 'Expires', width: '100px', render: (r: any) => r.expiresAt ? new Date(r.expiresAt).toLocaleDateString() : '—' },
    { key: 'isActive', label: 'Active', width: '60px', render: (r: any) => <span style={{ color: r.isActive ? '#22c55e' : '#e8000d', fontSize: 9, fontWeight: 700 }}>{r.isActive ? 'YES' : 'NO'}</span> },
    { key: 'actions', label: '', width: '60px', render: (r: any) => <ActionBtn label="DELETE" color="#e8000d" onClick={() => handleDelete(r._id)} /> },
  ]

  return (
    <div>
      <div style={{ marginBottom: 12 }}><ActionBtn label="+ CREATE COUPON" color="#22c55e" onClick={() => setCreateModal(true)} /></div>
      {loading ? <div style={{ fontFamily: 'Rajdhani, sans-serif', fontSize: 13, color: '#4F5568', padding: 40, textAlign: 'center' }}>Loading...</div> : (
        <DataTable columns={columns} rows={coupons} emptyText="No coupons" page={page} totalPages={pages} onPage={setPage} />
      )}
      {createModal && (
        <Modal title="Create Coupon" onClose={() => setCreateModal(false)}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div><div style={labelStyle}>Code</div><input value={form.code} onChange={e => setForm(p => ({ ...p, code: e.target.value }))} style={inputStyle} placeholder="SUMMER20" /></div>
            <div><div style={labelStyle}>Discount %</div><input type="number" value={form.percent} onChange={e => setForm(p => ({ ...p, percent: e.target.value }))} style={inputStyle} placeholder="20" /></div>
            <div><div style={labelStyle}>Max Uses (0 = unlimited)</div><input type="number" value={form.maxUses} onChange={e => setForm(p => ({ ...p, maxUses: e.target.value }))} style={inputStyle} /></div>
            <div><div style={labelStyle}>Expires At</div><input type="date" value={form.expiresAt} onChange={e => setForm(p => ({ ...p, expiresAt: e.target.value }))} style={inputStyle} /></div>
            <ActionBtn label="CREATE COUPON" color="#22c55e" onClick={handleCreate} />
          </div>
        </Modal>
      )}
    </div>
  )
}

function RevenueTab() {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    adminApi.getStoreRevenue({ period: '30d' }).then(r => setData(r)).catch(() => {})
    setLoading(false)
  }, [])

  if (loading || !data) return <div style={{ fontFamily: 'Rajdhani, sans-serif', fontSize: 13, color: '#4F5568', padding: 40, textAlign: 'center' }}>Loading...</div>

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <StatCard icon="💵" label="Revenue (30d)" value={`$${((data.totalRevenue || 0) / 100).toFixed(2)}`} color="#22c55e" />

      {/* Revenue by Category */}
      {data.byCategory?.length > 0 && (
        <div style={{ background: '#13131E', border: '1px solid rgba(255,255,255,.06)', borderRadius: 10, padding: 16 }}>
          <div style={{ fontSize: 10, fontWeight: 800, fontFamily: 'Rajdhani, sans-serif', color: '#4F5568', textTransform: 'uppercase', letterSpacing: .8, marginBottom: 10 }}>Revenue by Category</div>
          {data.byCategory.map((c: any) => (
            <div key={c._id} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid rgba(255,255,255,.03)', fontFamily: 'Rajdhani, sans-serif', fontSize: 12 }}>
              <span style={{ color: '#DDE0EA', fontWeight: 700 }}>{c._id || 'Unknown'}</span>
              <span style={{ color: '#22c55e', fontWeight: 700 }}>${((c.total || 0) / 100).toFixed(2)} ({c.count} orders)</span>
            </div>
          ))}
        </div>
      )}

      {/* Recent Orders */}
      {data.recentOrders?.length > 0 && (
        <div style={{ background: '#13131E', border: '1px solid rgba(255,255,255,.06)', borderRadius: 10, padding: 16 }}>
          <div style={{ fontSize: 10, fontWeight: 800, fontFamily: 'Rajdhani, sans-serif', color: '#4F5568', textTransform: 'uppercase', letterSpacing: .8, marginBottom: 10 }}>Recent High-Value Orders</div>
          {data.recentOrders.slice(0, 5).map((o: any) => (
            <div key={o._id} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid rgba(255,255,255,.03)', fontFamily: 'Rajdhani, sans-serif', fontSize: 11 }}>
              <span style={{ color: '#8890A4' }}>{o.orderId}</span>
              <span style={{ color: '#22c55e', fontWeight: 700 }}>${((o.total || 0) / 100).toFixed(2)}</span>
              <span style={{ color: '#4F5568' }}>{new Date(o.createdAt).toLocaleDateString()}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
