'use client'

import React from 'react'

/* ── Shared scoped styles for the auth modal + auth pages ── */
export function AuthStyles() {
  return (
    <style>{`
      @keyframes ghaFadeUp { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }
      @keyframes ghaFadeOut { from { opacity: 1; transform: translateY(0); } to { opacity: 0; transform: translateY(16px); } }
      .gha-backdrop {
        position: fixed; inset: 0; z-index: 2000;
        background: rgba(4,6,10,.82); backdrop-filter: blur(8px);
        display: flex; align-items: center; justify-content: center; padding: 24px;
        animation: ghaFadeUp .28s ease both;
      }
      .gha-backdrop.gha-closing { animation: ghaFadeOut .26s ease both; }
      .gha-card {
        display: flex; width: 100%; max-width: 860px; max-height: calc(100vh - 48px);
        background: var(--bg-2); border: 1px solid var(--border); border-radius: 16px;
        overflow: hidden; box-shadow: 0 40px 110px rgba(0,0,0,.78), 0 0 0 1px rgba(232,0,13,.08);
      }
      .gha-input {
        width: 100%; padding: 14px 14px 14px 44px; background: #0d1017;
        border: 1px solid var(--border); border-radius: 9px; color: #fff; font-size: 14px;
        font-family: 'Barlow', sans-serif; outline: none;
        transition: border-color .15s, box-shadow .15s;
      }
      .gha-input::placeholder { color: #5a6170; }
      .gha-input:focus { border-color: var(--red); box-shadow: 0 0 0 3px rgba(232,0,13,.16); }
      .gha-input[type=date] { color-scheme: dark; }
      .gha-input:-webkit-autofill, .gha-input:-webkit-autofill:hover, .gha-input:-webkit-autofill:focus {
        -webkit-text-fill-color: #fff; -webkit-box-shadow: 0 0 0 1000px #0d1017 inset;
        box-shadow: 0 0 0 1000px #0d1017 inset; caret-color: #fff;
        transition: background-color 9999s ease-in-out 0s;
      }
      .gha-close { color: var(--text-muted); }
      .gha-close:hover { color: #fff; border-color: rgba(255,255,255,.25) !important; }
      .gha-social:hover { border-color: rgba(255,255,255,.28) !important; background: var(--bg-4) !important; }
      .gha-forgot:hover, .gha-switch-link:hover { color: var(--red) !important; }
      @media (max-width: 720px) {
        .gha-card { max-width: 440px; }
        .gha-brand { display: none !important; }
      }
    `}</style>
  )
}

/* ── Icon-prefixed field wrapper used by every text input ── */
export function Field({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div style={{ position: 'relative' }}>
      <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)', display: 'flex', pointerEvents: 'none' }}>
        {icon}
      </span>
      {children}
    </div>
  )
}

/* ── Inline icons (match the Claude Design source) ── */
export const MailIcon = (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><rect x="3" y="5" width="18" height="14" rx="2" /><path d="m3 7 9 6 9-6" /></svg>
)
export const LockIcon = (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><rect x="4" y="11" width="16" height="9" rx="2" /><path d="M8 11V8a4 4 0 0 1 8 0v3" /></svg>
)
export const UserIcon = (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><circle cx="12" cy="8" r="4" /><path d="M4 20c0-4 4-6 8-6s8 2 8 6" /></svg>
)
export const CalendarIcon = (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M3 10h18M8 3v4M16 3v4" /></svg>
)

/* ── Left brand panel shared by the modal and the auth pages ── */
const AUTH_PERKS = [
  'Free to enter, real cash payouts',
  '184 sponsored tournaments live now',
  'Crossplay ranked across 32 titles',
]

