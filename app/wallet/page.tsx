'use client'

import { useState, useEffect, useCallback } from 'react'
import { Icon } from '@iconify/react'
import { loadStripe } from '@stripe/stripe-js'
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements,
} from '@stripe/react-stripe-js'
import {
  PayPalScriptProvider,
  PayPalButtons,
  usePayPalScriptReducer,
  FUNDING,
} from '@paypal/react-paypal-js'
import { useAuth } from '@/lib/auth-context'
import { walletApi, usersApi } from '@/lib/api'
import DashSidebar from '@/app/components/DashSidebar'
import { Solar } from '@/lib/solar-duotone'
import { useToast } from '@/components/Toast'

// ─── Stripe ───────────────────────────────────────────────────────────────────
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ?? '')

const STRIPE_APPEARANCE = {
  theme: 'night' as const,
  variables: {
    colorPrimary:          '#B22D2D',
    colorBackground:       '#0C0C11',
    colorText:             '#e5e7eb',
    colorTextSecondary:    '#6B7280',
    colorTextPlaceholder:  '#374151',
    colorDanger:           '#E74C3C',
    colorIconCardError:    '#E74C3C',
    borderRadius:          '8px',
    fontFamily:            'Roboto, sans-serif',
    fontSizeBase:          '14px',
    spacingUnit:           '5px',
  },
  rules: {
    '.Input': {
      backgroundColor: '#0C0C11',
      border:          '1px solid rgba(255,255,255,0.09)',
      color:           '#e5e7eb',
      boxShadow:       'none',
      padding:         '11px 14px',
    },
    '.Input:focus': {
      border:    '1px solid rgba(178,45,45,0.55)',
      boxShadow: '0 0 0 3px rgba(178,45,45,0.12)',
      outline:   'none',
    },
    '.Input--invalid': {
      border:    '1px solid rgba(231,76,60,0.55)',
      boxShadow: '0 0 0 3px rgba(231,76,60,0.12)',
    },
    '.Label': {
      color:          '#6B7280',
      fontWeight:     '600',
      fontSize:       '11px',
      textTransform:  'uppercase',
      letterSpacing:  '0.06em',
    },
    '.Tab': {
      backgroundColor: '#0C0C11',
      border:          '1px solid rgba(255,255,255,0.07)',
      color:           '#6B7280',
      boxShadow:       'none',
    },
    '.Tab:hover': {
      backgroundColor: '#18181C',
      color:           '#d1d5db',
    },
    '.Tab--selected': {
      backgroundColor: 'rgba(178,45,45,0.1)',
      border:          '1px solid rgba(178,45,45,0.35)',
      color:           '#ffffff',
      boxShadow:       'none',
    },
    '.Tab--selected:focus': {
      boxShadow: '0 0 0 3px rgba(178,45,45,0.15)',
    },
    '.Block': {
      backgroundColor: '#0C0C11',
      border:          '1px solid rgba(255,255,255,0.07)',
    },
    '.CheckboxInput': {
      backgroundColor: '#0C0C11',
      border:          '1px solid rgba(255,255,255,0.12)',
    },
    '.CheckboxInput--checked': {
      backgroundColor: '#B22D2D',
      borderColor:     '#B22D2D',
    },
    '.Error': { color: '#ef4444' },
    '.TermsText': { color: '#374151' },
  },
}

// ─── Style tokens ─────────────────────────────────────────────────────────────
const R: React.CSSProperties = { fontFamily: 'Roboto, sans-serif' }

const STATUS_COLOR: Record<string, string> = {
  completed: '#4ade80', pending: '#F39C12', failed: '#E74C3C',
  ready: '#F39C12', claimed: '#4A5568',
  Completed: '#4ade80', Pending: '#F39C12', Failed: '#E74C3C',
  Ready: '#F39C12', Claimed: '#4A5568',
  processing: '#60a5fa', Processing: '#60a5fa',
}

const btnRed: React.CSSProperties = {
  background: '#B22D2D', border: 'none', borderRadius: 8,
  padding: '11px 28px', ...R, fontWeight: 700, fontSize: 12,
  color: '#fff', cursor: 'pointer', textTransform: 'uppercase', letterSpacing: 1,
}
const btnGhost: React.CSSProperties = {
  background: 'transparent', border: '1px solid rgba(255,255,255,0.09)',
  borderRadius: 8, padding: '11px 20px', ...R, fontWeight: 600,
  fontSize: 12, color: '#6B7280', cursor: 'pointer',
}
const inputStyle: React.CSSProperties = {
  background: '#0C0C11', border: '1px solid rgba(255,255,255,0.09)',
  borderRadius: 8, padding: '11px 14px', ...R, fontSize: 14,
  color: '#e5e7eb', outline: 'none', width: '100%', boxSizing: 'border-box',
}

// ─── PayPal brand icons (inline SVG — no external image dependency) ───────────
function PayPalLogo({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path d="M7.076 21.337H4.272a.641.641 0 0 1-.633-.74L5.893.901C5.954.537 6.27.271 6.636.271h5.75c2.273 0 3.865.533 4.73 1.586.41.495.672 1.013.8 1.584.134.598.133 1.31-.003 2.178l-.01.059v.513l.32.181c.267.142.509.322.72.537.33.34.554.764.668 1.26.117.507.11 1.12-.02 1.822-.15.817-.39 1.527-.714 2.108a4.65 4.65 0 0 1-1.123 1.408c-.43.365-.942.641-1.52.82a7.05 7.05 0 0 1-1.946.253H14.9a.96.96 0 0 0-.947.808l-.14.717-.22 1.408-.015.077a.96.96 0 0 1-.948.807H7.076z" fill="#009CDE"/>
      <path d="M19.923 5.812a7.78 7.78 0 0 1-.068.392c-.882 4.526-3.9 6.093-7.758 6.093H10.1a.953.953 0 0 0-.942.808l-1.004 6.37-.285 1.808a.502.502 0 0 0 .496.58h3.478c.416 0 .77-.303.836-.713l.034-.177.663-4.203.042-.231a.839.839 0 0 1 .83-.714h.523c3.387 0 6.04-1.377 6.815-5.36.324-1.663.157-3.052-.699-4.029a3.34 3.34 0 0 0-.965-.624z" fill="#003087"/>
    </svg>
  )
}

