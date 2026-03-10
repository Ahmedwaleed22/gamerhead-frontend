'use client'

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
  const gridCols = columns.map(c => c.width || '1fr').join(' ')

  return (
    <div style={{ background: '#13131E', border: '1px solid rgba(255,255,255,.06)', borderRadius: 10, overflow: 'hidden' }}>
      {/* Header */}
      <div style={{
        display: 'grid', gridTemplateColumns: gridCols, gap: 10,
        padding: '12px 20px', borderBottom: '1px solid rgba(255,255,255,.06)',
        fontSize: 11, fontWeight: 700, color: '#4F5568', fontFamily: 'Rajdhani, sans-serif',
        textTransform: 'uppercase', letterSpacing: .8,
      }}>
        {columns.map(c => <span key={c.key}>{c.label}</span>)}
      </div>

      {/* Rows */}
      {rows.length === 0 ? (
        <div style={{ padding: '40px 20px', textAlign: 'center', color: '#4F5568', fontSize: 14, fontFamily: 'Rajdhani, sans-serif' }}>
          {emptyText}
        </div>
      ) : rows.map((row, i) => (
        <div
          key={row._id || row.id || i}
          style={{
            display: 'grid', gridTemplateColumns: gridCols, gap: 10,
            padding: '12px 20px', borderBottom: '1px solid rgba(255,255,255,.04)',
            alignItems: 'center', fontSize: 13, color: '#DDE0EA', fontFamily: 'Rajdhani, sans-serif',
          }}
        >
          {columns.map(c => (
            <div key={c.key}>
              {c.render ? c.render(row) : String(row[c.key] ?? '—')}
            </div>
          ))}
        </div>
      ))}

      {/* Pagination */}
      {page && totalPages && onPage && (
        <Pagination page={page} totalPages={totalPages} onPage={onPage} />
      )}
    </div>
  )
}
