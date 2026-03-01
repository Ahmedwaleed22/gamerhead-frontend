'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'
import { coachingApi } from '@/lib/api'

// ─── TYPES ────────────────────────────────────────────────────────────────────
type PackageType = 'vod' | 'session' | 'drills' | 'team' | 'custom'

interface Package {
  id: string
  title: string
  type: PackageType
  price: number
  deliveryDays: number
  description: string
  includes: string[]
  popular?: boolean
  orders: number
  rating: number
  reviews: number
}

interface Review {
  buyer: string
  buyerEmoji: string
  rating: number
  text: string
  package: string
  date: string
  helpful: number
}


// ─── CONFIG ───────────────────────────────────────────────────────────────────
const TYPE_LABELS: Record<PackageType, { label:string; color:string; bg:string }> = {
  vod:     { label:'VOD Review',    color:'#60A5FA', bg:'rgba(96,165,250,.12)'  },
  session: { label:'Live Session',  color:'#4ade80', bg:'rgba(74,222,128,.12)'  },
  drills:  { label:'Drill Plan',    color:'#FB923C', bg:'rgba(251,146,60,.12)'  },
  team:    { label:'Team Coaching', color:'#A78BFA', bg:'rgba(167,139,250,.12)' },
  custom:  { label:'Custom',        color:'#F0AA1A', bg:'rgba(240,170,26,.12)'  },
}

const TYPE_ICONS: Record<PackageType, string> = {
  vod:'🎬', session:'🎙️', drills:'⚙️', team:'👥', custom:'✨',
}

