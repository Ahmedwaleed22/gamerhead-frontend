'use client'

import { useState, useEffect, useRef, useCallback, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { storeApi, walletApi } from '@/lib/api'
import { useAuth } from '@/lib/auth-context'
import { trackEvent } from '@/lib/gtag'
import { sendActivity } from '@/lib/socket'
import { loadCart, saveCart, subscribeCart } from '@/lib/cart'
import { Icon } from '@iconify/react'
import { Solar } from '@/lib/solar-duotone'
import { loadStripe } from '@stripe/stripe-js'
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js'
import { PayPalScriptProvider, PayPalButtons, FUNDING } from '@paypal/react-paypal-js'

// ─── UPDATED CATEGORIES (no Profile Badges, no Cash, no Accessories, no Gift Cards) ──
const categories = ['Tickets', 'Premium Membership']

interface StoreItem { id: string; name: string; price: number; image: string; category: string; badge?: string }
interface CartItem  extends StoreItem { qty: number }

type PayMethod    = 'wallet' | 'paypal' | 'card'
type CheckoutStep = 'cart' | 'payment' | 'processing' | 'success' | 'fail' | 'stripe-pay'

// ─── Stripe setup ─────────────────────────────────────────────────────────────
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ?? '')

const STRIPE_APPEARANCE = {
  theme: 'night' as const,
  variables: {
    colorPrimary:          '#B22D2D',
    colorBackground:       '#0C0C11',
    colorText:             '#ffffff',
    colorTextSecondary:    'rgba(255,255,255,0.55)',
    borderRadius:          '8px',
    fontFamily:            "'Inter', 'Barlow', sans-serif",
  },
  rules: {
    '.Input':         { backgroundColor: '#18181C', border: '1px solid rgba(255,255,255,0.1)',  color: '#fff' },
    '.Input:focus':   { border: '1px solid rgba(178,45,45,0.7)', boxShadow: '0 0 0 2px rgba(178,45,45,0.2)' },
    '.Label':         { color: 'rgba(255,255,255,0.55)', fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.06em' },
    '.Block':         { backgroundColor: '#0C0C11', border: '1px solid rgba(255,255,255,0.07)' },
    '.CheckboxInput': { backgroundColor: '#18181C', border: '1px solid rgba(255,255,255,0.15)' },
    '.Tab':           { backgroundColor: '#18181C', border: '1px solid rgba(255,255,255,0.1)',  color: 'rgba(255,255,255,0.55)' },
    '.Tab--selected': { backgroundColor: '#1e1e25', border: '1px solid rgba(178,45,45,0.6)',    color: '#fff' },
  },
}

// ─── Stripe Payment Form ──────────────────────────────────────────────────────
function StripePayForm({
  total, onSuccess, onError,
}: { total: number; onSuccess: () => void; onError: (msg: string) => void }) {
  const stripe   = useStripe()
  const elements = useElements()
  const [paying, setPaying] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!stripe || !elements) return
    setPaying(true)
    const result = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/store?payment=success`,
      },
      redirect: 'if_required',
    })
    if (result.error) {
      setPaying(false)
      onError(result.error.message || 'Payment failed')
      return
    }
    if (result.paymentIntent?.status === 'succeeded') {
      // Verify payment server-side and trigger fulfillment
      try {
        await storeApi.confirmPayment({ paymentIntentId: result.paymentIntent.id })
      } catch (err: any) {
        // Even if confirm call fails, payment was taken — show success
        // The webhook will handle fulfillment as a safety net
        console.warn('[Store] Server confirm failed, webhook will handle:', err?.message)
      }
      setPaying(false)
      onSuccess()
    } else {
      setPaying(false)
      onError('Payment was not completed. Please try again.')
    }
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <PaymentElement />
      <button
        type="submit"
        disabled={!stripe || paying}
        className="btn-primary"
        style={{ width: '100%', justifyContent: 'center', padding: '14px', fontSize: 14, opacity: paying ? 0.6 : 1 }}
      >
        {paying ? 'Verifying payment…' : `Pay $${total.toFixed(2)}`}
      </button>
    </form>
  )
}

// storeItems are now fetched from the API inside StorePage

// ─── HERO SLIDES — 'Badges' removed, 'Prime' → 'Premium', no emojis ──────────
const heroSlides = [
  {
    title:   'Premium Membership',
    sub:     'Get exclusive perks, entry fee discounts, and priority support.',
    image:   '/store/hero-premium.jpg',
    accent:  '#A78BFA',
    cat:     'Premium Membership',
  },
  {
    title:   'Buy Tickets',
    sub:     'Load up on Tickets and use them across tournaments and prize entry matches.',
    image:   '/store/hero-credits.jpg',
    accent:  '#F0C040',
    cat:     'Tickets',
  },
]

// ─── MODAL HEADER ─────────────────────────────────────────────────────────────
function ModalTop({ title, onBack, onClose }: { title: React.ReactNode; onBack?: () => void; onClose: () => void }) {
  return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'18px 22px', borderBottom:'1px solid rgba(255,255,255,0.065)' }}>
      <div style={{ display:'flex', alignItems:'center', gap:10 }}>
        {onBack && (
          <button onClick={onBack} style={{ background:'var(--bg-4)', border:'1px solid var(--border)', color:'var(--text-muted)', borderRadius:6, padding:'4px 10px', fontSize:11, cursor:'pointer', fontWeight:600 }}>
            ← Back
          </button>
        )}
        <span style={{ fontFamily:'Barlow Condensed, sans-serif', fontSize:18, fontWeight:800, textTransform:'uppercase', color:'#fff', display:'flex', alignItems:'center' }}>
          {title}
        </span>
      </div>
      <button type="button" onClick={onClose} style={{ background:'var(--bg-4)', border:'1px solid var(--border)', borderRadius:'50%', width:32, height:32, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }} aria-label="Close">
        <Icon icon={Solar.close} width={16} height={16} style={{ color: 'rgba(255,255,255,0.72)' }} />
      </button>
    </div>
  )
}

// ─── STORE ITEM CARD ──────────────────────────────────────────────────────────
function ItemCard({
  item, inCart, flashing, onAdd, onViewCart,
}: {
  item: StoreItem
  inCart: CartItem | undefined
  flashing: boolean
  onAdd: () => void
  onViewCart: () => void
}) {
  const [hov, setHov] = useState(false)

  return (
    <div
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        background: 'var(--bg-2)',
        border: `1px solid ${hov ? 'rgba(255,255,255,0.15)' : 'var(--border)'}`,
        borderRadius: 12,
        overflow: 'hidden',
        transition: 'all 0.2s ease',
        transform: hov ? 'translateY(-2px)' : 'none',
        boxShadow: hov ? '0 8px 24px rgba(0,0,0,0.2)' : '0 4px 12px rgba(0,0,0,0.1)',
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Added-to-cart flash */}
      {flashing && (
        <div style={{ position:'absolute', inset:0, background:'rgba(74,222,128,0.12)', border:'1px solid rgba(74,222,128,0.4)', borderRadius:12, zIndex:10, display:'flex', alignItems:'center', justifyContent:'center', color:'#4ade80', animation:'gh-fadeout 1.1s ease forwards' }}>
          <Icon icon={Solar.checkRead} width={40} height={40} />
        </div>
      )}

      {/* Product image */}
      <div style={{ position: 'relative', aspectRatio: '4/3', background: 'linear-gradient(135deg, var(--bg-3), var(--bg-4))', overflow: 'hidden', borderBottom: '1px solid var(--border)' }}>
        <img
          src={item.image}
          alt={item.name}
          style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: hov ? 1 : 0.85, transition: 'opacity 0.2s ease, transform 0.3s ease', transform: hov ? 'scale(1.05)' : 'scale(1)' }}
          onError={e => {
            // Fallback gradient if image not found
            const el = e.currentTarget
            el.style.display = 'none'
            const parent = el.parentElement!
            parent.style.background = 'linear-gradient(135deg, var(--bg-3) 0%, var(--bg-4) 100%)'
            parent.innerHTML += `<div style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;opacity:0.3"><svg width="42" height="42" viewBox="0 0 24 24" fill="none"><path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4H6z" stroke="currentColor" stroke-width="2"/><path d="M3 6h18M16 10a4 4 0 01-8 0" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg></div>`
          }}
        />
        {/* Badge */}
        {item.badge && (
          <div style={{
            position: 'absolute', top: 12, left: 12,
            background: 'var(--red)', color: '#fff',
            fontFamily: "'Rajdhani', sans-serif", fontWeight: 800,
            fontSize: 10, letterSpacing: '0.08em',
            padding: '4px 10px', borderRadius: 6,
            boxShadow: '0 2px 8px rgba(232,0,13,0.3)'
          }}>
            {item.badge}
          </div>
        )}
        {/* In-cart indicator */}
        {inCart && (
          <div style={{
            position: 'absolute', top: 12, right: 12,
            background: 'rgba(74,222,128,0.15)', border: '1px solid rgba(74,222,128,0.4)',
            borderRadius: 6, padding: '4px 10px',
            fontFamily: "'Rajdhani', sans-serif", fontWeight: 800,
            fontSize: 10, color: '#4ade80', backdropFilter: 'blur(4px)'
          }}>
            ×{inCart.qty} IN CART
          </div>
        )}
      </div>

      {/* Card body */}
      <div style={{ padding: '16px', flex: 1, display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div>
          <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 800, fontSize: 18, color: '#fff', lineHeight: 1.2, marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 }}>
            {item.name}
          </div>
          <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 900, fontSize: 22, color: '#F0C040' }}>
            ${item.price.toFixed(2)}
          </div>
        </div>

        <div style={{ marginTop: 'auto' }}>
          <button
            onClick={onAdd}
            style={{
              width: '100%', padding: '10px 0',
              background: hov ? 'var(--red)' : 'rgba(232,0,13,0.12)',
              border: `1px solid ${hov ? 'var(--red)' : 'rgba(232,0,13,0.3)'}`,
              borderRadius: 8, cursor: 'pointer',
              fontFamily: "'Barlow Condensed', sans-serif",
              fontWeight: 800, fontSize: 13, color: hov ? '#fff' : 'var(--red)',
              letterSpacing: '0.04em', textTransform: 'uppercase',
              transition: 'all 0.15s',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6
            }}
          >
            <Icon icon={Solar.cart} width={14} height={14} /> Add to Cart
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── MAIN PAGE ────────────────────────────────────────────────────────────────
export default function StorePage() {
  return (
    <Suspense fallback={null}>
      <StorePageContent />
    </Suspense>
  )
}

function StorePageContent() {
  const { user, refresh } = useAuth()
  const searchParams = useSearchParams()
  const router = useRouter()
  const [storeItems, setStoreItems] = useState<StoreItem[]>([])
  const [activeCategory, setActiveCategory] = useState('All')
  const [cart, setCart]           = useState<CartItem[]>([])
  const cartLoaded                = useRef(false)
  const [catOpen, setCatOpen]     = useState(true)
  const [heroSlide, setHeroSlide] = useState(0)
  const [coupon, setCoupon]       = useState('')
  const [couponApplied, setCouponApplied] = useState(false)
  const [flashId,  setFlashId]  = useState<string | null>(null)

  // Hydrate cart from localStorage on mount (avoids SSR hydration mismatch),
  // then persist + broadcast on every change so the header badge stays in sync.
  useEffect(() => { setCart(loadCart() as CartItem[]) }, [])
  // Skip the first run: on mount this effect fires with the stale initial `[]`
  // (before the hydrate above has committed), so persisting here would wipe the
  // stored cart. Only save on genuine cart changes after hydration.
  useEffect(() => {
    if (!cartLoaded.current) { cartLoaded.current = true; return }
    saveCart(cart)
  }, [cart])

  // React to cart changes made elsewhere (e.g. the header cart dropdown / other tabs).
  // Equality guard returns the same ref when unchanged, so our own saves don't loop.
  useEffect(() => subscribeCart(() => {
    const stored = loadCart() as CartItem[]
    setCart(prev => JSON.stringify(prev) === JSON.stringify(stored) ? prev : stored)
  }), [])

  useEffect(() => { sendActivity('Browsing Store') }, [])

  useEffect(() => {
    const t = setInterval(() => setHeroSlide(s => (s + 1) % heroSlides.length), 4200)
    return () => clearInterval(t)
  }, [])

  useEffect(() => {
    storeApi.getItems().then((data: any[]) => {
      setStoreItems(
        data.map((item: any) => ({
          id:       item._id || item.id,
          name:     item.name,
          price:    item.price,
          image:    item.image,
          category: item.category,
          badge:    item.badge,
        }))
      )
    }).catch((err: any) => {
      console.error('Failed to fetch store items:', err)
    })
  }, [])

  const slide      = heroSlides[heroSlide]
  const filtered   = activeCategory === 'All' ? storeItems : storeItems.filter(i => i.category === activeCategory)
  const totalItems = cart.reduce((s, i) => s + i.qty, 0)
  const subtotal   = cart.reduce((s, i) => s + i.price * i.qty, 0)
  const discount   = couponApplied ? subtotal * 0.1 : 0
  const total      = subtotal - discount

  const addToCart = (item: StoreItem) => {
    setCart(prev => {
      const ex = prev.find(c => c.id === item.id)
      return ex ? prev.map(c => c.id === item.id ? { ...c, qty: c.qty + 1 } : c) : [...prev, { ...item, qty: 1 }]
    })
    trackEvent('add_to_cart', { item_id: item.id, item_name: item.name, price: item.price / 100, item_category: item.category })
    setFlashId(item.id)
    setTimeout(() => setFlashId(null), 1100)
  }

  const removeFromCart = (id: string) => setCart(p => p.filter(c => c.id !== id))
  const changeQty = (id: string, d: number) =>
    setCart(p => p.map(c => c.id !== id ? c : { ...c, qty: Math.max(1, c.qty + d) }))

  const cartItems = () => cart.map(c => ({
    id: c.id, name: c.name, price: c.price, category: c.category, image: c.image, qty: c.qty,
  }))

  // Prompt sign-in when an unauthenticated user tries to pay.
  // Returns true if we redirected to login (caller should bail out).
  const requireLogin = () => {
    if (user) return false
    window.dispatchEvent(new Event('gh:open-login'))
    return true
  }

  return (
    <div style={{ paddingBottom: 60 }}>

      {/* ── FULL-WIDTH HERO BANNER ── */}
      <div style={{
        position: 'relative',
        width: '100vw',
        left: '50%',
        right: '50%',
        marginLeft: '-50vw',
        marginRight: '-50vw',
        height: 280,
        background: 'var(--bg-2)',
        borderBottom: '1px solid var(--border)',
        overflow: 'hidden',
        marginBottom: 32
      }}>
        {/* Background image */}
        <img
          src={slide.image}
          alt={slide.title}
          style={{ position:'absolute', inset:0, width:'100%', height:'100%', objectFit:'cover', opacity:0.35, transition:'opacity 0.5s' }}
          onError={e => { (e.currentTarget as HTMLImageElement).style.opacity = '0' }}
        />
        {/* Gradient overlay */}
        <div style={{ position:'absolute', inset:0, background:`linear-gradient(90deg, rgba(8,8,16,0.95) 20%, rgba(8,8,16,0.6) 50%, rgba(8,8,16,0.2) 100%)` }} />
        <div style={{ position: 'absolute', inset: 0, backgroundImage: 'linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)', backgroundSize: '32px 32px', opacity: 0.6, pointerEvents: 'none', maskImage: 'linear-gradient(to bottom, black 20%, transparent 100%)', WebkitMaskImage: 'linear-gradient(to bottom, black 20%, transparent 100%)' }} />

        {/* Content */}
        <div className="container" style={{ position:'relative', zIndex:1, height:'100%', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
          <div>
            <div style={{
              fontFamily:"'Barlow Condensed', sans-serif",
              fontWeight:900, fontSize:48, color:'#fff',
              letterSpacing:'0.02em', lineHeight:1, marginBottom:12, textTransform: 'uppercase'
            }}>
              {slide.title}
            </div>
            <p style={{ fontFamily:"'Barlow', sans-serif", fontSize:15, color:'rgba(255,255,255,0.65)', margin:'0 0 24px', maxWidth:480, lineHeight:1.5 }}>
              {slide.sub}
            </p>
            <button
              className="btn-primary"
              style={{ padding:'10px 28px', fontSize:13, borderRadius: 8, boxShadow: '0 4px 12px rgba(232,0,13,0.2)' }}
              onClick={() => { setActiveCategory(slide.cat); }}
            >
              Shop Now
            </button>
          </div>

          {/* Slide dots */}
          <div style={{ display:'flex', gap:8, alignSelf: 'flex-end', paddingBottom: 32 }}>
            {heroSlides.map((_, i) => (
              <button
                key={i}
                onClick={() => setHeroSlide(i)}
                style={{
                  width: heroSlide === i ? 24 : 8,
                  height: 8, borderRadius: 4,
                  background: heroSlide === i ? 'var(--red)' : 'rgba(255,255,255,0.2)',
                  border: 'none', cursor: 'pointer',
                  transition: 'all 0.3s ease', padding: 0,
                }}
              />
            ))}
          </div>
        </div>
      </div>

      {/* ── LAYOUT ── */}
      <div className="container">
        <div className="store-layout">

        {/* ── SIDEBAR — no Games section ── */}
        <aside className="store-sidebar">

          {/* Cart widget */}
          <div className="store-sidebar-card">
            <div className="store-sidebar-cart-header">
              <h3 className="store-sidebar-title">Your Cart</h3>
              {/* <button onClick={() => openModal()} style={{ background:'none', border:'none', cursor:'pointer', position:'relative' }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><circle cx="9" cy="21" r="1" fill="#9CA3AF"/><circle cx="20" cy="21" r="1" fill="#9CA3AF"/><path d="M1 1h4l2.68 13.39a2 2 0 002 1.61h9.72a2 2 0 002-1.61L23 6H6" stroke="#9CA3AF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                {totalItems > 0 && <span className="store-cart-count">{totalItems}</span>}
              </button> */}
            </div>
            <p className="store-cart-qty">Quantity of items: <strong>{totalItems}</strong></p>
            <div className="store-cart-btns">
              {/* <button className="store-btn-outline" onClick={() => window.location.href = '/cart'}>View Cart</button> */}
              <button className="store-btn-solid"   onClick={() => window.location.href = '/checkout'}>Checkout</button>
            </div>

            {/* Quick links — Deposit Cash → /wallet, no Buy Tickets, no emojis, Premium Membership */}
            <div className="store-quick-links">
              <Link href="/wallet" className="store-quick-link">Deposit Cash</Link>
              <button className="store-quick-link" onClick={() => setActiveCategory('Premium Membership')} style={{ background:'none', border:'none', cursor:'pointer', textAlign:'left', width:'100%' }}>
                Premium Membership
              </button>
            </div>
          </div>

          {/* Categories — updated list */}
          <div className="store-sidebar-card">
            <button className="store-sidebar-collapse-header" onClick={() => setCatOpen(!catOpen)}>
              <span>Categories</span><Icon icon={catOpen ? 'solar:alt-arrow-up-bold-duotone' : 'solar:alt-arrow-down-bold-duotone'} width={14} height={14} style={{ color: 'var(--text-muted)' }} />
            </button>
            {catOpen && (
              <div className="store-sidebar-links">
                <button
                  className={`store-sidebar-link${activeCategory === 'All' ? ' active' : ''}`}
                  onClick={() => setActiveCategory('All')}
                >
                  All Items
                </button>
                {categories.map((c) => (
                  <button
                    key={c}
                    className={`store-sidebar-link${activeCategory === c ? ' active' : ''}`}
                    onClick={() => setActiveCategory(c)}
                  >
                    {c}
                  </button>
                ))}
              </div>
            )}
          </div>
        </aside>

        {/* ── ITEMS GRID — real images ── */}
        <div className="store-main">
          <div className="store-main-header" />

          <div className="store-items-grid">
            {filtered.map(item => (
              <ItemCard
                key={item.id}
                item={item}
                inCart={cart.find(c => c.id === item.id)}
                flashing={flashId === item.id}
                onAdd={() => addToCart(item)}
                onViewCart={() => {}}
              />
            ))}
          </div>
        </div>
      </div>
      </div>
      <style>{`
        @keyframes gh-fadeout { 0%{opacity:1} 75%{opacity:1} 100%{opacity:0} }
        @keyframes gh-scalein { from{transform:scale(.5);opacity:0} to{transform:scale(1);opacity:1} }
        @keyframes gh-spin    { to{transform:rotate(360deg)} }
        @keyframes gh-fadein  { from{opacity:0} to{opacity:1} }
        @keyframes gh-modalin { from{opacity:0;transform:translate(-50%,-46%)} to{opacity:1;transform:translate(-50%,-50%)} }
      `}</style>
    </div>
  )
}