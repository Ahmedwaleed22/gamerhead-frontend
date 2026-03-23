'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { adminApi } from '@/lib/api'
import DataTable, { Column } from '../components/DataTable'
import SearchFilter from '../components/SearchFilter'
import StatCard from '../components/StatCard'
import { Solar } from '@/lib/solar-duotone'
import ActionBtn from '../components/ActionBtn'

const R: React.CSSProperties = { fontFamily: 'Rajdhani, sans-serif' }

const STATUS_COLOR: Record<string, string> = {
  'Awaiting Claim': '#f59e0b',
  'Claimed': '#3b82f6',
  'Awaiting Reply': '#a78bfa',
  'Closed': '#22c55e',
}

function fmtTime(d: string | Date | undefined) {
  if (!d) return '—'
  return new Date(d).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true })
}

/** Derive display status from raw ticket data */
function getDisplayStatus(ticket: any): string {
  if (ticket.status === 'closed') return 'Closed'
  if (ticket.status === 'open') return 'Awaiting Claim'
  // status === 'claimed' — check last message to determine if awaiting reply
  const msgs = ticket.messages || []
  const lastNonSystem = [...msgs].reverse().find((m: any) => !m.isSystem)
  if (lastNonSystem && lastNonSystem.senderId?.toString() !== ticket.userId?.toString()) {
    return 'Awaiting Reply'
  }
  return 'Claimed'
}

// ─── TICKET DETAIL VIEW ──────────────────────────────────────────────────────

