'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Icon } from '@iconify/react'
import { leaderboardsApi } from '@/lib/api'
import { Solar } from '@/lib/solar-duotone'

const FILTER_TABS = ['Wins', 'Cash', 'XP', 'Trophies']
const PER_PAGE    = 10

// ─── COLUMN CONFIG PER FILTER ─────────────────────────────────────────────────
type ColKey = 'region' | 'game' | 'wins' | 'loss' | 'cash' | 'level' | 'xp' | 'discordMsgs' | 'forumPosts' | 'matches' | 'tournaments' | 'trophies'

const COLS: Record<string, { key: ColKey; label: string }[]> = {
  Wins: [
    { key: 'region',  label: 'Region'  },
    { key: 'game',    label: 'Game'    },
    { key: 'wins',    label: 'Wins'    },
    { key: 'loss',    label: 'Losses'  },
    { key: 'level',   label: 'Level'   },
  ],
  Cash: [
    { key: 'region',  label: 'Region'      },
    { key: 'game',    label: 'Game'        },
    { key: 'wins',    label: 'Wins'        },
    { key: 'cash',    label: 'Cash Earned' },
    { key: 'level',   label: 'Level'       },
  ],
  XP: [
    { key: 'region',      label: 'Region'    },
    { key: 'game',        label: 'Game'      },
    { key: 'discordMsgs', label: 'Discord'   },
    { key: 'forumPosts',  label: 'Forum'     },
    { key: 'matches',     label: 'Matches'   },
    { key: 'tournaments', label: 'Tourneys'  },
    { key: 'xp',          label: 'Total XP'  },
    { key: 'level',       label: 'Level'     },
  ],
  Trophies: [
    { key: 'region',      label: 'Region'      },
    { key: 'game',        label: 'Game'        },
    { key: 'tournaments', label: 'Participated'},
    { key: 'trophies',    label: 'Trophies'    },
    { key: 'cash',        label: 'Cash Earned' },
    { key: 'level',       label: 'Level'       },
  ],
}

function ordinal(n: number) {
  const s = ['th', 'st', 'nd', 'rd'], v = n % 100
  return n + (s[(v - 20) % 10] || s[v] || s[0])
}

// ─── CELL RENDERER ────────────────────────────────────────────────────────────
function Cell({ colKey, player }: { colKey: ColKey; player: any }) {
  const base: React.CSSProperties = {
    fontFamily: "'Barlow Condensed', sans-serif",
    fontWeight: 700, fontSize: 13,
    padding: '14px 14px', whiteSpace: 'nowrap',
  }

  switch (colKey) {
    case 'region':
      return (
        <td style={{ ...base, color: 'rgba(255,255,255,0.55)', fontSize: 12 }}>
          {player.region}
        </td>
      )
    case 'game':
      return (
        <td style={{ ...base, fontSize: 12 }}>
          <Link
            href={`/games/${player.gameSlug || player.game.toLowerCase().replace(/ \/ /g, '-').replace(/ /g, '-')}`}
            style={{ color: '#60A5FA', textDecoration: 'none' }}
            onMouseEnter={e => (e.currentTarget.style.textDecoration = 'underline')}
            onMouseLeave={e => (e.currentTarget.style.textDecoration = 'none')}
          >
            {player.game}
          </Link>
        </td>
      )
    case 'wins':
      return <td style={{ ...base, color: '#4ADE80', textAlign: 'center' }}>{player.wins}</td>
    case 'loss':
      return <td style={{ ...base, color: '#E8000D', textAlign: 'center' }}>{player.loss}</td>
    case 'cash':
      return <td style={{ ...base, color: '#F0C040', textAlign: 'center' }}>{player.cash}</td>
    case 'level':
      return (
        <td style={{ textAlign: 'center', padding: '14px 14px' }}>
          <span style={{
            background: 'rgba(255,255,255,0.06)',
            border: '1px solid rgba(255,255,255,0.12)',
            borderRadius: 5, padding: '2px 10px',
            fontFamily: "'Barlow Condensed', sans-serif",
            fontWeight: 900, fontSize: 13, color: '#fff',
          }}>{player.level}</span>
        </td>
      )
    case 'xp':
      return <td style={{ ...base, color: '#A78BFA', textAlign: 'center' }}>{player.xp.toLocaleString()}</td>
    case 'discordMsgs':
      return <td style={{ ...base, color: 'rgba(255,255,255,0.7)', textAlign: 'center' }}>{player.discordMsgs.toLocaleString()}</td>
    case 'forumPosts':
      return <td style={{ ...base, color: 'rgba(255,255,255,0.7)', textAlign: 'center' }}>{player.forumPosts}</td>
    case 'matches':
      return <td style={{ ...base, color: 'rgba(255,255,255,0.7)', textAlign: 'center' }}>{player.matches}</td>
    case 'tournaments':
      return <td style={{ ...base, color: 'rgba(255,255,255,0.7)', textAlign: 'center' }}>{player.tournaments}</td>
    case 'trophies':
      return (
        <td style={{ padding: '14px 14px', whiteSpace: 'nowrap' }}>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <Icon icon={Solar.trophy} width={15} height={15} style={{ flexShrink: 0, color: '#F0C040' }} />
              <span style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 800, fontSize: 14, color: '#F0C040' }}>{player.trophies.gold}</span>
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <Icon icon={Solar.medalRibbon} width={15} height={15} style={{ flexShrink: 0, color: '#C0C0C0' }} />
              <span style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 800, fontSize: 14, color: '#C0C0C0' }}>{player.trophies.silver}</span>
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <Icon icon={Solar.medalRibbon} width={15} height={15} style={{ flexShrink: 0, color: '#CD7F32' }} />
              <span style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 800, fontSize: 14, color: '#CD7F32' }}>{player.trophies.bronze}</span>
            </span>
          </div>
        </td>
      )
    default:
      return <td />
  }
}

