'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/lib/auth-context'
import { tournamentsApi, gamesApi } from '@/lib/api'

const REGIONS   = ['North America', 'Europe', 'Asia', 'Oceania', 'South America']
const PLATFORMS = ['Cross-Play', 'Console Only', 'PC Only']
const BRACKETS  = ['Single Elimination', 'Double Elimination']
const ENTRY_TYPES = [
  { value: 'team', label: 'Team' },
  { value: 'solo', label: 'Solo' },
  { value: 'both', label: 'Both' },
]
const FORMATS = ['Solo (1v1)', 'Duos (2v2)', 'Trios (3v3)', 'Squads (4v4)']
const SERIES  = ['Best of 1', 'Best of 3', 'Best of 5']

// Default rules per game — admin can edit/add/remove after preset loads
const GAME_RULES: Record<string, string[]> = {
  'Call of Duty': [
    'Matches must be played on the assigned gamemode and map',
    'No exploits, glitches, or out-of-map spots',
    'Results must be submitted within 15 minutes with screenshot proof',
    'All players must be on the registered roster',
    'Unsportsmanlike conduct results in immediate disqualification',
    'Disputes resolved by admin within 24 hours',
  ],
  'Fortnite': [
    'Matches are played in custom lobbies with tournament settings',
    'No teaming, collusion, or stream sniping',
    'All players must use their registered Epic ID',
    'Results must be submitted within 15 minutes with screenshot proof',
    'Macro/automation software is strictly prohibited',
    'Disputes resolved by admin within 24 hours',
  ],
  'FIFA / EA FC': [
    'Matches must be played on default settings unless stated otherwise',
    'No exploits, lag switching, or intentional disconnects',
    'Results must be submitted within 15 minutes with screenshot proof',
    'Both players must confirm the final score',
    'Custom tactics and formations are allowed',
    'Disputes resolved by admin within 24 hours',
  ],
  'Warzone': [
    'Matches played in custom lobby with tournament settings',
    'No exploits, glitches, wall breaches, or out-of-map spots',
    'All players must use their registered Activision ID',
    'Results must be submitted within 15 minutes with screenshot proof',
    'Third-party software (aimbot, wallhacks, etc.) results in a permanent ban',
    'Disputes resolved by admin within 24 hours',
  ],
  'Rocket League': [
    'Matches played on tournament-standard settings (no mutators)',
    'No exploits or intentional disconnects',
    'All players must be on the registered roster',
    'Results must be submitted within 15 minutes with screenshot proof',
    'Forfeiting a match results in a loss for the forfeiting team',
    'Disputes resolved by admin within 24 hours',
  ],
  'Apex Legends': [
    'Matches played in custom lobby with tournament settings',
    'No teaming, collusion, or exploiting map glitches',
    'All players must use their registered EA ID',
    'Results based on placement and kills as defined by format',
    'Third-party software results in a permanent ban',
    'Disputes resolved by admin within 24 hours',
  ],
  'Valorant': [
    'Matches played on tournament-standard settings',
    'No exploits, pixel walking, or map glitches',
    'All players must use their registered Riot ID',
    'Results must be submitted within 15 minutes with screenshot proof',
    'Third-party software (aimbot, wallhacks, etc.) results in a permanent ban',
    'Disputes resolved by admin within 24 hours',
  ],
  'Madden NFL': [
    'Matches must be played on default settings unless stated otherwise',
    'No exploits, nano blitzes, or glitch plays',
    'Both players must confirm the final score',
    'Results must be submitted within 15 minutes with screenshot proof',
    'Intentional disconnects count as a forfeit',
    'Disputes resolved by admin within 24 hours',
  ],
}

const DEFAULT_RULES = [
  'All matches must be played under fair conditions',
  'Results must be submitted within 15 minutes with screenshot proof',
  'No exploits, cheating, or third-party software',
  'All players must be on the registered roster',
  'Unsportsmanlike conduct results in disqualification',
  'Disputes resolved by admin within 24 hours',
]

