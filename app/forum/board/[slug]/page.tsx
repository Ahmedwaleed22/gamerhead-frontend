'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'
import { forumApi } from '@/lib/api'

type ThreadState = 'hot' | 'pinned' | 'locked' | 'official' | 'normal'

interface Thread {
  id: string
  title: string
  state: ThreadState[]
  tags: string[]
  author: string
  authorSlug: string
  authorRole: string
  authorColor: string
  authorPfp: string
  createdAt: string
  lastReplyAt: string
  lastReplyBy: string
  lastReplyBySlug: string
  lastReplyByColor: string
  lastReplyByPfp: string
  lastReplyPreview: string
  replies: number
  views: number
  preview: string
}

type SortKey = 'latest' | 'replies' | 'views' | 'newest'


const ROLE_COLORS: Record<string, string> = { admin: '#e8000d', premium: '#F0AA1A', coach: '#3CC8C8', mod: '#27AE60', pro: '#F0AA1A', veteran: '#3CC8C8', member: '#888' }
const ROLE_LABELS: Record<string, string> = { admin: 'Admin', premium: 'Premium', coach: 'Coach', mod: 'Mod', pro: 'Pro', veteran: 'Veteran', member: 'Member' }

function timeAgo(dateStr: string): string {
  if (!dateStr) return ''
  const diff = Date.now() - new Date(dateStr).getTime()
  if (isNaN(diff)) return dateStr
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  if (days < 7) return `${days}d ago`
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function Avatar({ src, size = 36, style }: { src: string; size?: number; style?: React.CSSProperties }) {
  if (src && (src.startsWith('http') || src.startsWith('/') || src.startsWith('data:image'))) {
    return <img src={src} alt="" style={{ width: size, height: size, borderRadius: 8, objectFit: 'cover', ...style }} />
  }
  return <span style={{ fontSize: size * 0.55, lineHeight: 1, ...style }}>{src || '👤'}</span>
}

function ThreadStateBadge({ state }: { state: ThreadState }) {
  const configs: Record<ThreadState, { label: string; bg: string; color: string; border: string; icon: string }> = {
    hot:      { label: 'Hot',      icon: '🔥', bg: 'rgba(232,100,13,0.12)',  color: '#f97316', border: 'rgba(232,100,13,0.3)'   },
    pinned:   { label: 'Pinned',   icon: '📌', bg: 'rgba(255,200,50,0.12)',  color: '#f0c040', border: 'rgba(255,200,50,0.3)'   },
    locked:   { label: 'Locked',   icon: '🔒', bg: 'rgba(120,120,140,0.12)', color: '#888',    border: 'rgba(120,120,140,0.25)' },
    official: { label: 'Official', icon: '🛡️', bg: 'rgba(0,180,232,0.1)',    color: '#38bdf8', border: 'rgba(0,180,232,0.25)'  },
    normal:   { label: '',         icon: '',   bg: '',                        color: '',        border: ''                      },
  }
  const c = configs[state]
  if (!c.label) return null
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3, background: c.bg, border: `1px solid ${c.border}`, color: c.color, fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 4, letterSpacing: 0.4, textTransform: 'uppercase', whiteSpace: 'nowrap' }}>
      {c.icon} {c.label}
    </span>
  )
}

function RoleBadge({ role }: { role: string }) {
  const color = ROLE_COLORS[role] || '#888'
  return (
    <span style={{ fontSize: 9, fontWeight: 700, color, background: `${color}18`, border: `1px solid ${color}30`, borderRadius: 3, padding: '1px 5px', letterSpacing: 0.3, textTransform: 'uppercase', flexShrink: 0 }}>
      {ROLE_LABELS[role]}
    </span>
  )
}

function formatNumber(n: number): string {
  if (n >= 1000) return (n / 1000).toFixed(1) + 'k'
  return n.toString()
}

