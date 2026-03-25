'use client'

import { Icon } from '@iconify/react'

function isIconifyId(icon: string) {
  return /^[a-z0-9]+:/i.test(icon)
}

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
      padding: '18px 20px', display: 'flex', flexDirection: 'column', gap: 6,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        {isIconifyId(icon) ? <Icon icon={icon} width={22} height={22} style={{ flexShrink: 0 }} /> : <span style={{ fontSize: 20 }}>{icon}</span>}
        <span style={{ fontSize: 13, fontWeight: 700, color: '#4F5568', textTransform: 'uppercase', letterSpacing: .8 }}>
          {label}
        </span>
      </div>
      <div style={{ fontWeight: 900, fontSize: 30, color, lineHeight: 1 }}>
        {value}
      </div>
      {sub && (
        <div style={{ fontSize: 13, color: '#4F5568', marginTop: 2 }}>
          {sub}
        </div>
      )}
    </div>
  )
}
