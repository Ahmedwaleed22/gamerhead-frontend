'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/lib/auth-context'
import { walletApi } from '@/lib/api'
import DashSidebar from '@/app/components/DashSidebar'

const R: React.CSSProperties = { fontFamily: 'Roboto, sans-serif' }
const STATUS_COLOR: Record<string,string> = { completed:'#4ade80', pending:'#F39C12', failed:'#E74C3C', ready:'#F39C12', claimed:'#4A5568', Completed:'#4ade80', Pending:'#F39C12', Failed:'#E74C3C', Ready:'#F39C12', Claimed:'#4A5568' }

export default function WalletPage() {
  const { user } = useAuth()
  const [tab, setTab]               = useState<'overview'|'deposit'|'withdraw'|'prizes'>('overview')
  const [depositAmt, setDepositAmt] = useState('')
  const [withdrawAmt, setWithdrawAmt] = useState('')
  const [filterType, setFilterType] = useState('All')
  const [balance, setBalance]       = useState<any>(null)
  const [txHistory, setTxHistory]   = useState<any[]>([])
  const [prizes, setPrizes]         = useState<any[]>([])
  const [loading, setLoading]       = useState(false)
  const [page, setPage]             = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  useEffect(() => {
    walletApi.getBalance().then(setBalance).catch(() => {})
    walletApi.getPrizeClaims().then((res: any) => setPrizes(Array.isArray(res) ? res : res.claims || [])).catch(() => {})
  }, [])

  useEffect(() => {
    const params: any = { page, limit: 20 }
    if (filterType !== 'All') params.type = filterType.toLowerCase().replace(/ /g, '_')
    walletApi.getTransactions(params).then((res: any) => {
      const txns = res.items ?? res.transactions ?? res
      setTxHistory(Array.isArray(txns) ? txns : [])
      if (res.totalPages) setTotalPages(res.totalPages)
    }).catch(() => {})
  }, [filterType, page])

  const handleDeposit = async () => {
    const amount = parseFloat(depositAmt.replace('$', ''))
    if (!amount || amount <= 0) return
    setLoading(true)
    try {
      const res = await walletApi.deposit({ amount: Math.round(amount * 100) })
      if (res.clientSecret || res.url) {
        // Stripe redirect or client-side confirmation would go here
        alert('Deposit initiated. Redirecting to payment...')
      }
    } catch (err: any) {
      alert(err.message || 'Deposit failed')
    } finally { setLoading(false) }
  }

  const handleWithdraw = async () => {
    const amount = parseFloat(withdrawAmt.replace('$', ''))
    if (!amount || amount < 10) return
    setLoading(true)
    try {
      await walletApi.withdraw({ amount: Math.round(amount * 100) })
      alert('Withdrawal request submitted')
      walletApi.getBalance().then(setBalance).catch(() => {})
    } catch (err: any) {
      alert(err.message || 'Withdrawal failed')
    } finally { setLoading(false) }
  }

  const handleClaimPrize = async (id: string) => {
    try {
      await walletApi.claimPrize(id)
      setPrizes(prev => prev.map(p => (p._id || p.id) === id ? { ...p, status: 'Claimed', claimed: true } : p))
      walletApi.getBalance().then(setBalance).catch(() => {})
    } catch (err: any) {
      alert(err.message || 'Claim failed')
    }
  }

  if (!user) return null

  const cashVal   = balance ? ((balance.cashBalance ?? balance.cash ?? 0) / 100).toFixed(2) : (user.cashBalance / 100).toFixed(2)
  const credits   = balance?.credits ?? user.credits ?? 0

  const inputStyle: React.CSSProperties = { background:'#0C0C11', border:'1px solid rgba(255,255,255,0.1)', borderRadius:8, padding:'11px 14px', ...R, fontSize:13, color:'#fff', outline:'none', width:'100%', boxSizing:'border-box' }
  const btnRed: React.CSSProperties = { background:'#B22D2D', border:'none', borderRadius:8, padding:'12px 32px', ...R, fontWeight:700, fontSize:12, color:'#fff', cursor:'pointer', textTransform:'uppercase', letterSpacing:0.8 }
  const btnGhost: React.CSSProperties = { background:'transparent', border:'1px solid rgba(255,255,255,0.1)', borderRadius:8, padding:'12px 22px', ...R, fontWeight:600, fontSize:12, color:'#9CA3AF', cursor:'pointer' }

  const TABS = [
    { key:'overview', label:'Transaction History' },
    { key:'deposit',  label:'Deposit'  },
    { key:'withdraw', label:'Withdraw' },
    { key:'prizes',   label:'Prize Claims' },
  ] as const

  return (
    <div style={{ background:'#0C0C11', minHeight:'100vh', paddingBottom:80 }}>
      <div className="container" style={{ maxWidth:1440, padding:'0 30px' }}>
        <div style={{ display:'grid', gridTemplateColumns:'220px 1fr', gap:20, paddingTop:28, alignItems:'start' }}>
          <DashSidebar active="wallet" />
          <div>
            <div style={{ marginBottom:24 }}>
              <h1 style={{ fontFamily:"'Barlow Condensed',sans-serif", fontWeight:900, fontSize:32, color:'#fff', margin:0 }}>Wallet & Payouts</h1>
              <div style={{ ...R, fontSize:13, color:'#9CA3AF', marginTop:6 }}>Manage your cash, deposits, withdrawals, and prize claims</div>
            </div>

            {/* Balance cards */}
            <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:16, marginBottom:24 }}>
              {[
                { label:'Available Cash',  value:`$${cashVal}`,    sub:'Ready to use or withdraw',       color:'#4ade80', icon:'💵' },
                { label:'Pending Payouts', value:'—',              sub:'Processing, 1–3 business days',  color:'#F39C12', icon:'⏳' },
                { label:'CE Tickets',      value:`${credits}`,     sub:'Platform tickets balance',       color:'#E74C3C', icon:'🪙' },
              ].map((b,i) => (
                <div key={i} style={{ background:'#18181C', borderRadius:12, padding:'22px 24px', border:`1px solid ${b.color}20`, position:'relative', overflow:'hidden' }}>
                  <div style={{ position:'absolute', right:20, top:14, fontSize:30, opacity:0.12 }}>{b.icon}</div>
                  <div style={{ ...R, fontSize:12, color:'#9CA3AF', marginBottom:8 }}>{b.label}</div>
                  <div style={{ fontFamily:"'Barlow Condensed',sans-serif", fontWeight:900, fontSize:36, color:b.color, lineHeight:1 }}>{b.value}</div>
                  <div style={{ ...R, fontSize:11, color:'#4A5568', marginTop:6 }}>{b.sub}</div>
                </div>
              ))}
            </div>

            {/* Tab card */}
            <div style={{ background:'#18181C', borderRadius:12, overflow:'hidden' }}>
              <div style={{ display:'flex', borderBottom:'1px solid #25252C' }}>
                {TABS.map(t => (
                  <button key={t.key} onClick={() => setTab(t.key)} style={{ padding:'15px 28px', background:'none', border:'none', borderBottom:tab===t.key?'2px solid #B22D2D':'2px solid transparent', marginBottom:-1, ...R, fontWeight:700, fontSize:13, color:tab===t.key?'#fff':'#9CA3AF', cursor:'pointer', whiteSpace:'nowrap' }}>{t.label}</button>
                ))}
              </div>
              <div style={{ padding:'28px 32px' }}>

                {tab === 'overview' && (
                  <div>
                    <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:20 }}>
                      <div style={{ ...R, fontWeight:700, fontSize:15, color:'#fff' }}>All Transactions</div>
                      <div style={{ display:'flex', gap:8 }}>
                        {['All','Deposit','Withdrawal','Match Win','Prize Claim'].map(f => (
                          <button key={f} onClick={() => { setFilterType(f); setPage(1) }} style={{ padding:'6px 14px', background:filterType===f?'#B22D2D':'#202023', border:`1px solid ${filterType===f?'#B22D2D':'rgba(255,255,255,0.08)'}`, borderRadius:8, ...R, fontWeight:600, fontSize:11, color:filterType===f?'#fff':'#9CA3AF', cursor:'pointer' }}>{f}</button>
                        ))}
                      </div>
                    </div>
                    <div style={{ borderRadius:10, overflow:'hidden', border:'1px solid #25252C' }}>
                      <div style={{ display:'grid', gridTemplateColumns:'1fr 180px 110px 120px 100px', background:'#0C0C11', padding:'12px 20px' }}>
                        {['Transaction','Method','Amount','Status','Date'].map((h,i) => (
                          <span key={i} style={{ ...R, fontWeight:700, fontSize:11, color:'#6B7280', letterSpacing:0.8, textTransform:'uppercase' }}>{h}</span>
                        ))}
                      </div>
                      {txHistory.length === 0 ? (
                        <div style={{ padding:'40px 20px', textAlign:'center', ...R, fontSize:13, color:'#4A5568' }}>No transactions found</div>
                      ) : (
                        txHistory.map((tx: any, i: number) => {
                          const isPositive = tx.amount > 0 || ['deposit','match_win','match_refund','prize_claim','coaching_payment','reward','refund'].includes(tx.type)
                          const amtDisplay = tx.amount != null ? `${isPositive ? '+' : ''}$${(Math.abs(tx.amount) / 100).toFixed(2)}` : '—'
                          const status = tx.status || 'completed'
                          const statusCap = status.charAt(0).toUpperCase() + status.slice(1)
                          return (
                            <div key={tx._id || i} style={{ display:'grid', gridTemplateColumns:'1fr 180px 110px 120px 100px', padding:'16px 20px', borderTop:'1px solid #25252C', alignItems:'center' }}>
                              <div style={{ ...R, fontWeight:700, fontSize:14, color:'#fff' }}>{tx.description || tx.type}</div>
                              <div style={{ ...R, fontSize:13, color:'#9CA3AF' }}>{tx.method || tx.reference || '—'}</div>
                              <div style={{ ...R, fontWeight:700, fontSize:15, color:isPositive?'#4ade80':'#E74C3C' }}>{amtDisplay}</div>
                              <div><span style={{ background:(STATUS_COLOR[statusCap]||'#4A5568')+'18', border:`1px solid ${STATUS_COLOR[statusCap]||'#4A5568'}44`, borderRadius:6, padding:'4px 10px', ...R, fontWeight:700, fontSize:11, color:STATUS_COLOR[statusCap]||'#4A5568' }}>{statusCap}</span></div>
                              <div style={{ ...R, fontSize:12, color:'#6B7280' }}>{tx.createdAt ? new Date(tx.createdAt).toLocaleDateString('en-US') : '—'}</div>
                            </div>
                          )
                        })
                      )}
                    </div>
                    {totalPages > 1 && (
                      <div style={{ display:'flex', justifyContent:'center', gap:8, marginTop:16 }}>
                        <button disabled={page <= 1} onClick={() => setPage(p => p - 1)} style={{ ...btnGhost, opacity: page <= 1 ? 0.4 : 1 }}>← Prev</button>
                        <span style={{ ...R, fontSize:13, color:'#9CA3AF', alignSelf:'center' }}>Page {page} of {totalPages}</span>
                        <button disabled={page >= totalPages} onClick={() => setPage(p => p + 1)} style={{ ...btnGhost, opacity: page >= totalPages ? 0.4 : 1 }}>Next →</button>
                      </div>
                    )}
                  </div>
                )}

                {tab === 'deposit' && (
                  <div style={{ maxWidth:520 }}>
                    <div style={{ ...R, fontWeight:700, fontSize:16, color:'#fff', marginBottom:6 }}>Add Funds to Your Wallet</div>
                    <div style={{ ...R, fontSize:13, color:'#9CA3AF', marginBottom:28 }}>Deposit cash to enter wager matches and tournaments.</div>
                    <div style={{ marginBottom:20 }}>
                      <label style={{ ...R, fontWeight:700, fontSize:11, color:'#9CA3AF', marginBottom:8, display:'block', textTransform:'uppercase', letterSpacing:0.5 }}>Amount (USD)</label>
                      <input style={inputStyle} placeholder="$0.00" value={depositAmt} onChange={e => setDepositAmt(e.target.value)} />
                    </div>
                    <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:10, marginBottom:24 }}>
                      {['$10','$25','$50','$100'].map(a => (
                        <button key={a} onClick={() => setDepositAmt(a)} style={{ background:depositAmt===a?'rgba(178,45,45,0.15)':'#202023', border:`1.5px solid ${depositAmt===a?'#B22D2D':'rgba(255,255,255,0.08)'}`, borderRadius:10, padding:'12px 0', ...R, fontWeight:700, fontSize:14, color:depositAmt===a?'#fff':'#9CA3AF', cursor:'pointer' }}>{a}</button>
                      ))}
                    </div>
                    <div style={{ display:'flex', gap:12 }}>
                      <button style={btnRed} onClick={handleDeposit} disabled={loading}>{loading ? 'Processing...' : 'Deposit Funds'}</button>
                      <button style={btnGhost} onClick={() => setTab('overview')}>Cancel</button>
                    </div>
                  </div>
                )}

                {tab === 'withdraw' && (
                  <div style={{ maxWidth:520 }}>
                    <div style={{ ...R, fontWeight:700, fontSize:16, color:'#fff', marginBottom:6 }}>Withdraw Your Winnings</div>
                    <div style={{ ...R, fontSize:13, color:'#9CA3AF', marginBottom:24 }}>Transfer to your bank. Minimum withdrawal: $10.00.</div>
                    <div style={{ background:'rgba(74,222,128,0.06)', border:'1px solid rgba(74,222,128,0.2)', borderRadius:12, padding:'18px 22px', marginBottom:24, display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                      <div>
                        <div style={{ ...R, fontSize:12, color:'#9CA3AF' }}>Available to withdraw</div>
                        <div style={{ fontFamily:"'Barlow Condensed',sans-serif", fontWeight:900, fontSize:34, color:'#4ade80', lineHeight:1, marginTop:4 }}>${cashVal}</div>
                      </div>
                      <div style={{ fontSize:36, opacity:0.4 }}>💸</div>
                    </div>
                    <div style={{ marginBottom:20 }}>
                      <label style={{ ...R, fontWeight:700, fontSize:11, color:'#9CA3AF', marginBottom:8, display:'block', textTransform:'uppercase', letterSpacing:0.5 }}>Withdraw Amount (USD)</label>
                      <input style={inputStyle} placeholder="$0.00" value={withdrawAmt} onChange={e => setWithdrawAmt(e.target.value)} />
                    </div>
                    <div style={{ display:'flex', gap:12 }}>
                      <button style={btnRed} onClick={handleWithdraw} disabled={loading}>{loading ? 'Processing...' : 'Withdraw Funds'}</button>
                      <button style={btnGhost} onClick={() => setTab('overview')}>Cancel</button>
                    </div>
                  </div>
                )}

                {tab === 'prizes' && (
                  <div>
                    <div style={{ ...R, fontWeight:700, fontSize:15, color:'#fff', marginBottom:20 }}>Your Prize Claims</div>
                    <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
                      {prizes.length === 0 ? (
                        <div style={{ padding:'40px 0', textAlign:'center', ...R, fontSize:13, color:'#4A5568' }}>No prize claims</div>
                      ) : (
                        prizes.map((p: any) => {
                          const pId = p._id || p.id
                          const status = p.status || 'Ready'
                          const statusCap = status.charAt(0).toUpperCase() + status.slice(1)
                          return (
                            <div key={pId} style={{ background:'#0C0C11', border:'1px solid #25252C', borderRadius:12, padding:'20px 24px', display:'flex', alignItems:'center', gap:18 }}>
                              <div style={{ width:50, height:50, background:'rgba(243,156,18,0.1)', border:'1px solid rgba(243,156,18,0.2)', borderRadius:10, display:'flex', alignItems:'center', justifyContent:'center', fontSize:24, flexShrink:0 }}>🏆</div>
                              <div style={{ flex:1 }}>
                                <div style={{ ...R, fontWeight:700, fontSize:15, color:'#fff' }}>{p.tournament || p.description || 'Prize'}</div>
                                <div style={{ ...R, fontSize:12, color:'#9CA3AF', marginTop:3 }}>Prize: <span style={{ color:'#F39C12', fontWeight:700, fontSize:14 }}>${((p.amount || 0) / 100).toFixed(2)}</span> - Earned: {p.createdAt ? new Date(p.createdAt).toLocaleDateString('en-US') : '—'}</div>
                              </div>
                              <div style={{ display:'flex', alignItems:'center', gap:12 }}>
                                <span style={{ background:(STATUS_COLOR[statusCap]||'#4A5568')+'18', border:`1px solid ${STATUS_COLOR[statusCap]||'#4A5568'}44`, borderRadius:8, padding:'6px 14px', ...R, fontWeight:700, fontSize:12, color:STATUS_COLOR[statusCap]||'#4A5568' }}>{statusCap}</span>
                                {!p.claimed && statusCap !== 'Claimed' && <button onClick={() => handleClaimPrize(pId)} style={btnRed}>Claim Prize</button>}
                              </div>
                            </div>
                          )
                        })
                      )}
                    </div>
                  </div>
                )}

              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
