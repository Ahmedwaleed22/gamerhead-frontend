'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { getRepColor, getRepGradient, getRepLabel } from '@/lib/reputation'
import { useAuth } from '@/lib/auth-context'
import { forumApi } from '@/lib/api'
import { Icon } from '@iconify/react'
import { Solar } from '@/lib/solar-duotone'
import { sendActivity } from '@/lib/socket'

// ─── TYPES ────────────────────────────────────────────────────────────────────
type Role = 'admin' | 'premium' | 'coach' | 'member' | 'mod' | 'pro' | 'veteran'

interface PostUser {
  name: string
  slug: string
  pfp: string
  role: string
  isCoach?: boolean
  isPremium?: boolean
  posts: number
  joined: string
  rep: number
  kd?: string
  badges?: { name: string; img?: string; rarity?: string; category?: string }[]
  tags?: string[]
  socials?: Record<string, string>
  usernameColor?: string
}

interface Reaction {
  emoji: string
  count: number
  reacted: boolean
}

interface Post {
  id: string
  num: number
  user: PostUser
  timestamp: string
  content: string
  quote?: { author: string; text: string }
  reactions: Reaction[]
  isOP?: boolean
  isReported?: boolean
  reports?: { username: string; reason: string; createdAt: string }[]
}

interface ThreadInfo {
  id: string
  title: string
  board: string
  boardSlug: string
  category: string
  tags: string[]
  hot: boolean
  status: 'open' | 'locked'
  replies: number
  views: number
  pages: number
  currentPage: number
  createdAt: string
  lastReplyAt: string
  lastReplyBy: string
  lastReplyBySlug: string
  lastReplyByColor: string
  lastReplyPreview: string
}

// ─── HELPERS ──────────────────────────────────────────────────────────────────
const ROLE_COLORS: Record<string, string> = {
  admin: '#e8000d', premium: '#F0AA1A', coach: '#3CC8C8', member: '#888', mod: '#27AE60', pro: '#F0AA1A', veteran: '#3CC8C8',
}
const ROLE_LABELS: Record<string, string> = {
  admin: 'Admin', premium: 'Premium', coach: 'Coach', member: 'Member', mod: 'Mod', pro: 'Pro', veteran: 'Veteran',
}

const REACTION_TABLE = [
  { emoji: '👍', label: 'Thumbs Up',   rep: '+1',  color: '#4ade80' },
  { emoji: '❤️', label: 'Love',        rep: '+2',  color: '#ef4444' },
  { emoji: '🔥', label: 'Fire',        rep: '+2',  color: '#f97316' },
  { emoji: '😂', label: 'Haha',        rep: '+1',  color: '#fbbf24' },
  { emoji: '🤝', label: 'Respect',     rep: '+2',  color: '#3b82f6' },
  { emoji: '💯', label: 'Hundred',     rep: '+1',  color: '#a855f7' },
  { emoji: '👎', label: 'Thumbs Down', rep: '-1',  color: '#6b7280' },
  { emoji: '😐', label: 'Meh',         rep: '0',   color: '#6b7280' },
]

function roleColor(role: string) { return ROLE_COLORS[role] ?? '#888' }
function nameColor(user: { usernameColor?: string; role: string }) { return user.usernameColor || roleColor(user.role) }

function RoleBadge({ role }: { role: string }) {
  const color = roleColor(role)
  return (
    <span style={{ fontSize: 9, fontWeight: 700, color, background: `${color}18`, border: `1px solid ${color}30`, borderRadius: 3, padding: '1px 6px', letterSpacing: 0.4, textTransform: 'uppercase' }}>
      {ROLE_LABELS[role]}
    </span>
  )
}

function Avatar({ src, size = 38, style }: { src: string; size?: number; style?: React.CSSProperties }) {
  if (src && (src.startsWith('http') || src.startsWith('/') || src.startsWith('data:image'))) {
    return <img src={src} alt="" style={{ width: size, height: size, borderRadius: 8, objectFit: 'cover', ...style }} />
  }
  return <span style={{ fontSize: size * 0.55, ...style }}>{src || '👤'}</span>
}

function RepBar({ value }: { value: number }) {
  const color    = getRepColor(value)
  const gradient = getRepGradient(value)
  const label    = getRepLabel(value)
  const pct      = Math.round(((value % 50) / 50) * 100)
  return (
    <div className="rep-bar-wrap">
      <div className="rep-bar-track">
        <div className="rep-bar-fill" style={{ width: `${pct}%`, background: gradient }} />
      </div>
      <span className="rep-bar-label" style={{ color }}>{value}</span>
    </div>
  )
}

const BADGE_RARITY_COLORS: Record<string, string> = {
  Common: '#9CA3AF', Rare: '#3498DB', Epic: '#9B59B6', Legendary: '#F39C12',
}

function RotatingBadges({ badges }: { badges: { name: string; img?: string; rarity?: string; category?: string }[] }) {
  const [idx, setIdx] = useState(0)
  useEffect(() => {
    if (badges.length <= 1) return
    const id = setInterval(() => setIdx(prev => (prev + 1) % badges.length), 3000)
    return () => clearInterval(id)
  }, [badges.length])
  if (!badges.length) return null
  const b = badges[idx]
  const clr = BADGE_RARITY_COLORS[b.rarity || 'Common'] || '#9CA3AF'
  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '2px 8px', background: `${clr}15`, border: `1px solid ${clr}33`, borderRadius: 4, transition: 'all 0.3s ease' }}>
      {b.img ? (
        <img src={b.img} alt={b.name} style={{ width: 14, height: 14, objectFit: 'contain' }} />
      ) : (
        <span style={{ fontSize: 10 }}>🏆</span>
      )}
      <span style={{ fontSize: 9, fontWeight: 700, color: clr, whiteSpace: 'nowrap', letterSpacing: 0.3 }}>
        {b.name}
      </span>
      {badges.length > 1 && (
        <span style={{ fontSize: 8, color: `${clr}88`, fontWeight: 600 }}>
          {idx + 1}/{badges.length}
        </span>
      )}
    </div>
  )
}

