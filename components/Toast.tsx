'use client'

import { createContext, useCallback, useContext, useRef, useState } from 'react'
import { Icon } from '@iconify/react'
import { Solar } from '@/lib/solar-duotone'

// ─── Types ────────────────────────────────────────────────────────────────────
type ToastType = 'success' | 'error' | 'info'

interface ToastItem {
  id:      number
  message: string
  type:    ToastType
}

interface ToastContextValue {
  toast: (message: string, type?: ToastType) => void
}

// ─── Context ──────────────────────────────────────────────────────────────────
const ToastContext = createContext<ToastContextValue>({ toast: () => {} })

export function useToast() {
  return useContext(ToastContext)
}

// ─── Provider ─────────────────────────────────────────────────────────────────
export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([])
  const counter = useRef(0)

  const toast = useCallback((message: string, type: ToastType = 'info') => {
    const id = ++counter.current
    setToasts(prev => [...prev, { id, message, type }])
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id))
    }, 4000)
  }, [])

  const dismiss = (id: number) => setToasts(prev => prev.filter(t => t.id !== id))

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}

      {/* ── Toast container ── */}
      <div style={{
        position:      'fixed',
        bottom:        28,
        left:          '50%',
        transform:     'translateX(-50%)',
        display:       'flex',
        flexDirection: 'column',
        alignItems:    'center',
        gap:           10,
        zIndex:        99999,
        pointerEvents: 'none',
      }}>
        {toasts.map(t => {
          const isSuccess = t.type === 'success'
          const isError   = t.type === 'error'
          const accent    = isSuccess ? '#4ade80' : isError ? '#E74C3C' : '#60A5FA'
          const bg        = isSuccess
            ? 'rgba(74,222,128,0.07)'
            : isError
            ? 'rgba(231,76,60,0.08)'
            : 'rgba(96,165,250,0.07)'

          return (
            <div
              key={t.id}
              style={{
                pointerEvents:   'auto',
                display:         'flex',
                alignItems:      'center',
                gap:             10,
                background:      '#1a1a22',
                border:          `1px solid ${accent}33`,
                borderLeft:      `3px solid ${accent}`,
                borderRadius:    8,
                padding:         '11px 18px 11px 14px',
                boxShadow:       `0 8px 32px rgba(0,0,0,0.55), 0 0 0 1px rgba(255,255,255,0.04)`,
                backdropFilter:  'blur(8px)',
                minWidth:        260,
                maxWidth:        420,
                cursor:          'pointer',
                animation:       'toast-in 0.22s ease',
              }}
              onClick={() => dismiss(t.id)}
            >
              {/* Icon */}
              <div style={{
                width:           28,
                height:          28,
                borderRadius:    '50%',
                background:      bg,
                display:         'flex',
                alignItems:      'center',
                justifyContent:  'center',
                flexShrink:      0,
              }}>
                <Icon
                  icon={isSuccess ? Solar.check : isError ? Solar.close : Solar.info}
                  width={15}
                  height={15}
                  style={{ color: accent }}
                />
              </div>

              {/* Message */}
              <span style={{
                fontFamily: 'var(--font-sans, sans-serif)',
                fontSize:   13,
                fontWeight: 600,
                color:      '#e5e7eb',
                flex:       1,
                lineHeight: 1.4,
              }}>
                {t.message}
              </span>

              {/* Dismiss × */}
              <div style={{ color: '#4B5563', fontSize: 14, lineHeight: 1, flexShrink: 0 }}>✕</div>
            </div>
          )
        })}
      </div>

      <style>{`
        @keyframes toast-in {
          from { opacity: 0; transform: translateY(12px) scale(0.97); }
          to   { opacity: 1; transform: translateY(0)    scale(1); }
        }
      `}</style>
    </ToastContext.Provider>
  )
}
