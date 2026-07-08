'use client'

import { useRef, useState } from 'react'
import { Icon } from '@iconify/react'
import { Solar } from '@/lib/solar-duotone'
import { safeUrl } from '@/lib/utils'

// ─── RICH CONTENT RENDERER ────────────────────────────────────────────────────
// Renders markdown-style formatted text: **bold**, *italic*, __underline__,
// `code`, [text](url), ![alt](url), color tags [color=#hex]text[/color]

export function RichContent({ text, style }: { text: string; style?: React.CSSProperties }) {
  const renderLine = (line: string, i: number) => {
    if (!line.trim()) return <div key={i} style={{ height: 8 }} />

    // Blockquote
    if (line.startsWith('> ')) {
      return (
        <div key={i} style={{ borderLeft: '3px solid rgba(178,45,45,0.6)', paddingLeft: 12, margin: '4px 0', color: '#9CA3AF', fontStyle: 'italic', fontSize: 13 }}>
          {line.slice(2)}
        </div>
      )
    }

    const isBullet = line.startsWith('•') || line.startsWith('- ')
    const lineText = isBullet ? line.replace(/^[•\-]\s*/, '') : line

    const parseInline = (t: string): React.ReactNode[] => {
      const nodes: React.ReactNode[] = []
      // Matches: [color=#hex]...[/color], **bold**, *italic*, __underline__, `code`, ![alt](url), [text](url), bare URLs
      const regex = /(\[color=(#[0-9a-fA-F]{3,6}|[a-z]+)\]([\s\S]*?)\[\/color\]|\*\*[^*]+\*\*|\*[^*]+\*|__[^_]+__|`[^`]+`|\!\[[^\]]*\]\([^)]+\)|\[[^\]]+\]\([^)]+\)|https?:\/\/[^\s<]+)/g
      let lastIndex = 0
      let match: RegExpExecArray | null

      while ((match = regex.exec(t)) !== null) {
        if (match.index > lastIndex) {
          nodes.push(<span key={lastIndex}>{t.slice(lastIndex, match.index)}</span>)
        }
        const m = match[0]
        if (m.startsWith('[color=')) {
          const color = match[2]
          const inner = match[3]
          nodes.push(<span key={match.index} style={{ color }}>{parseInline(inner)}</span>)
        } else if (m.startsWith('**') && m.endsWith('**')) {
          nodes.push(<strong key={match.index} style={{ color: '#fff', fontWeight: 700 }}>{m.slice(2, -2)}</strong>)
        } else if (m.startsWith('*') && m.endsWith('*')) {
          nodes.push(<em key={match.index} style={{ color: '#d0d0e0' }}>{m.slice(1, -1)}</em>)
        } else if (m.startsWith('__') && m.endsWith('__')) {
          nodes.push(<span key={match.index} style={{ textDecoration: 'underline' }}>{m.slice(2, -2)}</span>)
        } else if (m.startsWith('`') && m.endsWith('`')) {
          nodes.push(<code key={match.index} style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 3, padding: '1px 5px', fontSize: 12, fontFamily: 'monospace', color: '#f0c040' }}>{m.slice(1, -1)}</code>)
        } else if (m.startsWith('![')) {
          const altMatch = m.match(/!\[([^\]]*)\]\(([^)]+)\)/)
          if (altMatch) {
            nodes.push(<img key={match.index} src={altMatch[2]} alt={altMatch[1]} style={{ maxWidth: '100%', borderRadius: 8, marginTop: 8, marginBottom: 8, border: '1px solid rgba(255,255,255,0.1)' }} />)
          }
        } else if (m.startsWith('[')) {
          const linkMatch = m.match(/\[([^\]]+)\]\(([^)]+)\)/)
          if (linkMatch) {
            nodes.push(<a key={match.index} href={safeUrl(linkMatch[2])} target="_blank" rel="noopener noreferrer" style={{ color: '#B22D2D', textDecoration: 'underline', fontWeight: 600 }}>{linkMatch[1]}</a>)
          }
        } else if (m.startsWith('http')) {
          const ytMatch = m.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([\w-]+)/)
          if (ytMatch) {
            nodes.push(
              <div key={match.index} style={{ marginTop: 8, marginBottom: 8 }}>
                <iframe width="100%" height="220" src={`https://www.youtube.com/embed/${ytMatch[1]}`} frameBorder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen style={{ borderRadius: 8, border: '1px solid rgba(255,255,255,0.1)', maxWidth: 400 }} />
              </div>
            )
          } else {
            nodes.push(<a key={match.index} href={m} target="_blank" rel="noopener noreferrer" style={{ color: '#B22D2D', textDecoration: 'underline', wordBreak: 'break-all' }}>{m}</a>)
          }
        }
        lastIndex = match.index + m.length
      }
      if (lastIndex < t.length) nodes.push(<span key={lastIndex}>{t.slice(lastIndex)}</span>)
      return nodes.length ? nodes : [<span key="full">{t}</span>]
    }

    return (
      <div key={i} style={{ marginBottom: isBullet ? 2 : 0, paddingLeft: isBullet ? 12 : 0 }}>
        {parseInline(lineText)}
      </div>
    )
  }

  // Handle ``` code blocks first
  const blocks: React.ReactNode[] = []
  const codeBlockRegex = /```([\s\S]*?)```/g
  let lastIdx = 0
  let codeMatch: RegExpExecArray | null

  while ((codeMatch = codeBlockRegex.exec(text)) !== null) {
    const before = text.slice(lastIdx, codeMatch.index)
    before.split('\n').forEach((line, i) => blocks.push(renderLine(line, blocks.length + i)))
    blocks.push(
      <pre key={`code-${codeMatch.index}`} style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 6, padding: '10px 14px', margin: '6px 0', overflowX: 'auto', fontSize: 12, fontFamily: 'monospace', color: '#d0d0e0', lineHeight: 1.6 }}>
        {codeMatch[1].trim()}
      </pre>
    )
    lastIdx = codeMatch.index + codeMatch[0].length
  }
  text.slice(lastIdx).split('\n').forEach((line, i) => blocks.push(renderLine(line, blocks.length + i)))

  return (
    <div style={{ fontFamily: 'Roboto, sans-serif', fontSize: 13, color: '#E0E0E0', lineHeight: 1.7, ...style }}>
      {blocks}
    </div>
  )
}

