'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useAuth } from '@/lib/auth-context'
import { storeApi, coachingApi } from '@/lib/api'
import DashSidebar from '@/app/components/DashSidebar'
import { Icon } from '@iconify/react'
import { Solar } from '@/lib/solar-duotone'

const R: React.CSSProperties = { fontFamily: 'Roboto, sans-serif' }
const STATUS_COLOR: Record<string,string> = { Delivered:'#4ade80', Processing:'#F39C12', Cancelled:'#E74C3C', Refunded:'#9CA3AF', Shipped:'#3498DB', completed:'#4ade80', pending:'#F39C12', cancelled:'#E74C3C', refunded:'#9CA3AF', active:'#4ade80', delivered:'#A78BFA', revision:'#60A5FA' }

export default function OrdersPage() {
  const { user } = useAuth()
  const [orders, setOrders]           = useState<any[]>([])
  const [stats, setStats]             = useState<any>(null)
  const [filterStatus, setFilterStatus] = useState('All')
  const [search, setSearch]           = useState('')
  const [mainTab, setMainTab]         = useState<'store'|'coaching'>('store')
  const [coachingOrders, setCoachingOrders] = useState<any[]>([])
  const [coachingAction, setCoachingAction] = useState('')
  const [coachingFetchKey, setCoachingFetchKey] = useState(0)
  const [reviewingOrder, setReviewingOrder] = useState<string|null>(null)
  const [reviewRating, setReviewRating]     = useState(0)
  const [hoverRating, setHoverRating]       = useState(0)
  const [reviewText, setReviewText]         = useState('')
  const [reviewSubmitting, setReviewSubmitting] = useState(false)

  useEffect(() => {
    storeApi.getOrders().then((res: any) => setOrders(Array.isArray(res) ? res : res.items || res.orders || [])).catch(() => {})
    storeApi.getOrderStats().then(setStats).catch(() => {})
  }, [])

  useEffect(() => {
    coachingApi.getMyOrders().then((res: any) => setCoachingOrders(Array.isArray(res) ? res : res.orders || [])).catch(() => {})
  }, [coachingFetchKey])

  if (!user) return null

  const filtered = orders.filter((o: any) => {
    const status = (o.status || '').charAt(0).toUpperCase() + (o.status || '').slice(1)
    if (filterStatus !== 'All' && status !== filterStatus) return false
    if (search.trim()) {
      const q = search.toLowerCase()
      const itemNames = (o.items || []).map((i: any) => (i.name || '').toLowerCase()).join(' ')
      const orderId = (o.orderId || o._id || '').toLowerCase()
      if (!itemNames.includes(q) && !orderId.includes(q)) return false
    }
    return true
  })

  const totalSpent = stats?.totalSpentDisplay || (stats?.totalSpent != null ? `$${stats.totalSpent.toFixed(2)}` : `$${orders.filter(o => o.status !== 'refunded').reduce((acc: number, o: any) => acc + (o.total || 0), 0).toFixed(2)}`)

  return (
    <div style={{ background:'var(--bg)', minHeight:'100vh', paddingBottom:80 }}>
      <div className="container" style={{ maxWidth:1440, padding:'0 30px' }}>
        <div style={{ display:'grid', gridTemplateColumns:'220px 1fr', gap:20, paddingTop:28, alignItems:'start' }}>
          <DashSidebar active="orders" />
          <div>
            {/* Header */}
            <div style={{ marginBottom:24 }}>
              <h1 style={{ fontFamily:"'Barlow Condensed',sans-serif", fontWeight:900, fontSize:32, color:'#fff', margin:0 }}>My Orders</h1>
              <div style={{ ...R, fontSize:13, color:'#9CA3AF', marginTop:6 }}>Your purchase history and coaching orders</div>
            </div>

            {/* Tab switcher */}
            <div style={{ display:'flex', gap:4, borderBottom:'1px solid rgba(255,255,255,.07)', marginBottom:24 }}>
              {([
                { key:'store' as const,    label:'Store Orders',    count:orders.length },
                { key:'coaching' as const, label:'Coaching Orders', count:coachingOrders.length },
              ]).map(t=>(
                <button key={t.key} onClick={()=>setMainTab(t.key)} style={{
                  background:'none', border:'none', borderBottom:`2px solid ${mainTab===t.key?'#B22D2D':'transparent'}`,
                  padding:'8px 18px', fontFamily:"'Barlow Condensed',sans-serif", fontWeight:800, fontSize:14,
                  letterSpacing:.6, color:mainTab===t.key?'#fff':'rgba(255,255,255,.35)',
                  cursor:'pointer', display:'flex', alignItems:'center', gap:7, marginBottom:-1,
                }}>
                  {t.label}
                  <span style={{ background:mainTab===t.key?'rgba(178,45,45,.25)':'rgba(255,255,255,.08)', borderRadius:10, padding:'1px 7px', fontSize:11, fontWeight:700, color:mainTab===t.key?'#ff8080':'rgba(255,255,255,.3)', fontFamily:'Roboto, sans-serif' }}>{t.count}</span>
                </button>
              ))}
            </div>

            {/* ── STORE ORDERS TAB ── */}
            {mainTab==='store'&&(<>
              {/* Stats */}
              <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:16, marginBottom:24 }}>
                {[
                  { label:'Total Orders',    value: stats?.total ?? orders.length,    color:'#fff'     },
                  { label:'Delivered',       value: stats?.delivered ?? orders.filter((o: any) => o.status === 'delivered').length,   color:'#4ade80' },
                  { label:'Processing',      value: stats?.processing ?? orders.filter((o: any) => o.status === 'pending').length,  color:'#F39C12' },
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
                    style={{ background:'#18181C', border:'1px solid rgba(255,255,255,0.1)', borderRadius:8, padding:'8px 14px', ...R, fontSize:12, color:'#fff', outline:'none', width:220 }}
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
                <div style={{ display:'grid', gridTemplateColumns:'50px 1fr 100px 90px 110px 130px 80px', background:'transparent', padding:'12px 24px', gap:12 }}>
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
                    const firstItem = o.items?.[0]
                    const itemName = o.items?.length > 1 ? `${firstItem?.name} +${o.items.length - 1} more` : firstItem?.name || 'Item'
                    const category = firstItem?.category || '—'
                    const totalQty = o.items?.reduce((s: number, i: any) => s + (i.qty || 1), 0) || 1
                    return (
                      <div key={o._id || o.orderId} style={{ display:'grid', gridTemplateColumns:'50px 1fr 100px 90px 110px 130px 80px', padding:'16px 24px', borderTop:'1px solid #25252C', alignItems:'center', gap:12 }}>
                        <div style={{ width:38, height:38, background:'#25252C', borderRadius:8, display:'flex', alignItems:'center', justifyContent:'center' }}><Icon icon={Solar.package} width={22} height={22} /></div>
                        <div>
                          <div style={{ ...R, fontWeight:700, fontSize:14, color:'#fff' }}>{itemName}</div>
                          <div style={{ ...R, fontSize:11, color:'#4A5568', marginTop:2 }}>{o.orderId || o._id}</div>
                        </div>
                        <span style={{ background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:6, padding:'4px 10px', ...R, fontWeight:600, fontSize:11, color:'#9CA3AF', width:'fit-content' }}>{category}</span>
                        <div style={{ ...R, fontSize:13, color:'#9CA3AF' }}>x{totalQty}</div>
                        <div style={{ ...R, fontWeight:700, fontSize:15, color:'#fff' }}>${(o.total || 0).toFixed(2)}</div>
                        <div>
                          <span style={{ background:statusColor+'18', border:`1px solid ${statusColor}44`, borderRadius:6, padding:'5px 12px', ...R, fontWeight:700, fontSize:11, color:statusColor }}>{status}</span>
                        </div>
                        <div style={{ ...R, fontSize:12, color:'#6B7280' }}>{o.createdAt ? new Date(o.createdAt).toLocaleDateString('en-US') : '—'}</div>
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
            </>)}

            {/* ── COACHING ORDERS TAB ── */}
            {mainTab==='coaching'&&(
              <div>
                {coachingOrders.length === 0 ? (
                  <div style={{ background:'#18181C', borderRadius:12, padding:'48px 24px', textAlign:'center' }}>
                    <div style={{ marginBottom:12, display:'flex', justifyContent:'center' }}><Icon icon={Solar.diploma} width={40} height={40} /></div>
                    <div style={{ fontFamily:"'Barlow Condensed',sans-serif", fontWeight:900, fontSize:20, color:'#fff', marginBottom:6 }}>No Coaching Orders Yet</div>
                    <div style={{ ...R, fontSize:13, color:'#9CA3AF', marginBottom:20 }}>Browse our coaches and book your first session</div>
                    <Link href="/coaching" style={{ background:'#B22D2D', borderRadius:8, padding:'10px 24px', textDecoration:'none', ...R, fontWeight:700, fontSize:12, color:'#fff' }}>Browse Coaches →</Link>
                  </div>
                ) : (
                  <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                    {coachingOrders.map((o: any) => {
                      const status = o.status || 'pending'
                      const statusColor = STATUS_COLOR[status] || '#4A5568'
                      const statusLabel = status.charAt(0).toUpperCase() + status.slice(1)
                      return (
                        <div key={o._id || o.orderId} style={{ background:'#18181C', border:'1px solid rgba(255,255,255,.07)', borderRadius:10, padding:'16px 20px' }}>
                          <div style={{ display:'flex', alignItems:'center', gap:14 }}>
                            <div style={{ width:40, height:40, borderRadius:8, background:'rgba(255,255,255,.06)', border:'1px solid rgba(255,255,255,.1)', display:'flex', alignItems:'center', justifyContent:'center' }}><Icon icon={Solar.diploma} width={22} height={22} /></div>
                            <div style={{ flex:1, minWidth:0 }}>
                              <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:4, flexWrap:'wrap' }}>
                                <span style={{ fontFamily:"'Barlow Condensed',sans-serif", fontWeight:900, fontSize:16, color:'#fff' }}>{o.packageTitle || 'Coaching Session'}</span>
                                <span style={{ background:statusColor+'18', border:`1px solid ${statusColor}44`, borderRadius:6, padding:'3px 10px', ...R, fontWeight:700, fontSize:10, color:statusColor }}>{statusLabel}</span>
                              </div>
                              <div style={{ ...R, fontSize:12, color:'#9CA3AF' }}>
                                Coach: {o.coachName || '—'} · {o.orderId || o._id}
                                {o.scheduledAt && (
                                  <> · <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, verticalAlign: 'middle' }}>
                                    <Icon icon={Solar.calendar} width={14} height={14} style={{ flexShrink: 0, opacity: 0.85 }} />
                                    {new Date(o.scheduledAt).toLocaleString('en-US', { month:'short', day:'numeric', hour:'2-digit', minute:'2-digit' })}
                                  </span></>
                                )}
                              </div>
                            </div>
                            <div style={{ fontFamily:"'Barlow Condensed',sans-serif", fontWeight:900, fontSize:22, color:'#4ade80', flexShrink:0 }}>${o.price || 0}</div>
                          </div>

                          {/* Buyer actions */}
                          {status==='delivered'&&(
                            <div style={{ display:'flex', gap:8, marginTop:12, paddingTop:12, borderTop:'1px solid rgba(255,255,255,.06)', alignItems:'center' }}>
                              {o.buyerConfirmed ? (
                                <span style={{ ...R, fontSize:11, color:'#4ade80', fontWeight:700 }}>You confirmed — waiting for coach to confirm</span>
                              ) : (
                                <button disabled={coachingAction===o._id} onClick={()=>{
                                  setCoachingAction(o._id)
                                  coachingApi.approveDelivery({ orderId: o.orderId || o._id }).then(()=>setCoachingFetchKey(k=>k+1)).catch(()=>{}).finally(()=>setCoachingAction(''))
                                }} style={{ background:'rgba(74,222,128,.12)', border:'1px solid rgba(74,222,128,.35)', borderRadius:6, padding:'7px 16px', ...R, fontWeight:700, fontSize:11, color:'#4ade80', cursor:'pointer', opacity:coachingAction===o._id?0.5:1 }}>
                                  {coachingAction===o._id?'...':'Confirm Service Complete'}
                                </button>
                              )}
                              {!o.buyerConfirmed && (
                                <button disabled={coachingAction===o._id} onClick={()=>{
                                  const reason = prompt('Reason for revision request:')
                                  if (!reason) return
                                  setCoachingAction(o._id)
                                  coachingApi.requestRevision({ orderId: o.orderId || o._id, reason }).then(()=>setCoachingFetchKey(k=>k+1)).catch(()=>{}).finally(()=>setCoachingAction(''))
                                }} style={{ background:'rgba(96,165,250,.12)', border:'1px solid rgba(96,165,250,.35)', borderRadius:6, padding:'7px 16px', ...R, fontWeight:700, fontSize:11, color:'#60A5FA', cursor:'pointer', opacity:coachingAction===o._id?0.5:1 }}>
                                  Request Revision
                                </button>
                              )}
                            </div>
                          )}
                          {status==='completed'&&!o.isReviewed&&(
                            <div style={{ marginTop:12, paddingTop:12, borderTop:'1px solid rgba(255,255,255,.06)' }}>
                              {reviewingOrder===(o._id||o.orderId) ? (
                                <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
                                  <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                                    <span style={{ ...R, fontSize:11, fontWeight:700, color:'rgba(255,255,255,.5)', marginRight:4 }}>Rating:</span>
                                    {[1,2,3,4,5].map(star=>(
                                      <button key={star} type="button"
                                        onMouseEnter={()=>setHoverRating(star)}
                                        onMouseLeave={()=>setHoverRating(0)}
                                        onClick={()=>setReviewRating(star)}
                                        style={{ background:'none', border:'none', cursor:'pointer', padding:0, lineHeight:1, display:'inline-flex', alignItems:'center', opacity:(hoverRating||reviewRating)>=star?1:0.35, transition:'opacity .1s' }}
                                      >
                                        <Icon icon={Solar.star} width={24} height={24} style={{ color: (hoverRating||reviewRating)>=star ? '#F0AA1A' : 'rgba(255,255,255,0.35)' }} />
                                      </button>
                                    ))}
                                    {reviewRating>0&&<span style={{ ...R, fontSize:12, fontWeight:700, color:'#F0AA1A', marginLeft:4 }}>{reviewRating}/5</span>}
                                  </div>
                                  <textarea
                                    value={reviewText}
                                    onChange={e=>setReviewText(e.target.value)}
                                    placeholder="Write your review (min 10 characters)..."
                                    rows={3}
                                    style={{ width:'100%', background:'rgba(255,255,255,.04)', border:'1px solid rgba(255,255,255,.1)', borderRadius:8, padding:'10px 12px', color:'#fff', ...R, fontSize:12, outline:'none', resize:'vertical', boxSizing:'border-box' }}
                                  />
                                  <div style={{ display:'flex', gap:8 }}>
                                    <button
                                      disabled={reviewSubmitting||reviewRating===0||reviewText.trim().length<10}
                                      onClick={()=>{
                                        setReviewSubmitting(true)
                                        coachingApi.submitReview({ orderId: o.orderId||o._id, rating:reviewRating, text:reviewText.trim() })
                                          .then(()=>{ setReviewingOrder(null); setReviewRating(0); setReviewText(''); setCoachingFetchKey(k=>k+1) })
                                          .catch(()=>{})
                                          .finally(()=>setReviewSubmitting(false))
                                      }}
                                      style={{ background:'rgba(240,170,26,.15)', border:'1px solid rgba(240,170,26,.4)', borderRadius:6, padding:'8px 20px', ...R, fontWeight:700, fontSize:11, color:'#F0AA1A', cursor:'pointer', opacity:(reviewSubmitting||reviewRating===0||reviewText.trim().length<10)?0.4:1 }}
                                    >
                                      {reviewSubmitting?'Submitting...':'Submit Review'}
                                    </button>
                                    <button onClick={()=>{ setReviewingOrder(null); setReviewRating(0); setReviewText('') }}
                                      style={{ background:'rgba(255,255,255,.06)', border:'1px solid rgba(255,255,255,.1)', borderRadius:6, padding:'8px 16px', ...R, fontWeight:700, fontSize:11, color:'rgba(255,255,255,.5)', cursor:'pointer' }}>
                                      Cancel
                                    </button>
                                  </div>
                                </div>
                              ) : (
                                <button onClick={()=>{ setReviewingOrder(o._id||o.orderId); setReviewRating(0); setReviewText('') }}
                                  style={{ background:'rgba(240,170,26,.1)', border:'1px solid rgba(240,170,26,.3)', borderRadius:6, padding:'7px 16px', ...R, fontWeight:700, fontSize:11, color:'#F0AA1A', cursor:'pointer' }}>
                                  Leave a Review
                                </button>
                              )}
                            </div>
                          )}
                          {status==='completed'&&o.isReviewed&&(
                            <div style={{ display:'flex', alignItems:'center', gap:6, marginTop:12, paddingTop:12, borderTop:'1px solid rgba(255,255,255,.06)' }}>
                              <span style={{ ...R, fontSize:11, color:'#F0AA1A', fontWeight:700, display:'inline-flex', alignItems:'center', gap: 2 }}>
                                {[1,2,3,4,5].map(s => (
                                  <Icon key={s} icon={Solar.star} width={14} height={14} style={{ color: s <= (o.reviewRating || 0) ? '#F0AA1A' : 'rgba(255,255,255,0.2)' }} />
                                ))}
                              </span>
                              <span style={{ ...R, fontSize:11, color:'rgba(255,255,255,.4)' }}>Review submitted</span>
                            </div>
                          )}
                          {status==='pending'&&(
                            <div style={{ display:'flex', gap:8, marginTop:12, paddingTop:12, borderTop:'1px solid rgba(255,255,255,.06)' }}>
                              <button disabled={coachingAction===o._id} onClick={()=>{
                                if (!confirm('Cancel this order?')) return
                                setCoachingAction(o._id)
                                coachingApi.cancelOrder({ orderId: o._id || o.orderId }).then(()=>setCoachingFetchKey(k=>k+1)).catch(()=>{}).finally(()=>setCoachingAction(''))
                              }} style={{ background:'rgba(239,68,68,.1)', border:'1px solid rgba(239,68,68,.25)', borderRadius:6, padding:'7px 16px', ...R, fontWeight:700, fontSize:11, color:'#ef4444', cursor:'pointer', opacity:coachingAction===o._id?0.5:1 }}>
                                Cancel Order
                              </button>
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
