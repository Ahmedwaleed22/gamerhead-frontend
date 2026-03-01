'use client'

import { useEffect, useState, useCallback } from 'react'
import { adminApi } from '@/lib/api'
import DataTable, { Column } from '../components/DataTable'
import SearchFilter from '../components/SearchFilter'
import StatCard from '../components/StatCard'
import Modal from '../components/Modal'
import ActionBtn from '../components/ActionBtn'

export default function AdminSupportPage() {
  const [tickets, setTickets] = useState<any[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [pages, setPages] = useState(1)
  const [loading, setLoading] = useState(true)
  const [status, setStatus] = useState('')
  const [stats, setStats] = useState<any>(null)
  const [detailModal, setDetailModal] = useState<any>(null)
  const [detailLoading, setDetailLoading] = useState(false)

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

  const viewTicket = async (id: string) => {
    setDetailLoading(true)
    setDetailModal(null)
    try {
      const res = await adminApi.getTicket(id)
      setDetailModal(res)
    } catch {
      // Fallback: show basic info from the row
      const ticket = tickets.find(t => t._id === id)
      if (ticket) setDetailModal({ ...ticket, messages: [] })
    }
    setDetailLoading(false)
  }

  const columns: Column[] = [
    { key: '_id', label: 'Ticket', width: '100px',
      render: (r: any) => <span style={{ fontWeight: 700, color: '#3b82f6', fontSize: 9, cursor: 'pointer' }} onClick={() => viewTicket(r._id)}>{r._id?.slice(-8)}</span>,
    },
    { key: 'username', label: 'User', width: '1fr', render: (r: any) => <span style={{ fontWeight: 700 }}>{r.username || r.userId}</span> },
    { key: 'subject', label: 'Subject', width: '2fr',
      render: (r: any) => <span style={{ color: '#DDE0EA', cursor: 'pointer' }} onClick={() => viewTicket(r._id)}>{r.subject}</span>,
    },
    { key: 'department', label: 'Dept', width: '80px' },
    { key: 'urgent', label: 'Urgent', width: '60px', render: (r: any) => r.urgent ? <span style={{ color: '#e8000d', fontWeight: 700, fontSize: 9 }}>YES</span> : '—' },
    { key: 'status', label: 'Status', width: '80px',
      render: (r: any) => <span style={{ fontSize: 9, fontWeight: 700, color: r.status === 'open' ? '#f59e0b' : r.status === 'claimed' ? '#3b82f6' : '#22c55e' }}>{r.status?.toUpperCase()}</span>,
    },
    { key: 'createdAt', label: 'Created', width: '90px', render: (r: any) => new Date(r.createdAt).toLocaleDateString() },
    { key: 'actions', label: '', width: '60px',
      render: (r: any) => <ActionBtn label="VIEW" color="#3b82f6" onClick={() => viewTicket(r._id)} />,
    },
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <h1 style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 900, fontSize: 28, color: '#fff', margin: 0, textTransform: 'uppercase' }}>
        Ticket Center
      </h1>

      {stats && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14 }}>
          <StatCard icon="📋" label="Open" value={stats.open} color={stats.open > 0 ? '#f59e0b' : '#22c55e'} />
          <StatCard icon="👤" label="Claimed" value={stats.claimed} color="#3b82f6" />
          <StatCard icon="✅" label="Closed" value={stats.closed} />
        </div>
      )}

      <SearchFilter
        filters={[{
          value: status, onChange: v => { setStatus(v); setPage(1) }, placeholder: 'All Status',
          options: [{ value: 'open', label: 'Open' }, { value: 'claimed', label: 'Claimed' }, { value: 'closed', label: 'Closed' }],
        }]}
      />

      {loading ? (
        <div style={{ fontFamily: 'Rajdhani, sans-serif', fontSize: 13, color: '#4F5568', padding: 40, textAlign: 'center' }}>Loading...</div>
      ) : (
        <DataTable columns={columns} rows={tickets} emptyText="No tickets" page={page} totalPages={pages} onPage={setPage} />
      )}

      {/* Ticket Detail Modal */}
      {(detailModal || detailLoading) && (
        <Modal
          title={detailModal ? `Ticket: ${detailModal.subject || detailModal._id?.slice(-8)}` : 'Loading Ticket...'}
          subtitle={detailModal ? `${detailModal.username || detailModal.userId || ''} · ${detailModal.department || ''} · ${detailModal.status?.toUpperCase() || ''}` : ''}
          onClose={() => { setDetailModal(null); setDetailLoading(false) }}
          width={600}
        >
          {detailLoading ? (
            <div style={{ fontFamily: 'Rajdhani, sans-serif', fontSize: 13, color: '#4F5568', padding: 30, textAlign: 'center' }}>Loading ticket details...</div>
          ) : detailModal && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, fontFamily: 'Rajdhani, sans-serif' }}>
              {/* Ticket Info */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, fontSize: 11 }}>
                {[
                  ['Status', detailModal.status?.toUpperCase()],
                  ['Department', detailModal.department || '—'],
                  ['Urgent', detailModal.urgent ? 'Yes' : 'No'],
                  ['Created', detailModal.createdAt ? new Date(detailModal.createdAt).toLocaleString() : '—'],
                  ['Assigned To', detailModal.assignedTo || detailModal.claimedBy || '—'],
                  ['Closed At', detailModal.closedAt ? new Date(detailModal.closedAt).toLocaleString() : '—'],
                ].map(([k, v]) => (
                  <div key={k as string} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', borderBottom: '1px solid rgba(255,255,255,.04)' }}>
                    <span style={{ color: '#4F5568', fontWeight: 700 }}>{k}</span>
                    <span style={{ color: '#DDE0EA', fontWeight: 700 }}>{String(v)}</span>
                  </div>
                ))}
              </div>

              {/* Messages / Chat History */}
              <div>
                <div style={{ fontSize: 10, fontWeight: 800, color: '#4F5568', textTransform: 'uppercase', letterSpacing: .6, marginBottom: 6 }}>
                  Messages ({(detailModal.messages || []).length})
                </div>
                <div style={{ maxHeight: 350, overflowY: 'auto', background: '#0d0d14', borderRadius: 8, padding: 10 }}>
                  {(detailModal.messages || []).length === 0 ? (
                    <div style={{ fontSize: 11, color: '#4F5568', textAlign: 'center', padding: 20 }}>No messages</div>
                  ) : (
                    (detailModal.messages || []).map((msg: any, i: number) => (
                      <div key={i} style={{
                        padding: '8px 10px', marginBottom: 6,
                        background: msg.sender === 'admin' || msg.sender === 'staff' || msg.isStaff ? 'rgba(59,130,246,.08)' : 'rgba(255,255,255,.03)',
                        borderRadius: 6, border: `1px solid ${msg.sender === 'admin' || msg.sender === 'staff' || msg.isStaff ? 'rgba(59,130,246,.15)' : 'rgba(255,255,255,.04)'}`,
                      }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                          <span style={{
                            fontSize: 10, fontWeight: 700,
                            color: msg.sender === 'admin' || msg.sender === 'staff' || msg.isStaff ? '#3b82f6' : '#f59e0b',
                          }}>
                            {msg.senderName || msg.username || msg.sender || 'User'}
                            {(msg.sender === 'admin' || msg.sender === 'staff' || msg.isStaff) && ' (Staff)'}
                          </span>
                          <span style={{ fontSize: 9, color: '#4F5568' }}>
                            {msg.createdAt ? new Date(msg.createdAt).toLocaleString() : ''}
                          </span>
                        </div>
                        <div style={{ fontSize: 11, color: '#DDE0EA', lineHeight: 1.5, whiteSpace: 'pre-wrap' }}>
                          {msg.text || msg.message || msg.content || ''}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}
        </Modal>
      )}
    </div>
  )
}
