'use client'

import { useEffect, useState, useCallback } from 'react'
import { adminApi } from '@/lib/api'
import DataTable, { Column } from '../components/DataTable'
import SearchFilter from '../components/SearchFilter'
import ActionBtn from '../components/ActionBtn'

type Tab = 'Coaches' | 'Orders' | 'Reviews'

const STATUS_COLORS: Record<string, string> = {
  PENDING: '#f59e0b', ACTIVE: '#3b82f6', REVISION: '#a855f7', COMPLETED: '#22c55e', CANCELLED: '#e8000d',
}

export default function AdminCoachingPage() {
  const [tab, setTab] = useState<Tab>('Coaches')

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div>
        <h1 style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 900, fontSize: 28, color: '#fff', margin: 0, textTransform: 'uppercase' }}>
          Coaching
        </h1>
        <p style={{ fontFamily: 'Rajdhani, sans-serif', fontSize: 12, color: '#4F5568', margin: '4px 0 0' }}>
          Manage coaches, orders, and reviews
        </p>
      </div>

      <div style={{ display: 'flex', gap: 0, borderBottom: '1px solid rgba(255,255,255,.06)' }}>
        {(['Coaches', 'Orders', 'Reviews'] as Tab[]).map(t => (
          <button key={t} onClick={() => setTab(t)} style={{
            padding: '8px 16px', fontSize: 11, fontWeight: 700, fontFamily: 'Rajdhani, sans-serif',
            background: 'transparent', border: 'none', cursor: 'pointer',
            color: tab === t ? '#fff' : '#4F5568',
            borderBottom: tab === t ? '2px solid #e8000d' : '2px solid transparent',
            transition: 'all .15s',
          }}>
            {t}
          </button>
        ))}
      </div>

      {tab === 'Coaches' && <CoachesTab />}
      {tab === 'Orders' && <OrdersTab />}
      {tab === 'Reviews' && <ReviewsTab />}
    </div>
  )
}

function CoachesTab() {
  const [coaches, setCoaches] = useState<any[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [pages, setPages] = useState(1)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [active, setActive] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const params: any = { page, limit: 25 }
      if (search) params.q = search
      if (active) params.isActive = active
      const res = await adminApi.getCoaches(params)
      setCoaches(res.coaches)
      setTotal(res.total)
      setPages(res.pages)
    } catch (err) { console.error('[Admin Coaches] load error:', err) }
    setLoading(false)
  }, [page, search, active])

  useEffect(() => { load() }, [load])

  const [searchInput, setSearchInput] = useState('')
  useEffect(() => {
    const t = setTimeout(() => { setSearch(searchInput); setPage(1) }, 400)
    return () => clearTimeout(t)
  }, [searchInput])

  const handleVerify = async (id: string) => {
    try { await adminApi.verifyCoach(id); load() } catch { }
  }
  const handleUnverify = async (id: string) => {
    try { await adminApi.unverifyCoach(id); load() } catch { }
  }
  const handleSuspend = async (id: string) => {
    try { await adminApi.suspendCoach(id); load() } catch { }
  }

  const columns: Column[] = [
    { key: 'displayName', label: 'Coach', width: '2fr',
      render: (row: any) => (
        <div>
          <span style={{ fontWeight: 700 }}>{row.emoji} {row.displayName}</span>
          {row.isVerified && <span style={{ marginLeft: 6, fontSize: 8, color: '#22c55e' }}>✓ VERIFIED</span>}
        </div>
      ),
    },
    { key: 'game', label: 'Game', width: '100px' },
    { key: 'totalOrders', label: 'Orders', width: '70px' },
    { key: 'completedOrders', label: 'Done', width: '60px' },
    { key: 'rating', label: 'Rating', width: '70px',
      render: (row: any) => row.reviewCount > 0 ? (row.ratingSum / row.reviewCount).toFixed(1) : '—',
    },
    { key: 'totalEarned', label: 'Earned', width: '80px',
      render: (row: any) => `$${((row.totalEarned || 0) / 100).toFixed(2)}`,
    },
    { key: 'isActive', label: 'Status', width: '70px',
      render: (row: any) => <span style={{ fontSize: 9, fontWeight: 700, color: row.isActive ? '#22c55e' : '#e8000d' }}>{row.isActive ? 'ACTIVE' : 'SUSPENDED'}</span>,
    },
    { key: 'actions', label: 'Actions', width: '140px',
      render: (row: any) => (
        <div style={{ display: 'flex', gap: 4 }}>
          {row.isVerified
            ? <ActionBtn label="UNVERIFY" color="#f59e0b" onClick={() => handleUnverify(row._id)} />
            : <ActionBtn label="VERIFY" color="#22c55e" onClick={() => handleVerify(row._id)} />
          }
          {row.isActive ? (
            <ActionBtn label="SUSPEND" color="#e8000d" onClick={() => handleSuspend(row._id)} />
          ) : (
            <ActionBtn label="REACTIVATE" color="#22c55e" onClick={() => handleVerify(row._id)} />
          )}
        </div>
      ),
    },
  ]

  return (
    <div>
      <SearchFilter
        search={searchInput} onSearch={setSearchInput} searchPlaceholder="Search coaches..."
        filters={[{
          value: active, onChange: v => { setActive(v); setPage(1) }, placeholder: 'All Status',
          options: [{ value: 'true', label: 'Active' }, { value: 'false', label: 'Suspended' }],
        }]}
      />
      {loading ? (
        <div style={{ fontFamily: 'Rajdhani, sans-serif', fontSize: 13, color: '#4F5568', padding: 40, textAlign: 'center' }}>Loading...</div>
      ) : (
        <DataTable columns={columns} rows={coaches} emptyText="No coaches found" page={page} totalPages={pages} onPage={setPage} />
      )}
    </div>
  )
}

