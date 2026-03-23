'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Icon } from '@iconify/react'
import { useAuth } from '@/lib/auth-context'
import { forumApi } from '@/lib/api'
import { sendActivity } from '@/lib/socket'
import { EmojiSolar, Solar } from '@/lib/solar-duotone'

interface Board {
  name: string; slug: string; emoji: string; description: string
  threads: number; posts: number
  lastPost: { author: string; title: string; time: string; authorRole: string; authorSlug: string; authorColor: string }
}
interface Category { name: string; emoji: string; boards: Board[] }
// Updated roles: Admin / Premium / Coach / Member (Mod & Veteran removed)
const ROLE_COLORS: Record<string,string> = {
  admin:   '#e8000d',
  premium: '#F0AA1A',
  coach:   '#3CC8C8',
  member:  '#888',
}
const ROLE_LABELS: Record<string,string> = {
  admin:   'Admin',
  premium: 'Premium',
  coach:   'Coach',
  member:  'Member',
}

function RoleBadge({ role }: { role: string }) {
  const color = ROLE_COLORS[role] ?? '#888'
  const label = ROLE_LABELS[role] ?? role
  return (
    <span style={{ fontSize:9, fontWeight:700, color, background:`${color}18`, border:`1px solid ${color}30`, borderRadius:3, padding:'1px 5px', letterSpacing:0.3, textTransform:'uppercase', flexShrink:0 }}>
      {label}
    </span>
  )
}

function formatNumber(n: number) {
  return n >= 1000 ? (n / 1000).toFixed(1) + 'k' : n.toString()
}

