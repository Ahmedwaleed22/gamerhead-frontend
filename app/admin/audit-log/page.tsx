'use client'

import { useEffect, useState, useCallback } from 'react'
import { adminApi } from '@/lib/api'
import DataTable, { Column } from '../components/DataTable'
import SearchFilter from '../components/SearchFilter'

const ACTION_COLORS: Record<string, string> = {
  ban_user: '#e8000d', unban_user: '#22c55e', wallet_adjust: '#f59e0b', resolve_dispute: '#3b82f6',
  cancel_match: '#e8000d', set_role: '#a855f7', approve_withdrawal: '#22c55e', deny_withdrawal: '#e8000d',
}

export default function AdminAuditLogPage() {
  const [logs, setLogs] = useState<any[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [pages, setPages] = useState(1)
  const [loading, setLoading] = useState(true)
  const [action, setAction] = useState('')
  const [targetType, setTargetType] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const params: any = { page, limit: 25 }
      if (action) params.action = action
      if (targetType) params.targetType = targetType
      const res = await adminApi.getAuditLog(params)
      setLogs(res.logs)
      setTotal(res.total)
      setPages(res.pages)
    } catch { }
    setLoading(false)
  }, [page, action, targetType])

  useEffect(() => { load() }, [load])

  const columns: Column[] = [
    { key: 'createdAt', label: 'Time', width: '130px',
      render: (r: any) => <span style={{ color: '#4F5568' }}>{new Date(r.createdAt).toLocaleString()}</span>,
    },
    { key: 'adminName', label: 'Admin', width: '100px',
      render: (r: any) => <span style={{ fontWeight: 700, color: '#a855f7' }}>{r.adminName}</span>,
    },
    { key: 'action', label: 'Action', width: '140px',
      render: (r: any) => <span style={{ fontSize: 9, fontWeight: 700, color: ACTION_COLORS[r.action] || '#8890A4' }}>{r.action}</span>,
    },
    { key: 'targetType', label: 'Target', width: '90px',
      render: (r: any) => <span style={{ color: '#4F5568' }}>{r.targetType}</span>,
    },
    { key: 'targetId', label: 'Target ID', width: '120px',
      render: (r: any) => <span style={{ fontSize: 9, color: '#8890A4', fontFamily: 'monospace' }}>{r.targetId?.slice(-12)}</span>,
    },
    { key: 'details', label: 'Details', width: '2fr',
      render: (r: any) => {
        const details = r.details || {}
        const summary = Object.entries(details).map(([k, v]) => `${k}: ${v}`).join(', ')
        return <span style={{ color: '#4F5568', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'block', fontSize: 9 }}>{summary || '—'}</span>
      },
    },
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div>
        <h1 style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 900, fontSize: 28, color: '#fff', margin: 0, textTransform: 'uppercase' }}>Audit Log</h1>
        <p style={{ fontFamily: 'Rajdhani, sans-serif', fontSize: 12, color: '#4F5568', margin: '4px 0 0' }}>
          {total.toLocaleString()} total entries
        </p>
      </div>

      <SearchFilter
        filters={[
          {
            value: action, onChange: v => { setAction(v); setPage(1) }, placeholder: 'All Actions',
            options: [
              { value: 'ban_user', label: 'Ban User' }, { value: 'unban_user', label: 'Unban User' },
              { value: 'wallet_adjust', label: 'Wallet Adjust' }, { value: 'set_role', label: 'Set Role' },
              { value: 'resolve_dispute', label: 'Resolve Dispute' }, { value: 'cancel_match', label: 'Cancel Match' },
              { value: 'approve_withdrawal', label: 'Approve Withdrawal' }, { value: 'deny_withdrawal', label: 'Deny Withdrawal' },
              { value: 'create_store_item', label: 'Create Store Item' }, { value: 'grant_premium', label: 'Grant Premium' },
              { value: 'create_announcement', label: 'Create Announcement' },
            ],
          },
          {
            value: targetType, onChange: v => { setTargetType(v); setPage(1) }, placeholder: 'All Targets',
            options: [
              { value: 'user', label: 'User' }, { value: 'match', label: 'Match' },
              { value: 'team', label: 'Team' }, { value: 'store_item', label: 'Store' },
              { value: 'transaction', label: 'Transaction' }, { value: 'coach', label: 'Coach' },
              { value: 'badge', label: 'Badge' }, { value: 'game', label: 'Game' },
              { value: 'ladder', label: 'Ladder' }, { value: 'announcement', label: 'Announcement' },
            ],
          },
        ]}
      />

      {loading ? (
        <div style={{ fontFamily: 'Rajdhani, sans-serif', fontSize: 13, color: '#4F5568', padding: 40, textAlign: 'center' }}>Loading...</div>
      ) : (
        <DataTable columns={columns} rows={logs} emptyText="No audit log entries" page={page} totalPages={pages} onPage={setPage} />
      )}
    </div>
  )
}
