'use client'

import { useEffect, useLayoutEffect, useRef } from 'react'
import Pagination from './Pagination'

export interface Column<T = any> {
  key: string
  label: string
  width?: string
  render?: (row: T) => React.ReactNode
}

interface DataTableProps<T = any> {
  columns: Column<T>[]
  rows: T[]
  emptyText?: string
  page?: number
  totalPages?: number
  onPage?: (p: number) => void
}

export default function DataTable<T extends Record<string, any>>({
  columns, rows, emptyText = 'No data', page, totalPages, onPage,
}: DataTableProps<T>) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const innerRef = useRef<HTMLDivElement>(null)
  const scrollKey = `${columns.map(c => c.key).join('|')}::${String(page ?? '')}::${String(rows?.[0]?._id ?? rows?.[0]?.id ?? '')}`
  const hasUserInteractedRef = useRef(false)
  const gridCols = columns
    .map((c) => {
      if (!c.width) return 'minmax(120px, 1fr)'
      if (c.width.endsWith('fr')) return `minmax(100px, ${c.width})`
      // Fixed-width columns: use the specified size as a minimum but
      // allow proportional growth so the table fills available space.
      return `minmax(${c.width}, 1fr)`
    })
    .join(' ')

  // Ensure the table starts at the first column on mount/data load.
  // (Using layout effect + rAF to avoid Safari applying scroll restoration after paint.)
  const resetScrollLeft = () => {
    const el = scrollRef.current
    if (!el) return
    el.scrollLeft = 0
  }

  useLayoutEffect(() => {
    resetScrollLeft()
    requestAnimationFrame(() => resetScrollLeft())
  }, [scrollKey, columns, rows, page])

  useEffect(() => {
    // Extra safety: some browsers adjust scroll after fonts/layout settle.
    const t = window.setTimeout(() => resetScrollLeft(), 0)
    return () => window.clearTimeout(t)
  }, [scrollKey, columns, rows, page])

  useEffect(() => {
    hasUserInteractedRef.current = false
  }, [scrollKey])

  useEffect(() => {
    const inner = innerRef.current
    const scroller = scrollRef.current
    if (!inner || !scroller) return

    const ro = new ResizeObserver(() => {
      // If the table layout changes (e.g. a long name wraps/expands),
      // keep the view locked to the first column until the user scrolls manually.
      if (!hasUserInteractedRef.current) requestAnimationFrame(() => resetScrollLeft())
    })

    ro.observe(inner)
    return () => ro.disconnect()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scrollKey])

  return (
    <div
      key={scrollKey}
      ref={scrollRef}
      onScroll={() => {
        const el = scrollRef.current
        if (!el) return
        if (el.scrollLeft > 2) hasUserInteractedRef.current = true
      }}
      style={{ background: '#13131E', border: '1px solid rgba(255,255,255,.06)', borderRadius: 10, overflowX: 'auto', maxWidth: '100%' }}
    >
      <div ref={innerRef} style={{ minWidth: 'max-content', width: '100%' }}>
        {/* Header */}
        <div style={{
          display: 'grid', gridTemplateColumns: gridCols, gap: 16,
          padding: '12px 20px', borderBottom: '1px solid rgba(255,255,255,.06)',
          fontSize: 13, fontWeight: 700, color: '#4F5568',
          textTransform: 'uppercase', letterSpacing: .8,
        }}>
          {columns.map(c => (
            <span key={c.key} style={{ whiteSpace: 'normal', overflowWrap: 'anywhere' }}>
              {c.label}
            </span>
          ))}
        </div>

        {/* Rows */}
        {rows.length === 0 ? (
          <div style={{ padding: '40px 20px', textAlign: 'center', color: '#4F5568', fontSize: 16 }}>
            {emptyText}
          </div>
        ) : rows.map((row, i) => (
          <div
            key={row._id || row.id || i}
            style={{
              display: 'grid', gridTemplateColumns: gridCols, gap: 16,
              padding: '12px 20px', borderBottom: '1px solid rgba(255,255,255,.04)',
              alignItems: 'center', fontSize: 13, color: '#DDE0EA',
            }}
          >
            {columns.map(c => (
              <div
                key={c.key}
                style={{
                  minWidth: 0,
                  whiteSpace: 'normal',
                  overflowWrap: 'anywhere',
                  wordBreak: 'break-word',
                }}
              >
                {c.render ? c.render(row) : String(row[c.key] ?? '—')}
              </div>
            ))}
          </div>
        ))}

        {/* Pagination */}
        {page != null && totalPages != null && totalPages > 0 && onPage && (
          <Pagination page={page} totalPages={totalPages} onPage={onPage} />
        )}
      </div>
    </div>
  )
}
