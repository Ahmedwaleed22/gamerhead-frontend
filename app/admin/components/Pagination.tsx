'use client'

interface PaginationProps {
  page: number
  totalPages: number
  onPage: (p: number) => void
}

export default function Pagination({ page, totalPages, onPage }: PaginationProps) {
  if (totalPages <= 1) return null
  return (
    <div style={{ display: 'flex', justifyContent: 'center', gap: 6, padding: '12px 16px' }}>
      <button
        disabled={page <= 1}
        onClick={() => onPage(page - 1)}
        style={{ padding: '4px 10px', fontSize: 10, fontWeight: 700, fontFamily: 'Rajdhani, sans-serif', background: '#191926', border: '1px solid rgba(255,255,255,.07)', borderRadius: 4, color: page <= 1 ? '#4F5568' : '#8890A4', cursor: page <= 1 ? 'default' : 'pointer' }}
      >
        Prev
      </button>
      <span style={{ padding: '4px 10px', fontSize: 10, fontWeight: 700, fontFamily: 'Rajdhani, sans-serif', color: '#8890A4' }}>
        {page} / {totalPages}
      </span>
      <button
        disabled={page >= totalPages}
        onClick={() => onPage(page + 1)}
        style={{ padding: '4px 10px', fontSize: 10, fontWeight: 700, fontFamily: 'Rajdhani, sans-serif', background: '#191926', border: '1px solid rgba(255,255,255,.07)', borderRadius: 4, color: page >= totalPages ? '#4F5568' : '#8890A4', cursor: page >= totalPages ? 'default' : 'pointer' }}
      >
        Next
      </button>
    </div>
  )
}
