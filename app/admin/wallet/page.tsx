'use client'

import { useEffect, useState, useCallback } from 'react'
import { adminApi } from '@/lib/api'
import DataTable, { Column } from '../components/DataTable'
import SearchFilter from '../components/SearchFilter'
import ActionBtn from '../components/ActionBtn'
import Modal from '../components/Modal'
import StatCard from '../components/StatCard'
import { Solar } from '@/lib/solar-duotone'

type Tab = 'Overview' | 'Transactions' | 'Withdrawals' | 'Deposits' | 'Prize Claims'

const inputStyle: React.CSSProperties = {
  padding: '7px 12px', background: '#0d0d14', border: '1px solid rgba(255,255,255,.09)',
  borderRadius: 6, fontSize: 11, color: '#fff', outline: 'none', width: '100%',
}

export default function AdminWalletPage() {
  const [tab, setTab] = useState<Tab>('Overview')

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div>
        <h1 style={{ fontWeight: 900, fontSize: 28, color: '#fff', margin: 0, textTransform: 'uppercase' }}>
          Wallet & Transactions
        </h1>
      </div>
      <div style={{ display: 'flex', gap: 0, borderBottom: '1px solid rgba(255,255,255,.06)' }}>
        {(['Overview', 'Transactions', 'Withdrawals', 'Deposits', 'Prize Claims'] as Tab[]).map(t => (
          <button key={t} onClick={() => setTab(t)} style={{
            padding: '8px 16px', fontSize: 11, fontWeight: 700,
            background: 'transparent', border: 'none', cursor: 'pointer',
            color: tab === t ? '#fff' : '#4F5568', borderBottom: tab === t ? '2px solid #e8000d' : '2px solid transparent',
          }}>{t}</button>
        ))}
      </div>
      {tab === 'Overview' && <OverviewTab />}
      {tab === 'Transactions' && <TransactionsTab />}
      {tab === 'Withdrawals' && <WithdrawalsTab />}
      {tab === 'Deposits' && <DepositsTab />}
      {tab === 'Prize Claims' && <PrizeClaimsTab />}
    </div>
  )
}

function OverviewTab() {
  const [summary, setSummary] = useState<any>(null)
  useEffect(() => {
    adminApi.getWalletSummary().then(r => setSummary(r)).catch(() => {})
  }, [])

  if (!summary) return <div style={{ fontSize: 13, color: '#4F5568', padding: 40, textAlign: 'center' }}>Loading...</div>

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 14 }}>
      <StatCard icon={Solar.coin} label="Tickets in Circulation" value={summary.totalCredits?.toLocaleString()} />
      <StatCard icon={Solar.bill} label="Total Cash Held" value={`$${((summary.totalCash || 0) / 100).toFixed(2)}`} color="#22c55e" />
      <StatCard icon={Solar.hourglass} label="Pending Withdrawals" value={`$${((summary.pendingWithdrawals || 0) / 100).toFixed(2)}`} color="#f59e0b" sub={`${summary.pendingWithdrawalCount || 0} requests`} />
      <StatCard icon={Solar.upload} label="Lifetime Payouts" value={`$${((summary.lifetimePayouts || 0) / 100).toFixed(2)}`} />
      <StatCard icon={Solar.tickets} label="Pending Payout (Users)" value={`$${((summary.totalPending || 0) / 100).toFixed(2)}`} color="#8890A4" />
    </div>
  )
}

