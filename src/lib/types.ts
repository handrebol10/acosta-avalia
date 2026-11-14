export type Sex = 'M' | 'F'

export interface Student {
  id: string
  name: string
  sex: Sex
  birthDate: string // yyyy-mm-dd
  email?: string
  phone?: string
  goal?: string
  notes?: string
  createdAt: string
}

export type CircKey =
  | 'pescoco'
  | 'ombro'
  | 'torax'
  | 'cintura'
  | 'abdomen'
  | 'quadril'
  | 'bracoD'
  | 'bracoE'
  | 'bracoContD'
  | 'bracoContE'
  | 'antebracoD'
  | 'antebracoE'
  | 'coxaD'
  | 'coxaE'
  | 'panturrilhaD'
  | 'panturrilhaE'

export type FoldKey =
  | 'triceps'
  | 'biceps'
  | 'subescapular'
  | 'peitoral'
  | 'axilarMedia'
  | 'suprailiaca'
  | 'abdominal'
  | 'coxa'
  | 'panturrilha'

export type ProtocolKey = 'jp3' | 'jp7' | 'guedes' | 'durnin' | 'faulkner'
export type BodyMethod = 'dobras' | 'navy' | 'bio'
export type DensityEquation = 'siri' | 'brozek'
export type PhotoView = 'front' | 'side' | 'back'
export type Vo2Test = 'none' | 'cooper' | 'rockport' | 'step' | 'direct'
export type FmsKey = 'squat' | 'hurdle' | 'lunge' | 'shoulder' | 'aslr' | 'pushup' | 'rotary'
export type ActivityLevel = 'sedentario' | 'leve' | 'moderado' | 'intenso'

export interface Assessment {
  id: string
  studentId: string
  date: string // yyyy-mm-dd
  anamnese: {
    parq: (boolean | null)[]
    objective?: string
    activityLevel?: ActivityLevel
    injuries?: string
    medications?: string
    diseases?: string
    smoker?: boolean
    sleepHours?: number
  }
  vitals: {
    restingHr?: number
    systolic?: number
    diastolic?: number
  }
  anthro: {
    weight?: number
    height?: number
    circ: Partial<Record<CircKey, number>>
  }
  body: {
    method: BodyMethod
    protocol: ProtocolKey
    equation: DensityEquation
    folds: Partial<Record<FoldKey, number>>
    bioFat?: number
  }
  posture: {
    photos: Partial<Record<PhotoView, string>> // photo keys in IndexedDB
    findings: string[]
    notes?: string
  }
  fitness: {
    pushups?: number
    situps?: number
    sitReach?: number
    gripD?: number
    gripE?: number
    vo2Test: Vo2Test
    cooperDistance?: number
    rockportTime?: number
    rockportHr?: number
    stepHr?: number
    vo2Direct?: number
  }
  fms: Partial<Record<FmsKey, number>>
  notes?: string
  createdAt: string
  updatedAt: string
}

export interface Settings {
  evaluatorName: string
  cref: string
  theme: 'system' | 'light' | 'dark'
}

export type Tone = 'good' | 'ok' | 'warn' | 'bad' | 'neutral'

export interface Classification {
  label: string
  tone: Tone
}
