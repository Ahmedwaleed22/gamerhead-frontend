'use client'

import { useState, useEffect, useCallback, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { storeApi, walletApi } from '@/lib/api'
import { useAuth } from '@/lib/auth-context'
import { trackEvent } from '@/lib/gtag'
import { loadCart, saveCart, subscribeCart, type StoredCartItem } from '@/lib/cart'
import { Icon } from '@iconify/react'
import { Solar } from '@/lib/solar-duotone'
import { loadStripe } from '@stripe/stripe-js'
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js'
import { PayPalScriptProvider, PayPalButtons, FUNDING } from '@paypal/react-paypal-js'

type PayMethod = 'wallet' | 'paypal' | 'card'
type Phase     = 'form' | 'processing' | 'success' | 'fail'

const money = (usd: number) => `$${usd.toFixed(2)}`

// ─── Stripe setup (mirrors the store page) ────────────────────────────────────
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ?? '')

const STRIPE_APPEARANCE = {
  theme: 'night' as const,
  variables: {
    colorPrimary:       '#B22D2D',
    colorBackground:    '#0C0C11',
    colorText:          '#ffffff',
    colorTextSecondary: 'rgba(255,255,255,0.55)',
    borderRadius:       '8px',
    fontFamily:         "'Inter', 'Barlow', sans-serif",
  },
  rules: {
    '.Input':         { backgroundColor: '#18181C', border: '1px solid rgba(255,255,255,0.1)', color: '#fff' },
    '.Input:focus':   { border: '1px solid rgba(178,45,45,0.7)', boxShadow: '0 0 0 2px rgba(178,45,45,0.2)' },
    '.Label':         { color: 'rgba(255,255,255,0.55)', fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.06em' },
    '.Block':         { backgroundColor: '#0C0C11', border: '1px solid rgba(255,255,255,0.07)' },
    '.CheckboxInput': { backgroundColor: '#18181C', border: '1px solid rgba(255,255,255,0.15)' },
    '.Tab':           { backgroundColor: '#18181C', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.55)' },
    '.Tab--selected': { backgroundColor: '#1e1e25', border: '1px solid rgba(178,45,45,0.6)', color: '#fff' },
  },
}

// ─── Inline Stripe card form ──────────────────────────────────────────────────
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
      confirmParams: { return_url: `${window.location.origin}/checkout` },
      redirect: 'if_required',
    })
    if (result.error) {
      setPaying(false)
      onError(result.error.message || 'Payment failed')
      return
    }
    if (result.paymentIntent?.status === 'succeeded') {
      try {
        await storeApi.confirmPayment({ paymentIntentId: result.paymentIntent.id })
      } catch (err: any) {
        // Payment succeeded — the webhook is the fulfillment safety net.
        console.warn('[Checkout] Server confirm failed, webhook will handle:', err?.message)
      }
      setPaying(false)
      onSuccess()
    } else {
      setPaying(false)
      onError('Payment was not completed. Please try again.')
    }
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      <PaymentElement />
      <button
        type="submit"
        disabled={!stripe || paying}
        className="btn-primary"
        style={{ width: '100%', justifyContent: 'center', padding: '14px', fontSize: 14, opacity: paying ? 0.6 : 1 }}
      >
        {paying ? 'Verifying payment…' : `Pay ${money(total)}`}
      </button>
      <p style={{ fontSize: 10, color: 'var(--text-dim)', textAlign: 'center', lineHeight: 1.6 }}>
        Powered by Stripe · 256-bit SSL · Your card is never stored on our servers
      </p>
    </form>
  )
}