function VenmoLogo({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <rect width="24" height="24" rx="4" fill="#008CFF"/>
      <path d="M18.5 4.5c.4.65.58 1.32.58 2.17 0 2.7-2.3 6.21-4.17 8.68H10.6L8.88 5.3l3.6-.35 1 7.08c.93-1.52 2.08-3.9 2.08-5.53 0-.9-.15-1.5-.4-2l3.34-.99z" fill="white"/>
    </svg>
  )
}

function StripeLockBadge() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '9px 14px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 8, marginBottom: 20 }}>
      <Icon icon={Solar.lock} width={15} height={15} style={{ color: '#4B5563', flexShrink: 0 }} />
      <span style={{ ...R, fontSize: 12, color: '#4B5563' }}>
        Secured by <strong style={{ color: '#6B7280' }}>Stripe</strong> — your card details never touch our servers
      </span>
    </div>
  )
}

// ─── Stripe Payment Form ──────────────────────────────────────────────────────
function StripePayForm({ onSuccess, onBack }: { onSuccess: () => void; onBack: () => void }) {
  const stripe   = useStripe()
  const elements = useElements()
  const [paying, setPaying] = useState(false)
  const [errMsg, setErrMsg] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!stripe || !elements) return
    setPaying(true)
    setErrMsg('')
    const result = await stripe.confirmPayment({
      elements,
      confirmParams: { return_url: window.location.href },
      redirect: 'if_required',
    })
    if (result.error) {
      setErrMsg(result.error.message ?? 'Payment failed')
      setPaying(false)
    } else if (result.paymentIntent?.status === 'succeeded') {
      onSuccess()
    } else {
      setErrMsg('Unexpected payment status — please try again.')
      setPaying(false)
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <StripeLockBadge />
      <PaymentElement options={{ layout: 'tabs' }} />
      {errMsg && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'rgba(231,76,60,0.08)', border: '1px solid rgba(231,76,60,0.2)', borderRadius: 8, padding: '11px 14px', marginTop: 14 }}>
          <Icon icon={Solar.warning} width={16} height={16} style={{ color: '#E74C3C', flexShrink: 0 }} />
          <span style={{ ...R, fontSize: 13, color: '#E74C3C' }}>{errMsg}</span>
        </div>
      )}
      <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
        <button type="submit" style={{ ...btnRed, opacity: (!stripe || paying) ? 0.55 : 1 }} disabled={!stripe || paying}>
          {paying ? 'Processing…' : 'Confirm Payment'}
        </button>
        <button type="button" style={btnGhost} onClick={onBack} disabled={paying}>Back</button>
      </div>
    </form>
  )
}

// ─── Single PayPal/Venmo button ───────────────────────────────────────────────
function SinglePayPalButton({
  amount,
  fundingSource,
  onSuccess,
  onBack,
}: {
  amount: number
  fundingSource: typeof FUNDING[keyof typeof FUNDING]
  onSuccess: () => void
  onBack: () => void
}) {
  const [{ isPending }] = usePayPalScriptReducer()
  const [errMsg, setErrMsg] = useState('')
  const isVenmo = fundingSource === FUNDING.VENMO

  return (
    <div>
      {isPending && (
        <div style={{ ...R, fontSize: 13, color: '#6B7280', marginBottom: 14 }}>
          Loading {isVenmo ? 'Venmo' : 'PayPal'}…
        </div>
      )}

      <div style={{ marginBottom: 4 }}>
        <PayPalButtons
          style={{ layout: 'vertical', height: 48, shape: 'rect', label: 'pay' }}
          fundingSource={fundingSource}
          createOrder={async () => {
            setErrMsg('')
            const res: any = await walletApi.createPayPalOrder({ amount })
            return res.orderId
          }}
          onApprove={async (data: any) => {
            await walletApi.capturePayPalOrder({ orderId: data.orderID })
            onSuccess()
          }}
          onError={(err: any) => setErrMsg(String(err?.message ?? err ?? 'Payment error'))}
          onCancel={() => setErrMsg('Payment was cancelled')}
        />
      </div>

      {errMsg && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'rgba(231,76,60,0.08)', border: '1px solid rgba(231,76,60,0.2)', borderRadius: 8, padding: '11px 14px', marginTop: 10 }}>
          <Icon icon={Solar.warning} width={16} height={16} style={{ color: '#E74C3C', flexShrink: 0 }} />
          <span style={{ ...R, fontSize: 13, color: '#E74C3C' }}>{errMsg}</span>
        </div>
      )}

      <div style={{ marginTop: 14 }}>
        <button style={btnGhost} onClick={onBack}>Back</button>
      </div>
    </div>
  )
}