const SOCIAL_ICONS: Record<string,React.ReactNode> = {
  twitch:  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M11.571 4.714h1.715v5.143H11.57zm4.715 0H18v5.143h-1.714zM6 0L1.714 4.286v15.428h5.143V24l4.286-4.286h3.428L22.286 12V0zm14.571 11.143l-3.428 3.428h-3.429l-3 3v-3H6.857V1.714h13.714z"/></svg>,
  twitter: <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>,
  youtube: <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>,
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

// ─── HIRE MODAL — fires when user clicks a package ───────────────────────────
// Creates a mailbox thread with the coach pre-seeded with the package info.
// Coach can then accept, counter-offer, or send a custom offer from their dashboard.
function HireModal({ pkg, coach, onClose }: { pkg: Package; coach: any; onClose:()=>void }) {
  const [step, setStep]       = useState<1|2>(1)
  const [sending, setSending] = useState(false)
  const [message, setMessage] = useState(`Hi ${coach.name}! I'm interested in your "${pkg.title}" package ($${pkg.price}). Looking forward to working with you.`)
  const tp = TYPE_LABELS[pkg.type]

  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,.8)', zIndex:1000, display:'flex', alignItems:'center', justifyContent:'center', padding:24 }}
      onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div style={{ background:'#18181C', border:'1px solid rgba(255,255,255,.1)', borderRadius:16, width:'100%', maxWidth:500, padding:28, boxShadow:'0 24px 60px rgba(0,0,0,.6)' }}>

        {step===1&&(
          <>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:20 }}>
              <span style={{ fontFamily:'Barlow Condensed, sans-serif', fontWeight:900, fontSize:22, color:'#fff', letterSpacing:.5 }}>Confirm Package</span>
              <button onClick={onClose} style={{ background:'none', border:'none', color:'rgba(255,255,255,.4)', fontSize:20, cursor:'pointer', lineHeight:1 }}>✕</button>
            </div>

            {/* Package summary */}
            <div style={{ background:'rgba(255,255,255,.04)', border:'1px solid rgba(255,255,255,.08)', borderRadius:10, padding:'14px 16px', marginBottom:18 }}>
              <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:8 }}>
                <span style={{ background:tp.bg, border:`1px solid ${tp.color}33`, borderRadius:4, padding:'2px 8px', fontSize:9, fontWeight:700, color:tp.color, fontFamily:'Rajdhani, sans-serif', letterSpacing:.3 }}>{TYPE_ICONS[pkg.type]} {tp.label}</span>
                {pkg.popular&&<span style={{ background:'rgba(178,45,45,.15)', border:'1px solid rgba(178,45,45,.3)', borderRadius:4, padding:'2px 8px', fontSize:9, fontWeight:700, color:'#ff8080', fontFamily:'Rajdhani, sans-serif', letterSpacing:.3 }}>MOST POPULAR</span>}
              </div>
              <div style={{ fontFamily:'Barlow Condensed, sans-serif', fontWeight:900, fontSize:18, color:'#fff', marginBottom:6 }}>{pkg.title}</div>
              <div style={{ display:'flex', gap:16, flexWrap:'wrap' }}>
                <div>
                  <div style={{ fontFamily:'Barlow Condensed, sans-serif', fontWeight:900, fontSize:22, color:'#4ade80' }}>${pkg.price}</div>
                  <div style={{ fontSize:9, color:'rgba(255,255,255,.3)', fontFamily:'Barlow, sans-serif' }}>One-time payment</div>
                </div>
                <div>
                  <div style={{ fontFamily:'Barlow Condensed, sans-serif', fontWeight:900, fontSize:22, color:'#fff' }}>{pkg.deliveryDays}d</div>
                  <div style={{ fontSize:9, color:'rgba(255,255,255,.3)', fontFamily:'Barlow, sans-serif' }}>Delivery</div>
                </div>
              </div>
            </div>

            {/* Includes */}
            <div style={{ marginBottom:18 }}>
              <div style={{ fontFamily:'Rajdhani, sans-serif', fontWeight:700, fontSize:10, color:'rgba(255,255,255,.3)', textTransform:'uppercase', letterSpacing:.8, marginBottom:8 }}>What's included</div>
              {pkg.includes.map((inc,i)=>(
                <div key={i} style={{ display:'flex', alignItems:'center', gap:8, marginBottom:5 }}>
                  <span style={{ color:'#4ade80', fontSize:10 }}>✓</span>
                  <span style={{ fontFamily:'Barlow, sans-serif', fontSize:12, color:'rgba(255,255,255,.55)' }}>{inc}</span>
                </div>
              ))}
            </div>

            {/* Message to coach */}
            <div style={{ marginBottom:20 }}>
              <div style={{ fontFamily:'Rajdhani, sans-serif', fontWeight:700, fontSize:10, color:'rgba(255,255,255,.3)', textTransform:'uppercase', letterSpacing:.8, marginBottom:6 }}>Message to Coach</div>
              <textarea value={message} onChange={e=>setMessage(e.target.value)} rows={3}
                style={{ width:'100%', background:'rgba(255,255,255,.05)', border:'1px solid rgba(255,255,255,.1)', borderRadius:8, padding:'10px 12px', color:'#fff', fontFamily:'Barlow, sans-serif', fontSize:12, outline:'none', resize:'vertical', boxSizing:'border-box', lineHeight:1.6 }}/>
              <div style={{ fontSize:10, color:'rgba(255,255,255,.2)', fontFamily:'Barlow, sans-serif', marginTop:4 }}>This opens a mailbox thread. The coach will review and confirm — no charge until both sides agree.</div>
            </div>

            <button disabled={sending} onClick={()=>{
              setSending(true)
              coachingApi.hire({ packageId: pkg.id, message, coachSlug: coach.slug ?? coach.name })
                .then(()=>setStep(2))
                .catch(()=>setStep(2))
                .finally(()=>setSending(false))
            }} style={{ width:'100%', background:'#B22D2D', border:'none', borderRadius:8, padding:'12px', fontFamily:'Barlow Condensed, sans-serif', fontWeight:800, fontSize:14, letterSpacing:.8, color:'#fff', cursor:'pointer', opacity: sending ? 0.6 : 1 }}>
              {sending ? 'SENDING...' : 'SEND REQUEST →'}
            </button>
          </>
        )}

        {step===2&&(
          <div style={{ textAlign:'center', padding:'12px 0' }}>
            <div style={{ fontSize:48, marginBottom:16 }}>📬</div>
            <div style={{ fontFamily:'Barlow Condensed, sans-serif', fontWeight:900, fontSize:24, color:'#fff', marginBottom:8, letterSpacing:.5 }}>Request Sent!</div>
            <p style={{ fontFamily:'Barlow, sans-serif', fontSize:13, color:'rgba(255,255,255,.45)', lineHeight:1.7, marginBottom:24, maxWidth:340, margin:'0 auto 24px' }}>
              Your message has been sent to <strong style={{ color:'#fff' }}>{coach.name}</strong>. They typically respond in {coach.responseTime}. You'll be notified when they accept, counter-offer, or create a custom package for you.
            </p>
            <div style={{ background:'rgba(255,255,255,.04)', border:'1px solid rgba(255,255,255,.08)', borderRadius:10, padding:'12px 16px', marginBottom:24, textAlign:'left' }}>
              <div style={{ fontFamily:'Rajdhani, sans-serif', fontSize:10, fontWeight:700, color:'rgba(255,255,255,.3)', textTransform:'uppercase', letterSpacing:.8, marginBottom:6 }}>What happens next</div>
              {['Coach reviews your request','They accept, edit, or create a custom offer','You review and confirm the final offer','Payment is taken — coaching begins'].map((step,i)=>(
                <div key={i} style={{ display:'flex', gap:10, marginBottom:6, alignItems:'flex-start' }}>
                  <span style={{ width:16, height:16, borderRadius:'50%', background:'rgba(178,45,45,.2)', border:'1px solid rgba(178,45,45,.4)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:8, fontWeight:700, color:'#ff8080', flexShrink:0, fontFamily:'Roboto, sans-serif', marginTop:1 }}>{i+1}</span>
                  <span style={{ fontFamily:'Barlow, sans-serif', fontSize:12, color:'rgba(255,255,255,.5)' }}>{step}</span>
                </div>
              ))}
            </div>
            <div style={{ display:'flex', gap:10 }}>
              <button onClick={onClose} style={{ flex:1, background:'rgba(255,255,255,.07)', border:'1px solid rgba(255,255,255,.12)', borderRadius:8, padding:'10px', fontFamily:'Barlow Condensed, sans-serif', fontWeight:700, fontSize:12, letterSpacing:.5, color:'rgba(255,255,255,.5)', cursor:'pointer' }}>
                Close
              </button>
              <Link href="/messages" style={{ flex:2, background:'#B22D2D', border:'none', borderRadius:8, padding:'10px', fontFamily:'Barlow Condensed, sans-serif', fontWeight:800, fontSize:12, letterSpacing:.8, color:'#fff', cursor:'pointer', textDecoration:'none', display:'flex', alignItems:'center', justifyContent:'center' }}>
                VIEW MAILBOX →
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── PAGE ─────────────────────────────────────────────────────────────────────
export default function CoachPackagePage() {
  const params       = useParams()
  const slug         = params.coachSlug as string
  const [coach, setCoach]     = useState<any>(null)
  const [packages, setPackages] = useState<Package[]>([])
  const [reviews, setReviews] = useState<Review[]>([])
  const [loading, setLoading] = useState(true)
  const [hiring, setHiring]   = useState<Package|null>(null)
  const [tab, setTab]         = useState<'packages'|'reviews'>('packages')
  const [showFullBio, setShowFullBio] = useState(false)

  useEffect(() => {
    if (!slug) return
    let cancelled = false
    setLoading(true)
    Promise.all([
      coachingApi.getCoach(slug),
      coachingApi.getCoachReviews(slug),
    ]).then(([coachData, reviewsData]: [any, any]) => {
      if (cancelled) return
      const c = coachData
      const rating = c.reviewCount > 0 ? parseFloat((c.ratingSum / c.reviewCount).toFixed(1)) : (c.rating || 0)
      setCoach({
        name:           c.displayName || c.name,
        emoji:          c.emoji,
        title:          c.title,
        game:           c.game,
        gameEmoji:      c.gameEmoji,
        gameSlug:       c.gameSlug,
        verified:       c.isVerified ?? c.verified,
        level:          c.level,
        memberSince:    c.createdAt ? new Date(c.createdAt).toLocaleDateString('en-US', { month:'short', year:'numeric' }) : (c.memberSince ?? ''),
        responseTime:   c.responseTime,
        completionRate: c.totalOrders > 0 ? Math.round((c.completedOrders / c.totalOrders) * 100) : (c.completionRate ?? 0),
        totalOrders:    c.totalOrders,
        rating,
        totalReviews:   c.reviewCount ?? c.totalReviews ?? 0,
        online:         c.isOnline ?? c.online,
        bio:            c.bio ?? '',
        specialties:    c.specialties ?? [],
        socials:        c.socials ?? {},
        slug:           c.slug,
      })
      setPackages((c.packages ?? []).map((p: any) => ({
        id:           p.id,
        title:        p.title,
        type:         p.type,
        price:        p.price,
        deliveryDays: p.deliveryDays,
        description:  p.description ?? '',
        includes:     p.includes ?? [],
        popular:      p.popular ?? false,
        orders:       p.orders ?? 0,
        rating:       p.rating ?? 0,
        reviews:      p.reviews ?? 0,
      })))
      const revArr = Array.isArray(reviewsData) ? reviewsData : reviewsData.items ?? reviewsData.reviews ?? reviewsData.data ?? []
      setReviews(revArr.map((r: any) => ({
        buyer:      r.buyerName || r.buyer || 'User',
        buyerEmoji: r.buyerEmoji || '👤',
        rating:     r.rating,
        text:       r.text,
        package:    r.packageTitle || r.package || '',
        date:       r.createdAt ? new Date(r.createdAt).toLocaleDateString('en-US', { month:'short', day:'numeric', year:'numeric' }) : (r.date || ''),
        helpful:    r.helpfulCount ?? r.helpful ?? 0,
      })))
    }).catch(() => {}).finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [slug])

  if (loading || !coach) {
    return (
      <div style={{ minHeight:'100vh', background:'#0C0C11', display:'flex', alignItems:'center', justifyContent:'center' }}>
        <div style={{ fontFamily:'Barlow Condensed, sans-serif', fontWeight:900, fontSize:18, color:'rgba(255,255,255,.4)', letterSpacing:.5 }}>Loading coach...</div>
      </div>
    )
  }

  const COACH = coach
  const PACKAGES = packages
  const REVIEWS = reviews

  const bioLines   = COACH.bio.split('\n\n')
  const displayBio = showFullBio ? COACH.bio : bioLines[0]

  return (
    <div style={{ minHeight:'100vh', background:'#0C0C11', paddingBottom:80 }}>

      {/* ── COACH HERO ── */}
      <div style={{ background:'linear-gradient(180deg,#13131a 0%,#0C0C11 100%)', borderBottom:'1px solid rgba(255,255,255,.06)', padding:'28px 0 24px' }}>
        <div className="container">
          <div style={{ display:'grid', gridTemplateColumns:'1fr auto', gap:24, alignItems:'start' }}>

            {/* Left: coach identity */}
            <div style={{ display:'flex', gap:18, alignItems:'flex-start' }}>
              {/* Avatar */}
              <div style={{ position:'relative', flexShrink:0 }}>
                <div style={{ width:72, height:72, borderRadius:16, background:'linear-gradient(135deg,#B22D2D,#7a1a1a)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:34, border:'2px solid rgba(178,45,45,.35)' }}>
                  {COACH.emoji}
                </div>
                {/* Online dot */}
                <div style={{ position:'absolute', bottom:3, right:3, width:12, height:12, borderRadius:'50%', background:COACH.online?'#4ade80':'#6B7280', border:'2px solid #0C0C11' }}/>
              </div>

              <div>
                {/* Name + badges */}
                <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:5, flexWrap:'wrap' }}>
                  <span style={{ fontFamily:'Barlow Condensed, sans-serif', fontWeight:900, fontSize:26, color:'#fff', letterSpacing:.5 }}>{COACH.name}</span>
                  <span style={{ background:'rgba(178,45,45,.18)', border:'1px solid rgba(178,45,45,.4)', borderRadius:4, padding:'2px 8px', fontSize:9, fontWeight:700, color:'#ff8080', fontFamily:'Rajdhani, sans-serif', letterSpacing:.5 }}>✓ VERIFIED COACH</span>
                  <span style={{ background:COACH.online?'rgba(74,222,128,.1)':'rgba(107,114,128,.1)', border:`1px solid ${COACH.online?'rgba(74,222,128,.3)':'rgba(107,114,128,.25)'}`, borderRadius:4, padding:'2px 8px', fontSize:9, fontWeight:700, color:COACH.online?'#4ade80':'#6B7280', fontFamily:'Rajdhani, sans-serif', letterSpacing:.4 }}>
                    {COACH.online?'● ONLINE':'OFFLINE'}
                  </span>
                </div>

                <div style={{ fontFamily:'Barlow, sans-serif', fontSize:13, color:'rgba(255,255,255,.45)', marginBottom:10 }}>
                  {COACH.title} · <Link href={`/games/${COACH.gameSlug}`} style={{ color:'rgba(255,255,255,.45)', textDecoration:'none' }}>{COACH.gameEmoji} {COACH.game}</Link>
                </div>

                {/* Quick stats row */}
                <div style={{ display:'flex', gap:16, flexWrap:'wrap' }}>
                  {[
                    { val:`${COACH.rating}`, label:'Rating', icon:'★', color:'#F0AA1A' },
                    { val:`${COACH.totalReviews}`, label:'Reviews', icon:'💬', color:'rgba(255,255,255,.6)' },
                    { val:`${COACH.totalOrders}`, label:'Orders', icon:'📦', color:'rgba(255,255,255,.6)' },
                    { val:`${COACH.completionRate}%`, label:'Completion', icon:'✓', color:'#4ade80' },
                    { val:COACH.responseTime, label:'Response', icon:'⚡', color:'#60A5FA' },
                  ].map((s,i)=>(
                    <div key={i} style={{ display:'flex', alignItems:'center', gap:5 }}>
                      <span style={{ fontFamily:'Barlow Condensed, sans-serif', fontWeight:900, fontSize:15, color:s.color }}>{s.icon} {s.val}</span>
                      <span style={{ fontFamily:'Rajdhani, sans-serif', fontSize:9, fontWeight:700, color:'rgba(255,255,255,.25)', textTransform:'uppercase', letterSpacing:.7 }}>{s.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Right: socials + member since */}
            <div style={{ display:'flex', flexDirection:'column', alignItems:'flex-end', gap:10 }}>
              <div style={{ display:'flex', gap:7 }}>
                {Object.entries(COACH.socials).map(([platform, handle])=>(
                  <a key={platform} href="#" title={`${platform}: ${handle}`} style={{ width:32, height:32, background:'rgba(255,255,255,.07)', border:'1px solid rgba(255,255,255,.12)', borderRadius:8, display:'flex', alignItems:'center', justifyContent:'center', textDecoration:'none', color:'rgba(255,255,255,.5)' }}>
                    {SOCIAL_ICONS[platform]}
                  </a>
                ))}
              </div>
              <div style={{ fontFamily:'Barlow, sans-serif', fontSize:10, color:'rgba(255,255,255,.25)' }}>Member since {COACH.memberSince}</div>
            </div>
          </div>
        </div>
      </div>

      {/* ── BODY ── */}
      <div className="container" style={{ marginTop:28 }}>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 320px', gap:24, alignItems:'start' }}>

          {/* ── LEFT: bio + tabs ── */}
          <div>
            {/* Bio */}
            <div style={{ background:'#18181C', border:'1px solid rgba(255,255,255,.07)', borderRadius:12, padding:'20px 22px', marginBottom:20 }}>
              <div style={{ fontFamily:'Rajdhani, sans-serif', fontWeight:700, fontSize:10, color:'rgba(255,255,255,.3)', textTransform:'uppercase', letterSpacing:.8, marginBottom:10 }}>About</div>
              <p style={{ fontFamily:'Barlow, sans-serif', fontSize:13, color:'rgba(255,255,255,.55)', lineHeight:1.75, margin:'0 0 10px', whiteSpace:'pre-line' }}>{displayBio}</p>
              {!showFullBio&&<button onClick={()=>setShowFullBio(true)} style={{ background:'none', border:'none', fontSize:11, fontWeight:700, color:'rgba(255,255,255,.3)', fontFamily:'Rajdhani, sans-serif', cursor:'pointer', padding:0, letterSpacing:.3 }}>Read more ▾</button>}

              {/* Specialties */}
              <div style={{ display:'flex', gap:6, flexWrap:'wrap', marginTop:14 }}>
                {COACH.specialties.map((s: string,i: number)=>(
                  <span key={i} style={{ background:'rgba(255,255,255,.05)', border:'1px solid rgba(255,255,255,.09)', borderRadius:20, padding:'4px 12px', fontFamily:'Rajdhani, sans-serif', fontWeight:700, fontSize:10, color:'rgba(255,255,255,.45)', letterSpacing:.3 }}>{s}</span>
                ))}
              </div>
            </div>

            {/* Tabs */}
            <div style={{ display:'flex', gap:4, borderBottom:'1px solid rgba(255,255,255,.07)', marginBottom:18 }}>
              {[
                { key:'packages', label:`Packages (${PACKAGES.length})` },
                { key:'reviews',  label:`Reviews (${COACH.totalReviews})` },
              ].map(t=>(
                <button key={t.key} onClick={()=>setTab(t.key as any)} style={{
                  background:'none', border:'none', borderBottom:`2px solid ${tab===t.key?'#B22D2D':'transparent'}`,
                  padding:'8px 18px', fontFamily:'Barlow Condensed, sans-serif', fontWeight:800, fontSize:13,
                  letterSpacing:.6, color:tab===t.key?'#fff':'rgba(255,255,255,.35)',
                  cursor:'pointer', transition:'color .15s', marginBottom:-1,
                }}>
                  {t.label}
                </button>
              ))}
            </div>

            {/* ── PACKAGES ── */}
            {tab==='packages'&&(
              <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
                {PACKAGES.map(pkg=>{
                  const tp = TYPE_LABELS[pkg.type]
                  return (
                    <div key={pkg.id} style={{ background:'#18181C', border:`1px solid ${pkg.popular?'rgba(178,45,45,.3)':'rgba(255,255,255,.07)'}`, borderRadius:12, padding:'20px 22px', position:'relative', overflow:'hidden' }}>
                      {pkg.popular&&<div style={{ position:'absolute', top:0, left:0, right:0, height:2, background:'linear-gradient(90deg,#B22D2D,#ff8080,#B22D2D)' }}/>}

                      <div style={{ display:'grid', gridTemplateColumns:'1fr auto', gap:16, alignItems:'start' }}>
                        <div>
                          {/* Type badge + popular */}
                          <div style={{ display:'flex', gap:7, marginBottom:8, flexWrap:'wrap' }}>
                            <span style={{ background:tp.bg, border:`1px solid ${tp.color}33`, borderRadius:4, padding:'2px 8px', fontSize:9, fontWeight:700, color:tp.color, fontFamily:'Rajdhani, sans-serif', letterSpacing:.3 }}>{TYPE_ICONS[pkg.type]} {tp.label}</span>
                            {pkg.popular&&<span style={{ background:'rgba(178,45,45,.15)', border:'1px solid rgba(178,45,45,.3)', borderRadius:4, padding:'2px 8px', fontSize:9, fontWeight:700, color:'#ff8080', fontFamily:'Rajdhani, sans-serif', letterSpacing:.3 }}>🔥 MOST POPULAR</span>}
                          </div>

                          <div style={{ fontFamily:'Barlow Condensed, sans-serif', fontWeight:900, fontSize:20, color:'#fff', letterSpacing:.3, marginBottom:8 }}>{pkg.title}</div>

                          <p style={{ fontFamily:'Barlow, sans-serif', fontSize:12, color:'rgba(255,255,255,.45)', lineHeight:1.7, margin:'0 0 12px' }}>{pkg.description}</p>

                          {/* Includes grid */}
                          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'4px 16px' }}>
                            {pkg.includes.map((inc,i)=>(
                              <div key={i} style={{ display:'flex', alignItems:'center', gap:6 }}>
                                <span style={{ color:'#4ade80', fontSize:9, flexShrink:0 }}>✓</span>
                                <span style={{ fontFamily:'Barlow, sans-serif', fontSize:11, color:'rgba(255,255,255,.45)' }}>{inc}</span>
                              </div>
                            ))}
                          </div>

                          {/* Meta: orders + rating */}
                          <div style={{ display:'flex', gap:14, marginTop:14, alignItems:'center' }}>
                            <div style={{ display:'flex', alignItems:'center', gap:4 }}>
                              <Stars n={Math.round(pkg.rating)} size={11}/>
                              <span style={{ fontFamily:'Barlow Condensed, sans-serif', fontWeight:700, fontSize:12, color:'#F0AA1A' }}>{pkg.rating}</span>
                              <span style={{ fontFamily:'Barlow, sans-serif', fontSize:10, color:'rgba(255,255,255,.25)' }}>({pkg.reviews})</span>
                            </div>
                            <span style={{ fontSize:10, color:'rgba(255,255,255,.25)', fontFamily:'Barlow, sans-serif' }}>{pkg.orders} orders completed</span>
                            <span style={{ fontSize:10, color:'rgba(255,255,255,.25)', fontFamily:'Barlow, sans-serif' }}>{pkg.deliveryDays}-day delivery</span>
                          </div>
                        </div>

                        {/* Right: price + CTA */}
                        <div style={{ display:'flex', flexDirection:'column', alignItems:'flex-end', gap:10, minWidth:110 }}>
                          <div style={{ textAlign:'right' }}>
                            <div style={{ fontFamily:'Barlow Condensed, sans-serif', fontWeight:900, fontSize:28, color:'#4ade80', lineHeight:1 }}>${pkg.price}</div>
                            <div style={{ fontFamily:'Barlow, sans-serif', fontSize:10, color:'rgba(255,255,255,.25)', marginTop:2 }}>per order</div>
                          </div>
                          <button
                            onClick={()=>setHiring(pkg)}
                            style={{
                              background: pkg.popular ? '#B22D2D' : 'rgba(255,255,255,.07)',
                              border: pkg.popular ? 'none' : '1px solid rgba(255,255,255,.14)',
                              borderRadius:8, padding:'9px 20px',
                              fontFamily:'Barlow Condensed, sans-serif', fontWeight:800, fontSize:12,
                              letterSpacing:.8, color: pkg.popular ? '#fff' : 'rgba(255,255,255,.7)',
                              cursor:'pointer', whiteSpace:'nowrap', transition:'all .15s',
                            }}
                            onMouseEnter={e=>{if(!pkg.popular){e.currentTarget.style.background='rgba(255,255,255,.12)';e.currentTarget.style.color='#fff'}}}
                            onMouseLeave={e=>{if(!pkg.popular){e.currentTarget.style.background='rgba(255,255,255,.07)';e.currentTarget.style.color='rgba(255,255,255,.7)'}}}
                          >
                            HIRE NOW →
                          </button>
                        </div>
                      </div>
                    </div>
                  )
                })}

                {/* Custom order CTA */}
                <div style={{ background:'rgba(240,170,26,.05)', border:'1px dashed rgba(240,170,26,.25)', borderRadius:12, padding:'18px 22px', display:'flex', alignItems:'center', justifyContent:'space-between', gap:16, flexWrap:'wrap' }}>
                  <div>
                    <div style={{ fontFamily:'Barlow Condensed, sans-serif', fontWeight:900, fontSize:16, color:'#F0AA1A', letterSpacing:.4, marginBottom:4 }}>✨ Need Something Custom?</div>
                    <div style={{ fontFamily:'Barlow, sans-serif', fontSize:12, color:'rgba(255,255,255,.4)' }}>Message the coach directly — they can create a tailored package for your specific needs.</div>
                  </div>
                  <Link href={`/messages/new?coach=${COACH.name}`} style={{ background:'rgba(240,170,26,.15)', border:'1px solid rgba(240,170,26,.35)', borderRadius:8, padding:'8px 18px', fontFamily:'Barlow Condensed, sans-serif', fontWeight:800, fontSize:12, letterSpacing:.6, color:'#F0AA1A', textDecoration:'none', whiteSpace:'nowrap' }}>
                    SEND MESSAGE →
                  </Link>
                </div>
              </div>
            )}

            {/* ── REVIEWS ── */}
            {tab==='reviews'&&(
              <div>
                {/* Rating bar summary */}
                <div style={{ background:'#18181C', border:'1px solid rgba(255,255,255,.07)', borderRadius:12, padding:'20px 22px', marginBottom:14, display:'flex', gap:28, alignItems:'center' }}>
                  <div style={{ textAlign:'center' }}>
                    <div style={{ fontFamily:'Barlow Condensed, sans-serif', fontWeight:900, fontSize:52, color:'#F0AA1A', lineHeight:1 }}>{COACH.rating}</div>
                    <Stars n={5} size={14}/>
                    <div style={{ fontFamily:'Barlow, sans-serif', fontSize:11, color:'rgba(255,255,255,.3)', marginTop:5 }}>{COACH.totalReviews} reviews</div>
                  </div>
                  <div style={{ flex:1 }}>
                    {[5,4,3,2,1].map(star=>{
                      const pct = star===5?85:star===4?12:star===3?3:0
                      return (
                        <div key={star} style={{ display:'flex', alignItems:'center', gap:8, marginBottom:5 }}>
                          <span style={{ fontFamily:'Barlow Condensed, sans-serif', fontWeight:700, fontSize:11, color:'rgba(255,255,255,.35)', width:10, textAlign:'right' }}>{star}</span>
                          <svg width="9" height="9" viewBox="0 0 24 24" fill="#F0AA1A"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
                          <div style={{ flex:1, height:4, borderRadius:2, background:'rgba(255,255,255,.07)', overflow:'hidden' }}>
                            <div style={{ width:`${pct}%`, height:'100%', background:'#F0AA1A', borderRadius:2 }}/>
                          </div>
                          <span style={{ fontFamily:'Barlow, sans-serif', fontSize:10, color:'rgba(255,255,255,.25)', width:28 }}>{pct}%</span>
                        </div>
                      )
                    })}
                  </div>
                </div>

                <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
                  {REVIEWS.map((r,i)=>(
                    <div key={i} style={{ background:'#18181C', border:'1px solid rgba(255,255,255,.07)', borderRadius:12, padding:'16px 20px' }}>
                      <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:10 }}>
                        <div style={{ width:34, height:34, borderRadius:8, background:'rgba(255,255,255,.06)', border:'1px solid rgba(255,255,255,.1)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:17 }}>{r.buyerEmoji}</div>
                        <div style={{ flex:1 }}>
                          <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:2, flexWrap:'wrap' }}>
                            <span style={{ fontFamily:'Rajdhani, sans-serif', fontWeight:700, fontSize:13, color:'#fff' }}>{r.buyer}</span>
                            <Stars n={r.rating}/>
                            <span style={{ background:'rgba(255,255,255,.05)', border:'1px solid rgba(255,255,255,.09)', borderRadius:4, padding:'1px 7px', fontSize:9, fontWeight:700, color:'rgba(255,255,255,.35)', fontFamily:'Rajdhani, sans-serif', letterSpacing:.3 }}>{r.package}</span>
                          </div>
                          <div style={{ fontFamily:'Barlow, sans-serif', fontSize:10, color:'rgba(255,255,255,.25)' }}>{r.date}</div>
                        </div>
                      </div>
                      <p style={{ fontFamily:'Barlow, sans-serif', fontSize:12, color:'rgba(255,255,255,.5)', lineHeight:1.75, margin:'0 0 10px' }}>"{r.text}"</p>
                      <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                        <button style={{ background:'none', border:'1px solid rgba(255,255,255,.1)', borderRadius:5, padding:'3px 10px', fontSize:10, color:'rgba(255,255,255,.3)', fontFamily:'Rajdhani, sans-serif', fontWeight:700, cursor:'pointer', letterSpacing:.3 }}>
                          👍 Helpful ({r.helpful})
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* ── RIGHT: sticky hire card ── */}
          <div style={{ position:'sticky', top:20 }}>
            <div style={{ background:'#18181C', border:'1px solid rgba(255,255,255,.09)', borderRadius:14, padding:'20px', marginBottom:12 }}>
              <div style={{ fontFamily:'Rajdhani, sans-serif', fontWeight:700, fontSize:10, color:'rgba(255,255,255,.3)', textTransform:'uppercase', letterSpacing:.8, marginBottom:12 }}>Starting from</div>
              <div style={{ fontFamily:'Barlow Condensed, sans-serif', fontWeight:900, fontSize:36, color:'#4ade80', lineHeight:1, marginBottom:14 }}>
                ${Math.min(...PACKAGES.map(p=>p.price))}
              </div>

              <div style={{ display:'flex', flexDirection:'column', gap:8, marginBottom:16 }}>
                {PACKAGES.map(pkg=>{
                  const tp = TYPE_LABELS[pkg.type]
                  return (
                    <button key={pkg.id} onClick={()=>setHiring(pkg)}
                      style={{ background:'rgba(255,255,255,.04)', border:`1px solid ${pkg.popular?'rgba(178,45,45,.3)':'rgba(255,255,255,.08)'}`, borderRadius:8, padding:'10px 12px', display:'flex', alignItems:'center', justifyContent:'space-between', cursor:'pointer', transition:'all .15s', textAlign:'left' }}
                      onMouseEnter={e=>{e.currentTarget.style.background='rgba(255,255,255,.08)'; e.currentTarget.style.borderColor=tp.color+'55'}}
                      onMouseLeave={e=>{e.currentTarget.style.background='rgba(255,255,255,.04)'; e.currentTarget.style.borderColor=pkg.popular?'rgba(178,45,45,.3)':'rgba(255,255,255,.08)'}}
                    >
                      <div>
                        <div style={{ display:'flex', alignItems:'center', gap:5, marginBottom:2 }}>
                          <span style={{ fontSize:11 }}>{TYPE_ICONS[pkg.type]}</span>
                          <span style={{ fontFamily:'Rajdhani, sans-serif', fontWeight:700, fontSize:11, color:'rgba(255,255,255,.7)' }}>{pkg.title}</span>
                          {pkg.popular&&<span style={{ fontSize:8, color:'#ff8080' }}>🔥</span>}
                        </div>
                        <div style={{ fontSize:9, color:'rgba(255,255,255,.25)', fontFamily:'Barlow, sans-serif' }}>{pkg.deliveryDays}d delivery</div>
                      </div>
                      <span style={{ fontFamily:'Barlow Condensed, sans-serif', fontWeight:900, fontSize:16, color:'#4ade80', flexShrink:0 }}>${pkg.price}</span>
                    </button>
                  )
                })}
              </div>

              <button onClick={()=>setHiring(PACKAGES[1])} style={{ width:'100%', background:'#B22D2D', border:'none', borderRadius:8, padding:'12px', fontFamily:'Barlow Condensed, sans-serif', fontWeight:800, fontSize:14, letterSpacing:.8, color:'#fff', cursor:'pointer', marginBottom:10 }}>
                HIRE COACH →
              </button>
              <Link href={`/messages/new?coach=${COACH.name}`} style={{ display:'block', width:'100%', background:'rgba(255,255,255,.06)', border:'1px solid rgba(255,255,255,.12)', borderRadius:8, padding:'10px', fontFamily:'Barlow Condensed, sans-serif', fontWeight:700, fontSize:12, letterSpacing:.6, color:'rgba(255,255,255,.5)', textDecoration:'none', textAlign:'center', boxSizing:'border-box' }}>
                SEND MESSAGE
              </Link>
            </div>

            {/* Trust indicators */}
            <div style={{ background:'#18181C', border:'1px solid rgba(255,255,255,.07)', borderRadius:12, padding:'14px 16px' }}>
              {[
                { icon:'🔒', label:'Secure Payments',   sub:'No charge until offer is confirmed' },
                { icon:'↩️', label:'Revision Policy',   sub:'Revisions included in most packages' },
                { icon:'⚡', label:'Fast Response',     sub:`Usually replies in ${COACH.responseTime}` },
                { icon:'✓',  label:'Verified Coach',    sub:'Identity & credentials confirmed' },
              ].map((t,i)=>(
                <div key={i} style={{ display:'flex', gap:10, alignItems:'flex-start', marginBottom:i<3?12:0 }}>
                  <span style={{ fontSize:14, lineHeight:1.4 }}>{t.icon}</span>
                  <div>
                    <div style={{ fontFamily:'Rajdhani, sans-serif', fontWeight:700, fontSize:11, color:'rgba(255,255,255,.6)', marginBottom:1 }}>{t.label}</div>
                    <div style={{ fontFamily:'Barlow, sans-serif', fontSize:10, color:'rgba(255,255,255,.25)' }}>{t.sub}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>

      {/* ── HIRE MODAL ── */}
      {hiring&&<HireModal pkg={hiring} coach={COACH} onClose={()=>setHiring(null)}/>}
    </div>
  )
}