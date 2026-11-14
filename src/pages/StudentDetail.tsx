import { useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, FileText, Pencil, Plus, Trash2 } from 'lucide-react'
import { newAssessment, useStore } from '../lib/store'
import { ageAt, computeResults, fmt, fmtDate, isNum } from '../lib/calc'
import { CIRCS } from '../lib/catalog'
import type { Assessment, Student } from '../lib/types'
import { StudentForm } from '../components/StudentForm'
import { LineChart } from '../components/LineChart'
import { Delta, Seg, initials } from '../components/ui'

type MetricKey = 'weight' | 'fat' | 'lean' | 'fatMass' | 'bmi' | 'cintura' | 'abdomen' | 'quadril' | 'vo2'

const METRICS: { v: MetricKey; label: string; unit: string }[] = [
  { v: 'weight', label: 'Peso', unit: ' kg' },
  { v: 'fat', label: '% Gordura', unit: '%' },
  { v: 'lean', label: 'Massa magra', unit: ' kg' },
  { v: 'fatMass', label: 'Massa gorda', unit: ' kg' },
  { v: 'bmi', label: 'IMC', unit: '' },
  { v: 'cintura', label: 'Cintura', unit: ' cm' },
  { v: 'abdomen', label: 'Abdômen', unit: ' cm' },
  { v: 'quadril', label: 'Quadril', unit: ' cm' },
  { v: 'vo2', label: 'VO₂máx', unit: '' },
]

function metricValue(k: MetricKey, a: Assessment, s: Student): number | undefined {
  const r = computeResults(a, s)
  switch (k) {
    case 'weight':
      return a.anthro.weight
    case 'fat':
      return r.comp?.fatPct
    case 'lean':
      return r.leanMass
    case 'fatMass':
      return r.fatMass
    case 'bmi':
      return r.bmi
    case 'vo2':
      return r.vo2
    default:
      return a.anthro.circ[k]
  }
}