export function AuthBrandPanel() {
  return (
    <div className="gha-brand" style={{ flex: '0 0 41%', position: 'relative', padding: '40px 36px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minHeight: 560, overflow: 'hidden' }}>
      <div style={{ position: 'absolute', inset: 0, backgroundImage: "linear-gradient(165deg, rgba(20,5,9,.78) 0%, rgba(13,18,27,.86) 55%, rgba(8,5,7,.96) 100%), url('/images/backgrounds/showcase.jpg')", backgroundSize: 'cover', backgroundPosition: '60% center', zIndex: 0 }} />
      <div style={{ position: 'absolute', top: -80, left: -60, width: 280, height: 280, background: 'radial-gradient(circle, rgba(232,0,13,.34), transparent 70%)', zIndex: 1, pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', right: 0, top: 0, bottom: 0, width: 1, background: 'linear-gradient(180deg, transparent, rgba(232,0,13,.45), transparent)', zIndex: 2 }} />

      <div style={{ position: 'relative', zIndex: 3 }}>
        <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 900, fontSize: 30, letterSpacing: '.01em', textTransform: 'uppercase', lineHeight: 1 }}>
          <span style={{ color: '#fff' }}>Gamer</span><span style={{ color: 'var(--red)', textShadow: '0 0 24px var(--red-glow)' }}>Head</span>
        </div>
        <div style={{ fontFamily: "'Rajdhani', sans-serif", fontWeight: 700, fontSize: 12, letterSpacing: '.26em', textTransform: 'uppercase', color: 'var(--red)', marginTop: 4 }}>Life&apos;s a Game</div>
      </div>

      <div style={{ position: 'relative', zIndex: 3 }}>
        <h2 style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 900, fontSize: 38, lineHeight: .98, textTransform: 'uppercase', color: '#fff', margin: '0 0 22px', textWrap: 'balance' } as React.CSSProperties}>
          Your Skills<br />Deserve A <span style={{ color: 'var(--red)' }}>Payout</span>
        </h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 13 }}>
          {AUTH_PERKS.map(p => (
            <div key={p} style={{ display: 'flex', alignItems: 'center', gap: 11 }}>
              <span style={{ flex: '0 0 20px', width: 20, height: 20, borderRadius: '50%', background: 'rgba(232,0,13,.16)', border: '1px solid rgba(232,0,13,.5)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', color: 'var(--red)' }}>
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3.2} strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5" /></svg>
              </span>
              <span style={{ fontSize: 13.5, color: '#d8dce2', fontWeight: 500 }}>{p}</span>
            </div>
          ))}
        </div>
      </div>

      <div style={{ position: 'relative', zIndex: 3, display: 'flex', alignItems: 'center', gap: 12, paddingTop: 20, borderTop: '1px solid rgba(255,255,255,.1)' }}>
        <span style={{ flex: '0 0 38px', width: 38, height: 38, borderRadius: 10, background: 'rgba(232,0,13,.16)', border: '1px solid rgba(232,0,13,.5)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', color: 'var(--red)' }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M12 2 15 8.5 22 9.3l-5 4.6 1.3 6.9L12 17.6 5.7 20.8 7 13.9l-5-4.6 7-0.8z" /></svg>
        </span>
        <div style={{ fontFamily: "'Rajdhani', sans-serif", lineHeight: 1.15 }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: '#fff' }}>Founding Season is live</div>
          <div style={{ fontSize: 11.5, color: 'var(--text-muted)', letterSpacing: '.03em' }}>Join early &amp; claim founder rewards</div>
        </div>
      </div>
    </div>
  )
}

/* ── Shared inline styles ── */
export const submitStyle = (loading: boolean): React.CSSProperties => ({
  width: '100%', justifyContent: 'center', display: 'inline-flex', alignItems: 'center',
  padding: 14, marginTop: 4, fontSize: 14,
  background: 'var(--red)', color: '#fff', border: 0, borderRadius: 9,
  fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 800, letterSpacing: '.06em', textTransform: 'uppercase',
  cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.65 : 1,
  boxShadow: '0 4px 14px rgba(232,0,13,.4)',
})

export const socialStyle: React.CSSProperties = {
  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 9, padding: 12,
  background: 'var(--bg-3)', border: '1px solid var(--border)', borderRadius: 9, color: '#fff',
  fontSize: 13.5, fontWeight: 600, fontFamily: "'Barlow', sans-serif", cursor: 'pointer',
  textDecoration: 'none', transition: 'border-color .15s, background .15s',
}

export const switchLinkStyle: React.CSSProperties = {
  background: 'none', border: 0, padding: 0, color: 'var(--red)', fontWeight: 700,
  fontSize: 13, cursor: 'pointer', fontFamily: "'Barlow', sans-serif",
}

/* ── Panel heading used on the auth pages ── */
export function AuthHeading({ children }: { children: React.ReactNode }) {
  return (
    <h1 style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 900, fontSize: 30, lineHeight: 1, textTransform: 'uppercase', color: '#fff', margin: '0 0 10px' }}>
      {children}
    </h1>
  )
}