interface PrizeRow {
  place: string; amount: string; color: string; creditsBonus: string; note: string
}
interface ScheduleRow {
  round: string; time: string; date: string
}

const EMPTY_PRIZE: PrizeRow = { place: '', amount: '', color: '#F0C040', creditsBonus: '0', note: '' }
const EMPTY_SCHEDULE: ScheduleRow = { round: '', time: '', date: '' }

export default function CreateTournamentPage() {
  const { user } = useAuth()
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [error,  setError]  = useState('')
  const [games,  setGames]  = useState<any[]>([])

  // Form state
  const [name, setName]               = useState('')
  const [game, setGame]               = useState('')
  const [bracketType, setBracketType] = useState('Single Elimination')
  const [entryType, setEntryType]     = useState('team')
  const [format, setFormat]           = useState('Squads (4v4)')
  const [series, setSeries]           = useState('Best of 3')
  const [minTeamSize, setMinTeamSize] = useState('4')
  const [maxTeamSize, setMaxTeamSize] = useState('4')
  const [maxTeams, setMaxTeams]       = useState('64')
  const [entryCredits, setEntryCredits] = useState('0')
  const [prizePool, setPrizePool]     = useState('0')
  const [startDate, setStartDate]     = useState('')
  const [startTime, setStartTime]     = useState('')
  const [checkIn, setCheckIn]         = useState('')
  const [region, setRegion]           = useState('North America')
  const [platform, setPlatform]       = useState('Cross-Play')
  const [accentColor, setAccentColor] = useState('#1A5C9E')
  const [bannerUrl, setBannerUrl]     = useState('')
  const [isFeatured, setIsFeatured]   = useState(false)
  const [status, setStatus]           = useState('open')
  const [rules, setRules]             = useState<string[]>([''])
  const [prizes, setPrizes]           = useState<PrizeRow[]>([{ ...EMPTY_PRIZE }])
  const [schedule, setSchedule]       = useState<ScheduleRow[]>([{ ...EMPTY_SCHEDULE }])

  useEffect(() => {
    gamesApi.getAll().then((data: any) => {
      const list = Array.isArray(data) ? data : (data.games ?? data.data ?? [])
      setGames(list)
    }).catch(() => {})
  }, [])

  // Redirect non-admins
  if (user && (user as any).role !== 'admin') {
    router.push('/tournaments')
    return null
  }

  // When a game is selected, preset fields from game data
  function handleGameSelect(gameName: string) {
    setGame(gameName)
    const g = games.find((gm: any) => gm.name === gameName)
    if (!g) return

    // Accent color
    if (g.accentColor) setAccentColor(g.accentColor)

    // Platform — use crossplay flag
    if (g.crossplay === false) setPlatform('Console Only')
    else setPlatform('Cross-Play')

    // Rules — load game-specific rules
    const gameRules = GAME_RULES[gameName] || DEFAULT_RULES
    setRules([...gameRules])
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim() || !game.trim()) { setError('Name and Game are required'); return }
    setSaving(true)
    setError('')

    const dto: any = {
      name: name.trim(),
      game: game.trim(),
      bracketType,
      entryType,
      format,
      series,
      minTeamSize: Number(minTeamSize),
      maxTeamSize: Number(maxTeamSize),
      maxTeams:    Number(maxTeams),
      entryCredits: Number(entryCredits),
      prizePool:    Number(prizePool),
      startDate,
      startTime,
      checkIn,
      startAt: startDate && startTime ? new Date(`${startDate}T${startTime}`) : null,
      region,
      platform,
      accentColor,
      bannerUrl,
      isFeatured,
      status,
      rules: rules.filter(r => r.trim()),
      prizes: prizes.filter(p => p.place.trim()).map(p => ({
        place: p.place,
        amount: Number(p.amount),
        color: p.color,
        creditsBonus: Number(p.creditsBonus),
        note: p.note,
      })),
      schedule: schedule.filter(s => s.round.trim()).map(s => ({
        round: s.round,
        time: s.time,
        date: s.date,
      })),
    }

    try {
      const created: any = await tournamentsApi.create(dto)
      const slug = created.slug ?? created._id ?? created.id
      router.push(`/tournaments/${slug}`)
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || 'Failed to create tournament')
      setSaving(false)
    }
  }

  // Dynamic list helpers
  function updatePrize(i: number, key: keyof PrizeRow, val: string) {
    setPrizes(prev => prev.map((p, j) => j === i ? { ...p, [key]: val } : p))
  }
  function updateSchedule(i: number, key: keyof ScheduleRow, val: string) {
    setSchedule(prev => prev.map((s, j) => j === i ? { ...s, [key]: val } : s))
  }
  function updateRule(i: number, val: string) {
    setRules(prev => prev.map((r, j) => j === i ? val : r))
  }

  const selectedGame = games.find((g: any) => g.name === game)

  return (
    <div className="container" style={{ paddingBottom: 80, maxWidth: 820, margin: '0 auto' }}>

      {/* HEADER */}
      <div style={{
        padding: '40px 0 24px',
        borderBottom: '1px solid var(--border)',
        marginBottom: 28,
        display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between',
      }}>
        <div>
          <h1 style={{
            fontFamily: "'Barlow Condensed', sans-serif",
            fontSize: 36, fontWeight: 900,
            textTransform: 'uppercase', letterSpacing: '0.02em',
            color: '#fff', marginBottom: 6,
          }}>
            Create <span style={{ color: 'var(--red)' }}>Tournament</span>
          </h1>
          <p style={{ fontSize: 14, color: 'var(--text-muted)', margin: 0 }}>
            Fill in the details below to set up a new tournament
          </p>
        </div>
        <Link href="/tournaments" style={{
          padding: '8px 18px',
          background: 'var(--bg-3)', border: '1px solid var(--border)',
          borderRadius: 6, color: 'var(--text-muted)', fontSize: 12, fontWeight: 700,
          fontFamily: "'Barlow Condensed', sans-serif", textTransform: 'uppercase',
          textDecoration: 'none', letterSpacing: '0.06em',
        }}>
          Back
        </Link>
      </div>

      {error && (
        <div style={{
          padding: '10px 16px', marginBottom: 20, borderRadius: 6,
          background: 'rgba(232,0,13,0.12)', border: '1px solid rgba(232,0,13,0.3)',
          color: '#ff6b6b', fontSize: 13, fontWeight: 600,
        }}>{error}</div>
      )}

      <form onSubmit={handleSubmit}>
        {/* BASIC INFO */}
        <Section title="Basic Info">
          <Row>
            <Field label="Tournament Name" required flex={2}>
              <Input value={name} onChange={setName} placeholder="e.g. Weekend Warzone Showdown" />
            </Field>
            <Field label="Status">
              <Select value={status} onChange={setStatus} options={[
                { value: 'draft', label: 'Draft' },
                { value: 'open', label: 'Open' },
              ]} />
            </Field>
          </Row>
          <Row>
            <Field label="Game" required flex={2}>
              <Select value={game} onChange={handleGameSelect} options={[
                { value: '', label: 'Select game...' },
                ...games.map((g: any) => ({ value: g.name, label: g.name })),
              ]} />
            </Field>
            <Field label="Accent Color">
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <input type="color" value={accentColor} onChange={e => setAccentColor(e.target.value)}
                  style={{ width: 36, height: 32, border: 'none', background: 'transparent', cursor: 'pointer' }} />
                <Input value={accentColor} onChange={setAccentColor} placeholder="#1A5C9E" />
              </div>
            </Field>
          </Row>

          {/* Game preset indicator */}
          {selectedGame && (
            <div style={{
              padding: '8px 12px', marginBottom: 12, borderRadius: 6,
              background: accentColor + '12', border: `1px solid ${accentColor}30`,
              display: 'flex', alignItems: 'center', gap: 10,
            }}>
              <div style={{
                width: 8, height: 8, borderRadius: '50%', background: accentColor, flexShrink: 0,
              }} />
              <span style={{ fontSize: 12, color: '#ccc' }}>
                <strong style={{ color: accentColor }}>{selectedGame.name}</strong> selected
                {selectedGame.platforms?.length > 0 && ` \u2014 ${selectedGame.platforms.join(', ')}`}
                {selectedGame.modes?.length > 0 && ` \u2014 Modes: ${selectedGame.modes.slice(0, 3).join(', ')}${selectedGame.modes.length > 3 ? '...' : ''}`}
              </span>
            </div>
          )}

          <Row>
            <Field label="Banner URL">
              <Input value={bannerUrl} onChange={setBannerUrl} placeholder="https://..." />
            </Field>
            <Field label="Featured">
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', paddingTop: 6 }}>
                <input type="checkbox" checked={isFeatured} onChange={e => setIsFeatured(e.target.checked)} />
                <span style={{ fontSize: 13, color: '#ccc' }}>Show on homepage</span>
              </label>
            </Field>
          </Row>
        </Section>

        {/* FORMAT */}
        <Section title="Format & Registration">
          <Row>
            <Field label="Bracket Type">
              <Select value={bracketType} onChange={setBracketType} options={BRACKETS.map(b => ({ value: b, label: b }))} />
            </Field>
            <Field label="Entry Type">
              <Select value={entryType} onChange={setEntryType} options={ENTRY_TYPES.map(e => ({ value: e.value, label: e.label }))} />
            </Field>
            <Field label="Format">
              <Select value={format} onChange={setFormat} options={FORMATS.map(f => ({ value: f, label: f }))} />
            </Field>
          </Row>
          <Row>
            <Field label="Series">
              <Select value={series} onChange={setSeries} options={SERIES.map(s => ({ value: s, label: s }))} />
            </Field>
            <Field label="Min Team Size">
              <Input value={minTeamSize} onChange={setMinTeamSize} type="number" />
            </Field>
            <Field label="Max Team Size">
              <Input value={maxTeamSize} onChange={setMaxTeamSize} type="number" />
            </Field>
          </Row>
          <Row>
            <Field label="Max Teams/Slots">
              <Input value={maxTeams} onChange={setMaxTeams} type="number" />
            </Field>
            <Field label="Entry Cost (Tickets)">
              <Input value={entryCredits} onChange={setEntryCredits} type="number" />
            </Field>
          </Row>
        </Section>

        {/* REGION & SCHEDULE */}
        <Section title="Region & Schedule">
          <Row>
            <Field label="Region">
              <Select value={region} onChange={setRegion} options={REGIONS.map(r => ({ value: r, label: r }))} />
            </Field>
            <Field label="Platform">
              <Select value={platform} onChange={setPlatform} options={PLATFORMS.map(p => ({ value: p, label: p }))} />
            </Field>
          </Row>
          <Row>
            <Field label="Start Date">
              <Input value={startDate} onChange={setStartDate} type="date" />
            </Field>
            <Field label="Start Time">
              <Input value={startTime} onChange={setStartTime} type="time" />
            </Field>
            <Field label="Check-in Opens">
              <Input value={checkIn} onChange={setCheckIn} placeholder="e.g. 30 min before" />
            </Field>
          </Row>
        </Section>

        {/* PRIZES */}
        <Section title="Prizes">
          <Row>
            <Field label="Total Prize Pool ($)">
              <Input value={prizePool} onChange={setPrizePool} type="number" />
            </Field>
          </Row>
          {prizes.map((p, i) => (
            <Row key={i}>
              <Field label="Place" flex={0.6}>
                <Input value={p.place} onChange={v => updatePrize(i, 'place', v)} placeholder="1st" />
              </Field>
              <Field label="Amount ($)">
                <Input value={p.amount} onChange={v => updatePrize(i, 'amount', v)} type="number" placeholder="500" />
              </Field>
              <Field label="Tickets Bonus">
                <Input value={p.creditsBonus} onChange={v => updatePrize(i, 'creditsBonus', v)} type="number" placeholder="0" />
              </Field>
              <Field label="Color" flex={0.5}>
                <Input value={p.color} onChange={v => updatePrize(i, 'color', v)} placeholder="#F0C040" />
              </Field>
              <Field label="Note" flex={0.8}>
                <Input value={p.note} onChange={v => updatePrize(i, 'note', v)} placeholder="Optional" />
              </Field>
              {prizes.length > 1 && (
                <button type="button" onClick={() => setPrizes(prev => prev.filter((_, j) => j !== i))}
                  style={{ ...removeBtnStyle, marginTop: 22 }}>x</button>
              )}
            </Row>
          ))}
          <AddBtn onClick={() => setPrizes(prev => [...prev, { ...EMPTY_PRIZE }])} label="+ Add Prize Tier" />
        </Section>

        {/* SCHEDULE */}
        <Section title="Schedule">
          {schedule.map((s, i) => (
            <Row key={i}>
              <Field label="Round" flex={1.2}>
                <Input value={s.round} onChange={v => updateSchedule(i, 'round', v)} placeholder="Round 1" />
              </Field>
              <Field label="Date">
                <Input value={s.date} onChange={v => updateSchedule(i, 'date', v)} type="date" />
              </Field>
              <Field label="Time">
                <Input value={s.time} onChange={v => updateSchedule(i, 'time', v)} type="time" />
              </Field>
              {schedule.length > 1 && (
                <button type="button" onClick={() => setSchedule(prev => prev.filter((_, j) => j !== i))}
                  style={{ ...removeBtnStyle, marginTop: 22 }}>x</button>
              )}
            </Row>
          ))}
          <AddBtn onClick={() => setSchedule(prev => [...prev, { ...EMPTY_SCHEDULE }])} label="+ Add Round" />
        </Section>

        {/* RULES */}
        <Section title="Rules">
          <div style={{ marginBottom: 12 }}>
            <Field label="Load Game Rules Preset">
              <Select value="" onChange={(v) => {
                if (!v) return
                const preset = GAME_RULES[v] || DEFAULT_RULES
                setRules([...preset])
              }} options={[
                { value: '', label: 'Select a game to load rules...' },
                ...Object.keys(GAME_RULES).map(g => ({ value: g, label: g })),
                { value: '__default', label: 'Default (Generic)' },
              ]} />
            </Field>
            {game && GAME_RULES[game] && rules.length > 0 && rules[0] === (GAME_RULES[game]?.[0] || '') && (
              <div style={{ fontSize: 11, color: accentColor, marginTop: 4 }}>
                {game} rules loaded -- edit as needed below
              </div>
            )}
          </div>
          {rules.map((r, i) => (
            <Row key={i}>
              <Field label={`Rule ${i + 1}`} flex={1}>
                <Input value={r} onChange={v => updateRule(i, v)} placeholder="e.g. No exploits or glitches" />
              </Field>
              {rules.length > 1 && (
                <button type="button" onClick={() => setRules(prev => prev.filter((_, j) => j !== i))}
                  style={{ ...removeBtnStyle, marginTop: 22 }}>x</button>
              )}
            </Row>
          ))}
          <AddBtn onClick={() => setRules(prev => [...prev, ''])} label="+ Add Rule" />
        </Section>

        {/* SUBMIT */}
        <div style={{ display: 'flex', gap: 12, marginTop: 32 }}>
          <button type="submit" disabled={saving} style={{
            padding: '13px 40px',
            background: 'var(--red)', color: '#fff', border: 'none',
            borderRadius: 6, cursor: saving ? 'not-allowed' : 'pointer',
            fontFamily: "'Barlow Condensed', sans-serif",
            fontWeight: 800, fontSize: 15,
            letterSpacing: '0.07em', textTransform: 'uppercase',
            opacity: saving ? 0.6 : 1, transition: 'opacity 0.15s',
          }}>
            {saving ? 'Creating...' : 'Create Tournament'}
          </button>
          <Link href="/tournaments" style={{
            padding: '13px 30px',
            background: 'var(--bg-3)', border: '1px solid var(--border)',
            borderRadius: 6, color: 'var(--text-muted)',
            fontFamily: "'Barlow Condensed', sans-serif",
            fontWeight: 700, fontSize: 15,
            letterSpacing: '0.06em', textTransform: 'uppercase',
            textDecoration: 'none', textAlign: 'center',
          }}>
            Cancel
          </Link>
        </div>
      </form>
    </div>
  )
}