// Render post content — bold, italic, underline, code, links, images, embeds
function PostContent({ text }: { text: string }) {
  const renderLine = (line: string, i: number) => {
    if (!line.trim()) return <div key={i} style={{ height: 8 }} />

    const isBullet = line.startsWith('•') || line.startsWith('- ')
    const lineText = isBullet ? line.replace(/^[•\-]\s*/, '') : line

    const parseInline = (text: string): React.ReactNode[] => {
      const nodes: React.ReactNode[] = []
      const regex = /(\*\*[^*]+\*\*|\*[^*]+\*|__[^_]+__|`[^`]+`|\!\[[^\]]*\]\([^)]+\)|\[[^\]]+\]\([^)]+\)|https?:\/\/[^\s<]+)/g
      let lastIndex = 0
      let match: RegExpExecArray | null

      while ((match = regex.exec(text)) !== null) {
        if (match.index > lastIndex) {
          nodes.push(<span key={lastIndex}>{text.slice(lastIndex, match.index)}</span>)
        }
        const m = match[0]
        if (m.startsWith('**') && m.endsWith('**')) {
          nodes.push(<strong key={match.index} style={{ color: '#fff', fontWeight: 700 }}>{m.slice(2, -2)}</strong>)
        } else if (m.startsWith('*') && m.endsWith('*')) {
          nodes.push(<em key={match.index} style={{ color: '#d0d0e0' }}>{m.slice(1, -1)}</em>)
        } else if (m.startsWith('__') && m.endsWith('__')) {
          nodes.push(<span key={match.index} style={{ textDecoration: 'underline' }}>{m.slice(2, -2)}</span>)
        } else if (m.startsWith('`') && m.endsWith('`')) {
          nodes.push(<code key={match.index} style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 3, padding: '1px 5px', fontSize: 12, fontFamily: 'monospace', color: '#f0c040' }}>{m.slice(1, -1)}</code>)
        } else if (m.startsWith('![')) {
          const altMatch = m.match(/!\[([^\]]*)\]\(([^)]+)\)/)
          if (altMatch) {
            nodes.push(<img key={match.index} src={altMatch[2]} alt={altMatch[1]} style={{ maxWidth: '100%', borderRadius: 8, marginTop: 8, marginBottom: 8, border: '1px solid rgba(255,255,255,0.1)' }} />)
          }
        } else if (m.startsWith('[')) {
          const linkMatch = m.match(/\[([^\]]+)\]\(([^)]+)\)/)
          if (linkMatch) {
            nodes.push(<a key={match.index} href={linkMatch[2]} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--red)', textDecoration: 'underline', fontWeight: 600 }}>{linkMatch[1]}</a>)
          }
        } else if (m.startsWith('http')) {
          const ytMatch = m.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([\w-]+)/)
          if (ytMatch) {
            nodes.push(
              <div key={match.index} style={{ marginTop: 8, marginBottom: 8 }}>
                <iframe width="100%" height="315" src={`https://www.youtube.com/embed/${ytMatch[1]}`} frameBorder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen style={{ borderRadius: 8, border: '1px solid rgba(255,255,255,0.1)', maxWidth: 560 }} />
              </div>
            )
          } else {
            nodes.push(<a key={match.index} href={m} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--red)', textDecoration: 'underline', wordBreak: 'break-all' }}>{m}</a>)
          }
        }
        lastIndex = match.index + m.length
      }
      if (lastIndex < text.length) {
        nodes.push(<span key={lastIndex}>{text.slice(lastIndex)}</span>)
      }
      return nodes.length ? nodes : [<span key="full">{text}</span>]
    }

    return (
      <div key={i} style={{ marginBottom: isBullet ? 2 : 0, paddingLeft: isBullet ? 12 : 0 }}>
        {parseInline(lineText)}
      </div>
    )
  }

  const blocks: React.ReactNode[] = []
  const codeBlockRegex = /```([\s\S]*?)```/g
  let lastIdx = 0
  let codeMatch: RegExpExecArray | null

  while ((codeMatch = codeBlockRegex.exec(text)) !== null) {
    const before = text.slice(lastIdx, codeMatch.index)
    before.split('\n').forEach((line, i) => blocks.push(renderLine(line, blocks.length + i)))
    blocks.push(
      <pre key={`code-${codeMatch.index}`} style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 6, padding: '12px 16px', margin: '8px 0', overflowX: 'auto', fontSize: 12, fontFamily: 'monospace', color: '#d0d0e0', lineHeight: 1.6 }}>
        {codeMatch[1].trim()}
      </pre>
    )
    lastIdx = codeMatch.index + codeMatch[0].length
  }
  text.slice(lastIdx).split('\n').forEach((line, i) => blocks.push(renderLine(line, blocks.length + i)))

  return (
    <div style={{ fontFamily: 'Barlow, sans-serif', fontSize: 13, color: '#d8d8e8', lineHeight: 1.8 }}>
      {blocks}
    </div>
  )
}

const SocialIcon = ({ platform }: { platform: string }) => {
  const icons: Record<string, React.ReactNode> = {
    twitch:  <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><path d="M11.571 4.714h1.715v5.143H11.57zm4.715 0H18v5.143h-1.714zM6 0L1.714 4.286v15.428h5.143V24l4.286-4.286h3.428L22.286 12V0zm14.571 11.143l-3.428 3.428h-3.429l-3 3v-3H6.857V1.714h13.714z"/></svg>,
    twitter: <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>,
    discord: <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><path d="M20.317 4.37a19.791 19.791 0 00-4.885-1.515.074.074 0 00-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 00-5.487 0 12.64 12.64 0 00-.617-1.25.077.077 0 00-.079-.037A19.736 19.736 0 003.677 4.37a.07.07 0 00-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 00.031.057 19.9 19.9 0 005.993 3.03.078.078 0 00.084-.028 14.09 14.09 0 001.226-1.994.076.076 0 00-.041-.106 13.107 13.107 0 01-1.872-.892.077.077 0 01-.008-.128 10.2 10.2 0 00.372-.292.074.074 0 01.077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 01.078.01c.12.098.246.198.373.292a.077.077 0 01-.006.127 12.299 12.299 0 01-1.873.892.077.077 0 00-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 00.084.028 19.839 19.839 0 006.002-3.03.077.077 0 00.032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 00-.031-.03z"/></svg>,
    youtube: <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>,
    instagram: <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg>,
    tiktok: <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z"/></svg>,
  }
  return <span style={{ color: 'rgba(255,255,255,0.5)', display: 'flex', alignItems: 'center' }}>{icons[platform] || null}</span>
}

