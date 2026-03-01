'use client'

import { useEffect, useState, useRef } from 'react'
import { adminApi } from '@/lib/api'
import ActionBtn from '../components/ActionBtn'
import StatCard from '../components/StatCard'

const CATEGORY_COLORS: Record<string, string> = {
  match: '#3b82f6', tournament: '#a855f7', wager: '#f59e0b', premium: '#22c55e', general: '#8890A4',
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
      <h1 style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 900, fontSize: 28, color: '#fff', margin: 0, textTransform: 'uppercase' }}>
        Live Chat
      </h1>

      {/* Stats */}
      {stats && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 14 }}>
          <StatCard icon="⏳" label="In Queue" value={stats.queueCount} color={stats.queueCount > 0 ? '#e8000d' : '#22c55e'} />
          <StatCard icon="💬" label="Active Chats" value={stats.activeCount} color="#3b82f6" />
        </div>
      )}

      {/* Main Layout: Queue/Active + Chat */}
      <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: 14, minHeight: 500 }}>
        {/* Left Panel: Queue + Active */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {/* Queue */}
          <div style={{ background: '#13131E', border: '1px solid rgba(255,255,255,.06)', borderRadius: 10, padding: 12 }}>
            <div style={{ fontSize: 9, fontWeight: 800, fontFamily: 'Rajdhani, sans-serif', color: '#e8000d', textTransform: 'uppercase', letterSpacing: .8, marginBottom: 8 }}>
              Queue ({queue.length})
            </div>
            {queue.length === 0 ? (
              <div style={{ fontSize: 10, color: '#4F5568', fontFamily: 'Rajdhani, sans-serif', textAlign: 'center', padding: 12 }}>No users waiting</div>
            ) : queue.map(s => (
              <div key={s.sessionId} style={{ padding: '8px 10px', borderRadius: 6, background: 'rgba(255,255,255,.03)', marginBottom: 4, cursor: 'pointer' }} onClick={() => handleClaim(s.sessionId)}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontWeight: 700, fontSize: 11, color: '#DDE0EA', fontFamily: 'Rajdhani, sans-serif' }}>{s.username}</span>
                  <span style={{ fontSize: 8, fontWeight: 700, color: CATEGORY_COLORS[s.category] || '#8890A4', padding: '1px 4px', border: `1px solid ${CATEGORY_COLORS[s.category] || '#8890A4'}44`, borderRadius: 3 }}>{s.category}</span>
                </div>
                {s.contextLabel && <div style={{ fontSize: 9, color: '#4F5568', fontFamily: 'Rajdhani, sans-serif' }}>{s.contextLabel}</div>}
                <ActionBtn label="CLAIM" color="#22c55e" onClick={() => handleClaim(s.sessionId)} />
              </div>
            ))}
          </div>

          {/* Active Chats */}
          <div style={{ background: '#13131E', border: '1px solid rgba(255,255,255,.06)', borderRadius: 10, padding: 12, flex: 1 }}>
            <div style={{ fontSize: 9, fontWeight: 800, fontFamily: 'Rajdhani, sans-serif', color: '#3b82f6', textTransform: 'uppercase', letterSpacing: .8, marginBottom: 8 }}>
              My Active ({active.length})
            </div>
            {active.length === 0 ? (
              <div style={{ fontSize: 10, color: '#4F5568', fontFamily: 'Rajdhani, sans-serif', textAlign: 'center', padding: 12 }}>No active chats</div>
            ) : active.map(s => (
              <div key={s.sessionId} onClick={() => setSelected(s)} style={{
                padding: '8px 10px', borderRadius: 6, cursor: 'pointer', marginBottom: 4,
                background: selected?.sessionId === s.sessionId ? 'rgba(59,130,246,.1)' : 'rgba(255,255,255,.03)',
                border: selected?.sessionId === s.sessionId ? '1px solid rgba(59,130,246,.3)' : '1px solid transparent',
              }}>
                <div style={{ fontWeight: 700, fontSize: 11, color: '#DDE0EA', fontFamily: 'Rajdhani, sans-serif' }}>{s.username}</div>
                <div style={{ fontSize: 9, color: '#4F5568', fontFamily: 'Rajdhani, sans-serif' }}>{s.category} · {s.messages?.length || 0} msgs</div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Panel: Chat */}
        <div style={{ background: '#13131E', border: '1px solid rgba(255,255,255,.06)', borderRadius: 10, display: 'flex', flexDirection: 'column' }}>
          {!selected ? (
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, color: '#4F5568', fontFamily: 'Rajdhani, sans-serif' }}>
              Select a chat from the left panel
            </div>
          ) : (
            <>
              {/* Header */}
              <div style={{ padding: '12px 16px', borderBottom: '1px solid rgba(255,255,255,.06)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <span style={{ fontWeight: 700, fontSize: 14, color: '#fff', fontFamily: 'Rajdhani, sans-serif' }}>{selected.username}</span>
                  <span style={{ fontSize: 9, color: '#4F5568', fontFamily: 'Rajdhani, sans-serif', marginLeft: 8 }}>
                    {selected.category} {selected.contextLabel ? `· ${selected.contextLabel}` : ''}
                  </span>
                </div>
                <ActionBtn label="CLOSE CHAT" color="#e8000d" onClick={() => handleClose(selected.sessionId)} />
              </div>

              {/* Messages */}
              <div style={{ flex: 1, padding: 16, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 8 }}>
                {(selected.messages || []).map((msg: any, i: number) => (
                  <div key={i} style={{
                    alignSelf: msg.isAdmin ? 'flex-end' : 'flex-start',
                    maxWidth: '70%', padding: '8px 12px', borderRadius: 8,
                    background: msg.isAdmin ? 'rgba(59,130,246,.15)' : 'rgba(255,255,255,.06)',
                    border: `1px solid ${msg.isAdmin ? 'rgba(59,130,246,.3)' : 'rgba(255,255,255,.06)'}`,
                  }}>
                    <div style={{ fontSize: 9, color: msg.isAdmin ? '#3b82f6' : '#f59e0b', fontWeight: 700, fontFamily: 'Rajdhani, sans-serif', marginBottom: 2 }}>
                      {msg.senderName}
                    </div>
                    <div style={{ fontSize: 11, color: '#DDE0EA', fontFamily: 'Rajdhani, sans-serif' }}>{msg.text}</div>
                  </div>
                ))}
                <div ref={chatEndRef} />
              </div>

              {/* Input */}
              <div style={{ padding: '12px 16px', borderTop: '1px solid rgba(255,255,255,.06)', display: 'flex', gap: 8 }}>
                <input
                  value={message}
                  onChange={e => setMessage(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleSend()}
                  placeholder="Type a message..."
                  style={{
                    flex: 1, padding: '8px 12px', background: '#0d0d14', border: '1px solid rgba(255,255,255,.09)',
                    borderRadius: 6, fontSize: 11, color: '#fff', fontFamily: 'Rajdhani, sans-serif', outline: 'none',
                  }}
                />
                <ActionBtn label="SEND" color="#3b82f6" onClick={handleSend} />
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
