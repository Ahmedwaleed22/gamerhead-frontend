'use client'

import { useState, useEffect, useMemo } from 'react'
import Link from 'next/link'
import { useAuth } from '@/lib/auth-context'
import { coachingApi, gamesApi } from '@/lib/api'

// ─── TYPES ────────────────────────────────────────────────────────────────────
type PackageType = 'vod' | 'session' | 'drills' | 'team'
type SortKey     = 'rating' | 'price_low' | 'price_high' | 'orders' | 'response'

interface CoachListing {
  slug:           string
  name:           string
  emoji:          string
  title:          string
  game:           string
  gameEmoji:      string
  gameSlug:       string
  verified:       boolean
  online:         boolean
  rating:         number
  totalReviews:   number
  totalOrders:    number
  completionRate: number
  responseTime:   string
  memberSince:    string
  specialties:    string[]
  packages:       { type: PackageType; title: string; price: number; deliveryDays: number }[]
  tagline:        string
  accentColor:    string
}


const TYPE_LABELS: Record<PackageType, { label:string; color:string; bg:string; icon:string }> = {
  vod:     { label:'VOD Review',   color:'#60A5FA', bg:'rgba(96,165,250,.12)',  icon:'🎬' },
  session: { label:'Live Session', color:'#4ade80', bg:'rgba(74,222,128,.12)',  icon:'🎙️' },
  drills:  { label:'Drill Plan',   color:'#FB923C', bg:'rgba(251,146,60,.12)',  icon:'⚙️' },
  team:    { label:'Team',         color:'#A78BFA', bg:'rgba(167,139,250,.12)', icon:'👥' },
}

const GAMES_DEFAULT = [
  { label:'All Games', value:'all' },
]

const SERVICE_FILTERS: { label:string; value:PackageType|'all' }[] = [
  { label:'All Services',    value:'all'     },
  { label:'🎬 VOD Review',   value:'vod'     },
  { label:'🎙️ Live Session', value:'session' },
  { label:'⚙️ Drill Plan',   value:'drills'  },
  { label:'👥 Team',         value:'team'    },
]

function Stars({ n, size=10 }: { n:number; size?:number }) {
  return (
    <span style={{ display:'inline-flex', gap:1 }}>
      {[1,2,3,4,5].map(i => (
        <svg key={i} width={size} height={size} viewBox="0 0 24 24" fill={i<=Math.round(n)?'#F0AA1A':'rgba(255,255,255,.15)'}>
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
        </svg>
      ))}
    </span>
  )
}

