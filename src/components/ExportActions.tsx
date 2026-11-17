import { useEffect, useRef, useState, type ReactNode } from 'react'
import { Download, Loader2, Mail, MessageCircle, Printer, Share2 } from 'lucide-react'
import type { Assessment, Settings, Student } from '../lib/types'
import { buildPdf, canShareFile, download, mailtoUrl, shareFile, waPhone, whatsappUrl } from '../pdf/export'

type Busy = null | 'pdf' | 'share' | 'wa' | 'mail'

/** Barra de exportação: baixar PDF, compartilhar com anexo, WhatsApp, e-mail e impressão */
export function ExportActions({ a, st, history, settings }: { a: Assessment; st: Student; history: Assessment[]; settings: Settings }) {
  const [file, setFile] = useState<File | null>(null)
  const [preparing, setPreparing] = useState(true)
  const [busy, setBusy] = useState<Busy>(null)
  const [msg, setMsg] = useState<{ text: string; tone: 'ok' | 'err' } | null>(null)
  const canShare = canShareFile()
  const version = `${a.updatedAt}|${history.length}|${settings.evaluatorName}|${settings.cref}`
  const pending = useRef<Promise<File> | null>(null)

  // Gera o PDF em segundo plano assim que o relatório abre
  useEffect(() => {
    let alive = true
    setPreparing(true)
    setFile(null)
    const job = buildPdf({ a, st, history, settings })
    pending.current = job
    job
      .then((f) => alive && setFile(f))
      .catch(() => alive && setMsg({ text: 'Não foi possível gerar o PDF. Tente novamente.', tone: 'err' }))
      .finally(() => alive && setPreparing(false))
    return () => {
      alive = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [version])

  const getFile = async () => file ?? (await (pending.current ?? buildPdf({ a, st, history, settings })))
  const evaluator = settings.evaluatorName ? `${settings.evaluatorName}${settings.cref ? ` · CREF ${settings.cref}` : ''}` : undefined

  const run = async (kind: Exclude<Busy, null>, fn: () => Promise<void>) => {
    setBusy(kind)
    setMsg(null)
    try {
      await fn()
    } catch (e) {
      const name = (e as Error).name
      setMsg({
        text: name === 'NotAllowedError' ? 'O navegador bloqueou o compartilhamento. Toque em “Compartilhar” mais uma vez.' : 'Algo deu errado ao exportar. Tente novamente.',
        tone: 'err',
      })
    } finally {
      setBusy(null)
    }
  }

  const onDownload = () =>
    run('pdf', async () => {
      const f = await getFile()
      download(f)
      setMsg({ text: `PDF salvo na pasta Downloads: ${f.name}`, tone: 'ok' })
    })

  const onShare = () =>
    run('share', async () => {
      const f = await getFile()
      const res = await shareFile(f, st, a)
      if (res === 'shared') setMsg({ text: 'Relatório compartilhado.', tone: 'ok' })
    })

  const onWhats = () => {
    // abre a aba já no clique (evita bloqueio de pop-up) e só depois gera o arquivo
    const tab = window.open('about:blank', '_blank')
    run('wa', async () => {
      const f = await getFile()
      download(f)
      const url = whatsappUrl(st, a, evaluator)
      if (tab) tab.location.href = url
      else window.location.href = url
      setMsg({
        text: `PDF baixado (${f.name}). No WhatsApp, toque no clipe, escolha “Documento” e anexe o arquivo da pasta Downloads.${waPhone(st.phone) ? '' : ' Dica: cadastre o telefone do aluno para abrir a conversa direto.'}`,
        tone: 'ok',
      })
    })
  }

  const onMail = () =>
    run('mail', async () => {
      const f = await getFile()
      download(f)
      const link = document.createElement('a')
      link.href = mailtoUrl(st, a, evaluator)
      link.click()
      setMsg({
        text: `PDF baixado (${f.name}). No e-mail que abriu, clique em “Anexar” e escolha o arquivo da pasta Downloads.${st.email ? '' : ' Dica: cadastre o e-mail do aluno para já vir preenchido.'}`,
        tone: 'ok',
      })
    })

  const spin = (k: Busy, icon: ReactNode) => (busy === k ? <Loader2 size={17} className="spin" aria-hidden="true" /> : icon)
  const disabled = busy !== null

  return (
    <div className="export no-print">
      <div className="export-head">
        <div>
          <h2>Enviar relatório</h2>
          <p className="sub" role="status" aria-live="polite">
            {preparing ? 'Preparando o PDF…' : file ? `PDF pronto · ${(file.size / 1024).toFixed(0)} KB` : 'PDF indisponível'}
          </p>
        </div>
      </div>
      <div className="export-actions">
        <button className="btn primary" onClick={onDownload} disabled={disabled}>
          {spin('pdf', <Download size={17} aria-hidden="true" />)} Baixar PDF
        </button>
        {canShare && (
          <button className="btn" onClick={onShare} disabled={disabled}>
            {spin('share', <Share2 size={17} aria-hidden="true" />)} Compartilhar
          </button>
        )}
        <button className="btn whats" onClick={onWhats} disabled={disabled}>
          {spin('wa', <MessageCircle size={17} aria-hidden="true" />)} WhatsApp
        </button>
        <button className="btn" onClick={onMail} disabled={disabled}>
          {spin('mail', <Mail size={17} aria-hidden="true" />)} E-mail
        </button>
        <button className="btn ghost" onClick={() => window.print()} disabled={disabled}>
          <Printer size={17} aria-hidden="true" /> Imprimir
        </button>
      </div>
      {canShare && <p className="small muted">“Compartilhar” abre o menu do aparelho com o PDF já anexado: escolha WhatsApp, Gmail, Outlook…</p>}
      {msg && (
        <p className={`export-msg ${msg.tone}`} role={msg.tone === 'err' ? 'alert' : 'status'}>
          {msg.text}
        </p>
      )}
    </div>
  )
}
