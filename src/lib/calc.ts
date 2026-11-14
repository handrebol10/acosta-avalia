import { ACTIVITY_LEVELS, FMS, PROTOCOLS } from './catalog'
import type { Assessment, Classification, Sex, Student } from './types'

const isNum = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v)

export function ageAt(birthDate: string, at: string = new Date().toISOString().slice(0, 10)): number {
  if (!birthDate) return 0
  const b = new Date(birthDate + 'T00:00:00')
  const d = new Date(at + 'T00:00:00')
  let age = d.getFullYear() - b.getFullYear()
  const m = d.getMonth() - b.getMonth()
  if (m < 0 || (m === 0 && d.getDate() < b.getDate())) age--
  return Math.max(age, 0)
}

/* ───────── Composição corporal ───────── */

const DURNIN: Record<Sex, [number, number, number][]> = {
  // [idade mínima, c, m]  →  D = c − m · log10(Σ)
  M: [
    [0, 1.162, 0.063],
    [20, 1.1631, 0.0632],
    [30, 1.1422, 0.0544],
    [40, 1.162, 0.07],
    [50, 1.1715, 0.0779],
  ],
  F: [
    [0, 1.1549, 0.0678],
    [20, 1.1599, 0.0717],
    [30, 1.1423, 0.0632],
    [40, 1.1333, 0.0612],
    [50, 1.1339, 0.0645],
  ],
}

export interface BodyComp {
  fatPct: number
  density?: number
  sum?: number
  methodLabel: string
}

export function bodyComposition(a: Assessment, s: Student): BodyComp | null {
  const age = ageAt(s.birthDate, a.date)
  const { body, anthro } = a

  if (body.method === 'bio') {
    return isNum(body.bioFat) ? { fatPct: body.bioFat, methodLabel: 'Bioimpedância' } : null
  }

  if (body.method === 'navy') {
    const h = anthro.height
    const neck = anthro.circ.pescoco
    if (!isNum(h) || !isNum(neck)) return null
    const inch = (cm: number) => cm / 2.54
    let pct: number
    if (s.sex === 'M') {
      const abd = anthro.circ.abdomen
      if (!isNum(abd) || abd <= neck) return null
      pct = 86.01 * Math.log10(inch(abd - neck)) - 70.041 * Math.log10(inch(h)) + 36.76
    } else {
      const waist = anthro.circ.cintura
      const hip = anthro.circ.quadril
      if (!isNum(waist) || !isNum(hip) || waist + hip <= neck) return null
      pct = 163.205 * Math.log10(inch(waist + hip - neck)) - 97.684 * Math.log10(inch(h)) - 78.387
    }
    return { fatPct: clampPct(pct), methodLabel: 'Circunferências (US Navy)' }
  }

  // Dobras cutâneas
  const proto = PROTOCOLS[body.protocol]
  const keys = proto.folds(s.sex)
  const vals = keys.map((k) => body.folds[k])
  if (!vals.every(isNum)) return null
  const sum = (vals as number[]).reduce((t, v) => t + v, 0)
  if (sum <= 0) return null

  if (body.protocol === 'faulkner') {
    return { fatPct: clampPct(0.153 * sum + 5.783), sum, methodLabel: proto.label }
  }

  let d: number
  switch (body.protocol) {
    case 'jp3':
      d =
        s.sex === 'M'
          ? 1.10938 - 0.0008267 * sum + 0.0000016 * sum ** 2 - 0.0002574 * age
          : 1.0994921 - 0.0009929 * sum + 0.0000023 * sum ** 2 - 0.0001392 * age
      break
    case 'jp7':
      d =
        s.sex === 'M'
          ? 1.112 - 0.00043499 * sum + 0.00000055 * sum ** 2 - 0.00028826 * age
          : 1.097 - 0.00046971 * sum + 0.00000056 * sum ** 2 - 0.00012828 * age
      break
    case 'guedes':
      d = s.sex === 'M' ? 1.17136 - 0.06706 * Math.log10(sum) : 1.1665 - 0.07063 * Math.log10(sum)
      break
    case 'durnin': {
      const row = [...DURNIN[s.sex]].reverse().find((r) => age >= r[0])!
      d = row[1] - row[2] * Math.log10(sum)
      break
    }
  }
  const pct = body.equation === 'brozek' ? 457 / d - 414.2 : 495 / d - 450
  return { fatPct: clampPct(pct), density: d, sum, methodLabel: `${proto.label} · ${body.equation === 'brozek' ? 'Brozek' : 'Siri'}` }
}

