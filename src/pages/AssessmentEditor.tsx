import { useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, ArrowRight, Camera, Check, FileText, RefreshCw, ShieldAlert, Trash2 } from 'lucide-react'
import { compressImage, deletePhoto, savePhoto, usePhoto, useStore } from '../lib/store'
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
  type Results,
} from '../lib/calc'
import { ACTIVITY_LEVELS, CIRCS, FMS, FMS_SCORES, FOLDS, PARQ, PHOTO_VIEWS, POSTURE, PROTOCOLS } from '../lib/catalog'
import type { ActivityLevel, Assessment, PhotoView, ProtocolKey, Student, Vo2Test } from '../lib/types'
import { Badge, Explain, FatZones, Field, NumInput, Seg } from '../components/ui'

const STEPS = ['Anamnese', 'Medidas', 'Composição', 'Postural', 'Funcional', 'Conclusão']

export default function AssessmentEditor() {
  const { id } = useParams()
  const { assessments, students, upsertAssessment } = useStore()
  const [step, setStep] = useState(0)
  const nav = useNavigate()

  const a = assessments.find((x) => x.id === id)
  const s = students.find((x) => x.id === a?.studentId)
  const r = useMemo(() => (a && s ? computeResults(a, s) : null), [a, s])

  if (!a || !s || !r) {
    return (
      <div className="page">
        <p className="muted">Avaliação não encontrada.</p>
        <Link to="/alunos" className="btn">
          Voltar
        </Link>
      </div>
    )
  }

  const update = (fn: (d: Assessment) => void) => {
    const d = structuredClone(a)
    fn(d)
    upsertAssessment(d)
  }

  const done = [
    a.anamnese.parq.every((v) => v !== null),
    isNum(a.anthro.weight) && isNum(a.anthro.height),
    !!r.comp,
    a.posture.findings.length > 0 || Object.values(a.posture.photos).some(Boolean),
    Object.entries(a.fitness).some(([k, v]) => k !== 'vo2Test' && isNum(v)) || Object.values(a.fms).some(isNum),
    !!a.notes,
  ]

  const go = (n: number) => {
    setStep(n)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <div className="page">
      <div className="page-head">
        <div className="title">
          <Link to={`/alunos/${s.id}`} className="btn ghost sm" style={{ alignSelf: 'flex-start', marginLeft: -10 }}>
            <ArrowLeft size={16} /> {s.name}
          </Link>
          <span className="eyebrow">Avaliação física</span>
          <div className="row wrap" style={{ gap: 14 }}>
            <h1>{s.name.split(' ')[0]}</h1>
            <input className="input" type="date" style={{ width: 170 }} value={a.date} onChange={(e) => update((d) => void (d.date = e.target.value))} aria-label="Data da avaliação" />
          </div>
        </div>
        <div className="row">
          <span className="save-dot">Salvo automaticamente</span>
          <Link to={`/relatorio/${a.id}`} className="btn primary">
            <FileText size={17} /> Relatório
          </Link>
        </div>
      </div>

      <nav className="steps" aria-label="Etapas da avaliação">
        {STEPS.map((label, i) => (
          <button key={label} className={`step ${step === i ? 'on' : ''} ${done[i] ? 'done' : ''}`} onClick={() => go(i)}>
            <span className="n">{done[i] && step !== i ? <Check size={13} /> : i + 1}</span>
            {label}
          </button>
        ))}
      </nav>

      <div className="editor">
        <div className="stack">
          {step === 0 && <StepAnamnese a={a} update={update} />}
          {step === 1 && <StepMedidas a={a} update={update} />}
          {step === 2 && <StepComposicao a={a} s={s} r={r} update={update} />}
          {step === 3 && <StepPostural a={a} update={update} />}
          {step === 4 && <StepFuncional a={a} s={s} r={r} update={update} />}
          {step === 5 && <StepConclusao a={a} update={update} onReport={() => nav(`/relatorio/${a.id}`)} />}

          <div className="row">
            {step > 0 && (
              <button className="btn" onClick={() => go(step - 1)}>
                <ArrowLeft size={16} /> {STEPS[step - 1]}
              </button>
            )}
            <span className="spacer" />
            {step < STEPS.length - 1 && (
              <button className="btn primary" onClick={() => go(step + 1)}>
                {STEPS[step + 1]} <ArrowRight size={16} />
              </button>
            )}
          </div>
        </div>
        <LivePanel a={a} s={s} r={r} />
      </div>
    </div>
  )
}

