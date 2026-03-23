'use client'

import Link from 'next/link'
import { Icon } from '@iconify/react'
import { Solar } from '@/lib/solar-duotone'

const features = [
  { icon: Solar.bolt, name: 'Premium Match Multiplier', desc: 'Earn more XP during your matches. Premium access rewards you with a 1.25x XP boost on every match!' },
  { icon: Solar.forbidden, name: 'Absolutely No Ads', desc: 'Annoyed of seeing ads around the site? Premium access removes all ads across the entire platform.' },
  { icon: Solar.pen, name: 'Username Change', desc: 'Thought of a new name? Premium access rewards you one username change token per month.' },
  { icon: Solar.ticket, name: 'Priority Support', desc: 'Want to be first in the queue? Premium access allows your tickets to be bumped up in the support queue.' },
  { icon: Solar.palette, name: 'Ultra Profile Customization', desc: 'Want your page to stand out? Premium access unlocks special profile customizations and hex color themes.' },
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

export default function PremiumPage() {
  return (
    <div className="container" style={{ paddingBottom: 60 }}>

      {/* ── PAGE HEADER / HERO ── */}
      <div className="premium-hero">
        <div className="premium-hero-glow" />
        <div className="premium-hero-left">
          <div className="hero-badge" style={{ marginBottom: 20 }}>
            <Icon icon={Solar.star} width={18} height={18} style={{ display: 'inline-block', verticalAlign: 'middle', marginRight: 4 }} /> Premium Membership
          </div>
          <h1 className="premium-hero-title">Making a <span>Difference.</span></h1>
          <p className="premium-hero-sub">
            GamerHead is here to bring you a new brand of competition. Our team has built online gaming to its fullest potential. We want the best for our community, so we have made the best.
          </p>
          <div style={{ display: 'flex', gap: 12, marginTop: 28 }}>
            <Link href="/store" className="btn-primary">Get Premium — $9.99/mo</Link>
            <Link href="/rules" className="btn-secondary">View Full Features</Link>
          </div>
        </div>
        <div className="premium-hero-right">
          <div className="premium-hero-badge-mockup">
            <div className="premium-mockup-icon"><Icon icon={Solar.star} width={28} height={28} /></div>
            <div className="premium-mockup-name">Premium Player</div>
            <div className="premium-mockup-tag">GamerHead</div>
            <div className="premium-mockup-perks">
              <span>1.25x XP</span>
              <span>No Ads</span>
              <span>Priority</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── WHY PREMIUM ── */}
      <section style={{ padding: '60px 0' }}>
        <div className="section-header" style={{ textAlign: 'center', marginBottom: 40 }}>
          <h2 className="section-title">Why is <span>Premium</span> worth it?</h2>
          <p className="section-subtitle">You unlock special site features, receive a premium badge and discounts in our store</p>
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

      {/* ── PRICING ── */}
      <section style={{ padding: '0 0 60px' }}>
        <div className="section-header" style={{ textAlign: 'center', marginBottom: 40 }}>
          <h2 className="section-title">Take advantage of this <span>Opportunity</span></h2>
          <p className="section-subtitle" style={{ maxWidth: 560, margin: '8px auto 0' }}>
            Purchasing premium helps our team and community expand. Becoming a premium member provides a ton of benefits you will enjoy.
          </p>
        </div>

        <div className="premium-plans-grid">

          {/* Free Plan */}
          <div className="premium-plan-card">
            <div className="premium-plan-header">
              <div>
                <h3 className="premium-plan-title">Member</h3>
                <p className="premium-plan-desc">Perfect for getting started and competing for free.</p>
              </div>
              <div className="premium-plan-price">
                <span className="premium-plan-price-value">Free</span>
                <span className="premium-plan-price-period">Always</span>
              </div>
            </div>
            <div className="premium-plan-features">
              {freeFeatures.map((f, i) => (
                <div key={i} className={`premium-plan-feature${f.included ? '' : ' excluded'}`}>
                  <span className="premium-plan-feature-icon" style={{ display: 'inline-flex', alignItems: 'center' }}>
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
            <div className="premium-plan-badge">Most Popular</div>
            <div className="premium-plan-header">
              <div>
                <h3 className="premium-plan-title">Premium</h3>
                <p className="premium-plan-desc">Unlock everything and compete at the highest level.</p>
              </div>
              <div className="premium-plan-price">
                <span className="premium-plan-price-value">$9.99</span>
                <span className="premium-plan-price-period">/ month</span>
              </div>
            </div>
            <div className="premium-plan-features">
              {premiumFeatures.map((f, i) => (
                <div key={i} className="premium-plan-feature">
                  <span className="premium-plan-feature-icon" style={{ display: 'inline-flex', alignItems: 'center' }}>
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

    </div>
  )
}