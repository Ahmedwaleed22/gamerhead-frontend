'use client'

interface ActionBtnProps {
  label: string
  color?: string
  onClick?: () => void
  disabled?: boolean
  size?: 'sm' | 'md' | 'lg'
}

const SIZES = {
  sm: { padding: '5px 12px', fontSize: 11, borderRadius: 5 },
  md: { padding: '8px 16px', fontSize: 12, borderRadius: 6 },
  lg: { padding: '11px 22px', fontSize: 14, borderRadius: 6 },
}

export default function ActionBtn({ label, color = '#8890A4', onClick, disabled, size = 'sm' }: ActionBtnProps) {
  const s = SIZES[size]
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        padding: s.padding, fontSize: s.fontSize, fontWeight: 700, fontFamily: 'Rajdhani, sans-serif',
        background: 'transparent', border: `1px solid ${color}44`, borderRadius: s.borderRadius,
        color: disabled ? '#4F5568' : color, cursor: disabled ? 'not-allowed' : 'pointer',
        letterSpacing: .3, whiteSpace: 'nowrap', transition: 'all .15s',
        opacity: disabled ? 0.5 : 1,
      }}
      onMouseEnter={e => { if (!disabled) e.currentTarget.style.background = `${color}18` }}
      onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}
    >
      {label}
    </button>
  )
}
