'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Icon } from '@iconify/react'
import { useAuth } from '@/lib/auth-context'
import { forumApi } from '@/lib/api'
import { sendActivity } from '@/lib/socket'
import { Solar } from '@/lib/solar-duotone'

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
        position: 'relative',
        padding: '48px 0 36px',
        width: '100vw',
        left: '50%',
        right: '50%',
        marginLeft: '-50vw',
        marginRight: '-50vw',
        background: 'var(--bg-2)',
        borderBottom: '1px solid var(--border)',
        overflow: 'hidden'
      }}>
        {/* Background effects */}
        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(circle at 20% 0%, rgba(232,0,13,0.12) 0%, transparent 60%)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', inset: 0, backgroundImage: 'linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)', backgroundSize: '32px 32px', opacity: 0.6, pointerEvents: 'none', maskImage: 'linear-gradient(to bottom, black 20%, transparent 100%)', WebkitMaskImage: 'linear-gradient(to bottom, black 20%, transparent 100%)' }} />

        <div className="container" style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ display:'flex', alignItems:'flex-end', justifyContent:'space-between', flexWrap:'wrap', gap:20 }}>
            <div>
              <div style={{ display:'flex', alignItems:'center', gap:16, marginBottom:12 }}>
                <div style={{ width: 48, height: 48, background: 'linear-gradient(135deg, rgba(232,0,13,0.2), rgba(232,0,13,0.05))', border: '1px solid rgba(232,0,13,0.3)', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 20px rgba(232,0,13,0.2)' }}>
                  <Icon icon={Solar.chat} width={28} height={28} style={{ color: 'var(--red)' }} />
                </div>
                <h1 style={{ fontFamily:'Barlow Condensed, sans-serif', fontSize:42, fontWeight:900, textTransform:'uppercase', color:'#fff', margin:0, lineHeight:1, letterSpacing: 1 }}>Forum</h1>
              </div>
              <p style={{ fontFamily:'Barlow, sans-serif', fontSize:14, color:'var(--text-muted)', margin:0, maxWidth: 600 }}>
                Discuss strategy, find teammates, share clips & connect with the CE community.
              </p>
            </div>
            <div style={{ display:'flex', alignItems:'center', gap:10, background:'rgba(39,174,96,0.1)', border:'1px solid rgba(39,174,96,0.2)', borderRadius:10, padding:'10px 16px', boxShadow: '0 4px 12px rgba(39,174,96,0.05)' }}>
              <Icon icon={Solar.online} width={18} height={18} style={{ flexShrink: 0, color: '#4ade80' }} />
              <span style={{ fontSize:13, fontWeight:700, color:'#4ade80' }}>{FORUM_STATS.online.toLocaleString()} online now</span>
            </div>
          </div>

          {/* Welcome bar */}
          <div style={{ marginTop:32, background:'rgba(255,255,255,0.02)', backdropFilter: 'blur(10px)', border:'1px solid rgba(255,255,255,0.05)', borderRadius:12, padding:'16px 20px', display:'flex', alignItems:'center', justifyContent:'space-between', gap:16, flexWrap:'wrap', boxShadow: '0 4px 20px rgba(0,0,0,0.2)' }}>
            <div style={{ display:'flex', alignItems:'center', gap:16 }}>
              <div style={{ width:44, height:44, background:'rgba(232,0,13,0.15)', border:'1px solid rgba(232,0,13,0.25)', borderRadius:10, display:'flex', alignItems:'center', justifyContent:'center', overflow:'hidden' }}>
                {user?.avatarUrl ? <img src={user.avatarUrl} alt="" style={{ width:44, height:44, borderRadius:10, objectFit:'cover' }} /> : <Icon icon={Solar.user} width={24} height={24} style={{ opacity: 0.7, color: 'var(--red)' }} />}
              </div>
              <div>
                <div style={{ fontSize:15, fontWeight:700, color:user?.usernameColor || '#e74c3c', marginBottom: 2 }}>Welcome back, {user?.username || 'Guest'}</div>
                <div style={{ fontSize:12, color:'var(--text-muted)' }}>Join the conversation and connect with the community</div>
              </div>
            </div>
            <div style={{ display:'flex', gap:12 }}>
              <button style={{ padding:'8px 16px', background:'rgba(255,255,255,0.03)', border:'1px solid var(--border)', borderRadius:8, color:'var(--text-muted)', fontSize:12, fontWeight:700, cursor:'pointer', fontFamily:'Barlow, sans-serif', textTransform:'uppercase', letterSpacing:0.5, transition: 'all 0.2s' }} onMouseEnter={e=>{e.currentTarget.style.background='rgba(255,255,255,0.08)'; e.currentTarget.style.color='#fff'}} onMouseLeave={e=>{e.currentTarget.style.background='rgba(255,255,255,0.03)'; e.currentTarget.style.color='var(--text-muted)'}}>Mark All Read</button>
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
                <div key={cat.name} style={{ marginBottom: 24 }}>
                  <button
                    onClick={() => toggle(cat.name)}
                    style={{ width:'100%', display:'flex', alignItems:'center', gap:12, padding:'0 0 12px 0', background:'transparent', border:'none', cursor:'pointer', textAlign:'left', borderBottom:'1px solid rgba(255,255,255,0.05)', marginBottom: 16 }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 28, height: 28, background: 'rgba(255,255,255,0.03)', borderRadius: 6, border: '1px solid rgba(255,255,255,0.05)' }}>
                      <Icon icon={Solar.chat} width={16} height={16} style={{ display: 'block' }} />
                    </div>
                    <span style={{ fontFamily:'Barlow Condensed, sans-serif', fontSize:20, fontWeight:800, textTransform:'uppercase', letterSpacing:0.5, color:'#fff', flex:1 }}>{cat.name}</span>
                    <span style={{ fontSize:11, color:'var(--text-dim)', fontWeight:600, letterSpacing:0.5, textTransform: 'uppercase' }}>{cat.boards.reduce((a,b)=>a+b.threads,0).toLocaleString()} threads</span>
                    <span style={{ fontSize:12, color:'var(--text-dim)', marginLeft:8, transition: 'transform 0.2s', transform: isCollapsed ? 'rotate(-90deg)' : 'rotate(0deg)' }}>▼</span>
                  </button>

                  {!isCollapsed && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {cat.boards.map((board, bi) => (
                        <div
                          key={board.slug}
                          style={{ background: 'var(--bg-2)', border: '1px solid var(--border)', borderRadius: 12, transition: 'all 0.2s ease', position: 'relative', overflow: 'hidden' }}
                          onMouseEnter={e=>{e.currentTarget.style.borderColor='rgba(255,255,255,0.15)'; e.currentTarget.style.transform='translateY(-1px)'; e.currentTarget.style.boxShadow='0 4px 12px rgba(0,0,0,0.2)'}}
                          onMouseLeave={e=>{e.currentTarget.style.borderColor='var(--border)'; e.currentTarget.style.transform='none'; e.currentTarget.style.boxShadow='none'}}
                        >
                          <div style={{ display:'flex', alignItems:'center', padding:'16px 20px' }}>
                            <Link href={`/forum/board/${board.slug}`} style={{ display:'flex', alignItems:'center', gap:16, textDecoration:'none', flex: 1, minWidth: 0 }}>
                              <div style={{ flexShrink:0, width:46, height:46, background:'linear-gradient(135deg, var(--bg-3), var(--bg-4))', border:'1px solid var(--border)', borderRadius:12, display:'flex', alignItems:'center', justifyContent:'center', boxShadow: 'inset 0 2px 10px rgba(0,0,0,0.2)' }}>
                                <Icon icon={Solar.chat} width={24} height={24} style={{ display: 'block' }} />
                              </div>
                              <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ fontFamily:'Barlow, sans-serif', fontSize:15, fontWeight:700, color:'#fff', marginBottom:4 }}>{board.name}</div>
                                <div style={{ fontSize:12, color:'var(--text-dim)', lineHeight:1.4, maxWidth: '95%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{board.description}</div>
                              </div>
                            </Link>

                            <div style={{ display:'flex', alignItems:'center', gap: 32, flexShrink: 0, marginLeft: 20 }}>
                              <div style={{ display:'flex', gap: 24, textAlign: 'right' }}>
                                <div style={{ display:'flex', flexDirection:'column', alignItems:'flex-end', justifyContent:'center', width: 50 }}>
                                  <span style={{ fontFamily:'Barlow Condensed, sans-serif', fontSize:18, fontWeight:800, color:'#fff' }}>{formatNumber(board.threads)}</span>
                                  <span style={{ fontSize:10, color:'var(--text-dim)', textTransform:'uppercase', letterSpacing:0.5, marginTop:1 }}>threads</span>
                                </div>
                                <div style={{ display:'flex', flexDirection:'column', alignItems:'flex-end', justifyContent:'center', width: 50 }}>
                                  <span style={{ fontFamily:'Barlow Condensed, sans-serif', fontSize:18, fontWeight:800, color:'#fff' }}>{formatNumber(board.posts)}</span>
                                  <span style={{ fontSize:10, color:'var(--text-dim)', textTransform:'uppercase', letterSpacing:0.5, marginTop:1 }}>posts</span>
                                </div>
                              </div>

                              <div style={{ width: 1, height: 32, background: 'var(--border)' }}></div>

                              <div style={{ display:'flex', flexDirection:'column', justifyContent:'center', width: 200, minWidth: 200 }}>
                                {board.lastPost.title === '—' || !board.lastPost.title ? (
                                  <span style={{ fontSize:12, color:'var(--text-dim)', fontStyle: 'italic' }}>No posts yet</span>
                                ) : (<>
                                  <div style={{ fontSize:12, color:'#e0e0e8', fontWeight:600, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis', marginBottom:4 }}>{board.lastPost.title}</div>
                                  <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                                    {board.lastPost.authorSlug ? (
                                      <span role="link" onClick={e=>{e.preventDefault();e.stopPropagation();router.push(`/profile/${board.lastPost.authorSlug}`)}} style={{ fontSize:11, fontWeight:700, color:board.lastPost.authorColor || ROLE_COLORS[board.lastPost.authorRole] || '#888', textDecoration:'none', cursor:'pointer' }}
                                        onMouseEnter={e=>(e.currentTarget.style.textDecoration='underline')} onMouseLeave={e=>(e.currentTarget.style.textDecoration='none')}>{board.lastPost.author}</span>
                                    ) : (
                                      <span style={{ fontSize:11, fontWeight:700, color:board.lastPost.authorColor || ROLE_COLORS[board.lastPost.authorRole] || '#888' }}>{board.lastPost.author}</span>
                                    )}
                                    <span style={{ fontSize:10, color:'var(--text-dim)' }}>· {board.lastPost.time}</span>
                                  </div>
                                </>)}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )
            })}

          </div>

          {/* RIGHT SIDEBAR */}
          <div style={{ display:'flex', flexDirection:'column', gap:20 }}>

            {/* Forum Stats */}
            <div style={{ background:'var(--bg-2)', border:'1px solid var(--border)', borderRadius:12, padding: 16, boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
              <div style={{ fontFamily:'Barlow Condensed, sans-serif', fontSize:16, fontWeight:800, textTransform:'uppercase', letterSpacing:0.5, color:'#fff', display:'flex', alignItems:'center', gap:8, marginBottom: 12 }}>
                <Icon icon={Solar.chart} width={18} height={18} style={{ color: 'var(--red)' }} /> Forum Stats
              </div>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
                {[{label:'Members',value:formatNumber(FORUM_STATS.members),color:'#fff'},{label:'Threads',value:formatNumber(FORUM_STATS.threads),color:'#fff'},{label:'Posts',value:formatNumber(FORUM_STATS.posts),color:'#fff'},{label:'Online',value:formatNumber(FORUM_STATS.online),color:'#4ade80'}].map(s=>(
                  <div key={s.label} style={{ background:'var(--bg-3)', border: '1px solid var(--border)', borderRadius: 8, padding:'12px', textAlign:'center' }}>
                    <div style={{ fontFamily:'Barlow Condensed, sans-serif', fontSize:22, fontWeight:800, color:s.color, lineHeight: 1 }}>{s.value}</div>
                    <div style={{ fontSize:10, color:'var(--text-dim)', textTransform:'uppercase', letterSpacing:0.5, marginTop:4, fontWeight: 600 }}>{s.label}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Top Posters */}
            <div style={{ background:'var(--bg-2)', border:'1px solid var(--border)', borderRadius:12, padding: 16, boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
              <div style={{ fontFamily:'Barlow Condensed, sans-serif', fontSize:16, fontWeight:800, textTransform:'uppercase', letterSpacing:0.5, color:'#fff', display:'flex', alignItems:'center', gap:8, marginBottom: 12, flexWrap:'wrap' }}>
                <Icon icon={Solar.medal} width={18} height={18} style={{ color: '#f0c040' }} /> Top Posters <span style={{ fontSize:10, color:'var(--text-dim)', fontWeight:600, textTransform:'uppercase', letterSpacing:0.5, marginLeft: 'auto' }}>This Week</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {TOP_POSTERS.map((p,i)=>(
                  <div key={p.name} style={{ display:'flex', alignItems:'center', gap:10, padding:'8px 12px', background: 'var(--bg-3)', border: '1px solid var(--border)', borderRadius: 8 }}>
                    <span style={{ fontFamily:'Barlow Condensed, sans-serif', fontSize:14, fontWeight:900, color:i===0?'#f0c040':i===1?'#c0c0c0':i===2?'#cd7f32':'var(--text-dim)', width:16, textAlign:'center', flexShrink:0 }}>{i+1}</span>
                    <span style={{ display:'flex', alignItems:'center' }}>{p.pfp && String(p.pfp).startsWith('http') ? <img src={p.pfp} alt="" style={{ width:28, height:28, borderRadius:6, objectFit:'cover' }} /> : <Icon icon={Solar.user} width={22} height={22} />}</span>
                    <div style={{ flex:1, minWidth:0 }}>
                      {p.slug ? (
                        <Link href={`/profile/${p.slug}`} style={{ fontSize:13, fontWeight:700, color:p.usernameColor || ROLE_COLORS[p.role], textDecoration:'none', display: 'block', marginBottom: 2 }}
                          onMouseEnter={e=>(e.currentTarget.style.textDecoration='underline')}
                          onMouseLeave={e=>(e.currentTarget.style.textDecoration='none')}>{p.name}</Link>
                      ) : (
                        <div style={{ fontSize:13, fontWeight:700, color:p.usernameColor || ROLE_COLORS[p.role], marginBottom: 2 }}>{p.name}</div>
                      )}
                      <RoleBadge role={p.role} />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                      <span style={{ fontFamily:'Barlow Condensed, sans-serif', fontSize:16, fontWeight:800, color:'#fff', lineHeight: 1 }}>{p.posts.toLocaleString()}</span>
                      <span style={{ fontSize: 9, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: 0.5, marginTop: 2 }}>Posts</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Recent Activity */}
            <div style={{ background:'var(--bg-2)', border:'1px solid var(--border)', borderRadius:12, padding: 16, boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
              <div style={{ fontFamily:'Barlow Condensed, sans-serif', fontSize:16, fontWeight:800, textTransform:'uppercase', letterSpacing:0.5, color:'#fff', display:'flex', alignItems:'center', gap:8, marginBottom: 12 }}>
                <Icon icon={Solar.bolt} width={18} height={18} style={{ color: '#38bdf8' }} /> Recent Activity
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {RECENT_ACTIVITY.map((a,i)=>(
                  <Link key={i} href={a.boardSlug && a.threadId ? `/forum/board/${a.boardSlug}/${a.threadId}` : '#'} style={{ display:'block', padding:'10px 12px', background: 'var(--bg-3)', border: '1px solid var(--border)', borderRadius: 8, cursor:'pointer', transition:'all 0.15s', textDecoration:'none' }}
                    onMouseEnter={e=>{e.currentTarget.style.borderColor='rgba(255,255,255,0.15)'; e.currentTarget.style.transform='translateY(-1px)'}}
                    onMouseLeave={e=>{e.currentTarget.style.borderColor='var(--border)'; e.currentTarget.style.transform='none'}}>
                    <div style={{ fontSize:12, color:'#fff', fontWeight:600, overflow:'hidden', whiteSpace:'nowrap', textOverflow:'ellipsis', marginBottom:6 }}>{a.title}</div>
                    <div style={{ display:'flex', alignItems:'center', gap:6, flexWrap: 'wrap' }}>
                      {a.authorSlug ? (
                        <span role="link" onClick={e=>{e.preventDefault();e.stopPropagation();router.push(`/profile/${a.authorSlug}`)}} style={{ fontSize:11, fontWeight:700, color:a.authorColor || ROLE_COLORS[a.role], textDecoration:'none', cursor:'pointer' }}
                          onMouseEnter={e=>(e.currentTarget.style.textDecoration='underline')} onMouseLeave={e=>(e.currentTarget.style.textDecoration='none')}>{a.author}</span>
                      ) : (
                        <span style={{ fontSize:11, fontWeight:700, color:a.authorColor || ROLE_COLORS[a.role] }}>{a.author}</span>
                      )}
                      <span style={{ fontSize:10, color:'var(--text-dim)' }}>in</span>
                      <span style={{ fontSize:10, color:'var(--red)', fontWeight:600 }}>{a.board}</span>
                      <span style={{ fontSize:10, color:'var(--text-dim)', marginLeft:'auto', flexShrink:0 }}>{a.time}</span>
                    </div>
                  </Link>
                ))}
              </div>
            </div>

            {/* User Roles */}
            <div style={{ background:'var(--bg-2)', border:'1px solid var(--border)', borderRadius:12, padding: 16, boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
              <div style={{ fontFamily:'Barlow Condensed, sans-serif', fontSize:16, fontWeight:800, textTransform:'uppercase', letterSpacing:0.5, color:'#fff', display:'flex', alignItems:'center', gap:8, marginBottom: 12 }}>
                <Icon icon={Solar.user} width={18} height={18} style={{ color: 'var(--text-muted)' }} /> User Roles
              </div>
              <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                {Object.entries(ROLE_COLORS).map(([role,color])=>(
                  <div key={role} style={{ display:'flex', alignItems:'center', gap:10, padding: '8px 12px', background: 'var(--bg-3)', border: '1px solid var(--border)', borderRadius: 8 }}>
                    <span style={{ width:10, height:10, background:color, borderRadius:'50%', display:'inline-block', flexShrink:0, boxShadow: `0 0 8px ${color}80` }} />
                    <span style={{ fontSize:13, fontWeight:700, color }}>{ROLE_LABELS[role]}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Thread Status Legend */}
            <div style={{ background:'var(--bg-2)', border:'1px solid var(--border)', borderRadius:12, padding: 16, boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
              <div style={{ fontFamily:'Barlow Condensed, sans-serif', fontSize:16, fontWeight:800, textTransform:'uppercase', letterSpacing:0.5, color:'#fff', display:'flex', alignItems:'center', gap:8, marginBottom: 12 }}>
                <Icon icon={Solar.clipboard} width={18} height={18} style={{ color: 'var(--text-muted)' }} /> Thread Status
              </div>
              <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                {[[Solar.fire,'Hot','#f97316'],[Solar.pin,'Pinned','#f0c040'],[Solar.shield,'Official','#38bdf8'],[Solar.lock,'Locked','#888'],[Solar.chat,'Normal','var(--text-muted)']].map(([icon,label,color])=>(
                  <div key={label} style={{ display:'flex', alignItems:'center', gap:10, padding: '8px 12px', background: 'var(--bg-3)', border: '1px solid var(--border)', borderRadius: 8 }}>
                    <div style={{ width: 24, height: 24, background: `rgba(${color === '#f97316' ? '249,115,22' : color === '#f0c040' ? '240,192,64' : color === '#38bdf8' ? '56,189,248' : color === '#888' ? '136,136,136' : '136,136,136'}, 0.1)`, borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Icon icon={icon} width={14} height={14} style={{ flexShrink: 0, color }} />
                    </div>
                    <span style={{ fontSize:13, fontWeight:700, color }}>{label}</span>
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