export default function ForumPage() {
  const { user } = useAuth()
  const router = useRouter()
  const [collapsed, setCollapsed] = useState<Record<string,boolean>>({})
  const toggle = (name: string) => setCollapsed(p => ({ ...p, [name]: !p[name] }))

  const [categories, setCategories] = useState<Category[]>([])
  const [forumStats, setForumStats] = useState({ members: 0, threads: 0, posts: 0, online: 0 })
  const [topPosters, setTopPosters] = useState<any[]>([])
  const [recentActivity, setRecentActivity] = useState<any[]>([])

  useEffect(() => { sendActivity('Browsing Forum') }, [])

  // Derive user's effective role for board visibility filtering
  const userRole = user?.role === 'admin' ? 'admin' : (user as any)?.isCoach ? 'coach' : (user as any)?.isPremium ? 'premium' : user ? 'member' : null

  useEffect(() => {
    forumApi.getBoards().then((res: any) => {
      const raw = Array.isArray(res) ? res : res.boards || res.categories || []

      // Filter boards by viewRoles: empty = public, otherwise user must have matching role
      const canView = (b: any) => {
        const vr = b.viewRoles || []
        if (vr.length === 0) return true // public
        return userRole && vr.includes(userRole)
      }

      // If API returns flat boards, group them; if already grouped as categories, use directly
      if (raw.length > 0 && raw[0].boards) {
        setCategories(raw.map((cat: any) => ({
          name: cat.name || cat.category || 'General',
          emoji: cat.emoji || '💬',
          boards: (cat.boards || []).filter(canView).map((b: any) => ({
            name: b.name || b.title,
            slug: b.slug,
            emoji: b.emoji || '💬',
            description: b.description || '',
            threads: b.threadCount ?? b.threads ?? 0,
            posts: b.postCount ?? b.posts ?? 0,
            postRoles: b.postRoles || [],
            lastPost: b.lastPost ? { ...b.lastPost, authorSlug: b.lastPost.authorSlug || '', authorColor: b.lastPost.authorColor || '' } : { author: '—', title: '—', time: '—', authorRole: 'member', authorSlug: '', authorColor: '' },
          })),
        })).filter((cat: any) => cat.boards.length > 0))
      } else {
        setCategories([{ name: 'All Boards', emoji: '💬', boards: raw.filter(canView).map((b: any) => ({
          name: b.name || b.title,
          slug: b.slug,
          emoji: b.emoji || '💬',
          description: b.description || '',
          threads: b.threadCount ?? b.threads ?? 0,
          posts: b.postCount ?? b.posts ?? 0,
          postRoles: b.postRoles || [],
          lastPost: b.lastPost || { author: '—', title: '—', time: '—', authorRole: 'member' },
        })) }])
      }
    }).catch(() => {})

    forumApi.getStats().then((res: any) => {
      setForumStats({
        members: res.members ?? res.totalMembers ?? 0,
        threads: res.threads ?? res.totalThreads ?? 0,
        posts: res.posts ?? res.totalPosts ?? 0,
        online: res.online ?? res.onlineNow ?? 0,
      })
    }).catch(() => {})

    forumApi.getTopPosters(5).then((res: any) => {
      const list = Array.isArray(res) ? res : res.posters || []
      setTopPosters(list.map((p: any) => ({
        name: p.username || p.name,
        pfp: p.pfp || '👤',
        role: p.role || 'member',
        posts: p.postCount ?? p.posts ?? 0,
        slug: p.slug || '',
        usernameColor: p.usernameColor || '',
      })))
    }).catch(() => {})

    forumApi.getRecentActivity(6).then((res: any) => {
      const list = Array.isArray(res) ? res : res.activity || []
      setRecentActivity(list.map((a: any) => ({
        author: a.author?.username || a.authorName || a.author || '',
        authorSlug: a.authorSlug || '',
        authorColor: a.authorColor || '',
        pfp: '👤',
        role: a.author?.role || a.authorRole || 'member',
        board: a.boardName || a.board || a.boardSlug || '',
        boardSlug: a.boardSlug || '',
        threadId: a.threadId || '',
        title: a.title || a.threadTitle || '',
        time: a.time ? timeAgo(a.time) : (a.createdAt ? timeAgo(a.createdAt) : ''),
      })))
    }).catch(() => {})
  }, [])

  function timeAgo(dateStr: string): string {
    const diff = Date.now() - new Date(dateStr).getTime()
    const mins = Math.floor(diff / 60000)
    if (mins < 1) return 'just now'
    if (mins < 60) return `${mins}m ago`
    const hrs = Math.floor(mins / 60)
    if (hrs < 24) return `${hrs}h ago`
    const days = Math.floor(hrs / 24)
    return `${days}d ago`
  }

  const CATEGORIES = categories
  const FORUM_STATS = forumStats
  const TOP_POSTERS = topPosters
  const RECENT_ACTIVITY = recentActivity

  return (
    <div style={{ paddingBottom:60 }}>

      {/* ── FULL-WIDTH PAGE HEADER ── */}
      <div style={{
        background: 'linear-gradient(135deg, #0f0f18, #130d16)',
        borderBottom: '1px solid rgba(255,255,255,0.07)',
        padding: '32px 0 28px',
        /* Bleed out of parent container to full viewport width */
        width: '100vw',
        position: 'relative',
        left: '50%',
        right: '50%',
        marginLeft: '-50vw',
        marginRight: '-50vw',
      }}>
        <div className="container">
          <div style={{ display:'flex', alignItems:'flex-end', justifyContent:'space-between', flexWrap:'wrap', gap:16 }}>
            <div>
              <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:8 }}>
                <Icon icon={Solar.chat} width={34} height={34} style={{ flexShrink: 0 }} />
                <h1 style={{ fontFamily:'Barlow Condensed, sans-serif', fontSize:36, fontWeight:900, textTransform:'uppercase', color:'#fff', margin:0, lineHeight:1 }}>Forum</h1>
              </div>
              <p style={{ fontFamily:'Barlow, sans-serif', fontSize:13, color:'var(--text-muted)', margin:0 }}>
                Discuss strategy, find teammates, share clips & connect with the CE community.
              </p>
            </div>
            <div style={{ display:'flex', alignItems:'center', gap:8, background:'rgba(39,174,96,0.1)', border:'1px solid rgba(39,174,96,0.2)', borderRadius:8, padding:'8px 14px' }}>
              <Icon icon={Solar.online} width={16} height={16} style={{ flexShrink: 0, color: '#4ade80' }} />
              <span style={{ fontSize:12, fontWeight:700, color:'#4ade80' }}>{FORUM_STATS.online.toLocaleString()} online now</span>
            </div>
          </div>

          {/* Welcome bar */}
          <div style={{ marginTop:20, background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.07)', borderRadius:8, padding:'12px 16px', display:'flex', alignItems:'center', justifyContent:'space-between', gap:16, flexWrap:'wrap' }}>
            <div style={{ display:'flex', alignItems:'center', gap:12 }}>
              <div style={{ width:36, height:36, background:'rgba(232,0,13,0.15)', border:'1px solid rgba(232,0,13,0.25)', borderRadius:8, display:'flex', alignItems:'center', justifyContent:'center', overflow:'hidden' }}>
                {user?.avatarUrl ? <img src={user.avatarUrl} alt="" style={{ width:36, height:36, borderRadius:8, objectFit:'cover' }} /> : <Icon icon={Solar.user} width={22} height={22} style={{ opacity: 0.7 }} />}
              </div>
              <div>
                <div style={{ fontSize:13, fontWeight:700, color:user?.usernameColor || '#e74c3c' }}>Welcome back, {user?.username || 'Guest'}</div>
                <div style={{ fontSize:11, color:'var(--text-muted)' }}>Join the conversation and connect with the community</div>
              </div>
            </div>
            <div style={{ display:'flex', gap:8 }}>
              <button style={{ padding:'6px 14px', background:'rgba(255,255,255,0.05)', border:'1px solid var(--border)', borderRadius:6, color:'var(--text-muted)', fontSize:11, fontWeight:700, cursor:'pointer', fontFamily:'Barlow, sans-serif', textTransform:'uppercase', letterSpacing:0.3 }}>Mark All Read</button>
            </div>
          </div>
        </div>
      </div>

      {/* ── BODY ── */}
      <div className="container" style={{ marginTop:24 }}>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 250px', gap:20, alignItems:'start' }}>

          {/* LEFT */}
          <div style={{ display:'flex', flexDirection:'column', gap:20 }}>

            {/* Category blocks */}
            {CATEGORIES.map(cat => {
              const isCollapsed = collapsed[cat.name]
              return (
                <div key={cat.name} style={{ background:'var(--bg-2)', border:'1px solid var(--border)', borderRadius:10, overflow:'hidden' }}>
                  <button
                    onClick={() => toggle(cat.name)}
                    style={{ width:'100%', display:'flex', alignItems:'center', gap:10, padding:'13px 18px', background:'var(--bg-3)', border:'none', cursor:'pointer', textAlign:'left', borderBottom:isCollapsed?'none':'1px solid var(--border)', transition:'background 0.15s' }}
                    onMouseEnter={e=>(e.currentTarget.style.background='var(--bg-4)')}
                    onMouseLeave={e=>(e.currentTarget.style.background='var(--bg-3)')}
                  >
                    <EmojiSolar emoji={cat.emoji} size={18} inline={false} />
                    <span style={{ fontFamily:'Barlow Condensed, sans-serif', fontSize:16, fontWeight:800, textTransform:'uppercase', letterSpacing:0.5, color:'#fff', flex:1 }}>{cat.name}</span>
                    <span style={{ fontSize:9, color:'var(--text-dim)', fontWeight:700, letterSpacing:0.3 }}>{cat.boards.reduce((a,b)=>a+b.threads,0).toLocaleString()} threads</span>
                    <span style={{ fontSize:11, color:'var(--text-dim)', marginLeft:8 }}>{isCollapsed?'▼':'▲'}</span>
                  </button>

                  {!isCollapsed && cat.boards.map((board, bi) => (
                    <div
                      key={board.slug}
                      style={{ display:'grid', gridTemplateColumns:'1fr 90px 90px 180px', borderBottom:bi<cat.boards.length-1?'1px solid var(--border)':'none', transition:'background 0.15s' }}
                      onMouseEnter={e=>(e.currentTarget.style.background='rgba(255,255,255,0.02)')}
                      onMouseLeave={e=>(e.currentTarget.style.background='transparent')}
                    >
                      <Link href={`/forum/board/${board.slug}`} style={{ display:'flex', alignItems:'center', gap:12, padding:'14px 18px', textDecoration:'none' }}>
                        <span style={{ flexShrink:0, width:28, display:'flex', justifyContent:'center' }}><EmojiSolar emoji={board.emoji} size={22} inline={false} /></span>
                        <div>
                          <div style={{ fontFamily:'Barlow, sans-serif', fontSize:13, fontWeight:700, color:'#f0f0f0', marginBottom:3 }}>{board.name}</div>
                          <div style={{ fontSize:11, color:'var(--text-dim)', lineHeight:1.4 }}>{board.description}</div>
                        </div>
                      </Link>

                      <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:'14px 8px', borderLeft:'1px solid var(--border)' }}>
                        <span style={{ fontFamily:'Barlow Condensed, sans-serif', fontSize:17, fontWeight:800, color:'#fff' }}>{formatNumber(board.threads)}</span>
                        <span style={{ fontSize:9, color:'var(--text-dim)', textTransform:'uppercase', letterSpacing:0.4, marginTop:1 }}>threads</span>
                      </div>

                      <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:'14px 8px', borderLeft:'1px solid var(--border)' }}>
                        <span style={{ fontFamily:'Barlow Condensed, sans-serif', fontSize:17, fontWeight:800, color:'#fff' }}>{formatNumber(board.posts)}</span>
                        <span style={{ fontSize:9, color:'var(--text-dim)', textTransform:'uppercase', letterSpacing:0.4, marginTop:1 }}>posts</span>
                      </div>

                      <div style={{ display:'flex', flexDirection:'column', justifyContent:'center', padding:'14px 14px', borderLeft:'1px solid var(--border)', minWidth:0 }}>
                        {board.lastPost.title === '—' || !board.lastPost.title ? (
                          <span style={{ fontSize:11, color:'var(--text-dim)' }}>-</span>
                        ) : (<>
                          <div style={{ fontSize:11, color:'#e0e0e8', fontWeight:600, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis', marginBottom:3 }}>{board.lastPost.title}</div>
                          <div style={{ display:'flex', alignItems:'center', gap:5 }}>
                            {board.lastPost.authorSlug ? (
                              <span role="link" onClick={e=>{e.preventDefault();e.stopPropagation();router.push(`/profile/${board.lastPost.authorSlug}`)}} style={{ fontSize:11, fontWeight:700, color:board.lastPost.authorColor || ROLE_COLORS[board.lastPost.authorRole] || '#888', textDecoration:'none', cursor:'pointer' }}
                                onMouseEnter={e=>(e.currentTarget.style.textDecoration='underline')} onMouseLeave={e=>(e.currentTarget.style.textDecoration='none')}>{board.lastPost.author}</span>
                            ) : (
                              <span style={{ fontSize:11, fontWeight:700, color:board.lastPost.authorColor || ROLE_COLORS[board.lastPost.authorRole] || '#888' }}>{board.lastPost.author}</span>
                            )}
                            <RoleBadge role={board.lastPost.authorRole} />
                            <span style={{ fontSize:10, color:'var(--text-dim)' }}>· {board.lastPost.time}</span>
                          </div>
                        </>)}
                      </div>
                    </div>
                  ))}
                </div>
              )
            })}

          </div>

          {/* RIGHT SIDEBAR */}
          <div style={{ display:'flex', flexDirection:'column', gap:16 }}>

            {/* Forum Stats */}
            <div style={{ background:'var(--bg-2)', border:'1px solid var(--border)', borderRadius:10, overflow:'hidden' }}>
              <div style={{ padding:'11px 16px', background:'var(--bg-3)', borderBottom:'1px solid var(--border)', fontFamily:'Barlow Condensed, sans-serif', fontSize:13, fontWeight:800, textTransform:'uppercase', letterSpacing:0.5, color:'#fff', display:'flex', alignItems:'center', gap:8 }}><Icon icon={Solar.chart} width={18} height={18} /> Forum Stats</div>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:1, background:'var(--border)' }}>
                {[{label:'Members',value:formatNumber(FORUM_STATS.members),color:'#fff'},{label:'Threads',value:formatNumber(FORUM_STATS.threads),color:'#fff'},{label:'Posts',value:formatNumber(FORUM_STATS.posts),color:'#fff'},{label:'Online',value:formatNumber(FORUM_STATS.online),color:'#4ade80'}].map(s=>(
                  <div key={s.label} style={{ background:'var(--bg-2)', padding:'12px 14px', textAlign:'center' }}>
                    <div style={{ fontFamily:'Barlow Condensed, sans-serif', fontSize:20, fontWeight:800, color:s.color }}>{s.value}</div>
                    <div style={{ fontSize:10, color:'var(--text-dim)', textTransform:'uppercase', letterSpacing:0.4, marginTop:2 }}>{s.label}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Top Posters */}
            <div style={{ background:'var(--bg-2)', border:'1px solid var(--border)', borderRadius:10, overflow:'hidden' }}>
              <div style={{ padding:'11px 16px', background:'var(--bg-3)', borderBottom:'1px solid var(--border)', fontFamily:'Barlow Condensed, sans-serif', fontSize:13, fontWeight:800, textTransform:'uppercase', letterSpacing:0.5, color:'#fff', display:'flex', alignItems:'center', gap:8, flexWrap:'wrap' }}>
                <Icon icon={Solar.medal} width={18} height={18} /> Top Posters <span style={{ fontSize:10, color:'var(--text-dim)', fontWeight:400, textTransform:'none', letterSpacing:0 }}>this week</span>
              </div>
              {TOP_POSTERS.map((p,i)=>(
                <div key={p.name} style={{ display:'flex', alignItems:'center', gap:10, padding:'10px 14px', borderBottom:i<TOP_POSTERS.length-1?'1px solid var(--border)':'none' }}>
                  <span style={{ fontFamily:'Barlow Condensed, sans-serif', fontSize:14, fontWeight:900, color:i===0?'#f0c040':i===1?'#c0c0c0':i===2?'#cd7f32':'var(--text-dim)', width:18, textAlign:'center', flexShrink:0 }}>{i+1}</span>
                  <span style={{ display:'flex', alignItems:'center' }}>{p.pfp && String(p.pfp).startsWith('http') ? <img src={p.pfp} alt="" style={{ width:28, height:28, borderRadius:6, objectFit:'cover' }} /> : <EmojiSolar emoji={p.pfp || '👤'} size={22} />}</span>
                  <div style={{ flex:1, minWidth:0 }}>
                    {p.slug ? (
                      <Link href={`/profile/${p.slug}`} style={{ fontSize:12, fontWeight:700, color:p.usernameColor || ROLE_COLORS[p.role], textDecoration:'none' }}
                        onMouseEnter={e=>(e.currentTarget.style.textDecoration='underline')}
                        onMouseLeave={e=>(e.currentTarget.style.textDecoration='none')}>{p.name}</Link>
                    ) : (
                      <div style={{ fontSize:12, fontWeight:700, color:p.usernameColor || ROLE_COLORS[p.role] }}>{p.name}</div>
                    )}
                    <RoleBadge role={p.role} />
                  </div>
                  <span style={{ fontFamily:'Barlow Condensed, sans-serif', fontSize:14, fontWeight:800, color:'#fff' }}>{p.posts.toLocaleString()}</span>
                </div>
              ))}
            </div>

            {/* Recent Activity */}
            <div style={{ background:'var(--bg-2)', border:'1px solid var(--border)', borderRadius:10, overflow:'hidden' }}>
              <div style={{ padding:'11px 16px', background:'var(--bg-3)', borderBottom:'1px solid var(--border)', fontFamily:'Barlow Condensed, sans-serif', fontSize:13, fontWeight:800, textTransform:'uppercase', letterSpacing:0.5, color:'#fff', display:'flex', alignItems:'center', gap:8 }}><Icon icon={Solar.bolt} width={18} height={18} /> Recent Activity</div>
              {RECENT_ACTIVITY.map((a,i)=>(
                <Link key={i} href={a.boardSlug && a.threadId ? `/forum/board/${a.boardSlug}/${a.threadId}` : '#'} style={{ display:'block', padding:'9px 14px', borderBottom:i<RECENT_ACTIVITY.length-1?'1px solid var(--border)':'none', cursor:'pointer', transition:'background 0.15s', textDecoration:'none' }}
                  onMouseEnter={e=>(e.currentTarget.style.background='var(--bg-3)')}
                  onMouseLeave={e=>(e.currentTarget.style.background='transparent')}>
                  <div style={{ fontSize:11, color:'#e0e0e8', fontWeight:500, overflow:'hidden', whiteSpace:'nowrap', textOverflow:'ellipsis', marginBottom:3 }}>{a.title}</div>
                  <div style={{ display:'flex', alignItems:'center', gap:4 }}>
                    {a.authorSlug ? (
                      <span role="link" onClick={e=>{e.preventDefault();e.stopPropagation();router.push(`/profile/${a.authorSlug}`)}} style={{ fontSize:10, fontWeight:700, color:a.authorColor || ROLE_COLORS[a.role], textDecoration:'none', cursor:'pointer' }}
                        onMouseEnter={e=>(e.currentTarget.style.textDecoration='underline')} onMouseLeave={e=>(e.currentTarget.style.textDecoration='none')}>{a.author}</span>
                    ) : (
                      <span style={{ fontSize:10, fontWeight:700, color:a.authorColor || ROLE_COLORS[a.role] }}>{a.author}</span>
                    )}
                    <RoleBadge role={a.role} />
                    <span style={{ fontSize:10, color:'var(--text-dim)' }}>in</span>
                    <span style={{ fontSize:10, color:'var(--red)', fontWeight:600 }}>{a.board}</span>
                    <span style={{ fontSize:10, color:'var(--text-dim)', marginLeft:'auto', flexShrink:0 }}>{a.time}</span>
                  </div>
                </Link>
              ))}
            </div>

            {/* User Roles — Admin / Premium / Coach / Member */}
            <div style={{ background:'var(--bg-2)', border:'1px solid var(--border)', borderRadius:10, overflow:'hidden' }}>
              <div style={{ padding:'11px 16px', background:'var(--bg-3)', borderBottom:'1px solid var(--border)', fontFamily:'Barlow Condensed, sans-serif', fontSize:13, fontWeight:800, textTransform:'uppercase', letterSpacing:0.5, color:'#fff', display:'flex', alignItems:'center', gap:8 }}><Icon icon={Solar.user} width={18} height={18} /> User Roles</div>
              <div style={{ padding:'10px 14px', display:'flex', flexDirection:'column', gap:8 }}>
                {Object.entries(ROLE_COLORS).map(([role,color])=>(
                  <div key={role} style={{ display:'flex', alignItems:'center', gap:8 }}>
                    <span style={{ width:8, height:8, background:color, borderRadius:'50%', display:'inline-block', flexShrink:0 }} />
                    <span style={{ fontSize:12, fontWeight:700, color }}>{ROLE_LABELS[role]}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Thread Status Legend */}
            <div style={{ background:'var(--bg-2)', border:'1px solid var(--border)', borderRadius:10, overflow:'hidden' }}>
              <div style={{ padding:'11px 16px', background:'var(--bg-3)', borderBottom:'1px solid var(--border)', fontFamily:'Barlow Condensed, sans-serif', fontSize:13, fontWeight:800, textTransform:'uppercase', letterSpacing:0.5, color:'#fff', display:'flex', alignItems:'center', gap:8 }}><Icon icon={Solar.clipboard} width={18} height={18} /> Thread Status</div>
              <div style={{ padding:'10px 14px', display:'flex', flexDirection:'column', gap:8 }}>
                {[[Solar.fire,'Hot','#f97316'],[Solar.pin,'Pinned','#f0c040'],[Solar.shield,'Official','#38bdf8'],[Solar.lock,'Locked','#888'],[Solar.chat,'Normal','var(--text-muted)']].map(([icon,label,color])=>(
                  <div key={label} style={{ display:'flex', alignItems:'center', gap:6 }}>
                    <Icon icon={icon} width={16} height={16} style={{ flexShrink: 0, color }} />
                    <span style={{ fontSize:12, fontWeight:700, color }}>{label}</span>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  )
}