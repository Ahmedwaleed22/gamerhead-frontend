'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Icon } from '@iconify/react'
import { EmojiSolar, Solar } from '@/lib/solar-duotone'

/* ─── TYPES ─────────────────────────────────────────── */
interface StaffMember {
  name: string
  role: string
  title: string
  bio: string
  emoji: string
  accentColor: string
  socials: { twitter?: string; twitch?: string; discord?: string }
  isFounder?: boolean
  joined: string
  tags: string[]
}

interface Milestone {
  year: string
  month: string
  title: string
  desc: string
  icon: string
  highlight?: boolean
}

interface Pillar {
  icon: string
  title: string
  desc: string
  cta: string
  href: string
  accent: string
}

/* ─── DATA ──────────────────────────────────────────── */
const STAFF: StaffMember[] = [
  {
    name: 'The Founder',
    role: 'Founder & CEO',
    title: 'The Vision',
    bio: 'Built GamerHead from a single idea — that every gamer deserves a real home. Not just a place to play, but a place to compete, grow, connect, and belong. Still writing the story.',
    emoji: '👑',
    accentColor: '#E8000D',
    socials: { twitter: '#', twitch: '#', discord: '#' },
    isFounder: true,
    joined: 'Day 1',
    tags: ['Visionary', 'Builder', 'Competitor'],
  },
  {
    name: 'Open Position',
    role: 'Lead Developer',
    title: 'The Architect',
    bio: 'This spot is waiting for someone who loves building things that matter. If you live and breathe code and gaming, reach out.',
    emoji: '💻',
    accentColor: '#60A5FA',
    socials: {},
    joined: 'TBD',
    tags: ['Full-Stack', 'Next.js', 'Wanted'],
  },
  {
    name: 'Open Position',
    role: 'Community Manager',
    title: 'The Connector',
    bio: 'The heartbeat of the platform. Organizing events, moderating forums, and making sure every new member feels at home.',
    emoji: '🎙️',
    accentColor: '#4ADE80',
    socials: {},
    joined: 'TBD',
    tags: ['Community', 'Events', 'Discord'],
  },
  {
    name: 'Open Position',
    role: 'Head of Esports',
    title: 'The Tactician',
    bio: 'Runs the competitive ladder, organizes tournaments, and keeps fair play at the core of every match.',
    emoji: '⚔️',
    accentColor: '#F0AA1A',
    socials: {},
    joined: 'TBD',
    tags: ['Esports', 'Tournaments', 'Strategy'],
  },
  {
    name: 'Open Position',
    role: 'UI/UX Designer',
    title: 'The Craftsman',
    bio: 'Shapes how the platform looks and feels. Obsesses over every pixel so players can focus on what matters — the game.',
    emoji: '🎨',
    accentColor: '#A78BFA',
    socials: {},
    joined: 'TBD',
    tags: ['Design', 'Figma', 'Creative'],
  },
  {
    name: 'Open Position',
    role: 'Content & Media',
    title: 'The Storyteller',
    bio: 'Captures the moments that matter — match recaps, player spotlights, community highlights, and the stories behind the stats.',
    emoji: '📡',
    accentColor: '#FB923C',
    socials: {},
    joined: 'TBD',
    tags: ['Content', 'Media', 'Writing'],
  },
]

const MILESTONES: Milestone[] = [
  {
    year: '2024',
    month: 'Jan',
    title: 'The Idea Sparks',
    desc: 'Frustrated with fragmented gaming platforms and rigged lobbies — the concept for a fair, community-first competitive gaming home is born.',
    icon: '💡',
    highlight: false,
  },
  {
    year: '2024',
    month: 'Jun',
    title: 'First Lines of Code',
    desc: 'Development begins. The core vision: one platform for every type of gamer — competitors, creators, coaches, and casual players.',
    icon: '⌨️',
    highlight: false,
  },
  {
    year: '2024',
    month: 'Oct',
    title: 'Platform Takes Shape',
    desc: 'Tournament system, wager matches, XP ladders, team profiles, and the coaching marketplace all come online in rapid succession.',
    icon: '🏗️',
    highlight: false,
  },
  {
    year: '2025',
    month: 'Q1',
    title: 'Beta Launch',
    desc: 'The doors open for the first wave of players. Real matches. Real stakes. Real community. The feedback loop begins.',
    icon: '🚀',
    highlight: true,
  },
  {
    year: '2025',
    month: 'Q3',
    title: 'Community Milestones',
    desc: 'First major tournament runs. First verified coaches join the marketplace. Forums light up with game ideas and collaboration threads.',
    icon: '🏆',
    highlight: false,
  },
  {
    year: '2026',
    month: 'Now',
    title: 'Still Writing It',
    desc: 'The best chapter is always the one being written. New games, new features, new faces — and you might be part of what comes next.',
    icon: '✍️',
    highlight: true,
  },
]

