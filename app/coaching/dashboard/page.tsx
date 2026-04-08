'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useAuth } from '@/lib/auth-context'
import { coachingApi, gamesApi } from '@/lib/api'
import { useToast } from '@/components/Toast'
import { Icon } from '@iconify/react'
import { Solar } from '@/lib/solar-duotone'

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  return `${days}d ago`
}

// ─── TYPES ────────────────────────────────────────────────────────────────────
type OrderStatus = 'pending' | 'active' | 'delivered' | 'revision' | 'completed' | 'cancelled'
type PackageType = 'vod' | 'session' | 'drills' | 'team' | 'custom' | 'guide'

interface Order {
  id: string
  orderId: string
  buyer: string
  buyerAvatarUrl?: string | null
  package: string
  type: PackageType
  status: OrderStatus
  price: number
  deliveryDue: string
  createdAt: string
  messages: number
  unread: boolean
  scheduledAt: string
  conversationId: string
}

interface Package {
  id: string
  title: string
  type: PackageType
  price: number
  deliveryDays: number
  description: string
  includes: string[]
  active: boolean
  orders: number
  rating: number
}

interface Review {
  buyer: string
  buyerAvatarUrl?: string | null
  rating: number
  text: string
  package: string
  date: string
}

// ─── HELPERS ──────────────────────────────────────────────────────────────────
const TYPE_LABELS: Record<PackageType, { label:string; color:string; bg:string }> = {
  vod:     { label:'VOD Review',    color:'#60A5FA', bg:'rgba(96,165,250,.12)'  },
  session: { label:'Live Session',  color:'#4ade80', bg:'rgba(74,222,128,.12)'  },
  drills:  { label:'Drill Plan',    color:'#FB923C', bg:'rgba(251,146,60,.12)'  },
  team:    { label:'Team Coaching', color:'#A78BFA', bg:'rgba(167,139,250,.12)' },
  custom:  { label:'Custom',        color:'#F0AA1A', bg:'rgba(240,170,26,.12)'  },
  guide:   { label:'Guide',         color:'#F472B6', bg:'rgba(244,114,182,.12)' },
}

const STATUS_STYLES: Record<OrderStatus, { label:string; color:string; bg:string; border:string }> = {
  pending:   { label:'Pending',   color:'#F0AA1A', bg:'rgba(240,170,26,.12)', border:'rgba(240,170,26,.3)' },
  active:    { label:'Active',    color:'#4ade80', bg:'rgba(74,222,128,.12)', border:'rgba(74,222,128,.3)' },
  delivered: { label:'Delivered', color:'#A78BFA', bg:'rgba(167,139,250,.12)', border:'rgba(167,139,250,.3)' },
  revision:  { label:'Revision',  color:'#60A5FA', bg:'rgba(96,165,250,.12)', border:'rgba(96,165,250,.3)' },
  completed: { label:'Completed', color:'#6B7280', bg:'rgba(107,114,128,.1)', border:'rgba(107,114,128,.2)' },
  cancelled: { label:'Cancelled', color:'#ef4444', bg:'rgba(239,68,68,.1)',   border:'rgba(239,68,68,.2)'  },
}

function Stars({ n, size=11 }: { n:number; size?:number }) {
  return (
    <span style={{ display:'inline-flex', gap:1 }}>
      {[1,2,3,4,5].map(i=>(
        <svg key={i} width={size} height={size} viewBox="0 0 24 24" fill={i<=n?'#F0AA1A':'rgba(255,255,255,.15)'}>
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
        </svg>
      ))}
    </span>
  )
}

const TYPE_ICONS: Record<PackageType, string> = {
  vod: Solar.clapperboard,
  session: Solar.microphone,
  drills: Solar.tools,
  team: Solar.users,
  custom: Solar.sparkles,
  guide: Solar.book,
}