const clampPct = (p: number) => Math.min(Math.max(p, 2), 70)

/* ───────── Métricas derivadas ───────── */

export interface Results {
  age: number
  bmi?: number
  whr?: number
  whtr?: number
  comp: BodyComp | null
  fatMass?: number
  leanMass?: number
  targetWeight?: number
  targetFat: number
  bmrMifflin?: number
  bmrKatch?: number
  tdee?: number
  vo2?: number
  fmsTotal?: number
  fmsComplete: boolean
  parqAlert: boolean
}

export function computeResults(a: Assessment, s: Student): Results {
  const age = ageAt(s.birthDate, a.date)
  const { weight, height, circ } = a.anthro
  const hm = isNum(height) ? height / 100 : undefined
  const bmi = isNum(weight) && hm ? weight / (hm * hm) : undefined
  const whr = isNum(circ.cintura) && isNum(circ.quadril) ? circ.cintura / circ.quadril : undefined
  const whtr = isNum(circ.cintura) && isNum(height) ? circ.cintura / height : undefined

  const comp = bodyComposition(a, s)
  const fatMass = comp && isNum(weight) ? (weight * comp.fatPct) / 100 : undefined
  const leanMass = isNum(fatMass) && isNum(weight) ? weight - fatMass : undefined
  const targetFat = s.sex === 'M' ? 15 : 23
  const targetWeight = isNum(leanMass) ? leanMass / (1 - targetFat / 100) : undefined

  const bmrMifflin =
    isNum(weight) && isNum(height) && age > 0
      ? 10 * weight + 6.25 * height - 5 * age + (s.sex === 'M' ? 5 : -161)
      : undefined
  const bmrKatch = isNum(leanMass) ? 370 + 21.6 * leanMass : undefined
  const factor = ACTIVITY_LEVELS.find((l) => l.v === a.anamnese.activityLevel)?.factor
  const baseBmr = bmrKatch ?? bmrMifflin
  const tdee = baseBmr && factor ? baseBmr * factor : undefined

  const scores = FMS.map((t) => a.fms[t.key])
  const fmsComplete = scores.every(isNum)
  const fmsTotal = scores.some(isNum) ? scores.reduce<number>((t, v) => t + (v ?? 0), 0) : undefined

  return {
    age,
    bmi,
    whr,
    whtr,
    comp,
    fatMass,
    leanMass,
    targetWeight,
    targetFat,
    bmrMifflin,
    bmrKatch,
    tdee,
    vo2: vo2max(a, s),
    fmsTotal,
    fmsComplete,
    parqAlert: a.anamnese.parq.some((v) => v === true),
  }
}

export function vo2max(a: Assessment, s: Student): number | undefined {
  const f = a.fitness
  const age = ageAt(s.birthDate, a.date)
  switch (f.vo2Test) {
    case 'cooper':
      return isNum(f.cooperDistance) ? Math.max((f.cooperDistance - 504.9) / 44.73, 0) : undefined
    case 'rockport': {
      const w = a.anthro.weight
      if (!isNum(f.rockportTime) || !isNum(f.rockportHr) || !isNum(w)) return undefined
      return (
        132.853 - 0.0769 * (w * 2.20462) - 0.3877 * age + 6.315 * (s.sex === 'M' ? 1 : 0) - 3.2649 * f.rockportTime - 0.1565 * f.rockportHr
      )
    }
    case 'step':
      if (!isNum(f.stepHr)) return undefined
      return s.sex === 'M' ? 111.33 - 0.42 * f.stepHr : 65.81 - 0.1847 * f.stepHr
    case 'direct':
      return f.vo2Direct
    default:
      return undefined
  }
}

/* ───────── Classificações ───────── */