// ─── TOOLBAR COLORS ──────────────────────────────────────────────────────────

const TOOLBAR_COLORS = [
  { hex: '#fff',    label: 'White'  },
  { hex: '#E74C3C', label: 'Red'    },
  { hex: '#F39C12', label: 'Orange' },
  { hex: '#F1C40F', label: 'Yellow' },
  { hex: '#2ECC71', label: 'Green'  },
  { hex: '#3B82F6', label: 'Blue'   },
  { hex: '#A855F7', label: 'Purple' },
  { hex: '#EC4899', label: 'Pink'   },
  { hex: '#9CA3AF', label: 'Gray'   },
]

// ─── RICH EDITOR TOOLBAR + TEXTAREA ──────────────────────────────────────────

interface RichEditorProps {
  value: string
  onChange: (val: string) => void
  onSubmit?: () => void
  placeholder?: string
  minHeight?: number
  disabled?: boolean
  /** Additional styles for the outer wrapper */
  wrapperStyle?: React.CSSProperties
  /** ID used for the textarea element */
  textareaId?: string
}

export function RichEditor({
  value,
  onChange,
  onSubmit,
  placeholder = 'Type your message... (Shift+Enter for new line)',
  minHeight = 90,
  disabled = false,
  wrapperStyle,
  textareaId,
}: RichEditorProps) {
  const taRef = useRef<HTMLTextAreaElement>(null)
  const [showColorPicker, setShowColorPicker] = useState(false)

  const insertWrap = (before: string, after: string, defaultText: string) => {
    const ta = taRef.current
    if (!ta) return
    const start = ta.selectionStart
    const end = ta.selectionEnd
    const selected = value.substring(start, end) || defaultText
    const newVal = value.substring(0, start) + before + selected + after + value.substring(end)
    onChange(newVal)
    // Restore cursor/selection after state update
    requestAnimationFrame(() => {
      ta.focus()
      ta.setSelectionRange(start + before.length, start + before.length + selected.length)
    })
  }

  const applyColor = (hex: string) => {
    setShowColorPicker(false)
    insertWrap(`[color=${hex}]`, '[/color]', 'colored text')
  }

  const toolbarBtnStyle: React.CSSProperties = {
    width: 26,
    height: 26,
    background: 'transparent',
    border: 'none',
    borderRadius: 4,
    color: 'var(--text-muted)',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'background 0.15s, color 0.15s',
    flexShrink: 0,
    position: 'relative',
  }

  const toolbarItems = [
    {
      id: 'bold',
      node: <span style={{ fontSize: 11, fontWeight: 800, fontFamily: 'Barlow, sans-serif' }}>B</span>,
      title: 'Bold (**text**)',
      action: () => insertWrap('**', '**', 'bold text'),
    },
    {
      id: 'italic',
      node: <span style={{ fontSize: 11, fontStyle: 'italic', fontFamily: 'Barlow, sans-serif' }}>I</span>,
      title: 'Italic (*text*)',
      action: () => insertWrap('*', '*', 'italic text'),
    },
    {
      id: 'underline',
      node: <span style={{ fontSize: 11, textDecoration: 'underline', fontFamily: 'Barlow, sans-serif' }}>U</span>,
      title: 'Underline (__text__)',
      action: () => insertWrap('__', '__', 'underlined text'),
    },
    { id: 'sep1', node: null, title: '', action: () => {} },
    {
      id: 'quote',
      node: <span style={{ fontSize: 13, fontFamily: 'Georgia, serif', lineHeight: 1 }}>"</span>,
      title: 'Blockquote',
      action: () => {
        const ta = taRef.current
        if (!ta) return
        const start = ta.selectionStart
        const end = ta.selectionEnd
        const selected = value.substring(start, end) || 'quoted text'
        const wrap = `\n> ${selected}\n`
        onChange(value.substring(0, start) + wrap + value.substring(end))
        requestAnimationFrame(() => {
          ta.focus()
          ta.setSelectionRange(start + 3, start + 3 + selected.length)
        })
      },
    },
    {
      id: 'link',
      node: <Icon icon={Solar.link} width={14} height={14} />,
      title: 'Insert Link',
      action: () => insertWrap('[', '](https://)', 'link text'),
    },
    {
      id: 'image',
      node: <Icon icon={Solar.gallery} width={14} height={14} />,
      title: 'Insert Image',
      action: () => insertWrap('![', '](https://image-url)', 'image'),
    },
    { id: 'sep2', node: null, title: '', action: () => {} },
  ]

  return (
    <div style={{ position: 'relative', ...wrapperStyle }}>
      {/* Toolbar — matches forum reply box style exactly */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 3,
        padding: '8px 10px',
        background: 'var(--bg-3)',
        border: '1px solid var(--border)',
        borderRadius: '6px 6px 0 0',
        borderBottom: 'none',
        flexWrap: 'wrap',
      }}>
        {toolbarItems.map((item) => {
          if (item.id.startsWith('sep')) {
            return <span key={item.id} style={{ width: 1, height: 18, background: 'var(--border)', margin: '0 3px', flexShrink: 0 }} />
          }
          return (
            <button
              key={item.id}
              type="button"
              title={item.title}
              disabled={disabled}
              onClick={item.action}
              style={toolbarBtnStyle}
              onMouseEnter={e => {
                const b = e.currentTarget as HTMLButtonElement
                b.style.background = 'var(--bg-4)'
                b.style.color = '#fff'
              }}
              onMouseLeave={e => {
                const b = e.currentTarget as HTMLButtonElement
                b.style.background = 'transparent'
                b.style.color = 'var(--text-muted)'
              }}
            >
              {item.node}
            </button>
          )
        })}

        {/* Color picker button */}
        <div style={{ position: 'relative' }}>
          <button
            type="button"
            title="Text Color"
            disabled={disabled}
            onClick={() => setShowColorPicker(p => !p)}
            style={{
              ...toolbarBtnStyle,
              gap: 2,
              flexDirection: 'column',
              background: showColorPicker ? 'var(--bg-4)' : 'transparent',
              color: showColorPicker ? '#fff' : 'var(--text-muted)',
            }}
            onMouseEnter={e => {
              const b = e.currentTarget as HTMLButtonElement
              if (!showColorPicker) { b.style.background = 'var(--bg-4)'; b.style.color = '#fff' }
            }}
            onMouseLeave={e => {
              const b = e.currentTarget as HTMLButtonElement
              if (!showColorPicker) { b.style.background = 'transparent'; b.style.color = 'var(--text-muted)' }
            }}
          >
            <span style={{ fontSize: 11, fontWeight: 700, fontFamily: 'Barlow, sans-serif', lineHeight: 1 }}>A</span>
            <span style={{ width: 14, height: 3, background: 'linear-gradient(90deg, #E74C3C, #F39C12, #2ECC71, #3B82F6, #A855F7)', borderRadius: 2 }} />
          </button>

          {showColorPicker && (
            <div style={{
              position: 'absolute',
              top: '100%',
              left: 0,
              marginTop: 4,
              background: 'var(--bg-2)',
              border: '1px solid var(--border)',
              borderRadius: 10,
              padding: '10px 12px',
              zIndex: 200,
              boxShadow: '0 8px 30px rgba(0,0,0,0.6)',
              minWidth: 160,
            }}>
              <div style={{ fontSize: 9, fontWeight: 700, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 }}>Text Color</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 6 }}>
                {TOOLBAR_COLORS.map(c => (
                  <button
                    key={c.hex}
                    type="button"
                    title={c.label}
                    onClick={() => applyColor(c.hex)}
                    style={{
                      width: 22,
                      height: 22,
                      borderRadius: '50%',
                      background: c.hex,
                      border: '2px solid rgba(255,255,255,0.15)',
                      cursor: 'pointer',
                      transition: 'transform 0.1s, border-color 0.1s',
                    }}
                    onMouseEnter={e => {
                      (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1.2)'
                      ;(e.currentTarget as HTMLButtonElement).style.borderColor = '#fff'
                    }}
                    onMouseLeave={e => {
                      (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1)'
                      ;(e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(255,255,255,0.15)'
                    }}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Textarea — matches forum reply textarea style */}
      <textarea
        ref={taRef}
        id={textareaId}
        value={value}
        onChange={e => onChange(e.target.value)}
        onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey && onSubmit) { e.preventDefault(); onSubmit() } }}
        placeholder={disabled ? 'Waiting for an agent to connect...' : placeholder}
        disabled={disabled}
        style={{
          width: '100%',
          background: 'var(--bg-3)',
          border: '1px solid var(--border)',
          borderRadius: '0 0 6px 6px',
          padding: '12px 14px',
          fontFamily: 'Barlow, sans-serif',
          fontSize: 13,
          color: '#fff',
          outline: 'none',
          resize: 'none',
          minHeight,
          lineHeight: 1.7,
          boxSizing: 'border-box',
          opacity: disabled ? 0.5 : 1,
        }}
        onFocus={e => (e.target.style.borderColor = 'rgba(232,0,13,0.4)')}
        onBlur={e => (e.target.style.borderColor = 'var(--border)')}
        onClick={() => setShowColorPicker(false)}
      />
    </div>
  )
}
