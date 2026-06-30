'use client'

import Link from 'next/link'
import { Icon } from '@iconify/react'
import { Solar } from '@/lib/solar-duotone'

const stats = [
  { icon: Solar.users,    value: '14,200+', label: 'Premium members' },
  { icon: Solar.bolt,     value: '1.25×',   label: 'XP every match' },
  { icon: Solar.sparkles, value: '2 / mo',  label: 'Free XP tokens' },
  { icon: Solar.star,     value: '4.9/5',   label: 'Member rating' },
]

const features = [
  { icon: Solar.bolt, name: 'Premium Match Multiplier', desc: 'Earn more XP during your matches. Premium access rewards you with a 1.25x XP boost on every match!' },
  { icon: Solar.forbidden, name: 'Absolutely No Ads', desc: 'Annoyed of seeing ads around the site? Premium access removes all ads across the entire platform.' },
  { icon: Solar.pen, name: 'Username Change', desc: 'Thought of a new name? Premium access rewards you one username change token per month.' },
  { icon: Solar.ticket, name: 'Priority Support', desc: 'Want to be first in the queue? Premium access allows your tickets to be bumped up in the support queue.' },
  { icon: Solar.palette, name: 'Ultra Profile Customization', desc: 'Want your page to stand out? Premium access unlocks special profile customizations and hex color themes.' },
  { icon: Solar.crown, name: 'Premium Badge & Icon', desc: 'Stand out in every lobby. A premium crown sits next to your name across forums, ladders and leaderboards.' },
]

const freeFeatures = [
  { included: true, text: 'Play all competitions on the platform' },
  { included: true, text: 'Access to ladder & wager matches' },
  { included: true, text: 'Basic profile customization' },
  { included: true, text: 'Standard support queue' },
  { included: true, text: 'Access to all games' },
  { included: false, text: 'XP Multiplier boost' },
  { included: false, text: 'No ads' },
  { included: false, text: 'Priority support' },
  { included: false, text: 'Username change token' },
]

const premiumFeatures = [
  { included: true, text: 'Everything in Free' },
  { included: true, text: 'Hex colorboard & profile badge' },
  { included: true, text: 'Username change available' },
  { included: true, text: '1.25x base XP multiplier' },
  { included: true, text: 'Premium icon on profile' },
  { included: true, text: 'Free Double XP Tokens (2/month)' },
  { included: true, text: 'No ads — ever' },
  { included: true, text: 'Priority support queue' },
]

const testimonials = [
  { initial: 'K', color: '#e8000d', name: 'Kahlo', rank: 'Diamond · 1,840 matches', quote: 'The XP boost is no joke. I hit my season rank a full two weeks before my squad and the no-ads alone is worth it.' },
  { initial: 'R', color: '#1f6feb', name: 'Ravyn', rank: 'Plat II · Team captain', quote: 'Priority support bumped my payout ticket to the front and it was sorted in an hour. That sold me on keeping it.' },
  { initial: 'M', color: '#8957e5', name: 'Mira', rank: 'Founding member', quote: 'Honestly bought it for the badge and the hex themes, stayed for the free monthly XP tokens. Easy ten bucks.' },
]

const faqs = [
  { q: 'Can I cancel anytime?', a: 'Yes. Premium is month-to-month with no contract — cancel in one click from your settings and you keep access until the end of your billing period.' },
  { q: 'What happens to my badge if I cancel?', a: 'Your premium crown, hex themes and profile customizations stay active until your current period ends, then revert to the free tier. Re-subscribe anytime to bring them back.' },
  { q: 'Does the XP boost stack with Double XP tokens?', a: 'It does. Your 1.25× base multiplier applies on top of any Double XP token you activate, so a boosted token match earns 2.5× XP.' },
  { q: 'How do I pay?', a: 'We accept all major cards and platform wallet balance at secure checkout. Billing is handled by our PCI-compliant processor — we never store your card details.' },
  { q: 'Is there a refund?', a: 'If something goes wrong in the first 7 days, reach out to priority support and we will make it right, no questions asked.' },
]