// ─── PACKAGE EDITOR MODAL ─────────────────────────────────────────────────────
function PackageEditorModal({ pkg, onClose, onSave }: { pkg: Package|null; onClose:()=>void; onSave:()=>void }) {
  const { toast } = useToast()
  const isNew = !pkg
  const [title, setTitle]             = useState(pkg?.title || '')
  const [price, setPrice]             = useState(pkg?.price ?? '')
  const [delivery, setDelivery]       = useState(pkg?.deliveryDays ?? '')
  const [pkgType, setPkgType]         = useState<PackageType>(pkg?.type || 'vod')
  const [desc, setDesc]               = useState(pkg?.description || '')
  const [includes, setIncludes]       = useState(pkg?.includes.join('\n') || '')
  const [saving, setSaving]           = useState(false)

  const handleSave = async () => {
    setSaving(true)
    const body = {
      title, price: Number(price), deliveryDays: Number(delivery),
      type: pkgType, description: desc,
      includes: includes.split('\n').map(s => s.trim()).filter(Boolean),
    }
    try {
      if (isNew) {
        await coachingApi.addPackage(body)
      } else {
        await coachingApi.updatePackage(pkg!.id, body)
      }
      onSave()
      onClose()
    } catch (err: any) {
      toast(err?.message || 'Failed to save package', 'error')
    }
    setSaving(false)
  }

  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,.75)', zIndex:1000, display:'flex', alignItems:'center', justifyContent:'center', padding:24 }}
      onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div style={{ background:'#18181C', border:'1px solid rgba(255,255,255,.1)', borderRadius:14, width:'100%', maxWidth:560, padding:28, maxHeight:'90vh', overflowY:'auto' }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:22 }}>
          <span style={{ fontFamily:'Barlow Condensed, sans-serif', fontWeight:900, fontSize:20, color:'#fff', letterSpacing:.5 }}>
            {isNew ? 'Create Package' : 'Edit Package'}
          </span>
          <button onClick={onClose} style={{ background:'none', border:'none', color:'rgba(255,255,255,.4)', fontSize:20, cursor:'pointer', lineHeight:1 }}>✕</button>
        </div>

        {[
          { label:'Package Title', type:'text',   placeholder:'e.g. VOD Deep Dive', val:title, set:setTitle },
          { label:'Price (USD)',   type:'number', placeholder:'e.g. 25',            val:price, set:setPrice },
          { label:'Delivery (days)', type:'number', placeholder:'e.g. 2',           val:delivery, set:setDelivery },
        ].map((f,i)=>(
          <div key={i} style={{ marginBottom:14 }}>
            <div style={{ fontFamily:'Rajdhani, sans-serif', fontWeight:700, fontSize:11, color:'rgba(255,255,255,.4)', textTransform:'uppercase', letterSpacing:.8, marginBottom:5 }}>{f.label}</div>
            <input type={f.type} value={String(f.val)} onChange={e => f.set(e.target.value as any)} placeholder={f.placeholder}
              style={{ width:'100%', background:'rgba(255,255,255,.05)', border:'1px solid rgba(255,255,255,.1)', borderRadius:8, padding:'9px 12px', color:'#fff', fontFamily:'Barlow, sans-serif', fontSize:13, outline:'none', boxSizing:'border-box' }}/>
          </div>
        ))}

        <div style={{ marginBottom:14 }}>
          <div style={{ fontFamily:'Rajdhani, sans-serif', fontWeight:700, fontSize:11, color:'rgba(255,255,255,.4)', textTransform:'uppercase', letterSpacing:.8, marginBottom:5 }}>Service Type</div>
          <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
            {(Object.entries(TYPE_LABELS) as [PackageType, typeof TYPE_LABELS['vod']][]).map(([key,t])=>(
              <button key={key} onClick={() => setPkgType(key)} style={{ background:key===pkgType?t.bg:'rgba(255,255,255,.05)', border:`1px solid ${key===pkgType?t.color:'rgba(255,255,255,.1)'}`, borderRadius:6, padding:'5px 12px', fontSize:11, fontWeight:700, color:key===pkgType?t.color:'rgba(255,255,255,.4)', fontFamily:'Rajdhani, sans-serif', cursor:'pointer', letterSpacing:.3 }}>
                <span style={{ display:'inline-flex', alignItems:'center', gap:6 }}>
                  <Icon icon={TYPE_ICONS[key]} width={13} height={13} style={{ flexShrink: 0, color: key===pkgType ? t.color : 'rgba(255,255,255,.45)' }} />
                  {t.label}
                </span>
              </button>
            ))}
          </div>
        </div>

        <div style={{ marginBottom:14 }}>
          <div style={{ fontFamily:'Rajdhani, sans-serif', fontWeight:700, fontSize:11, color:'rgba(255,255,255,.4)', textTransform:'uppercase', letterSpacing:.8, marginBottom:5 }}>Description</div>
          <textarea value={desc} onChange={e => setDesc(e.target.value)} rows={3} placeholder="Describe what the buyer gets..."
            style={{ width:'100%', background:'rgba(255,255,255,.05)', border:'1px solid rgba(255,255,255,.1)', borderRadius:8, padding:'9px 12px', color:'#fff', fontFamily:'Barlow, sans-serif', fontSize:13, outline:'none', resize:'vertical', boxSizing:'border-box' }}/>
        </div>

        <div style={{ marginBottom:22 }}>
          <div style={{ fontFamily:'Rajdhani, sans-serif', fontWeight:700, fontSize:11, color:'rgba(255,255,255,.4)', textTransform:'uppercase', letterSpacing:.8, marginBottom:5 }}>What's Included (one per line)</div>
          <textarea value={includes} onChange={e => setIncludes(e.target.value)} rows={4} placeholder="VOD breakdown&#10;Written report&#10;1 revision"
            style={{ width:'100%', background:'rgba(255,255,255,.05)', border:'1px solid rgba(255,255,255,.1)', borderRadius:8, padding:'9px 12px', color:'#fff', fontFamily:'Barlow, sans-serif', fontSize:13, outline:'none', resize:'vertical', boxSizing:'border-box' }}/>
        </div>

        <div style={{ display:'flex', gap:10 }}>
          <button onClick={onClose} style={{ flex:1, background:'rgba(255,255,255,.06)', border:'1px solid rgba(255,255,255,.1)', borderRadius:8, padding:'10px', color:'rgba(255,255,255,.5)', fontFamily:'Barlow Condensed, sans-serif', fontWeight:700, fontSize:13, letterSpacing:.5, cursor:'pointer' }}>
            Cancel
          </button>
          <button disabled={saving} onClick={handleSave} style={{ flex:2, background:'#B22D2D', border:'none', borderRadius:8, padding:'10px', color:'#fff', fontFamily:'Barlow Condensed, sans-serif', fontWeight:800, fontSize:13, letterSpacing:.8, cursor:'pointer', opacity:saving?0.6:1 }}>
            {saving ? 'SAVING...' : isNew ? 'CREATE PACKAGE' : 'SAVE CHANGES'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── CUSTOM OFFER MODAL ───────────────────────────────────────────────────────
function CustomOfferModal({ order, onClose }: { order: Order; onClose:()=>void }) {
  const [ofTitle, setOfTitle]     = useState('')
  const [ofPrice, setOfPrice]     = useState('')
  const [ofDays, setOfDays]       = useState('')
  const [ofNote, setOfNote]       = useState('')
  const [sending, setSending]     = useState(false)

  const handleSend = async () => {
    setSending(true)
    try {
      await coachingApi.sendCustomOffer({
        orderId: order.orderId || order.id,
        title: ofTitle,
        price: Number(ofPrice),
        deliveryDays: Number(ofDays),
        note: ofNote,
      })
      onClose()
    } catch {}
    setSending(false)
  }

  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,.75)', zIndex:1000, display:'flex', alignItems:'center', justifyContent:'center', padding:24 }}
      onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div style={{ background:'#18181C', border:'1px solid rgba(255,255,255,.1)', borderRadius:14, width:'100%', maxWidth:480, padding:28 }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:6 }}>
          <span style={{ fontFamily:'Barlow Condensed, sans-serif', fontWeight:900, fontSize:20, color:'#fff' }}>Create Custom Offer</span>
          <button onClick={onClose} style={{ background:'none', border:'none', color:'rgba(255,255,255,.4)', fontSize:20, cursor:'pointer' }}>✕</button>
        </div>
        <div style={{ fontSize:11, color:'rgba(255,255,255,.35)', fontFamily:'Barlow, sans-serif', marginBottom:20 }}>For {order.buyer} · {order.orderId || order.id}</div>

        {[
          { label:'Custom Title',     type:'text',   placeholder:'e.g. Extended IGL Session + VOD', val:ofTitle, set:setOfTitle },
          { label:'Price (USD)',       type:'number', placeholder:'e.g. 120', val:ofPrice, set:setOfPrice },
          { label:'Delivery (days)',   type:'number', placeholder:'e.g. 5', val:ofDays, set:setOfDays },
        ].map((f,i)=>(
          <div key={i} style={{ marginBottom:14 }}>
            <div style={{ fontFamily:'Rajdhani, sans-serif', fontWeight:700, fontSize:11, color:'rgba(255,255,255,.4)', textTransform:'uppercase', letterSpacing:.8, marginBottom:5 }}>{f.label}</div>
            <input type={f.type} value={f.val} onChange={e => f.set(e.target.value)} placeholder={f.placeholder}
              style={{ width:'100%', background:'rgba(255,255,255,.05)', border:'1px solid rgba(255,255,255,.1)', borderRadius:8, padding:'9px 12px', color:'#fff', fontFamily:'Barlow, sans-serif', fontSize:13, outline:'none', boxSizing:'border-box' }}/>
          </div>
        ))}

        <div style={{ marginBottom:22 }}>
          <div style={{ fontFamily:'Rajdhani, sans-serif', fontWeight:700, fontSize:11, color:'rgba(255,255,255,.4)', textTransform:'uppercase', letterSpacing:.8, marginBottom:5 }}>Offer Details / Note to Buyer</div>
          <textarea value={ofNote} onChange={e => setOfNote(e.target.value)} rows={3} placeholder="Describe what this custom package includes..."
            style={{ width:'100%', background:'rgba(255,255,255,.05)', border:'1px solid rgba(255,255,255,.1)', borderRadius:8, padding:'9px 12px', color:'#fff', fontFamily:'Barlow, sans-serif', fontSize:13, outline:'none', resize:'vertical', boxSizing:'border-box' }}/>
        </div>

        <div style={{ display:'flex', gap:10 }}>
          <button onClick={onClose} style={{ flex:1, background:'rgba(255,255,255,.06)', border:'1px solid rgba(255,255,255,.1)', borderRadius:8, padding:'10px', color:'rgba(255,255,255,.5)', fontFamily:'Barlow Condensed, sans-serif', fontWeight:700, fontSize:13, letterSpacing:.5, cursor:'pointer' }}>Cancel</button>
          <button disabled={sending} onClick={handleSend} style={{ flex:2, background:'#F0AA1A', border:'none', borderRadius:8, padding:'10px', color:'#000', fontFamily:'Barlow Condensed, sans-serif', fontWeight:800, fontSize:13, letterSpacing:.8, cursor:'pointer', opacity:sending?0.6:1 }}>
            {sending ? 'SENDING...' : 'SEND CUSTOM OFFER'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── PAGE ─────────────────────────────────────────────────────────────────────
export default function CoachDashboard() {
  const { toast } = useToast()
  const { user } = useAuth()
  const [tab, setTab]                   = useState<'orders'|'packages'|'reviews'>('orders')
  const [editingPkg, setEditingPkg]     = useState<Package|null|'new'>(null)
  const [customOffer, setCustomOffer]   = useState<Order|null>(null)
  const [orderFilter, setOrderFilter]   = useState<OrderStatus|'all'>('all')
  const [actionLoading, setActionLoading] = useState<string>('')
  const [acceptingOrder, setAcceptingOrder] = useState<Order|null>(null)
  const [scheduledDate, setScheduledDate]   = useState('')
  const [scheduledTime, setScheduledTime]   = useState('')
  const [rejectReason, setRejectReason]     = useState('')
  const [rejectingOrder, setRejectingOrder] = useState<Order|null>(null)
  const [reviewDist, setReviewDist]         = useState<Record<number,number>>({})
  const [editCoachModal, setEditCoachModal] = useState(false)
  const [editBio, setEditBio]              = useState('')
  const [editTitle, setEditTitle]          = useState('')
  const [editCustomReqs, setEditCustomReqs] = useState(false)
  const [editGameSlugs, setEditGameSlugs]  = useState<string[]>([])
  const [savingProfile, setSavingProfile]   = useState(false)
  const [COACH, setCOACH]              = useState<any>(null)
  const [ORDERS, setORDERS]            = useState<Order[]>([])
  const [PACKAGES, setPACKAGES]        = useState<Package[]>([])
  const [REVIEWS, setREVIEWS]          = useState<Review[]>([])
  const [games, setGames]              = useState<any[]>([])
  const [loading, setLoading]          = useState(true)
  const [fetchKey, setFetchKey]        = useState(0)

  useEffect(() => {
    if (!user) return
    setLoading(true)
    Promise.all([
      coachingApi.getDashboardOrders().catch(() => []),
      coachingApi.getDashboardProfile().catch(() => null),
      gamesApi.getAll().catch(() => []),
    ]).then(([ordersData, me, gamesData]: any[]) => {
      if (me) {
        const rating = me.reviewCount > 0 ? parseFloat((me.ratingSum / me.reviewCount).toFixed(1)) : (me.rating || 0)
        setCOACH({
          name: me.displayName || me.name || user.username,
          emoji: me.emoji || '',
          avatarUrl: me.avatarUrl || '',
          title: me.title || '',
          game: me.game || '',
          verified: me.isVerified ?? false,
          memberSince: me.createdAt ? new Date(me.createdAt).toLocaleDateString('en-US', { month:'short', year:'numeric' }) : '',
          totalEarned: me.totalEarned || 0,
          pendingPayout: me.pendingPayout || 0,
          rating,
          totalReviews: me.reviewCount || 0,
          completionRate: me.totalOrders > 0 ? Math.round((me.completedOrders / me.totalOrders) * 100) : 0,
          responseTime: me.responseTime || '—',
          slug: me.slug,
          bio: me.bio || '',
          allowCustomRequests: me.allowCustomRequests ?? false,
          gameSlugs: me.gameSlugs || [],
        })
        // Packages
        setPACKAGES((me.packages || []).map((p: any) => ({
          id: p.id, title: p.title, type: p.type, price: p.price,
          deliveryDays: p.deliveryDays, description: p.description || '',
          includes: p.includes || [], active: p.isActive ?? true,
          orders: p.orders || 0, rating: p.rating || 0,
        })))
        // Fetch reviews
        if (me.slug) {
          coachingApi.getCoachReviews(me.slug).then((rev: any) => {
            const items = Array.isArray(rev) ? rev : rev.items ?? rev.reviews ?? []
            setREVIEWS(items.map((r: any) => ({
              buyer: r.buyerName || r.buyer || 'User',
              buyerAvatarUrl: r.buyerAvatarUrl || null,
              rating: r.rating,
              text: r.text,
              package: r.packageTitle || r.package || '',
              date: r.createdAt ? new Date(r.createdAt).toLocaleDateString('en-US', { month:'short', day:'numeric', year:'numeric' }) : '',
            })))
          }).catch(() => {})
          coachingApi.getReviewDistribution(me.slug).then((dist: any) => {
            setReviewDist(dist || {})
          }).catch(() => {})
        }
      } else {
        // No coach profile yet — show empty state
        setCOACH({
          name: user.username, emoji: '', avatarUrl: (user as any).avatarUrl || '', title: '', game: '',
          verified: false, memberSince: '', totalEarned: 0, pendingPayout: 0,
          rating: 0, totalReviews: 0, completionRate: 0, responseTime: '—', slug: '',
        })
      }

      // Orders
      const rawOrders = Array.isArray(ordersData) ? ordersData : ordersData.orders ?? ordersData.data ?? []
      setORDERS(rawOrders.map((o: any) => ({
        id: o._id || o.id,
        orderId: o.orderId || o._id,
        buyer: o.buyerId?.username || o.buyerName || 'User',
        buyerAvatarUrl: o.buyerId?.avatarUrl || null,
        package: o.packageTitle || '',
        type: o.packageType || 'vod',
        status: o.status || 'pending',
        price: o.price || 0,
        deliveryDue: o.deliveryDue ? new Date(o.deliveryDue).toLocaleDateString('en-US', { month:'short', day:'numeric', year:'numeric' }) : '—',
        createdAt: o.createdAt ? timeAgo(o.createdAt) : '',
        messages: o.messages || 0,
        unread: o.unread ?? false,
        scheduledAt: o.scheduledAt ? new Date(o.scheduledAt).toLocaleString('en-US', { month:'short', day:'numeric', hour:'2-digit', minute:'2-digit' }) : '',
        conversationId: o.conversationId || '',
      })))

      // Games
      const gList = Array.isArray(gamesData) ? gamesData : gamesData.games ?? gamesData.data ?? []
      setGames(gList)

      setLoading(false)
    })
  }, [user, fetchKey])

  if (loading || !COACH) {
    return (
      <div style={{ minHeight:'100vh', background:'#0C0C11', display:'flex', alignItems:'center', justifyContent:'center' }}>
        <div style={{ fontFamily:'Barlow Condensed, sans-serif', fontWeight:900, fontSize:18, color:'rgba(255,255,255,.4)', letterSpacing:.5 }}>Loading dashboard...</div>
      </div>
    )
  }

  const activeOrders    = ORDERS.filter(o=>o.status==='active'||o.status==='pending'||o.status==='revision'||o.status==='delivered')
  const filteredOrders  = orderFilter==='all' ? ORDERS : ORDERS.filter(o=>o.status===orderFilter)
  const unreadCount     = ORDERS.filter(o=>o.unread).length
  const monthEarnings   = ORDERS.filter(o=>o.status==='completed').reduce((a,o)=>a+o.price,0)

  return (
    <div style={{ minHeight:'100vh', background:'#0C0C11', paddingBottom:60 }}>

      {/* ── COACH HEADER ── */}
      <div style={{ background:'linear-gradient(135deg,#13131a,#0C0C11)', borderBottom:'1px solid rgba(255,255,255,.06)', padding:'20px 0' }}>
        <div className="container">
          <div style={{ display:'flex', alignItems:'center', gap:16, flexWrap:'wrap' }}>

            {/* Avatar */}
            {COACH.avatarUrl ? (
              <img src={COACH.avatarUrl} alt={COACH.name} style={{ width:56, height:56, borderRadius:12, objectFit:'cover', border:'2px solid rgba(178,45,45,.4)', flexShrink:0 }}/>
            ) : (
              <div style={{ width:56, height:56, borderRadius:12, background:'linear-gradient(135deg,#B22D2D,#7a1a1a)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:26, flexShrink:0, border:'2px solid rgba(178,45,45,.4)' }}>
                <Icon icon={Solar.target} width={26} height={26} style={{ display: 'block' }} />
              </div>
            )}

            {/* Info */}
            <div>
              <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:3 }}>
                <span style={{ fontFamily:'Barlow Condensed, sans-serif', fontWeight:900, fontSize:22, color:'#fff', letterSpacing:.5 }}>{COACH.name}</span>
                <span style={{ background:'rgba(178,45,45,.2)', border:'1px solid rgba(178,45,45,.4)', borderRadius:4, padding:'2px 8px', fontSize:9, fontWeight:700, color:'#ff6b6b', fontFamily:'Rajdhani, sans-serif', letterSpacing:.5 }}>✓ VERIFIED COACH</span>
                <button onClick={() => { setEditBio(COACH.bio || ''); setEditTitle(COACH.title || ''); setEditCustomReqs(COACH.allowCustomRequests); setEditGameSlugs(COACH.gameSlugs || []); setEditCoachModal(true) }} style={{ background:'rgba(255,255,255,.06)', border:'1px solid rgba(255,255,255,.12)', borderRadius:6, padding:'3px 10px', fontFamily:'Rajdhani, sans-serif', fontWeight:700, fontSize:10, color:'rgba(255,255,255,.5)', cursor:'pointer', letterSpacing:.3 }}>
                  EDIT PROFILE
                </button>
              </div>
              <div style={{ fontFamily:'Barlow, sans-serif', fontSize:12, color:'rgba(255,255,255,.4)' }}>{[COACH.title, COACH.game, COACH.memberSince && `Member since ${COACH.memberSince}`].filter(Boolean).join(' · ')}</div>
            </div>

            {/* Quick stats */}
            <div style={{ marginLeft:'auto', display:'flex', gap:20, flexWrap:'wrap' }}>
              {[
                { label:'Rating',     val:`${COACH.rating} ★`,         color:'#F0AA1A' },
                { label:'Completion', val:`${COACH.completionRate}%`,    color:'#4ade80' },
                { label:'Response',   val:COACH.responseTime,           color:'#60A5FA' },
                { label:'Total Earned',val:`$${COACH.totalEarned.toLocaleString()}`, color:'#4ade80' },
              ].map((s,i)=>(
                <div key={i} style={{ textAlign:'right' }}>
                  <div style={{ fontFamily:'Barlow Condensed, sans-serif', fontWeight:900, fontSize:18, color:s.color, letterSpacing:.3 }}>{s.val}</div>
                  <div style={{ fontFamily:'Rajdhani, sans-serif', fontSize:9, fontWeight:700, color:'rgba(255,255,255,.3)', textTransform:'uppercase', letterSpacing:.7 }}>{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="container" style={{ marginTop:24 }}>

        {/* ── STAT CARDS ROW ── */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:12, marginBottom:24 }}>
          {[
            { icon:'📬', label:'Unread Messages', val:unreadCount,                color:'#F0AA1A', sub:'Needs response' },
            { icon:'⚡', label:'Active Orders',    val:activeOrders.length,        color:'#4ade80', sub:'In progress'    },
            { icon:'💰', label:'Pending Payout',  val:`$${COACH.pendingPayout}`,  color:'#60A5FA', sub:'Next: March 1'  },
            { icon:'📦', label:'This Month',      val:`$${monthEarnings}`,         color:'#A78BFA', sub:`${ORDERS.filter(o=>o.status==='completed').length} completed` },
          ].map((s,i)=>(
            <div key={i} style={{ background:'#18181C', border:'1px solid rgba(255,255,255,.07)', borderRadius:12, padding:'16px 18px' }}>
              <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:10 }}>
                <span style={{ fontSize:20 }}>{s.icon}</span>
                <span style={{ fontFamily:'Rajdhani, sans-serif', fontSize:9, fontWeight:700, color:'rgba(255,255,255,.25)', textTransform:'uppercase', letterSpacing:.7 }}>{s.sub}</span>
              </div>
              <div style={{ fontFamily:'Barlow Condensed, sans-serif', fontWeight:900, fontSize:26, color:s.color, letterSpacing:.3, marginBottom:2 }}>{s.val}</div>
              <div style={{ fontFamily:'Rajdhani, sans-serif', fontSize:10, fontWeight:700, color:'rgba(255,255,255,.35)', textTransform:'uppercase', letterSpacing:.7 }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* ── TABS ── */}
        <div style={{ display:'flex', gap:4, borderBottom:'1px solid rgba(255,255,255,.07)', marginBottom:20 }}>
          {([
            { key:'orders',   label:`Orders`,   badge:unreadCount>0?unreadCount:null },
            { key:'packages', label:'Packages', badge:null },
            { key:'reviews',  label:'Reviews',  badge:null },
          ] as const).map(t=>(
            <button key={t.key} onClick={()=>setTab(t.key)} style={{
              background:'none', border:'none', borderBottom:`2px solid ${tab===t.key?'#B22D2D':'transparent'}`,
              padding:'8px 18px', fontFamily:'Barlow Condensed, sans-serif', fontWeight:800, fontSize:13,
              letterSpacing:.6, color:tab===t.key?'#fff':'rgba(255,255,255,.35)',
              cursor:'pointer', display:'flex', alignItems:'center', gap:7, transition:'color .15s', marginBottom:-1,
            }}>
              {t.label}
              {t.badge&&<span style={{ background:'#B22D2D', borderRadius:10, padding:'1px 6px', fontSize:10, fontWeight:700, color:'#fff', fontFamily:'Roboto, sans-serif' }}>{t.badge}</span>}
            </button>
          ))}
        </div>

        {/* ── ORDERS TAB ── */}
        {tab==='orders'&&(
          <div>
            {/* Filter pills */}
            <div style={{ display:'flex', gap:6, marginBottom:16, flexWrap:'wrap' }}>
              {(['all','pending','active','delivered','revision','completed'] as const).map(f=>(
                <button key={f} onClick={()=>setOrderFilter(f)} style={{
                  background:orderFilter===f?'rgba(178,45,45,.2)':'rgba(255,255,255,.04)',
                  border:`1px solid ${orderFilter===f?'rgba(178,45,45,.5)':'rgba(255,255,255,.08)'}`,
                  borderRadius:20, padding:'4px 14px',
                  fontFamily:'Rajdhani, sans-serif', fontWeight:700, fontSize:10,
                  color:orderFilter===f?'#ff8080':'rgba(255,255,255,.4)',
                  textTransform:'uppercase', letterSpacing:.5, cursor:'pointer',
                }}>
                  {f==='all'?'All Orders':STATUS_STYLES[f].label}
                </button>
              ))}
            </div>

            {/* Orders list */}
            <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
              {filteredOrders.map(order=>{
                const st = STATUS_STYLES[order.status]
                const tp = TYPE_LABELS[order.type]
                return (
                  <div key={order.id} style={{ background:'#18181B', border:`1px solid ${order.unread?'#3B82F6':'#27272A'}`, borderRadius:12, padding:'16px', display:'flex', alignItems:'center', gap:16 }}>
                    
                    {/* Unread indicator wrapper - modern look */}
                    <div style={{ position:'relative', display:'flex', flexShrink:0 }}>
                      <div style={{ width:40, height:40, borderRadius:20, background:'#27272A', display:'flex', alignItems:'center', justifyContent:'center', overflow:'hidden' }}>
                        {order.buyerAvatarUrl ? (
                          <img src={order.buyerAvatarUrl} alt={order.buyer} style={{width:'100%', height:'100%', objectFit:'cover'}}/>
                        ) : (
                          <Icon icon={Solar.user} width={20} height={20} style={{ color: '#A1A1AA' }} />
                        )}
                      </div>
                      {order.unread && <div style={{ position:'absolute', top:0, right:0, width:10, height:10, borderRadius:'50%', background:'#3B82F6', border:'2px solid #18181B' }}/>}
                    </div>

                    {/* Info */}
                    <div style={{ flex:1, minWidth:0 }}>
                      <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:4, flexWrap:'wrap' }}>
                        <span style={{ fontFamily:'Inter, sans-serif', fontWeight:600, fontSize:15, color:'#F9FAFB' }}>{order.buyer}</span>
                        <span style={{ background:`${tp.color}15`, color:tp.color, padding:'2px 8px', borderRadius:6, fontSize:12, fontWeight:500, fontFamily:'Inter, sans-serif', display:'inline-flex', alignItems:'center', gap:4 }}>
                          <Icon icon={TYPE_ICONS[order.type]} width={12} height={12} /> {tp.label}
                        </span>
                        <span style={{ background:st.bg, border:`1px solid ${st.border}`, borderRadius:6, padding:'2px 8px', fontSize:12, fontWeight:500, color:st.color, fontFamily:'Inter, sans-serif' }}>{st.label}</span>
                      </div>
                      <div style={{ fontFamily:'Inter, sans-serif', fontSize:13, color:'#9CA3AF' }}>
                        {order.package} <span style={{color:'#4B5563'}}>•</span> Due {order.deliveryDue} <span style={{color:'#4B5563'}}>•</span> {order.messages} messages
                        {order.scheduledAt && <> <span style={{color:'#4B5563'}}>•</span> 📅 {order.scheduledAt}</>}
                      </div>
                    </div>

                    {/* Price */}
                    <div style={{ fontFamily:'Inter, sans-serif', fontWeight:600, fontSize:20, color:'#10B981', flexShrink:0, paddingRight: 10 }}>${order.price}</div>

                    {/* Actions */}
                    <div style={{ display:'flex', gap:8, flexShrink:0, flexWrap:'wrap' }}>
                      {order.status==='pending'&&(
                        <>
                          <button disabled={actionLoading===order.id} onClick={()=>{ setAcceptingOrder(order); setScheduledDate(''); setScheduledTime('') }} style={{ background:'#10B981', border:'none', borderRadius:6, padding:'8px 16px', fontSize:13, fontWeight:600, color:'#042F2E', fontFamily:'Inter, sans-serif', cursor:'pointer', whiteSpace:'nowrap' }}>
                            Accept
                          </button>
                          <button disabled={actionLoading===order.id} onClick={()=>{ setRejectingOrder(order); setRejectReason('') }} style={{ background:'transparent', border:'1px solid #EF4444', borderRadius:6, padding:'8px 16px', fontSize:13, fontWeight:600, color:'#EF4444', fontFamily:'Inter, sans-serif', cursor:'pointer', whiteSpace:'nowrap' }}>
                            Reject
                          </button>
                        </>
                      )}
                      {(order.status==='active'||order.status==='revision')&&(
                        <button disabled={actionLoading===order.id} onClick={()=>{
                          setActionLoading(order.id)
                          coachingApi.deliverOrder({ orderId: order.orderId || order.id }).then(()=>setFetchKey(k=>k+1)).catch(()=>{}).finally(()=>setActionLoading(''))
                        }} style={{ background:'#8B5CF6', border:'none', borderRadius:6, padding:'8px 16px', fontSize:13, fontWeight:600, color:'#fff', fontFamily:'Inter, sans-serif', cursor:'pointer', whiteSpace:'nowrap', opacity:actionLoading===order.id?0.5:1 }}>
                          {actionLoading===order.id?'...':'Deliver'}
                        </button>
                      )}
                      {order.status==='delivered'&&(
                        (order as any).coachConfirmed ? (
                          <span style={{ fontSize:13, fontWeight:500, color:'#10B981', fontFamily:'Inter, sans-serif', whiteSpace:'nowrap', background:'#064E3B', padding:'6px 12px', borderRadius:6 }}>Waiting for buyer</span>
                        ) : (
                          <button disabled={actionLoading===order.id} onClick={()=>{
                            setActionLoading(order.id)
                            coachingApi.confirmCompletion({ orderId: order.orderId || order.id }).then(()=>setFetchKey(k=>k+1)).catch(()=>{}).finally(()=>setActionLoading(''))
                          }} style={{ background:'#10B981', border:'none', borderRadius:6, padding:'8px 16px', fontSize:13, fontWeight:600, color:'#042F2E', fontFamily:'Inter, sans-serif', cursor:'pointer', whiteSpace:'nowrap', opacity:actionLoading===order.id?0.5:1 }}>
                            {actionLoading===order.id?'...':'Confirm'}
                          </button>
                        )
                      )}
                      {(order.status==='pending'||order.status==='active'||order.status==='revision')&&(
                        <button onClick={()=>setCustomOffer(order)} style={{ background:'transparent', border:'1px solid #F59E0B', borderRadius:6, padding:'8px 16px', fontSize:13, fontWeight:600, color:'#F59E0B', fontFamily:'Inter, sans-serif', cursor:'pointer', whiteSpace:'nowrap' }}>
                          Offer
                        </button>
                      )}
                      {order.conversationId ? (
                        <Link href={`/mailbox?thread=${order.conversationId}`} style={{ background:'#27272A', border:'none', borderRadius:6, padding:'8px 16px', fontSize:13, fontWeight:600, color:'#E5E7EB', fontFamily:'Inter, sans-serif', textDecoration:'none', whiteSpace:'nowrap' }}>
                          Chat
                        </Link>
                      ) : (
                        <Link href="/mailbox" style={{ background:'#27272A', border:'none', borderRadius:6, padding:'8px 16px', fontSize:13, fontWeight:600, color:'#E5E7EB', fontFamily:'Inter, sans-serif', textDecoration:'none', whiteSpace:'nowrap' }}>
                          Open
                        </Link>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* ── PACKAGES TAB ── */}
        {tab==='packages'&&(
          <div>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:16 }}>
              <span style={{ fontFamily:'Barlow, sans-serif', fontSize:12, color:'rgba(255,255,255,.35)' }}>
                {PACKAGES.filter(p=>p.active).length} active · {PACKAGES.filter(p=>!p.active).length} paused
              </span>
              <button onClick={()=>setEditingPkg('new')} style={{ background:'#B22D2D', border:'none', borderRadius:8, padding:'8px 18px', fontFamily:'Barlow Condensed, sans-serif', fontWeight:800, fontSize:12, letterSpacing:.8, color:'#fff', cursor:'pointer' }}>
                + NEW PACKAGE
              </button>
            </div>

            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(280px,1fr))', gap:12 }}>
              {PACKAGES.map(pkg=>{
                const tp = TYPE_LABELS[pkg.type]
                return (
                  <div key={pkg.id} style={{ background:'#18181C', border:`1px solid ${pkg.active?'rgba(255,255,255,.08)':'rgba(255,255,255,.04)'}`, borderRadius:12, padding:'18px', opacity:pkg.active?1:.6, display:'flex', flexDirection:'column', gap:12 }}>

                    {/* Header */}
                    <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between' }}>
                      <div>
                        <div style={{ display:'flex', alignItems:'center', gap:7, marginBottom:5 }}>
                          <span style={{ background:tp.bg, border:`1px solid ${tp.color}33`, borderRadius:4, padding:'2px 8px', fontSize:9, fontWeight:700, color:tp.color, fontFamily:'Rajdhani, sans-serif', letterSpacing:.3, display:'inline-flex', alignItems:'center', gap:5 }}><Icon icon={TYPE_ICONS[pkg.type]} width={11} height={11} style={{ flexShrink: 0, color: tp.color }} /> {tp.label}</span>
                          {!pkg.active&&<span style={{ background:'rgba(107,114,128,.12)', border:'1px solid rgba(107,114,128,.25)', borderRadius:4, padding:'2px 7px', fontSize:9, fontWeight:700, color:'#6B7280', fontFamily:'Rajdhani, sans-serif', letterSpacing:.3 }}>PAUSED</span>}
                        </div>
                        <div style={{ fontFamily:'Barlow Condensed, sans-serif', fontWeight:900, fontSize:17, color:'#fff', letterSpacing:.3 }}>{pkg.title}</div>
                      </div>
                      <div style={{ textAlign:'right' }}>
                        <div style={{ fontFamily:'Barlow Condensed, sans-serif', fontWeight:900, fontSize:22, color:'#4ade80' }}>${pkg.price}</div>
                        <div style={{ fontSize:9, color:'rgba(255,255,255,.3)', fontFamily:'Barlow, sans-serif' }}>{pkg.deliveryDays}d delivery</div>
                      </div>
                    </div>

                    {/* Description */}
                    <p style={{ fontFamily:'Barlow, sans-serif', fontSize:11, color:'rgba(255,255,255,.4)', lineHeight:1.6, margin:0 }}>{pkg.description}</p>

                    {/* Includes */}
                    <div style={{ display:'flex', flexDirection:'column', gap:4 }}>
                      {pkg.includes.map((inc,i)=>(
                        <div key={i} style={{ display:'flex', alignItems:'center', gap:6 }}>
                          <span style={{ color:'#4ade80', fontSize:9 }}>✓</span>
                          <span style={{ fontFamily:'Barlow, sans-serif', fontSize:11, color:'rgba(255,255,255,.5)' }}>{inc}</span>
                        </div>
                      ))}
                    </div>

                    {/* Stats + actions */}
                    <div style={{ borderTop:'1px solid rgba(255,255,255,.06)', paddingTop:12, display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                      <div style={{ display:'flex', gap:14 }}>
                        <div>
                          <div style={{ fontFamily:'Barlow Condensed, sans-serif', fontWeight:900, fontSize:15, color:'#fff' }}>{pkg.orders}</div>
                          <div style={{ fontSize:8, color:'rgba(255,255,255,.3)', fontFamily:'Rajdhani, sans-serif', fontWeight:700, textTransform:'uppercase', letterSpacing:.5 }}>Orders</div>
                        </div>
                        <div>
                          <div style={{ display:'flex', alignItems:'center', gap:3 }}><Stars n={Math.round(pkg.rating)}/><span style={{ fontFamily:'Barlow Condensed, sans-serif', fontWeight:700, fontSize:12, color:'#F0AA1A', marginLeft:2 }}>{pkg.rating}</span></div>
                          <div style={{ fontSize:8, color:'rgba(255,255,255,.3)', fontFamily:'Rajdhani, sans-serif', fontWeight:700, textTransform:'uppercase', letterSpacing:.5 }}>Rating</div>
                        </div>
                      </div>
                      <div style={{ display:'flex', gap:7 }}>
                        <button style={{ background:'rgba(255,255,255,.06)', border:'1px solid rgba(255,255,255,.1)', borderRadius:6, padding:'5px 10px', fontSize:10, fontWeight:700, color:pkg.active?'rgba(255,255,255,.5)':'#4ade80', fontFamily:'Rajdhani, sans-serif', cursor:'pointer' }}>
                          {pkg.active?'Pause':'Resume'}
                        </button>
                        <button onClick={()=>setEditingPkg(pkg)} style={{ background:'rgba(255,255,255,.06)', border:'1px solid rgba(255,255,255,.1)', borderRadius:6, padding:'5px 10px', fontSize:10, fontWeight:700, color:'rgba(255,255,255,.5)', fontFamily:'Rajdhani, sans-serif', cursor:'pointer' }}>
                          Edit
                        </button>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* ── REVIEWS TAB ── */}
        {tab==='reviews'&&(
          <div>
            {/* Rating summary */}
            <div style={{ background:'#18181C', border:'1px solid rgba(255,255,255,.07)', borderRadius:12, padding:'20px 24px', marginBottom:16, display:'flex', alignItems:'center', gap:32 }}>
              <div style={{ textAlign:'center' }}>
                <div style={{ fontFamily:'Barlow Condensed, sans-serif', fontWeight:900, fontSize:48, color:'#F0AA1A', lineHeight:1 }}>{COACH.rating}</div>
                <Stars n={5} size={14}/>
                <div style={{ fontFamily:'Barlow, sans-serif', fontSize:11, color:'rgba(255,255,255,.35)', marginTop:4 }}>{COACH.totalReviews} reviews</div>
              </div>
              <div style={{ flex:1 }}>
                {[5,4,3,2,1].map(star=>{
                  const count = reviewDist[star] || 0
                  const total = Object.values(reviewDist).reduce((a: number, b: number) => a + b, 0)
                  const pct = total > 0 ? Math.round((count / total) * 100) : 0
                  return (
                    <div key={star} style={{ display:'flex', alignItems:'center', gap:8, marginBottom:4 }}>
                      <span style={{ fontFamily:'Barlow Condensed, sans-serif', fontWeight:700, fontSize:11, color:'rgba(255,255,255,.4)', width:10, textAlign:'right' }}>{star}</span>
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="#F0AA1A"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
                      <div style={{ flex:1, height:4, borderRadius:2, background:'rgba(255,255,255,.08)', overflow:'hidden' }}>
                        <div style={{ width:`${pct}%`, height:'100%', background:'#F0AA1A', borderRadius:2 }}/>
                      </div>
                      <span style={{ fontFamily:'Barlow, sans-serif', fontSize:10, color:'rgba(255,255,255,.3)', width:28 }}>{pct}%</span>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Review list */}
            <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
              {REVIEWS.map((r,i)=>(
                <div key={i} style={{ background:'#18181C', border:'1px solid rgba(255,255,255,.07)', borderRadius:10, padding:'16px 18px' }}>
                  <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:10 }}>
                    <div style={{ width:32, height:32, borderRadius:7, background:'rgba(255,255,255,.06)', border:'1px solid rgba(255,255,255,.1)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:16, overflow:'hidden', flexShrink:0 }}>
                      {r.buyerAvatarUrl ? <img src={r.buyerAvatarUrl} alt={r.buyer} style={{width:'100%', height:'100%', objectFit:'cover'}}/> : <Icon icon={Solar.user} width={18} height={18} />}
                    </div>
                    <div style={{ flex:1 }}>
                      <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:2 }}>
                        <span style={{ fontFamily:'Rajdhani, sans-serif', fontWeight:700, fontSize:13, color:'#fff' }}>{r.buyer}</span>
                        <Stars n={r.rating}/>
                      </div>
                      <div style={{ fontFamily:'Barlow, sans-serif', fontSize:10, color:'rgba(255,255,255,.3)' }}>{r.package} · {r.date}</div>
                    </div>
                  </div>
                  <p style={{ fontFamily:'Barlow, sans-serif', fontSize:12, color:'rgba(255,255,255,.55)', lineHeight:1.6, margin:0 }}>"{r.text}"</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ── MODALS ── */}
      {editingPkg!==null&&<PackageEditorModal pkg={editingPkg==='new'?null:editingPkg} onClose={()=>setEditingPkg(null)} onSave={()=>setFetchKey(k=>k+1)}/>}
      {customOffer!==null&&<CustomOfferModal order={customOffer} onClose={()=>setCustomOffer(null)}/>}

      {/* Accept Order Modal */}
      {acceptingOrder&&(
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,.75)', zIndex:1000, display:'flex', alignItems:'center', justifyContent:'center', padding:24 }}
          onClick={e=>e.target===e.currentTarget&&setAcceptingOrder(null)}>
          <div style={{ background:'#18181C', border:'1px solid rgba(255,255,255,.1)', borderRadius:14, width:'100%', maxWidth:420, padding:28 }}>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:18 }}>
              <span style={{ fontFamily:'Barlow Condensed, sans-serif', fontWeight:900, fontSize:20, color:'#fff' }}>Accept Order</span>
              <button onClick={()=>setAcceptingOrder(null)} style={{ background:'none', border:'none', color:'rgba(255,255,255,.4)', fontSize:20, cursor:'pointer' }}>✕</button>
            </div>
            <div style={{ fontSize:12, color:'rgba(255,255,255,.4)', fontFamily:'Barlow, sans-serif', marginBottom:18 }}>
              {acceptingOrder.buyer} — {acceptingOrder.package} — ${acceptingOrder.price}
            </div>
            <div style={{ marginBottom:14 }}>
              <div style={{ fontFamily:'Rajdhani, sans-serif', fontWeight:700, fontSize:11, color:'rgba(255,255,255,.4)', textTransform:'uppercase', letterSpacing:.8, marginBottom:5 }}>Scheduled Date</div>
              <input type="date" value={scheduledDate} onChange={e=>setScheduledDate(e.target.value)}
                style={{ width:'100%', background:'rgba(255,255,255,.05)', border:'1px solid rgba(255,255,255,.1)', borderRadius:8, padding:'9px 12px', color:'#fff', fontFamily:'Barlow, sans-serif', fontSize:13, outline:'none', boxSizing:'border-box', colorScheme:'dark' }}/>
            </div>
            <div style={{ marginBottom:22 }}>
              <div style={{ fontFamily:'Rajdhani, sans-serif', fontWeight:700, fontSize:11, color:'rgba(255,255,255,.4)', textTransform:'uppercase', letterSpacing:.8, marginBottom:5 }}>Scheduled Time</div>
              <input type="time" value={scheduledTime} onChange={e=>setScheduledTime(e.target.value)}
                style={{ width:'100%', background:'rgba(255,255,255,.05)', border:'1px solid rgba(255,255,255,.1)', borderRadius:8, padding:'9px 12px', color:'#fff', fontFamily:'Barlow, sans-serif', fontSize:13, outline:'none', boxSizing:'border-box', colorScheme:'dark' }}/>
            </div>
            <div style={{ display:'flex', gap:10 }}>
              <button onClick={()=>setAcceptingOrder(null)} style={{ flex:1, background:'rgba(255,255,255,.06)', border:'1px solid rgba(255,255,255,.1)', borderRadius:8, padding:'10px', color:'rgba(255,255,255,.5)', fontFamily:'Barlow Condensed, sans-serif', fontWeight:700, fontSize:13, letterSpacing:.5, cursor:'pointer' }}>Cancel</button>
              <button disabled={actionLoading===acceptingOrder.id} onClick={()=>{
                const orderId = acceptingOrder.orderId || acceptingOrder.id
                const scheduled = scheduledDate && scheduledTime ? new Date(`${scheduledDate}T${scheduledTime}`).toISOString() : scheduledDate ? new Date(scheduledDate).toISOString() : undefined
                setActionLoading(acceptingOrder.id)
                coachingApi.acceptOrder({ orderId, scheduledAt: scheduled }).then(()=>{
                  setAcceptingOrder(null)
                  setFetchKey(k=>k+1)
                }).catch(()=>{}).finally(()=>setActionLoading(''))
              }} style={{ flex:2, background:'#4ade80', border:'none', borderRadius:8, padding:'10px', color:'#000', fontFamily:'Barlow Condensed, sans-serif', fontWeight:800, fontSize:13, letterSpacing:.8, cursor:'pointer', opacity:actionLoading===acceptingOrder.id?0.6:1 }}>
                {actionLoading===acceptingOrder.id ? 'ACCEPTING...' : 'ACCEPT ORDER'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reject Order Modal */}
      {rejectingOrder&&(
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,.75)', zIndex:1000, display:'flex', alignItems:'center', justifyContent:'center', padding:24 }}
          onClick={e=>e.target===e.currentTarget&&setRejectingOrder(null)}>
          <div style={{ background:'#18181C', border:'1px solid rgba(255,255,255,.1)', borderRadius:14, width:'100%', maxWidth:420, padding:28 }}>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:18 }}>
              <span style={{ fontFamily:'Barlow Condensed, sans-serif', fontWeight:900, fontSize:20, color:'#fff' }}>Reject Order</span>
              <button onClick={()=>setRejectingOrder(null)} style={{ background:'none', border:'none', color:'rgba(255,255,255,.4)', fontSize:20, cursor:'pointer' }}>✕</button>
            </div>
            <div style={{ fontSize:12, color:'rgba(255,255,255,.4)', fontFamily:'Barlow, sans-serif', marginBottom:18 }}>
              {rejectingOrder.buyer} — {rejectingOrder.package}
            </div>
            <div style={{ marginBottom:22 }}>
              <div style={{ fontFamily:'Rajdhani, sans-serif', fontWeight:700, fontSize:11, color:'rgba(255,255,255,.4)', textTransform:'uppercase', letterSpacing:.8, marginBottom:5 }}>Reason (optional)</div>
              <textarea value={rejectReason} onChange={e=>setRejectReason(e.target.value)} rows={3} placeholder="Let the buyer know why..."
                style={{ width:'100%', background:'rgba(255,255,255,.05)', border:'1px solid rgba(255,255,255,.1)', borderRadius:8, padding:'9px 12px', color:'#fff', fontFamily:'Barlow, sans-serif', fontSize:13, outline:'none', resize:'vertical', boxSizing:'border-box' }}/>
            </div>
            <div style={{ display:'flex', gap:10 }}>
              <button onClick={()=>setRejectingOrder(null)} style={{ flex:1, background:'rgba(255,255,255,.06)', border:'1px solid rgba(255,255,255,.1)', borderRadius:8, padding:'10px', color:'rgba(255,255,255,.5)', fontFamily:'Barlow Condensed, sans-serif', fontWeight:700, fontSize:13, letterSpacing:.5, cursor:'pointer' }}>Cancel</button>
              <button disabled={actionLoading===rejectingOrder.id} onClick={()=>{
                const orderId = rejectingOrder.orderId || rejectingOrder.id
                setActionLoading(rejectingOrder.id)
                coachingApi.rejectOrder({ orderId, reason: rejectReason || undefined }).then(()=>{
                  setRejectingOrder(null)
                  setFetchKey(k=>k+1)
                }).catch(()=>{}).finally(()=>setActionLoading(''))
              }} style={{ flex:2, background:'#ef4444', border:'none', borderRadius:8, padding:'10px', color:'#fff', fontFamily:'Barlow Condensed, sans-serif', fontWeight:800, fontSize:13, letterSpacing:.8, cursor:'pointer', opacity:actionLoading===rejectingOrder.id?0.6:1 }}>
                {actionLoading===rejectingOrder.id ? 'REJECTING...' : 'REJECT ORDER'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── EDIT COACH PROFILE MODAL ── */}
      {editCoachModal && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,.75)', zIndex:1000, display:'flex', alignItems:'center', justifyContent:'center', padding:24 }}
          onClick={e=>e.target===e.currentTarget&&setEditCoachModal(false)}>
          <div style={{ background:'#18181C', border:'1px solid rgba(255,255,255,.1)', borderRadius:14, width:'100%', maxWidth:500, padding:28 }}>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:22 }}>
              <span style={{ fontFamily:'Barlow Condensed, sans-serif', fontWeight:900, fontSize:20, color:'#fff', letterSpacing:.5 }}>Edit Coach Profile</span>
              <button onClick={()=>setEditCoachModal(false)} style={{ background:'none', border:'none', color:'rgba(255,255,255,.4)', fontSize:20, cursor:'pointer', lineHeight:1 }}>✕</button>
            </div>

            <div style={{ marginBottom:16 }}>
              <div style={{ fontFamily:'Rajdhani, sans-serif', fontWeight:700, fontSize:11, color:'rgba(255,255,255,.4)', textTransform:'uppercase', letterSpacing:.8, marginBottom:6 }}>Title</div>
              <input value={editTitle} onChange={e=>setEditTitle(e.target.value)} placeholder="e.g. Pro Player & IGL"
                style={{ width:'100%', background:'rgba(255,255,255,.05)', border:'1px solid rgba(255,255,255,.1)', borderRadius:8, padding:'10px 12px', color:'#fff', fontFamily:'Barlow, sans-serif', fontSize:13, outline:'none', boxSizing:'border-box' }}/>
            </div>

            <div style={{ marginBottom:16 }}>
              <div style={{ fontFamily:'Rajdhani, sans-serif', fontWeight:700, fontSize:11, color:'rgba(255,255,255,.4)', textTransform:'uppercase', letterSpacing:.8, marginBottom:6 }}>Bio</div>
              <textarea value={editBio} onChange={e=>setEditBio(e.target.value)} rows={6}
                style={{ width:'100%', background:'rgba(255,255,255,.05)', border:'1px solid rgba(255,255,255,.1)', borderRadius:8, padding:'10px 12px', color:'#fff', fontFamily:'Barlow, sans-serif', fontSize:13, lineHeight:1.75, outline:'none', resize:'vertical', boxSizing:'border-box' }}/>
            </div>

            <div style={{ marginBottom:16 }}>
              <div style={{ fontFamily:'Rajdhani, sans-serif', fontWeight:700, fontSize:11, color:'rgba(255,255,255,.4)', textTransform:'uppercase', letterSpacing:.8, marginBottom:6 }}>Games You Coach</div>
              <div style={{ display:'flex', flexWrap:'wrap', gap:6 }}>
                {games.map((g: any) => {
                  const selected = editGameSlugs.includes(g.slug)
                  return (
                    <button key={g.slug} type="button" onClick={()=>{
                      setEditGameSlugs(prev => selected ? prev.filter(s=>s!==g.slug) : [...prev, g.slug])
                    }} style={{
                      background: selected ? 'rgba(178,45,45,.25)' : 'rgba(255,255,255,.04)',
                      border: `1px solid ${selected ? 'rgba(178,45,45,.5)' : 'rgba(255,255,255,.1)'}`,
                      borderRadius: 6, padding: '6px 12px', cursor: 'pointer',
                      fontFamily: 'Barlow, sans-serif', fontWeight: selected ? 700 : 500, fontSize: 12,
                      color: selected ? '#ff8080' : 'rgba(255,255,255,.45)',
                      transition: 'all .15s',
                    }}>
                      {g.name}
                    </button>
                  )
                })}
              </div>
              {games.length === 0 && <div style={{ fontFamily:'Barlow, sans-serif', fontSize:11, color:'rgba(255,255,255,.25)' }}>No games available</div>}
            </div>

            <div style={{ marginBottom:22 }}>
              <label style={{ display:'flex', alignItems:'center', gap:10, cursor:'pointer' }}>
                <input type="checkbox" checked={editCustomReqs} onChange={e=>setEditCustomReqs(e.target.checked)}
                  style={{ width:16, height:16, accentColor:'#F0AA1A' }}/>
                <div>
                  <div style={{ fontFamily:'Rajdhani, sans-serif', fontWeight:700, fontSize:13, color:'#fff' }}>Enable Custom Requests</div>
                  <div style={{ fontFamily:'Barlow, sans-serif', fontSize:11, color:'rgba(255,255,255,.35)', marginTop:2 }}>Allow users to submit custom coaching requests with their own budget and requirements.</div>
                </div>
              </label>
            </div>

            <div style={{ display:'flex', gap:10 }}>
              <button onClick={()=>setEditCoachModal(false)} style={{ flex:1, background:'rgba(255,255,255,.06)', border:'1px solid rgba(255,255,255,.1)', borderRadius:8, padding:'10px', color:'rgba(255,255,255,.5)', fontFamily:'Barlow Condensed, sans-serif', fontWeight:700, fontSize:13, letterSpacing:.5, cursor:'pointer' }}>
                Cancel
              </button>
              <button disabled={savingProfile} onClick={()=>{
                setSavingProfile(true)
                coachingApi.updateCoachProfile({ bio: editBio, title: editTitle, allowCustomRequests: editCustomReqs, gameSlugs: editGameSlugs }).then(()=>{
                  setCOACH((prev: any) => ({ ...prev, bio: editBio, title: editTitle, allowCustomRequests: editCustomReqs, gameSlugs: editGameSlugs }))
                  setEditCoachModal(false)
                }).catch(()=>{}).finally(()=>setSavingProfile(false))
              }} style={{ flex:2, background:'#B22D2D', border:'none', borderRadius:8, padding:'10px', color:'#fff', fontFamily:'Barlow Condensed, sans-serif', fontWeight:800, fontSize:13, letterSpacing:.8, cursor:'pointer', opacity:savingProfile?0.6:1 }}>
                {savingProfile ? 'SAVING...' : 'SAVE CHANGES'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}