function TransactionsTab() {
  const [transactions, setTransactions] = useState<any[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [pages, setPages] = useState(1)
  const [loading, setLoading] = useState(true)
  const [type, setType] = useState('')
  const [currency, setCurrency] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const params: any = { page, limit: 25 }
      if (type) params.type = type
      if (currency) params.currency = currency
      const res = await adminApi.getTransactions(params)
      setTransactions(res.transactions)
      setTotal(res.total)
      setPages(res.pages)
    } catch { }
    setLoading(false)
  }, [page, type, currency])

  useEffect(() => { load() }, [load])

  const columns: Column[] = [
    { key: 'user', label: 'User', width: '1fr',
      render: (r: any) => <span style={{ fontWeight: 700 }}>{r.user?.username || '—'}</span>,
    },
    { key: 'type', label: 'Type', width: '110px',
      render: (r: any) => <span style={{ fontSize: 9, fontWeight: 700, color: '#8890A4' }}>{r.type}</span>,
    },
    { key: 'currency', label: 'Curr', width: '60px' },
    { key: 'amount', label: 'Amount', width: '90px',
      render: (r: any) => (
        <span style={{ fontWeight: 700, color: r.amount >= 0 ? '#22c55e' : '#e8000d' }}>
          {r.amount >= 0 ? '+' : ''}{r.currency === 'cash' ? `$${(r.amount / 100).toFixed(2)}` : r.amount.toLocaleString()}
        </span>
      ),
    },
    { key: 'description', label: 'Description', width: '2fr',
      render: (r: any) => <span style={{ color: '#4F5568', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'block' }}>{r.description}</span>,
    },
    { key: 'status', label: 'Status', width: '70px',
      render: (r: any) => <span style={{ fontSize: 9, fontWeight: 700, color: r.status === 'completed' ? '#22c55e' : r.status === 'pending' ? '#f59e0b' : '#e8000d' }}>{r.status}</span>,
    },
    { key: 'createdAt', label: 'Date', width: '90px',
      render: (r: any) => new Date(r.createdAt).toLocaleDateString(),
    },
  ]

  return (
    <div>
      <SearchFilter
        filters={[
          {
            value: type, onChange: v => { setType(v); setPage(1) }, placeholder: 'All Types',
            options: [
              { value: 'deposit', label: 'Deposit' }, { value: 'withdrawal', label: 'Withdrawal' },
              { value: 'match_win', label: 'Match Win' }, { value: 'match_loss', label: 'Match Loss' },
              { value: 'match_refund', label: 'Match Refund' }, { value: 'admin_adjustment', label: 'Admin Adjustment' },
              { value: 'credit_purchase', label: 'Credit Purchase' }, { value: 'store_purchase', label: 'Store Purchase' },
              { value: 'premium_purchase', label: 'Premium Purchase' },
            ],
          },
          {
            value: currency, onChange: v => { setCurrency(v); setPage(1) }, placeholder: 'All Currencies',
            options: [{ value: 'cash', label: 'Cash' }, { value: 'credits', label: 'Tickets' }],
          },
        ]}
      />
      {loading ? <div style={{ fontSize: 13, color: '#4F5568', padding: 40, textAlign: 'center' }}>Loading...</div> : (
        <DataTable columns={columns} rows={transactions} emptyText="No transactions" page={page} totalPages={pages} onPage={setPage} />
      )}
    </div>
  )
}

