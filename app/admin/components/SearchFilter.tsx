'use client'

interface FilterOption {
  value: string
  label: string
}

interface SearchFilterProps {
  search?: string
  onSearch?: (v: string) => void
  searchPlaceholder?: string
  filters?: {
    value: string
    onChange: (v: string) => void
    options: FilterOption[]
    placeholder: string
  }[]
}

const inputStyle: React.CSSProperties = {
  padding: '9px 14px', background: '#13131E', border: '1px solid rgba(255,255,255,.09)',
  borderRadius: 6, fontSize: 13, color: '#fff', outline: 'none',
}

export default function SearchFilter({ search, onSearch, searchPlaceholder = 'Search...', filters = [] }: SearchFilterProps) {
  return (
    <div style={{ display: 'flex', gap: 16, marginBottom: 12, flexWrap: 'wrap' }}>
      {onSearch !== undefined && (
        <input
          value={search || ''}
          onChange={e => onSearch?.(e.target.value)}
          placeholder={searchPlaceholder}
          style={{ ...inputStyle, flex: 1, minWidth: 200 }}
        />
      )}
      {filters.map((f, i) => (
        <select
          key={i}
          value={f.value}
          onChange={e => f.onChange(e.target.value)}
          style={{ ...inputStyle, color: '#8890A4' }}
        >
          <option value="">{f.placeholder}</option>
          {f.options.map(o => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      ))}
    </div>
  )
}