function TicketDetail({ ticketId, onBack, onRefresh }: { ticketId: string; onBack: () => void; onRefresh: () => void }) {
  const [ticket, setTicket] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [replyText, setReplyText] = useState('')
  const [sending, setSending] = useState(false)
  const [actionLoading, setActionLoading] = useState('')
  const chatEndRef = useRef<HTMLDivElement>(null)

  const fetchTicket = useCallback(async () => {
    try {
      const res = await adminApi.getTicket(ticketId)
      setTicket(res)
    } catch {}
    setLoading(false)
  }, [ticketId])

  useEffect(() => { fetchTicket() }, [fetchTicket])

  // Poll for new messages
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const res = await adminApi.getTicket(ticketId)
        setTicket(res)
      } catch {}
    }, 5000)
    return () => clearInterval(interval)
  }, [ticketId])

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [ticket?.messages?.length])

  const handleReply = async () => {
    if (!replyText.trim() || sending) return
    setSending(true)
    try {
      const updated = await adminApi.replyToTicket(ticketId, replyText.trim())
      setTicket(updated)
      setReplyText('')
      onRefresh()
    } catch {}
    setSending(false)
  }

  const handleClaim = async () => {
    setActionLoading('claim')
    try {
      const updated = await adminApi.claimTicket(ticketId)
      setTicket(updated)
      onRefresh()
    } catch {}
    setActionLoading('')
  }

  const handleClose = async () => {
    setActionLoading('close')
    try {
      const updated = await adminApi.closeTicket(ticketId)
      setTicket(updated)
      onRefresh()
    } catch {}
    setActionLoading('')
  }

  const handleReopen = async () => {
    setActionLoading('reopen')
    try {
      const updated = await adminApi.reopenTicket(ticketId)
      setTicket(updated)
      onRefresh()
    } catch {}
    setActionLoading('')
  }

  if (loading) {
    return <div style={{ ...R, fontSize: 13, color: '#4F5568', padding: 60, textAlign: 'center' }}>Loading ticket...</div>
  }

  if (!ticket) {
    return (
      <div style={{ textAlign: 'center', padding: 60 }}>
        <div style={{ ...R, fontSize: 14, color: '#E74C3C', marginBottom: 12 }}>Ticket not found</div>
        <button onClick={onBack} style={{ background: '#202028', border: '1px solid rgba(255,255,255,.08)', borderRadius: 8, padding: '8px 18px', ...R, fontWeight: 700, fontSize: 12, color: '#9CA3AF', cursor: 'pointer' }}>Back</button>
      </div>
    )
  }

  const isClosed = ticket.status === 'closed'
  const isOpen = ticket.status === 'open'
  const displayStatus = getDisplayStatus(ticket)
  const statusColor = STATUS_COLOR[displayStatus] || '#fff'
  const messages = ticket.messages || []

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        <button onClick={onBack} style={{ background: '#202028', border: '1px solid rgba(255,255,255,.08)', borderRadius: 8, padding: '8px 16px', ...R, fontWeight: 700, fontSize: 12, color: '#9CA3AF', cursor: 'pointer' }}>
          Back
        </button>
        <div style={{ flex: 1 }}>
          <h1 style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 900, fontSize: 24, color: '#fff', margin: 0 }}>
            {ticket.subject || 'Support Ticket'}
          </h1>
          <div style={{ ...R, fontSize: 12, color: '#4F5568', marginTop: 2 }}>
            {ticket.ticketId || ticket._id?.slice(-8)} · {ticket.username} · {ticket.department}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          {ticket.urgent && (
            <span style={{ background: 'rgba(232,0,13,.12)', border: '1px solid rgba(232,0,13,.3)', borderRadius: 6, padding: '5px 12px', ...R, fontWeight: 700, fontSize: 11, color: '#e8000d' }}>URGENT</span>
          )}
          <span style={{ background: statusColor + '22', border: `1px solid ${statusColor}44`, borderRadius: 6, padding: '5px 14px', ...R, fontWeight: 700, fontSize: 12, color: statusColor }}>
            {displayStatus}
          </span>
        </div>
      </div>

      {/* Info bar + actions */}
      <div style={{ display: 'flex', gap: 14, alignItems: 'stretch' }}>
        {/* Ticket info */}
        <div style={{ flex: 1, background: '#18181C', borderRadius: 10, padding: '16px 20px', display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 14 }}>
          {[
            ['Department', ticket.department || '—'],
            ['Staff Claimed', ticket.claimedByName || '—'],
            ['Ticket Created', fmtTime(ticket.createdAt)],
            ['Ticket Closed', ticket.closedAt ? fmtTime(ticket.closedAt) : '—'],
          ].map(([k, v]) => (
            <div key={k as string}>
              <div style={{ ...R, fontSize: 10, fontWeight: 700, color: '#4F5568', textTransform: 'uppercase', letterSpacing: .5, marginBottom: 4 }}>{k as string}</div>
              <div style={{ ...R, fontSize: 13, fontWeight: 700, color: '#DDE0EA' }}>{v as string}</div>
            </div>
          ))}
        </div>

        {/* Action buttons */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, minWidth: 140 }}>
          {isOpen && (
            <button onClick={handleClaim} disabled={!!actionLoading} style={{ background: '#3b82f6', border: 'none', borderRadius: 8, padding: '10px 0', ...R, fontWeight: 700, fontSize: 12, color: '#fff', cursor: actionLoading ? 'wait' : 'pointer', opacity: actionLoading ? .6 : 1 }}>
              {actionLoading === 'claim' ? 'Claiming...' : 'Claim Ticket'}
            </button>
          )}
          {!isClosed && (
            <button onClick={handleClose} disabled={!!actionLoading} style={{ background: '#202028', border: '1px solid rgba(255,255,255,.08)', borderRadius: 8, padding: '10px 0', ...R, fontWeight: 700, fontSize: 12, color: '#22c55e', cursor: actionLoading ? 'wait' : 'pointer', opacity: actionLoading ? .6 : 1 }}>
              {actionLoading === 'close' ? 'Closing...' : 'Close Ticket'}
            </button>
          )}
          {isClosed && (
            <button onClick={handleReopen} disabled={!!actionLoading} style={{ background: '#202028', border: '1px solid rgba(255,255,255,.08)', borderRadius: 8, padding: '10px 0', ...R, fontWeight: 700, fontSize: 12, color: '#f59e0b', cursor: actionLoading ? 'wait' : 'pointer', opacity: actionLoading ? .6 : 1 }}>
              {actionLoading === 'reopen' ? 'Reopening...' : 'Reopen Ticket'}
            </button>
          )}
        </div>
      </div>

      {/* Chat / Messages */}
      <div style={{ background: '#18181C', borderRadius: 12, overflow: 'hidden', display: 'flex', flexDirection: 'column', minHeight: 400, maxHeight: 'calc(100vh - 380px)' }}>
        {/* Messages area */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 12 }}>
          {messages.map((msg: any, i: number) => {
            const isSystem = msg.isSystem
            const isStaff = !isSystem && msg.senderId?.toString() !== ticket.userId?.toString()

            if (isSystem) {
              return (
                <div key={i} style={{ display: 'flex', justifyContent: 'center' }}>
                  <div style={{ background: 'rgba(139,92,246,.08)', border: '1px solid rgba(139,92,246,.2)', borderRadius: 10, padding: '12px 20px', maxWidth: '80%' }}>
                    <div style={{ ...R, fontSize: 12, color: '#a78bfa', whiteSpace: 'pre-line', lineHeight: 1.6 }}>{msg.text}</div>
                    <div style={{ ...R, fontSize: 10, color: '#4F5568', marginTop: 6, textAlign: 'center' }}>{fmtTime(msg.sentAt)}</div>
                  </div>
                </div>
              )
            }

            return (
              <div key={i} style={{ display: 'flex', justifyContent: isStaff ? 'flex-end' : 'flex-start' }}>
                <div style={{ display: 'flex', flexDirection: isStaff ? 'row-reverse' : 'row', alignItems: 'flex-start', gap: 10, maxWidth: '75%' }}>
                  {/* Avatar */}
                  <div style={{
                    width: 34, height: 34, borderRadius: isStaff ? '50%' : 8, flexShrink: 0,
                    background: isStaff ? 'rgba(59,130,246,.15)' : 'rgba(245,158,11,.1)',
                    border: `1.5px solid ${isStaff ? '#3b82f644' : '#f59e0b44'}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    ...R, fontWeight: 900, fontSize: 12, color: isStaff ? '#3b82f6' : '#f59e0b',
                  }}>
                    {msg.initials || msg.senderName?.slice(0, 2).toUpperCase() || '??'}
                  </div>
                  {/* Bubble */}
                  <div style={{
                    background: isStaff ? 'rgba(59,130,246,.08)' : 'rgba(255,255,255,.03)',
                    border: `1px solid ${isStaff ? 'rgba(59,130,246,.2)' : 'rgba(255,255,255,.06)'}`,
                    borderRadius: isStaff ? '12px 12px 4px 12px' : '12px 12px 12px 4px',
                    padding: '10px 16px',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                      <span style={{ ...R, fontSize: 12, fontWeight: 700, color: isStaff ? '#3b82f6' : '#f59e0b' }}>
                        {msg.senderName || 'Unknown'}
                      </span>
                      {isStaff && <span style={{ ...R, fontSize: 9, fontWeight: 700, color: '#3b82f6', background: 'rgba(59,130,246,.12)', padding: '1px 6px', borderRadius: 4, textTransform: 'uppercase', letterSpacing: .5 }}>Staff</span>}
                      <span style={{ ...R, fontSize: 10, color: '#4F5568' }}>{fmtTime(msg.sentAt)}</span>
                    </div>
                    <div style={{ ...R, fontSize: 13, color: '#DDE0EA', lineHeight: 1.55, whiteSpace: 'pre-wrap' }}>{msg.text}</div>
                  </div>
                </div>
              </div>
            )
          })}
          <div ref={chatEndRef} />
        </div>

        {/* Reply input */}
        {!isClosed ? (
          <div style={{ borderTop: '1px solid #25252C', padding: '16px 24px', display: 'flex', gap: 10 }}>
            <input
              style={{ flex: 1, background: '#0d0d14', border: '1px solid rgba(255,255,255,.1)', borderRadius: 10, padding: '12px 16px', ...R, fontSize: 13, color: '#fff', outline: 'none' }}
              placeholder="Type a reply to the user..."
              value={replyText}
              onChange={e => setReplyText(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleReply()}
            />
            <button onClick={handleReply} disabled={sending || !replyText.trim()} style={{ background: '#3b82f6', border: 'none', borderRadius: 10, padding: '12px 24px', ...R, fontWeight: 700, fontSize: 13, color: '#fff', cursor: sending ? 'wait' : 'pointer', opacity: !replyText.trim() ? .5 : 1 }}>
              {sending ? '...' : 'Send'}
            </button>
          </div>
        ) : (
          <div style={{ borderTop: '1px solid #25252C', padding: '16px 24px', textAlign: 'center' }}>
            <span style={{ ...R, fontSize: 13, color: '#22c55e', fontWeight: 700 }}>This ticket has been closed</span>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── MAIN PAGE ───────────────────────────────────────────────────────────────

export default function AdminSupportPage() {
  const [tickets, setTickets] = useState<any[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [pages, setPages] = useState(1)
  const [loading, setLoading] = useState(true)
  const [status, setStatus] = useState('')
  const [stats, setStats] = useState<any>(null)
  const [viewingTicketId, setViewingTicketId] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const params: any = { page, limit: 25 }
      if (status) params.status = status
      const [res, statsRes] = await Promise.all([
        adminApi.getAllTickets(params),
        adminApi.getTicketStats(),
      ])
      setTickets(res.tickets)
      setTotal(res.total)
      setPages(res.pages)
      setStats(statsRes)
    } catch { }
    setLoading(false)
  }, [page, status])

  useEffect(() => { load() }, [load])

  // If viewing a specific ticket, show the detail view
  if (viewingTicketId) {
    return (
      <TicketDetail
        ticketId={viewingTicketId}
        onBack={() => { setViewingTicketId(null); load() }}
        onRefresh={load}
      />
    )
  }

  const columns: Column[] = [
    { key: 'ticketId', label: 'Ticket ID', width: '100px',
      render: (r: any) => <span style={{ fontWeight: 700, color: '#3b82f6', fontSize: 11, cursor: 'pointer' }} onClick={() => setViewingTicketId(r._id)}>{r.ticketId || r._id?.slice(-8)}</span>,
    },
    { key: 'username', label: 'User', width: '1fr', render: (r: any) => <span style={{ fontWeight: 700 }}>{r.username || '—'}</span> },
    { key: 'subject', label: 'Subject', width: '2fr',
      render: (r: any) => <span style={{ color: '#DDE0EA', cursor: 'pointer' }} onClick={() => setViewingTicketId(r._id)}>{r.subject}</span>,
    },
    { key: 'department', label: 'Dept', width: '100px',
      render: (r: any) => <span style={{ background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.06)', borderRadius: 4, padding: '2px 8px', fontSize: 10 }}>{r.department}</span>,
    },
    { key: 'claimedByName', label: 'Staff Claimed', width: '100px',
      render: (r: any) => <span style={{ fontWeight: 600, color: r.claimedByName ? '#3b82f6' : '#4F5568' }}>{r.claimedByName || '—'}</span>,
    },
    { key: 'urgent', label: 'Urgent', width: '60px', render: (r: any) => r.urgent ? <span style={{ color: '#e8000d', fontWeight: 700, fontSize: 10 }}>YES</span> : <span style={{ color: '#4F5568' }}>—</span> },
    { key: 'status', label: 'Status', width: '110px',
      render: (r: any) => {
        const ds = getDisplayStatus(r)
        const c = STATUS_COLOR[ds] || '#fff'
        return <span style={{ fontSize: 10, fontWeight: 700, color: c }}>{ds}</span>
      },
    },
    { key: 'createdAt', label: 'Ticket Created', width: '140px', render: (r: any) => <span style={{ fontSize: 11 }}>{fmtTime(r.createdAt)}</span> },
    { key: 'closedAt', label: 'Ticket Closed', width: '140px', render: (r: any) => <span style={{ fontSize: 11, color: r.closedAt ? '#22c55e' : '#4F5568' }}>{r.closedAt ? fmtTime(r.closedAt) : '—'}</span> },
    { key: 'actions', label: '', width: '60px',
      render: (r: any) => <ActionBtn label="VIEW" color="#3b82f6" onClick={() => setViewingTicketId(r._id)} />,
    },
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <h1 style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 900, fontSize: 28, color: '#fff', margin: 0, textTransform: 'uppercase' }}>
        Ticket Center
      </h1>

      {stats && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14 }}>
          <StatCard icon={Solar.clipboard} label="Open" value={stats.open} color={stats.open > 0 ? '#f59e0b' : '#22c55e'} />
          <StatCard icon={Solar.user} label="Claimed" value={stats.claimed} color="#3b82f6" />
          <StatCard icon={Solar.check} label="Closed" value={stats.closed} />
        </div>
      )}

      <SearchFilter
        filters={[{
          value: status, onChange: v => { setStatus(v); setPage(1) }, placeholder: 'All Status',
          options: [{ value: 'open', label: 'Awaiting Claim' }, { value: 'claimed', label: 'Claimed' }, { value: 'closed', label: 'Closed' }],
        }]}
      />

      {loading ? (
        <div style={{ ...R, fontSize: 13, color: '#4F5568', padding: 40, textAlign: 'center' }}>Loading...</div>
      ) : (
        <DataTable columns={columns} rows={tickets} emptyText="No tickets" page={page} totalPages={pages} onPage={setPage} />
      )}
    </div>
  )
}
