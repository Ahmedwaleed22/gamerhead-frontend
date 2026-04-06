'use client'

import { useEffect, useState, useCallback } from 'react'
import { adminApi } from '@/lib/api'
import DataTable, { Column } from '../components/DataTable'
import SearchFilter from '../components/SearchFilter'
import ActionBtn from '../components/ActionBtn'
import Link from 'next/link'

interface UserRow {
  _id: string
  username: string
  displayName: string
  usernameColor: string
  slug: string
  email: string
  avatarUrl: string
  role: string
  level: number
  credits: number
  cashBalance: number
  reputation: number
  isBanned: boolean
  isPremium: boolean
  isCoach: boolean
  createdAt: string
}

const ROLE_COLORS: Record<string, string> = {
  admin: '#e8000d',
  premium: '#f59e0b',
  coach: '#a855f7',
  member: '#8890A4',
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<UserRow[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [pages, setPages] = useState(1)
  const [loading, setLoading] = useState(true)

  // Filters
  const [search, setSearch] = useState('')
  const [role, setRole] = useState('')
  const [banned, setBanned] = useState('')
  const [premium, setPremium] = useState('')
  const [sort, setSort] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const params: any = { page, limit: 25 }
      if (search) params.q = search
      if (role) params.role = role
      if (banned) params.isBanned = banned
      if (premium) params.isPremium = premium
      if (sort) params.sort = sort
      const res = await adminApi.getUsers(params)
      setUsers(res.users)
      setTotal(res.total)
      setPages(res.pages)
    } catch { }
    setLoading(false)
  }, [page, search, role, banned, premium, sort])

  useEffect(() => { load() }, [load])

  // Debounce search
  const [searchInput, setSearchInput] = useState('')
  useEffect(() => {
    const t = setTimeout(() => { setSearch(searchInput); setPage(1) }, 400)
    return () => clearTimeout(t)
  }, [searchInput])

  const handleBanToggle = async (user: UserRow) => {
    try {
      if (user.isBanned) {
        await adminApi.unbanUser(user._id)
      } else {
        await adminApi.banUser(user._id, { reason: 'Banned by admin' })
      }
      load()
    } catch { }
  }

  const columns: Column<UserRow>[] = [
    {
      key: 'username', label: 'Name', width: '2fr',
      render: (row) => (
        <Link href={`/admin/users/${row._id}`} style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{
            width: 26, height: 26, borderRadius: '50%', background: '#1a1a2e',
            backgroundImage: row.avatarUrl ? `url(${row.avatarUrl})` : 'none',
            backgroundSize: 'cover', backgroundPosition: 'center',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 10, color: '#4F5568', flexShrink: 0,
          }}>
            {!row.avatarUrl && (row.displayName || row.username)?.[0]?.toUpperCase()}
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
              <span style={{ fontWeight: 700, color: row.usernameColor || '#DDE0EA', fontSize: 12 }}>{row.displayName || row.username}</span>
              <span style={{ fontSize: 9, color: '#4F5568', fontFamily: 'monospace', background: 'rgba(255,255,255,0.04)', padding: '1px 5px', borderRadius: 3 }}>#{row._id.slice(-8)}</span>
            </div>
            <div style={{ fontSize: 10, color: '#4F5568' }}>{row.email}</div>
          </div>
        </Link>
      ),
    },
    {
      key: 'role', label: 'Role', width: '100px',
      render: (row) => (
        <div style={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
          <span style={{
            padding: '2px 6px', fontSize: 8, fontWeight: 800,
            border: `1px solid ${ROLE_COLORS[row.role] || '#4F5568'}44`,
            borderRadius: 3, color: ROLE_COLORS[row.role] || '#4F5568',
            textTransform: 'uppercase', letterSpacing: .5,
          }}>
            {row.role}
          </span>
          {row.isCoach && (
            <span style={{
              padding: '2px 6px', fontSize: 8, fontWeight: 800,
              border: '1px solid rgba(168,85,247,.3)', borderRadius: 3, color: '#a855f7',
              textTransform: 'uppercase', letterSpacing: .5,
            }}>
              COACH
            </span>
          )}
        </div>
      ),
    },
    { key: 'level', label: 'Level', width: '60px' },
    {
      key: 'credits', label: 'Tickets', width: '80px',
      render: (row) => row.credits.toLocaleString(),
    },
    {
      key: 'cashBalance', label: 'Cash', width: '80px',
      render: (row) => `$${(row.cashBalance / 100).toFixed(2)}`,
    },
    { key: 'reputation', label: 'Rep', width: '60px' },
    {
      key: 'status', label: 'Status', width: '70px',
      render: (row) => (
        <span style={{
          fontSize: 9, fontWeight: 700, color: row.isBanned ? '#e8000d' : '#22c55e',
        }}>
          {row.isBanned ? 'BANNED' : 'ACTIVE'}
        </span>
      ),
    },
    {
      key: 'createdAt', label: 'Joined', width: '90px',
      render: (row) => new Date(row.createdAt).toLocaleDateString(),
    },
    {
      key: 'actions', label: 'Actions', width: '120px',
      render: (row) => (
        <div style={{ display: 'flex', gap: 4 }}>
          <Link href={`/admin/users/${row._id}`} style={{ textDecoration: 'none' }}>
            <ActionBtn label="VIEW" color="#3b82f6" />
          </Link>
          <ActionBtn
            label={row.isBanned ? 'UNBAN' : 'BAN'}
            color={row.isBanned ? '#22c55e' : '#e8000d'}
            onClick={() => handleBanToggle(row)}
          />
        </div>
      ),
    },
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div>
        <h1 style={{
          fontWeight: 900, fontSize: 28,
          color: '#fff', margin: 0, textTransform: 'uppercase',
        }}>
          Users & Accounts
        </h1>
        <p style={{ fontSize: 12, color: '#4F5568', margin: '4px 0 0' }}>
          {total.toLocaleString()} total users
        </p>
      </div>

      <SearchFilter
        search={searchInput}
        onSearch={setSearchInput}
        searchPlaceholder="Search by username, email, or ID..."
        filters={[
          {
            value: role, onChange: v => { setRole(v); setPage(1) }, placeholder: 'All Roles',
            options: [
              { value: 'admin', label: 'Admin' },
              { value: 'premium', label: 'Premium' },
              { value: 'coach', label: 'Coach' },
              { value: 'member', label: 'Member' },
            ],
          },
          {
            value: banned, onChange: v => { setBanned(v); setPage(1) }, placeholder: 'All Status',
            options: [
              { value: 'false', label: 'Active' },
              { value: 'true', label: 'Banned' },
            ],
          },
          {
            value: premium, onChange: v => { setPremium(v); setPage(1) }, placeholder: 'Premium?',
            options: [
              { value: 'true', label: 'Premium' },
              { value: 'false', label: 'Free' },
            ],
          },
          {
            value: sort, onChange: v => { setSort(v); setPage(1) }, placeholder: 'Sort: Joined',
            options: [
              { value: 'joined', label: 'Joined' },
              { value: 'level', label: 'Level' },
              { value: 'earnings', label: 'Earnings' },
              { value: 'reputation', label: 'Reputation' },
            ],
          },
        ]}
      />

      {loading ? (
        <div style={{ fontSize: 13, color: '#4F5568', padding: 40, textAlign: 'center' }}>
          Loading users...
        </div>
      ) : (
        <DataTable
          columns={columns}
          rows={users}
          emptyText="No users found"
          page={page}
          totalPages={pages}
          onPage={setPage}
        />
      )}
    </div>
  )
}
