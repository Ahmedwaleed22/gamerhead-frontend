'use client'

import { useState, useEffect, useMemo, type ReactNode } from 'react'
import Link from 'next/link'
import { useAuth } from '@/lib/auth-context'
import { coachingApi, gamesApi } from '@/lib/api'
import { Icon } from '@iconify/react'
import { Solar } from '@/lib/solar-duotone'

// ─── TYPES ────────────────────────────────────────────────────────────────────
type PackageType = 'vod' | 'session' | 'drills' | 'team' | 'guide'
type SortKey     = 'rating' | 'price_low' | 'price_high' | 'orders' | 'response'

interface CoachListing {
  slug:           string
  name:           string
  emoji:          string
  avatarUrl:      string
  title:          string
  game:           string
  gameEmoji:      string
  gameSlug:       string
  gameSlugs:      string[]
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


const TYPE_LABELS: Record<PackageType, { label:string; color:string; bg:string; icon: string }> = {
  vod:     { label:'VOD Review',   color:'#60A5FA', bg:'rgba(96,165,250,.12)',  icon: Solar.clapperboard },
  session: { label:'Live Session', color:'#4ade80', bg:'rgba(74,222,128,.12)',  icon: Solar.microphone },
  drills:  { label:'Drill Plan',   color:'#FB923C', bg:'rgba(251,146,60,.12)',  icon: Solar.tools },
  team:    { label:'Team',         color:'#A78BFA', bg:'rgba(167,139,250,.12)', icon: Solar.users },
  guide:   { label:'Guide',        color:'#F472B6', bg:'rgba(244,114,182,.12)', icon: Solar.book },
}

const GAMES_DEFAULT = [
  { label:'All Games', value:'all' },
]

const SERVICE_FILTERS: { label:string; value:PackageType|'all'; icon?: string }[] = [
  { label:'All Services', value:'all' },
  { label:'Coaching Service', value:'session', icon: Solar.microphone },
  { label:'Guide',        value:'guide',   icon: Solar.book },
]

const RAIL = {
  bg: 'linear-gradient(165deg, rgba(22,22,28,.98) 0%, rgba(14,14,18,.99) 55%, rgba(10,10,14,1) 100%)',
  border: '1px solid rgba(255,255,255,.085)',
  shadow: '0 20px 50px rgba(0,0,0,.45), inset 0 1px 0 rgba(255,255,255,.045)',
  divider: 'rgba(255,255,255,.055)',
} as const

function FilterRailTitle({ children }: { children: ReactNode }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
      <span style={{
        fontFamily: "'Barlow Condensed', sans-serif",
        fontWeight: 800,
        fontSize: 11,
        letterSpacing: '0.14em',
        textTransform: 'uppercase' as const,
        color: 'rgba(255,255,255,.48)',
        whiteSpace: 'nowrap',
      }}>{children}</span>
      <span style={{ flex: 1, height: 1, background: 'linear-gradient(90deg, rgba(255,255,255,.14), transparent 85%)' }} />
    </div>
  )
}