/* Shared form components */

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{
      background: 'var(--bg-2)', border: '1px solid var(--border)',
      borderRadius: 10, padding: '20px 22px', marginBottom: 18,
    }}>
      <h2 style={{
        fontFamily: "'Barlow Condensed', sans-serif",
        fontWeight: 800, fontSize: 16, textTransform: 'uppercase',
        letterSpacing: '0.06em', color: '#fff',
        marginBottom: 16, paddingBottom: 10,
        borderBottom: '1px solid var(--border)',
      }}>{title}</h2>
      {children}
    </div>
  )
}

function Row({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', gap: 12, marginBottom: 12, alignItems: 'flex-start' }}>
      {children}
    </div>
  )
}

function Field({ label, children, required, flex }: {
  label: string; children: React.ReactNode; required?: boolean; flex?: number
}) {
  return (
    <div style={{ flex: flex ?? 1, minWidth: 0 }}>
      <label style={{
        display: 'block', marginBottom: 4,
        fontSize: 10, fontWeight: 700, textTransform: 'uppercase',
        letterSpacing: '0.08em', color: 'var(--text-dim)',
      }}>
        {label}{required && <span style={{ color: 'var(--red)' }}> *</span>}
      </label>
      {children}
    </div>
  )
}

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '8px 10px',
  background: 'var(--bg-3)', border: '1px solid var(--border)',
  borderRadius: 5, color: '#e0e0e8', fontSize: 13,
  fontFamily: "'Barlow', sans-serif",
  outline: 'none',
}

