'use client'

import { useState, useEffect, useRef, Suspense, useCallback } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/lib/auth-context'
import { mailboxApi, usersApi } from '@/lib/api'
import { sendActivity } from '@/lib/socket'
import { Icon } from '@iconify/react'
import { Solar } from '@/lib/solar-duotone'

type Message = { id?: string; side: string; initials: string; pfp?: string; color: string; date: string; time: string; body: string; editedAt?: string | null }
type Thread  = { id: string; from: string; fromSlug: string; initials: string; pfp?: string; color: string; subject: string; date: string; time: string; unread: boolean; preview: string }
type Friend  = { _id: string; username: string; slug: string; avatarUrl: string; avatarEmoji: string; isOnline: boolean; presenceStatus?: string; activityText?: string; lastActiveAt?: string; lastSeen: string; role: string; isPremium: boolean; level: number }

// Render simple markdown: **bold**, *italic*, __underline__, [links](url), ![img](url), [color=red]text[/color]
function renderFormatted(text: string) {
  const parts: React.ReactNode[] = []
  const regex = /(\*\*(.+?)\*\*)|(\*(.+?)\*)|(__(.+?)__)|(!\[([^\]]*)\]\([^)]+\))|(\[[^\]]+\]\([^)]+\))|(\[color=([^\]]+)\](.*?)\[\/color\])|(https?:\/\/[^\s<]+)/g
  let lastIndex = 0
  let match: RegExpExecArray | null
  let key = 0
  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) parts.push(text.slice(lastIndex, match.index))
    const m = match[0]
    if (m.startsWith('**')) parts.push(<strong key={key++} style={{ fontWeight: 700, color: '#fff' }}>{match[2] || m.slice(2,-2)}</strong>)
    else if (m.startsWith('*') && !m.startsWith('**')) parts.push(<em key={key++} style={{ color: '#d0d0e0' }}>{match[4] || m.slice(1,-1)}</em>)
    else if (m.startsWith('__')) parts.push(<u key={key++}>{match[6] || m.slice(2,-2)}</u>)
    else if (m.startsWith('![')) {
      const altMatch = m.match(/!\[([^\]]*)\]\(([^)]+)\)/);
      if (altMatch) parts.push(<img key={key++} src={altMatch[2]} alt={altMatch[1]} style={{ maxWidth: '100%', borderRadius: 8, marginTop: 8, marginBottom: 8, border: '1px solid rgba(255,255,255,0.1)' }} />)
    }
    else if (m.startsWith('[color=')) {
      const colorMatch = m.match(/\[color=([^\]]+)\](.*?)\[\/color\]/);
      if (colorMatch) parts.push(<span key={key++} style={{ color: colorMatch[1] }}>{colorMatch[2]}</span>)
    }
    else if (m.startsWith('[')) {
      const linkMatch = m.match(/\[([^\]]+)\]\(([^)]+)\)/);
      if (linkMatch) parts.push(<a key={key++} href={linkMatch[2]} target="_blank" rel="noopener noreferrer" style={{ color: '#e74c3c', textDecoration: 'underline', fontWeight: 600 }}>{linkMatch[1]}</a>)
    }
    else if (m.startsWith('http')) {
      parts.push(<a key={key++} href={m} target="_blank" rel="noopener noreferrer" style={{ color: '#e74c3c', textDecoration: 'underline', wordBreak: 'break-all' }}>{m}</a>)
    }
    lastIndex = match.index + m.length
  }
  if (lastIndex < text.length) parts.push(text.slice(lastIndex))
  return parts.length ? parts : [text]
}

function Avatar({ src, size = 38, style }: { src?: string; size?: number; style?: React.CSSProperties }) {
  if (src && (src.startsWith('http') || src.startsWith('/') || src.startsWith('data:image'))) {
    return <img src={src} alt="" style={{ width: size, height: size, borderRadius: 8, objectFit: 'cover', ...style }} />
  }
  return <div style={{ width: size, height: size, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', ...style }}><Icon icon={Solar.user} width={size*0.6} height={size*0.6} style={{ color: '#6B7280' }} /></div>
}

// Draft compose state — when user navigates with ?to=slug, we show a compose view
// The conversation is NOT created until the user actually sends the first message
type DraftCompose = { slug: string; userId: string; username: string; initials: string } | null

export default function MailboxPageWrapper() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#0a0a0f] text-white flex items-center justify-center">Loading...</div>}>
      <MailboxPage />
    </Suspense>
  )
}

