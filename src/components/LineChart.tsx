import { fmt, fmtDate } from '../lib/calc'

export interface Point {
  date: string
  value: number
}

/** Gráfico de linha minimalista em SVG */
export function LineChart({ points, unit = '', height = 220 }: { points: Point[]; unit?: string; height?: number }) {
  if (points.length === 0) {
    return <p className="muted small" style={{ padding: '40px 0', textAlign: 'center' }}>Sem dados para este indicador ainda.</p>
  }
  const W = 640
  const H = height
  const pad = { l: 44, r: 20, t: 24, b: 30 }
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

  return (
    <svg className="chart" viewBox={`0 0 ${W} ${H}`} width="100%" role="img" aria-label="Gráfico de evolução">
      <defs>
        <linearGradient id="area" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="var(--accent)" stopOpacity="0.22" />
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
          <circle cx={x(i)} cy={y(p.value)} r={5} fill="var(--surface)" stroke="var(--accent)" strokeWidth={2.5} />
          <text x={x(i)} y={y(p.value) - 12} textAnchor="middle" style={{ fill: 'var(--ink)', fontWeight: 650 }}>
            {fmt(p.value, 1)}
            {unit}
          </text>
          <text x={x(i)} y={H - 8} textAnchor="middle">
            {fmtDate(p.date).slice(0, 5) + '/' + p.date.slice(2, 4)}
          </text>
        </g>
      ))}
    </svg>
  )
}