const PILLARS: Pillar[] = [
  {
    icon: '⚔️',
    title: 'Compete',
    desc: 'Wager matches, XP ladders, and major tournaments across all the biggest titles. Every player deserves a fair fight and a place on the board.',
    cta: 'View Tournaments',
    href: '/tournaments',
    accent: '#E8000D',
  },
  {
    icon: '🎙️',
    title: 'Coach',
    desc: 'Whether you\'re a Diamond-ranked veteran or a rising talent, connect with verified coaches or share your knowledge with the next generation.',
    cta: 'Find a Coach',
    href: '/coaching',
    accent: '#60A5FA',
  },
  {
    icon: '🎨',
    title: 'Create',
    desc: 'Gaming is more than just playing. Designers, developers, writers, and artists — bring your ideas to the forum and find people who get it.',
    cta: 'Visit Forum',
    href: '/forum',
    accent: '#A78BFA',
  },
  {
    icon: '👥',
    title: 'Connect',
    desc: 'Looking for a squad, a casual group, or just someone who shares your taste in games? The community is here and the door is always open.',
    cta: 'Browse Community',
    href: '/forum',
    accent: '#4ADE80',
  },
  {
    icon: '🛠️',
    title: 'Build',
    desc: 'Want to get into game development? Need feedback on a concept, a team, or just someone to brainstorm with? This is the right room.',
    cta: 'Start a Thread',
    href: '/forum',
    accent: '#F0AA1A',
  },
  {
    icon: '🛡️',
    title: 'Trust',
    desc: 'Fair play isn\'t a feature — it\'s the foundation. Anti-cheat protections, dispute resolution, verified coaches, and transparent payouts.',
    cta: 'View Rules',
    href: '/rules',
    accent: '#FB923C',
  },
]

const VALUES = [
  { icon: '⚖️', title: 'Fair Play Above All', desc: 'We built the entire payout and dispute system around one principle: if you win, you get paid. No exceptions, no grey areas.' },
  { icon: '🌍', title: 'Everyone Belongs', desc: 'Hardcore competitor, casual Friday gamer, game dev with a dream — there is a seat at this table for you. We mean that.' },
  { icon: '🔥', title: 'Community-Driven', desc: 'Features get built because the community asks for them. Game ideas in the forum become polls. Polls become features.' },
  { icon: '📈', title: 'Built to Grow With You', desc: 'From your first XP match to your first tournament win to coaching your first student — the platform scales with your journey.' },
]