function MailboxPage() {
  const { user } = useAuth()
  const searchParams = useSearchParams()
  const router = useRouter()
  const [threads,    setThreads]    = useState<Thread[]>([])
  const [selected,   setSelected]   = useState<Thread | null>(null)
  const [reply,      setReply]      = useState('')
  const [messages,   setMessages]   = useState<Record<string, Message[]>>({})
  const [loadingMsgs, setLoadingMsgs] = useState(false)
  const [friends,    setFriends]    = useState<Friend[]>([])
  const [friendSearch, setFriendSearch] = useState('')
  const [draft,      setDraft]      = useState<DraftCompose>(null)
  const [draftMsg,   setDraftMsg]   = useState('')
  const [sendingDraft, setSendingDraft] = useState(false)
  const [editingMsg, setEditingMsg] = useState<{ id: string; body: string } | null>(null)
  const replyRef = useRef<HTMLTextAreaElement>(null)

  const [unreadCountChat, setUnreadCountChat] = useState(0)
  const chatBoxRef = useRef<HTMLDivElement>(null)
  const atBottomRef = useRef(true)

  const scrollToBottom = useCallback((force?: boolean) => {
    const el = chatBoxRef.current
    if (!el) return
    if (force || atBottomRef.current) {
      el.scrollTop = el.scrollHeight
      setUnreadCountChat(0)
    }
  }, [])

  const prevMsgCountRef = useRef(0)
  useEffect(() => {
    if (!selected) return
    const msgs = messages[selected.id] || []
    const newCount = msgs.length - prevMsgCountRef.current
    prevMsgCountRef.current = msgs.length
    if (newCount > 0 && !atBottomRef.current) {
      setUnreadCountChat(u => u + newCount)
    } else {
      setTimeout(() => scrollToBottom(), 0)
    }
  }, [messages, selected, scrollToBottom])

  useEffect(() => { sendActivity('Messaging') }, [])

  const COLORS = ['#E74C3C','#3498DB','#F39C12','#27AE60','#9B59B6','#E67E22','#1ABC9C']

  // Insert formatting wrapper around selected text in textarea
  const applyFormat = (prefix: string, suffix: string) => {
    const ta = replyRef.current
    if (!ta) return
    const start = ta.selectionStart
    const end = ta.selectionEnd
    const text = reply
    const selected = text.slice(start, end)
    const replacement = prefix + (selected || 'text') + suffix
    const newText = text.slice(0, start) + replacement + text.slice(end)
    setReply(newText)
    setTimeout(() => {
      ta.focus()
      const cursorPos = selected ? start + replacement.length : start + prefix.length
      const cursorEnd = selected ? start + replacement.length : start + prefix.length + 4 // select "text"
      ta.setSelectionRange(selected ? cursorPos : start + prefix.length, selected ? cursorPos : cursorEnd)
    }, 0)
  }

  // Save edited message
  const saveEdit = async () => {
    if (!editingMsg || !editingMsg.body.trim() || !selected) return
    try {
      await mailboxApi.editMessage(editingMsg.id, editingMsg.body.trim())
      setMessages(prev => ({
        ...prev,
        [selected.id]: (prev[selected.id] || []).map(m =>
          m.id === editingMsg.id ? { ...m, body: editingMsg.body.trim(), editedAt: new Date().toISOString() } : m
        ),
      }))
      setEditingMsg(null)
    } catch (e: any) {
      alert(e.message || 'Could not edit message')
    }
  }

  // Handle ?to=slug — open a draft compose view for that user
  useEffect(() => {
    const toSlug = searchParams.get('to')
    if (!toSlug) return
    // Fetch the target user's basic info
    usersApi.getBySlug(toSlug).then((u: any) => {
      const uname = u.username || u.displayName || toSlug
      const uid   = u.id || u._id
      setDraft({ slug: toSlug, userId: uid, username: uname, initials: uname.slice(0, 2).toUpperCase() })
      setSelected(null)
    }).catch(() => {
      setDraft({ slug: toSlug, userId: '', username: toSlug, initials: toSlug.slice(0, 2).toUpperCase() })
      setSelected(null)
    })
  }, [searchParams])

  useEffect(() => {
    usersApi.getFriends().then((res: any) => {
      setFriends(Array.isArray(res?.friends) ? res.friends : [])
    }).catch(() => {})

    mailboxApi.getThreads().then((res: any) => {
      const list = (Array.isArray(res) ? res : res.threads || []).map((t: any, i: number) => ({
        id:       t._id || t.id || String(i),
        from:     t.from || t.otherParticipant?.username || t.participantNames?.[0] || 'Unknown',
        fromSlug: t.fromSlug || t.otherParticipant?.slug || '',
        initials: (t.initials || t.otherParticipant?.username || t.participantNames?.[0] || 'UN').slice(0, 2).toUpperCase(),
        pfp:      t.pfp || t.avatarUrl || t.otherParticipant?.avatarUrl || t.otherParticipant?.pfp || '',
        color:    t.color || COLORS[i % COLORS.length],
        subject:  t.subject || t.lastMessage?.text?.slice(0, 60) || 'No subject',
        date:     t.date || (t.updatedAt ? new Date(t.updatedAt).toLocaleDateString('en-US') : ''),
        time:     t.time || (t.updatedAt ? new Date(t.updatedAt).toLocaleTimeString('en-US', { hour:'2-digit', minute:'2-digit' }) : ''),
        unread:   t.unread ?? false,
        preview:  t.preview || t.lastMessage?.text?.slice(0, 80) || '',
      }))
      setThreads(list)
    }).catch(() => {})
  }, [])

  const unreadCount = threads.filter(t => t.unread).length

  const selectThread = (thread: Thread) => {
    setDraft(null)
    setSelected(thread)
    atBottomRef.current = true
    setUnreadCountChat(0)
    if (!messages[thread.id]) {
      setLoadingMsgs(true)
      mailboxApi.getMessages(thread.id).then((res: any) => {
        const msgs = (Array.isArray(res) ? res : res.messages || []).map((m: any) => ({
          id:       m.id || m._id || '',
          side:     m.side || 'theirs',
          initials: m.initials || '??',
          pfp:      m.pfp || m.avatarUrl || '',
          color:    m.color || thread.color,
          date:     m.date || '',
          time:     m.time || '',
          body:     m.body || m.text || '',
          editedAt: m.editedAt || null,
        }))
        setMessages(prev => ({ ...prev, [thread.id]: msgs }))
      }).catch(() => {}).finally(() => setLoadingMsgs(false))
    }
  }

  const selectedMsgs = selected ? (messages[selected.id] || []) : []

  const sendReply = () => {
    if (!selected || !reply.trim()) return
    const text = reply.trim()
    setReply('')
    mailboxApi.reply(selected.id, { body: text }).then(() => {
      const now = new Date()
      const newMsg: Message = {
        side:     'mine',
        initials: (user?.username || 'ME').slice(0, 2).toUpperCase(),
        color:    '#C0392B',
        date:     now.toLocaleDateString('en-US'),
        time:     now.toLocaleTimeString('en-US', { hour:'2-digit', minute:'2-digit' }),
        body:     text,
      }
      setMessages(prev => ({ ...prev, [selected.id]: [...(prev[selected.id] || []), newMsg] }))
      setTimeout(() => scrollToBottom(true), 0)
    }).catch(() => {})
  }

  const openChatWithFriend = (friend: Friend) => {
    // Check if there's already a thread with this friend
    const existing = threads.find(t => t.from === friend.username || t.fromSlug === friend.slug)
    if (existing) {
      setDraft(null)
      selectThread(existing)
    } else {
      // Open a draft compose view — no message sent yet
      setSelected(null)
      setDraft({ slug: friend.slug, userId: friend._id, username: friend.username, initials: friend.username.slice(0, 2).toUpperCase() })
      setDraftMsg('')
    }
  }

  const sendDraft = () => {
    if (!draft || !draftMsg.trim() || sendingDraft) return
    const text = draftMsg.trim()
    setSendingDraft(true)
    mailboxApi.send({ recipientId: draft.userId, body: text }).then((res: any) => {
      const threadId = res._id || res.id || res.threadId
      const newThread: Thread = {
        id:       threadId,
        from:     draft.username,
        fromSlug: draft.slug,
        initials: draft.initials,
        color:    COLORS[threads.length % COLORS.length],
        subject:  `Chat with ${draft.username}`,
        date:     new Date().toLocaleDateString('en-US'),
        time:     new Date().toLocaleTimeString('en-US', { hour:'2-digit', minute:'2-digit' }),
        unread:   false,
        preview:  text,
      }
      setThreads(prev => [newThread, ...prev])
      setSelected(newThread)
      setMessages(prev => ({
        ...prev,
        [threadId]: [{
          side:     'mine',
          initials: (user?.username || 'ME').slice(0, 2).toUpperCase(),
          color:    '#C0392B',
          date:     new Date().toLocaleDateString('en-US'),
          time:     new Date().toLocaleTimeString('en-US', { hour:'2-digit', minute:'2-digit' }),
          body:     text,
        }],
      }))
      setDraft(null)
      setDraftMsg('')
    }).catch((err: any) => {
      alert(err.message || 'Could not send message')
    }).finally(() => setSendingDraft(false))
  }

  const deleteThread = (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    mailboxApi.deleteThread(id).then(() => {
      setThreads(prev => prev.filter(t => t.id !== id))
      if (selected?.id === id) setSelected(null)
    }).catch(() => {})
  }

  return (
    <div style={{ background:'var(--bg-1, #0C0C11)', minHeight:'100vh', paddingBottom: 60 }}>
      {/* ── MAILBOX HEADER ── */}
      <div style={{ position: 'relative', padding: '32px 0 32px', width: '100vw', left: '50%', right: '50%', marginLeft: '-50vw', marginRight: '-50vw', background: 'var(--bg-2)', borderBottom: '1px solid var(--border)', overflow: 'hidden', marginBottom: 24 }}>
        {/* Background effects */}
        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(circle at 20% 0%, rgba(232,0,13,0.12) 0%, transparent 60%)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', inset: 0, backgroundImage: 'linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)', backgroundSize: '32px 32px', opacity: 0.6, pointerEvents: 'none', maskImage: 'linear-gradient(to bottom, black 20%, transparent 100%)', WebkitMaskImage: 'linear-gradient(to bottom, black 20%, transparent 100%)' }} />

        <div className="container" style={{ position: 'relative', zIndex: 1, display:'flex', alignItems:'center', gap:12 }}>
          <button onClick={() => router.back()} style={{ background:'var(--bg-3)', border:'1px solid var(--border)', borderRadius:8, width:36, height:36, display:'flex', alignItems:'center', justifyContent:'center', color:'var(--text-muted)', cursor:'pointer', transition:'all 0.2s', padding:0, boxShadow: '0 4px 12px rgba(0,0,0,0.2)' }}
            onMouseEnter={e=>(e.currentTarget.style.color='#fff', e.currentTarget.style.borderColor='rgba(232,0,13,0.4)')}
            onMouseLeave={e=>(e.currentTarget.style.color='var(--text-muted)', e.currentTarget.style.borderColor='var(--border)')}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M15 18l-6-6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </button>
          <h1 style={{ fontFamily:"'Barlow Condensed',sans-serif", fontWeight:900, fontSize:36, textTransform: 'uppercase', color:'#fff', margin:0, letterSpacing: 0.5 }}>Mailbox</h1>
          {unreadCount > 0 && (
            <span style={{ background:'rgba(232,0,13,0.15)', border:'1px solid rgba(232,0,13,0.3)', color:'var(--red)', fontFamily:"'Roboto',sans-serif", fontWeight:700, fontSize:12, padding:'3px 10px', borderRadius:20, marginLeft: 8, boxShadow: '0 0 12px rgba(232,0,13,0.2)' }}>{unreadCount} unread</span>
          )}
        </div>
      </div>

      <div className="container">
        <div style={{ display:'grid', gridTemplateColumns:'300px 1fr 240px', background:'var(--bg-2)', borderRadius:12, border:'1px solid var(--border)', height:'calc(100vh - 200px)', minHeight:600, boxShadow: '0 10px 40px rgba(0,0,0,0.3)' }}>

          {/* ── THREAD LIST ── */}
          <div style={{ borderRight:'1px solid var(--border)', display:'flex', flexDirection:'column', overflow:'hidden', background:'rgba(0,0,0,0.2)' }}>
            {/* Search */}
            <div style={{ padding:'12px 14px', borderBottom:'1px solid var(--border)' }}>
              <input placeholder="Search messages..." style={{ width:'100%', background:'var(--bg-3)', border:'1px solid var(--border)', borderRadius:6, padding:'8px 12px', fontFamily:"'Roboto',sans-serif", fontSize:12, color:'#fff', outline:'none', boxSizing:'border-box', transition:'all 0.2s' }} onFocus={e => e.target.style.borderColor='rgba(232,0,13,0.4)'} onBlur={e => e.target.style.borderColor='var(--border)'} />
            </div>

            {/* Thread items */}
            <div style={{ flex:1, overflowY:'auto' }}>
              {threads.map(t => (
                <div
                  key={t.id}
                  onClick={() => selectThread(t)}
                  className="mailbox-thread-row"
                  style={{ display:'flex', alignItems:'flex-start', gap:10, padding:'13px 14px', borderBottom:'1px solid var(--border)', cursor:'pointer', background:selected?.id===t.id ? 'rgba(232,0,13,0.1)' : 'transparent', borderLeft:selected?.id===t.id ? '2px solid var(--red)' : '2px solid transparent', position:'relative', transition:'all 0.15s' }}
                >
                  {/* Avatar */}
                  <div style={{ width:42, height:42, borderRadius:10, flexShrink:0, display:'flex', alignItems:'center', justifyContent:'center', overflow:'hidden', background:t.color+'18', border:'1px solid '+t.color+'33' }}>
                    <Avatar src={t.pfp} size={42} />
                  </div>

                  <div style={{ flex:1, minWidth:0, display:'flex', flexDirection:'column', justifyContent:'center' }}>
                    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:4 }}>
                      <span style={{ fontFamily:"'Barlow',sans-serif", fontWeight:t.unread?700:600, fontSize:14, color:t.unread?'#fff':'#E0E0E0', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis', maxWidth:120 }}>{t.from}</span>
                      <span style={{ fontFamily:"'Barlow',sans-serif", fontWeight:600, fontSize:10, color:'var(--text-muted)', flexShrink:0, marginLeft:4 }}>{t.time}</span>
                    </div>
                    <div style={{ fontFamily:"'Barlow',sans-serif", fontSize:12, color:t.unread?'#9CA3AF':'var(--text-muted)', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{t.preview}</div>
                  </div>

                  {t.unread && <div style={{ width:7, height:7, background:'var(--red)', borderRadius:'50%', flexShrink:0, marginTop:4, boxShadow:'0 0 8px rgba(232,0,13,0.6)' }} />}

                  {/* Delete on hover */}
                  <button type="button" onClick={e => deleteThread(t.id, e)} className="thread-delete-btn" aria-label="Delete thread" style={{ position:'absolute', top:8, right:8, background:'rgba(255,255,255,0.06)', border:'none', color:'var(--text-muted)', cursor:'pointer', padding:'4px 6px', borderRadius:4, opacity:0, transition:'opacity 0.15s', display:'flex', alignItems:'center', justifyContent:'center' }} onMouseEnter={e=>(e.currentTarget.style.color='#fff', e.currentTarget.style.background='rgba(232,0,13,0.5)')} onMouseLeave={e=>(e.currentTarget.style.color='var(--text-muted)', e.currentTarget.style.background='rgba(255,255,255,0.06)')}><Icon icon={Solar.close} width={14} height={14} /></button>
                </div>
              ))}
            </div>
          </div>

          {/* ── MESSAGE VIEW ── */}
          <div style={{ display:'flex', flexDirection:'column', overflow:'hidden', background:'var(--bg-2)' }}>
            {selected ? (
              <>
                {/* Message header */}
                <div style={{ padding:'18px 28px 14px', borderBottom:'1px solid var(--border)', flexShrink:0, background:'var(--bg-2)' }}>
                  <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                    <div style={{ display:'flex', alignItems:'center', gap:12 }}>
                      <Avatar src={selected.pfp} size={42} style={{ borderRadius:10 }} />
                      <div>
                        <div style={{ fontFamily:"'Barlow Condensed',sans-serif", fontWeight:700, fontSize:22, color:'#fff', lineHeight:1.2 }}>{selected.from}</div>
                        <div style={{ fontFamily:"'Barlow',sans-serif", fontSize:13, color:'var(--text-muted)', marginTop:2 }}>Conversation started {selected.date}</div>
                      </div>
                    </div>
                    <button onClick={e => { deleteThread(selected.id, e); }} style={{ background:'var(--bg-3)', border:'1px solid var(--border)', borderRadius:6, padding:'8px 12px', color:'var(--text-muted)', fontSize:12, cursor:'pointer', display:'flex', alignItems:'center', gap:6, transition:'all 0.2s' }} onMouseEnter={e=>(e.currentTarget.style.color='var(--red)', e.currentTarget.style.borderColor='rgba(232,0,13,0.4)')} onMouseLeave={e=>(e.currentTarget.style.color='var(--text-muted)', e.currentTarget.style.borderColor='var(--border)')}>
                      <Icon icon={Solar.trash} width={14} height={14} />
                      Delete
                    </button>
                  </div>
                </div>

                <div style={{ position:'relative', flex:1, display:'flex', flexDirection:'column', overflow:'hidden' }}>
                  {/* Messages scroll area */}
                  <div
                    ref={chatBoxRef}
                    onScroll={() => {
                      const el = chatBoxRef.current
                      if (!el) return
                      const isAtBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 40
                      atBottomRef.current = isAtBottom
                      if (isAtBottom) setUnreadCountChat(0)
                    }}
                    style={{ flex:1, overflowY:'auto', padding:'24px 28px', display:'flex', flexDirection:'column', gap:24 }}
                  >
                    {selectedMsgs.map((msg, i) => {
                      const isMine = msg.side === 'mine'
                      const isEditing = editingMsg?.id === msg.id
                      return (
                        <div key={msg.id || i} style={{ display:'flex', flexDirection:isMine?'row-reverse':'row', gap:16, alignItems:'flex-start' }}>
                          {/* Avatar */}
                          <div style={{ width:48, height:48, borderRadius:10, flexShrink:0, overflow:'hidden', background:msg.color+'18', border:`1px solid ${msg.color}33`, display:'flex', alignItems:'center', justifyContent:'center' }}>
                            <Avatar src={isMine ? (user?.avatarUrl ?? undefined) : (msg.pfp || selected?.pfp || undefined)} size={48} />
                          </div>
                          {/* Bubble */}
                          <div style={{ maxWidth:'75%' }}>
                            <div style={{ fontFamily:"'Barlow',sans-serif", fontSize:11, color:'var(--text-muted)', marginBottom:6, textAlign:isMine?'right':'left', display:'flex', alignItems:'center', gap:6, justifyContent:isMine?'flex-end':'flex-start' }}>
                              <span>Sent by <strong style={{ color:isMine?'#F0F0F8':'#9CA3AF', fontWeight:700 }}>{isMine ? 'You' : selected?.from}</strong> on {msg.date} at {msg.time}</span>
                              {msg.editedAt && <span style={{ color:'var(--text-muted)', fontStyle:'italic' }}>(edited)</span>}
                              {isMine && msg.id && !isEditing && (
                                <button
                                  onClick={() => setEditingMsg({ id: msg.id!, body: msg.body })}
                                  style={{ background:'none', border:'none', color:'var(--text-dim)', cursor:'pointer', fontSize:12, padding:'0 2px', fontFamily:"'Roboto',sans-serif", transition: 'color 0.2s' }}
                                  title="Edit message"
                                  onMouseEnter={e=>(e.currentTarget.style.color='#fff')} onMouseLeave={e=>(e.currentTarget.style.color='var(--text-dim)')}
                                >
                                  <Icon icon={Solar.pen} width={12} height={12} />
                                </button>
                              )}
                            </div>
                            {isEditing && editingMsg ? (
                              <div style={{ background:'rgba(232,0,13,0.08)', border:'1px solid rgba(232,0,13,0.3)', borderRadius:12, padding:'10px 14px' }}>
                                <textarea
                                  value={editingMsg.body}
                                  onChange={e => setEditingMsg({ ...editingMsg, body: e.target.value })}
                                  onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); saveEdit() } if (e.key === 'Escape') setEditingMsg(null) }}
                                  rows={3}
                                  autoFocus
                                  style={{ width:'100%', background:'var(--bg-3)', border:'1px solid rgba(232,0,13,0.4)', borderRadius:6, padding:'8px 10px', fontFamily:"'Barlow',sans-serif", fontSize:13, color:'#fff', outline:'none', resize:'vertical', lineHeight:'1.5', boxSizing:'border-box' }}
                                />
                                <div style={{ display:'flex', gap:6, marginTop:8, justifyContent:'flex-end' }}>
                                  <button onClick={() => setEditingMsg(null)} style={{ background:'var(--bg-3)', border:'1px solid var(--border)', borderRadius:4, padding:'6px 12px', fontFamily:"'Roboto',sans-serif", fontSize:11, color:'var(--text-muted)', cursor:'pointer', transition:'all 0.2s' }} onMouseEnter={e=>(e.currentTarget.style.color='#fff', e.currentTarget.style.background='var(--bg-4)')} onMouseLeave={e=>(e.currentTarget.style.color='var(--text-muted)', e.currentTarget.style.background='var(--bg-3)')}>Cancel</button>
                                  <button onClick={saveEdit} className="btn-primary" style={{ padding:'6px 12px', fontSize:11 }}>Save Edit</button>
                                </div>
                              </div>
                            ) : (
                              <div style={{ background:isMine?'rgba(232,0,13,0.15)':'var(--bg-4)', border:`1px solid ${isMine?'rgba(232,0,13,0.3)':'var(--border)'}`, borderRadius:isMine?'12px 4px 12px 12px':'4px 12px 12px 12px', padding:'14px 18px', fontFamily:"'Barlow',sans-serif", fontWeight:500, fontSize:13, color:'#E0E0E0', lineHeight:'1.6', whiteSpace:'pre-line', boxShadow:isMine?'0 4px 12px rgba(232,0,13,0.1)':'0 4px 12px rgba(0,0,0,0.1)' }}>
                                {renderFormatted(msg.body)}
                              </div>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                  {/* Unread badge — shown when scrolled up and new messages arrive */}
                  {unreadCountChat > 0 && (
                    <button
                      onClick={() => scrollToBottom(true)}
                      style={{ position:'absolute', bottom:16, left:'50%', transform:'translateX(-50%)', display:'flex', alignItems:'center', gap:6, background:'var(--bg-3)', border:'1px solid var(--border)', borderRadius:20, padding:'6px 16px', cursor:'pointer', boxShadow:'0 4px 16px rgba(0,0,0,0.4)', zIndex:10, transition: 'all 0.2s' }}
                      onMouseEnter={e=>(e.currentTarget.style.borderColor='rgba(232,0,13,0.4)', e.currentTarget.style.transform='translateX(-50%) scale(1.05)')}
                      onMouseLeave={e=>(e.currentTarget.style.borderColor='var(--border)', e.currentTarget.style.transform='translateX(-50%) scale(1)')}
                    >
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none"><path d="M12 16l-6-6h12l-6 6z" fill="var(--red)"/></svg>
                      <span style={{ fontSize:12, fontWeight:700, color:'var(--red)', fontFamily:"'Barlow', sans-serif" }}>
                        {unreadCountChat} new {unreadCountChat === 1 ? 'message' : 'messages'}
                      </span>
                    </button>
                  )}
                </div>

                {/* Reply bar */}
                <div style={{ background:'var(--bg-2)', borderTop:'1px solid var(--border)', flexShrink:0 }}>
                  {/* Formatting tools */}
                  <div style={{ display:'flex', alignItems:'center', gap:6, padding:'8px 16px', borderBottom:'1px solid var(--border)', flexWrap:'wrap', background:'var(--bg-3)' }}>
                    <button onClick={() => applyFormat('**', '**')} title="Bold (**text**)" style={{ width:26, height:26, background:'transparent', border:'none', borderRadius:4, fontSize:13, fontFamily:"'Roboto',sans-serif", fontWeight:800, color:'var(--text-muted)', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', transition:'all 0.2s' }} onMouseEnter={e=>(e.currentTarget.style.background='var(--bg-4)', e.currentTarget.style.color='#fff')} onMouseLeave={e=>(e.currentTarget.style.background='transparent', e.currentTarget.style.color='var(--text-muted)')}>B</button>
                    <button onClick={() => applyFormat('*', '*')} title="Italic (*text*)" style={{ width:26, height:26, background:'transparent', border:'none', borderRadius:4, fontSize:13, fontFamily:"'Roboto',sans-serif", fontWeight:400, fontStyle:'italic', color:'var(--text-muted)', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', transition:'all 0.2s' }} onMouseEnter={e=>(e.currentTarget.style.background='var(--bg-4)', e.currentTarget.style.color='#fff')} onMouseLeave={e=>(e.currentTarget.style.background='transparent', e.currentTarget.style.color='var(--text-muted)')}>I</button>
                    <button onClick={() => applyFormat('__', '__')} title="Underline (__text__)" style={{ width:26, height:26, background:'transparent', border:'none', borderRadius:4, fontSize:13, fontFamily:"'Roboto',sans-serif", fontWeight:600, textDecoration:'underline', color:'var(--text-muted)', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', transition:'all 0.2s' }} onMouseEnter={e=>(e.currentTarget.style.background='var(--bg-4)', e.currentTarget.style.color='#fff')} onMouseLeave={e=>(e.currentTarget.style.background='transparent', e.currentTarget.style.color='var(--text-muted)')}>U</button>
                    <div style={{ width:1, height:18, background:'var(--border)', margin:'0 4px' }} />
                    <button onClick={() => applyFormat('[', '](https://)')} title="Link" style={{ width:26, height:26, background:'transparent', border:'none', borderRadius:4, fontSize:13, color:'var(--text-muted)', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', transition:'all 0.2s' }} onMouseEnter={e=>(e.currentTarget.style.background='var(--bg-4)', e.currentTarget.style.color='#fff')} onMouseLeave={e=>(e.currentTarget.style.background='transparent', e.currentTarget.style.color='var(--text-muted)')}><Icon icon={Solar.link} width={15} height={15} /></button>
                    <button onClick={() => applyFormat('![', '](https://)')} title="Image" style={{ width:26, height:26, background:'transparent', border:'none', borderRadius:4, fontSize:13, color:'var(--text-muted)', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', transition:'all 0.2s' }} onMouseEnter={e=>(e.currentTarget.style.background='var(--bg-4)', e.currentTarget.style.color='#fff')} onMouseLeave={e=>(e.currentTarget.style.background='transparent', e.currentTarget.style.color='var(--text-muted)')}><Icon icon={Solar.gallery} width={15} height={15} /></button>
                    <div style={{ width:1, height:18, background:'var(--border)', margin:'0 4px' }} />
                    <button onClick={() => applyFormat('[color=var(--red)]', '[/color]')} title="Color" style={{ height:26, padding:'0 8px', background:'transparent', border:'none', borderRadius:4, fontSize:12, color:'var(--red)', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:800, transition:'all 0.2s' }} onMouseEnter={e=>(e.currentTarget.style.background='rgba(232,0,13,0.1)')} onMouseLeave={e=>(e.currentTarget.style.background='transparent')}>Color</button>
                  </div>
                  <div style={{ display:'flex', alignItems:'center', gap:10, padding:'12px 16px', background:'var(--bg-2)' }}>
                    <textarea
                      ref={replyRef}
                      value={reply}
                      onChange={e => setReply(e.target.value)}
                      onKeyDown={e => { if (e.key==='Enter' && !e.shiftKey) { e.preventDefault(); sendReply() } }}
                      placeholder="Write a reply... (Enter to send, Shift+Enter for new line)"
                      rows={2}
                      style={{ flex:1, background:'var(--bg-3)', border:'1px solid var(--border)', borderRadius:8, padding:'10px 14px', fontFamily:"'Barlow',sans-serif", fontSize:13, color:'#fff', outline:'none', resize:'none', lineHeight:'1.5', transition:'all 0.2s' }}
                      onFocus={e => (e.target.style.borderColor = 'rgba(232,0,13,0.4)')}
                      onBlur={e => (e.target.style.borderColor = 'var(--border)')}
                    />
                    <button onClick={sendReply} disabled={!reply.trim()} className={reply.trim() ? "btn-primary" : ""} style={{ background:reply.trim()?'':'var(--bg-3)', border:reply.trim()?'':'1px solid var(--border)', borderRadius:8, padding:'12px 24px', fontFamily:"'Barlow Condensed',sans-serif", fontWeight:800, fontSize:14, textTransform:'uppercase', color:reply.trim()?'#fff':'var(--text-dim)', cursor:reply.trim()?'pointer':'default', flexShrink:0, display:'flex', alignItems:'center', gap:6, transition:'all 0.2s' }}>
                      Send <Icon icon={Solar.plain} width={14} height={14} />
                    </button>
                  </div>
                </div>
              </>
            ) : draft ? (
              /* ── DRAFT COMPOSE VIEW ── */
              <>
                <div style={{ padding:'18px 28px 14px', borderBottom:'1px solid var(--border)', flexShrink:0, background:'var(--bg-2)' }}>
                  <div style={{ fontFamily:"'Barlow Condensed',sans-serif", fontWeight:700, fontSize:22, color:'#fff', lineHeight:1.2 }}>New Message</div>
                  <div style={{ fontFamily:"'Barlow',sans-serif", fontSize:13, color:'var(--text-muted)', marginTop:4 }}>To: <span style={{ color:'var(--red)', fontWeight:600 }}>{draft.username}</span></div>
                </div>
                <div style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', color:'var(--text-muted)', padding:28 }}>
                  <div style={{ width:72, height:72, background:'rgba(232,0,13,0.1)', border:'1px solid rgba(232,0,13,0.3)', borderRadius:16, display:'flex', alignItems:'center', justifyContent:'center', marginBottom:20, boxShadow:'0 0 20px rgba(232,0,13,0.15)' }}>
                    <span style={{ fontFamily:"'Barlow Condensed',sans-serif", fontWeight:800, fontSize:28, color:'var(--red)' }}>{draft.initials}</span>
                  </div>
                  <div style={{ fontFamily:"'Barlow',sans-serif", fontSize:16, color:'var(--text-muted)', marginBottom:4 }}>Start a conversation with <strong style={{ color:'#fff' }}>{draft.username}</strong></div>
                  <div style={{ fontFamily:"'Roboto',sans-serif", fontSize:12, color:'var(--text-dim)' }}>Type your message below and hit Send</div>
                </div>
                <div style={{ background:'var(--bg-2)', borderTop:'1px solid var(--border)', flexShrink:0 }}>
                  <div style={{ display:'flex', alignItems:'center', gap:10, padding:'12px 16px' }}>
                    <textarea
                      value={draftMsg}
                      onChange={e => setDraftMsg(e.target.value)}
                      onKeyDown={e => { if (e.key==='Enter' && !e.shiftKey) { e.preventDefault(); sendDraft() } }}
                      placeholder={`Write a message to ${draft.username}... (Enter to send)`}
                      rows={2}
                      autoFocus
                      style={{ flex:1, background:'var(--bg-3)', border:'1px solid var(--border)', borderRadius:8, padding:'10px 14px', fontFamily:"'Barlow',sans-serif", fontSize:13, color:'#fff', outline:'none', resize:'none', lineHeight:'1.5', transition:'all 0.2s' }}
                      onFocus={e => (e.target.style.borderColor = 'rgba(232,0,13,0.4)')}
                      onBlur={e => (e.target.style.borderColor = 'var(--border)')}
                    />
                    <button onClick={sendDraft} disabled={!draftMsg.trim() || sendingDraft} className={(draftMsg.trim() && !sendingDraft) ? "btn-primary" : ""} style={{ background:(draftMsg.trim() && !sendingDraft)?'':'var(--bg-3)', border:(draftMsg.trim() && !sendingDraft)?'':'1px solid var(--border)', borderRadius:8, padding:'12px 24px', fontFamily:"'Barlow Condensed',sans-serif", fontWeight:800, fontSize:14, textTransform:'uppercase', color:(draftMsg.trim() && !sendingDraft)?'#fff':'var(--text-dim)', cursor:(draftMsg.trim() && !sendingDraft)?'pointer':'default', flexShrink:0, display:'flex', alignItems:'center', gap:6, transition:'all 0.2s' }}>
                      {sendingDraft ? 'Sending...' : <>Send <Icon icon={Solar.plain} width={14} height={14} /></>}
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <div style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', color:'var(--text-dim)' }}>
                <Icon icon={Solar.chat} width={64} height={64} style={{ marginBottom:16, opacity: 0.15 }} />
                <div style={{ fontFamily:"'Barlow',sans-serif", fontSize:16, fontWeight:500, color:'var(--text-muted)' }}>Select a message to read it</div>
              </div>
            )}
          </div>

          {/* ── FRIENDS PANEL ── */}
          <div style={{ borderLeft:'1px solid var(--border)', display:'flex', flexDirection:'column', overflow:'hidden', background:'rgba(0,0,0,0.2)' }}>
            <div style={{ padding:'12px 14px', borderBottom:'1px solid var(--border)', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
              <span style={{ fontFamily:"'Barlow Condensed',sans-serif", fontWeight:800, fontSize:14, textTransform:'uppercase', letterSpacing:0.5, color:'#fff' }}>Friends</span>
              <span style={{ fontFamily:"'Barlow Condensed',sans-serif", fontSize:12, color:'#4ade80', fontWeight:700, letterSpacing:0.5 }}>
                {friends.filter(f => f.isOnline).length} ONLINE
              </span>
            </div>

            {/* Search friends */}
            <div style={{ padding:'8px 12px', borderBottom:'1px solid var(--border)' }}>
              <input
                placeholder="Search friends..."
                value={friendSearch}
                onChange={e => setFriendSearch(e.target.value)}
                style={{ width:'100%', background:'var(--bg-3)', border:'1px solid var(--border)', borderRadius:6, padding:'8px 10px', fontFamily:"'Roboto',sans-serif", fontSize:11, color:'#fff', outline:'none', boxSizing:'border-box', transition:'all 0.2s' }}
                onFocus={e => (e.target.style.borderColor = 'rgba(232,0,13,0.4)')}
                onBlur={e => (e.target.style.borderColor = 'var(--border)')}
              />
            </div>

            {/* Friends list */}
            <div style={{ flex:1, overflowY:'auto' }}>
              {/* Online friends first, then offline */}
              {(() => {
                const filtered = friends.filter(f =>
                  !friendSearch || f.username.toLowerCase().includes(friendSearch.toLowerCase())
                )
                const online  = filtered.filter(f => f.presenceStatus === 'online')
                const idle    = filtered.filter(f => f.presenceStatus === 'idle')
                const offline = filtered.filter(f => f.presenceStatus !== 'online' && f.presenceStatus !== 'idle')
                const sorted  = [...online, ...idle, ...offline]

                if (sorted.length === 0) {
                  return (
                    <div style={{ padding:'24px 14px', textAlign:'center', color:'var(--text-muted)', fontFamily:"'Roboto',sans-serif", fontSize:12 }}>
                      {friends.length === 0 ? 'No friends yet' : 'No matches'}
                    </div>
                  )
                }

                return sorted.map(friend => {
                  // Check if there's an existing thread
                  const existingThread = threads.find(t => t.from === friend.username || t.fromSlug === friend.slug)
                  return (
                    <div
                      key={friend._id}
                      onClick={() => openChatWithFriend(friend)}
                      className="mailbox-friend-row"
                      style={{ display:'flex', alignItems:'center', gap:10, padding:'12px 14px', borderBottom:'1px solid var(--border)', cursor:'pointer', transition:'background 0.15s' }}
                    >
                      {/* Avatar */}
                      <div style={{ position:'relative', flexShrink:0 }}>
                        <div style={{ width:34, height:34, borderRadius:10, overflow:'hidden', display:'flex', alignItems:'center', justifyContent:'center', background:'var(--bg-3)', border:'1px solid var(--border)' }}>
                          {friend.avatarUrl
                            ? <img src={friend.avatarUrl} alt="" style={{ width:'100%', height:'100%', objectFit:'cover' }} />
                            : friend.avatarEmoji
                              ? <Icon icon={Solar.user} width={18} height={18} style={{ display: 'block', color:'var(--text-muted)' }} />
                              : <Icon icon={Solar.user} width={18} height={18} style={{ display: 'block', color:'var(--text-muted)' }} />
                          }
                        </div>
                        {/* Presence dot */}
                        <div style={{
                          position:'absolute', bottom:-2, right:-2,
                          width:12, height:12,
                          background: friend.presenceStatus === 'online' ? '#4ade80' : friend.presenceStatus === 'idle' ? '#F0AA1A' : 'var(--text-dim)',
                          border:'2px solid var(--bg-2)',
                          borderRadius:'50%',
                          boxShadow: friend.presenceStatus === 'online' ? '0 0 6px rgba(74,222,128,0.4)' : friend.presenceStatus === 'idle' ? '0 0 6px rgba(240,170,26,0.3)' : 'none',
                        }} />
                      </div>

                      {/* Info */}
                      <div style={{ flex:1, minWidth:0, display:'flex', flexDirection:'column', justifyContent:'center' }}>
                        <div style={{ fontFamily:"'Barlow',sans-serif", fontWeight:600, fontSize:13, color: friend.presenceStatus === 'online' ? '#fff' : friend.presenceStatus === 'idle' ? '#d4d4d4' : 'var(--text-muted)', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>
                          {friend.username}
                        </div>
                        <div style={{ fontFamily:"'Barlow',sans-serif", fontSize:11, color:'var(--text-muted)', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>
                          {friend.presenceStatus === 'online'
                            ? <span style={{ color:'#4ade80' }}>{friend.activityText || 'Online'}</span>
                            : friend.presenceStatus === 'idle'
                              ? <span style={{ color:'#F0AA1A' }}>Idle</span>
                              : existingThread
                                ? existingThread.preview.slice(0, 30) + (existingThread.preview.length > 30 ? '...' : '')
                                : `Lv. ${friend.level}`
                          }
                        </div>
                      </div>

                      {/* Unread indicator or chat icon */}
                      {existingThread?.unread ? (
                        <div style={{ width:7, height:7, background:'var(--red)', borderRadius:'50%', flexShrink:0, boxShadow:'0 0 8px rgba(232,0,13,0.6)' }} />
                      ) : (
                        <Link href={`/profile/${friend.slug}`} onClick={e => e.stopPropagation()} style={{ fontSize:16, color:'var(--text-dim)', textDecoration:'none', flexShrink:0, display:'flex', alignItems:'center', transition:'color 0.2s' }} onMouseEnter={e=>e.currentTarget.style.color='var(--red)'} onMouseLeave={e=>e.currentTarget.style.color='var(--text-dim)'} title="View profile">
                          →
                        </Link>
                      )}
                    </div>
                  )
                })
              })()}
            </div>
          </div>
        </div>
      </div>

      <style>{`
        .mailbox-thread-row:hover .thread-delete-btn { opacity: 1 !important; transform: scale(1.05); }
        .mailbox-thread-row:hover { background: rgba(232,0,13,0.05) !important; }
        .mailbox-friend-row:hover { background: rgba(255,255,255,0.04) !important; }
      `}</style>
    </div>
  )
}