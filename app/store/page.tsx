'use client'

import { useState, useEffect, Suspense } from 'react'
import Link from 'next/link'
import { storeApi } from '@/lib/api'
import { useAuth } from '@/lib/auth-context'
import { trackEvent } from '@/lib/gtag'
import { sendActivity } from '@/lib/socket'
import { loadCart, saveCart, subscribeCart } from '@/lib/cart'
import { Icon } from '@iconify/react'
import { Solar } from '@/lib/solar-duotone'

// ─── Types ────────────────────────────────────────────────────────────────────
interface StoreItem {
  id: string
  name: string
  price: number
  image: string
  category: string
  badge?: string
  credits?: number
  days?: number
}
interface CartItem extends StoreItem { qty: number }

// ─── Static content (trust + reassurance, not fetched) ─────────────────────────
const trustChips = [
  { icon: Solar.lock,      label: 'Secure checkout' },
  { icon: Solar.bolt,      label: 'Instant delivery' },
  { icon: Solar.shield,    label: 'Cancel Premium anytime' },
  { icon: Solar.users,     label: '14,200+ players' },
]

const premiumPerks = [
  { icon: Solar.bolt,    name: '1.25× XP on every match',  desc: 'The same grind, a bigger payout — season after season.' },
  { icon: Solar.forbidden, name: 'No ads, anywhere',       desc: 'A clean, distraction-free platform from the second you upgrade.' },
  { icon: Solar.ticket,  name: 'Priority support queue',   desc: 'Your tickets jump the line when you need a hand.' },
  { icon: Solar.palette, name: 'Ultra profile customization', desc: 'Hex themes and layouts that make your page stand out.' },
  { icon: Solar.pen,     name: 'Monthly username change',  desc: 'A fresh name whenever you want one, on the house.' },
  { icon: Solar.crown,   name: 'Premium badge & crown',    desc: 'A premium crown next to your name in every lobby.' },
]

const guarantees = [
  { icon: Solar.lock,   title: 'Encrypted payments',   desc: 'Card and PayPal checkout handled by PCI-compliant processors. We never store your card details.' },
  { icon: Solar.bolt,   title: 'Delivered instantly',  desc: 'Tickets land in your wallet and Premium activates the moment your payment clears.' },
  { icon: Solar.shield, title: '7-day Premium guarantee', desc: 'Not happy in your first week? Reach out and we’ll make it right — no questions asked.' },
  { icon: Solar.chat,   title: 'Real human support',   desc: 'A support team that actually answers, ready whenever you need them.' },
]

const faqs = [
  { q: 'Do I need to buy anything to play?', a: 'No. GamerHead is free to play — you can compete in free matches and climb the ladder without spending a cent. Tickets and Premium simply unlock more when you’re ready for it.' },
  { q: 'Do tickets ever expire?', a: 'Never. Tickets sit in your wallet until you use them, so it’s completely fine to stock up at a better rate and play whenever it suits you.' },
  { q: 'Can I cancel Premium?', a: 'Anytime, in one click from your settings. You keep every perk until the end of the period you already paid for — no lock-in, no contracts.' },
  { q: 'Is my payment secure?', a: 'Yes. Checkout runs through PCI-compliant processors (card & PayPal) over an encrypted connection. Your card details never touch our servers.' },
]

// ─── Helpers ───────────────────────────────────────────────────────────────────
const isPremiumItem = (i: StoreItem) => /premium/i.test(`${i.category} ${i.name}`)
const ticketQty = (i: StoreItem) => i.credits ?? Number(i.name.match(/\d+/)?.[0] ?? 0)
const premiumMonths = (i: StoreItem) => {
  if (i.days) return Math.max(1, Math.round(i.days / 30))
  const m = i.name.match(/(\d+)\s*month/i)
  if (m) return Number(m[1])
  if (/year/i.test(i.name)) return 12
  return 1
}

// ─── Add-to-cart control (shared by ticket + premium cards) ─────────────────────
function CartControl({
  inCart, flashing, onAdd, onInc, onDec, accent = 'var(--red)', label = 'Add to Cart',
}: {
  inCart?: CartItem
  flashing: boolean
  onAdd: () => void
  onInc: () => void
  onDec: () => void
  accent?: string
  label?: string
}) {
  if (inCart) {
    return (
      <div className="shop-qty">
        <button aria-label="Remove one" onClick={onDec} className="shop-qty-btn">
          <Icon icon="solar:minus-circle-bold-duotone" width={18} height={18} />
        </button>
        <span className="shop-qty-count">
          <Icon icon={Solar.checkRead} width={15} height={15} style={{ color: '#4ade80' }} />
          {inCart.qty} in cart
        </span>
        <button aria-label="Add one" onClick={onInc} className="shop-qty-btn">
          <Icon icon="solar:add-circle-bold-duotone" width={18} height={18} />
        </button>
      </div>
    )
  }
  return (
    <button
      onClick={onAdd}
      className="shop-add-btn"
      style={{ ['--acc' as string]: accent, animation: flashing ? 'shop-pop 0.4s ease' : undefined }}
    >
      <Icon icon={Solar.cart} width={15} height={15} /> {label}
    </button>
  )
}

// ─── Upwork-Connects-style ticket purchaser ────────────────────────────────────
const howItWorks = [
  { icon: Solar.tickets, title: 'Pick a bundle', desc: 'Bigger bundles drop your cost per ticket — no subscription, ever.' },
  { icon: Solar.lock,    title: 'Check out securely', desc: 'Pay by card, PayPal or wallet balance at encrypted checkout.' },
  { icon: Solar.bolt,    title: 'Delivered instantly', desc: 'Tickets land in your wallet the moment payment clears.' },
  { icon: Solar.trophy,  title: 'Enter & compete', desc: 'Spend on any prize match or tournament — tickets never expire.' },
]