function ServiceFilterRow({
  label,
  icon,
  active,
  accent,
  onClick,
}: {
  label: string
  icon?: string
  active: boolean
  accent: { bar: string; fade: string }
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        position: 'relative',
        width: '100%',
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        padding: '9px 11px 9px 13px',
        border: 'none',
        borderRadius: 9,
        cursor: 'pointer',
        textAlign: 'left',
        fontFamily: "'Barlow', sans-serif",
        fontWeight: active ? 700 : 500,
        fontSize: 12,
        letterSpacing: 0.2,
        color: active ? 'rgba(255,255,255,.95)' : 'rgba(255,255,255,.48)',
        background: active ? accent.fade : 'transparent',
        transition: 'background .15s, color .15s',
        boxShadow: active ? `inset 3px 0 0 ${accent.bar}` : 'none',
      }}
      onMouseEnter={e => {
        if (!active) e.currentTarget.style.background = 'rgba(255,255,255,.04)'
      }}
      onMouseLeave={e => {
        if (!active) e.currentTarget.style.background = 'transparent'
      }}
    >
      {icon ? (
        <span style={{
          width: 28,
          height: 28,
          borderRadius: 8,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
          background: active ? `${accent.bar}22` : 'rgba(255,255,255,.04)',
          border: `1px solid ${active ? `${accent.bar}40` : 'rgba(255,255,255,.06)'}`,
        }}>
          <Icon icon={icon} width={15} height={15} style={{ opacity: active ? 1 : 0.65, color: active ? accent.bar : 'rgba(255,255,255,.55)' }} />
        </span>
      ) : (
        <span style={{
          width: 28,
          height: 28,
          borderRadius: 8,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
          background: active ? 'rgba(232,17,43,.2)' : 'rgba(255,255,255,.04)',
          border: `1px solid ${active ? 'rgba(232,17,43,.35)' : 'rgba(255,255,255,.06)'}`,
        }}>
          <Icon icon={Solar.clipboard} width={15} height={15} style={{ opacity: active ? 1 : 0.55, color: active ? '#fb7185' : 'rgba(255,255,255,.45)' }} />
        </span>
      )}
      <span style={{ flex: 1, lineHeight: 1.25 }}>{label}</span>
    </button>
  )
}

