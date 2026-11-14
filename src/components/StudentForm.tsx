import { useState } from 'react'
import type { Student } from '../lib/types'
import { uid } from '../lib/store'
import { Field, Modal, Seg } from './ui'

export function StudentForm({ initial, onSave, onClose }: { initial?: Student; onSave: (s: Student) => void; onClose: () => void }) {
  const [s, setS] = useState<Student>(
    initial ?? { id: uid(), name: '', sex: 'F', birthDate: '', createdAt: new Date().toISOString() },
  )
  const set = <K extends keyof Student>(k: K, v: Student[K]) => setS((p) => ({ ...p, [k]: v }))
  const valid = s.name.trim().length > 1 && !!s.birthDate

  return (
    <Modal title={initial ? 'Editar aluno' : 'Novo aluno'} onClose={onClose}>
      <form
        className="stack"
        onSubmit={(e) => {
          e.preventDefault()
          if (valid) onSave({ ...s, name: s.name.trim() })
        }}
      >
        <Field label="Nome completo">
          <input className="input" autoFocus value={s.name} onChange={(e) => set('name', e.target.value)} placeholder="Ex.: Maria Souza" />
        </Field>
        <div className="grid g2">
          <Field label="Sexo biológico" hint="Usado nas fórmulas de composição corporal e nas tabelas de referência.">
            <Seg
              value={s.sex}
              onChange={(v) => set('sex', v)}
              options={[
                { v: 'F', label: 'Feminino' },
                { v: 'M', label: 'Masculino' },
              ]}
            />
          </Field>
          <Field label="Data de nascimento">
            <input className="input" type="date" value={s.birthDate} onChange={(e) => set('birthDate', e.target.value)} />
          </Field>
          <Field label="Telefone / WhatsApp">
            <input className="input" value={s.phone ?? ''} onChange={(e) => set('phone', e.target.value)} placeholder="(00) 00000-0000" />
          </Field>
          <Field label="E-mail">
            <input className="input" type="email" value={s.email ?? ''} onChange={(e) => set('email', e.target.value)} />
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
          <button type="submit" className="btn primary" disabled={!valid}>
            Salvar aluno
          </button>
        </div>
      </form>
    </Modal>
  )
}