function Input({ value, onChange, placeholder, type }: {
  value: string; onChange: (v: string) => void; placeholder?: string; type?: string
}) {
  return (
    <input type={type || 'text'} value={value} placeholder={placeholder}
      onChange={e => onChange(e.target.value)} style={inputStyle} />
  )
}

function Select({ value, onChange, options }: {
  value: string; onChange: (v: string) => void; options: { value: string; label: string }[]
}) {
  return (
    <select value={value} onChange={e => onChange(e.target.value)}
      style={{ ...inputStyle, cursor: 'pointer' }}>
      {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  )
}

function AddBtn({ onClick, label }: { onClick: () => void; label: string }) {
  return (
    <button type="button" onClick={onClick} style={{
      padding: '6px 14px', marginTop: 2,
      background: 'transparent', border: '1px dashed var(--border)',
      borderRadius: 5, color: 'var(--text-muted)', fontSize: 12, fontWeight: 600,
      cursor: 'pointer', transition: 'all 0.15s',
    }}>{label}</button>
  )
}

const removeBtnStyle: React.CSSProperties = {
  padding: '4px 8px', background: 'transparent', border: '1px solid rgba(232,0,13,0.3)',
  borderRadius: 4, color: '#ff6b6b', fontSize: 12, cursor: 'pointer', flexShrink: 0,
}
