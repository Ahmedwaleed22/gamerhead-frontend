'use client'

import { useState } from 'react'
import Link from 'next/link'

/* ─── TYPES ─────────────────────────────────────────── */
interface Role {
  id: string
  title: string
  level: 'supervisor' | 'specialist'
  description: string
  responsibilities: string[]
  requirements: string[]
  perks: string[]
  openings: number
}

interface Department {
  id: string
  name: string
  icon: string
  accent: string
  tagline: string
  overview: string
  roles: Role[]
}

/* ─── DATA ──────────────────────────────────────────── */
const DEPARTMENTS: Department[] = [
  {
    id: 'community',
    name: 'Community Support',
    icon: '💬',
    accent: '#4ADE80',
    tagline: 'Keep the community thriving',
    overview:
      'The front line of everything social on GamerHead. Community Support runs the Discord server and the forums — welcoming new members, keeping discussions healthy, and making sure no question goes unanswered. If you love gaming culture and you\'re great with people, this is your team.',
    roles: [
      {
        id: 'cs-supervisor',
        title: 'Community Support Supervisor',
        level: 'supervisor',
        description: 'You lead the Community Support team. You set the tone, train specialists, handle escalations, and report directly to platform leadership.',
        responsibilities: [
          'Oversee Discord & Forum moderation day-to-day',
          'Onboard and train new Community Support Specialists',
          'Set and enforce community guidelines and conduct standards',
          'Handle escalated member issues and appeals',
          'Deliver weekly summaries to platform leadership',
          'Coordinate community events and engagement campaigns',
        ],
        requirements: [
          'Prior Discord moderation experience (1,000+ member server preferred)',
          'Strong written communication and conflict de-escalation skills',
          'Available minimum 20 hrs/week with a consistent schedule',
          'Familiarity with competitive gaming culture and terminology',
          'Leadership or team management background a plus',
        ],
        perks: ['Monthly platform tickets', 'Staff badge + verified role', 'Direct line to leadership', 'Early access to platform features'],
        openings: 1,
      },
      {
        id: 'cs-discord',
        title: 'Discord Support Specialist',
        level: 'specialist',
        description: 'You keep the GamerHead Discord running smoothly — welcoming members, answering questions, and escalating anything that needs a supervisor.',
        responsibilities: [
          'Monitor and moderate all Discord channels daily',
          'Welcome new members and guide them through onboarding',
          'Answer platform questions and point users to the right resources',
          'Enforce server rules — warnings, mutes, and escalations as needed',
          'Escalate complex violations to the CS Supervisor',
          'Participate in community events and voice channels',
        ],
        requirements: [
          'Active Discord user comfortable with moderation tools and bots',
          'Patient, level-headed communication style',
          'Available minimum 15 hrs/week',
          'Genuine interest in gaming and community building',
        ],
        perks: ['Monthly platform tickets', 'Staff badge + Discord role', 'Staff channel access'],
        openings: 3,
      },
      {
        id: 'cs-forum',
        title: 'Forum Support Specialist',
        level: 'specialist',
        description: 'You manage the GamerHead forums — keeping threads organized, discussions healthy, and making sure every post that deserves a reply gets one.',
        responsibilities: [
          'Monitor forum sections for rule violations and spam daily',
          'Respond to unanswered posts and redirect to correct sections',
          'Pin and organize important community threads',
          'Flag constructive feature suggestions up to leadership',
          'Engage in game dev, creative, and collaboration threads',
          'Escalate moderation issues to CS Supervisor',
        ],
        requirements: [
          'Experience participating in online forums or communities',
          'Strong reading comprehension and written communication',
          'Available minimum 10 hrs/week',
          'Interest in game development, esports, or creative gaming content a plus',
        ],
        perks: ['Monthly platform tickets', 'Staff badge', 'Forum moderator tools access'],
        openings: 2,
      },
    ],
  },
  {
    id: 'live',
    name: 'Live Support',
    icon: '⚡',
    accent: '#F0AA1A',
    tagline: 'Real-time. High stakes.',
    overview:
      'Live Support handles everything happening right now. Active cash matches, live chat queues, real-time player issues. This team moves fast, stays calm under pressure, and never misses a call. If you thrive in fast-paced environments and know competitive gaming inside out — this is where you belong.',
    roles: [
      {
        id: 'ls-supervisor',
        title: 'Live Support Supervisor',
        level: 'supervisor',
        description: 'You run the Live Support operation — shift scheduling, escalated match reviews, queue monitoring, and keeping the team performing at the highest level during peak hours.',
        responsibilities: [
          'Schedule and coordinate Live Support Specialist shifts',
          'Review and resolve escalated cash match issues',
          'Maintain response-time standards across live chat queues',
          'Monitor match verification calls and flag anomalies',
          'Report live support metrics and incidents to leadership',
          'Train new LS Specialists on platform tools and protocols',
        ],
        requirements: [
          'Experience in customer support operations or team management',
          'Comfortable working with real-money transactions and high-stakes disputes',
          'Available during peak hours — evenings and weekends essential',
          'Decisive, calm under pressure, and detail-oriented',
          'Solid knowledge of competitive gaming and wager match formats',
        ],
        perks: ['Monthly tickets + bonus eligibility', 'Staff badge', 'Supervisor tools access', 'Direct leadership contact'],
        openings: 1,
      },
      {
        id: 'ls-match',
        title: 'Cash Match Support Specialist',
        level: 'specialist',
        description: 'You\'re the on-call responder for active cash wager matches. Technical issue, suspicious activity, score discrepancy mid-match — you\'re the first one in.',
        responsibilities: [
          'Monitor the active cash match queue in real time',
          'Respond to mid-match support requests within SLA timeframe',
          'Verify match results flagged by players',
          'Pause payouts when a dispute is detected and document findings',
          'Escalate to LS Supervisor or Ticket Support when needed',
          'Communicate clearly and fairly with all parties throughout',
        ],
        requirements: [
          'Solid understanding of wager match and payout systems',
          'Fast and comfortable with multi-window monitoring setups',
          'Available minimum 15 hrs/week — peak hour shifts preferred',
          'Calm and impartial when handling conflicting player accounts',
        ],
        perks: ['Monthly platform tickets', 'Staff badge', 'Priority queue tools access'],
        openings: 4,
      },
      {
        id: 'ls-chat',
        title: 'Live Chat Support Specialist',
        level: 'specialist',
        description: 'You handle live chat sessions — the first real human a player speaks to when they need help right now. Account issues, match questions, platform navigation — you\'ve got it.',
        responsibilities: [
          'Handle incoming live chat support sessions in real time',
          'Diagnose and resolve tier-1 account and platform issues',
          'Guide players through match entry, payouts, and settings',
          'Collect and document reported bugs and platform issues',
          'Escalate beyond tier-1 to the LS Supervisor',
          'Maintain a professional and helpful tone in every interaction',
        ],
        requirements: [
          'Previous chat support or customer service experience preferred',
          'Fast and accurate typist — speed matters here',
          'Strong working knowledge of the GamerHead platform',
          'Available for scheduled shifts — consistency is required',
        ],
        perks: ['Monthly platform tickets', 'Staff badge', 'Internal tools access'],
        openings: 3,
      },
    ],
  },
  {
    id: 'ticket',
    name: 'Ticket Support',
    icon: '🎫',
    accent: '#60A5FA',
    tagline: 'Every dispute gets a fair hearing',
    overview:
      'Ticket Support is where fair play gets enforced. Match disputes, payment discrepancies, ban appeals, conduct violations — everything requiring a real investigation and a defensible decision. This team is methodical, impartial, and thorough. If you have a sharp eye for evidence and a sense of fairness that doesn\'t bend under pressure — this is your home.',
    roles: [
      {
        id: 'ts-supervisor',
        title: 'Ticket Support Supervisor',
        level: 'supervisor',
        description: 'You lead the Ticket Support team — reviewing final rulings on escalated cases, maintaining quality standards, and making sure every decision is consistent, fair, and documented.',
        responsibilities: [
          'Review and approve final rulings on escalated match disputes',
          'Oversee all ban appeals and conduct violation cases',
          'Maintain case documentation standards and audit trails',
          'Train TS Specialists on evidence review and decision-making',
          'Identify recurring dispute patterns and recommend platform improvements',
          'Report dispute metrics and case outcomes to leadership',
        ],
        requirements: [
          'Strong analytical and decision-making skills',
          'Experience in moderation, compliance, or dispute resolution',
          'Able to review evidence impartially and document findings clearly',
          'High standards for consistency — every case gets the same treatment',
          'Available minimum 20 hrs/week with a reliable schedule',
        ],
        perks: ['Monthly tickets + bonus eligibility', 'Staff badge', 'Case management access', 'Direct leadership line'],
        openings: 1,
      },
      {
        id: 'ts-match',
        title: 'Match Dispute Specialist',
        level: 'specialist',
        description: 'You review submitted match dispute tickets — examining evidence from both sides, applying platform rules, and delivering a clear, fair ruling.',
        responsibilities: [
          'Review incoming match dispute tickets in priority order',
          'Request and evaluate evidence from both parties (screenshots, clips)',
          'Apply platform rules to determine the correct outcome',
          'Communicate rulings clearly and professionally to all parties',
          'Escalate complex or high-value disputes to TS Supervisor',
          'Maintain detailed case notes for every ticket handled',
        ],
        requirements: [
          'Methodical, detail-oriented approach to problem solving',
          'Ability to review conflicting accounts and determine most likely truth',
          'Familiarity with competitive gaming and common match dispute scenarios',
          'Available minimum 15 hrs/week',
          'Strong written communication — rulings must be clear and defensible',
        ],
        perks: ['Monthly platform tickets', 'Staff badge', 'Ticket system access'],
        openings: 3,
      },
      {
        id: 'ts-general',
        title: 'General Disputes Specialist',
        level: 'specialist',
        description: 'You handle everything outside of match disputes — payment discrepancies, account issues, conduct reports, and ban appeals. Anything in the queue that needs a thorough, fair review.',
        responsibilities: [
          'Triage and respond to general support tickets within SLA',
          'Investigate payment and payout discrepancies with full documentation',
          'Review conduct violation reports and issue appropriate actions',
          'Process ban appeals with fairness and clearly reasoned decisions',
          'Coordinate with Live Support on tickets originating from live chat',
          'Escalate unresolved or edge-case tickets to TS Supervisor',
        ],
        requirements: [
          'Patient, thorough, and fair when handling sensitive user issues',
          'Comfortable reviewing financial transaction records',
          'Strong written communication for ticket responses',
          'Available minimum 15 hrs/week',
          'Prior support, moderation, or dispute-handling experience preferred',
        ],
        perks: ['Monthly platform tickets', 'Staff badge', 'Admin tools access'],
        openings: 2,
      },
    ],
  },
]

