'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useAuth } from '@/lib/auth-context'
import { storeApi } from '@/lib/api'
import DashSidebar from '@/app/components/DashSidebar'

const R: React.CSSProperties = { fontFamily: 'Roboto, sans-serif' }
const STATUS_COLOR: Record<string,string> = { Delivered:'#4ade80', Processing:'#F39C12', Cancelled:'#E74C3C', Refunded:'#9CA3AF', Shipped:'#3498DB', completed:'#4ade80', pending:'#F39C12', cancelled:'#E74C3C', refunded:'#9CA3AF' }

export default function OrdersPage() {
  const { user } = useAuth()
  const [orders, setOrders]           = useState<any[]>([])
  const [stats, setStats]             = useState<any>(null)
  const [filterStatus, setFilterStatus] = useState('All')
  const [search, setSearch]           = useState('')

  useEffect(() => {
    storeApi.getOrders().then((res: any) => setOrders(Array.isArray(res) ? res : res.orders || [])).catch(() => {})
    storeApi.getOrderStats().then(setStats).catch(() => {})
  }, [])

  if (!user) return null

  const filtered = orders.filter((o: any) => {
    const status = (o.status || '').charAt(0).toUpperCase() + (o.status || '').slice(1)
    if (filterStatus !== 'All' && status !== filterStatus) return false
    if (search.trim()) {
      const q = search.toLowerCase()
      const itemName = (o.itemName || o.item || '').toLowerCase()
      const orderId = (o.orderId || o._id || '').toLowerCase()
      if (!itemName.includes(q) && !orderId.includes(q)) return false
    }
    return true
  })

  const totalSpent = stats?.totalSpent != null ? `$${(stats.totalSpent / 100).toFixed(2)}` : `$${orders.filter(o => o.status !== 'refunded').reduce((acc: number, o: any) => acc + (o.amount || o.price || 0), 0).toFixed(2)}`

  return (
    <div style={{ background:'#0C0C11', minHeight:'100vh', paddingBottom:80 }}>
      <div className="container" style={{ maxWidth:1440, padding:'0 30px' }}>
        <div style={{ display:'grid', gridTemplateColumns:'220px 1fr', gap:20, paddingTop:28, alignItems:'start' }}>
          <DashSidebar active="orders" />
          <div>
            {/* Header */}
            <div style={{ marginBottom:24 }}>
              <h1 style={{ fontFamily:"'Barlow Condensed',sans-serif", fontWeight:900, fontSize:32, color:'#fff', margin:0 }}>My Orders</h1>
              <div style={{ ...R, fontSize:13, color:'#9CA3AF', marginTop:6 }}>Your store purchase history and order status</div>
            </div>

            {/* Stats */}
            <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:16, marginBottom:24 }}>
              {[
                { label:'Total Orders',    value: stats?.totalOrders ?? orders.length,    color:'#fff'     },
                { label:'Delivered',       value: stats?.delivered ?? orders.filter((o: any) => o.status === 'completed' || o.status === 'Delivered').length,   color:'#4ade80' },
                { label:'Processing',      value: stats?.processing ?? orders.filter((o: any) => o.status === 'pending' || o.status === 'Processing').length,  color:'#F39C12' },
                { label:'Total Spent',     value: totalSpent, color:'#E74C3C' },
              ].map((s,i) => (
                <div key={i} style={{ background:'#18181C', borderRadius:12, padding:'18px 22px', border:`1px solid ${s.color}18` }}>
                  <div style={{ ...R, fontSize:12, color:'#9CA3AF', marginBottom:6 }}>{s.label}</div>
                  <div style={{ fontFamily:"'Barlow Condensed',sans-serif", fontWeight:900, fontSize:30, color:s.color, lineHeight:1 }}>{s.value}</div>
                </div>
              ))}
            </div>

            {/* Order table */}
            <div style={{ background:'#18181C', borderRadius:12, overflow:'hidden' }}>
              {/* Filters */}
              <div style={{ padding:'20px 24px', borderBottom:'1px solid #25252C', display:'flex', alignItems:'center', gap:14, flexWrap:'wrap' }}>
                <div style={{ ...R, fontWeight:700, fontSize:15, color:'#fff', marginRight:8 }}>Order History</div>
                <input
                  style={{ background:'#0C0C11', border:'1px solid rgba(255,255,255,0.1)', borderRadius:8, padding:'8px 14px', ...R, fontSize:12, color:'#fff', outline:'none', width:220 }}
                  placeholder="Search orders or order ID..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                />
                <div style={{ display:'flex', gap:8, marginLeft:'auto' }}>
                  {['All','Delivered','Processing','Shipped','Refunded','Cancelled'].map(f => (
                    <button key={f} onClick={() => setFilterStatus(f)} style={{ padding:'7px 14px', background:filterStatus===f?'#B22D2D':'#202023', border:`1px solid ${filterStatus===f?'#B22D2D':'rgba(255,255,255,0.08)'}`, borderRadius:8, ...R, fontWeight:600, fontSize:11, color:filterStatus===f?'#fff':'#9CA3AF', cursor:'pointer' }}>{f}</button>
                  ))}
                </div>
              </div>

              {/* Table header */}
              <div style={{ display:'grid', gridTemplateColumns:'50px 1fr 100px 90px 110px 130px 80px', background:'#0C0C11', padding:'12px 24px', gap:12 }}>
                {['','Item','Type','Qty','Price','Status','Date'].map((h,i) => (
                  <span key={i} style={{ ...R, fontWeight:700, fontSize:11, color:'#6B7280', letterSpacing:0.8, textTransform:'uppercase' }}>{h}</span>
                ))}
              </div>

              {/* Rows */}
              {filtered.length === 0 ? (
                <div style={{ padding:'48px 24px', textAlign:'center', ...R, fontSize:13, color:'#4A5568' }}>No orders match your search.</div>
              ) : (
                filtered.map((o: any) => {
                  const status = (o.status || 'pending').charAt(0).toUpperCase() + (o.status || 'pending').slice(1)
                  const statusColor = STATUS_COLOR[status] || STATUS_COLOR[o.status] || '#4A5568'
                  return (
                    <div key={o._id || o.orderId} style={{ display:'grid', gridTemplateColumns:'50px 1fr 100px 90px 110px 130px 80px', padding:'16px 24px', borderTop:'1px solid #25252C', alignItems:'center', gap:12 }}>
                      <div style={{ width:38, height:38, background:'#25252C', borderRadius:8, display:'flex', alignItems:'center', justifyContent:'center', fontSize:18 }}>{o.emoji || o.img || '📦'}</div>
                      <div>
                        <div style={{ ...R, fontWeight:700, fontSize:14, color:'#fff' }}>{o.itemName || o.item || 'Item'}</div>
                        <div style={{ ...R, fontSize:11, color:'#4A5568', marginTop:2 }}>{o.orderId || o._id}</div>
                      </div>
                      <span style={{ background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:6, padding:'4px 10px', ...R, fontWeight:600, fontSize:11, color:'#9CA3AF', width:'fit-content' }}>{o.type || o.category || '—'}</span>
                      <div style={{ ...R, fontSize:13, color:'#9CA3AF' }}>x{o.quantity || o.qty || 1}</div>
                      <div style={{ ...R, fontWeight:700, fontSize:15, color:'#fff' }}>${((o.amount || o.price || 0) / 100).toFixed(2)}</div>
                      <div>
                        <span style={{ background:statusColor+'18', border:`1px solid ${statusColor}44`, borderRadius:6, padding:'5px 12px', ...R, fontWeight:700, fontSize:11, color:statusColor }}>{status}</span>
                      </div>
                      <div style={{ ...R, fontSize:12, color:'#6B7280' }}>{o.createdAt ? new Date(o.createdAt).toLocaleDateString('en-US') : o.date || '—'}</div>
                    </div>
                  )
                })
              )}

              {/* Footer */}
              <div style={{ padding:'16px 24px', borderTop:'1px solid #25252C', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                <div style={{ ...R, fontSize:12, color:'#4A5568' }}>Showing {filtered.length} of {orders.length} orders</div>
                <Link href="/store" style={{ background:'#B22D2D', borderRadius:8, padding:'9px 22px', textDecoration:'none', ...R, fontWeight:700, fontSize:12, color:'#fff' }}>
                  Visit Store →
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