// ─── COACH CARD ───────────────────────────────────────────────────────────────
function CoachCard({ coach, serviceFilter }: { coach: CoachListing; serviceFilter: PackageType|'all' }) {
  const [hov, setHov] = useState(false)

  const visiblePackages = serviceFilter === 'all'
    ? coach.packages
    : coach.packages.filter(p => p.type === serviceFilter)

  const lowestPrice = Math.min(...coach.packages.map(p => p.price))

  if (serviceFilter !== 'all' && visiblePackages.length === 0) return null

  return (
    <Link
      href={`/coaching/${coach.slug}`}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{ textDecoration:'none', display:'block' }}
    >
      <div style={{
        background: hov ? '#1E1E24' : '#18181C',
        border: `1px solid ${hov ? coach.accentColor + '44' : 'rgba(255,255,255,.07)'}`,
        borderRadius: 14,
        overflow: 'hidden',
        transition: 'all .18s',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
      }}>
        <div style={{ height: 3, background: `linear-gradient(90deg, ${coach.accentColor}, ${coach.accentColor}88, transparent)` }} />

        <div style={{ padding: '18px 20px', flex: 1, display: 'flex', flexDirection: 'column', gap: 14 }}>

          {/* Row 1 — avatar + name + badges */}
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
            <div style={{ position: 'relative', flexShrink: 0 }}>
              <div style={{
                width: 48, height: 48, borderRadius: 10,
                background: `linear-gradient(135deg, ${coach.accentColor}44, ${coach.accentColor}11)`,
                border: `1px solid ${coach.accentColor}33`,
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22,
              }}>
                {coach.emoji}
              </div>
              <div style={{
                position: 'absolute', bottom: 1, right: 1,
                width: 10, height: 10, borderRadius: '50%',
                background: coach.online ? '#4ade80' : '#4B5563',
                border: '2px solid #18181C',
              }} />
            </div>

            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3, flexWrap: 'wrap' }}>
                <span style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 900, fontSize: 16, color: '#fff', letterSpacing: .3 }}>
                  {coach.name}
                </span>
                {/* ✅ KEPT: Verified badge on card */}
                {coach.verified && (
                  <span style={{ background: 'rgba(178,45,45,.18)', border: '1px solid rgba(178,45,45,.35)', borderRadius: 3, padding: '1px 6px', fontSize: 8, fontWeight: 700, color: '#ff8080', fontFamily: 'Rajdhani, sans-serif', letterSpacing: .4, flexShrink: 0 }}>
                    ✓ VERIFIED
                  </span>
                )}
                {/* ✅ KEPT: Online tag on card */}
                {coach.online && (
                  <span style={{ background: 'rgba(74,222,128,.1)', border: '1px solid rgba(74,222,128,.25)', borderRadius: 3, padding: '1px 5px', fontSize: 8, fontWeight: 700, color: '#4ade80', fontFamily: 'Rajdhani, sans-serif', letterSpacing: .3, flexShrink: 0 }}>
                    ONLINE
                  </span>
                )}
              </div>
              <div style={{ fontFamily: 'Barlow, sans-serif', fontSize: 11, color: 'rgba(255,255,255,.4)', marginBottom: 4, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {coach.title}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                <Stars n={coach.rating} />
                <span style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: 12, color: '#F0AA1A' }}>{coach.rating}</span>
                <span style={{ fontFamily: 'Barlow, sans-serif', fontSize: 10, color: 'rgba(255,255,255,.25)' }}>({coach.totalReviews})</span>
                <span style={{ width: 3, height: 3, borderRadius: '50%', background: 'rgba(255,255,255,.15)', margin: '0 2px' }} />
                <span style={{ fontFamily: 'Barlow, sans-serif', fontSize: 10, color: 'rgba(255,255,255,.25)' }}>{coach.totalOrders} orders</span>
              </div>
            </div>
          </div>

          <p style={{
            fontFamily: 'Barlow, sans-serif', fontSize: 12,
            color: 'rgba(255,255,255,.45)', lineHeight: 1.65, margin: 0,
            display: '-webkit-box', WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical', overflow: 'hidden',
          }}>
            {coach.tagline}
          </p>

          <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
            {coach.specialties.slice(0, 3).map((s, i) => (
              <span key={i} style={{
                background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.08)',
                borderRadius: 20, padding: '2px 9px',
                fontFamily: 'Rajdhani, sans-serif', fontWeight: 700, fontSize: 9,
                color: 'rgba(255,255,255,.35)', letterSpacing: .3,
              }}>{s}</span>
            ))}
            {coach.specialties.length > 3 && (
              <span style={{ fontFamily: 'Rajdhani, sans-serif', fontWeight: 700, fontSize: 9, color: 'rgba(255,255,255,.2)', alignSelf: 'center' }}>
                +{coach.specialties.length - 3}
              </span>
            )}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
            {(serviceFilter === 'all' ? coach.packages.slice(0, 3) : visiblePackages).map((pkg, i) => {
              const tp = TYPE_LABELS[pkg.type]
              return (
                <div key={i} style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  background: 'rgba(255,255,255,.03)', border: '1px solid rgba(255,255,255,.06)',
                  borderRadius: 7, padding: '7px 10px',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                    <span style={{ background: tp.bg, border: `1px solid ${tp.color}33`, borderRadius: 4, padding: '1px 6px', fontSize: 8, fontWeight: 700, color: tp.color, fontFamily: 'Rajdhani, sans-serif', letterSpacing: .3 }}>
                      {tp.icon} {tp.label}
                    </span>
                    <span style={{ fontFamily: 'Barlow, sans-serif', fontSize: 11, color: 'rgba(255,255,255,.45)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 140 }}>
                      {pkg.title}
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                    <span style={{ fontFamily: 'Barlow, sans-serif', fontSize: 9, color: 'rgba(255,255,255,.25)' }}>{pkg.deliveryDays}d</span>
                    <span style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 900, fontSize: 14, color: '#4ade80' }}>${pkg.price}</span>
                  </div>
                </div>
              )
            })}
            {serviceFilter === 'all' && coach.packages.length > 3 && (
              <div style={{ fontFamily: 'Barlow, sans-serif', fontSize: 10, color: 'rgba(255,255,255,.2)', paddingLeft: 2 }}>
                +{coach.packages.length - 3} more packages
              </div>
            )}
          </div>
        </div>

        <div style={{
          borderTop: '1px solid rgba(255,255,255,.05)',
          padding: '12px 20px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <div style={{ display: 'flex', gap: 14 }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 900, fontSize: 13, color: '#4ade80' }}>{coach.completionRate}%</div>
              <div style={{ fontFamily: 'Rajdhani, sans-serif', fontSize: 8, fontWeight: 700, color: 'rgba(255,255,255,.2)', textTransform: 'uppercase', letterSpacing: .5 }}>Done</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 900, fontSize: 13, color: '#60A5FA' }}>{coach.responseTime}</div>
              <div style={{ fontFamily: 'Rajdhani, sans-serif', fontSize: 8, fontWeight: 700, color: 'rgba(255,255,255,.2)', textTransform: 'uppercase', letterSpacing: .5 }}>Reply</div>
            </div>
          </div>
          <div style={{
            background: hov ? coach.accentColor : 'rgba(255,255,255,.07)',
            border: `1px solid ${hov ? coach.accentColor : 'rgba(255,255,255,.12)'}`,
            borderRadius: 7, padding: '6px 14px',
            fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 800, fontSize: 11,
            letterSpacing: .7, color: hov ? '#fff' : 'rgba(255,255,255,.5)',
            transition: 'all .18s', whiteSpace: 'nowrap',
          }}>
            FROM ${lowestPrice} · VIEW →
          </div>
        </div>
      </div>
    </Link>
  )
}

