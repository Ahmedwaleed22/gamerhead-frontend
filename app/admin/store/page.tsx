'use client'

import { useEffect, useState, useCallback } from 'react'
import { adminApi } from '@/lib/api'
import DataTable, { Column } from '../components/DataTable'
import ActionBtn from '../components/ActionBtn'
import Modal from '../components/Modal'
import StatCard from '../components/StatCard'

type Tab = 'Items' | 'Orders' | 'Coupons' | 'Revenue'

const CATEGORIES = [
  { value: 'Tickets', label: 'Tickets' },
  { value: 'Premium Membership', label: 'Premium Membership' },
  { value: 'Apparel', label: 'Apparel' },
  { value: 'Bundles', label: 'Bundles' },
]

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

/* ═══════════════════════════════════════════════════════════════════════════════
   ITEMS TAB
   ═══════════════════════════════════════════════════════════════════════════════ */

const defaultItemForm = { name: '', slug: '', category: 'Tickets', price: '', image: '', badge: '', creditsGranted: '', premiumDays: '', isActive: true, sortOrder: '0' }

function ItemsTab() {
  const [items, setItems] = useState<any[]>([])
  const [page, setPage] = useState(1)
  const [pages, setPages] = useState(1)
  const [loading, setLoading] = useState(true)
  const [createModal, setCreateModal] = useState(false)
  const [editModal, setEditModal] = useState<any>(null)
  const [form, setForm] = useState({ ...defaultItemForm })

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
      setForm({ ...defaultItemForm })
      load()
    } catch { }
  }

  const openEditModal = (item: any) => {
    setForm({
      name: item.name || '',
      slug: item.slug || '',
      category: item.category || 'Tickets',
      price: String(item.price || ''),
      image: item.image || '',
      badge: item.badge || '',
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
      setForm({ ...defaultItemForm })
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
    { key: 'image', label: '', width: '36px', render: (r: any) => r.image ? <img src={r.image} alt="" style={{ width: 28, height: 28, borderRadius: 4, objectFit: 'cover' }} /> : null },
    { key: 'name', label: 'Item', width: '2fr', render: (r: any) => <span style={{ fontWeight: 700 }}>{r.name}</span> },
    { key: 'category', label: 'Category', width: '120px' },
    { key: 'price', label: 'Price', width: '70px', render: (r: any) => `$${(r.price || 0).toFixed(2)}` },
    { key: 'badge', label: 'Badge', width: '80px', render: (r: any) => r.badge ? <span style={{ background: '#e8000d', color: '#fff', fontSize: 8, fontWeight: 800, padding: '2px 6px', borderRadius: 3 }}>{r.badge}</span> : '—' },
    { key: 'creditsGranted', label: 'Credits', width: '60px', render: (r: any) => r.creditsGranted || '—' },
    { key: 'premiumDays', label: 'Days', width: '50px', render: (r: any) => r.premiumDays || '—' },
    { key: 'isActive', label: 'Active', width: '50px',
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

  const renderItemForm = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div><div style={labelStyle}>Name</div><input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} style={inputStyle} /></div>
      <div><div style={labelStyle}>Slug</div><input value={form.slug} onChange={e => setForm(p => ({ ...p, slug: e.target.value }))} style={inputStyle} /></div>
      <div>
        <div style={labelStyle}>Category</div>
        <select value={form.category} onChange={e => setForm(p => ({ ...p, category: e.target.value }))} style={inputStyle}>
          {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
        </select>
      </div>
      <div><div style={labelStyle}>Price (USD)</div><input type="number" step="0.01" value={form.price} onChange={e => setForm(p => ({ ...p, price: e.target.value }))} style={inputStyle} placeholder="4.99" /></div>
      <div><div style={labelStyle}>Image Path</div><input value={form.image} onChange={e => setForm(p => ({ ...p, image: e.target.value }))} style={inputStyle} placeholder="/store/credits-5.svg" /></div>
      <div><div style={labelStyle}>Badge</div><input value={form.badge} onChange={e => setForm(p => ({ ...p, badge: e.target.value }))} style={inputStyle} placeholder="POPULAR" /></div>
      {form.category === 'Tickets' && (
        <div><div style={labelStyle}>Credits Granted</div><input type="number" value={form.creditsGranted} onChange={e => setForm(p => ({ ...p, creditsGranted: e.target.value }))} style={inputStyle} /></div>
      )}
      {form.category === 'Premium Membership' && (
        <div><div style={labelStyle}>Premium Days</div><input type="number" value={form.premiumDays} onChange={e => setForm(p => ({ ...p, premiumDays: e.target.value }))} style={inputStyle} /></div>
      )}
      <div><div style={labelStyle}>Sort Order</div><input type="number" value={form.sortOrder} onChange={e => setForm(p => ({ ...p, sortOrder: e.target.value }))} style={inputStyle} /></div>
    </div>
  )

  return (
    <div>
      <div style={{ marginBottom: 12 }}>
        <ActionBtn label="+ ADD ITEM" color="#22c55e" onClick={() => { setForm({ ...defaultItemForm }); setCreateModal(true) }} />
      </div>
      {loading ? <div style={{ fontFamily: 'Rajdhani, sans-serif', fontSize: 13, color: '#4F5568', padding: 40, textAlign: 'center' }}>Loading...</div> : (
        <DataTable columns={columns} rows={items} emptyText="No store items" page={page} totalPages={pages} onPage={setPage} />
      )}
      {createModal && (
        <Modal title="Add Store Item" onClose={() => setCreateModal(false)} width={460}>
          {renderItemForm()}
          <div style={{ marginTop: 12 }}><ActionBtn label="CREATE ITEM" color="#22c55e" onClick={handleCreate} /></div>
        </Modal>
      )}
      {editModal && (
        <Modal title="Edit Store Item" subtitle={editModal.name} onClose={() => setEditModal(null)} width={460}>
          {renderItemForm()}
          <div style={{ marginTop: 12 }}><ActionBtn label="SAVE CHANGES" color="#22c55e" onClick={handleEdit} /></div>
        </Modal>
      )}
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════════════════════
   ORDERS TAB
   ═══════════════════════════════════════════════════════════════════════════════ */

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
      setOrders(res.orders || res.items || [])
      setPages(res.pages || res.totalPages || 1)
    } catch { }
    setLoading(false)
  }, [page, status])

  useEffect(() => { load() }, [load])

  const statusColor = (s: string) => {
    if (s === 'delivered') return '#22c55e'
    if (s === 'refunded' || s === 'cancelled') return '#e8000d'
    return '#f59e0b'
  }

  const columns: Column[] = [
    { key: 'orderId', label: 'Order ID', width: '100px', render: (r: any) => <span style={{ fontWeight: 700, color: '#3b82f6', fontSize: 10 }}>{r.orderId || r._id?.slice(-8)}</span> },
    { key: 'user', label: 'User', width: '120px', render: (r: any) => <span style={{ fontWeight: 700 }}>{r.userId?.displayName || r.userId?.username || '—'}</span> },
    { key: 'items', label: 'Items', width: '1fr', render: (r: any) => {
      const list = r.items || []
      if (!list.length) return '—'
      const first = list[0]?.name || 'Item'
      return list.length > 1 ? `${first} +${list.length - 1}` : first
    }},
    { key: 'total', label: 'Total', width: '70px', render: (r: any) => `$${(r.total || 0).toFixed(2)}` },
    { key: 'paymentMethod', label: 'Payment', width: '80px', render: (r: any) => <span style={{ fontSize: 10, textTransform: 'uppercase' }}>{r.paymentMethod || '—'}</span> },
    { key: 'status', label: 'Status', width: '80px', render: (r: any) => <span style={{ fontSize: 9, fontWeight: 700, color: statusColor(r.status) }}>{r.status?.toUpperCase()}</span> },
    { key: 'createdAt', label: 'Date', width: '100px', render: (r: any) => new Date(r.createdAt).toLocaleDateString() },
  ]

  return (
    <div>
      <select value={status} onChange={e => { setStatus(e.target.value); setPage(1) }} style={{ ...inputStyle, width: 'auto', marginBottom: 12 }}>
        <option value="">All Status</option>
        <option value="pending">Pending</option>
        <option value="processing">Processing</option>
        <option value="delivered">Delivered</option>
        <option value="shipped">Shipped</option>
        <option value="refunded">Refunded</option>
        <option value="cancelled">Cancelled</option>
      </select>
      {loading ? <div style={{ fontFamily: 'Rajdhani, sans-serif', fontSize: 13, color: '#4F5568', padding: 40, textAlign: 'center' }}>Loading...</div> : (
        <DataTable columns={columns} rows={orders} emptyText="No orders" page={page} totalPages={pages} onPage={setPage} />
      )}
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════════════════════
   COUPONS TAB
   ═══════════════════════════════════════════════════════════════════════════════ */

const defaultCouponForm = { code: '', percent: '', maxUses: '', expiresAt: '', applicableTo: '' as string }

function CouponsTab() {
  const [coupons, setCoupons] = useState<any[]>([])
  const [storeItems, setStoreItems] = useState<any[]>([])
  const [page, setPage] = useState(1)
  const [pages, setPages] = useState(1)
  const [loading, setLoading] = useState(true)
  const [createModal, setCreateModal] = useState(false)
  const [editModal, setEditModal] = useState<any>(null)
  const [form, setForm] = useState({ ...defaultCouponForm })

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [couponRes, itemsRes] = await Promise.all([
        adminApi.getCoupons({ page, limit: 25 }),
        adminApi.getStoreItems({ page: 1, limit: 100 }),
      ])
      setCoupons(couponRes.coupons || couponRes.items || [])
      setPages(couponRes.pages || couponRes.totalPages || 1)
      setStoreItems(itemsRes.items || [])
    } catch { }
    setLoading(false)
  }, [page])

  useEffect(() => { load() }, [load])

  const handleCreate = async () => {
    try {
      const applicableTo = form.applicableTo ? form.applicableTo.split(',').filter(Boolean) : []
      await adminApi.createCoupon({
        code: form.code, percent: Number(form.percent), maxUses: Number(form.maxUses) || 0,
        expiresAt: form.expiresAt || null, isActive: true, applicableTo,
      })
      setCreateModal(false)
      setForm({ ...defaultCouponForm })
      load()
    } catch { }
  }

  const openEditModal = (coupon: any) => {
    setForm({
      code: coupon.code || '',
      percent: String(coupon.percent || ''),
      maxUses: String(coupon.maxUses || ''),
      expiresAt: coupon.expiresAt ? new Date(coupon.expiresAt).toISOString().split('T')[0] : '',
      applicableTo: (coupon.applicableTo || []).join(','),
    })
    setEditModal(coupon)
  }

  const handleEdit = async () => {
    if (!editModal) return
    try {
      const applicableTo = form.applicableTo ? form.applicableTo.split(',').filter(Boolean) : []
      await adminApi.updateCoupon(editModal._id, {
        code: form.code, percent: Number(form.percent), maxUses: Number(form.maxUses) || 0,
        expiresAt: form.expiresAt || null, applicableTo,
      })
      setEditModal(null)
      setForm({ ...defaultCouponForm })
      load()
    } catch { }
  }

  const handleDelete = async (id: string) => {
    try { await adminApi.deleteCoupon(id); load() } catch { }
  }

  const toggleApplicable = (itemId: string) => {
    const current = form.applicableTo ? form.applicableTo.split(',').filter(Boolean) : []
    const updated = current.includes(itemId) ? current.filter(id => id !== itemId) : [...current, itemId]
    setForm(p => ({ ...p, applicableTo: updated.join(',') }))
  }

  const columns: Column[] = [
    { key: 'code', label: 'Code', width: '1fr', render: (r: any) => <span style={{ fontWeight: 700, color: '#f59e0b', letterSpacing: 1 }}>{r.code}</span> },
    { key: 'percent', label: 'Discount', width: '80px', render: (r: any) => `${r.percent}%` },
    { key: 'maxUses', label: 'Max Uses', width: '70px', render: (r: any) => r.maxUses || '∞' },
    { key: 'timesUsed', label: 'Used', width: '50px' },
    { key: 'applicableTo', label: 'Applies To', width: '100px', render: (r: any) => {
      const list = r.applicableTo || []
      if (!list.length) return <span style={{ color: '#22c55e', fontSize: 9, fontWeight: 700 }}>ALL</span>
      return <span style={{ fontSize: 9 }}>{list.length} item{list.length > 1 ? 's' : ''}</span>
    }},
    { key: 'expiresAt', label: 'Expires', width: '90px', render: (r: any) => r.expiresAt ? new Date(r.expiresAt).toLocaleDateString() : '—' },
    { key: 'isActive', label: 'Active', width: '50px', render: (r: any) => <span style={{ color: r.isActive ? '#22c55e' : '#e8000d', fontSize: 9, fontWeight: 700 }}>{r.isActive ? 'YES' : 'NO'}</span> },
    { key: 'actions', label: '', width: '100px', render: (r: any) => (
      <div style={{ display: 'flex', gap: 4 }}>
        <ActionBtn label="EDIT" color="#3b82f6" onClick={() => openEditModal(r)} />
        <ActionBtn label="DELETE" color="#e8000d" onClick={() => handleDelete(r._id)} />
      </div>
    )},
  ]

  const renderCouponForm = () => {
    const selectedIds = form.applicableTo ? form.applicableTo.split(',').filter(Boolean) : []
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <div><div style={labelStyle}>Code</div><input value={form.code} onChange={e => setForm(p => ({ ...p, code: e.target.value }))} style={inputStyle} placeholder="SUMMER20" /></div>
        <div><div style={labelStyle}>Discount %</div><input type="number" value={form.percent} onChange={e => setForm(p => ({ ...p, percent: e.target.value }))} style={inputStyle} placeholder="20" /></div>
        <div><div style={labelStyle}>Max Uses (0 = unlimited)</div><input type="number" value={form.maxUses} onChange={e => setForm(p => ({ ...p, maxUses: e.target.value }))} style={inputStyle} /></div>
        <div><div style={labelStyle}>Expires At</div><input type="date" value={form.expiresAt} onChange={e => setForm(p => ({ ...p, expiresAt: e.target.value }))} style={inputStyle} /></div>
        <div>
          <div style={labelStyle}>Applies To</div>
          <div style={{ background: '#0d0d14', border: '1px solid rgba(255,255,255,.09)', borderRadius: 6, padding: 8, maxHeight: 160, overflowY: 'auto' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '4px 0', cursor: 'pointer', fontSize: 11, fontFamily: 'Rajdhani, sans-serif', color: selectedIds.length === 0 ? '#22c55e' : '#8890A4', fontWeight: 700 }}>
              <input type="checkbox" checked={selectedIds.length === 0} onChange={() => setForm(p => ({ ...p, applicableTo: '' }))} />
              All Products
            </label>
            {storeItems.map((item: any) => (
              <label key={item._id} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '4px 0', cursor: 'pointer', fontSize: 11, fontFamily: 'Rajdhani, sans-serif', color: '#DDE0EA' }}>
                <input type="checkbox" checked={selectedIds.includes(item._id)} onChange={() => toggleApplicable(item._id)} />
                {item.name} <span style={{ color: '#4F5568', fontSize: 9 }}>({item.category})</span>
              </label>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div>
      <div style={{ marginBottom: 12 }}><ActionBtn label="+ CREATE COUPON" color="#22c55e" onClick={() => { setForm({ ...defaultCouponForm }); setCreateModal(true) }} /></div>
      {loading ? <div style={{ fontFamily: 'Rajdhani, sans-serif', fontSize: 13, color: '#4F5568', padding: 40, textAlign: 'center' }}>Loading...</div> : (
        <DataTable columns={columns} rows={coupons} emptyText="No coupons" page={page} totalPages={pages} onPage={setPage} />
      )}
      {createModal && (
        <Modal title="Create Coupon" onClose={() => setCreateModal(false)} width={460}>
          {renderCouponForm()}
          <div style={{ marginTop: 12 }}><ActionBtn label="CREATE COUPON" color="#22c55e" onClick={handleCreate} /></div>
        </Modal>
      )}
      {editModal && (
        <Modal title="Edit Coupon" subtitle={editModal.code} onClose={() => setEditModal(null)} width={460}>
          {renderCouponForm()}
          <div style={{ marginTop: 12 }}><ActionBtn label="SAVE CHANGES" color="#22c55e" onClick={handleEdit} /></div>
        </Modal>
      )}
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════════════════════
   REVENUE TAB
   ═══════════════════════════════════════════════════════════════════════════════ */

function RevenueTab() {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    adminApi.getStoreRevenue({ period: '30d' }).then(r => { setData(r); setLoading(false) }).catch(() => setLoading(false))
  }, [])

  if (loading || !data) return <div style={{ fontFamily: 'Rajdhani, sans-serif', fontSize: 13, color: '#4F5568', padding: 40, textAlign: 'center' }}>Loading...</div>

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <StatCard icon="💵" label="Revenue (30d)" value={`$${(data.totalRevenue || 0).toFixed(2)}`} color="#22c55e" />

      {data.byCategory?.length > 0 && (
        <div style={{ background: '#13131E', border: '1px solid rgba(255,255,255,.06)', borderRadius: 10, padding: 16 }}>
          <div style={{ fontSize: 10, fontWeight: 800, fontFamily: 'Rajdhani, sans-serif', color: '#4F5568', textTransform: 'uppercase', letterSpacing: .8, marginBottom: 10 }}>Revenue by Category</div>
          {data.byCategory.map((c: any) => (
            <div key={c._id} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid rgba(255,255,255,.03)', fontFamily: 'Rajdhani, sans-serif', fontSize: 12 }}>
              <span style={{ color: '#DDE0EA', fontWeight: 700 }}>{c._id || 'Unknown'}</span>
              <span style={{ color: '#22c55e', fontWeight: 700 }}>${(c.total || 0).toFixed(2)} ({c.count} orders)</span>
            </div>
          ))}
        </div>
      )}

      {data.recentOrders?.length > 0 && (
        <div style={{ background: '#13131E', border: '1px solid rgba(255,255,255,.06)', borderRadius: 10, padding: 16 }}>
          <div style={{ fontSize: 10, fontWeight: 800, fontFamily: 'Rajdhani, sans-serif', color: '#4F5568', textTransform: 'uppercase', letterSpacing: .8, marginBottom: 10 }}>Recent High-Value Orders</div>
          {data.recentOrders.slice(0, 5).map((o: any) => (
            <div key={o._id} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid rgba(255,255,255,.03)', fontFamily: 'Rajdhani, sans-serif', fontSize: 11 }}>
              <span style={{ color: '#8890A4' }}>{o.orderId}</span>
              <span style={{ color: '#22c55e', fontWeight: 700 }}>${(o.total || 0).toFixed(2)}</span>
              <span style={{ color: '#4F5568' }}>{new Date(o.createdAt).toLocaleDateString()}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