function TicketPurchase({
  items, base, balance, onAdd,
}: {
  items: StoreItem[]
  base: number
  balance: number | null
  onAdd: (item: StoreItem, qty: number) => void
}) {
  const defaultId = (items.find(i => /popular/i.test(i.badge ?? '')) ?? items[0])?.id ?? null
  const [selId, setSelId] = useState<string | null>(null)
  const [qty, setQty] = useState(1)
  const [added, setAdded] = useState(false)

  if (!items.length) return null
  // `selId` stays null until the user picks; the default bundle is derived, no effect needed.
  const selected = items.find(i => i.id === (selId ?? defaultId)) ?? items[0]

  const packQty      = ticketQty(selected)
  const perTicket    = packQty > 0 ? selected.price / packQty : selected.price
  const ticketsAdded = packQty * qty
  const subtotal     = selected.price * qty
  const clampQty = (n: number) => Math.max(1, Math.min(99, Math.floor(n) || 1))

  const handleAdd = () => {
    onAdd(selected, qty)
    setAdded(true)
    setTimeout(() => setAdded(false), 1400)
  }

  return (
    <div className="shop-buy">
      {/* Purchase card */}
      <div className="shop-buy-card">
        <div className="shop-buy-head">
          <div>
            <div className="shop-buy-title">Buy Tickets</div>
            <div className="shop-buy-subtitle">Choose a bundle and how many you need.</div>
          </div>
          {balance != null && (
            <div className="shop-buy-balance">
              <span className="shop-buy-balance-lbl">Your balance</span>
              <span className="shop-buy-balance-val"><Icon icon={Solar.ticket} width={16} height={16} /> {balance}</span>
            </div>
          )}
        </div>

        <div className="shop-buy-label">Bundle</div>
        <div className="shop-buy-packs">
          {items.map(i => {
            const q      = ticketQty(i)
            const per    = q > 0 ? i.price / q : i.price
            const s      = q > 0 && base > 0 ? Math.max(0, Math.round((1 - per / base) * 100)) : 0
            const active = i.id === selected.id
            const pop    = /popular/i.test(i.badge ?? '')
            return (
              <button
                key={i.id}
                type="button"
                className={`shop-buy-pack${active ? ' active' : ''}`}
                onClick={() => setSelId(i.id)}
                aria-pressed={active}
              >
                <span className="shop-buy-pack-radio" />
                <span className="shop-buy-pack-main">
                  <span className="shop-buy-pack-count">
                    {q} Tickets
                    {pop && <span className="shop-buy-pack-tag">Popular</span>}
                  </span>
                  <span className="shop-buy-pack-per">${per.toFixed(2)} / ticket</span>
                </span>
                <span className="shop-buy-pack-right">
                  <span className="shop-buy-pack-price">${i.price.toFixed(2)}</span>
                  {s > 0 && <span className="shop-save">Save {s}%</span>}
                </span>
              </button>
            )
          })}
        </div>

        <div className="shop-buy-qtyrow">
          <span className="shop-buy-label" style={{ margin: 0 }}>Quantity</span>
          <div className="shop-buy-stepper">
            <button type="button" onClick={() => setQty(q => clampQty(q - 1))} aria-label="Decrease quantity">
              <Icon icon="solar:minus-circle-bold-duotone" width={22} height={22} />
            </button>
            <input
              type="text" inputMode="numeric" value={qty}
              onChange={e => setQty(clampQty(Number(e.target.value.replace(/\D/g, ''))))}
              aria-label="Bundle quantity"
            />
            <button type="button" onClick={() => setQty(q => clampQty(q + 1))} aria-label="Increase quantity">
              <Icon icon="solar:add-circle-bold-duotone" width={22} height={22} />
            </button>
          </div>
        </div>

        <div className="shop-buy-summary">
          <div className="shop-buy-line">
            <span>Tickets you’ll get</span>
            <strong><Icon icon={Solar.ticket} width={15} height={15} style={{ color: '#F0C040' }} /> {ticketsAdded}</strong>
          </div>
          <div className="shop-buy-line">
            <span>Price per ticket</span>
            <span>${perTicket.toFixed(2)}</span>
          </div>
          <div className="shop-buy-line total">
            <span>Total</span>
            <strong>${subtotal.toFixed(2)}</strong>
          </div>
        </div>

        <button type="button" className={`shop-buy-cta${added ? ' added' : ''}`} onClick={handleAdd}>
          {added
            ? <><Icon icon="solar:cart-check-bold-duotone" width={19} height={19} className="shop-buy-cta-icon" /> Added to cart</>
            : <><Icon icon={Solar.cart} width={16} height={16} /> Add {ticketsAdded} Tickets · ${subtotal.toFixed(2)}</>}
        </button>
        <div className="shop-buy-note">
          <Icon icon={Solar.lock} width={13} height={13} /> Secure checkout · instant delivery · tickets never expire
        </div>
      </div>

      {/* How it works panel */}
      <div className="shop-buy-info">
        <div className="shop-buy-info-title">How tickets work</div>
        {howItWorks.map((s, i) => (
          <div className="shop-buy-step" key={i}>
            <div className="shop-buy-step-num">
              <Icon icon={s.icon} width={18} height={18} />
            </div>
            <div>
              <div className="shop-buy-step-title">{s.title}</div>
              <div className="shop-buy-step-desc">{s.desc}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Premium plan card ─────────────────────────────────────────────────────────
function PremiumCard({
  item, months, perMonth, savePct, featured, inCart, flashing, onAdd, onInc, onDec,
}: {
  item: StoreItem
  months: number
  perMonth: number
  savePct: number
  featured: boolean
  inCart?: CartItem
  flashing: boolean
  onAdd: () => void
  onInc: () => void
  onDec: () => void
}) {
  const term = months >= 12 ? `${months / 12} year${months >= 24 ? 's' : ''}` : `${months} month${months > 1 ? 's' : ''}`
  return (
    <div className={`shop-plan${featured ? ' featured' : ''}`}>
      {featured && <div className="shop-plan-flag"><Icon icon={Solar.crown} width={12} height={12} /> Best value</div>}
      <div className="shop-plan-term">
        <Icon icon={Solar.crown} width={16} height={16} style={{ color: '#A78BFA' }} />
        Premium · {term}
      </div>
      <div className="shop-plan-price">
        <span className="shop-plan-permonth">${perMonth.toFixed(2)}</span>
        <span className="shop-plan-permonth-lbl">/ month</span>
      </div>
      <div className="shop-plan-billed">
        Billed ${item.price.toFixed(2)} for {term}
        {savePct > 0 && <span className="shop-plan-save">Save {savePct}%</span>}
      </div>
      <CartControl
        inCart={inCart} flashing={flashing} onAdd={onAdd} onInc={onInc} onDec={onDec}
        accent="#7c5cff" label="Add to Cart"
      />
    </div>
  )
}

// ─── Page ──────────────────────────────────────────────────────────────────────
export default function StorePage() {
  return (
    <Suspense fallback={null}>
      <StorePageContent />
    </Suspense>
  )
}

function StorePageContent() {
  const { user } = useAuth()
  const [storeItems, setStoreItems] = useState<StoreItem[]>([])
  const [cart, setCart] = useState<CartItem[]>([])
  const [flashId, setFlashId] = useState<string | null>(null)

  // Set state AND persist in one step so localStorage is always the source of truth.
  const writeCart = (next: CartItem[]) => { saveCart(next); setCart(next) }

  // Hydrate once from localStorage. We deliberately do NOT auto-persist via a
  // `[cart]` effect — that pattern writes the initial empty array over the stored
  // cart on React's dev double-mount (the ref guard survives the remount), which
  // is exactly how the cart ends up empty on /checkout. Instead every mutation
  // persists explicitly through `writeCart` below.
  useEffect(() => { setCart(loadCart() as CartItem[]) }, [])
  useEffect(() => subscribeCart(() => {
    const stored = loadCart() as CartItem[]
    setCart(prev => JSON.stringify(prev) === JSON.stringify(stored) ? prev : stored)
  }), [])

  useEffect(() => { sendActivity('Browsing Store') }, [])

  useEffect(() => {
    storeApi.getItems().then((data: any[]) => {
      setStoreItems(data.map((item: any) => ({
        id:       item._id || item.id,
        name:     item.name,
        price:    item.price,
        image:    item.image,
        category: item.category,
        badge:    item.badge,
        credits:  item.creditsGranted ?? item.credits,
        days:     item.premiumDays ?? item.days,
      })))
    }).catch((err: any) => console.error('Failed to fetch store items:', err))
  }, [])

  // Derived groups + value math ─────────────────────────────────────────────────
  const premiumItems = storeItems.filter(isPremiumItem)
  const ticketItems  = storeItems.filter(i => !isPremiumItem(i))

  // Reference ("base") rate = the WORST per-unit price (the smallest pack /
  // shortest term), so bigger packs and longer terms show a genuine saving.
  const ticketBase = ticketItems.reduce((max, i) => {
    const q = ticketQty(i)
    return q > 0 ? Math.max(max, i.price / q) : max
  }, 0)

  const premiumBase = premiumItems.reduce((max, i) => Math.max(max, i.price / premiumMonths(i)), 0)

  // Single "Best value" plan = the one with the biggest per-month saving.
  const premiumBestId = premiumItems.reduce<{ id: string | null; save: number }>((best, i) => {
    const save = premiumBase > 0 ? Math.round((1 - (i.price / premiumMonths(i)) / premiumBase) * 100) : 0
    return save > best.save ? { id: i.id, save } : best
  }, { id: null, save: 0 }).id

  const totalItems = cart.reduce((s, i) => s + i.qty, 0)
  const subtotal   = cart.reduce((s, i) => s + i.price * i.qty, 0)

  const addToCart = (item: StoreItem, count = 1) => {
    const ex = cart.find(c => c.id === item.id)
    const next = ex
      ? cart.map(c => c.id === item.id ? { ...c, qty: c.qty + count } : c)
      : [...cart, { ...item, qty: count }]
    writeCart(next)
    trackEvent('add_to_cart', { item_id: item.id, item_name: item.name, price: item.price, item_category: item.category, quantity: count })
    setFlashId(item.id)
    setTimeout(() => setFlashId(null), 450)
  }
  const changeQty = (id: string, d: number) => {
    const next = cart.flatMap(c => {
      if (c.id !== id) return [c]
      const q = c.qty + d
      return q <= 0 ? [] : [{ ...c, qty: q }]
    })
    writeCart(next)
  }

  const inCartOf = (id: string) => cart.find(c => c.id === id)

  return (
    <div className="shop-root">

      {/* ── HERO ─────────────────────────────────────────────────────────────── */}
      <section className="shop-hero">
        <div className="shop-hero-glow" />
        <div className="shop-hero-grid" />
        <div className="container shop-hero-inner">
          <div className="hero-badge" style={{ marginBottom: 20 }}>
            <Icon icon={Solar.cart} width={14} height={14} /> GamerHead Store
          </div>
          <h1 className="shop-hero-title">Fuel your <span>grind.</span></h1>
          <p className="shop-hero-sub">
            Tickets get you into prize matches and tournaments. Premium gets you more from every session.
            Buy exactly what you need, when you need it — tickets never expire and Premium cancels anytime.
            No pressure, no lock-in.
          </p>
          <div className="shop-hero-cta">
            <a href="#tickets" className="btn-primary">Buy Tickets</a>
            <a href="#premium" className="btn-secondary"><Icon icon={Solar.crown} width={15} height={15} /> Explore Premium</a>
          </div>
          <div className="shop-hero-trust">
            {trustChips.map((c, i) => (
              <span key={i} className="shop-hero-chip">
                <Icon icon={c.icon} width={15} height={15} /> {c.label}
              </span>
            ))}
          </div>
        </div>
      </section>

      <div className="container">

        {/* ── TICKETS ─────────────────────────────────────────────────────────── */}
        <section id="tickets" className="shop-section">
          <div className="shop-section-head">
            <div>
              <div className="shop-eyebrow"><Icon icon={Solar.ticket} width={14} height={14} /> Tickets</div>
              <h2 className="section-title">Your entry pass to <span>every prize match</span></h2>
              <p className="section-subtitle" style={{ maxWidth: 620 }}>
                One ticket, one entry — across every game, tournament and ladder match. They never expire,
                so grabbing a larger pack simply lowers your cost per entry. Play whenever you’re ready.
              </p>
            </div>
          </div>

          <TicketPurchase
            items={ticketItems}
            base={ticketBase}
            balance={user ? user.credits : null}
            onAdd={(item, q) => addToCart(item, q)}
          />
        </section>

        {/* ── PREMIUM ─────────────────────────────────────────────────────────── */}
        <section id="premium" className="shop-section shop-premium">
          <div className="shop-section-head">
            <div>
              <div className="shop-eyebrow" style={{ color: '#A78BFA', background: 'rgba(167,139,250,0.1)', borderColor: 'rgba(167,139,250,0.3)' }}>
                <Icon icon={Solar.crown} width={14} height={14} /> Premium Membership
              </div>
              <h2 className="section-title">Get more from <span style={{ color: '#A78BFA' }}>every match</span></h2>
              <p className="section-subtitle" style={{ maxWidth: 620 }}>
                A single membership unlocks the whole platform — more XP, zero ads, priority support and a
                profile that stands out. The longer the term, the less you pay per month. Cancel whenever you like.
              </p>
            </div>
          </div>

          <div className="shop-premium-layout">
            {/* Perks */}
            <div className="shop-perks">
              {premiumPerks.map((p, i) => (
                <div className="shop-perk" key={i}>
                  <div className="shop-perk-icon"><Icon icon={p.icon} width={20} height={20} /></div>
                  <div>
                    <div className="shop-perk-name">{p.name}</div>
                    <div className="shop-perk-desc">{p.desc}</div>
                  </div>
                </div>
              ))}
              <Link href="/premium" className="shop-perks-link">
                See everything in Premium <Icon icon="solar:arrow-right-bold-duotone" width={16} height={16} />
              </Link>
            </div>

            {/* Plans */}
            <div className="shop-plans">
              {premiumItems.map(item => {
                const months   = premiumMonths(item)
                const perMonth = item.price / months
                const savePct  = premiumBase > 0
                  ? Math.max(0, Math.round((1 - perMonth / premiumBase) * 100))
                  : 0
                const featured = item.id === premiumBestId && savePct > 0
                return (
                  <PremiumCard
                    key={item.id}
                    item={item} months={months} perMonth={perMonth} savePct={savePct}
                    featured={featured}
                    inCart={inCartOf(item.id)}
                    flashing={flashId === item.id}
                    onAdd={() => addToCart(item)}
                    onInc={() => changeQty(item.id, 1)}
                    onDec={() => changeQty(item.id, -1)}
                  />
                )
              })}
              <div className="shop-plans-reassure">
                <Icon icon={Solar.shield} width={15} height={15} /> Cancel anytime · Keep your perks until the period ends
              </div>
            </div>
          </div>
        </section>

        {/* ── GUARANTEES ──────────────────────────────────────────────────────── */}
        <section className="shop-section">
          <div className="shop-section-head" style={{ textAlign: 'center', display: 'block' }}>
            <h2 className="section-title">Buy with <span>confidence</span></h2>
            <p className="section-subtitle" style={{ margin: '6px auto 0', maxWidth: 560 }}>
              A store built to be safe, instant and genuinely fair to players.
            </p>
          </div>
          <div className="shop-guarantees">
            {guarantees.map((g, i) => (
              <div className="shop-guarantee" key={i}>
                <div className="shop-guarantee-icon"><Icon icon={g.icon} width={24} height={24} /></div>
                <div className="shop-guarantee-title">{g.title}</div>
                <div className="shop-guarantee-desc">{g.desc}</div>
              </div>
            ))}
          </div>
        </section>

        {/* ── FAQ ─────────────────────────────────────────────────────────────── */}
        <section className="shop-section" style={{ paddingBottom: 40 }}>
          <div className="shop-section-head" style={{ textAlign: 'center', display: 'block' }}>
            <h2 className="section-title">Good to <span>know</span></h2>
            <p className="section-subtitle" style={{ margin: '6px auto 0' }}>
              No fine print — here’s exactly how it works.
            </p>
          </div>
          <div className="shop-faq">
            {faqs.map((f, i) => (
              <details className="shop-faq-item" key={i}>
                <summary className="shop-faq-q">
                  {f.q}
                  <Icon icon="solar:alt-arrow-down-bold-duotone" width={18} height={18} className="shop-faq-chev" />
                </summary>
                <p className="shop-faq-a">{f.a}</p>
              </details>
            ))}
          </div>
        </section>
      </div>

      {/* ── STICKY CHECKOUT BAR (only when items in cart) ────────────────────── */}
      {totalItems > 0 && (
        <div className="shop-checkout-bar">
          <div className="container shop-checkout-inner">
            <div className="shop-checkout-summary">
              <Icon icon={Solar.cart} width={20} height={20} style={{ color: 'var(--red)' }} />
              <span><strong>{totalItems}</strong> item{totalItems > 1 ? 's' : ''} · <strong style={{ color: '#F0C040' }}>${subtotal.toFixed(2)}</strong></span>
            </div>
            <Link href="/checkout" className="btn-primary shop-checkout-btn">
              Checkout <Icon icon="solar:arrow-right-bold-duotone" width={16} height={16} />
            </Link>
          </div>
        </div>
      )}

      <style>{`
        .shop-root { padding-bottom: 100px; }

        /* HERO */
        .shop-hero {
          position: relative;
          width: 100vw; left: 50%; right: 50%;
          margin-left: -50vw; margin-right: -50vw;
          padding: 52px 0 44px;
          background: linear-gradient(180deg, #16060a 0%, #0d0a0c 60%, var(--bg) 100%);
          border-bottom: 1px solid var(--border);
          overflow: hidden; margin-bottom: 8px;
        }
        .shop-hero-glow {
          position: absolute; top: -160px; left: 50%; transform: translateX(-50%);
          width: 720px; height: 420px; border-radius: 50%;
          background: radial-gradient(circle, rgba(232,0,13,0.28), transparent 70%);
          filter: blur(40px); pointer-events: none;
        }
        .shop-hero-grid {
          position: absolute; inset: 0; pointer-events: none;
          background-image:
            linear-gradient(rgba(255,255,255,0.035) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.035) 1px, transparent 1px);
          background-size: 40px 40px;
          mask-image: radial-gradient(ellipse 80% 70% at 50% 0%, black, transparent 75%);
          -webkit-mask-image: radial-gradient(ellipse 80% 70% at 50% 0%, black, transparent 75%);
        }
        .shop-hero-inner { position: relative; z-index: 1; text-align: center; }
        .shop-hero-title {
          font-family: "Barlow Condensed", sans-serif;
          font-size: 4rem; font-weight: 900; line-height: 1;
          text-transform: uppercase; letter-spacing: -0.01em; color: #fff;
          margin: 0 0 16px; text-shadow: 0 4px 30px rgba(0,0,0,0.5);
        }
        .shop-hero-title span { color: var(--red); text-shadow: 0 0 34px var(--red-glow); }
        .shop-hero-sub {
          font-size: 16px; color: #c7c7c7; line-height: 1.7;
          max-width: 640px; margin: 0 auto 30px;
        }
        .shop-hero-cta { display: flex; gap: 12px; justify-content: center; flex-wrap: wrap; }
        .shop-hero-trust {
          display: flex; gap: 10px 20px; justify-content: center; flex-wrap: wrap;
          margin-top: 34px;
        }
        .shop-hero-chip {
          display: inline-flex; align-items: center; gap: 7px;
          font-size: 12.5px; font-weight: 600; color: rgba(255,255,255,0.62);
        }
        .shop-hero-chip svg { color: rgba(255,255,255,0.4); }

        /* SECTION */
        .shop-section { padding: 40px 0; }
        .shop-section-head { margin-bottom: 22px; }
        .shop-eyebrow {
          display: inline-flex; align-items: center; gap: 6px;
          font-size: 11px; font-weight: 800; letter-spacing: 0.12em; text-transform: uppercase;
          color: var(--red); background: rgba(232,0,13,0.1);
          border: 1px solid rgba(232,0,13,0.3); border-radius: 20px;
          padding: 5px 12px; margin-bottom: 16px;
        }

        .shop-save {
          flex-shrink: 0;
          font-size: 10.5px; font-weight: 800; letter-spacing: 0.04em;
          color: #4ade80; background: rgba(74,222,128,0.12);
          border: 1px solid rgba(74,222,128,0.3); border-radius: 20px; padding: 2px 8px;
        }

        /* UPWORK-STYLE TICKET PURCHASER */
        .shop-buy {
          display: grid; grid-template-columns: 1fr 340px; gap: 20px; align-items: start;
        }
        .shop-buy-card {
          background: var(--bg-2); border: 1px solid var(--border); border-radius: 16px;
          padding: 22px 22px 18px;
        }
        .shop-buy-head {
          display: flex; align-items: flex-start; justify-content: space-between; gap: 14px;
          margin-bottom: 18px;
        }
        .shop-buy-title {
          font-family: "Barlow Condensed", sans-serif; font-weight: 800; font-size: 22px;
          text-transform: uppercase; letter-spacing: 0.02em; color: #fff;
        }
        .shop-buy-subtitle { font-size: 13px; color: var(--text-muted); margin-top: 2px; }
        .shop-buy-balance {
          flex-shrink: 0; text-align: right;
          background: var(--bg-3); border: 1px solid var(--border); border-radius: 10px;
          padding: 8px 12px;
        }
        .shop-buy-balance-lbl {
          display: block; font-size: 10px; font-weight: 700; letter-spacing: 0.08em;
          text-transform: uppercase; color: var(--text-muted);
        }
        .shop-buy-balance-val {
          display: inline-flex; align-items: center; gap: 5px;
          font-family: "Barlow Condensed", sans-serif; font-weight: 800; font-size: 20px; color: #F0C040;
        }
        .shop-buy-label {
          font-size: 11px; font-weight: 800; letter-spacing: 0.1em; text-transform: uppercase;
          color: var(--text-muted); margin-bottom: 10px;
        }
        .shop-buy-packs { display: flex; flex-direction: column; gap: 8px; }
        .shop-buy-pack {
          display: flex; align-items: center; gap: 12px; width: 100%;
          background: var(--bg-3); border: 1px solid var(--border); border-radius: 11px;
          padding: 12px 14px; cursor: pointer; text-align: left;
          transition: border-color 0.15s, background 0.15s;
        }
        .shop-buy-pack:hover { border-color: rgba(255,255,255,0.18); }
        .shop-buy-pack.active {
          border-color: var(--red); background: rgba(232,0,13,0.07);
          box-shadow: inset 0 0 0 1px rgba(232,0,13,0.4);
        }
        .shop-buy-pack-radio {
          flex-shrink: 0; width: 18px; height: 18px; border-radius: 50%;
          border: 2px solid rgba(255,255,255,0.25); position: relative; transition: border-color 0.15s;
        }
        .shop-buy-pack.active .shop-buy-pack-radio { border-color: var(--red); }
        .shop-buy-pack.active .shop-buy-pack-radio::after {
          content: ''; position: absolute; inset: 3px; border-radius: 50%; background: var(--red);
        }
        .shop-buy-pack-main { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 2px; }
        .shop-buy-pack-count {
          display: flex; align-items: center; gap: 8px;
          font-family: "Barlow Condensed", sans-serif; font-weight: 800; font-size: 17px;
          text-transform: uppercase; letter-spacing: 0.02em; color: #fff;
        }
        .shop-buy-pack-tag {
          font-family: "Inter", sans-serif; font-size: 9.5px; font-weight: 800; letter-spacing: 0.06em;
          text-transform: uppercase; color: var(--red); background: rgba(232,0,13,0.12);
          border: 1px solid rgba(232,0,13,0.3); border-radius: 20px; padding: 2px 8px;
        }
        .shop-buy-pack-per { font-size: 12px; color: var(--text-muted); }
        .shop-buy-pack-right {
          flex-shrink: 0; display: flex; flex-direction: column; align-items: flex-end; gap: 4px;
        }
        .shop-buy-pack-price {
          font-family: "Barlow Condensed", sans-serif; font-weight: 900; font-size: 19px; color: #F0C040;
        }

        .shop-buy-qtyrow {
          display: flex; align-items: center; justify-content: space-between;
          margin: 18px 0; padding-top: 16px; border-top: 1px solid var(--border);
        }
        .shop-buy-stepper {
          display: flex; align-items: center; gap: 4px;
          background: var(--bg-3); border: 1px solid var(--border); border-radius: 10px; padding: 4px;
        }
        .shop-buy-stepper button {
          background: none; border: none; cursor: pointer; color: var(--text-muted);
          display: flex; align-items: center; padding: 2px; transition: color 0.15s;
        }
        .shop-buy-stepper button:hover { color: #fff; }
        .shop-buy-stepper input {
          width: 46px; text-align: center; background: none; border: none; outline: none;
          color: #fff; font-family: "Barlow Condensed", sans-serif; font-weight: 800; font-size: 18px;
          -moz-appearance: textfield;
        }

        .shop-buy-summary {
          background: var(--bg-3); border: 1px solid var(--border); border-radius: 11px;
          padding: 14px 16px; margin-bottom: 14px;
        }
        .shop-buy-line {
          display: flex; align-items: center; justify-content: space-between;
          font-size: 13px; color: var(--text-muted); padding: 4px 0;
        }
        .shop-buy-line strong { color: #fff; display: inline-flex; align-items: center; gap: 6px; }
        .shop-buy-line.total {
          margin-top: 6px; padding-top: 12px; border-top: 1px solid var(--border);
          font-size: 14px; color: #fff;
        }
        .shop-buy-line.total strong {
          font-family: "Barlow Condensed", sans-serif; font-weight: 900; font-size: 24px; color: #F0C040;
        }

        .shop-buy-cta {
          width: 100%; padding: 14px 0; border-radius: 11px; cursor: pointer;
          display: flex; align-items: center; justify-content: center; gap: 8px;
          font-family: "Barlow Condensed", sans-serif; font-weight: 800; font-size: 16px;
          letter-spacing: 0.04em; text-transform: uppercase; color: #fff;
          background: linear-gradient(135deg, var(--red), var(--red-dark));
          border: none; box-shadow: 0 6px 18px rgba(232,0,13,0.28);
          transition: filter 0.15s, transform 0.1s;
        }
        .shop-buy-cta:hover { filter: brightness(1.1); }
        .shop-buy-cta:active { transform: scale(0.99); }
        .shop-buy-cta.added {
          background: linear-gradient(135deg, #22c55e, #16a34a);
          box-shadow: 0 6px 22px rgba(34,197,94,0.42);
          animation: shop-cta-success 0.55s cubic-bezier(0.34, 1.56, 0.64, 1);
        }
        .shop-buy-cta.added:hover { filter: none; }
        .shop-buy-cta-icon { animation: shop-check-pop 0.45s cubic-bezier(0.34, 1.8, 0.5, 1) both; }
        @keyframes shop-cta-success {
          0%   { transform: scale(1); }
          35%  { transform: scale(1.045); }
          65%  { transform: scale(0.985); }
          100% { transform: scale(1); }
        }
        @keyframes shop-check-pop {
          0%   { transform: scale(0) rotate(-30deg); opacity: 0; }
          60%  { transform: scale(1.25) rotate(6deg); opacity: 1; }
          100% { transform: scale(1) rotate(0); opacity: 1; }
        }
        .shop-buy-note {
          display: flex; align-items: center; justify-content: center; gap: 6px;
          font-size: 11.5px; color: var(--text-muted); margin-top: 12px;
        }

        .shop-buy-info {
          background: var(--bg-2); border: 1px solid var(--border); border-radius: 16px;
          padding: 20px; align-self: stretch;
        }
        .shop-buy-info-title {
          font-family: "Barlow Condensed", sans-serif; font-weight: 800; font-size: 16px;
          text-transform: uppercase; letter-spacing: 0.04em; color: #fff; margin-bottom: 16px;
        }
        .shop-buy-step { display: flex; gap: 12px; margin-bottom: 16px; }
        .shop-buy-step:last-child { margin-bottom: 0; }
        .shop-buy-step-num {
          flex-shrink: 0; width: 36px; height: 36px; border-radius: 10px;
          display: flex; align-items: center; justify-content: center;
          background: rgba(240,192,64,0.1); color: #F0C040; border: 1px solid rgba(240,192,64,0.22);
        }
        .shop-buy-step-title {
          font-family: "Barlow Condensed", sans-serif; font-weight: 800; font-size: 14px;
          text-transform: uppercase; letter-spacing: 0.02em; color: #fff; margin-bottom: 2px;
        }
        .shop-buy-step-desc { font-size: 12px; color: var(--text-muted); line-height: 1.5; }

        /* ADD / QTY CONTROLS */
        .shop-add-btn {
          width: 100%; padding: 12px 0; border-radius: 10px; cursor: pointer;
          display: flex; align-items: center; justify-content: center; gap: 7px;
          font-family: "Barlow Condensed", sans-serif; font-weight: 800; font-size: 14px;
          letter-spacing: 0.05em; text-transform: uppercase; color: #fff;
          background: var(--acc, var(--red)); border: 1px solid var(--acc, var(--red));
          transition: filter 0.15s, transform 0.1s;
        }
        .shop-add-btn:hover { filter: brightness(1.12); }
        .shop-add-btn:active { transform: scale(0.98); }
        .shop-qty {
          width: 100%; display: flex; align-items: center; justify-content: space-between;
          background: var(--bg-3); border: 1px solid rgba(74,222,128,0.3);
          border-radius: 10px; padding: 6px 10px;
        }
        .shop-qty-btn {
          background: none; border: none; cursor: pointer; color: var(--text-muted);
          display: flex; align-items: center; transition: color 0.15s;
        }
        .shop-qty-btn:hover { color: #fff; }
        .shop-qty-count {
          display: flex; align-items: center; gap: 7px;
          font-family: "Barlow Condensed", sans-serif; font-weight: 800; font-size: 13px;
          text-transform: uppercase; letter-spacing: 0.04em; color: #fff;
        }

        /* PREMIUM */
        .shop-premium-layout {
          display: grid; grid-template-columns: 1fr 380px; gap: 32px; align-items: start;
        }
        .shop-perks { display: grid; grid-template-columns: repeat(2, 1fr); gap: 14px; align-content: start; }
        .shop-perk {
          display: flex; gap: 12px; padding: 16px;
          background: var(--bg-2); border: 1px solid var(--border); border-radius: 12px;
        }
        .shop-perk-icon {
          flex-shrink: 0; width: 38px; height: 38px; border-radius: 10px;
          display: flex; align-items: center; justify-content: center;
          background: rgba(167,139,250,0.12); color: #A78BFA;
          border: 1px solid rgba(167,139,250,0.25);
        }
        .shop-perk-name {
          font-family: "Barlow Condensed", sans-serif; font-weight: 800; font-size: 15px;
          color: #fff; text-transform: uppercase; letter-spacing: 0.02em; margin-bottom: 3px;
        }
        .shop-perk-desc { font-size: 12.5px; color: var(--text-muted); line-height: 1.5; }
        .shop-perks-link {
          grid-column: 1 / -1; display: inline-flex; align-items: center; gap: 6px;
          font-size: 13px; font-weight: 700; color: #A78BFA; padding: 4px 2px;
        }
        .shop-perks-link:hover { color: #c4b4fb; }

        .shop-plans {
          display: flex; flex-direction: column; gap: 12px;
          background: var(--bg-2); border: 1px solid var(--border); border-radius: 16px; padding: 16px;
        }
        .shop-plan {
          position: relative; border: 1px solid var(--border); border-radius: 12px;
          padding: 16px 18px; background: var(--bg-3); transition: border-color 0.2s, transform 0.15s;
        }
        .shop-plan:hover { border-color: rgba(167,139,250,0.4); }
        .shop-plan.featured {
          border-color: rgba(124,92,255,0.6);
          background: linear-gradient(180deg, rgba(124,92,255,0.1), var(--bg-3) 60%);
          box-shadow: 0 0 0 1px rgba(124,92,255,0.25);
        }
        .shop-plan-flag {
          position: absolute; top: -10px; right: 16px;
          display: inline-flex; align-items: center; gap: 5px;
          background: linear-gradient(135deg, #7c5cff, #a78bfa); color: #fff;
          font-family: "Barlow Condensed", sans-serif; font-weight: 800; font-size: 10.5px;
          letter-spacing: 0.06em; text-transform: uppercase;
          padding: 4px 10px; border-radius: 20px; box-shadow: 0 4px 12px rgba(124,92,255,0.4);
        }
        .shop-plan-term {
          display: flex; align-items: center; gap: 7px;
          font-family: "Barlow Condensed", sans-serif; font-weight: 800; font-size: 15px;
          text-transform: uppercase; letter-spacing: 0.04em; color: #fff; margin-bottom: 8px;
        }
        .shop-plan-price { display: flex; align-items: baseline; gap: 5px; }
        .shop-plan-permonth {
          font-family: "Barlow Condensed", sans-serif; font-weight: 900; font-size: 30px; color: #fff;
        }
        .shop-plan-permonth-lbl { font-size: 13px; color: var(--text-muted); }
        .shop-plan-billed {
          display: flex; align-items: center; gap: 8px; flex-wrap: wrap;
          font-size: 12px; color: var(--text-muted); margin: 4px 0 14px;
        }
        .shop-plan-save {
          font-size: 11px; font-weight: 800; color: #4ade80;
          background: rgba(74,222,128,0.12); border: 1px solid rgba(74,222,128,0.3);
          border-radius: 20px; padding: 2px 9px;
        }
        .shop-plans-reassure {
          display: flex; align-items: center; gap: 7px; justify-content: center;
          font-size: 12px; color: var(--text-muted); padding: 4px 0 2px;
        }
        .shop-plans-reassure svg { color: #A78BFA; }

        /* GUARANTEES */
        .shop-guarantees { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; }
        .shop-guarantee {
          background: var(--bg-2); border: 1px solid var(--border); border-radius: 14px;
          padding: 24px 20px; text-align: center;
        }
        .shop-guarantee-icon {
          width: 52px; height: 52px; border-radius: 14px; margin: 0 auto 14px;
          display: flex; align-items: center; justify-content: center;
          background: rgba(232,0,13,0.1); color: var(--red); border: 1px solid rgba(232,0,13,0.25);
        }
        .shop-guarantee-title {
          font-family: "Barlow Condensed", sans-serif; font-weight: 800; font-size: 16px;
          text-transform: uppercase; letter-spacing: 0.03em; color: #fff; margin-bottom: 8px;
        }
        .shop-guarantee-desc { font-size: 12.5px; color: var(--text-muted); line-height: 1.55; }

        /* FAQ */
        .shop-faq { max-width: 760px; margin: 0 auto; display: flex; flex-direction: column; gap: 10px; }
        .shop-faq-item {
          background: var(--bg-2); border: 1px solid var(--border); border-radius: 12px; overflow: hidden;
        }
        .shop-faq-q {
          display: flex; align-items: center; justify-content: space-between; gap: 12px;
          padding: 18px 20px; cursor: pointer; list-style: none;
          font-family: "Barlow Condensed", sans-serif; font-weight: 700; font-size: 17px;
          color: #fff; text-transform: uppercase; letter-spacing: 0.01em;
        }
        .shop-faq-q::-webkit-details-marker { display: none; }
        .shop-faq-chev { color: var(--text-muted); transition: transform 0.2s ease; flex-shrink: 0; }
        .shop-faq-item[open] .shop-faq-chev { transform: rotate(180deg); }
        .shop-faq-a {
          padding: 0 20px 18px; font-size: 14px; color: var(--text-muted); line-height: 1.65; margin: 0;
        }

        /* STICKY CHECKOUT BAR */
        .shop-checkout-bar {
          position: fixed; bottom: 0; left: 0; right: 0; z-index: 40;
          background: rgba(14,12,15,0.92); backdrop-filter: blur(12px);
          border-top: 1px solid rgba(232,0,13,0.25);
          box-shadow: 0 -8px 30px rgba(0,0,0,0.4);
          animation: shop-slideup 0.28s ease;
        }
        .shop-checkout-inner {
          display: flex; align-items: center; justify-content: space-between; gap: 16px;
          padding: 14px 24px;
        }
        .shop-checkout-summary {
          display: flex; align-items: center; gap: 10px; font-size: 15px; color: #fff;
        }
        .shop-checkout-btn { padding: 12px 28px; }

        @keyframes shop-slideup { from { transform: translateY(100%); } to { transform: translateY(0); } }
        @keyframes shop-pop { 0% { transform: scale(1); } 45% { transform: scale(0.94); } 100% { transform: scale(1); } }

        /* RESPONSIVE */
        @media (max-width: 1100px) {
          .shop-buy { grid-template-columns: 1fr; }
          .shop-premium-layout { grid-template-columns: 1fr; }
          .shop-plans { max-width: 520px; }
          .shop-guarantees { grid-template-columns: repeat(2, 1fr); }
        }
        @media (max-width: 640px) {
          .shop-hero-title { font-size: 2.75rem; }
          .shop-hero { padding: 52px 0 44px; }
          .shop-buy-head { flex-direction: column; }
          .shop-perks { grid-template-columns: 1fr; }
          .shop-guarantees { grid-template-columns: 1fr; }
          .shop-checkout-inner { padding: 12px 16px; }
        }
      `}</style>
    </div>
  )
}