// ─── PAGE ─────────────────────────────────────────────────────────────────────
export default function CoachingBrowsePage() {
  const [coaches,       setCoaches]       = useState<CoachListing[]>([])
  const [loading,       setLoading]       = useState(true)
  const [gameFilter,    setGameFilter]    = useState<string>('all')
  const [serviceFilter, setServiceFilter] = useState<PackageType|'all'>('all')
  const [onlineOnly,    setOnlineOnly]    = useState(false)
  const [search,        setSearch]        = useState('')
  const [priceMax,      setPriceMax]      = useState<number|null>(null)
  const [GAMES,         setGAMES]         = useState(GAMES_DEFAULT)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    Promise.all([
      coachingApi.getCoaches(),
      gamesApi.getAll().catch(() => []),
    ]).then(([data, gamesData]: any[]) => {
      if (cancelled) return
      // Build games list from backend
      const gList = Array.isArray(gamesData) ? gamesData : gamesData.games ?? gamesData.data ?? []
      setGAMES([
        { label: 'All Games', value: 'all' },
        ...gList.map((g: any) => ({ label: g.name, value: g.slug })),
      ])
      const list: CoachListing[] = (Array.isArray(data) ? data : data.coaches ?? data.data ?? []).map((c: any) => ({
        slug:           c.slug,
        name:           c.displayName || c.name,
        emoji:          c.emoji,
        title:          c.title,
        game:           c.game,
        gameEmoji:      c.gameEmoji,
        gameSlug:       c.gameSlug,
        verified:       c.isVerified ?? c.verified,
        online:         c.isOnline ?? c.online,
        rating:         c.rating,
        totalReviews:   c.reviewCount ?? c.totalReviews,
        totalOrders:    c.totalOrders,
        completionRate: c.totalOrders > 0 ? Math.round((c.completedOrders / c.totalOrders) * 100) : (c.completionRate ?? 0),
        responseTime:   c.responseTime,
        memberSince:    c.createdAt ? new Date(c.createdAt).toLocaleDateString('en-US', { month:'short', year:'numeric' }) : (c.memberSince ?? ''),
        specialties:    c.specialties ?? [],
        packages:       (c.packages ?? []).filter((p: any) => p.isActive !== false).map((p: any) => ({
          type:         p.type,
          title:        p.title,
          price:        p.price,
          deliveryDays: p.deliveryDays,
        })),
        tagline:        c.bio || c.tagline || '',
        accentColor:    c.accentColor || '#B22D2D',
      }))
      setCoaches(list)
    }).catch(() => {}).finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [])

  const filtered = useMemo(() => {
    let list = [...coaches]
    if (search.trim()) {
      const q = search.toLowerCase()
      list = list.filter(c =>
        c.name.toLowerCase().includes(q) ||
        c.title.toLowerCase().includes(q) ||
        c.specialties.some(s => s.toLowerCase().includes(q)) ||
        c.tagline.toLowerCase().includes(q)
      )
    }
    if (gameFilter !== 'all')    list = list.filter(c => c.gameSlug === gameFilter)
    if (serviceFilter !== 'all') list = list.filter(c => c.packages.some(p => p.type === serviceFilter))
    if (onlineOnly)              list = list.filter(c => c.online)
    if (priceMax !== null)       list = list.filter(c => Math.min(...c.packages.map(p => p.price)) <= priceMax)
    list.sort((a, b) => b.rating - a.rating)
    return list
  }, [coaches, search, gameFilter, serviceFilter, onlineOnly, priceMax])

  return (
    <div style={{ minHeight:'100vh', background:'#0C0C11', paddingBottom:80 }}>

      {/* ── HERO — no breadcrumb, no stat pills, no sort bar ── */}
      <div style={{ background:'linear-gradient(180deg,#13131a 0%,#0C0C11 100%)', borderBottom:'1px solid rgba(255,255,255,.06)', padding:'40px 0 28px' }}>
        <div className="container">
          <h1 style={{ fontFamily:'Barlow Condensed, sans-serif', fontWeight:900, fontSize:40, color:'#fff', letterSpacing:.5, margin:'0 0 8px', lineHeight:1 }}>
            Find a <span style={{ color:'var(--red)' }}>Coach</span>
          </h1>
          <p style={{ fontFamily:'Barlow, sans-serif', fontSize:14, color:'rgba(255,255,255,.4)', margin:0, lineHeight:1.6 }}>
            Hire verified competitive coaches. VOD reviews, live sessions, drill plans & team coaching.
          </p>
        </div>
      </div>

      <div className="container" style={{ marginTop:24 }}>
        <div style={{ display:'grid', gridTemplateColumns:'220px 1fr', gap:24, alignItems:'start' }}>

          {/* ── LEFT SIDEBAR ── */}
          <div style={{ position:'sticky', top:20, display:'flex', flexDirection:'column', gap:12 }}>

            <div style={{ background:'#18181C', border:'1px solid rgba(255,255,255,.08)', borderRadius:12, padding:'14px 16px' }}>
              <div style={{ fontFamily:'Rajdhani, sans-serif', fontWeight:700, fontSize:10, color:'rgba(255,255,255,.3)', textTransform:'uppercase', letterSpacing:.8, marginBottom:8 }}>Search</div>
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Name, specialty..."
                style={{ width:'100%', background:'rgba(255,255,255,.05)', border:'1px solid rgba(255,255,255,.1)', borderRadius:7, padding:'7px 10px', color:'#fff', fontFamily:'Barlow, sans-serif', fontSize:12, outline:'none', boxSizing:'border-box' }}
              />
            </div>

            <div style={{ background:'#18181C', border:'1px solid rgba(255,255,255,.08)', borderRadius:12, padding:'14px 16px' }}>
              <div style={{ fontFamily:'Rajdhani, sans-serif', fontWeight:700, fontSize:10, color:'rgba(255,255,255,.3)', textTransform:'uppercase', letterSpacing:.8, marginBottom:10 }}>Service Type</div>
              <div style={{ display:'flex', flexDirection:'column', gap:4 }}>
                {SERVICE_FILTERS.map(f => (
                  <button key={f.value} onClick={() => setServiceFilter(f.value)} style={{
                    background: serviceFilter===f.value ? 'rgba(178,45,45,.18)' : 'rgba(255,255,255,.03)',
                    border: `1px solid ${serviceFilter===f.value ? 'rgba(178,45,45,.4)' : 'rgba(255,255,255,.07)'}`,
                    borderRadius: 7, padding: '7px 10px', textAlign:'left', cursor:'pointer',
                    fontFamily:'Barlow, sans-serif', fontWeight:600, fontSize:12,
                    color: serviceFilter===f.value ? '#ff8080' : 'rgba(255,255,255,.45)',
                    transition:'all .15s',
                  }}>
                    {f.label}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ background:'#18181C', border:'1px solid rgba(255,255,255,.08)', borderRadius:12, padding:'14px 16px' }}>
              <div style={{ fontFamily:'Rajdhani, sans-serif', fontWeight:700, fontSize:10, color:'rgba(255,255,255,.3)', textTransform:'uppercase', letterSpacing:.8, marginBottom:10 }}>Game</div>
              <div style={{ display:'flex', flexDirection:'column', gap:4 }}>
                {GAMES.map(g => (
                  <button key={g.value} onClick={() => setGameFilter(g.value)} style={{
                    background: gameFilter===g.value ? 'rgba(178,45,45,.18)' : 'rgba(255,255,255,.03)',
                    border: `1px solid ${gameFilter===g.value ? 'rgba(178,45,45,.4)' : 'rgba(255,255,255,.07)'}`,
                    borderRadius: 7, padding: '7px 10px', textAlign:'left', cursor:'pointer',
                    fontFamily:'Barlow, sans-serif', fontWeight:600, fontSize:12,
                    color: gameFilter===g.value ? '#ff8080' : 'rgba(255,255,255,.45)',
                    transition:'all .15s',
                  }}>
                    {g.label}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ background:'#18181C', border:'1px solid rgba(255,255,255,.08)', borderRadius:12, padding:'14px 16px' }}>
              <div style={{ fontFamily:'Rajdhani, sans-serif', fontWeight:700, fontSize:10, color:'rgba(255,255,255,.3)', textTransform:'uppercase', letterSpacing:.8, marginBottom:10 }}>Max Starting Price</div>
              <div style={{ display:'flex', flexDirection:'column', gap:4 }}>
                {[
                  { label:'Any price',  val:null },
                  { label:'Under $20',  val:20   },
                  { label:'Under $35',  val:35   },
                  { label:'Under $50',  val:50   },
                  { label:'Under $100', val:100  },
                ].map(p => (
                  <button key={String(p.val)} onClick={() => setPriceMax(p.val)} style={{
                    background: priceMax===p.val ? 'rgba(178,45,45,.18)' : 'rgba(255,255,255,.03)',
                    border: `1px solid ${priceMax===p.val ? 'rgba(178,45,45,.4)' : 'rgba(255,255,255,.07)'}`,
                    borderRadius: 7, padding: '7px 10px', textAlign:'left', cursor:'pointer',
                    fontFamily:'Barlow, sans-serif', fontWeight:600, fontSize:12,
                    color: priceMax===p.val ? '#ff8080' : 'rgba(255,255,255,.45)',
                    transition:'all .15s',
                  }}>
                    {p.label}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ background:'#18181C', border:'1px solid rgba(255,255,255,.08)', borderRadius:12, padding:'14px 16px' }}>
              <button
                onClick={() => setOnlineOnly(!onlineOnly)}
                style={{ width:'100%', display:'flex', alignItems:'center', justifyContent:'space-between', background:'none', border:'none', cursor:'pointer', padding:0 }}
              >
                <span style={{ fontFamily:'Barlow, sans-serif', fontWeight:600, fontSize:12, color: onlineOnly ? '#4ade80' : 'rgba(255,255,255,.45)' }}>
                  🟢 Online Now Only
                </span>
                <div style={{
                  width:34, height:18, borderRadius:9,
                  background: onlineOnly ? '#4ade80' : 'rgba(255,255,255,.1)',
                  border: `1px solid ${onlineOnly ? '#4ade80' : 'rgba(255,255,255,.15)'}`,
                  position:'relative', transition:'all .2s', flexShrink:0,
                }}>
                  <div style={{
                    width:12, height:12, borderRadius:'50%', background:'#fff',
                    position:'absolute', top:2,
                    left: onlineOnly ? 18 : 2,
                    transition:'left .2s',
                  }}/>
                </div>
              </button>
            </div>

            {(gameFilter!=='all'||serviceFilter!=='all'||onlineOnly||priceMax!==null||search) && (
              <button
                onClick={() => { setGameFilter('all'); setServiceFilter('all'); setOnlineOnly(false); setPriceMax(null); setSearch('') }}
                style={{ background:'rgba(178,45,45,.1)', border:'1px solid rgba(178,45,45,.25)', borderRadius:8, padding:'8px', fontFamily:'Rajdhani, sans-serif', fontWeight:700, fontSize:11, color:'rgba(255,100,100,.7)', cursor:'pointer', letterSpacing:.4 }}
              >
                ✕ Clear All Filters
              </button>
            )}
          </div>

          {/* ── RIGHT — results only, no sort pills ── */}
          <div>
            <div style={{ marginBottom:16 }}>
              <span style={{ fontFamily:'Rajdhani, sans-serif', fontWeight:700, fontSize:11, color:'rgba(255,255,255,.3)', letterSpacing:.4 }}>
                {filtered.length} coach{filtered.length!==1?'es':''} found
              </span>
            </div>

            {filtered.length > 0 ? (
              <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(300px,1fr))', gap:14 }}>
                {filtered.map(coach => (
                  <CoachCard key={coach.slug} coach={coach} serviceFilter={serviceFilter} />
                ))}
              </div>
            ) : (
              <div style={{ background:'#18181C', border:'1px solid rgba(255,255,255,.07)', borderRadius:14, padding:'60px 24px', textAlign:'center' }}>
                <div style={{ fontSize:40, marginBottom:16 }}>🔍</div>
                <div style={{ fontFamily:'Barlow Condensed, sans-serif', fontWeight:900, fontSize:22, color:'#fff', marginBottom:8, letterSpacing:.5 }}>No coaches found</div>
                <p style={{ fontFamily:'Barlow, sans-serif', fontSize:13, color:'rgba(255,255,255,.35)', marginBottom:20, lineHeight:1.6 }}>
                  Try adjusting your filters or removing the online-only toggle.
                </p>
                <button
                  onClick={() => { setGameFilter('all'); setServiceFilter('all'); setOnlineOnly(false); setPriceMax(null); setSearch('') }}
                  style={{ background:'#B22D2D', border:'none', borderRadius:8, padding:'10px 24px', fontFamily:'Barlow Condensed, sans-serif', fontWeight:800, fontSize:13, letterSpacing:.8, color:'#fff', cursor:'pointer' }}
                >
                  CLEAR FILTERS
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}