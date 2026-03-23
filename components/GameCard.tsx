import React, { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'

type Game = {
  _id?: string
  slug: string
  name: string
  bannerUrl?: string
  genre?: string
  activeLadders?: number
  platformType?: 'pc' | 'console' | 'crossplay'
  crossplay?: boolean
  platforms?: string[]
}

export function platformColor(game: Game) {
  if (game.platformType === 'pc') return '#60A5FA'
  if (game.platformType === 'console') return '#4ADE80'
  if (game.platformType === 'crossplay' || game.crossplay) return '#F0AA1A'
  const platforms = game.platforms || []
  if (platforms.length === 1 && platforms[0] === 'PC') return '#60A5FA'
  if (!platforms.includes('PC')) return '#4ADE80'
  return '#F0AA1A'
}

export function platformLabel(game: Game) {
  if (game.platformType === 'pc') return 'PC Only'
  if (game.platformType === 'console') return 'Console Only'
  if (game.platformType === 'crossplay' || game.crossplay) return 'Cross-Play'
  const p = (game.platforms || []).map((s: string) => s.toLowerCase())
  const hasPC = p.includes('pc')
  const hasConsole = p.some((s: string) => ['ps5', 'ps4', 'playstation', 'xbox', 'ps'].includes(s))
  if (hasPC && hasConsole) return 'Cross-Play'
  if (hasConsole && !hasPC) return 'Console Only'
  if (hasPC && !hasConsole) return 'PC Only'
  return (game.platforms || []).join(' / ')
}

export function GameCard({ game }: { game: Game }) {
  const [hovered, setHovered] = useState(false)
  const pc = platformColor(game)
  const plLabel = platformLabel(game)

  return (
    <Link href={`/games/${game.slug}`} style={{ textDecoration: 'none', display: 'block' }}>
      <div
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        style={{
          position: 'relative',
          borderRadius: 10,
          overflow: 'hidden',
          aspectRatio: '3/4',
          background: '#0d0d12',
          border: `1px solid ${hovered ? pc + '55' : 'var(--border)'}`,
          transition: 'all 0.22s',
          transform: hovered ? 'translateY(-4px)' : 'translateY(0)',
          boxShadow: hovered ? `0 16px 40px rgba(0,0,0,0.55)` : 'none',
          cursor: 'pointer',
        }}
      >
        {game.bannerUrl && (
          <Image
            src={game.bannerUrl}
            alt={game.name}
            width={500}
            height={500}
            quality={100}
            style={{
              position: 'absolute',
              inset: 0,
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              transition: 'transform 0.3s, opacity 0.3s',
              transform: hovered ? 'scale(1.06)' : 'scale(1)',
              opacity: hovered ? 0.45 : 0.65,
            }}
            onError={e => {
              ;(e.target as HTMLImageElement).style.display = 'none'
            }}
          />
        )}

        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: hovered
              ? 'linear-gradient(to bottom, rgba(0,0,0,0.3) 0%, rgba(0,0,0,0.85) 100%)'
              : 'linear-gradient(to bottom, transparent 35%, rgba(6,6,10,0.92) 100%)',
            transition: 'background 0.22s',
          }}
        />

        <div
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            padding: '14px 14px 14px',
            opacity: hovered ? 0 : 1,
            transition: 'opacity 0.18s',
            pointerEvents: 'none',
          }}
        >
          <div
            style={{
              fontFamily: "'Barlow Condensed', sans-serif",
              fontWeight: 900,
              fontSize: 17,
              textTransform: 'uppercase',
              color: '#fff',
              letterSpacing: '0.03em',
              marginBottom: 6,
              lineHeight: 1.1,
            }}
          >
            {game.name}
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <MetaPill>{game.activeLadders ?? 6} Ladders</MetaPill>
            {game.genre && <MetaPill accent>{game.genre}</MetaPill>}
          </div>
        </div>

        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px 16px',
            opacity: hovered ? 1 : 0,
            transition: 'opacity 0.2s',
            pointerEvents: 'none',
            textAlign: 'center',
          }}
        >
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              background: pc + '20',
              border: `1px solid ${pc}55`,
              borderRadius: 20,
              padding: '5px 14px',
              marginBottom: 14,
            }}
          >
            <span
              style={{
                width: 6,
                height: 6,
                borderRadius: '50%',
                background: pc,
                boxShadow: `0 0 6px ${pc}`,
                flexShrink: 0,
              }}
            />
            <span
              style={{
                fontFamily: "'Rajdhani', sans-serif",
                fontWeight: 700,
                fontSize: 11,
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                color: pc,
              }}
            >
              {plLabel}
            </span>
          </div>

          <div
            style={{
              fontFamily: "'Barlow Condensed', sans-serif",
              fontWeight: 900,
              fontSize: 22,
              textTransform: 'uppercase',
              color: '#fff',
              letterSpacing: '0.03em',
              marginBottom: 12,
              lineHeight: 1.1,
            }}
          >
            {game.name}
          </div>

          <div
            style={{
              display: 'flex',
              gap: 16,
              justifyContent: 'center',
              marginBottom: 18,
            }}
          >
            <div style={{ textAlign: 'center' }}>
              <div
                style={{
                  fontFamily: "'Barlow Condensed', sans-serif",
                  fontWeight: 900,
                  fontSize: 20,
                  color: '#fff',
                  lineHeight: 1,
                }}
              >
                {game.activeLadders ?? 6}
              </div>
              <div
                style={{
                  fontSize: 9,
                  color: 'rgba(255,255,255,0.5)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                  marginTop: 2,
                }}
              >
                Ladders
              </div>
            </div>
            <div style={{ width: 1, background: 'rgba(255,255,255,0.12)' }} />
            {game.genre && (
              <div style={{ textAlign: 'center' }}>
                <div
                  style={{
                    fontFamily: "'Barlow Condensed', sans-serif",
                    fontWeight: 900,
                    fontSize: 20,
                    color: pc,
                    lineHeight: 1,
                  }}
                >
                  {game.genre}
                </div>
                <div
                  style={{
                    fontSize: 9,
                    color: 'rgba(255,255,255,0.5)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.08em',
                    marginTop: 2,
                  }}
                >
                  Genre
                </div>
              </div>
            )}
          </div>

          <div
            style={{
              padding: '8px 22px',
              background: 'var(--red)',
              color: '#fff',
              fontFamily: "'Barlow Condensed', sans-serif",
              fontWeight: 800,
              fontSize: 12,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              borderRadius: 6,
            }}
          >
            View Game →
          </div>
        </div>
      </div>
    </Link>
  )
}

function MetaPill({ children, accent }: { children: React.ReactNode; accent?: boolean }) {
  return (
    <span
      style={{
        fontFamily: "'Rajdhani', sans-serif",
        fontWeight: 700,
        fontSize: 10,
        letterSpacing: '0.07em',
        textTransform: 'uppercase',
        color: accent ? 'var(--red)' : 'rgba(255,255,255,0.55)',
        background: accent ? 'rgba(232,0,13,0.12)' : 'rgba(255,255,255,0.07)',
        border: `1px solid ${accent ? 'rgba(232,0,13,0.25)' : 'rgba(255,255,255,0.1)'}`,
        borderRadius: 3,
        padding: '2px 7px',
        whiteSpace: 'nowrap',
      }}
    >
      {children}
    </span>
  )
}

