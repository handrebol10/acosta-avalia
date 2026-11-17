/* Relatório de avaliação física em PDF (vetorial, texto selecionável) — identidade Método ACOSTA */
import { Document, Image, Page, Path, Polyline, Circle, Rect, StyleSheet, Svg, Text, View, G, Line } from '@react-pdf/renderer'
import type { ReactNode } from 'react'
import type { Assessment, Classification, Settings, Student } from '../lib/types'
import {
  FAT_ZONES,
  classifyBmi,
  classifyBp,
  classifyFat,
  classifyFms,
  classifyHr,
  classifyPushups,
  classifyReach,
  classifyVo2,
  classifyWaist,
  classifyWhr,
  classifyWhtr,
  computeResults,
  fmt,
  fmtDate,
  isNum,
  type Results,
} from '../lib/calc'
import { ACTIVITY_LEVELS, CIRCS, FMS, FOLDS, PARQ, PHOTO_VIEWS, POSTURE, PROTOCOLS } from '../lib/catalog'

const C = {
  ink: '#10231A',
  muted: '#55625B',
  faint: '#65716A',
  line: '#D3DCD6',
  soft: '#EDF1EE',
  card: '#F6F8F6',
  green: '#2F6B4C',
  greenDark: '#1D4532',
  gold: '#C98A2E',
  goldDeep: '#85561A',
  goldSoft: '#F3E6CF',
}
const TONE: Record<string, { fg: string; bg: string }> = {
  good: { fg: '#2F6B4C', bg: '#E2EDE6' },
  ok: { fg: '#2F6878', bg: '#E1EDF0' },
  warn: { fg: '#85561A', bg: '#F3E6CF' },
  bad: { fg: '#A8402E', bg: '#F6E1DC' },
  neutral: { fg: '#55625B', bg: '#EDF1EE' },
}

/** As fontes padrão do PDF não têm alguns símbolos: troca por equivalentes seguros */
const t = (s: string) =>
  s.replace(/₂/g, '2').replace(/−/g, '-').replace(/≤/g, '<=').replace(/≥/g, '>=').replace(/▲/g, '+').replace(/▼/g, '-').replace(/[“”]/g, '"')