function GameFilterRow({ label, active, isAll, onClick }: { label: string; active: boolean; isAll: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        position: 'relative',
        width: '100%',
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        padding: '8px 11px 8px 13px',
        border: 'none',
        borderRadius: 9,
        cursor: 'pointer',
        textAlign: 'left',
        fontFamily: "'Barlow', sans-serif",
        fontWeight: active ? 700 : 500,
        fontSize: 11.5,
        letterSpacing: 0.15,
        color: active ? 'rgba(255,255,255,.94)' : 'rgba(255,255,255,.45)',
        background: active ? 'linear-gradient(90deg, rgba(232,17,43,.16), rgba(232,17,43,.02))' : 'transparent',
        transition: 'background .15s, color .15s',
        boxShadow: active ? 'inset 3px 0 0 var(--red)' : 'none',
      }}
      onMouseEnter={e => {
        if (!active) e.currentTarget.style.background = 'rgba(255,255,255,.04)'
      }}
      onMouseLeave={e => {
        if (!active) e.currentTarget.style.background = 'transparent'
      }}
    >
      <Icon
        icon={isAll ? Solar.gamepad : Solar.target}
        width={14}
        height={14}
        style={{
          flexShrink: 0,
          opacity: active ? 0.95 : 0.4,
          color: active ? (isAll ? '#fb7185' : 'rgba(255,255,255,.55)') : 'rgba(255,255,255,.35)',
        }}
      />
      <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{label}</span>
    </button>
  )
}

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
        background: hov ? '#1E1E24' : '#18181B',
        border: `1px solid ${hov ? coach.accentColor + '55' : 'rgba(255,255,255,0.08)'}`,
        borderRadius: 12,
        overflow: 'hidden',
        transition: 'all 0.2s',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
      }}>
        {/* Cleaner top accent bar */}
        <div style={{ height: 4, background: hov ? coach.accentColor : coach.accentColor + '88' }} />

        <div style={{ padding: '20px', flex: 1, display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* Row 1 — avatar + name + badges */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ position: 'relative', flexShrink: 0 }}>
              {coach.avatarUrl ? (
                <img src={coach.avatarUrl} alt={coach.name} style={{
                  width: 52, height: 52, borderRadius: 26, objectFit: 'cover',
                  border: `2px solid #27272A`,
                }}/>
              ) : (
                <div style={{
                  width: 52, height: 52, borderRadius: 26,
                  background: '#27272A',
                  border: `2px solid #27272A`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <Icon icon={Solar.target} width={24} height={24} style={{ display: 'block', color: coach.accentColor }} />
                </div>
              )}
              {coach.online && (
                 <div style={{
                  position: 'absolute', bottom: 0, right: 0,
                  width: 14, height: 14, borderRadius: '50%',
                  background: '#10B981',
                  border: '3px solid #18181B',
                 }} />
              )}
            </div>

            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2, flexWrap: 'wrap' }}>
                <span style={{ fontFamily: 'Inter, sans-serif', fontWeight: 600, fontSize: 16, color: '#F9FAFB' }}>
                  {coach.name}
                </span>
                {coach.verified && (
                  <Icon icon={Solar.check} width={14} height={14} style={{ color: '#3B82F6' }} />
                )}
              </div>
              <div style={{ fontFamily: 'Inter, sans-serif', fontSize: 13, color: '#9CA3AF', marginBottom: 6, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {coach.title}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <Stars n={coach.rating} />
                <span style={{ fontFamily: 'Inter, sans-serif', fontWeight: 600, fontSize: 13, color: '#FCD34D' }}>{coach.rating}</span>
                <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 13, color: '#6B7280' }}>({coach.totalReviews})</span>
                <span style={{ color: '#374151' }}>•</span>
                <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 13, color: '#9CA3AF' }}>{coach.totalOrders} orders</span>
              </div>
            </div>
          </div>

          <p style={{
            fontFamily: 'Inter, sans-serif', fontSize: 14,
            color: '#D1D5DB', lineHeight: 1.5, margin: 0,
            display: '-webkit-box', WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical', overflow: 'hidden',
          }}>
            {coach.tagline}
          </p>

          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {coach.specialties.slice(0, 3).map((s, i) => (
              <span key={i} style={{
                background: '#27272A',
                borderRadius: 6, padding: '4px 8px',
                fontFamily: 'Inter, sans-serif', fontWeight: 500, fontSize: 12,
                color: '#E5E7EB',
              }}>{s}</span>
            ))}
            {coach.specialties.length > 3 && (
              <span style={{ fontFamily: 'Inter, sans-serif', fontWeight: 500, fontSize: 12, color: '#9CA3AF', alignSelf: 'center' }}>
                +{coach.specialties.length - 3}
              </span>
            )}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 'auto' }}>
            {(serviceFilter === 'all' ? coach.packages.slice(0, 3) : visiblePackages).map((pkg, i) => {
              const tp = TYPE_LABELS[pkg.type]
              return (
                <div key={i} style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  background: '#27272A55',
                  borderRadius: 6, padding: '8px 10px',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Icon icon={tp.icon} width={14} height={14} style={{ color: tp.color, flexShrink: 0 }} />
                    <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 13, color: '#E5E7EB', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 150 }}>
                      {pkg.title}
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                    <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 12, color: '#9CA3AF' }}>{pkg.deliveryDays}d</span>
                    <span style={{ fontFamily: 'Inter, sans-serif', fontWeight: 600, fontSize: 13, color: '#F9FAFB' }}>${pkg.price}</span>
                  </div>
                </div>
              )
            })}
            {serviceFilter === 'all' && coach.packages.length > 3 && (
              <div style={{ fontFamily: 'Inter, sans-serif', fontSize: 12, color: '#9CA3AF', paddingLeft: 4 }}>
                +{coach.packages.length - 3} more packages
              </div>
            )}
          </div>
        </div>

        <div style={{
          borderTop: '1px solid #27272A',
          padding: '12px 20px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <div style={{ display: 'flex', gap: 16 }}>
             <div style={{ fontFamily: 'Inter, sans-serif', fontSize: 13, color: '#9CA3AF' }}>
               <span style={{ fontWeight: 600, color: '#E5E7EB' }}>{coach.completionRate}%</span> Done
             </div>
             <div style={{ fontFamily: 'Inter, sans-serif', fontSize: 13, color: '#9CA3AF' }}>
               <span style={{ fontWeight: 600, color: '#E5E7EB' }}>{coach.responseTime}</span> Reply
             </div>
          </div>
          <div style={{
            fontFamily: 'Inter, sans-serif', fontWeight: 600, fontSize: 13,
            color: hov ? coach.accentColor : '#9CA3AF',
            transition: 'color 0.2s',
          }}>
            From ${lowestPrice} →
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
        avatarUrl:      c.avatarUrl || '',
        title:          c.title,
        game:           c.game,
        gameEmoji:      c.gameEmoji,
        gameSlug:       c.gameSlug,
        gameSlugs:      c.gameSlugs || [],
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
    if (gameFilter !== 'all')    list = list.filter(c => c.gameSlug === gameFilter || (c.gameSlugs || []).includes(gameFilter))
    if (serviceFilter !== 'all') list = list.filter(c => c.packages.some(p => p.type === serviceFilter))
    if (onlineOnly)              list = list.filter(c => c.online)
    if (priceMax !== null)       list = list.filter(c => Math.min(...c.packages.map(p => p.price)) <= priceMax)
    list.sort((a, b) => b.rating - a.rating)
    return list
  }, [coaches, search, gameFilter, serviceFilter, onlineOnly, priceMax])

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: '#0C0C11', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16, padding: 24 }}>
        <Icon icon={Solar.hourglass} width={40} height={40} style={{ opacity: 0.85 }} />
        <span style={{ fontFamily: 'Rajdhani, sans-serif', fontSize: 14, fontWeight: 600, color: 'rgba(255,255,255,.4)', letterSpacing: 0.5 }}>Loading coaches...</span>
      </div>
    )
  }

  return (
    <div className="container" style={{ paddingBottom: 80 }}>

      {/* ── PAGE HEADER ──────────────────────────────── */}
      <div style={{
        padding: '40px 0 24px',
        borderBottom: '1px solid var(--border)',
        marginBottom: 24,
        display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between',
      }}>
        <div>
          <h1 style={{
            fontFamily: "'Barlow Condensed', sans-serif",
            fontSize: 40, fontWeight: 900,
            textTransform: 'uppercase', letterSpacing: '0.02em',
            color: '#fff', marginBottom: 6,
          }}>
            Find a <span style={{ color: 'var(--red)' }}>Coach</span>
          </h1>
          <p style={{ fontSize: 14, color: 'var(--text-muted)', margin: 0 }}>
            Hire verified competitive coaches. VOD reviews, live sessions, drill plans & team coaching.
          </p>
        </div>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'minmax(268px, 300px) 1fr', gap:28, alignItems:'start' }}>

          {/* ── LEFT: unified filter rail (single surface, not stacked identical cards) ── */}
          <aside style={{ position:'sticky', top:20, display:'flex', flexDirection:'column', gap:14 }}>
            <div style={{
              background: RAIL.bg,
              border: RAIL.border,
              borderRadius: 16,
              boxShadow: RAIL.shadow,
              overflow: 'hidden',
            }}>
              <div style={{ padding: '18px 16px 14px' }}>
                <FilterRailTitle>Search</FilterRailTitle>
                <div style={{ position: 'relative' }}>
                  <Icon
                    icon={Solar.magnifier}
                    width={16}
                    height={16}
                    style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', opacity: 0.45, pointerEvents: 'none' }}
                  />
                  <input
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    placeholder="Name, specialty, tagline…"
                    aria-label="Search coaches"
                    style={{
                      width: '100%',
                      background: 'rgba(0,0,0,.35)',
                      border: '1px solid rgba(255,255,255,.09)',
                      borderRadius: 10,
                      padding: '10px 12px 10px 38px',
                      color: '#fff',
                      fontFamily: "'Barlow', sans-serif",
                      fontSize: 12.5,
                      outline: 'none',
                      boxSizing: 'border-box',
                      transition: 'border-color .15s, box-shadow .15s',
                    }}
                    onFocus={e => {
                      e.target.style.borderColor = 'rgba(232,17,43,.35)'
                      e.target.style.boxShadow = '0 0 0 3px rgba(232,17,43,.08)'
                    }}
                    onBlur={e => {
                      e.target.style.borderColor = 'rgba(255,255,255,.09)'
                      e.target.style.boxShadow = 'none'
                    }}
                  />
                </div>
              </div>

              <div style={{ height: 1, background: RAIL.divider, margin: '0 16px' }} />

              <div style={{ padding: '14px 12px 16px' }}>
                <FilterRailTitle>Service</FilterRailTitle>
                <div role="group" aria-label="Service type" style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                  {SERVICE_FILTERS.map(f => {
                    const active = serviceFilter === f.value
                    const accent = f.value === 'all'
                      ? { bar: '#E11D48', fade: 'linear-gradient(90deg, rgba(232,17,43,.2), rgba(232,17,43,.03))' }
                      : (() => {
                          const t = TYPE_LABELS[f.value as PackageType]
                          return { bar: t.color, fade: `linear-gradient(90deg, ${t.color}28, ${t.color}06)` }
                        })()
                    return (
                      <ServiceFilterRow
                        key={f.value}
                        label={f.label}
                        icon={f.icon}
                        active={active}
                        accent={accent}
                        onClick={() => setServiceFilter(f.value)}
                      />
                    )
                  })}
                </div>
              </div>

              <div style={{ height: 1, background: RAIL.divider, margin: '0 16px' }} />

              <div style={{ padding: '14px 12px 16px' }}>
                <FilterRailTitle>Game</FilterRailTitle>
                <div
                  style={{
                    maxHeight: 220,
                    overflowY: 'auto',
                    paddingRight: 4,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 3,
                    scrollbarWidth: 'thin',
                    scrollbarColor: 'rgba(255,255,255,.18) transparent',
                  }}
                >
                  {GAMES.map(g => (
                    <GameFilterRow
                      key={g.value}
                      label={g.label}
                      active={gameFilter === g.value}
                      isAll={g.value === 'all'}
                      onClick={() => setGameFilter(g.value)}
                    />
                  ))}
                </div>
              </div>

              <div style={{ height: 1, background: RAIL.divider, margin: '0 16px' }} />

              <div style={{ padding: '14px 12px 16px' }}>
                <FilterRailTitle>Max price</FilterRailTitle>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                  {[
                    { label: 'Any price', val: null as number | null },
                    { label: 'Under $20', val: 20 },
                    { label: 'Under $35', val: 35 },
                    { label: 'Under $50', val: 50 },
                    { label: 'Under $100', val: 100 },
                  ].map(p => (
                    <button
                      key={String(p.val)}
                      type="button"
                      onClick={() => setPriceMax(p.val)}
                      style={{
                        position: 'relative',
                        width: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 10,
                        padding: '8px 11px 8px 13px',
                        border: 'none',
                        borderRadius: 9,
                        cursor: 'pointer',
                        textAlign: 'left',
                        fontFamily: "'Barlow', sans-serif",
                        fontWeight: priceMax === p.val ? 700 : 500,
                        fontSize: 12,
                        letterSpacing: 0.15,
                        color: priceMax === p.val ? 'rgba(255,255,255,.94)' : 'rgba(255,255,255,.45)',
                        background: priceMax === p.val ? 'linear-gradient(90deg, rgba(240,192,64,.14), rgba(240,192,64,.02))' : 'transparent',
                        transition: 'background .15s, color .15s',
                        boxShadow: priceMax === p.val ? 'inset 3px 0 0 #d4a020' : 'none',
                      }}
                    >
                      <Icon
                        icon={Solar.coin}
                        width={14}
                        height={14}
                        style={{
                          flexShrink: 0,
                          opacity: priceMax === p.val ? 0.95 : 0.4,
                          color: priceMax === p.val ? '#f0c040' : 'rgba(255,255,255,.35)',
                        }}
                      />
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>

              <div style={{ height: 1, background: RAIL.divider, margin: '0 16px' }} />

              <div style={{ padding: '14px 16px 18px' }}>
                <button
                  type="button"
                  onClick={() => setOnlineOnly(!onlineOnly)}
                  style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 12,
                    padding: '11px 12px',
                    borderRadius: 10,
                    border: `1px solid ${onlineOnly ? 'rgba(74,222,128,.28)' : 'rgba(255,255,255,.08)'}`,
                    background: onlineOnly ? 'rgba(74,222,128,.07)' : 'rgba(255,255,255,.02)',
                    cursor: 'pointer',
                    transition: 'border-color .15s, background .15s',
                  }}
                >
                  <span style={{
                    fontFamily: "'Barlow', sans-serif",
                    fontWeight: 600,
                    fontSize: 12,
                    color: onlineOnly ? '#86efac' : 'rgba(255,255,255,.5)',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 8,
                  }}>
                    <span style={{
                      width: 28,
                      height: 28,
                      borderRadius: 8,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      background: onlineOnly ? 'rgba(74,222,128,.15)' : 'rgba(255,255,255,.04)',
                      border: `1px solid ${onlineOnly ? 'rgba(74,222,128,.25)' : 'rgba(255,255,255,.06)'}`,
                    }}>
                      <Icon icon={Solar.online} width={15} height={15} style={{ color: onlineOnly ? '#4ade80' : 'rgba(255,255,255,.4)' }} />
                    </span>
                    Online now only
                  </span>
                  <div style={{
                    width: 36,
                    height: 20,
                    borderRadius: 10,
                    background: onlineOnly ? '#4ade80' : 'rgba(255,255,255,.1)',
                    border: `1px solid ${onlineOnly ? '#4ade80' : 'rgba(255,255,255,.12)'}`,
                    position: 'relative',
                    transition: 'all .2s',
                    flexShrink: 0,
                  }}>
                    <div style={{
                      width: 14,
                      height: 14,
                      borderRadius: '50%',
                      background: '#fff',
                      position: 'absolute',
                      top: 2,
                      left: onlineOnly ? 18 : 2,
                      transition: 'left .2s',
                      boxShadow: '0 1px 3px rgba(0,0,0,.35)',
                    }} />
                  </div>
                </button>
              </div>
            </div>

            {(gameFilter !== 'all' || serviceFilter !== 'all' || onlineOnly || priceMax !== null || search.trim()) && (
              <button
                type="button"
                onClick={() => { setGameFilter('all'); setServiceFilter('all'); setOnlineOnly(false); setPriceMax(null); setSearch('') }}
                style={{
                  background: 'rgba(232,17,43,.08)',
                  border: '1px solid rgba(232,17,43,.22)',
                  borderRadius: 11,
                  padding: '11px 14px',
                  fontFamily: "'Barlow Condensed', sans-serif",
                  fontWeight: 800,
                  fontSize: 12,
                  letterSpacing: '0.1em',
                  textTransform: 'uppercase' as const,
                  color: 'rgba(255,160,160,.85)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  transition: 'background .15s, border-color .15s',
                }}
              >
                <Icon icon={Solar.close} width={15} height={15} />
                Reset filters
              </button>
            )}
          </aside>

          {/* ── RIGHT — results only, no sort pills ── */}
          <div>
            {filtered.length > 0 ? (
              <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(300px,1fr))', gap:14 }}>
                {filtered.map(coach => (
                  <CoachCard key={coach.slug} coach={coach} serviceFilter={serviceFilter} />
                ))}
              </div>
            ) : (
              <div style={{ background:'#18181C', border:'1px solid rgba(255,255,255,.07)', borderRadius:14, padding:'60px 24px', textAlign:'center' }}>
                <div style={{ marginBottom:16, display:'flex', justifyContent:'center' }}><Icon icon={Solar.magnifier} width={40} height={40} style={{ opacity: 0.65 }} /></div>
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
  )
}