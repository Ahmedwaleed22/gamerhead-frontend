'use client'

import { useState, useEffect, useCallback, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { storeApi, walletApi } from '@/lib/api'
import { useAuth } from '@/lib/auth-context'
import { sendActivity } from '@/lib/socket'
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
    sub:     'Load up on Tickets and use them across tournaments and wagers.',
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
  const [catOpen, setCatOpen]     = useState(true)
  const [heroSlide, setHeroSlide] = useState(0)
  const [showModal, setShowModal] = useState(false)
  const [step, setStep]           = useState<CheckoutStep>('cart')
  const [payMethod, setPayMethod] = useState<PayMethod>('wallet')
  const [coupon, setCoupon]       = useState('')
  const [couponApplied, setCouponApplied] = useState(false)
  const [couponError, setCouponError]     = useState('')
  const [clientSecret, setClientSecret]   = useState<string | null>(null)
  const [stripeError,  setStripeError]    = useState<string>('')
  const [flashId,  setFlashId]  = useState<string | null>(null)
  const [walletBalance, setWalletBalance] = useState(0) // cents

  useEffect(() => { sendActivity('Browsing Store') }, [])

  // ── Handle redirect return from Stripe (Cash App, etc.) ───────────────────
  useEffect(() => {
    const paymentIntent = searchParams.get('payment_intent')
    const redirectStatus = searchParams.get('redirect_status')
    if (paymentIntent && redirectStatus === 'succeeded') {
      // Show processing state immediately
      setShowModal(true)
      setStep('processing')
      // Confirm with backend, then show success
      storeApi.confirmPayment({ paymentIntentId: paymentIntent })
        .then(() => {
          setCart([])
          setStep('success')
          refresh().catch(() => {})
          walletApi.getBalance().then((b: any) => setWalletBalance(b.cashBalance || 0)).catch(() => {})
        })
        .catch((err) => {
          console.warn('[Store] Redirect confirm failed:', err?.message)
          // Payment was still taken — show success, webhook will handle fulfillment
          setCart([])
          setStep('success')
          refresh().catch(() => {})
        })
      // Clean up URL params
      router.replace('/store', { scroll: false })
    }
  }, [searchParams, router, refresh])

  useEffect(() => {
    if (user) walletApi.getBalance().then((b: any) => setWalletBalance(b.cashBalance || 0)).catch(() => {})
  }, [user])

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
    setFlashId(item.id)
    setTimeout(() => setFlashId(null), 1100)
  }

  const removeFromCart = (id: string) => setCart(p => p.filter(c => c.id !== id))
  const changeQty = (id: string, d: number) =>
    setCart(p => p.map(c => c.id !== id ? c : { ...c, qty: Math.max(1, c.qty + d) }))

  const applyCoupon = async () => {
    try {
      await storeApi.checkCoupon(coupon)
      setCouponApplied(true)
      setCouponError('')
    } catch (err: any) {
      setCouponApplied(false)
      setCouponError(err?.message || 'Invalid coupon code')
    }
  }

  const cartItems = () => cart.map(c => ({
    id: c.id, name: c.name, price: c.price, category: c.category, image: c.image, qty: c.qty,
  }))

  const handlePaySuccess = () => {
    setCart([])
    setClientSecret(null)
    setStripeError('')
    setStep('success')
    refresh().catch(() => {})
    walletApi.getBalance().then((b: any) => setWalletBalance(b.cashBalance || 0)).catch(() => {})
  }

  // Wallet checkout — balance deducted server-side, fulfillment immediate
  const handleCheckout = async () => {
    setStep('processing')
    try {
      await storeApi.checkout({
        items: cartItems(), paymentMethod: 'wallet',
        couponCode: couponApplied ? coupon : undefined,
      })
      handlePaySuccess()
    } catch (err: any) {
      console.error('Checkout failed:', err)
      setStep('fail')
    }
  }

  // Card checkout — backend creates PaymentIntent, we show Stripe Elements
  const handleCardCheckout = async () => {
    setStep('processing')
    try {
      const res: any = await storeApi.checkout({
        items: cartItems(), paymentMethod: 'card',
        couponCode: couponApplied ? coupon : undefined,
      })
      setClientSecret(res.clientSecret)
      setStripeError('')
      setStep('stripe-pay')
    } catch (err: any) {
      console.error('Card checkout failed:', err)
      setStep('fail')
    }
  }

  const openModal = (goTo: CheckoutStep = 'cart') => { setShowModal(true); setStep(goTo) }
  const closeModal = () => {
    setShowModal(false)
    setTimeout(() => {
      setStep('cart'); setCoupon(''); setCouponApplied(false); setCouponError('')
      setClientSecret(null); setStripeError('')
    }, 280)
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
              onClick={() => { setActiveCategory(slide.cat); openModal('payment') }}
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
              <button onClick={() => openModal()} style={{ background:'none', border:'none', cursor:'pointer', position:'relative' }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><circle cx="9" cy="21" r="1" fill="#9CA3AF"/><circle cx="20" cy="21" r="1" fill="#9CA3AF"/><path d="M1 1h4l2.68 13.39a2 2 0 002 1.61h9.72a2 2 0 002-1.61L23 6H6" stroke="#9CA3AF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                {totalItems > 0 && <span className="store-cart-count">{totalItems}</span>}
              </button>
            </div>
            <p className="store-cart-qty">Quantity of items: <strong>{totalItems}</strong></p>
            <div className="store-cart-btns">
              <button className="store-btn-outline" onClick={() => openModal()}>View Cart</button>
              <button className="store-btn-solid"   onClick={() => openModal('payment')}>Checkout</button>
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
                onViewCart={() => openModal()}
              />
            ))}
          </div>
        </div>
      </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════════
          CART / CHECKOUT MODAL
      ═══════════════════════════════════════════════════════════════════════ */}
      {showModal && (
        <>
          <div onClick={closeModal} style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.78)', backdropFilter:'blur(5px)', zIndex:1000, animation:'gh-fadein .2s' }} />

          <div style={{
            position:'fixed', top:'50%', left:'50%', transform:'translate(-50%,-50%)',
            width: (step === 'success' || step === 'fail') ? 400 : 520,
            maxWidth:'calc(100vw - 32px)',
            background:'#0F0F18', border:'1px solid rgba(255,255,255,0.075)', borderRadius:14,
            zIndex:1001, maxHeight:'90vh', overflowY:'auto',
            boxShadow:'0 40px 100px rgba(0,0,0,0.85)',
            animation:'gh-modalin .25s cubic-bezier(.22,1,.36,1)',
          }}>

            {/* ── STRIPE PAY ── */}
            {step === 'stripe-pay' && clientSecret && (
              <>
                <ModalTop title="Card Payment" onBack={() => setStep('payment')} onClose={closeModal} />
                <div style={{ padding: '22px 24px', display: 'flex', flexDirection: 'column', gap: 18 }}>
                  {/* Order total summary */}
                  <div style={{ background: 'var(--bg-3)', border: '1px solid var(--border)', borderRadius: 9, padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Total due</span>
                    <span style={{ fontFamily: 'Barlow Condensed, sans-serif', fontSize: 22, fontWeight: 900, color: '#f0c040' }}>${total.toFixed(2)}</span>
                  </div>

                  {/* Stripe error */}
                  {stripeError && (
                    <div style={{ background: 'rgba(184,44,44,0.12)', border: '1px solid rgba(184,44,44,0.35)', borderRadius: 8, padding: '10px 14px', fontSize: 12, color: '#ef4444' }}>
                      {stripeError}
                    </div>
                  )}

                  {/* Stripe Elements form */}
                  <Elements stripe={stripePromise} options={{ clientSecret, appearance: STRIPE_APPEARANCE }}>
                    <StripePayForm
                      total={total}
                      onSuccess={() => { setStripeError(''); handlePaySuccess() }}
                      onError={(msg) => setStripeError(msg)}
                    />
                  </Elements>

                  <p style={{ fontSize: 10, color: 'var(--text-dim)', textAlign: 'center', lineHeight: 1.6 }}>
                    Powered by Stripe · 256-bit SSL · Your card is never stored on our servers
                  </p>
                </div>
              </>
            )}

            {/* ── SUCCESS ── */}
            {step === 'success' && (
              <div style={{ padding:52, display:'flex', flexDirection:'column', alignItems:'center', gap:18, textAlign:'center' }}>
                <div style={{ width:84, height:84, borderRadius:'50%', background:'rgba(39,174,96,0.12)', border:'2px solid rgba(39,174,96,0.45)', display:'flex', alignItems:'center', justifyContent:'center', animation:'gh-scalein .4s cubic-bezier(.34,1.56,.64,1)' }}><Icon icon={Solar.checkRead} width={40} height={40} /></div>
                <div style={{ fontFamily:'Barlow Condensed, sans-serif', fontSize:28, fontWeight:900, textTransform:'uppercase', color:'#4ade80', letterSpacing:1 }}>Purchase Complete!</div>
                <p style={{ fontSize:13, color:'var(--text-muted)', lineHeight:1.7, maxWidth:290 }}>
                  Thank you for your purchase. Your items have been added to your account.
                </p>
                <button className="btn-primary" onClick={() => { closeModal(); setCart([]) }}>Continue Shopping</button>
              </div>
            )}

            {/* ── FAIL ── */}
            {step === 'fail' && (
              <div style={{ padding:52, display:'flex', flexDirection:'column', alignItems:'center', gap:18, textAlign:'center' }}>
                <div style={{ width:84, height:84, borderRadius:'50%', background:'rgba(184,44,44,0.12)', border:'2px solid rgba(184,44,44,0.45)', display:'flex', alignItems:'center', justifyContent:'center', animation:'gh-scalein .4s cubic-bezier(.34,1.56,.64,1)' }}><Icon icon={Solar.close} width={40} height={40} /></div>
                <div style={{ fontFamily:'Barlow Condensed, sans-serif', fontSize:28, fontWeight:900, textTransform:'uppercase', color:'var(--red)', letterSpacing:1 }}>Something's Wrong</div>
                <p style={{ fontSize:13, color:'var(--text-muted)', lineHeight:1.7, maxWidth:290 }}>
                  Your payment could not be processed. Please check your details and try again.
                </p>
                <div style={{ display:'flex', gap:10 }}>
                  <button className="btn-primary" onClick={() => setStep('payment')}>Try Again</button>
                  <button style={{ padding:'10px 20px', background:'var(--bg-3)', border:'1px solid var(--border)', borderRadius:6, color:'var(--text-muted)', fontSize:12, fontWeight:700, cursor:'pointer' }} onClick={closeModal}>Cancel</button>
                </div>
              </div>
            )}

            {/* ── PROCESSING ── */}
            {step === 'processing' && (
              <div style={{ padding:52, display:'flex', flexDirection:'column', alignItems:'center', gap:22, textAlign:'center' }}>
                <div style={{ width:64, height:64, borderRadius:'50%', border:'3px solid rgba(255,255,255,0.07)', borderTop:'3px solid var(--red)', animation:'gh-spin .8s linear infinite' }} />
                <div style={{ fontFamily:'Barlow Condensed, sans-serif', fontSize:22, fontWeight:800, textTransform:'uppercase', color:'#fff' }}>Processing Payment…</div>
                <p style={{ fontSize:12, color:'var(--text-dim)' }}>Please do not close this window</p>
              </div>
            )}

            {/* ── CART VIEW ── */}
            {step === 'cart' && (
              <>
                <ModalTop
                  title={<>
                    <Icon icon={Solar.cart} width={22} height={22} style={{ marginRight: 10, flexShrink: 0, opacity: 0.95 }} />
                    Cart
                    {totalItems > 0 && <span style={{ background:'var(--red)', color:'#fff', fontSize:10, fontWeight:800, padding:'2px 7px', borderRadius:10, marginLeft:8 }}>{totalItems}</span>}
                  </>}
                  onClose={closeModal}
                />
                {cart.length === 0 ? (
                  <div style={{
                    padding: '40px 20px 44px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    textAlign: 'center',
                    minHeight: 300,
                    justifyContent: 'center',
                  }}>
                    <div style={{
                      width: 96,
                      height: 96,
                      borderRadius: '50%',
                      background: 'linear-gradient(145deg, rgba(255,255,255,0.07) 0%, rgba(255,255,255,0.02) 100%)',
                      border: '1px solid rgba(255,255,255,0.1)',
                      boxShadow: '0 16px 48px rgba(0,0,0,0.45), inset 0 1px 0 rgba(255,255,255,0.06)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginBottom: 28,
                    }}>
                      <Icon icon={Solar.cart} width={48} height={48} style={{ opacity: 0.5, color: 'rgba(255,255,255,0.9)' }} />
                    </div>
                    <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 22, fontWeight: 900, letterSpacing: 0.6, textTransform: 'uppercase', color: '#fff', marginBottom: 10 }}>
                      Your cart is empty
                    </div>
                    <p style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.55, maxWidth: 300, margin: '0 0 28px' }}>
                      Add tickets or premium from the store — they&apos;ll show up here.
                    </p>
                    <button className="btn-primary text-center flex justify-center align-center" onClick={closeModal} style={{ minWidth: 220 }}>
                      Browse store
                    </button>
                  </div>
                ) : (
                  <>
                    <div style={{ padding:'14px 22px', display:'flex', flexDirection:'column', gap:10, maxHeight:320, overflowY:'auto' }}>
                      {cart.map(item => (
                        <div key={item.id} style={{ display:'flex', alignItems:'center', gap:12, background:'var(--bg-3)', border:'1px solid var(--border)', borderRadius:9, padding:'10px 14px' }}>
                          <div style={{ width:40, height:40, background:'var(--bg-4)', borderRadius:8, overflow:'hidden', flexShrink:0 }}>
                            <img src={item.image} alt={item.name} style={{ width:'100%', height:'100%', objectFit:'cover' }} onError={e => { (e.currentTarget.parentElement!).innerHTML = '<span style="display:flex;align-items:center;justify-content:center;height:100%"><svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4H6z" stroke="#6B7280" stroke-width="2"/><path d="M3 6h18M16 10a4 4 0 01-8 0" stroke="#6B7280" stroke-width="2" stroke-linecap="round"/></svg></span>' }} />
                          </div>
                          <div style={{ flex:1, minWidth:0 }}>
                            <div style={{ fontSize:12, fontWeight:700, color:'#fff', marginBottom:2, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{item.name}</div>
                            <div style={{ fontSize:10, color:'var(--text-muted)' }}>{item.category}</div>
                          </div>
                          <div style={{ display:'flex', alignItems:'center', gap:6, flexShrink:0 }}>
                            <button onClick={() => changeQty(item.id,-1)} style={{ width:22, height:22, background:'var(--bg-4)', border:'1px solid var(--border)', borderRadius:4, color:'#fff', fontSize:14, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}>−</button>
                            <span style={{ fontSize:12, fontWeight:700, color:'#fff', minWidth:18, textAlign:'center' }}>{item.qty}</span>
                            <button onClick={() => changeQty(item.id,+1)} style={{ width:22, height:22, background:'var(--bg-4)', border:'1px solid var(--border)', borderRadius:4, color:'#fff', fontSize:14, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}>+</button>
                          </div>
                          <div style={{ fontFamily:'Barlow Condensed, sans-serif', fontSize:15, fontWeight:800, color:'#f0c040', minWidth:54, textAlign:'right', flexShrink:0 }}>${(item.price*item.qty).toFixed(2)}</div>
                          <button type="button" onClick={() => removeFromCart(item.id)} style={{ background:'none', border:'none', color:'var(--text-dim)', cursor:'pointer', padding:'2px 4px', display:'flex', alignItems:'center' }}
                            onMouseEnter={e=>(e.currentTarget.style.color='var(--red)')}
                            onMouseLeave={e=>(e.currentTarget.style.color='var(--text-dim)')} aria-label="Remove"><Icon icon={Solar.close} width={14} height={14} /></button>
                        </div>
                      ))}
                    </div>
                    <div style={{ padding:'12px 22px', borderTop:'1px solid rgba(255,255,255,0.055)' }}>
                      <div style={{ display:'flex', gap:8 }}>
                        <input type="text" placeholder="Coupon code — try EMPIRE10" value={coupon}
                          onChange={e=>{ setCoupon(e.target.value); setCouponError('') }}
                          className="site-input" style={{ flex:1, fontSize:12, height:34 }} />
                        <button onClick={applyCoupon} style={{ padding:'0 16px', background: couponApplied ? 'rgba(39,174,96,0.15)' : 'var(--bg-3)', border:`1px solid ${couponApplied ? 'rgba(39,174,96,0.4)' : 'var(--border)'}`, borderRadius:4, color: couponApplied ? '#4ade80' : 'var(--text-muted)', fontSize:11, fontWeight:700, cursor:'pointer', textTransform:'uppercase', letterSpacing:.4, whiteSpace:'nowrap' }}>
                          {couponApplied ? (<span style={{ display:'inline-flex', alignItems:'center', gap:4 }}><Icon icon={Solar.checkRead} width={12} height={12} /> Applied</span>) : 'Apply'}
                        </button>
                      </div>
                      {couponError   && <p style={{ fontSize:11, color:'var(--red)',   marginTop:5 }}>{couponError}</p>}
                      {couponApplied && <p style={{ fontSize:11, color:'#4ade80',       marginTop:5 }}>10% discount applied!</p>}
                    </div>
                    <div style={{ padding:'12px 22px', borderTop:'1px solid rgba(255,255,255,0.055)', display:'flex', flexDirection:'column', gap:6 }}>
                      <div style={{ display:'flex', justifyContent:'space-between', fontSize:12, color:'var(--text-muted)' }}><span>Subtotal</span><span>${subtotal.toFixed(2)}</span></div>
                      {couponApplied && (
                        <div style={{ display:'flex', justifyContent:'space-between', fontSize:12, color:'#4ade80' }}><span>Discount (10%)</span><span>−${discount.toFixed(2)}</span></div>
                      )}
                      <div style={{ display:'flex', justifyContent:'space-between', fontFamily:'Barlow Condensed, sans-serif', fontSize:20, fontWeight:900, borderTop:'1px solid rgba(255,255,255,0.055)', paddingTop:8, marginTop:2 }}>
                        <span style={{ color:'#fff' }}>Total</span><span style={{ color:'#f0c040' }}>${total.toFixed(2)}</span>
                      </div>
                    </div>
                    <div style={{ padding:'14px 22px', borderTop:'1px solid rgba(255,255,255,0.055)' }}>
                      <button className="btn-primary" style={{ width:'100%', justifyContent:'center', padding:'13px' }} onClick={() => setStep('payment')}>
                        Proceed to Checkout →
                      </button>
                    </div>
                  </>
                )}
              </>
            )}

            {/* ── PAYMENT ── */}
            {step === 'payment' && (
              <>
                <ModalTop title="Payment" onBack={() => setStep('cart')} onClose={closeModal} />
                <div style={{ padding:'22px 24px', display:'flex', flexDirection:'column', gap:20 }}>
                  {cart.length > 0 && (
                    <div style={{ background:'var(--bg-3)', border:'1px solid var(--border)', borderRadius:9, padding:'13px 16px' }}>
                      <div style={{ fontSize:10, fontWeight:700, textTransform:'uppercase', letterSpacing:.6, color:'var(--text-dim)', marginBottom:10 }}>Order Summary</div>
                      {cart.map(item => (
                        <div key={item.id} style={{ display:'flex', justifyContent:'space-between', fontSize:12, color:'var(--text-muted)', marginBottom:5 }}>
                          <span>{item.name} ×{item.qty}</span><span>${(item.price*item.qty).toFixed(2)}</span>
                        </div>
                      ))}
                      {couponApplied && (
                        <div style={{ display:'flex', justifyContent:'space-between', fontSize:12, color:'#4ade80', marginBottom:5 }}>
                          <span>Coupon (EMPIRE10)</span><span>−${discount.toFixed(2)}</span>
                        </div>
                      )}
                      <div style={{ borderTop:'1px solid rgba(255,255,255,0.055)', marginTop:8, paddingTop:8, display:'flex', justifyContent:'space-between', fontWeight:800, fontSize:15, fontFamily:'Barlow Condensed, sans-serif' }}>
                        <span style={{ color:'#fff' }}>TOTAL</span><span style={{ color:'#f0c040' }}>${total.toFixed(2)}</span>
                      </div>
                    </div>
                  )}

                  <div>
                    <div style={{ fontSize:11, fontWeight:700, textTransform:'uppercase', letterSpacing:.7, color:'var(--text-dim)', marginBottom:12 }}>Payment Method</div>
                    <div style={{ display:'flex', gap:12 }}>
                      {([
                        { key:'wallet' as PayMethod, label:'Wallet Balance', icon:'wallet', sub:`$${(walletBalance / 100).toFixed(2)} available` },
                        { key:'paypal' as PayMethod, label:'PayPal',         icon:'pp',     sub:'Securely redirect to PayPal' },
                        { key:'card'   as PayMethod, label:'Credit / Debit', icon:'card',   sub:'Visa, Mastercard, Amex, Discover' },
                      ]).map(m => (
                        <button key={m.key} onClick={() => setPayMethod(m.key)} style={{
                          flex:1, padding:'18px 16px', textAlign:'left',
                          background: payMethod===m.key ? 'rgba(184,44,44,0.1)' : 'var(--bg-3)',
                          border:`1px solid ${payMethod===m.key ? 'rgba(184,44,44,0.45)' : 'var(--border)'}`,
                          borderRadius:10, cursor:'pointer', transition:'all .15s', position:'relative',
                        }}>
                          {payMethod===m.key && (
                            <div style={{ position:'absolute', top:10, right:10, width:18, height:18, borderRadius:'50%', background:'var(--red)', display:'flex', alignItems:'center', justifyContent:'center', color:'#fff' }}><Icon icon={Solar.checkRead} width={10} height={10} /></div>
                          )}
                          <div style={{ marginBottom:8 }}>{m.icon === 'wallet' ? <svg width="26" height="26" viewBox="0 0 24 24" fill="none"><rect x="2" y="5" width="20" height="15" rx="3" stroke="#4ade80" strokeWidth="2"/><path d="M2 9h20" stroke="#4ade80" strokeWidth="2"/><circle cx="17" cy="14" r="1.5" fill="#4ade80"/></svg> : m.icon === 'pp' ? <svg width="26" height="26" viewBox="0 0 24 24" fill="none"><rect x="2" y="2" width="20" height="20" rx="4" stroke="#5b9bd5" strokeWidth="2"/><text x="12" y="16" textAnchor="middle" fill="#5b9bd5" fontSize="12" fontWeight="900" fontFamily="Arial">P</text></svg> : <svg width="26" height="26" viewBox="0 0 24 24" fill="none"><rect x="1" y="4" width="22" height="16" rx="3" stroke="#9CA3AF" strokeWidth="2"/><path d="M1 10h22" stroke="#9CA3AF" strokeWidth="2"/></svg>}</div>
                          <div style={{ fontSize:13, fontWeight:700, color: payMethod===m.key ? '#fff' : 'var(--text-muted)', marginBottom:4 }}>{m.label}</div>
                          <div style={{ fontSize:10, color:'var(--text-dim)', lineHeight:1.4 }}>{m.sub}</div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {payMethod === 'wallet' && (
                    <div style={{ background:'var(--bg-3)', border:'1px solid var(--border)', borderRadius:9, padding:'16px', display:'flex', flexDirection:'column', gap:10 }}>
                      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                        <span style={{ fontSize:12, color:'var(--text-muted)', fontWeight:600 }}>Available Balance</span>
                        <span style={{ fontSize:18, fontWeight:900, fontFamily:'Barlow Condensed, sans-serif', color:'#fff' }}>${(walletBalance / 100).toFixed(2)}</span>
                      </div>
                      {walletBalance >= Math.round(total * 100) ? (
                        <div style={{ fontSize:11, color:'var(--text-dim)', borderTop:'1px solid rgba(255,255,255,0.055)', paddingTop:10 }}>
                          Remaining after purchase: <span style={{ color:'var(--text-muted)', fontWeight:600 }}>${((walletBalance - Math.round(total * 100)) / 100).toFixed(2)}</span>
                        </div>
                      ) : (
                        <div style={{ fontSize:11, color:'#ef4444', borderTop:'1px solid rgba(255,255,255,0.055)', paddingTop:10, display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                          <span>Insufficient balance</span>
                          <Link href="/wallet" style={{ color:'var(--red)', fontSize:11, fontWeight:700, textDecoration:'none' }}>Deposit funds →</Link>
                        </div>
                      )}
                    </div>
                  )}

                  {payMethod === 'paypal' && (
                    <PayPalScriptProvider options={{
                      clientId:          process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID!,
                      currency:          'USD',
                      'enable-funding':  'venmo',
                      'buyer-country':   'US',
                      components:        'buttons,funding-eligibility',
                    }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                        <PayPalButtons
                          style={{ layout: 'vertical', color: 'blue', shape: 'rect', height: 45 }}
                          fundingSource={FUNDING.PAYPAL}
                          createOrder={async () => {
                            const res: any = await storeApi.createPayPalOrder({
                              items: cartItems(), paymentMethod: 'paypal',
                              couponCode: couponApplied ? coupon : undefined,
                            })
                            return res.paypalOrderId
                          }}
                          onApprove={async (data) => {
                            setStep('processing')
                            try {
                              await storeApi.capturePayPalOrder({ paypalOrderId: data.orderID })
                              handlePaySuccess()
                            } catch {
                              setStep('fail')
                            }
                          }}
                          onError={() => setStep('fail')}
                        />
                        <PayPalButtons
                          style={{ layout: 'vertical', color: 'blue', shape: 'rect', height: 45 }}
                          fundingSource={FUNDING.VENMO}
                          createOrder={async () => {
                            const res: any = await storeApi.createPayPalOrder({
                              items: cartItems(), paymentMethod: 'paypal',
                              couponCode: couponApplied ? coupon : undefined,
                            })
                            return res.paypalOrderId
                          }}
                          onApprove={async (data) => {
                            setStep('processing')
                            try {
                              await storeApi.capturePayPalOrder({ paypalOrderId: data.orderID })
                              handlePaySuccess()
                            } catch {
                              setStep('fail')
                            }
                          }}
                          onError={() => setStep('fail')}
                        />
                      </div>
                    </PayPalScriptProvider>
                  )}

                  {payMethod === 'card' && (
                    <div style={{ background:'var(--bg-3)', border:'1px solid var(--border)', borderRadius:9, padding:'14px 16px' }}>
                      <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:6 }}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" style={{ flexShrink:0, opacity:0.45 }}>
                          <rect x="3" y="11" width="18" height="11" rx="2" stroke="currentColor" strokeWidth="2"/>
                          <path d="M7 11V7a5 5 0 0110 0v4" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                        </svg>
                        <span style={{ fontSize:11, color:'var(--text-dim)' }}>You'll enter card details on the next step</span>
                      </div>
                      <div style={{ display:'flex', alignItems:'center', gap:6, flexWrap:'wrap' }}>
                        {['Visa','Mastercard','Amex','Discover'].map(c => (
                          <span key={c} style={{ fontSize:9, fontWeight:700, color:'var(--text-dim)', background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.06)', borderRadius:3, padding:'2px 6px', letterSpacing:'.3px', textTransform:'uppercase' }}>{c}</span>
                        ))}
                      </div>
                    </div>
                  )}

                  {!couponApplied ? (
                    <div>
                      <div style={{ fontSize:11, fontWeight:700, textTransform:'uppercase', letterSpacing:.7, color:'var(--text-dim)', marginBottom:10 }}>Have a Coupon?</div>
                      <div style={{ display:'flex', gap:8 }}>
                        <input type="text" placeholder="Enter coupon code" value={coupon}
                          onChange={e=>{ setCoupon(e.target.value); setCouponError('') }}
                          className="site-input" style={{ flex:1, fontSize:12, height:34 }} />
                        <button onClick={applyCoupon} style={{ padding:'0 14px', background:'var(--bg-3)', border:'1px solid var(--border)', borderRadius:4, color:'var(--text-muted)', fontSize:11, fontWeight:700, cursor:'pointer', textTransform:'uppercase', letterSpacing:.4 }}>Apply</button>
                      </div>
                      {couponError && <p style={{ fontSize:11, color:'var(--red)', marginTop:5 }}>{couponError}</p>}
                    </div>
                  ) : (
                    <div style={{ display:'flex', alignItems:'center', gap:8, background:'rgba(39,174,96,0.08)', border:'1px solid rgba(39,174,96,0.2)', borderRadius:7, padding:'10px 14px', fontSize:12, color:'#4ade80' }}>
                      <Icon icon={Solar.checkRead} width={14} height={14} /> Coupon EMPIRE10 applied — 10% off
                    </div>
                  )}

                  <div style={{ background:'rgba(184,44,44,0.06)', border:'1px solid rgba(184,44,44,0.15)', borderRadius:9, padding:'14px 18px', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                    <span style={{ fontSize:13, fontWeight:700, color:'#fff' }}>Total Due</span>
                    <span style={{ fontFamily:'Barlow Condensed, sans-serif', fontSize:28, fontWeight:900, color:'#f0c040' }}>${total.toFixed(2)}</span>
                  </div>

                  {payMethod !== 'paypal' && (
                    <button
                      className="btn-primary"
                      style={{ width:'100%', justifyContent:'center', padding:'14px', fontSize:14, opacity: payMethod === 'wallet' && walletBalance < Math.round(total * 100) ? 0.4 : 1 }}
                      onClick={payMethod === 'card' ? handleCardCheckout : handleCheckout}
                      disabled={payMethod === 'wallet' && walletBalance < Math.round(total * 100)}
                    >
                      {payMethod === 'wallet' ? 'Pay with Wallet' : 'Continue to Card Payment →'}
                    </button>
                  )}

                  <p style={{ fontSize:10, color:'var(--text-dim)', textAlign:'center', lineHeight:1.6 }}>
                    By completing your purchase you agree to our Terms of Service. All sales are final.
                  </p>
                </div>
              </>
            )}
          </div>
        </>
      )}

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