const s = StyleSheet.create({
  page: { paddingTop: 34, paddingBottom: 46, paddingHorizontal: 36, fontFamily: 'Helvetica', fontSize: 9.2, color: C.ink, lineHeight: 1.4 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', paddingBottom: 12, borderBottomWidth: 2, borderBottomColor: C.ink, marginBottom: 6 },
  eyebrow: { fontSize: 7.2, letterSpacing: 1.4, color: C.goldDeep, fontFamily: 'Helvetica-Bold', textTransform: 'uppercase' },
  h1: { fontSize: 19, fontFamily: 'Helvetica-Bold', marginTop: 3, marginBottom: 3, lineHeight: 1.15 },
  section: { marginTop: 14 },
  h2row: { flexDirection: 'row', alignItems: 'center', marginBottom: 7, paddingBottom: 4, borderBottomWidth: 0.6, borderBottomColor: C.line },
  h2bar: { width: 3, height: 11, backgroundColor: C.gold, marginRight: 6, borderRadius: 1 },
  h2: { fontSize: 11.5, fontFamily: 'Helvetica-Bold', color: C.green },
  row: { flexDirection: 'row' },
  kpi: { flex: 1, backgroundColor: C.card, borderRadius: 6, padding: 8, marginRight: 6, borderWidth: 0.6, borderColor: '#E4EAE6' },
  kpiK: { fontSize: 7.6, color: C.muted },
  kpiV: { fontSize: 15, fontFamily: 'Helvetica-Bold', marginTop: 2 },
  kpiU: { fontSize: 8, color: C.muted, fontFamily: 'Helvetica' },
  th: { fontSize: 7, color: C.faint, fontFamily: 'Helvetica-Bold', textTransform: 'uppercase', letterSpacing: 0.6 },
  tr: { flexDirection: 'row', paddingVertical: 3.6, borderBottomWidth: 0.5, borderBottomColor: '#E4EAE6', alignItems: 'center' },
  small: { fontSize: 7.8, color: C.muted },
  bold: { fontFamily: 'Helvetica-Bold' },
  badge: { fontSize: 7, fontFamily: 'Helvetica-Bold', paddingVertical: 1.6, paddingHorizontal: 5, borderRadius: 7 },
  note: { backgroundColor: C.goldSoft, borderRadius: 6, padding: 8, fontSize: 8.6 },
  // Rodapé posicionado pelo topo da folha A4 (841,9 pt): com "bottom", o texto dinâmico
  // do número de página era desenhado fora da página nesta versão do react-pdf
  footerLine: { position: 'absolute', left: 36, right: 36, top: 810, height: 0.5, backgroundColor: C.line },
  footerText: { position: 'absolute', top: 815, left: 36, right: 36, fontSize: 7, color: C.faint, lineHeight: 1.2 },
})

export interface PdfData {
  a: Assessment
  st: Student
  history: Assessment[] // todas as avaliações do aluno, em ordem de data
  settings: Settings
  photos: Partial<Record<string, string>> // dataURL por vista
}

export function AssessmentPdf({ a, st, history, settings, photos }: PdfData) {
  const r = computeResults(a, st)
  const prev = [...history].filter((x) => x.date < a.date).pop()
  const pr = prev ? computeResults(prev, st) : null
  const upTo = history.filter((x) => x.date <= a.date)

  return (
    <Document title={`Avaliação física · ${st.name} · ${fmtDate(a.date)}`} author={settings.evaluatorName || 'ACOSTA Avalia'} creator="ACOSTA Avalia" subject="Relatório de avaliação física" language="pt-BR">
      <Page size="A4" style={s.page} wrap>
        {/* Rodapé em todas as páginas (elementos fixos vêm antes do conteúdo) */}
        <View style={s.footerLine} fixed />
        <Text style={s.footerText} fixed>
          {t(`ACOSTA Avalia · ${st.name} · ${fmtDate(a.date)}`)}
        </Text>
        <Text style={[s.footerText, { textAlign: 'right' }]} fixed render={({ pageNumber, totalPages }) => `Página ${pageNumber} de ${totalPages}`} />

        <Header a={a} st={st} r={r} prev={prev} settings={settings} />

        {r.parqAlert && (
          <View style={[s.note, { backgroundColor: TONE.bad.bg, marginTop: 10 }]} wrap={false}>
            <Text style={{ color: TONE.bad.fg }}>
              <Text style={s.bold}>PAR-Q positivo. </Text>
              Recomenda-se avaliação e liberação médica antes de aumentar a intensidade do treinamento.
            </Text>
          </View>
        )}

        <Composicao a={a} st={st} r={r} pr={pr} prev={prev} />
        <Saude a={a} st={st} r={r} />
        <Anamnese a={a} />
        <Perimetros a={a} prev={prev} />
        <Dobras a={a} st={st} r={r} />
        <Aptidao a={a} st={st} r={r} prev={prev} pr={pr} />
        <FmsBlock a={a} r={r} />
        <Postural a={a} photos={photos} />
        {upTo.length > 1 && <Evolucao history={upTo} st={st} />}

        {a.notes ? (
          <Section title="Conclusão e recomendações">
            <Text style={{ fontSize: 9.4 }}>{t(a.notes)}</Text>
          </Section>
        ) : null}

        <View style={{ marginTop: 24, flexDirection: 'row', justifyContent: 'flex-end' }} wrap={false}>
          <View style={{ width: 200, borderTopWidth: 0.8, borderTopColor: C.ink, paddingTop: 4, alignItems: 'center' }}>
            <Text style={s.bold}>{settings.evaluatorName || 'Avaliador(a)'}</Text>
            {settings.cref ? <Text style={s.small}>CREF {settings.cref}</Text> : null}
          </View>
        </View>

      </Page>
    </Document>
  )
}

/* ───────── Blocos ───────── */

function Logo({ size = 46 }: { size?: number }) {
  return (
    <Svg viewBox="0 0 130 98" style={{ width: size, height: (size * 98) / 130 }}>
      <G>
        <Path d="M65 92 L 28 55 C 15 42, 16 22, 32 15.5 C 46 10, 59 17, 65 30 C 71 17, 84 10, 98 15.5 C 114 22, 115 42, 102 55 Z" stroke={C.gold} strokeWidth={6} fill="none" strokeLinejoin="round" />
        <Path d="M19 48 H 46 L 50.5 40 L 56.5 60 L 63 36 L 69 57 L 73 48 H 111" stroke={C.gold} strokeWidth={5.5} fill="none" strokeLinejoin="round" strokeLinecap="round" />
        <Rect x={11} y={31} width={8.5} height={34} rx={3} fill={C.gold} />
        <Rect x={2.5} y={37.5} width={6.5} height={21} rx={2.5} fill={C.gold} />
        <Rect x={110.5} y={31} width={8.5} height={34} rx={3} fill={C.gold} />
        <Rect x={121} y={37.5} width={6.5} height={21} rx={2.5} fill={C.gold} />
      </G>
    </Svg>
  )
}

function Header({ a, st, r, prev, settings }: { a: Assessment; st: Student; r: Results; prev?: Assessment; settings: Settings }) {
  return (
    <View style={s.header}>
      <View style={[s.row, { alignItems: 'center', flex: 1 }]}>
        <Logo />
        <View style={{ marginLeft: 10, flex: 1 }}>
          <Text style={s.eyebrow}>Relatório de avaliação física</Text>
          <Text style={s.h1}>{t(st.name)}</Text>
          <Text style={s.small}>
            {r.age} anos · {st.sex === 'M' ? 'Masculino' : 'Feminino'}
            {st.goal ? ` · Objetivo: ${t(st.goal)}` : ''}
          </Text>
        </View>
      </View>
      <View style={{ alignItems: 'flex-end' }}>
        <Text style={[s.bold, { fontSize: 11 }]}>{fmtDate(a.date)}</Text>
        {prev && <Text style={s.small}>Comparado com {fmtDate(prev.date)}</Text>}
        {settings.evaluatorName ? <Text style={{ marginTop: 4 }}>{t(settings.evaluatorName)}</Text> : null}
        {settings.cref ? <Text style={s.small}>CREF {settings.cref}</Text> : null}
      </View>
    </View>
  )
}

function Section({ title, children, keep }: { title: string; children: ReactNode; keep?: boolean }) {
  return (
    <View style={s.section} wrap={!keep}>
      <View style={s.h2row} minPresenceAhead={60}>
        <View style={s.h2bar} />
        <Text style={s.h2}>{t(title)}</Text>
      </View>
      {children}
    </View>
  )
}

function Badge({ c }: { c?: Classification | null }) {
  if (!c) return null
  const tone = TONE[c.tone]
  return <Text style={[s.badge, { color: tone.fg, backgroundColor: tone.bg }]}>{t(c.label)}</Text>
}

function delta(now?: number, before?: number, unit = '', goodWhen: 'up' | 'down' | 'neutral' = 'neutral', digits = 1) {
  if (!isNum(now) || !isNum(before)) return null
  const d = now - before
  if (Math.abs(d) < 10 ** -digits / 2) return { text: 'sem variação', color: C.faint }
  const good = goodWhen === 'neutral' ? null : (d > 0) === (goodWhen === 'up')
  return { text: `${d > 0 ? '+' : '-'}${fmt(Math.abs(d), digits)}${unit ? ' ' + unit : ''}`, color: good === null ? C.muted : good ? TONE.good.fg : TONE.bad.fg }
}

function Kpi({ k, v, unit, c, d, last }: { k: string; v: string; unit?: string; c?: Classification | null; d?: ReturnType<typeof delta>; last?: boolean }) {
  return (
    <View style={[s.kpi, last ? { marginRight: 0 } : {}]}>
      <Text style={s.kpiK}>{t(k)}</Text>
      <Text style={s.kpiV}>
        {v}
        {unit && v !== '—' ? <Text style={s.kpiU}> {unit}</Text> : null}
      </Text>
      <View style={[s.row, { marginTop: 3, alignItems: 'center', flexWrap: 'wrap' }]}>
        {c ? <Badge c={c} /> : null}
        {d ? <Text style={{ fontSize: 7.6, color: d.color, fontFamily: 'Helvetica-Bold', marginLeft: c ? 4 : 0 }}>{d.text}</Text> : null}
      </View>
    </View>
  )
}

type Col = { w: number; align?: 'left' | 'right' | 'center' }
function Table({ cols, head, rows }: { cols: Col[]; head?: string[]; rows: ReactNode[][] }) {
  return (
    <View>
      {head && (
        <View style={[s.tr, { borderBottomColor: C.line, borderBottomWidth: 0.8 }]}>
          {head.map((h, i) => (
            <Text key={i} style={[s.th, { width: `${cols[i].w}%`, textAlign: cols[i].align ?? 'left' }]}>
              {t(h)}
            </Text>
          ))}
        </View>
      )}
      {rows.map((row, ri) => (
        <View key={ri} style={s.tr} wrap={false}>
          {row.map((cell, i) => (
            <View key={i} style={{ width: `${cols[i].w}%`, alignItems: cols[i].align === 'right' ? 'flex-end' : cols[i].align === 'center' ? 'center' : 'flex-start' }}>
              {typeof cell === 'string' || typeof cell === 'number' ? <Text>{t(String(cell))}</Text> : cell}
            </View>
          ))}
        </View>
      ))}
    </View>
  )
}

function FatBar({ pct, sex }: { pct: number; sex: Student['sex'] }) {
  const zones = FAT_ZONES[sex]
  const min = sex === 'M' ? 2 : 10
  const max = sex === 'M' ? 35 : 45
  const pos = Math.min(Math.max(((pct - min) / (max - min)) * 100, 0), 100)
  const col: Record<string, string> = { good: TONE.good.fg, ok: '#3E7A8C', warn: C.gold, bad: TONE.bad.fg }
  let p = min
  const parts = zones.map((z) => {
    const top = Math.min(z.max, max)
    const w = ((top - p) / (max - min)) * 100
    p = top
    return { ...z, w }
  })
  return (
    <View style={{ marginTop: 10 }} wrap={false}>
      <View style={{ position: 'relative', height: 26 }}>
        <Text style={{ position: 'absolute', left: `${pos}%`, top: 0, fontSize: 7.4, fontFamily: 'Helvetica-Bold', marginLeft: -12, width: 30 }}>{fmt(pct, 1)}%</Text>
        <View style={{ position: 'absolute', left: `${pos}%`, top: 10, width: 1.6, height: 15, backgroundColor: C.ink, marginLeft: -0.8 }} />
        <View style={{ position: 'absolute', top: 15, left: 0, right: 0, height: 6, flexDirection: 'row' }}>
          {parts.map((z) => (
            <View key={z.label} style={{ width: `${z.w}%`, backgroundColor: col[z.tone], opacity: 0.85, marginRight: 1 }} />
          ))}
        </View>
      </View>
      <View style={[s.row, { marginTop: 3 }]}>
        {parts.map((z) => (
          <Text key={z.label} style={{ width: `${z.w}%`, textAlign: 'center', fontSize: 6.8, color: C.faint }}>
            {z.label}
          </Text>
        ))}
      </View>
    </View>
  )
}

function Composicao({ a, st, r, pr, prev }: { a: Assessment; st: Student; r: Results; pr: Results | null; prev?: Assessment }) {
  return (
    <Section title="Composição corporal" keep>
      <View style={s.row}>
        <Kpi k="Peso" v={fmt(a.anthro.weight, 1)} unit="kg" d={delta(a.anthro.weight, prev?.anthro.weight, 'kg')} />
        <Kpi k="% Gordura" v={r.comp ? fmt(r.comp.fatPct, 1) : '—'} unit="%" c={r.comp ? classifyFat(r.comp.fatPct, st.sex) : null} d={delta(r.comp?.fatPct, pr?.comp?.fatPct, '%', 'down')} />
        <Kpi k="Massa magra" v={fmt(r.leanMass, 1)} unit="kg" d={delta(r.leanMass, pr?.leanMass, 'kg', 'up')} />
        <Kpi k="Massa gorda" v={fmt(r.fatMass, 1)} unit="kg" d={delta(r.fatMass, pr?.fatMass, 'kg', 'down')} last />
      </View>
      {r.comp && (
        <>
          <FatBar pct={r.comp.fatPct} sex={st.sex} />
          <Text style={[s.small, { marginTop: 6 }]}>
            Método: {t(r.comp.methodLabel)}. Peso estimado com {r.targetFat}% de gordura: {fmt(r.targetWeight, 1, 'kg')}.
          </Text>
        </>
      )}
    </Section>
  )
}

function Saude({ a, st, r }: { a: Assessment; st: Student; r: Results }) {
  const { systolic: sy, diastolic: di, restingHr: hr } = a.vitals
  const rows: [string, string, Classification | null][] = [
    ['Estatura', fmt(a.anthro.height, 0, 'cm'), null],
    ['IMC', fmt(r.bmi, 1, 'kg/m²'), isNum(r.bmi) ? classifyBmi(r.bmi) : null],
    ['Circunferência da cintura', fmt(a.anthro.circ.cintura, 1, 'cm'), isNum(a.anthro.circ.cintura) ? classifyWaist(a.anthro.circ.cintura, st.sex) : null],
    ['Relação cintura/quadril', fmt(r.whr, 2), isNum(r.whr) ? classifyWhr(r.whr, st.sex) : null],
    ['Relação cintura/estatura', fmt(r.whtr, 2), isNum(r.whtr) ? classifyWhtr(r.whtr) : null],
    ['Pressão arterial', isNum(sy) && isNum(di) ? `${sy}/${di} mmHg` : '—', isNum(sy) && isNum(di) ? classifyBp(sy, di) : null],
    ['FC de repouso', fmt(hr, 0, 'bpm'), isNum(hr) ? classifyHr(hr) : null],
    [`Metabolismo basal (${isNum(r.bmrKatch) ? 'Katch-McArdle' : 'Mifflin-St Jeor'})`, fmt(r.bmrKatch ?? r.bmrMifflin, 0, 'kcal/dia'), null],
    ['Gasto energético diário estimado', fmt(r.tdee, 0, 'kcal/dia'), null],
  ]
  return (
    <Section title="Indicadores de saúde" keep>
      <Table cols={[{ w: 46 }, { w: 26, align: 'right' }, { w: 28, align: 'right' }]} rows={rows.map(([k, v, c]) => [k, <Text style={s.bold}>{t(v)}</Text>, <Badge c={c} />])} />
    </Section>
  )
}

function Anamnese({ a }: { a: Assessment }) {
  const an = a.anamnese
  const answered = an.parq.some((v) => v !== null)
  const info: [string, string | undefined][] = [
    ['Objetivo desta fase', an.objective],
    ['Nível de atividade', ACTIVITY_LEVELS.find((l) => l.v === an.activityLevel)?.label],
    ['Lesões ou cirurgias', an.injuries],
    ['Doenças e condições', an.diseases],
    ['Medicamentos', an.medications],
    ['Horas de sono', isNum(an.sleepHours) ? `${fmt(an.sleepHours, 1)} h` : undefined],
    ['Fumante', an.smoker === undefined ? undefined : an.smoker ? 'Sim' : 'Não'],
  ]
  const filled = info.filter(([, v]) => v && v.trim())
  if (!answered && filled.length === 0) return null
  return (
    <Section title="Anamnese">
      {filled.length > 0 && (
        <View style={{ marginBottom: answered ? 8 : 0 }}>
          {filled.map(([k, v]) => (
            <View key={k} style={s.tr} wrap={false}>
              <Text style={{ width: '30%', color: C.muted }}>{k}</Text>
              <Text style={{ width: '70%' }}>{t(v!)}</Text>
            </View>
          ))}
        </View>
      )}
      {answered && (
        <>
          <Text style={[s.bold, { fontSize: 8.6, marginBottom: 2 }]}>PAR-Q · Prontidão para atividade física</Text>
          <Table
            cols={[{ w: 6 }, { w: 82 }, { w: 12, align: 'right' }]}
            rows={PARQ.map((q, i) => [
              `${i + 1}.`,
              <Text style={{ fontSize: 8.2 }}>{t(q)}</Text>,
              an.parq[i] === null ? '—' : <Text style={[s.bold, { color: an.parq[i] ? TONE.bad.fg : TONE.good.fg }]}>{an.parq[i] ? 'Sim' : 'Não'}</Text>,
            ])}
          />
        </>
      )}
    </Section>
  )
}

function Perimetros({ a, prev }: { a: Assessment; prev?: Assessment }) {
  const list = CIRCS.filter((c) => isNum(a.anthro.circ[c.key]))
  if (!list.length) return null
  const cols: Col[] = prev ? [{ w: 40 }, { w: 20, align: 'right' }, { w: 20, align: 'right' }, { w: 20, align: 'right' }] : [{ w: 60 }, { w: 40, align: 'right' }]
  return (
    <Section title="Perímetros">
      <Table
        cols={cols}
        head={prev ? ['Medida', fmtDate(prev.date), fmtDate(a.date), 'Variação'] : ['Medida', fmtDate(a.date)]}
        rows={list.map((c) => {
          const d = delta(a.anthro.circ[c.key], prev?.anthro.circ[c.key], 'cm')
          const now = <Text style={s.bold}>{fmt(a.anthro.circ[c.key], 1, 'cm')}</Text>
          return prev ? [c.label, fmt(prev.anthro.circ[c.key], 1, 'cm'), now, d ? <Text style={{ color: d.color }}>{d.text}</Text> : '—'] : [c.label, now]
        })}
      />
    </Section>
  )
}

function Dobras({ a, st, r }: { a: Assessment; st: Student; r: Results }) {
  if (a.body.method !== 'dobras') return null
  const keys = PROTOCOLS[a.body.protocol].folds(st.sex).filter((k) => isNum(a.body.folds[k]))
  if (!keys.length) return null
  return (
    <Section title="Dobras cutâneas" keep>
      <Text style={[s.small, { marginBottom: 4 }]}>{t(PROTOCOLS[a.body.protocol].label)}</Text>
      <View style={[s.row, { flexWrap: 'wrap' }]}>
        {keys.map((k) => (
          <View key={k} style={{ width: '25%', paddingRight: 6, marginBottom: 5 }}>
            <View style={{ backgroundColor: C.card, borderRadius: 5, padding: 6, borderWidth: 0.5, borderColor: '#E4EAE6' }}>
              <Text style={s.kpiK}>{FOLDS[k].label}</Text>
              <Text style={[s.bold, { fontSize: 11 }]}>
                {fmt(a.body.folds[k], 1)} <Text style={s.kpiU}>mm</Text>
              </Text>
            </View>
          </View>
        ))}
      </View>
      {r.comp?.sum !== undefined && (
        <Text style={s.small}>
          Soma das dobras: {fmt(r.comp.sum, 1, 'mm')}
          {r.comp.density !== undefined ? ` · Densidade corporal: ${fmt(r.comp.density, 4, 'g/ml')}` : ''}
        </Text>
      )}
    </Section>
  )
}

const VO2_LABEL: Record<string, string> = { cooper: 'Teste de Cooper (12 min)', rockport: 'Caminhada de Rockport', step: 'Teste do banco (Queens College)', direct: 'Ergoespirometria' }

function Aptidao({ a, st, r, prev, pr }: { a: Assessment; st: Student; r: Results; prev?: Assessment; pr: Results | null }) {
  const f = a.fitness
  const rows: ReactNode[][] = []
  const add = (k: string, v: string, c: Classification | null, d: ReturnType<typeof delta>) => rows.push([k, <Text style={s.bold}>{t(v)}</Text>, <Badge c={c} />, d ? <Text style={{ color: d.color }}>{d.text}</Text> : '—'])
  if (isNum(r.vo2)) add(`VO2máx · ${VO2_LABEL[f.vo2Test] ?? ''}`, fmt(r.vo2, 1, 'ml/kg/min'), classifyVo2(r.vo2, st.sex, r.age), delta(r.vo2, pr?.vo2, '', 'up'))
  if (isNum(f.pushups)) add('Flexão de braço', `${f.pushups} rep`, classifyPushups(f.pushups, st.sex, r.age), delta(f.pushups, prev?.fitness.pushups, 'rep', 'up', 0))
  if (isNum(f.situps)) add('Abdominal em 1 minuto', `${f.situps} rep`, null, delta(f.situps, prev?.fitness.situps, 'rep', 'up', 0))
  if (isNum(f.sitReach)) add('Flexibilidade (banco de Wells)', fmt(f.sitReach, 1, 'cm'), classifyReach(f.sitReach, st.sex, r.age), delta(f.sitReach, prev?.fitness.sitReach, 'cm', 'up'))
  if (isNum(f.gripD) || isNum(f.gripE)) add('Preensão manual D / E', `${fmt(f.gripD, 0)} / ${fmt(f.gripE, 0)} kgf`, null, null)
  if (!rows.length) return null
  return (
    <Section title="Aptidão física" keep>
      <Table cols={[{ w: 42 }, { w: 22, align: 'right' }, { w: 20, align: 'right' }, { w: 16, align: 'right' }]} head={['Teste', 'Resultado', 'Classificação', 'Variação']} rows={rows} />
    </Section>
  )
}

function FmsBlock({ a, r }: { a: Assessment; r: Results }) {
  if (!isNum(r.fmsTotal)) return null
  const label = ['Dor', 'Não executa', 'Com compensação', 'Perfeito']
  return (
    <Section title={`Padrões de movimento (FMS) · ${r.fmsTotal}/21`} keep>
      <Table
        cols={[{ w: 60 }, { w: 12, align: 'center' }, { w: 28, align: 'right' }]}
        head={['Teste', 'Nota', 'Execução']}
        rows={FMS.map((tst) => {
          const v = a.fms[tst.key]
          return [tst.label, <Text style={s.bold}>{isNum(v) ? String(v) : '—'}</Text>, <Text style={{ color: v === 0 ? TONE.bad.fg : C.muted }}>{isNum(v) ? label[v] : '—'}</Text>]
        })}
      />
      {r.fmsComplete && (
        <View style={{ marginTop: 6, flexDirection: 'row' }}>
          <Badge c={classifyFms(r.fmsTotal)} />
        </View>
      )}
    </Section>
  )
}

function Postural({ a, photos }: { a: Assessment; photos: PdfData['photos'] }) {
  const has = PHOTO_VIEWS.some((v) => photos[v.key])
  if (!has && !a.posture.findings.length && !a.posture.notes) return null
  return (
    <Section title="Avaliação postural">
      {has && (
        <View style={[s.row, { marginBottom: 8 }]} wrap={false}>
          {PHOTO_VIEWS.map((v, i) => (
            <View key={v.key} style={{ flex: 1, marginRight: i < 2 ? 8 : 0, alignItems: 'center' }}>
              <View style={{ width: '100%', height: 200, backgroundColor: C.soft, borderRadius: 6, overflow: 'hidden', justifyContent: 'center', alignItems: 'center' }}>
                {photos[v.key] ? (
                  <>
                    <Image src={photos[v.key]!} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    <View style={{ position: 'absolute', top: 0, bottom: 0, left: '50%', width: 1, backgroundColor: C.gold }} />
                  </>
                ) : (
                  <Text style={s.small}>Sem foto</Text>
                )}
              </View>
              <Text style={[s.small, { marginTop: 3 }]}>{v.label}</Text>
            </View>
          ))}
        </View>
      )}
      {POSTURE.map((g) => {
        const found = g.items.filter((i) => a.posture.findings.includes(i.id))
        if (!found.length) return null
        return (
          <View key={g.view} style={[s.tr, { alignItems: 'flex-start' }]} wrap={false}>
            <Text style={{ width: '22%', color: C.muted }}>Vista {PHOTO_VIEWS.find((v) => v.key === g.view)!.label.toLowerCase()}</Text>
            <Text style={{ width: '78%' }}>{found.map((i) => i.label).join(' · ')}</Text>
          </View>
        )
      })}
      {!a.posture.findings.length && <Text style={s.small}>Nenhum desvio postural relevante observado.</Text>}
      {a.posture.notes ? <Text style={{ marginTop: 6 }}>{t(a.posture.notes)}</Text> : null}
    </Section>
  )
}

function MiniChart({ title, points, unit }: { title: string; points: { date: string; value: number }[]; unit: string }) {
  const W = 250
  const H = 92
  const pad = { l: 8, r: 8, t: 16, b: 14 }
  if (points.length < 2) return null
  const vals = points.map((p) => p.value)
  let lo = Math.min(...vals)
  let hi = Math.max(...vals)
  const span = hi - lo || 1
  lo -= span * 0.3
  hi += span * 0.3
  const x = (i: number) => pad.l + (i / (points.length - 1)) * (W - pad.l - pad.r)
  const y = (v: number) => pad.t + (1 - (v - lo) / (hi - lo)) * (H - pad.t - pad.b)
  const first = points[0].value
  const last = points[points.length - 1].value
  const d = last - first
  return (
    <View style={{ width: '50%', paddingRight: 8, marginBottom: 8 }} wrap={false}>
      <View style={{ backgroundColor: C.card, borderRadius: 6, padding: 8, borderWidth: 0.5, borderColor: '#E4EAE6' }}>
        <View style={[s.row, { justifyContent: 'space-between' }]}>
          <Text style={[s.bold, { fontSize: 8.6 }]}>{t(title)}</Text>
          <Text style={{ fontSize: 8, color: C.muted }}>
            {fmt(first, 1)} para {fmt(last, 1)} {unit} ({d >= 0 ? '+' : '-'}
            {fmt(Math.abs(d), 1)})
          </Text>
        </View>
        <Svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height: H * 0.92 }}>
          <Line x1={pad.l} x2={W - pad.r} y1={H - pad.b} y2={H - pad.b} stroke={C.line} strokeWidth={0.6} />
          <Polyline points={points.map((p, i) => `${x(i)},${y(p.value)}`).join(' ')} stroke={C.green} strokeWidth={2} fill="none" />
          {points.map((p, i) => (
            <G key={i}>
              <Circle cx={x(i)} cy={y(p.value)} r={3} fill="#FFFFFF" stroke={C.green} strokeWidth={1.6} />
              <Text x={x(i)} y={y(p.value) - 6} style={{ fontSize: 7, fill: C.ink }} textAnchor="middle">
                {fmt(p.value, 1)}
              </Text>
              <Text x={x(i)} y={H - 3} style={{ fontSize: 6.4, fill: C.faint }} textAnchor="middle">
                {fmtDate(p.date).slice(0, 5)}
              </Text>
            </G>
          ))}
        </Svg>
      </View>
    </View>
  )
}