function WithdrawalsTab() {
  const [withdrawals, setWithdrawals] = useState<any[]>([])
  const [page, setPage]   = useState(1)
  const [pages, setPages] = useState(1)
  const [loading, setLoading] = useState(true)
  const [status, setStatus]   = useState('pending')
  const [viewModal,  setViewModal]  = useState<any>(null)
  const [denyReason, setDenyReason] = useState('')
  const [denyOpen,   setDenyOpen]   = useState(false)
  const [acting,     setActing]     = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await adminApi.getWithdrawals({ status, page, limit: 25 })
      setWithdrawals(res.withdrawals)
      setPages(res.pages)
    } catch { }
    setLoading(false)
  }, [page, status])

  useEffect(() => { load() }, [load])

  const openView  = (r: any) => { setViewModal(r); setDenyOpen(false); setDenyReason('') }
  const closeView = () => { setViewModal(null); setDenyOpen(false); setDenyReason('') }

  const handleApprove = async () => {
    if (!viewModal) return
    setActing(true)
    try { await adminApi.approveWithdrawal(viewModal._id); closeView(); load() } catch {}
    setActing(false)
  }

  const handleDeny = async () => {
    if (!viewModal) return
    setActing(true)
    try { await adminApi.denyWithdrawal(viewModal._id, { reason: denyReason }); closeView(); load() } catch {}
    setActing(false)
  }

  const columns: Column[] = [
    { key: 'user', label: 'User', width: '1fr',
      render: (r: any) => <span style={{ fontWeight: 700 }}>{r.user?.username || '—'}</span>,
    },
    { key: 'amount', label: 'Amount', width: '90px',
      render: (r: any) => <span style={{ fontWeight: 700, color: '#e8000d' }}>${(Math.abs(r.amount) / 100).toFixed(2)}</span>,
    },
    { key: 'method', label: 'Method', width: '2fr',
      render: (r: any) => <span style={{ color: '#8890A4', fontSize: 11 }}>{r.method || '—'}</span>,
    },
    { key: 'status', label: 'Status', width: '80px',
      render: (r: any) => (
        <span style={{ fontSize: 9, fontWeight: 700, color: r.status === 'completed' ? '#22c55e' : r.status === 'pending' ? '#f59e0b' : '#e8000d' }}>
          {r.status}
        </span>
      ),
    },
    { key: 'createdAt', label: 'Requested', width: '90px',
      render: (r: any) => new Date(r.createdAt).toLocaleDateString(),
    },
    { key: 'actions', label: '', width: '60px',
      render: (r: any) => <ActionBtn label="View" color="#60A5FA" onClick={() => openView(r)} />,
    },
  ]

  // Shared micro-label style used inside the modal
  const f = (label: string, value: React.ReactNode, mono = false) => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      <span style={{ fontSize: 9, color: '#4F5568', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.07em' }}>{label}</span>
      <span style={{ fontSize: 12, color: '#d1d5db', fontWeight: 600, fontFamily: mono ? 'monospace' : undefined, letterSpacing: mono ? '0.04em' : undefined }}>{value}</span>
    </div>
  )

  const W = viewModal
  const b = W?.withdrawalBankDetails
  const isPending = W?.status === 'pending'

  return (
    <div>
      <select value={status} onChange={e => { setStatus(e.target.value); setPage(1) }}
        style={{ ...inputStyle, width: 'auto', marginBottom: 12 }}>
        <option value="pending">Pending</option>
        <option value="completed">Completed</option>
        <option value="cancelled">Denied</option>
      </select>

      {loading
        ? <div style={{ fontSize: 13, color: '#4F5568', padding: 40, textAlign: 'center' }}>Loading...</div>
        : <DataTable columns={columns} rows={withdrawals} emptyText="No withdrawals" page={page} totalPages={pages} onPage={setPage} />
      }

      {W && (
        <Modal
          title={`$${(Math.abs(W.amount) / 100).toFixed(2)}`}
          subtitle={`${W.user?.username || '—'} · ${new Date(W.createdAt).toLocaleDateString()}`}
          onClose={closeView}
          width={520}
        >
          {/* Status + user row */}
          <div style={{ display: 'flex', gap: 20, marginBottom: 20, flexWrap: 'wrap' }}>
            {f('Status',
              <span style={{ color: W.status === 'completed' ? '#22c55e' : W.status === 'pending' ? '#f59e0b' : '#e8000d' }}>
                {W.status.charAt(0).toUpperCase() + W.status.slice(1)}
              </span>
            )}
            {f('Email', W.user?.email || '—')}
          </div>

          <div style={{ height: 1, background: 'rgba(255,255,255,0.06)', marginBottom: 20 }} />

          {/* PayPal */}
          {W.withdrawalPaypalEmail && (
            <div style={{ marginBottom: 20 }}>
              {f('Send to (PayPal)',
                <span style={{ color: '#93c5fd' }}>{W.withdrawalPaypalEmail}</span>
              )}
            </div>
          )}

          {/* Bank */}
          {b && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 20 }}>
              {f('Account holder', b.accountHolder || '—')}
              {f('Bank', b.bankName || '—')}
              {f('Routing', b.routingNumber || '—', true)}
              {f('Type', b.accountType ? b.accountType.charAt(0).toUpperCase() + b.accountType.slice(1) : '—')}
              <div style={{ gridColumn: '1 / -1' }}>
                {f('Account number', b.accountNumber || '—', true)}
              </div>
            </div>
          )}

          {/* Actions */}
          {isPending && (
            <>
              <div style={{ height: 1, background: 'rgba(255,255,255,0.06)', marginBottom: 16 }} />
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                <button
                  onClick={handleApprove}
                  disabled={acting}
                  style={{ flex: 1, padding: '9px 0', background: acting ? 'rgba(34,197,94,0.06)' : 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.3)', borderRadius: 6, color: '#22c55e', fontWeight: 700, fontSize: 12, cursor: acting ? 'not-allowed' : 'pointer', opacity: acting ? 0.6 : 1, letterSpacing: 0.3 }}>
                  {acting && !denyOpen ? 'Approving…' : 'Approve'}
                </button>
                <button
                  onClick={() => setDenyOpen(o => !o)}
                  style={{ padding: '9px 18px', background: 'transparent', border: '1px solid rgba(231,76,60,0.25)', borderRadius: 6, color: '#e8000d', fontWeight: 700, fontSize: 12, cursor: 'pointer', letterSpacing: 0.3 }}>
                  Deny
                </button>
              </div>

              {denyOpen && (
                <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <textarea
                    value={denyReason}
                    onChange={e => setDenyReason(e.target.value)}
                    style={{ ...inputStyle, minHeight: 56, resize: 'vertical', fontSize: 12 }}
                    placeholder="Reason (optional — shown to the user)"
                  />
                  <button
                    onClick={handleDeny}
                    disabled={acting}
                    style={{ padding: '8px 0', background: 'rgba(231,76,60,0.1)', border: '1px solid rgba(231,76,60,0.3)', borderRadius: 6, color: '#e8000d', fontWeight: 700, fontSize: 12, cursor: acting ? 'not-allowed' : 'pointer', opacity: acting ? 0.6 : 1 }}>
                    {acting ? 'Denying…' : 'Confirm denial & refund'}
                  </button>
                </div>
              )}
            </>
          )}
        </Modal>
      )}
    </div>
  )
}

