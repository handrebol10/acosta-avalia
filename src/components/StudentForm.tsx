import { useState } from 'react'
import { Trash2 } from 'lucide-react'
import type { Student } from '../lib/types'
import { today, uid } from '../lib/store'
import { Field, Modal, Seg } from './ui'

export function StudentForm({
  initial,
  onSave,
  onClose,
  onDelete,
}: {
  initial?: Student
  onSave: (s: Student) => void
  onClose: () => void
  onDelete?: () => void
}) {
  const [s, setS] = useState<Student>(initial ?? { id: uid(), name: '', sex: 'F', birthDate: '', createdAt: new Date().toISOString() })
  const [touched, setTouched] = useState<Record<string, boolean>>({})
  const set = <K extends keyof Student>(k: K, v: Student[K]) => setS((p) => ({ ...p, [k]: v }))

  const errors = {
    name: s.name.trim().length < 2 ? 'Informe o nome do aluno.' : '',
    birthDate: !s.birthDate ? 'Informe a data de nascimento: ela é usada nas fórmulas.' : s.birthDate > today() ? 'A data de nascimento não pode estar no futuro.' : '',
  }
  const valid = !errors.name && !errors.birthDate
  const show = (k: keyof typeof errors) => (touched[k] ? errors[k] : '')
  const blur = (k: string) => () => setTouched((t) => ({ ...t, [k]: true }))

  return (
    <Modal title={initial ? 'Editar aluno' : 'Novo aluno'} onClose={onClose}>
      <form
        className="stack"
        noValidate
        onSubmit={(e) => {
          e.preventDefault()
          if (valid) onSave({ ...s, name: s.name.trim() })
          else {
            setTouched({ name: true, birthDate: true })
            // leva o foco ao primeiro campo com erro
            const first = (e.currentTarget.querySelector(errors.name ? '[name=name]' : '[name=birthDate]') as HTMLInputElement | null)
            first?.focus()
          }
        }}
      >
        <p className="small muted">
          Campos com <span className="req">*</span> são obrigatórios.
        </p>
        <Field label="Nome completo" required error={show('name')}>
          <input
            name="name"
            className={`input ${show('name') ? 'err' : ''}`}
            autoFocus
            autoComplete="off"
            value={s.name}
            onBlur={blur('name')}
            onChange={(e) => set('name', e.target.value)}
            placeholder="Ex.: Maria Souza"
            aria-required="true"
          />
        </Field>
        <div className="grid g2">
          <Field label="Sexo biológico" required hint="Usado nas fórmulas de composição corporal e nas tabelas de referência.">
            <Seg
              label="Sexo biológico"
              value={s.sex}
              onChange={(v) => set('sex', v)}
              options={[
                { v: 'F', label: 'Feminino' },
                { v: 'M', label: 'Masculino' },
              ]}
            />
          </Field>
          <Field label="Data de nascimento" required error={show('birthDate')}>
            <input
              name="birthDate"
              className={`input ${show('birthDate') ? 'err' : ''}`}
              type="date"
              max={today()}
              value={s.birthDate}
              onBlur={blur('birthDate')}
              onChange={(e) => set('birthDate', e.target.value)}
              aria-required="true"
            />
          </Field>
          <Field label="Telefone / WhatsApp">
            <input className="input" type="tel" inputMode="tel" autoComplete="off" value={s.phone ?? ''} onChange={(e) => set('phone', e.target.value)} placeholder="(00) 00000-0000" />
          </Field>
          <Field label="E-mail">
            <input className="input" type="email" inputMode="email" autoComplete="off" value={s.email ?? ''} onChange={(e) => set('email', e.target.value)} placeholder="nome@email.com" />
          </Field>
        </div>
        <Field label="Objetivo principal">
          <input className="input" value={s.goal ?? ''} onChange={(e) => set('goal', e.target.value)} placeholder="Ex.: hipertrofia, emagrecimento, saúde…" />
        </Field>
        <Field label="Observações">
          <textarea className="textarea" value={s.notes ?? ''} onChange={(e) => set('notes', e.target.value)} />
        </Field>
        <div className="row" style={{ justifyContent: 'flex-end' }}>
          <button type="button" className="btn ghost" onClick={onClose}>
            Cancelar
          </button>
          <button type="submit" className="btn primary">
            Salvar aluno
          </button>
        </div>
        {onDelete && (
          <div className="danger-zone">
            <span className="small muted">Excluir remove o aluno e todas as avaliações dele.</span>
            <button type="button" className="btn sm danger-solid" onClick={onDelete}>
              <Trash2 size={15} aria-hidden="true" /> Excluir aluno
            </button>
          </div>
        )}
      </form>
    </Modal>
  )
}