export function classifyBmi(bmi: number): Classification {
  if (bmi < 18.5) return { label: 'Abaixo do peso', tone: 'warn' }
  if (bmi < 25) return { label: 'Peso adequado', tone: 'good' }
  if (bmi < 30) return { label: 'Sobrepeso', tone: 'warn' }
  if (bmi < 35) return { label: 'Obesidade grau I', tone: 'bad' }
  if (bmi < 40) return { label: 'Obesidade grau II', tone: 'bad' }
  return { label: 'Obesidade grau III', tone: 'bad' }
}

/** Faixas do American Council on Exercise (ACE) */
export const FAT_ZONES: Record<Sex, { max: number; label: string; tone: Classification['tone'] }[]> = {
  M: [
    { max: 6, label: 'Essencial', tone: 'warn' },
    { max: 14, label: 'Atleta', tone: 'good' },
    { max: 18, label: 'Em forma', tone: 'good' },
    { max: 25, label: 'Média', tone: 'ok' },
    { max: 100, label: 'Acima do ideal', tone: 'bad' },
  ],
  F: [
    { max: 14, label: 'Essencial', tone: 'warn' },
    { max: 21, label: 'Atleta', tone: 'good' },
    { max: 25, label: 'Em forma', tone: 'good' },
    { max: 32, label: 'Média', tone: 'ok' },
    { max: 100, label: 'Acima do ideal', tone: 'bad' },
  ],
}

export function classifyFat(pct: number, sex: Sex): Classification {
  const z = FAT_ZONES[sex].find((z) => pct < z.max)!
  return { label: z.label, tone: z.tone }
}

export function classifyWaist(cm: number, sex: Sex): Classification {
  const [a, b] = sex === 'M' ? [94, 102] : [80, 88]
  if (cm >= b) return { label: 'Risco muito aumentado', tone: 'bad' }
  if (cm >= a) return { label: 'Risco aumentado', tone: 'warn' }
  return { label: 'Sem risco aumentado', tone: 'good' }
}

export function classifyWhr(v: number, sex: Sex): Classification {
  const lim = sex === 'M' ? 0.9 : 0.85
  return v >= lim ? { label: 'Risco aumentado', tone: 'bad' } : { label: 'Adequada', tone: 'good' }
}

export function classifyWhtr(v: number): Classification {
  if (v >= 0.6) return { label: 'Risco alto', tone: 'bad' }
  if (v >= 0.5) return { label: 'Risco aumentado', tone: 'warn' }
  return { label: 'Adequada', tone: 'good' }
}

/** Diretriz Brasileira de Hipertensão (2020) */
export function classifyBp(sys: number, dia: number): Classification {
  const level = (s: number, d: number) => {
    if (s >= 180 || d >= 110) return 5
    if (s >= 160 || d >= 100) return 4
    if (s >= 140 || d >= 90) return 3
    if (s >= 130 || d >= 85) return 2
    if (s >= 120 || d >= 80) return 1
    return 0
  }
  const labels: Classification[] = [
    { label: 'Ótima', tone: 'good' },
    { label: 'Normal', tone: 'good' },
    { label: 'Pré-hipertensão', tone: 'warn' },
    { label: 'Hipertensão estágio 1', tone: 'bad' },
    { label: 'Hipertensão estágio 2', tone: 'bad' },
    { label: 'Hipertensão estágio 3', tone: 'bad' },
  ]
  return labels[level(sys, dia)]
}

export function classifyHr(hr: number): Classification {
  if (hr < 60) return { label: 'Baixa (comum em treinados)', tone: 'good' }
  if (hr <= 80) return { label: 'Normal', tone: 'good' }
  if (hr <= 100) return { label: 'Normal alta', tone: 'ok' }
  return { label: 'Elevada', tone: 'bad' }
}

type Band = [number, number[]] // [idade mínima, limites crescentes]

function pickBand(bands: Band[], age: number) {
  return [...bands].reverse().find((b) => age >= b[0]) ?? bands[0]
}

function rank(value: number, limits: number[], labels: Classification[]) {
  let i = 0
  while (i < limits.length && value >= limits[i]) i++
  return labels[i]
}

const SIX: Classification[] = [
  { label: 'Muito fraca', tone: 'bad' },
  { label: 'Fraca', tone: 'bad' },
  { label: 'Regular', tone: 'warn' },
  { label: 'Boa', tone: 'ok' },
  { label: 'Excelente', tone: 'good' },
  { label: 'Superior', tone: 'good' },
]
const FIVE: Classification[] = [
  { label: 'Precisa melhorar', tone: 'bad' },
  { label: 'Regular', tone: 'warn' },
  { label: 'Boa', tone: 'ok' },
  { label: 'Muito boa', tone: 'good' },
  { label: 'Excelente', tone: 'good' },
]