function DepositsTab() {
  const [deposits, setDeposits] = useState<any[]>([])
  const [page, setPage] = useState(1)
  const [pages, setPages] = useState(1)
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await adminApi.getDeposits({ page, limit: 25 })
      setDeposits(res.deposits)
      setPages(res.pages)
    } catch { }
    setLoading(false)
  }, [page])

  useEffect(() => { load() }, [load])

  const columns: Column[] = [
    { key: 'user', label: 'User', width: '1fr', render: (r: any) => <span style={{ fontWeight: 700 }}>{r.user?.username || '—'}</span> },
    { key: 'amount', label: 'Amount', width: '90px', render: (r: any) => <span style={{ fontWeight: 700, color: '#22c55e' }}>${((r.amount || 0) / 100).toFixed(2)}</span> },
    { key: 'method', label: 'Method', width: '80px', render: (r: any) => <span style={{ color: '#8890A4' }}>{r.method || 'Stripe'}</span> },
    { key: 'status', label: 'Status', width: '80px', render: (r: any) => <span style={{ fontSize: 9, fontWeight: 700, color: r.status === 'completed' ? '#22c55e' : '#f59e0b' }}>{r.status}</span> },
    { key: 'createdAt', label: 'Date', width: '100px', render: (r: any) => new Date(r.createdAt).toLocaleDateString() },
  ]

  return loading ? (
    <div style={{ fontSize: 13, color: '#4F5568', padding: 40, textAlign: 'center' }}>Loading...</div>
  ) : (
    <DataTable columns={columns} rows={deposits} emptyText="No deposits" page={page} totalPages={pages} onPage={setPage} />
  )
}

function PrizeClaimsTab() {
  const [claims, setClaims] = useState<any[]>([])
  const [page, setPage] = useState(1)
  const [pages, setPages] = useState(1)
  const [loading, setLoading] = useState(true)
  const [status, setStatus] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const params: any = { page, limit: 25 }
      if (status) params.status = status
      const res = await adminApi.getPrizeClaims(params)
      setClaims(res.claims)
      setPages(res.pages)
    } catch { }
    setLoading(false)
  }, [page, status])

  useEffect(() => { load() }, [load])

  const columns: Column[] = [
    { key: 'user', label: 'User', width: '1fr', render: (r: any) => <span style={{ fontWeight: 700 }}>{r.user?.username || '—'}</span> },
    { key: 'tournamentName', label: 'Tournament', width: '1fr', render: (r: any) => <span style={{ color: '#8890A4' }}>{r.tournamentName}</span> },
    { key: 'placement', label: 'Place', width: '60px', render: (r: any) => <span style={{ fontWeight: 700, color: r.placement <= 3 ? '#f59e0b' : '#4F5568' }}>#{r.placement}</span> },
    { key: 'prizeAmount', label: 'Prize', width: '80px', render: (r: any) => <span style={{ fontWeight: 700, color: '#22c55e' }}>${((r.prizeAmount || 0) / 100).toFixed(2)}</span> },
    { key: 'status', label: 'Status', width: '80px', render: (r: any) => <span style={{ fontSize: 9, fontWeight: 700, color: r.status === 'claimed' ? '#22c55e' : r.status === 'ready' ? '#f59e0b' : '#e8000d' }}>{r.status?.toUpperCase()}</span> },
    { key: 'expiresAt', label: 'Expires', width: '100px', render: (r: any) => <span style={{ color: '#4F5568' }}>{r.expiresAt ? new Date(r.expiresAt).toLocaleDateString() : '—'}</span> },
  ]

  return (
    <div>
      <select value={status} onChange={e => { setStatus(e.target.value); setPage(1) }} style={{ padding: '7px 12px', background: '#0d0d14', border: '1px solid rgba(255,255,255,.09)', borderRadius: 6, fontSize: 11, color: '#8890A4', outline: 'none', marginBottom: 12 }}>
        <option value="">All Status</option>
        <option value="ready">Ready</option>
        <option value="claimed">Claimed</option>
        <option value="expired">Expired</option>
      </select>
      {loading ? (
        <div style={{ fontSize: 13, color: '#4F5568', padding: 40, textAlign: 'center' }}>Loading...</div>
      ) : (
        <DataTable columns={columns} rows={claims} emptyText="No prize claims" page={page} totalPages={pages} onPage={setPage} />
      )}
    </div>
  )
}
