'use client'

interface PaginationProps {
  page: number
  totalPages: number
  onPage: (p: number) => void
}

export default function Pagination({ page, totalPages, onPage }: PaginationProps) {
  if (totalPages <= 1) return null
  return (
    <div style={{ display: 'flex', justifyContent: 'center', gap: 8, padding: '14px 20px' }}>
      <button
        disabled={page <= 1}
        onClick={() => onPage(page - 1)}
        style={{ padding: '6px 14px', fontSize: 16, fontWeight: 700, background: '#191926', border: '1px solid rgba(255,255,255,.07)', borderRadius: 5, color: page <= 1 ? '#4F5568' : '#8890A4', cursor: page <= 1 ? 'default' : 'pointer' }}
      >
        Prev
      </button>
      <span style={{ padding: '6px 14px', fontSize: 16, fontWeight: 700, color: '#8890A4' }}>
        {page} / {totalPages}
      </span>
      <button
        disabled={page >= totalPages}
        onClick={() => onPage(page + 1)}
        style={{ padding: '6px 14px', fontSize: 16, fontWeight: 700, background: '#191926', border: '1px solid rgba(255,255,255,.07)', borderRadius: 5, color: page >= totalPages ? '#4F5568' : '#8890A4', cursor: page >= totalPages ? 'default' : 'pointer' }}
      >
        Next
      </button>
    </div>
  )
}
