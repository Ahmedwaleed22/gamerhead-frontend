'use client'

import { useEffect, useState, useRef } from 'react'
import { adminApi } from '@/lib/api'
import ActionBtn from '../components/ActionBtn'
import StatCard from '../components/StatCard'
import { Solar } from '@/lib/solar-duotone'

const CATEGORY_COLORS: Record<string, string> = {
  match: '#3b82f6', tournament: '#a855f7', wager: '#f59e0b', premium: '#22c55e', technical: '#3b82f6', general: '#8890A4',
}
const CATEGORY_LABELS: Record<string, string> = {
  tournament: 'Tournament', wager: 'Wager', match: 'Match', premium: 'Premium', technical: 'Technical', general: 'General',
}
const PRIORITY_MAP: Record<string, { label: string; color: string }> = {
  tournament: { label: 'HIGH', color: '#e8000d' },
  wager: { label: 'HIGH', color: '#e8000d' },
  match: { label: 'MED', color: '#f59e0b' },
  premium: { label: 'MED', color: '#f59e0b' },
  technical: { label: 'LOW', color: '#8890A4' },
  general: { label: 'LOW', color: '#8890A4' },
}

function timeAgo(d: string | Date) {
  const diff = Math.max(0, Date.now() - new Date(d).getTime())
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  return `${hrs}h ${mins % 60}m ago`
}

