import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { del, get, keys, set } from 'idb-keyval'
import type { Assessment, Settings, Student } from './types'

const K = { students: 'students', assessments: 'assessments', settings: 'settings' }
const PHOTO_PREFIX = 'photo:'

const DEFAULT_SETTINGS: Settings = { evaluatorName: '', cref: '', theme: 'system' }

interface Store {
  ready: boolean
  students: Student[]
  assessments: Assessment[]
  settings: Settings
  saving: boolean
  savedAt: Date | null
  upsertStudent: (s: Student) => void
  deleteStudent: (id: string) => Promise<void>
  upsertAssessment: (a: Assessment) => void
  deleteAssessment: (id: string) => Promise<void>
  saveSettings: (s: Settings) => void
  exportBackup: () => Promise<Blob>
  importBackup: (file: File) => Promise<void>
}

const Ctx = createContext<Store | null>(null)

export function StoreProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false)
  const [students, setStudents] = useState<Student[]>([])
  const [assessments, setAssessments] = useState<Assessment[]>([])
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS)
  const [saving, setSaving] = useState(false)
  const [savedAt, setSavedAt] = useState<Date | null>(null)

  useEffect(() => {
    Promise.all([get<Student[]>(K.students), get<Assessment[]>(K.assessments), get<Settings>(K.settings)]).then(([s, a, st]) => {
      setStudents(s ?? [])
      setAssessments(a ?? [])
      setSettings({ ...DEFAULT_SETTINGS, ...st })
      setReady(true)
    })
  }, [])

  // Persistência (com pequeno atraso para não gravar a cada tecla)
  const timer = useRef<number | undefined>(undefined)
  useEffect(() => {
    if (!ready) return
    window.clearTimeout(timer.current)
    timer.current = window.setTimeout(() => {
      setSaving(true)
      Promise.all([set(K.students, students), set(K.assessments, assessments)])
        .then(() => setSavedAt(new Date()))
        .finally(() => setSaving(false))
    }, 300)
  }, [students, assessments, ready])

  useEffect(() => {
    if (!ready) return
    set(K.settings, settings)
    const root = document.documentElement
    if (settings.theme === 'system') root.removeAttribute('data-theme')
    else root.setAttribute('data-theme', settings.theme)
  }, [settings, ready])

  const upsertStudent = useCallback((s: Student) => {
    setStudents((list) => (list.some((x) => x.id === s.id) ? list.map((x) => (x.id === s.id ? s : x)) : [...list, s]))
  }, [])

  const upsertAssessment = useCallback((a: Assessment) => {
    const next = { ...a, updatedAt: new Date().toISOString() }
    setAssessments((list) => (list.some((x) => x.id === a.id) ? list.map((x) => (x.id === a.id ? next : x)) : [...list, next]))
  }, [])

  const assessRef = useRef(assessments)
  useEffect(() => {
    assessRef.current = assessments
  }, [assessments])

  const deleteAssessment = useCallback(async (id: string) => {
    const removed = assessRef.current.find((x) => x.id === id)
    setAssessments((list) => list.filter((x) => x.id !== id))
    if (removed) await Promise.all(Object.values(removed.posture.photos).map((k) => k && del(k)))
  }, [])

  const deleteStudent = useCallback(
    async (id: string) => {
      const owned = assessRef.current.filter((a) => a.studentId === id)
      for (const a of owned) await deleteAssessment(a.id)
      setStudents((list) => list.filter((x) => x.id !== id))
    },
    [deleteAssessment],
  )

  const exportBackup = useCallback(async () => {
    const photoKeys = (await keys()).filter((k) => String(k).startsWith(PHOTO_PREFIX))
    const photos: Record<string, string> = {}
    for (const k of photoKeys) photos[String(k)] = (await get<string>(k)) ?? ''
    const data = { app: 'acosta-avalia', version: 1, exportedAt: new Date().toISOString(), students, assessments, settings, photos }
    return new Blob([JSON.stringify(data)], { type: 'application/json' })
  }, [students, assessments, settings])

  const importBackup = useCallback(async (file: File) => {
    const data = JSON.parse(await file.text())
    if (data?.app !== 'acosta-avalia') throw new Error('Este arquivo não é um backup do ACOSTA Avalia.')
    for (const [k, v] of Object.entries(data.photos ?? {})) await set(k, v)
    setStudents(data.students ?? [])
    setAssessments(data.assessments ?? [])
    if (data.settings) setSettings({ ...DEFAULT_SETTINGS, ...data.settings })
  }, [])

  const value = useMemo<Store>(
    () => ({
      ready,
      students,
      assessments,
      settings,
      saving,
      savedAt,
      upsertStudent,
      deleteStudent,
      upsertAssessment,
      deleteAssessment,
      saveSettings: setSettings,
      exportBackup,
      importBackup,
    }),
    [ready, students, assessments, settings, saving, savedAt, upsertStudent, deleteStudent, upsertAssessment, deleteAssessment, exportBackup, importBackup],
  )

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export function useStore() {
  const s = useContext(Ctx)
  if (!s) throw new Error('useStore fora do StoreProvider')
  return s
}

/* ───────── Fotos ───────── */

export async function savePhoto(dataUrl: string): Promise<string> {
  const key = PHOTO_PREFIX + crypto.randomUUID()
  await set(key, dataUrl)
  return key
}

export const deletePhoto = (key: string) => del(key)

export function usePhoto(key?: string) {
  const [url, setUrl] = useState<string | undefined>()
  useEffect(() => {
    let alive = true
    if (!key) {
      setUrl(undefined)
      return
    }
    get<string>(key).then((v) => alive && setUrl(v))
    return () => {
      alive = false
    }
  }, [key])
  return url
}

/** Reduz a foto para no máximo 1200px e comprime em JPEG */
export function compressImage(file: File, max = 1200): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => {
      const scale = Math.min(1, max / Math.max(img.width, img.height))
      const c = document.createElement('canvas')
      c.width = Math.round(img.width * scale)
      c.height = Math.round(img.height * scale)
      c.getContext('2d')!.drawImage(img, 0, 0, c.width, c.height)
      URL.revokeObjectURL(img.src)
      resolve(c.toDataURL('image/jpeg', 0.82))
    }
    img.onerror = reject
    img.src = URL.createObjectURL(file)
  })
}

/* ───────── Fábricas ───────── */

export const uid = () => crypto.randomUUID()
export const today = () => {
  const d = new Date()
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10)
}

export function newAssessment(studentId: string, prev?: Assessment): Assessment {
  const now = new Date().toISOString()
  return {
    id: uid(),
    studentId,
    date: today(),
    anamnese: prev ? { ...prev.anamnese, parq: [...prev.anamnese.parq] } : { parq: Array(7).fill(null) },
    vitals: {},
    anthro: { height: prev?.anthro.height, circ: {} },
    body: prev
      ? { method: prev.body.method, protocol: prev.body.protocol, equation: prev.body.equation, folds: {} }
      : { method: 'dobras', protocol: 'jp7', equation: 'siri', folds: {} },
    posture: { photos: {}, findings: [] },
    fitness: { vo2Test: prev?.fitness.vo2Test ?? 'none' },
    fms: {},
    createdAt: now,
    updatedAt: now,
  }
}