export default function ForumBoardPage() {
  const params = useParams()
  const router = useRouter()
  const slug = params.slug as string
  const { user } = useAuth()

  const [sort, setSort] = useState<SortKey>('latest')
  const [search, setSearch] = useState('')
  const [board, setBoard] = useState<any>({
    id: '',
    name: '',
    emoji: '',
    category: '',
    categorySlug: '',
    description: '',
    totalThreads: 0,
    totalPosts: 0,
    lastPost: { author: '', time: '' },
    moderators: [],
    relatedBoards: [],
  })
  const [threads, setThreads] = useState<Thread[]>([])
  const [showNewThread, setShowNewThread] = useState(false)
  const [newTitle, setNewTitle] = useState('')
  const [newContent, setNewContent] = useState('')
  const [newTags, setNewTags] = useState('')
  const [creating, setCreating] = useState(false)

  // Derive user role for permission checks
  const userRole = user?.role === 'admin' ? 'admin' : (user as any)?.isCoach ? 'coach' : (user as any)?.isPremium ? 'premium' : user ? 'member' : null
  const postRoles = board?.postRoles || []
  const canPost = postRoles.length === 0 || (userRole && postRoles.includes(userRole))

  useEffect(() => {
    if (!slug) return

    forumApi.getBoard(slug).then((data: any) => {
      setBoard({
        id: data.slug || data.id || slug,
        name: data.name || data.title || '',
        emoji: data.emoji || data.icon || '',
        category: data.category || data.categoryName || '',
        categorySlug: data.categorySlug || '',
        description: data.description || '',
        totalThreads: data.totalThreads ?? data.threadCount ?? 0,
        totalPosts: data.totalPosts ?? data.postCount ?? 0,
        lastPost: {
          author: data.lastPost?.author || data.lastPost?.username || '',
          time: data.lastPost?.time || data.lastPost?.createdAt || '',
        },
        moderators: data.moderators || [],
        relatedBoards: (data.relatedBoards || []).map((b: any) => ({
          name: b.name || b.title || '',
          emoji: b.emoji || b.icon || '',
          slug: b.slug || '',
          threads: b.threads ?? b.threadCount ?? 0,
        })),
        postRoles: data.postRoles || [],
        viewRoles: data.viewRoles || [],
      })
    }).catch(() => {})

    forumApi.getThreads(slug, { page: 1, sort, search }).then((data: any) => {
      const list = Array.isArray(data) ? data : data.items || data.threads || data.data || []
      setThreads(list.map((t: any) => ({
        id: t._id || t.id,
        title: t.title || '',
        state: (() => {
          if (t.state || t.states) return t.state || t.states
          const s: ThreadState[] = []
          if (t.isPinned) s.push('pinned')
          if (t.isOfficial) s.push('official')
          if (t.isHot) s.push('hot')
          if (t.status === 'locked') s.push('locked')
          return s.length ? s : ['normal']
        })(),
        tags: t.tags || [],
        author: t.authorName || t.author?.username || t.author || '',
        authorSlug: t.authorSlug || '',
        authorRole: t.authorRole || t.author?.role || 'member',
        authorColor: t.authorColor || '',
        authorPfp: t.authorAvatar || t.author?.avatar || t.authorPfp || '👤',
        createdAt: t.createdAt ? timeAgo(t.createdAt) : '',
        lastReplyAt: t.lastReplyAt ? timeAgo(t.lastReplyAt) : '',
        lastReplyBy: t.lastReplyBy || t.lastReply?.username || '',
        lastReplyBySlug: t.lastReplyBySlug || '',
        lastReplyByColor: t.lastReplyByColor || '',
        lastReplyByPfp: t.lastReplyByPfp || t.lastReply?.avatar || '👤',
        lastReplyPreview: t.lastReplyPreview || '',
        replies: t.replies ?? t.replyCount ?? 0,
        views: t.views ?? t.viewCount ?? 0,
        preview: t.preview || t.excerpt || '',
      })))
      if (data.total !== undefined) {
        setBoard((prev: any) => ({ ...prev, totalThreads: data.total }))
      }
    }).catch(() => {})
  }, [slug, sort, search])

  const sortedThreads = [...threads]
    .filter(t => !search || t.title.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => {
      const aSticky = a.state.includes('pinned') || a.state.includes('official')
      const bSticky = b.state.includes('pinned') || b.state.includes('official')
      if (aSticky !== bSticky) return aSticky ? -1 : 1
      if (sort === 'replies') return b.replies - a.replies
      if (sort === 'views')   return b.views   - a.views
      if (sort === 'newest')  return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      return new Date(b.lastReplyAt || b.createdAt).getTime() - new Date(a.lastReplyAt || a.createdAt).getTime()
    })

  const handleCreateThread = async () => {
    if (!newTitle.trim() || !newContent.trim() || creating) return
    setCreating(true)
    try {
      const tags = newTags.split(',').map(t => t.trim()).filter(Boolean)
      const res = await forumApi.createThread({ title: newTitle.trim(), boardSlug: slug, content: newContent.trim(), tags })
      const created = res as any
      setThreads(prev => [{
        id: created._id || created.id,
        title: created.title || newTitle.trim(),
        state: ['normal'] as ThreadState[],
        tags: created.tags || tags,
        author: (user as any)?.displayName || user?.username || '',
        authorSlug: user?.slug || '',
        authorRole: (user?.role as any) || 'member',
        authorColor: (user as any)?.usernameColor || '',
        authorPfp: '👤',
        createdAt: 'just now',
        lastReplyAt: 'just now',
        lastReplyBy: (user as any)?.displayName || user?.username || '',
        lastReplyBySlug: user?.slug || '',
        lastReplyByColor: (user as any)?.usernameColor || '',
        lastReplyByPfp: '👤',
        lastReplyPreview: '',
        replies: 0,
        views: 0,
        preview: newContent.trim().slice(0, 200),
      }, ...prev])
      setBoard((prev: any) => ({ ...prev, totalThreads: prev.totalThreads + 1 }))
      setShowNewThread(false)
      setNewTitle('')
      setNewContent('')
      setNewTags('')
    } catch (err) {
      console.error('Failed to create thread:', err)
    } finally {
      setCreating(false)
    }
  }

  const handlePinThread = async (threadId: string | number, currentlyPinned: boolean) => {
    try {
      await forumApi.updateThread(String(threadId), { isPinned: !currentlyPinned })
      setThreads(prev => prev.map(t => t.id === threadId ? { ...t, state: !currentlyPinned ? [...t.state.filter(s => s !== 'normal'), 'pinned'] : t.state.filter(s => s !== 'pinned') } : t))
    } catch (err) { console.error('Failed to pin thread:', err) }
  }

  const handleLockThread = async (threadId: string | number, currentlyLocked: boolean) => {
    try {
      await forumApi.updateThread(String(threadId), { status: currentlyLocked ? 'open' : 'locked' })
      setThreads(prev => prev.map(t => t.id === threadId ? { ...t, state: currentlyLocked ? t.state.filter(s => s !== 'locked') : [...t.state, 'locked'] } : t))
    } catch (err) { console.error('Failed to lock thread:', err) }
  }

  const handleOfficialThread = async (threadId: string | number, currentlyOfficial: boolean) => {
    try {
      await forumApi.updateThread(String(threadId), { isOfficial: !currentlyOfficial })
      setThreads(prev => prev.map(t => t.id === threadId ? { ...t, state: !currentlyOfficial ? [...t.state.filter(s => s !== 'normal'), 'official'] : t.state.filter(s => s !== 'official') } : t))
    } catch (err) { console.error('Failed to update thread:', err) }
  }

  const handleDeleteThread = async (threadId: string | number) => {
    if (!confirm('Are you sure you want to delete this thread?')) return
    try {
      await forumApi.deleteThread(String(threadId))
      setThreads(prev => prev.filter(t => t.id !== threadId))
      setBoard((prev: any) => ({ ...prev, totalThreads: Math.max(0, prev.totalThreads - 1) }))
    } catch (err) { console.error('Failed to delete thread:', err) }
  }

  const SORT_OPTIONS: { key: SortKey; label: string }[] = [
    { key: 'latest',  label: 'Latest Reply' },
    { key: 'replies', label: 'Most Replies' },
    { key: 'views',   label: 'Most Views'   },
    { key: 'newest',  label: 'Newest'       },
  ]

  return (
    <div style={{ paddingBottom: 60 }}>

      {/* ── BOARD HEADER ── */}
      <div style={{ background: 'linear-gradient(135deg, #0f0f18, #130d16)', borderBottom: '1px solid rgba(255,255,255,0.07)', padding: '32px 0 0' }}>
        <div className="container">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, marginBottom: 20 }}>
            <Link href="/forum" style={{ color: 'var(--text-muted)', textDecoration: 'none' }} onMouseEnter={e => (e.currentTarget.style.color = 'var(--red)')} onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-muted)')}>Forum</Link>
            <span style={{ color: 'var(--text-dim)' }}>›</span>
            <Link href="/forum" style={{ color: 'var(--text-muted)', textDecoration: 'none' }} onMouseEnter={e => (e.currentTarget.style.color = 'var(--red)')} onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-muted)')}>{board.category || 'Category'}</Link>
            <span style={{ color: 'var(--text-dim)' }}>›</span>
            <span style={{ color: 'var(--red)', fontWeight: 600 }}>{board.name || 'Board'}</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 20, justifyContent: 'space-between', flexWrap: 'wrap', paddingBottom: 28 }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 18 }}>
              <div style={{ width: 64, height: 64, background: 'linear-gradient(135deg, rgba(232,0,13,0.15), rgba(13,21,32,0.8))', border: '1px solid rgba(232,0,13,0.25)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 30, flexShrink: 0 }}>
                {board.emoji}
              </div>
              <div>
                <h1 style={{ fontFamily: 'Barlow Condensed, sans-serif', fontSize: 36, fontWeight: 900, textTransform: 'uppercase', color: '#fff', margin: '0 0 6px', lineHeight: 1 }}>{board.name}</h1>
                <p style={{ fontFamily: 'Barlow, sans-serif', fontSize: 13, color: 'var(--text-muted)', margin: '0 0 10px', maxWidth: 460 }}>{board.description}</p>
                <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
                  {[
                    { label: 'Threads',   value: board.totalThreads.toLocaleString() },
                    { label: 'Posts',     value: board.totalPosts.toLocaleString()   },
                    { label: 'Last Post', value: `${board.lastPost.author} · ${board.lastPost.time}` },
                  ].map((s, i) => (
                    <div key={i}>
                      <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: 0.6 }}>{s.label}</div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: '#fff', marginTop: 2 }}>{s.value}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            {canPost && <button className="btn-primary" style={{ fontSize: 12, padding: '9px 20px' }} onClick={() => setShowNewThread(true)}>✏️ New Thread</button>}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12, borderTop: '1px solid rgba(255,255,255,0.06)', padding: '10px 0 0' }}>
            <span style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.6, color: 'var(--text-dim)' }}>Moderators:</span>
            {board.moderators.map((m: string, i: number) => (
              <span key={i} style={{ fontSize: 11, fontWeight: 600, color: '#27AE60', cursor: 'pointer' }}>{m}</span>
            ))}
          </div>
        </div>
      </div>

      {/* ── MAIN BODY ── */}
      <div className="container" style={{ marginTop: 28 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 250px', gap: 20, alignItems: 'start' }}>

          <div>
            {/* Controls */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14, flexWrap: 'wrap' }}>
              <div style={{ position: 'relative', flex: 1, minWidth: 180 }}>
                <span style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', fontSize: 13, color: 'var(--text-dim)', pointerEvents: 'none' }}>🔍</span>
                <input type="text" placeholder="Search threads..." value={search} onChange={e => setSearch(e.target.value)} className="site-input" style={{ paddingLeft: 32, fontSize: 12, height: 34, width: '100%' }} />
              </div>
              <div style={{ display: 'flex', gap: 4 }}>
                {SORT_OPTIONS.map(opt => (
                  <button key={opt.key} onClick={() => setSort(opt.key)} style={{ padding: '5px 12px', background: sort === opt.key ? 'var(--red)' : 'var(--bg-3)', border: `1px solid ${sort === opt.key ? 'var(--red)' : 'var(--border)'}`, borderRadius: 20, color: sort === opt.key ? '#fff' : 'var(--text-muted)', fontSize: 11, fontWeight: 700, cursor: 'pointer', fontFamily: 'Barlow, sans-serif', textTransform: 'uppercase', letterSpacing: 0.4, whiteSpace: 'nowrap', transition: 'all 0.15s' }}>
                    {opt.label}
                  </button>
                ))}
              </div>
              <span style={{ fontSize: 12, color: 'var(--text-dim)', whiteSpace: 'nowrap' }}>{board.totalThreads} thread{board.totalThreads !== 1 ? 's' : ''}</span>
            </div>

            {/* Thread table */}
            <div style={{ background: 'var(--bg-2)', border: '1px solid var(--border)', borderRadius: 10, overflow: 'hidden' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 80px 70px 180px', background: 'var(--bg-3)', borderBottom: '1px solid var(--border)', padding: '9px 16px' }}>
                {['Thread', 'Replies', 'Views', 'Last Reply'].map((h, i) => (
                  <div key={h} style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.7, color: 'var(--text-muted)', textAlign: i > 0 ? 'center' : 'left' }}>{h}</div>
                ))}
              </div>

              {sortedThreads.length === 0 ? (
                <div style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--text-dim)', fontSize: 13 }}>No threads found matching "{search}"</div>
              ) : (
                sortedThreads.map((thread, idx) => {
                  const isLocked = thread.state.includes('locked')
                  const isPinned = thread.state.includes('pinned')
                  const isSticky = isPinned || thread.state.includes('official')

                  return (
                    // ✅ THE FIX: Link wraps the entire row
                    <React.Fragment key={thread.id}>
                    <Link
                      href={isLocked ? '#' : `/forum/board/${board.id}/${thread.id}`}
                      style={{
                        display: 'grid',
                        gridTemplateColumns: '1fr 80px 70px 180px',
                        borderBottom: idx < sortedThreads.length - 1 ? '1px solid var(--border)' : 'none',
                        background: isSticky ? 'rgba(255,255,255,0.015)' : 'transparent',
                        transition: 'background 0.15s',
                        cursor: isLocked ? 'default' : 'pointer',
                        textDecoration: 'none',
                        color: 'inherit',
                      }}
                      onMouseEnter={e => { if (!isLocked) (e.currentTarget as HTMLAnchorElement).style.background = 'var(--bg-3)' }}
                      onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.background = isSticky ? 'rgba(255,255,255,0.015)' : 'transparent' }}
                    >
                      {/* Thread info */}
                      <div style={{ padding: '13px 16px', display: 'flex', gap: 12, alignItems: 'flex-start', minWidth: 0 }}>
                        <div style={{ width: 36, height: 36, background: isLocked ? 'rgba(120,120,140,0.1)' : isSticky ? 'rgba(232,0,13,0.1)' : 'var(--bg-4)', border: `1px solid ${isLocked ? 'rgba(120,120,140,0.15)' : isSticky ? 'rgba(232,0,13,0.2)' : 'var(--border)'}`, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, flexShrink: 0, marginTop: 1 }}>
                          {isLocked ? '🔒' : isPinned ? '📌' : thread.state.includes('official') ? '🛡️' : thread.state.includes('hot') ? '🔥' : '💬'}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 5, flexWrap: 'wrap', marginBottom: 5 }}>
                            {thread.state.filter(s => s !== 'normal').map(s => <ThreadStateBadge key={s} state={s} />)}
                            {thread.tags.map(tag => (
                              <span key={tag} style={{ fontSize: 10, fontWeight: 600, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: 'var(--text-muted)', padding: '2px 7px', borderRadius: 4, whiteSpace: 'nowrap' }}>{tag}</span>
                            ))}
                          </div>
                          <div style={{ fontFamily: 'Barlow, sans-serif', fontSize: 13, fontWeight: 700, color: isLocked ? 'var(--text-muted)' : '#f0f0f0', lineHeight: 1.4, marginBottom: 5, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' as any }}>
                            {thread.title}
                          </div>
                          <div style={{ fontSize: 11, color: 'var(--text-dim)', overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis', marginBottom: 6 }}>{thread.preview}</div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <Avatar src={thread.authorPfp} size={20} />
                            {thread.authorSlug ? (
                              <span
                                role="link"
                                onClick={e => { e.preventDefault(); e.stopPropagation(); router.push(`/profile/${thread.authorSlug}`) }}
                                style={{ fontSize: 11, fontWeight: 600, color: thread.authorColor || ROLE_COLORS[thread.authorRole] || '#888', textDecoration: 'none', cursor: 'pointer' }}
                                onMouseEnter={e=>(e.currentTarget.style.textDecoration='underline')} onMouseLeave={e=>(e.currentTarget.style.textDecoration='none')}>{thread.author}</span>
                            ) : (
                              <span style={{ fontSize: 11, fontWeight: 600, color: thread.authorColor || ROLE_COLORS[thread.authorRole] || '#888' }}>{thread.author}</span>
                            )}
                            <RoleBadge role={thread.authorRole} />
                            <span style={{ fontSize: 10, color: 'var(--text-dim)' }}>· {thread.createdAt}</span>
                          </div>
                        </div>
                      </div>

                      {/* Replies */}
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '13px 8px' }}>
                        <span style={{ fontFamily: 'Barlow Condensed, sans-serif', fontSize: 18, fontWeight: 800, color: thread.replies > 100 ? '#f0c040' : '#fff' }}>{formatNumber(thread.replies)}</span>
                        <span style={{ fontSize: 9, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: 0.4, marginTop: 1 }}>replies</span>
                      </div>

                      {/* Views */}
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '13px 8px' }}>
                        <span style={{ fontFamily: 'Barlow Condensed, sans-serif', fontSize: 18, fontWeight: 800, color: thread.views > 5000 ? 'var(--red)' : '#fff' }}>{formatNumber(thread.views)}</span>
                        <span style={{ fontSize: 9, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: 0.4, marginTop: 1 }}>views</span>
                      </div>

                      {/* Last reply */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '13px 14px', minWidth: 0 }}>
                        <Avatar src={thread.lastReplyByPfp} size={28} />
                        <div style={{ minWidth: 0, flex: 1 }}>
                          {thread.lastReplyPreview && (
                            <div style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: 2, overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>{thread.lastReplyPreview}</div>
                          )}
                          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                            {thread.lastReplyBySlug ? (
                              <span
                                role="link"
                                onClick={e => { e.preventDefault(); e.stopPropagation(); router.push(`/profile/${thread.lastReplyBySlug}`) }}
                                style={{ fontSize: 11, fontWeight: 700, color: thread.lastReplyByColor || '#e0e0e8', cursor: 'pointer', textDecoration: 'none' }}
                                onMouseEnter={e=>(e.currentTarget.style.textDecoration='underline')} onMouseLeave={e=>(e.currentTarget.style.textDecoration='none')}>{thread.lastReplyBy}</span>
                            ) : (
                              <span style={{ fontSize: 11, fontWeight: 700, color: thread.lastReplyByColor || '#e0e0e8' }}>{thread.lastReplyBy}</span>
                            )}
                            <span style={{ fontSize: 10, color: 'var(--text-dim)' }}>· {thread.lastReplyAt}</span>
                          </div>
                        </div>
                      </div>
                    </Link>
                    {user?.role === 'admin' && (
                      <div style={{ display:'flex', gap:6, padding:'4px 16px 8px', background: isSticky ? 'rgba(255,255,255,0.015)' : 'transparent', borderBottom: idx < sortedThreads.length - 1 ? '1px solid var(--border)' : 'none' }}>
                        <button onClick={(e) => { e.preventDefault(); handlePinThread(thread.id, isPinned) }} style={{ fontSize:10, fontWeight:700, color: isPinned ? '#f0c040' : 'var(--text-dim)', background:'none', border:'1px solid var(--border)', borderRadius:4, padding:'2px 8px', cursor:'pointer' }}>
                          📌 {isPinned ? 'Unpin' : 'Pin'}
                        </button>
                        <button onClick={(e) => { e.preventDefault(); handleLockThread(thread.id, isLocked) }} style={{ fontSize:10, fontWeight:700, color: isLocked ? '#888' : 'var(--text-dim)', background:'none', border:'1px solid var(--border)', borderRadius:4, padding:'2px 8px', cursor:'pointer' }}>
                          🔒 {isLocked ? 'Unlock' : 'Lock'}
                        </button>
                        <button onClick={(e) => { e.preventDefault(); handleOfficialThread(thread.id, thread.state.includes('official')) }} style={{ fontSize:10, fontWeight:700, color: thread.state.includes('official') ? '#38bdf8' : 'var(--text-dim)', background:'none', border:'1px solid var(--border)', borderRadius:4, padding:'2px 8px', cursor:'pointer' }}>
                          🛡️ {thread.state.includes('official') ? 'Unofficial' : 'Official'}
                        </button>
                        <button onClick={(e) => { e.preventDefault(); handleDeleteThread(thread.id) }} style={{ fontSize:10, fontWeight:700, color:'var(--red)', background:'none', border:'1px solid rgba(232,0,13,0.3)', borderRadius:4, padding:'2px 8px', cursor:'pointer', marginLeft:'auto' }}>
                          🗑 Delete
                        </button>
                      </div>
                    )}
                    </React.Fragment>
                  )
                })
              )}
            </div>

            {/* Pagination */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 16 }}>
              <span style={{ fontSize: 12, color: 'var(--text-dim)' }}>Showing {sortedThreads.length} of {board.totalThreads.toLocaleString()} threads</span>
              <div style={{ display: 'flex', gap: 4 }}>
                {['←', '1', '2', '3', '...', '28', '→'].map((p, i) => (
                  <button key={i} style={{ width: 30, height: 30, background: p === '1' ? 'var(--red)' : 'var(--bg-3)', border: `1px solid ${p === '1' ? 'var(--red)' : 'var(--border)'}`, borderRadius: 6, color: p === '1' ? '#fff' : 'var(--text-muted)', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'Barlow Condensed, sans-serif', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {p}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* ── SIDEBAR ── */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ background: 'var(--bg-2)', border: '1px solid var(--border)', borderRadius: 10, overflow: 'hidden' }}>
              <div style={{ padding: '11px 16px', background: 'var(--bg-3)', borderBottom: '1px solid var(--border)', fontFamily: 'Barlow Condensed, sans-serif', fontSize: 13, fontWeight: 800, textTransform: 'uppercase', letterSpacing: 0.5, color: '#fff' }}>Thread Status</div>
              <div style={{ padding: '10px 14px', display: 'flex', flexDirection: 'column', gap: 8 }}>
                {[
                  { icon: '🔥', label: 'Hot',      desc: 'High activity'    },
                  { icon: '📌', label: 'Pinned',   desc: 'Stickied by mods' },
                  { icon: '🛡️', label: 'Official', desc: 'Staff post'       },
                  { icon: '🔒', label: 'Locked',   desc: 'No new replies'   },
                  { icon: '💬', label: 'Normal',   desc: 'Regular thread'   },
                ].map(({ icon, label, desc }) => (
                  <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 14, lineHeight: 1, width: 20, textAlign: 'center' }}>{icon}</span>
                    <div>
                      <span style={{ fontSize: 11, fontWeight: 700, color: '#e0e0e8' }}>{label}</span>
                      <span style={{ fontSize: 10, color: 'var(--text-dim)', marginLeft: 5 }}>{desc}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ background: 'var(--bg-2)', border: '1px solid var(--border)', borderRadius: 10, overflow: 'hidden' }}>
              <div style={{ padding: '11px 16px', background: 'var(--bg-3)', borderBottom: '1px solid var(--border)', fontFamily: 'Barlow Condensed, sans-serif', fontSize: 13, fontWeight: 800, textTransform: 'uppercase', letterSpacing: 0.5, color: '#fff' }}>Related Boards</div>
              {board.relatedBoards.map((b: any, i: number) => (
                <Link key={b.slug} href={`/forum/board/${b.slug}`} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '11px 14px', borderBottom: i < board.relatedBoards.length - 1 ? '1px solid var(--border)' : 'none', textDecoration: 'none', transition: 'background 0.15s' }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-3)')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                  <span style={{ fontSize: 18, width: 28, height: 28, background: 'var(--bg-4)', border: '1px solid var(--border)', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{b.emoji}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: '#f0f0f0' }}>{b.name}</div>
                    <div style={{ fontSize: 10, color: 'var(--text-dim)', marginTop: 1 }}>{b.threads.toLocaleString()} threads</div>
                  </div>
                  <span style={{ fontSize: 11, color: 'var(--text-dim)' }}>›</span>
                </Link>
              ))}
            </div>

            {canPost ? (
              <div style={{ background: 'linear-gradient(135deg, rgba(232,0,13,0.1), rgba(13,13,20,0.8))', border: '1px solid rgba(232,0,13,0.2)', borderRadius: 10, padding: '16px' }}>
                <div style={{ fontFamily: 'Barlow Condensed, sans-serif', fontSize: 16, fontWeight: 800, textTransform: 'uppercase', color: '#fff', marginBottom: 6 }}>Start a Discussion</div>
                <p style={{ fontSize: 11, color: 'var(--text-muted)', lineHeight: 1.6, margin: '0 0 12px' }}>Share your thoughts, strategies, clips, and more with the community.</p>
                <button className="btn-primary" style={{ width: '100%', fontSize: 12, padding: '9px', justifyContent: 'center' }} onClick={() => setShowNewThread(true)}>✏️ New Thread</button>
              </div>
            ) : postRoles.length > 0 && (
              <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 10, padding: '16px', textAlign: 'center' }}>
                <div style={{ fontSize: 11, color: '#4F5568', fontFamily: 'Rajdhani, sans-serif', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>Only {postRoles.join(' / ')} can post threads here</div>
              </div>
            )}
          </div>

        </div>
      </div>

      {showNewThread && (
        <>
          <div onClick={() => setShowNewThread(false)} style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.78)', backdropFilter:'blur(5px)', zIndex:1000 }} />
          <div style={{ position:'fixed', top:'50%', left:'50%', transform:'translate(-50%,-50%)', width:600, maxWidth:'calc(100vw - 32px)', background:'#0F0F18', border:'1px solid rgba(255,255,255,0.075)', borderRadius:14, zIndex:1001, maxHeight:'90vh', overflowY:'auto', boxShadow:'0 40px 100px rgba(0,0,0,0.85)' }}>
            {/* Header */}
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'18px 22px', borderBottom:'1px solid rgba(255,255,255,0.065)' }}>
              <span style={{ fontFamily:'Barlow Condensed, sans-serif', fontSize:18, fontWeight:800, textTransform:'uppercase', color:'#fff' }}>✏️ New Thread</span>
              <button onClick={() => setShowNewThread(false)} style={{ background:'var(--bg-4)', border:'1px solid var(--border)', color:'var(--text-muted)', borderRadius:'50%', width:28, height:28, fontSize:12, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}>✕</button>
            </div>

            <div style={{ padding:'20px 22px', display:'flex', flexDirection:'column', gap:16 }}>
              {/* Title */}
              <div>
                <label style={{ fontSize:11, fontWeight:700, textTransform:'uppercase', letterSpacing:0.6, color:'var(--text-dim)', marginBottom:6, display:'block' }}>Thread Title</label>
                <input
                  value={newTitle}
                  onChange={e => setNewTitle(e.target.value)}
                  placeholder="Enter a descriptive title..."
                  maxLength={200}
                  className="site-input"
                  style={{ width:'100%', fontSize:14, padding:'10px 14px' }}
                />
                <div style={{ fontSize:10, color:'var(--text-dim)', marginTop:4, textAlign:'right' }}>{newTitle.length}/200</div>
              </div>

              {/* Content */}
              <div>
                <label style={{ fontSize:11, fontWeight:700, textTransform:'uppercase', letterSpacing:0.6, color:'var(--text-dim)', marginBottom:6, display:'block' }}>Content</label>
                {/* Toolbar */}
                <div style={{ display:'flex', alignItems:'center', gap:3, padding:'8px 10px', background:'var(--bg-3)', border:'1px solid var(--border)', borderRadius:'6px 6px 0 0', borderBottom:'none' }}>
                  {['B','I','U','—','"','🔗','🖼️'].map((t, i) => (
                    t === '—'
                      ? <span key={i} style={{ width:1, height:18, background:'var(--border)', margin:'0 3px' }} />
                      : <button key={i} onClick={() => {
                          const ta = document.getElementById('new-thread-content') as HTMLTextAreaElement
                          if (!ta) return
                          const start = ta.selectionStart, end = ta.selectionEnd
                          const selected = newContent.substring(start, end)
                          let wrap = ''
                          if (t === 'B') wrap = `**${selected || 'bold text'}**`
                          else if (t === 'I') wrap = `*${selected || 'italic text'}*`
                          else if (t === 'U') wrap = `__${selected || 'underlined text'}__`
                          else if (t === '"') wrap = `\n> ${selected || 'quoted text'}\n`
                          else if (t === '🔗') wrap = `[${selected || 'link text'}](https://)`
                          else if (t === '🖼️') wrap = `![${selected || 'image'}](https://image-url)`
                          if (wrap) {
                            const nc = newContent.substring(0, start) + wrap + newContent.substring(end)
                            setNewContent(nc)
                          }
                        }}
                        style={{ width:26, height:26, background:'transparent', border:'none', borderRadius:4, color:'var(--text-muted)', fontSize:t.length > 1 ? 13 : 11, fontWeight:t==='B'?800:t==='I'?400:700, fontStyle:t==='I'?'italic':'normal', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', transition:'background 0.15s, color 0.15s' }}
                        onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background='var(--bg-4)'; (e.currentTarget as HTMLButtonElement).style.color='#fff' }}
                        onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background='transparent'; (e.currentTarget as HTMLButtonElement).style.color='var(--text-muted)' }}>
                        {t}
                      </button>
                  ))}
                </div>
                <textarea
                  id="new-thread-content"
                  value={newContent}
                  onChange={e => setNewContent(e.target.value)}
                  placeholder="Write your thread content here... Supports **bold**, *italic*, [links](url), ![images](url)"
                  rows={8}
                  maxLength={10000}
                  style={{ width:'100%', background:'var(--bg-3)', border:'1px solid var(--border)', borderRadius:'0 0 6px 6px', padding:'12px 14px', color:'#fff', fontSize:13, fontFamily:'Barlow, sans-serif', resize:'vertical', outline:'none', lineHeight:1.7, boxSizing:'border-box' }}
                  onFocus={e => (e.target.style.borderColor='rgba(232,0,13,0.4)')}
                  onBlur={e => (e.target.style.borderColor='var(--border)')}
                />
                <div style={{ fontSize:10, color:'var(--text-dim)', marginTop:4, textAlign:'right' }}>{newContent.length}/10,000</div>
              </div>

              {/* Tags */}
              <div>
                <label style={{ fontSize:11, fontWeight:700, textTransform:'uppercase', letterSpacing:0.6, color:'var(--text-dim)', marginBottom:6, display:'block' }}>Tags (optional, comma-separated)</label>
                <input
                  value={newTags}
                  onChange={e => setNewTags(e.target.value)}
                  placeholder="e.g. warzone, loadout, tips"
                  className="site-input"
                  style={{ width:'100%', fontSize:12, padding:'8px 14px' }}
                />
              </div>

              {/* Posting as */}
              <div style={{ display:'flex', alignItems:'center', gap:8, fontSize:11, color:'var(--text-muted)' }}>
                <div style={{ width:24, height:24, background:'rgba(232,0,13,0.15)', border:'1px solid rgba(232,0,13,0.25)', borderRadius:6, display:'flex', alignItems:'center', justifyContent:'center', fontSize:14 }}>👤</div>
                Posting as <strong style={{ color: (user as any)?.usernameColor || '#e74c3c' }}>{user?.username || 'Guest'}</strong> in <strong style={{ color:'#fff' }}>{board.name}</strong>
              </div>

              {/* Submit */}
              <button
                className="btn-primary"
                onClick={handleCreateThread}
                disabled={creating || newTitle.trim().length < 5 || newContent.trim().length < 10}
                style={{ width:'100%', justifyContent:'center', padding:'12px', fontSize:13, opacity:(creating || newTitle.trim().length < 5 || newContent.trim().length < 10) ? 0.5 : 1, cursor:(creating || newTitle.trim().length < 5 || newContent.trim().length < 10) ? 'not-allowed' : 'pointer' }}
              >
                {creating ? 'Creating...' : '✈️ Create Thread'}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}