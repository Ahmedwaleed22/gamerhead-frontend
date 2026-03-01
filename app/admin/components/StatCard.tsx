'use client'

interface StatCardProps {
  icon: string
  label: string
  value: string | number
  color?: string
  sub?: string
}

export default function StatCard({ icon, label, value, color = '#fff', sub }: StatCardProps) {
  return (
    <div style={{
      background: '#13131E', border: '1px solid rgba(255,255,255,.06)', borderRadius: 10,
      padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: 4,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ fontSize: 18 }}>{icon}</span>
        <span style={{ fontSize: 9, fontWeight: 700, fontFamily: 'Rajdhani, sans-serif', color: '#4F5568', textTransform: 'uppercase', letterSpacing: .8 }}>
          {label}
        </span>
      </div>
      <div style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 900, fontSize: 28, color, lineHeight: 1 }}>
        {value}
      </div>
      {sub && (
        <div style={{ fontSize: 9, fontFamily: 'Rajdhani, sans-serif', color: '#4F5568', marginTop: 2 }}>
          {sub}
        </div>
      )}
    </div>
  )
}
