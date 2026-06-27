'use client'

import React, { useEffect, useState } from 'react'
import { Icon } from '@iconify/react'
import { Solar } from '@/lib/solar-duotone'
import { useAuth } from '@/lib/auth-context'

type TabKey = 'violations' | 'appeals'

// Account standing is modelled as HP: a clean record = full health.
const VIOLATIONS = 0
const APPEALS = 0
const HP = Math.max(0, 100 - VIOLATIONS * 20)

const ACCESS = [
  { icon: Solar.trophy, name: 'Tournament entry' },
  { icon: Solar.target, name: 'Ranked matchmaking' },
  { icon: Solar.cart, name: 'Store & marketplace' },
  { icon: Solar.coin, name: 'Wallet withdrawals' },
]

const FACTORS = [
  { icon: Solar.handshake, name: 'Fair play', status: 'Clear' },
  { icon: Solar.bill, name: 'Payment standing', status: 'Clear' },
  { icon: Solar.chat, name: 'Community conduct', status: 'Clear' },
  { icon: Solar.check, name: 'Identity verified', status: 'Verified' },
]

const EMPTY: Record<TabKey, { icon: string; title: string; sub: string }> = {
  violations: {
    icon: Solar.shield,
    title: 'No violations on record',
    sub: 'Your account has a clean history. Keep competing fair and your record stays spotless.',
  },
  appeals: {
    icon: Solar.clipboard,
    title: 'No appeals submitted',
    sub: 'If an enforcement action is ever taken, the appeals you file will be tracked here.',
  },
}

export default function HealthDashboard() {
  const { user } = useAuth()
  const [avatarFailed, setAvatarFailed] = useState(false)
  const [tab, setTab] = useState<TabKey>('violations')
  const [fill, setFill] = useState(0)
  const [pct, setPct] = useState(0)

  const initials = (user?.username || 'GH').slice(0, 2).toUpperCase()
  const showImg = user?.avatarUrl && !avatarFailed

  // Orchestrated load: the HP bar charges up and the readout counts to full.
  useEffect(() => {
    const reduce =
      typeof window !== 'undefined' &&
      window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    if (reduce) {
      setFill(HP)
      setPct(HP)
      return
    }
    const t = setTimeout(() => setFill(HP), 80)
    const start = performance.now()
    const dur = 1150
    let raf = 0
    const step = (now: number) => {
      const k = Math.min(1, (now - start) / dur)
      const eased = 1 - Math.pow(1 - k, 3)
      setPct(Math.round(eased * HP))
      if (k < 1) raf = requestAnimationFrame(step)
    }
    raf = requestAnimationFrame(step)
    return () => {
      clearTimeout(t)
      cancelAnimationFrame(raf)
    }
  }, [])

  const empty = EMPTY[tab]

  return (
    <div className="ah">
      {/* Header */}
      <div className="ah-head">
        <div>
          <span className="ah-eyebrow">Trust &amp; Safety</span>
          <h1 className="ah-title">
            Account <span>Health</span>
          </h1>
          <p className="ah-sub">
            Track your standing, platform access and enforcement history across{' '}
            <span>GamerHead</span>.
          </p>
        </div>
        <span className="ah-status-pill">
          <span className="ah-status-dot" />
          All systems nominal
        </span>
      </div>

      {/* Hero — player clearance + HP bar */}
      <section className="ah-hero">
        <div className="ah-hero-grid">
          <div className="ah-id">
            {showImg ? (
              <img
                className="ah-avatar"
                src={user!.avatarUrl as string}
                alt={user?.username || 'Player'}
                onError={() => setAvatarFailed(true)}
              />
            ) : (
              <span className="ah-avatar">{initials}</span>
            )}
            <div>
              <div className="ah-id-tag">{user?.username || 'Player'}</div>
              <div className="ah-id-meta">
                <span>Clearance</span>
                <span className="ah-id-sep">/</span>
                <b>Full access</b>
                {typeof user?.level === 'number' && (
                  <>
                    <span className="ah-id-sep">/</span>
                    <span>Lv.{user.level}</span>
                  </>
                )}
              </div>
            </div>
          </div>

          <div>
            <div className="ah-hp-top">
              <span className="ah-hp-label">Account health</span>
              <span className="ah-hp-read">
                <span className="ah-hp-pct">{pct}%</span>
                <span className="ah-hp-word">Full health</span>
              </span>
            </div>
            <div className="ah-hp-bar">
              <div className="ah-hp-fill" style={{ width: `${fill}%` }} />
            </div>
          </div>
        </div>

        <div className="ah-chips">
          <span className="ah-chip">
            <span className="ah-ic">
              <Icon icon={Solar.shield} width={16} height={16} />
            </span>
            Full platform access
          </span>
          <span className="ah-chip">
            <span className="ah-ic">
              <Icon icon={Solar.check} width={16} height={16} />
            </span>
            No active sanctions
          </span>
          <span className="ah-chip">
            <span className="ah-ic">
              <Icon icon={Solar.medal} width={16} height={16} />
            </span>
            Trusted competitor
          </span>
        </div>
      </section>

      {/* Two-up: what's unlocked + trust factors */}
      <div className="ah-grid2">
        <div className="ah-card">
          <div className="ah-card-head">
            <span className="ah-card-ic">
              <Icon icon={Solar.bolt} width={18} height={18} />
            </span>
            <span className="ah-card-title">Platform access</span>
          </div>
          {ACCESS.map((a) => (
            <div className="ah-row" key={a.name}>
              <span className="ah-row-l">
                <span className="ah-row-ic">
                  <Icon icon={Solar.check} width={18} height={18} />
                </span>
                <span className="ah-row-name">{a.name}</span>
              </span>
              <span className="ah-row-st">Unlocked</span>
            </div>
          ))}
        </div>

        <div className="ah-card">
          <div className="ah-card-head">
            <span className="ah-card-ic">
              <Icon icon={Solar.medal} width={18} height={18} />
            </span>
            <span className="ah-card-title">Trust factors</span>
          </div>
          {FACTORS.map((f) => (
            <div className="ah-row" key={f.name}>
              <span className="ah-row-l">
                <span className="ah-row-ic">
                  <Icon icon={f.icon} width={18} height={18} />
                </span>
                <span className="ah-row-name">{f.name}</span>
              </span>
              <span className="ah-row-st">{f.status}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Enforcement log */}
      <section className="ah-log">
        <div className="ah-log-head">
          <h2 className="ah-log-title">Enforcement log</h2>
          <div className="ah-tabs">
            <button
              className={`ah-tab${tab === 'violations' ? ' active' : ''}`}
              onClick={() => setTab('violations')}
            >
              Policy violations
              <span className="ah-tab-count">{VIOLATIONS}</span>
            </button>
            <button
              className={`ah-tab${tab === 'appeals' ? ' active' : ''}`}
              onClick={() => setTab('appeals')}
            >
              Submitted appeals
              <span className="ah-tab-count">{APPEALS}</span>
            </button>
          </div>
        </div>

        <div className="ah-empty">
          <span className="ah-empty-badge">
            <Icon icon={empty.icon} width={30} height={30} />
          </span>
          <h3 className="ah-empty-title">{empty.title}</h3>
          <p className="ah-empty-sub">{empty.sub}</p>
        </div>
      </section>
    </div>
  )
}
