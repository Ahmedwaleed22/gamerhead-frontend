'use client'

import { useState, useEffect, useRef } from 'react'

interface CrateItem {
  label: string
  type: string
  amount?: number
}

interface Props {
  items: CrateItem[]       // pool of possible items (for the animation strip)
  wonItem: CrateItem       // the actual result
  onClose: () => void
  rewardLabel: string      // e.g. "Token Crate Tier I"
}

const ITEM_WIDTH = 120
const VISIBLE_COUNT = 7
const STRIP_WIDTH = ITEM_WIDTH * VISIBLE_COUNT

// Item type → color mapping
function itemColor(type: string): string {
  switch (type) {
    case 'tokens':  return '#F0AA1A'
    case 'money':   return '#4ade80'
    case 'merch':   return '#9B59B6'
    case 'xpBoost': return '#3498DB'
    case 'nothing': return '#4A5568'
    default:        return '#9CA3AF'
  }
}

function itemIcon(type: string): string {
  switch (type) {
    case 'tokens':  return '🎫'
    case 'money':   return '💰'
    case 'merch':   return '👕'
    case 'xpBoost': return '⚡'
    case 'nothing': return '✖'
    default:        return '📦'
  }
}

export default function CrateOpening({ items, wonItem, onClose, rewardLabel }: Props) {
  const [phase, setPhase] = useState<'spinning' | 'won'>('spinning')
  const stripRef = useRef<HTMLDivElement>(null)

  // Build a long strip of items with the won item placed near the end
  const totalItems = 40
  const winIndex = totalItems - 4 // Place the winning item near the end
  const strip: CrateItem[] = []
  const pool = items.length > 0 ? items : [wonItem]

  for (let i = 0; i < totalItems; i++) {
    if (i === winIndex) {
      strip.push(wonItem)
    } else {
      strip.push(pool[Math.floor(Math.random() * pool.length)])
    }
  }

  // Target offset: center the winning item in the viewport
  const targetOffset = (winIndex * ITEM_WIDTH) - (STRIP_WIDTH / 2) + (ITEM_WIDTH / 2)

  useEffect(() => {
    const el = stripRef.current
    if (!el) return

    // Start from 0, animate to target
    el.style.transition = 'none'
    el.style.transform = 'translateX(0px)'

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        el.style.transition = 'transform 4s cubic-bezier(0.15, 0.85, 0.25, 1)'
        el.style.transform = `translateX(-${targetOffset}px)`
      })
    })

    const timer = setTimeout(() => setPhase('won'), 4200)
    return () => clearTimeout(timer)
  }, [targetOffset])

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999,
      background: 'rgba(0,0,0,0.85)',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      fontFamily: 'Roboto, sans-serif',
    }}>
      {/* Title */}
      <div style={{ color: '#fff', fontSize: 18, fontWeight: 700, marginBottom: 8, letterSpacing: 1 }}>
        {rewardLabel}
      </div>
      <div style={{ color: '#6B7280', fontSize: 12, marginBottom: 24 }}>
        {phase === 'spinning' ? 'Opening...' : 'Result!'}
      </div>

      {/* Crate strip viewport */}
      <div style={{
        width: STRIP_WIDTH, height: 110, overflow: 'hidden',
        borderRadius: 8, position: 'relative',
        background: '#111118', border: '1px solid #2A2A35',
      }}>
        {/* Center marker */}
        <div style={{
          position: 'absolute', top: 0, bottom: 0,
          left: '50%', transform: 'translateX(-50%)',
          width: 2, background: '#E74C3C', zIndex: 2,
        }} />
        <div style={{
          position: 'absolute', top: -6, left: '50%', transform: 'translateX(-50%)',
          width: 0, height: 0, borderLeft: '6px solid transparent', borderRight: '6px solid transparent',
          borderTop: '6px solid #E74C3C', zIndex: 2,
        }} />

        {/* Scrolling strip */}
        <div ref={stripRef} style={{ display: 'flex', willChange: 'transform' }}>
          {strip.map((item, i) => {
            const isWinner = i === winIndex && phase === 'won'
            const clr = itemColor(item.type)
            return (
              <div key={i} style={{
                width: ITEM_WIDTH, height: 110, flexShrink: 0,
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                borderRight: '1px solid #1F1F2A',
                background: isWinner ? `${clr}22` : 'transparent',
                transition: 'background 0.3s',
              }}>
                <div style={{ fontSize: 28 }}>{itemIcon(item.type)}</div>
                <div style={{
                  fontSize: 11, fontWeight: 700, color: clr,
                  marginTop: 6, textAlign: 'center', padding: '0 4px',
                  lineHeight: 1.2,
                }}>
                  {item.label}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Won item reveal */}
      {phase === 'won' && (
        <div style={{
          marginTop: 28, textAlign: 'center',
          animation: 'fadeIn 0.4s ease-out',
        }}>
          <div style={{ fontSize: 48 }}>{itemIcon(wonItem.type)}</div>
          <div style={{
            fontSize: 20, fontWeight: 800, color: itemColor(wonItem.type),
            marginTop: 8,
          }}>
            {wonItem.label}
          </div>
          {wonItem.type === 'nothing' && (
            <div style={{ fontSize: 13, color: '#6B7280', marginTop: 4 }}>Better luck next time!</div>
          )}
          <button
            onClick={onClose}
            style={{
              marginTop: 20, padding: '10px 32px', borderRadius: 8,
              background: '#E74C3C', color: '#fff', border: 'none',
              fontSize: 13, fontWeight: 700, cursor: 'pointer',
            }}
          >
            Continue
          </button>
        </div>
      )}

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  )
}