// ─── Method option (horizontal row, not a card) ───────────────────────────────
function MethodRow({
  selected, onClick, icon, label, detail,
}: {
  selected: boolean
  onClick: () => void
  icon: React.ReactNode
  label: string
  detail: string
}) {
  return (
    <button
      onClick={onClick}
      style={{
        width:           '100%',
        display:         'flex',
        alignItems:      'center',
        gap:             14,
        background:      selected ? 'rgba(178,45,45,0.07)' : 'transparent',
        border:          `1px solid ${selected ? 'rgba(178,45,45,0.4)' : 'rgba(255,255,255,0.07)'}`,
        borderRadius:    10,
        padding:         '13px 16px',
        cursor:          'pointer',
        textAlign:       'left',
        transition:      'border-color 0.15s, background 0.15s',
        marginBottom:    8,
      }}
    >
      {/* Radio dot */}
      <div style={{
        width: 16, height: 16, borderRadius: '50%', flexShrink: 0,
        border: `2px solid ${selected ? '#B22D2D' : 'rgba(255,255,255,0.2)'}`,
        background: selected ? '#B22D2D' : 'transparent',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        {selected && <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#fff' }} />}
      </div>

      {/* Brand icon */}
      <div style={{
        width: 36, height: 36, borderRadius: 8, flexShrink: 0,
        background: 'rgba(255,255,255,0.04)',
        border: '1px solid rgba(255,255,255,0.06)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        {icon}
      </div>

      {/* Text */}
      <div style={{ flex: 1 }}>
        <div style={{ ...R, fontWeight: 700, fontSize: 14, color: selected ? '#fff' : '#d1d5db', lineHeight: 1 }}>
          {label}
        </div>
        <div style={{ ...R, fontSize: 12, color: '#4B5563', marginTop: 3 }}>{detail}</div>
      </div>

      {selected && (
        <Icon icon={Solar.check} width={18} height={18} style={{ color: '#B22D2D', flexShrink: 0 }} />
      )}
    </button>
  )
}

// ─── Success panel ────────────────────────────────────────────────────────────
function SuccessPanel({ method }: { method: string }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '48px 24px', width: '100%' }}>
      {/* Animated ring */}
      <div style={{ position: 'relative', width: 72, height: 72, marginBottom: 22 }}>
        <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', border: '1px solid rgba(74,222,128,0.15)', background: 'rgba(74,222,128,0.06)' }} />
        <div style={{ position: 'absolute', inset: 6, borderRadius: '50%', border: '1px solid rgba(74,222,128,0.2)', background: 'rgba(74,222,128,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Icon icon={Solar.check} width={30} height={30} style={{ color: '#4ade80' }} />
        </div>
      </div>
      <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 900, fontSize: 26, color: '#fff', marginBottom: 8, letterSpacing: '-0.01em' }}>
        Deposit Confirmed
      </div>
      <div style={{ ...R, fontSize: 14, color: '#6B7280', maxWidth: 300 }}>
        Your {method} payment was received and your balance has been updated.
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 16 }}>
        <div style={{ width: 5, height: 5, borderRadius: '50%', background: '#374151', animation: 'pulse 1.2s ease-in-out infinite' }} />
        <span style={{ ...R, fontSize: 11, color: '#374151' }}>Redirecting to overview</span>
      </div>
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function WalletPage() {
  const { user } = useAuth()
  const { toast } = useToast()

  const [tab, setTab]               = useState<'overview'|'deposit'|'withdraw'|'prizes'>('overview')
  const [balance, setBalance]       = useState<any>(null)
  const [txHistory, setTxHistory]   = useState<any[]>([])
  const [prizes, setPrizes]         = useState<any[]>([])
  const [filterType, setFilterType] = useState('All')
  const [page, setPage]             = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  // Deposit
  const [depositAmt, setDepositAmt]       = useState('25')
  const [payMethod, setPayMethod]         = useState<'stripe'|'paypal'|'venmo'>('stripe')
  const [depositStep, setDepositStep]     = useState<'amount'|'pay'>('amount')
  const [clientSecret, setClientSecret]   = useState<string|null>(null)
  const [paySuccess, setPaySuccess]       = useState(false)
  const [successMethod, setSuccessMethod] = useState('')
  const [depositLoading, setDepositLoading] = useState(false)
  const [depositErr, setDepositErr]       = useState('')

  // Withdraw
  const [withdrawAmt, setWithdrawAmt]         = useState('')
  const [withdrawMethod, setWithdrawMethod]   = useState<'paypal'|'bank'>('paypal')
  const [withdrawDest, setWithdrawDest]       = useState('')
  const [withdrawLoading, setWithdrawLoading] = useState(false)
  const [withdrawSuccess, setWithdrawSuccess] = useState(false)
  const [withdrawError,   setWithdrawError]   = useState('')

  // PayPal link
  const [paypalEditing, setPaypalEditing]   = useState(false)
  const [paypalEmailDraft, setPaypalEmailDraft] = useState('')
  const [paypalSaving, setPaypalSaving]     = useState(false)

  // Bank transfer fields
  const [bankHolder,   setBankHolder]   = useState('')
  const [bankName,     setBankName]     = useState('')
  const [bankRouting,  setBankRouting]  = useState('')
  const [bankAccount,  setBankAccount]  = useState('')
  const [bankType,     setBankType]     = useState<'checking'|'savings'>('checking')

  const refreshBalance = useCallback(() => {
    walletApi.getBalance().then((res: any) => {
      setBalance(res)
      if (res.paypalEmail) setWithdrawDest(res.paypalEmail)
    }).catch(() => {})
  }, [])

  // Poll balance after payment — the webhook credits the DB asynchronously,
  // so we retry up to 8 times (every 1.5 s) and stop as soon as the balance rises.
  const pollBalanceAfterPayment = useCallback((prevCash: number) => {
    let attempts = 0
    const MAX = 8
    const run = () => {
      attempts++
      walletApi.getBalance().then((res: any) => {
        setBalance(res)
        const newCash = res.cashBalance ?? 0
        if (newCash > prevCash || attempts >= MAX) return   // done
        setTimeout(run, 1500)
      }).catch(() => { if (attempts < MAX) setTimeout(run, 1500) })
    }
    setTimeout(run, 1200)   // first check after 1.2 s — webhook usually arrives by then
  }, [])

  useEffect(() => {
    refreshBalance()
    walletApi.getPrizeClaims()
      .then((res: any) => setPrizes(Array.isArray(res) ? res : res.claims ?? []))
      .catch(() => {})
  }, [refreshBalance])

  useEffect(() => {
    const params: any = { page, limit: 20 }
    if (filterType !== 'All') params.type = filterType.toLowerCase().replace(/ /g, '_')
    walletApi.getTransactions(params).then((res: any) => {
      const txns = res.items ?? res.transactions ?? res
      setTxHistory(Array.isArray(txns) ? txns : [])
      if (res.totalPages) setTotalPages(res.totalPages)
    }).catch(() => {})
  }, [filterType, page])

  if (!user) return null

  const cashVal = balance
    ? ((balance.cashBalance ?? 0) / 100).toFixed(2)
    : (user.cashBalance / 100).toFixed(2)
  const credits = balance?.credits ?? user.credits ?? 0
  const parsedAmt = parseFloat(depositAmt.replace('$', ''))

  const TABS = [
    { key: 'overview', label: 'Transaction History' },
    { key: 'deposit',  label: 'Deposit' },
    { key: 'withdraw', label: 'Withdraw' },
    { key: 'prizes',   label: 'Prize Claims' },
  ] as const

  // ── Deposit handlers ──────────────────────────────────────────────────────
  const handleDepositContinue = async () => {
    if (!parsedAmt || parsedAmt < 1) { setDepositErr('Enter an amount of at least $1'); return }
    setDepositErr('')
    if (payMethod === 'stripe') {
      setDepositLoading(true)
      try {
        const res: any = await walletApi.deposit({ amount: parsedAmt })
        setClientSecret(res.clientSecret)
        setDepositStep('pay')
      } catch (err: any) {
        setDepositErr(err.message ?? 'Failed to initiate payment')
      } finally { setDepositLoading(false) }
    } else {
      setDepositStep('pay')
    }
  }

  const handlePaySuccess = () => {
    const method = payMethod === 'stripe' ? 'Stripe' : payMethod === 'paypal' ? 'PayPal' : 'Venmo'
    setSuccessMethod(method)
    setPaySuccess(true)
    setClientSecret(null)
    setDepositStep('amount')

    // Snapshot current cash so polling knows when balance actually rose
    const prevCash = balance?.cashBalance ?? 0
    pollBalanceAfterPayment(prevCash)

    // Also refresh transaction history after a short delay
    setTimeout(() => {
      walletApi.getTransactions({ page: 1, limit: 20 }).then((res: any) => {
        const txns = res.items ?? res.transactions ?? res
        setTxHistory(Array.isArray(txns) ? txns : [])
        if (res.totalPages) setTotalPages(res.totalPages)
      }).catch(() => {})
    }, 2000)

    setTimeout(() => { setPaySuccess(false); setTab('overview') }, 5000)
  }

  const handleDepositBack = () => { setDepositStep('amount'); setClientSecret(null); setDepositErr('') }

  const handleSavePaypalEmail = async () => {
    if (!paypalEmailDraft.trim()) return
    setPaypalSaving(true)
    try {
      await usersApi.updateMe({ paypalEmail: paypalEmailDraft.trim() })
      refreshBalance()
      setWithdrawDest(paypalEmailDraft.trim())
      setPaypalEditing(false)
    } catch (err: any) {
      setWithdrawError(err.message ?? 'Failed to save PayPal email')
    } finally { setPaypalSaving(false) }
  }

  const handleWithdraw = async () => {
    const amount = parseFloat(withdrawAmt.replace('$', ''))
    if (!amount || amount < 10) return

    // Build destination & extra fields per method
    let destination = ''
    const extra: Record<string, string> = {}
    if (withdrawMethod === 'paypal') {
      destination = withdrawDest
      if (!destination) { setWithdrawError('Please link a PayPal account first'); return }
    } else {
      if (!bankHolder.trim())  { setWithdrawError('Account holder name is required'); return }
      if (!bankRouting.trim() || bankRouting.replace(/\D/g,'').length !== 9) { setWithdrawError('Enter a valid 9-digit routing number'); return }
      if (!bankAccount.trim() || bankAccount.replace(/\D/g,'').length < 4)   { setWithdrawError('Enter a valid account number'); return }
      destination = bankAccount.replace(/\D/g,'')
      extra.accountHolder = bankHolder.trim()
      extra.bankName      = bankName.trim()
      extra.routingNumber = bankRouting.replace(/\D/g,'')
      extra.accountType   = bankType
    }

    setWithdrawLoading(true)
    setWithdrawError('')
    try {
      await walletApi.withdraw({ amount, method: withdrawMethod, destination, ...extra })
      setWithdrawSuccess(true)
      refreshBalance()
      setTimeout(() => {
        setWithdrawSuccess(false)
        setWithdrawAmt('')
        setTab('overview')
        window.location.reload();
      }, 5000)
    } catch (err: any) {
      setWithdrawError(err.message ?? 'Withdrawal failed')
    } finally { setWithdrawLoading(false) }
  }

  const handleClaimPrize = async (id: string) => {
    try {
      await walletApi.claimPrize(id)
      setPrizes(prev => prev.map(p => (p._id || p.id) === id ? { ...p, status: 'Claimed', claimed: true } : p))
      refreshBalance()
    } catch (err: any) { toast(err.message ?? 'Claim failed', 'error') }
  }

  // PayPal script provider options
  const paypalOptions = {
    clientId:         process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID ?? '',
    currency:         'USD',
    intent:           'capture',
    components:       'buttons,funding-eligibility',
    'enable-funding': 'venmo',
    'buyer-country':  'US',
  }

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div style={{ background: 'var(--bg)', minHeight: '100vh', paddingBottom: 80 }}>
      <div className="container" style={{ maxWidth: 1440, padding: '0 30px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '220px 1fr', gap: 20, paddingTop: 28, alignItems: 'start' }}>
          <DashSidebar active="wallet" />

          <div>
            {/* Header */}
            <div style={{ marginBottom: 24 }}>
              <h1 style={{ fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 900, fontSize: 32, color: '#fff', margin: 0 }}>
                Wallet & Payouts
              </h1>
              <div style={{ ...R, fontSize: 13, color: '#4B5563', marginTop: 4 }}>
                Manage your cash balance, deposits, withdrawals, and prize claims
              </div>
            </div>

            {/* Balance cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 14, marginBottom: 24 }}>
              {[
                { label: 'Available Cash',  value: `$${cashVal}`, sub: 'Ready to use or withdraw',     color: '#4ade80', icon: Solar.bill       },
                { label: 'Pending Payouts', value: balance ? `$${((balance.pendingPayout ?? 0)/100).toFixed(2)}` : '—',
                                            sub: 'Processing, 1–3 business days',                       color: '#F39C12', icon: Solar.hourglass  },
                { label: 'CE Tickets',      value: `${credits}`, sub: 'Platform tickets balance',       color: '#E74C3C', icon: Solar.coin       },
              ].map((b, i) => (
                <div key={i} style={{ background: '#111114', borderRadius: 12, padding: '20px 22px', border: '1px solid rgba(255,255,255,0.05)', position: 'relative', overflow: 'hidden' }}>
                  <div style={{ position: 'absolute', right: 18, top: 14, opacity: 0.08 }}>
                    <Icon icon={b.icon} width={40} height={40} />
                  </div>
                  <div style={{ ...R, fontSize: 11, color: '#4B5563', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>{b.label}</div>
                  <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 900, fontSize: 34, color: b.color, lineHeight: 1 }}>{b.value}</div>
                  <div style={{ ...R, fontSize: 11, color: '#374151', marginTop: 6 }}>{b.sub}</div>
                </div>
              ))}
            </div>

            {/* Tab card */}
            <div style={{ background: '#111114', borderRadius: 12, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.05)' }}>
              {/* Tabs */}
              <div style={{ display: 'flex', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                {TABS.map(t => (
                  <button key={t.key}
                    onClick={() => { setTab(t.key); setDepositStep('amount'); setPaySuccess(false) }}
                    style={{ padding: '14px 26px', background: 'none', border: 'none', borderBottom: tab === t.key ? '2px solid #B22D2D' : '2px solid transparent', marginBottom: -1, ...R, fontWeight: 700, fontSize: 13, color: tab === t.key ? '#fff' : '#4B5563', cursor: 'pointer', whiteSpace: 'nowrap', transition: 'color 0.15s' }}
                  >
                    {t.label}
                  </button>
                ))}
              </div>

              <div style={{ padding: '26px 28px' }}>

                {/* ── Transaction History ── */}
                {tab === 'overview' && (
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
                      <div style={{ ...R, fontWeight: 700, fontSize: 15, color: '#e5e7eb' }}>All Transactions</div>
                      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                        {['All','Deposit','Withdrawal','Match Win','Prize Claim'].map(f => (
                          <button key={f} onClick={() => { setFilterType(f); setPage(1) }}
                            style={{ padding: '5px 12px', background: filterType === f ? 'rgba(178,45,45,0.15)' : 'transparent', border: `1px solid ${filterType === f ? 'rgba(178,45,45,0.4)' : 'rgba(255,255,255,0.07)'}`, borderRadius: 6, ...R, fontWeight: 600, fontSize: 11, color: filterType === f ? '#fff' : '#4B5563', cursor: 'pointer', transition: 'all 0.15s' }}>
                            {f}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div style={{ borderRadius: 8, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.05)' }}>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 170px 100px 110px 95px', background: '#0C0C11', padding: '10px 18px' }}>
                        {['Transaction','Method','Amount','Status','Date'].map((h, i) => (
                          <span key={i} style={{ ...R, fontWeight: 700, fontSize: 10, color: '#374151', letterSpacing: '0.08em', textTransform: 'uppercase' }}>{h}</span>
                        ))}
                      </div>
                      {txHistory.length === 0 ? (
                        <div style={{ padding: '48px 18px', textAlign: 'center' }}>
                          <Icon icon={Solar.bill} width={32} height={32} style={{ color: '#1f2937', margin: '0 auto 10px', display: 'block' }} />
                          <div style={{ ...R, fontSize: 13, color: '#374151' }}>No transactions found</div>
                        </div>
                      ) : txHistory.map((tx: any, i: number) => {
                        const isPositive = tx.amount > 0 || ['deposit','match_win','match_refund','prize_claim','coaching_payment','reward','refund'].includes(tx.type)
                        const amtDisplay = tx.amount != null ? `${isPositive ? '+' : ''}$${(Math.abs(tx.amount)/100).toFixed(2)}` : '—'
                        const status    = tx.status ?? 'completed'
                        const statusCap = status.charAt(0).toUpperCase() + status.slice(1)
                        return (
                          <div key={tx._id ?? i} style={{ display: 'grid', gridTemplateColumns: '1fr 170px 100px 110px 95px', padding: '14px 18px', borderTop: '1px solid rgba(255,255,255,0.04)', alignItems: 'center' }}>
                            <div style={{ ...R, fontWeight: 600, fontSize: 13, color: '#d1d5db' }}>{tx.description ?? tx.type}</div>
                            <div style={{ ...R, fontSize: 12, color: '#4B5563' }}>{tx.method ?? '—'}</div>
                            <div style={{ ...R, fontWeight: 700, fontSize: 14, color: isPositive ? '#4ade80' : '#E74C3C' }}>{amtDisplay}</div>
                            <div>
                              <span style={{ background: (STATUS_COLOR[statusCap] ?? '#374151') + '18', border: `1px solid ${(STATUS_COLOR[statusCap] ?? '#374151')}33`, borderRadius: 5, padding: '3px 9px', ...R, fontWeight: 700, fontSize: 11, color: STATUS_COLOR[statusCap] ?? '#374151' }}>
                                {statusCap}
                              </span>
                            </div>
                            <div style={{ ...R, fontSize: 11, color: '#374151' }}>
                              {tx.createdAt ? new Date(tx.createdAt).toLocaleDateString('en-US') : '—'}
                            </div>
                          </div>
                        )
                      })}
                    </div>

                    {totalPages > 1 && (
                      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 8, marginTop: 16 }}>
                        <button disabled={page <= 1} onClick={() => setPage(p => p-1)} style={{ ...btnGhost, opacity: page <= 1 ? 0.3 : 1, fontSize: 12 }}>← Prev</button>
                        <span style={{ ...R, fontSize: 12, color: '#4B5563' }}>Page {page} of {totalPages}</span>
                        <button disabled={page >= totalPages} onClick={() => setPage(p => p+1)} style={{ ...btnGhost, opacity: page >= totalPages ? 0.3 : 1, fontSize: 12 }}>Next →</button>
                      </div>
                    )}
                  </div>
                )}

                {/* ── Deposit ── */}
                {tab === 'deposit' && (
                  <div>

                    {/* Success — full width, centred */}
                    {paySuccess && (
                      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 320 }}>
                        <SuccessPanel method={successMethod} />
                      </div>
                    )}

                    {/* Step 1 — Amount + method */}
                    {!paySuccess && depositStep === 'amount' && (
                      <div style={{ maxWidth: 520 }}>
                        <div style={{ marginBottom: 22 }}>
                          <div style={{ ...R, fontWeight: 700, fontSize: 15, color: '#e5e7eb', marginBottom: 2 }}>Add Funds</div>
                          <div style={{ ...R, fontSize: 12, color: '#4B5563' }}>Select an amount and payment method</div>
                        </div>

                        {/* Amount input */}
                        <div style={{ marginBottom: 12 }}>
                          <label style={{ ...R, fontWeight: 700, fontSize: 10, color: '#4B5563', marginBottom: 7, display: 'block', textTransform: 'uppercase', letterSpacing: '0.07em' }}>Amount (USD)</label>
                          <div style={{ position: 'relative' }}>
                            <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', ...R, fontSize: 14, color: '#4B5563' }}>$</span>
                            <input
                              style={{ ...inputStyle, paddingLeft: 26 }}
                              placeholder="0.00"
                              value={depositAmt.replace('$', '')}
                              onChange={e => setDepositAmt(e.target.value)}
                            />
                          </div>
                        </div>

                        {/* Quick presets */}
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 8, marginBottom: 24 }}>
                          {['10','25','50','100'].map(a => {
                            const isSelected = depositAmt.replace('$','') === a
                            return (
                              <button key={a} onClick={() => setDepositAmt(a)}
                                style={{ background: isSelected ? 'rgba(178,45,45,0.12)' : '#0C0C11', border: `1px solid ${isSelected ? 'rgba(178,45,45,0.45)' : 'rgba(255,255,255,0.07)'}`, borderRadius: 8, padding: '10px 0', ...R, fontWeight: 700, fontSize: 14, color: isSelected ? '#fff' : '#6B7280', cursor: 'pointer', transition: 'all 0.15s' }}>
                                ${a}
                              </button>
                            )
                          })}
                        </div>

                        {/* Divider */}
                        <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', marginBottom: 18 }} />

                        {/* Method selector */}
                        <div style={{ marginBottom: 22 }}>
                          <label style={{ ...R, fontWeight: 700, fontSize: 10, color: '#4B5563', marginBottom: 10, display: 'block', textTransform: 'uppercase', letterSpacing: '0.07em' }}>Payment Method</label>

                          <MethodRow
                            selected={payMethod === 'stripe'}
                            onClick={() => setPayMethod('stripe')}
                            icon={<Icon icon="solar:card-2-bold-duotone" width={20} height={20} style={{ color: payMethod === 'stripe' ? '#B22D2D' : '#4B5563' }} />}
                            label="Card"
                            detail="Visa · Mastercard · Amex · Discover"
                          />
                          <MethodRow
                            selected={payMethod === 'paypal'}
                            onClick={() => setPayMethod('paypal')}
                            icon={<PayPalLogo size={20} />}
                            label="PayPal"
                            detail="Pay using your PayPal balance or linked account"
                          />
                          <MethodRow
                            selected={payMethod === 'venmo'}
                            onClick={() => setPayMethod('venmo')}
                            icon={<VenmoLogo size={20} />}
                            label="Venmo"
                            detail="US accounts only · Venmo app required"
                          />
                        </div>

                        {depositErr && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'rgba(231,76,60,0.08)', border: '1px solid rgba(231,76,60,0.2)', borderRadius: 8, padding: '11px 14px', marginBottom: 16 }}>
                            <Icon icon={Solar.warning} width={16} height={16} style={{ color: '#E74C3C', flexShrink: 0 }} />
                            <span style={{ ...R, fontSize: 13, color: '#E74C3C' }}>{depositErr}</span>
                          </div>
                        )}

                        <div style={{ display: 'flex', gap: 10 }}>
                          <button style={{ ...btnRed, opacity: depositLoading ? 0.55 : 1 }} onClick={handleDepositContinue} disabled={depositLoading}>
                            {depositLoading ? 'Loading…' : 'Continue'}
                          </button>
                          <button style={btnGhost} onClick={() => setTab('overview')}>Cancel</button>
                        </div>
                      </div>
                    )}

                    {/* Step 2 — Payment UI */}
                    {!paySuccess && depositStep === 'pay' && (
                      <div style={{ maxWidth: 520 }}>
                        {/* Amount summary */}
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#0C0C11', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 8, padding: '13px 16px', marginBottom: 22 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            {payMethod === 'stripe'  && <Icon icon="solar:card-2-bold-duotone" width={16} height={16} style={{ color: '#4B5563' }} />}
                            {payMethod === 'paypal'  && <PayPalLogo size={16} />}
                            {payMethod === 'venmo'   && <VenmoLogo size={16} />}
                            <span style={{ ...R, fontSize: 12, color: '#4B5563' }}>
                              {payMethod === 'stripe' ? 'Card' : payMethod === 'paypal' ? 'PayPal' : 'Venmo'} deposit
                            </span>
                          </div>
                          <span style={{ fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 900, fontSize: 20, color: '#4ade80' }}>
                            ${parsedAmt.toFixed(2)}
                          </span>
                        </div>

                        {/* Stripe Elements */}
                        {payMethod === 'stripe' && clientSecret && (
                          <Elements stripe={stripePromise} options={{ clientSecret, appearance: STRIPE_APPEARANCE }}>
                            <StripePayForm onSuccess={handlePaySuccess} onBack={handleDepositBack} />
                          </Elements>
                        )}

                        {/* PayPal button only */}
                        {payMethod === 'paypal' && (
                          <PayPalScriptProvider options={paypalOptions}>
                            <SinglePayPalButton
                              amount={parsedAmt}
                              fundingSource={FUNDING.PAYPAL}
                              onSuccess={handlePaySuccess}
                              onBack={handleDepositBack}
                            />
                          </PayPalScriptProvider>
                        )}

                        {/* Venmo button only */}
                        {payMethod === 'venmo' && (
                          <PayPalScriptProvider options={paypalOptions}>
                            <div style={{ ...R, fontSize: 12, color: '#374151', marginBottom: 14 }}>
                              Venmo is available on US accounts in supported browsers. The Venmo app must be installed.
                            </div>
                            <SinglePayPalButton
                              amount={parsedAmt}
                              fundingSource={FUNDING.VENMO}
                              onSuccess={handlePaySuccess}
                              onBack={handleDepositBack}
                            />
                          </PayPalScriptProvider>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* ── Withdraw ── */}
                {tab === 'withdraw' && (
                  <div>

                    {/* ── Success state — full-width centered ── */}
                    {withdrawSuccess ? (
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '64px 24px' }}>
                        <div style={{ position: 'relative', width: 72, height: 72, marginBottom: 24 }}>
                          <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', border: '1px solid rgba(74,222,128,0.15)', background: 'rgba(74,222,128,0.06)' }} />
                          <div style={{ position: 'absolute', inset: 6, borderRadius: '50%', border: '1px solid rgba(74,222,128,0.2)', background: 'rgba(74,222,128,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Icon icon={Solar.check} width={30} height={30} style={{ color: '#4ade80' }} />
                          </div>
                        </div>
                        <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 900, fontSize: 28, color: '#fff', marginBottom: 8, letterSpacing: '-0.01em' }}>
                          Withdrawal Requested
                        </div>
                        <div style={{ ...R, fontSize: 14, color: '#6B7280', maxWidth: 280, lineHeight: 1.6 }}>
                          We'll process your request within 1–3 business days.
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 20 }}>
                          <div style={{ width: 5, height: 5, borderRadius: '50%', background: '#374151', animation: 'pulse 1.2s ease-in-out infinite' }} />
                          <span style={{ ...R, fontSize: 11, color: '#374151' }}>Redirecting to overview…</span>
                        </div>
                      </div>
                    ) : (
                      <div style={{ maxWidth: 520 }}>
                        {/* ── Available balance ── */}
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'var(--bg)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 8, padding: '14px 18px', marginBottom: 24 }}>
                          <div>
                            <div style={{ ...R, fontSize: 11, color: '#4B5563', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600, marginBottom: 4 }}>Available</div>
                            <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 900, fontSize: 28, color: '#4ade80', lineHeight: 1 }}>${cashVal}</div>
                          </div>
                          <Icon icon={Solar.moneySend} width={28} height={28} style={{ color: '#1f2937' }} />
                        </div>

                        {/* ── Method tabs ── */}
                        <div style={{ marginBottom: 24 }}>
                          <div style={{ ...R, fontSize: 12, color: '#6B7280', marginBottom: 8 }}>Withdrawal method</div>
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                            {([
                              { key: 'paypal' as const, label: 'PayPal' },
                              { key: 'bank'   as const, label: 'Bank Transfer' },
                            ] as const).map(m => (
                              <button key={m.key} onClick={() => { setWithdrawMethod(m.key); setWithdrawError('') }}
                                style={{ padding: '10px 14px', background: withdrawMethod === m.key ? 'rgba(178,45,45,0.1)' : 'transparent', border: `1px solid ${withdrawMethod === m.key ? 'rgba(178,45,45,0.45)' : 'rgba(255,255,255,0.07)'}`, borderRadius: 8, ...R, fontWeight: 700, fontSize: 13, color: withdrawMethod === m.key ? '#fff' : '#6B7280', cursor: 'pointer', transition: 'all 0.15s' }}>
                                {m.label}
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* ── PayPal section ── */}
                        {withdrawMethod === 'paypal' && (
                          <div style={{ marginBottom: 22 }}>
                            <div style={{ ...R, fontSize: 12, color: '#6B7280', marginBottom: 8 }}>PayPal account</div>

                            {withdrawDest && !paypalEditing ? (
                              <div style={{ display: 'flex', alignItems: 'center', gap: 12, background: 'rgba(74,222,128,0.04)', border: '1px solid rgba(74,222,128,0.12)', borderRadius: 8, padding: '12px 14px' }}>
                                <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#4ade80', flexShrink: 0 }} />
                                <span style={{ ...R, fontSize: 13, color: '#d1d5db', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{withdrawDest}</span>
                                <button
                                  onClick={() => { setPaypalEmailDraft(withdrawDest); setPaypalEditing(true) }}
                                  style={{ ...R, fontSize: 12, color: '#6B7280', background: 'none', border: 'none', cursor: 'pointer', padding: 0, flexShrink: 0 }}>
                                  Change
                                </button>
                              </div>
                            ) : (
                              <>
                                <input
                                  style={{ ...inputStyle, marginBottom: 10 }}
                                  type="email"
                                  placeholder="your-paypal@email.com"
                                  value={paypalEmailDraft}
                                  onChange={e => setPaypalEmailDraft(e.target.value)}
                                  onKeyDown={e => e.key === 'Enter' && handleSavePaypalEmail()}
                                />
                                <div style={{ display: 'flex', gap: 8 }}>
                                  <button
                                    onClick={handleSavePaypalEmail}
                                    disabled={paypalSaving || !paypalEmailDraft.trim()}
                                    style={{ ...btnRed, opacity: (paypalSaving || !paypalEmailDraft.trim()) ? 0.5 : 1 }}>
                                    {paypalSaving ? 'Saving…' : 'Save'}
                                  </button>
                                  {paypalEditing && (
                                    <button onClick={() => setPaypalEditing(false)} style={btnGhost}>Cancel</button>
                                  )}
                                </div>
                              </>
                            )}
                          </div>
                        )}

                        {/* ── Bank transfer section ── */}
                        {withdrawMethod === 'bank' && (
                          <div style={{ marginBottom: 22, display: 'flex', flexDirection: 'column', gap: 14 }}>

                            <div>
                              <div style={{ ...R, fontSize: 12, color: '#6B7280', marginBottom: 7 }}>Account holder</div>
                              <input style={inputStyle} placeholder="Full legal name" value={bankHolder}
                                onChange={e => { setBankHolder(e.target.value); setWithdrawError('') }} />
                            </div>

                            <div>
                              <div style={{ ...R, fontSize: 12, color: '#6B7280', marginBottom: 7 }}>Bank name</div>
                              <input style={inputStyle} placeholder="Chase, Wells Fargo, Bank of America…" value={bankName}
                                onChange={e => setBankName(e.target.value)} />
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                              <div>
                                <div style={{ ...R, fontSize: 12, color: '#6B7280', marginBottom: 7 }}>Routing number <span style={{ color: '#374151' }}>(9 digits)</span></div>
                                <input style={inputStyle} placeholder="021000021" maxLength={9} inputMode="numeric"
                                  value={bankRouting}
                                  onChange={e => { setBankRouting(e.target.value.replace(/\D/g,'')); setWithdrawError('') }} />
                              </div>
                              <div>
                                <div style={{ ...R, fontSize: 12, color: '#6B7280', marginBottom: 7 }}>Account type</div>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
                                  {(['checking', 'savings'] as const).map(t => (
                                    <button key={t} onClick={() => setBankType(t)}
                                      style={{ padding: '9px 4px', background: bankType === t ? 'rgba(178,45,45,0.1)' : 'transparent', border: `1px solid ${bankType === t ? 'rgba(178,45,45,0.4)' : 'rgba(255,255,255,0.07)'}`, borderRadius: 6, ...R, fontSize: 12, fontWeight: 700, color: bankType === t ? '#fff' : '#4B5563', cursor: 'pointer', transition: 'all 0.15s', textTransform: 'capitalize' }}>
                                      {t}
                                    </button>
                                  ))}
                                </div>
                              </div>
                            </div>

                            <div>
                              <div style={{ ...R, fontSize: 12, color: '#6B7280', marginBottom: 7 }}>Account number</div>
                              <input style={inputStyle} placeholder="Your account number" inputMode="numeric"
                                value={bankAccount}
                                onChange={e => { setBankAccount(e.target.value.replace(/\D/g,'')); setWithdrawError('') }} />
                              {bankAccount.length >= 4 && (
                                <div style={{ ...R, fontSize: 11, color: '#374151', marginTop: 5 }}>Ending ••••{bankAccount.slice(-4)}</div>
                              )}
                            </div>

                            <div style={{ ...R, fontSize: 11, color: '#374151', lineHeight: 1.5 }}>
                              Bank transfers take 3–5 business days.
                            </div>
                          </div>
                        )}

                        {/* ── Amount ── */}
                        <div style={{ marginBottom: 20 }}>
                          <div style={{ ...R, fontSize: 12, color: '#6B7280', marginBottom: 7 }}>Amount</div>
                          <div style={{ position: 'relative' }}>
                            <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', ...R, fontSize: 14, color: '#4B5563' }}>$</span>
                            <input style={{ ...inputStyle, paddingLeft: 26 }} placeholder="0.00" value={withdrawAmt} onChange={e => { setWithdrawAmt(e.target.value); setWithdrawError('') }} />
                          </div>
                          <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
                            {['25', '50', '100', '250'].map(v => {
                              const n = parseFloat(v)
                              const cashNum = parseFloat(cashVal)
                              const disabled = !isNaN(cashNum) && n > cashNum
                              return (
                                <button key={v} onClick={() => !disabled && setWithdrawAmt(v)} disabled={disabled}
                                  style={{ ...R, fontSize: 11, fontWeight: 600, color: disabled ? '#2d2d35' : '#6B7280', background: 'transparent', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 5, padding: '4px 10px', cursor: disabled ? 'not-allowed' : 'pointer', opacity: disabled ? 0.35 : 1 }}>
                                  ${v}
                                </button>
                              )
                            })}
                          </div>
                        </div>

                        {/* ── Inline error ── */}
                        {withdrawError && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'rgba(231,76,60,0.07)', border: '1px solid rgba(231,76,60,0.2)', borderRadius: 8, padding: '10px 14px', marginBottom: 14 }}>
                            <Icon icon={Solar.close} width={14} height={14} style={{ color: '#E74C3C', flexShrink: 0 }} />
                            <span style={{ ...R, fontSize: 13, color: '#E74C3C' }}>{withdrawError}</span>
                          </div>
                        )}

                        <div style={{ display: 'flex', gap: 10 }}>
                          <button style={{ ...btnRed, opacity: withdrawLoading ? 0.55 : 1 }} onClick={handleWithdraw} disabled={withdrawLoading}>
                            {withdrawLoading ? 'Processing…' : 'Request Withdrawal'}
                          </button>
                          <button style={btnGhost} onClick={() => setTab('overview')}>Cancel</button>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* ── Prize Claims ── */}
                {tab === 'prizes' && (
                  <div>
                    <div style={{ ...R, fontWeight: 700, fontSize: 15, color: '#e5e7eb', marginBottom: 18 }}>Prize Claims</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                      {prizes.length === 0 ? (
                        <div style={{ padding: '48px 0', textAlign: 'center' }}>
                          <Icon icon={Solar.trophy} width={32} height={32} style={{ color: '#1f2937', display: 'block', margin: '0 auto 10px' }} />
                          <div style={{ ...R, fontSize: 13, color: '#374151' }}>No prize claims available</div>
                        </div>
                      ) : prizes.map((p: any) => {
                        const pId     = p._id ?? p.id
                        const status  = p.status ?? 'Ready'
                        const statusCp = status.charAt(0).toUpperCase() + status.slice(1)
                        return (
                          <div key={pId} style={{ background: '#0C0C11', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 10, padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 16 }}>
                            <div style={{ width: 44, height: 44, background: 'rgba(243,156,18,0.08)', border: '1px solid rgba(243,156,18,0.15)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                              <Icon icon={Solar.trophy} width={22} height={22} style={{ color: '#F39C12' }} />
                            </div>
                            <div style={{ flex: 1 }}>
                              <div style={{ ...R, fontWeight: 600, fontSize: 14, color: '#d1d5db' }}>{p.tournament ?? p.description ?? 'Prize'}</div>
                              <div style={{ ...R, fontSize: 12, color: '#4B5563', marginTop: 2 }}>
                                <span style={{ color: '#F39C12', fontWeight: 700 }}>${((p.amount ?? 0)/100).toFixed(2)}</span>
                                {' '}·{' '}{p.createdAt ? new Date(p.createdAt).toLocaleDateString('en-US') : '—'}
                              </div>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                              <span style={{ background: (STATUS_COLOR[statusCp] ?? '#374151') + '18', border: `1px solid ${(STATUS_COLOR[statusCp] ?? '#374151')}33`, borderRadius: 5, padding: '4px 10px', ...R, fontWeight: 700, fontSize: 11, color: STATUS_COLOR[statusCp] ?? '#374151' }}>
                                {statusCp}
                              </span>
                              {!p.claimed && statusCp !== 'Claimed' && (
                                <button onClick={() => handleClaimPrize(pId)} style={btnRed}>Claim</button>
                              )}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}

              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Decorative bottom glow — matches other dashboard pages */}
      <div style={{
        position: 'fixed', bottom: 0, left: 0, right: 0,
        height: 320, pointerEvents: 'none', zIndex: 0,
        background: 'linear-gradient(to top, rgba(178,45,45,0.07) 0%, transparent 100%)',
      }} />
    </div>
  )
}