export default function StudentDetail() {
  const { id } = useParams()
  const { students, assessments, upsertStudent, deleteStudent, upsertAssessment, deleteAssessment } = useStore()
  const nav = useNavigate()
  const [editing, setEditing] = useState(false)
  const [metric, setMetric] = useState<MetricKey>('weight')

  const s = students.find((x) => x.id === id)
  const mine = useMemo(() => assessments.filter((a) => a.studentId === id).sort((a, b) => a.date.localeCompare(b.date)), [assessments, id])

  if (!s) {
    return (
      <div className="page">
        <p className="muted">Aluno não encontrado.</p>
        <Link to="/alunos" className="btn">
          Voltar
        </Link>
      </div>
    )
  }

  const startAssessment = () => {
    const a = newAssessment(s.id, mine[mine.length - 1])
    upsertAssessment(a)
    nav(`/avaliacao/${a.id}`)
  }

  const points = mine
    .map((a) => ({ date: a.date, value: metricValue(metric, a, s) }))
    .filter((p): p is { date: string; value: number } => isNum(p.value))
  const unit = METRICS.find((m) => m.v === metric)!.unit

  const first = mine[0]
  const last = mine[mine.length - 1]

  return (
    <div className="page">
      <Link to="/alunos" className="btn ghost sm" style={{ alignSelf: 'flex-start' }}>
        <ArrowLeft size={16} /> Alunos
      </Link>

      <section className="card">
        <div className="row wrap" style={{ gap: 18 }}>
          <div className="avatar lg">{initials(s.name)}</div>
          <div className="stack" style={{ gap: 4, flex: 1, minWidth: 220 }}>
            <h1>{s.name}</h1>
            <p className="muted">
              {ageAt(s.birthDate)} anos · {s.sex === 'M' ? 'Masculino' : 'Feminino'} · nascido(a) em {fmtDate(s.birthDate)}
            </p>
            {s.goal && (
              <p className="small">
                <span className="eyebrow" style={{ marginRight: 6 }}>Objetivo</span>
                {s.goal}
              </p>
            )}
          </div>
          <div className="row wrap">
            <button className="btn" onClick={() => setEditing(true)}>
              <Pencil size={16} /> Editar
            </button>
            <button
              className="btn danger"
              onClick={async () => {
                if (confirm(`Excluir ${s.name} e todas as avaliações? Essa ação não pode ser desfeita.`)) {
                  await deleteStudent(s.id)
                  nav('/alunos')
                }
              }}
            >
              <Trash2 size={16} />
            </button>
            <button className="btn primary" onClick={startAssessment}>
              <Plus size={17} /> Nova avaliação
            </button>
          </div>
        </div>
      </section>

      {mine.length > 0 && (
        <section className="card">
          <div className="card-head wrap">
            <div>
              <h2>Evolução</h2>
              <p className="sub">Escolha o indicador para ver a evolução entre as avaliações</p>
            </div>
          </div>
          <div style={{ marginBottom: 12 }}>
            <Seg value={metric} onChange={setMetric} options={METRICS.map((m) => ({ v: m.v, label: m.label }))} />
          </div>
          <LineChart points={points} unit={unit} />
        </section>
      )}

      <section className="card">
        <div className="card-head">
          <div>
            <h2>Avaliações</h2>
            <p className="sub">{mine.length === 0 ? 'Nenhuma avaliação ainda' : `${mine.length} no total`}</p>
          </div>
        </div>
        {mine.length === 0 ? (
          <div className="empty">
            <p>Faça a primeira avaliação para começar a acompanhar a evolução.</p>
            <button className="btn primary" onClick={startAssessment}>
              <Plus size={17} /> Iniciar avaliação
            </button>
          </div>
        ) : (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Data</th>
                  <th className="num">Peso</th>
                  <th className="num">% Gordura</th>
                  <th className="num">Massa magra</th>
                  <th className="num">Cintura</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {[...mine].reverse().map((a) => {
                  const r = computeResults(a, s)
                  return (
                    <tr key={a.id} className="click" onClick={() => nav(`/avaliacao/${a.id}`)}>
                      <td style={{ fontWeight: 600 }}>{fmtDate(a.date)}</td>
                      <td className="num">{fmt(a.anthro.weight, 1, 'kg')}</td>
                      <td className="num">{r.comp ? fmt(r.comp.fatPct, 1, '%') : '—'}</td>
                      <td className="num">{fmt(r.leanMass, 1, 'kg')}</td>
                      <td className="num">{fmt(a.anthro.circ.cintura, 1, 'cm')}</td>
                      <td className="num" onClick={(e) => e.stopPropagation()}>
                        <div className="row" style={{ justifyContent: 'flex-end', gap: 4 }}>
                          <Link className="btn sm" to={`/relatorio/${a.id}`}>
                            <FileText size={15} /> Relatório
                          </Link>
                          <button
                            className="btn sm ghost danger"
                            aria-label="Excluir avaliação"
                            onClick={() => confirm(`Excluir a avaliação de ${fmtDate(a.date)}?`) && deleteAssessment(a.id)}
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {mine.length > 1 && (
        <section className="card">
          <div className="card-head">
            <div>
              <h2>Perímetros: primeira × última</h2>
              <p className="sub">
                {fmtDate(first.date)} → {fmtDate(last.date)}
              </p>
            </div>
          </div>
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Medida</th>
                  <th className="num">Primeira</th>
                  <th className="num">Última</th>
                  <th className="num">Diferença</th>
                </tr>
              </thead>
              <tbody>
                {CIRCS.filter((c) => isNum(first.anthro.circ[c.key]) || isNum(last.anthro.circ[c.key])).map((c) => (
                  <tr key={c.key}>
                    <td>{c.label}</td>
                    <td className="num">{fmt(first.anthro.circ[c.key], 1, 'cm')}</td>
                    <td className="num">{fmt(last.anthro.circ[c.key], 1, 'cm')}</td>
                    <td className="num">
                      <Delta now={last.anthro.circ[c.key]} before={first.anthro.circ[c.key]} unit="cm" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {editing && (
        <StudentForm
          initial={s}
          onClose={() => setEditing(false)}
          onSave={(x) => {
            upsertStudent(x)
            setEditing(false)
          }}
        />
      )}
    </div>
  )
}
