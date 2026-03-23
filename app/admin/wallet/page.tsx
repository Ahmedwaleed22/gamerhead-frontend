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
  borderRadius: 6, fontSize: 11, color: '#fff', fontFamily: 'Rajdhani, sans-serif', outline: 'none', width: '100%',
}

export default function AdminWalletPage() {
  const [tab, setTab] = useState<Tab>('Overview')

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div>
        <h1 style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 900, fontSize: 28, color: '#fff', margin: 0, textTransform: 'uppercase' }}>
          Wallet & Transactions
        </h1>
      </div>
      <div style={{ display: 'flex', gap: 0, borderBottom: '1px solid rgba(255,255,255,.06)' }}>
        {(['Overview', 'Transactions', 'Withdrawals', 'Deposits', 'Prize Claims'] as Tab[]).map(t => (
          <button key={t} onClick={() => setTab(t)} style={{
            padding: '8px 16px', fontSize: 11, fontWeight: 700, fontFamily: 'Rajdhani, sans-serif',
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

  if (!summary) return <div style={{ fontFamily: 'Rajdhani, sans-serif', fontSize: 13, color: '#4F5568', padding: 40, textAlign: 'center' }}>Loading...</div>

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14 }}>
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
      {loading ? <div style={{ fontFamily: 'Rajdhani, sans-serif', fontSize: 13, color: '#4F5568', padding: 40, textAlign: 'center' }}>Loading...</div> : (
        <DataTable columns={columns} rows={transactions} emptyText="No transactions" page={page} totalPages={pages} onPage={setPage} />
      )}
    </div>
  )
}

function WithdrawalsTab() {
  const [withdrawals, setWithdrawals] = useState<any[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [pages, setPages] = useState(1)
  const [loading, setLoading] = useState(true)
  const [status, setStatus] = useState('pending')
  const [denyModal, setDenyModal] = useState<any>(null)
  const [denyReason, setDenyReason] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await adminApi.getWithdrawals({ status, page, limit: 25 })
      setWithdrawals(res.withdrawals)
      setTotal(res.total)
      setPages(res.pages)
    } catch { }
    setLoading(false)
  }, [page, status])

  useEffect(() => { load() }, [load])

  const handleApprove = async (id: string) => {
    try { await adminApi.approveWithdrawal(id); load() } catch { }
  }

  const handleDeny = async () => {
    if (!denyModal) return
    try {
      await adminApi.denyWithdrawal(denyModal._id, { reason: denyReason })
      setDenyModal(null)
      setDenyReason('')
      load()
    } catch { }
  }

  const columns: Column[] = [
    { key: 'user', label: 'User', width: '1fr',
      render: (r: any) => <span style={{ fontWeight: 700 }}>{r.user?.username || '—'}</span>,
    },
    { key: 'amount', label: 'Amount', width: '90px',
      render: (r: any) => <span style={{ fontWeight: 700, color: '#e8000d' }}>${(Math.abs(r.amount) / 100).toFixed(2)}</span>,
    },
    { key: 'method', label: 'Method', width: '80px' },
    { key: 'status', label: 'Status', width: '80px',
      render: (r: any) => <span style={{ fontSize: 9, fontWeight: 700, color: r.status === 'completed' ? '#22c55e' : r.status === 'pending' ? '#f59e0b' : '#e8000d' }}>{r.status}</span>,
    },
    { key: 'createdAt', label: 'Requested', width: '100px',
      render: (r: any) => new Date(r.createdAt).toLocaleDateString(),
    },
    { key: 'actions', label: 'Actions', width: '140px',
      render: (r: any) => r.status === 'pending' ? (
        <div style={{ display: 'flex', gap: 4 }}>
          <ActionBtn label="APPROVE" color="#22c55e" onClick={() => handleApprove(r._id)} />
          <ActionBtn label="DENY" color="#e8000d" onClick={() => setDenyModal(r)} />
        </div>
      ) : null,
    },
  ]

  return (
    <div>
      <select value={status} onChange={e => { setStatus(e.target.value); setPage(1) }} style={{ ...inputStyle, width: 'auto', marginBottom: 12 }}>
        <option value="pending">Pending</option>
        <option value="completed">Completed</option>
        <option value="cancelled">Denied</option>
      </select>
      {loading ? <div style={{ fontFamily: 'Rajdhani, sans-serif', fontSize: 13, color: '#4F5568', padding: 40, textAlign: 'center' }}>Loading...</div> : (
        <DataTable columns={columns} rows={withdrawals} emptyText="No withdrawals" page={page} totalPages={pages} onPage={setPage} />
      )}
      {denyModal && (
        <Modal title="Deny Withdrawal" subtitle={`$${(Math.abs(denyModal.amount) / 100).toFixed(2)} → ${denyModal.user?.username}`} onClose={() => setDenyModal(null)}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ fontSize: 10, color: '#f59e0b', fontFamily: 'Rajdhani, sans-serif' }}>Amount will be refunded to user's cash balance.</div>
            <textarea value={denyReason} onChange={e => setDenyReason(e.target.value)} style={{ ...inputStyle, minHeight: 60, resize: 'vertical' }} placeholder="Reason for denial..." />
            <ActionBtn label="DENY & REFUND" color="#e8000d" onClick={handleDeny} />
          </div>
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
    <div style={{ fontFamily: 'Rajdhani, sans-serif', fontSize: 13, color: '#4F5568', padding: 40, textAlign: 'center' }}>Loading...</div>
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
      <select value={status} onChange={e => { setStatus(e.target.value); setPage(1) }} style={{ padding: '7px 12px', background: '#0d0d14', border: '1px solid rgba(255,255,255,.09)', borderRadius: 6, fontSize: 11, color: '#8890A4', fontFamily: 'Rajdhani, sans-serif', outline: 'none', marginBottom: 12 }}>
        <option value="">All Status</option>
        <option value="ready">Ready</option>
        <option value="claimed">Claimed</option>
        <option value="expired">Expired</option>
      </select>
      {loading ? (
        <div style={{ fontFamily: 'Rajdhani, sans-serif', fontSize: 13, color: '#4F5568', padding: 40, textAlign: 'center' }}>Loading...</div>
      ) : (
        <DataTable columns={columns} rows={claims} emptyText="No prize claims" page={page} totalPages={pages} onPage={setPage} />
      )}
    </div>
  )
}