export default function PremiumPage() {
  return (
    <div style={{ paddingBottom: 0 }}>
      <div className="container">

      {/* ── HERO ── */}
      <div className="premium-hero">
        <div className="premium-hero-glow" />
        <div className="premium-hero-left">
          <div className="hero-badge" style={{ marginBottom: 22 }}>
            <Icon icon={Solar.star} width={15} height={15} style={{ display: 'inline-block', verticalAlign: 'middle' }} /> Premium Membership
          </div>
          <h1 className="premium-hero-title">Play like it <span>matters.</span></h1>
          <p className="premium-hero-sub">
            GamerHead Premium is built for competitors who want every edge — more XP on every match, zero ads, priority support and a profile that stands out in every lobby. One membership, the whole platform unlocked.
          </p>
          <div style={{ display: 'flex', gap: 12, marginTop: 30, flexWrap: 'wrap' }}>
            <Link href="/store" className="btn-primary">Get Premium — $9.99/mo</Link>
            <a href="#pricing" className="btn-secondary">Compare Plans</a>
          </div>
          <div className="premium-hero-trust">
            <Icon icon={Solar.shield} width={15} height={15} />
            Cancel anytime · Instant activation · Secure checkout
          </div>
        </div>

        <div className="premium-hero-right">
          <div className="premium-card">
            <div className="premium-card-glow" />
            <div className="premium-card-shine" />
            <div className="premium-card-head">
              <div className="premium-card-logo">Gamer<span>Head</span></div>
              <div className="premium-card-tier"><Icon icon={Solar.star} width={12} height={12} /> Premium</div>
            </div>
            <div className="premium-card-emblem"><Icon icon={Solar.star} width={30} height={30} /></div>
            <div>
              <div className="premium-card-label">Membership</div>
              <div className="premium-card-name">Premium Player</div>
              <div className="premium-card-perks">
                <span>1.25× XP</span>
                <span>No Ads</span>
                <span>Priority</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── STATS BAND ── */}
      <div className="premium-stats">
        {stats.map((s, i) => (
          <div className="premium-stat" key={i}>
            <div className="premium-stat-icon"><Icon icon={s.icon} width={24} height={24} /></div>
            <div>
              <div className="premium-stat-value">{s.value}</div>
              <div className="premium-stat-label">{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* ── WHY PREMIUM ── */}
      <section style={{ padding: '64px 0' }}>
        <div className="section-header" style={{ textAlign: 'center', marginBottom: 40 }}>
          <h2 className="section-title">Everything you get with <span>Premium</span></h2>
          <p className="section-subtitle">Real perks that change how you play, customize and get supported across the platform.</p>
        </div>
        <div className="premium-features-grid">
          {features.map((f, i) => (
            <div className="premium-feature-card" key={i}>
              <div className="premium-feature-icon"><Icon icon={f.icon} width={28} height={28} /></div>
              <div>
                <h3 className="premium-feature-name">{f.name}</h3>
                <p className="premium-feature-desc">{f.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── XP SHOWCASE ── */}
      <section className="premium-showcase">
        <div className="premium-showcase-text">
          <div className="hero-badge" style={{ marginBottom: 18 }}>
            <Icon icon={Solar.bolt} width={15} height={15} /> XP Multiplier
          </div>
          <h2 className="premium-showcase-title">Climb the ranks <span>25% faster</span></h2>
          <p className="premium-showcase-sub">
            Every match you play earns a permanent 1.25× boost — and it stacks on top of Double XP tokens. The same grind, a bigger payout, season after season.
          </p>
          <ul className="premium-showcase-list">
            <li><Icon icon={Solar.check} width={18} height={18} /> Applies to every ranked &amp; ladder match</li>
            <li><Icon icon={Solar.check} width={18} height={18} /> Stacks with 2 free Double XP tokens monthly</li>
            <li><Icon icon={Solar.check} width={18} height={18} /> Reach season rewards weeks earlier</li>
          </ul>
        </div>
        <div className="premium-showcase-visual">
          <div className="premium-xp-row">
            <div className="premium-xp-head"><span>Free member</span><span>+100 XP</span></div>
            <div className="premium-xp-bar"><div className="premium-xp-fill free" style={{ width: '64%' }} /></div>
          </div>
          <div className="premium-xp-row">
            <div className="premium-xp-head"><span className="prem">Premium member</span><span className="prem">+125 XP</span></div>
            <div className="premium-xp-bar"><div className="premium-xp-fill prem" style={{ width: '100%' }} /></div>
          </div>
          <div className="premium-xp-note">
            <Icon icon={Solar.fire} width={16} height={16} /> Same match — 25% more progress, every time.
          </div>
        </div>
      </section>

      {/* ── PRICING ── */}
      <section id="pricing" style={{ padding: '64px 0' }}>
        <div className="section-header" style={{ textAlign: 'center', marginBottom: 40 }}>
          <h2 className="section-title">Pick your <span>plan</span></h2>
          <p className="section-subtitle" style={{ maxWidth: 540, margin: '8px auto 0' }}>
            Start free and upgrade whenever you&apos;re ready. No contracts, cancel in one click.
          </p>
        </div>

        <div className="premium-plans-grid">

          {/* Free Plan */}
          <div className="premium-plan-card">
            <div className="premium-plan-header">
              <div className="premium-plan-titlerow">
                <h3 className="premium-plan-title">Member</h3>
              </div>
              <div className="premium-plan-price">
                <span className="premium-plan-price-value">Free</span>
                <span className="premium-plan-price-period">forever</span>
              </div>
              <p className="premium-plan-desc">Perfect for getting started and competing for free.</p>
            </div>
            <div className="premium-plan-features">
              {freeFeatures.map((f, i) => (
                <div key={i} className={`premium-plan-feature${f.included ? '' : ' excluded'}`}>
                  <span className="premium-plan-feature-icon">
                    <Icon icon={f.included ? Solar.check : Solar.xCircle} width={18} height={18} style={{ display: 'block' }} />
                  </span>
                  <span>{f.text}</span>
                </div>
              ))}
            </div>
            <div className="premium-plan-footer">
              <button className="btn-secondary" style={{ width: '100%', justifyContent: 'center', padding: '12px' }}>
                Play Now — Free
              </button>
            </div>
          </div>

          {/* Premium Plan */}
          <div className="premium-plan-card premium-plan-featured">
            <div className="premium-plan-header">
              <div className="premium-plan-titlerow">
                <h3 className="premium-plan-title">Premium</h3>
                <span className="premium-plan-badge">Most Popular</span>
              </div>
              <div className="premium-plan-price">
                <span className="premium-plan-price-value">$9.99</span>
                <span className="premium-plan-price-period">/ month</span>
              </div>
              <p className="premium-plan-desc">Unlock everything and compete at the highest level.</p>
            </div>
            <div className="premium-plan-features">
              {premiumFeatures.map((f, i) => (
                <div key={i} className="premium-plan-feature">
                  <span className="premium-plan-feature-icon">
                    <Icon icon={Solar.check} width={18} height={18} />
                  </span>
                  <span>{f.text}</span>
                </div>
              ))}
            </div>
            <div className="premium-plan-footer">
              <button className="btn-primary" style={{ width: '100%', justifyContent: 'center', padding: '12px' }}>
                Get Premium Now
              </button>
            </div>
          </div>

        </div>
      </section>

      {/* ── TESTIMONIALS ── */}
      <section style={{ padding: '20px 0 64px' }}>
        <div className="section-header" style={{ textAlign: 'center', marginBottom: 40 }}>
          <h2 className="section-title">Loved by <span>competitors</span></h2>
          <p className="section-subtitle">Thousands of players upgraded and never looked back.</p>
        </div>
        <div className="premium-testimonials">
          {testimonials.map((t, i) => (
            <div className="premium-testimonial" key={i}>
              <div className="premium-testimonial-stars">
                {Array.from({ length: 5 }).map((_, s) => (
                  <Icon key={s} icon={Solar.star} width={16} height={16} />
                ))}
              </div>
              <p className="premium-testimonial-quote">&ldquo;{t.quote}&rdquo;</p>
              <div className="premium-testimonial-author">
                <span className="premium-testimonial-avatar" style={{ background: t.color }}>{t.initial}</span>
                <div>
                  <div className="premium-testimonial-name">{t.name}</div>
                  <div className="premium-testimonial-rank">{t.rank}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── FAQ ── */}
      <section style={{ padding: '20px 0 72px' }}>
        <div className="section-header" style={{ textAlign: 'center', marginBottom: 40 }}>
          <h2 className="section-title">Questions? <span>Answered.</span></h2>
          <p className="section-subtitle">Everything you need to know before you upgrade.</p>
        </div>
        <div className="premium-faq">
          {faqs.map((f, i) => (
            <details className="premium-faq-item" key={i}>
              <summary className="premium-faq-q">
                {f.q}
                <Icon icon={Solar.question} width={18} height={18} className="premium-faq-chevron" />
              </summary>
              <p className="premium-faq-a">{f.a}</p>
            </details>
          ))}
        </div>
      </section>

      </div>

      {/* ── FINAL CTA ── */}
      <section className="premium-cta-band">
        <div className="container premium-cta-inner">
          <div className="premium-cta-glow" />
          <div className="hero-badge" style={{ marginBottom: 18 }}>
            <Icon icon={Solar.crown} width={15} height={15} /> Join the founding season
          </div>
          <h2 className="premium-cta-title">Ready to play like it <span>matters</span>?</h2>
          <p className="premium-cta-sub">Upgrade today and start earning more from your very next match. Cancel anytime.</p>
          <div className="premium-cta-actions">
            <Link href="/store" className="btn-primary">Get Premium — $9.99/mo</Link>
            <a href="#pricing" className="btn-secondary">Compare Plans</a>
          </div>
          <div className="premium-hero-trust" style={{ justifyContent: 'center', marginTop: 20 }}>
            <Icon icon={Solar.shield} width={15} height={15} />
            14,200+ members · Cancel anytime · Secure checkout
          </div>
        </div>
      </section>

    </div>
  )
}