// ─── MAIN PAGE ────────────────────────────────────────────────────────────────
export default function ThreadPage() {
  const params = useParams()
  const slug     = params.slug as string
  const threadId = params.threadId as string
  const { user } = useAuth()

  const [thread, setThread] = useState<ThreadInfo | null>(null)
  const [posts, setPosts]       = useState<Post[]>([])
  const [replyText, setReplyText] = useState('')
  const [quoting, setQuoting]   = useState<{ author: string; text: string } | null>(null)
  const [editingPostId, setEditingPostId] = useState<string | null>(null)
  const [editContent, setEditContent] = useState('')
  const [emojiPickerPostId, setEmojiPickerPostId] = useState<string | null>(null)
  const [subscribed, setSubscribed] = useState(false)
  const [bookmarked, setBookmarked] = useState(false)
  const [relatedThreads, setRelatedThreads] = useState<any[]>([])
  const [reportPostId, setReportPostId] = useState<string | null>(null)
  const [reportReason, setReportReason] = useState('')
  const [shareToast, setShareToast] = useState(false)

  useEffect(() => { sendActivity('Reading Thread') }, [])

  useEffect(() => {
    if (!threadId) return
    forumApi.getThread(threadId, 1, user?.id).then((data: any) => {
      const t = data.thread || data
      setThread({
        id: t._id || t.id,
        title: t.title,
        board: data.boardName || t.boardName || data.board || '',
        boardSlug: t.boardSlug || data.boardSlug || '',
        category: data.category || t.category || '',
        tags: t.tags ?? [],
        hot: t.isHot ?? t.hot ?? false,
        status: (t.status || 'open').toLowerCase(),
        replies: t.replyCount ?? t.replies ?? 0,
        views: t.viewCount ?? t.views ?? 0,
        pages: data.totalPages ?? data.pages ?? 1,
        currentPage: data.page ?? data.currentPage ?? 1,
        createdAt: t.createdAt,
        lastReplyAt: t.lastReplyAt,
        lastReplyBy: t.lastReplyBy || '',
        lastReplyBySlug: data.lastReplyBySlug || t.lastReplyBySlug || '',
        lastReplyByColor: data.lastReplyByColor || t.lastReplyByColor || '',
        lastReplyPreview: t.lastReplyPreview || '',
      })
      setSubscribed(!!data.subscribed)
      setBookmarked(!!data.bookmarked)
      setPosts(
        (data.posts ?? []).map((p: any, idx: number) => ({
          id: p._id || p.id,
          num: p.postNumber ?? p.num ?? idx + 1,
          user: {
            name: p.user?.name ?? p.user?.username ?? p.authorName ?? 'Unknown',
            slug: p.user?.slug ?? '',
            pfp: p.user?.pfp ?? p.user?.avatarUrl ?? '',
            role: p.user?.role ?? p.authorRole ?? 'member',
            posts: p.user?.posts ?? p.user?.forumPosts ?? 0,
            joined: p.user?.joined ?? '',
            rep: p.user?.rep ?? p.user?.reputation ?? 0,
            kd: p.user?.kd,
            badges: p.user?.badges ?? [],
            tags: p.user?.tags ?? [],
            socials: p.user?.socials,
            usernameColor: p.user?.usernameColor || '',
          },
          timestamp: p.timestamp ?? (p.createdAt ? new Date(p.createdAt).toLocaleString() : ''),
          content: p.content ?? p.body ?? '',
          quote: p.quote ?? undefined,
          reactions: (p.reactions ?? []).map((r: any) => ({
            emoji: r.emoji,
            count: r.count ?? (r.users?.length ?? 0),
            reacted: r.reacted ?? false,
          })),
          isOP: p.isOP ?? (p.postNumber === 1),
          isReported: p.isReported ?? false,
          reports: p.reports ?? [],
        }))
      )
    }).catch(err => console.error('Failed to load thread:', err))

    forumApi.getRelatedThreads(threadId).then((res: any) => {
      setRelatedThreads(Array.isArray(res) ? res : [])
    }).catch(() => {})
  }, [threadId])

  const handleReact = (postId: string, emoji: string) => {
    // Optimistic update
    setPosts(prev => prev.map(p => {
      if (p.id !== postId) return p
      const existing = p.reactions.find(r => r.emoji === emoji)
      if (existing) {
        return {
          ...p,
          reactions: p.reactions
            .map(r => r.emoji === emoji ? { ...r, count: r.reacted ? r.count - 1 : r.count + 1, reacted: !r.reacted } : r)
            .filter(r => r.count > 0),
        }
      } else {
        return { ...p, reactions: [...p.reactions, { emoji, count: 1, reacted: true }] }
      }
    }))
    setEmojiPickerPostId(null)
    forumApi.reactToPost(String(postId), { emoji }).catch(err => console.error('Failed to react:', err))
  }

  const handleQuote = (post: Post) => {
    setQuoting({ author: post.user.name, text: post.content.slice(0, 120) + (post.content.length > 120 ? '…' : '') })
    setTimeout(() => document.getElementById('reply-box')?.scrollIntoView({ behavior: 'smooth' }), 50)
  }

  const handleEditPost = async (postId: string) => {
    if (!editContent.trim()) return
    try {
      await forumApi.updatePost(String(postId), { content: editContent })
      setPosts(prev => prev.map(p => p.id === postId ? { ...p, content: editContent } : p))
      setEditingPostId(null)
      setEditContent('')
    } catch (err) { console.error('Failed to edit post:', err) }
  }

  const handleDeletePost = async (postId: string) => {
    if (!confirm('Delete this post?')) return
    try {
      await forumApi.deletePost(String(postId))
      setPosts(prev => prev.filter(p => p.id !== postId))
    } catch (err) { console.error('Failed to delete post:', err) }
  }

  const handleShare = () => {
    const url = `${window.location.origin}/forum/board/${slug}/${threadId}`
    navigator.clipboard.writeText(url).then(() => {
      setShareToast(true)
      setTimeout(() => setShareToast(false), 2000)
    }).catch(() => {})
  }

  const handleReport = async () => {
    if (!reportPostId || reportReason.trim().length < 3) return
    try {
      await forumApi.reportPost(String(reportPostId), { reason: reportReason })
      setPosts(prev => prev.map(p => p.id === reportPostId ? { ...p, isReported: true } : p))
      setReportPostId(null)
      setReportReason('')
    } catch (err: any) {
      alert(err.message || 'Report failed')
    }
  }

  const handleDismissReport = async (postId: string) => {
    try {
      await forumApi.dismissReport(String(postId))
      setPosts(prev => prev.map(p => p.id === postId ? { ...p, isReported: false, reports: [] } : p))
    } catch (err: any) {
      alert(err.message || 'Dismiss failed')
    }
  }

  const handlePinThread = async () => {
    if (!thread) return
    try {
      await forumApi.updateThread(String(thread.id), { isPinned: true })
      setThread(prev => prev ? { ...prev } : prev)
    } catch (err) { console.error(err) }
  }

  const handleLockThread = async () => {
    if (!thread) return
    const newStatus = thread.status === 'locked' ? 'open' : 'locked'
    try {
      await forumApi.updateThread(String(thread.id), { status: newStatus })
      setThread(prev => prev ? { ...prev, status: newStatus } : prev)
    } catch (err) { console.error(err) }
  }

  const handleDeleteThread = async () => {
    if (!thread || !confirm('Are you sure you want to delete this entire thread?')) return
    try {
      await forumApi.deleteThread(String(thread.id))
      window.location.href = `/forum/board/${thread.boardSlug}`
    } catch (err) { console.error(err) }
  }

  const Pagination = () => (
    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
      {['←', '1', '2', '3', '4', '5', '...', '8', '→'].map((p, i) => (
        <button key={i} style={{ width: 28, height: 28, background: p === '1' ? 'var(--red)' : 'var(--bg-3)', border: `1px solid ${p === '1' ? 'var(--red)' : 'var(--border)'}`, borderRadius: 5, color: p === '1' ? '#fff' : 'var(--text-muted)', fontSize: 11, fontWeight: 700, cursor: 'pointer', fontFamily: 'Barlow Condensed, sans-serif', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {p}
        </button>
      ))}
    </div>
  )

  if (!thread) return <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>Loading...</div>

  return (
    <div style={{ paddingBottom: 60 }}>

      {/* ── THREAD HEADER ── */}
      <div style={{
        position: 'relative',
        padding: '32px 0 0',
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

          {/* Breadcrumb */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, marginBottom: 24 }}>
            <Link href="/forum" style={{ color: 'var(--text-muted)', textDecoration: 'none', fontWeight: 600, transition: 'color 0.2s' }} onMouseEnter={e => (e.currentTarget.style.color = '#fff')} onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-muted)')}>Forum</Link>
            <span style={{ color: 'var(--text-dim)' }}>›</span>
            <Link href={`/forum/board/${thread.boardSlug}`} style={{ color: 'var(--text-muted)', textDecoration: 'none', fontWeight: 600, transition: 'color 0.2s' }} onMouseEnter={e => (e.currentTarget.style.color = '#fff')} onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-muted)')}>{thread.board}</Link>
            <span style={{ color: 'var(--text-dim)' }}>›</span>
            <span style={{ color: 'var(--red)', fontWeight: 700, overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis', maxWidth: 320 }}>{thread.title}</span>
          </div>

          {/* Title row */}
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 24, flexWrap: 'wrap', paddingBottom: 32 }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              {/* Badges */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
                {thread.hot && <span style={{ fontSize: 11, fontWeight: 700, background: 'rgba(232,100,13,0.12)', border: '1px solid rgba(232,100,13,0.3)', color: '#f97316', padding: '4px 10px', borderRadius: 6, textTransform: 'uppercase', letterSpacing: 0.5, display: 'inline-flex', alignItems: 'center', gap: 4 }}><Icon icon={Solar.fire} width={12} height={12} /> Hot</span>}
                {thread.tags.map(tag => (
                  <span key={tag} style={{ fontSize: 11, fontWeight: 600, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: 'var(--text-muted)', padding: '4px 10px', borderRadius: 6 }}>{tag}</span>
                ))}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '0 0 16px', flexWrap: 'wrap' }}>
                <h1 style={{ fontFamily: 'Barlow Condensed, sans-serif', fontSize: 36, fontWeight: 900, textTransform: 'uppercase', color: '#fff', margin: 0, lineHeight: 1.2, letterSpacing: 0.5 }}>
                  {thread.title}
                </h1>
                <span style={{ fontSize: 13, fontWeight: 700, background: thread.status === 'open' ? 'rgba(39,174,96,0.1)' : 'rgba(136,136,136,0.1)', border: `1px solid ${thread.status === 'open' ? 'rgba(39,174,96,0.2)' : 'rgba(136,136,136,0.2)'}`, color: thread.status === 'open' ? '#4ade80' : '#888', padding: '4px 12px', borderRadius: 6, textTransform: 'uppercase', letterSpacing: 0.5, display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                  <Icon icon={thread.status === 'open' ? Solar.online : Solar.lock} width={14} height={14} style={{ flexShrink: 0 }} />
                  {thread.status === 'open' ? 'Open' : 'Locked'}
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'var(--bg-3)', padding: '6px 12px', borderRadius: 8, border: '1px solid var(--border)' }}>
                  <Icon icon={Solar.chat} width={14} height={14} style={{ color: 'var(--text-muted)' }} />
                  <span style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: 600 }}>
                    <strong style={{ color: '#fff' }}>{thread.replies}</strong> replies
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'var(--bg-3)', padding: '6px 12px', borderRadius: 8, border: '1px solid var(--border)' }}>
                  <Icon icon={Solar.eye} width={14} height={14} style={{ color: 'var(--text-muted)' }} />
                  <span style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: 600 }}>
                    <strong style={{ color: '#fff' }}>{thread.views.toLocaleString()}</strong> views
                  </span>
                </div>
                <Pagination />
              </div>
            </div>

            {/* Action buttons */}
            <div style={{ display: 'flex', gap: 10, flexShrink: 0, alignItems: 'flex-start', flexWrap: 'wrap' }}>
              <button
                onClick={async () => {
                  try {
                    const res = await forumApi.subscribeThread(String(thread.id))
                    setSubscribed((res as any).subscribed)
                  } catch (err) { console.error('Subscribe failed:', err) }
                }}
                style={{ padding: '9px 16px', background: subscribed ? 'rgba(232,0,13,0.12)' : 'var(--bg-3)', border: `1px solid ${subscribed ? 'rgba(232,0,13,0.3)' : 'var(--border)'}`, borderRadius: 8, color: subscribed ? 'var(--red)' : 'var(--text-muted)', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'Barlow, sans-serif', textTransform: 'uppercase', letterSpacing: 0.5, transition: 'all 0.2s', boxShadow: subscribed ? '0 0 12px rgba(232,0,13,0.1)' : 'none' }}
                onMouseEnter={e => { if(!subscribed) { e.currentTarget.style.background = 'var(--bg-4)'; e.currentTarget.style.color = '#fff'; } }}
                onMouseLeave={e => { if(!subscribed) { e.currentTarget.style.background = 'var(--bg-3)'; e.currentTarget.style.color = 'var(--text-muted)'; } }}
              >
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                  <Icon icon={Solar.bell} width={14} height={14} />
                  {subscribed ? 'Subscribed' : 'Subscribe'}
                </span>
              </button>
              <button
                onClick={async () => {
                  try {
                    const res = await forumApi.bookmarkThread(String(thread.id))
                    setBookmarked((res as any).bookmarked)
                  } catch (err) { console.error('Bookmark failed:', err) }
                }}
                style={{ padding: '9px 16px', background: bookmarked ? 'rgba(240,192,64,0.12)' : 'var(--bg-3)', border: `1px solid ${bookmarked ? 'rgba(240,192,64,0.3)' : 'var(--border)'}`, borderRadius: 8, color: bookmarked ? '#f0c040' : 'var(--text-muted)', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'Barlow, sans-serif', textTransform: 'uppercase', letterSpacing: 0.5, transition: 'all 0.2s', boxShadow: bookmarked ? '0 0 12px rgba(240,192,64,0.1)' : 'none' }}
                onMouseEnter={e => { if(!bookmarked) { e.currentTarget.style.background = 'var(--bg-4)'; e.currentTarget.style.color = '#fff'; } }}
                onMouseLeave={e => { if(!bookmarked) { e.currentTarget.style.background = 'var(--bg-3)'; e.currentTarget.style.color = 'var(--text-muted)'; } }}
              >
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                  <Icon icon={Solar.bookmark} width={14} height={14} />
                  {bookmarked ? 'Bookmarked' : 'Bookmark'}
                </span>
              </button>
              <button className="btn-primary" style={{ fontSize: 13, padding: '9px 20px', borderRadius: 8, boxShadow: '0 4px 12px rgba(232,0,13,0.2)' }}
                onClick={() => document.getElementById('reply-box')?.scrollIntoView({ behavior: 'smooth' })}>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                  <Icon icon={Solar.pen} width={14} height={14} /> Reply
                </span>
              </button>
              {user?.role === 'admin' && (
                <>
                  <button onClick={handleLockThread} style={{ padding:'9px 16px', background:'var(--bg-3)', border:'1px solid var(--border)', borderRadius:8, color: thread.status === 'locked' ? '#f0c040' : 'var(--text-muted)', fontSize:12, fontWeight:700, cursor:'pointer', fontFamily:'Barlow, sans-serif', textTransform:'uppercase', letterSpacing:0.5, transition: 'all 0.2s' }} onMouseEnter={e=>{e.currentTarget.style.background='var(--bg-4)'; e.currentTarget.style.color='#fff'}} onMouseLeave={e=>{e.currentTarget.style.background='var(--bg-3)'; e.currentTarget.style.color=thread.status === 'locked' ? '#f0c040' : 'var(--text-muted)'}}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                      <Icon icon={Solar.lock} width={14} height={14} />
                      {thread.status === 'locked' ? 'Unlock' : 'Lock'}
                    </span>
                  </button>
                  <button onClick={handleDeleteThread} style={{ padding:'9px 16px', background:'rgba(232,0,13,0.1)', border:'1px solid rgba(232,0,13,0.3)', borderRadius:8, color:'var(--red)', fontSize:12, fontWeight:700, cursor:'pointer', fontFamily:'Barlow, sans-serif', textTransform:'uppercase', letterSpacing:0.5, transition: 'all 0.2s' }} onMouseEnter={e=>{e.currentTarget.style.background='rgba(232,0,13,0.2)'}} onMouseLeave={e=>{e.currentTarget.style.background='rgba(232,0,13,0.1)'}}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                      <Icon icon={Solar.trash} width={14} height={14} />
                      Delete
                    </span>
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── MAIN BODY ── */}
      <div className="container" style={{ marginTop: 20 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 250px', gap: 20, alignItems: 'start' }}>

          {/* ── POSTS ── */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>

            {posts.map((post, idx) => (
              <div
                key={post.id}
                id={`post-${post.num}`}
                style={{ background: 'var(--bg-2)', border: `1px solid ${post.isReported && user?.role === 'admin' ? 'rgba(243,156,18,0.5)' : 'var(--border)'}`, borderRadius: 10, overflow: 'hidden', marginBottom: 10, boxShadow: post.isReported && user?.role === 'admin' ? '0 0 12px rgba(243,156,18,0.15)' : 'none' }}
              >
                {/* ── HORIZONTAL USER CARD ── */}
                <div style={{ background: 'var(--bg-3)', borderBottom: '1px solid var(--border)', padding: '14px 20px', display: 'flex', alignItems: 'center', gap: 20 }}>

                  {/* Avatar + OP badge */}
                  <div style={{ position: 'relative', flexShrink: 0 }}>
                    <div style={{ width: 48, height: 48, background: `${nameColor(post.user)}20`, border: `2px solid ${nameColor(post.user)}50`, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: `0 0 10px ${nameColor(post.user)}20` }}>
                      <Avatar src={post.user.pfp} size={48} style={{ borderRadius: 8 }} />
                    </div>
                    {post.isOP && (
                      <span style={{ position: 'absolute', bottom: -6, left: '50%', transform: 'translateX(-50%)', background: 'var(--red)', color: '#fff', fontSize: 8, fontWeight: 800, padding: '2px 6px', borderRadius: 3, letterSpacing: 0.4, textTransform: 'uppercase', whiteSpace: 'nowrap' }}>OP</span>
                    )}
                  </div>

                  {/* Username + role tag */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                    {post.user.slug ? (
                      <Link href={`/profile/${post.user.slug}`} style={{ fontSize: 16, fontWeight: 800, color: nameColor(post.user), lineHeight: 1, textDecoration: 'none' }}
                        onMouseEnter={e=>(e.currentTarget.style.textDecoration='underline')} onMouseLeave={e=>(e.currentTarget.style.textDecoration='none')}>{post.user.name}</Link>
                    ) : (
                      <span style={{ fontSize: 16, fontWeight: 800, color: nameColor(post.user), lineHeight: 1 }}>{post.user.name}</span>
                    )}
                    <div style={{ display: 'flex', gap: 4 }}>
                      <RoleBadge role={post.user.role} />
                      {post.user.isCoach && post.user.role !== 'coach' && <RoleBadge role="coach" />}
                      {post.user.isPremium && post.user.role !== 'premium' && <RoleBadge role="premium" />}
                    </div>
                  </div>

                  {/* Divider */}
                  <div style={{ width: 1, height: 36, background: 'var(--border)', flexShrink: 0 }} />

                  {/* Rep bar */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4, flexShrink: 0, minWidth: 90 }}>
                    <span style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, color: 'var(--text-dim)' }}>Rep</span>
                    <RepBar value={post.user.rep} />
                  </div>

                  {/* Divider */}
                  <div style={{ width: 1, height: 36, background: 'var(--border)', flexShrink: 0 }} />

                  {/* Joined */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 3, flexShrink: 0 }}>
                    <span style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, color: 'var(--text-dim)' }}>Joined</span>
                    <span style={{ fontSize: 13, fontWeight: 600, color: '#c0c0d0' }}>{post.user.joined}</span>
                  </div>

                  {/* Posts */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 3, flexShrink: 0 }}>
                    <span style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, color: 'var(--text-dim)' }}>Posts</span>
                    <span style={{ fontSize: 13, fontWeight: 600, color: '#c0c0d0' }}>{post.user.posts.toLocaleString()}</span>
                  </div>



                  {/* Divider */}
                  <div style={{ width: 1, height: 36, background: 'var(--border)', flexShrink: 0 }} />

                  {/* Earned badges (rotating) — forum badges only */}
                  {(() => {
                    const forumBadges = (post.user.badges || []).filter((b: any) => b.category === 'forum')
                    return forumBadges.length > 0 ? <RotatingBadges badges={forumBadges} /> : null
                  })()}

                  {/* Platform tags */}
                  {post.user.tags && post.user.tags.length > 0 && (
                    <div style={{ display: 'flex', gap: 4, flexWrap: 'nowrap', overflow: 'hidden', flexShrink: 1, minWidth: 0 }}>
                      {post.user.tags.map(tag => (
                        <span key={tag} style={{ fontSize: 9, fontWeight: 600, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.09)', color: 'var(--text-muted)', padding: '2px 6px', borderRadius: 3, whiteSpace: 'nowrap' }}>{tag}</span>
                      ))}
                    </div>
                  )}

                  {/* Spacer pushes socials + post# to right */}
                  <div style={{ flex: 1 }} />

                  {/* Socials */}
                  {post.user.socials && Object.keys(post.user.socials).length > 0 && (
                    <div style={{ display: 'flex', gap: 6, flexShrink: 0, alignItems: 'center' }}>
                      {Object.entries(post.user.socials).map(([platform, handle]) => (
                        <a key={platform} href={handle?.startsWith('http') ? handle : '#'} target="_blank" rel="noopener noreferrer" title={`${platform}: ${handle}`} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', textDecoration: 'none', opacity: 0.5, transition: 'opacity 0.15s' }}
                          onMouseEnter={e => (e.currentTarget.style.opacity = '1')}
                          onMouseLeave={e => (e.currentTarget.style.opacity = '0.5')}>
                          <SocialIcon platform={platform} />
                        </a>
                      ))}
                    </div>
                  )}

                  {/* Post number */}
                  <span style={{ fontFamily: 'Barlow Condensed, sans-serif', fontSize: 11, fontWeight: 700, color: 'var(--text-dim)', letterSpacing: 0.3, flexShrink: 0 }}>#{post.num}</span>
                </div>

                {/* ── POST CONTENT ── */}
                <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column' }}>

                  {/* Post meta — timestamp only now, post# moved to user bar */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14, paddingBottom: 10, borderBottom: '1px solid var(--border)' }}>
                    <span style={{ fontSize: 11, color: 'var(--text-dim)' }}>{post.timestamp}</span>
                  </div>

                    {/* Quote block */}
                    {post.quote && (
                      <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderLeft: '3px solid var(--red)', borderRadius: 6, padding: '10px 14px', marginBottom: 14 }}>
                        <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--red)', textTransform: 'uppercase', letterSpacing: 0.4, marginBottom: 5 }}>
                          {post.quote.author} wrote:
                        </div>
                        <div style={{ fontSize: 12, color: 'var(--text-muted)', fontStyle: 'italic', lineHeight: 1.6 }}>{post.quote.text}</div>
                      </div>
                    )}

                    {/* Post body */}
                    <div style={{ flex: 1 }}>
                      {editingPostId === post.id ? (
                        <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                          <textarea
                            value={editContent}
                            onChange={e => setEditContent(e.target.value)}
                            rows={6}
                            style={{ width:'100%', background:'var(--bg-3)', border:'1px solid rgba(232,0,13,0.3)', borderRadius:6, padding:'12px 14px', color:'#fff', fontSize:13, fontFamily:'Barlow, sans-serif', resize:'vertical', outline:'none', lineHeight:1.7, boxSizing:'border-box' }}
                          />
                          <div style={{ display:'flex', gap:8, justifyContent:'flex-end' }}>
                            <button onClick={() => setEditingPostId(null)} style={{ padding:'6px 14px', background:'var(--bg-3)', border:'1px solid var(--border)', borderRadius:6, color:'var(--text-muted)', fontSize:11, fontWeight:700, cursor:'pointer' }}>Cancel</button>
                            <button onClick={() => handleEditPost(post.id)} className="btn-primary" style={{ fontSize:11, padding:'6px 14px' }}>Save Edit</button>
                          </div>
                        </div>
                      ) : (
                        <PostContent text={post.content} />
                      )}
                    </div>

                    {/* Reactions + Actions */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 16, paddingTop: 12, borderTop: '1px solid var(--border)', flexWrap: 'wrap', gap: 8 }}>

                      {/* Reactions */}
                      <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
                        {post.reactions.map(r => {
                          const isOwnPost = user?.username === post.user.name
                          return (
                          <button
                            key={r.emoji}
                            onClick={() => !isOwnPost && handleReact(post.id, r.emoji)}
                            style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '4px 10px', background: r.reacted ? 'rgba(232,0,13,0.15)' : 'var(--bg-4)', border: `1px solid ${r.reacted ? 'rgba(232,0,13,0.35)' : 'var(--border)'}`, borderRadius: 20, cursor: isOwnPost ? 'default' : 'pointer', fontSize: 13, fontFamily: 'Barlow, sans-serif', transition: 'all 0.15s' }}
                            onMouseEnter={e => { if (!r.reacted && !isOwnPost) (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(255,255,255,0.2)' }}
                            onMouseLeave={e => { if (!r.reacted && !isOwnPost) (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--border)' }}
                          >
                            <span>{r.emoji}</span>
                            <span style={{ fontSize: 11, fontWeight: 700, color: r.reacted ? 'var(--red)' : 'var(--text-muted)' }}>{r.count}</span>
                          </button>
                          )
                        })}
                        {/* Add reaction — hidden on own posts */}
                        {user?.username !== post.user.name && (
                        <div style={{ position: 'relative' }}>
                          <button
                            onClick={() => setEmojiPickerPostId(emojiPickerPostId === post.id ? null : post.id)}
                            style={{ padding: '4px 10px', background: emojiPickerPostId === post.id ? 'rgba(232,0,13,0.15)' : 'var(--bg-4)', border: `1px solid ${emojiPickerPostId === post.id ? 'rgba(232,0,13,0.35)' : 'var(--border)'}`, borderRadius: 20, cursor: 'pointer', fontSize: 12, color: emojiPickerPostId === post.id ? 'var(--red)' : 'var(--text-dim)', fontFamily: 'Barlow, sans-serif', transition: 'all 0.15s' }}
                            onMouseEnter={e => { if (emojiPickerPostId !== post.id) (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(255,255,255,0.2)' }}
                            onMouseLeave={e => { if (emojiPickerPostId !== post.id) (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--border)' }}>
                            + React
                          </button>
                          {emojiPickerPostId === post.id && (
                            <div style={{ position: 'absolute', bottom: '100%', left: 0, marginBottom: 6, background: 'var(--bg-2)', border: '1px solid var(--border)', borderRadius: 10, padding: '10px 12px', zIndex: 50, boxShadow: '0 8px 30px rgba(0,0,0,0.5)', minWidth: 220 }}>
                              <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 }}>Add Reaction</div>
                              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 4 }}>
                                {REACTION_TABLE.map(r => (
                                  <button key={r.emoji} onClick={() => handleReact(post.id, r.emoji)}
                                    title={`${r.label} (${r.rep} rep)`}
                                    style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, padding: '8px 4px', background: 'var(--bg-3)', border: '1px solid var(--border)', borderRadius: 8, cursor: 'pointer', transition: 'all 0.15s' }}
                                    onMouseEnter={e => { e.currentTarget.style.borderColor = r.color; e.currentTarget.style.background = `${r.color}15` }}
                                    onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.background = 'var(--bg-3)' }}>
                                    <span style={{ fontSize: 18 }}>{r.emoji}</span>
                                    <span style={{ fontSize: 8, fontWeight: 700, color: r.color, letterSpacing: 0.3 }}>{r.rep}</span>
                                  </button>
                                ))}
                              </div>
                              <div style={{ fontSize: 9, color: 'var(--text-dim)', marginTop: 8, textAlign: 'center' }}>
                                <span style={{ color: '#4ade80' }}>Green = +Rep</span> · <span style={{ color: '#6b7280' }}>Gray = Neutral/Neg</span>
                              </div>
                            </div>
                          )}
                        </div>
                        )}
                      </div>

                      {/* Action buttons */}
                      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                        {[
                          { label: 'Quote', icon: Solar.chat, action: () => handleQuote(post) },
                          { label: 'Reply', icon: Solar.reply, action: () => { setQuoting(null); document.getElementById('reply-box')?.scrollIntoView({ behavior: 'smooth' }) } },
                          { label: 'Share', icon: Solar.link, action: handleShare },
                          ...(user?.username === post.user.name || user?.role === 'admin' ? [{ label: 'Edit', icon: Solar.pen, action: () => { setEditingPostId(post.id); setEditContent(post.content) } }] : []),
                          ...(user?.role === 'admin' ? [{ label: 'Delete', icon: Solar.trash, action: () => handleDeletePost(post.id) }] : []),
                          ...(user?.role === 'admin' && post.isReported ? [{ label: 'Dismiss Report', icon: Solar.check, color: '#F39C12', action: () => handleDismissReport(post.id) }] : []),
                          ...(user?.username !== post.user.name ? [{ label: 'Report', icon: Solar.flag, action: () => { setReportPostId(post.id); setReportReason('') } }] : []),
                        ].map((btn: any) => (
                          <button
                            key={btn.label}
                            onClick={btn.action}
                            style={{ padding: '4px 10px', background: 'transparent', border: '1px solid transparent', borderRadius: 5, color: btn.color || 'var(--text-dim)', fontSize: 11, fontWeight: 600, cursor: 'pointer', fontFamily: 'Barlow, sans-serif', display: 'flex', alignItems: 'center', gap: 4, transition: 'all 0.15s' }}
                            onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--border)'; (e.currentTarget as HTMLButtonElement).style.color = btn.color || '#fff' }}
                            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = 'transparent'; (e.currentTarget as HTMLButtonElement).style.color = btn.color || 'var(--text-dim)' }}
                          >
                            <Icon icon={btn.icon} width={12} height={12} style={{ flexShrink: 0 }} /> {btn.label}
                          </button>
                        ))}
                      </div>
                      {/* Report badge for admins */}
                      {post.isReported && user?.role === 'admin' && (
                        <div style={{ marginTop: 8, padding: '6px 12px', background: 'rgba(243,156,18,0.1)', border: '1px solid rgba(243,156,18,0.3)', borderRadius: 6, fontSize: 11, color: '#F39C12', fontWeight: 600 }}>
                          Reported ({(post.reports || []).length}) — {(post.reports || []).map(r => `"${r.reason}" by ${r.username}`).join(', ')}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
            ))}

            {/* Bottom pagination */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', margin: '8px 0 24px' }}>
              <span style={{ fontSize: 12, color: 'var(--text-dim)' }}>Showing posts 1–{posts.length} of {thread.replies}</span>
              <Pagination />
            </div>

            {/* ── REPLY BOX ── */}
            {thread.status === 'locked' && user?.role !== 'admin' ? (
              <div id="reply-box" style={{ background: 'var(--bg-2)', border: '1px solid rgba(240,192,64,0.2)', borderRadius: 10, padding: '20px', textAlign: 'center' }}>
                <span style={{ marginBottom: 6, display: 'flex', justifyContent: 'center' }}><Icon icon={Solar.lock} width={20} height={20} style={{ color: '#f0c040' }} /></span>
                <div style={{ fontFamily: 'Barlow Condensed, sans-serif', fontSize: 14, fontWeight: 800, textTransform: 'uppercase', color: '#f0c040', letterSpacing: 0.5 }}>Thread Locked</div>
                <div style={{ fontSize: 11, color: '#4F5568', marginTop: 4 }}>This thread has been locked. No new replies can be posted.</div>
              </div>
            ) : (
            <div id="reply-box" style={{ background: 'var(--bg-2)', border: '1px solid var(--border)', borderRadius: 10, overflow: 'hidden' }}>
              <div style={{ padding: '13px 18px', background: 'var(--bg-3)', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 10 }}>
                <Icon icon={Solar.pen} width={16} height={16} />
                <span style={{ fontFamily: 'Barlow Condensed, sans-serif', fontSize: 14, fontWeight: 800, textTransform: 'uppercase', color: '#fff' }}>Post a Reply</span>
              </div>

              <div style={{ padding: '16px 18px' }}>
                {/* Quoting indicator */}
                {quoting && (
                  <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderLeft: '3px solid var(--red)', borderRadius: 6, padding: '10px 14px', marginBottom: 12, display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10 }}>
                    <div>
                      <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--red)', textTransform: 'uppercase', letterSpacing: 0.4, marginBottom: 4 }}>Quoting {quoting.author}:</div>
                      <div style={{ fontSize: 12, color: 'var(--text-muted)', fontStyle: 'italic', lineHeight: 1.5 }}>{quoting.text}</div>
                    </div>
                    <button type="button" onClick={() => setQuoting(null)} style={{ background: 'none', border: 'none', color: 'var(--text-dim)', cursor: 'pointer', flexShrink: 0, padding: '0 4px', display: 'inline-flex', alignItems: 'center' }}><Icon icon={Solar.close} width={14} height={14} /></button>
                  </div>
                )}

                {/* Toolbar */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 3, padding: '8px 10px', background: 'var(--bg-3)', border: '1px solid var(--border)', borderRadius: '6px 6px 0 0', borderBottom: 'none', flexWrap: 'wrap' }}>
                  {['B', 'I', 'U', '—', '"', 'link', 'image'].map((t, i) => (
                    t === '—'
                      ? <span key={i} style={{ width: 1, height: 18, background: 'var(--border)', margin: '0 3px' }} />
                      : <button key={i} onClick={() => {
                          const ta = document.getElementById('reply-textarea') as HTMLTextAreaElement
                          if (!ta) return
                          const start = ta.selectionStart, end = ta.selectionEnd
                          const selected = replyText.substring(start, end)
                          let wrap = ''
                          if (t === 'B') wrap = `**${selected || 'bold text'}**`
                          else if (t === 'I') wrap = `*${selected || 'italic text'}*`
                          else if (t === 'U') wrap = `__${selected || 'underlined text'}__`
                          else if (t === '"') wrap = `\n> ${selected || 'quoted text'}\n`
                          else if (t === 'link') wrap = `[${selected || 'link text'}](https://)`
                          else if (t === 'image') wrap = `![${selected || 'image'}](https://image-url)`
                          if (wrap) {
                            setReplyText(replyText.substring(0, start) + wrap + replyText.substring(end))
                          }
                        }}
                        style={{ width: 26, height: 26, background: 'transparent', border: 'none', borderRadius: 4, color: 'var(--text-muted)', fontSize: t.length > 1 ? 13 : 11, fontWeight: t === 'B' ? 800 : t === 'I' ? 400 : 700, fontStyle: t === 'I' ? 'italic' : 'normal', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background 0.15s, color 0.15s' }}
                        onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = 'var(--bg-4)'; (e.currentTarget as HTMLButtonElement).style.color = '#fff' }}
                        onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; (e.currentTarget as HTMLButtonElement).style.color = 'var(--text-muted)' }}>
                        {t === 'link' ? <Icon icon={Solar.link} width={14} height={14} /> : t === 'image' ? <Icon icon={Solar.gallery} width={14} height={14} /> : t}
                      </button>
                  ))}
                </div>

                {/* Textarea */}
                <textarea
                  id="reply-textarea"
                  value={replyText}
                  onChange={e => setReplyText(e.target.value)}
                  placeholder="Write your reply here... Supports **bold**, *italic*, [links](url), ![images](url)"
                  rows={6}
                  style={{ width: '100%', background: 'var(--bg-3)', border: '1px solid var(--border)', borderRadius: '0 0 6px 6px', padding: '12px 14px', color: '#fff', fontSize: 13, fontFamily: 'Barlow, sans-serif', resize: 'vertical', outline: 'none', lineHeight: 1.7 }}
                  onFocus={e => (e.target.style.borderColor = 'rgba(232,0,13,0.4)')}
                  onBlur={e => (e.target.style.borderColor = 'var(--border)')}
                />

                {/* Footer row */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 10, flexWrap: 'wrap', gap: 8 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ width: 28, height: 28, background: 'rgba(232,0,13,0.15)', border: '1px solid rgba(232,0,13,0.25)', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                      <Avatar src={user?.avatarUrl ?? ''} size={28} style={{ borderRadius: 6 }} />
                    </div>
                    <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Posting as <strong style={{ color: '#e74c3c' }}>{user?.username ?? 'Guest'}</strong></span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ fontSize: 11, color: replyText.length > 9500 ? 'var(--red)' : 'var(--text-dim)' }}>
                      {replyText.length} / 10,000
                    </span>
                    <button
                      className="btn-primary"
                      style={{ fontSize: 12, padding: '8px 20px', opacity: replyText.trim().length < 3 ? 0.5 : 1, cursor: replyText.trim().length < 3 ? 'not-allowed' : 'pointer' }}
                      disabled={replyText.trim().length < 3}
                      onClick={async () => {
                        if (replyText.trim().length < 3) return
                        try {
                          const res = await forumApi.createPost(threadId, { content: replyText, quotePostId: quoting ? undefined : undefined })
                          const newPost: Post = {
                            id: (res as any)?._id || (res as any)?.id || String(Date.now()),
                            num: posts.length + 1,
                            user: {
                              name: user?.username ?? 'You',
                              slug: user?.slug ?? '',
                              pfp: user?.avatarUrl ?? '',
                              role: user?.role ?? 'member',
                              posts: 0,
                              joined: '',
                              rep: user?.reputation ?? 0,
                              badges: [],
                            },
                            timestamp: new Date().toLocaleString(),
                            content: replyText,
                            quote: quoting ?? undefined,
                            reactions: [],
                          }
                          setPosts(prev => [...prev, newPost])
                          setReplyText('')
                          setQuoting(null)
                        } catch (err) {
                          console.error('Failed to post reply:', err)
                        }
                      }}
                    >
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}><Icon icon={Solar.plain} width={14} height={14} /> Post Reply</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
            )}
          </div>

          {/* ── SIDEBAR ── */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

            {/* Thread Info */}
            <div style={{ background: 'var(--bg-2)', border: '1px solid var(--border)', borderRadius: 10, overflow: 'hidden' }}>
              <div style={{ padding: '11px 16px', background: 'var(--bg-3)', borderBottom: '1px solid var(--border)', fontFamily: 'Barlow Condensed, sans-serif', fontSize: 13, fontWeight: 800, textTransform: 'uppercase', letterSpacing: 0.5, color: '#fff' }}>
                Thread Info
              </div>
              <div style={{ padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 9 }}>
                {[
                  { label: 'Replies',    value: thread.replies.toString()          },
                  { label: 'Views',      value: thread.views.toLocaleString()       },
                  { label: 'Started',    value: new Date(thread.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) },
                  { label: 'Board',      value: thread.board, isLink: true          },
                  { label: 'Status',     statusRow: true as const                   },
                ].map(row => (
                  <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, color: 'var(--text-dim)' }}>{row.label}</span>
                    {'isLink' in row && row.isLink
                      ? <Link href={`/forum/board/${thread.boardSlug}`} style={{ fontSize: 11, fontWeight: 700, color: 'var(--red)', textDecoration: 'none' }}>{row.value}</Link>
                      : 'statusRow' in row && row.statusRow
                        ? (
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                            <Icon icon={Solar.online} width={12} height={12} style={{ color: thread.status === 'open' ? '#4ade80' : '#888' }} />
                            <span style={{ fontSize: 11, fontWeight: 700, color: thread.status === 'open' ? '#4ade80' : 'var(--text-muted)' }}>{thread.status === 'open' ? 'Open' : 'Locked'}</span>
                          </span>
                          )
                        : <span style={{ fontSize: 11, fontWeight: 700, color: '#fff' }}>{'value' in row ? row.value : ''}</span>
                    }
                  </div>
                ))}
                {/* Last Reply */}
                {thread.lastReplyBy && (
                  <div style={{ borderTop: '1px solid var(--border)', paddingTop: 9 }}>
                    <span style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, color: 'var(--text-dim)' }}>Last Reply</span>
                    <div style={{ marginTop: 5 }}>
                      {thread.lastReplyPreview && (
                        <div style={{ fontSize: 11, color: 'var(--text-muted)', lineHeight: 1.4, marginBottom: 4, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' as any }}>{thread.lastReplyPreview}</div>
                      )}
                      <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                        {thread.lastReplyBySlug ? (
                          <Link href={`/profile/${thread.lastReplyBySlug}`} style={{ fontSize: 11, fontWeight: 700, color: thread.lastReplyByColor || '#e0e0e8', textDecoration: 'none' }}
                            onMouseEnter={e=>(e.currentTarget.style.textDecoration='underline')} onMouseLeave={e=>(e.currentTarget.style.textDecoration='none')}>{thread.lastReplyBy}</Link>
                        ) : (
                          <span style={{ fontSize: 11, fontWeight: 700, color: thread.lastReplyByColor || '#e0e0e8' }}>{thread.lastReplyBy}</span>
                        )}
                        <span style={{ fontSize: 10, color: 'var(--text-dim)' }}>· {thread.lastReplyAt}</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Participants */}
            <div style={{ background: 'var(--bg-2)', border: '1px solid var(--border)', borderRadius: 10, overflow: 'hidden' }}>
              <div style={{ padding: '11px 16px', background: 'var(--bg-3)', borderBottom: '1px solid var(--border)', fontFamily: 'Barlow Condensed, sans-serif', fontSize: 13, fontWeight: 800, textTransform: 'uppercase', letterSpacing: 0.5, color: '#fff' }}>
                Participants <span style={{ fontWeight: 400, fontSize: 11, color: 'var(--text-dim)' }}>({posts.length})</span>
              </div>
              <div style={{ padding: '10px 14px', display: 'flex', flexDirection: 'column', gap: 8 }}>
                {posts.reduce<PostUser[]>((acc, p) => acc.some(u => u.name === p.user.name) ? acc : [...acc, p.user], []).map(u => (
                  <div key={u.name} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ width: 28, height: 28, background: `${nameColor(u)}15`, border: `1px solid ${nameColor(u)}30`, borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, overflow: 'hidden' }}>
                      <Avatar src={u.pfp} size={28} style={{ borderRadius: 6 }} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      {u.slug ? (
                        <Link href={`/profile/${u.slug}`} style={{ fontSize: 11, fontWeight: 700, color: nameColor(u), overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis', textDecoration: 'none', display: 'block' }}
                          onMouseEnter={e=>(e.currentTarget.style.textDecoration='underline')} onMouseLeave={e=>(e.currentTarget.style.textDecoration='none')}>{u.name}</Link>
                      ) : (
                        <div style={{ fontSize: 11, fontWeight: 700, color: nameColor(u), overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>{u.name}</div>
                      )}
                    </div>
                    <RoleBadge role={u.role} />
                    <span style={{ fontSize: 10, color: 'var(--text-dim)', flexShrink: 0 }}>
                      {(() => { const count = posts.filter(p => p.user.name === u.name).length; return `${count} ${count === 1 ? 'Post' : 'Posts'}`; })()}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Related Threads */}
            {relatedThreads.length > 0 && (
            <div style={{ background: 'var(--bg-2)', border: '1px solid var(--border)', borderRadius: 10, overflow: 'hidden' }}>
              <div style={{ padding: '11px 16px', background: 'var(--bg-3)', borderBottom: '1px solid var(--border)', fontFamily: 'Barlow Condensed, sans-serif', fontSize: 13, fontWeight: 800, textTransform: 'uppercase', letterSpacing: 0.5, color: '#fff' }}>
                Related Threads
              </div>
              {relatedThreads.map((t: any, i: number) => (
                <Link key={t._id || i} href={`/forum/board/${t.boardSlug || thread.boardSlug}/${t._id}`}
                  style={{ display: 'block', padding: '10px 14px', borderBottom: i < relatedThreads.length - 1 ? '1px solid var(--border)' : 'none', cursor: 'pointer', transition: 'background 0.15s', textDecoration: 'none' }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-3)')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                  <div style={{ fontSize: 11, fontWeight: 600, color: '#e0e0e8', lineHeight: 1.4, marginBottom: 3, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' as any }}>{t.title}</div>
                  <span style={{ fontSize: 10, color: 'var(--text-dim)' }}>{t.replyCount ?? 0} replies</span>
                </Link>
              ))}
            </div>
            )}

          </div>
        </div>
      </div>

      {/* ── Share toast ── */}
      {shareToast && (
        <div style={{ position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)', background: '#1a1a22', border: '1px solid var(--border)', borderRadius: 8, padding: '10px 20px', color: '#4ade80', fontSize: 12, fontWeight: 700, zIndex: 9999, boxShadow: '0 8px 24px rgba(0,0,0,0.5)' }}>
          Link copied to clipboard
        </div>
      )}

      {/* ── Report modal ── */}
      {reportPostId && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={() => setReportPostId(null)}>
          <div style={{ background: '#18181C', border: '1px solid var(--border)', borderRadius: 12, padding: '28px 32px', width: 420, maxWidth: '90vw' }} onClick={e => e.stopPropagation()}>
            <div style={{ fontFamily: 'Barlow Condensed, sans-serif', fontSize: 18, fontWeight: 800, textTransform: 'uppercase', color: '#fff', marginBottom: 6 }}>Report Post</div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 18 }}>Please describe why you are reporting this post. An admin will review it.</div>
            <div style={{ marginBottom: 8 }}>
              <label style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, color: 'var(--text-dim)', marginBottom: 6, display: 'block' }}>Reason</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 10 }}>
                {['Spam', 'Harassment', 'Inappropriate Content', 'Cheating/Exploits'].map(r => (
                  <button key={r} onClick={() => setReportReason(r)} style={{ padding: '5px 12px', background: reportReason === r ? 'rgba(232,0,13,0.15)' : 'var(--bg-3)', border: `1px solid ${reportReason === r ? 'rgba(232,0,13,0.4)' : 'var(--border)'}`, borderRadius: 6, color: reportReason === r ? 'var(--red)' : 'var(--text-muted)', fontSize: 11, fontWeight: 600, cursor: 'pointer' }}>{r}</button>
                ))}
              </div>
              <textarea
                value={reportReason}
                onChange={e => setReportReason(e.target.value)}
                placeholder="Or type a custom reason..."
                rows={3}
                style={{ width: '100%', background: 'var(--bg-3)', border: '1px solid var(--border)', borderRadius: 6, padding: '10px 12px', color: '#fff', fontSize: 13, fontFamily: 'Barlow, sans-serif', resize: 'vertical', outline: 'none', boxSizing: 'border-box' }}
                onFocus={e => (e.target.style.borderColor = 'rgba(232,0,13,0.4)')}
                onBlur={e => (e.target.style.borderColor = 'var(--border)')}
              />
            </div>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 16 }}>
              <button onClick={() => setReportPostId(null)} style={{ padding: '8px 18px', background: 'var(--bg-3)', border: '1px solid var(--border)', borderRadius: 6, color: 'var(--text-muted)', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>Cancel</button>
              <button
                onClick={handleReport}
                disabled={reportReason.trim().length < 3}
                className="btn-primary"
                style={{ fontSize: 11, padding: '8px 18px', opacity: reportReason.trim().length < 3 ? 0.5 : 1, cursor: reportReason.trim().length < 3 ? 'not-allowed' : 'pointer' }}
              >
                Submit Report
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}