// ─── PAGE ────────────────────────────────────────────────────────────────────
export default function LeaderboardsPage() {
  const [activeTab,      setActiveTab]      = useState('Wins')
  const [selectedRegion, setSelectedRegion] = useState('All Regions')
  const [selectedGame,   setSelectedGame]   = useState('All Games')
  const [page,           setPage]           = useState(1)
  const [players,        setPlayers]        = useState<any[]>([])
  const [total,          setTotal]          = useState(0)
  const [totalPages,     setTotalPages]     = useState(1)
  const [regions,        setRegions]        = useState<string[]>(['All Regions'])
  const [games,          setGames]          = useState<string[]>(['All Games'])

  // Fetch filter options on mount
  useEffect(() => {
    leaderboardsApi.getFilters().then((res: any) => {
      if (res.regions) setRegions(res.regions)
      if (res.games) setGames(res.games)
    }).catch(() => {})
  }, [])

  // Fetch leaderboard data
  useEffect(() => {
    const tabMap: Record<string, string> = { Wins: 'wins', Cash: 'cash', XP: 'xp', Trophies: 'trophies' }
    const params: any = { tab: tabMap[activeTab] || 'wins', page, limit: PER_PAGE }
    if (selectedRegion !== 'All Regions') params.region = selectedRegion
    if (selectedGame !== 'All Games') params.game = selectedGame

    leaderboardsApi.get(params).then((res: any) => {
      setPlayers(res.players || [])
      setTotal(res.total || 0)
      setTotalPages(res.totalPages || 1)
    }).catch(() => {})
  }, [activeTab, selectedRegion, selectedGame, page])

  const cols = COLS[activeTab]
  const pageSlice = players

  // Reset page on filter/tab change
  const handleTab = (t: string) => { setActiveTab(t); setPage(1) }
  const handleRegion = (r: string) => { setSelectedRegion(r); setPage(1) }
  const handleGame   = (g: string) => { setSelectedGame(g);   setPage(1) }

  const rankColor = (rank: number) =>
    rank === 1 ? '#F0C040' : rank === 2 ? '#C0C0C0' : rank === 3 ? '#CD7F32' : 'var(--text-muted)'

  const rowAccent = (rank: number) =>
    rank === 1 ? 'rgba(240,192,64,0.07)'
    : rank === 2 ? 'rgba(192,192,192,0.05)'
    : rank === 3 ? 'rgba(205,127,50,0.05)'
    : 'transparent'

  const thStyle: React.CSSProperties = {
    fontFamily: "'Rajdhani', sans-serif",
    fontWeight: 700, fontSize: 10,
    textTransform: 'uppercase', letterSpacing: '0.1em',
    color: 'var(--text-dim)',
    padding: '11px 14px',
    borderBottom: '1px solid var(--border)',
    background: 'var(--bg-2)',
    whiteSpace: 'nowrap',
  }

  return (
    <div className="container" style={{ paddingBottom: 60 }}>

      {/* ── PAGE HEADER ── */}
      <div style={{ padding: '40px 0 24px', borderBottom: '1px solid var(--border)', marginBottom: 28 }}>
        <h1 style={{
          fontFamily: "'Barlow Condensed', sans-serif",
          fontSize: 40, fontWeight: 900,
          textTransform: 'uppercase', letterSpacing: '0.02em',
          color: '#fff', marginBottom: 6,
        }}>
          Leader<span style={{ color: 'var(--red)' }}>boards</span>
        </h1>
        <p style={{ fontSize: 14, color: 'var(--text-muted)', margin: 0 }}>
          Top players competing across all games on GamerHead
        </p>
      </div>

      <div className="lb-layout">

        {/* ── FILTERS ── */}
        <aside className="lb-sidebar">

          <div className="lb-sidebar-card">
            <div className="lb-sidebar-header" style={{ cursor: 'default' }}><span>Region</span></div>
            <div className="lb-sidebar-body" style={{ padding: '8px 12px' }}>
              <select
                value={selectedRegion}
                onChange={e => handleRegion(e.target.value)}
                style={{ width: '100%', padding: '8px 12px', background: 'var(--bg-3)', border: '1px solid var(--border)', borderRadius: 8, color: '#fff', fontFamily: "'Barlow', sans-serif", fontWeight: 600, fontSize: 13, outline: 'none', cursor: 'pointer', appearance: 'none', WebkitAppearance: 'none', backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'12\' height=\'12\' viewBox=\'0 0 24 24\'%3E%3Cpath fill=\'%23999\' d=\'M7 10l5 5 5-5z\'/%3E%3C/svg%3E")', backgroundRepeat: 'no-repeat', backgroundPosition: 'right 10px center' }}
              >
                {regions.map(r => <option key={r} value={r} style={{ background: 'var(--bg-1)', color: '#fff' }}>{r}</option>)}
              </select>
            </div>
          </div>

          <div className="lb-sidebar-card">
            <div className="lb-sidebar-header" style={{ cursor: 'default' }}><span>Games</span></div>
            <div className="lb-sidebar-body" style={{ padding: '8px 12px' }}>
              <select
                value={selectedGame}
                onChange={e => handleGame(e.target.value)}
                style={{ width: '100%', padding: '8px 12px', background: 'var(--bg-3)', border: '1px solid var(--border)', borderRadius: 8, color: '#fff', fontFamily: "'Barlow', sans-serif", fontWeight: 600, fontSize: 13, outline: 'none', cursor: 'pointer', appearance: 'none', WebkitAppearance: 'none', backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'12\' height=\'12\' viewBox=\'0 0 24 24\'%3E%3Cpath fill=\'%23999\' d=\'M7 10l5 5 5-5z\'/%3E%3C/svg%3E")', backgroundRepeat: 'no-repeat', backgroundPosition: 'right 10px center' }}
              >
                {games.map(g => <option key={g} value={g} style={{ background: 'var(--bg-1)', color: '#fff' }}>{g}</option>)}
              </select>
            </div>
          </div>

          <div className="lb-sidebar-card">
            <div className="lb-sidebar-header" style={{ cursor: 'default' }}><span>Filter by</span></div>
            <div className="lb-sidebar-body" style={{ padding: '8px 12px' }}>
              <select
                value={activeTab}
                onChange={e => handleTab(e.target.value)}
                style={{ width: '100%', padding: '8px 12px', background: 'var(--bg-3)', border: '1px solid var(--border)', borderRadius: 8, color: '#fff', fontFamily: "'Barlow', sans-serif", fontWeight: 600, fontSize: 13, outline: 'none', cursor: 'pointer', appearance: 'none', WebkitAppearance: 'none', backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'12\' height=\'12\' viewBox=\'0 0 24 24\'%3E%3Cpath fill=\'%23999\' d=\'M7 10l5 5 5-5z\'/%3E%3C/svg%3E")', backgroundRepeat: 'no-repeat', backgroundPosition: 'right 10px center' }}
              >
                {FILTER_TABS.map(t => <option key={t} value={t} style={{ background: 'var(--bg-1)', color: '#fff' }}>{t}</option>)}
              </select>
            </div>
          </div>

        </aside>

        {/* ── MAIN TABLE ── */}
        <div className="lb-main" style={{ minWidth: 0 }}>

          {/* Result info */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12, flexWrap: 'wrap', gap: 8 }}>
            <span style={{ fontFamily: "'Rajdhani', sans-serif", fontWeight: 700, fontSize: 11, color: 'var(--text-dim)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
              {total} player{total !== 1 ? 's' : ''} · {activeTab} rankings
              {selectedRegion !== 'All Regions' && <> · <span style={{ color: 'var(--red)' }}>{selectedRegion}</span></>}
              {selectedGame   !== 'All Games'   && <> · <span style={{ color: '#60A5FA' }}>{selectedGame}</span></>}
            </span>
            <span style={{ fontFamily: "'Rajdhani', sans-serif", fontWeight: 700, fontSize: 11, color: 'var(--text-dim)' }}>
              Page {page} of {totalPages || 1}
            </span>
          </div>

          {/* Table — horizontal scroll on narrow viewports */}
          <div className="lb-table-wrapper" style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 600 }}>
              <thead>
                <tr>
                  {/* Rank */}
                  <th style={{ ...thStyle, width: 80 }}>Rank</th>
                  {/* Player */}
                  <th style={{ ...thStyle, minWidth: 160 }}>Player</th>
                  {/* Dynamic cols */}
                  {cols.map(c => (
                    <th key={c.key} style={{ ...thStyle, textAlign: c.key === 'region' || c.key === 'game' ? 'left' : 'center' }}>
                      {c.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {pageSlice.length === 0 ? (
                  <tr>
                    <td colSpan={cols.length + 2} style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-muted)', fontFamily: "'Barlow', sans-serif", fontSize: 13 }}>
                      No players match the current filters.
                    </td>
                  </tr>
                ) : (
                  pageSlice.map((p, idx) => (
                    <tr
                      key={p.slug}
                      style={{
                        background: rowAccent(p.rank),
                        borderBottom: '1px solid rgba(255,255,255,0.04)',
                        transition: 'background 0.15s',
                      }}
                      onMouseEnter={e => { if (p.rank > 3) e.currentTarget.style.background = 'rgba(255,255,255,0.025)' }}
                      onMouseLeave={e => { e.currentTarget.style.background = rowAccent(p.rank) }}
                    >
                      {/* Rank cell */}
                      <td style={{ padding: '14px 14px', width: 80 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <span style={{
                            fontFamily: "'Barlow Condensed', sans-serif",
                            fontWeight: 900,
                            fontSize: p.rank <= 3 ? 15 : 13,
                            color: rankColor(p.rank),
                            minWidth: 28,
                          }}>
                            {p.rank === 1 ? <Icon icon={Solar.crown} width={18} height={18} style={{ color: '#F0C040' }} /> : ordinal(p.rank)}
                          </span>
                          {p.rank > 3 && p.trend === 'up'   && <span style={{ fontSize: 9, color: '#4ADE80', fontWeight: 800 }}>▲</span>}
                          {p.rank > 3 && p.trend === 'down' && <span style={{ fontSize: 9, color: '#E8000D', fontWeight: 800 }}>▼</span>}
                        </div>
                      </td>

                      {/* Player cell */}
                      <td style={{ padding: '14px 14px', minWidth: 160 }}>
                        <Link
                          href={`/profile/${p.slug}`}
                          style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 10 }}
                        >
                          <div style={{
                            width: 32, height: 32, borderRadius: 8, flexShrink: 0,
                            background: 'rgba(255,255,255,0.06)',
                            border: `1px solid ${p.rank === 1 ? 'rgba(240,192,64,0.35)' : p.rank === 2 ? 'rgba(192,192,192,0.25)' : p.rank === 3 ? 'rgba(205,127,50,0.25)' : 'rgba(255,255,255,0.1)'}`,
                            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15,
                            overflow: 'hidden',
                          }}>
                            {p.profilePicture
                              ? <img src={p.profilePicture} alt="" style={{ width: '100%', height: '100%', borderRadius: 8, objectFit: 'cover' }} />
                              : <Icon icon={Solar.user} width={16} height={16} style={{ color: 'var(--text-dim)' }} />
                            }
                          </div>
                          <span
                            style={{
                              fontFamily: "'Barlow Condensed', sans-serif",
                              fontWeight: 800, fontSize: 15,
                              color: p.usernameColor || '#fff',
                              letterSpacing: '0.02em', transition: 'color 0.15s',
                            }}
                            onMouseEnter={e => (e.currentTarget.style.color = 'var(--red)')}
                            onMouseLeave={e => (e.currentTarget.style.color = p.usernameColor || '#fff')}
                          >
                            {p.name}
                          </span>
                        </Link>
                      </td>

                      {/* Dynamic data cells */}
                      {cols.map(c => (
                        <Cell key={c.key} colKey={c.key} player={p} />
                      ))}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* ── PAGINATION ── */}
          {totalPages > 1 && (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 24 }}>
              {/* Prev */}
              <PagBtn onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>← Prev</PagBtn>

              {/* Page numbers */}
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(n => (
                <PagBtn key={n} active={n === page} onClick={() => setPage(n)}>{n}</PagBtn>
              ))}

              {/* Next */}
              <PagBtn onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}>Next →</PagBtn>
            </div>
          )}

        </div>
      </div>
    </div>
  )
}

// ─── PAGINATION BUTTON ────────────────────────────────────────────────────────
function PagBtn({ onClick, disabled, active, children }: {
  onClick: () => void; disabled?: boolean; active?: boolean; children: React.ReactNode
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        padding: '7px 13px',
        background: active ? 'var(--red)' : 'var(--bg-3)',
        border: `1px solid ${active ? 'var(--red)' : 'var(--border)'}`,
        borderRadius: 6,
        color: active ? '#fff' : disabled ? 'var(--text-dim)' : 'var(--text-muted)',
        fontFamily: "'Barlow Condensed', sans-serif",
        fontWeight: 700, fontSize: 12,
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.4 : 1,
        transition: 'all 0.15s',
        letterSpacing: '0.04em',
      }}
    >
      {children}
    </button>
  )
}