type StepProps = { a: Assessment; update: (fn: (d: Assessment) => void) => void }

/* ───────── 1. Anamnese ───────── */
function StepAnamnese({ a, update }: StepProps) {
  const an = a.anamnese
  const alert = an.parq.some((v) => v === true)
  return (
    <>
      <section className="card">
        <div className="card-head">
          <div>
            <h2>PAR-Q · Prontidão para atividade física</h2>
            <p className="sub">Questionário de triagem recomendado antes de iniciar ou intensificar um programa de exercícios.</p>
          </div>
        </div>
        {PARQ.map((q, i) => (
          <div className="q" key={i}>
            <p>
              <span className="faint" style={{ marginRight: 8 }}>
                {i + 1}.
              </span>
              {q}
            </p>
            <Seg
              value={an.parq[i] === null ? '' : an.parq[i] ? 'sim' : 'nao'}
              onChange={(v) => update((d) => void (d.anamnese.parq[i] = v === 'sim'))}
              options={[
                { v: 'nao', label: 'Não' },
                { v: 'sim', label: 'Sim' },
              ]}
            />
          </div>
        ))}
        <div style={{ marginTop: 14 }}>
          {alert ? (
            <Explain tone="bad">
              <strong>Atenção:</strong> o aluno respondeu “sim” a pelo menos uma pergunta. Recomende avaliação médica antes de aumentar a intensidade dos treinos.
            </Explain>
          ) : (
            <Explain>Se todas as respostas forem “não”, o aluno está liberado para atividade física progressiva. Uma única resposta “sim” já indica encaminhamento médico.</Explain>
          )}
        </div>
      </section>

      <section className="card">
        <div className="card-head">
          <h2>Histórico e hábitos</h2>
        </div>
        <div className="grid g2">
          <Field label="Objetivo desta fase">
            <input className="input" value={an.objective ?? ''} onChange={(e) => update((d) => void (d.anamnese.objective = e.target.value))} />
          </Field>
          <Field label="Nível de atividade física" hint="Usado para estimar o gasto energético diário (taxa metabólica basal × fator de atividade).">
            <select className="select" value={an.activityLevel ?? ''} onChange={(e) => update((d) => void (d.anamnese.activityLevel = (e.target.value || undefined) as ActivityLevel | undefined))}>
              <option value="">Selecione…</option>
              {ACTIVITY_LEVELS.map((l) => (
                <option key={l.v} value={l.v}>
                  {l.label}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Lesões ou cirurgias">
            <textarea className="textarea" value={an.injuries ?? ''} onChange={(e) => update((d) => void (d.anamnese.injuries = e.target.value))} />
          </Field>
          <Field label="Doenças e condições de saúde">
            <textarea className="textarea" value={an.diseases ?? ''} onChange={(e) => update((d) => void (d.anamnese.diseases = e.target.value))} />
          </Field>
          <Field label="Medicamentos em uso">
            <input className="input" value={an.medications ?? ''} onChange={(e) => update((d) => void (d.anamnese.medications = e.target.value))} />
          </Field>
          <div className="grid g2">
            <Field label="Horas de sono">
              <NumInput unit="h" value={an.sleepHours} onChange={(v) => update((d) => void (d.anamnese.sleepHours = v))} />
            </Field>
            <Field label="Fumante?">
              <Seg
                value={an.smoker === undefined ? '' : an.smoker ? 's' : 'n'}
                onChange={(v) => update((d) => void (d.anamnese.smoker = v === 's'))}
                options={[
                  { v: 'n', label: 'Não' },
                  { v: 's', label: 'Sim' },
                ]}
              />
            </Field>
          </div>
        </div>
      </section>
    </>
  )
}

/* ───────── 2. Medidas ───────── */
function StepMedidas({ a, update }: StepProps) {
  return (
    <>
      <section className="card">
        <div className="card-head">
          <div>
            <h2>Sinais vitais</h2>
            <p className="sub">Meça em repouso, sentado, após 5 minutos de descanso.</p>
          </div>
        </div>
        <div className="grid g3">
          <Field label="FC de repouso" hint="Frequência cardíaca medida em repouso. Quanto mais condicionado o aluno, menor tende a ser.">
            <NumInput unit="bpm" value={a.vitals.restingHr} onChange={(v) => update((d) => void (d.vitals.restingHr = v))} />
          </Field>
          <Field label="Pressão sistólica" hint="O valor “de cima” (máxima).">
            <NumInput unit="mmHg" value={a.vitals.systolic} onChange={(v) => update((d) => void (d.vitals.systolic = v))} />
          </Field>
          <Field label="Pressão diastólica" hint="O valor “de baixo” (mínima).">
            <NumInput unit="mmHg" value={a.vitals.diastolic} onChange={(v) => update((d) => void (d.vitals.diastolic = v))} />
          </Field>
        </div>
      </section>

      <section className="card">
        <div className="card-head">
          <h2>Peso e estatura</h2>
        </div>
        <div className="grid g2">
          <Field label="Peso corporal" hint="Com roupas leves e sem calçados, de preferência em jejum e no mesmo horário das avaliações anteriores.">
            <NumInput unit="kg" value={a.anthro.weight} onChange={(v) => update((d) => void (d.anthro.weight = v))} />
          </Field>
          <Field label="Estatura" hint="Descalço, calcanhares juntos, olhando para a frente, ao final de uma inspiração.">
            <NumInput unit="cm" value={a.anthro.height} onChange={(v) => update((d) => void (d.anthro.height = v))} />
          </Field>
        </div>
      </section>

      {(['tronco', 'membros'] as const).map((g) => (
        <section className="card" key={g}>
          <div className="card-head">
            <div>
              <h2>Perímetros · {g === 'tronco' ? 'Tronco' : 'Membros'}</h2>
              <p className="sub">Fita métrica inelástica, sem comprimir a pele. Passe o mouse no ⓘ para ver onde medir.</p>
            </div>
          </div>
          <div className="grid g4">
            {CIRCS.filter((c) => c.group === g).map((c) => (
              <Field key={c.key} label={c.label} hint={c.hint}>
                <NumInput unit="cm" value={a.anthro.circ[c.key]} onChange={(v) => update((d) => void (d.anthro.circ[c.key] = v))} />
              </Field>
            ))}
          </div>
        </section>
      ))}
    </>
  )
}

/* ───────── 3. Composição corporal ───────── */
function StepComposicao({ a, s, r, update }: StepProps & { s: Student; r: Results }) {
  const b = a.body
  const proto = PROTOCOLS[b.protocol]
  const folds = proto.folds(s.sex)
  return (
    <>
      <section className="card">
        <div className="card-head">
          <div>
            <h2>Método de avaliação</h2>
            <p className="sub">Escolha como estimar o percentual de gordura.</p>
          </div>
        </div>
        <Seg
          value={b.method}
          onChange={(v) => update((d) => void (d.body.method = v))}
          options={[
            { v: 'dobras', label: 'Dobras cutâneas' },
            { v: 'navy', label: 'Circunferências' },
            { v: 'bio', label: 'Bioimpedância' },
          ]}
        />
      </section>

      {b.method === 'dobras' && (
        <section className="card">
          <div className="card-head">
            <h2>Protocolo</h2>
          </div>
          <div className="grid g2">
            <Field label="Protocolo de dobras">
              <select className="select" value={b.protocol} onChange={(e) => update((d) => void (d.body.protocol = e.target.value as ProtocolKey))}>
                {Object.entries(PROTOCOLS).map(([k, p]) => (
                  <option key={k} value={k}>
                    {p.label}
                  </option>
                ))}
              </select>
            </Field>
            {b.protocol !== 'faulkner' && (
              <Field label="Equação de % gordura" hint="Converte a densidade corporal em % de gordura. Siri é a mais usada; Brozek dá valores um pouco menores em pessoas com mais gordura.">
                <Seg
                  value={b.equation}
                  onChange={(v) => update((d) => void (d.body.equation = v))}
                  options={[
                    { v: 'siri', label: 'Siri' },
                    { v: 'brozek', label: 'Brozek' },
                  ]}
                />
              </Field>
            )}
          </div>
          <div style={{ margin: '16px 0' }}>
            <Explain>{proto.about}</Explain>
          </div>
          <div className="grid g4">
            {folds.map((k) => (
              <Field key={k} label={FOLDS[k].label} hint={FOLDS[k].hint}>
                <NumInput unit="mm" value={b.folds[k]} onChange={(v) => update((d) => void (d.body.folds[k] = v))} />
              </Field>
            ))}
          </div>
          <p className="small faint" style={{ marginTop: 14 }}>
            Dica: meça sempre do lado direito, faça 3 medidas em cada ponto e use a média (ou a mediana).
          </p>
        </section>
      )}

      {b.method === 'navy' && (
        <section className="card">
          <div className="card-head">
            <h2>Método da Marinha americana (US Navy)</h2>
          </div>
          <Explain>
            Estima o %G apenas com fita métrica. Usa {s.sex === 'M' ? 'pescoço e abdômen' : 'pescoço, cintura e quadril'} + estatura, preenchidos na etapa <strong>Medidas</strong>. Ótimo quando não há adipômetro disponível.
          </Explain>
          <div className="grid g3" style={{ marginTop: 16 }}>
            <Field label="Pescoço">
              <NumInput unit="cm" value={a.anthro.circ.pescoco} onChange={(v) => update((d) => void (d.anthro.circ.pescoco = v))} />
            </Field>
            {s.sex === 'M' ? (
              <Field label="Abdômen">
                <NumInput unit="cm" value={a.anthro.circ.abdomen} onChange={(v) => update((d) => void (d.anthro.circ.abdomen = v))} />
              </Field>
            ) : (
              <>
                <Field label="Cintura">
                  <NumInput unit="cm" value={a.anthro.circ.cintura} onChange={(v) => update((d) => void (d.anthro.circ.cintura = v))} />
                </Field>
                <Field label="Quadril">
                  <NumInput unit="cm" value={a.anthro.circ.quadril} onChange={(v) => update((d) => void (d.anthro.circ.quadril = v))} />
                </Field>
              </>
            )}
          </div>
        </section>
      )}

      {b.method === 'bio' && (
        <section className="card">
          <div className="card-head">
            <h2>Bioimpedância</h2>
          </div>
          <div className="grid g2">
            <Field label="% de gordura medido pelo aparelho">
              <NumInput unit="%" value={b.bioFat} onChange={(v) => update((d) => void (d.body.bioFat = v))} />
            </Field>
          </div>
          <div style={{ marginTop: 16 }}>
            <Explain>Para resultados confiáveis: jejum de 4 h, sem exercício nas últimas 12 h, bexiga vazia e sem álcool nas 24 h anteriores.</Explain>
          </div>
        </section>
      )}

      {r.comp && (
        <section className="card">
          <div className="card-head">
            <div>
              <h2>Resultado</h2>
              <p className="sub">{r.comp.methodLabel}</p>
            </div>
            <Badge c={classifyFat(r.comp.fatPct, s.sex)} />
          </div>
          <FatZones pct={r.comp.fatPct} sex={s.sex} />
          <div className="grid g3" style={{ marginTop: 22 }}>
            <Mini k="Massa gorda" v={fmt(r.fatMass, 1, 'kg')} />
            <Mini k="Massa magra" v={fmt(r.leanMass, 1, 'kg')} />
            <Mini k={`Peso com ${r.targetFat}% de gordura`} v={fmt(r.targetWeight, 1, 'kg')} />
          </div>
          {r.comp.sum !== undefined && (
            <p className="small faint" style={{ marginTop: 12 }}>
              Soma das dobras: {fmt(r.comp.sum, 1, 'mm')}
              {r.comp.density !== undefined && ` · Densidade corporal: ${fmt(r.comp.density, 4, 'g/ml')}`}
            </p>
          )}
        </section>
      )}
    </>
  )
}

function Mini({ k, v }: { k: string; v: string }) {
  return (
    <div className="metric">
      <span className="k">{k}</span>
      <span className="v" style={{ fontSize: '1.3rem' }}>
        {v}
      </span>
    </div>
  )
}

/* ───────── 4. Postural ───────── */
function StepPostural({ a, update }: StepProps) {
  const toggle = (id: string) =>
    update((d) => {
      const f = d.posture.findings
      d.posture.findings = f.includes(id) ? f.filter((x) => x !== id) : [...f, id]
    })
  return (
    <>
      <section className="card">
        <div className="card-head">
          <div>
            <h2>Fotos posturais</h2>
            <p className="sub">A grade e o fio de prumo ajudam a enxergar assimetrias e desalinhamentos.</p>
          </div>
        </div>
        <div className="grid g3">
          {PHOTO_VIEWS.map((v) => (
            <PhotoSlot
              key={v.key}
              label={v.label}
              photoKey={a.posture.photos[v.key]}
              onChange={(k) => update((d) => void (d.posture.photos[v.key as PhotoView] = k))}
            />
          ))}
        </div>
        <div style={{ marginTop: 16 }}>
          <Explain>
            Posicione o aluno em frente a uma parede lisa, com roupa justa, descalço e com os pés afastados na largura do quadril. Fotografe com o celular na altura do umbigo, a cerca de 3 metros.
          </Explain>
        </div>
      </section>

      {POSTURE.map((g) => (
        <section className="card" key={g.view}>
          <div className="card-head">
            <h2>Vista {PHOTO_VIEWS.find((v) => v.key === g.view)!.label.toLowerCase()}</h2>
          </div>
          <div className="chips">
            {g.items.map((i) => {
              const on = a.posture.findings.includes(i.id)
              return (
                <button key={i.id} className={`chip ${on ? 'on' : ''}`} onClick={() => toggle(i.id)} aria-pressed={on}>
                  {on && <Check size={14} />}
                  {i.label}
                </button>
              )
            })}
          </div>
        </section>
      ))}

      <section className="card">
        <Field label="Observações posturais">
          <textarea className="textarea" value={a.posture.notes ?? ''} onChange={(e) => update((d) => void (d.posture.notes = e.target.value))} />
        </Field>
      </section>
    </>
  )
}

function PhotoSlot({ label, photoKey, onChange }: { label: string; photoKey?: string; onChange: (k: string | undefined) => void }) {
  const url = usePhoto(photoKey)
  const [busy, setBusy] = useState(false)
  const pick = async (file?: File) => {
    if (!file) return
    setBusy(true)
    try {
      const data = await compressImage(file)
      const key = await savePhoto(data)
      if (photoKey) await deletePhoto(photoKey)
      onChange(key)
    } finally {
      setBusy(false)
    }
  }
  const inputId = `photo-${label}`
  return (
    <div className="stack" style={{ gap: 8 }}>
      <span className="small" style={{ fontWeight: 650 }}>
        {label}
      </span>
      <div className="photo-slot">
        {url ? (
          <>
            <img src={url} alt={`Foto ${label}`} />
            <div className="grid-overlay" />
            <div className="plumb" />
            <div className="actions">
              <label className="btn icon sm" htmlFor={inputId} title="Trocar foto">
                <RefreshCw size={15} />
              </label>
              <button
                className="btn icon sm"
                title="Remover foto"
                onClick={async () => {
                  if (photoKey) await deletePhoto(photoKey)
                  onChange(undefined)
                }}
              >
                <Trash2 size={15} />
              </button>
            </div>
          </>
        ) : (
          <label className="upload-label" htmlFor={inputId}>
            <Camera size={26} />
            {busy ? 'Processando…' : 'Clique para adicionar a foto'}
          </label>
        )}
        <input id={inputId} type="file" accept="image/*" hidden onChange={(e) => pick(e.target.files?.[0])} />
      </div>
    </div>
  )
}

/* ───────── 5. Funcional ───────── */
function StepFuncional({ a, s, r, update }: StepProps & { s: Student; r: Results }) {
  const f = a.fitness
  return (
    <>
      <section className="card">
        <div className="card-head">
          <div>
            <h2>Aptidão física</h2>
            <p className="sub">Força, resistência muscular e flexibilidade.</p>
          </div>
        </div>
        <div className="grid g3">
          <Field label="Flexão de braço" hint={s.sex === 'M' ? 'Máximo de repetições sem pausa, apoio nos pés, descendo até o cotovelo a 90°.' : 'Máximo de repetições sem pausa, com joelhos apoiados, descendo até o cotovelo a 90°.'}>
            <NumInput unit="rep" value={f.pushups} onChange={(v) => update((d) => void (d.fitness.pushups = v))} />
            {isNum(f.pushups) && <Badge c={classifyPushups(f.pushups, s.sex, r.age)} />}
          </Field>
          <Field label="Abdominal em 1 min" hint="Número de abdominais completos em 60 segundos, joelhos flexionados e pés apoiados.">
            <NumInput unit="rep" value={f.situps} onChange={(v) => update((d) => void (d.fitness.situps = v))} />
          </Field>
          <Field label="Sentar e alcançar (Wells)" hint="Melhor de 3 tentativas no banco de Wells, joelhos estendidos. Zero do banco em 26 cm (padrão CSEP).">
            <NumInput unit="cm" value={f.sitReach} onChange={(v) => update((d) => void (d.fitness.sitReach = v))} />
            {isNum(f.sitReach) && <Badge c={classifyReach(f.sitReach, s.sex, r.age)} />}
          </Field>
          <Field label="Preensão manual D" hint="Dinamômetro, melhor de 3 tentativas, cotovelo a 90°.">
            <NumInput unit="kgf" value={f.gripD} onChange={(v) => update((d) => void (d.fitness.gripD = v))} />
          </Field>
          <Field label="Preensão manual E" hint="Dinamômetro, melhor de 3 tentativas, cotovelo a 90°.">
            <NumInput unit="kgf" value={f.gripE} onChange={(v) => update((d) => void (d.fitness.gripE = v))} />
          </Field>
        </div>
      </section>

      <section className="card">
        <div className="card-head">
          <div>
            <h2>Capacidade cardiorrespiratória</h2>
            <p className="sub">Estimativa do VO₂máx por teste de campo.</p>
          </div>
          {isNum(r.vo2) && <Badge c={classifyVo2(r.vo2, s.sex, r.age)} />}
        </div>
        <Seg<Vo2Test>
          value={f.vo2Test}
          onChange={(v) => update((d) => void (d.fitness.vo2Test = v))}
          options={[
            { v: 'none', label: 'Não aplicado' },
            { v: 'cooper', label: 'Cooper 12 min' },
            { v: 'rockport', label: 'Caminhada Rockport' },
            { v: 'step', label: 'Banco (Queens)' },
            { v: 'direct', label: 'Ergoespirometria' },
          ]}
        />
        <div className="grid g3" style={{ marginTop: 16 }}>
          {f.vo2Test === 'cooper' && (
            <Field label="Distância percorrida" hint="Maior distância possível correndo/caminhando em 12 minutos.">
              <NumInput unit="m" value={f.cooperDistance} onChange={(v) => update((d) => void (d.fitness.cooperDistance = v))} />
            </Field>
          )}
          {f.vo2Test === 'rockport' && (
            <>
              <Field label="Tempo para 1.609 m" hint="Caminhar 1 milha o mais rápido possível. Use minutos decimais: 14 min 30 s = 14,5.">
                <NumInput unit="min" value={f.rockportTime} onChange={(v) => update((d) => void (d.fitness.rockportTime = v))} />
              </Field>
              <Field label="FC ao final" hint="Frequência cardíaca logo ao terminar a caminhada.">
                <NumInput unit="bpm" value={f.rockportHr} onChange={(v) => update((d) => void (d.fitness.rockportHr = v))} />
              </Field>
            </>
          )}
          {f.vo2Test === 'step' && (
            <Field label="FC de recuperação" hint="Subir e descer de um banco de 41 cm por 3 min (H: 24 ciclos/min, M: 22). Conte a FC de 5 a 20 s após parar e multiplique por 4.">
              <NumInput unit="bpm" value={f.stepHr} onChange={(v) => update((d) => void (d.fitness.stepHr = v))} />
            </Field>
          )}
          {f.vo2Test === 'direct' && (
            <Field label="VO₂máx medido">
              <NumInput unit="ml/kg/min" value={f.vo2Direct} onChange={(v) => update((d) => void (d.fitness.vo2Direct = v))} />
            </Field>
          )}
          {f.vo2Test !== 'none' && (
            <div className="metric">
              <span className="k">VO₂máx estimado</span>
              <span className="v">
                {fmt(r.vo2, 1)}
                <small>ml/kg/min</small>
              </span>
            </div>
          )}
        </div>
      </section>

      <section className="card">
        <div className="card-head">
          <div>
            <h2>FMS · Functional Movement Screen</h2>
            <p className="sub">7 padrões de movimento pontuados de 0 a 3. Nos testes bilaterais, registre a menor nota entre os lados.</p>
          </div>
          {isNum(r.fmsTotal) && (
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontWeight: 700, fontSize: '1.3rem' }} className="tnum">
                {r.fmsTotal}/21
              </div>
            </div>
          )}
        </div>
        {FMS.map((t) => (
          <div className="fms-item" key={t.key}>
            <div>
              <div style={{ fontWeight: 600 }}>
                {t.label} {t.bilateral && <span className="faint small">· bilateral</span>}
              </div>
              <p className="small muted">{t.hint}</p>
            </div>
            <div className="score-btns" role="radiogroup" aria-label={t.label}>
              {FMS_SCORES.map((sc) => (
                <button
                  key={sc.v}
                  title={`${sc.v} · ${sc.label}: ${sc.desc}`}
                  className={`${a.fms[t.key] === sc.v ? 'on' : ''} ${sc.v === 0 ? 'zero' : ''}`}
                  onClick={() => update((d) => void (d.fms[t.key] = d.fms[t.key] === sc.v ? undefined : sc.v))}
                  aria-pressed={a.fms[t.key] === sc.v}
                >
                  {sc.v}
                </button>
              ))}
            </div>
          </div>
        ))}
        <div style={{ marginTop: 14 }} className="stack">
          {isNum(r.fmsTotal) && r.fmsComplete && <Badge c={classifyFms(r.fmsTotal)} />}
          <Explain>
            <strong>0</strong> dor · <strong>1</strong> não executa o padrão · <strong>2</strong> executa com compensações · <strong>3</strong> executa perfeitamente. Total ≤ 14 está associado a maior risco de lesão; assimetrias entre os lados merecem atenção mesmo com nota alta.
          </Explain>
        </div>
      </section>
    </>
  )
}

/* ───────── 6. Conclusão ───────── */
function StepConclusao({ a, update, onReport }: StepProps & { onReport: () => void }) {
  return (
    <section className="card">
      <div className="card-head">
        <div>
          <h2>Conclusão e recomendações</h2>
          <p className="sub">Este texto aparece no relatório entregue ao aluno.</p>
        </div>
      </div>
      <textarea
        className="textarea"
        style={{ minHeight: 200 }}
        placeholder="Ex.: Boa evolução na composição corporal. Prioridades para o próximo ciclo: mobilidade de ombro, fortalecimento de core e manter o déficit calórico leve…"
        value={a.notes ?? ''}
        onChange={(e) => update((d) => void (d.notes = e.target.value))}
      />
      <div className="row" style={{ marginTop: 16, justifyContent: 'flex-end' }}>
        <button className="btn gold" onClick={onReport}>
          <FileText size={17} /> Gerar relatório · {fmtDate(a.date)}
        </button>
      </div>
    </section>
  )
}

/* ───────── Painel de resultados ao vivo ───────── */
function LivePanel({ a, s, r }: { a: Assessment; s: Student; r: Results }) {
  const rows: { k: string; v: string; c?: ReturnType<typeof classifyBmi> | null }[] = [
    { k: 'Idade', v: `${r.age} anos` },
    { k: 'IMC', v: fmt(r.bmi, 1, 'kg/m²'), c: isNum(r.bmi) ? classifyBmi(r.bmi) : null },
    { k: '% Gordura', v: r.comp ? fmt(r.comp.fatPct, 1, '%') : '—', c: r.comp ? classifyFat(r.comp.fatPct, s.sex) : null },
    { k: 'Massa magra', v: fmt(r.leanMass, 1, 'kg') },
    { k: 'Cintura', v: fmt(a.anthro.circ.cintura, 1, 'cm'), c: isNum(a.anthro.circ.cintura) ? classifyWaist(a.anthro.circ.cintura, s.sex) : null },
    { k: 'Cintura/quadril', v: fmt(r.whr, 2), c: isNum(r.whr) ? classifyWhr(r.whr, s.sex) : null },
    { k: 'Cintura/estatura', v: fmt(r.whtr, 2), c: isNum(r.whtr) ? classifyWhtr(r.whtr) : null },
    {
      k: 'Pressão arterial',
      v: isNum(a.vitals.systolic) && isNum(a.vitals.diastolic) ? `${a.vitals.systolic}/${a.vitals.diastolic}` : '—',
      c: isNum(a.vitals.systolic) && isNum(a.vitals.diastolic) ? classifyBp(a.vitals.systolic, a.vitals.diastolic) : null,
    },
    { k: 'FC repouso', v: fmt(a.vitals.restingHr, 0, 'bpm'), c: isNum(a.vitals.restingHr) ? classifyHr(a.vitals.restingHr) : null },
    { k: 'Metabolismo basal', v: fmt(r.bmrKatch ?? r.bmrMifflin, 0, 'kcal') },
    { k: 'Gasto diário estimado', v: fmt(r.tdee, 0, 'kcal') },
    { k: 'VO₂máx', v: fmt(r.vo2, 1), c: isNum(r.vo2) ? classifyVo2(r.vo2, s.sex, r.age) : null },
    { k: 'FMS', v: isNum(r.fmsTotal) ? `${r.fmsTotal}/21` : '—' },
  ]
  return (
    <aside className="card live">
      <div className="card-head" style={{ marginBottom: 4 }}>
        <div>
          <span className="eyebrow">Ao vivo</span>
          <h2>Resultados</h2>
        </div>
      </div>
      {r.parqAlert && (
        <div className="explain callout-bad" style={{ margin: '8px 0' }}>
          <ShieldAlert size={18} />
          <div>PAR-Q positivo: recomende liberação médica.</div>
        </div>
      )}
      {rows.map((row) => (
        <div className="live-row" key={row.k}>
          <span className="k">{row.k}</span>
          <span className="v">
            {row.v}
            {row.c && (
              <div>
                <Badge c={row.c} />
              </div>
            )}
          </span>
        </div>
      ))}
    </aside>
  )
}
