import { useRef, useState } from 'react'
import { Download, Upload } from 'lucide-react'
import { useStore, today } from '../lib/store'
import { Explain, Field, Seg } from '../components/ui'

export default function SettingsPage() {
  const { settings, saveSettings, exportBackup, importBackup, students, assessments } = useStore()
  const fileRef = useRef<HTMLInputElement>(null)
  const [msg, setMsg] = useState<string>()

  const doExport = async () => {
    const blob = await exportBackup()
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `acosta-avalia-backup-${today()}.json`
    link.click()
    URL.revokeObjectURL(url)
    setMsg('Backup salvo na sua pasta de Downloads.')
  }

  const doImport = async (file?: File) => {
    if (!file) return
    if (!confirm('Importar este backup vai substituir os alunos e avaliações atuais. Continuar?')) return
    try {
      await importBackup(file)
      setMsg('Backup restaurado com sucesso.')
    } catch (e) {
      setMsg((e as Error).message)
    }
  }

  return (
    <div className="page">
      <div className="page-head">
        <div className="title">
          <span className="eyebrow">Configurações</span>
          <h1>Ajustes</h1>
        </div>
      </div>

      <section className="card">
        <div className="card-head">
          <div>
            <h2>Avaliador</h2>
            <p className="sub">Aparece no cabeçalho dos relatórios.</p>
          </div>
        </div>
        <div className="grid g2">
          <Field label="Seu nome">
            <input className="input" value={settings.evaluatorName} onChange={(e) => saveSettings({ ...settings, evaluatorName: e.target.value })} placeholder="Ex.: André Luiz Costa" />
          </Field>
          <Field label="CREF">
            <input className="input" value={settings.cref} onChange={(e) => saveSettings({ ...settings, cref: e.target.value })} placeholder="000000-G/PR" />
          </Field>
        </div>
      </section>

      <section className="card">
        <div className="card-head">
          <h2>Aparência</h2>
        </div>
        <Seg
          value={settings.theme}
          onChange={(v) => saveSettings({ ...settings, theme: v })}
          options={[
            { v: 'system', label: 'Automático' },
            { v: 'light', label: 'Claro' },
            { v: 'dark', label: 'Escuro' },
          ]}
        />
      </section>

      <section className="card">
        <div className="card-head">
          <div>
            <h2>Backup dos dados</h2>
            <p className="sub">
              {students.length} alunos · {assessments.length} avaliações
            </p>
          </div>
        </div>
        <Explain>
          Tudo fica salvo apenas neste navegador e neste computador, sem internet. Faça um backup com frequência (por exemplo, uma vez por semana) e guarde o arquivo no Google Drive ou num pendrive. Use o mesmo arquivo para levar seus dados para outro computador.
        </Explain>
        <div className="row wrap" style={{ marginTop: 16 }}>
          <button className="btn primary" onClick={doExport}>
            <Download size={17} /> Exportar backup
          </button>
          <button className="btn" onClick={() => fileRef.current?.click()}>
            <Upload size={17} /> Restaurar backup
          </button>
          <input ref={fileRef} type="file" accept="application/json,.json" hidden onChange={(e) => doImport(e.target.files?.[0])} />
        </div>
        {msg && (
          <p className="small" style={{ marginTop: 12, color: 'var(--accent)', fontWeight: 600 }}>
            {msg}
          </p>
        )}
      </section>
    </div>
  )
}