function OrdersTab() {
  const [orders, setOrders] = useState<any[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [pages, setPages] = useState(1)
  const [loading, setLoading] = useState(true)
  const [status, setStatus] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const params: any = { page, limit: 25 }
      if (status) params.status = status
      const res = await adminApi.getCoachingOrders(params)
      setOrders(res.orders)
      setTotal(res.total)
      setPages(res.pages)
    } catch { }
    setLoading(false)
  }, [page, status])

  useEffect(() => { load() }, [load])

  const handleUpdateStatus = async (id: string, newStatus: string) => {
    try { await adminApi.updateCoachingOrder(id, { status: newStatus }); load() } catch { }
  }

  const columns: Column[] = [
    { key: 'orderId', label: 'Order', width: '80px', render: (row: any) => <span style={{ fontWeight: 700, color: '#3b82f6' }}>{row.orderId}</span> },
    { key: 'coachName', label: 'Coach', width: '1fr' },
    { key: 'buyerName', label: 'Buyer', width: '1fr' },
    { key: 'packageTitle', label: 'Package', width: '1fr' },
    { key: 'price', label: 'Price', width: '70px', render: (row: any) => `$${((row.price || 0) / 100).toFixed(2)}` },
    { key: 'status', label: 'Status', width: '90px',
      render: (row: any) => (
        <span style={{ padding: '2px 6px', fontSize: 8, fontWeight: 800, fontFamily: 'Rajdhani, sans-serif', border: `1px solid ${STATUS_COLORS[row.status] || '#4F5568'}44`, borderRadius: 3, color: STATUS_COLORS[row.status] || '#4F5568', textTransform: 'uppercase' }}>
          {row.status}
        </span>
      ),
    },
    { key: 'actions', label: 'Actions', width: '140px',
      render: (row: any) => (
        <div style={{ display: 'flex', gap: 4 }}>
          {row.status !== 'COMPLETED' && row.status !== 'CANCELLED' && (
            <>
              <ActionBtn label="COMPLETE" color="#22c55e" onClick={() => handleUpdateStatus(row._id, 'COMPLETED')} />
              <ActionBtn label="CANCEL" color="#e8000d" onClick={() => handleUpdateStatus(row._id, 'CANCELLED')} />
            </>
          )}
        </div>
      ),
    },
  ]

  return (
    <div>
      <SearchFilter
        filters={[{
          value: status, onChange: v => { setStatus(v); setPage(1) }, placeholder: 'All Status',
          options: [
            { value: 'PENDING', label: 'Pending' }, { value: 'ACTIVE', label: 'Active' },
            { value: 'REVISION', label: 'Revision' }, { value: 'COMPLETED', label: 'Completed' },
            { value: 'CANCELLED', label: 'Cancelled' },
          ],
        }]}
      />
      {loading ? (
        <div style={{ fontFamily: 'Rajdhani, sans-serif', fontSize: 13, color: '#4F5568', padding: 40, textAlign: 'center' }}>Loading...</div>
      ) : (
        <DataTable columns={columns} rows={orders} emptyText="No orders found" page={page} totalPages={pages} onPage={setPage} />
      )}
    </div>
  )
}

function ReviewsTab() {
  const [reviews, setReviews] = useState<any[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [pages, setPages] = useState(1)
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await adminApi.getCoachingReviews({ page, limit: 25 })
      setReviews(res.reviews)
      setTotal(res.total)
      setPages(res.pages)
    } catch { }
    setLoading(false)
  }, [page])

  useEffect(() => { load() }, [load])

  const handleDelete = async (id: string) => {
    try { await adminApi.deleteCoachingReview(id); load() } catch { }
  }

  const columns: Column[] = [
    { key: 'buyerName', label: 'Reviewer', width: '1fr' },
    { key: 'packageTitle', label: 'Package', width: '1fr' },
    { key: 'rating', label: 'Rating', width: '60px',
      render: (row: any) => <span style={{ color: '#f59e0b', fontWeight: 700 }}>{'★'.repeat(row.rating)}{'☆'.repeat(5 - row.rating)}</span>,
    },
    { key: 'text', label: 'Review', width: '2fr',
      render: (row: any) => <span style={{ color: '#8890A4', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'block' }}>{row.text || '—'}</span>,
    },
    { key: 'helpfulCount', label: 'Helpful', width: '60px' },
    { key: 'actions', label: '', width: '60px',
      render: (row: any) => <ActionBtn label="DELETE" color="#e8000d" onClick={() => handleDelete(row._id)} />,
    },
  ]

  return (
    <div>
      {loading ? (
        <div style={{ fontFamily: 'Rajdhani, sans-serif', fontSize: 13, color: '#4F5568', padding: 40, textAlign: 'center' }}>Loading...</div>
      ) : (
        <DataTable columns={columns} rows={reviews} emptyText="No reviews found" page={page} totalPages={pages} onPage={setPage} />
      )}
    </div>
  )
}