/* ─── COMPONENT ─────────────────────────────────────── */
export default function AboutPage() {
  const [expandedStaff, setExpandedStaff] = useState<number | null>(null)

  return (
    <div style={{ background: 'var(--bg-1)', minHeight: '100vh' }}>

      {/* ── HERO ─────────────────────────────────────── */}
      <section style={{
        position: 'relative',
        overflow: 'hidden',
        padding: '0',
        background: 'linear-gradient(160deg, #0a0a0c 0%, #160408 40%, #0a0a10 100%)',
        borderBottom: '1px solid var(--border)',
      }}>
        {/* Grid texture */}
        <div style={{
          position: 'absolute', inset: 0,
          backgroundImage: `
            repeating-linear-gradient(0deg, transparent, transparent 80px, rgba(232,0,13,0.03) 80px, rgba(232,0,13,0.03) 81px),
            repeating-linear-gradient(90deg, transparent, transparent 80px, rgba(232,0,13,0.03) 80px, rgba(232,0,13,0.03) 81px)
          `,
          pointerEvents: 'none',
        }} />
        {/* Glow orb */}
        <div style={{
          position: 'absolute', top: '-120px', left: '50%',
          transform: 'translateX(-50%)',
          width: '800px', height: '500px',
          background: 'radial-gradient(ellipse, rgba(232,0,13,0.14) 0%, transparent 65%)',
          pointerEvents: 'none',
        }} />
        {/* Big watermark */}
        <div style={{
          position: 'absolute', right: '-40px', bottom: '-60px',
          fontFamily: "'Barlow Condensed', sans-serif",
          fontWeight: 900, fontSize: '220px',
          letterSpacing: '-12px', lineHeight: 1,
          color: 'rgba(232,0,13,0.04)',
          pointerEvents: 'none', userSelect: 'none',
        }}>CE</div>

        <div className="container" style={{ position: 'relative', zIndex: 2, padding: '100px 24px 80px' }}>
          <div style={{ maxWidth: 760 }}>
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              background: 'rgba(232,0,13,0.12)', border: '1px solid rgba(232,0,13,0.3)',
              borderRadius: 20, padding: '5px 14px', marginBottom: 28,
              fontSize: 11, fontWeight: 700, letterSpacing: '0.1em',
              textTransform: 'uppercase', color: 'var(--red)',
            }}>
              <span style={{ width: 6, height: 6, background: 'var(--red)', borderRadius: '50%', animation: 'pulse 2s infinite' }} />
              Our Story
            </div>

            <h1 style={{
              fontFamily: "'Barlow Condensed', sans-serif",
              fontSize: 'clamp(52px, 8vw, 96px)',
              fontWeight: 900, lineHeight: 0.92,
              textTransform: 'uppercase',
              letterSpacing: '-1px',
              color: '#fff',
              marginBottom: 28,
            }}>
              MORE THAN<br />
              <span style={{ color: 'var(--red)' }}>A PLATFORM.</span><br />
              A HOME.
            </h1>

            <p style={{
              fontSize: 17, lineHeight: 1.8,
              color: 'rgba(255,255,255,0.55)',
              maxWidth: 580, marginBottom: 40,
            }}>
              GamerHead wasn't built to be another gaming website. It was built because gamers
              deserve better — a place where the competition is fair, the community is real, and whether
              you're here to dominate the leaderboards or just find your people, you belong here.
            </p>

            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              <Link href="/tournaments" style={{
                display: 'inline-flex', alignItems: 'center', gap: 8,
                background: 'var(--red)', color: '#fff',
                padding: '13px 28px', borderRadius: 6,
                fontWeight: 700, fontSize: 13,
                letterSpacing: '0.08em', textTransform: 'uppercase',
                textDecoration: 'none',
                transition: 'all 0.2s',
              }}>
                <Icon icon={Solar.trophy} width={16} height={16} /> Start Competing
              </Link>
              <Link href="/forum" style={{
                display: 'inline-flex', alignItems: 'center', gap: 8,
                background: 'transparent', color: '#fff',
                padding: '13px 28px', borderRadius: 6,
                border: '1px solid rgba(255,255,255,0.15)',
                fontWeight: 700, fontSize: 13,
                letterSpacing: '0.08em', textTransform: 'uppercase',
                textDecoration: 'none',
              }}>
                <Icon icon={Solar.chat} width={16} height={16} /> Join the Forum
              </Link>
            </div>
          </div>

          {/* Stat pills */}
          <div style={{
            display: 'flex', gap: 10, flexWrap: 'wrap',
            marginTop: 64, paddingTop: 40,
            borderTop: '1px solid var(--border)',
          }}>
            {[
              { val: '10K+',  label: 'Players & Counting' },
              { val: '500+',  label: 'Tournaments Run' },
              { val: '98%',   label: 'Fair Payout Rate' },
              { val: '24/7',  label: 'Community Active' },
              { val: '∞',     label: 'Room to Grow' },
            ].map((s, i) => (
              <div key={i} style={{
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid var(--border)',
                borderRadius: 8, padding: '14px 24px',
                textAlign: 'center',
              }}>
                <div style={{
                  fontFamily: "'Barlow Condensed', sans-serif",
                  fontWeight: 900, fontSize: 28,
                  color: i === 0 ? 'var(--red)' : '#fff',
                  lineHeight: 1,
                }}>{s.val}</div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── WHY WE BUILT THIS ──────────────────────────── */}
      <section style={{ padding: '80px 0', borderBottom: '1px solid var(--border)' }}>
        <div className="container">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 64, alignItems: 'center' }}>
            <div>
              <div style={{
                fontFamily: "'Rajdhani', sans-serif",
                fontWeight: 700, fontSize: 11,
                letterSpacing: '0.14em', textTransform: 'uppercase',
                color: 'var(--red)', marginBottom: 16,
              }}>The Origin</div>
              <h2 style={{
                fontFamily: "'Barlow Condensed', sans-serif",
                fontSize: 'clamp(36px, 4vw, 52px)',
                fontWeight: 900, textTransform: 'uppercase',
                color: '#fff', lineHeight: 1.05,
                marginBottom: 24,
              }}>
                BUILT OUT OF <span style={{ color: 'var(--red)' }}>FRUSTRATION.</span><br />
                DRIVEN BY PASSION.
              </h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {[
                  'Every gamer has felt it — the rigged match, the stolen win, the platform that doesn\'t care about you. We felt it too.',
                  'So we built the alternative. A platform where your wins are verified, your payouts are protected, and your voice shapes what gets built next.',
                  'GamerHead exists for the competitor who needs a fair fight, the creator who needs a stage, the developer who needs a community, and the casual player who just needs a home.',
                ].map((text, i) => (
                  <p key={i} style={{ fontSize: 14, lineHeight: 1.8, color: 'rgba(255,255,255,0.5)', margin: 0 }}>
                    {text}
                  </p>
                ))}
              </div>
            </div>

            {/* Values cards */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              {VALUES.map((v, i) => (
                <div key={i} style={{
                  background: 'var(--bg-2)',
                  border: '1px solid var(--border)',
                  borderRadius: 10, padding: '20px',
                  transition: 'border-color 0.2s',
                  cursor: 'default',
                }}
                  onMouseEnter={e => (e.currentTarget.style.borderColor = 'rgba(232,0,13,0.35)')}
                  onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--border)')}
                >
                  <div style={{ marginBottom: 10, display: 'flex', alignItems: 'center' }}>
                    <EmojiSolar emoji={v.icon} size={24} inline={false} />
                  </div>
                  <div style={{
                    fontFamily: "'Barlow Condensed', sans-serif",
                    fontWeight: 800, fontSize: 14,
                    textTransform: 'uppercase', color: '#fff',
                    marginBottom: 8, letterSpacing: '0.03em',
                  }}>{v.title}</div>
                  <div style={{ fontSize: 12, lineHeight: 1.65, color: 'var(--text-muted)' }}>{v.desc}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── COMMUNITY PILLARS ─────────────────────────── */}
      <section style={{
        padding: '80px 0',
        background: 'linear-gradient(180deg, var(--bg-2) 0%, var(--bg-1) 100%)',
        borderBottom: '1px solid var(--border)',
      }}>
        <div className="container">
          <div style={{ textAlign: 'center', marginBottom: 56 }}>
            <div style={{
              fontFamily: "'Rajdhani', sans-serif",
              fontWeight: 700, fontSize: 11,
              letterSpacing: '0.14em', textTransform: 'uppercase',
              color: 'var(--red)', marginBottom: 14,
            }}>What We Offer</div>
            <h2 style={{
              fontFamily: "'Barlow Condensed', sans-serif",
              fontSize: 'clamp(36px, 4vw, 56px)',
              fontWeight: 900, textTransform: 'uppercase',
              color: '#fff', lineHeight: 1,
              marginBottom: 16,
            }}>
              FIND YOUR <span style={{ color: 'var(--red)' }}>PLACE HERE</span>
            </h2>
            <p style={{ fontSize: 14, color: 'var(--text-muted)', maxWidth: 520, margin: '0 auto', lineHeight: 1.8 }}>
              No matter what kind of gamer you are — or what you want to build — there's a corner of
              GamerHead made for you.
            </p>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: 14,
          }}>
            {PILLARS.map((p, i) => (
              <Link key={i} href={p.href} style={{ textDecoration: 'none' }}>
                <div style={{
                  background: 'var(--bg-2)',
                  border: '1px solid var(--border)',
                  borderRadius: 12, padding: '28px 24px',
                  height: '100%',
                  transition: 'all 0.2s',
                  position: 'relative', overflow: 'hidden',
                  cursor: 'pointer',
                }}
                  onMouseEnter={e => {
                    e.currentTarget.style.borderColor = p.accent + '55'
                    e.currentTarget.style.transform = 'translateY(-3px)'
                    e.currentTarget.style.boxShadow = `0 12px 32px rgba(0,0,0,0.4)`
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.borderColor = 'var(--border)'
                    e.currentTarget.style.transform = 'translateY(0)'
                    e.currentTarget.style.boxShadow = 'none'
                  }}
                >
                  {/* Accent glow top-left */}
                  <div style={{
                    position: 'absolute', top: 0, left: 0,
                    width: 3, height: '100%',
                    background: p.accent,
                    opacity: 0.6, borderRadius: '12px 0 0 12px',
                  }} />

                  <div style={{
                    width: 48, height: 48,
                    background: p.accent + '18',
                    border: `1px solid ${p.accent}30`,
                    borderRadius: 10,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 22, marginBottom: 18, marginLeft: 12,
                  }}>
                    <EmojiSolar emoji={p.icon} size={22} inline={false} />
                  </div>

                  <h3 style={{
                    fontFamily: "'Barlow Condensed', sans-serif",
                    fontWeight: 800, fontSize: 20,
                    textTransform: 'uppercase', color: '#fff',
                    marginBottom: 10, marginLeft: 12,
                    letterSpacing: '0.04em',
                  }}>{p.title}</h3>

                  <p style={{
                    fontSize: 13, lineHeight: 1.75,
                    color: 'var(--text-muted)',
                    marginBottom: 20, marginLeft: 12,
                  }}>{p.desc}</p>

                  <div style={{
                    display: 'inline-flex', alignItems: 'center', gap: 6,
                    marginLeft: 12,
                    fontSize: 11, fontWeight: 700,
                    letterSpacing: '0.08em', textTransform: 'uppercase',
                    color: p.accent,
                  }}>
                    {p.cta} →
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── MILESTONES ────────────────────────────────── */}
      <section style={{ padding: '80px 0', borderBottom: '1px solid var(--border)' }}>
        <div className="container">
          <div style={{ textAlign: 'center', marginBottom: 56 }}>
            <div style={{
              fontFamily: "'Rajdhani', sans-serif",
              fontWeight: 700, fontSize: 11,
              letterSpacing: '0.14em', textTransform: 'uppercase',
              color: 'var(--red)', marginBottom: 14,
            }}>The Journey</div>
            <h2 style={{
              fontFamily: "'Barlow Condensed', sans-serif",
              fontSize: 'clamp(36px, 4vw, 52px)',
              fontWeight: 900, textTransform: 'uppercase',
              color: '#fff', marginBottom: 14,
            }}>
              HOW WE GOT <span style={{ color: 'var(--red)' }}>HERE</span>
            </h2>
            <p style={{ fontSize: 14, color: 'var(--text-muted)', maxWidth: 480, margin: '0 auto' }}>
              Every platform has a story. Here's ours — from an idea scribbled down at 2am to a real community.
            </p>
          </div>

          {/* Timeline */}
          <div style={{ position: 'relative', maxWidth: 900, margin: '0 auto' }}>
            {/* Center line */}
            <div style={{
              position: 'absolute', left: '50%', top: 0, bottom: 0,
              width: 1, background: 'linear-gradient(180deg, transparent, var(--border) 10%, var(--border) 90%, transparent)',
              transform: 'translateX(-50%)',
            }} />

            <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
              {MILESTONES.map((m, i) => {
                const isLeft = i % 2 === 0
                return (
                  <div key={i} style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 60px 1fr',
                    gap: 0,
                    marginBottom: 8,
                  }}>
                    {/* Left side */}
                    <div style={{
                      padding: isLeft ? '0 32px 32px 0' : '0',
                      display: 'flex',
                      justifyContent: isLeft ? 'flex-end' : 'flex-start',
                    }}>
                      {isLeft && (
                        <div style={{
                          background: m.highlight ? 'rgba(232,0,13,0.08)' : 'var(--bg-2)',
                          border: `1px solid ${m.highlight ? 'rgba(232,0,13,0.3)' : 'var(--border)'}`,
                          borderRadius: 10, padding: '20px 24px',
                          maxWidth: 320, width: '100%',
                          textAlign: 'right',
                        }}>
                          <div style={{ marginBottom: 8, textAlign: 'right', display: 'flex', justifyContent: 'flex-end' }}>
                            <EmojiSolar emoji={m.icon} size={24} inline={false} />
                          </div>
                          <div style={{
                            fontFamily: "'Barlow Condensed', sans-serif",
                            fontWeight: 800, fontSize: 16,
                            color: m.highlight ? 'var(--red)' : '#fff',
                            textTransform: 'uppercase', marginBottom: 6,
                          }}>{m.title}</div>
                          <div style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.7 }}>{m.desc}</div>
                        </div>
                      )}
                    </div>

                    {/* Center dot */}
                    <div style={{
                      display: 'flex', flexDirection: 'column',
                      alignItems: 'center', gap: 0, paddingTop: 20,
                    }}>
                      <div style={{
                        width: m.highlight ? 16 : 12,
                        height: m.highlight ? 16 : 12,
                        borderRadius: '50%',
                        background: m.highlight ? 'var(--red)' : 'var(--bg-4)',
                        border: `2px solid ${m.highlight ? 'var(--red)' : 'var(--border)'}`,
                        boxShadow: m.highlight ? '0 0 12px rgba(232,0,13,0.5)' : 'none',
                        flexShrink: 0,
                        zIndex: 2, position: 'relative',
                      }} />
                      <div style={{
                        fontFamily: "'Barlow Condensed', sans-serif",
                        fontWeight: 900, fontSize: 11,
                        color: m.highlight ? 'var(--red)' : 'var(--text-dim)',
                        textTransform: 'uppercase',
                        letterSpacing: '0.06em',
                        marginTop: 6, textAlign: 'center',
                        lineHeight: 1.2,
                      }}>
                        <div>{m.month}</div>
                        <div>{m.year}</div>
                      </div>
                    </div>

                    {/* Right side */}
                    <div style={{
                      padding: !isLeft ? '0 0 32px 32px' : '0',
                      display: 'flex',
                      justifyContent: !isLeft ? 'flex-start' : 'flex-end',
                    }}>
                      {!isLeft && (
                        <div style={{
                          background: m.highlight ? 'rgba(232,0,13,0.08)' : 'var(--bg-2)',
                          border: `1px solid ${m.highlight ? 'rgba(232,0,13,0.3)' : 'var(--border)'}`,
                          borderRadius: 10, padding: '20px 24px',
                          maxWidth: 320, width: '100%',
                        }}>
                          <div style={{ marginBottom: 8, display: 'flex', alignItems: 'center' }}>
                            <EmojiSolar emoji={m.icon} size={24} inline={false} />
                          </div>
                          <div style={{
                            fontFamily: "'Barlow Condensed', sans-serif",
                            fontWeight: 800, fontSize: 16,
                            color: m.highlight ? 'var(--red)' : '#fff',
                            textTransform: 'uppercase', marginBottom: 6,
                          }}>{m.title}</div>
                          <div style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.7 }}>{m.desc}</div>
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </section>

      {/* ── THE TEAM ──────────────────────────────────── */}
      <section style={{
        padding: '80px 0',
        background: 'var(--bg-2)',
        borderBottom: '1px solid var(--border)',
      }}>
        <div className="container">
          <div style={{ textAlign: 'center', marginBottom: 56 }}>
            <div style={{
              fontFamily: "'Rajdhani', sans-serif",
              fontWeight: 700, fontSize: 11,
              letterSpacing: '0.14em', textTransform: 'uppercase',
              color: 'var(--red)', marginBottom: 14,
            }}>The People</div>
            <h2 style={{
              fontFamily: "'Barlow Condensed', sans-serif",
              fontSize: 'clamp(36px, 4vw, 52px)',
              fontWeight: 900, textTransform: 'uppercase',
              color: '#fff', marginBottom: 16,
            }}>
              THE <span style={{ color: 'var(--red)' }}>TEAM</span> BEHIND IT
            </h2>
            <p style={{ fontSize: 14, color: 'var(--text-muted)', maxWidth: 520, margin: '0 auto', lineHeight: 1.8 }}>
              Small right now, but every great empire starts with a few true believers.
              These are the people building this — and there's room for more.
            </p>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: 16,
          }}>
            {STAFF.map((member, i) => {
              const isOpen = expandedStaff === i
              const isOpen2 = member.name !== 'Open Position'
              return (
                <div
                  key={i}
                  onClick={() => setExpandedStaff(isOpen ? null : i)}
                  style={{
                    background: member.isFounder ? `linear-gradient(135deg, rgba(232,0,13,0.08), var(--bg-3))` : 'var(--bg-3)',
                    border: `1px solid ${member.isFounder ? 'rgba(232,0,13,0.3)' : (isOpen ? member.accentColor + '40' : 'var(--border)')}`,
                    borderRadius: 12,
                    overflow: 'hidden',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    position: 'relative',
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.borderColor = member.accentColor + '55'
                    e.currentTarget.style.transform = 'translateY(-2px)'
                  }}
                  onMouseLeave={e => {
                    if (!isOpen) {
                      e.currentTarget.style.borderColor = member.isFounder ? 'rgba(232,0,13,0.3)' : 'var(--border)'
                    }
                    e.currentTarget.style.transform = 'translateY(0)'
                  }}
                >
                  {/* Accent stripe */}
                  <div style={{
                    height: 3,
                    background: `linear-gradient(90deg, ${member.accentColor}, transparent)`,
                  }} />

                  {/* Photo placeholder */}
                  <div style={{
                    height: 140,
                    background: `linear-gradient(135deg, ${member.accentColor}18, var(--bg-4))`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    position: 'relative',
                    borderBottom: '1px solid var(--border)',
                  }}>
                    {/* Placeholder avatar */}
                    <div style={{
                      width: 72, height: 72,
                      borderRadius: '50%',
                      background: member.accentColor + '20',
                      border: `2px solid ${member.accentColor}50`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 32,
                    }}>
                      <EmojiSolar emoji={member.emoji} size={32} inline={false} />
                    </div>

                    {/* Photo replace hint */}
                    {!isOpen2 && (
                      <div style={{
                        position: 'absolute', bottom: 8, right: 10,
                        background: 'rgba(0,0,0,0.6)',
                        border: '1px solid var(--border)',
                        borderRadius: 4, padding: '3px 8px',
                        fontSize: 9, fontWeight: 700,
                        color: 'var(--text-dim)',
                        textTransform: 'uppercase', letterSpacing: '0.06em',
                      }}>Position Open</div>
                    )}

                    {member.isFounder && (
                      <div style={{
                        position: 'absolute', top: 10, left: 10,
                        background: 'var(--red)',
                        borderRadius: 4, padding: '3px 8px',
                        fontSize: 9, fontWeight: 800,
                        color: '#fff',
                        textTransform: 'uppercase', letterSpacing: '0.08em',
                      }}>Founder</div>
                    )}
                  </div>

                  <div style={{ padding: '18px 20px' }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 4 }}>
                      <div>
                        <div style={{
                          fontFamily: "'Barlow Condensed', sans-serif",
                          fontWeight: 800, fontSize: 18,
                          color: '#fff', textTransform: 'uppercase',
                          letterSpacing: '0.03em', lineHeight: 1.2,
                        }}>{member.name}</div>
                        <div style={{
                          fontSize: 11, fontWeight: 700,
                          color: member.accentColor,
                          textTransform: 'uppercase',
                          letterSpacing: '0.08em', marginTop: 3,
                        }}>{member.role}</div>
                      </div>
                      <div style={{
                        fontFamily: "'Barlow Condensed', sans-serif",
                        fontSize: 11, fontWeight: 700,
                        color: 'var(--text-dim)',
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                        background: 'var(--bg-4)',
                        border: '1px solid var(--border)',
                        borderRadius: 4, padding: '3px 8px',
                        flexShrink: 0,
                      }}>{member.joined}</div>
                    </div>

                    <p style={{
                      fontSize: 12, lineHeight: 1.7,
                      color: 'var(--text-muted)',
                      margin: '12px 0',
                    }}>{member.bio}</p>

                    {/* Tags */}
                    <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', marginBottom: 14 }}>
                      {member.tags.map((tag, t) => (
                        <span key={t} style={{
                          background: member.accentColor + '14',
                          border: `1px solid ${member.accentColor}28`,
                          color: member.accentColor,
                          fontSize: 10, fontWeight: 700,
                          padding: '2px 8px', borderRadius: 3,
                          textTransform: 'uppercase', letterSpacing: '0.05em',
                        }}>{tag}</span>
                      ))}
                    </div>

                    {/* Socials or apply */}
                    {isOpen2 ? (
                      <div style={{ display: 'flex', gap: 6 }}>
                        {member.socials.twitter && (
                          <a href={member.socials.twitter} style={socialBtnStyle}>𝕏</a>
                        )}
                        {member.socials.twitch && (
                          <a href={member.socials.twitch} style={socialBtnStyle}><Icon icon={Solar.tv} width={14} height={14} /></a>
                        )}
                        {member.socials.discord && (
                          <a href={member.socials.discord} style={socialBtnStyle}><Icon icon={Solar.gamepad} width={14} height={14} /></a>
                        )}
                      </div>
                    ) : (
                      <Link href="/careers" style={{
                        display: 'inline-flex', alignItems: 'center', gap: 6,
                        background: member.accentColor + '14',
                        border: `1px solid ${member.accentColor}30`,
                        color: member.accentColor,
                        borderRadius: 6, padding: '7px 14px',
                        fontSize: 11, fontWeight: 700,
                        textTransform: 'uppercase', letterSpacing: '0.06em',
                        textDecoration: 'none',
                        transition: 'background 0.2s',
                      }}>
                        Apply for Role →
                      </Link>
                    )}
                  </div>
                </div>
              )
            })}
          </div>

          {/* Join the team CTA */}
          <div style={{
            marginTop: 40,
            background: 'linear-gradient(135deg, rgba(232,0,13,0.06), var(--bg-3))',
            border: '1px dashed rgba(232,0,13,0.25)',
            borderRadius: 12, padding: '32px 40px',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            flexWrap: 'wrap', gap: 20,
          }}>
            <div>
              <div style={{
                fontFamily: "'Barlow Condensed', sans-serif",
                fontWeight: 900, fontSize: 24,
                color: '#fff', textTransform: 'uppercase',
                marginBottom: 8,
              }}>WANT A SPOT ON THIS PAGE?</div>
              <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: 0, lineHeight: 1.6, maxWidth: 480 }}>
                We're always looking for passionate people — developers, designers, community managers,
                esports talent, content creators. If you love gaming and want to build something real, reach out.
              </p>
            </div>
            <Link href="/careers" style={{
              background: 'var(--red)', color: '#fff',
              padding: '13px 28px', borderRadius: 6,
              fontWeight: 700, fontSize: 13,
              letterSpacing: '0.08em', textTransform: 'uppercase',
              textDecoration: 'none', flexShrink: 0,
              whiteSpace: 'nowrap',
            }}>
              View Open Roles →
            </Link>
          </div>
        </div>
      </section>

      {/* ── FAIR PLAY COMMITMENT ─────────────────────── */}
      <section style={{ padding: '80px 0', borderBottom: '1px solid var(--border)' }}>
        <div className="container">
          <div style={{
            background: 'linear-gradient(135deg, #0d0d10, #160408)',
            border: '1px solid rgba(232,0,13,0.2)',
            borderRadius: 16, padding: '60px 56px',
            position: 'relative', overflow: 'hidden',
          }}>
            {/* Background glow */}
            <div style={{
              position: 'absolute', inset: 0,
              background: 'radial-gradient(ellipse at 50% 50%, rgba(232,0,13,0.06) 0%, transparent 70%)',
              pointerEvents: 'none',
            }} />
            <div style={{ position: 'relative', zIndex: 2, textAlign: 'center' }}>
              <div style={{ marginBottom: 20, display: 'flex', justifyContent: 'center' }}>
                <Icon icon={Solar.shield} width={48} height={48} />
              </div>
              <h2 style={{
                fontFamily: "'Barlow Condensed', sans-serif",
                fontSize: 'clamp(32px, 4vw, 52px)',
                fontWeight: 900, textTransform: 'uppercase',
                color: '#fff', marginBottom: 20,
                lineHeight: 1.05,
              }}>
                OUR COMMITMENT TO <span style={{ color: 'var(--red)' }}>FAIR PLAY</span>
              </h2>
              <p style={{
                fontSize: 15, lineHeight: 1.85,
                color: 'rgba(255,255,255,0.5)',
                maxWidth: 680, margin: '0 auto 40px',
              }}>
                Fair play isn't a setting you toggle on — it's baked into every system on this platform.
                Every match is verified. Every dispute is reviewed by a human. Every payout is protected.
                We take your wins as seriously as you do.
              </p>

              <div style={{
                display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)',
                gap: 1, background: 'var(--border)',
                border: '1px solid var(--border)', borderRadius: 10,
                overflow: 'hidden', marginBottom: 40,
              }}>
                {[
                  { icon: '✅', label: 'Match Verification', sub: 'Every result reviewed' },
                  { icon: '💬', label: 'Dispute System',     sub: 'Human-reviewed cases' },
                  { icon: '💰', label: 'Protected Payouts',  sub: '98% success rate' },
                  { icon: '🔍', label: 'Anti-Cheat Layer',   sub: 'Ongoing monitoring' },
                ].map((f, i) => (
                  <div key={i} style={{
                    background: 'var(--bg-3)',
                    padding: '20px 16px', textAlign: 'center',
                  }}>
                    <div style={{ marginBottom: 8, display: 'flex', justifyContent: 'center' }}>
                      <EmojiSolar emoji={f.icon} size={22} inline={false} />
                    </div>
                    <div style={{
                      fontFamily: "'Barlow Condensed', sans-serif",
                      fontWeight: 800, fontSize: 14,
                      textTransform: 'uppercase', color: '#fff',
                      marginBottom: 4,
                    }}>{f.label}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{f.sub}</div>
                  </div>
                ))}
              </div>

              <Link href="/rules" style={{
                display: 'inline-flex', alignItems: 'center', gap: 8,
                background: 'transparent', color: 'var(--red)',
                border: '1px solid rgba(232,0,13,0.3)',
                padding: '12px 28px', borderRadius: 6,
                fontWeight: 700, fontSize: 13,
                letterSpacing: '0.08em', textTransform: 'uppercase',
                textDecoration: 'none',
              }}>
                <Icon icon={Solar.clipboard} width={16} height={16} /> Read Our Rules & Policies
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── COMMUNITY QUOTE BAND ─────────────────────── */}
      <section style={{
        padding: '56px 0',
        background: 'var(--bg-2)',
        borderBottom: '1px solid var(--border)',
      }}>
        <div className="container">
          <div style={{ textAlign: 'center' }}>
            <blockquote style={{
              fontFamily: "'Barlow Condensed', sans-serif",
              fontSize: 'clamp(24px, 3.5vw, 42px)',
              fontWeight: 900, textTransform: 'uppercase',
              color: '#fff', lineHeight: 1.15,
              letterSpacing: '-0.01em',
              maxWidth: 820, margin: '0 auto 20px',
            }}>
              "WHETHER YOU'RE HERE TO DOMINATE, CREATE, COACH,
              OR JUST <span style={{ color: 'var(--red)' }}>FIND YOUR PEOPLE</span> — THIS IS YOUR PLATFORM."
            </blockquote>
            <cite style={{
              fontFamily: "'Rajdhani', sans-serif",
              fontWeight: 700, fontSize: 12,
              letterSpacing: '0.12em', textTransform: 'uppercase',
              color: 'var(--text-dim)',
            }}>— The Founder, GamerHead</cite>
          </div>
        </div>
      </section>

      {/* ── FINAL CTA ─────────────────────────────────── */}
      <section style={{ padding: '80px 0' }}>
        <div className="container">
          <div style={{ textAlign: 'center', maxWidth: 640, margin: '0 auto' }}>
            <h2 style={{
              fontFamily: "'Barlow Condensed', sans-serif",
              fontSize: 'clamp(36px, 4vw, 56px)',
              fontWeight: 900, textTransform: 'uppercase',
              color: '#fff', marginBottom: 20, lineHeight: 1.05,
            }}>
              READY TO BE PART OF <span style={{ color: 'var(--red)' }}>SOMETHING?</span>
            </h2>
            <p style={{
              fontSize: 14, lineHeight: 1.8,
              color: 'var(--text-muted)',
              marginBottom: 36,
            }}>
              Create an account, enter a tournament, challenge someone to a match,
              post an idea in the forum, or just say hi in Discord.
              The community is live. The competition is real. The door is open.
            </p>

            <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
              <Link href="/tournaments" style={{
                display: 'inline-flex', alignItems: 'center', gap: 8,
                background: 'var(--red)', color: '#fff',
                padding: '14px 32px', borderRadius: 6,
                fontWeight: 700, fontSize: 14,
                letterSpacing: '0.08em', textTransform: 'uppercase',
                textDecoration: 'none',
              }}>
                <Icon icon={Solar.trophy} width={16} height={16} /> Join a Tournament
              </Link>
              <Link href="/forum" style={{
                display: 'inline-flex', alignItems: 'center', gap: 8,
                background: 'transparent', color: '#fff',
                padding: '14px 32px', borderRadius: 6,
                border: '1px solid rgba(255,255,255,0.15)',
                fontWeight: 700, fontSize: 14,
                letterSpacing: '0.08em', textTransform: 'uppercase',
                textDecoration: 'none',
              }}>
                <Icon icon={Solar.chat} width={16} height={16} /> Explore the Forum
              </Link>
              <Link href="/coaching" style={{
                display: 'inline-flex', alignItems: 'center', gap: 8,
                background: 'transparent', color: '#fff',
                padding: '14px 32px', borderRadius: 6,
                border: '1px solid rgba(255,255,255,0.15)',
                fontWeight: 700, fontSize: 14,
                letterSpacing: '0.08em', textTransform: 'uppercase',
                textDecoration: 'none',
              }}>
                <Icon icon={Solar.microphone} width={16} height={16} /> Find a Coach
              </Link>
            </div>

            {/* Social proof */}
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              gap: 12, marginTop: 48,
            }}>
              <div style={{ display: 'flex' }}>
                {[Solar.user, Solar.gamepad, Solar.trophy, Solar.palette, Solar.sword].map((icon, i) => (
                  <div key={i} style={{
                    width: 32, height: 32, borderRadius: '50%',
                    background: 'var(--bg-3)',
                    border: '2px solid var(--bg-1)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 14, marginLeft: i === 0 ? 0 : -8,
                    zIndex: 5 - i,
                  }}><Icon icon={icon} width={14} height={14} /></div>
                ))}
              </div>
              <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                Thousands of gamers already inside →
              </span>
            </div>
          </div>
        </div>
      </section>

    </div>
  )
}

/* ─── HELPERS ───────────────────────────────────────── */
const socialBtnStyle: React.CSSProperties = {
  width: 30, height: 30,
  background: 'rgba(255,255,255,0.05)',
  border: '1px solid rgba(255,255,255,0.08)',
  borderRadius: 6,
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  fontSize: 12, color: 'var(--text-muted)',
  textDecoration: 'none', cursor: 'pointer',
  transition: 'border-color 0.2s',
}