'use client'

interface ModalProps {
  title: string
  subtitle?: string
  children: React.ReactNode
  onClose: () => void
  width?: number
}

export default function Modal({ title, subtitle, children, onClose, width = 480 }: ModalProps) {
  return (
    <div
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}
      onClick={onClose}
    >
      <div onClick={e => e.stopPropagation()} style={{ background: '#13131E', border: '1px solid rgba(255,255,255,.1)', borderRadius: 12, padding: 28, width: '100%', maxWidth: width || '90vw', maxHeight: '85vh', overflowY: 'auto', position: 'relative' }}>
        <button
          onClick={onClose}
          style={{ position: 'absolute', top: 16, right: 16, width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 6, cursor: 'pointer', color: '#8890A4', fontSize: 14, lineHeight: 1 }}
        >
          ✕
        </button>
        <div style={{ fontWeight: 700, fontSize: 24, color: '#fff', marginBottom: subtitle ? 4 : 18, paddingRight: 36 }}>
          {title}
        </div>
        {subtitle && (
          <div style={{ fontSize: 13, color: '#4F5568', marginBottom: 18 }}>
            {subtitle}
          </div>
        )}
        {children}
      </div>
    </div>
  )
}