/** Cooper Institute — VO2máx (ml/kg/min) */
const VO2_TABLE: Record<Sex, Band[]> = {
  M: [
    [0, [35, 38.4, 45.2, 51, 56]],
    [20, [33, 36.5, 42.5, 46.5, 52.5]],
    [30, [31.5, 35.5, 41, 45, 49.5]],
    [40, [30.2, 33.6, 39, 43.8, 48.1]],
    [50, [26.1, 31, 35.8, 41, 45.4]],
    [60, [20.5, 26.1, 32.3, 36.5, 44.3]],
  ],
  F: [
    [0, [25, 31, 35, 39, 42]],
    [20, [23.6, 29, 33, 37, 41.1]],
    [30, [22.8, 27, 31.5, 35.7, 40.1]],
    [40, [21, 24.5, 29, 32.9, 37]],
    [50, [20.2, 22.8, 27, 31.5, 35.8]],
    [60, [17.5, 20.2, 24.5, 30.3, 31.5]],
  ],
}
export const classifyVo2 = (v: number, sex: Sex, age: number) => rank(v, pickBand(VO2_TABLE[sex], age)[1], SIX)

/** CSEP / ACSM — flexão de braço (repetições; mulheres com joelhos apoiados) */
const PUSHUP_TABLE: Record<Sex, Band[]> = {
  M: [
    [0, [18, 23, 29, 39]],
    [20, [17, 22, 29, 36]],
    [30, [12, 17, 22, 30]],
    [40, [10, 13, 17, 25]],
    [50, [7, 10, 13, 21]],
    [60, [5, 8, 11, 18]],
  ],
  F: [
    [0, [12, 18, 25, 33]],
    [20, [10, 15, 21, 30]],
    [30, [8, 13, 20, 27]],
    [40, [5, 11, 15, 24]],
    [50, [2, 7, 11, 21]],
    [60, [2, 5, 12, 17]],
  ],
}
export const classifyPushups = (v: number, sex: Sex, age: number) => rank(v, pickBand(PUSHUP_TABLE[sex], age)[1], FIVE)

/** CSEP — sentar e alcançar (banco de Wells, cm) */
const REACH_TABLE: Record<Sex, Band[]> = {
  M: [
    [0, [24, 29, 34, 39]],
    [20, [25, 30, 34, 40]],
    [30, [23, 28, 33, 38]],
    [40, [18, 24, 29, 35]],
    [50, [16, 24, 28, 35]],
    [60, [15, 20, 25, 33]],
  ],
  F: [
    [0, [29, 34, 38, 43]],
    [20, [28, 33, 37, 41]],
    [30, [27, 32, 36, 41]],
    [40, [25, 30, 34, 38]],
    [50, [25, 30, 33, 39]],
    [60, [23, 27, 31, 35]],
  ],
}
export const classifyReach = (v: number, sex: Sex, age: number) => rank(v, pickBand(REACH_TABLE[sex], age)[1], FIVE)

export function classifyFms(total: number): Classification {
  if (total >= 17) return { label: 'Ótimo padrão de movimento', tone: 'good' }
  if (total >= 15) return { label: 'Bom padrão de movimento', tone: 'ok' }
  return { label: 'Risco aumentado de lesão (≤ 14)', tone: 'bad' }
}

/* ───────── Formatação ───────── */

export function fmt(v: number | undefined, digits = 1, unit = ''): string {
  if (!isNum(v)) return '—'
  return v.toLocaleString('pt-BR', { minimumFractionDigits: digits, maximumFractionDigits: digits }) + (unit ? ` ${unit}` : '')
}

export function fmtDate(iso: string): string {
  if (!iso) return '—'
  const [y, m, d] = iso.slice(0, 10).split('-')
  return `${d}/${m}/${y}`
}

export function daysSince(iso: string): number {
  return Math.floor((Date.now() - new Date(iso + 'T00:00:00').getTime()) / 86_400_000)
}

export { isNum }
