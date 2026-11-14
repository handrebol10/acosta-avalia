import { Link, useParams } from 'react-router-dom'
import { Activity, ArrowLeft, HeartPulse, PersonStanding, Printer, Ruler, Scale } from 'lucide-react'
import { usePhoto, useStore } from '../lib/store'
import {
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
} from '../lib/calc'
import { CIRCS, FMS, PHOTO_VIEWS, POSTURE_LABEL } from '../lib/catalog'
import { Badge, Delta, FatZones, Metric } from '../components/ui'

export default function Report() {
  const { id } = useParams()
  const { assessments, students, settings } = useStore()
  const a = assessments.find((x) => x.id === id)
  const s = students.find((x) => x.id === a?.studentId)
  if (!a || !s) return <p className="muted">Avaliação não encontrada.</p>

  const r = computeResults(a, s)
  const prev = assessments
    .filter((x) => x.studentId === s.id && x.date < a.date)
    .sort((x, y) => y.date.localeCompare(x.date))[0]
  const pr = prev ? computeResults(prev, s) : null
  const circs = CIRCS.filter((c) => isNum(a.anthro.circ[c.key]))
  const hasFitness = isNum(a.fitness.pushups) || isNum(a.fitness.situps) || isNum(a.fitness.sitReach) || isNum(r.vo2) || isNum(a.fitness.gripD)
  const hasPhotos = Object.values(a.posture.photos).some(Boolean)

  return (
    <div className="page">
      <div className="row no-print wrap">
        <Link to={`/avaliacao/${a.id}`} className="btn ghost sm">
          <ArrowLeft size={16} /> Voltar para a avaliação
        </Link>
        <span className="spacer" />
        <span className="small muted">Use “Salvar como PDF” na janela de impressão para enviar ao aluno.</span>
        <button className="btn primary" onClick={() => window.print()}>
          <Printer size={17} /> Imprimir / PDF
        </button>
      </div>

      <article className="report">
        <header className="report-head">
          <div className="row" style={{ gap: 14 }}>
            <img src={`${import.meta.env.BASE_URL}logo.svg`} alt="" style={{ width: 58 }} />
            <div>
              <div className="eyebrow">Relatório de avaliação física</div>
              <h1 style={{ fontSize: '1.6rem' }}>{s.name}</h1>
              <p className="small" style={{ color: '#55625b' }}>
                {r.age} anos · {s.sex === 'M' ? 'Masculino' : 'Feminino'}
                {s.goal ? ` · Objetivo: ${s.goal}` : ''}
              </p>
            </div>
          </div>
          <div style={{ textAlign: 'right' }} className="small">
            <div style={{ fontWeight: 700, fontSize: '1rem' }}>{fmtDate(a.date)}</div>
            {prev && <div style={{ color: '#55625b' }}>Comparado com {fmtDate(prev.date)}</div>}
            {settings.evaluatorName && <div style={{ marginTop: 6 }}>{settings.evaluatorName}</div>}
            {settings.cref && <div style={{ color: '#55625b' }}>CREF {settings.cref}</div>}
          </div>
        </header>

        {r.parqAlert && (
          <section className="report-section">
            <div className="explain callout-bad">
              <HeartPulse size={18} />
              <div>
                <strong>PAR-Q positivo.</strong> Recomenda-se avaliação e liberação médica antes de aumentar a intensidade do treinamento.
              </div>
            </div>
          </section>
        )}

        <section className="report-section">
          <h2>
            <Scale size={18} color="#2f6b4c" /> Composição corporal
          </h2>
          <div className="grid g4">
            <Metric label="Peso" value={fmt(a.anthro.weight, 1)} unit="kg" delta={<Delta now={a.anthro.weight} before={prev?.anthro.weight} unit="kg" />} />
            <Metric
              label="% Gordura"
              value={r.comp ? fmt(r.comp.fatPct, 1) : '—'}
              unit="%"
              c={r.comp ? classifyFat(r.comp.fatPct, s.sex) : null}
              delta={<Delta now={r.comp?.fatPct} before={pr?.comp?.fatPct} unit="%" goodWhen="down" />}
            />
            <Metric label="Massa magra" value={fmt(r.leanMass, 1)} unit="kg" delta={<Delta now={r.leanMass} before={pr?.leanMass} unit="kg" goodWhen="up" />} />
            <Metric label="Massa gorda" value={fmt(r.fatMass, 1)} unit="kg" delta={<Delta now={r.fatMass} before={pr?.fatMass} unit="kg" goodWhen="down" />} />
          </div>
          {r.comp && (
            <div style={{ marginTop: 22 }}>
              <FatZones pct={r.comp.fatPct} sex={s.sex} />
              <p className="small" style={{ color: '#8a968f', marginTop: 10 }}>
                Método: {r.comp.methodLabel}. Peso estimado com {r.targetFat}% de gordura: {fmt(r.targetWeight, 1, 'kg')}.
              </p>
            </div>
          )}
        </section>

        <section className="report-section">
          <h2>
            <HeartPulse size={18} color="#2f6b4c" /> Indicadores de saúde
          </h2>
          <table className="table">
            <tbody>
              <Line label="Estatura" v={fmt(a.anthro.height, 0, 'cm')} />
              <Line label="IMC" v={fmt(r.bmi, 1, 'kg/m²')} c={isNum(r.bmi) ? classifyBmi(r.bmi) : null} />
              <Line label="Circunferência da cintura" v={fmt(a.anthro.circ.cintura, 1, 'cm')} c={isNum(a.anthro.circ.cintura) ? classifyWaist(a.anthro.circ.cintura, s.sex) : null} />
              <Line label="Relação cintura/quadril" v={fmt(r.whr, 2)} c={isNum(r.whr) ? classifyWhr(r.whr, s.sex) : null} />
              <Line label="Relação cintura/estatura" v={fmt(r.whtr, 2)} c={isNum(r.whtr) ? classifyWhtr(r.whtr) : null} />
              <Line
                label="Pressão arterial"
                v={isNum(a.vitals.systolic) && isNum(a.vitals.diastolic) ? `${a.vitals.systolic}/${a.vitals.diastolic} mmHg` : '—'}
                c={isNum(a.vitals.systolic) && isNum(a.vitals.diastolic) ? classifyBp(a.vitals.systolic, a.vitals.diastolic) : null}
              />
              <Line label="FC de repouso" v={fmt(a.vitals.restingHr, 0, 'bpm')} c={isNum(a.vitals.restingHr) ? classifyHr(a.vitals.restingHr) : null} />
              <Line label="Metabolismo basal" v={fmt(r.bmrKatch ?? r.bmrMifflin, 0, 'kcal/dia')} />
              {isNum(r.tdee) && <Line label="Gasto energético diário estimado" v={fmt(r.tdee, 0, 'kcal/dia')} />}
            </tbody>
          </table>
        </section>

        {circs.length > 0 && (
          <section className="report-section">
            <h2>
              <Ruler size={18} color="#2f6b4c" /> Perímetros
            </h2>
            <table className="table">
              <thead>
                <tr>
                  <th>Medida</th>
                  {prev && <th className="num">{fmtDate(prev.date)}</th>}
                  <th className="num">{fmtDate(a.date)}</th>
                  {prev && <th className="num">Variação</th>}
                </tr>
              </thead>
              <tbody>
                {circs.map((c) => (
                  <tr key={c.key}>
                    <td>{c.label}</td>
                    {prev && <td className="num">{fmt(prev.anthro.circ[c.key], 1, 'cm')}</td>}
                    <td className="num" style={{ fontWeight: 650 }}>
                      {fmt(a.anthro.circ[c.key], 1, 'cm')}
                    </td>
                    {prev && (
                      <td className="num">
                        <Delta now={a.anthro.circ[c.key]} before={prev.anthro.circ[c.key]} unit="cm" />
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        )}

        {hasFitness && (
          <section className="report-section">
            <h2>
              <Activity size={18} color="#2f6b4c" /> Aptidão física
            </h2>
            <div className="grid g3">
              {isNum(r.vo2) && <Metric label="VO₂máx" value={fmt(r.vo2, 1)} unit="ml/kg/min" c={classifyVo2(r.vo2, s.sex, r.age)} delta={<Delta now={r.vo2} before={pr?.vo2} goodWhen="up" />} />}
              {isNum(a.fitness.pushups) && (
                <Metric label="Flexão de braço" value={String(a.fitness.pushups)} unit="rep" c={classifyPushups(a.fitness.pushups, s.sex, r.age)} delta={<Delta now={a.fitness.pushups} before={prev?.fitness.pushups} goodWhen="up" digits={0} />} />
              )}
              {isNum(a.fitness.situps) && <Metric label="Abdominal 1 min" value={String(a.fitness.situps)} unit="rep" delta={<Delta now={a.fitness.situps} before={prev?.fitness.situps} goodWhen="up" digits={0} />} />}
              {isNum(a.fitness.sitReach) && (
                <Metric label="Flexibilidade (Wells)" value={fmt(a.fitness.sitReach, 1)} unit="cm" c={classifyReach(a.fitness.sitReach, s.sex, r.age)} delta={<Delta now={a.fitness.sitReach} before={prev?.fitness.sitReach} unit="cm" goodWhen="up" />} />
              )}
              {isNum(a.fitness.gripD) && <Metric label="Preensão manual D / E" value={`${fmt(a.fitness.gripD, 0)} / ${fmt(a.fitness.gripE, 0)}`} unit="kgf" />}
            </div>
          </section>
        )}

        {isNum(r.fmsTotal) && (
          <section className="report-section">
            <h2>
              <PersonStanding size={18} color="#2f6b4c" /> Padrões de movimento (FMS)
              <span className="spacer" />
              <span className="tnum">{r.fmsTotal}/21</span>
            </h2>
            <div className="grid g2" style={{ gap: '6px 32px' }}>
              {FMS.map((t) => (
                <div key={t.key} className="live-row">
                  <span className="k">{t.label}</span>
                  <span className="v">{a.fms[t.key] ?? '—'}</span>
                </div>
              ))}
            </div>
            {r.fmsComplete && (
              <div style={{ marginTop: 12 }}>
                <Badge c={classifyFms(r.fmsTotal)} />
              </div>
            )}
          </section>
        )}

        {(hasPhotos || a.posture.findings.length > 0) && (
          <section className="report-section">
            <h2>
              <PersonStanding size={18} color="#2f6b4c" /> Avaliação postural
            </h2>
            {hasPhotos && (
              <div className="report-photos" style={{ marginBottom: 16 }}>
                {PHOTO_VIEWS.map((v) => (
                  <ReportPhoto key={v.key} label={v.label} k={a.posture.photos[v.key]} />
                ))}
              </div>
            )}
            {a.posture.findings.length > 0 ? (
              <div className="chips">
                {a.posture.findings.map((f) => (
                  <span key={f} className="chip on" style={{ cursor: 'default' }}>
                    {POSTURE_LABEL[f] ?? f}
                  </span>
                ))}
              </div>
            ) : (
              <p className="small muted">Nenhum desvio postural relevante observado.</p>
            )}
            {a.posture.notes && <p className="small" style={{ marginTop: 12 }}>{a.posture.notes}</p>}
          </section>
        )}

        {a.notes && (
          <section className="report-section">
            <h2>Conclusão e recomendações</h2>
            <p style={{ whiteSpace: 'pre-wrap' }}>{a.notes}</p>
          </section>
        )}

        <footer className="small" style={{ color: '#8a968f', paddingTop: 18, display: 'flex', justifyContent: 'space-between', gap: 12 }}>
          <span>ACOSTA Avalia · Método ACOSTA</span>
          <span>Valores estimados por equações de referência; servem para acompanhar a evolução individual.</span>
        </footer>
      </article>
    </div>
  )
}

function Line({ label, v, c }: { label: string; v: string; c?: ReturnType<typeof classifyBmi> | null }) {
  return (
    <tr>
      <td>{label}</td>
      <td className="num" style={{ fontWeight: 650 }}>
        {v}
      </td>
      <td className="num" style={{ width: 200 }}>
        <Badge c={c} />
      </td>
    </tr>
  )
}

function ReportPhoto({ label, k }: { label: string; k?: string }) {
  const url = usePhoto(k)
  return (
    <div>
      <div className="photo-slot">
        {url ? (
          <>
            <img src={url} alt={label} />
            <div className="grid-overlay" />
            <div className="plumb" />
          </>
        ) : (
          <span className="faint small">Sem foto</span>
        )}
      </div>
      <p className="small" style={{ textAlign: 'center', marginTop: 6, color: '#55625b' }}>
        {label}
      </p>
    </div>
  )
}