function Evolucao({ history, st }: { history: Assessment[]; st: Student }) {
  const res = history.map((h) => ({ h, r: computeResults(h, st) }))
  const series = (fn: (x: (typeof res)[number]) => number | undefined) =>
    res.map((x) => ({ date: x.h.date, value: fn(x) })).filter((p): p is { date: string; value: number } => isNum(p.value))
  const charts = [
    { title: 'Peso', unit: 'kg', points: series((x) => x.h.anthro.weight) },
    { title: '% Gordura', unit: '%', points: series((x) => x.r.comp?.fatPct) },
    { title: 'Massa magra', unit: 'kg', points: series((x) => x.r.leanMass) },
    { title: 'Cintura', unit: 'cm', points: series((x) => x.h.anthro.circ.cintura) },
  ].filter((c) => c.points.length > 1)
  return (
    <Section title="Evolução">
      <View style={[s.row, { flexWrap: 'wrap', marginRight: -8 }]}>
        {charts.map((c) => (
          <MiniChart key={c.title} {...c} />
        ))}
      </View>
      <Table
        cols={[{ w: 20 }, { w: 16, align: 'right' }, { w: 16, align: 'right' }, { w: 16, align: 'right' }, { w: 16, align: 'right' }, { w: 16, align: 'right' }]}
        head={['Data', 'Peso', '% Gordura', 'Massa magra', 'Cintura', 'VO2máx']}
        rows={res.map(({ h, r }) => [fmtDate(h.date), fmt(h.anthro.weight, 1, 'kg'), r.comp ? fmt(r.comp.fatPct, 1, '%') : '—', fmt(r.leanMass, 1, 'kg'), fmt(h.anthro.circ.cintura, 1, 'cm'), fmt(r.vo2, 1)])}
      />
    </Section>
  )
}