export default function AdminLiveChatPage() {
  const [queue, setQueue] = useState<any[]>([])
  const [active, setActive] = useState<any[]>([])
  const [stats, setStats] = useState<any>(null)
  const [selected, setSelected] = useState<any>(null)
  const [message, setMessage] = useState('')
  const chatEndRef = useRef<HTMLDivElement>(null)

  const load = async () => {
    try {
      const [qRes, aRes, sRes] = await Promise.all([
        adminApi.getLiveChatQueue(),
        adminApi.getLiveChatActive(),
        adminApi.getLiveChatStats(),
      ])
      setQueue(Array.isArray(qRes) ? qRes : qRes.sessions || [])
      setActive(Array.isArray(aRes) ? aRes : aRes.sessions || [])
      setStats(sRes)
      // Refresh selected session if it's active
      if (selected) {
        const allActive = Array.isArray(aRes) ? aRes : aRes.sessions || []
        const updated = allActive.find((s: any) => s.sessionId === selected.sessionId)
        if (updated) setSelected(updated)
      }
    } catch { }
  }

  useEffect(() => {
    load()
    const interval = setInterval(load, 5000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [selected?.messages])

  const handleClaim = async (sessionId: string) => {
    try {
      await adminApi.claimLiveChat(sessionId)
      load()
    } catch { }
  }

  const handleSend = async () => {
    if (!selected || !message.trim()) return
    try {
      const res = await adminApi.sendLiveChatMessage(selected.sessionId, { text: message })
      setSelected(res)
      setMessage('')
      load()
    } catch { }
  }

  const handleClose = async (sessionId: string) => {
    try {
      await adminApi.closeLiveChat(sessionId)
      setSelected(null)
      load()
    } catch { }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <h1 style={{ fontWeight: 900, fontSize: 28, color: '#fff', margin: 0, textTransform: 'uppercase' }}>
        Live Chat
      </h1>

      {/* Stats */}
      {stats && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 14 }}>
          <StatCard icon={Solar.hourglass} label="In Queue" value={stats.queueCount} color={stats.queueCount > 0 ? '#e8000d' : '#22c55e'} />
          <StatCard icon={Solar.chat} label="Active Chats" value={stats.activeCount} color="#3b82f6" />
        </div>
      )}

      {/* Main Layout: Queue/Active + Chat */}
      <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: 14, minHeight: 500 }}>
        {/* Left Panel: Queue + Active */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {/* Queue */}
          <div style={{ background: '#13131E', border: '1px solid rgba(255,255,255,.06)', borderRadius: 10, padding: 12 }}>
            <div style={{ fontSize: 9, fontWeight: 800, color: '#e8000d', textTransform: 'uppercase', letterSpacing: .8, marginBottom: 8 }}>
              Queue ({queue.length})
            </div>
            {queue.length === 0 ? (
              <div style={{ fontSize: 10, color: '#4F5568', textAlign: 'center', padding: 12 }}>No users waiting</div>
            ) : queue.map(s => {
              const priority = PRIORITY_MAP[s.category] || PRIORITY_MAP.general
              const catColor = CATEGORY_COLORS[s.category] || '#8890A4'
              return (
                <div key={s.sessionId} style={{ padding: '10px 12px', borderRadius: 8, background: 'rgba(255,255,255,.03)', marginBottom: 6, border: '1px solid rgba(255,255,255,.04)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                    <span style={{ fontWeight: 700, fontSize: 12, color: '#DDE0EA', flex: 1 }}>{s.username}</span>
                    <span style={{
                      fontSize: 8, fontWeight: 800, color: priority.color, padding: '1px 5px',
                      border: `1px solid ${priority.color}44`, borderRadius: 3, letterSpacing: .5,
                    }}>{priority.label}</span>
                    <span style={{
                      fontSize: 8, fontWeight: 700, color: catColor, padding: '1px 5px',
                      border: `1px solid ${catColor}44`, borderRadius: 3,
                    }}>{CATEGORY_LABELS[s.category] || s.category}</span>
                  </div>
                  {s.contextLabel && <div style={{ fontSize: 9, color: '#6B7280', marginBottom: 4 }}>{s.contextLabel}</div>}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: 9, color: '#4F5568' }}>{timeAgo(s.createdAt)}</span>
                    <ActionBtn label="CLAIM" color="#22c55e" onClick={() => handleClaim(s.sessionId)} />
                  </div>
                </div>
              )
            })}
          </div>

          {/* Active Chats */}
          <div style={{ background: '#13131E', border: '1px solid rgba(255,255,255,.06)', borderRadius: 10, padding: 12, flex: 1 }}>
            <div style={{ fontSize: 9, fontWeight: 800, color: '#3b82f6', textTransform: 'uppercase', letterSpacing: .8, marginBottom: 8 }}>
              Active Chats ({active.length})
            </div>
            {active.length === 0 ? (
              <div style={{ fontSize: 10, color: '#4F5568', textAlign: 'center', padding: 12 }}>No active chats</div>
            ) : active.map(s => {
              const catColor = CATEGORY_COLORS[s.category] || '#8890A4'
              return (
                <div key={s.sessionId} onClick={() => setSelected(s)} style={{
                  padding: '10px 12px', borderRadius: 8, cursor: 'pointer', marginBottom: 4,
                  background: selected?.sessionId === s.sessionId ? 'rgba(59,130,246,.1)' : 'rgba(255,255,255,.03)',
                  border: selected?.sessionId === s.sessionId ? '1px solid rgba(59,130,246,.3)' : '1px solid transparent',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ fontWeight: 700, fontSize: 12, color: '#DDE0EA', flex: 1 }}>{s.username}</span>
                    <span style={{
                      fontSize: 8, fontWeight: 700, color: catColor, padding: '1px 5px',
                      border: `1px solid ${catColor}44`, borderRadius: 3,
                    }}>{CATEGORY_LABELS[s.category] || s.category}</span>
                  </div>
                  <div style={{ fontSize: 9, color: '#4F5568', marginTop: 2 }}>
                    {s.messages?.length || 0} msgs · {timeAgo(s.claimedAt || s.createdAt)}
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Right Panel: Chat */}
        <div style={{ background: '#13131E', border: '1px solid rgba(255,255,255,.06)', borderRadius: 10, display: 'flex', flexDirection: 'column' }}>
          {!selected ? (
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, color: '#4F5568' }}>
              Select a chat from the left panel
            </div>
          ) : (
            <>
              {/* Header */}
              <div style={{ padding: '12px 16px', borderBottom: '1px solid rgba(255,255,255,.06)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <span style={{ fontWeight: 700, fontSize: 14, color: '#fff' }}>{selected.username}</span>
                  <span style={{ fontSize: 9, color: '#4F5568', marginLeft: 8 }}>
                    {CATEGORY_LABELS[selected.category] || selected.category} {selected.contextLabel ? `· ${selected.contextLabel}` : ''}
                  </span>
                  {selected.userId && (
                    <span style={{ fontSize: 9, color: '#4F5568', marginLeft: 8 }}>
                      ID: {selected.userId?.toString?.()?.slice(-8) || ''}
                    </span>
                  )}
                </div>
                <ActionBtn label="CLOSE CHAT" color="#e8000d" onClick={() => handleClose(selected.sessionId)} />
              </div>

              {/* Messages */}
              <div style={{ flex: 1, padding: 16, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 10 }}>
                {(selected.messages || []).map((msg: any, i: number) => (
                  <div key={i} style={{
                    alignSelf: msg.isAdmin ? 'flex-end' : 'flex-start',
                    maxWidth: '75%', padding: '10px 14px', borderRadius: 10,
                    background: msg.isAdmin ? 'rgba(59,130,246,.15)' : 'rgba(255,255,255,.06)',
                    border: `1px solid ${msg.isAdmin ? 'rgba(59,130,246,.3)' : 'rgba(255,255,255,.07)'}`,
                  }}>
                    <div style={{ fontSize: 11, color: msg.isAdmin ? '#60A5FA' : '#F39C12', fontWeight: 700, marginBottom: 4 }}>
                      {msg.senderName}{msg.isAdmin && <span style={{ marginLeft: 5, fontSize: 9, background: 'rgba(59,130,246,0.12)', padding: '1px 5px', borderRadius: 3, textTransform: 'uppercase', letterSpacing: 0.4 }}>Staff</span>}
                    </div>
                    <div style={{ fontSize: 13, color: '#DDE0EA', lineHeight: '1.55', whiteSpace: 'pre-wrap' }}>{msg.text}</div>
                    <div style={{ fontSize: 10, color: '#4F5568', marginTop: 4, textAlign: 'right' }}>
                      {new Date(msg.sentAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                ))}
                <div ref={chatEndRef} />
              </div>

              {/* Input */}
              <div style={{ padding: '12px 16px', borderTop: '1px solid rgba(255,255,255,.06)', display: 'flex', flexDirection: 'column', gap: 8 }}>
                <textarea
                  value={message}
                  onChange={e => setMessage(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() } }}
                  placeholder="Type a message... (Shift+Enter for new line)"
                  style={{
                    width: '100%', minHeight: 80, padding: '10px 12px', background: '#0d0d14', border: '1px solid rgba(255,255,255,.09)',
                    borderRadius: 8, fontSize: 12, color: '#fff', outline: 'none', resize: 'none',
                    lineHeight: '1.5', boxSizing: 'border-box',
                  }}
                />
                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <ActionBtn label="SEND" color="#3b82f6" size="md" onClick={handleSend} />
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