function CheckoutInner() {
  const router       = useRouter()
  const searchParams = useSearchParams()
  const { user, refresh } = useAuth()

  const [cart, setCart]         = useState<StoredCartItem[]>([])
  const [phase, setPhase]       = useState<Phase>('form')
  const [payMethod, setPayMethod] = useState<PayMethod>('wallet')
  const [walletBalance, setWalletBalance] = useState(0) // cents

  const [coupon, setCoupon]           = useState('')
  const [couponApplied, setCouponApplied] = useState(false)
  const [couponError, setCouponError] = useState('')

  const [clientSecret, setClientSecret] = useState<string | null>(null)
  const [stripeError, setStripeError]   = useState('')

  // Two-step flow: 'cart' (Steam-style shopping cart) → 'pay' (payment methods).
  const [view, setView] = useState<'cart' | 'pay'>('cart')
  const [storeItems, setStoreItems] = useState<Array<{ id: string; name: string; price: number; image?: string; category?: string; badge?: string }>>([])

  // Hydrate once from localStorage. We do NOT auto-persist via a `[cart]` effect:
  // on React's dev double-mount that effect writes the initial empty array over
  // the stored cart (the ref guard survives the remount), emptying the cart the
  // moment this page loads. Every mutation persists explicitly via `writeCart`.
  useEffect(() => { setCart(loadCart()) }, [])

  // Stay in sync with the header cart / other tabs.
  useEffect(() => subscribeCart(() => {
    const stored = loadCart()
    setCart(prev => JSON.stringify(prev) === JSON.stringify(stored) ? prev : stored)
  }), [])

  // Set state AND persist together so localStorage stays the source of truth.
  const writeCart = (next: StoredCartItem[]) => { saveCart(next); setCart(next) }

  // ── Wallet balance ──
  const loadBalance = useCallback(() => {
    if (!user) return
    walletApi.getBalance().then((b: any) => setWalletBalance(b.cashBalance || 0)).catch(() => {})
  }, [user])
  useEffect(() => { loadBalance() }, [loadBalance])

  // ── Store catalogue (for "Recommended for you") ──
  useEffect(() => {
    storeApi.getItems()
      .then((data: any[]) => setStoreItems(data.map(i => ({
        id: i._id || i.id, name: i.name, price: i.price, image: i.image, category: i.category, badge: i.badge,
      }))))
      .catch(() => {})
  }, [])

  // ── Totals (prices are USD) ──
  const totalItems = cart.reduce((s, i) => s + i.qty, 0)
  const subtotal   = cart.reduce((s, i) => s + i.price * i.qty, 0)
  const discount   = couponApplied ? subtotal * 0.1 : 0
  const total      = subtotal - discount
  const totalCents = Math.round(total * 100)

  // Server resolves price/name/category from the catalogue; only id + qty are sent.
  const cartItems = () => cart.map(c => ({ id: c.id, qty: c.qty }))

  // ── Cart mutations (each persists explicitly) ──
  const changeQty = (id: string, d: number) =>
    writeCart(cart.map(c => c.id !== id ? c : { ...c, qty: Math.max(1, c.qty + d) }))
  const removeItem = (id: string) => writeCart(cart.filter(c => c.id !== id))
  const clearCart  = () => writeCart([])
  const addToCart  = (it: { id: string; name: string; price: number; image?: string; category?: string }) => {
    const ex = cart.find(c => c.id === it.id)
    writeCart(ex
      ? cart.map(c => c.id === it.id ? { ...c, qty: c.qty + 1 } : c)
      : [...cart, { id: it.id, name: it.name, price: it.price, image: it.image, category: it.category, qty: 1 }])
  }

  const recommendations = storeItems.filter(s => !cart.some(c => c.id === s.id)).slice(0, 3)

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

  const requireLogin = () => {
    if (user) return false
    window.dispatchEvent(new Event('gh:open-login'))
    return true
  }

  const handleSuccess = () => {
    trackEvent('purchase', {
      currency: 'USD', value: total,
      items: cart.map(c => ({ item_id: c.id, item_name: c.name, price: c.price, quantity: c.qty })),
    })
    writeCart([])
    setClientSecret(null)
    setStripeError('')
    setPhase('success')
    refresh().catch(() => {})
    loadBalance()
  }

  // ── Wallet checkout — balance deducted server-side ──
  const payWallet = async () => {
    if (requireLogin()) return
    setPhase('processing')
    try {
      await storeApi.checkout({
        items: cartItems(), paymentMethod: 'wallet',
        couponCode: couponApplied ? coupon : undefined,
      })
      handleSuccess()
    } catch (err: any) {
      console.error('Wallet checkout failed:', err)
      setPhase('fail')
    }
  }

  // ── Card checkout — backend creates a PaymentIntent, we mount Stripe Elements ──
  const payCard = async () => {
    if (requireLogin()) return
    setPhase('processing')
    try {
      const res: any = await storeApi.checkout({
        items: cartItems(), paymentMethod: 'card',
        couponCode: couponApplied ? coupon : undefined,
      })
      setClientSecret(res.clientSecret)
      setStripeError('')
      setPhase('form')
    } catch (err: any) {
      console.error('Card checkout failed:', err)
      setPhase('fail')
    }
  }

  // ── Handle redirect return from Stripe (Cash App, etc.) ──
  useEffect(() => {
    const paymentIntent  = searchParams.get('payment_intent')
    const redirectStatus = searchParams.get('redirect_status')
    if (paymentIntent && redirectStatus === 'succeeded') {
      setPhase('processing')
      storeApi.confirmPayment({ paymentIntentId: paymentIntent })
        .then(() => { writeCart([]); setPhase('success'); refresh().catch(() => {}); loadBalance() })
        .catch((err) => {
          console.warn('[Checkout] Redirect confirm failed:', err?.message)
          writeCart([]); setPhase('success'); refresh().catch(() => {})
        })
      router.replace('/checkout', { scroll: false })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams])

  const canPayWallet = walletBalance >= totalCents

  // ── SUCCESS ──
  if (phase === 'success') {
    return (
      <div className="container" style={{ maxWidth: 560, padding: '80px 16px' }}>
        <div style={{ background: '#0F0F18', border: '1px solid rgba(255,255,255,0.075)', borderRadius: 14, padding: 52, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 18, textAlign: 'center' }}>
          <div style={{ width: 84, height: 84, borderRadius: '50%', background: 'rgba(39,174,96,0.12)', border: '2px solid rgba(39,174,96,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Icon icon={Solar.checkRead} width={40} height={40} />
          </div>
          <div style={{ fontFamily: 'Barlow Condensed, sans-serif', fontSize: 28, fontWeight: 900, textTransform: 'uppercase', color: '#4ade80', letterSpacing: 1 }}>Purchase Complete!</div>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.7, maxWidth: 320 }}>
            Thank you for your purchase. Your items have been added to your account.
          </p>
          <div style={{ display: 'flex', gap: 10 }}>
            <Link href="/store" className="btn-primary" style={{ textDecoration: 'none' }}>Continue Shopping</Link>
            <Link href="/wallet" style={{ padding: '10px 20px', background: 'var(--bg-3)', border: '1px solid var(--border)', borderRadius: 6, color: 'var(--text-muted)', fontSize: 12, fontWeight: 700, textDecoration: 'none', display: 'inline-flex', alignItems: 'center' }}>View Wallet</Link>
          </div>
        </div>
      </div>
    )
  }

  // ── FAIL ──
  if (phase === 'fail') {
    return (
      <div className="container" style={{ maxWidth: 560, padding: '80px 16px' }}>
        <div style={{ background: '#0F0F18', border: '1px solid rgba(255,255,255,0.075)', borderRadius: 14, padding: 52, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 18, textAlign: 'center' }}>
          <div style={{ width: 84, height: 84, borderRadius: '50%', background: 'rgba(184,44,44,0.12)', border: '2px solid rgba(184,44,44,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Icon icon={Solar.close} width={40} height={40} />
          </div>
          <div style={{ fontFamily: 'Barlow Condensed, sans-serif', fontSize: 28, fontWeight: 900, textTransform: 'uppercase', color: 'var(--red)', letterSpacing: 1 }}>Something&apos;s Wrong</div>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.7, maxWidth: 320 }}>
            Your payment could not be processed. Your cart is still saved — please check your details and try again.
          </p>
          <button className="btn-primary" onClick={() => { setStripeError(''); setPhase('form') }}>Back to Checkout</button>
        </div>
      </div>
    )
  }

  // ── PROCESSING ──
  if (phase === 'processing') {
    return (
      <div className="container" style={{ maxWidth: 560, padding: '100px 16px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 22, textAlign: 'center' }}>
          <div style={{ width: 64, height: 64, borderRadius: '50%', border: '3px solid rgba(255,255,255,0.07)', borderTop: '3px solid var(--red)', animation: 'gh-spin .8s linear infinite' }} />
          <div style={{ fontFamily: 'Barlow Condensed, sans-serif', fontSize: 22, fontWeight: 800, textTransform: 'uppercase', color: '#fff' }}>Processing Payment…</div>
          <p style={{ fontSize: 12, color: 'var(--text-dim)' }}>Please do not close this window</p>
        </div>
        <style>{`@keyframes gh-spin { to { transform: rotate(360deg) } }`}</style>
      </div>
    )
  }

  // ── EMPTY CART ──
  if (cart.length === 0) {
    return (
      <div className="container" style={{ maxWidth: 560, padding: '80px 16px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: 22 }}>
          <div style={{ width: 96, height: 96, borderRadius: '50%', background: 'linear-gradient(145deg, rgba(255,255,255,0.07) 0%, rgba(255,255,255,0.02) 100%)', border: '1px solid rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Icon icon={Solar.cart} width={48} height={48} style={{ opacity: 0.5 }} />
          </div>
          <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 26, fontWeight: 900, letterSpacing: 0.6, textTransform: 'uppercase', color: '#fff' }}>Your cart is empty</div>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.55, maxWidth: 320, margin: 0 }}>
            Add tickets or premium from the store and they&apos;ll show up here, ready to check out.
          </p>
          <Link href="/store" className="btn-primary" style={{ textDecoration: 'none', minWidth: 220, justifyContent: 'center' }}>Browse Store</Link>
        </div>
      </div>
    )
  }

  // ═══════════════════════════════════════════════════════════════════════════
  //  STEP 1 — SHOPPING CART
  // ═══════════════════════════════════════════════════════════════════════════
  if (view === 'cart') {
    return (
      <div className="container" style={{ padding: '30px 16px 80px', maxWidth: 1350 }}>
        {/* Breadcrumb */}
        <div style={{ fontSize: 12, color: 'var(--text-dim)', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
          <Link href="/" style={{ color: 'var(--text-muted)', textDecoration: 'none', fontWeight: 600 }}>Home</Link>
          <span style={{ opacity: 0.45 }}>›</span>
          <Link href="/store" style={{ color: 'var(--text-muted)', textDecoration: 'none' }}>Store</Link>
          <span style={{ opacity: 0.45 }}>›</span>
          <span>Shopping Cart</span>
        </div>
        <h1 style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 40, fontWeight: 900, textTransform: 'uppercase', color: '#fff', margin: '0 0 26px', letterSpacing: '0.01em', lineHeight: 1 }}>Your Shopping Cart</h1>

        <div className="checkout-grid" style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) 330px', gap: 26, alignItems: 'start' }}>

          {/* ── LEFT: items + recommendations ── */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>

            {/* Items panel */}
            <div style={{ background: '#0F0F18', border: '1px solid rgba(255,255,255,0.075)', borderRadius: 12, overflow: 'hidden' }}>
              {cart.map((item, idx) => (
                <div key={item.id} style={{ display: 'flex', alignItems: 'center', gap: 18, padding: '18px 20px', borderBottom: idx < cart.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none' }}>
                  <div style={{ width: 150, height: 72, borderRadius: 8, overflow: 'hidden', background: 'var(--bg-4)', flexShrink: 0, border: '1px solid rgba(255,255,255,0.06)' }}>
                    {item.image && <img src={item.image} alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none' }} />}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 16, fontWeight: 700, color: '#fff', marginBottom: 8, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.name}</div>
                    {item.category && (
                      <span style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.4, color: 'var(--text-dim)', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 4, padding: '3px 8px' }}>{item.category}</span>
                    )}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                    <button onClick={() => changeQty(item.id, -1)} style={{ width: 26, height: 26, background: 'var(--bg-4)', border: '1px solid var(--border)', borderRadius: 5, color: '#fff', fontSize: 16, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>−</button>
                    <span style={{ fontSize: 14, fontWeight: 700, color: '#fff', minWidth: 20, textAlign: 'center' }}>{item.qty}</span>
                    <button onClick={() => changeQty(item.id, +1)} style={{ width: 26, height: 26, background: 'var(--bg-4)', border: '1px solid var(--border)', borderRadius: 5, color: '#fff', fontSize: 16, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>+</button>
                  </div>
                  <div style={{ textAlign: 'right', minWidth: 92, flexShrink: 0 }}>
                    <div style={{ fontFamily: 'Barlow Condensed, sans-serif', fontSize: 20, fontWeight: 800, color: '#f0c040' }}>{money(item.price * item.qty)}</div>
                    <button type="button" onClick={() => removeItem(item.id)} style={{ background: 'none', border: 'none', color: 'var(--text-dim)', cursor: 'pointer', fontSize: 11, padding: '2px 0', marginTop: 2, textDecoration: 'underline' }}
                      onMouseEnter={e => (e.currentTarget.style.color = 'var(--red)')}
                      onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-dim)')}>Remove</button>
                  </div>
                </div>
              ))}
            </div>

            {/* Continue shopping + remove all */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
              <Link href="/store" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '11px 20px', background: 'var(--bg-3)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text-muted)', fontSize: 13, fontWeight: 700, textDecoration: 'none', transition: 'all .15s' }}
                onMouseEnter={e => { e.currentTarget.style.color = '#fff'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)' }}
                onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-muted)'; e.currentTarget.style.borderColor = 'var(--border)' }}>
                <Icon icon="solar:arrow-left-linear" width={16} height={16} /> Continue Shopping
              </Link>
              <button onClick={clearCart} style={{ background: 'none', border: 'none', color: 'var(--text-dim)', fontSize: 12, cursor: 'pointer', textDecoration: 'underline' }}
                onMouseEnter={e => (e.currentTarget.style.color = 'var(--red)')}
                onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-dim)')}>Remove all items</button>
            </div>

            {/* Recommendations */}
            {recommendations.length > 0 && (
              <div style={{ marginTop: 14 }}>
                <div style={{ fontSize: 13, fontWeight: 800, textTransform: 'uppercase', letterSpacing: 0.7, color: 'var(--text-muted)', marginBottom: 16 }}>Recommended For You</div>
                <div className="rec-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14 }}>
                  {recommendations.map(r => (
                    <div key={r.id} style={{ background: '#0F0F18', border: '1px solid rgba(255,255,255,0.075)', borderRadius: 10, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                      <div style={{ position: 'relative', aspectRatio: '16 / 9', background: 'var(--bg-4)' }}>
                        {r.image && <img src={r.image} alt={r.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none' }} />}
                        {r.badge && <span style={{ position: 'absolute', top: 8, left: 8, fontSize: 9, fontWeight: 800, textTransform: 'uppercase', letterSpacing: 0.4, color: '#fff', background: 'var(--red)', borderRadius: 4, padding: '3px 7px' }}>{r.badge}</span>}
                      </div>
                      <div style={{ padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 10, flex: 1 }}>
                        <div style={{ fontSize: 13, fontWeight: 700, color: '#fff', lineHeight: 1.3 }}>{r.name}</div>
                        <div style={{ marginTop: 'auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <span style={{ fontFamily: 'Barlow Condensed, sans-serif', fontSize: 17, fontWeight: 800, color: '#f0c040' }}>{money(r.price)}</span>
                          <button onClick={() => addToCart(r)} style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '7px 13px', background: 'rgba(184,44,44,0.12)', border: '1px solid rgba(184,44,44,0.4)', borderRadius: 6, color: '#fff', fontSize: 11, fontWeight: 700, cursor: 'pointer', transition: 'all .15s' }}
                            onMouseEnter={e => { e.currentTarget.style.background = 'var(--red)' }}
                            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(184,44,44,0.12)' }}>
                            <Icon icon="ri:add-line" width={13} height={13} /> Add
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* ── RIGHT: estimated total + info ── */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14, position: 'sticky', top: 24 }}>
            <div style={{ background: '#0F0F18', border: '1px solid rgba(255,255,255,0.075)', borderRadius: 12, padding: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 6 }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-muted)' }}>Estimated total</span>
                <span style={{ fontFamily: 'Barlow Condensed, sans-serif', fontSize: 26, fontWeight: 900, color: '#fff' }}>{money(subtotal)}</span>
              </div>
              <p style={{ fontSize: 11, color: 'var(--text-dim)', lineHeight: 1.5, margin: '0 0 16px' }}>
                Coupons and any applicable sales tax are applied at payment.
              </p>
              <button className="btn-primary" style={{ width: '100%', justifyContent: 'center', gap: 8, padding: '14px', fontSize: 14 }} onClick={() => setView('pay')}>
                Continue to payment <Icon icon="solar:arrow-right-linear" width={16} height={16} />
              </button>
            </div>

            <div style={{ background: 'linear-gradient(160deg, rgba(255,255,255,0.035), rgba(255,255,255,0.01))', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 12, padding: '18px 20px', display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Icon icon="ri:vip-crown-2-fill" width={18} height={18} style={{ color: '#f0c040' }} />
                <span style={{ fontSize: 12, fontWeight: 800, textTransform: 'uppercase', letterSpacing: 0.5, color: '#fff' }}>Digital delivery</span>
              </div>
              <p style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.6, margin: 0 }}>
                Your purchase grants tickets or membership tied to your GamerHead account, delivered instantly on payment.
              </p>
              <p style={{ fontSize: 11, color: 'var(--text-dim)', lineHeight: 1.6, margin: 0 }}>
                All sales are final. For full terms, see the{' '}
                <Link href="/rules" style={{ color: 'var(--text-muted)', fontWeight: 600 }}>Terms of Service</Link>.
              </p>
            </div>
          </div>
        </div>

        <style>{`
          @media (max-width: 860px) { .checkout-grid { grid-template-columns: 1fr !important; } }
          @media (max-width: 560px) { .rec-grid { grid-template-columns: 1fr !important; } }
        `}</style>
      </div>
    )
  }

  // ═══════════════════════════════════════════════════════════════════════════
  //  STEP 2 — PAYMENT
  // ═══════════════════════════════════════════════════════════════════════════
  return (
    <div className="container" style={{ padding: '40px 16px 80px', maxWidth: 1350 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 28 }}>
        <button type="button" onClick={() => setView('cart')} aria-label="Back to cart" style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 38, height: 38, borderRadius: 9, background: 'var(--bg-3)', border: '1px solid var(--border)', color: 'var(--text-muted)', cursor: 'pointer', transition: 'all .15s' }}
          onMouseEnter={e => { e.currentTarget.style.color = '#fff'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)' }}
          onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-muted)'; e.currentTarget.style.borderColor = 'var(--border)' }}>
          <Icon icon="solar:arrow-left-linear" width={18} height={18} />
        </button>
        <div style={{ flex: 1 }}>
          <h1 style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 34, fontWeight: 900, letterSpacing: '0.02em', textTransform: 'uppercase', color: '#fff', margin: 0, lineHeight: 1 }}>Checkout</h1>
          <p style={{ fontSize: 12, color: 'var(--text-dim)', margin: '5px 0 0' }}>Review your order and complete your purchase</p>
        </div>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 7, padding: '7px 13px', borderRadius: 999, background: 'rgba(74,222,128,0.08)', border: '1px solid rgba(74,222,128,0.25)' }}>
          <Icon icon="ri:shield-check-fill" width={14} height={14} style={{ color: '#4ade80' }} />
          <span style={{ fontSize: 11, fontWeight: 700, color: '#4ade80', letterSpacing: 0.3 }}>Secure Checkout</span>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) 360px', gap: 28, alignItems: 'start' }} className="checkout-grid">

        {/* ── LEFT: items + payment ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

          {/* Items */}
          <section style={{ background: '#0F0F18', border: '1px solid rgba(255,255,255,0.075)', borderRadius: 12, overflow: 'hidden' }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid rgba(255,255,255,0.055)', display: 'flex', alignItems: 'center', gap: 8 }}>
              <Icon icon={Solar.cart} width={18} height={18} style={{ opacity: 0.9 }} />
              <span style={{ fontSize: 13, fontWeight: 800, textTransform: 'uppercase', letterSpacing: 0.5, color: '#fff' }}>Your Items</span>
              <span style={{ background: 'var(--red)', color: '#fff', fontSize: 10, fontWeight: 800, padding: '2px 7px', borderRadius: 10 }}>{totalItems}</span>
            </div>
            <div style={{ padding: '14px 20px', display: 'flex', flexDirection: 'column', gap: 10 }}>
              {cart.map(item => (
                <div key={item.id} style={{ display: 'flex', alignItems: 'center', gap: 12, background: 'var(--bg-3)', border: '1px solid var(--border)', borderRadius: 9, padding: '10px 14px' }}>
                  <div style={{ width: 44, height: 44, background: 'var(--bg-4)', borderRadius: 8, overflow: 'hidden', flexShrink: 0 }}>
                    {item.image && <img src={item.image} alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none' }} />}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#fff', marginBottom: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.name}</div>
                    {item.category && <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>{item.category}</div>}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
                    <button onClick={() => changeQty(item.id, -1)} style={{ width: 24, height: 24, background: 'var(--bg-4)', border: '1px solid var(--border)', borderRadius: 4, color: '#fff', fontSize: 15, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>−</button>
                    <span style={{ fontSize: 13, fontWeight: 700, color: '#fff', minWidth: 18, textAlign: 'center' }}>{item.qty}</span>
                    <button onClick={() => changeQty(item.id, +1)} style={{ width: 24, height: 24, background: 'var(--bg-4)', border: '1px solid var(--border)', borderRadius: 4, color: '#fff', fontSize: 15, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>+</button>
                  </div>
                  <div style={{ fontFamily: 'Barlow Condensed, sans-serif', fontSize: 16, fontWeight: 800, color: '#f0c040', minWidth: 60, textAlign: 'right', flexShrink: 0 }}>{money(item.price * item.qty)}</div>
                  <button type="button" onClick={() => removeItem(item.id)} aria-label="Remove" style={{ background: 'none', border: 'none', color: 'var(--text-dim)', cursor: 'pointer', padding: '2px 4px', display: 'flex' }}
                    onMouseEnter={e => (e.currentTarget.style.color = 'var(--red)')}
                    onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-dim)')}>
                    <Icon icon={Solar.close} width={15} height={15} />
                  </button>
                </div>
              ))}
            </div>
          </section>

          {/* Payment method */}
          <section style={{ background: '#0F0F18', border: '1px solid rgba(255,255,255,0.075)', borderRadius: 12, padding: '20px' }}>
            <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.7, color: 'var(--text-dim)', marginBottom: 14 }}>Payment Method</div>
            <div className="pm-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
              {([
                { key: 'wallet' as PayMethod, label: 'Wallet Balance', sub: `${money(walletBalance / 100)} available`, icon: 'ri:wallet-3-fill',  color: '#4ade80', chip: 'rgba(74,222,128,0.12)' },
                { key: 'paypal' as PayMethod, label: 'PayPal',         sub: 'PayPal or Venmo',                        icon: 'ri:paypal-fill',    color: '#60a5fa', chip: 'rgba(96,165,250,0.12)' },
                { key: 'card'   as PayMethod, label: 'Credit / Debit', sub: 'Visa · Mastercard · Amex',               icon: 'ri:bank-card-fill', color: '#e5e7eb', chip: 'rgba(255,255,255,0.07)' },
              ]).map(m => {
                const active = payMethod === m.key
                return (
                  <button key={m.key} onClick={() => { setPayMethod(m.key); setClientSecret(null); setStripeError('') }}
                    style={{
                      display: 'flex', flexDirection: 'column', gap: 12, padding: '15px 14px', textAlign: 'left',
                      background: active ? 'linear-gradient(160deg, rgba(184,44,44,0.16), rgba(184,44,44,0.03))' : 'var(--bg-3)',
                      border: `1px solid ${active ? 'rgba(184,44,44,0.55)' : 'var(--border)'}`,
                      boxShadow: active ? '0 8px 24px rgba(184,44,44,0.10)' : 'none',
                      borderRadius: 12, cursor: 'pointer', transition: 'all .15s',
                    }}
                    onMouseEnter={e => { if (!active) e.currentTarget.style.borderColor = 'rgba(255,255,255,0.18)' }}
                    onMouseLeave={e => { if (!active) e.currentTarget.style.borderColor = 'var(--border)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span style={{ width: 38, height: 38, borderRadius: 9, background: m.chip, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <Icon icon={m.icon} width={20} height={20} style={{ color: m.color }} />
                      </span>
                      <span style={{ width: 18, height: 18, borderRadius: '50%', border: `2px solid ${active ? 'var(--red)' : 'rgba(255,255,255,0.22)'}`, background: active ? 'var(--red)' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        {active && <Icon icon={Solar.checkRead} width={10} height={10} style={{ color: '#fff' }} />}
                      </span>
                    </div>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: active ? '#fff' : 'var(--text-muted)', marginBottom: 3 }}>{m.label}</div>
                      <div style={{ fontSize: 10.5, color: 'var(--text-dim)', lineHeight: 1.4 }}>{m.sub}</div>
                    </div>
                  </button>
                )
              })}
            </div>

            {/* Contextual detail under the selector */}
            {payMethod === 'wallet' && (
              <div style={{ marginTop: 16, background: 'var(--bg-3)', border: '1px solid var(--border)', borderRadius: 10, padding: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 600 }}>Available Balance</span>
                  <span style={{ fontSize: 18, fontWeight: 900, fontFamily: 'Barlow Condensed, sans-serif', color: '#fff' }}>{money(walletBalance / 100)}</span>
                </div>
                {canPayWallet ? (
                  <div style={{ fontSize: 11, color: 'var(--text-dim)', borderTop: '1px solid rgba(255,255,255,0.055)', paddingTop: 10 }}>
                    Remaining after purchase: <span style={{ color: 'var(--text-muted)', fontWeight: 600 }}>{money((walletBalance - totalCents) / 100)}</span>
                  </div>
                ) : (
                  <div style={{ fontSize: 11, color: '#ef4444', borderTop: '1px solid rgba(255,255,255,0.055)', paddingTop: 10, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span>Insufficient balance for this order</span>
                    <Link href="/wallet" style={{ color: 'var(--red)', fontSize: 11, fontWeight: 700, textDecoration: 'none' }}>Deposit funds →</Link>
                  </div>
                )}
              </div>
            )}

            {payMethod === 'card' && (
              <div style={{ marginTop: 16, background: 'var(--bg-3)', border: '1px solid var(--border)', borderRadius: 10, padding: '13px 16px', display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 11, color: 'var(--text-dim)' }}>
                  <Icon icon="ri:lock-2-fill" width={13} height={13} /> Card details are entered securely in the summary
                </span>
                <div style={{ display: 'flex', gap: 6, marginLeft: 'auto', flexWrap: 'wrap' }}>
                  {['Visa', 'Mastercard', 'Amex', 'Discover'].map(c => (
                    <span key={c} style={{ fontSize: 9, fontWeight: 700, color: 'var(--text-dim)', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 4, padding: '3px 7px', letterSpacing: '.3px', textTransform: 'uppercase' }}>{c}</span>
                  ))}
                </div>
              </div>
            )}

            {payMethod === 'paypal' && (
              <div style={{ marginTop: 16, background: 'var(--bg-3)', border: '1px solid var(--border)', borderRadius: 10, padding: '13px 16px', fontSize: 11.5, color: 'var(--text-dim)', display: 'flex', alignItems: 'center', gap: 8 }}>
                <Icon icon="ri:shield-check-fill" width={15} height={15} style={{ color: '#60a5fa', flexShrink: 0 }} />
                Complete your payment with the PayPal or Venmo buttons in the order summary.
              </div>
            )}
          </section>
        </div>

        {/* ── RIGHT: order summary ── */}
        <aside style={{ background: '#0F0F18', border: '1px solid rgba(255,255,255,0.075)', borderRadius: 12, padding: '20px', position: 'sticky', top: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.7, color: 'var(--text-dim)' }}>Order Summary</div>

          {/* Coupon */}
          <div>
            <div style={{ display: 'flex', gap: 8 }}>
              <input type="text" placeholder="Coupon code — try EMPIRE10" value={coupon}
                onChange={e => { setCoupon(e.target.value); setCouponError('') }}
                disabled={couponApplied}
                className="site-input" style={{ flex: 1, fontSize: 12, height: 36 }} />
              <button onClick={applyCoupon} disabled={couponApplied} style={{
                padding: '0 14px',
                background: couponApplied ? 'rgba(39,174,96,0.15)' : 'var(--bg-3)',
                border: `1px solid ${couponApplied ? 'rgba(39,174,96,0.4)' : 'var(--border)'}`,
                borderRadius: 4, color: couponApplied ? '#4ade80' : 'var(--text-muted)',
                fontSize: 11, fontWeight: 700, cursor: couponApplied ? 'default' : 'pointer',
                textTransform: 'uppercase', letterSpacing: 0.4, whiteSpace: 'nowrap',
              }}>
                {couponApplied ? 'Applied' : 'Apply'}
              </button>
            </div>
            {couponError   && <p style={{ fontSize: 11, color: 'var(--red)', marginTop: 6, marginBottom: 0 }}>{couponError}</p>}
            {couponApplied && <p style={{ fontSize: 11, color: '#4ade80', marginTop: 6, marginBottom: 0 }}>10% discount applied!</p>}
          </div>

          {/* Totals */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, borderTop: '1px solid rgba(255,255,255,0.055)', paddingTop: 14 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--text-muted)' }}><span>Subtotal</span><span>{money(subtotal)}</span></div>
            {couponApplied && (
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#4ade80' }}><span>Discount (10%)</span><span>−{money(discount)}</span></div>
            )}
            <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: 'Barlow Condensed, sans-serif', fontSize: 22, fontWeight: 900, borderTop: '1px solid rgba(255,255,255,0.055)', paddingTop: 10, marginTop: 2 }}>
              <span style={{ color: '#fff' }}>Total</span><span style={{ color: '#f0c040' }}>{money(total)}</span>
            </div>
          </div>

          {/* ── Pay action (all methods complete here) ── */}
          {payMethod === 'wallet' && (
            <button className="btn-primary" style={{ width: '100%', justifyContent: 'center', gap: 8, padding: '15px', fontSize: 14, opacity: canPayWallet ? 1 : 0.4 }}
              onClick={payWallet} disabled={!canPayWallet}>
              <Icon icon="ri:wallet-3-fill" width={16} height={16} /> Pay {money(total)}
            </button>
          )}

          {payMethod === 'card' && !clientSecret && (
            <button className="btn-primary" style={{ width: '100%', justifyContent: 'center', gap: 8, padding: '15px', fontSize: 14 }} onClick={payCard}>
              <Icon icon="ri:bank-card-fill" width={16} height={16} /> Continue to Card Payment
            </button>
          )}
          {payMethod === 'card' && clientSecret && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {stripeError && (
                <div style={{ background: 'rgba(184,44,44,0.12)', border: '1px solid rgba(184,44,44,0.35)', borderRadius: 8, padding: '10px 14px', fontSize: 12, color: '#ef4444' }}>{stripeError}</div>
              )}
              <Elements stripe={stripePromise} options={{ clientSecret, appearance: STRIPE_APPEARANCE }}>
                <StripePayForm total={total} onSuccess={handleSuccess} onError={setStripeError} />
              </Elements>
            </div>
          )}

          {payMethod === 'paypal' && (
            !user ? (
              <button className="btn-primary" style={{ width: '100%', justifyContent: 'center', padding: '15px', fontSize: 14 }} onClick={requireLogin}>
                Sign in to pay with PayPal
              </button>
            ) : (
              <PayPalScriptProvider options={{
                clientId:         process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID!,
                currency:         'USD',
                'enable-funding': 'venmo',
                'buyer-country':  'US',
                components:       'buttons,funding-eligibility',
              }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {[FUNDING.PAYPAL, FUNDING.VENMO].map(src => (
                    <PayPalButtons
                      key={src}
                      style={{ layout: 'vertical', color: 'blue', shape: 'rect', height: 45 }}
                      fundingSource={src}
                      createOrder={async () => {
                        const res: any = await storeApi.createPayPalOrder({
                          items: cartItems(), paymentMethod: 'paypal',
                          couponCode: couponApplied ? coupon : undefined,
                        })
                        return res.paypalOrderId
                      }}
                      onApprove={async (data) => {
                        setPhase('processing')
                        try {
                          await storeApi.capturePayPalOrder({ paypalOrderId: data.orderID })
                          handleSuccess()
                        } catch { setPhase('fail') }
                      }}
                      onError={() => setPhase('fail')}
                    />
                  ))}
                </div>
              </PayPalScriptProvider>
            )
          )}

          {/* <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, color: 'var(--text-dim)', borderTop: '1px solid rgba(255,255,255,0.055)', paddingTop: 14 }}>
            <Icon icon="ri:lock-2-fill" width={13} height={13} />
            <span style={{ fontSize: 10.5 }}>Secure, SSL-encrypted payment</span>
          </div> */}
          <p style={{ fontSize: 10, color: 'var(--text-dim)', textAlign: 'center', lineHeight: 1.6, margin: 0 }}>
            By completing your purchase you agree to our Terms of Service. All sales are final.
          </p>
        </aside>
      </div>

      <style>{`
        @media (max-width: 820px) {
          .checkout-grid { grid-template-columns: 1fr !important; }
        }
        @media (max-width: 460px) {
          .pm-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  )
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={<div className="container" style={{ padding: '80px 16px', color: 'var(--text-dim)' }}>Loading checkout…</div>}>
      <CheckoutInner />
    </Suspense>
  )
}