const TOTAL_OPENINGS = DEPARTMENTS.reduce((sum, d) => sum + d.roles.reduce((s, r) => s + r.openings, 0), 0)

/* ─── PAGE ──────────────────────────────────────────── */
export default function CareersPage() {
  const [activeDept, setActiveDept] = useState('community')
  const [expandedRole, setExpandedRole] = useState<string | null>(null)
  const [applyRole, setApplyRole] = useState<{ role: Role; dept: Department } | null>(null)

  const dept = DEPARTMENTS.find(d => d.id === activeDept)!

  return (
    <div style={{ background: 'var(--bg-1)', minHeight: '100vh' }}>

      {/* ── HERO ─────────────────────────────────────── */}
      <section style={{
        position: 'relative', overflow: 'hidden',
        background: 'linear-gradient(155deg, #0a0a0c 0%, #090c16 55%, #0a0a0c 100%)',
        borderBottom: '1px solid var(--border)',
        padding: '80px 0 64px',
      }}>
        <div style={{
          position: 'absolute', inset: 0, pointerEvents: 'none',
          backgroundImage: `
            repeating-linear-gradient(0deg, transparent, transparent 64px, rgba(232,0,13,0.025) 64px, rgba(232,0,13,0.025) 65px),
            repeating-linear-gradient(90deg, transparent, transparent 64px, rgba(232,0,13,0.025) 64px, rgba(232,0,13,0.025) 65px)`,
        }} />
        <div style={{
          position: 'absolute', top: -60, right: '8%',
          width: 500, height: 400,
          background: 'radial-gradient(ellipse, rgba(232,0,13,0.07) 0%, transparent 65%)',
          pointerEvents: 'none',
        }} />
        <div style={{
          position: 'absolute', right: -20, bottom: -50,
          fontFamily: "'Barlow Condensed', sans-serif",
          fontWeight: 900, fontSize: 200, letterSpacing: '-10px',
          color: 'rgba(255,255,255,0.018)', lineHeight: 1,
          pointerEvents: 'none', userSelect: 'none',
        }}>CAREERS</div>

        <div className="container" style={{ position: 'relative', zIndex: 2 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: 36 }}>
            <div style={{ maxWidth: 560 }}>
              <div style={{
                display: 'inline-flex', alignItems: 'center', gap: 8,
                background: 'rgba(232,0,13,0.1)', border: '1px solid rgba(232,0,13,0.25)',
                borderRadius: 20, padding: '4px 14px', marginBottom: 22,
                fontSize: 11, fontWeight: 700, letterSpacing: '0.1em',
                textTransform: 'uppercase', color: 'var(--red)',
              }}>
                <span style={{ width: 5, height: 5, background: 'var(--red)', borderRadius: '50%' }} />
                {TOTAL_OPENINGS} Open Positions
              </div>
              <h1 style={{
                fontFamily: "'Barlow Condensed', sans-serif",
                fontSize: 'clamp(52px, 7vw, 84px)',
                fontWeight: 900, lineHeight: 0.93,
                textTransform: 'uppercase',
                letterSpacing: '-1px', color: '#fff', marginBottom: 22,
              }}>
                BUILD<br /><span style={{ color: 'var(--red)' }}>WITH US.</span>
              </h1>
              <p style={{ fontSize: 15, lineHeight: 1.8, color: 'rgba(255,255,255,0.5)', maxWidth: 500 }}>
                GamerHead is growing and we need real people who care about gaming,
                community, and getting things right. Every role here matters — because
                every experience a player has runs through this team.
              </p>
            </div>

            {/* Dept selector — right side */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {DEPARTMENTS.map(d => (
                <button
                  key={d.id}
                  onClick={() => { setActiveDept(d.id); setExpandedRole(null) }}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 12,
                    background: activeDept === d.id ? d.accent + '12' : 'rgba(255,255,255,0.03)',
                    border: `1px solid ${activeDept === d.id ? d.accent + '45' : 'rgba(255,255,255,0.07)'}`,
                    borderRadius: 8, padding: '12px 18px', minWidth: 240,
                    cursor: 'pointer', fontFamily: "'Barlow', sans-serif",
                    transition: 'all 0.18s', textAlign: 'left',
                  }}
                  onMouseEnter={e => { if (activeDept !== d.id) e.currentTarget.style.borderColor = d.accent + '30' }}
                  onMouseLeave={e => { if (activeDept !== d.id) e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)' }}
                >
                  <span style={{ fontSize: 22 }}>{d.icon}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{
                      fontFamily: "'Barlow Condensed', sans-serif",
                      fontWeight: 800, fontSize: 14, textTransform: 'uppercase',
                      letterSpacing: '0.04em',
                      color: activeDept === d.id ? d.accent : '#fff',
                    }}>{d.name}</div>
                    <div style={{ fontSize: 10, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.06em', marginTop: 1 }}>
                      {d.roles.reduce((s, r) => s + r.openings, 0)} openings · {d.roles.length} roles
                    </div>
                  </div>
                  {activeDept === d.id && (
                    <div style={{ width: 6, height: 6, background: d.accent, borderRadius: '50%', boxShadow: `0 0 8px ${d.accent}` }} />
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── DEPT CONTENT ─────────────────────────────── */}
      <div className="container" style={{ padding: '48px 24px 80px' }}>

        {/* Dept banner */}
        <div style={{
          background: `linear-gradient(135deg, ${dept.accent}08, var(--bg-2))`,
          border: `1px solid ${dept.accent}28`,
          borderRadius: 12, padding: '26px 30px', marginBottom: 24,
          display: 'grid', gridTemplateColumns: '1fr auto', gap: 28, alignItems: 'center',
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
              <div style={{
                width: 44, height: 44, background: dept.accent + '18',
                border: `1px solid ${dept.accent}35`, borderRadius: 10,
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22,
              }}>{dept.icon}</div>
              <div>
                <div style={{
                  fontFamily: "'Barlow Condensed', sans-serif",
                  fontWeight: 900, fontSize: 22, textTransform: 'uppercase',
                  color: '#fff', letterSpacing: '0.03em',
                }}>{dept.name}</div>
                <div style={{ fontSize: 12, color: dept.accent, fontWeight: 700, marginTop: 1 }}>{dept.tagline}</div>
              </div>
            </div>
            <p style={{ fontSize: 13, lineHeight: 1.78, color: 'var(--text-muted)', margin: 0, maxWidth: 640 }}>{dept.overview}</p>
          </div>

          {/* Hierarchy */}
          <div style={{
            background: 'var(--bg-3)', border: '1px solid var(--border)',
            borderRadius: 10, padding: '16px 22px',
            display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0,
          }}>
            <div style={{
              fontFamily: "'Rajdhani', sans-serif", fontWeight: 700,
              fontSize: 9, letterSpacing: '0.14em', textTransform: 'uppercase',
              color: 'var(--text-dim)', marginBottom: 10,
            }}>Chain of Command</div>
            <div style={{
              background: dept.accent + '18', border: `1px solid ${dept.accent}35`,
              borderRadius: 6, padding: '5px 14px',
              fontFamily: "'Barlow Condensed', sans-serif",
              fontWeight: 800, fontSize: 11, textTransform: 'uppercase',
              color: dept.accent, letterSpacing: '0.06em', whiteSpace: 'nowrap',
            }}>Supervisor</div>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', margin: '4px 0' }}>
              <div style={{ width: 1, height: 8, background: 'var(--border)' }} />
              <span style={{ color: 'var(--text-dim)', fontSize: 9 }}>▼</span>
              <div style={{ width: 1, height: 8, background: 'var(--border)' }} />
            </div>
            <div style={{
              background: 'var(--bg-4)', border: '1px solid var(--border)',
              borderRadius: 6, padding: '5px 14px',
              fontFamily: "'Barlow Condensed', sans-serif",
              fontWeight: 700, fontSize: 11, textTransform: 'uppercase',
              color: 'var(--text-muted)', letterSpacing: '0.06em', whiteSpace: 'nowrap',
            }}>Specialists</div>
          </div>
        </div>

        {/* Role cards */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {dept.roles.map(role => (
            <RoleCard
              key={role.id}
              role={role}
              accent={dept.accent}
              expanded={expandedRole === role.id}
              onToggle={() => setExpandedRole(expandedRole === role.id ? null : role.id)}
              onApply={() => setApplyRole({ role, dept })}
            />
          ))}
        </div>

        {/* Bottom note */}
        <div style={{
          marginTop: 44,
          background: 'linear-gradient(135deg, rgba(232,0,13,0.04), var(--bg-2))',
          border: '1px dashed rgba(232,0,13,0.18)',
          borderRadius: 12, padding: '28px 32px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 20, flexWrap: 'wrap',
        }}>
          <div>
            <div style={{
              fontFamily: "'Barlow Condensed', sans-serif",
              fontWeight: 900, fontSize: 20, color: '#fff', textTransform: 'uppercase', marginBottom: 5,
            }}>Don't see the right fit?</div>
            <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: 0, lineHeight: 1.6 }}>
              We're always open to passionate people. Reach out and tell us what you bring to the table.
            </p>
          </div>
          <Link href="/contact" style={{
            background: 'transparent', color: 'var(--red)',
            border: '1px solid rgba(232,0,13,0.28)',
            padding: '10px 22px', borderRadius: 6,
            fontWeight: 700, fontSize: 12,
            letterSpacing: '0.08em', textTransform: 'uppercase',
            textDecoration: 'none', whiteSpace: 'nowrap',
          }}>Contact Us →</Link>
        </div>
      </div>

      {/* ── APPLICATION MODAL ─────────────────────────── */}
      {applyRole && (
        <ApplyModal
          role={applyRole.role}
          dept={applyRole.dept}
          onClose={() => setApplyRole(null)}
        />
      )}
    </div>
  )
}

/* ─── ROLE CARD ─────────────────────────────────────── */
function RoleCard({ role, accent, expanded, onToggle, onApply }: {
  role: Role; accent: string; expanded: boolean
  onToggle: () => void; onApply: () => void
}) {
  return (
    <div style={{
      background: 'var(--bg-2)',
      border: `1px solid ${expanded ? accent + '38' : 'var(--border)'}`,
      borderRadius: 12, overflow: 'hidden', transition: 'border-color 0.2s',
    }}>
      <div
        onClick={onToggle}
        style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '20px 24px', cursor: 'pointer', userSelect: 'none' }}
      >
        <div style={{
          width: 42, height: 42, borderRadius: 8, flexShrink: 0,
          background: role.level === 'supervisor' ? accent + '20' : 'var(--bg-4)',
          border: `1px solid ${role.level === 'supervisor' ? accent + '40' : 'var(--border)'}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18,
        }}>
          {role.level === 'supervisor' ? '👑' : '⚙️'}
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 3 }}>
            <span style={{
              fontFamily: "'Barlow Condensed', sans-serif",
              fontWeight: 800, fontSize: 18, textTransform: 'uppercase',
              color: '#fff', letterSpacing: '0.03em',
            }}>{role.title}</span>
            <span style={{
              fontSize: 9, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em',
              padding: '2px 8px', borderRadius: 3,
              background: role.level === 'supervisor' ? accent + '18' : 'rgba(255,255,255,0.05)',
              color: role.level === 'supervisor' ? accent : 'var(--text-dim)',
              border: `1px solid ${role.level === 'supervisor' ? accent + '30' : 'transparent'}`,
            }}>
              {role.level === 'supervisor' ? '★ Supervisor' : 'Specialist'}
            </span>
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.55 }}>{role.description}</div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexShrink: 0 }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{
              fontFamily: "'Barlow Condensed', sans-serif",
              fontWeight: 900, fontSize: 22, color: accent, lineHeight: 1,
            }}>{role.openings}</div>
            <div style={{ fontSize: 9, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              {role.openings === 1 ? 'Opening' : 'Openings'}
            </div>
          </div>
          <div style={{ color: 'var(--text-dim)', fontSize: 11, transition: 'transform 0.2s', transform: expanded ? 'rotate(180deg)' : 'rotate(0)' }}>▼</div>
        </div>
      </div>

      {expanded && (
        <div style={{ borderTop: `1px solid ${accent}20`, padding: '24px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 28, marginBottom: 22 }}>
            <div>
              <SLabel color={accent}>Responsibilities</SLabel>
              <Bullets items={role.responsibilities} bullet="▸" color={accent} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              <div>
                <SLabel color="var(--text-muted)">Requirements</SLabel>
                <Bullets items={role.requirements} bullet="◦" color="var(--text-dim)" />
              </div>
              <div>
                <SLabel color="var(--text-dim)">What You Get</SLabel>
                <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
                  {role.perks.map((p, i) => (
                    <span key={i} style={{
                      background: 'var(--bg-3)', border: '1px solid var(--border)',
                      borderRadius: 4, padding: '4px 10px', fontSize: 11, color: 'var(--text-muted)',
                    }}>✓ {p}</span>
                  ))}
                </div>
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', borderTop: '1px solid var(--border)', paddingTop: 18 }}>
            <button
              onClick={e => { e.stopPropagation(); onApply() }}
              style={{
                background: accent, color: '#000', border: 'none',
                borderRadius: 8, padding: '11px 28px', fontSize: 12, fontWeight: 800,
                letterSpacing: '0.08em', textTransform: 'uppercase',
                cursor: 'pointer', fontFamily: "'Barlow', sans-serif", transition: 'opacity 0.15s',
              }}
              onMouseEnter={e => e.currentTarget.style.opacity = '0.82'}
              onMouseLeave={e => e.currentTarget.style.opacity = '1'}
            >
              Apply for This Role →
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

/* ─── APPLY MODAL ───────────────────────────────────── */
function ApplyModal({ role, dept, onClose }: { role: Role; dept: Department; onClose: () => void }) {
  const [step, setStep] = useState<1 | 2 | 3>(1)
  const [done, setDone] = useState(false)
  const [form, setForm] = useState({
    firstName: '', lastName: '', email: '', discord: '',
    availability: '', referral: '', experience: '', platforms: '', whyUs: '',
  })

  const f = (k: keyof typeof form) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
      setForm(p => ({ ...p, [k]: e.target.value }))

  const s1ok = !!(form.firstName && form.lastName && form.email && form.discord && form.availability)
  const s2ok = !!(form.experience && form.whyUs)

  const STEPS = ['Personal Info', 'Experience', 'Review & Send']

  return (
    <div
      style={{
        position: 'fixed', inset: 0,
        background: 'rgba(0,0,0,0.84)', backdropFilter: 'blur(6px)',
        zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16,
      }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div style={{
        background: '#13131A', border: '1px solid rgba(255,255,255,0.07)',
        borderRadius: 14, width: '100%', maxWidth: 540,
        maxHeight: '92vh', overflowY: 'auto',
        boxShadow: '0 40px 100px rgba(0,0,0,0.9)',
        animation: 'modalIn 0.22s ease',
      }}>
        {/* Header */}
        <div style={{
          padding: '22px 26px 18px',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
          position: 'sticky', top: 0, background: '#13131A', zIndex: 2,
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: done ? 0 : 16 }}>
            <div>
              <div style={{
                fontFamily: "'Rajdhani', sans-serif", fontWeight: 700,
                fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase',
                color: dept.accent, marginBottom: 4,
              }}>Application — {dept.name}</div>
              <div style={{
                fontFamily: "'Barlow Condensed', sans-serif",
                fontWeight: 900, fontSize: 19, textTransform: 'uppercase',
                color: '#fff', letterSpacing: '0.02em',
              }}>{role.title}</div>
            </div>
            <button onClick={onClose} style={{
              background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: '50%', width: 28, height: 28, cursor: 'pointer',
              color: 'var(--text-muted)', fontSize: 12,
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            }}>✕</button>
          </div>

          {/* Step tracker */}
          {!done && (
            <div style={{ display: 'flex', alignItems: 'center' }}>
              {STEPS.map((label, i) => {
                const n = i + 1
                const past = step > n, current = step === n
                return (
                  <div key={n} style={{ display: 'flex', alignItems: 'center', flex: i < STEPS.length - 1 ? 1 : 'none' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <div style={{
                        width: 20, height: 20, borderRadius: '50%', flexShrink: 0,
                        background: past ? dept.accent : current ? 'var(--red)' : 'var(--bg-4)',
                        border: `1px solid ${past ? dept.accent : current ? 'var(--red)' : 'var(--border)'}`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 9, fontWeight: 800,
                        color: past || current ? '#fff' : 'var(--text-dim)',
                      }}>{past ? '✓' : n}</div>
                      <span style={{
                        fontSize: 10, fontWeight: 600, textTransform: 'uppercase',
                        letterSpacing: '0.06em', whiteSpace: 'nowrap',
                        color: past || current ? '#fff' : 'var(--text-dim)',
                      }}>{label}</span>
                    </div>
                    {i < STEPS.length - 1 && (
                      <div style={{ flex: 1, height: 1, margin: '0 10px', background: past ? dept.accent : 'var(--border)' }} />
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>

        <div style={{ padding: '24px 26px' }}>
          {done ? (
            <div style={{ textAlign: 'center', padding: '18px 0 6px' }}>
              <div style={{ fontSize: 52, marginBottom: 16 }}>🎮</div>
              <div style={{
                fontFamily: "'Barlow Condensed', sans-serif",
                fontWeight: 900, fontSize: 26, textTransform: 'uppercase',
                color: '#fff', marginBottom: 12,
              }}>Application Received!</div>
              <p style={{ fontSize: 13, lineHeight: 1.78, color: 'var(--text-muted)', maxWidth: 380, margin: '0 auto 22px' }}>
                Thanks for applying for <strong style={{ color: '#fff' }}>{role.title}</strong>.
                Every application is reviewed personally. If you're a fit you'll hear back
                via Discord within <strong style={{ color: '#fff' }}>5–7 days</strong>.
              </p>
              <div style={{
                display: 'inline-flex', alignItems: 'center', gap: 8,
                background: 'rgba(74,222,128,0.07)', border: '1px solid rgba(74,222,128,0.2)',
                borderRadius: 8, padding: '10px 18px',
                fontSize: 12, color: '#4ade80', fontWeight: 600, marginBottom: 22,
              }}>✓ Submitted successfully</div>
              <br />
              <button onClick={onClose} style={{
                background: 'var(--bg-3)', border: '1px solid var(--border)',
                borderRadius: 8, padding: '10px 22px',
                color: 'var(--text-muted)', fontSize: 12,
                cursor: 'pointer', fontFamily: "'Barlow', sans-serif",
              }}>Close</button>
            </div>

          ) : step === 1 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 13 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <MField label="First Name" required><MIn placeholder="John" value={form.firstName} onChange={f('firstName')} /></MField>
                <MField label="Last Name" required><MIn placeholder="Doe" value={form.lastName} onChange={f('lastName')} /></MField>
              </div>
              <MField label="Email" required><MIn type="email" placeholder="you@example.com" value={form.email} onChange={f('email')} /></MField>
              <MField label="Discord Username" required hint="e.g. username or username#0000">
                <MIn placeholder="YourTag#0000" value={form.discord} onChange={f('discord')} />
              </MField>
              <MField label="Weekly Availability" required>
                <MSel value={form.availability} onChange={f('availability')}>
                  <option value="">Select hours / week</option>
                  <option value="5-10">5–10 hrs</option>
                  <option value="10-15">10–15 hrs</option>
                  <option value="15-20">15–20 hrs</option>
                  <option value="20+">20+ hrs</option>
                </MSel>
              </MField>
              <MField label="How did you find us?">
                <MSel value={form.referral} onChange={f('referral')}>
                  <option value="">Select one</option>
                  <option value="discord">Discord</option>
                  <option value="twitter">Twitter / X</option>
                  <option value="friend">Friend or Referral</option>
                  <option value="forum">Platform Forum</option>
                  <option value="other">Other</option>
                </MSel>
              </MField>
              <MFoot>
                <div />
                <MNext disabled={!s1ok} accent={dept.accent} onClick={() => setStep(2)}>Next: Experience →</MNext>
              </MFoot>
            </div>

          ) : step === 2 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 13 }}>
              <MField label="Relevant Experience" required hint="Prior moderation, support, or community roles">
                <MTA rows={4} placeholder="Describe your relevant background..." value={form.experience} onChange={f('experience')} />
              </MField>
              <MField label="Previous Platforms / Communities" hint="Servers, forums, or platforms you've worked on">
                <MIn placeholder="e.g. Moderated a 5k Discord server for 2 years" value={form.platforms} onChange={f('platforms')} />
              </MField>
              <MField label="Why GamerHead?" required hint="Why this role, why this platform?">
                <MTA rows={4} placeholder="Tell us what draws you here..." value={form.whyUs} onChange={f('whyUs')} />
              </MField>
              <MFoot>
                <MBack onClick={() => setStep(1)} />
                <MNext disabled={!s2ok} accent={dept.accent} onClick={() => setStep(3)}>Next: Review →</MNext>
              </MFoot>
            </div>

          ) : (
            <div>
              <div style={{
                fontFamily: "'Rajdhani', sans-serif", fontWeight: 700,
                fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase',
                color: 'var(--text-dim)', marginBottom: 12,
              }}>Review Your Application</div>
              <div style={{ border: '1px solid var(--border)', borderRadius: 8, overflow: 'hidden', marginBottom: 16 }}>
                {[
                  ['Name', `${form.firstName} ${form.lastName}`],
                  ['Email', form.email],
                  ['Discord', form.discord],
                  ['Applying For', role.title],
                  ['Department', dept.name],
                  ['Availability', form.availability + ' hrs/week'],
                ].map(([label, val], i, arr) => (
                  <div key={i} style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    padding: '10px 14px',
                    background: i % 2 === 0 ? 'var(--bg-3)' : 'var(--bg-2)',
                    borderBottom: i < arr.length - 1 ? '1px solid var(--border)' : 'none',
                  }}>
                    <span style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</span>
                    <span style={{ fontSize: 12, color: '#fff', fontWeight: 700, textAlign: 'right', maxWidth: '58%' }}>{val}</span>
                  </div>
                ))}
              </div>
              <div style={{
                background: 'rgba(74,222,128,0.05)', border: '1px solid rgba(74,222,128,0.14)',
                borderRadius: 8, padding: '10px 14px',
                fontSize: 11, color: 'rgba(74,222,128,0.7)', lineHeight: 1.6, marginBottom: 18,
              }}>
                ✓ By submitting you confirm all information is accurate. We'll reach out via Discord if selected.
              </div>
              <MFoot>
                <MBack onClick={() => setStep(2)} />
                <button onClick={() => setDone(true)} style={{
                  background: 'var(--red)', color: '#fff', border: 'none',
                  borderRadius: 8, padding: '11px 26px', fontSize: 12, fontWeight: 800,
                  letterSpacing: '0.08em', textTransform: 'uppercase',
                  cursor: 'pointer', fontFamily: "'Barlow', sans-serif",
                }}>🚀 Submit Application</button>
              </MFoot>
            </div>
          )}
        </div>
      </div>
      <style>{`
        @keyframes modalIn { from { opacity:0; transform:translateY(18px) } to { opacity:1; transform:translateY(0) } }
        input::placeholder, textarea::placeholder { color: #3a3a48; }
        select option { background: #1a1a24; color: #fff; }
      `}</style>
    </div>
  )
}

/* ─── MICRO COMPONENTS ──────────────────────────────── */
const iBase: React.CSSProperties = {
  background: '#1C1C26', border: '1px solid rgba(255,255,255,0.07)',
  borderRadius: 8, padding: '10px 13px',
  color: '#fff', fontSize: 13, fontFamily: "'Barlow', sans-serif",
  outline: 'none', width: '100%',
}

function SLabel({ children, color }: { children: React.ReactNode; color: string }) {
  return <div style={{ fontFamily: "'Rajdhani', sans-serif", fontWeight: 700, fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase', color, marginBottom: 10 }}>{children}</div>
}
function Bullets({ items, bullet, color }: { items: string[]; bullet: string; color: string }) {
  return (
    <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 6 }}>
      {items.map((item, i) => (
        <li key={i} style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
          <span style={{ color, fontSize: 11, marginTop: 2, flexShrink: 0 }}>{bullet}</span>
          <span style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.6 }}>{item}</span>
        </li>
      ))}
    </ul>
  )
}
function MField({ label, required, hint, children }: { label: string; required?: boolean; hint?: string; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
      <label style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#d0d0dc', display: 'flex', alignItems: 'center', gap: 4 }}>
        {label}{required && <span style={{ color: 'var(--red)' }}>*</span>}
      </label>
      {hint && <div style={{ fontSize: 10, color: 'var(--text-dim)', marginTop: -2 }}>{hint}</div>}
      {children}
    </div>
  )
}
function MIn(p: React.InputHTMLAttributes<HTMLInputElement>) { return <input style={iBase} {...p} /> }
function MTA(p: React.TextareaHTMLAttributes<HTMLTextAreaElement>) { return <textarea style={{ ...iBase, resize: 'vertical', lineHeight: 1.6, paddingTop: 10 } as React.CSSProperties} {...p} /> }
function MSel(p: React.SelectHTMLAttributes<HTMLSelectElement>) { return <select style={{ ...iBase, cursor: 'pointer' } as React.CSSProperties} {...p} /> }
function MFoot({ children }: { children: React.ReactNode }) {
  return <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 10, paddingTop: 16, borderTop: '1px solid rgba(255,255,255,0.05)' }}>{children}</div>
}
function MNext({ children, disabled, accent, onClick }: { children: React.ReactNode; disabled: boolean; accent: string; onClick: () => void }) {
  return (
    <button disabled={disabled} onClick={onClick} style={{
      background: disabled ? 'var(--bg-4)' : 'var(--red)',
      color: disabled ? 'var(--text-dim)' : '#fff',
      border: 'none', borderRadius: 8, padding: '10px 22px',
      fontSize: 12, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase',
      cursor: disabled ? 'not-allowed' : 'pointer', fontFamily: "'Barlow', sans-serif",
    }}>{children}</button>
  )
}
function MBack({ onClick }: { onClick: () => void }) {
  return (
    <button onClick={onClick} style={{
      background: 'transparent', color: 'var(--text-muted)',
      border: '1px solid var(--border)', borderRadius: 8,
      padding: '10px 18px', fontSize: 12, fontWeight: 600,
      cursor: 'pointer', fontFamily: "'Barlow', sans-serif",
    }}>← Back</button>
  )
}