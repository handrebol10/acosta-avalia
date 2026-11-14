import { useEffect, useState, type ReactNode } from 'react'
import { Info, Lightbulb, X } from 'lucide-react'
import type { Classification, Sex } from '../lib/types'
import { FAT_ZONES, fmt } from '../lib/calc'

export function Tip({ text }: { text: string }) {
  return (
    <span className="tip" tabIndex={0} aria-label={text}>
      <Info size={14} />
      <span className="bubble" role="tooltip">
        {text}
      </span>
    </span>
  )
}

export function Field({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <label className="field">
      <span className="lbl">
        {label}
        {hint && <Tip text={hint} />}
      </span>
      {children}
    </label>
  )
}

/** Campo numérico que aceita vírgula ou ponto e devolve number | undefined */
export function NumInput({
  value,
  onChange,
  unit,
  step = 'any',
  placeholder,
}: {
  value: number | undefined
  onChange: (v: number | undefined) => void
  unit?: string
  step?: string
  placeholder?: string
}) {
  const [text, setText] = useState(value === undefined ? '' : String(value).replace('.', ','))
  useEffect(() => {
    const parsed = parseNum(text)
    if (parsed !== value) setText(value === undefined ? '' : String(value).replace('.', ','))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value])
  const input = (
    <input
      className="input tnum"
      inputMode="decimal"
      value={text}
      step={step}
      placeholder={placeholder ?? '0'}
      onChange={(e) => {
        const t = e.target.value.replace(/[^\d,.-]/g, '')
        setText(t)
        onChange(parseNum(t))
      }}
    />
  )
  if (!unit) return input
  return (
    <div className="unit-wrap">
      {input}
      <span className="unit">{unit}</span>
    </div>
  )
}

function parseNum(t: string): number | undefined {
  if (t.trim() === '') return undefined
  const n = Number(t.replace(',', '.'))
  return Number.isFinite(n) ? n : undefined
}

export function Badge({ c }: { c?: Classification | null }) {
  if (!c) return null
  return <span className={`badge t-${c.tone}`}>{c.label}</span>
}

export function Seg<T extends string>({
  value,
  options,
  onChange,
}: {
  value: T
  options: { v: T; label: string }[]
  onChange: (v: T) => void
}) {
  return (
    <div className="seg" role="radiogroup">
      {options.map((o) => (
        <button key={o.v} type="button" role="radio" aria-checked={value === o.v} className={value === o.v ? 'on' : ''} onClick={() => onChange(o.v)}>
          {o.label}
        </button>
      ))}
    </div>
  )
}

export function Explain({ children, tone = 'gold' }: { children: ReactNode; tone?: 'gold' | 'bad' }) {
  return (
    <div className={`explain ${tone === 'bad' ? 'callout-bad' : ''}`}>
      <Lightbulb size={18} />
      <div>{children}</div>
    </div>
  )
}

export function Metric({
  label,
  value,
  unit,
  hint,
  c,
  delta,
}: {
  label: string
  value: string
  unit?: string
  hint?: string
  c?: Classification | null
  delta?: ReactNode
}) {
  return (
    <div className="metric">
      <span className="k">
        {label}
        {hint && <Tip text={hint} />}
      </span>
      <span className="v">
        {value}
        {unit && value !== '—' && <small>{unit}</small>}
      </span>
      <div className="row wrap" style={{ gap: 8 }}>
        {c && <Badge c={c} />}
        {delta}
      </div>
    </div>
  )
}

/** Variação em relação à avaliação anterior. `goodWhen` define se subir é bom. */
export function Delta({ now, before, unit = '', goodWhen = 'neutral', digits = 1 }: {
  now?: number
  before?: number
  unit?: string
  goodWhen?: 'up' | 'down' | 'neutral'
  digits?: number
}) {
  if (now === undefined || before === undefined) return null
  const d = now - before
  if (Math.abs(d) < 10 ** -digits / 2) return <span className="delta flat">= sem variação</span>
  const good = goodWhen === 'neutral' ? null : (d > 0) === (goodWhen === 'up')
  const cls = good === null ? 'flat' : good ? 'up' : 'down'
  return (
    <span className={`delta ${cls}`}>
      {d > 0 ? '▲' : '▼'} {fmt(Math.abs(d), digits)} {unit}
    </span>
  )
}

export function FatZones({ pct, sex }: { pct: number; sex: Sex }) {
  const zones = FAT_ZONES[sex]
  const min = sex === 'M' ? 2 : 10
  const max = sex === 'M' ? 35 : 45
  const pos = Math.min(Math.max(((pct - min) / (max - min)) * 100, 0), 100)
  let prev = min
  const colors: Record<string, string> = { good: 'var(--good)', ok: 'var(--ok)', warn: 'var(--gold)', bad: 'var(--bad)' }
  return (
    <div>
      <div className="zones-wrap">
        <div className="zones-marker" style={{ left: `${pos}%` }}>
          {fmt(pct, 1)}%
        </div>
        <div className="zones">
          {zones.map((z) => {
            const top = Math.min(z.max, max)
            const w = ((top - prev) / (max - min)) * 100
            prev = top
            return <div key={z.label} style={{ width: `${w}%`, background: colors[z.tone], opacity: 0.85 }} />
          })}
        </div>
      </div>
      <div className="zones-labels">
        {(() => {
          let p = min
          return zones.map((z) => {
            const top = Math.min(z.max, max)
            const w = ((top - p) / (max - min)) * 100
            p = top
            return (
              <span key={z.label} style={{ width: `${w}%`, textAlign: 'center' }}>
                {z.label}
              </span>
            )
          })
        })()}
      </div>
    </div>
  )
}

export function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: ReactNode }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])
  return (
    <div className="backdrop" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal" role="dialog" aria-modal="true" aria-label={title}>
        <div className="card-head">
          <h2>{title}</h2>
          <button className="btn icon ghost" onClick={onClose} aria-label="Fechar">
            <X size={18} />
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}

export function initials(name: string) {
  const p = name.trim().split(/\s+/)
  return ((p[0]?.[0] ?? '') + (p.length > 1 ? p[p.length - 1][0] : '')).toUpperCase()
}
