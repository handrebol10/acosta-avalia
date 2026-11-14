import { TrendingDown, TrendingUp } from 'lucide-react'
import { fmt, fmtDate } from '../lib/calc'

export interface Point {
  date: string
  value: number
}

const shortDate = (iso: string) => `${fmtDate(iso).slice(0, 5)}/${iso.slice(2, 4)}`

/** Gráfico de linha minimalista em SVG, com resumo em texto (acessível) */
export function LineChart({
  points,
  unit = '',
  label = 'Indicador',
  goodWhen = 'neutral',
  height = 220,
}: {
  points: Point[]
  unit?: string
  label?: string
  goodWhen?: 'up' | 'down' | 'neutral'
  height?: number
}) {
  if (points.length === 0) {
    return (
      <div className="empty" style={{ padding: '32px 16px' }}>
        <p className="small">Ainda não há dados de {label.toLowerCase()}. Preencha esse campo numa avaliação para ver a evolução aqui.</p>
      </div>
    )
  }

  const first = points[0]
  const last = points[points.length - 1]
  const diff = last.value - first.value
  const good = goodWhen === 'neutral' || Math.abs(diff) < 0.05 ? null : (diff > 0) === (goodWhen === 'up')
  const summary =
    points.length > 1
      ? `${label}: de ${fmt(first.value, 1)}${unit} em ${fmtDate(first.date)} para ${fmt(last.value, 1)}${unit} em ${fmtDate(last.date)} (${diff >= 0 ? '+' : '−'}${fmt(Math.abs(diff), 1)}${unit}).`
      : `${label}: ${fmt(last.value, 1)}${unit} em ${fmtDate(last.date)}.`

  const W = 640
  const H = height
  const pad = { l: 44, r: 24, t: 26, b: 30 }
  const vals = points.map((p) => p.value)
  let lo = Math.min(...vals)
  let hi = Math.max(...vals)
  const span = hi - lo || Math.max(Math.abs(hi) * 0.1, 1)
  lo -= span * 0.25
  hi += span * 0.25
  const x = (i: number) => (points.length === 1 ? (pad.l + W - pad.r) / 2 : pad.l + (i / (points.length - 1)) * (W - pad.l - pad.r))
  const y = (v: number) => pad.t + (1 - (v - lo) / (hi - lo)) * (H - pad.t - pad.b)
  const line = points.map((p, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)},${y(p.value).toFixed(1)}`).join(' ')
  const area = `${line} L${x(points.length - 1)},${H - pad.b} L${x(0)},${H - pad.b} Z`
  const ticks = [0, 0.5, 1].map((t) => lo + t * (hi - lo))
  // Com muitos pontos, rotula só alguns para não amontoar
  const every = Math.ceil(points.length / 8)
  const showLabel = (i: number) => i === points.length - 1 || i === 0 || i % every === 0

  return (
    <figure style={{ margin: 0 }}>
      <figcaption className="chart-summary">
        <span className="big">
          {fmt(last.value, 1)}
          <small className="muted" style={{ fontSize: '0.9rem', marginLeft: 3 }}>
            {unit.trim()}
          </small>
        </span>
        {points.length > 1 && (
          <span className={`badge ${good === null ? 't-neutral' : good ? 't-good' : 't-bad'}`} style={{ gap: 4 }}>
            {diff >= 0 ? <TrendingUp size={14} aria-hidden="true" /> : <TrendingDown size={14} aria-hidden="true" />}
            {diff >= 0 ? '+' : '−'}
            {fmt(Math.abs(diff), 1)}
            {unit} desde {shortDate(first.date)}
          </span>
        )}
        <span className="sr-only">{summary}</span>
      </figcaption>
      <svg className="chart" viewBox={`0 0 ${W} ${H}`} width="100%" role="img" aria-label={summary}>
        <defs>
          <linearGradient id="area" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="var(--accent)" stopOpacity="0.2" />
            <stop offset="1" stopColor="var(--accent)" stopOpacity="0" />
          </linearGradient>
        </defs>
        {ticks.map((t) => (
          <g key={t}>
            <line x1={pad.l} x2={W - pad.r} y1={y(t)} y2={y(t)} stroke="var(--line-soft)" />
            <text x={pad.l - 8} y={y(t) + 4} textAnchor="end">
              {fmt(t, 1)}
            </text>
          </g>
        ))}
        {points.length > 1 && <path d={area} fill="url(#area)" />}
        {points.length > 1 && <path d={line} fill="none" stroke="var(--accent)" strokeWidth={2.5} strokeLinejoin="round" strokeLinecap="round" />}
        {points.map((p, i) => (
          <g key={p.date + i}>
            <title>{`${fmtDate(p.date)}: ${fmt(p.value, 1)}${unit}`}</title>
            <circle cx={x(i)} cy={y(p.value)} r={14} fill="transparent" />
            <circle cx={x(i)} cy={y(p.value)} r={5} fill="var(--surface)" stroke="var(--accent)" strokeWidth={2.5} />
            {showLabel(i) && (
              <>
                <text x={x(i)} y={y(p.value) - 12} textAnchor="middle" style={{ fill: 'var(--ink)', fontWeight: 650 }}>
                  {fmt(p.value, 1)}
                </text>
                <text x={x(i)} y={H - 8} textAnchor="middle">
                  {shortDate(p.date)}
                </text>
              </>
            )}
          </g>
        ))}
      </svg>
    </figure>
  )
}
