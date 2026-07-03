'use client'

import { useEffect, useState, useRef } from 'react'
import { adminApi } from '@/lib/api'
import ActionBtn from '../components/ActionBtn'
import StatCard from '../components/StatCard'
import { Solar } from '@/lib/solar-duotone'
import { RichEditor, RichContent } from '@/app/components/RichEditor'

const CATEGORY_COLORS: Record<string, string> = {
  match: '#3b82f6', tournament: '#a855f7', wager: '#f59e0b', premium: '#22c55e', technical: '#3b82f6', general: '#8890A4',
}
const CATEGORY_LABELS: Record<string, string> = {
  tournament: 'Tournament', wager: 'Prize Entry', match: 'Match', premium: 'Premium', technical: 'Technical', general: 'General',
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

function UserAvatar({ name, size = 36, color = '#3b82f6' }: { name: string; size?: number; color?: string }) {
  const initials = name
    ? name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
    : '?'
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%', flexShrink: 0,
      background: `${color}22`, border: `1.5px solid ${color}55`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontWeight: 800, fontSize: size * 0.36, color,
      letterSpacing: 0.5,
    }}>
      {initials}
    </div>
  )
}

function PulseDot({ color = '#e8000d' }: { color?: string }) {
  return (
    <span style={{ position: 'relative', display: 'inline-flex', width: 8, height: 8, flexShrink: 0 }}>
      <span style={{
        position: 'absolute', inset: 0, borderRadius: '50%', background: color, opacity: 0.4,
        animation: 'ping 1.4s cubic-bezier(0,0,.2,1) infinite',
      }} />
      <span style={{ width: 8, height: 8, borderRadius: '50%', background: color, display: 'block' }} />
      <style>{`@keyframes ping{75%,100%{transform:scale(2);opacity:0}}`}</style>
    </span>
  )
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
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <h1 style={{ fontWeight: 900, fontSize: 28, color: '#fff', margin: 0, textTransform: 'uppercase' }}>
          Live Chat
        </h1>
        {queue.length > 0 && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: 6,
            background: 'rgba(232,0,13,.1)', border: '1px solid rgba(232,0,13,.3)',
            borderRadius: 20, padding: '4px 10px',
          }}>
            <PulseDot color="#e8000d" />
            <span style={{ fontSize: 11, fontWeight: 700, color: '#e8000d' }}>
              {queue.length} waiting
            </span>
          </div>
        )}
      </div>

      {/* Stats */}
      {stats && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 14 }}>
          <StatCard icon={Solar.hourglass} label="In Queue" value={stats.queueCount} color={stats.queueCount > 0 ? '#e8000d' : '#22c55e'} />
          <StatCard icon={Solar.chat} label="Active Chats" value={stats.activeCount} color="#3b82f6" />
        </div>
      )}

      {/* Main Layout */}
      <div style={{ display: 'grid', gridTemplateColumns: '380px 1fr', gap: 14, height: 'calc(100vh - 310px)', minHeight: 520 }}>

        {/* ── Left Panel ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, height: '100%', overflow: 'hidden' }}>

          {/* Queue */}
          <div style={{
            background: '#13131E', border: '1px solid rgba(255,255,255,.06)',
            borderRadius: 12, padding: 14, overflowY: 'auto', maxHeight: '45%', flexShrink: 0,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
              {queue.length > 0 && <PulseDot color="#e8000d" />}
              <span style={{ fontSize: 10, fontWeight: 800, color: queue.length > 0 ? '#e8000d' : '#4F5568', textTransform: 'uppercase', letterSpacing: 1 }}>
                Incoming Queue
              </span>
              {queue.length > 0 && (
                <span style={{
                  marginLeft: 'auto', fontSize: 10, fontWeight: 800, color: '#e8000d',
                  background: 'rgba(232,0,13,.12)', border: '1px solid rgba(232,0,13,.25)',
                  borderRadius: 10, padding: '1px 7px',
                }}>
                  {queue.length}
                </span>
              )}
            </div>

            {queue.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '20px 0' }}>
                <div style={{ fontSize: 26, marginBottom: 6 }}>✓</div>
                <div style={{ fontSize: 11, color: '#4F5568', fontWeight: 600 }}>No users waiting</div>
              </div>
            ) : queue.map(s => {
              const priority = PRIORITY_MAP[s.category] || PRIORITY_MAP.general
              const catColor = CATEGORY_COLORS[s.category] || '#8890A4'
              return (
                <div key={s.sessionId} style={{
                  padding: '14px 14px', borderRadius: 10, marginBottom: 8,
                  background: 'rgba(232,0,13,.04)',
                  border: '1px solid rgba(232,0,13,.18)',
                }}>
                  {/* Top row: avatar + name + badges */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                    <UserAvatar name={s.username} size={38} color={catColor} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 800, fontSize: 14, color: '#fff', lineHeight: 1.2, marginBottom: 3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {s.username}
                      </div>
                      <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
                        <span style={{
                          fontSize: 9, fontWeight: 800, color: priority.color, padding: '2px 6px',
                          background: `${priority.color}12`, border: `1px solid ${priority.color}44`,
                          borderRadius: 4, letterSpacing: .5,
                        }}>{priority.label}</span>
                        <span style={{
                          fontSize: 9, fontWeight: 700, color: catColor, padding: '2px 6px',
                          background: `${catColor}12`, border: `1px solid ${catColor}44`, borderRadius: 4,
                        }}>{CATEGORY_LABELS[s.category] || s.category}</span>
                      </div>
                    </div>
                    <div style={{ fontSize: 11, color: '#4F5568', whiteSpace: 'nowrap', flexShrink: 0 }}>
                      {timeAgo(s.createdAt)}
                    </div>
                  </div>

                  {/* Context label */}
                  {s.contextLabel && (
                    <div style={{
                      fontSize: 11, color: '#8890A4', marginBottom: 10,
                      padding: '5px 8px', borderRadius: 6,
                      background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.06)',
                    }}>
                      {s.contextLabel}
                    </div>
                  )}

                  {/* Claim button full width */}
                  <button
                    onClick={() => handleClaim(s.sessionId)}
                    style={{
                      width: '100%', padding: '9px 0', fontSize: 12, fontWeight: 800,
                      letterSpacing: 1, textTransform: 'uppercase',
                      background: 'rgba(34,197,94,.1)', border: '1px solid rgba(34,197,94,.4)',
                      borderRadius: 7, color: '#22c55e', cursor: 'pointer', transition: 'all .15s',
                    }}
                    onMouseEnter={e => { e.currentTarget.style.background = 'rgba(34,197,94,.2)' }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'rgba(34,197,94,.1)' }}
                  >
                    Claim Chat
                  </button>
                </div>
              )
            })}
          </div>

          {/* Active Chats */}
          <div style={{
            background: '#13131E', border: '1px solid rgba(255,255,255,.06)',
            borderRadius: 12, padding: 14, flex: 1, overflow: 'hidden',
            display: 'flex', flexDirection: 'column',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
              <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#3b82f6', display: 'inline-block', flexShrink: 0 }} />
              <span style={{ fontSize: 10, fontWeight: 800, color: '#3b82f6', textTransform: 'uppercase', letterSpacing: 1 }}>
                Active Chats
              </span>
              {active.length > 0 && (
                <span style={{
                  marginLeft: 'auto', fontSize: 10, fontWeight: 800, color: '#3b82f6',
                  background: 'rgba(59,130,246,.12)', border: '1px solid rgba(59,130,246,.25)',
                  borderRadius: 10, padding: '1px 7px',
                }}>
                  {active.length}
                </span>
              )}
            </div>

            <div style={{ flex: 1, overflowY: 'auto', minHeight: 0 }}>
            {active.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '20px 0' }}>
                <div style={{ fontSize: 26, marginBottom: 6 }}>💬</div>
                <div style={{ fontSize: 11, color: '#4F5568', fontWeight: 600 }}>No active chats</div>
              </div>
            ) : active.map(s => {
              const catColor = CATEGORY_COLORS[s.category] || '#8890A4'
              const isSelected = selected?.sessionId === s.sessionId
              const lastMsg = s.messages?.[s.messages.length - 1]
              return (
                <div key={s.sessionId} onClick={() => setSelected(s)} style={{
                  padding: '12px 14px', borderRadius: 10, cursor: 'pointer', marginBottom: 6,
                  background: isSelected ? 'rgba(59,130,246,.08)' : 'rgba(255,255,255,.03)',
                  border: isSelected ? '1px solid rgba(59,130,246,.35)' : '1px solid rgba(255,255,255,.05)',
                  transition: 'all .15s',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <UserAvatar name={s.username} size={34} color={isSelected ? '#3b82f6' : catColor} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
                        <span style={{ fontWeight: 700, fontSize: 13, color: '#DDE0EA', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {s.username}
                        </span>
                        <span style={{
                          fontSize: 9, fontWeight: 700, color: catColor, padding: '1px 6px',
                          background: `${catColor}12`, border: `1px solid ${catColor}33`, borderRadius: 3,
                          flexShrink: 0,
                        }}>{CATEGORY_LABELS[s.category] || s.category}</span>
                      </div>
                      {lastMsg ? (
                        <div style={{
                          fontSize: 11, color: '#6B7280', overflow: 'hidden',
                          textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                        }}>
                          <span style={{ color: lastMsg.isAdmin ? '#60A5FA' : '#9CA3AF', fontWeight: 600 }}>
                            {lastMsg.isAdmin ? 'You: ' : ''}
                          </span>
                          {lastMsg.text?.replace(/<[^>]*>/g, '') || ''}
                        </div>
                      ) : (
                        <div style={{ fontSize: 11, color: '#4F5568' }}>
                          {s.messages?.length || 0} messages · {timeAgo(s.claimedAt || s.createdAt)}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
            </div>
          </div>
        </div>

        {/* ── Right Panel: Chat ── */}
        <div style={{
          background: '#13131E', border: '1px solid rgba(255,255,255,.06)',
          borderRadius: 12, display: 'flex', flexDirection: 'column', overflow: 'hidden',
        }}>
          {!selected ? (
            <div style={{
              flex: 1, display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center', gap: 12, padding: 40,
            }}>
              <div style={{
                width: 64, height: 64, borderRadius: '50%',
                background: 'rgba(59,130,246,.08)', border: '1px solid rgba(59,130,246,.15)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28,
              }}>
                💬
              </div>
              <div style={{ fontSize: 15, fontWeight: 700, color: '#4F5568' }}>No chat selected</div>
              <div style={{ fontSize: 12, color: '#374151', textAlign: 'center', maxWidth: 260 }}>
                Claim a chat from the queue or pick an active session from the left panel.
              </div>
            </div>
          ) : (
            <>
              {/* Chat Header */}
              <div style={{
                padding: '14px 20px', borderBottom: '1px solid rgba(255,255,255,.06)',
                display: 'flex', alignItems: 'center', gap: 14,
              }}>
                <UserAvatar name={selected.username} size={40} color={CATEGORY_COLORS[selected.category] || '#8890A4'} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 800, fontSize: 16, color: '#fff', lineHeight: 1.2 }}>
                    {selected.username}
                  </div>
                  <div style={{ fontSize: 11, color: '#6B7280', marginTop: 2 }}>
                    {CATEGORY_LABELS[selected.category] || selected.category}
                    {selected.contextLabel ? ` · ${selected.contextLabel}` : ''}
                    {selected.userId ? ` · ID …${selected.userId?.toString?.()?.slice(-8) || ''}` : ''}
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 11, color: '#4F5568', whiteSpace: 'nowrap' }}>
                    {selected.messages?.length || 0} messages
                  </span>
                  <ActionBtn label="CLOSE CHAT" color="#e8000d" onClick={() => handleClose(selected.sessionId)} />
                </div>
              </div>

              {/* Messages */}
              <div style={{
                flex: 1, padding: '20px 20px', overflowY: 'auto',
                display: 'flex', flexDirection: 'column', gap: 12,
              }}>
                {(selected.messages || []).length === 0 && (
                  <div style={{ textAlign: 'center', color: '#4F5568', fontSize: 12, marginTop: 24 }}>
                    No messages yet — say hello!
                  </div>
                )}
                {(selected.messages || []).map((msg: any, i: number) => (
                  <div key={i} style={{
                    display: 'flex',
                    flexDirection: msg.isAdmin ? 'row-reverse' : 'row',
                    alignItems: 'flex-end', gap: 10,
                  }}>
                    {/* Avatar beside bubble */}
                    <UserAvatar
                      name={msg.senderName || (msg.isAdmin ? 'Staff' : '?')}
                      size={30}
                      color={msg.isAdmin ? '#3b82f6' : (CATEGORY_COLORS[selected.category] || '#8890A4')}
                    />
                    <div style={{
                      maxWidth: '72%', padding: '12px 16px', borderRadius: msg.isAdmin ? '14px 14px 4px 14px' : '14px 14px 14px 4px',
                      background: msg.isAdmin ? 'rgba(59,130,246,.12)' : 'rgba(255,255,255,.05)',
                      border: `1px solid ${msg.isAdmin ? 'rgba(59,130,246,.28)' : 'rgba(255,255,255,.08)'}`,
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                        <span style={{ fontSize: 12, color: msg.isAdmin ? '#60A5FA' : '#F39C12', fontWeight: 700 }}>
                          {msg.senderName}
                        </span>
                        {msg.isAdmin && (
                          <span style={{
                            fontSize: 9, fontWeight: 800, letterSpacing: .5, textTransform: 'uppercase',
                            background: 'rgba(59,130,246,.15)', border: '1px solid rgba(59,130,246,.3)',
                            color: '#60A5FA', padding: '1px 6px', borderRadius: 4,
                          }}>Staff</span>
                        )}
                      </div>
                      <RichContent text={msg.text} style={{ fontSize: 14, lineHeight: '1.6', color: '#DDE0EA' }} />
                      <div style={{ fontSize: 10, color: '#4F5568', marginTop: 6, textAlign: msg.isAdmin ? 'left' : 'right' }}>
                        {new Date(msg.sentAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                  </div>
                ))}
                <div ref={chatEndRef} />
              </div>

              {/* Input */}
              <div style={{
                padding: '14px 20px', borderTop: '1px solid rgba(255,255,255,.06)',
                display: 'flex', flexDirection: 'column', gap: 10,
                background: 'rgba(0,0,0,.15)',
              }}>
                <RichEditor
                  value={message}
                  onChange={setMessage}
                  onSubmit={handleSend}
                  placeholder="Type a message… (Shift+Enter for new line)"
                  minHeight={80}
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
