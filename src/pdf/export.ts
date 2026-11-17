/* Exportação do relatório: gerar PDF, baixar, compartilhar e abrir WhatsApp / e-mail */
import { createElement } from 'react'
import { get } from 'idb-keyval'
import type { Assessment, Settings, Student } from '../lib/types'
import { fmtDate } from '../lib/calc'

export interface ExportInput {
  a: Assessment
  st: Student
  history: Assessment[]
  settings: Settings
}

/** Gera o PDF (a biblioteca é carregada só quando necessário) */
export async function buildPdf({ a, st, history, settings }: ExportInput): Promise<File> {
  const [{ pdf }, { AssessmentPdf }] = await Promise.all([import('@react-pdf/renderer'), import('./AssessmentPdf')])
  const photos: Record<string, string> = {}
  for (const [view, key] of Object.entries(a.posture.photos)) {
    if (key) {
      const url = await get<string>(key)
      if (url) photos[view] = url
    }
  }
  const sorted = [...history].sort((x, y) => x.date.localeCompare(y.date))
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const blob = await pdf(createElement(AssessmentPdf, { a, st, history: sorted, settings, photos }) as any).toBlob()
  return new File([blob], fileName(st, a), { type: 'application/pdf' })
}

export function fileName(st: Student, a: Assessment) {
  const name = st.name
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .replace(/[^A-Za-z0-9]+/g, '_')
    .replace(/^_|_$/g, '')
  return `Avaliacao_${name}_${fmtDate(a.date).replace(/\//g, '-')}.pdf`
}

export function download(file: File) {
  const url = URL.createObjectURL(file)
  const link = document.createElement('a')
  link.href = url
  link.download = file.name
  document.body.appendChild(link)
  link.click()
  link.remove()
  setTimeout(() => URL.revokeObjectURL(url), 10_000)
}

/** Menu de compartilhamento do sistema com o PDF anexado (celular, Windows 11, macOS) */
export function canShareFile(file?: File) {
  const probe = file ?? new File(['x'], 'teste.pdf', { type: 'application/pdf' })
  return typeof navigator !== 'undefined' && !!navigator.canShare && navigator.canShare({ files: [probe] })
}

export async function shareFile(file: File, st: Student, a: Assessment) {
  try {
    await navigator.share({ files: [file], title: file.name, text: message(st, a) })
    return 'shared'
  } catch (e) {
    if ((e as Error).name === 'AbortError') return 'cancelled'
    throw e
  }
}

export function message(st: Student, a: Assessment, evaluator?: string) {
  const first = st.name.trim().split(/\s+/)[0]
  return (
    `Olá, ${first}! Segue o relatório da sua avaliação física de ${fmtDate(a.date)}, com seus resultados e a comparação com a avaliação anterior. ` +
    `Qualquer dúvida, é só me chamar.` +
    (evaluator ? `\n\n${evaluator}` : '')
  )
}

/** Número no formato internacional para o WhatsApp (assume Brasil quando vier sem DDI) */
export function waPhone(phone?: string) {
  const d = (phone ?? '').replace(/\D/g, '')
  if (!d) return ''
  if (d.length === 10 || d.length === 11) return '55' + d
  return d
}

export function whatsappUrl(st: Student, a: Assessment, evaluator?: string) {
  const text = encodeURIComponent(message(st, a, evaluator))
  const phone = waPhone(st.phone)
  return phone ? `https://wa.me/${phone}?text=${text}` : `https://wa.me/?text=${text}`
}

export function mailtoUrl(st: Student, a: Assessment, evaluator?: string) {
  const subject = encodeURIComponent(`Relatório da sua avaliação física · ${fmtDate(a.date)}`)
  const body = encodeURIComponent(message(st, a, evaluator) + '\n\n(O relatório em PDF está anexado.)')
  return `mailto:${encodeURIComponent(st.email ?? '')}?subject=${subject}&body=${body}`
}
