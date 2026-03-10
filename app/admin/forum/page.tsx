'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { forumApi, adminApi } from '@/lib/api'
import DataTable, { Column } from '../components/DataTable'
import ActionBtn from '../components/ActionBtn'
import SearchFilter from '../components/SearchFilter'
import Modal from '../components/Modal'

const STATUS_COLORS: Record<string, string> = { open: '#22c55e', locked: '#e8000d' }

const inputStyle: React.CSSProperties = {
  padding: '7px 12px', background: '#0d0d14', border: '1px solid rgba(255,255,255,.09)',
  borderRadius: 6, fontSize: 11, color: '#fff', fontFamily: 'Rajdhani, sans-serif', outline: 'none', width: '100%',
}
const labelStyle: React.CSSProperties = {
  fontSize: 9, fontWeight: 700, color: '#4F5568', fontFamily: 'Rajdhani, sans-serif',
  textTransform: 'uppercase', letterSpacing: .6, marginBottom: 4,
}

type Tab = 'reports' | 'threads' | 'boards'

export default function AdminForumPage() {
  const [tab, setTab] = useState<Tab>('reports')

  // Reports
  const [reports, setReports] = useState<any[]>([])
  const [reportsTotal, setReportsTotal] = useState(0)
  const [reportsPage, setReportsPage] = useState(1)
  const [reportsTotalPages, setReportsTotalPages] = useState(1)

  // Threads
  const [threads, setThreads] = useState<any[]>([])
  const [threadsTotal, setThreadsTotal] = useState(0)
  const [threadsPage, setThreadsPage] = useState(1)
  const [threadsTotalPages, setThreadsTotalPages] = useState(1)
  const [search, setSearch] = useState('')
  const [boardFilter, setBoardFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')

  // Boards
  const [boards, setBoards] = useState<any[]>([])
  const [boardsLoading, setBoardsLoading] = useState(true)
  const [createBoardModal, setCreateBoardModal] = useState(false)
  const [editBoardModal, setEditBoardModal] = useState<any>(null)
  const [boardForm, setBoardForm] = useState({ name: '', slug: '', emoji: '', category: 'General Gaming', description: '', sortOrder: '0', isActive: true, postRoles: [] as string[], viewRoles: [] as string[] })

  // Move modal
  const [moveModal, setMoveModal] = useState<{ threadId: string; title: string } | null>(null)
  const [moveTarget, setMoveTarget] = useState('')

  // Load boards (used for filters and boards tab)
  const loadBoards = useCallback(async () => {
    setBoardsLoading(true)
    try {
      const res = await adminApi.getForumBoards()
      const all = Array.isArray(res) ? res : res?.boards || []
      setBoards(all)
    } catch { }
    setBoardsLoading(false)
  }, [])

  useEffect(() => { loadBoards() }, [loadBoards])

  // Load reports
  useEffect(() => {
    if (tab !== 'reports') return
    forumApi.getAdminReports({ page: reportsPage, limit: 15 }).then((res: any) => {
      setReports(res.items || [])
      setReportsTotal(res.total || 0)
      setReportsTotalPages(res.totalPages || 1)
    }).catch(() => {})
  }, [tab, reportsPage])

  // Load threads
  useEffect(() => {
    if (tab !== 'threads') return
    forumApi.getAdminThreads({ search, boardSlug: boardFilter, status: statusFilter, page: threadsPage, limit: 15 }).then((res: any) => {
      setThreads(res.items || [])
      setThreadsTotal(res.total || 0)
      setThreadsTotalPages(res.totalPages || 1)
    }).catch(() => {})
  }, [tab, threadsPage, search, boardFilter, statusFilter])

  // Report actions
  const handleDismiss = async (postId: string) => {
    try { await forumApi.dismissReport(postId); setReports(p => p.filter(r => r._id !== postId)); setReportsTotal(p => p - 1) } catch { }
  }
  const handleDeletePost = async (postId: string) => {
    try { await forumApi.deletePost(postId); setReports(p => p.filter(r => r._id !== postId)); setReportsTotal(p => p - 1) } catch { }
  }

  // Thread actions
  const handleDeleteThread = async (threadId: string) => {
    try { await forumApi.deleteThread(threadId); setThreads(p => p.filter(t => t._id !== threadId)); setThreadsTotal(p => p - 1) } catch { }
  }
  const handleTogglePin = async (threadId: string, current: boolean) => {
    try { await forumApi.updateThread(threadId, { isPinned: !current }); setThreads(p => p.map(t => t._id === threadId ? { ...t, isPinned: !current } : t)) } catch { }
  }
  const handleToggleLock = async (threadId: string, current: string) => {
    const newStatus = current === 'locked' ? 'open' : 'locked'
    try { await forumApi.updateThread(threadId, { status: newStatus }); setThreads(p => p.map(t => t._id === threadId ? { ...t, status: newStatus } : t)) } catch { }
  }
  const handleMove = async () => {
    if (!moveModal || !moveTarget) return
    try { await forumApi.moveThread(moveModal.threadId, moveTarget); setThreads(p => p.map(t => t._id === moveModal.threadId ? { ...t, boardSlug: moveTarget } : t)); setMoveModal(null) } catch { }
  }

  // Board management actions
  const handleCreateBoard = async () => {
    try {
      await adminApi.createBoard({ ...boardForm, sortOrder: Number(boardForm.sortOrder) })
      setCreateBoardModal(false)
      setBoardForm({ name: '', slug: '', emoji: '', category: 'General Gaming', description: '', sortOrder: '0', isActive: true, postRoles: [], viewRoles: [] })
      loadBoards()
    } catch { }
  }
  const handleUpdateBoard = async () => {
    if (!editBoardModal) return
    try {
      await adminApi.updateBoard(editBoardModal._id, { ...boardForm, sortOrder: Number(boardForm.sortOrder) })
      setEditBoardModal(null)
      loadBoards()
    } catch { }
  }
  const handleToggleBoardActive = async (id: string, isActive: boolean) => {
    try { await adminApi.updateBoard(id, { isActive: !isActive }); loadBoards() } catch { }
  }
  const handleDeleteBoard = async (id: string) => {
    try { await adminApi.deleteBoard(id); loadBoards() } catch { }
  }

  const openEditBoard = (b: any) => {
    setBoardForm({ name: b.name, slug: b.slug, emoji: b.emoji || '', category: b.category, description: b.description || '', sortOrder: String(b.sortOrder || 0), isActive: b.isActive, postRoles: b.postRoles || [], viewRoles: b.viewRoles || [] })
    setEditBoardModal(b)
  }

  // Report columns
  const reportColumns: Column[] = [
    { key: 'content', label: 'Post Content', width: '2fr',
      render: (r: any) => (
        <div>
          <div style={{ fontSize: 11, color: '#DDE0EA', lineHeight: 1.4, maxHeight: 40, overflow: 'hidden' }}>
            {(r.content || '').slice(0, 120)}{(r.content || '').length > 120 ? '...' : ''}
          </div>
          {(r.reports || []).map((rep: any, i: number) => (
            <div key={i} style={{ fontSize: 9, color: '#e8000d', marginTop: 3 }}>Reason: {rep.reason}</div>
          ))}
        </div>
      ),
    },
    { key: 'authorName', label: 'Author', width: '100px', render: (r: any) => <span style={{ color: '#8890A4' }}>{r.authorName || '—'}</span> },
    { key: 'thread', label: 'Thread', width: '130px',
      render: (r: any) => r.thread ? (
        <Link href={`/forum/board/${r.thread.boardSlug}/${r.threadId}`} style={{ fontSize: 11, color: '#3b82f6', textDecoration: 'none' }}>
          {(r.thread.title || '').slice(0, 30)}
        </Link>
      ) : <span style={{ color: '#4F5568' }}>—</span>,
    },
    { key: 'boardSlug', label: 'Board', width: '90px', render: (r: any) => <span style={{ color: '#4F5568' }}>{r.thread?.boardSlug || '—'}</span> },
    { key: 'reporter', label: 'Reporter', width: '100px',
      render: (r: any) => <span style={{ color: '#8890A4' }}>{(r.reports || []).map((rep: any) => rep.username).join(', ') || '—'}</span>,
    },
    { key: 'actions', label: '', width: '140px',
      render: (r: any) => (
        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
          <ActionBtn label="DISMISS" color="#8890A4" onClick={() => handleDismiss(r._id)} />
          <ActionBtn label="DEL POST" color="#e8000d" onClick={() => handleDeletePost(r._id)} />
          {r.threadId && <ActionBtn label="DEL THREAD" color="#e8000d" onClick={() => handleDeleteThread(r.threadId)} />}
        </div>
      ),
    },
  ]

  // Thread columns
  const threadColumns: Column[] = [
    { key: 'title', label: 'Title', width: '2fr',
      render: (t: any) => (
        <Link href={`/forum/board/${t.boardSlug}/${t._id}`} style={{ color: '#DDE0EA', textDecoration: 'none', fontWeight: 700, fontSize: 12 }}>
          {(t.title || '').slice(0, 50)}{(t.title || '').length > 50 ? '...' : ''}
        </Link>
      ),
    },
    { key: 'boardSlug', label: 'Board', width: '100px', render: (t: any) => <span style={{ color: '#4F5568' }}>{t.boardSlug}</span> },
    { key: 'authorName', label: 'Author', width: '100px', render: (t: any) => <span style={{ color: '#8890A4' }}>{t.authorName || '—'}</span> },
    { key: 'replyCount', label: 'Replies', width: '60px', render: (t: any) => <span style={{ color: '#8890A4' }}>{t.replyCount || 0}</span> },
    { key: 'flags', label: 'Flags', width: '90px',
      render: (t: any) => (
        <div style={{ display: 'flex', gap: 3 }}>
          {t.isPinned && <FlagBadge label="PIN" color="#3b82f6" />}
          {t.status === 'locked' && <FlagBadge label="LOCK" color="#e8000d" />}
          {t.isOfficial && <FlagBadge label="OFF" color="#22c55e" />}
          {t.isHot && <FlagBadge label="HOT" color="#f97316" />}
        </div>
      ),
    },
    { key: 'createdAt', label: 'Created', width: '90px', render: (t: any) => <span style={{ color: '#4F5568' }}>{t.createdAt ? new Date(t.createdAt).toLocaleDateString() : '—'}</span> },
    { key: 'actions', label: '', width: '160px',
      render: (t: any) => (
        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
          <ActionBtn label={t.isPinned ? 'UNPIN' : 'PIN'} color="#3b82f6" onClick={() => handleTogglePin(t._id, t.isPinned)} />
          <ActionBtn label={t.status === 'locked' ? 'UNLOCK' : 'LOCK'} color="#f59e0b" onClick={() => handleToggleLock(t._id, t.status)} />
          <ActionBtn label="MOVE" color="#8890A4" onClick={() => { setMoveModal({ threadId: t._id, title: t.title }); setMoveTarget('') }} />
          <ActionBtn label="DEL" color="#e8000d" onClick={() => handleDeleteThread(t._id)} />
        </div>
      ),
    },
  ]

  // Board columns
  const boardColumns: Column[] = [
    { key: 'emoji', label: '', width: '40px', render: (b: any) => <span style={{ fontSize: 16 }}>{b.emoji || '💬'}</span> },
    { key: 'name', label: 'Name', width: '1fr', render: (b: any) => <span style={{ fontWeight: 700 }}>{b.name}</span> },
    { key: 'slug', label: 'Slug', width: '120px', render: (b: any) => <span style={{ fontSize: 9, color: '#8890A4', fontFamily: 'monospace' }}>{b.slug}</span> },
    { key: 'category', label: 'Category', width: '120px', render: (b: any) => <span style={{ color: '#4F5568' }}>{b.category}</span> },
    { key: 'threadCount', label: 'Threads', width: '70px', render: (b: any) => <span style={{ color: '#8890A4' }}>{b.threadCount || 0}</span> },
    { key: 'sortOrder', label: 'Order', width: '60px', render: (b: any) => <span style={{ color: '#4F5568' }}>{b.sortOrder}</span> },
    { key: 'isActive', label: 'Active', width: '60px',
      render: (b: any) => <span style={{ fontSize: 9, fontWeight: 700, color: b.isActive ? '#22c55e' : '#4F5568' }}>{b.isActive ? 'YES' : 'NO'}</span>,
    },
    { key: 'actions', label: '', width: '120px',
      render: (b: any) => (
        <div style={{ display: 'flex', gap: 4 }}>
          <ActionBtn label="EDIT" color="#3b82f6" onClick={() => openEditBoard(b)} />
          <ActionBtn label={b.isActive ? 'OFF' : 'ON'} color={b.isActive ? '#f59e0b' : '#22c55e'} onClick={() => handleToggleBoardActive(b._id, b.isActive)} />
          <ActionBtn label="DEL" color="#e8000d" onClick={() => handleDeleteBoard(b._id)} />
        </div>
      ),
    },
  ]

  const tabStyle = (t: Tab) => ({
    padding: '5px 14px', fontSize: 10, fontWeight: 700, fontFamily: 'Rajdhani, sans-serif',
    background: tab === t ? 'rgba(232,0,13,.15)' : 'transparent',
    border: `1px solid ${tab === t ? 'rgba(232,0,13,.3)' : 'rgba(255,255,255,.06)'}`,
    borderRadius: 4, color: tab === t ? '#e8000d' : '#4F5568', cursor: 'pointer' as const,
  })

  const boardFormModal = (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {[['Name', 'name'], ['Slug', 'slug'], ['Emoji', 'emoji'], ['Description', 'description'], ['Sort Order', 'sortOrder']].map(([l, k]) => (
        <div key={k as string}><div style={labelStyle}>{l}</div><input value={(boardForm as any)[k as string]} onChange={e => setBoardForm(p => ({ ...p, [k as string]: e.target.value }))} style={inputStyle} /></div>
      ))}
      <div><div style={labelStyle}>Category</div>
        <select value={boardForm.category} onChange={e => setBoardForm(p => ({ ...p, category: e.target.value }))} style={inputStyle}>
          <option value="Announcements">Announcements</option>
          <option value="General Gaming">General Gaming</option>
          <option value="Competitive">Competitive</option>
          <option value="Community">Community</option>
          <option value="Support">Support</option>
        </select>
      </div>
      <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 11, color: '#DDE0EA', fontFamily: 'Rajdhani, sans-serif', cursor: 'pointer' }}>
        <input type="checkbox" checked={boardForm.isActive} onChange={e => setBoardForm(p => ({ ...p, isActive: e.target.checked }))} /> Active
      </label>

      {/* Post Permission — who can create threads */}
      <div>
        <div style={labelStyle}>Post Threads — Allowed Roles</div>
        <div style={{ fontSize: 9, color: '#4F5568', fontFamily: 'Rajdhani, sans-serif', marginBottom: 4 }}>Leave all unchecked = everyone can post threads</div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {['admin', 'premium', 'coach', 'member'].map(role => (
            <label key={role} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 10, color: boardForm.postRoles.includes(role) ? '#DDE0EA' : '#4F5568', fontFamily: 'Rajdhani, sans-serif', fontWeight: 600, cursor: 'pointer', textTransform: 'uppercase', letterSpacing: 0.5 }}>
              <input type="checkbox" checked={boardForm.postRoles.includes(role)} onChange={e => {
                setBoardForm(p => ({
                  ...p,
                  postRoles: e.target.checked ? [...p.postRoles, role] : p.postRoles.filter(r => r !== role),
                }))
              }} />
              {role}
            </label>
          ))}
        </div>
      </div>

      {/* View Permission — who can see this board */}
      <div>
        <div style={labelStyle}>View Board — Allowed Roles</div>
        <div style={{ fontSize: 9, color: '#4F5568', fontFamily: 'Rajdhani, sans-serif', marginBottom: 4 }}>Leave all unchecked = public to everyone</div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {['admin', 'premium', 'coach', 'member'].map(role => (
            <label key={role} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 10, color: boardForm.viewRoles.includes(role) ? '#DDE0EA' : '#4F5568', fontFamily: 'Rajdhani, sans-serif', fontWeight: 600, cursor: 'pointer', textTransform: 'uppercase', letterSpacing: 0.5 }}>
              <input type="checkbox" checked={boardForm.viewRoles.includes(role)} onChange={e => {
                setBoardForm(p => ({
                  ...p,
                  viewRoles: e.target.checked ? [...p.viewRoles, role] : p.viewRoles.filter(r => r !== role),
                }))
              }} />
              {role}
            </label>
          ))}
        </div>
      </div>

      <ActionBtn label={editBoardModal ? 'SAVE CHANGES' : 'CREATE BOARD'} color="#22c55e" onClick={editBoardModal ? handleUpdateBoard : handleCreateBoard} />
    </div>
  )

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 900, fontSize: 28, color: '#fff', margin: 0, textTransform: 'uppercase' }}>Forum Moderation</h1>
          <p style={{ fontFamily: 'Rajdhani, sans-serif', fontSize: 12, color: '#4F5568', margin: '4px 0 0' }}>
            Manage reported posts, threads, and boards
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {tab === 'boards' && <ActionBtn label="+ NEW BOARD" color="#22c55e" onClick={() => { setBoardForm({ name: '', slug: '', emoji: '', category: 'General Gaming', description: '', sortOrder: '0', isActive: true, postRoles: [], viewRoles: [] }); setCreateBoardModal(true) }} />}
          <Link href="/forum" style={{ fontSize: 10, color: '#3b82f6', fontFamily: 'Rajdhani, sans-serif', fontWeight: 700, textDecoration: 'none', padding: '5px 12px', border: '1px solid rgba(59,130,246,.3)', borderRadius: 4, display: 'flex', alignItems: 'center' }}>
            VIEW FORUM
          </Link>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4 }}>
        <button onClick={() => setTab('reports')} style={tabStyle('reports')}>
          REPORTS {reportsTotal > 0 ? `(${reportsTotal})` : ''}
        </button>
        <button onClick={() => setTab('threads')} style={tabStyle('threads')}>
          THREADS {threadsTotal > 0 ? `(${threadsTotal})` : ''}
        </button>
        <button onClick={() => setTab('boards')} style={tabStyle('boards')}>
          BOARDS
        </button>
      </div>

      {/* Reports Tab */}
      {tab === 'reports' && (
        <DataTable columns={reportColumns} rows={reports} emptyText="No reported posts" page={reportsPage} totalPages={reportsTotalPages} onPage={setReportsPage} />
      )}

      {/* Threads Tab */}
      {tab === 'threads' && (
        <>
          <SearchFilter
            search={search}
            onSearch={(v: string) => { setSearch(v); setThreadsPage(1) }}
            searchPlaceholder="Search threads or authors..."
            filters={[
              {
                value: boardFilter, onChange: v => { setBoardFilter(v); setThreadsPage(1) }, placeholder: 'All Boards',
                options: boards.map(b => ({ value: b.slug, label: `${b.emoji || ''} ${b.name}`.trim() })),
              },
              {
                value: statusFilter, onChange: v => { setStatusFilter(v); setThreadsPage(1) }, placeholder: 'All Status',
                options: [{ value: 'open', label: 'Open' }, { value: 'locked', label: 'Locked' }],
              },
            ]}
          />
          <DataTable columns={threadColumns} rows={threads} emptyText="No threads found" page={threadsPage} totalPages={threadsTotalPages} onPage={setThreadsPage} />
        </>
      )}

      {/* Boards Tab */}
      {tab === 'boards' && (
        boardsLoading
          ? <div style={{ fontFamily: 'Rajdhani, sans-serif', fontSize: 13, color: '#4F5568', padding: 40, textAlign: 'center' }}>Loading...</div>
          : <DataTable columns={boardColumns} rows={boards} emptyText="No boards" />
      )}

      {/* Move Thread Modal */}
      {moveModal && (
        <Modal title="Move Thread" onClose={() => setMoveModal(null)}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ fontSize: 11, color: '#4F5568', fontFamily: 'Rajdhani, sans-serif' }}>
              {(moveModal.title || '').slice(0, 60)}
            </div>
            <select value={moveTarget} onChange={e => setMoveTarget(e.target.value)} style={inputStyle}>
              <option value="">Select board...</option>
              {boards.filter(b => b.isActive).map((b: any) => (
                <option key={b.slug} value={b.slug}>{b.emoji} {b.name}</option>
              ))}
            </select>
            <ActionBtn label="MOVE THREAD" color="#3b82f6" onClick={handleMove} />
          </div>
        </Modal>
      )}

      {/* Create Board Modal */}
      {createBoardModal && (
        <Modal title="Create Board" onClose={() => setCreateBoardModal(false)} width={420}>
          {boardFormModal}
        </Modal>
      )}

      {/* Edit Board Modal */}
      {editBoardModal && (
        <Modal title="Edit Board" onClose={() => setEditBoardModal(null)} width={420}>
          {boardFormModal}
        </Modal>
      )}
    </div>
  )
}

function FlagBadge({ label, color }: { label: string; color: string }) {
  return (
    <span style={{
      padding: '1px 4px', fontSize: 7, fontWeight: 800, fontFamily: 'Rajdhani, sans-serif',
      background: `${color}18`, border: `1px solid ${color}44`, borderRadius: 3,
      color, letterSpacing: .5, textTransform: 'uppercase',
    }}>
      {label}
    </span>
  )
}
