import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ChevronRight, Plus, Search, Users } from 'lucide-react'
import { useStore } from '../lib/store'
import { ageAt, fmtDate } from '../lib/calc'
import { StudentForm } from '../components/StudentForm'
import { initials } from '../components/ui'

export default function Students() {
  const { students, assessments, upsertStudent } = useStore()
  const [q, setQ] = useState('')
  const [creating, setCreating] = useState(false)
  const nav = useNavigate()

  const list = useMemo(() => {
    const norm = (t: string) => t.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase()
    const nq = norm(q)
    return students
      .filter((s) => norm(s.name).includes(nq))
      .sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'))
      .map((s) => {
        const mine = assessments.filter((a) => a.studentId === s.id).sort((a, b) => b.date.localeCompare(a.date))
        return { s, count: mine.length, last: mine[0]?.date }
      })
  }, [students, assessments, q])

  return (
    <div className="page">
      <div className="page-head">
        <div className="title">
          <span className="eyebrow">Gestão</span>
          <h1>Alunos</h1>
        </div>
        <button className="btn primary" onClick={() => setCreating(true)}>
          <Plus size={17} /> Novo aluno
        </button>
      </div>

      <div className="card">
        <div className="unit-wrap" style={{ marginBottom: 12 }}>
          <input className="input" placeholder="Buscar aluno pelo nome…" value={q} onChange={(e) => setQ(e.target.value)} style={{ paddingLeft: 40 }} />
          <Search size={17} className="faint" style={{ position: 'absolute', left: 13, top: 11.5 }} />
        </div>
        {list.length === 0 && (
          <div className="empty">
            <div className="ico">
              <Users size={26} />
            </div>
            <p>{students.length ? 'Nenhum aluno encontrado com esse nome.' : 'Nenhum aluno cadastrado ainda.'}</p>
          </div>
        )}
        {list.map(({ s, count, last }) => (
          <Link key={s.id} to={`/alunos/${s.id}`} className="student-row">
            <div className="avatar">{initials(s.name)}</div>
            <div className="meta">
              <div className="name">{s.name}</div>
              <div className="small muted">
                {ageAt(s.birthDate)} anos · {s.sex === 'M' ? 'Masculino' : 'Feminino'}
                {s.goal ? ` · ${s.goal}` : ''}
              </div>
            </div>
            <div className="small muted" style={{ textAlign: 'right' }}>
              <div>
                {count} {count === 1 ? 'avaliação' : 'avaliações'}
              </div>
              <div className="faint">{last ? `última em ${fmtDate(last)}` : 'sem avaliação'}</div>
            </div>
            <ChevronRight size={18} className="faint" />
          </Link>
        ))}
      </div>

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
