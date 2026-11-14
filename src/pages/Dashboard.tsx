import { useMemo, useState, type ReactNode } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { CalendarClock, ChevronRight, ClipboardList, Plus, Sparkles, UserPlus, Users } from 'lucide-react'
import { useStore } from '../lib/store'
import { computeResults, daysSince, fmt, fmtDate } from '../lib/calc'
import { demoData } from '../lib/demo'
import { StudentForm } from '../components/StudentForm'
import { initials } from '../components/ui'

export default function Dashboard() {
  const { students, assessments, settings, upsertStudent, upsertAssessment } = useStore()
  const [creating, setCreating] = useState(false)
  const nav = useNavigate()

  const byId = useMemo(() => new Map(students.map((s) => [s.id, s])), [students])
  const sorted = useMemo(() => [...assessments].sort((a, b) => b.date.localeCompare(a.date)), [assessments])
  const month = new Date().toISOString().slice(0, 7)
  const thisMonth = assessments.filter((a) => a.date.startsWith(month)).length

  const due = useMemo(() => {
    return students
      .map((s) => {
        const last = sorted.find((a) => a.studentId === s.id)
        return { s, last, days: last ? daysSince(last.date) : Infinity }
      })
      .filter((x) => x.days >= 60)
      .sort((a, b) => b.days - a.days)
  }, [students, sorted])

  const hour = new Date().getHours()
  const greet = hour < 12 ? 'Bom dia' : hour < 18 ? 'Boa tarde' : 'Boa noite'
  const first = settings.evaluatorName.split(' ')[0]

  const loadDemo = () => {
    const d = demoData()
    upsertStudent(d.student)
    d.assessments.forEach(upsertAssessment)
    nav(`/alunos/${d.student.id}`)
  }

  return (
    <div className="page">
      <section className="card hero">
        <img className="hero-logo" src={`${import.meta.env.BASE_URL}logo.svg`} alt="" />
        <div className="stack" style={{ gap: 10, maxWidth: 560 }}>
          <span className="eyebrow">ACOSTA Avalia</span>
          <h1>
            {greet}
            {first ? `, ${first}` : ''}.
          </h1>
          <p className="muted">Avaliação física completa, do jeito simples: anamnese, medidas, composição corporal, postura e testes funcionais, com relatório pronto para o aluno.</p>
          <div className="gold-rule" style={{ margin: '6px 0' }} />
          <div className="row wrap">
            <button className="btn gold" onClick={() => setCreating(true)}>
              <UserPlus size={17} /> Novo aluno
            </button>
            <Link to="/alunos" className="btn" style={{ background: 'rgba(255,255,255,.1)', borderColor: 'rgba(255,255,255,.2)', color: '#fff' }}>
              <ClipboardList size={17} /> Nova avaliação
            </Link>
          </div>
        </div>
      </section>

      <section className="grid g4">
        <Stat icon={<Users size={18} />} label="Alunos" value={students.length} />
        <Stat icon={<ClipboardList size={18} />} label="Avaliações" value={assessments.length} />
        <Stat icon={<Sparkles size={18} />} label="Neste mês" value={thisMonth} />
        <Stat icon={<CalendarClock size={18} />} label="Reavaliações pendentes" value={due.length} />
      </section>

      {students.length === 0 ? (
        <section className="card">
          <div className="empty">
            <div className="ico">
              <Users size={26} />
            </div>
            <h2>Comece cadastrando seu primeiro aluno</h2>
            <p style={{ maxWidth: 440 }}>Se quiser ver como tudo funciona antes, carregue um aluno de exemplo com duas avaliações já preenchidas.</p>
            <div className="row wrap" style={{ justifyContent: 'center' }}>
              <button className="btn primary" onClick={() => setCreating(true)}>
                <Plus size={17} /> Cadastrar aluno
              </button>
              <button className="btn" onClick={loadDemo}>
                <Sparkles size={17} /> Ver exemplo
              </button>
            </div>
          </div>
        </section>
      ) : (
        <section className="grid g2">
          <div className="card">
            <div className="card-head">
              <div>
                <h2>Últimas avaliações</h2>
                <p className="sub">As mais recentes primeiro</p>
              </div>
            </div>
            {sorted.length === 0 && <p className="muted small">Nenhuma avaliação feita ainda.</p>}
            {sorted.slice(0, 6).map((a) => {
              const s = byId.get(a.studentId)
              if (!s) return null
              const r = computeResults(a, s)
              return (
                <Link key={a.id} to={`/avaliacao/${a.id}`} className="student-row">
                  <div className="avatar">{initials(s.name)}</div>
                  <div className="meta">
                    <div className="name">{s.name}</div>
                    <div className="small muted">
                      {fmtDate(a.date)} · {fmt(a.anthro.weight, 1, 'kg')} · {r.comp ? `${fmt(r.comp.fatPct, 1)}% gordura` : 'sem %G'}
                    </div>
                  </div>
                  <ChevronRight size={18} className="faint" />
                </Link>
              )
            })}
          </div>
          <div className="card">
            <div className="card-head">
              <div>
                <h2>Hora de reavaliar</h2>
                <p className="sub">Alunos sem avaliação há 60 dias ou mais</p>
              </div>
            </div>
            {due.length === 0 && <p className="muted small">Tudo em dia. Nenhum aluno com reavaliação atrasada.</p>}
            {due.slice(0, 6).map(({ s, last, days }) => (
              <Link key={s.id} to={`/alunos/${s.id}`} className="student-row">
                <div className="avatar">{initials(s.name)}</div>
                <div className="meta">
                  <div className="name">{s.name}</div>
                  <div className="small muted">{last ? `Última avaliação há ${days} dias` : 'Ainda não foi avaliado'}</div>
                </div>
                <span className={`badge ${last ? 't-warn' : 't-neutral'}`}>{last ? 'Reavaliar' : 'Avaliar'}</span>
              </Link>
            ))}
          </div>
        </section>
      )}

      {creating && (
        <StudentForm
          onClose={() => setCreating(false)}
          onSave={(s) => {
            upsertStudent(s)
            setCreating(false)
            nav(`/alunos/${s.id}`)
          }}
        />
      )}
    </div>
  )
}

function Stat({ icon, label, value }: { icon: ReactNode; label: string; value: number }) {
  return (
    <div className="metric">
      <span className="k" style={{ color: 'var(--accent)' }}>
        {icon}
        <span style={{ color: 'var(--muted)' }}>{label}</span>
      </span>
      <span className="v">{value}</span>
    </div>
  )
}
